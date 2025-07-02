/**
 * 简单的内存缓存系统
 * 用于优化API响应时间
 */

class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.ttlMap = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 默认5分钟过期
    
    // 定期清理过期缓存
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // 每分钟清理一次
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttl - 过期时间（毫秒），默认使用defaultTTL
   */
  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, value);
    this.ttlMap.set(key, expiresAt);
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {any|null} 缓存值或null
   */
  get(key) {
    const expiresAt = this.ttlMap.get(key);
    
    // 检查是否过期
    if (!expiresAt || Date.now() > expiresAt) {
      this.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   */
  delete(key) {
    this.cache.delete(key);
    this.ttlMap.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.cache.clear();
    this.ttlMap.clear();
  }

  /**
   * 检查缓存是否存在且未过期
   * @param {string} key - 缓存键
   * @returns {boolean}
   */
  has(key) {
    const expiresAt = this.ttlMap.get(key);
    if (!expiresAt || Date.now() > expiresAt) {
      this.delete(key);
      return false;
    }
    return this.cache.has(key);
  }

  /**
   * 获取缓存统计信息
   * @returns {object} 统计信息
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * 清理过期缓存
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, expiresAt] of this.ttlMap.entries()) {
      if (now > expiresAt) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 清理了 ${expiredKeys.length} 个过期缓存项`);
    }
  }

  /**
   * 生成缓存键
   * @param {string} prefix - 前缀
   * @param {object} params - 参数对象
   * @returns {string} 缓存键
   */
  generateKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return `${prefix}:${sortedParams}`;
  }
}

// 创建全局缓存实例
const cache = new MemoryCache();

/**
 * 缓存中间件工厂函数
 * @param {number} ttl - 缓存过期时间（毫秒）
 * @param {function} keyGenerator - 缓存键生成函数
 * @returns {function} Express中间件
 */
export function createCacheMiddleware(ttl = 5 * 60 * 1000, keyGenerator = null) {
  return (req, res, next) => {
    // 只缓存GET请求
    if (req.method !== 'GET') {
      return next();
    }

    // 生成缓存键
    const cacheKey = keyGenerator 
      ? keyGenerator(req) 
      : cache.generateKey(req.path, req.query);

    // 尝试从缓存获取数据
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`🎯 缓存命中: ${cacheKey}`);
      // 设置缓存命中头信息
      res.setHeader('X-Cache-Hit', 'true');
      res.setHeader('X-Cache-Key', cacheKey);
      return res.json(cachedData);
    }

    // 设置缓存未命中头信息
    res.setHeader('X-Cache-Hit', 'false');
    res.setHeader('X-Cache-Key', cacheKey);

    // 重写res.json方法以缓存响应
    const originalJson = res.json;
    res.json = function(data) {
      // 只缓存成功的响应
      if (res.statusCode === 200) {
        cache.set(cacheKey, data, ttl);
        console.log(`💾 缓存存储: ${cacheKey}`);
      }
      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * 清除特定前缀的缓存
 * @param {string} prefix - 缓存键前缀
 */
export function clearCacheByPrefix(prefix) {
  const stats = cache.getStats();
  const keysToDelete = stats.keys.filter(key => key.startsWith(prefix));
  
  keysToDelete.forEach(key => cache.delete(key));
  
  console.log(`🗑️ 清除了 ${keysToDelete.length} 个前缀为 "${prefix}" 的缓存项`);
}

/**
 * 预热缓存函数
 * @param {string} key - 缓存键
 * @param {function} dataLoader - 数据加载函数
 * @param {number} ttl - 过期时间
 */
export async function warmupCache(key, dataLoader, ttl = 5 * 60 * 1000) {
  try {
    const data = await dataLoader();
    cache.set(key, data, ttl);
    console.log(`🔥 预热缓存: ${key}`);
  } catch (error) {
    console.error(`❌ 预热缓存失败: ${key}`, error);
  }
}

export { cache };
export default cache;