/**
 * 虚拟电厂模块配置文件
 * 集中管理VPP模块的所有配置参数
 * P0阶段配置：基础功能、数据库、缓存、日志等
 */

import logger from '../../src/shared/utils/logger.js';

/**
 * 环境变量配置
 */
const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

/**
 * 数据库配置
 */
const DATABASE_CONFIG = {
  host: process.env.VPP_DB_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.VPP_DB_PORT || process.env.DB_PORT || '3306'),
  user: process.env.VPP_DB_USER || process.env.DB_USER || 'root',
  password: process.env.VPP_DB_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.VPP_DB_NAME || process.env.DB_NAME || 'zero_carbon_park',
  charset: 'utf8mb4',
  timezone: '+08:00',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  connectionLimit: parseInt(process.env.VPP_DB_CONNECTION_LIMIT || '20'),
  queueLimit: 0,
  multipleStatements: true
};

/**
 * 缓存配置
 */
const CACHE_CONFIG = {
  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.VPP_REDIS_DB || '2'),
    keyPrefix: 'vpp:',
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3
  },
  
  // 内存缓存配置
  memory: {
    maxSize: parseInt(process.env.VPP_MEMORY_CACHE_SIZE || '1000'),
    ttl: parseInt(process.env.VPP_MEMORY_CACHE_TTL || '300') // 5分钟
  },
  
  // 缓存TTL设置（秒）
  ttl: {
    resourceList: 300,      // 资源列表缓存5分钟
    resourceDetail: 600,    // 资源详情缓存10分钟
    vppList: 300,          // VPP列表缓存5分钟
    vppDetail: 600,        // VPP详情缓存10分钟
    aggregatedCapacity: 60, // 聚合容量缓存1分钟
    operationLogs: 1800,   // 操作日志缓存30分钟
    serviceStatus: 30      // 服务状态缓存30秒
  }
};

/**
 * API配置
 */
const API_CONFIG = {
  // 分页配置
  pagination: {
    defaultLimit: 50,
    maxLimit: 100,
    defaultOffset: 0
  },
  
  // 请求限制
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 1000, // 每个IP每15分钟最多1000次请求
    message: '请求过于频繁，请稍后再试'
  },
  
  // 请求体大小限制
  bodyLimit: '10mb',
  
  // 超时设置
  timeout: {
    request: 30000,  // 请求超时30秒
    database: 60000  // 数据库操作超时60秒
  }
};

/**
 * 资源类型配置
 */
const RESOURCE_TYPES = {
  SOLAR: 'solar',
  WIND: 'wind',
  BATTERY: 'battery',
  LOAD: 'load',
  GENERATOR: 'generator',
  EV_CHARGER: 'ev_charger',
  HEAT_PUMP: 'heat_pump'
};

/**
 * 资源状态配置
 */
const RESOURCE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
  DECOMMISSIONED: 'decommissioned'
};

/**
 * 实例状态配置
 */
const INSTANCE_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  MAINTENANCE: 'maintenance',
  ERROR: 'error',
  STANDBY: 'standby'
};

/**
 * VPP状态配置
 */
const VPP_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
  SUSPENDED: 'suspended'
};

/**
 * 操作类型配置
 */
const OPERATION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  START: 'start',
  STOP: 'stop',
  ADD_RESOURCE: 'add_resource',
  REMOVE_RESOURCE: 'remove_resource',
  STRATEGY_CHANGE: 'strategy_change'
};

/**
 * 业务规则配置
 */
const BUSINESS_RULES = {
  // 资源约束
  resource: {
    minCapacity: 0.1,        // 最小容量 0.1kW
    maxCapacity: 100000,     // 最大容量 100MW
    maxNameLength: 255,      // 名称最大长度
    maxDescriptionLength: 1000, // 描述最大长度
    coordinateRange: {
      latitude: { min: -90, max: 90 },
      longitude: { min: -180, max: 180 }
    }
  },
  
  // VPP约束
  vpp: {
    minTargetCapacity: 1,    // 最小目标容量 1kW
    maxTargetCapacity: 1000000, // 最大目标容量 1GW
    maxResourceCount: 1000,  // 最大资源数量
    maxNameLength: 255,      // 名称最大长度
    maxDescriptionLength: 2000 // 描述最大长度
  },
  
  // 关联约束
  association: {
    minAllocationRatio: 0,   // 最小分配比例 0%
    maxAllocationRatio: 100, // 最大分配比例 100%
    minPriority: 1,          // 最小优先级
    maxPriority: 10          // 最大优先级
  },
  
  // 性能约束
  performance: {
    minEfficiency: 0,        // 最小效率 0%
    maxEfficiency: 100,      // 最大效率 100%
    maxResponseTime: 300,    // 最大响应时间 5分钟
    maxCommunicationGap: 3600 // 最大通信间隔 1小时
  }
};

/**
 * 监控配置
 */
const MONITORING_CONFIG = {
  // 健康检查间隔
  healthCheck: {
    interval: 30000,         // 30秒
    timeout: 5000,          // 5秒超时
    retries: 3              // 重试3次
  },
  
  // 性能监控
  performance: {
    metricsInterval: 60000,  // 1分钟收集一次指标
    alertThresholds: {
      responseTime: 5000,    // 响应时间超过5秒告警
      errorRate: 0.05,       // 错误率超过5%告警
      memoryUsage: 0.8,      // 内存使用率超过80%告警
      cpuUsage: 0.8          // CPU使用率超过80%告警
    }
  },
  
  // 日志配置
  logging: {
    level: ENV.LOG_LEVEL,
    maxFileSize: '100MB',
    maxFiles: 10,
    datePattern: 'YYYY-MM-DD',
    auditFile: 'vpp-audit.json'
  }
};

/**
 * 安全配置
 */
const SECURITY_CONFIG = {
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'vpp-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    algorithm: 'HS256'
  },
  
  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  },
  
  // 加密配置
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16
  }
};

/**
 * 第三方服务配置
 */
const EXTERNAL_SERVICES = {
  // 电力市场API（P1阶段使用）
  powerMarket: {
    baseUrl: process.env.POWER_MARKET_API_URL || '',
    apiKey: process.env.POWER_MARKET_API_KEY || '',
    timeout: 30000,
    retries: 3
  },
  
  // 天气服务API
  weather: {
    baseUrl: process.env.WEATHER_API_URL || '',
    apiKey: process.env.WEATHER_API_KEY || '',
    timeout: 10000,
    retries: 2
  },
  
  // 消息队列配置
  messageQueue: {
    type: process.env.MQ_TYPE || 'redis', // redis, rabbitmq, kafka
    url: process.env.MQ_URL || 'redis://localhost:6379',
    options: {
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3
    }
  }
};

/**
 * 开发环境配置
 */
const DEVELOPMENT_CONFIG = {
  // 调试选项
  debug: {
    enabled: ENV.NODE_ENV === 'development',
    logSql: process.env.DEBUG_SQL === 'true',
    logRequests: process.env.DEBUG_REQUESTS === 'true',
    mockExternalServices: process.env.MOCK_EXTERNAL === 'true'
  },
  
  // 测试数据
  testData: {
    enabled: process.env.ENABLE_TEST_DATA === 'true',
    autoGenerate: process.env.AUTO_GENERATE_TEST_DATA === 'true'
  }
};

/**
 * 配置验证函数
 */
function validateConfig() {
  const errors = [];
  
  // 验证数据库配置
  if (!DATABASE_CONFIG.host) {
    errors.push('数据库主机地址未配置');
  }
  
  if (!DATABASE_CONFIG.database) {
    errors.push('数据库名称未配置');
  }
  
  // 验证端口配置
  if (isNaN(DATABASE_CONFIG.port) || DATABASE_CONFIG.port <= 0) {
    errors.push('数据库端口配置无效');
  }
  
  // 验证连接池配置
  if (DATABASE_CONFIG.connectionLimit <= 0) {
    errors.push('数据库连接池大小配置无效');
  }
  
  // 验证缓存配置
  if (isNaN(CACHE_CONFIG.redis.port) || CACHE_CONFIG.redis.port <= 0) {
    errors.push('Redis端口配置无效');
  }
  
  if (errors.length > 0) {
    logger.error('VPP配置验证失败:', errors);
    throw new Error(`配置验证失败: ${errors.join(', ')}`);
  }
  
  logger.info('VPP配置验证通过');
}

/**
 * 获取环境特定配置
 */
function getEnvironmentConfig() {
  const baseConfig = {
    env: ENV,
    database: DATABASE_CONFIG,
    cache: CACHE_CONFIG,
    api: API_CONFIG,
    monitoring: MONITORING_CONFIG,
    security: SECURITY_CONFIG,
    externalServices: EXTERNAL_SERVICES
  };
  
  // 根据环境添加特定配置
  if (ENV.NODE_ENV === 'development') {
    baseConfig.development = DEVELOPMENT_CONFIG;
  }
  
  return baseConfig;
}

/**
 * 导出配置对象
 */
const VPP_CONFIG = {
  // 环境配置
  ENV,
  
  // 核心配置
  DATABASE: DATABASE_CONFIG,
  CACHE: CACHE_CONFIG,
  API: API_CONFIG,
  MONITORING: MONITORING_CONFIG,
  SECURITY: SECURITY_CONFIG,
  EXTERNAL_SERVICES,
  DEVELOPMENT: DEVELOPMENT_CONFIG,
  
  // 业务配置
  RESOURCE_TYPES,
  RESOURCE_STATUS,
  INSTANCE_STATUS,
  VPP_STATUS,
  OPERATION_TYPES,
  BUSINESS_RULES,
  
  // 工具函数
  validate: validateConfig,
  getEnvironmentConfig
};

// 初始化时验证配置
try {
  validateConfig();
  logger.info('VPP模块配置加载完成', {
    environment: ENV.NODE_ENV,
    database: `${DATABASE_CONFIG.host}:${DATABASE_CONFIG.port}/${DATABASE_CONFIG.database}`,
    cache: `${CACHE_CONFIG.redis.host}:${CACHE_CONFIG.redis.port}`,
    debug: DEVELOPMENT_CONFIG.debug.enabled
  });
} catch (error) {
  logger.error('VPP模块配置加载失败:', error);
  process.exit(1);
}

export default VPP_CONFIG;

// 导出常用配置
export {
  ENV,
  DATABASE_CONFIG,
  CACHE_CONFIG,
  API_CONFIG,
  RESOURCE_TYPES,
  RESOURCE_STATUS,
  INSTANCE_STATUS,
  VPP_STATUS,
  OPERATION_TYPES,
  BUSINESS_RULES,
  MONITORING_CONFIG,
  SECURITY_CONFIG
};