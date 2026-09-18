import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import fs from 'node:fs'
import path from 'node:path'

const WEIXIN_NATIVE_TAGS = [
  'cover-image',
  'cover-view',
  'scroll-view',
  'swiper-item',
  'textarea',
  'navigator',
  'button',
  'canvas',
  'picker',
  'swiper',
  'video',
  'image',
  'input',
  'label',
  'view',
  'text',
  'form',
  'map'
]

function walkFiles(root, extension, output = []) {
  if (!fs.existsSync(root)) return output
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const filePath = path.join(root, entry.name)
    if (entry.isDirectory()) walkFiles(filePath, extension, output)
    else if (entry.name.endsWith(extension)) output.push(filePath)
  }
  return output
}

function addNativeTagClass(wxml, tag) {
  const tagClass = `__wx-tag-${tag.replaceAll('-', '_')}`
  const openingTag = new RegExp(`<${tag}(?=[\\s>])([^>]*)>`, 'g')
  return wxml.replace(openingTag, (match, attributes) => {
    if (/\sclass\s*=/.test(attributes)) {
      return match.replace(/(\sclass\s*=\s*)(["'])/, `$1$2${tagClass} `)
    }
    return `<${tag} class="${tagClass}"${attributes}>`
  })
}

function sanitizeComponentWxss(root) {
  for (const wxssPath of walkFiles(root, '.wxss')) {
    if (path.basename(wxssPath) === 'app.wxss') continue

    let wxss = fs.readFileSync(wxssPath, 'utf8')
    const usedTags = WEIXIN_NATIVE_TAGS.filter((tag) => {
      const selector = new RegExp(`(^|[\\s>+~,(])${tag.replace('-', '\\-')}(?=[.#:\\s>+~,{])`, 'm')
      return selector.test(wxss)
    })
    if (!usedTags.length) continue

    for (const tag of usedTags) {
      const tagClass = `__wx-tag-${tag.replaceAll('-', '_')}`
      const selector = new RegExp(`(^|[\\s>+~,(])${tag.replace('-', '\\-')}(?=[.#:\\s>+~,{])`, 'gm')
      wxss = wxss.replace(selector, `$1.${tagClass}`)
    }
    fs.writeFileSync(wxssPath, wxss)

    const wxmlPath = wxssPath.replace(/\.wxss$/, '.wxml')
    if (!fs.existsSync(wxmlPath)) continue
    let wxml = fs.readFileSync(wxmlPath, 'utf8')
    for (const tag of usedTags) wxml = addNativeTagClass(wxml, tag)
    fs.writeFileSync(wxmlPath, wxml)
  }
}

function normalizeWeixinOutputConfig() {
  return {
    name: 'normalize-weixin-output-config',
    closeBundle() {
      if (process.env.UNI_PLATFORM !== 'mp-weixin') return
      const roots = [
        'dist/dev/mp-weixin',
        'dist/build/mp-weixin',
        'unpackage/dist/dev/mp-weixin'
      ]
      for (const root of roots) {
        const outputRoot = path.resolve(root)
        sanitizeComponentWxss(outputRoot)
        const configPath = path.resolve(root, 'project.config.json')
        if (!fs.existsSync(configPath)) continue
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
          config.miniprogramRoot = ''
          fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`)
        } catch (error) {
          console.warn(`[map_q] Unable to normalize ${configPath}:`, error.message)
        }
      }
    }
  }
}

export default defineConfig({
  plugins: [uni(), normalizeWeixinOutputConfig()]
})
