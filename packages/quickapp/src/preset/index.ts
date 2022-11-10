import type { Postprocessor, Preset, PresetOptions } from '@unocss/core'
// import { preflights } from './preflights'
import { defaultRules, transformEscapESelector } from 'unplugin-transform-class/utils'
import { rules } from './rules'
import type { Theme, ThemeAnimation } from './theme'
import { theme } from './theme'
import { variants } from './variants'
export { preflights } from './preflights'
export { theme, colors } from './theme'
export { parseColor } from './utils'
export { transformerQuickappAttributify, transformerClass, transformerDirectives } from './transformer'

export type { ThemeAnimation, Theme }

export interface DarkModeSelectors {
  /**
   * Selector for light variant.
   *
   * @default '.light'
   */
  light?: string

  /**
   * Selector for dark variant.
   *
   * @default '.dark'
   */
  dark?: string
}

export interface PresetQuickappOptions extends PresetOptions {
  /**
   * Dark mode options
   *
   * @default 'class'
   */
  dark?: 'class' | 'media' | DarkModeSelectors
  /**
   * Generate pesudo selector as `[group=""]` instead of `.group`
   *
   * @default false
   */
  attributifyPseudo?: Boolean
  /**
   * Prefix for CSS variables.
   *
   * @default 'un-'
   */
  variablePrefix?: string
  /**
   * Utils prefix
   *
   * @default undefined
   */
  prefix?: string
  /**
   * Generate preflight
   *
   * @default true
   */
  preflight?: boolean

  /**
   * 是否转换class
   *
   * @default true
   */
  transform?: boolean

  /**
   * 自定义转换规则
   * @default https://github.com/MellowCo/unplugin-transform-class#options
   */
  transformRules?: Record<string, string>
}

export const presetQuickapp = (options: PresetQuickappOptions = {}): Preset<Theme> => {
  options.dark = options.dark ?? 'class'
  options.attributifyPseudo = options.attributifyPseudo ?? false
  options.preflight = options.preflight ?? true

  options.transform = options.transform ?? true
  options.transformRules = options.transformRules ?? defaultRules

  return {
    name: '@unocss/preset-quickapp',
    theme: {
      ...theme,
      transformRules: options.transformRules,
    },
    rules,
    variants: variants(options),
    options,
    postprocess(css) {
      if (options.transform)
        css.selector = transformEscapESelector(css.selector, options.transformRules)
      if (options.variablePrefix && options.variablePrefix !== 'un-')
        VarPrefixPostprocessor(options.variablePrefix)
    },
    // preflights: options.preflight ? preflights : [],
    prefix: options.prefix,
  }
}

export default presetQuickapp

function VarPrefixPostprocessor(prefix: string): Postprocessor {
  return (obj) => {
    obj.entries.forEach((i) => {
      i[0] = i[0].replace(/^--un-/, `--${prefix}`)
      if (typeof i[1] === 'string')
        i[1] = i[1].replace(/var\(--un-/g, `var(--${prefix}`)
    })
  }
}
