/**
 * 输入验证器常量定义
 * 用于替换魔法数字，提高代码可维护性
 */

import { MATH_CONSTANTS, STORAGE_CONSTANTS } from '../constants/MathConstants.js';

// 字符串长度限制
export const STRING_LENGTH_LIMITS = {
  USERNAME_MIN: 3,
  USERNAME_MAX: 30,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  DEVICE_ID_MIN: 1,
  DEVICE_ID_MAX: 50,
  DEVICE_NAME_MIN: 1,
  DEVICE_NAME_MAX: 100,
  LOCATION_MAX: 200,
  SEARCH_KEYWORD_MIN: 1,
  SEARCH_KEYWORD_MAX: 100,
  ALERT_NAME_MIN: 1,
  ALERT_NAME_MAX: 100,
  DESCRIPTION_MAX: 500,
  CALCULATION_METHOD_MAX: 50
};

// 数值范围限制
export const NUMERIC_LIMITS = {
  PERCENTAGE_MIN: 0,
  PERCENTAGE_MAX: 100,
  PAGE_MIN: 1,
  PAGE_DEFAULT: 1,
  LIMIT_MIN: 1,
  LIMIT_MAX: 100,
  LIMIT_DEFAULT: 20,
  POWER_FACTOR_MIN: 0,
  POWER_FACTOR_MAX: 1,
  MIN_OBJECT_PROPERTIES: 1
};

// 文件上传限制
export const FILE_UPLOAD_LIMITS = {
  MAX_SIZE_MB: MATH_CONSTANTS.TEN,
  MAX_SIZE_BYTES: MATH_CONSTANTS.TEN * STORAGE_CONSTANTS.ONE_MB, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'application/msword'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.doc', '.docx']
};

// 密码强度检查
export const PASSWORD_STRENGTH = {
  MIN_LENGTH: 8,
  REQUIRED_UPPERCASE: 1,
  REQUIRED_LOWERCASE: 1,
  REQUIRED_DIGITS: 1,
  REQUIRED_SPECIAL_CHARS: 1,
  WEAK_SCORE: 2,
  MEDIUM_SCORE: 3,
  STRONG_SCORE: 4
};

// 设备类型枚举
export const DEVICE_TYPES = [
  'sensor',
  'actuator', 
  'gateway',
  'storage',
  'solar_panel',
  'wind_turbine',
  'battery'
];

// 设备状态枚举
export const DEVICE_STATUSES = [
  'online',
  'offline', 
  'maintenance',
  'error'
];

// 用户角色枚举
export const USER_ROLES = [
  'admin',
  'operator',
  'viewer',
  'user'
];

// 存储设备状态枚举
export const STORAGE_DEVICE_STATUSES = [
  'charging',
  'discharging',
  'idle',
  'maintenance'
];

// 告警条件类型枚举
export const ALERT_CONDITION_TYPES = [
  'threshold',
  'range',
  'change_rate',
  'offline'
];

// 告警严重程度枚举
export const ALERT_SEVERITY_LEVELS = [
  'low',
  'medium',
  'high',
  'critical'
];

// 排序方向枚举
export const SORT_ORDERS = ['asc', 'desc'];

// 默认值
export const DEFAULT_VALUES = {
  DEVICE_STATUS: 'offline',
  USER_ROLE: 'user',
  SORT_ORDER: 'desc',
  ALERT_SEVERITY: 'medium',
  PAGE: 1,
  LIMIT: 20
};