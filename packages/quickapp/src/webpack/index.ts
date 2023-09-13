import path from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import type { ResolvedUnpluginOptions, UnpluginOptions } from 'unplugin'

import { createUnplugin } from 'unplugin'
import WebpackSources from 'webpack-sources'
import toolkitStyle from '@aiot-toolkit/compiler/lib/style'

import { createContext } from '../../../shared-integration/src/context'
import { getPath, isCssId } from '../../../shared-integration/src/utils'
import { applyTransformers } from '../../../shared-integration/src/transformers'
import { HASH_PLACEHOLDER_RE, LAYER_MARK_ALL, RESOLVED_ID_RE, getHashPlaceholder, getLayerPlaceholder, resolveId, resolveLayer } from '../../../shared-integration/src/layers'
import type { UnocssQuickappOptions } from './confg'
import { resolveConfig } from './confg'
import { transformCode } from './transform'

export * from './confg'

const PLUGIN_NAME = 'unocss:quickapp'
export const LAYER_PLACEHOLDER_RE = /(\")#--unocss--\":\s*{\s*\"layer\":\s*\"(.+?)?\"\s*}/g
export const VELA_PLACEHOLDER_RE = /\[\s*\[\s*\[\s*(\d+)\s*,\s*"(?:[^"\\]|\\.)+"\s*\]\s*\]\s*,\s*\{\s*"layer"\s*:\s*"(__ALL__)"\s*\}\s*\]/g

export function defineConfig<Theme extends {}>(config: UnocssQuickappOptions<Theme>) {
  return config
}

export function UnoCssQuickapp<Theme extends {}>(
  _config: Partial<UnocssQuickappOptions<Theme>> = {},
) {
  return createUnplugin(() => {
    /** 初始化配置,默认内置所需的presets */
    const config = resolveConfig(_config)
    const ctx = createContext<UnocssQuickappOptions<Theme>>({
      ...config,
    })

    const { uno, tokens, filter, extract/** , onInvalidate */ } = ctx
    const nonPreTransformers = ctx.uno.config.transformers?.filter(i => i.enforce !== 'pre')
    if (nonPreTransformers?.length) {
      console.warn(
        // eslint-disable-next-line prefer-template
        '[unocss] webpack integration only supports "pre" enforce transformers currently.'
        + 'the following transformers will be ignored\n'
        + nonPreTransformers.map(i => ` - ${i.name}`).join('\n'),
      )
    }

    const tasks: Promise<any>[] = []
    const entries = new Set<string>()
    const hashes = new Map<string, string>()

    const plugin = <UnpluginOptions>{
      name: PLUGIN_NAME,
      enforce: 'pre',
      transformInclude(id) {
        return filter('', id) && !id.match(/\.html$/) && !RESOLVED_ID_RE.test(id)
      },
      async transform(code, id) {
        const result = await applyTransformers(ctx as any, code, id, 'pre')
        if (isCssId(id))
          return result
        if (result == null)
          tasks.push(extract(code, id))
        else
          tasks.push(extract(result.code, id))
        return result
      },
      buildStart() {
        /** 开始时创建uno.css文件 */
        const layer = getLayerPlaceholder(LAYER_MARK_ALL)
        if (!existsSync(config.unoCssOutput)) {
          mkdirSync(path.dirname(config?.unoCssOutput), { recursive: true })
          writeFileSync(config?.unoCssOutput, layer)
        }
        else {
          let currentUnoCss = readFileSync(config?.unoCssOutput).toString()
          if (!currentUnoCss.includes(layer)) {
            currentUnoCss = `${layer}\n${currentUnoCss}`
            writeFileSync(config?.unoCssOutput, currentUnoCss)
          }
        }
      },
      resolveId(id) {
        const entry = resolveId(id)
        if (entry === id)
          return
        if (entry) {
          let query = ''
          const queryIndex = id.indexOf('?')
          if (queryIndex >= 0)
            query = id.slice(queryIndex)
          entries.add(entry)
          // preserve the input query
          return entry + query
        }
      },
      loadInclude(id) {
        const layer = getLayer(id)
        return !!layer
      },
      // serve the placeholders in virtual module
      load(id) {
        const layer = getLayer(id)
        const hash = hashes.get(id)
        if (layer)
          return (hash ? getHashPlaceholder(hash) : '') + getLayerPlaceholder(layer)
      },
      webpack(compiler) {
        // replace the placeholders
        compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
          compilation.hooks.optimizeAssets.tapPromise(PLUGIN_NAME, async () => {
            const files = Object.keys(compilation.assets)

            await Promise.all(tasks)
            const result = await uno.generate(tokens, { minify: true })

            for (const file of files) {
              // https://github.com/unocss/unocss/pull/1428
              if (file === '*')
                return

              let code = compilation.assets[file].source().toString()
              let replaced = false
              code = code.replace(HASH_PLACEHOLDER_RE, '')
              // quickapp
              code = code.replace(LAYER_PLACEHOLDER_RE, (_, quote, layer) => {
                replaced = true
                const css = layer === LAYER_MARK_ALL
                  ? result.getLayers(undefined, Array.from(entries)
                    .map(i => resolveLayer(i)).filter((i): i is string => !!i))
                  : result.getLayer(layer) || ''
                const filePath = path.resolve(ctx.root, 'build', file)
                const res = toolkitStyle.parse({ code: css, filePath })
                return JSON.stringify(res.jsonStyle).slice(1, -1)
              })
              // vela
              code = code.replace(LAYER_PLACEHOLDER_RE, (_, quote, layer) => {
                replaced = true
                const css = layer === LAYER_MARK_ALL
                  ? result.getLayers(undefined, Array.from(entries)
                    .map(i => resolveLayer(i)).filter((i): i is string => !!i))
                  : result.getLayer(layer) || ''
                const filePath = path.resolve(ctx.root, 'build', file)
                const res = toolkitStyle.parse({ code: css, filePath })
                const str = Object.keys(res.jsonStyle).map((classNameKey) => {
                  return `[
                   [
                     [
                       0,
                       "${classNameKey.slice(1)}"
                     ]
                   ],
                  ${JSON.stringify(res.jsonStyle[classNameKey])}
                 ]`
                })
                return `${str}`
              })

              /** 转化代码中不支持的转义class */
              code = transformCode(code, config.transformRules)
              if (replaced)
                compilation.assets[file] = new WebpackSources.RawSource(code) as any
            }
          })
        })
      },
    } as Required<ResolvedUnpluginOptions>

    return plugin
  }).webpack()
}

function getLayer(id: string) {
  let layer = resolveLayer(getPath(id))
  if (!layer) {
    const entry = resolveId(id)
    if (entry)
      layer = resolveLayer(entry)
  }
  return layer
}

