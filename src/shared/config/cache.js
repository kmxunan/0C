import redis from 'redis';

// 创建Redis客户端
const redisClient = redis.createClient({
/* eslint-disable no-console */
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.error('Redis连接被拒绝，请检查Redis服务是否运行');
      return 5000; // 5秒后重试
    }
    return Math.min(options.attempt * 100, 3000); // 指数退避策略
  }
});

// 错误处理
redisClient.on('error', (err) => {
  console.error('Redis错误:', err);
});

// 导出Redis客户端和常用方法
export default {
  redisClient,
  get: (key) => redisClient.get(key),
  set: (key, value) => redisClient.set(key, value),
  setAsync: (key, value) => redisClient.set(key, value),
  del: (key) => redisClient.del(key),
  expire: (key, ttl) => redisClient.expire(key, ttl),
  expireAsync: (key, ttl) => redisClient.expire(key, ttl),
  // 默认缓存时间：5分钟
  DEFAULT_TTL: 300,
  // 长时缓存时间：1小时
  LONG_TTL: 3600,
  // 短期缓存时间：30秒
  SHORT_TTL: 30
};
