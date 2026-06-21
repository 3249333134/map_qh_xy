import { APP_CONFIG, getApiUrl } from './config.js'

// API配置
export const MONGO_CONFIG = {
  //API_URL: "http://localhost:3000/api/map-data",  // 修改为本地后端API地址
  API_URL: getApiUrl('MAP_DATA'),  // 使用统一配置
  DB_NAME: APP_CONFIG.DATABASE.NAME,
  COLLECTION_NAME: APP_CONFIG.DATABASE.COLLECTION_NAME
}