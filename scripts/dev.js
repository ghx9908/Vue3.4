const { build } = require("esbuild")
const { resolve } = require("path")
const args = require("minimist")(process.argv.slice(2))

const target = args._[0] || "reactivity"
const format = args.f || "global"

const pkg = require(resolve(__dirname, `../packages/${target}/package.json`))

const outputFormat = format.startsWith("global") // 输出的格式
  ? "iife"
  : format === "cjs"
  ? "cjs"
  : "esm"

const outfile = resolve(
  // 输出的文件
  __dirname,
  // `../packages/${target}/dist/${target}.${format}.js`
  `../packages/${target}/dist/${target}.js`
)

build({
  entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)],
  outfile,
  bundle: true,
  sourcemap: true,
  format: outputFormat,
  globalName: pkg.buildOptions?.name,
  platform: format === "cjs" ? "node" : "browser",
  watch: {
    // 监控文件变化
    onRebuild(error) {
      if (!error) console.log(`rebuilt~~~~`)
    },
  },
}).then(() => {
  console.log("watching~~~")
})
