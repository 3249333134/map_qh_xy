const mongoose = require('mongoose');
require('dotenv').config();

// 连接MongoDB - 使用环境变量或硬编码的URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://47.115.220.98:27017/map_data';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB连接成功');
  } catch (err) {
    console.error('MongoDB连接失败:', err);
    process.exit(1);
  }
};

module.exports = connectDB;