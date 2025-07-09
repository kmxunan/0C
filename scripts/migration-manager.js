#!/usr/bin/env node
/* eslint-disable no-console, no-magic-numbers */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 数据库迁移管理器
 * 支持版本控制、自动迁移、回滚等功能
 */
class MigrationManager {
  constructor(options = {}) {
    this.options = {
      projectRoot: options.projectRoot || path.resolve(__dirname, '..'),
      migrationsDir: options.migrationsDir || 'migrations',
      seedsDir: options.seedsDir || 'seeds',
      configFile: options.configFile || 'migration.config.js',
      tableName: options.tableName || 'migrations',
      lockTable: options.lockTable || 'migration_lock',
      ...options,
    };

    this.db = null;
    this.config = null;
  }

  /**
   * 初始化迁移管理器
   */
  async initialize() {
    console.log('🔧 初始化数据库迁移管理器...');

    // 加载配置
    await this.loadConfig();

    // 创建必要目录
    await this.createDirectories();

    // 连接数据库
    await this.connectDatabase();

    // 创建迁移表
    await this.createMigrationTables();

    console.log('✅ 迁移管理器初始化完成');
  }

  /**
   * 加载配置
   */
  async loadConfig() {
    const configPath = path.join(this.options.projectRoot, this.options.configFile);

    try {
      await fs.promises.access(configPath);
    } catch {
      console.log('📝 创建默认迁移配置...');
      await this.createDefaultConfig(configPath);
    }

    try {
      const configModule = await import(`file://${configPath}`);
      this.config = configModule.default || configModule;

      console.log(`✅ 配置加载成功: ${this.config.client}`);
    } catch (error) {
      throw new Error(`加载迁移配置失败: ${error.message}`);
    }
  }

  /**
   * 创建默认配置
   */

  // TODO: 考虑将此函数拆分为更小的函数 (当前 85 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 85 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 85 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 85 行)

  async createDefaultConfig(configPath) {
    const defaultConfig = `export default {
  // 数据库类型
  client: 'sqlite3',
  
  // 连接配置
  connection: {
    // SQLite配置
    filename: './database.sqlite',
    
    // MySQL/PostgreSQL配置示例
    // host: 'localhost',
    // port: 3306,
    // user: 'root',
    // password: process.env.DB_PASSWORD || 'default',
    // database: 'carbon_management'
  },
  
  // 连接池配置
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100
  },
  
  // 迁移配置
  migrations: {
    tableName: 'migrations',
    directory: './migrations',
    extension: 'js',
    loadExtensions: ['.js'],
    sortDirsSeparately: false
  },
  
  // 种子数据配置
  seeds: {
    directory: './seeds',
    extension: 'js',
    loadExtensions: ['.js']
  },
  
  // 环境配置
  environments: {
    development: {
      client: 'sqlite3',
      connection: {
        filename: './dev.sqlite'
      },
      useNullAsDefault: true
    },
    
    test: {
      client: 'sqlite3',
      connection: {
        filename: ':memory:'
      },
      useNullAsDefault: true
    },
    
    production: {
      client: 'mysql2',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'carbon_management'
      },
      pool: {
        min: 2,
        max: 10
      }
    }
  }
};
`;

    await fs.promises.writeFile(configPath, defaultConfig);
    console.log(`✅ 默认配置已创建: ${configPath}`);
  }

  /**
   * 创建必要目录
   */
  async createDirectories() {
    const dirs = [
      path.join(this.options.projectRoot, this.options.migrationsDir),
      path.join(this.options.projectRoot, this.options.seedsDir),
    ];

    for (const dir of dirs) {
      try {
        await fs.promises.access(dir);
      } catch {
        await fs.promises.mkdir(dir, { recursive: true });
      }
    }
  }

  /**
   * 连接数据库
   */
  async connectDatabase() {
    console.log('🔌 连接数据库...');

    // 这里应该根据配置连接实际数据库
    // 为了演示，我们使用模拟的数据库连接
    this.db = new MockDatabase(this.config);
    await this.db.connect();

    console.log('✅ 数据库连接成功');
  }

  // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

  /**
   * 创建迁移表
   */
  async createMigrationTables() {
    console.log('📋 创建迁移管理表...');

    // 创建迁移记录表
    await this.db.createTable(this.options.tableName, {
      id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
      name: 'VARCHAR(255) NOT NULL',
      batch: 'INTEGER NOT NULL',
      migration_time: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    });

    // 创建迁移锁表
    await this.db.createTable(this.options.lockTable, {
      index: 'INTEGER PRIMARY KEY',
      is_locked: 'INTEGER DEFAULT 0',
    });

    // 初始化锁记录
    await this.db.insertOrIgnore(this.options.lockTable, {
      index: 1,
      is_locked: 0,
    });

    console.log('✅ 迁移管理表创建完成');
  }

  /**
   * 创建新迁移
   */
  async createMigration(name, options = {}) {
    if (!name) {
      throw new Error('迁移名称不能为空');
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.T-]/g, '')
      .slice(0, 14);
    const filename = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}.js`;
    const filepath = path.join(this.options.projectRoot, this.options.migrationsDir, filename);

    const template = this.generateMigrationTemplate(name, options);

    await fs.promises.writeFile(filepath, template);

    console.log(`✅ 迁移文件已创建: ${filename}`);
    console.log(`📁 路径: ${filepath}`);

    return filepath;
  }

  /**
   * 生成迁移模板
   */
  generateMigrationTemplate(name, options = {}) {
    const { table, action = 'create' } = options;

    let template = `/**
 * 迁移: ${name}
 * 创建时间: ${new Date().toISOString()}
 */

`;

    if (action === 'create' && table) {
      template += `export async function up(db) {
  // 创建表: ${table}
  await db.createTable('${table}', {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
    // 添加其他字段...
  });
  
  console.log('✅ 表 ${table} 创建成功');
}

export async function down(db) {
  // 删除表: ${table}
  await db.dropTable('${table}');
  
  console.log('✅ 表 ${table} 删除成功');
}
`;
    } else if (action === 'alter' && table) {
      template += `export async function up(db) {
  // 修改表: ${table}
  await db.alterTable('${table}', {
    // 添加列
    // new_column: 'VARCHAR(255)'
    
    // 修改列
    // existing_column: 'TEXT'
  });
  
  console.log('✅ 表 ${table} 修改成功');
}

export async function down(db) {
  // 回滚表修改: ${table}
  await db.alterTable('${table}', {
    // 回滚操作...
  });
  
  console.log('✅ 表 ${table} 回滚成功');
}
`;
    } else {
      template += `export async function up(db) {
  // 执行迁移操作
  console.log('执行迁移: ${name}');
  
  // 示例：创建表
  // await db.createTable('example_table', {
  //   id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
  //   name: 'VARCHAR(255) NOT NULL',
  //   created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
  // });
  
  // 示例：插入数据
  // await db.insert('example_table', {
  //   name: 'Example'
  // });
  
  console.log('✅ 迁移 ${name} 执行成功');
}

export async function down(db) {
  // 回滚迁移操作
  console.log('回滚迁移: ${name}');
  
  // 示例：删除表
  // await db.dropTable('example_table');
  
  console.log('✅ 迁移 ${name} 回滚成功');
}
`;
    }

    return template;
  }

  /**
   * 运行迁移
   */
  async migrate(options = {}) {
    const { target, step } = options;

    console.log('🚀 开始执行数据库迁移...');

    try {
      // 获取迁移锁
      await this.acquireLock();

      // 获取待执行的迁移
      const pendingMigrations = await this.getPendingMigrations();

      if (pendingMigrations.length === 0) {
        console.log('✅ 没有待执行的迁移');
        return;
      }

      console.log(`📋 发现 ${pendingMigrations.length} 个待执行的迁移`);

      // 确定要执行的迁移
      let migrationsToRun = pendingMigrations;

      if (target) {
        const targetIndex = pendingMigrations.findIndex((m) => m.name.includes(target));
        if (targetIndex === -1) {
          throw new Error(`未找到目标迁移: ${target}`);
        }
        migrationsToRun = pendingMigrations.slice(0, targetIndex + 1);
      } else if (step) {
        migrationsToRun = pendingMigrations.slice(0, step);
      }

      // 获取下一个批次号
      const nextBatch = await this.getNextBatchNumber();

      // 执行迁移
      for (const migration of migrationsToRun) {
        await this.runMigration(migration, nextBatch);
      }

      console.log(`✅ 成功执行 ${migrationsToRun.length} 个迁移`);
    } finally {
      // 释放迁移锁
      await this.releaseLock();
    }
  }

  /**
   * 回滚迁移
   */
  async rollback(options = {}) {
    const { target, step = 1 } = options;

    console.log('🔄 开始回滚数据库迁移...');

    try {
      // 获取迁移锁
      await this.acquireLock();

      // 获取已执行的迁移
      const executedMigrations = await this.getExecutedMigrations();

      if (executedMigrations.length === 0) {
        console.log('✅ 没有可回滚的迁移');
        return;
      }

      // 确定要回滚的迁移
      let migrationsToRollback;

      if (target) {
        const targetIndex = executedMigrations.findIndex((m) => m.name.includes(target));
        if (targetIndex === -1) {
          throw new Error(`未找到目标迁移: ${target}`);
        }
        migrationsToRollback = executedMigrations.slice(0, targetIndex + 1);
      } else {
        // 获取最后一个批次的迁移
        const lastBatch = Math.max(...executedMigrations.map((m) => m.batch));
        migrationsToRollback = executedMigrations.filter((m) => m.batch === lastBatch);

        if (step > 1) {
          // 如果指定了步数，获取更多批次
          const batches = [...new Set(executedMigrations.map((m) => m.batch))].sort(
            (a, b) => b - a
          );
          const targetBatches = batches.slice(0, step);
          migrationsToRollback = executedMigrations.filter((m) => targetBatches.includes(m.batch));
        }
      }

      console.log(`📋 将回滚 ${migrationsToRollback.length} 个迁移`);

      // 按执行顺序的逆序回滚
      migrationsToRollback.reverse();

      // 执行回滚
      for (const migration of migrationsToRollback) {
        await this.rollbackMigration(migration);
      }

      console.log(`✅ 成功回滚 ${migrationsToRollback.length} 个迁移`);
    } finally {
      // 释放迁移锁
      await this.releaseLock();
    }
  }

  /**
   * 获取迁移状态
   */
  async status() {
    console.log('📊 检查迁移状态...');

    const allMigrations = await this.getAllMigrationFiles();
    const executedMigrations = await this.getExecutedMigrations();

    console.log('\n📋 迁移状态报告:');
    console.log('='.repeat(60));

    const executedNames = new Set(executedMigrations.map((m) => m.name));

    for (const migration of allMigrations) {
      const status = executedNames.has(migration.name) ? '✅ 已执行' : '⏳ 待执行';
      const executed = executedMigrations.find((m) => m.name === migration.name);
      const batchInfo = executed ? ` (批次: ${executed.batch})` : '';

      console.log(`${status} ${migration.name}${batchInfo}`);
    }

    console.log('='.repeat(60));
    console.log(`总计: ${allMigrations.length} 个迁移`);
    console.log(`已执行: ${executedMigrations.length} 个`);
    console.log(`待执行: ${allMigrations.length - executedMigrations.length} 个`);
  }

  /**
   * 运行种子数据
   */
  async seed(options = {}) {
    const { specific } = options;

    console.log('🌱 开始运行种子数据...');

    const seedFiles = await this.getSeedFiles(specific);

    if (seedFiles.length === 0) {
      console.log('✅ 没有找到种子文件');
      return;
    }

    console.log(`📋 发现 ${seedFiles.length} 个种子文件`);

    for (const seedFile of seedFiles) {
      await this.runSeed(seedFile);
    }

    console.log(`✅ 成功运行 ${seedFiles.length} 个种子文件`);
  }

  /**
   * 重置数据库
   */
  async reset() {
    console.log('🔄 重置数据库...');

    try {
      // 获取迁移锁
      await this.acquireLock();

      // 回滚所有迁移
      const executedMigrations = await this.getExecutedMigrations();

      if (executedMigrations.length > 0) {
        console.log(`📋 回滚 ${executedMigrations.length} 个迁移`);

        // 按执行顺序的逆序回滚
        executedMigrations.reverse();

        for (const migration of executedMigrations) {
          await this.rollbackMigration(migration);
        }
      }

      // 重新运行所有迁移
      await this.migrate();

      console.log('✅ 数据库重置完成');
    } finally {
      // 释放迁移锁
      await this.releaseLock();
    }
  }

  /**
   * 获取待执行的迁移
   */
  async getPendingMigrations() {
    const allMigrations = await this.getAllMigrationFiles();
    const executedMigrations = await this.getExecutedMigrations();

    const executedNames = new Set(executedMigrations.map((m) => m.name));

    return allMigrations.filter((migration) => !executedNames.has(migration.name));
  }

  /**
   * 获取已执行的迁移
   */
  async getExecutedMigrations() {
    return await this.db.select(this.options.tableName, {
      orderBy: 'migration_time DESC',
    });
  }

  /**
   * 获取所有迁移文件
   */
  async getAllMigrationFiles() {
    const migrationsDir = path.join(this.options.projectRoot, this.options.migrationsDir);

    try {
      await fs.promises.access(migrationsDir);
    } catch {
      return [];
    }

    const files = (await fs.promises.readdir(migrationsDir))
      .filter((file) => file.endsWith('.js'))
      .sort();

    return files.map((file) => ({
      name: file,
      path: path.join(migrationsDir, file),
    }));
  }

  /**
   * 运行单个迁移
   */
  async runMigration(migration, batch) {
    console.log(`   执行迁移: ${migration.name}`);

    try {
      // 动态导入迁移文件
      const migrationModule = await import(`file://${migration.path}`);

      if (typeof migrationModule.up !== 'function') {
        throw new Error(`迁移文件 ${migration.name} 缺少 up 函数`);
      }

      // 执行迁移
      await migrationModule.up(this.db);

      // 记录迁移
      await this.db.insert(this.options.tableName, {
        name: migration.name,
        batch,
      });

      console.log(`   ✅ ${migration.name} 执行成功`);
    } catch (error) {
      console.error(`   ❌ ${migration.name} 执行失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 回滚单个迁移
   */
  async rollbackMigration(migration) {
    console.log(`   回滚迁移: ${migration.name}`);

    try {
      // 构建迁移文件路径
      const migrationPath = path.join(
        this.options.projectRoot,
        this.options.migrationsDir,
        migration.name
      );

      // 动态导入迁移文件
      const migrationModule = await import(`file://${migrationPath}`);

      if (typeof migrationModule.down !== 'function') {
        throw new Error(`迁移文件 ${migration.name} 缺少 down 函数`);
      }

      // 执行回滚
      await migrationModule.down(this.db);

      // 删除迁移记录
      await this.db.delete(this.options.tableName, {
        name: migration.name,
      });

      console.log(`   ✅ ${migration.name} 回滚成功`);
    } catch (error) {
      console.error(`   ❌ ${migration.name} 回滚失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取种子文件
   */
  async getSeedFiles(specific = null) {
    const seedsDir = path.join(this.options.projectRoot, this.options.seedsDir);

    try {
      await fs.promises.access(seedsDir);
    } catch {
      return [];
    }

    let files = (await fs.promises.readdir(seedsDir)).filter((file) => file.endsWith('.js')).sort();

    if (specific) {
      files = files.filter((file) => file.includes(specific));
    }

    return files.map((file) => ({
      name: file,
      path: path.join(seedsDir, file),
    }));
  }

  /**
   * 运行种子文件
   */
  async runSeed(seedFile) {
    console.log(`   运行种子: ${seedFile.name}`);

    try {
      // 动态导入种子文件
      const seedModule = await import(`file://${seedFile.path}`);

      if (typeof seedModule.seed !== 'function') {
        throw new Error(`种子文件 ${seedFile.name} 缺少 seed 函数`);
      }

      // 执行种子
      await seedModule.seed(this.db);

      console.log(`   ✅ ${seedFile.name} 运行成功`);
    } catch (error) {
      console.error(`   ❌ ${seedFile.name} 运行失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取下一个批次号
   */
  async getNextBatchNumber() {
    const result = await this.db.select(this.options.tableName, {
      select: 'MAX(batch) as max_batch',
    });

    const maxBatch = result[0]?.max_batch || 0;
    return maxBatch + 1;
  }

  /**
   * 获取迁移锁
   */
  async acquireLock() {
    const lockResult = await this.db.select(this.options.lockTable, {
      where: { index: 1 },
    });

    if (lockResult[0]?.is_locked) {
      throw new Error('迁移正在进行中，请稍后再试');
    }

    await this.db.update(this.options.lockTable, { is_locked: 1 }, { index: 1 });
  }

  /**
   * 释放迁移锁
   */
  async releaseLock() {
    await this.db.update(this.options.lockTable, { is_locked: 0 }, { index: 1 });
  }

  /**
   * 清理资源
   */
  async cleanup() {
    if (this.db) {
      await this.db.disconnect();
    }
  }
}

/**
 * 模拟数据库类（实际使用时应该替换为真实的数据库连接）
 */
class MockDatabase {
  constructor(config) {
    this.config = config;
    this.tables = new Map();
  }

  async connect() {
    console.log('   模拟数据库连接成功');
  }

  async disconnect() {
    console.log('   模拟数据库连接关闭');
  }

  async createTable(tableName, schema) {
    this.tables.set(tableName, {
      schema,
      data: [],
    });
    console.log(`   创建表: ${tableName}`);
  }

  async dropTable(tableName) {
    this.tables.delete(tableName);
    console.log(`   删除表: ${tableName}`);
  }

  async alterTable(tableName, changes) {
    console.log(`   修改表: ${tableName}`);
  }

  async insert(tableName, data) {
    if (!this.tables.has(tableName)) {
      throw new Error(`表不存在: ${tableName}`);
    }

    const table = this.tables.get(tableName);
    const record = {
      id: table.data.length + 1,
      ...data,
      migration_time: new Date().toISOString(),
    };

    table.data.push(record);
    return record;
  }

  async insertOrIgnore(tableName, data) {
    try {
      return await this.insert(tableName, data);
    } catch (error) {
      // 忽略错误
    }
  }

  async select(tableName, options = {}) {
    if (!this.tables.has(tableName)) {
      return [];
    }

    const table = this.tables.get(tableName);
    let result = [...table.data];

    // 简单的查询实现
    if (options.where) {
      result = result.filter((row) =>
        Object.entries(options.where).every(([key, value]) => row[key] === value)
      );
    }

    if (options.orderBy) {
      const [field, direction = 'ASC'] = options.orderBy.split(' ');
      result.sort((a, b) => {
        if (direction.toUpperCase() === 'DESC') {
          return b[field] > a[field] ? 1 : -1;
        }
        return a[field] > b[field] ? 1 : -1;
      });
    }

    return result;
  }

  async update(tableName, data, where) {
    if (!this.tables.has(tableName)) {
      throw new Error(`表不存在: ${tableName}`);
    }

    const table = this.tables.get(tableName);

    table.data.forEach((row) => {
      const matches = Object.entries(where).every(([key, value]) => row[key] === value);
      if (matches) {
        Object.assign(row, data);
      }
    });
  }

  async delete(tableName, where) {
    if (!this.tables.has(tableName)) {
      throw new Error(`表不存在: ${tableName}`);
    }

    const table = this.tables.get(tableName);

    table.data = table.data.filter(
      (row) => !Object.entries(where).every(([key, value]) => row[key] === value)
    );
  }
}

// 命令行接口
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];

  const manager = new MigrationManager();

  async function main() {
    try {
      await manager.initialize();

      switch (command) {
        case 'create':
          {
            const name = args[1];
          if (!name) {
            console.error(
              '请指定迁移名称: create <name> [--table=table_name] [--action=create|alter]'
            );
            process.exit(1);
          }

          const options = {};
          args.slice(2).forEach((arg) => {
            if (arg.startsWith('--table=')) {
              options.table = arg.split('=')[1];
            }
            if (arg.startsWith('--action=')) {
              options.action = arg.split('=')[1];
            }
          });

          await manager.createMigration(name, options);
            break;

          }

        case 'migrate':
        case 'up':
          {
            const migrateOptions = {};
          if (args.includes('--step')) {
            const stepIndex = args.indexOf('--step');
            migrateOptions.step = parseInt(args[stepIndex + 1]) || 1;
          }
          await manager.migrate(migrateOptions);
            break;

          }

        case 'rollback':
        case 'down':
          {
            const rollbackOptions = {};
          if (args.includes('--step')) {
            const stepIndex = args.indexOf('--step');
            rollbackOptions.step = parseInt(args[stepIndex + 1]) || 1;
          }
          await manager.rollback(rollbackOptions);
            break;

          }

        case 'status':
          await manager.status();
            break;

          }

        case 'seed':
          {
            const seedOptions = {};
          if (args[1]) {
            seedOptions.specific = args[1];
          }
          await manager.seed(seedOptions);
            break;

          }

        case 'reset':
          await manager.reset();
            break;

          }

        default:
          console.log(`
使用方法:
  node migration-manager.js create <name> [--table=table_name] [--action=create|alter]
  node migration-manager.js migrate [--step=n]
  node migration-manager.js rollback [--step=n]
  node migration-manager.js status
  node migration-manager.js seed [seed_name]
  node migration-manager.js reset
`);
      }
    } catch (error) {
      console.error(`\n❌ 操作失败: ${error.message}`);
      process.exit(1);
    } finally {
      await manager.cleanup();
    }
  }

  main();
}

export default MigrationManager;
