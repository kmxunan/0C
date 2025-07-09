import express from 'express';
import { body, query } from 'express-validator';
import MaintenanceController from '../controllers/MaintenanceController.js';
import { requireRole } from '../middleware/auth.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// 应用认证中间件到所有路由
router.use(authMiddleware);

// 常量定义
const MAINTENANCE_CONSTANTS = {
  MAX_RECORDS_PER_PAGE: 100,
  DEFAULT_PAGE_SIZE: 20,
  MAINTENANCE_TYPES: ['preventive', 'corrective', 'emergency', 'upgrade'],
  MAINTENANCE_STATUS: ['scheduled', 'in_progress', 'completed', 'cancelled', 'overdue'],
  PRIORITY_LEVELS: ['low', 'medium', 'high', 'critical'],
  PLAN_FREQUENCIES: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
  MAX_DATE_RANGE_DAYS: 365
};

// 验证规则（暂时保留以备后续使用）
const _maintenanceRecordValidation = [
  body('deviceId').isMongoId().withMessage('设备ID格式无效'),
  body('maintenanceType').isIn(MAINTENANCE_CONSTANTS.MAINTENANCE_TYPES).withMessage('维护类型无效'),
  body('priority').isIn(MAINTENANCE_CONSTANTS.PRIORITY_LEVELS).withMessage('优先级无效'),
  body('scheduledDate').isISO8601().withMessage('计划日期格式无效'),
  body('description').notEmpty().withMessage('描述不能为空'),
  body('estimatedDuration').optional().isNumeric().withMessage('预计时长必须是数字'),
  body('assignedTo').optional().isString().withMessage('分配给必须是字符串')
];

const _maintenancePlanValidation = [
  body('deviceId').isMongoId().withMessage('设备ID格式无效'),
  body('planName').notEmpty().withMessage('计划名称不能为空'),
  body('maintenanceType').isIn(MAINTENANCE_CONSTANTS.MAINTENANCE_TYPES).withMessage('维护类型无效'),
  body('frequency').isIn(MAINTENANCE_CONSTANTS.PLAN_FREQUENCIES).withMessage('频率无效'),
  body('description').notEmpty().withMessage('描述不能为空'),
  body('estimatedDuration').optional().isNumeric().withMessage('预计时长必须是数字'),
  body('isActive').optional().isBoolean().withMessage('激活状态必须是布尔值')
];

const _queryValidation = [
  query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
  query('deviceId').optional().isMongoId().withMessage('设备ID格式无效'),
  query('maintenanceType')
    .optional()
    .isIn(MAINTENANCE_CONSTANTS.MAINTENANCE_TYPES)
    .withMessage('维护类型无效'),
  query('status').optional().isIn(MAINTENANCE_CONSTANTS.MAINTENANCE_STATUS).withMessage('状态无效'),
  query('priority')
    .optional()
    .isIn(MAINTENANCE_CONSTANTS.PRIORITY_LEVELS)
    .withMessage('优先级无效')
];

// 获取维护记录列表
router.get('/', MaintenanceController.getMaintenanceRecords);

// 获取单个维护记录详情
router.get('/:id', MaintenanceController.getMaintenanceRecord);

// 创建维护记录
router.post('/', requireRole(['admin', 'operator']), MaintenanceController.createMaintenanceRecord);

// 更新维护记录
router.put(
  '/:id',
  requireRole(['admin', 'operator']),
  MaintenanceController.updateMaintenanceRecord
);

// 删除维护记录
router.delete('/:id', requireRole(['admin']), MaintenanceController.deleteMaintenanceRecord);

// 获取维护计划
router.get('/schedule', MaintenanceController.getMaintenanceSchedule);

// 完成维护任务
router.put(
  '/:id/complete',
  requireRole(['admin', 'operator']),
  MaintenanceController.completeMaintenance
);

// 获取设备维护历史
router.get('/device/:deviceId/history', MaintenanceController.getDeviceMaintenanceHistory);

// 导出维护记录
router.get('/export/csv', MaintenanceController.exportMaintenanceRecords);

// 获取维护统计数据
router.get('/stats/summary', MaintenanceController.getMaintenanceStats);

export default router;
