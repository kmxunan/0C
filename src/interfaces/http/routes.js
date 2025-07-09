/* eslint-disable no-console */
/**
 * 主路由文件 - 重构后的模块化版本
 * 整合所有子路由模块
 */

import express from 'express';
import responseFormatter from './middleware/responseFormatter.js';
import { authenticate } from './middleware/authMiddleware.js';

// 导入模块化路由
import authRoutes from './routes/auth.js';
import deviceRoutes from './routes/devices.js';
import energyRoutes from './routes/energy.js';
import carbonRoutes from './routes/carbon.js';
import maintenanceRoutes from './routes/maintenance.js';
import digitalTwinRoutes from './routes/digital-twin.js';
import vppRoutes from '../../routes/vppRoutes.js';
import vppTradingStrategyRoutes from '../../routes/vppTradingStrategy.js';
import vppResourceRoutes from '../../routes/vppResourceRoutes.js';
import vppTradingRoutes from '../../routes/vppTradingRoutes.js';

const router = express.Router();

// 应用响应格式化中间件
router.use(responseFormatter);

// API根路径信息
router.get('/', (req, res) => {
  res.success({
    message: '零碳园区数字孪生能碳管理系统 API',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/auth',
      devices: '/devices',
      energy: '/energy',
      carbon: '/carbon',
      maintenance: '/maintenance',
      digitalTwin: '/digital-twin',
      vpp: '/vpp',
      vppTradingStrategy: '/vpp/trading-strategy',
      vppResource: '/vpp/resource',
      vppTrading: '/vpp/trading'
    }
  });
});

// 健康检查端点
router.get('/health', (req, res) => {
  res.healthCheck({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '2.0.0'
  });
});

// API版本信息
router.get('/version', (req, res) => {
  res.success({
    version: '2.0.0',
    apiVersion: 'v1',
    buildDate: new Date().toISOString(),
    features: [
      'modular-architecture',
      'enhanced-security',
      'improved-validation',
      'better-error-handling',
      'comprehensive-logging'
    ]
  });
});

// 挂载子路由
router.use('/auth', authRoutes);
router.use('/devices', authenticate, deviceRoutes);
router.use('/energy', authenticate, energyRoutes);
router.use('/carbon', authenticate, carbonRoutes);
router.use('/maintenance', authenticate, maintenanceRoutes);
router.use('/digital-twin', authenticate, digitalTwinRoutes);
router.use('/vpp', authenticate, vppRoutes);
router.use('/vpp/trading-strategy', authenticate, vppTradingStrategyRoutes);
router.use('/vpp/resource', authenticate, vppResourceRoutes);
router.use('/vpp/trading', authenticate, vppTradingRoutes);

// 404处理
router.use('*', (req, res) => {
  res.notFound('API端点不存在', {
    requestedPath: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /version',
      'POST /auth/login',
      'POST /auth/register',
      'GET /devices',
      'GET /energy',
      'GET /carbon',
      'GET /maintenance',
      'GET /digital-twin',
      'GET /vpp',
      'GET /vpp/resource',
      'GET /vpp/trading'
    ]
  });
});

// 全局错误处理中间件
router.use((error, req, res, _next) => {
  console.error(`[${new Date().toISOString()}] Global Error Handler:`, {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    user: req.user?.username || 'anonymous',
    body: req.body,
    params: req.params,
    query: req.query
  });

  // 根据错误类型返回相应的响应
  if (error.name === 'ValidationError') {
    return res.validationError('数据验证失败', error.details);
  } else if (error.name === 'UnauthorizedError') {
    return res.unauthorized(error.message);
  } else if (error.name === 'ForbiddenError') {
    return res.forbidden(error.message);
  } else if (error.name === 'NotFoundError') {
    return res.notFound(error.message);
  } else if (error.name === 'ConflictError') {
    return res.conflict(error.message);
  } else if (error.name === 'TooManyRequestsError') {
    return res.tooManyRequests(error.message);
  } 
  return res.internalError('服务器内部错误', error);
  
});

export default router;
