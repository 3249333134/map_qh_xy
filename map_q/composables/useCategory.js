import { ref } from 'vue'

export function useCategory() {
  // 分类数据
  const categories = ref([
    { id: 'all', name: '全部', active: true },
    { id: 'hot', name: '热门资源', active: false },
    { id: 'exhibition', name: '展会活动', active: false },
    { id: 'personal', name: '个人活动', active: false }
  ])
  
  const activeCategory = ref('all')
  
  // 切换分类
  const handleCategoryChange = (categoryId) => {
    // 更新分类状态
    categories.value.forEach(cat => {
      cat.active = cat.id === categoryId
    })
    
    activeCategory.value = categoryId
  }
  
  return {
    categories,
    activeCategory,
    handleCategoryChange
  }
}