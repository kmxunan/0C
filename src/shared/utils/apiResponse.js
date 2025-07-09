/**
 * API响应标准化工具
 * 确保所有API响应格式的一致性
 */

import { logger } from './logger.js';

// 响应状态码常量
export const HTTP_STATUS = {
  // 成功响应
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // 重定向
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,

  // 客户端错误
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // 服务器错误
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

// 业务错误码常量
export const BUSINESS_CODES = {
  SUCCESS: 'SUCCESS',

  // 认证相关
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',

  // 验证相关
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE: 'VALIDATION_OUT_OF_RANGE',

  // 资源相关
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',

  // 业务逻辑相关
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // 系统相关
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};

// 错误消息映射
const ERROR_MESSAGES = {
  [BUSINESS_CODES.AUTH_INVALID_CREDENTIALS]: '用户名或密码错误',
  [BUSINESS_CODES.AUTH_TOKEN_EXPIRED]: '访问令牌已过期',
  [BUSINESS_CODES.AUTH_TOKEN_INVALID]: '无效的访问令牌',
  [BUSINESS_CODES.AUTH_INSUFFICIENT_PERMISSIONS]: '权限不足',

  [BUSINESS_CODES.VALIDATION_FAILED]: '数据验证失败',
  [BUSINESS_CODES.VALIDATION_REQUIRED_FIELD]: '必填字段缺失',
  [BUSINESS_CODES.VALIDATION_INVALID_FORMAT]: '数据格式无效',
  [BUSINESS_CODES.VALIDATION_OUT_OF_RANGE]: '数据超出允许范围',

  [BUSINESS_CODES.RESOURCE_NOT_FOUND]: '资源未找到',
  [BUSINESS_CODES.RESOURCE_ALREADY_EXISTS]: '资源已存在',
  [BUSINESS_CODES.RESOURCE_CONFLICT]: '资源冲突',
  [BUSINESS_CODES.RESOURCE_LOCKED]: '资源被锁定',

  [BUSINESS_CODES.BUSINESS_RULE_VIOLATION]: '违反业务规则',
  [BUSINESS_CODES.OPERATION_NOT_ALLOWED]: '操作不被允许',
  [BUSINESS_CODES.QUOTA_EXCEEDED]: '配额已超出',

  [BUSINESS_CODES.SYSTEM_ERROR]: '系统内部错误',
  [BUSINESS_CODES.DATABASE_ERROR]: '数据库操作失败',
  [BUSINESS_CODES.EXTERNAL_SERVICE_ERROR]: '外部服务错误',
  [BUSINESS_CODES.RATE_LIMIT_EXCEEDED]: '请求频率超出限制'
};

// 标准响应格式类
export class ApiResponse {
  constructor() {
    this.timestamp = new Date().toISOString();
    this.requestId = null;
    this.success = true;
    this.code = BUSINESS_CODES.SUCCESS;
    this.message = null;
    this.data = null;
    this.errors = null;
    this.meta = null;
  }

  // 设置请求ID
  setRequestId(requestId) {
    this.requestId = requestId;
    return this;
  }

  // 设置成功响应
  setSuccess(data = null, message = null, meta = null) {
    this.success = true;
    this.code = BUSINESS_CODES.SUCCESS;
    this.message = message;
    this.data = data;
    this.meta = meta;
    return this;
  }

  // 设置错误响应
  setError(code, message = null, errors = null, data = null) {
    this.success = false;
    this.code = code;
    this.message = message || ERROR_MESSAGES[code] || '未知错误';
    this.errors = errors;
    this.data = data;
    return this;
  }

  // 设置元数据
  setMeta(meta) {
    this.meta = { ...this.meta, ...meta };
    return this;
  }

  // 添加分页信息
  setPagination(page, limit, total, totalPages = null) {
    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total),
      totalPages: totalPages || Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };

    return this.setMeta({ pagination });
  }

  // 转换为JSON对象
  toJSON() {
    const response = {
      success: this.success,
      timestamp: this.timestamp,
      code: this.code
    };

    if (this.requestId) {
      response.requestId = this.requestId;
    }

    if (this.message) {
      response.message = this.message;
    }

    if (this.data !== null) {
      response.data = this.data;
    }

    if (this.errors) {
      response.errors = this.errors;
    }

    if (this.meta) {
      response.meta = this.meta;
    }

    return response;
  }
}

// 响应构建器类
export class ResponseBuilder {
  // 成功响应
  static success(data = null, message = null, meta = null) {
    return new ApiResponse().setSuccess(data, message, meta);
  }

  // 创建成功响应
  static created(data = null, message = '创建成功', meta = null) {
    return new ApiResponse().setSuccess(data, message, meta);
  }

  // 无内容响应
  static noContent(message = '操作成功') {
    return new ApiResponse().setSuccess(null, message);
  }

  // 分页响应
  static paginated(data, page, limit, total, message = null) {
    return new ApiResponse().setSuccess(data, message).setPagination(page, limit, total);
  }

  // 错误响应
  static error(code, message = null, errors = null, data = null) {
    return new ApiResponse().setError(code, message, errors, data);
  }

  // 验证错误
  static validationError(errors, message = '数据验证失败') {
    return new ApiResponse().setError(BUSINESS_CODES.VALIDATION_FAILED, message, errors);
  }

  // 认证错误
  static unauthorized(message = '认证失败') {
    return new ApiResponse().setError(BUSINESS_CODES.AUTH_TOKEN_INVALID, message);
  }

  // 权限错误
  static forbidden(message = '权限不足') {
    return new ApiResponse().setError(BUSINESS_CODES.AUTH_INSUFFICIENT_PERMISSIONS, message);
  }

  // 资源未找到
  static notFound(resource = '资源', message = null) {
    return new ApiResponse().setError(
      BUSINESS_CODES.RESOURCE_NOT_FOUND,
      message || `${resource}未找到`
    );
  }

  // 资源冲突
  static conflict(message = '资源冲突') {
    return new ApiResponse().setError(BUSINESS_CODES.RESOURCE_CONFLICT, message);
  }

  // 系统错误
  static systemError(message = '系统内部错误', errors = null) {
    return new ApiResponse().setError(BUSINESS_CODES.SYSTEM_ERROR, message, errors);
  }

  // 限流错误
  static rateLimitExceeded(message = '请求频率超出限制') {
    return new ApiResponse().setError(BUSINESS_CODES.RATE_LIMIT_EXCEEDED, message);
  }
}

// Express中间件：添加响应构建器到res对象
export function responseMiddleware(req, res, next) {
  // 添加请求ID
  const requestId =
    req.headers['x-request-id'] || req.headers['x-correlation-id'] || generateRequestId();

  req.requestId = requestId;

  // 添加响应方法到res对象
  res.apiSuccess = (data, message, meta) => {
    const response = ResponseBuilder.success(data, message, meta).setRequestId(requestId);

    logResponse(req, response, HTTP_STATUS.OK);
    return res.status(HTTP_STATUS.OK).json(response.toJSON());
  };

  res.apiCreated = (data, message, meta) => {
    const response = ResponseBuilder.created(data, message, meta).setRequestId(requestId);

    logResponse(req, response, HTTP_STATUS.CREATED);
    return res.status(HTTP_STATUS.CREATED).json(response.toJSON());
  };

  res.apiNoContent = (message) => {
    const response = ResponseBuilder.noContent(message).setRequestId(requestId);

    logResponse(req, response, HTTP_STATUS.NO_CONTENT);
    return res.status(HTTP_STATUS.NO_CONTENT).json(response.toJSON());
  };

  res.apiPaginated = (data, page, limit, total, message) => {
    const response = ResponseBuilder.paginated(data, page, limit, total, message).setRequestId(
      requestId
    );

    logResponse(req, response, HTTP_STATUS.OK);
    return res.status(HTTP_STATUS.OK).json(response.toJSON());
  };

  res.apiError = (code, message, errors, statusCode = HTTP_STATUS.BAD_REQUEST) => {
    const response = ResponseBuilder.error(code, message, errors).setRequestId(requestId);

    logResponse(req, response, statusCode);
    return res.status(statusCode).json(response.toJSON());
  };

  res.apiValidationError = (errors, message) => {
    const response = ResponseBuilder.validationError(errors, message).setRequestId(requestId);

    logResponse(req, response, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(response.toJSON());
  };

  res.apiUnauthorized = (message) => {
    const response = ResponseBuilder.unauthorized(message).setRequestId(requestId);

    logResponse(req, response, HTTP_STATUS.UNAUTHORIZED);
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(response.toJSON());
  };

  res.apiForbidden = (message) => {
    const response = ResponseBuilder.forbidden(message).setRequestId(requestId);

    logResponse(req, response, HTTP_STATUS.FORBIDDEN);
    return res.status(HTTP_STATUS.FORBIDDEN).json(response.toJSON());
  };

  res.apiNotFound = (resource, message) => {
    const response = ResponseBuilder.notFound(resource, message).setRequestId(requestId);

    logResponse(req, response, HTTP_STATUS.NOT_FOUND);
    return res.status(HTTP_STATUS.NOT_FOUND).json(response.toJSON());
  };

  res.apiConflict = (message) => {
    const response = ResponseBuilder.conflict(message).setRequestId(requestId);

    logResponse(req, response, HTTP_STATUS.CONFLICT);
    return res.status(HTTP_STATUS.CONFLICT).json(response.toJSON());
  };

  res.apiSystemError = (message, errors) => {
    const response = ResponseBuilder.systemError(message, errors).setRequestId(requestId);

    logResponse(req, response, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response.toJSON());
  };

  res.apiRateLimitExceeded = (message) => {
    const response = ResponseBuilder.rateLimitExceeded(message).setRequestId(requestId);

    logResponse(req, response, HTTP_STATUS.TOO_MANY_REQUESTS);
    return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(response.toJSON());
  };

  next();
}

// 生成请求ID
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(MATH_CONSTANTS.BASE_36).substr(MATH_CONSTANTS.DECIMAL_PLACES, MATH_CONSTANTS.RANDOM_ID_LENGTH)}`;
}

// 记录响应日志
function logResponse(req, response, statusCode) {
  const logData = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    success: response.success,
    code: response.code,
    userId: req.user?.id,
    ip: req.ip
  };

  if (statusCode >= 500) {
    logger.error('API响应', logData);
  } else if (statusCode >= 400) {
    logger.warn('API响应', logData);
  } else {
    logger.info('API响应', logData);
  }
}

// 响应验证器
export class ResponseValidator {
  static validate(response) {
    const errors = [];

    // 检查必需字段
    if (typeof response.success !== 'boolean') {
      errors.push('success字段必须是布尔值');
    }

    if (!response.timestamp) {
      errors.push('timestamp字段是必需的');
    }

    if (!response.code) {
      errors.push('code字段是必需的');
    }

    // 检查时间戳格式
    if (response.timestamp && !isValidISO8601(response.timestamp)) {
      errors.push('timestamp必须是有效的ISO8601格式');
    }

    // 检查业务代码
    if (response.code && !Object.values(BUSINESS_CODES).includes(response.code)) {
      errors.push('无效的业务代码');
    }

    // 检查成功响应的数据一致性
    if (response.success && response.code !== BUSINESS_CODES.SUCCESS) {
      errors.push('成功响应的code必须是SUCCESS');
    }

    // 检查失败响应的数据一致性
    if (!response.success && response.code === BUSINESS_CODES.SUCCESS) {
      errors.push('失败响应的code不能是SUCCESS');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// 检查ISO8601时间格式
function isValidISO8601(dateString) {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  return iso8601Regex.test(dateString) && !isNaN(Date.parse(dateString));
}

// 响应转换器
export class ResponseTransformer {
  // 转换数据库记录
  static transformDatabaseRecord(record, fields = null) {
    if (!record) {
      return null;
    }

    const transformed = { ...record };

    // 移除敏感字段
    delete transformed.password_hash;
    delete transformed.password;
    delete transformed.secret;
    delete transformed.token;

    // 转换时间字段
    ['created_at', 'updated_at', 'deleted_at', 'last_login', 'expires_at'].forEach((field) => {
      if (transformed[field]) {
        transformed[field] = new Date(transformed[field]).toISOString();
      }
    });

    // 只返回指定字段
    if (fields && Array.isArray(fields)) {
      const filteredRecord = {};
      fields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(transformed, field)) {
          filteredRecord[field] = transformed[field];
        }
      });
      return filteredRecord;
    }

    return transformed;
  }

  // 转换数据库记录列表
  static transformDatabaseRecords(records, fields = null) {
    if (!Array.isArray(records)) {
      return [];
    }

    return records.map((record) => this.transformDatabaseRecord(record, fields));
  }

  // 转换错误对象
  static transformError(error) {
    if (error.isJoi) {
      // Joi验证错误
      return {
        type: 'validation',
        details: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }))
      };
    }

    if (error.code && error.code.startsWith('SQLITE_')) {
      // SQLite错误
      return {
        type: 'database',
        code: error.code,
        message: '数据库操作失败'
      };
    }

    // 通用错误
    return {
      type: 'general',
      message: error.message || '未知错误'
    };
  }
}

// 导出常用函数
export {
  HTTP_STATUS as HttpStatus,
  BUSINESS_CODES as BusinessCodes,
  ERROR_MESSAGES as ErrorMessages
};
