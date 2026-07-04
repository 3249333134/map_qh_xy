/**
 * 收藏和点赞状态管理
 * 管理用户对内容的收藏和点赞状态，使用本地存储持久化
 */

const FAVORITES_KEY = 'USER_FAVORITES'
const LIKES_KEY = 'USER_LIKES'

// 获取本地存储数据
const getStoredData = (key) => {
  try {
    const data = uni.getStorageSync(key)
    return data ? JSON.parse(data) : {}
  } catch (e) {
    console.error(`读取${key}失败:`, e)
    return {}
  }
}

// 保存数据到本地存储
const saveData = (key, data) => {
  try {
    uni.setStorageSync(key, JSON.stringify(data))
  } catch (e) {
    console.error(`保存${key}失败:`, e)
  }
}

// 收藏状态管理
export const useFavorites = () => {
  // 获取所有收藏
  const getFavorites = () => {
    return getStoredData(FAVORITES_KEY)
  }

  // 检查是否已收藏
  const isFavorited = (cardId) => {
    const favorites = getFavorites()
    return !!favorites[cardId]
  }

  // 切换收藏状态
  const toggleFavorite = (cardId, cardData = {}) => {
    const favorites = getFavorites()
    const isCurrentlyFavorited = !!favorites[cardId]

    if (isCurrentlyFavorited) {
      delete favorites[cardId]
    } else {
      favorites[cardId] = {
        id: cardId,
        timestamp: Date.now(),
        data: cardData
      }
    }

    saveData(FAVORITES_KEY, favorites)
    return !isCurrentlyFavorited
  }

  // 获取收藏数量
  const getFavoritesCount = () => {
    const favorites = getFavorites()
    return Object.keys(favorites).length
  }

  // 获取收藏列表
  const getFavoritesList = () => {
    const favorites = getFavorites()
    return Object.values(favorites)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  // 清除所有收藏
  const clearFavorites = () => {
    saveData(FAVORITES_KEY, {})
  }

  return {
    getFavorites,
    isFavorited,
    toggleFavorite,
    getFavoritesCount,
    getFavoritesList,
    clearFavorites
  }
}

// 点赞状态管理
export const useLikes = () => {
  // 获取所有点赞
  const getLikes = () => {
    return getStoredData(LIKES_KEY)
  }

  // 检查是否已点赞
  const isLiked = (cardId) => {
    const likes = getLikes()
    return !!likes[cardId]
  }

  // 切换点赞状态
  const toggleLike = (cardId, cardData = {}) => {
    const likes = getLikes()
    const isCurrentlyLiked = !!likes[cardId]

    if (isCurrentlyLiked) {
      delete likes[cardId]
    } else {
      likes[cardId] = {
        id: cardId,
        timestamp: Date.now(),
        data: cardData
      }
    }

    saveData(LIKES_KEY, likes)
    return !isCurrentlyLiked
  }

  // 获取点赞数量
  const getLikesCount = () => {
    const likes = getLikes()
    return Object.keys(likes).length
  }

  // 获取点赞列表
  const getLikesList = () => {
    const likes = getLikes()
    return Object.values(likes)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  // 清除所有点赞
  const clearLikes = () => {
    saveData(LIKES_KEY, {})
  }

  return {
    getLikes,
    isLiked,
    toggleLike,
    getLikesCount,
    getLikesList,
    clearLikes
  }
}

// 组合管理（同时管理收藏和点赞）
export const useInteraction = () => {
  const { isFavorited, toggleFavorite: toggleFav, getFavoritesCount, getFavoritesList } = useFavorites()
  const { isLiked, toggleLike: toggleLk, getLikesCount, getLikesList } = useLikes()

  // 处理收藏/点赞的通用方法
  const handleInteraction = (type, cardId, cardData) => {
    let isActive = false
    let action = ''

    if (type === 'favorite') {
      isActive = toggleFav(cardId, cardData)
      action = isActive ? '收藏' : '取消收藏'
    } else if (type === 'like') {
      isActive = toggleLk(cardId, cardData)
      action = isActive ? '点赞' : '取消点赞'
    }

    uni.showToast({
      title: action + '成功',
      icon: 'success',
      duration: 1000
    })

    return isActive
  }

  return {
    // 收藏相关
    isFavorited,
    toggleFavorite: (cardId, cardData) => handleInteraction('favorite', cardId, cardData),
    getFavoritesCount,
    getFavoritesList,

    // 点赞相关
    isLiked,
    toggleLike: (cardId, cardData) => handleInteraction('like', cardId, cardData),
    getLikesCount,
    getLikesList
  }
}

export default {
  useFavorites,
  useLikes,
  useInteraction
}
