/**
 * 统一错误处理模块
 * 提供标准化的错误类和错误处理中间件
 */

/**
 * 应用程序错误类
 * 继承自Error，添加状态码和错误代码
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    
    // 捕获堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 验证错误类
 */
export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

/**
 * 认证错误类
 */
export class AuthenticationError extends AppError {
  constructor(message = '认证失败') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * 授权错误类
 */
export class AuthorizationError extends AppError {
  constructor(message = '权限不足') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * 资源未找到错误类
 */
export class NotFoundError extends AppError {
  constructor(resource = '资源') {
    super(`${resource}未找到`, 404, 'NOT_FOUND');
  }
}

/**
 * 数据库错误类
 */
export class DatabaseError extends AppError {
  constructor(message = '数据库操作失败', originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

/**
 * 外部服务错误类
 */
export class ExternalServiceError extends AppError {
  constructor(service, message = '外部服务调用失败') {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

/**
 * 错误处理中间件
 * 统一处理应用程序中的错误
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 记录错误日志
  const timestamp = new Date().toISOString();
  const requestId = req.headers['x-request-id'] || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  console.error(`[${timestamp}] [${requestId}] ERROR:`, {
    message: error.message,
    statusCode: error.statusCode,
    errorCode: error.errorCode,
    stack: error.stack,
    request: {
      method: req.method,
      url: req.originalUrl,
      ip,
      userAgent
    },
    user: req.user ? { id: req.user.id, username: req.user.username } : null
  });

  // 处理特定类型的错误
  if (err.name === 'ValidationError') {
    error = new ValidationError(err.message);
  } else if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('无效的访问令牌');
  } else if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('访问令牌已过期');
  } else if (err.code === 'SQLITE_CONSTRAINT') {
    error = new ValidationError('数据约束违反');
  } else if (err.code === 'ENOTFOUND') {
    error = new ExternalServiceError('DNS', '域名解析失败');
  } else if (err.code === 'ECONNREFUSED') {
    error = new ExternalServiceError('Network', '连接被拒绝');
  }

  // 设置默认错误信息
  if (!error.statusCode) {
    error.statusCode = 500;
  }
  if (!error.errorCode) {
    error.errorCode = 'INTERNAL_SERVER_ERROR';
  }

  // 构建响应
  const response = {
    success: false,
    error: {
      code: error.errorCode,
      message: process.env.NODE_ENV === 'production' && error.statusCode === 500 
        ? '服务器内部错误' 
        : error.message,
      timestamp,
      requestId
    }
  };

  // 在开发环境中包含堆栈跟踪
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  // 如果是验证错误，包含字段信息
  if (error instanceof ValidationError && error.field) {
    response.error.field = error.field;
  }

  res.status(error.statusCode).json(response);
};

/**
 * 异步错误包装器
 * 自动捕获异步函数中的错误并传递给错误处理中间件
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404错误处理中间件
 */
export const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`路由 ${req.originalUrl}`);
  next(error);
};

/**
 * 进程异常处理
 */
export const setupProcessHandlers = () => {
  // 处理未捕获的异常
  process.on('uncaughtException', (err) => {
    console.error('未捕获的异常:', err);
    console.error('应用程序将退出...');
    process.exit(1);
  });

  // 处理未处理的Promise拒绝
  process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
    console.error('Promise:', promise);
    // 在生产环境中可能需要退出进程
    if (process.env.NODE_ENV === 'production') {
      console.error('应用程序将退出...');
      process.exit(1);
    }
  });

  // 优雅关闭处理
  const gracefulShutdown = (signal) => {
    console.log(`收到 ${signal} 信号，开始优雅关闭...`);
    // 这里可以添加清理逻辑，如关闭数据库连接、停止定时器等
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  ExternalServiceError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  setupProcessHandlers
};