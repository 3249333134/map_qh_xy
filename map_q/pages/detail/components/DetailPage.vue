<template>
  <view class="detail-page">
    <Header 
      :userInfo="detailData.userInfo" 
      :isFollowing="isFollowing"
      @back="back"
      @follow="toggleFollow"
      @share="shareContent"
    />
    
    <!-- 图片轮播 -->
    <ImageSlider :images="detailData.images" @preview="previewImage" />
    
    <!-- 内容区域 -->
    <ContentArea 
      :title="detailData.title"
      :authorName="detailData.authorName"
      :publishTime="detailData.publishTime"
      :viewCount="detailData.viewCount"
      :content="detailData.content"
      :tags="detailData.tags"
    />
    
    <!-- 评论区域 -->
    <CommentsSection 
      :comments="comments"
      :hasMoreComments="hasMoreComments"
      @loadMore="loadMoreComments"
      @likeComment="likeComment"
      @replyComment="replyComment"
    />
    
    <!-- 底部操作栏 -->
    <BottomActions 
      :likeCount="detailData.likeCount"
      :isLiked="isLiked"
      :collectCount="detailData.collectCount"
      :isCollected="isCollected"
      :commentCount="detailData.commentCount"
      @like="toggleLike"
      @collect="toggleCollect"
      @share="shareContent"
      @comment="showCommentInput"
    />
  </view>
</template>

<script>
import { onMounted, ref } from 'vue';
// 导入子组件
import Header from './Header.vue';
import ImageSlider from './ImageSlider.vue';
import ContentArea from './ContentArea.vue';
import CommentsSection from './CommentsSection.vue';
import BottomActions from './BottomActions.vue';

// 导入逻辑组合函数
import useDetail from '../composables/detail';

export default {
  name: 'DetailPage',
  components: {
    Header,
    ImageSlider,
    ContentArea,
    CommentsSection,
    BottomActions
  },
  setup() {
    // 调用组合函数获取数据和方法
    const {
      detailData,
      currentUser,
      isLiked,
      isCollected,
      isFollowing,
      comments,
      hasMoreComments,
      currentImageIndex,
      getDetailData,
      getComments,
      loadMoreComments,
      toggleLike,
      toggleCollect,
      toggleFollow,
      shareContent,
      previewImage,
      likeComment,
      replyComment,
      showCommentInput,
      back,
      initializeData
    } = useDetail();
    
    // 页面加载时获取数据
    onMounted(async () => {
      try {
        // 初始化数据
        initializeData({ id: '1' }); // 这里可以传入实际的id等参数
        console.log('初始化数据完成');
        // 获取详情数据
        await getDetailData();
        console.log('获取详情数据完成', detailData.value);
        // 获取评论数据
        await getComments();
        console.log('获取评论数据完成');
      } catch (error) {
        console.error('加载数据失败:', error);
        uni.showToast({
          title: '加载数据失败',
          icon: 'none'
        });
      }
    });
    
    // 返回所有需要在模板中使用的数据和方法
    return {
      detailData,
      currentUser,
      isLiked,
      isCollected,
      isFollowing,
      comments,
      hasMoreComments,
      currentImageIndex,
      getDetailData,
      getComments,
      loadMoreComments,
      toggleLike,
      toggleCollect,
      toggleFollow,
      shareContent,
      previewImage,
      likeComment,
      replyComment,
      showCommentInput,
      back,
      initializeData
    };
  }
};
</script>

<style scoped>
.detail-page {
  position: relative;
  min-height: 100vh;
  background-color: #f8f8f8;
}
</style>