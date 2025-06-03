const mongoose = require('mongoose');

const mapPointSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    default: 'all'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [经度, 纬度]
      required: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 创建地理空间索引并确保它被创建
mapPointSchema.index({ location: '2dsphere' }, { background: true });

// 显式指定集合名称为map_points，与前端配置保持一致
module.exports = mongoose.model('MapPoint', mapPointSchema, 'map_points');