import cache from '../config/cache.js';
const { getAsync, setAsync, delAsync, expireAsync, DEFAULT_TTL } = cache;

/**
 * 缓存中间件 - 用于缓存GET请求的响应结果
 * @param {number} ttl - 缓存过期时间(秒)
 */
const cacheMiddleware = (ttl = DEFAULT_TTL) => {
  return async (req, res, next) => {
    // 只缓存GET请求
    if (req.method !== 'GET') {
      return next();
    }

    // 生成唯一缓存键
    const cacheKey = `api:${req.originalUrl}`;

    try {
      // 尝试从缓存获取数据
      const cachedData = await getAsync(cacheKey);

      if (cachedData) {
        // 返回缓存数据
        const data = JSON.parse(cachedData);
        return res.json(data);
      }

      // 重写res.json方法
      const originalJson = res.json;
      res.json = function(body) {
        // 缓存响应数据
        setAsync(cacheKey, JSON.stringify(body))
          .then(() => expireAsync(cacheKey, ttl))
          .catch(err => console.error('缓存设置失败:', err));

        return originalJson.call(this, body);
      };

next();    } catch (err) {
      console.error('缓存中间件错误:', err);
      next();
    }
  }; 
}
export { cacheMiddleware, clearCacheMiddleware };






/**
 * 清除缓存的中间件
 * @param {string} pattern - 缓存键匹配模式
 */
const clearCacheMiddleware = (pattern) => {
  return async (req, res, next) => {
    try {
      // 实现缓存清除逻辑
      next();
    } catch (err) {
      console.error('清除缓存失败:', err);
      next();
    }
  };
}