const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const mapRoutes = require('./routes/mapRoutes');

// 连接数据库
connectDB();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api', mapRoutes);

// 定义端口
const PORT = process.env.PORT || 3000;

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});