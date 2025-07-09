/**
 * API配置文件
 * 定义API基础URL和相关配置
 */

// 环境配置
const ENV = process.env.NODE_ENV || 'development';

// API基础URL配置
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:3000/api',
    timeout: 30000,
    withCredentials: true
  },
  production: {
    baseURL: '/api',
    timeout: 30000,
    withCredentials: true
  },
  test: {
    baseURL: 'http://localhost:3001/api',
    timeout: 10000,
    withCredentials: false
  }
};

// 当前环境配置
const currentConfig = API_CONFIG[ENV] || API_CONFIG.development;

// 导出API基础URL
export const API_BASE_URL = currentConfig.baseURL;

// 导出完整配置
export const API_TIMEOUT = currentConfig.timeout;
export const API_WITH_CREDENTIALS = currentConfig.withCredentials;

// WebSocket配置
export const WS_CONFIG = {
  development: {
    baseURL: 'ws://localhost:3000',
    reconnectInterval: 5000,
    maxReconnectAttempts: 10
  },
  production: {
    baseURL: `ws://${window.location.host}`,
    reconnectInterval: 5000,
    maxReconnectAttempts: 10
  }
};

export const WS_BASE_URL = WS_CONFIG[ENV]?.baseURL || WS_CONFIG.development.baseURL;
export const WS_RECONNECT_INTERVAL = WS_CONFIG[ENV]?.reconnectInterval || 5000;
export const WS_MAX_RECONNECT_ATTEMPTS = WS_CONFIG[ENV]?.maxReconnectAttempts || 10;

// API端点配置
export const API_ENDPOINTS = {
  // 认证相关
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile'
  },
  
  // VPP相关
  vpp: {
    base: '/vpp',
    tradingStrategy: '/vpp/trading-strategy',
    marketConnector: '/vpp/market-connector',
    resources: '/vpp/resources',
    aggregation: '/vpp/aggregation',
    trading: '/vpp/trading',
    settlement: '/vpp/settlement'
  },
  
  // 设备管理
  devices: {
    base: '/devices',
    list: '/devices',
    create: '/devices',
    update: '/devices/:id',
    delete: '/devices/:id',
    status: '/devices/:id/status'
  },
  
  // 能源管理
  energy: {
    base: '/energy',
    consumption: '/energy/consumption',
    production: '/energy/production',
    storage: '/energy/storage',
    forecast: '/energy/forecast'
  },
  
  // 碳排放管理
  carbon: {
    base: '/carbon',
    emissions: '/carbon/emissions',
    credits: '/carbon/credits',
    trading: '/carbon/trading',
    reports: '/carbon/reports'
  },
  
  // 数字孪生
  digitalTwin: {
    base: '/digital-twin',
    models: '/digital-twin/models',
    simulation: '/digital-twin/simulation',
    visualization: '/digital-twin/visualization'
  },
  
  // 系统管理
  system: {
    health: '/health',
    status: '/status',
    metrics: '/metrics',
    logs: '/logs'
  }
};

// HTTP状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

// 错误消息映射
export const ERROR_MESSAGES = {
  [HTTP_STATUS.BAD_REQUEST]: '请求参数错误',
  [HTTP_STATUS.UNAUTHORIZED]: '未授权访问，请重新登录',
  [HTTP_STATUS.FORBIDDEN]: '权限不足，无法访问',
  [HTTP_STATUS.NOT_FOUND]: '请求的资源不存在',
  [HTTP_STATUS.CONFLICT]: '资源冲突',
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]: '数据验证失败',
  [HTTP_STATUS.TOO_MANY_REQUESTS]: '请求过于频繁，请稍后重试',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: '服务器内部错误',
  [HTTP_STATUS.BAD_GATEWAY]: '网关错误',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: '服务暂时不可用',
  [HTTP_STATUS.GATEWAY_TIMEOUT]: '网关超时'
};

// 请求头配置
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest'
};

// 分页配置
export const PAGINATION_CONFIG = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
  pageSizeOptions: [10, 20, 50, 100]
};

// 缓存配置
export const CACHE_CONFIG = {
  // 缓存键前缀
  keyPrefix: 'vpp_app_',
  
  // 缓存过期时间（毫秒）
  ttl: {
    short: 5 * 60 * 1000,      // 5分钟
    medium: 30 * 60 * 1000,    // 30分钟
    long: 2 * 60 * 60 * 1000,  // 2小时
    day: 24 * 60 * 60 * 1000   // 24小时
  },
  
  // 需要缓存的API
  cacheable: [
    '/vpp/trading-strategy/enums',
    '/devices/types',
    '/energy/units',
    '/carbon/factors'
  ]
};

// 重试配置
export const RETRY_CONFIG = {
  maxAttempts: 3,
  delay: 1000,
  backoffMultiplier: 2,
  retryableStatuses: [
    HTTP_STATUS.TOO_MANY_REQUESTS,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    HTTP_STATUS.BAD_GATEWAY,
    HTTP_STATUS.SERVICE_UNAVAILABLE,
    HTTP_STATUS.GATEWAY_TIMEOUT
  ]
};

// 上传配置
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    excel: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    json: ['application/json'],
    csv: ['text/csv']
  },
  chunkSize: 1024 * 1024 // 1MB chunks for large file uploads
};

// 实时数据配置
export const REALTIME_CONFIG = {
  // WebSocket心跳间隔
  heartbeatInterval: 30000,
  
  // 数据更新频率
  updateInterval: {
    fast: 1000,    // 1秒
    normal: 5000,  // 5秒
    slow: 30000    // 30秒
  },
  
  // 订阅主题
  topics: {
    vppStatus: 'vpp.status',
    marketData: 'market.data',
    tradingSignals: 'trading.signals',
    deviceStatus: 'device.status',
    energyData: 'energy.data',
    carbonData: 'carbon.data'
  }
};

// 导出默认配置
export default {
  API_BASE_URL,
  API_TIMEOUT,
  API_WITH_CREDENTIALS,
  WS_BASE_URL,
  WS_RECONNECT_INTERVAL,
  WS_MAX_RECONNECT_ATTEMPTS,
  API_ENDPOINTS,
  HTTP_STATUS,
  ERROR_MESSAGES,
  DEFAULT_HEADERS,
  PAGINATION_CONFIG,
  CACHE_CONFIG,
  RETRY_CONFIG,
  UPLOAD_CONFIG,
  REALTIME_CONFIG
};

// 环境检查函数
export const isDevelopment = () => ENV === 'development';
export const isProduction = () => ENV === 'production';
export const isTest = () => ENV === 'test';

// URL构建辅助函数
export const buildURL = (endpoint, params = {}) => {
  let url = endpoint;
  
  // 替换路径参数
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  
  return url;
};

// 查询参数构建函数
export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, item));
      } else {
        searchParams.append(key, value);
      }
    }
  });
  
  return searchParams.toString();
};

// 完整URL构建函数
export const buildFullURL = (endpoint, pathParams = {}, queryParams = {}) => {
  const url = buildURL(endpoint, pathParams);
  const queryString = buildQueryString(queryParams);
  
  return queryString ? `${url}?${queryString}` : url;
};