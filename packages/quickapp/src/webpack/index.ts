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
import { defaultRules, resolveConfig } from './confg'

const PLUGIN_NAME = 'unocss:quickapp'
export const LAYER_PLACEHOLDER_RE = /(\")#--unocss--\":\s*{\s*\"layer\":\s*\"(.+?)?\"\s*}/g
export const defaultInclude = [/\.(ux|[jt]sx|html)($|\?)/]

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

/**
 * @desc 去左右空格
 * @param value - 需要处理的字符串
 */
export function trim(value: string) {
  return value.replace(/(^\s*)|(\s*$)/g, '')
}

/**
 * 获取class
 */
export function getClass(code: string) {
  const matchs: string[][] = []
  // ux
  Array.from(code.matchAll(/\"classList\"\s*:\s*\[((?:\n|.)*?)\]/g)).forEach((m) => {
    const classStr = m[1]
    const sourceStr = trim(m[0])

    const classArr = [sourceStr]
    classArr.push(classStr)
    matchs.push(classArr)
  })
  return matchs
}

function escapeRegExp(str = '') {
  return str.replace(/[/.*+?^${}()|[\]\\]/g, '\\$&')
}

function createTransformRegExp(rules: Record<string, string>) {
  return new RegExp(`[${escapeRegExp(Object.keys(rules).join(''))}]`)
}

export function transformCode(code: string, rules = defaultRules) {
  const classNames = getClass(code)

  classNames.forEach((c) => {
    let currentClass = c[0]
    c.slice(1).forEach((selector) => {
      currentClass = currentClass.replace(selector, transformEscapESelector(selector, rules))
    })
    code = code.replace(c[0], currentClass)
  })

  return code
}

export function transformEscapESelector(selector = '', rules = defaultRules): string {
  const transformRegExp = createTransformRegExp(rules)
  if (transformRegExp.test(selector)) {
    for (const transformRule in rules) {
      const replaceReg = new RegExp(escapeRegExp(`${transformRule}`), 'g')
      selector = selector.replace(replaceReg, rules[transformRule])
    }
  }
  return selector
}

