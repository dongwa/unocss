import { defaultRules } from './confg'

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
  Array.from(code.matchAll(/\"classList\"\s*:\s*(?:function\s*\(\)\s*\{return)?\s*\[((?:\n|.)*?)\]/g)).forEach((m) => {
    const classStr = m[1]
    const sourceStr = trim(m[0])

    let classArr = [sourceStr]
    classArr = classArr.concat(getArrClass(classStr))
    // classArr.push(classStr)
    matchs.push(classArr)
  })
  return matchs
}

export function getArrClass(className: string) {
  // [
  //   title === '2.3' ? 'font-$font-name bg-teal-200:55' :'tracking-[2/5]',
  //   isFont ? 'font-$font-name' : 'tracking-[2/5]'
  // ]
  // => ['font-$font-name bg-teal-200:55', 'tracking-[2/5]','font-$font-name', 'tracking-[2/5]']
  return Array.from(className.matchAll(/[\"\'](.*?)[\"\']/g)).map(v => v[1])
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

