import express from 'express';
import { body } from 'express-validator';
import DeviceController from '../controllers/DeviceController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

// 应用认证中间件到所有路由
router.use(authMiddleware);

// 常量定义
const DEVICE_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  MAINTENANCE: 'maintenance',
  ERROR: 'error'
};

const DEVICE_TYPES = {
  SENSOR: 'sensor',
  ACTUATOR: 'actuator',
  CONTROLLER: 'controller',
  GATEWAY: 'gateway'
};

// 验证规则
const deviceValidation = [
  body('name').notEmpty().withMessage('设备名称不能为空'),
  body('type').isIn(Object.values(DEVICE_TYPES)).withMessage('设备类型无效'),
  body('serial_number').optional().isLength({ min: 3 }).withMessage('序列号至少3位'),
  body('location').optional().isString().withMessage('位置必须是字符串'),
  body('status').optional().isIn(Object.values(DEVICE_STATUS)).withMessage('设备状态无效')
];

const batchUpdateValidation = [
  body('device_ids').isArray().withMessage('设备ID列表必须是数组'),
  body('device_ids.*').isInt().withMessage('设备ID必须是整数'),
  body('status').isIn(Object.values(DEVICE_STATUS)).withMessage('设备状态无效')
];

// 获取设备列表
router.get('/', DeviceController.getDevices);

// 获取单个设备详情
router.get('/:id', DeviceController.getDevice);

// 创建新设备
router.post(
  '/',
  authMiddleware.authenticate,
  requireRole(['admin', 'operator']),
  deviceValidation,
  DeviceController.createDevice
);

// 更新设备信息
router.put(
  '/:id',
  authMiddleware.authenticate,
  requireRole(['admin', 'operator']),
  deviceValidation,
  DeviceController.updateDevice
);

// 删除设备
router.delete(
  '/:id',
  authMiddleware.authenticate,
  requireRole(['admin']),
  DeviceController.deleteDevice
);

// 获取设备类型列表
router.get('/types/list', DeviceController.getDeviceTypes);

// 获取设备状态统计
router.get('/stats/status', DeviceController.getDeviceStatusStats);

// 获取设备类型统计
router.get('/stats/types', DeviceController.getDeviceTypeStats);

// 批量更新设备状态
router.patch(
  '/batch/status',
  authMiddleware.authenticate,
  requireRole(['admin', 'operator']),
  batchUpdateValidation,
  DeviceController.batchUpdateStatus
);

// 设备健康检查
router.get('/:id/health', DeviceController.healthCheck);

export default router;
