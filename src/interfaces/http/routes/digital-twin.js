import express from 'express';
import DigitalTwinController from '../controllers/DigitalTwinController.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// 获取数字孪生列表
router.get('/', DigitalTwinController.getDigitalTwins);

// 获取单个数字孪生
router.get('/:id', DigitalTwinController.getDigitalTwin);

// 创建数字孪生
router.post('/', requireRole(['admin', 'operator']), DigitalTwinController.createDigitalTwin);

// 更新数字孪生
router.put('/:id', requireRole(['admin', 'operator']), DigitalTwinController.updateDigitalTwin);

// 删除数字孪生
router.delete('/:id', requireRole(['admin']), DigitalTwinController.deleteDigitalTwin);

// 获取数字孪生实时数据
router.get('/:id/realtime', DigitalTwinController.getDigitalTwinRealTimeData);

// 更新数字孪生状态
router.put(
  '/:id/status',
  requireRole(['admin', 'operator']),
  DigitalTwinController.updateDigitalTwinStatus
);

// 获取数字孪生模拟数据
router.get('/:id/simulation', DigitalTwinController.getDigitalTwinSimulationData);

// 运行数字孪生模拟
router.post(
  '/:id/simulation/run',
  requireRole(['admin', 'operator']),
  DigitalTwinController.runDigitalTwinSimulation
);

// 获取数字孪生统计数据
router.get('/stats/summary', DigitalTwinController.getDigitalTwinStats);

// 同步数字孪生数据
router.post(
  '/:id/sync',
  requireRole(['admin', 'operator']),
  DigitalTwinController.syncDigitalTwinData
);

// 获取数字孪生性能指标
router.get('/:id/performance', DigitalTwinController.getDigitalTwinPerformance);

// 导出数字孪生数据
router.get('/export/csv', DigitalTwinController.exportDigitalTwinData);

export default router;
