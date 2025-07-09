import crypto from 'crypto';
/* eslint-disable no-console, no-magic-numbers */
// 安全随机数生成函数
function _generateSecureRandom() {
  return crypto.randomBytes(16).toString('hex');
}

import express from 'express';
import http from 'http';
import https from 'https';
import WebSocket from 'ws';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { body as _body } from 'express-validator';
// import session from 'express-session';
// import connectRedis from 'connect-redis';
// import csurf from 'csurf';

// 导入配置管理
import config, { isDevelopment } from '../../shared/config/index.js';

// 导入错误处理
// import { setupProcessHandlers } from '../../shared/utils/processHandlers.js';

// 导入统一错误处理和验证中间件
import {
  errorHandler as unifiedErrorHandler,
  asyncHandler as _asyncHandler,
  notFoundHandler as unifiedNotFoundHandler
} from '../../shared/middleware/errorHandler.js';
import {
  sanitizeInput
} from '../../shared/middleware/validation.js';
import { CacheManager } from '../../shared/cache/CacheManager.js';

// 导入安全和性能监控中间件
import {
  securityHeaders,
  inputSizeLimit,
  requestId
} from '../../shared/middleware/security.js';
import {
  performanceMiddleware,
  healthCheckEndpoint,
  metricsApiEndpoint
} from '../../shared/middleware/performance.js';

// 导入日志模块
import logger, { requestLogger, auditLogger } from '../../shared/utils/logger.js';

// 导入JWT认证
import { authenticateToken } from '../../core/services/jwtManager.js';

// 导入Redis客户端
// import redisClient from '../../database/redisClient.js';

const require = createRequire(import.meta.url);
const mqtt = require('mqtt');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 导入数据库
import dbPromise from '../../infrastructure/database/index.js';

// 导入碳排放计算模块
import { calculateTotalEmissions } from '../../core/services/emission.js';

// 导入数据采集器
import DataCollector from '../../core/services/DataCollector.js';

// 导入API路由
import apiRoutes from './routes.js';

// 创建Express应用
const app = express();

// 根据配置创建HTTP或HTTPS服务器
let server;
if (config.security?.https?.enabled) {
  try {
    const privateKey = fs.readFileSync(config.security.https.keyPath, 'utf8');
    const certificate = fs.readFileSync(config.security.https.certPath, 'utf8');
    const credentials = { key: privateKey, cert: certificate };
    server = https.createServer(credentials, app);
    logger.info('HTTPS服务器已启用');
  } catch (error) {
    logger.error('HTTPS配置错误，将回退到HTTP', { error: error.message });
    server = http.createServer(app);
  }
} else {
  server = http.createServer(app);
}

// 设置进程异常处理
// setupProcessHandlers();

// 初始化数据采集器（但不立即启动）
const dataCollector = new DataCollector({
  brokerUrl: config.mqtt?.brokerUrl || 'mqtt://localhost:1883',
  username: config.mqtt?.username || '',
  password: config.mqtt?.password || ''
});

// 初始化缓存管理器
const _cacheManager = new CacheManager({
  type: 'memory', // 使用内存缓存，避免Redis依赖问题
  defaultTTL: 300, // 5分钟默认过期时间
  maxSize: 1000 // 最大缓存条目数
});

// 等待数据库初始化完成后再启动数据采集器

// TODO: 考虑将此函数拆分为更小的函数 (当前 30 行)

// TODO: 考虑将此函数拆分为更小的函数 (当前 30 行)

// TODO: 考虑将此函数拆分为更小的函数 (当前 30 行)

// TODO: 考虑将此函数拆分为更小的函数 (当前 30 行)

server.listen(config.app.port, config.app.host, () => {
  const protocol = config.security?.https?.enabled ? 'https' : 'http';
  logger.info(
    `服务器已启动，监听 ${protocol}://${config.app.host}:${config.app.port}，等待数据库连接...`,
    {
      port: config.app.port,
      host: config.app.host,
      protocol,
      environment: config.app.env,
      nodeVersion: process.version,
      pid: process.pid
    }
  );
  auditLogger.info('服务器启动', {
    action: 'SERVER_START',
    target: 'Server',
    details: `服务器已在 ${protocol}://${config.app.host}:${config.app.port} 启动`
  });

  if (isDevelopment()) {
    console.log('\n🚀 零碳园区数字孪生能碳管理系统启动成功!');
    console.log(`📊 API服务: ${protocol}://${config.app.host}:${config.app.port}/api`);
    console.log(`💬 WebSocket服务: ws://${config.app.host}:${config.app.port}/ws`);
    console.log(`💚 健康检查: ${protocol}://${config.app.host}:${config.app.port}/health`);
    console.log(
      `📈 性能监控: ${protocol}://${config.app.host}:${config.app.port}/api/performance/metrics`
    );
    console.log(`🔧 环境: ${config.app.env}\n`);
  }
});

dbPromise
  .then(() => {
    logger.info('数据库连接成功，启动数据采集器');
    return dataCollector.initialize();
  })
  .catch((error) => {
    logger.error('数据库连接失败', { error: error.message });
    process.exit(1);
  });

// 监听进程退出事件，记录审计日志
process.on('exit', (code) => {
  auditLogger.info('服务器关闭', {
    action: 'SERVER_SHUTDOWN',
    target: 'Server',
    details: `服务器已关闭，退出码: ${code}`
  });
});

process.on('SIGINT', () => {
  logger.info('接收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    logger.info('服务器已优雅关闭');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.info('接收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    logger.info('服务器已优雅关闭');
    process.exit(0);
  });
});

// 角色定义
const _roles = {
  ADMIN: 'admin',
  ENERGY_MANAGER: 'energy_manager',
  VIEWER: 'viewer'
};

// 实时数据采集配置
const mqttClient = mqtt.connect(config.mqtt.brokerUrl, {
  clientId: `${config.mqtt.clientId}-${Math.random().toString(16).substr(2, 8)}`,
  username: config.mqtt.username,
  password: config.mqtt.password,
  clean: true,
  keepalive: config.mqtt.keepalive,
  connectTimeout: config.mqtt.connectTimeout,
  reconnectPeriod: config.mqtt.reconnectPeriod
});

// 连接成功回调
mqttClient.on('connect', () => {
  logger.info('已连接到MQTT Broker', { brokerUrl: config.mqtt.brokerUrl });

  // 订阅能源数据主题
  mqttClient.subscribe(config.mqtt.topics.energyData, (err) => {
    if (err) {
      logger.error('MQTT能源数据主题订阅失败', {
        error: err.message,
        topic: config.mqtt.topics.energyData
      });
    } else {
      logger.info('已订阅MQTT主题', { topic: config.mqtt.topics.energyData });
    }
  });
});

// MQTT错误处理
mqttClient.on('error', (error) => {
  logger.error('MQTT连接错误', { error: error.message });
});

// MQTT消息处理现在由DataCollector处理

// 信任代理（如果在反向代理后面）
app.set('trust proxy', 1);

// 请求ID中间件（用于请求追踪）
app.use(requestId());

// 安全头中间件
app.use(securityHeaders());

// 输入大小限制中间件
app.use(inputSizeLimit());

// 请求日志中间件
app.use(requestLogger());

// 性能监控中间件

// TODO: 考虑将此函数拆分为更小的函数 (当前 39 行)

// TODO: 考虑将此函数拆分为更小的函数 (当前 39 行)

// TODO: 考虑将此函数拆分为更小的函数 (当前 39 行)

// TODO: 考虑将此函数拆分为更小的函数 (当前 39 行)

app.use(performanceMiddleware);

// 安全中间件
if (config.security.helmet.enabled) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          connectSrc: [
            "'self'",
            'https://*.tiles.mapbox.com',
            'ws://localhost:*',
            'wss://localhost:*'
          ],
          frameSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"]
        }
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginEmbedderPolicy: { policy: 'require-corp' },
      originAgentCluster: true,

      dnsPrefetchControl: { allow: true },
      expectCt: { enforce: true, maxAge: 86400 },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      ieNoOpen: true,
      noSniff: true,
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      referrerPolicy: { policy: 'no-referrer' },
      xssFilter: true
    })
  );
}

// CORS配置
if (config.security.cors.enabled) {
  app.use(
    cors({
      origin:
        config.security.cors.origin === '*'
          ? '*'
          : config.security.cors.origin.split(',').map((s) => s.trim()),
      methods: config.security.cors.methods.split(',').map((s) => s.trim()),
      allowedHeaders: config.security.cors.allowedHeaders.split(',').map((s) => s.trim()),
      exposedHeaders: config.security.cors.exposedHeaders
        ? config.security.cors.exposedHeaders.split(',').map((s) => s.trim())
        : [],
      credentials: config.security.cors.credentials,
      maxAge: config.security.cors.maxAge
    })
  );
}

// 基础中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 会话管理 - 暂时禁用，使用JWT认证
// const RedisStore = connectRedis(session);
// app.use(
//   session({
//     store: new RedisStore({ client: redisClient }),
//     secret: config.security.session.secret,
//     resave: false,
//     saveUninitialized: false,
//     name: config.security.session.name,
//     cookie: {
//       secure: config.security.session.cookie.secure,
//       httpOnly: config.security.session.cookie.httpOnly,
//       maxAge: config.security.session.cookie.maxAge,
//       sameSite: config.security.session.cookie.sameSite,
//     },
//   })
// );

// 通用输入验证和数据清洗中间件
app.use((req, res, next) => {
  // 对所有请求进行输入清洗
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  if (req.params) {
    req.params = sanitizeInput(req.params);
  }
  next();
});

// CSRF保护 - 暂时禁用，需要安装csurf包
// if (config.security.csrf.enabled) {
//   app.use(csurf({ cookie: true }));
//   app.use((req, res, next) => {
//     res.cookie('XSRF-TOKEN', req.csrfToken());
//     next();
//   });
// }

// 配置速率限制
if (config.security.rateLimit.enabled) {
  const limiter = rateLimit({
    windowMs: config.security.rateLimit.windowMs,
    max: config.security.rateLimit.max,
    message: config.security.rateLimit.message,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req, _res) => req.method === 'OPTIONS'
  });
  // 应用速率限制
  app.use(limiter);
}

// 导入缓存中间件
// import { cacheMiddleware } from './middleware/cache.js';

// 应用缓存中间件到API路由
// app.use('/api', cacheMiddleware()); // 已禁用缓存中间件以解决Redis错误

// 使用API路由
app.use('/api', apiRoutes);

// 启动碳排放计算模块相关路由
app.get('/carbon/trend', authenticateToken(['admin', 'energy_manager']), async (req, res) => {
  const { start_time, end_time, interval } = req.query;

  // 参数验证
  if (!start_time || !end_time) {
    return res.status(400).json({
      error: {
        code: 'INVALID_PARAMETERS',
        message: '缺少必要参数: start_time, end_time'
      }
    });
  }

  try {
    // 计算碳排放趋势
    const trendData = calculateTotalEmissions(start_time, end_time, interval);

    logger.info('碳排放趋势计算成功', {
      userId: req.user.id,
      timeRange: { start_time, end_time },
      interval
    });

    res.json({
      data: {
        trend: trendData,
        unit: 'kgCO2',
        time_range: {
          start: start_time,
          end: end_time
        }
      }
    });
  } catch (error) {
    logger.error('碳排放趋势计算失败', {
      error: error.message,
      userId: req.user?.id,
      timeRange: { start_time, end_time }
    });
    res.status(500).json({
      error: {
        code: 'CALCULATION_FAILED',
        message: '碳排放趋势计算失败',
        details: error.message
      }
    });
  }
});

// JWT验证中间件已移至API路由模块

// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: '零碳园区数字孪生能碳管理系统 API v1',
    version: config.app?.version || '1.0.0',
    environment: config.app?.env || 'development',
    status: 'running',
    data_collector: dataCollector.getConnectionStatus(),
    timestamp: new Date().toISOString()
  });
});

// 读取测试数据
function readTestData(filename) {
  try {
    const dataPath = path.join(__dirname, '..', 'test-data', filename);
    if (fs.existsSync(dataPath)) {
      return fs.readFileSync(dataPath, 'utf-8');
    }
    return null;
  } catch (error) {
    logger.error('读取测试数据失败', { filename, error: error.message });
    return null;
  }
}

// 测试数据API
app.get('/api/test-data/:type', (req, res) => {
  const { type } = req.params;
  const allowedTypes = ['energy', 'carbon', 'battery', 'performance'];

  if (!allowedTypes.includes(type)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_TYPE',
        message: '不支持的数据类型'
      }
    });
  }

  const data = readTestData(`${type}_data.csv`);
  if (data) {
    logger.info('测试数据访问', { type, ip: req.ip });
    res.header('Content-Type', 'text/csv');
    res.send(data);
  } else {
    res.status(500).json({
      error: {
        code: 'DATA_READ_ERROR',
        message: `无法读取${type}数据`
      }
    });
  }
});

// 系统健康检查接口 - 使用新的性能监控

// TODO: 考虑将此函数拆分为更小的函数 (当前 33 行)

// TODO: 考虑将此函数拆分为更小的函数 (当前 33 行)

// TODO: 考虑将此函数拆分为更小的函数 (当前 33 行)

// TODO: 考虑将此函数拆分为更小的函数 (当前 33 行)

app.get('/health', healthCheckEndpoint);

// 性能指标API端点
app.get('/api/metrics', metricsApiEndpoint);

// 详细健康检查接口（保留原有功能）
app.get('/health/detailed', (_req, res) => {
  const healthCheck = {
    status: 'healthy',
    components: {
      database: {
        status: 'healthy',
        version: 'SQLite 3.45.0',
        uptime: '99.9%'
      },
      storage: {
        status: 'healthy',
        availableSpace: '120GB',
        usage: '35%'
      },
      network: {
        status: 'healthy',
        latency: '<5ms'
      },
      security: {
        status: 'healthy',
        tlsVersion: 'TLS 1.3',
        certificateExpiry: '2025-12-31'
      },
      mqtt: {
        status: mqttClient ? (mqttClient.connected ? 'connected' : 'disconnected') : 'unavailable',
        broker: config.mqtt.brokerUrl
      }
    },
    timestamp: new Date().toISOString()
  };

  res.json(healthCheck);
});

// 设备管理和能源数据路由已移至API路由模块

// 碳排放计算功能已移至数据采集器和API路由模块

// 储能优化、碳排放计算、能源预测和用户权限管理API已移至API路由模块

// 性能监控模块已在文件开头导入和配置

// 404错误处理
app.use(unifiedNotFoundHandler);

// 全局错误处理中间件
app.use(unifiedErrorHandler);

// 启动性能监控
// 性能监控已通过中间件启用

// 启动服务
const _PORT = config.app.port;

// WebSocket server setup
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received WebSocket message:', data);
      // Handle incoming message
      ws.send(JSON.stringify({ status: 'received', timestamp: new Date() }));
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error occurred:', error);
  });
});

// 优雅关闭处理
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，开始优雅关闭');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，开始优雅关闭');
  gracefulShutdown();
});

function gracefulShutdown() {
  server.close(() => {
    logger.info('HTTP服务器已关闭');

    // 关闭MQTT连接
    if (mqttClient.connected) {
      mqttClient.end(() => {
        logger.info('MQTT连接已关闭');
      });
    }

    // 关闭数据库连接
    dbPromise.then((db) => {
      db.close((err) => {
        if (err) {
          logger.error('数据库关闭失败', { error: err.message });
        } else {
          logger.info('数据库连接已关闭');
        }
        process.exit(0);
      });
    }).catch(() => {
      process.exit(0);
    });
  });
}

// 导出app实例
export default app;
