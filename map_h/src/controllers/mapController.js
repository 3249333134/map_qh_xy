const MapPoint = require('../models/MapPoint');

// 获取地图点位数据
exports.getMapPoints = async (req, res) => {
  try {
    const { lat, lng, radius = 5000, page = 1, pageSize = 10, category } = req.query;
    
    // 将字符串转换为数字
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    const numRadius = parseInt(radius);
    const numPage = parseInt(page);
    const numPageSize = parseInt(pageSize);
    
    // 验证经纬度
    if (isNaN(numLat) || isNaN(numLng)) {
      return res.status(400).json({ message: '无效的经纬度参数' });
    }
    
    // 构建查询条件 - 使用 $geoWithin 代替 $near
    let query = {
      location: {
        $geoWithin: {
          $centerSphere: [
            [numLng, numLat], 
            numRadius / 6378100 // 转换为弧度（地球半径约为6378.1公里）
          ]
        }
      }
    };
    
    // 如果有分类筛选
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // 计算总数
    const total = await MapPoint.countDocuments(query);
    const totalPages = Math.ceil(total / numPageSize);
    
    // 获取分页数据
    const skip = (numPage - 1) * numPageSize;
    const mapPoints = await MapPoint.find(query)
      .skip(skip)
      .limit(numPageSize);
    
    // 返回数据和分页信息
    res.json({
      data: mapPoints,
      pagination: {
        total,
        totalPages,
        currentPage: numPage,
        pageSize: numPageSize
      }
    });
  } catch (error) {
    console.error('获取地图点位数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};