import cacheService from '../services/cacheService.js';
import { logger } from '../utils/logger.js';

/**
 * API响应缓存中间件
 * 用于缓存API接口的响应结果，减少重复计算和数据库查询
 */
class CacheMiddleware {
  /**
   * 创建缓存中间件
   * @param {Object} options - 缓存选项
   * @param {number} options.ttl - 缓存过期时间（秒）
   * @param {Function} [options.keyGenerator] - 自定义缓存键生成函数
   * @param {Function} [options.shouldCache] - 判断是否缓存响应的函数
   * @returns {Function} - Express中间件
   */
  static createCacheMiddleware(options = {}) {
    const { ttl = 300, keyGenerator, shouldCache } = options;

    return async (req, res, next) => {
      // 只缓存GET请求
      if (req.method !== 'GET') {
        return next();
      }

      // 生成缓存键
      const cacheKey = keyGenerator ? keyGenerator(req) : CacheMiddleware.defaultKeyGenerator(req);

      try {
        // 尝试从缓存获取数据
        const cachedData = cacheService.get(cacheKey);

        if (cachedData) {
          logger.debug(`缓存命中: ${cacheKey}`);
          return res.json(cachedData);
        }

        // 重写res.json方法以缓存响应
        const originalJson = res.json;
        res.json = function(body) {
          // 判断是否应该缓存
          if (!shouldCache || shouldCache(req, res, body)) {
            cacheService.set(cacheKey, body, ttl);
            logger.debug(`缓存设置成功: ${cacheKey}, TTL: ${ttl}秒`);
          }
          return originalJson.call(this, body);
        };

        next();
      } catch (error) {
        logger.error(`缓存中间件错误: ${cacheKey}`, error);
        next(); // 缓存出错时继续请求处理，不影响正常业务
      }
    };
  }

  /**
   * 默认缓存键生成器
   * @param {Object} req - Express请求对象
   * @returns {string} - 缓存键
   */
  static defaultKeyGenerator(req) {
    // 包含查询参数的完整URL作为缓存键
    const queryString = new URLSearchParams(req.query).toString();
    return `${req.originalUrl}${queryString ? '?' + queryString : ''}`;
  }

  /**
   * 创建缓存清除中间件
   * 用于在数据更新时清除相关缓存
   * @param {Function} keyPatternGenerator - 生成缓存键模式的函数
   * @returns {Function} - Express中间件
   */
  static createCacheInvalidator(keyPatternGenerator) {
    return async (req, res, next) => {
      try {
        // 先执行后续中间件
        await new Promise((resolve, reject) => {
          res.on('finish', resolve);
          res.on('error', reject);
          next();
        });

        // 生成缓存键模式并清除匹配的缓存
        const keyPattern = keyPatternGenerator(req, res);
        if (keyPattern) {
          const stats = cacheService.getStats();
          const keys = stats && stats.keys ? stats.keys : [];
          const matchedKeys = keys.filter(key => key.includes(keyPattern));

          if (matchedKeys.length > 0) {
            const count = cacheService.delMulti(matchedKeys);
            logger.debug(`缓存清除成功: 模式=${keyPattern}, 数量=${count}`);
          }
        }
      } catch (error) {
        logger.error('缓存清除中间件错误', error);
        // 缓存清除失败不影响主流程
      }
    };
  }

  /**
   * 常用缓存场景的快捷方法
   */

  /**
   * 设备数据缓存中间件
   * @param {number} [ttl=60] - 缓存时间（秒）
   * @returns {Function} - Express中间件
   */
  static deviceDataCache(ttl = 60) {
    return CacheMiddleware.createCacheMiddleware({
      ttl,
      shouldCache: (req, res, body) => {
        // 只缓存成功响应
        return res.statusCode === 200 && body && body.success !== false;
      }
    });
  }

  /**
   * 能源统计数据缓存中间件
   * @param {number} [ttl=300] - 缓存时间（秒）
   * @returns {Function} - Express中间件
   */
  static energyStatsCache(ttl = 300) {
    return CacheMiddleware.createCacheMiddleware({
      ttl,
      shouldCache: (req, res, body) => {
        return res.statusCode === 200 && body && body.success !== false;
      }
    });
  }

  /**
   * 清除设备数据缓存的中间件
   * @returns {Function} - Express中间件
   */
  static invalidateDeviceCache() {
    return CacheMiddleware.createCacheInvalidator((req, res) => {
      // 从请求参数中获取设备ID
      const deviceId = req.params.id || req.body.deviceId;
      return deviceId ? `device/${deviceId}` : null;
    });
  }

  /**
   * 清除能源统计缓存的中间件
   * @returns {Function} - Express中间件
   */
  static invalidateEnergyStatsCache() {
    return CacheMiddleware.createCacheInvalidator(() => {
      return 'energy/stats';
    });
  }
}

export default CacheMiddleware;