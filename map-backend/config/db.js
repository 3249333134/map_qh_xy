const mongoose = require('mongoose');
require('dotenv').config();
const MONGO_CONFIG = require('./constants/mongo');

const connectDB = async () => {
  try {
    // 使用环境变量中的URI，但确保数据库名称与配置一致
    const mongoURI = process.env.MONGO_URI || `mongodb://47.115.220.98:27017/${MONGO_CONFIG.DB_NAME}`;
    
    await mongoose.connect(mongoURI);
    console.log(`MongoDB连接成功，数据库: ${MONGO_CONFIG.DB_NAME}`);
  } catch (error) {
    console.error('MongoDB连接失败:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;