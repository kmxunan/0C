const express = require('express');
const router = express.Router();

// 导入设备路由
const devicesRouter = require('./devices');

// 注册设备路由
router.use('/devices', devicesRouter);

module.exports = router;
