import { ValidationError } from '../utils/AppError.js';

/**
 * 简单的邮箱验证函数
 */
const isEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 简单的XSS清洗函数
 */
const sanitizeXSS = (str) => {
  if (typeof str !== 'string') {
    return str;
  }
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * 输入验证和清洗中间件
 */

/**
 * 验证规则定义
 */
const validationRules = {
  // 用户相关
  email: {
    required: true,
    type: 'email',
    maxLength: 255
  },
  password: {
    required: true,
    type: 'string',
    minLength: 6,
    maxLength: 128
  },
  username: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/
  },

  // 设备相关
  deviceId: {
    required: true,
    type: 'string',
    maxLength: 100,
    pattern: /^[a-zA-Z0-9_-]+$/
  },
  deviceName: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 100
  },
  deviceType: {
    required: true,
    type: 'string',
    enum: ['energy_meter', 'solar_panel', 'battery', 'ev_charger', 'hvac', 'lighting']
  },

  // 数值相关
  energyValue: {
    required: true,
    type: 'number',
    min: 0,
    max: 999999
  },
  carbonValue: {
    required: true,
    type: 'number',
    min: 0,
    max: 999999
  },

  // 时间相关
  timestamp: {
    required: true,
    type: 'date'
  },

  // 分页相关
  page: {
    type: 'number',
    min: 1,
    default: 1
  },
  limit: {
    type: 'number',
    min: 1,
    max: 100,
    default: 20
  },

  // 通用字段
  id: {
    required: true,
    type: 'string',
    pattern: /^[a-zA-Z0-9_-]+$/
  },
  status: {
    type: 'string',
    enum: ['active', 'inactive', 'pending', 'resolved']
  }
};

/**
 * 数据类型验证器
 */
const validators = {
  string: (value, rule) => {
    if (typeof value !== 'string') {
      throw new ValidationError('字段必须是字符串类型');
    }

    if (rule.minLength && value.length < rule.minLength) {
      throw new ValidationError(`字段长度不能少于 ${rule.minLength} 个字符`);
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      throw new ValidationError(`字段长度不能超过 ${rule.maxLength} 个字符`);
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      throw new ValidationError('字段格式不正确');
    }

    if (rule.enum && !rule.enum.includes(value)) {
      throw new ValidationError(`字段值必须是以下之一: ${rule.enum.join(', ')}`);
    }

    return value;
  },

  number: (value, rule) => {
    const num = Number(value);

    if (isNaN(num)) {
      throw new ValidationError('字段必须是数字类型');
    }

    if (rule.min !== undefined && num < rule.min) {
      throw new ValidationError(`字段值不能小于 ${rule.min}`);
    }

    if (rule.max !== undefined && num > rule.max) {
      throw new ValidationError(`字段值不能大于 ${rule.max}`);
    }

    return num;
  },

  email: (value) => {
    if (!isEmail(value)) {
      throw new ValidationError('邮箱格式不正确');
    }
    return value.toLowerCase();
  },

  date: (value) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new ValidationError('日期格式不正确');
    }
    return date.toISOString();
  },

  boolean: (value) => {
    if (typeof value === 'boolean') {
      return value;
    }
    if (value === 'true' || value === '1') {
      return true;
    }
    if (value === 'false' || value === '0') {
      return false;
    }
    throw new ValidationError('字段必须是布尔类型');
  }
};

/**
 * 清洗输入数据
 * @param {*} value - 输入值
 * @param {string} type - 数据类型
 * @returns {*} 清洗后的值
 */
const sanitizeInput = (value, type) => {
  if (value === null || value === undefined) {
    return value;
  }

  // 字符串类型进行 XSS 清洗
  if (type === 'string' && typeof value === 'string') {
    return sanitizeXSS(value.trim());
  }

  return value;
};

/**
 * 验证单个字段
 * @param {string} fieldName - 字段名
 * @param {*} value - 字段值
 * @param {Object} rule - 验证规则
 * @returns {*} 验证后的值
 */
const validateField = (fieldName, value, rule) => {
  // 检查必填字段
  if (rule.required && (value === undefined || value === null || value === '')) {
    throw new ValidationError(`字段 ${fieldName} 是必填的`);
  }

  // 如果字段为空且非必填，使用默认值
  if ((value === undefined || value === null || value === '') && rule.default !== undefined) {
    value = rule.default;
  }

  // 如果字段为空，跳过验证
  if (value === undefined || value === null || value === '') {
    return value;
  }

  // 清洗输入
  value = sanitizeInput(value, rule.type);

  // 类型验证
  const validator = validators[rule.type];
  if (validator) {
    return validator(value, rule);
  }

  return value;
};

/**
 * 创建验证中间件
 * @param {Object} schema - 验证模式
 * @param {string} source - 数据源 ('body', 'query', 'params')
 * @returns {Function} 验证中间件
 */
const createValidator =
  (schema, source = 'body') =>
    (req, res, next) => {
      try {
        const data = req[source] || {};
        const validatedData = {};
        const errors = [];

        // 验证每个字段
        for (const [fieldName, rule] of Object.entries(schema)) {
          try {
            const value = data[fieldName];
            validatedData[fieldName] = validateField(fieldName, value, rule);
          } catch (error) {
            errors.push({
              field: fieldName,
              message: error.message
            });
          }
        }

        // 如果有验证错误，抛出异常
        if (errors.length > 0) {
          throw new ValidationError('输入验证失败', { errors });
        }

        // 将验证后的数据重新赋值
        req[source] = validatedData;

        next();
      } catch (error) {
        next(error);
      }
    };

/**
 * 预定义的验证模式
 */
const validationSchemas = {
  // 用户注册
  userRegister: {
    username: validationRules.username,
    email: validationRules.email,
    password: validationRules.password
  },

  // 用户登录
  userLogin: {
    email: validationRules.email,
    password: validationRules.password
  },

  // 设备创建
  deviceCreate: {
    device_id: validationRules.deviceId,
    name: validationRules.deviceName,
    type: validationRules.deviceType,
    location: {
      type: 'string',
      maxLength: 200
    }
  },

  // 能源数据
  energyData: {
    device_id: validationRules.deviceId,
    value: validationRules.energyValue,
    unit: {
      required: true,
      type: 'string',
      enum: ['kWh', 'MWh', 'W', 'kW', 'MW']
    },
    timestamp: validationRules.timestamp
  },

  // 碳排放数据
  carbonData: {
    scope: {
      required: true,
      type: 'string',
      enum: ['building', 'device', 'park']
    },
    scope_id: validationRules.id,
    emissions: validationRules.carbonValue,
    timestamp: validationRules.timestamp
  },

  // 分页查询
  pagination: {
    page: validationRules.page,
    limit: validationRules.limit
  },

  // ID 参数
  idParam: {
    id: validationRules.id
  }
};

/**
 * 便捷的验证中间件创建函数
 */
const validate = {
  body: (schema) => createValidator(schema, 'body'),
  query: (schema) => createValidator(schema, 'query'),
  params: (schema) => createValidator(schema, 'params')
};

export {
  validationRules,
  validationSchemas,
  createValidator,
  validate,
  validateField,
  sanitizeInput
};

export default validate;
