import { describe, expect, test } from 'vitest'
import { getClass, transformCode, transformEscapESelector } from '../src/webpack'

describe('transformer', () => {
  test('transformEscapESelector', () => {
    const test1 = '\n    "w-1.4",\n    "flex:col",\n    "w-1/3",\n    "90%",\n    "flex!row"\n  '
    const result = '\n    "w-1-d-4",\n    "flex-c-col",\n    "w-1-s-3",\n    "90-p-",\n    "flex-e-row"\n  '
    const res = transformEscapESelector(test1)
    // eslint-disable-next-line no-console
    console.log('res', res)

    expect(res).toBe(result)
  })

  test('funcClass', () => {
    // "classList": [
    //   "flex",
    //   "flex-col",
    //   "justify-around",
    //   "items-center",
    //   "w-full",
    //   "p30"
    // ],
    const test2 = '"classList": function () {return [\'w-20\', \'h-20\', \'border-1\', \'border-gray-300\', \'text-center\', \'content-center\', \'focus:bg-gray-500\', this.getClass()]}'
    // const result = '"classList": function () {return [\'w-20\', \'h-20\', \'border-1\', \'border-gray-300\', \'text-center\', \'content-center\', \'focus-c-bg-gray-500\', this.getClass()]}'
    const classStr = getClass(test2)

    expect(classStr).toMatchInlineSnapshot(`
      [
        [
          "\\"classList\\": function () {return ['w-20', 'h-20', 'border-1', 'border-gray-300', 'text-center', 'content-center', 'focus:bg-gray-500', this.getClass()]",
          "w-20",
          "h-20",
          "border-1",
          "border-gray-300",
          "text-center",
          "content-center",
          "focus:bg-gray-500",
        ],
      ]
    `)
    const res = transformCode(test2.toString())
    expect(res).toMatchInlineSnapshot('"\\"classList\\": function () {return [\'w-20\', \'h-20\', \'border-1\', \'border-gray-300\', \'text-center\', \'content-center\', \'focus-c-bg-gray-500\', this.getClass()]}"')
  })
})
