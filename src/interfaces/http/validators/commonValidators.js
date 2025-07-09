/* eslint-disable no-magic-numbers */
/**
 * 通用验证器
 * 提供常用的数据验证规则和自定义验证器
 */

const { body, param, query, validationResult } = require('express-validator');
const responseFormatter = require('../middleware/responseFormatter');

// 常用正则表达式
const REGEX_PATTERNS = {
  // 用户名：3-20位字母数字下划线
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  // 密码：至少8位，包含字母和数字
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
  // 邮箱
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // 手机号（中国）
  PHONE: /^1[3-9]\d{9}$/,
  // IPv4地址
  IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  // MAC地址
  MAC: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
  // 设备序列号
  DEVICE_SERIAL: /^[A-Z0-9]{8,20}$/,
  // 版本号
  VERSION: /^\d+\.\d+\.\d+$/
};

// 常用验证规则
const VALIDATION_RULES = {
  // ID验证
  id: param('id').isInt({ min: 1 }).withMessage('ID必须是正整数'),

  // UUID验证
  uuid: param('id').isUUID().withMessage('ID必须是有效的UUID'),

  // 分页参数验证
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数').toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须在1-100之间')
      .toInt(),
    query('offset').optional().isInt({ min: 0 }).withMessage('偏移量必须是非负整数').toInt()
  ],

  // 排序参数验证
  sorting: [
    query('sortBy')
      .optional()
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage('排序字段长度必须在1-50之间'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc', 'ASC', 'DESC'])
      .withMessage('排序方向必须是asc或desc')
  ],

  // 日期范围验证
  dateRange: [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效').toDate(),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('结束日期格式无效')
      .toDate()
      .custom((value, { req }) => {
        if (req.query.startDate && value < new Date(req.query.startDate)) {
          throw new Error('结束日期不能早于开始日期');
        }
        return true;
      })
  ],

  // 搜索参数验证
  search: [
    query('keyword')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('搜索关键词长度必须在1-100之间')
      .trim()
      .escape(),
    query('searchFields').optional().isString().withMessage('搜索字段必须是字符串')
  ],

  // 用户名验证
  username: body('username')
    .matches(REGEX_PATTERNS.USERNAME)
    .withMessage('用户名必须是3-20位字母、数字或下划线'),

  // 密码验证
  password: body('password')
    .matches(REGEX_PATTERNS.PASSWORD)
    .withMessage('密码至少8位，必须包含字母和数字'),

  // 邮箱验证
  email: body('email').isEmail().normalizeEmail().withMessage('邮箱格式无效'),

  // 手机号验证
  phone: body('phone').optional().matches(REGEX_PATTERNS.PHONE).withMessage('手机号格式无效'),

  // 角色验证
  role: body('role')
    .isIn(['admin', 'operator', 'user', 'guest'])
    .withMessage('角色必须是admin、operator、user或guest之一'),

  // 状态验证
  status: body('status')
    .isIn(['active', 'inactive', 'pending', 'suspended'])
    .withMessage('状态必须是active、inactive、pending或suspended之一'),

  // 布尔值验证
  boolean: (field) => body(field).isBoolean().withMessage(`${field}必须是布尔值`).toBoolean(),

  // 数字验证
  number: (field, min = 0, max = Number.MAX_SAFE_INTEGER) =>
    body(field)
      .isNumeric()
      .withMessage(`${field}必须是数字`)
      .isFloat({ min, max })
      .withMessage(`${field}必须在${min}-${max}之间`)
      .toFloat(),

  // 整数验证
  integer: (field, min = 0, max = Number.MAX_SAFE_INTEGER) =>
    body(field).isInt({ min, max }).withMessage(`${field}必须是${min}-${max}之间的整数`).toInt(),

  // 字符串验证
  string: (field, minLength = 1, maxLength = 255) =>
    body(field)
      .isString()
      .withMessage(`${field}必须是字符串`)
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${field}长度必须在${minLength}-${maxLength}之间`)
      .trim(),

  // 数组验证
  array: (field, minLength = 0, maxLength = 100) =>
    body(field)
      .isArray({ min: minLength, max: maxLength })
      .withMessage(`${field}必须是包含${minLength}-${maxLength}个元素的数组`),

  // JSON验证
  json: (field) =>
    body(field).custom((value) => {
      try {
        JSON.parse(typeof value === 'string' ? value : JSON.stringify(value));
        return true;
      } catch (error) {
        throw new Error(`${field}必须是有效的JSON格式`);
      }
    })
};

// 自定义验证器
const CUSTOM_VALIDATORS = {
  // 验证设备序列号
  deviceSerial: body('serialNumber')
    .matches(REGEX_PATTERNS.DEVICE_SERIAL)
    .withMessage('设备序列号格式无效'),

  // 验证IP地址
  ipAddress: (field) =>
    body(field).matches(REGEX_PATTERNS.IPV4).withMessage(`${field}必须是有效的IPv4地址`),

  // 验证MAC地址
  macAddress: (field) =>
    body(field).matches(REGEX_PATTERNS.MAC).withMessage(`${field}必须是有效的MAC地址`),

  // 验证版本号
  version: (field) =>
    body(field)
      .matches(REGEX_PATTERNS.VERSION)
      .withMessage(`${field}必须是有效的版本号格式（如1.0.0）`),

  // 验证能耗值
  energyValue: body('value').isFloat({ min: 0 }).withMessage('能耗值必须是非负数').toFloat(),

  // 验证碳排放因子
  carbonFactor: body('factor')
    .isFloat({ min: 0, max: 10 })
    .withMessage('碳排放因子必须在0-10之间')
    .toFloat(),

  // 验证温度值
  temperature: (field) =>
    body(field)
      .isFloat({ min: -273.15, max: 1000 })
      .withMessage(`${field}必须是有效的温度值（-273.15°C到1000°C）`)
      .toFloat(),

  // 验证湿度值
  humidity: (field) =>
    body(field)
      .isFloat({ min: 0, max: 100 })
      .withMessage(`${field}必须是0-100之间的湿度值`)
      .toFloat(),

  // 验证功率值
  power: (field) =>
    body(field).isFloat({ min: 0 }).withMessage(`${field}必须是非负的功率值`).toFloat(),

  // 验证经纬度
  latitude: (field) =>
    body(field)
      .isFloat({ min: -90, max: 90 })
      .withMessage(`${field}必须是有效的纬度值（-90到90）`)
      .toFloat(),

  longitude: (field) =>
    body(field)
      .isFloat({ min: -180, max: 180 })
      .withMessage(`${field}必须是有效的经度值（-180到180）`)
      .toFloat(),

  // 验证时间戳
  timestamp: (field) =>
    body(field).custom((value) => {
      const timestamp = new Date(value).getTime();
      if (isNaN(timestamp)) {
        throw new Error(`${field}必须是有效的时间戳`);
      }
      // 检查时间戳是否在合理范围内（1970年到2100年）
      if (timestamp < 0 || timestamp > 4102444800000) {
        throw new Error(`${field}时间戳超出有效范围`);
      }
      return true;
    }),

  // 验证文件大小（字节）
  fileSize: (field, maxSize = 10 * 1024 * 1024) =>
    body(field)
      .isInt({ min: 0, max: maxSize })
      .withMessage(`${field}文件大小不能超过${Math.round(maxSize / 1024 / 1024)}MB`)
      .toInt(),

  // 验证颜色值（十六进制）
  hexColor: (field) =>
    body(field)
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .withMessage(`${field}必须是有效的十六进制颜色值`),

  // 验证URL
  url: (field) =>
    body(field)
      .isURL({
        protocols: ['http', 'https'],
        require_protocol: true
      })
      .withMessage(`${field}必须是有效的URL地址`),

  // 验证设备类型
  deviceType: body('type')
    .isIn(['sensor', 'actuator', 'controller', 'gateway', 'meter', 'camera', 'other'])
    .withMessage('设备类型必须是sensor、actuator、controller、gateway、meter、camera或other之一'),

  // 验证能源类型
  energyType: body('energyType')
    .isIn(['electricity', 'gas', 'water', 'steam', 'coal', 'oil', 'solar', 'wind', 'other'])
    .withMessage('能源类型无效'),

  // 验证单位
  unit: body('unit')
    .isIn(['kWh', 'MWh', 'GWh', 'm³', 'L', 'kg', 't', 'J', 'kJ', 'MJ', 'GJ'])
    .withMessage('单位无效'),

  // 验证优先级
  priority: body('priority')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('优先级必须是low、medium、high或critical之一'),

  // 验证维护类型
  maintenanceType: body('type')
    .isIn(['preventive', 'corrective', 'predictive', 'emergency'])
    .withMessage('维护类型必须是preventive、corrective、predictive或emergency之一')
};

/**
 * 验证结果处理中间件
 * 检查验证结果，如果有错误则返回错误响应
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    return responseFormatter.validationError(res, '数据验证失败', formattedErrors);
  }

  next();
}

/**
 * 创建验证链
 * @param {Array} validators - 验证器数组
 * @returns {Array} 包含验证器和错误处理的完整验证链
 */
function createValidationChain(validators) {
  return [...validators, handleValidationErrors];
}

/**
 * 条件验证
 * @param {Function} condition - 条件函数
 * @param {Array} validators - 当条件为真时应用的验证器
 * @returns {Function} 条件验证中间件
 */
function conditionalValidation(condition, validators) {
  const runNext = function(req, res, next, validationChain, index) {
    if (index >= validationChain.length) {
      return next();
    }

    const validator = validationChain[index];
    validator(req, res, () => runNext(req, res, next, validationChain, index + 1));
  };

  return (req, res, next) => {
    if (condition(req)) {
      // 应用验证器
      const validationChain = createValidationChain(validators);
      runNext(req, res, next, validationChain, 0);
    } else {
      next();
    }
  };
}

/**
 * 批量验证
 * @param {Object} validationRules - 验证规则对象
 * @returns {Array} 验证器数组
 */
function batchValidation(validationRules) {
  const validators = [];

  for (const [_field, rules] of Object.entries(validationRules)) {
    if (Array.isArray(rules)) {
      validators.push(...rules);
    } else {
      validators.push(rules);
    }
  }

  return createValidationChain(validators);
}

/**
 * 自定义验证器工厂
 * @param {Function} validatorFn - 验证函数
 * @param {string} errorMessage - 错误消息
 * @returns {Function} 自定义验证器
 */
function customValidator(validatorFn, errorMessage) {
  return (field) => body(field).custom(validatorFn).withMessage(errorMessage);
}

module.exports = {
  REGEX_PATTERNS,
  VALIDATION_RULES,
  CUSTOM_VALIDATORS,
  handleValidationErrors,
  createValidationChain,
  conditionalValidation,
  batchValidation,
  customValidator
};
