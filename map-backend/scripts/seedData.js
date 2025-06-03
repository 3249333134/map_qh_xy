require('dotenv').config();
const mongoose = require('mongoose');
const MapPoint = require('../models/MapPoint');

// 连接数据库
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB连接成功，准备添加测试数据'))
  .catch(err => {
    console.error('MongoDB连接失败:', err.message);
    process.exit(1);
  });

// 测试数据
const sampleData = [
  {
    title: '天府广场',
    description: '成都市中心的标志性广场',
    category: 'hot',
    location: {
      type: 'Point',
      coordinates: [104.066801, 30.657401] // [经度, 纬度]
    }
  },
  {
    title: '宽窄巷子',
    description: '成都著名的历史文化街区',
    category: 'hot',
    location: {
      type: 'Point',
      coordinates: [104.059086, 30.671754]
    }
  },
  {
    title: '春熙路',
    description: '成都最繁华的商业步行街',
    category: 'hot',
    location: {
      type: 'Point',
      coordinates: [104.082855, 30.655822]
    }
  },
  {
    title: '锦里古街',
    description: '成都著名的商业步行街，三国文化浓厚',
    category: 'exhibition',
    location: {
      type: 'Point',
      coordinates: [104.040120, 30.642766]
    }
  },
  {
    title: '杜甫草堂',
    description: '唐代大诗人杜甫的故居',
    category: 'exhibition',
    location: {
      type: 'Point',
      coordinates: [104.026392, 30.667458]
    }
  }
];

// 清空现有数据并添加测试数据
const seedData = async () => {
  try {
    // 清空现有数据
    await MapPoint.deleteMany({});
    console.log('已清空现有数据');
    
    // 添加测试数据
    await MapPoint.insertMany(sampleData);
    console.log('成功添加测试数据');
    
    // 关闭数据库连接
    mongoose.connection.close();
  } catch (error) {
    console.error('添加测试数据失败:', error);
    process.exit(1);
  }
};

seedData();