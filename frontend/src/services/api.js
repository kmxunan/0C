// API服务主入口文件

// 导入各个模块的API服务
import { standardsApi } from './standardsApi';
import { request } from './request';

/**
 * 统一导出所有API服务
 */
export {
  standardsApi,
  request
};

/**
 * 默认导出API对象
 */
export default {
  standards: standardsApi,
  request
};

/**
 * API基础配置
 */
export const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
};

/**
 * API响应状态码
 */
export const API_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

/**
 * API错误消息
 */
export const API_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  TIMEOUT_ERROR: '请求超时，请稍后重试',
  SERVER_ERROR: '服务器内部错误，请联系管理员',
  UNAUTHORIZED: '未授权访问，请重新登录',
  FORBIDDEN: '权限不足，无法访问该资源',
  NOT_FOUND: '请求的资源不存在',
  BAD_REQUEST: '请求参数错误'
};

/**
 * 通用API工具函数
 */
export const apiUtils = {
  /**
   * 格式化API响应
   * @param {Object} response - 响应对象
   * @returns {Object} 格式化后的响应
   */
  formatResponse: (response) => {
    return {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
      message: response.statusText,
      status: response.status
    };
  },

  /**
   * 处理API错误
   * @param {Error} error - 错误对象
   * @returns {Object} 错误信息
   */
  handleError: (error) => {
    if (error.response) {
      // 服务器响应错误
      const { status, data } = error.response;
      return {
        success: false,
        message: data?.message || API_MESSAGES.SERVER_ERROR,
        status,
        data: null
      };
    } else if (error.request) {
      // 网络错误
      return {
        success: false,
        message: API_MESSAGES.NETWORK_ERROR,
        status: 0,
        data: null
      };
    } else {
      // 其他错误
      return {
        success: false,
        message: error.message || '未知错误',
        status: 0,
        data: null
      };
    }
  },

  /**
   * 构建查询参数
   * @param {Object} params - 参数对象
   * @returns {string} 查询字符串
   */
  buildQueryString: (params) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        if (Array.isArray(params[key])) {
          params[key].forEach(value => searchParams.append(key, value));
        } else {
          searchParams.append(key, params[key]);
        }
      }
    });
    return searchParams.toString();
  },

  /**
   * 下载文件
   * @param {Blob} blob - 文件数据
   * @param {string} filename - 文件名
   */
  downloadFile: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的文件大小
   */
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * 验证响应数据
   * @param {Object} response - 响应对象
   * @param {Function} validator - 验证函数
   * @returns {boolean} 验证结果
   */
  validateResponse: (response, validator) => {
    try {
      return validator(response.data);
    } catch (error) {
      console.error('响应数据验证失败:', error);
      return false;
    }
  },

  /**
   * 重试请求
   * @param {Function} requestFn - 请求函数
   * @param {number} maxRetries - 最大重试次数
   * @param {number} delay - 重试延迟（毫秒）
   * @returns {Promise} 请求结果
   */
  retryRequest: async (requestFn, maxRetries = 3, delay = 1000) => {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError;
  }
};

/**
 * API缓存管理
 */
export const apiCache = {
  cache: new Map(),
  
  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} data - 缓存数据
   * @param {number} ttl - 生存时间（毫秒）
   */
  set: (key, data, ttl = 300000) => { // 默认5分钟
    const expiry = Date.now() + ttl;
    apiCache.cache.set(key, { data, expiry });
  },
  
  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {any} 缓存数据
   */
  get: (key) => {
    const item = apiCache.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      apiCache.cache.delete(key);
      return null;
    }
    
    return item.data;
  },
  
  /**
   * 删除缓存
   * @param {string} key - 缓存键
   */
  delete: (key) => {
    apiCache.cache.delete(key);
  },
  
  /**
   * 清空缓存
   */
  clear: () => {
    apiCache.cache.clear();
  },
  
  /**
   * 生成缓存键
   * @param {string} url - 请求URL
   * @param {Object} params - 请求参数
   * @returns {string} 缓存键
   */
  generateKey: (url, params = {}) => {
    const paramString = JSON.stringify(params);
    return `${url}:${paramString}`;
  }
};