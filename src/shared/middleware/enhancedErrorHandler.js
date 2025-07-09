/* eslint-disable no-magic-numbers */
/**
 * 增强的错误处理中间件
 * 提供统一的错误响应格式和错误分类
 */

import { logger } from '../utils/logger.js';

// 错误类型枚举
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
};

// 自定义错误类
export class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    errorType = ErrorTypes.INTERNAL_SERVER_ERROR,
    details = null
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 验证错误
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, ErrorTypes.VALIDATION_ERROR, details);
    this.name = 'ValidationError';
  }
}

// 认证错误
export class AuthenticationError extends AppError {
  constructor(message = '认证失败') {
    super(message, 401, ErrorTypes.AUTHENTICATION_ERROR);
    this.name = 'AuthenticationError';
  }
}

// 授权错误
export class AuthorizationError extends AppError {
  constructor(message = '权限不足') {
    super(message, 403, ErrorTypes.AUTHORIZATION_ERROR);
    this.name = 'AuthorizationError';
  }
}

// 资源未找到错误
export class NotFoundError extends AppError {
  constructor(resource = '资源') {
    super(`${resource}未找到`, 404, ErrorTypes.NOT_FOUND_ERROR);
    this.name = 'NotFoundError';
  }
}

// 冲突错误
export class ConflictError extends AppError {
  constructor(message = '资源冲突') {
    super(message, 409, ErrorTypes.CONFLICT_ERROR);
    this.name = 'ConflictError';
  }
}

// 数据库错误
export class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, ErrorTypes.DATABASE_ERROR, originalError);
    this.name = 'DatabaseError';
  }
}

// 外部服务错误
export class ExternalServiceError extends AppError {
  constructor(service, message, statusCode = 502) {
    super(`${service}服务错误: ${message}`, statusCode, ErrorTypes.EXTERNAL_SERVICE_ERROR);
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

// 限流错误
export class RateLimitError extends AppError {
  constructor(message = '请求过于频繁，请稍后再试') {
    super(message, 429, ErrorTypes.RATE_LIMIT_ERROR);
    this.name = 'RateLimitError';
  }
}

// 错误响应格式化
function formatErrorResponse(error, req) {
  const response = {
    success: false,
    error: {
      type: error.errorType || ErrorTypes.INTERNAL_SERVER_ERROR,
      message: error.message,
      code: error.statusCode || 500
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // 开发环境下包含更多调试信息
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
    if (error.details) {
      response.error.details = error.details;
    }
  }

  // 生产环境下隐藏敏感信息
  if (process.env.NODE_ENV === 'production' && error.statusCode === 500) {
    response.error.message = '服务器内部错误';
  }

  return response;
}

// 数据库错误处理
function handleDatabaseError(error) {
  // SQLite错误处理
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return new ConflictError('数据已存在，请检查唯一性约束');
  }

  if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return new ValidationError('外键约束违反，请检查关联数据');
  }

  if (error.message && error.message.includes('no such column')) {
    return new DatabaseError('数据库结构错误，请检查字段名称');
  }

  if (error.message && error.message.includes('no such table')) {
    return new DatabaseError('数据表不存在，请检查数据库迁移');
  }

  // Knex.js错误处理
  if (error.code === 'ER_DUP_ENTRY') {
    return new ConflictError('数据重复，请检查唯一性约束');
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return new ValidationError('外键约束违反，关联数据不存在');
  }

  return new DatabaseError('数据库操作失败', error);
}

// JWT错误处理
function handleJWTError(error) {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('无效的访问令牌');
  }

  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('访问令牌已过期');
  }

  if (error.name === 'NotBeforeError') {
    return new AuthenticationError('访问令牌尚未生效');
  }

  return new AuthenticationError('令牌验证失败');
}

// 验证错误处理
function handleValidationError(error) {
  if (error.name === 'ValidationError' && error.details) {
    const messages = error.details.map((detail) => detail.message);
    return new ValidationError('数据验证失败', messages);
  }

  return new ValidationError(error.message);
}

// 主错误处理中间件
export function enhancedErrorHandler(error, req, res, _next) {
  let processedError = error;

  // 如果不是自定义错误，进行错误转换
  if (!error.isOperational) {
    // 数据库错误
    if (error.code && (error.code.startsWith('SQLITE_') || error.code.startsWith('ER_'))) {
      processedError = handleDatabaseError(error);
    }
    // JWT错误
    else if (error.name && error.name.includes('Token')) {
      processedError = handleJWTError(error);
    }
    // 验证错误
    else if (error.name === 'ValidationError') {
      processedError = handleValidationError(error);
    }
    // 其他未知错误
    else {
      processedError = new AppError(
        error.message || '服务器内部错误',
        error.statusCode || 500,
        ErrorTypes.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 记录错误日志
  const logLevel = processedError.statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel]('请求处理错误', {
    error: {
      name: processedError.name,
      message: processedError.message,
      type: processedError.errorType,
      statusCode: processedError.statusCode,
      stack: processedError.stack
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      body: req.method !== 'GET' ? req.body : undefined
    }
  });

  // 发送错误响应
  const errorResponse = formatErrorResponse(processedError, req);
  res.status(processedError.statusCode || 500).json(errorResponse);
}

// 404错误处理中间件
export function notFoundHandler(req, res, _next) {
  const error = new NotFoundError(`路由 ${req.originalUrl}`);
  _next(error);
}

// 异步错误捕获包装器
export function asyncHandler(fn) {
  return (req, res, _next) => {
    Promise.resolve(fn(req, res, _next)).catch(_next);
  };
}

// 错误恢复策略
export class ErrorRecoveryStrategy {
  static async retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        // 指数退避
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, waitTime));

        logger.warn(`操作重试 ${attempt}/${maxRetries}`, {
          error: error.message,
          nextRetryIn: waitTime
        });
      }
    }
  }

  static async circuitBreaker(operation, threshold = 5, timeout = 60000) {
    // 简单的断路器实现
    const key = operation.name || 'default';

    if (!this.failures) {
      this.failures = new Map();
    }

    const failures = this.failures.get(key) || { count: 0, lastFailure: 0 };

    // 检查断路器状态
    if (failures.count >= threshold) {
      const timeSinceLastFailure = Date.now() - failures.lastFailure;
      if (timeSinceLastFailure < timeout) {
        throw new ExternalServiceError('服务', '服务暂时不可用，请稍后重试', 503);
      } else {
        // 重置计数器
        failures.count = 0;
      }
    }

    try {
      const result = await operation();
      // 成功时重置计数器
      failures.count = 0;
      this.failures.set(key, failures);
      return result;
    } catch (error) {
      // 失败时增加计数器
      failures.count++;
      failures.lastFailure = Date.now();
      this.failures.set(key, failures);
      throw error;
    }
  }
}

// 健康检查错误处理
export function healthCheckErrorHandler(error) {
  if (error.code === 'ECONNREFUSED') {
    return {
      status: 'unhealthy',
      error: '数据库连接失败',
      details: error.message
    };
  }

  if (error.code === 'ETIMEDOUT') {
    return {
      status: 'unhealthy',
      error: '服务响应超时',
      details: error.message
    };
  }

  return {
    status: 'unhealthy',
    error: '健康检查失败',
    details: error.message
  };
}
