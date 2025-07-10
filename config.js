const config = {
  appid: 'xxx', // 小程序 appId
  secret: 'xxx', // 小程序 secret
  serviceApi: 'http://127.0.0.1:3000', // 服务器地址
  mongodbUrl: 'mongodb://localhost:27017/mall-cook', // mongodb 数据库地址，格式：mongodb://username:password@host:port/name
  jwtSecret: 'secret' // JWT 密钥
}

module.exports = config