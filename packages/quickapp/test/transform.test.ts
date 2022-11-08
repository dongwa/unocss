import { describe, expect, test } from 'vitest'
import { getClass, transformCode, transformEscapESelector } from '../src/webpack/transform'
import { code } from './__snapshots__/code'

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

  test('class', () => {
    const test = `"classList": [
      "focus:border-gray-300"
    ],`
    const res = transformCode(test)
    expect(res).toMatchInlineSnapshot(`
      "\\"classList\\": [
            \\"focus-c-border-gray-300\\"
          ],"
    `)
  })

  test('fullCode', () => {
    const res = getClass(code)
    expect(res).toMatchInlineSnapshot(`
      [
        [
          "\\"classList\\": [
            \\"flex\\",
            \\"flex-col\\",
            \\"justify-around\\",
            \\"items-center\\",
            \\"w-full\\",
            \\"p30\\"
          ]",
          "flex",
          "flex-col",
          "justify-around",
          "items-center",
          "w-full",
          "p30",
        ],
        [
          "\\"classList\\": [
                \\"flex\\"
              ]",
          "flex",
        ],
        [
          "\\"classList\\": [
                    \\"mr20\\"
                  ]",
          "mr20",
        ],
        [
          "\\"classList\\": [
                    \\"focus:bg-gray-300\\"
                  ]",
          "focus:bg-gray-300",
        ],
        [
          "\\"classList\\": [
                \\"flex\\",
                \\"flex-col\\",
                \\"justify-center\\",
                \\"items-center\\",
                \\"w-full\\"
              ]",
          "flex",
          "flex-col",
          "justify-center",
          "items-center",
          "w-full",
        ],
        [
          "\\"classList\\": [
                    \\"overflow-auto\\"
                  ]",
          "overflow-auto",
        ],
      ]
    `)
    const fullRes = transformCode(code)
    expect(fullRes).toMatchInlineSnapshot(`
      "module.exports = {
          \\"type\\": \\"div\\",
          \\"attr\\": {},
          \\"classList\\": [
            \\"flex\\",
            \\"flex-col\\",
            \\"justify-around\\",
            \\"items-center\\",
            \\"w-full\\",
            \\"p30\\"
          ],
          \\"children\\": [
            {
              \\"type\\": \\"text\\",
              \\"attr\\": {
                \\"value\\": \\"minesweeper\\"
              }
            },
            {
              \\"type\\": \\"div\\",
              \\"attr\\": {},
              \\"classList\\": [
                \\"flex\\"
              ],
              \\"children\\": [
                {
                  \\"type\\": \\"text\\",
                  \\"attr\\": {
                    \\"value\\": function () {return '' + \\"⏰：\\" + (this.time)}
                  },
                  \\"classList\\": [
                    \\"mr20\\"
                  ]
                },
                {
                  \\"type\\": \\"text\\",
                  \\"attr\\": {
                    \\"value\\": function () {return '' + \\"💣：\\" + (this.mines.length)}
                  }
                }
              ]
            },
            {
              \\"type\\": \\"text\\",
              \\"attr\\": {
                \\"value\\": \\"点击 ok 键翻开格子，长按 ok 键标记炸弹\\"
              }
            },
            {
              \\"type\\": \\"div\\",
              \\"attr\\": {},
              \\"children\\": [
                {
                  \\"type\\": \\"input\\",
                  \\"attr\\": {
                    \\"type\\": \\"button\\",
                    \\"value\\": \\"重新开始\\"
                  },
                  \\"classList\\": [
                    \\"focus-c-bg-gray-300\\"
                  ],
                  \\"events\\": {
                    \\"click\\": function (evt) { return this.newGame(evt)}
                  }
                }
              ]
            },
            {
              \\"type\\": \\"div\\",
              \\"attr\\": {},
              \\"classList\\": [
                \\"flex\\",
                \\"flex-col\\",
                \\"justify-center\\",
                \\"items-center\\",
                \\"w-full\\"
              ],
              \\"shown\\": function () {return this.g},
              \\"children\\": [
                {
                  \\"type\\": \\"div\\",
                  \\"attr\\": {},
                  \\"repeat\\": {
                    \\"exp\\": function () {return this.g},
                    \\"value\\": \\"row\\"
                  },
                  \\"classList\\": [
                    \\"overflow-auto\\"
                  ],
                  \\"children\\": [
                    {
                      \\"type\\": \\"div\\",
                      \\"attr\\": {},
                      \\"repeat\\": {
                        \\"exp\\": function () {return this.row},
                        \\"value\\": \\"item\\"
                      },
                      \\"children\\": [
                        {
                          \\"type\\": \\"mineblock\\",
                          \\"attr\\": {
                            \\"item\\": function () {return this.item}
                          },
                          \\"events\\": {
                            \\"reveale\\": function (evt) { return this.revealeBlock(this.item,evt)},
                            \\"flag\\": function (evt) { return this.flagBlock(this.item,evt)}
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }"
    `)
  })
})
