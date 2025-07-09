import fs from 'fs';
import knex from 'knex';

import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../../shared/utils/logger.js';
import config from '../../shared/config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建一个立即执行的异步函数来初始化数据库，并导出它的 Promise
const dbPromise = (async () => {
  try {
    const dbPath = path.resolve(__dirname, '..', config.database.path);
    logger.info(`数据库路径: ${dbPath}`);

    // 确保数据目录存在
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      logger.info(`创建数据库目录: ${dbDir}`);
    }

    const db = knex({
      client: 'sqlite3',
      connection: {
        filename: dbPath
      },
      useNullAsDefault: true
    });

    // 添加数据库查询日志（移至迁移前）

    logger.info('数据库连接成功');
    await db.migrate.latest({
      directory: path.join(__dirname, 'migrations')
    });
    logger.info('数据库迁移完成');

    // 运行种子文件
    await db.seed.run({
      directory: path.join(__dirname, '..', 'db', 'seeds')
    });
    logger.info('数据库种子运行完成');

    return db; // Promise 将解析为这个 db 实例
  } catch (error) {
    logger.error('数据库初始化失败', {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    throw error; // 重新抛出错误以便调用者处理
  }
})();

export default dbPromise;

// 只导出这个 Promise
export { dbPromise };
