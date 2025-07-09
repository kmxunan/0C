import { createClient } from 'redis';
import config from '../shared/config/index.js';
import logger from '../shared/utils/logger.js';

const redisConfig = config.redis;

const redisClient = createClient({
  url: `redis://${redisConfig.host}:${redisConfig.port}`,
  password: redisConfig.password,
  database: redisConfig.database
});

redisClient.on('connect', () => logger.info('Redis客户端已连接'));
redisClient.on('ready', () => logger.info('Redis客户端已准备就绪'));
redisClient.on('end', () => logger.warn('Redis客户端连接已断开'));
redisClient.on('reconnecting', () => logger.info('Redis客户端正在重新连接...'));
redisClient.on('error', (err) => logger.error('Redis客户端错误:', err));

(async () => {
  await redisClient.connect();
})();

export default redisClient;
