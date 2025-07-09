import axios from 'axios';
import { message } from 'antd';
import { API_CONFIG, API_MESSAGES, apiUtils } from './api';

/**
 * 创建axios实例
 */
const instance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers
});

/**
 * 请求拦截器
 */
instance.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加请求ID用于追踪
    config.headers['X-Request-ID'] = generateRequestId();

    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }

    // 打印请求日志（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 API Request:', {
        url: config.url,
        method: config.method,
        params: config.params,
        data: config.data
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 */
instance.interceptors.response.use(
  (response) => {
    // 打印响应日志（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }

    // 统一处理响应格式
    const result = {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || 'success',
      status: response.status
    };

    return result;
  },
  (error) => {
    console.error('❌ Response Error:', error);

    // 处理不同类型的错误
    let errorMessage = API_MESSAGES.SERVER_ERROR;
    let errorStatus = 500;

    if (error.response) {
      // 服务器响应错误
      const { status, data } = error.response;
      errorStatus = status;

      switch (status) {
        case 400:
          errorMessage = data?.message || API_MESSAGES.BAD_REQUEST;
          break;
        case 401:
          errorMessage = API_MESSAGES.UNAUTHORIZED;
          // 清除token并跳转到登录页
          localStorage.removeItem('access_token');
          window.location.href = '/login';
          break;
        case 403:
          errorMessage = API_MESSAGES.FORBIDDEN;
          break;
        case 404:
          errorMessage = API_MESSAGES.NOT_FOUND;
          break;
        case 500:
          errorMessage = data?.message || API_MESSAGES.SERVER_ERROR;
          break;
        default:
          errorMessage = data?.message || `服务器错误 (${status})`;
      }
    } else if (error.request) {
      // 网络错误
      errorMessage = API_MESSAGES.NETWORK_ERROR;
      errorStatus = 0;
    } else if (error.code === 'ECONNABORTED') {
      // 超时错误
      errorMessage = API_MESSAGES.TIMEOUT_ERROR;
      errorStatus = 0;
    }

    // 显示错误消息
    if (errorStatus !== 401) { // 401错误不显示消息，因为会跳转登录页
      message.error(errorMessage);
    }

    const errorResult = {
      success: false,
      data: null,
      message: errorMessage,
      status: errorStatus
    };

    return Promise.resolve(errorResult); // 返回resolve而不是reject，便于统一处理
  }
);

/**
 * 生成请求ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 请求方法封装
 */
export const request = {
  /**
   * GET请求
   * @param {string} url - 请求URL
   * @param {Object} config - 请求配置
   * @returns {Promise}
   */
  get: (url, config = {}) => {
    return instance.get(url, config);
  },

  /**
   * POST请求
   * @param {string} url - 请求URL
   * @param {any} data - 请求数据
   * @param {Object} config - 请求配置
   * @returns {Promise}
   */
  post: (url, data = {}, config = {}) => {
    return instance.post(url, data, config);
  },

  /**
   * PUT请求
   * @param {string} url - 请求URL
   * @param {any} data - 请求数据
   * @param {Object} config - 请求配置
   * @returns {Promise}
   */
  put: (url, data = {}, config = {}) => {
    return instance.put(url, data, config);
  },

  /**
   * DELETE请求
   * @param {string} url - 请求URL
   * @param {Object} config - 请求配置
   * @returns {Promise}
   */
  delete: (url, config = {}) => {
    return instance.delete(url, config);
  },

  /**
   * PATCH请求
   * @param {string} url - 请求URL
   * @param {any} data - 请求数据
   * @param {Object} config - 请求配置
   * @returns {Promise}
   */
  patch: (url, data = {}, config = {}) => {
    return instance.patch(url, data, config);
  },

  /**
   * 上传文件
   * @param {string} url - 上传URL
   * @param {FormData} formData - 文件数据
   * @param {Object} config - 请求配置
   * @returns {Promise}
   */
  upload: (url, formData, config = {}) => {
    return instance.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers
      }
    });
  },

  /**
   * 下载文件
   * @param {string} url - 下载URL
   * @param {Object} config - 请求配置
   * @returns {Promise}
   */
  download: (url, config = {}) => {
    return instance.get(url, {
      ...config,
      responseType: 'blob'
    });
  },

  /**
   * 并发请求
   * @param {Array} requests - 请求数组
   * @returns {Promise}
   */
  all: (requests) => {
    return Promise.all(requests);
  },

  /**
   * 带缓存的GET请求
   * @param {string} url - 请求URL
   * @param {Object} config - 请求配置
   * @param {number} cacheTime - 缓存时间（毫秒）
   * @returns {Promise}
   */
  getCached: async (url, config = {}, cacheTime = 300000) => {
    const { apiCache } = await import('./api');
    const cacheKey = apiCache.generateKey(url, config.params);
    
    // 尝试从缓存获取
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      return Promise.resolve(cachedData);
    }
    
    // 发起请求并缓存结果
    const response = await instance.get(url, config);
    if (response.success) {
      apiCache.set(cacheKey, response, cacheTime);
    }
    
    return response;
  },

  /**
   * 重试请求
   * @param {Function} requestFn - 请求函数
   * @param {number} maxRetries - 最大重试次数
   * @param {number} delay - 重试延迟
   * @returns {Promise}
   */
  retry: (requestFn, maxRetries = 3, delay = 1000) => {
    return apiUtils.retryRequest(requestFn, maxRetries, delay);
  },

  /**
   * 取消请求
   * @returns {Object} 取消token
   */
  cancelToken: () => {
    return axios.CancelToken.source();
  },

  /**
   * 检查请求是否被取消
   * @param {Error} error - 错误对象
   * @returns {boolean}
   */
  isCancel: (error) => {
    return axios.isCancel(error);
  }
};

/**
 * 请求队列管理
 */
export const requestQueue = {
  queue: [],
  processing: false,

  /**
   * 添加请求到队列
   * @param {Function} requestFn - 请求函数
   * @param {number} priority - 优先级（数字越小优先级越高）
   * @returns {Promise}
   */
  add: (requestFn, priority = 0) => {
    return new Promise((resolve, reject) => {
      requestQueue.queue.push({
        requestFn,
        priority,
        resolve,
        reject
      });
      
      // 按优先级排序
      requestQueue.queue.sort((a, b) => a.priority - b.priority);
      
      // 开始处理队列
      requestQueue.process();
    });
  },

  /**
   * 处理请求队列
   */
  process: async () => {
    if (requestQueue.processing || requestQueue.queue.length === 0) {
      return;
    }

    requestQueue.processing = true;

    while (requestQueue.queue.length > 0) {
      const { requestFn, resolve, reject } = requestQueue.queue.shift();
      
      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
      
      // 添加延迟避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    requestQueue.processing = false;
  },

  /**
   * 清空队列
   */
  clear: () => {
    requestQueue.queue.forEach(({ reject }) => {
      reject(new Error('Request queue cleared'));
    });
    requestQueue.queue = [];
    requestQueue.processing = false;
  }
};

/**
 * 请求监控
 */
export const requestMonitor = {
  requests: new Map(),
  
  /**
   * 开始监控请求
   * @param {string} requestId - 请求ID
   */
  start: (requestId) => {
    requestMonitor.requests.set(requestId, {
      startTime: Date.now(),
      status: 'pending'
    });
  },
  
  /**
   * 结束监控请求
   * @param {string} requestId - 请求ID
   * @param {boolean} success - 是否成功
   */
  end: (requestId, success) => {
    const request = requestMonitor.requests.get(requestId);
    if (request) {
      request.endTime = Date.now();
      request.duration = request.endTime - request.startTime;
      request.status = success ? 'success' : 'error';
    }
  },
  
  /**
   * 获取请求统计
   * @returns {Object} 统计信息
   */
  getStats: () => {
    const requests = Array.from(requestMonitor.requests.values());
    const completed = requests.filter(r => r.status !== 'pending');
    const successful = requests.filter(r => r.status === 'success');
    const failed = requests.filter(r => r.status === 'error');
    
    return {
      total: requests.length,
      pending: requests.length - completed.length,
      successful: successful.length,
      failed: failed.length,
      successRate: completed.length > 0 ? (successful.length / completed.length * 100).toFixed(2) : 0,
      averageDuration: completed.length > 0 ? 
        (completed.reduce((sum, r) => sum + (r.duration || 0), 0) / completed.length).toFixed(2) : 0
    };
  },
  
  /**
   * 清空监控数据
   */
  clear: () => {
    requestMonitor.requests.clear();
  }
};

export default request;