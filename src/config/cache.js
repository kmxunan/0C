import redis from 'redis';
import { promisify } from 'util';

// 创建Redis客户端
const redisClient = redis.createClient({
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

//  promisify Redis方法
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);
const delAsync = promisify(redisClient.del).bind(redisClient);
const expireAsync = promisify(redisClient.expire).bind(redisClient);

export default {
  redisClient,
  getAsync,
  setAsync,
  delAsync,
  expireAsync,
  // 默认缓存时间：5分钟
  DEFAULT_TTL: 300,
  // 长时缓存时间：1小时
  LONG_TTL: 3600,
  // 短期缓存时间：30秒
  SHORT_TTL: 30
};