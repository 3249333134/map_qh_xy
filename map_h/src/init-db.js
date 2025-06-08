const mongoose = require('mongoose');
require('dotenv').config();

// 连接MongoDB - 使用环境变量或硬编码的URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://47.115.220.98:27017/map_data';
console.log('正在连接到MongoDB:', MONGODB_URI);

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB连接成功'))
.catch(err => console.error('MongoDB连接失败:', err));

// 定义地图点位模型
const mapPointSchema = new mongoose.Schema({
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

const MapPoint = mongoose.model('MapPoint', mapPointSchema, 'map_points');

// 示例数据
const sampleData = [
  { 
    title: '迷人的风景：建设他的留言因为部门政府计划需要', 
    author: '倪瑜', 
    location: { 
      type: 'Point', 
      coordinates: [ 105.17603045237513, 27.704558102951587 ] 
    }, 
    likes: 273, 
    category: '热门资源',
    address: '贵州省遵义市',
    description: '这是一个美丽的风景区，值得一游'
  }, 
  { 
    title: '独特的建筑：投资文件参加', 
    author: '周玉英', 
    location: { type: 'Point', coordinates: [ 110.54895699237717, 18 ] }, 
    likes: 141, 
    category: '展会活动',
    address: '海南省海口市',
    description: '这里有一个独特的建筑展览'
  }, 
  { 
    title: '美丽的乡村：系列国际次数游戏', 
    author: '严海燕', 
    location: { 
      type: 'Point', 
      coordinates: [ 119.57661073248477, 21.855971958351077 ] 
    }, 
    likes: 381, 
    category: '个人活动',
    address: '福建省厦门市',
    description: '这是一个美丽的乡村点'
  }
];

// 清空并重新插入数据
async function initDb() {
  try {
    // 清空集合
    await MapPoint.deleteMany({});
    console.log('已清空集合');
    
    // 插入示例数据
    await MapPoint.insertMany(sampleData);
    console.log(`已插入${sampleData.length}条示例数据`);
    
    console.log('数据库初始化成功');
  } catch (error) {
    console.error('初始化数据库失败:', error);
  } finally {
    // 关闭连接
    mongoose.connection.close();
  }
}

// 执行初始化
initDb();

// 添加成都附近的示例数据
const chengduData = [
  { 
    title: '成都锦里古街', 
    author: '张三', 
    location: { 
      type: 'Point', 
      coordinates: [104.0652, 30.5728] // 成都锦里古街附近
    }, 
    likes: 520, 
    category: '热门资源',
    address: '四川省成都市武侯区',
    description: '锦里古街是成都著名的商业步行街'
  },
  { 
    title: '成都环球中心', 
    author: '李四', 
    location: { 
      type: 'Point', 
      coordinates: [104.0668, 30.5684] // 成都环球中心附近
    }, 
    likes: 380, 
    category: '展会活动',
    address: '四川省成都市武侯区',
    description: '成都环球中心是世界最大单体建筑之一'
  },
  { 
    title: '成都宽窄巷子', 
    author: '王五', 
    location: { 
      type: 'Point', 
      coordinates: [104.0665, 30.6727] // 成都宽窄巷子附近
    }, 
    likes: 450, 
    category: '个人活动',
    address: '四川省成都市青羊区',
    description: '宽窄巷子是成都保存最完整的清朝古街道'
  }
];

// 将成都数据添加到示例数据中
sampleData.push(...chengduData);