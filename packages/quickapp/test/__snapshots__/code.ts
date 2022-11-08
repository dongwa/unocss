export const code = `module.exports = {
    "type": "div",
    "attr": {},
    "classList": [
      "flex",
      "flex-col",
      "justify-around",
      "items-center",
      "w-full",
      "p30"
    ],
    "children": [
      {
        "type": "text",
        "attr": {
          "value": "minesweeper"
        }
      },
      {
        "type": "div",
        "attr": {},
        "classList": [
          "flex"
        ],
        "children": [
          {
            "type": "text",
            "attr": {
              "value": function () {return '' + "⏰：" + (this.time)}
            },
            "classList": [
              "mr20"
            ]
          },
          {
            "type": "text",
            "attr": {
              "value": function () {return '' + "💣：" + (this.mines.length)}
            }
          }
        ]
      },
      {
        "type": "text",
        "attr": {
          "value": "点击 ok 键翻开格子，长按 ok 键标记炸弹"
        }
      },
      {
        "type": "div",
        "attr": {},
        "children": [
          {
            "type": "input",
            "attr": {
              "type": "button",
              "value": "重新开始"
            },
            "classList": [
              "focus:bg-gray-300"
            ],
            "events": {
              "click": function (evt) { return this.newGame(evt)}
            }
          }
        ]
      },
      {
        "type": "div",
        "attr": {},
        "classList": [
          "flex",
          "flex-col",
          "justify-center",
          "items-center",
          "w-full"
        ],
        "shown": function () {return this.g},
        "children": [
          {
            "type": "div",
            "attr": {},
            "repeat": {
              "exp": function () {return this.g},
              "value": "row"
            },
            "classList": [
              "overflow-auto"
            ],
            "children": [
              {
                "type": "div",
                "attr": {},
                "repeat": {
                  "exp": function () {return this.row},
                  "value": "item"
                },
                "children": [
                  {
                    "type": "mineblock",
                    "attr": {
                      "item": function () {return this.item}
                    },
                    "events": {
                      "reveale": function (evt) { return this.revealeBlock(this.item,evt)},
                      "flag": function (evt) { return this.flagBlock(this.item,evt)}
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }`