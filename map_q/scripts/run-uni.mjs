import { spawnSync } from 'node:child_process'
import path from 'node:path'

const cliPath = path.resolve('node_modules/@dcloudio/vite-plugin-uni/bin/uni.js')
const result = spawnSync(process.execPath, [cliPath, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    UNI_INPUT_DIR: process.cwd()
  },
  stdio: 'inherit'
})

if (result.error) throw result.error
process.exit(result.status ?? 1)
