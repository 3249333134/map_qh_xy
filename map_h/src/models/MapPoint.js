const mongoose = require('mongoose');

// 定义地图点位模型
const mapPointSchema = new mongoose.Schema({
  id: Number,
  title: String,
  author: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [经度, 纬度]
  },
  likes: { type: Number, default: 0 },
  category: String,
  address: String,
  description: String
});

// 添加地理空间索引
mapPointSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('MapPoint', mapPointSchema, 'map_points');