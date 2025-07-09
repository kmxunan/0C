import express from 'express';
const router = express.Router();
import * as DeviceController from '../../../src/interfaces/http/deviceController.js';
import { authenticateToken } from '../../../src/core/services/jwtManager.js';
import { checkPermission, roles } from '../../../src/core/services/permission.js';

// 获取所有设备列表
router.get('/', authenticateToken(), DeviceController.getDevices);

// 获取单个设备详情
router.get(
  '/:id',
  authenticateToken(),
  checkPermission(roles.ENERGY_MANAGER),
  DeviceController.getDeviceById
);

// 创建新设备
router.post('/', authenticateToken(), checkPermission(roles.ADMIN), DeviceController.createDevice);

// 更新设备信息
router.put(
  '/:id',
  authenticateToken(),
  checkPermission(roles.ADMIN),
  DeviceController.updateDevice
);

// 删除设备
router.delete(
  '/:id',
  authenticateToken(),
  checkPermission(roles.ADMIN),
  DeviceController.deleteDevice
);

export default router;
