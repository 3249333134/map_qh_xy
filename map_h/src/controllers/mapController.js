const MapPoint = require('../models/MapPoint');

// 获取地图点位数据
exports.getMapPoints = async (req, res) => {
  try {
    const { lat, lng, radius = 5000, page = 1, pageSize = 10, category, bounds } = req.query;
    
    // 将字符串转换为数字
    const numPage = parseInt(page);
    const numPageSize = Math.min(parseInt(pageSize), 1000); // 限制最大页面大小
    
    let query = {};
    let boundsObj = null;
    
    // 如果有边界参数，使用地理边界查询（优先级更高）
    if (bounds) {
      try {
        boundsObj = JSON.parse(bounds);
        const { northeast, southwest } = boundsObj;
        
        // 验证边界参数
        if (!northeast || !southwest || 
            typeof northeast.latitude !== 'number' || typeof northeast.longitude !== 'number' ||
            typeof southwest.latitude !== 'number' || typeof southwest.longitude !== 'number') {
          return res.status(400).json({ message: '无效的边界参数' });
        }
        
        // 使用 $geoWithin 和 $box 进行边界查询
        query.location = {
          $geoWithin: {
            $box: [
              [southwest.longitude, southwest.latitude], // 西南角 [经度, 纬度]
              [northeast.longitude, northeast.latitude]  // 东北角 [经度, 纬度]
            ]
          }
        };
        
        console.log('使用边界查询:', {
          southwest: [southwest.longitude, southwest.latitude],
          northeast: [northeast.longitude, northeast.latitude]
        });
        
      } catch (parseError) {
        console.error('解析边界参数失败:', parseError);
        return res.status(400).json({ message: '边界参数格式错误' });
      }
    } 
    // 如果没有边界参数，使用原来的圆形范围查询
    else if (lat && lng) {
      const numLat = parseFloat(lat);
      const numLng = parseFloat(lng);
      const numRadius = parseInt(radius);
      
      // 验证经纬度
      if (isNaN(numLat) || isNaN(numLng)) {
        return res.status(400).json({ message: '无效的经纬度参数' });
      }
      
      // 构建查询条件
      query.location = {
        $geoWithin: {
          $centerSphere: [
            [numLng, numLat], 
            numRadius / 6378100
          ]
        }
      };
      
      console.log('使用圆形范围查询:', { lat: numLat, lng: numLng, radius: numRadius });
    } else {
      return res.status(400).json({ message: '缺少位置参数（经纬度或边界）' });
    }
    
    // 如果有分类筛选
    if (category && category !== 'all') {
      query.category = category;
    }
    
    console.log('最终查询条件:', JSON.stringify(query, null, 2));
    
    // 计算总数
    const total = await MapPoint.countDocuments(query);
    
    // 获取所有符合条件的点位
    let allPoints = [];
    // 修改网格采样部分的代码
    if (boundsObj && total > numPageSize) {
    // 如果点位总数超过页面大小，使用网格采样
    allPoints = await MapPoint.find(query).lean();
    
    // 计算网格大小和采样
    const { northeast, southwest } = boundsObj;
    const gridPoints = gridSample(allPoints, numPageSize * 5, southwest, northeast); // 增加采样数量
    
    // 使用网格采样后的点位
    const skip = (numPage - 1) * numPageSize;
    const end = Math.min(skip + numPageSize, gridPoints.length);
    const mapPoints = gridPoints.slice(skip, end);
    
    const totalPages = Math.ceil(gridPoints.length / numPageSize);
    
    // 确保hasMoreData正确设置
    const hasMoreData = numPage < totalPages;
    
    console.log(`网格采样: 从 ${total} 个点位中采样得到 ${gridPoints.length} 个点位，当前页返回 ${mapPoints.length} 个，还有更多数据: ${hasMoreData}`);
    
    // 返回数据和分页信息
    return res.json({
      success: true,
      data: mapPoints,
      pagination: {
        total: gridPoints.length,
        totalPages,
        currentPage: numPage,
        pageSize: numPageSize,
        hasMoreData // 明确返回是否有更多数据
      },
      queryType: 'grid_sample',
      densityInfo: {
        totalInBounds: total,
        returned: mapPoints.length,
        sampled: gridPoints.length
      }
    });
    }
    
    // 如果点位数量不多，使用原来的排序和分页方法
    const totalPages = Math.ceil(total / numPageSize);
    const skip = (numPage - 1) * numPageSize;
    const mapPoints = await MapPoint.find(query)
      .sort({ 
        category: -1,  // 按分类排序
        likes: -1,     // 按点赞数排序
        createdAt: -1  // 按创建时间排序
      })
      .skip(skip)
      .limit(numPageSize)
      .lean();
    
    console.log(`查询结果: 找到 ${mapPoints.length} 个点位，总共 ${total} 个`);
    
    // 返回数据和分页信息
    res.json({
      success: true,
      data: mapPoints,
      pagination: {
        total,
        totalPages,
        currentPage: numPage,
        pageSize: numPageSize
      },
      queryType: bounds ? 'bounds' : 'radius',
      densityInfo: {
        totalInBounds: total,
        returned: mapPoints.length
      }
    });
  } catch (error) {
    console.error('获取地图点位数据失败:', error);
    res.status(500).json({ 
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 网格采样函数
function gridSample(points, targetCount, southwest, northeast) {
  // 如果点位数量小于目标数量，直接返回所有点位
  if (points.length <= targetCount) {
    return points;
  }
  
  // 计算边界尺寸
  const latDiff = northeast.latitude - southwest.latitude;
  const lngDiff = northeast.longitude - southwest.longitude;
  
  // 根据点位数量和目标数量确定网格大小
  // 网格数量应该是目标数量的1.5-2倍，以确保有足够的网格
  const gridFactor = 2;
  const gridCount = targetCount * gridFactor;
  
  // 计算网格尺寸
  const gridSize = Math.sqrt(gridCount);
  const latGridSize = latDiff / gridSize;
  const lngGridSize = lngDiff / gridSize;
  
  // 创建网格
  const grid = {};
  
  // 将点位分配到网格
  points.forEach(point => {
    const coords = point.location.coordinates;
    const lng = coords[0];
    const lat = coords[1];
    
    // 计算网格索引
    const latIndex = Math.floor((lat - southwest.latitude) / latGridSize);
    const lngIndex = Math.floor((lng - southwest.longitude) / lngGridSize);
    const gridKey = `${latIndex}_${lngIndex}`;
    
    // 将点位添加到对应的网格
    if (!grid[gridKey]) {
      grid[gridKey] = [];
    }
    grid[gridKey].push(point);
  });
  
  // 从每个网格中选择代表点（优先选择点赞数最高的）
  const sampledPoints = [];
  Object.values(grid).forEach(cellPoints => {
    if (cellPoints.length > 0) {
      // 按点赞数排序，选择最高的
      cellPoints.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      sampledPoints.push(cellPoints[0]);
    }
  });
  
  // 如果采样后的点位仍然超过目标数量，进行随机采样
  if (sampledPoints.length > targetCount) {
    // 随机打乱数组
    for (let i = sampledPoints.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sampledPoints[i], sampledPoints[j]] = [sampledPoints[j], sampledPoints[i]];
    }
    // 截取目标数量
    return sampledPoints.slice(0, targetCount);
  }
  
  return sampledPoints;
}