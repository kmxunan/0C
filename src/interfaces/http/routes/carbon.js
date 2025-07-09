import express from 'express';
import { body, query } from 'express-validator';
import CarbonController from '../controllers/CarbonController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

// 应用认证中间件到所有路由
router.use(authMiddleware);

// 常量定义
const CARBON_CONSTANTS = {
  MAX_RECORDS_PER_PAGE: 1000,
  DEFAULT_PAGE_SIZE: 50,
  ENERGY_TYPES: ['electricity', 'gas', 'water', 'steam', 'compressed_air'],
  CALCULATION_METHODS: ['direct', 'indirect', 'lifecycle'],
  EMISSION_SCOPES: ['scope1', 'scope2', 'scope3'],
  REPORT_TYPES: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
  MAX_DATE_RANGE_DAYS: 365
};

// 验证规则（暂时保留以备后续使用）
const _carbonEmissionValidation = [
  body('deviceId').optional().isMongoId().withMessage('设备ID格式无效'),
  body('energyType').isIn(CARBON_CONSTANTS.ENERGY_TYPES).withMessage('能源类型无效'),
  body('energyConsumption').isNumeric().withMessage('能耗值必须是数字'),
  body('carbonEmission').isNumeric().withMessage('碳排放值必须是数字'),
  body('calculationMethod').isIn(CARBON_CONSTANTS.CALCULATION_METHODS).withMessage('计算方法无效'),
  body('emissionScope').isIn(CARBON_CONSTANTS.EMISSION_SCOPES).withMessage('排放范围无效'),
  body('timestamp').isISO8601().withMessage('时间戳格式无效')
];

const _carbonFactorValidation = [
  body('energyType').isIn(CARBON_CONSTANTS.ENERGY_TYPES).withMessage('能源类型无效'),
  body('factor').isNumeric().withMessage('碳排放因子必须是数字'),
  body('unit').notEmpty().withMessage('单位不能为空'),
  body('region').optional().isString().withMessage('地区必须是字符串'),
  body('validFrom').isISO8601().withMessage('生效日期格式无效'),
  body('validTo').optional().isISO8601().withMessage('失效日期格式无效')
];

const _queryValidation = [
  query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
  query('deviceId').optional().isMongoId().withMessage('设备ID格式无效'),
  query('energyType').optional().isIn(CARBON_CONSTANTS.ENERGY_TYPES).withMessage('能源类型无效'),
  query('emissionScope')
    .optional()
    .isIn(CARBON_CONSTANTS.EMISSION_SCOPES)
    .withMessage('排放范围无效')
];

// 获取碳排放数据列表
router.get('/', CarbonController.getCarbonEmissions);

// 获取单个碳排放记录
router.get('/:id', CarbonController.getCarbonEmission);

// 创建碳排放数据记录
router.post('/', requireRole(['admin', 'operator']), CarbonController.createCarbonEmission);

// 基于能耗数据计算碳排放
router.post(
  '/calculate',
  requireRole(['admin', 'operator']),
  CarbonController.calculateCarbonEmissions
);

// 获取碳排放统计数据
router.get('/stats/summary', CarbonController.getCarbonStats);

// 获取碳排放趋势数据
router.get('/stats/trend', CarbonController.getCarbonTrend);

// 获取碳排放因子列表
router.get('/factors/list', CarbonController.getCarbonFactors);

// 创建碳排放因子
router.post('/factors', requireRole(['admin']), CarbonController.createCarbonFactor);

// 更新碳排放因子
router.put('/factors/:id', requireRole(['admin']), CarbonController.updateCarbonFactor);

// 生成碳排放报告
router.post(
  '/reports/generate',
  requireRole(['admin', 'operator']),
  CarbonController.generateCarbonReport
);

// 导出碳排放数据
router.get('/export/csv', CarbonController.exportCarbonData);

// 删除碳排放数据记录
router.delete('/:id', requireRole(['admin']), CarbonController.deleteCarbonEmission);

export default router;
