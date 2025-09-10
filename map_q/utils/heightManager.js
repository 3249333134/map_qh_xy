/**
 * 瀑布流卡片高度管理工具
 */
class HeightManager {
  constructor(config = {}) {
    this.config = {
      minHeight: 200,
      maxHeight: 400,
      useCache: true,
      cacheKey: 'waterfall_heights',
      ...config
    }
    
    this.heightCache = new Map()
    this.loadCache()
  }
  
  /**
   * 生成随机高度
   */
  generateRandomHeight() {
    const { minHeight, maxHeight } = this.config
    return Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight
  }
  
  /**
   * 获取或生成高度
   */
  getHeight(key, forceGenerate = false) {
    if (!forceGenerate && this.config.useCache && this.heightCache.has(key)) {
      return this.heightCache.get(key)
    }
    
    const height = this.generateRandomHeight()
    
    if (this.config.useCache) {
      this.heightCache.set(key, height)
      this.saveCache()
    }
    
    return height
  }
  
  /**
   * 批量获取高度
   */
  getBatchHeights(keys, forceGenerate = false) {
    const heights = {}
    keys.forEach(key => {
      heights[key] = this.getHeight(key, forceGenerate)
    })
    return heights
  }
  
  /**
   * 设置高度
   */
  setHeight(key, height) {
    this.heightCache.set(key, height)
    if (this.config.useCache) {
      this.saveCache()
    }
  }
  
  /**
   * 删除高度
   */
  removeHeight(key) {
    this.heightCache.delete(key)
    if (this.config.useCache) {
      this.saveCache()
    }
  }
  
  /**
   * 清除所有高度缓存
   */
  clearCache() {
    this.heightCache.clear()
    if (this.config.useCache) {
      uni.removeStorageSync(this.config.cacheKey)
    }
  }
  
  /**
   * 加载缓存
   */
  loadCache() {
    if (!this.config.useCache) return
    
    try {
      const cached = uni.getStorageSync(this.config.cacheKey)
      if (cached && Array.isArray(cached)) {
        this.heightCache = new Map(cached)
      }
    } catch (error) {
      console.warn('Failed to load height cache:', error)
    }
  }
  
  /**
   * 保存缓存
   */
  saveCache() {
    if (!this.config.useCache) return
    
    try {
      const cacheArray = Array.from(this.heightCache.entries())
      uni.setStorageSync(this.config.cacheKey, cacheArray)
    } catch (error) {
      console.warn('Failed to save height cache:', error)
    }
  }
  
  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return {
      size: this.heightCache.size,
      keys: Array.from(this.heightCache.keys()),
      config: this.config
    }
  }
}

// 创建默认实例
const defaultHeightManager = new HeightManager()

// 导出类和默认实例
export { HeightManager }
export default defaultHeightManager