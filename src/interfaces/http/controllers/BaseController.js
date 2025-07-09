/* eslint-disable no-console, no-magic-numbers */
/**
 * 基础控制器类
 * 提供通用的控制器功能和错误处理
 */

import responseFormatter from '../middleware/responseFormatter.js';

class BaseController {
  constructor() {
    // 绑定方法到实例，确保正确的this上下文
    this.handleRequest = this.handleRequest.bind(this);
    this.handleError = this.handleError.bind(this);
    this.validateRequest = this.validateRequest.bind(this);
    this.getPaginationParams = this.getPaginationParams.bind(this);
    this.getSortingParams = this.getSortingParams.bind(this);
    this.getFilterParams = this.getFilterParams.bind(this);
  }

  /**
   * 通用请求处理包装器
   * @param {Function} handler - 处理函数
   * @returns {Function} Express路由处理函数
   */
  handleRequest(handler) {
    return async (req, res, next) => {
      try {
        await handler(req, res, next);
      } catch (error) {
        this.handleError(error, req, res, next);
      }
    };
  }

  /**
   * 统一错误处理
   * @param {Error} error - 错误对象
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express next函数
   */
  handleError(error, req, res, _next) {
    console.error(`[${new Date().toISOString()}] Controller Error:`, {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      user: req.user?.username || 'anonymous',
      body: req.body,
      params: req.params,
      query: req.query
    });

    // 根据错误类型返回相应的响应
    if (error.name === 'ValidationError') {
      return responseFormatter.validationError(res, '数据验证失败', error.details);
    } else if (error.name === 'UnauthorizedError') {
      return responseFormatter.unauthorized(res, error.message);
    } else if (error.name === 'ForbiddenError') {
      return responseFormatter.forbidden(res, error.message);
    } else if (error.name === 'NotFoundError') {
      return responseFormatter.notFound(res, error.message);
    } else if (error.name === 'ConflictError') {
      return responseFormatter.conflict(res, error.message);
    } else if (error.name === 'TooManyRequestsError') {
      return responseFormatter.tooManyRequests(res, error.message);
    } 
    return responseFormatter.internalError(res, '服务器内部错误', error);
    
  }

  /**
   * 验证请求数据
   * @param {Object} req - Express请求对象
   * @param {Object} schema - 验证模式
   * @throws {ValidationError} 验证失败时抛出错误
   */
  validateRequest(req, schema) {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationError = new Error('数据验证失败');
      validationError.name = 'ValidationError';
      validationError.details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      throw validationError;
    }

    return value;
  }

  /**
   * 获取分页参数
   * @param {Object} req - Express请求对象
   * @returns {Object} 分页参数
   */
  getPaginationParams(req) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || (page - 1) * limit;

    return {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)),
      offset: Math.max(0, offset)
    };
  }

  /**
   * 获取排序参数
   * @param {Object} req - Express请求对象
   * @param {Array} allowedFields - 允许排序的字段
   * @returns {Object} 排序参数
   */
  getSortingParams(req, allowedFields = []) {
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = (req.query.sortOrder || 'desc').toLowerCase();

    // 验证排序字段
    const validSortBy =
      allowedFields.length > 0 && !allowedFields.includes(sortBy) ? allowedFields[0] : sortBy;

    // 验证排序方向
    const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';

    return {
      sortBy: validSortBy,
      sortOrder: validSortOrder,
      orderBy: `${validSortBy} ${validSortOrder.toUpperCase()}`
    };
  }

  /**
   * 获取过滤参数
   * @param {Object} req - Express请求对象
   * @param {Array} allowedFilters - 允许的过滤字段
   * @returns {Object} 过滤参数
   */
  getFilterParams(req, allowedFilters = []) {
    const filters = {};

    // 处理查询参数中的过滤条件
    for (const [key, value] of Object.entries(req.query)) {
      if (allowedFilters.includes(key) && value !== undefined && value !== '') {
        // 处理不同类型的过滤条件
        if (key.endsWith('_min') || key.endsWith('_max')) {
          // 数值范围过滤
          const fieldName = key.replace(/_min$|_max$/, '');
          if (!filters[fieldName]) {filters[fieldName] = {};}

          if (key.endsWith('_min')) {
            filters[fieldName].min = parseFloat(value);
          } else {
            filters[fieldName].max = parseFloat(value);
          }
        } else if (key.endsWith('_like')) {
          // 模糊匹配
          const fieldName = key.replace(/_like$/, '');
          filters[fieldName] = { like: `%${value}%` };
        } else if (key.endsWith('_in')) {
          // 数组包含
          const fieldName = key.replace(/_in$/, '');
          filters[fieldName] = { in: Array.isArray(value) ? value : value.split(',') };
        } else {
          // 精确匹配
          filters[key] = value;
        }
      }
    }

    return filters;
  }

  /**
   * 获取搜索参数
   * @param {Object} req - Express请求对象
   * @returns {Object} 搜索参数
   */
  getSearchParams(req) {
    const keyword = req.query.keyword || req.query.q || '';
    const searchFields = req.query.searchFields
      ? req.query.searchFields.split(',').map((field) => field.trim())
      : [];

    return {
      keyword: keyword.trim(),
      searchFields,
      hasSearch: keyword.trim().length > 0
    };
  }

  /**
   * 获取日期范围参数
   * @param {Object} req - Express请求对象
   * @returns {Object} 日期范围参数
   */
  getDateRangeParams(req) {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    // 验证日期有效性
    const validStartDate = startDate && !isNaN(startDate.getTime()) ? startDate : null;
    const validEndDate = endDate && !isNaN(endDate.getTime()) ? endDate : null;

    // 确保结束日期不早于开始日期
    let finalStartDate = validStartDate;
    let finalEndDate = validEndDate;
    if (finalStartDate && finalEndDate && finalEndDate < finalStartDate) {
      const temp = finalStartDate;
      finalStartDate = finalEndDate;
      finalEndDate = temp;
    }

    return {
      startDate: finalStartDate,
      endDate: finalEndDate,
      hasDateRange: finalStartDate || finalEndDate
    };
  }

  /**
   * 构建查询条件
   * @param {Object} req - Express请求对象
   * @param {Object} options - 查询选项
   * @returns {Object} 查询条件
   */
  buildQueryConditions(req, options = {}) {
    const {
      allowedFilters = [],
      allowedSortFields = [],
      defaultSort: _defaultSort = 'createdAt',
      searchFields = []
    } = options;

    const pagination = this.getPaginationParams(req);
    const sorting = this.getSortingParams(req, allowedSortFields);
    const filters = this.getFilterParams(req, allowedFilters);
    const search = this.getSearchParams(req);
    const dateRange = this.getDateRangeParams(req);

    return {
      pagination,
      sorting,
      filters,
      search,
      dateRange,
      // 构建完整的查询对象
      query: {
        ...filters,
        ...(search.hasSearch && searchFields.length > 0
          ? {
            $or: searchFields.map((field) => ({
              [field]: { $regex: search.keyword, $options: 'i' }
            }))
          }
          : {}),
        ...(dateRange.hasDateRange
          ? {
            ...(dateRange.startDate ? { createdAt: { $gte: dateRange.startDate } } : {}),
            ...(dateRange.endDate
              ? { createdAt: { ...filters.createdAt, $lte: dateRange.endDate } }
              : {})
          }
          : {})
      }
    };
  }

  /**
   * 格式化分页响应
   * @param {Array} data - 数据数组
   * @param {number} total - 总数
   * @param {Object} pagination - 分页参数
   * @returns {Object} 分页响应对象
   */
  formatPaginatedResponse(data, total, pagination) {
    const { page, limit } = pagination;
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data,
      pagination: {
        current: page,
        total: totalPages,
        count: data.length,
        totalCount: total,
        limit,
        hasNext: hasNextPage,
        hasPrev: hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      }
    };
  }

  /**
   * 检查资源是否存在
   * @param {*} resource - 资源对象
   * @param {string} resourceName - 资源名称
   * @throws {NotFoundError} 资源不存在时抛出错误
   */
  checkResourceExists(resource, resourceName = '资源') {
    if (!resource) {
      const error = new Error(`${resourceName}不存在`);
      error.name = 'NotFoundError';
      throw error;
    }
  }

  /**
   * 检查用户权限
   * @param {Object} req - Express请求对象
   * @param {string|Array} requiredRoles - 需要的角色
   * @throws {ForbiddenError} 权限不足时抛出错误
   */
  checkPermission(req, requiredRoles) {
    const userRole = req.user?.role;
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (!userRole || !roles.includes(userRole)) {
      const error = new Error('权限不足');
      error.name = 'ForbiddenError';
      throw error;
    }
  }

  /**
   * 检查资源所有权
   * @param {Object} req - Express请求对象
   * @param {Object} resource - 资源对象
   * @param {string} ownerField - 所有者字段名
   * @throws {ForbiddenError} 不是资源所有者时抛出错误
   */
  checkOwnership(req, resource, ownerField = 'userId') {
    const userId = req.user?.userId;
    const resourceOwnerId = resource[ownerField];

    if (req.user?.role !== 'admin' && userId !== resourceOwnerId) {
      const error = new Error('只能操作自己的资源');
      error.name = 'ForbiddenError';
      throw error;
    }
  }

  /**
   * 记录操作日志
   * @param {Object} req - Express请求对象
   * @param {string} action - 操作类型
   * @param {Object} details - 操作详情
   */
  logOperation(req, action, details = {}) {
    console.log(`[${new Date().toISOString()}] Operation Log:`, {
      action,
      user: req.user?.username || 'anonymous',
      userId: req.user?.userId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      ...details
    });
  }

  /**
   * 清理敏感数据
   * @param {Object} data - 数据对象
   * @param {Array} sensitiveFields - 敏感字段列表
   * @returns {Object} 清理后的数据
   */
  sanitizeData(data, sensitiveFields = ['password', 'token', 'secret']) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveFields.includes(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value, sensitiveFields);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * 成功响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 响应消息
   * @param {Object} data - 响应数据
   * @param {number} statusCode - HTTP状态码
   */
  success(res, message, data = null, statusCode = 200) {
    return responseFormatter.success(res, message, data, statusCode);
  }

  /**
   * 错误响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   * @param {number} statusCode - HTTP状态码
   * @param {Object} details - 错误详情
   */
  error(res, message, statusCode = 500, details = null) {
    return responseFormatter.error(res, message, statusCode, details);
  }

  /**
   * 验证错误响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   * @param {Object} details - 验证错误详情
   */
  validationError(res, message, details = null) {
    return responseFormatter.validationError(res, message, details);
  }

  /**
   * 未授权响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   */
  unauthorized(res, message = '未授权访问') {
    return responseFormatter.unauthorized(res, message);
  }

  /**
   * 禁止访问响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   */
  forbidden(res, message = '禁止访问') {
    return responseFormatter.forbidden(res, message);
  }

  /**
   * 资源未找到响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   */
  notFound(res, message = '资源未找到') {
    return responseFormatter.notFound(res, message);
  }
}

export default BaseController;
