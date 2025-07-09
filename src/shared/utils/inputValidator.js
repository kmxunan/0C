/**
 * 输入验证工具
 * 提供统一的数据验证和清理功能
 */

import Joi from 'joi';
import validator from 'validator';
import { logger } from './logger.js';
import { BUSINESS_CODES } from './apiResponse.js';
import {
  STRING_LENGTH_LIMITS,
  NUMERIC_LIMITS,
  FILE_UPLOAD_LIMITS,
  PASSWORD_STRENGTH,
  DEVICE_TYPES,
  DEVICE_STATUSES,
  USER_ROLES,
  STORAGE_DEVICE_STATUSES,
  ALERT_CONDITION_TYPES,
  ALERT_SEVERITY_LEVELS,
  SORT_ORDERS,
  DEFAULT_VALUES
} from './inputValidatorConstants.js';

// 自定义验证错误类
export class ValidationError extends Error {
  constructor(message, details = null, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.code = BUSINESS_CODES.VALIDATION_FAILED;
    this.details = details;
    this.field = field;
    this.isOperational = true;
  }
}

// 通用验证规则
export const CommonValidationRules = {
  // ID验证
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID必须是数字',
    'number.integer': 'ID必须是整数',
    'number.positive': 'ID必须是正数',
    'any.required': 'ID是必需的'
  }),

  // 可选ID验证
  optionalId: Joi.number().integer().positive().optional().messages({
    'number.base': 'ID必须是数字',
    'number.integer': 'ID必须是整数',
    'number.positive': 'ID必须是正数'
  }),

  // 用户名验证
  username: Joi.string().alphanum().min(STRING_LENGTH_LIMITS.USERNAME_MIN).max(STRING_LENGTH_LIMITS.USERNAME_MAX).required().messages({
    'string.base': '用户名必须是字符串',
    'string.alphanum': '用户名只能包含字母和数字',
    'string.min': `用户名至少需要${STRING_LENGTH_LIMITS.USERNAME_MIN}个字符`,
    'string.max': `用户名不能超过${STRING_LENGTH_LIMITS.USERNAME_MAX}个字符`,
    'any.required': '用户名是必需的'
  }),

  // 邮箱验证
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.base': '邮箱必须是字符串',
      'string.email': '邮箱格式无效',
      'any.required': '邮箱是必需的'
    }),

  // 密码验证
  password: Joi.string()
    .min(STRING_LENGTH_LIMITS.PASSWORD_MIN)
    .max(STRING_LENGTH_LIMITS.PASSWORD_MAX)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.base': '密码必须是字符串',
      'string.min': `密码至少需要${STRING_LENGTH_LIMITS.PASSWORD_MIN}个字符`,
      'string.max': `密码不能超过${STRING_LENGTH_LIMITS.PASSWORD_MAX}个字符`,
      'string.pattern.base': '密码必须包含至少一个大写字母、一个小写字母、一个数字和一个特殊字符',
      'any.required': '密码是必需的'
    }),

  // 设备ID验证
  deviceId: Joi.string()
    .pattern(/^[A-Za-z0-9_-]+$/)
    .min(STRING_LENGTH_LIMITS.DEVICE_ID_MIN)
    .max(STRING_LENGTH_LIMITS.DEVICE_ID_MAX)
    .required()
    .messages({
      'string.base': '设备ID必须是字符串',
      'string.pattern.base': '设备ID只能包含字母、数字、下划线和连字符',
      'string.min': '设备ID不能为空',
      'string.max': `设备ID不能超过${STRING_LENGTH_LIMITS.DEVICE_ID_MAX}个字符`,
      'any.required': '设备ID是必需的'
    }),

  // 设备名称验证
  deviceName: Joi.string().min(STRING_LENGTH_LIMITS.DEVICE_NAME_MIN).max(STRING_LENGTH_LIMITS.DEVICE_NAME_MAX).required().messages({
    'string.base': '设备名称必须是字符串',
    'string.min': '设备名称不能为空',
    'string.max': `设备名称不能超过${STRING_LENGTH_LIMITS.DEVICE_NAME_MAX}个字符`,
    'any.required': '设备名称是必需的'
  }),

  // 设备类型验证
  deviceType: Joi.string()
    .valid(...DEVICE_TYPES)
    .required()
    .messages({
      'any.only':
        `设备类型必须是: ${DEVICE_TYPES.join(', ')} 之一`,
      'any.required': '设备类型是必需的'
    }),

  // 设备状态验证
  deviceStatus: Joi.string()
    .valid(...DEVICE_STATUSES)
    .default(DEFAULT_VALUES.DEVICE_STATUS)
    .messages({
      'any.only': `设备状态必须是: ${DEVICE_STATUSES.join(', ')} 之一`
    }),

  // 用户角色验证
  userRole: Joi.string().valid(...USER_ROLES).default(DEFAULT_VALUES.USER_ROLE).messages({
    'any.only': `用户角色必须是: ${USER_ROLES.join(', ')} 之一`
  }),

  // 时间戳验证
  timestamp: Joi.date().iso().required().messages({
    'date.base': '时间戳必须是有效的日期',
    'date.format': '时间戳必须是ISO格式',
    'any.required': '时间戳是必需的'
  }),

  // 可选时间戳验证
  optionalTimestamp: Joi.date().iso().optional().messages({
    'date.base': '时间戳必须是有效的日期',
    'date.format': '时间戳必须是ISO格式'
  }),

  // 数值验证
  positiveNumber: Joi.number().positive().required().messages({
    'number.base': '必须是数字',
    'number.positive': '必须是正数',
    'any.required': '该字段是必需的'
  }),

  // 可选正数验证
  optionalPositiveNumber: Joi.number().positive().optional().messages({
    'number.base': '必须是数字',
    'number.positive': '必须是正数'
  }),

  // 非负数验证
  nonNegativeNumber: Joi.number().min(0).required().messages({
    'number.base': '必须是数字',
    'number.min': '不能是负数',
    'any.required': '该字段是必需的'
  }),

  // 百分比验证
  percentage: Joi.number().min(NUMERIC_LIMITS.PERCENTAGE_MIN).max(NUMERIC_LIMITS.PERCENTAGE_MAX).required().messages({
    'number.base': '百分比必须是数字',
    'number.min': `百分比不能小于${NUMERIC_LIMITS.PERCENTAGE_MIN}`,
    'number.max': `百分比不能大于${NUMERIC_LIMITS.PERCENTAGE_MAX}`,
    'any.required': '百分比是必需的'
  }),

  // 分页参数验证
  page: Joi.number().integer().min(NUMERIC_LIMITS.PAGE_MIN).default(NUMERIC_LIMITS.PAGE_DEFAULT).messages({
    'number.base': '页码必须是数字',
    'number.integer': '页码必须是整数',
    'number.min': '页码必须大于0'
  }),

  limit: Joi.number().integer().min(NUMERIC_LIMITS.LIMIT_MIN).max(NUMERIC_LIMITS.LIMIT_MAX).default(NUMERIC_LIMITS.LIMIT_DEFAULT).messages({
    'number.base': '每页数量必须是数字',
    'number.integer': '每页数量必须是整数',
    'number.min': '每页数量必须大于0',
    'number.max': `每页数量不能超过${NUMERIC_LIMITS.LIMIT_MAX}`
  }),

  // 排序参数验证
  sortBy: Joi.string().optional().messages({
    'string.base': '排序字段必须是字符串'
  }),

  sortOrder: Joi.string().valid(...SORT_ORDERS).default(DEFAULT_VALUES.SORT_ORDER).messages({
    'any.only': `排序方向必须是 ${SORT_ORDERS.join(' 或 ')}`
  }),

  // 搜索关键词验证
  searchKeyword: Joi.string().min(STRING_LENGTH_LIMITS.SEARCH_KEYWORD_MIN).max(STRING_LENGTH_LIMITS.SEARCH_KEYWORD_MAX).optional().messages({
    'string.base': '搜索关键词必须是字符串',
    'string.min': '搜索关键词不能为空',
    'string.max': `搜索关键词不能超过${STRING_LENGTH_LIMITS.SEARCH_KEYWORD_MAX}个字符`
  }),

  // 布尔值验证
  boolean: Joi.boolean().required().messages({
    'boolean.base': '必须是布尔值',
    'any.required': '该字段是必需的'
  }),

  // 可选布尔值验证
  optionalBoolean: Joi.boolean().optional().messages({
    'boolean.base': '必须是布尔值'
  }),

  // JSON字符串验证
  jsonString: Joi.string()
    .custom((value, helpers) => {
      try {
        JSON.parse(value);
        return value;
      } catch (error) {
        return helpers.error('string.json');
      }
    })
    .messages({
      'string.json': '必须是有效的JSON字符串'
    }),

  // IP地址验证
  ipAddress: Joi.string()
    .ip({ version: ['ipv4', 'ipv6'] })
    .optional()
    .messages({
      'string.ip': '必须是有效的IP地址'
    }),

  // URL验证
  url: Joi.string().uri().optional().messages({
    'string.uri': '必须是有效的URL'
  }),

  // 文件路径验证
  filePath: Joi.string()
    .pattern(/^[^<>:"|?*]+$/)
    .optional()
    .messages({
      'string.pattern.base': '文件路径包含无效字符'
    })
};

// 特定业务验证Schema
export const ValidationSchemas = {
  // 用户相关
  userRegistration: Joi.object({
    username: CommonValidationRules.username,
    email: CommonValidationRules.email,
    password: CommonValidationRules.password,
    role: CommonValidationRules.userRole
  }),

  userLogin: Joi.object({
    username: Joi.string().required().messages({
      'any.required': '用户名是必需的'
    }),
    password: Joi.string().required().messages({
      'any.required': '密码是必需的'
    })
  }),

  userUpdate: Joi.object({
    username: CommonValidationRules.username.optional(),
    email: CommonValidationRules.email.optional(),
    role: CommonValidationRules.userRole.optional(),
    is_active: CommonValidationRules.optionalBoolean
  }).min(NUMERIC_LIMITS.MIN_OBJECT_PROPERTIES),

  // 设备相关
  deviceCreation: Joi.object({
    device_id: CommonValidationRules.deviceId,
    name: CommonValidationRules.deviceName,
    type: CommonValidationRules.deviceType,
    location: Joi.string().max(STRING_LENGTH_LIMITS.LOCATION_MAX).optional(),
    metadata: CommonValidationRules.jsonString.optional()
  }),

  deviceUpdate: Joi.object({
    name: CommonValidationRules.deviceName.optional(),
    type: CommonValidationRules.deviceType.optional(),
    location: Joi.string().max(STRING_LENGTH_LIMITS.LOCATION_MAX).optional(),
    status: CommonValidationRules.deviceStatus.optional(),
    metadata: CommonValidationRules.jsonString.optional()
  }).min(1),

  // 能耗数据相关
  energyDataCreation: Joi.object({
    device_id: CommonValidationRules.deviceId,
    timestamp: CommonValidationRules.timestamp,
    energy_consumption: CommonValidationRules.nonNegativeNumber,
    power: CommonValidationRules.optionalPositiveNumber,
    voltage: CommonValidationRules.optionalPositiveNumber,
    current: CommonValidationRules.optionalPositiveNumber,
    frequency: CommonValidationRules.optionalPositiveNumber,
    power_factor: Joi.number().min(NUMERIC_LIMITS.POWER_FACTOR_MIN).max(NUMERIC_LIMITS.POWER_FACTOR_MAX).optional()
  }),

  // 碳排放数据相关
  carbonDataCreation: Joi.object({
    device_id: CommonValidationRules.deviceId,
    timestamp: CommonValidationRules.timestamp,
    carbon_emission: CommonValidationRules.nonNegativeNumber,
    emission_factor: CommonValidationRules.optionalPositiveNumber,
    calculation_method: Joi.string().max(STRING_LENGTH_LIMITS.CALCULATION_METHOD_MAX).optional()
  }),

  // 储能设备相关
  storageDeviceCreation: Joi.object({
    device_id: CommonValidationRules.deviceId,
    capacity: CommonValidationRules.positiveNumber,
    current_charge: CommonValidationRules.nonNegativeNumber,
    charge_rate: CommonValidationRules.optionalPositiveNumber,
    discharge_rate: CommonValidationRules.optionalPositiveNumber,
    efficiency: CommonValidationRules.percentage.optional()
  }),

  storageDeviceUpdate: Joi.object({
    capacity: CommonValidationRules.positiveNumber.optional(),
    current_charge: CommonValidationRules.nonNegativeNumber.optional(),
    charge_rate: CommonValidationRules.optionalPositiveNumber,
    discharge_rate: CommonValidationRules.optionalPositiveNumber,
    efficiency: CommonValidationRules.percentage.optional(),
    status: Joi.string().valid(...STORAGE_DEVICE_STATUSES).optional()
  }).min(NUMERIC_LIMITS.MIN_OBJECT_PROPERTIES),

  // 告警规则相关
  alertRuleCreation: Joi.object({
    name: Joi.string().min(STRING_LENGTH_LIMITS.ALERT_NAME_MIN).max(STRING_LENGTH_LIMITS.ALERT_NAME_MAX).required(),
    description: Joi.string().max(STRING_LENGTH_LIMITS.DESCRIPTION_MAX).optional(),
    condition_type: Joi.string().valid(...ALERT_CONDITION_TYPES).required(),
    condition_value: CommonValidationRules.positiveNumber,
    device_type: CommonValidationRules.deviceType.optional(),
    device_id: CommonValidationRules.deviceId.optional(),
    severity: Joi.string().valid(...ALERT_SEVERITY_LEVELS).default(DEFAULT_VALUES.ALERT_SEVERITY)
  }),

  // 分页查询参数
  paginationQuery: Joi.object({
    page: CommonValidationRules.page,
    limit: CommonValidationRules.limit,
    sortBy: CommonValidationRules.sortBy,
    sortOrder: CommonValidationRules.sortOrder,
    search: CommonValidationRules.searchKeyword
  }),

  // 时间范围查询
  timeRangeQuery: Joi.object({
    startTime: CommonValidationRules.timestamp,
    endTime: CommonValidationRules.timestamp,
    device_id: CommonValidationRules.deviceId.optional(),
    device_type: CommonValidationRules.deviceType.optional()
  })
    .custom((value, helpers) => {
      if (new Date(value.startTime) >= new Date(value.endTime)) {
        return helpers.error('timeRange.invalid');
      }
      return value;
    })
    .messages({
      'timeRange.invalid': '开始时间必须早于结束时间'
    })
};

// 验证器类
export class InputValidator {
  // 验证数据
  static async validate(data, schema, options = {}) {
    const defaultOptions = {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
      convert: true
    };

    const validationOptions = { ...defaultOptions, ...options };

    try {
      const { error, value } = schema.validate(data, validationOptions);

      if (error) {
        const validationErrors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
          type: detail.type
        }));

        logger.warn('数据验证失败', {
          errors: validationErrors,
          data: this.sanitizeLogData(data)
        });

        throw new ValidationError('数据验证失败', validationErrors);
      }

      return value;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      logger.error('验证过程中发生错误', {
        error: error.message,
        data: this.sanitizeLogData(data)
      });

      throw new ValidationError('验证过程中发生错误', null, null);
    }
  }

  // 验证单个字段
  static validateField(value, rule, fieldName = 'field') {
    try {
      const { error, value: validatedValue } = rule.validate(value);

      if (error) {
        throw new ValidationError(
          `${fieldName}验证失败: ${error.details[0].message}`,
          error.details,
          fieldName
        );
      }

      return validatedValue;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new ValidationError(`${fieldName}验证过程中发生错误`, null, fieldName);
    }
  }

  // 清理敏感数据用于日志记录
  static sanitizeLogData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'key'];
    const sanitized = { ...data };

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  // 验证邮箱格式
  static isValidEmail(email) {
    return validator.isEmail(email);
  }

  // 验证URL格式
  static isValidURL(url) {
    return validator.isURL(url);
  }

  // 验证IP地址
  static isValidIP(ip) {
    return validator.isIP(ip);
  }

  // 验证JSON字符串
  static isValidJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  // 验证密码强度
  static validatePasswordStrength(password) {
    const checks = {
      length: password.length >= PASSWORD_STRENGTH.MIN_LENGTH,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    
    return {
      score,
      strength: score < PASSWORD_STRENGTH.WEAK_SCORE ? 'weak' : score < PASSWORD_STRENGTH.STRONG_SCORE ? 'medium' : 'strong',
      checks
    };
  }

  // 清理HTML内容
  static sanitizeHTML(html) {
    return validator.escape(html);
  }

  // 清理SQL注入
  static sanitizeSQL(input) {
    if (typeof input !== 'string') {
      return input;
    }

    // 移除潜在的SQL注入字符
    return input.replace(/[';"\\]/g, '');
  }

  // 验证文件上传
  static validateFileUpload(file, options = {}) {
    const {
      maxSize = FILE_UPLOAD_LIMITS.MAX_SIZE_BYTES,
      allowedTypes = FILE_UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES,
      allowedExtensions = FILE_UPLOAD_LIMITS.ALLOWED_EXTENSIONS
    } = options;

    const errors = [];

    if (!file) {
      errors.push('文件是必需的');
      return { valid: false, errors };
    }

    if (file.size > maxSize) {
      errors.push(`文件大小不能超过 ${FILE_UPLOAD_LIMITS.MAX_SIZE_MB}MB`);
    }

    if (!allowedTypes.includes(file.mimetype)) {
      errors.push(`文件类型不支持，支持的类型: ${allowedTypes.join(', ')}`);
    }

    const fileExtension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push(`文件扩展名不支持，支持的扩展名: ${allowedExtensions.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Express中间件：请求验证
export function validationMiddleware(schema, source = 'body') {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const validatedData = await InputValidator.validate(dataToValidate, schema);

      // 将验证后的数据替换原始数据
      req[source] = validatedData;

      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.apiValidationError(error.details, error.message);
      }

      logger.error('验证中间件错误', { error: error.message });
      return res.apiSystemError('验证过程中发生错误');
    }
  };
}

// 查询参数验证中间件
export function queryValidationMiddleware(schema) {
  return validationMiddleware(schema, 'query');
}

// 路径参数验证中间件
export function paramsValidationMiddleware(schema) {
  return validationMiddleware(schema, 'params');
}

// 导出常用验证函数
export const { validate } = InputValidator;
export const { validateField } = InputValidator;
