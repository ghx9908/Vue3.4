# Vue3.4 源码实现

- 实现 Vue3 响应式原理，包括 reactive、effect、watch、computed、ref 等核心 API。
- 实现 Vue3 中的 diff 算法以及最长递增子序列实现。
- 实现 Vue3 组件的实现原理，深入理解组件的渲染、挂载流程，以及异步渲染的机制。
- Vue3 中生命周期的原理，以及 props、emit、slot、provide、inject 等功能的实现机制。
- 编译优化技巧，掌握 patchFlags、blockTree 等实现靶向更新的方法。
- 手写 Vue3 编译原理，掌握解析器、AST 语法树的优化、代码生成原理。
- 实现 Vue3 中的异步组件、函数式组件、Teleport、keep-alive、Transition 组件的实现原理。

# 配置开发环境

Vue3 中使用`pnpm` `workspace`来实现`monorepo` ([pnpm](https://pnpm.io/)是快速、节省磁盘空间的包管理器。主要采用符号链接的方式管理模块)

## 1.全局安装 pnpm

```yaml
npm install pnpm -g # 全局安装pnpm
```

```yaml
pnpm init # 初始化配置文件
```

## 2.创建.npmrc 文件

```yaml
shamefully-hoist = true
```

> 这里您可以尝试一下安装`Vue3`, `pnpm install vue`此时默认情况下`vue3`中依赖的模块不会被提升到`node_modules`下。 添加**羞耻的提升**可以将 Vue3，所依赖的模块提升到`node_modules`中

## 3.配置 workspace

新建 **pnpm-workspace.yaml**

```
packages:
  - "packages/*"
```

> 将 packages 下所有的目录都作为包进行管理。这样我们的 Monorepo 就搭建好了。确实比`lerna + yarn workspace`更快捷

## 4.环境搭建

> 打包项目 Vue3 采用 rollup 进行打包代码，安装打包所需要的依赖

| 开发依赖   |                         |
| ---------- | ----------------------- |
| typescript | 在项目中支持 Typescript |
| esbuild    | 构建工具，默认支持 TS   |
| minimist   | 命令行参数解析          |

```
pnpm install typescript minimist esbuild -D -w
```

## 5.初始化 TS

```
pnpm tsc --init
```

> 先添加些常用的`ts-config`配置，后续需要其他的在继续增加

```json
{
  "compilerOptions": {
    "outDir": "dist", // 输出的目录
    "sourceMap": true, // 采用sourcemap
    "target": "es2016", // 目标语法
    "module": "esnext", // 模块格式
    "moduleResolution": "node", // 模块解析方式
    "strict": false, // 严格模式
    "resolveJsonModule": true, // 解析json模块
    "esModuleInterop": true, // 允许通过es6语法引入commonjs模块
    "jsx": "preserve", // jsx 不转义
    "lib": ["esnext", "dom"] // 支持的类库 esnext及dom
  }
}
```

## 6.创建模块

> 我们现在`packages`目录下新建两个 package

- reactivity 响应式模块
- shared 共享模块

**所有包的入口均为`src/index.ts` 这样可以实现统一打包**

- reactivity/package.json

  ```json
  {
    "name": "@vue/reactivity",
    "version": "1.0.0",
    "main": "index.js",
    "module": "dist/reactivity.esm-bundler.js",
    "unpkg": "dist/reactivity.global.js",
    "buildOptions": {
      "name": "VueReactivity",
      "formats": ["esm-bundler", "cjs", "global"]
    }
  }
  ```

- shared/package.json

  ```json
  {
    "name": "@vue/shared",
    "version": "1.0.0",
    "main": "index.js",
    "module": "dist/shared.esm-bundler.js",
    "buildOptions": {
      "formats": ["esm-bundler", "cjs"]
    }
  }
  ```

> formats 为自定义的打包格式

- global 立即执行函数的格式，会暴露全局对象
- esm-browser 在浏览器中使用的格式，内联所有的依赖项。
- esm-bundler 在构建工具中使用的格式，不提供.prod 格式，在构建应用程序时会被构建工具一起进行打包压缩。
- cjs 在 node 中使用的格式，服务端渲染。

```yaml
pnpm install @vue/shared --workspace --filter @vue/reactivity
```

> 配置`ts`引用关系

```json
"baseUrl": ".",
"paths": {
    "@vue/*": ["packages/*/src"]
}
```

## 7.开发环境`esbuild`打包

**解析用户参数**

```json
"scripts": {
    "dev": "node scripts/dev.js reactivity -f esm"
}
```

```js
import esbuild from "esbuild" // 打包工具
import minimist from "minimist" // 命令行参数解析
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"
const require = createRequire(import.meta.url) // 可以在es6中使用require语法
const args = minimist(process.argv.slice(2)) // 解析打包格式和打包模块
const format = args.f || "iife"
const target = args._[0] || "reactivity"

// __dirname在es6模块中不存在需要自行解析
const __dirname = dirname(fileURLToPath(import.meta.url))

const pkg = require(`../packages/${target}/package.json`)

esbuild
  .context({
    entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)],
    outfile: resolve(
      // 输出的文件
      __dirname,
      `../packages/${target}/dist/${target}.js`
    ),
    bundle: true, // 全部打包
    sourcemap: true, // sourcemap源码映射
    format, // 打包格式 esm , cjs, iife
    globalName: pkg.buildOptions?.name, // 全局名配置
    platform: "browser", // 平台
  })
  .then((ctx) => {
    console.log("watching~~~")
    return ctx.watch() // 监控文件变化
  })
```
