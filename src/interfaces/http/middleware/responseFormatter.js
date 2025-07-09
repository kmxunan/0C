/* eslint-disable no-console, no-magic-numbers */
/**
 * 响应格式化中间件
 * 提供统一的API响应格式
 */

class ResponseFormatter {
  /**
   * 成功响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 响应消息
   * @param {*} data - 响应数据
   * @param {number} statusCode - HTTP状态码
   */
  static success(res, message = '操作成功', data = null, statusCode = 200) {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString(),
      statusCode
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * 错误响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   * @param {number} statusCode - HTTP状态码
   * @param {*} errors - 详细错误信息
   */
  static error(res, message = '操作失败', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      statusCode
    };

    if (errors !== null) {
      response.errors = errors;
    }

    // 记录错误日志
    if (statusCode >= 500) {
      console.error(`[${new Date().toISOString()}] Server Error:`, {
        message,
        statusCode,
        errors
      });
    }

    return res.status(statusCode).json(response);
  }

  /**
   * 分页响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 响应消息
   * @param {Array} data - 数据数组
   * @param {Object} pagination - 分页信息
   */
  static paginated(res, message = '获取数据成功', data = [], pagination = {}) {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString(),
      statusCode: 200,
      data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        total: pagination.total || 0,
        pages: pagination.pages || 0,
        hasNext: pagination.hasNext || false,
        hasPrev: pagination.hasPrev || false
      }
    };

    return res.status(200).json(response);
  }

  /**
   * 验证错误响应
   * @param {Object} res - Express响应对象
   * @param {Array} validationErrors - 验证错误数组
   */
  static validationError(res, validationErrors) {
    const formattedErrors = validationErrors.map((error) => ({
      field: error.param || error.path,
      message: error.msg || error.message,
      value: error.value
    }));

    return this.error(res, '输入验证失败', 400, formattedErrors);
  }

  /**
   * 未授权响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   */
  static unauthorized(res, message = '未授权访问') {
    return this.error(res, message, 401);
  }

  /**
   * 禁止访问响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   */
  static forbidden(res, message = '禁止访问') {
    return this.error(res, message, 403);
  }

  /**
   * 资源不存在响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   */
  static notFound(res, message = '资源不存在') {
    return this.error(res, message, 404);
  }

  /**
   * 冲突响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   */
  static conflict(res, message = '资源冲突') {
    return this.error(res, message, 409);
  }

  /**
   * 请求过于频繁响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   * @param {number} retryAfter - 重试等待时间（秒）
   */
  static tooManyRequests(res, message = '请求过于频繁', retryAfter = 60) {
    res.setHeader('Retry-After', retryAfter);
    return this.error(res, message, 429);
  }

  /**
   * 服务器内部错误响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   * @param {Error} error - 错误对象
   */
  static internalError(res, message = '服务器内部错误', error = null) {
    // 在开发环境中包含错误堆栈
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorDetails =
      isDevelopment && error
        ? {
          stack: error.stack,
          name: error.name
        }
        : null;

    return this.error(res, message, 500, errorDetails);
  }

  /**
   * 自定义状态码响应
   * @param {Object} res - Express响应对象
   * @param {number} statusCode - HTTP状态码
   * @param {string} message - 响应消息
   * @param {*} data - 响应数据
   */
  static custom(res, statusCode, message, data = null) {
    const isSuccess = statusCode >= 200 && statusCode < 300;

    if (isSuccess) {
      return this.success(res, message, data, statusCode);
    } 
    return this.error(res, message, statusCode, data);
    
  }

  /**
   * 文件下载响应
   * @param {Object} res - Express响应对象
   * @param {Buffer|string} fileData - 文件数据
   * @param {string} filename - 文件名
   * @param {string} contentType - 内容类型
   */
  static fileDownload(res, fileData, filename, contentType = 'application/octet-stream') {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(fileData));

    return res.send(fileData);
  }

  /**
   * 流式响应
   * @param {Object} res - Express响应对象
   * @param {Stream} stream - 数据流
   * @param {string} contentType - 内容类型
   */
  static stream(res, stream, contentType = 'application/octet-stream') {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Transfer-Encoding', 'chunked');

    stream.pipe(res);

    stream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        this.internalError(res, '数据流传输错误', error);
      }
    });
  }

  /**
   * 缓存响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 响应消息
   * @param {*} data - 响应数据
   * @param {number} maxAge - 缓存时间（秒）
   */
  static cached(res, message, data, maxAge = 3600) {
    res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    res.setHeader('ETag', this._generateETag(data));

    return this.success(res, message, data);
  }

  /**
   * 生成ETag
   * @param {*} data - 数据
   * @returns {string} ETag值
   * @private
   */
  static _generateETag(data) {
    const crypto = require('crypto');
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * 健康检查响应
   * @param {Object} res - Express响应对象
   * @param {Object} healthData - 健康状态数据
   */
  static health(res, healthData = {}) {
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      ...healthData
    };

    return res.status(200).json(response);
  }

  /**
   * API版本不支持响应
   * @param {Object} res - Express响应对象
   * @param {string} requestedVersion - 请求的版本
   * @param {Array} supportedVersions - 支持的版本列表
   */
  static unsupportedVersion(res, requestedVersion, supportedVersions = []) {
    return this.error(res, `不支持的API版本: ${requestedVersion}`, 400, {
      requestedVersion,
      supportedVersions
    });
  }

  /**
   * 维护模式响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 维护消息
   * @param {Date} estimatedEnd - 预计结束时间
   */
  static maintenance(res, message = '系统正在维护中', estimatedEnd = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      statusCode: 503,
      maintenance: true
    };

    if (estimatedEnd) {
      response.estimatedEnd = estimatedEnd.toISOString();
      res.setHeader('Retry-After', Math.ceil((estimatedEnd - new Date()) / 1000));
    }

    return res.status(503).json(response);
  }
}

// 中间件函数，将ResponseFormatter添加到res对象
const responseFormatterMiddleware = (req, res, next) => {
  // 将所有静态方法绑定到res对象
  res.success = (message, data, statusCode) =>
    ResponseFormatter.success(res, message, data, statusCode);
  res.error = (message, statusCode, errors) =>
    ResponseFormatter.error(res, message, statusCode, errors);
  res.paginated = (message, data, pagination) =>
    ResponseFormatter.paginated(res, message, data, pagination);
  res.validationError = (validationErrors) =>
    ResponseFormatter.validationError(res, validationErrors);
  res.unauthorized = (message) => ResponseFormatter.unauthorized(res, message);
  res.forbidden = (message) => ResponseFormatter.forbidden(res, message);
  res.notFound = (message) => ResponseFormatter.notFound(res, message);
  res.conflict = (message) => ResponseFormatter.conflict(res, message);
  res.tooManyRequests = (message, retryAfter) =>
    ResponseFormatter.tooManyRequests(res, message, retryAfter);
  res.internalError = (message, error) => ResponseFormatter.internalError(res, message, error);
  res.custom = (statusCode, message, data) =>
    ResponseFormatter.custom(res, statusCode, message, data);
  res.fileDownload = (fileData, filename, contentType) =>
    ResponseFormatter.fileDownload(res, fileData, filename, contentType);
  res.stream = (stream, contentType) => ResponseFormatter.stream(res, stream, contentType);
  res.cached = (message, data, maxAge) => ResponseFormatter.cached(res, message, data, maxAge);
  res.health = (healthData) => ResponseFormatter.health(res, healthData);
  res.unsupportedVersion = (requestedVersion, supportedVersions) =>
    ResponseFormatter.unsupportedVersion(res, requestedVersion, supportedVersions);
  res.maintenance = (message, estimatedEnd) =>
    ResponseFormatter.maintenance(res, message, estimatedEnd);

  next();
};

module.exports = ResponseFormatter;
module.exports.middleware = responseFormatterMiddleware;
