import logger from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
/* eslint-disable no-magic-numbers */

/**
 * 统一错误处理中间件
 * @param {Error} err - 错误对象
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const errorHandler = (err, req, res, _next) => {
  let error = err;

  // 如果不是 AppError 实例，转换为 AppError
  if (!(error instanceof AppError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || '服务器内部错误';
    error = new AppError(message, statusCode);
  }

  // 记录错误日志
  const logData = {
    error: {
      message: error.message,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      stack: error.stack
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      body: req.method !== 'GET' ? req.body : undefined
    },
    timestamp: new Date().toISOString()
  };

  // 根据错误级别记录不同级别的日志
  if (error.statusCode >= 500) {
    logger.error('服务器错误', logData);
  } else if (error.statusCode >= 400) {
    logger.warn('客户端错误', logData);
  } else {
    logger.info('请求错误', logData);
  }

  // 构建响应数据
  const responseData = {
    success: false,
    error: {
      code: error.errorCode,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp
    }
  };

  // 开发环境下包含堆栈信息
  if (process.env.NODE_ENV === 'development') {
    responseData.error.stack = error.stack;
    responseData.error.request = {
      method: req.method,
      url: req.originalUrl
    };
  }

  // 发送错误响应
  res.status(error.statusCode).json(responseData);
};

/**
 * 异步错误包装器
 * 用于包装异步路由处理器，自动捕获异步错误
 * @param {Function} fn - 异步函数
 * @returns {Function} 包装后的函数
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 错误处理中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`路由 ${req.originalUrl} 未找到`, 404, 'ROUTE_NOT_FOUND', {
    method: req.method,
    url: req.originalUrl
  });
  next(error);
};

/**
 * 数据库错误转换器
 * 将数据库特定错误转换为应用程序错误
 * @param {Error} err - 数据库错误
 * @returns {AppError} 应用程序错误
 */
const handleDatabaseError = (err) => {
  // SQLite 错误处理
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return new AppError('数据已存在', 409, 'DUPLICATE_ENTRY', {
      field: err.message.match(/\.(\w+)/)?.[1]
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return new AppError('关联数据不存在', 400, 'FOREIGN_KEY_CONSTRAINT');
  }

  if (err.code === 'SQLITE_CONSTRAINT_NOTNULL') {
    return new AppError('必填字段不能为空', 400, 'REQUIRED_FIELD_MISSING', {
      field: err.message.match(/\.(\w+)/)?.[1]
    });
  }

  // 通用数据库错误
  return new AppError('数据库操作失败', 500, 'DATABASE_ERROR', {
    originalError: err.message
  });
};

/**
 * JWT 错误转换器
 * @param {Error} err - JWT 错误
 * @returns {AppError} 应用程序错误
 */
const handleJWTError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return new AppError('无效的访问令牌', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return new AppError('访问令牌已过期', 401, 'TOKEN_EXPIRED');
  }

  return new AppError('令牌验证失败', 401, 'TOKEN_VERIFICATION_FAILED');
};

export { errorHandler, asyncHandler, notFoundHandler, handleDatabaseError, handleJWTError };

export default errorHandler;
