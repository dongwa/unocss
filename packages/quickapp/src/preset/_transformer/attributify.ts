import type { SourceCodeTransformer } from '@unocss/core'
import type { Options } from 'unplugin-attributify-to-class/types'
import { extractorAttributify } from 'unplugin-attributify-to-class/utils'
import { createFilter } from '@rollup/pluginutils'

export function transformerQuickappAttributify(options: Options = {}): SourceCodeTransformer {
  const idFilter = createFilter(
    options.include || [/\.ux$/, /\.ux\?ux/],
    options.exclude || [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/],
  )

  const extractor = extractorAttributify(options)

  return {
    name: 'transformer-applet-attributify',
    idFilter,
    enforce: 'pre',
    transform(code) {
      const newCode = extractor(code.toString())
      code.overwrite(0, code.original.length, newCode)
    },
  }
}
