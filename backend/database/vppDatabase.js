import mysql from 'mysql2/promise';
import logger from '../../src/shared/utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 虚拟电厂数据库管理类
 * 提供数据库连接、初始化、查询等功能
 * P0阶段功能：基础数据库操作、连接池管理、事务支持
 */
class VPPDatabase {
  constructor() {
    this.pool = null;
    this.isInitialized = false;
    this.connectionConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'zero_carbon_park',
      charset: 'utf8mb4',
      timezone: '+08:00',
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true,
      connectionLimit: 20,
      queueLimit: 0,
      multipleStatements: true
    };
  }

  /**
   * 初始化数据库连接池
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        logger.info('VPP数据库已初始化');
        return;
      }

      // 创建连接池
      this.pool = mysql.createPool(this.connectionConfig);
      
      // 测试连接
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      
      this.isInitialized = true;
      logger.info('VPP数据库连接池初始化成功', {
        host: this.connectionConfig.host,
        port: this.connectionConfig.port,
        database: this.connectionConfig.database,
        connectionLimit: this.connectionConfig.connectionLimit
      });
      
      // 初始化数据库表结构
      await this.initializeTables();
      
    } catch (error) {
      logger.error('VPP数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化数据库表结构
   */
  async initializeTables() {
    try {
      logger.info('开始初始化VPP数据库表结构');
      
      // 执行数据库迁移
      await this.runMigrations();
      
      logger.info('VPP数据库表结构初始化完成');
    } catch (error) {
      logger.error('VPP数据库表结构初始化失败:', error);
      // 不抛出错误，允许系统继续运行
    }
  }

  /**
   * 运行数据库迁移
   */
  async runMigrations() {
    try {
      // P0阶段迁移
      const p0MigrationPath = path.join(__dirname, 'migrations', 'create_vpp_tables.sql');
      await this.executeMigrationFile(p0MigrationPath, 'P0阶段基础表');
      
      // P1阶段迁移
      const p1MigrationPath = path.join(__dirname, 'migrations', 'create_vpp_p1_tables.sql');
      await this.executeMigrationFile(p1MigrationPath, 'P1阶段扩展表');
      
      // P2阶段迁移
      const p2MigrationPath = path.join(__dirname, 'migrations', 'create_vpp_p2_tables.sql');
      await this.executeMigrationFile(p2MigrationPath, 'P2阶段扩展表');
      
      logger.info('所有数据库迁移执行完成');
    } catch (error) {
      logger.error('数据库迁移失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 执行单个迁移文件
   */
  async executeMigrationFile(migrationPath, description) {
    try {
      // 检查迁移文件是否存在
      try {
        await fs.access(migrationPath);
      } catch (error) {
        logger.warn(`未找到迁移文件: ${description}`, { path: migrationPath });
        return;
      }
      
      // 读取并执行迁移脚本
      const migrationSQL = await fs.readFile(migrationPath, 'utf8');
      
      // 分割SQL语句（处理多语句执行）
      const statements = migrationSQL
        .split(/;\s*\n/)
        .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'))
        .map(stmt => stmt.trim());
      
      logger.info(`执行${description}: ${statements.length} 个SQL语句`);
      
      const connection = await this.pool.getConnection();
      
      try {
        await connection.beginTransaction();
        
        for (const statement of statements) {
          if (statement) {
            await connection.execute(statement);
          }
        }
        
        await connection.commit();
        logger.info(`${description}迁移执行完成`);
        
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
      
    } catch (error) {
      logger.error(`${description}迁移失败`, { error: error.message });
      throw error;
    }
  }

  /**
   * 获取数据库连接
   */
  async getConnection() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return await this.pool.getConnection();
  }

  /**
   * 执行查询
   */
  async query(sql, params = []) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(sql, params);
      return rows;
    } catch (error) {
      logger.error('VPP数据库查询失败:', {
        sql: sql.substring(0, 200),
        params,
        error: error.message
      });
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 执行事务
   */
  async transaction(callback) {
    const connection = await this.getConnection();
    try {
      await connection.beginTransaction();
      
      const result = await callback(connection);
      
      await connection.commit();
      return result;
      
    } catch (error) {
      await connection.rollback();
      logger.error('VPP数据库事务失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 插入数据
   */
  async insert(table, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
    
    try {
      const result = await this.query(sql, values);
      return {
        success: true,
        insertId: result.insertId,
        affectedRows: result.affectedRows
      };
    } catch (error) {
      logger.error(`VPP数据库插入失败 - 表: ${table}`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 更新数据
   */
  async update(table, data, where, whereParams = []) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    const params = [...values, ...whereParams];
    
    try {
      const result = await this.query(sql, params);
      return {
        success: true,
        affectedRows: result.affectedRows,
        changedRows: result.changedRows
      };
    } catch (error) {
      logger.error(`VPP数据库更新失败 - 表: ${table}`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 删除数据
   */
  async delete(table, where, whereParams = []) {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    
    try {
      const result = await this.query(sql, whereParams);
      return {
        success: true,
        affectedRows: result.affectedRows
      };
    } catch (error) {
      logger.error(`VPP数据库删除失败 - 表: ${table}`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 查询单条记录
   */
  async findOne(table, where, whereParams = [], fields = '*') {
    const sql = `SELECT ${fields} FROM ${table} WHERE ${where} LIMIT 1`;
    
    try {
      const rows = await this.query(sql, whereParams);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error(`VPP数据库查询失败 - 表: ${table}`, error);
      throw error;
    }
  }

  /**
   * 查询多条记录
   */
  async findMany(table, where = '1=1', whereParams = [], fields = '*', orderBy = '', limit = '') {
    let sql = `SELECT ${fields} FROM ${table} WHERE ${where}`;
    
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }
    
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }
    
    try {
      return await this.query(sql, whereParams);
    } catch (error) {
      logger.error(`VPP数据库查询失败 - 表: ${table}`, error);
      throw error;
    }
  }

  /**
   * 统计记录数
   */
  async count(table, where = '1=1', whereParams = []) {
    const sql = `SELECT COUNT(*) as count FROM ${table} WHERE ${where}`;
    
    try {
      const rows = await this.query(sql, whereParams);
      return rows[0].count;
    } catch (error) {
      logger.error(`VPP数据库统计失败 - 表: ${table}`, error);
      throw error;
    }
  }

  /**
   * 检查表是否存在
   */
  async tableExists(tableName) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = ?
    `;
    
    try {
      const rows = await this.query(sql, [this.connectionConfig.database, tableName]);
      return rows[0].count > 0;
    } catch (error) {
      logger.error(`检查表存在性失败 - 表: ${tableName}`, error);
      return false;
    }
  }

  /**
   * 获取表结构信息
   */
  async getTableSchema(tableName) {
    const sql = `DESCRIBE ${tableName}`;
    
    try {
      return await this.query(sql);
    } catch (error) {
      logger.error(`获取表结构失败 - 表: ${tableName}`, error);
      throw error;
    }
  }

  /**
   * 执行聚合查询
   */
  async aggregate(table, aggregateFields, where = '1=1', whereParams = [], groupBy = '') {
    let sql = `SELECT ${aggregateFields} FROM ${table} WHERE ${where}`;
    
    if (groupBy) {
      sql += ` GROUP BY ${groupBy}`;
    }
    
    try {
      return await this.query(sql, whereParams);
    } catch (error) {
      logger.error(`VPP数据库聚合查询失败 - 表: ${table}`, error);
      throw error;
    }
  }

  /**
   * 批量插入数据
   */
  async batchInsert(table, dataArray) {
    if (!dataArray || dataArray.length === 0) {
      return { success: true, affectedRows: 0 };
    }
    
    const fields = Object.keys(dataArray[0]);
    const placeholders = fields.map(() => '?').join(', ');
    const valuesClause = dataArray.map(() => `(${placeholders})`).join(', ');
    
    const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES ${valuesClause}`;
    const values = dataArray.flatMap(data => Object.values(data));
    
    try {
      const result = await this.query(sql, values);
      return {
        success: true,
        affectedRows: result.affectedRows
      };
    } catch (error) {
      logger.error(`VPP数据库批量插入失败 - 表: ${table}`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取连接池状态
   */
  getPoolStatus() {
    if (!this.pool) {
      return { status: 'not_initialized' };
    }
    
    return {
      status: 'active',
      totalConnections: this.pool._allConnections?.length || 0,
      freeConnections: this.pool._freeConnections?.length || 0,
      acquiringConnections: this.pool._acquiringConnections?.length || 0,
      connectionLimit: this.connectionConfig.connectionLimit
    };
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      if (!this.isInitialized) {
        return {
          status: 'unhealthy',
          message: '数据库未初始化'
        };
      }
      
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      
      return {
        status: 'healthy',
        message: '数据库连接正常',
        poolStatus: this.getPoolStatus()
      };
      
    } catch (error) {
      logger.error('VPP数据库健康检查失败:', error);
      return {
        status: 'unhealthy',
        message: error.message
      };
    }
  }

  /**
   * 关闭数据库连接池
   */
  async close() {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
        this.isInitialized = false;
        logger.info('VPP数据库连接池已关闭');
      }
    } catch (error) {
      logger.error('关闭VPP数据库连接池失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
const vppDatabase = new VPPDatabase();

// 导出数据库实例和常用方法
export default vppDatabase;

// 导出便捷方法
export const {
  query,
  transaction,
  insert,
  update,
  delete: deleteRecord,
  findOne,
  findMany,
  count,
  aggregate,
  batchInsert
} = vppDatabase;

// 进程退出时清理资源
process.on('SIGINT', async () => {
  logger.info('接收到SIGINT信号，正在关闭VPP数据库连接...');
  await vppDatabase.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('接收到SIGTERM信号，正在关闭VPP数据库连接...');
  await vppDatabase.close();
  process.exit(0);
});