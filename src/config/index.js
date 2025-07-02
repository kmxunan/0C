/**
 * 配置管理模块
 * 提供集中化的配置管理、验证和类型转换
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env';
const envPath = path.resolve(__dirname, '../../', envFile);
dotenv.config({ path: envPath });

/**
 * 配置验证和类型转换工具
 */
class ConfigValidator {
  /**
   * 获取字符串配置
   */
  static getString(key, defaultValue = null, required = false) {
    const value = process.env[key];
    
    if (!value) {
      if (required) {
        throw new Error(`必需的配置项 ${key} 未设置`);
      }
      return defaultValue;
    }
    
    return value;
  }

  /**
   * 获取数字配置
   */
  static getNumber(key, defaultValue = null, required = false) {
    const value = process.env[key];
    
    if (!value) {
      if (required) {
        throw new Error(`必需的配置项 ${key} 未设置`);
      }
      return defaultValue;
    }
    
    const numValue = Number(value);
    if (isNaN(numValue)) {
      throw new Error(`配置项 ${key} 必须是有效的数字，当前值: ${value}`);
    }
    
    return numValue;
  }

  /**
   * 获取布尔配置
   */
  static getBoolean(key, defaultValue = false, required = false) {
    const value = process.env[key];
    
    if (!value) {
      if (required) {
        throw new Error(`必需的配置项 ${key} 未设置`);
      }
      return defaultValue;
    }
    
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * 获取数组配置（逗号分隔）
   */
  static getArray(key, defaultValue = [], required = false) {
    const value = process.env[key];
    
    if (!value) {
      if (required) {
        throw new Error(`必需的配置项 ${key} 未设置`);
      }
      return defaultValue;
    }
    
    return value.split(',').map(item => item.trim()).filter(item => item);
  }

  /**
   * 验证枚举值
   */
  static getEnum(key, validValues, defaultValue = null, required = false) {
    const value = this.getString(key, defaultValue, required);
    
    if (value && !validValues.includes(value)) {
      throw new Error(`配置项 ${key} 的值 ${value} 无效，有效值: ${validValues.join(', ')}`);
    }
    
    return value;
  }

  /**
   * 验证URL格式
   */
  static getUrl(key, defaultValue = null, required = false) {
    const value = this.getString(key, defaultValue, required);
    
    if (value) {
      try {
        new URL(value);
      } catch (error) {
        throw new Error(`配置项 ${key} 必须是有效的URL，当前值: ${value}`);
      }
    }
    
    return value;
  }

  /**
   * 验证文件路径
   */
  static getPath(key, defaultValue = null, required = false) {
    const value = this.getString(key, defaultValue, required);
    
    if (value && !path.isAbsolute(value)) {
      // 如果是相对路径，转换为绝对路径
      return path.resolve(__dirname, '../../', value);
    }
    
    return value;
  }
}

/**
 * 应用程序配置
 */
const config = {
  // 应用程序基本配置
  app: {
    name: ConfigValidator.getString('APP_NAME', '零碳园区数字孪生能碳管理系统'),
    version: ConfigValidator.getString('APP_VERSION', '1.0.0'),
    env: ConfigValidator.getEnum('NODE_ENV', ['development', 'production', 'test'], 'development'),
    port: ConfigValidator.getNumber('PORT', 3000),
    host: ConfigValidator.getString('HOST', '0.0.0.0'),
    timezone: ConfigValidator.getString('TZ', 'Asia/Shanghai')
  },

  // 数据库配置
  database: {
    path: ConfigValidator.getPath('DB_PATH', 'data/park.db', true),
    connectionTimeout: ConfigValidator.getNumber('DB_CONNECTION_TIMEOUT', 30000),
    queryTimeout: ConfigValidator.getNumber('DB_QUERY_TIMEOUT', 10000),
    maxConnections: ConfigValidator.getNumber('DB_MAX_CONNECTIONS', 10),
    enableWAL: ConfigValidator.getBoolean('DB_ENABLE_WAL', true),
    enableForeignKeys: ConfigValidator.getBoolean('DB_ENABLE_FOREIGN_KEYS', true)
  },

  // JWT认证配置
  jwt: {
    secret: ConfigValidator.getString('JWT_SECRET', null, true),
    accessTokenExpiry: ConfigValidator.getString('JWT_ACCESS_TOKEN_EXPIRY', '15m'),
    refreshTokenExpiry: ConfigValidator.getString('JWT_REFRESH_TOKEN_EXPIRY', '7d'),
    issuer: ConfigValidator.getString('JWT_ISSUER', 'zero-carbon-park'),
    audience: ConfigValidator.getString('JWT_AUDIENCE', 'zero-carbon-park-users')
  },

  // MQTT配置
  mqtt: {
    brokerUrl: ConfigValidator.getUrl('MQTT_BROKER_URL', 'mqtt://localhost:1883', true),
    clientId: ConfigValidator.getString('MQTT_CLIENT_ID', 'zero-carbon-park-server'),
    username: ConfigValidator.getString('MQTT_USERNAME'),
    password: ConfigValidator.getString('MQTT_PASSWORD'),
    keepalive: ConfigValidator.getNumber('MQTT_KEEPALIVE', 60),
    connectTimeout: ConfigValidator.getNumber('MQTT_CONNECT_TIMEOUT', 30000),
    reconnectPeriod: ConfigValidator.getNumber('MQTT_RECONNECT_PERIOD', 1000),
    topics: {
      energyData: ConfigValidator.getString('MQTT_TOPIC_ENERGY', 'park/energy/+/data'),
      carbonData: ConfigValidator.getString('MQTT_TOPIC_CARBON', 'park/carbon/+/data'),
      batteryData: ConfigValidator.getString('MQTT_TOPIC_BATTERY', 'park/battery/+/data'),
      alerts: ConfigValidator.getString('MQTT_TOPIC_ALERTS', 'park/alerts')
    }
  },

  // Redis缓存配置
  redis: {
    enabled: ConfigValidator.getBoolean('REDIS_ENABLED', false),
    host: ConfigValidator.getString('REDIS_HOST', 'localhost'),
    port: ConfigValidator.getNumber('REDIS_PORT', 6379),
    password: ConfigValidator.getString('REDIS_PASSWORD'),
    db: ConfigValidator.getNumber('REDIS_DB', 0),
    keyPrefix: ConfigValidator.getString('REDIS_KEY_PREFIX', 'zcp:'),
    defaultTTL: ConfigValidator.getNumber('REDIS_DEFAULT_TTL', 3600),
    maxRetriesPerRequest: ConfigValidator.getNumber('REDIS_MAX_RETRIES', 3),
    retryDelayOnFailover: ConfigValidator.getNumber('REDIS_RETRY_DELAY', 100)
  },

  // 安全配置
  security: {
    bcryptRounds: ConfigValidator.getNumber('BCRYPT_ROUNDS', 12),
    rateLimitWindowMs: ConfigValidator.getNumber('RATE_LIMIT_WINDOW_MS', 900000), // 15分钟
    rateLimitMaxRequests: ConfigValidator.getNumber('RATE_LIMIT_MAX_REQUESTS', 100),
    corsOrigins: ConfigValidator.getArray('CORS_ORIGINS', ['http://localhost:3000', 'http://localhost:3001']),
    enableHelmet: ConfigValidator.getBoolean('ENABLE_HELMET', true),
    enableCors: ConfigValidator.getBoolean('ENABLE_CORS', true)
  },

  // 日志配置
  logging: {
    level: ConfigValidator.getEnum('LOG_LEVEL', ['error', 'warn', 'info', 'debug'], 'info'),
    enableConsole: ConfigValidator.getBoolean('LOG_ENABLE_CONSOLE', true),
    enableFile: ConfigValidator.getBoolean('LOG_ENABLE_FILE', true),
    logDir: ConfigValidator.getPath('LOG_DIR', 'logs'),
    maxFileSize: ConfigValidator.getString('LOG_MAX_FILE_SIZE', '10m'),
    maxFiles: ConfigValidator.getNumber('LOG_MAX_FILES', 5),
    enableRequestLogging: ConfigValidator.getBoolean('LOG_ENABLE_REQUEST', true)
  },

  // 监控配置
  monitoring: {
    enableMetrics: ConfigValidator.getBoolean('MONITORING_ENABLE_METRICS', true),
    metricsPort: ConfigValidator.getNumber('MONITORING_METRICS_PORT', 9090),
    enableHealthCheck: ConfigValidator.getBoolean('MONITORING_ENABLE_HEALTH_CHECK', true),
    healthCheckInterval: ConfigValidator.getNumber('MONITORING_HEALTH_CHECK_INTERVAL', 30000),
    enablePerformanceMonitoring: ConfigValidator.getBoolean('MONITORING_ENABLE_PERFORMANCE', true)
  },

  // 文件上传配置
  upload: {
    maxFileSize: ConfigValidator.getNumber('UPLOAD_MAX_FILE_SIZE', 10 * 1024 * 1024), // 10MB
    allowedMimeTypes: ConfigValidator.getArray('UPLOAD_ALLOWED_MIME_TYPES', [
      'image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/csv'
    ]),
    uploadDir: ConfigValidator.getPath('UPLOAD_DIR', 'uploads'),
    enableVirusScan: ConfigValidator.getBoolean('UPLOAD_ENABLE_VIRUS_SCAN', false)
  },

  // 外部服务配置
  external: {
    weatherApiKey: ConfigValidator.getString('WEATHER_API_KEY'),
    weatherApiUrl: ConfigValidator.getUrl('WEATHER_API_URL', 'https://api.openweathermap.org/data/2.5'),
    carbonFactorApiUrl: ConfigValidator.getUrl('CARBON_FACTOR_API_URL'),
    enableExternalServices: ConfigValidator.getBoolean('ENABLE_EXTERNAL_SERVICES', false)
  },

  // 开发配置
  development: {
    enableMockData: ConfigValidator.getBoolean('DEV_ENABLE_MOCK_DATA', false),
    enableDebugRoutes: ConfigValidator.getBoolean('DEV_ENABLE_DEBUG_ROUTES', false),
    enableSqlLogging: ConfigValidator.getBoolean('DEV_ENABLE_SQL_LOGGING', false)
  }
};

/**
 * 配置验证函数
 */
export function validateConfig() {
  const errors = [];

  // 验证JWT密钥长度
  if (config.jwt.secret && config.jwt.secret.length < 32) {
    errors.push('JWT_SECRET 长度必须至少32个字符');
  }

  // 验证端口范围
  if (config.app.port < 1 || config.app.port > 65535) {
    errors.push('PORT 必须在1-65535范围内');
  }

  // 验证日志目录
  if (config.logging.enableFile && !config.logging.logDir) {
    errors.push('启用文件日志时必须设置 LOG_DIR');
  }

  // 验证上传目录
  if (!config.upload.uploadDir) {
    errors.push('必须设置 UPLOAD_DIR');
  }

  if (errors.length > 0) {
    throw new Error(`配置验证失败:\n${errors.join('\n')}`);
  }

  console.log(`[CONFIG] 配置验证通过，环境: ${config.app.env}`);
}

/**
 * 获取配置信息（用于调试）
 */
export function getConfigInfo() {
  const safeConfig = JSON.parse(JSON.stringify(config));
  
  // 隐藏敏感信息
  if (safeConfig.jwt.secret) {
    safeConfig.jwt.secret = '***';
  }
  if (safeConfig.mqtt.password) {
    safeConfig.mqtt.password = '***';
  }
  if (safeConfig.redis.password) {
    safeConfig.redis.password = '***';
  }
  if (safeConfig.external.weatherApiKey) {
    safeConfig.external.weatherApiKey = '***';
  }
  
  return safeConfig;
}

/**
 * 检查是否为生产环境
 */
export function isProduction() {
  return config.app.env === 'production';
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment() {
  return config.app.env === 'development';
}

/**
 * 检查是否为测试环境
 */
export function isTest() {
  return config.app.env === 'test';
}

// 在模块加载时验证配置
validateConfig();

export default config;