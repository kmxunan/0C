/* eslint-disable no-console, no-magic-numbers */
import mysql from 'mysql2/promise';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// 从knexfile读取数据库配置
const knexConfig = require('./knexfile.cjs');
const dbConfig = knexConfig.development;

async function fixMigrations() {
  try {
    // 连接到数据库
    const connection = await mysql.createConnection({
      host: dbConfig.connection.host,
      port: dbConfig.connection.port,
      user: 'root',
      password: '',
      database: dbConfig.connection.database,
    });

    console.log('成功连接到数据库');

    // 标记storage_devices迁移为已完成
    const migrationName = '20250101000000_create_storage_devices_table.cjs';
    const [rows] = await connection.execute(
      'INSERT IGNORE INTO knex_migrations (name, batch, migration_time) VALUES (?, 1, NOW())',
      [migrationName]
    );

    if (rows.affectedRows > 0) {
      console.log(`成功标记迁移 ${migrationName} 为已完成`);
    } else {
      console.log(`迁移 ${migrationName} 已存在于数据库中`);
    }

    await connection.end();
  } catch (error) {
    console.error('修复迁移时出错:', error);
    process.exit(1);
  }
}

fixMigrations();
