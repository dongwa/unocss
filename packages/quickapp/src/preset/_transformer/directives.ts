import type { SourceCodeTransformer, UnoGenerator } from '@unocss/core'

import { cssIdRE } from '@unocss/core'
import MagicString from 'magic-string'
import { transformDirectives } from '@unocss/transformer-directives'

import toolkit from '@aiot-toolkit/compiler'

export interface TransformerDirectivesOptions {
  enforce?: SourceCodeTransformer['enforce']
  /**
   * Treat CSS variables as directives for CSS syntax compatible.
   *
   * Pass `false` to disable, or a string to use as a prefix.
   *
   * @default '--at-'
   */
  varStyle?: false | string

  /**
   * Throw an error if utils or themes are not found.
   *
   * @default true
   */
  throwOnMissing?: boolean
}

export interface TransformerDirectivesContext {
  code: MagicString
  uno: UnoGenerator
  options: TransformerDirectivesOptions
  offset?: number
  filename?: string
}

export function transformerDirectives(options: TransformerDirectivesOptions = {}): SourceCodeTransformer {
  return {
    name: 'css-directive',
    enforce: options?.enforce || 'pre',
    idFilter: id => !!id.match(cssIdRE) || !!id.match(/\.ux/),
    transform: (code, id, ctx) => {
      const cssCode = toolkit.parseFragments(code.toString(), id)
      cssCode.style.forEach(async (css) => {
        const temS = new MagicString(css.content)
        await transformDirectives(temS, ctx.uno, options, id)
        code.replace(css.content, temS.toString())
      })
    },
  }
}
