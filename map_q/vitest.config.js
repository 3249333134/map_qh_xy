import { defineConfig } from 'vitest/config'
import { parse, compileScript } from 'vue/compiler-sfc'

export default defineConfig({
  plugins: [{
    name: 'video-component-test',
    transform(source, id) {
      if (!id.endsWith('/pages/detail/components/VideoDetail.vue')) return
      const { descriptor } = parse(source)
      return { code: compileScript(descriptor, { id: 'video-component-test' }).content, map: null }
    }
  }],
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.js'],
    clearMocks: true
  }
})
