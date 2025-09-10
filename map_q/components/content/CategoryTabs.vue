<template>
  <scroll-view 
    class="category-tabs" 
    scroll-x 
    show-scrollbar="false"
  >
    <view 
      v-for="category in categories" 
      :key="category.id"
      :class="['category-tab', { active: category.id === activeCategory }]"
      @tap="onCategoryChange(category.id)"
    >
      {{ category.name }}
    </view>
  </scroll-view>
</template>

<script>
export default {
  name: 'CategoryTabs',
  props: {
    categories: {
      type: Array,
      required: true
    },
    activeCategory: {
      type: String,
      required: true
    }
  },
  methods: {
    onCategoryChange(categoryId) {
      this.$emit('category-change', categoryId)
    }
  }
}
</script>

<style scoped>
.category-tabs {
  white-space: nowrap;
  padding: 20rpx 0;
}

.category-tab {
  display: inline-block;
  padding: 16rpx 32rpx;
  margin-right: 20rpx;
  background: #f5f5f5;
  border-radius: 40rpx;
  font-size: 28rpx;
  color: #666;
  transition: all 0.3s;
}

.category-tab.active {
  background: #007aff;
  color: #fff;
}
</style>