import mysql from 'mysql2/promise';
import logger from './src/shared/utils/logger.js';
import { MATH_CONSTANTS } from './src/shared/constants/MathConstants.js';

async function createDatabase() {
  try {
    logger.info('尝试连接到MySQL服务器...');
    logger.info('连接参数: host=localhost, port=3306, user=root');

    // 连接到MySQL服务器（不指定数据库）
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      port: MATH_CONSTANTS.THREE_THOUSAND_THREE_HUNDRED_SIX,
      connectTimeout: MATH_CONSTANTS.TEN_THOUSAND,
    });

    logger.info('成功连接到MySQL服务器');

    // 创建数据库
    await connection.query('CREATE DATABASE IF NOT EXISTS zero_carbon_park;');
    logger.info('数据库创建成功或已存在');

    await connection.end();
  } catch (err) {
    logger.error('连接或创建数据库失败:');
    logger.error('错误代码:', err.code);
    logger.error('错误信息:', err.message);
    logger.error('请检查MySQL服务器是否运行，端口是否正确，以及root用户是否允许无密码连接');
    process.exit(MATH_CONSTANTS.ONE);
  }
}

createDatabase();
