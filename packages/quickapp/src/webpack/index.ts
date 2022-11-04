import path from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import type { UserConfig, UserConfigDefaults } from '@unocss/core'
import type { ResolvedUnpluginOptions, UnpluginOptions } from 'unplugin'

import { createUnplugin } from 'unplugin'
import WebpackSources from 'webpack-sources'
import toolkitStyle from '@aiot-toolkit/compiler/lib/style'
import remToPxPreset from '@unocss/preset-rem-to-px'
import { presetQuickapp } from '../preset/index'
import { createContext } from '../../../shared-integration/src/context'
import { getPath, isCssId } from '../../../shared-integration/src/utils'
import { applyTransformers } from '../../../shared-integration/src/transformers'
import { HASH_PLACEHOLDER_RE, LAYER_MARK_ALL, RESOLVED_ID_RE, getHashPlaceholder, getLayerPlaceholder, resolveId, resolveLayer } from '../../../shared-integration/src/layers'

export interface WebpackPluginOptions<Theme extends {} = {}> extends UserConfig<Theme> {
  /** 配置自动转义class的规则 */
  transformRules?: Record<string, string>
  /** 配置unocss输出路径 */
  unoCssOutput?: string
}

const PLUGIN_NAME = 'unocss:quickapp'
export const LAYER_PLACEHOLDER_RE = /(\")#--unocss--\":\s*{\s*\"layer\":\s*\"(.+?)?\"\s*}/g
export const defaultInclude = [/\.(ux|[jt]sx|html)($|\?)/]
let OUTPUTCSS = 'src/css/uno.css'
let defaultRules: Record<string, string> = {
  '.': '-d-',
  '/': '-s-',
  ':': '-c-',
  '%': '-p-',
  '!': '-e-',
  '#': '-w-',
  '(': '-bl-',
  ')': '-br-',
  '[': '-fl-',
  ']': '-fr-',
  '$': '-r-',
}

export function defineConfig<Theme extends {}>(config: WebpackPluginOptions<Theme>) {
  return config
}

export function UnoQuickappWebpackPlugin<Theme extends {}>(
  config?: WebpackPluginOptions<Theme>,
) {
  return createUnplugin(() => {
    /** 初始化配置,默认内置所需的presets */
    OUTPUTCSS = config?.unoCssOutput || OUTPUTCSS
    defaultRules = config?.transformRules || defaultRules

    const defaultConfig: UserConfigDefaults & { include?: string } = {
      presets: [remToPxPreset(), presetQuickapp(
        {
          transformRules: defaultRules,
        },
      )],
    }

    const ctx = createContext<WebpackPluginOptions>({
      include: defaultInclude,
      ...config as any,
    }, defaultConfig)
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
        const result = await applyTransformers(ctx, code, id, 'pre')
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
        if (!existsSync(OUTPUTCSS)) { writeFileSync(OUTPUTCSS, layer) }
        else {
          let currentUnoCss = readFileSync(OUTPUTCSS).toString()
          if (!currentUnoCss.includes(layer)) {
            currentUnoCss = `${layer}\n${currentUnoCss}`
            writeFileSync(OUTPUTCSS, currentUnoCss)
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
                // eslint-disable-next-line no-console
                console.log('css', css)
                const res = toolkitStyle.parse({ code: css, filePath })
                // eslint-disable-next-line no-console
                console.log('result', res.jsonStyle)
                return JSON.stringify(res.jsonStyle).slice(1, -1)
              })
              /** 转化代码中不支持的转义class */
              code = transformCode(code)
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

