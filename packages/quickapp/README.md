# unocss-quickapp

基于 [UnoCSS](https://github.com/unocss/unocss#readme) 的快应用的原子化 CSS 服务

这个插件中默认预设了两个 preset：
1. [preset-rem-to-px](https://github.com/unocss/unocss/tree/main/packages/preset-rem-to-px) 因为快应用中不支持 rem 单位
2. presetQuickapp，内置的兼容快应用的预设规则，支持的 css 规则参考 [windicss](https://windicss.org/guide/) 文档

> 注意上述两个 preset 默认启用，您不需要手动引入它们，如果您想配置自定义的 preset，请使用 presets 配置项

## 安装&用法

```bash
npm i -D unocss-quickapp
```

```ts
// quickapp.config.js
const { UnoCssQuickapp } = require('unocss-quickapp')

module.exports = {
  webpack: {
    plugins: [
      UnoCssQuickapp()
    ],
  }
}
```

项目启动后会自动生成 src/css/uno.css 文件，然后您可以在想要使用原子化css的ux页面中引入此文件，自动生成的css文件可以通过 `unoCssOutput` 配置项自定义路径和文件名。

``` vue
// *.ux
<style>
@import "pathto/css/uno.css";
</style>
```

## 说明
### 自动转化带转义字符的 CSS 类名
由于快应用不支持在 class 中使用一些需要转义的字符，所以 unocss-quickapp 会将类似 `w-1/2` 之类的带有转义字符的 CSS 类名在编译时自动转化。

⚠️注意：**目前还不支持转义js中的带有转义字符的 CSS 类名**。

默认的转化规则如下：

``` ts
const defaultRules: Record<string, string> = {
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
```

如果有需要您可以通过配置项自定义此规则：
```ts
// quickapp.config.js
const { UnoCssQuickapp } = require('unocss-quickapp')

module.exports = {
  webpack: {
    plugins: [
      UnoCssQuickapp({
        transformRules: {
          '.': '-a-',
          '/': '-b',
          ':': 'c-',
        }
      })
    ],
  }
}
```

## 待办
* 🚧(进行中) 支持 `@apply`
* 🚧(进行中) 支持在js中的书写带转义字符的原子化CSS
## License

MIT License &copy; 2022-PRESENT [donglin](https://github.com/dongwa)
