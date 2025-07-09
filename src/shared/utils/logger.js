/**
 * 结构化日志模块
 * 使用Winston实现分级日志记录和管理
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';
// import { fileURLToPath } from 'url';
import config from '../config/index.js';

// 定义审计日志的格式
const auditLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.json(),
  winston.format.printf(
    ({ timestamp, level, message, userId, ipAddress, action, target, details }) => {
      const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        userId: userId || 'N/A',
        ipAddress: ipAddress || 'N/A',
        action: action || 'N/A',
        target: target || 'N/A',
        details: details || {}
      };
      return JSON.stringify(logEntry);
    }
  )
);

// const __filename = fileURLToPath(import.meta.url);
// const currentDir = path.dirname(__filename);

/**
 * 确保日志目录存在
 */
function ensureLogDirectory() {
  const { logDir } = config.logging;
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

/**
 * 自定义日志格式
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, service, requestId, userId, ...meta }) => {
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      service: service || 'zero-carbon-park',
      ...(requestId && { requestId }),
      ...(userId && { userId }),
      ...meta
    };

    return JSON.stringify(logEntry);
  })
);

/**
 * 控制台格式（开发环境友好）
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'HH:mm:ss.SSS'
  }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, service, requestId, userId, ...meta }) => {
    let logMessage = `${timestamp} [${level}]`;

    if (service) {
      logMessage += ` [${service}]`;
    }

    if (requestId) {
      logMessage += ` [${requestId}]`;
    }

    if (userId) {
      logMessage += ` [User:${userId}]`;
    }

    logMessage += `: ${message}`;

    // 添加额外的元数据
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }

    return logMessage;
  })
);

/**
 * 创建传输器配置
 */
function createTransports() {
  const transports = [];

  // 控制台传输器
  if (config.logging.enableConsole) {
    transports.push(
      new winston.transports.Console({
        level: config.logging.level,
        format: config.app.env === 'development' ? consoleFormat : customFormat,
        handleExceptions: true,
        handleRejections: true
      })
    );
  }

  // 文件传输器
  if (config.logging.enableFile) {
    transports.push(
      new winston.transports.File({
        filename: path.join(config.logging.logDir, 'app.log'),
        level: config.logging.level,
        format: customFormat,
        maxsize: config.logging.maxFileSize,
        maxFiles: config.logging.maxFiles,
        tailable: true
      })
    );
  }

  // 错误日志文件传输器
  if (config.logging.enableErrorFile) {
    transports.push(
      new winston.transports.File({
        filename: path.join(config.logging.logDir, 'error.log'),
        level: 'error',
        format: customFormat,
        maxsize: config.logging.maxFileSize,
        maxFiles: config.logging.maxFiles,
        tailable: true
      })
    );
  }

  return transports;
}

ensureLogDirectory();

/**
 * 主日志器实例
 */
const logger = winston.createLogger({
  levels: winston.config.npm.levels,
  format: customFormat,
  transports: createTransports(),
  exitOnError: false // 不在异常时退出应用
});

/**
 * 审计日志器实例
 */
export const auditLogger = winston.createLogger({
  levels: winston.config.npm.levels, // 可以根据需要定义更细粒度的审计日志级别
  format: auditLogFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(config.logging.logDir, 'audit.log'),
      level: 'info', // 审计日志通常从info级别开始记录
      format: auditLogFormat,
      maxsize: config.logging.maxFileSize,
      maxFiles: config.logging.maxFiles,
      tailable: true
    }),
    ...(config.logging.enableConsole
      ? [
        new winston.transports.Console({
          level: 'info',
          format: consoleFormat
        })
      ]
      : [])
  ],
  exitOnError: false
});

// 如果是开发环境，将日志输出到控制台
if (config.app.env === 'development') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      level: 'debug'
    })
  );
}

/**
 * 日志器包装类
 * 提供更丰富的日志记录功能
 */
class Logger {
  constructor(service = 'default') {
    this.service = service;
    this.defaultMeta = { service };
  }

  /**
   * 创建子日志器
   * @param {string} service - 服务名称
   * @returns {Logger} 子日志器实例
   */
  child(service) {
    return new Logger(`${this.service}:${service}`);
  }

  /**
   * 记录错误日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 额外元数据
   */
  error(message, meta = {}) {
    logger.error(message, { ...this.defaultMeta, ...meta });
  }

  /**
   * 记录警告日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 额外元数据
   */
  warn(message, meta = {}) {
    logger.warn(message, { ...this.defaultMeta, ...meta });
  }

  /**
   * 记录信息日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 额外元数据
   */
  info(message, meta = {}) {
    logger.info(message, { ...this.defaultMeta, ...meta });
  }

  /**
   * 记录HTTP日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 额外元数据
   */
  http(message, meta = {}) {
    logger.http(message, { ...this.defaultMeta, ...meta });
  }

  /**
   * 记录调试日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 额外元数据
   */
  debug(message, meta = {}) {
    logger.debug(message, { ...this.defaultMeta, ...meta });
  }

  /**
   * 记录数据库操作日志
   * @param {string} operation - 操作类型
   * @param {string} table - 表名
   * @param {Object} meta - 额外元数据
   */
  database(operation, table, meta = {}) {
    this.debug(`数据库操作: ${operation}`, {
      operation,
      table,
      ...meta
    });
  }

  /**
   * 记录API请求日志
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {number} duration - 请求处理时间（毫秒）
   */
  apiRequest(req, res, duration) {
    const meta = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      requestId: req.headers['x-request-id'],
      userId: req.user?.id
    };

    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;

    const HTTP_CLIENT_ERROR = 400;
    if (res.statusCode >= HTTP_CLIENT_ERROR) {
      this.warn(message, meta);
    } else {
      this.http(message, meta);
    }
  }

  /**
   * 记录MQTT消息日志
   * @param {string} topic - MQTT主题
   * @param {string} action - 操作类型（publish/subscribe/receive）
   * @param {Object} meta - 额外元数据
   */
  mqtt(topic, action, meta = {}) {
    this.debug(`MQTT ${action}: ${topic}`, {
      topic,
      action,
      ...meta
    });
  }

  /**
   * 记录性能指标日志
   * @param {string} metric - 指标名称
   * @param {number} value - 指标值
   * @param {string} unit - 单位
   * @param {Object} meta - 额外元数据
   */
  metric(metric, value, unit = '', meta = {}) {
    this.info(`性能指标: ${metric} = ${value}${unit}`, {
      metric,
      value,
      unit,
      ...meta
    });
  }

  /**
   * 记录安全事件日志
   * @param {string} event - 事件类型
   * @param {string} description - 事件描述
   * @param {Object} meta - 额外元数据
   */
  security(event, description, meta = {}) {
    this.warn(`安全事件: ${event} - ${description}`, {
      securityEvent: event,
      description,
      ...meta
    });
  }

  /**
   * 记录业务事件日志
   * @param {string} event - 事件类型
   * @param {string} description - 事件描述
   * @param {Object} meta - 额外元数据
   */
  business(event, description, meta = {}) {
    this.info(`业务事件: ${event} - ${description}`, {
      businessEvent: event,
      description,
      ...meta
    });
  }
}

/**
 * 请求日志中间件
 * @param {Object} options - 配置选项
 * @returns {Function} Express中间件函数
 */
export const requestLogger = () => {
  const requestLog = new Logger('http');

  return (req, res, next) => {
    if (!config.logging.enableRequestLogging) {
      return next();
    }

    const startTime = Date.now();

    // 生成请求ID
    const RANDOM_BASE = 36;
    const RANDOM_LENGTH = 9;
    const RANDOM_START = 2;
    req.requestId =
      req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(RANDOM_BASE).substr(RANDOM_START, RANDOM_LENGTH)}`;

    // 设置响应头
    res.setHeader('X-Request-ID', req.requestId);

    // 记录请求开始
    requestLog.http(`请求开始: ${req.method} ${req.originalUrl}`, {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id
    });

    // 监听响应结束事件
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      requestLog.apiRequest(req, res, duration);
    });

    next();
  };
};

/**
 * 错误日志中间件
 * @param {Error} err - 错误对象
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */

// TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)
export const errorLogger = (err, req, res, next) => {
  const errorLog = new Logger('error');

  errorLog.error('请求处理错误', {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      errorCode: err.errorCode
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params
    },
    requestId: req.requestId,
    userId: req.user?.id
  });

  next(err);
};

/**
 * 获取日志统计信息
 * @returns {Object} 统计信息
 */
export function getLogStats() {
  const { logDir } = config.logging;
  const stats = {
    logDirectory: logDir,
    files: []
  };

  if (fs.existsSync(logDir)) {
    const files = fs.readdirSync(logDir);

    for (const file of files) {
      if (file.endsWith('.log')) {
        const filePath = path.join(logDir, file);
        const fileStat = fs.statSync(filePath);

        stats.files.push({
          name: file,
          size: fileStat.size,
          modified: fileStat.mtime,
          created: fileStat.birthtime
        });
      }
    }
  }

  return stats;
}

/**
 * 清理旧日志文件
 * @param {number} daysToKeep - 保留天数
 */
const DEFAULT_DAYS_TO_KEEP = 30;

export function cleanupOldLogs(daysToKeep = DEFAULT_DAYS_TO_KEEP) {
  const { logDir } = config.logging;
  const cleanupLog = new Logger('cleanup');

  if (!fs.existsSync(logDir)) {
    return;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const files = fs.readdirSync(logDir);
  let deletedCount = 0;

  for (const file of files) {
    if (file.endsWith('.log')) {
      const filePath = path.join(logDir, file);
      const fileStat = fs.statSync(filePath);

      if (fileStat.mtime < cutoffDate) {
        try {
          fs.unlinkSync(filePath);
          deletedCount++;
          cleanupLog.info(`删除旧日志文件: ${file}`);
        } catch (error) {
          cleanupLog.error(`删除日志文件失败: ${file}`, { error: error.message });
        }
      }
    }
  }

  cleanupLog.info(`日志清理完成，删除了 ${deletedCount} 个文件`);
}

// 创建默认日志器实例
export const defaultLogger = new Logger('app');

// 导出日志器类和实例
export { Logger };
export default defaultLogger;
