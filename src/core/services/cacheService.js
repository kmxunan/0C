import NodeCache from 'node-cache';
import logger from '../../shared/utils/logger.js';

// 缓存配置
const CACHE_CONFIG = {
/* eslint-disable no-magic-numbers */
  stdTTL: 300, // 默认缓存过期时间（秒）
  checkperiod: 60, // 定期检查过期缓存的时间间隔（秒）
  useClones: false // 不克隆对象，提高性能（注意：可能导致缓存对象被外部修改）
};

// 创建缓存实例
const cache = new NodeCache(CACHE_CONFIG);

/**
 * 缓存服务类
 * 提供基础的缓存操作功能
 */
class CacheService {
  constructor() {
    // 监听缓存事件
    cache.on('expired', (key, _value) => {
      logger.debug(`缓存过期: ${key}`);
    });

    cache.on('flush', () => {
      logger.info('缓存已清空');
    });
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} [ttl] - 过期时间（秒），默认使用全局配置
   * @returns {boolean} - 是否设置成功
   */
  set(key, value, ttl = CACHE_CONFIG.stdTTL) {
    if (!key) {
      logger.error('缓存键不能为空');
      return false;
    }

    try {
      const success = cache.set(key, value, ttl);
      if (success) {
        logger.debug(`缓存设置成功: ${key}, TTL: ${ttl}秒`);
      } else {
        logger.warn(`缓存设置失败: ${key}`);
      }
      return success;
    } catch (error) {
      logger.error(`缓存设置错误: ${key}`, error);
      return false;
    }
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {any} - 缓存值，若不存在则返回undefined
   */
  get(key) {
    if (!key) {
      logger.error('缓存键不能为空');
      return undefined;
    }

    try {
      const value = cache.get(key);
      if (value !== undefined) {
        logger.debug(`缓存命中: ${key}`);
      } else {
        logger.debug(`缓存未命中: ${key}`);
      }
      return value;
    } catch (error) {
      logger.error(`缓存获取错误: ${key}`, error);
      return undefined;
    }
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   * @returns {number} - 被删除的缓存数量
   */
  del(key) {
    if (!key) {
      logger.error('缓存键不能为空');
      return 0;
    }

    try {
      const count = cache.del(key);
      if (count > 0) {
        logger.debug(`缓存删除成功: ${key}`);
      } else {
        logger.debug(`缓存删除失败，键不存在: ${key}`);
      }
      return count;
    } catch (error) {
      logger.error(`缓存删除错误: ${key}`, error);
      return 0;
    }
  }

  /**
   * 批量删除缓存
   * @param {string[]} keys - 缓存键数组
   * @returns {number} - 被删除的缓存数量
   */
  delMulti(keys) {
    if (!Array.isArray(keys) || keys.length === 0) {
      logger.error('缓存键数组不能为空');
      return 0;
    }

    try {
      const count = cache.del(keys);
      logger.debug(`批量删除缓存成功，共删除 ${count} 个缓存`);
      return count;
    } catch (error) {
      logger.error('批量删除缓存错误', error);
      return 0;
    }
  }

  /**
   * 清空所有缓存
   * @returns {void}
   */
  flushAll() {
    try {
      cache.flushAll();
      logger.info('所有缓存已清空');
    } catch (error) {
      logger.error('清空缓存错误', error);
    }
  }

  /**
   * 获取缓存键的剩余生存时间
   * @param {string} key - 缓存键
   * @returns {number} - 剩余时间（秒），-1表示永不过期，-2表示键不存在
   */
  getTtl(key) {
    if (!key) {
      logger.error('缓存键不能为空');
      return -2;
    }

    try {
      return cache.getTtl(key);
    } catch (error) {
      logger.error(`获取缓存TTL错误: ${key}`, error);
      return -2;
    }
  }

  /**
   * 设置缓存键的生存时间
   * @param {string} key - 缓存键
   * @param {number} ttl - 生存时间（秒）
   * @returns {boolean} - 是否设置成功
   */
  setTtl(key, ttl) {
    if (!key || typeof ttl !== 'number' || ttl <= 0) {
      logger.error('缓存键和有效的TTL不能为空');
      return false;
    }

    try {
      return cache.ttl(key, ttl);
    } catch (error) {
      logger.error(`设置缓存TTL错误: ${key}`, error);
      return false;
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {object} - 缓存统计数据
   */
  getStats() {
    try {
      return cache.getStats();
    } catch (error) {
      logger.error('获取缓存统计信息错误', error);
      return null;
    }
  }

  /**
   * 缓存装饰器 - 用于装饰需要缓存的函数
   * @param {number} ttl - 缓存过期时间（秒）
   * @returns {Function} - 装饰器函数
   */
  cacheDecorator(ttl = CACHE_CONFIG.stdTTL) {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args) {
        // 生成缓存键（类名+方法名+参数哈希）
        const key = `${target.constructor.name}_${propertyKey}_${JSON.stringify(args)}`;

        // 尝试从缓存获取
        const cachedResult = this.get(key);
        if (cachedResult !== undefined) {
          return cachedResult;
        }

        // 调用原始方法
        const result = await originalMethod.apply(this, args);

        // 设置缓存
        this.set(key, result, ttl);

        return result;
      };

      return descriptor;
    };
  }
}

// 创建缓存服务实例
const cacheService = new CacheService();

export default cacheService;

export { CacheService };
