const express = require('express');
const router = express.Router();
const MapPoint = require('../models/MapPoint');

// 获取地图数据，支持分页和位置筛选
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, lat, lng, radius = 5000 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    
    let pipeline = [];
    
    // 如果提供了位置参数，使用$geoNear作为第一个阶段
    if (lat && lng) {
      pipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          distanceField: 'distance',
          maxDistance: parseInt(radius),
          spherical: true
        }
      });
    }
    
    // 如果提供了分类参数
    if (req.query.category && req.query.category !== 'all') {
      pipeline.push({
        $match: { category: req.query.category }
      });
    } else if (!lat && !lng) {
      // 如果没有位置查询，添加一个空的$match阶段
      pipeline.push({ $match: {} });
    }
    
    // 如果没有使用$geoNear，则添加排序
    if (!lat && !lng) {
      pipeline.push({ $sort: { createdAt: -1 } });
    }
    
    // 添加分页
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
    
    // 执行聚合查询
    const mapPoints = await MapPoint.aggregate(pipeline);
    
    // 计算总数的管道
    let countPipeline = [];
    if (lat && lng) {
      countPipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          distanceField: 'distance',
          maxDistance: parseInt(radius),
          spherical: true
        }
      });
    }
    
    if (req.query.category && req.query.category !== 'all') {
      countPipeline.push({
        $match: { category: req.query.category }
      });
    } else if (!lat && !lng) {
      countPipeline.push({ $match: {} });
    }
    
    countPipeline.push({ $count: 'total' });
    
    const countResult = await MapPoint.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;
    
    res.json({
      data: mapPoints,
      pagination: {
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / parseInt(pageSize))
      }
    });
  } catch (error) {
    console.error('获取地图数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加新的地图点位
router.post('/', async (req, res) => {
  try {
    const { title, description, category, lat, lng } = req.body;
    
    const newPoint = new MapPoint({
      title,
      description,
      category,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      }
    });
    
    const savedPoint = await newPoint.save();
    res.status(201).json(savedPoint);
  } catch (error) {
    console.error('添加地图点位失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;