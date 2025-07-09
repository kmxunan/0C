#!/usr/bin/env node
/* eslint-disable no-console, no-magic-numbers */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 环境配置管理器
 * 管理不同环境的配置文件、环境变量和密钥
 */
class EnvironmentManager {
  constructor(options = {}) {
    this.options = {
      projectRoot: options.projectRoot || path.resolve(__dirname, '..'),
      configDir: options.configDir || 'config',
      envDir: options.envDir || 'environments',
      secretsFile: options.secretsFile || '.secrets.json',
      templateFile: options.templateFile || '.env.template',
      ...options,
    };

    this.environments = ['development', 'staging', 'production', 'test'];
    this.secrets = new Map();
  }

  /**
   * 初始化环境管理器
   */
  async initialize() {
    console.log('🔧 初始化环境配置管理器...');

    // 创建必要目录
    this.createDirectories();

    // 加载密钥
    await this.loadSecrets();

    // 创建默认配置模板
    await this.createDefaultTemplates();

    console.log('✅ 环境管理器初始化完成');
  }

  /**
   * 创建必要目录
   */
  createDirectories() {
    const dirs = [
      path.join(this.options.projectRoot, this.options.configDir),
      path.join(this.options.projectRoot, this.options.envDir),
    ];

    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 创建默认配置模板
   */
  async createDefaultTemplates() {
    await this.createEnvTemplate();
    await this.createConfigTemplates();
  }

  /**
   * 创建环境变量模板
   */

  // TODO: 考虑将此函数拆分为更小的函数 (当前 127 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 127 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 127 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 127 行)

  async createEnvTemplate() {
    const templatePath = path.join(this.options.projectRoot, this.options.templateFile);

    if (fs.existsSync(templatePath)) {
      return;
    }

    const template = `# 零碳园区数字孪生能碳管理系统 - 环境变量模板
# 复制此文件为 .env 并填入实际值

# 应用配置
NODE_ENV=development
PORT=3000
HOST=localhost
APP_NAME="零碳园区数字孪生能碳管理系统"
APP_VERSION=1.0.0

# 数据库配置
DB_TYPE=sqlite
DB_HOST=localhost
DB_PORT=3306
DB_NAME=carbon_management
DB_USER=root
DB_PASSWORD=
DB_SSL=false

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_REFRESH_EXPIRES_IN=7d

# 加密配置
ENCRYPTION_KEY=your-32-character-encryption-key
HASH_SALT_ROUNDS=12

# API配置
API_RATE_LIMIT=100
API_RATE_WINDOW=15
API_TIMEOUT=30000
API_MAX_PAYLOAD_SIZE=10mb

# 文件上传配置
UPLOAD_MAX_SIZE=50mb
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,application/pdf
UPLOAD_PATH=./uploads

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/app.log
LOG_MAX_SIZE=10mb
LOG_MAX_FILES=5

# 邮件配置
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM="零碳园区系统" <noreply@example.com>

# 短信配置
SMS_PROVIDER=aliyun
SMS_ACCESS_KEY=your-access-key
SMS_SECRET_KEY=your-secret-key
SMS_SIGN_NAME=零碳园区

# 第三方服务配置
# 天气API
WEATHER_API_KEY=your-weather-api-key
WEATHER_API_URL=https://api.openweathermap.org/data/2.5

# 地图服务
MAP_API_KEY=your-map-api-key
MAP_API_URL=https://restapi.amap.com/v3

# 监控配置
MONITORING_ENABLED=true
METRICS_PORT=9090
HEALTH_CHECK_INTERVAL=30000

# 缓存配置
CACHE_TTL=300
CACHE_MAX_ITEMS=1000
CACHE_CHECK_PERIOD=60

# 安全配置
CORS_ORIGIN=http://localhost:3000
CSRF_SECRET=your-csrf-secret
SESSION_SECRET=your-session-secret
SESSION_MAX_AGE=86400000

# 开发配置
DEBUG=app:*
DEV_TOOLS_ENABLED=true
HOT_RELOAD=true

# 生产配置
CLUSTER_MODE=false
CLUSTER_WORKERS=auto
GRACEFUL_SHUTDOWN_TIMEOUT=10000

# 备份配置
BACKUP_ENABLED=true
BACKUP_INTERVAL=daily
BACKUP_RETENTION=30
BACKUP_PATH=./backups

# 通知配置
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
DINGTALK_WEBHOOK_URL=https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN

# 性能配置
PERFORMANCE_MONITORING=true
APM_SERVICE_NAME=carbon-management-system
APM_SERVER_URL=http://localhost:8200
`;

    await fs.promises.writeFile(templatePath, template);
    console.log(`✅ 环境变量模板已创建: ${templatePath}`);
  }

  /**
   * 创建配置文件模板
   */
  async createConfigTemplates() {
    for (const env of this.environments) {
      await this.createConfigTemplate(env);
    }
  }

  /**
   * 创建特定环境的配置模板
   */
  async createConfigTemplate(environment) {
    const configPath = path.join(
      this.options.projectRoot,
      this.options.configDir,
      `${environment}.js`
    );

    if (fs.existsSync(configPath)) {
      return;
    }

    const config = this.generateConfigTemplate(environment);
    await fs.promises.writeFile(configPath, config);

    console.log(`✅ ${environment} 配置模板已创建: ${configPath}`);
  }

  // TODO: 考虑将此函数拆分为更小的函数 (当前 263 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 263 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 263 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 263 行)

  /**
   * 生成配置模板内容
   */
  generateConfigTemplate(environment) {
    const isProduction = environment === 'production';
    const isDevelopment = environment === 'development';
    const isTest = environment === 'test';

    return `/**
 * ${environment.toUpperCase()} 环境配置
 * 零碳园区数字孪生能碳管理系统
 */

export default {
  // 应用基础配置
  app: {
    name: process.env.APP_NAME || '零碳园区数字孪生能碳管理系统',
    version: process.env.APP_VERSION || '1.0.0',
    environment: '${environment}',
    port: parseInt(process.env.PORT) || ${this.getDefaultPort(environment)},
    host: process.env.HOST || '${this.getDefaultHost(environment)}',
    timezone: 'Asia/Shanghai',
    locale: 'zh-CN'
  },

  // 数据库配置
  database: {
    type: process.env.DB_TYPE || '${this.getDefaultDbType(environment)}',
    host: process.env.DB_HOST || '${this.getDefaultDbHost(environment)}',
    port: parseInt(process.env.DB_PORT) || ${this.getDefaultDbPort(environment)},
    name: process.env.DB_NAME || '${this.getDefaultDbName(environment)}',
    username: process.env.DB_USER || '${this.getDefaultDbUser(environment)}',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    pool: {
      min: ${isProduction ? 5 : 2},
      max: ${isProduction ? 20 : 10},
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000
    },
    migrations: {
      directory: './migrations',
      tableName: 'migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },

  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0,
    keyPrefix: 'carbon:',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '${isProduction ? '2h' : '24h'}',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    algorithm: 'HS256',
    issuer: 'carbon-management-system',
    audience: 'carbon-management-users'
  },

  // 安全配置
  security: {
    encryption: {
      key: process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key',
      algorithm: 'aes-256-gcm'
    },
    hash: {
      saltRounds: parseInt(process.env.HASH_SALT_ROUNDS) || 12
    },
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['${this.getDefaultCorsOrigin(environment)}'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    csrf: {
      secret: process.env.CSRF_SECRET || 'your-csrf-secret'
    },
    session: {
      secret: process.env.SESSION_SECRET || 'your-session-secret',
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000,
      secure: ${isProduction},
      httpOnly: true,
      sameSite: 'strict'
    }
  },

  // API配置
  api: {
    rateLimit: {
      windowMs: (parseInt(process.env.API_RATE_WINDOW) || 15) * 60 * 1000,
      max: parseInt(process.env.API_RATE_LIMIT) || ${isProduction ? 100 : 1000},
      message: '请求过于频繁，请稍后再试',
      standardHeaders: true,
      legacyHeaders: false
    },
    timeout: parseInt(process.env.API_TIMEOUT) || 30000,
    maxPayloadSize: process.env.API_MAX_PAYLOAD_SIZE || '10mb',
    compression: ${isProduction},
    etag: ${isProduction}
  },

  // 文件上传配置
  upload: {
    maxSize: process.env.UPLOAD_MAX_SIZE || '50mb',
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    path: process.env.UPLOAD_PATH || './uploads',
    urlPrefix: '/uploads'
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || '${this.getDefaultLogLevel(environment)}',
    file: {
      enabled: ${!isTest},
      filename: process.env.LOG_FILE || './logs/app.log',
      maxSize: process.env.LOG_MAX_SIZE || '10mb',
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
      format: 'json'
    },
    console: {
      enabled: ${isDevelopment || isTest},
      format: 'simple',
      colorize: true
    },
    http: {
      enabled: ${isProduction},
      format: 'combined'
    }
  },

  // 缓存配置
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 300,
    maxItems: parseInt(process.env.CACHE_MAX_ITEMS) || 1000,
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 60,
    useClones: false
  },

  // 监控配置
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT) || 9090,
    healthCheck: {
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
      timeout: 5000,
      retries: 3
    },
    performance: {
      enabled: ${isProduction},
      sampleRate: ${isProduction ? 0.1 : 1.0}
    }
  },

  // 邮件配置
  mail: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER || '',
      pass: process.env.MAIL_PASSWORD || ''
    },
    from: process.env.MAIL_FROM || '零碳园区系统 <noreply@example.com>',
    templates: {
      path: './templates/email',
      engine: 'handlebars'
    }
  },

  // 短信配置
  sms: {
    provider: process.env.SMS_PROVIDER || 'aliyun',
    accessKey: process.env.SMS_ACCESS_KEY || '',
    secretKey: process.env.SMS_SECRET_KEY || '',
    signName: process.env.SMS_SIGN_NAME || '零碳园区',
    templates: {
      verification: 'SMS_123456789',
      notification: 'SMS_987654321'
    }
  },

  // 第三方服务配置
  services: {
    weather: {
      apiKey: process.env.WEATHER_API_KEY || '',
      apiUrl: process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5',
      timeout: 10000
    },
    map: {
      apiKey: process.env.MAP_API_KEY || '',
      apiUrl: process.env.MAP_API_URL || 'https://restapi.amap.com/v3',
      timeout: 10000
    }
  },

  // 通知配置
  notifications: {
    slack: {
      enabled: !!process.env.SLACK_WEBHOOK_URL,
      webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
      channel: '#alerts',
      username: 'Carbon Management System'
    },
    dingtalk: {
      enabled: !!process.env.DINGTALK_WEBHOOK_URL,
      webhookUrl: process.env.DINGTALK_WEBHOOK_URL || ''
    }
  },

  // 备份配置
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    interval: process.env.BACKUP_INTERVAL || 'daily',
    retention: parseInt(process.env.BACKUP_RETENTION) || 30,
    path: process.env.BACKUP_PATH || './backups',
    compression: true
  },

  // 开发配置
  development: {
    debug: process.env.DEBUG || '${isDevelopment ? 'app:*' : ''}',
    devTools: process.env.DEV_TOOLS_ENABLED === 'true',
    hotReload: process.env.HOT_RELOAD === 'true',
    mockData: ${isDevelopment || isTest}
  },

  // 生产配置
  production: {
    cluster: {
      enabled: process.env.CLUSTER_MODE === 'true',
      workers: process.env.CLUSTER_WORKERS || 'auto'
    },
    gracefulShutdown: {
      timeout: parseInt(process.env.GRACEFUL_SHUTDOWN_TIMEOUT) || 10000
    },
    optimization: {
      gzip: true,
      minify: true,
      cache: true
    }
  }
};
`;
  }

  /**
   * 生成环境文件
   */
  async generateEnvFile(environment, options = {}) {
    const { override = false, secrets = false } = options;

    const envPath = path.join(this.options.projectRoot, `.env.${environment}`);

    if (fs.existsSync(envPath) && !override) {
      console.log(`⚠️  环境文件已存在: ${envPath}`);
      return;
    }

    console.log(`📝 生成 ${environment} 环境文件...`);

    const envContent = this.generateEnvContent(environment, secrets);
    await fs.promises.writeFile(envPath, envContent);

    console.log(`✅ 环境文件已生成: ${envPath}`);

    // 设置文件权限（仅限Unix系统）
    if (process.platform !== 'win32') {
      await fs.promises.chmod(envPath, 0o600);
    }
  }

  /**
   * 生成环境文件内容
   */
  generateEnvContent(environment, includeSecrets = false) {
    const isProduction = environment === 'production';
    const isDevelopment = environment === 'development';
    const isTest = environment === 'test';

    let content = `# ${environment.toUpperCase()} 环境配置\n`;
    content += `# 生成时间: ${new Date().toISOString()}\n\n`;

    // 基础配置
    content += '# 应用配置\n';
    content += `NODE_ENV=${environment}\n`;
    content += `PORT=${this.getDefaultPort(environment)}\n`;
    content += `HOST=${this.getDefaultHost(environment)}\n`;
    content += 'APP_NAME="零碳园区数字孪生能碳管理系统"\n';
    content += 'APP_VERSION=1.0.0\n\n';

    // 数据库配置
    content += '# 数据库配置\n';
    content += `DB_TYPE=${this.getDefaultDbType(environment)}\n`;
    content += `DB_HOST=${this.getDefaultDbHost(environment)}\n`;
    content += `DB_PORT=${this.getDefaultDbPort(environment)}\n`;
    content += `DB_NAME=${this.getDefaultDbName(environment)}\n`;
    content += `DB_USER=${this.getDefaultDbUser(environment)}\n`;

    if (includeSecrets) {
      content += `DB_PASSWORD=${this.getSecret('db_password', environment) || ''}\n`;
    } else {
      content += 'DB_PASSWORD=\n';
    }

    content += `DB_SSL=${isProduction}\n\n`;

    // Redis配置
    content += '# Redis配置\n';
    content += 'REDIS_HOST=localhost\n';
    content += 'REDIS_PORT=6379\n';
    content += 'REDIS_PASSWORD=\n';
    content += 'REDIS_DB=0\n\n';

    // JWT配置
    content += '# JWT配置\n';
    if (includeSecrets) {
      content += `JWT_SECRET=${this.getSecret('jwt_secret', environment) || this.generateSecret(32)}\n`;
      content += `JWT_REFRESH_SECRET=${this.getSecret('jwt_refresh_secret', environment) || this.generateSecret(32)}\n`;
    } else {
      content += 'JWT_SECRET=\n';
      content += 'JWT_REFRESH_SECRET=\n';
    }
    content += `JWT_EXPIRES_IN=${isProduction ? '2h' : '24h'}\n`;
    content += 'JWT_REFRESH_EXPIRES_IN=7d\n\n';

    // 日志配置
    content += '# 日志配置\n';
    content += `LOG_LEVEL=${this.getDefaultLogLevel(environment)}\n`;
    content += 'LOG_FILE=./logs/app.log\n';
    content += 'LOG_MAX_SIZE=10mb\n';
    content += 'LOG_MAX_FILES=5\n\n';

    // 监控配置
    content += '# 监控配置\n';
    content += `MONITORING_ENABLED=${!isTest}\n`;
    content += 'METRICS_PORT=9090\n';
    content += 'HEALTH_CHECK_INTERVAL=30000\n\n';

    // 安全配置
    content += '# 安全配置\n';
    content += `CORS_ORIGIN=${this.getDefaultCorsOrigin(environment)}\n`;
    if (includeSecrets) {
      content += `CSRF_SECRET=${this.getSecret('csrf_secret', environment) || this.generateSecret(32)}\n`;
      content += `SESSION_SECRET=${this.getSecret('session_secret', environment) || this.generateSecret(32)}\n`;
      content += `ENCRYPTION_KEY=${this.getSecret('encryption_key', environment) || this.generateSecret(32)}\n`;
    } else {
      content += 'CSRF_SECRET=\n';
      content += 'SESSION_SECRET=\n';
      content += 'ENCRYPTION_KEY=\n';
    }
    content += 'HASH_SALT_ROUNDS=12\n\n';

    return content;
  }

  /**
   * 验证环境配置
   */
  async validateEnvironment(environment) {
    console.log(`🔍 验证 ${environment} 环境配置...`);

    const errors = [];
    const warnings = [];

    // 检查配置文件
    const configPath = path.join(
      this.options.projectRoot,
      this.options.configDir,
      `${environment}.js`
    );

    if (!fs.existsSync(configPath)) {
      errors.push(`配置文件不存在: ${configPath}`);
    } else {
      try {
        const config = await import(`file://${configPath}`);

        // 验证必需的配置项
        const requiredFields = ['app.port', 'database.type', 'jwt.secret'];

        for (const field of requiredFields) {
          if (!this.getNestedValue(config.default, field)) {
            errors.push(`缺少必需配置: ${field}`);
          }
        }

        // 验证生产环境特殊要求
        if (environment === 'production') {
          const productionChecks = [
            'security.encryption.key',
            'database.password',
            'jwt.refreshSecret',
          ];

          for (const field of productionChecks) {
            if (!this.getNestedValue(config.default, field)) {
              warnings.push(`生产环境建议配置: ${field}`);
            }
          }
        }
      } catch (error) {
        errors.push(`配置文件加载失败: ${error.message}`);
      }
    }

    // 检查环境变量文件
    const envPath = path.join(this.options.projectRoot, `.env.${environment}`);
    if (!fs.existsSync(envPath)) {
      warnings.push(`环境变量文件不存在: ${envPath}`);
    }

    // 输出验证结果
    if (errors.length > 0) {
      console.log('\n❌ 配置验证失败:');
      errors.forEach((error) => console.log(`   - ${error}`));
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  配置警告:');
      warnings.forEach((warning) => console.log(`   - ${warning}`));
    }

    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ 配置验证通过');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,

      // TODO: 考虑将此函数拆分为更小的函数 (当前 26 行)

      // TODO: 考虑将此函数拆分为更小的函数 (当前 26 行)

      // TODO: 考虑将此函数拆分为更小的函数 (当前 26 行)

      // TODO: 考虑将此函数拆分为更小的函数 (当前 26 行)
    };
  }

  /**
   * 切换环境
   */
  async switchEnvironment(environment) {
    if (!this.environments.includes(environment)) {
      throw new Error(`未知环境: ${environment}`);
    }

    console.log(`🔄 切换到 ${environment} 环境...`);

    const envPath = path.join(this.options.projectRoot, `.env.${environment}`);
    const targetPath = path.join(this.options.projectRoot, '.env');

    if (!fs.existsSync(envPath)) {
      throw new Error(`环境文件不存在: ${envPath}`);
    }

    // 备份当前环境文件
    if (fs.existsSync(targetPath)) {
      const backupPath = `${targetPath}.backup.${Date.now()}`;
      fs.copyFileSync(targetPath, backupPath);
      console.log(`📦 当前环境已备份: ${backupPath}`);
    }

    // 复制环境文件
    fs.copyFileSync(envPath, targetPath);

    console.log(`✅ 已切换到 ${environment} 环境`);
  }

  /**
   * 加载密钥
   */
  async loadSecrets() {
    const secretsPath = path.join(this.options.projectRoot, this.options.secretsFile);

    try {
      await fs.promises.access(secretsPath);
      const secretsData = await fs.promises.readFile(secretsPath, 'utf8');
      const secrets = JSON.parse(secretsData);

      for (const [key, value] of Object.entries(secrets)) {
        this.secrets.set(key, value);
      }

      console.log(`✅ 已加载 ${this.secrets.size} 个密钥`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`⚠️  加载密钥失败: ${error.message}`);
      }
    }
  }

  /**
   * 保存密钥
   */
  async saveSecrets() {
    const secretsPath = path.join(this.options.projectRoot, this.options.secretsFile);

    const secretsData = Object.fromEntries(this.secrets);
    await fs.promises.writeFile(secretsPath, JSON.stringify(secretsData, null, 2));

    // 设置文件权限
    if (process.platform !== 'win32') {
      await fs.promises.chmod(secretsPath, 0o600);
    }

    console.log(`✅ 密钥已保存: ${secretsPath}`);
  }

  /**
   * 设置密钥
   */
  setSecret(key, value, environment = null) {
    const secretKey = environment ? `${environment}_${key}` : key;
    this.secrets.set(secretKey, value);
  }

  /**
   * 获取密钥
   */
  getSecret(key, environment = null) {
    const secretKey = environment ? `${environment}_${key}` : key;
    return this.secrets.get(secretKey);
  }

  /**
   * 生成随机密钥
   */
  generateSecret(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 辅助方法
   */
  getDefaultPort(environment) {
    const ports = {
      development: 3000,
      test: 3001,
      staging: 3002,
      production: 3000,
    };
    return ports[environment] || 3000;
  }

  getDefaultHost(environment) {
    return environment === 'production' ? '0.0.0.0' : 'localhost';
  }

  getDefaultDbType(environment) {
    return environment === 'test' ? 'sqlite' : 'mysql';
  }

  getDefaultDbHost(environment) {
    return environment === 'production' ? 'db.example.com' : 'localhost';
  }

  getDefaultDbPort(environment) {
    const dbType = this.getDefaultDbType(environment);
    return dbType === 'sqlite' ? null : 3306;
  }

  getDefaultDbName(environment) {
    return `carbon_management_${environment}`;
  }

  getDefaultDbUser(environment) {
    return environment === 'production' ? 'carbon_user' : 'root';
  }

  getDefaultLogLevel(environment) {
    const levels = {
      development: 'debug',
      test: 'error',
      staging: 'info',
      production: 'warn',
    };
    return levels[environment] || 'info';
  }

  getDefaultCorsOrigin(environment) {
    const origins = {
      development: 'http://localhost:3000',
      test: 'http://localhost:3001',
      staging: 'https://staging.example.com',
      production: 'https://app.example.com',
    };
    return origins[environment] || 'http://localhost:3000';
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

// 命令行接口
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];
  const environment = args[1];

  const manager = new EnvironmentManager();

  async function main() {
    try {
      await manager.initialize();

      switch (command) {
        case 'init':
          console.log('✅ 环境管理器已初始化');
            break;

          }

        case 'generate':
          if (!environment) {
            console.error('请指定环境: generate <environment> [--secrets] [--override]');
            process.exit(1);
          }

          const options = {
            secrets: args.includes('--secrets'),
            override: args.includes('--override'),
          };

          await manager.generateEnvFile(environment, options);
            break;

          }

        case 'validate':
          if (!environment) {
            console.error('请指定环境: validate <environment>');
            process.exit(1);
          }

          const result = await manager.validateEnvironment(environment);
          if (!result.valid) {
            process.exit(1);
          }
            break;

          }

        case 'switch':
          if (!environment) {
            console.error('请指定环境: switch <environment>');
            process.exit(1);
          }

          await manager.switchEnvironment(environment);
            break;

          }

        case 'secret':
          {
            const action = args[1];
          const key = args[2];
          const value = args[3];

          if (action === 'set' && key && value) {
            manager.setSecret(key, value, environment);
            await manager.saveSecrets();
            console.log(`✅ 密钥已设置: ${key}`);
          } else if (action === 'get' && key) {
            const secret = manager.getSecret(key, environment);
            console.log(secret || '密钥不存在');
          } else if (action === 'generate') {
            const length = parseInt(args[2]) || 32;
            const secret = manager.generateSecret(length);
            console.log(secret);
          } else {
            console.log('使用方法: secret <set|get|generate> [key] [value]');
          }
            break;

          }

        default:
          console.log(`
使用方法:
  node env-manager.js init
  node env-manager.js generate <environment> [--secrets] [--override]
  node env-manager.js validate <environment>
  node env-manager.js switch <environment>
  node env-manager.js secret <set|get|generate> [key] [value]

可用环境: ${manager.environments.join(', ')}
`);
      }
    } catch (error) {
      console.error(`\n❌ 操作失败: ${error.message}`);
      process.exit(1);
    }
  }

  main();
}

export default EnvironmentManager;
