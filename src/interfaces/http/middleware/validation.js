/* eslint-disable no-magic-numbers */
/**
 * 输入验证中间件
 * 使用Joi进行请求数据验证和清理
 */

import Joi from 'joi';
import { ValidationError } from '../utils/errorHandler.js';

/**
 * 通用验证中间件
 * @param {Object} schema - Joi验证模式
 * @param {Object} options - 验证选项
 */
export const validateRequest = (schema, options = {}) => {
  const defaultOptions = {
    abortEarly: false, // 返回所有验证错误
    allowUnknown: false, // 不允许未知字段
    stripUnknown: true, // 移除未知字段
    ...options
  };

  return (req, res, next) => {
    const dataToValidate = {
      body: req.body || {},
      query: req.query || {},
      params: req.params || {},
      headers: req.headers || {}
    };

    const { error, value } = schema.validate(dataToValidate, defaultOptions);

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join('; ');

      const field = error.details[0]?.path?.join('.') || null;

      return next(new ValidationError(errorMessage, field));
    }

    // 将验证后的数据替换原始数据
    req.body = value.body || {};
    req.query = value.query || {};
    req.params = value.params || {};

    next();
  };
};

/**
 * 自定义验证规则
 */
const customValidators = {
  // 设备ID验证
  deviceId: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .min(3)
    .max(50)
    .messages({
      'string.pattern.base': '设备ID只能包含字母、数字、下划线和连字符',
      'string.min': '设备ID长度至少3个字符',
      'string.max': '设备ID长度不能超过50个字符'
    }),

  // 时间戳验证
  timestamp: Joi.date().iso().max('now').messages({
    'date.format': '时间戳必须是有效的ISO 8601格式',
    'date.max': '时间戳不能是未来时间'
  }),

  // 能耗值验证
  energyValue: Joi.number().positive().precision(3).max(999999).messages({
    'number.positive': '能耗值必须为正数',
    'number.precision': '能耗值最多保留3位小数',
    'number.max': '能耗值不能超过999999'
  }),

  // 碳排放值验证
  carbonValue: Joi.number().min(0).precision(6).max(999999).messages({
    'number.min': '碳排放值不能为负数',
    'number.precision': '碳排放值最多保留6位小数',
    'number.max': '碳排放值不能超过999999'
  }),

  // 分页参数验证
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0)
  },

  // 时间范围验证
  timeRange: {
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().min(Joi.ref('startTime')).required()
  },

  // 用户名验证
  username: Joi.string().alphanum().min(3).max(30).messages({
    'string.alphanum': '用户名只能包含字母和数字',
    'string.min': '用户名长度至少3个字符',
    'string.max': '用户名长度不能超过30个字符'
  }),

  // 密码验证
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]$/)
    .messages({
      'string.min': '密码长度至少8个字符',
      'string.max': '密码长度不能超过128个字符',
      'string.pattern.base': '密码必须包含大小写字母、数字和特殊字符'
    }),

  // 邮箱验证
  email: Joi.string().email().max(255).messages({
    'string.email': '邮箱格式无效',
    'string.max': '邮箱长度不能超过255个字符'
  })
};

/**
 * 能源数据验证模式
 */
export const energyDataSchema = Joi.object({
  body: Joi.object({
    device_id: customValidators.deviceId.required(),
    value: customValidators.energyValue.required(),
    unit: Joi.string().valid('kWh', 'MWh', 'GWh').required(),
    timestamp: customValidators.timestamp.required(),
    location: Joi.string().max(100).optional(),
    metadata: Joi.object().optional()
  })
});

/**
 * 碳排放数据验证模式
 */
export const carbonDataSchema = Joi.object({
  body: Joi.object({
    device_id: customValidators.deviceId.required(),
    emission_value: customValidators.carbonValue.required(),
    emission_factor: Joi.number().positive().precision(6).required(),
    energy_consumption: customValidators.energyValue.required(),
    timestamp: customValidators.timestamp.required(),
    calculation_method: Joi.string().valid('direct', 'indirect', 'lifecycle').default('direct'),
    metadata: Joi.object().optional()
  })
});

/**
 * 电池数据验证模式
 */
export const batteryDataSchema = Joi.object({
  body: Joi.object({
    device_id: customValidators.deviceId.required(),
    soc: Joi.number().min(0).max(100).precision(2).required(), // 电量百分比
    voltage: Joi.number().positive().precision(3).required(),
    current: Joi.number().precision(3).required(), // 可以为负数（放电）
    temperature: Joi.number().min(-50).max(100).precision(2).required(),
    capacity: Joi.number().positive().precision(3).required(),
    cycle_count: Joi.number().integer().min(0).optional(),
    health_status: Joi.string().valid('good', 'warning', 'critical').default('good'),
    timestamp: customValidators.timestamp.required(),
    metadata: Joi.object().optional()
  })
});

/**
 * 用户注册验证模式
 */
export const userRegistrationSchema = Joi.object({
  body: Joi.object({
    username: customValidators.username.required(),
    password: customValidators.password.required(),
    email: customValidators.email.required(),
    full_name: Joi.string().min(2).max(100).required(),
    role: Joi.string().valid('admin', 'operator', 'viewer').default('viewer'),
    department: Joi.string().max(100).optional(),
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .optional()
  })
});

/**
 * 用户登录验证模式
 */
export const userLoginSchema = Joi.object({
  body: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
    remember_me: Joi.boolean().default(false)
  })
});

/**
 * 数据查询验证模式
 */
export const dataQuerySchema = Joi.object({
  query: Joi.object({
    device_id: customValidators.deviceId.optional(),
    start_time: Joi.date().iso().optional(),
    end_time: Joi.date().iso().min(Joi.ref('start_time')).optional(),
    page: customValidators.pagination.page,
    limit: customValidators.pagination.limit,
    sort_by: Joi.string().valid('timestamp', 'value', 'device_id').default('timestamp'),
    sort_order: Joi.string().valid('asc', 'desc').default('desc'),
    aggregation: Joi.string().valid('none', 'hourly', 'daily', 'monthly').default('none')
  })
});

/**
 * 设备管理验证模式
 */
export const deviceSchema = Joi.object({
  body: Joi.object({
    device_id: customValidators.deviceId.required(),
    device_name: Joi.string().min(2).max(100).required(),
    device_type: Joi.string()
      .valid('energy_meter', 'carbon_sensor', 'battery', 'solar_panel', 'wind_turbine')
      .required(),
    location: Joi.string().max(200).required(),
    manufacturer: Joi.string().max(100).optional(),
    model: Joi.string().max(100).optional(),
    installation_date: Joi.date().iso().max('now').optional(),
    status: Joi.string().valid('active', 'inactive', 'maintenance').default('active'),
    specifications: Joi.object().optional(),
    metadata: Joi.object().optional()
  })
});

/**
 * 告警规则验证模式
 */
export const alertRuleSchema = Joi.object({
  body: Joi.object({
    rule_name: Joi.string().min(2).max(100).required(),
    device_id: customValidators.deviceId.optional(),
    metric_type: Joi.string()
      .valid('energy', 'carbon', 'battery_soc', 'battery_temperature')
      .required(),
    condition: Joi.string().valid('>', '<', '>=', '<=', '==', '!=').required(),
    threshold_value: Joi.number().required(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
    enabled: Joi.boolean().default(true),
    notification_channels: Joi.array()
      .items(Joi.string().valid('email', 'sms', 'webhook'))
      .min(1)
      .required(),
    description: Joi.string().max(500).optional()
  })
});

/**
 * 报告生成验证模式
 */
export const reportGenerationSchema = Joi.object({
  body: Joi.object({
    report_type: Joi.string()
      .valid('energy_consumption', 'carbon_emission', 'battery_performance', 'comprehensive')
      .required(),
    start_time: Joi.date().iso().required(),
    end_time: Joi.date().iso().min(Joi.ref('start_time')).required(),
    device_ids: Joi.array().items(customValidators.deviceId).optional(),
    aggregation_level: Joi.string().valid('hourly', 'daily', 'weekly', 'monthly').default('daily'),
    include_charts: Joi.boolean().default(true),
    format: Joi.string().valid('pdf', 'excel', 'csv').default('pdf'),
    email_recipients: Joi.array().items(customValidators.email).optional()
  })
});

/**
 * ID参数验证模式
 */
export const idParamSchema = Joi.object({
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9]+$/)
      .required()
      .messages({
        'string.pattern.base': 'ID必须是有效的数字'
      })
  })
});

/**
 * 设备ID参数验证模式
 */
export const deviceIdParamSchema = Joi.object({
  params: Joi.object({
    deviceId: customValidators.deviceId.required()
  })
});

/**
 * 文件上传验证
 */
export const validateFileUpload =
  (allowedTypes = [], maxSize = 10 * 1024 * 1024) =>
    (req, res, next) => {
      if (!req.file && !req.files) {
        return next(new ValidationError('未找到上传的文件'));
      }

      const files = req.files || [req.file];

      for (const file of files) {
      // 检查文件类型
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
          return next(
            new ValidationError(
              `不支持的文件类型: ${file.mimetype}，支持的类型: ${allowedTypes.join(', ')}`
            )
          );
        }

        // 检查文件大小
        if (file.size > maxSize) {
          return next(
            new ValidationError(`文件大小超过限制: ${file.size} bytes，最大允许: ${maxSize} bytes`)
          );
        }

        // 检查文件名
        if (!/^[a-zA-Z0-9._-]+$/.test(file.originalname)) {
          return next(new ValidationError('文件名包含非法字符'));
        }
      }

      next();
    };

/**
 * 请求头验证
 */
export const validateHeaders =
  (requiredHeaders = []) =>
    (req, res, next) => {
      for (const header of requiredHeaders) {
        if (!req.headers[header.toLowerCase()]) {
          return next(new ValidationError(`缺少必需的请求头: ${header}`));
        }
      }
      next();
    };

/**
 * 内容类型验证
 */
export const validateContentType =
  (allowedTypes = ['application/json']) =>
    (req, res, next) => {
      const contentType = req.headers['content-type'];

      if (!contentType) {
        return next(new ValidationError('缺少Content-Type请求头'));
      }

      const isAllowed = allowedTypes.some((type) =>
        contentType.toLowerCase().includes(type.toLowerCase())
      );

      if (!isAllowed) {
        return next(
          new ValidationError(
            `不支持的Content-Type: ${contentType}，支持的类型: ${allowedTypes.join(', ')}`
          )
        );
      }

      next();
    };

export default {
  validateRequest,
  energyDataSchema,
  carbonDataSchema,
  batteryDataSchema,
  userRegistrationSchema,
  userLoginSchema,
  dataQuerySchema,
  deviceSchema,
  alertRuleSchema,
  reportGenerationSchema,
  idParamSchema,
  deviceIdParamSchema,
  validateFileUpload,
  validateHeaders,
  validateContentType
};
