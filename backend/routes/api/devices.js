import express from 'express';
const router = express.Router();
import * as DeviceController from '../../../src/controllers/deviceController.js';
import { authenticateToken } from '../../../src/auth/jwtManager.js';

// 获取所有设备列表
router.get('/', authenticateToken, DeviceController.getDevices);

// 获取单个设备详情
router.get('/:id', authenticateToken, DeviceController.getDeviceById);

// 创建新设备
router.post('/', authenticateToken, DeviceController.createDevice);

// 更新设备信息
router.put('/:id', authenticateToken, DeviceController.updateDevice);

// 删除设备
router.delete('/:id', authenticateToken, DeviceController.deleteDevice);

export default router;