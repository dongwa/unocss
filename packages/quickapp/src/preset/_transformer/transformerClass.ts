import type { SourceCodeTransformer } from '@unocss/core'
import { transformCode } from 'unplugin-transform-class/utils'
import type { FilterPattern } from '@rollup/pluginutils'
import { createFilter } from '@rollup/pluginutils'

interface Options {
  /**
   * 自定义转换规则
   * @default
   * {
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
   */
  transformRules?: Record<string, string>
  /**
   * 排除转换目标
   * @default [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/]
   */
  exclude?: FilterPattern
  /**
   * 需要转换的目标
   * @default [/\.[jt]sx?$/, /\.vue$/,  /\.vue\?vue/]
   */
  include?: FilterPattern
}

export function transformerClass(options: Options = {}): SourceCodeTransformer {
  const idFilter = createFilter(
    options.include || [/\.[jt]sx?$/, /\.ux$/, /\.ux\?ux/],
    options.exclude || [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/],
  )

  return {
    name: 'transformer-applet-class',
    idFilter,
    enforce: 'post',
    transform(code) {
      const newCode = transformCode(code.toString(), options.transformRules)
      code.overwrite(0, code.original.length, newCode)
    },
  }
}
