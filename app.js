const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const mongoose = require('mongoose');
const config = require('./config');

const app = new Koa();
const router = new Router();

// 连接 MongoDB
mongoose.connect(config.mongodbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB 连接成功');
}).catch(err => {
  console.error('MongoDB 连接失败:', err);
});

// 中间件
app.use(bodyParser());

// 路由
router.get('/', (ctx) => {
  ctx.body = { message: 'Mall-Cook 服务端运行成功' };
});

app.use(router.routes()).use(router.allowedMethods());

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});