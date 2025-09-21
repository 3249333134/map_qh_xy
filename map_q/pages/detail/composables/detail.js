// 添加ref的导入
import { ref } from 'vue';

// 移除多余的默认导出，只保留 useDetail 函数
export default function useDetail() {
  // 详情数据
  const detailData = ref({
    title: '我们一起说\n小舞生日快乐！',
    authorName: '人中黄疯许陌蒸',
    publishTime: '08-21',
    viewCount: 1283,
    content: '我们一起说\n小舞生日快乐！',
    tags: ['斗罗大陆', '小舞', 'cos', 'cos正片', '三舞', '国漫'],
    likeCount: 79,
    collectCount: 32,
    commentCount: 11,
    images: ['/static/logo.png'],
    userInfo: {
      name: '人中黄疯许陌蒸',
      avatar: '/static/logo.png',
      isFollowed: false
    }
  });

  // 当前用户信息（增加 name，便于“谁回复谁”的展示）
  const currentUser = ref({
    name: '我',
    avatar: '/static/logo.png'
  });

  // 状态数据
  const isLiked = ref(false);
  const isCollected = ref(false);
  const isFollowing = ref(false);
  const comments = ref([]);
  const hasMoreComments = ref(true);
  const currentImageIndex = ref(0);

  // 模拟数据
  const usernames = [
    '司烬', '星白', '夏日', '冰喵喵', '野生的泡泡糖师', '王浩雄', 
    '分程', '冯华平喵', 'Tommy&小古', '冰喵喵', '等着面条有神桃花开', 'Clown小丑'
  ];

  const commentTemplates = [
    '太好看了！', '小舞生日快乐！', '哈哈哈哈哈', '666，赞了赞了',
    '我也想去！', '好可爱啊', '拍得真好', '期待更多作品', '太棒了',
    '喜欢这个风格', ' really 不错', '支持支持', '好美啊', '太厉害了',
    '学到了', '收藏了', '转发了', '点赞👍', '真心不错', '继续加油'
  ];

  // 参数
  let cardId = '';
  let cardTitle = '';
  let cardAuthor = '';
  let cardLikes = 0;

  // 获取详情数据
  const getDetailData = () => {
    // 模拟API请求
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('获取详情数据成功');
        resolve(detailData.value);
      }, 500);
    });
  };

  // 获取评论数据
  const getComments = () => {
    // 模拟API请求
    return new Promise((resolve) => {
      setTimeout(() => {
        const generatedComments = generateRandomComments();
        comments.value = generatedComments;
        console.log('获取评论数据成功');
        resolve(comments.value);
      }, 800);
    });
  };

  // 生成随机评论
  const generateRandomComments = () => {
    const commentCount = Math.floor(Math.random() * 20) + 15; // 15-35条评论
    const randomComments = [];
    
    for (let i = 0; i < commentCount; i++) {
      const comment = {
        id: i + 1,
        name: usernames[Math.floor(Math.random() * usernames.length)],
        avatar: '/static/logo.png',
        content: commentTemplates[Math.floor(Math.random() * commentTemplates.length)],
        time: getRandomTime(),
        timestamp: getRandomTimestamp(),
        isLiked: Math.random() > 0.7,
        likeCount: Math.floor(Math.random() * 50),
        replies: Math.random() > 0.5 ? generateReplies() : [] // 50%的概率有回复
      };
      randomComments.push(comment);
    }
    
    // 按热度和时间排序
    const allCommentsByHot = [...randomComments].sort((a, b) => b.likeCount - a.likeCount);
    const hotestComment = allCommentsByHot[0];
    const remainingComments = allCommentsByHot.slice(1);
    const recentCount = Math.floor(Math.random() * 3) + 1;
    const recentComments = [...remainingComments]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, recentCount);
    
    const otherComments = remainingComments
      .filter(comment => !recentComments.some(recent => recent.id === comment.id))
      .sort((a, b) => b.likeCount - a.likeCount);
    
    return [hotestComment, ...recentComments, ...otherComments];
  };

  // 生成回复
  const generateReplies = () => {
    const replyCount = Math.floor(Math.random() * 3); // 0-2条回复
    const replies = [];
    
    for (let i = 0; i < replyCount; i++) {
      replies.push({
        id: i + 1,
        name: usernames[Math.floor(Math.random() * usernames.length)],
        avatar: '/static/logo.png',
        content: commentTemplates[Math.floor(Math.random() * commentTemplates.length)],
        time: getRandomTime(),
        isLiked: Math.random() > 0.8,
        likeCount: Math.floor(Math.random() * 20)
      });
    }
    
    return replies;
  };

  // 获取随机时间
  const getRandomTime = () => {
    const timeOptions = [
      '刚刚', '1分钟前', '5分钟前', '10分钟前', '30分钟前',
      '1小时前', '2小时前', '3小时前', '5小时前',
      '昨天', '2天前', '3天前', '1周前'
    ];
    return timeOptions[Math.floor(Math.random() * timeOptions.length)];
  };

  // 获取随机时间戳
  const getRandomTimestamp = () => {
    const now = Date.now();
    const timeRanges = [
      now - 60 * 1000, // 1分钟前
      now - 5 * 60 * 1000, // 5分钟前
      now - 10 * 60 * 1000, // 10分钟前
      now - 30 * 60 * 1000, // 30分钟前
      now - 60 * 60 * 1000, // 1小时前
      now - 2 * 60 * 60 * 1000, // 2小时前
      now - 3 * 60 * 60 * 1000, // 3小时前
      now - 5 * 60 * 60 * 1000, // 5小时前
      now - 24 * 60 * 60 * 1000, // 昨天
      now - 2 * 24 * 60 * 60 * 1000, // 2天前
      now - 3 * 24 * 60 * 60 * 1000, // 3天前
      now - 7 * 24 * 60 * 60 * 1000 // 1周前
    ];
    return timeRanges[Math.floor(Math.random() * timeRanges.length)];
  };

  // 加载更多评论
  const loadMoreComments = () => {
    if (!hasMoreComments.value) return;
    
    // 模拟加载更多
    return new Promise((resolve) => {
      setTimeout(() => {
        const moreComments = generateRandomComments().slice(0, 5);
        comments.value = [...comments.value, ...moreComments];
        
        // 模拟没有更多数据了
        if (comments.value.length > 50) {
          hasMoreComments.value = false;
        }
        
        resolve(comments.value);
      }, 1000);
    });
  };

  // 切换点赞状态
  const toggleLike = () => {
    isLiked.value = !isLiked.value;
    detailData.value.likeCount += isLiked.value ? 1 : -1;
  };

  // 切换收藏状态
  const toggleCollect = () => {
    isCollected.value = !isCollected.value;
    detailData.value.collectCount += isCollected.value ? 1 : -1;
  };

  // 切换关注状态
  const toggleFollow = () => {
    isFollowing.value = !isFollowing.value;
    detailData.value.userInfo.isFollowed = isFollowing.value;
  };

  // 分享内容
  const shareContent = () => {
    console.log('分享内容');
    // 这里可以调用uni-app的分享API
    uni.showToast({
      title: '分享功能待实现',
      icon: 'none'
    });
  };

  // 预览图片
  const previewImage = (index) => {
    currentImageIndex.value = index;
    uni.previewImage({
      urls: detailData.value.images,
      current: index
    });
  };

  // 点赞评论
  const likeComment = (commentId) => {
    const comment = comments.value.find(c => c.id === commentId);
    if (comment) {
      comment.isLiked = !comment.isLiked;
      comment.likeCount += comment.isLiked ? 1 : -1;
      if (comment.likeCount < 0) comment.likeCount = 0;
    }
  };

  // 回复评论（统一入口：支持 { commentId, atName } 或 (commentId, atName)）
  const replyComment = (payloadOrId, maybeName) => {
    let commentId, atName
    if (typeof payloadOrId === 'object' && payloadOrId !== null) {
      commentId = payloadOrId.commentId
      atName = payloadOrId.atName || ''
    } else {
      commentId = payloadOrId
      atName = maybeName || ''
    }
    const fromName = currentUser.value?.name || '我'
    console.log(`${fromName} 回复 ${atName}（评论ID: ${commentId}）`)
    showCommentInput(atName)
  };

  // 显示评论输入框（可选预填 @）
  const showCommentInput = (atName = '') => {
    try {
      const query = uni.createSelectorQuery()
      query.select('.comment-count-section').boundingClientRect()
      query.selectViewport().scrollOffset()
      query.exec(res => {
        const rect = res && res[0]
        const viewport = res && res[1]
        if (rect && viewport) {
          const top = Math.max(0, rect.top + viewport.scrollTop - 80)
          uni.pageScrollTo({ scrollTop: top, duration: 300 })
        }
      })
      if (atName) console.log('预填 @', atName)
    } catch (e) {
      console.log('显示评论输入框', atName)
    }
  };

  // 返回上一页
  const back = () => {
    uni.navigateBack();
  };

  // 加载详情数据
  const loadDetailData = (id) => {
    console.log('加载详情数据:', id);
    
    if (cardTitle) {
      detailData.value.title = cardTitle;
      detailData.value.content = cardTitle;
    }
    if (cardAuthor) {
      detailData.value.authorName = cardAuthor;
      detailData.value.userInfo.name = cardAuthor;
    }
    if (cardLikes) {
      detailData.value.likeCount = cardLikes;
    }
  };

  // 初始化数据
  const initializeData = (options) => {
    if (options) {
      if (options.id) {
        cardId = options.id;
        cardTitle = decodeURIComponent(options.title || '');
        cardAuthor = decodeURIComponent(options.author || '');
        cardLikes = parseInt(options.likes || 0);
      }
      
      loadDetailData(cardId);
    }
  };

  // 导出所有需要的数据和方法
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
};