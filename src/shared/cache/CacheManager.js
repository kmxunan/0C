import logger from '../utils/logger.js';
/* eslint-disable no-magic-numbers */

/**
 * 缓存管理器
 * 支持内存缓存和Redis缓存
 */
class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.redisClient = null;
    this.defaultTTL = 3600; // 默认1小时
    this.maxMemoryItems = 1000; // 内存缓存最大条目数

    this.initializeRedis();
  }

  /**
   * 初始化Redis连接
   */
  async initializeRedis() {
    try {
      // 尝试导入Redis客户端
      const redisClient = await import('../../database/redisClient.js');
      this.redisClient = redisClient.default;
      logger.info('Redis缓存已启用');
    } catch (error) {
      logger.warn('Redis不可用，使用内存缓存', { error: error.message });
    }
  }

  /**
   * 获取缓存值
   * @param {string} key - 缓存键
   * @returns {Promise<any>} 缓存值
   */
  async get(key) {
    try {
      // 优先使用Redis
      if (this.redisClient) {
        const value = await this.redisClient.get(key);
        if (value !== null) {
          return JSON.parse(value);
        }
      }

      // 回退到内存缓存
      const memoryItem = this.memoryCache.get(key);
      if (memoryItem) {
        // 检查是否过期
        if (Date.now() < memoryItem.expiry) {
          return memoryItem.value;
        }
        this.memoryCache.delete(key);
      }

      return null;
    } catch (error) {
      logger.error('缓存获取失败', { key, error: error.message });
      return null;
    }
  }

  /**
   * 设置缓存值
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttl - 过期时间（秒）
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const serializedValue = JSON.stringify(value);

      // 使用Redis
      if (this.redisClient) {
        await this.redisClient.setex(key, ttl, serializedValue);
      }

      // 同时存储到内存缓存
      this.setMemoryCache(key, value, ttl);

      logger.debug('缓存设置成功', { key, ttl });
    } catch (error) {
      logger.error('缓存设置失败', { key, error: error.message });
    }
  }

  /**
   * 设置内存缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttl - 过期时间（秒）
   */
  setMemoryCache(key, value, ttl) {
    // 如果内存缓存已满，删除最旧的条目
    if (this.memoryCache.size >= this.maxMemoryItems) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    const expiry = Date.now() + ttl * 1000;
    this.memoryCache.set(key, { value, expiry });
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   */
  async delete(key) {
    try {
      if (this.redisClient) {
        await this.redisClient.del(key);
      }
      this.memoryCache.delete(key);
      logger.debug('缓存删除成功', { key });
    } catch (error) {
      logger.error('缓存删除失败', { key, error: error.message });
    }
  }

  /**
   * 批量删除缓存（支持模式匹配）
   * @param {string} pattern - 匹配模式
   */
  async invalidate(pattern) {
    try {
      if (this.redisClient) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      }

      // 清理内存缓存
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
        }
      }

      logger.debug('缓存批量删除成功', { pattern });
    } catch (error) {
      logger.error('缓存批量删除失败', { pattern, error: error.message });
    }
  }

  /**
   * 清空所有缓存
   */
  async clear() {
    try {
      if (this.redisClient) {
        await this.redisClient.flushdb();
      }
      this.memoryCache.clear();
      logger.info('所有缓存已清空');
    } catch (error) {
      logger.error('清空缓存失败', { error: error.message });
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats() {
    const stats = {
      memoryCache: {
        size: this.memoryCache.size,
        maxSize: this.maxMemoryItems
      },
      redis: {
        connected: !!this.redisClient
      }
    };

    if (this.redisClient) {
      try {
        const info = await this.redisClient.info('memory');
        stats.redis.memory = info;
      } catch (error) {
        logger.warn('获取Redis统计信息失败', { error: error.message });
      }
    }

    return stats;
  }

  /**
   * 缓存装饰器
   * @param {string} keyPrefix - 缓存键前缀
   * @param {number} ttl - 过期时间
   * @returns {Function} 装饰器函数
   */
  cached(keyPrefix, ttl = this.defaultTTL) {
    return (target, propertyName, descriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args) {
        const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;

        // 尝试从缓存获取
        const cachedResult = await this.get(cacheKey);
        if (cachedResult !== null) {
          return cachedResult;
        }

        // 执行原方法
        const result = await originalMethod.apply(this, args);

        // 存储到缓存
        await this.set(cacheKey, result, ttl);

        return result;
      }.bind(this);

      return descriptor;
    };
  }

  /**
   * 清理过期的内存缓存
   */
  cleanupExpiredMemoryCache() {
    const now = Date.now();
    for (const [key, item] of this.memoryCache.entries()) {
      if (now >= item.expiry) {
        this.memoryCache.delete(key);
      }
    }
  }
}

/**
 * 缓存中间件工厂
 * @param {number} ttl - 缓存时间（秒）
 * @param {Function} keyGenerator - 缓存键生成函数
 * @returns {Function} Express中间件
 */
const createCacheMiddleware =
  (ttl = 300, keyGenerator = null) =>
    async (req, res, next) => {
      try {
      // 生成缓存键
        const cacheKey = keyGenerator
          ? keyGenerator(req)
          : `api:${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;

        // 尝试从缓存获取
        const cachedData = await cacheManager.get(cacheKey);
        if (cachedData) {
          return res.json({
            success: true,
            data: cachedData,
            cached: true,
            timestamp: new Date().toISOString()
          });
        }

        // 重写res.json方法以缓存响应
        const originalJson = res.json;
        res.json = function (data) {
        // 只缓存成功的响应
          if (data.success !== false) {
            cacheManager.set(cacheKey, data, ttl).catch((error) => {
              logger.error('缓存响应失败', { cacheKey, error: error.message });
            });
          }
          return originalJson.call(this, data);
        };

        next();
      } catch (error) {
        logger.error('缓存中间件错误', { error: error.message });
        next();
      }
    };

// 创建全局缓存管理器实例
const cacheManager = new CacheManager();

// 定期清理过期的内存缓存
setInterval(() => {
  cacheManager.cleanupExpiredMemoryCache();
}, 60000); // 每分钟清理一次

export { CacheManager, createCacheMiddleware, cacheManager };

export default cacheManager;
