import type { UserConfig } from '@unocss/core'
import remToPxPreset from '@unocss/preset-rem-to-px'
import { presetQuickapp, transformerDirectives } from '../preset/index'

export const defaultOutput = 'src/css/uno.css'
export const defaultInclude = [/\.(ux|[jt]sx|html)($|\?)/]
export const defaultRules: Record<string, string> = {
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

export interface UnocssQuickappOptions<Theme extends {} = {}> extends UserConfig<Theme> {
  /** 配置自动转义class的规则 */
  transformRules: Record<string, string>
  /** 配置unocss输出路径 */
  unoCssOutput: string
}

export function resolveConfig<Theme extends {}>(config: Partial<UnocssQuickappOptions<Theme>> = {}) {
  const defaultConfig: UnocssQuickappOptions<Theme> = {
    include: defaultInclude,
    unoCssOutput: defaultOutput,
    transformRules: defaultRules,
    transformers: [transformerDirectives(
      {
        enforce: 'pre',
      },
    )],
    presets: [remToPxPreset() as any, presetQuickapp(
      {
        transformRules: defaultRules,
      },
    )],
  }
  config = {
    ...defaultConfig,
    ...config,
  }
  return config as UnocssQuickappOptions<Theme>
}

