const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const mapDataRoutes = require('./routes/mapData');

require('dotenv').config();

const app = express();

// 在连接数据库后添加
const MapPoint = require('./models/MapPoint');

// 连接数据库
connectDB().then(async () => {
  try {
    // 确保索引已创建
    await MapPoint.createIndexes();
    console.log('地理空间索引创建成功');
  } catch (error) {
    console.error('创建索引失败:', error);
  }
});

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/map-data', mapDataRoutes);

// 简单的健康检查路由
app.get('/', (req, res) => {
  res.send('地图后端API服务正常运行');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`服务器运行在端口 ${PORT}`));