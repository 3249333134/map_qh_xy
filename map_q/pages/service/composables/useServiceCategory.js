import { ref, reactive } from 'vue'
import { SERVICE_CATEGORIES } from '../constants/layoutConfig.js'

export function useServiceCategory() {
  // 分类数据
  const categories = ref([...SERVICE_CATEGORIES])
  const activeCategory = ref('all')
  
  // 分类数据缓存
  const categoryData = reactive({})
  const categoryPages = reactive({})
  
  // 切换分类
  const handleCategoryChange = (categoryId, mapPoints, currentPage) => {
    // 确保缓存对象已初始化
    if (!categoryData[activeCategory.value]) categoryData[activeCategory.value] = []
    if (!categoryPages[activeCategory.value]) categoryPages[activeCategory.value] = 1
    
    // 保存当前分类的数据和分页状态
    categoryData[activeCategory.value] = [...mapPoints.value]
    categoryPages[activeCategory.value] = currentPage.value
    
    // 更新分类状态
    categories.value.forEach(cat => {
      cat.active = cat.id === categoryId
    })
    
    activeCategory.value = categoryId
    
    // 返回缓存的数据或null（需要重新加载）
    return {
      cachedData: categoryData[categoryId] || null,
      cachedPage: categoryPages[categoryId] || 1
    }
  }
  
  return {
    categories,
    activeCategory,
    categoryData,
    categoryPages,
    handleCategoryChange
  }
}