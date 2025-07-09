/**
 * 边缘计算路由配置
 * 定义边缘计算功能的API路由
 */

import express from 'express';
import EdgeComputingController from '../controllers/EdgeComputingController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import validationMiddleware from '../middleware/validationMiddleware.js';
import rateLimitMiddleware from '../middleware/rateLimitMiddleware.js';
import cacheMiddleware from '../middleware/cacheMiddleware.js';
import logger from '../../../shared/utils/logger.js';

const router = express.Router();
const edgeComputingController = new EdgeComputingController();

// 应用中间件
router.use(authMiddleware.authenticate);
router.use(rateLimitMiddleware({ windowMs: 60000, max: 100 })); // 每分钟100次请求

// 验证规则
const nodeValidationRules = {
  id: { required: true, type: 'string', minLength: 3, maxLength: 50 },
  name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
  type: { required: true, type: 'string', enum: ['primary', 'secondary', 'backup'] },
  location: { required: true, type: 'string', minLength: 2, maxLength: 100 },
  capabilities: { required: true, type: 'array', minItems: 1 },
  resources: {
    required: true,
    type: 'object',
    properties: {
      cpu: { required: true, type: 'number', min: 1, max: 128 },
      memory: { required: true, type: 'number', min: 1024, max: 1048576 },
      storage: { required: true, type: 'number', min: 10240, max: 10485760 },
      gpu: { type: 'boolean' }
    }
  }
};

const deviceValidationRules = {
  id: { required: true, type: 'string', minLength: 3, maxLength: 50 },
  name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
  type: { required: true, type: 'string', enum: ['energy-meter', 'temperature-sensor', 'air-quality-sensor', 'humidity-sensor', 'pressure-sensor', 'flow-meter', 'vibration-sensor', 'camera', 'actuator'] },
  location: { required: true, type: 'string', minLength: 2, maxLength: 100 },
  capabilities: { type: 'array' }
};

const processDataValidationRules = {
  data: { required: true, type: 'object' },
  processorId: { required: true, type: 'string', enum: ['carbon-emission', 'anomaly-detection', 'energy-optimization'] },
  nodeId: { type: 'string' }
};

// 服务状态和健康检查
router.get('/status', 
  cacheMiddleware({ ttl: 30 }), // 缓存30秒
  edgeComputingController.getServiceStatus.bind(edgeComputingController)
);

router.get('/health', 
  cacheMiddleware({ ttl: 10 }), // 缓存10秒
  edgeComputingController.healthCheck.bind(edgeComputingController)
);

// 边缘节点管理
router.get('/nodes', 
  cacheMiddleware({ ttl: 60 }), // 缓存1分钟
  edgeComputingController.getEdgeNodes.bind(edgeComputingController)
);

router.get('/nodes/:nodeId', 
  cacheMiddleware({ ttl: 30 }),
  edgeComputingController.getEdgeNodeDetails.bind(edgeComputingController)
);

router.post('/nodes', 
  validationMiddleware(nodeValidationRules),
  edgeComputingController.registerEdgeNode.bind(edgeComputingController)
);

router.post('/nodes/:nodeId/start', 
  edgeComputingController.startEdgeNode.bind(edgeComputingController)
);

router.post('/nodes/:nodeId/stop', 
  edgeComputingController.stopEdgeNode.bind(edgeComputingController)
);

router.get('/nodes/:nodeId/metrics', 
  cacheMiddleware({ ttl: 30 }),
  edgeComputingController.getNodeMetrics.bind(edgeComputingController)
);

// 设备管理
router.get('/devices', 
  cacheMiddleware({ ttl: 60 }),
  edgeComputingController.getConnectedDevices.bind(edgeComputingController)
);

router.get('/devices/:deviceId', 
  cacheMiddleware({ ttl: 30 }),
  edgeComputingController.getDeviceDetails.bind(edgeComputingController)
);

router.post('/devices', 
  validationMiddleware(deviceValidationRules),
  edgeComputingController.connectDevice.bind(edgeComputingController)
);

router.delete('/devices/:deviceId', 
  edgeComputingController.disconnectDevice.bind(edgeComputingController)
);

router.get('/devices/:deviceId/metrics', 
  cacheMiddleware({ ttl: 30 }),
  edgeComputingController.getDeviceMetrics.bind(edgeComputingController)
);

// 数据处理
router.post('/process', 
  validationMiddleware(processDataValidationRules),
  edgeComputingController.processData.bind(edgeComputingController)
);

router.get('/processors/stats', 
  cacheMiddleware({ ttl: 60 }),
  edgeComputingController.getProcessorStats.bind(edgeComputingController)
);

// 云端同步
router.post('/sync', 
  edgeComputingController.performCloudSync.bind(edgeComputingController)
);

router.get('/offline-queue', 
  cacheMiddleware({ ttl: 30 }),
  edgeComputingController.getOfflineQueueStatus.bind(edgeComputingController)
);

// 错误处理中间件
router.use((error, req, res, next) => {
  logger.error('边缘计算路由错误', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  res.status(500).json({
    success: false,
    message: '边缘计算服务内部错误',
    error: process.env.NODE_ENV === 'development' ? error.message : '服务暂时不可用'
  });
});

export default router;