import express from 'express';
import { body } from 'express-validator';
import EnergyController from '../controllers/EnergyController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

// 应用认证中间件到所有路由
router.use(authMiddleware);

// 常量定义
const ENERGY_TYPES = {
  ELECTRICITY: 'electricity',
  GAS: 'gas',
  WATER: 'water',
  STEAM: 'steam',
  COMPRESSED_AIR: 'compressed_air'
};

const ENERGY_UNITS = {
  KWH: 'kWh',
  MWH: 'MWh',
  CUBIC_METER: 'm³',
  LITER: 'L',
  KILOGRAM: 'kg',
  TON: 't'
};

// 验证规则
const energyDataValidation = [
  body('device_id').notEmpty().withMessage('设备ID不能为空'),
  body('energy_type').isIn(Object.values(ENERGY_TYPES)).withMessage('能源类型无效'),
  body('consumption').isFloat({ min: 0 }).withMessage('能耗值必须是非负数'),
  body('unit').isIn(Object.values(ENERGY_UNITS)).withMessage('单位无效'),
  body('timestamp').optional().isISO8601().withMessage('时间戳格式无效')
];

const batchEnergyDataValidation = [
  body('records').isArray().withMessage('记录列表必须是数组'),
  body('records.*.device_id').notEmpty().withMessage('设备ID不能为空'),
  body('records.*.energy_type').isIn(Object.values(ENERGY_TYPES)).withMessage('能源类型无效'),
  body('records.*.consumption').isFloat({ min: 0 }).withMessage('能耗值必须是非负数'),
  body('records.*.unit').isIn(Object.values(ENERGY_UNITS)).withMessage('单位无效')
];



// 获取能耗数据列表
router.get('/', EnergyController.getEnergyData);

// 获取单个能耗记录
router.get('/:id', EnergyController.getEnergyDataById);

// 创建能耗数据记录
router.post(
  '/',
  requireRole(['admin', 'operator']),
  energyDataValidation,
  EnergyController.createEnergyData
);

// 批量创建能耗数据
router.post(
  '/batch',
  requireRole(['admin', 'operator']),
  batchEnergyDataValidation,
  EnergyController.createBatchEnergyData
);

// 获取能耗统计数据
router.get('/stats/summary', EnergyController.getEnergyStatistics);

// 获取设备能耗排行
router.get('/stats/ranking', EnergyController.getDeviceRanking);

// 获取能耗趋势数据
router.get('/stats/trend', EnergyController.getEnergyTrend);

// 删除能耗数据记录
router.delete('/:id', requireRole(['admin']), EnergyController.deleteEnergyData);

// 导出能耗数据
router.get('/export/csv', EnergyController.exportEnergyData);

export default router;
