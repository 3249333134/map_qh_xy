const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');

// 获取地图点位数据
router.get('/map-data', mapController.getMapPoints);

module.exports = router;