import { performance } from 'perf_hooks';
import logger from '../../interfaces/http/utils/logger.js';
/* eslint-disable no-magic-numbers */

/**
 * 数据库查询优化器
 */
export class QueryOptimizer {
  constructor(options = {}) {
    this.options = {
      enableQueryLogging: options.enableQueryLogging !== false,
      slowQueryThreshold: options.slowQueryThreshold || 1000, // 1秒
      enableQueryCache: options.enableQueryCache !== false,
      cacheSize: options.cacheSize || 100,
      enableExplainPlan: options.enableExplainPlan || false,
      ...options
    };

    this.queryCache = new Map();
    this.queryStats = new Map();
    this.preparedStatements = new Map();
  }

  /**
   * 执行优化的查询
   */
  async executeQuery(db, sql, params = [], options = {}) {
    const startTime = performance.now();
    const queryKey = this.generateQueryKey(sql, params);

    try {
      // 检查查询缓存
      if (this.options.enableQueryCache && options.useCache !== false) {
        const cached = this.queryCache.get(queryKey);
        if (cached && !this.isCacheExpired(cached)) {
          this.recordQueryStats(sql, performance.now() - startTime, true);
          return cached.result;
        }
      }

      // 执行查询
      let result;
      if (options.useTransaction) {
        result = await this.executeInTransaction(db, sql, params);
      } else if (options.usePreparedStatement) {
        result = await this.executePreparedStatement(db, sql, params);
      } else {
        result = await this.executeDirectQuery(db, sql, params);
      }

      const executionTime = performance.now() - startTime;

      // 记录查询统计
      this.recordQueryStats(sql, executionTime, false);

      // 缓存结果
      if (this.options.enableQueryCache && options.useCache !== false && this.isCacheable(sql)) {
        this.cacheResult(queryKey, result, options.cacheTTL);
      }

      // 记录慢查询
      if (executionTime > this.options.slowQueryThreshold) {
        this.logSlowQuery(sql, params, executionTime);
      }

      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.recordQueryStats(sql, executionTime, false, error);
      throw error;
    }
  }

  /**
   * 直接执行查询
   */
  async executeDirectQuery(db, sql, params) {
    if (params && params.length > 0) {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    }
    return new Promise((resolve, reject) => {
      db.all(sql, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 使用预处理语句执行查询
   */
  async executePreparedStatement(db, sql, params) {
    const stmtKey = this.generateStatementKey(sql);

    if (!this.preparedStatements.has(stmtKey)) {
      const stmt = db.prepare(sql);
      this.preparedStatements.set(stmtKey, stmt);
    }

    const stmt = this.preparedStatements.get(stmtKey);

    return new Promise((resolve, reject) => {
      stmt.all(params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 在事务中执行查询
   */
  async executeInTransaction(db, sql, params) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.all(sql, params, (err, rows) => {
          if (err) {
            db.run('ROLLBACK', (rollbackErr) => {
              if (rollbackErr) {
                logger.error('事务回滚失败', { error: rollbackErr.message });
              }
              reject(err);
            });
          } else {
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                reject(commitErr);
              } else {
                resolve(rows);
              }
            });
          }
        });
      });
    });
  }

  /**
   * 批量执行查询
   */
  async executeBatch(db, queries) {
    const results = [];
    const startTime = performance.now();

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        let completed = 0;
        let hasError = false;

        queries.forEach((query, index) => {
          const { sql, params = [] } = query;

          db.all(sql, params, (err, rows) => {
            if (err && !hasError) {
              hasError = true;
              db.run('ROLLBACK', () => {
                reject(err);
              });
              return;
            }

            if (!hasError) {
              results[index] = rows;
              completed++;

              if (completed === queries.length) {
                db.run('COMMIT', (commitErr) => {
                  if (commitErr) {
                    reject(commitErr);
                  } else {
                    const executionTime = performance.now() - startTime;
                    logger.info('批量查询完成', {
                      queryCount: queries.length,
                      executionTime: `${executionTime.toFixed(2)}ms`
                    });
                    resolve(results);
                  }
                });
              }
            }
          });
        });
      });
    });
  }

  /**
   * 生成查询缓存键
   */
  generateQueryKey(sql, params) {
    const normalizedSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();
    const paramsStr = JSON.stringify(params || []);
    return `${normalizedSql}:${paramsStr}`;
  }

  /**
   * 生成预处理语句键
   */
  generateStatementKey(sql) {
    return sql.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  /**
   * 判断查询是否可缓存
   */
  isCacheable(sql) {
    const normalizedSql = sql.toLowerCase().trim();
    // 只缓存SELECT查询，排除包含NOW()、RANDOM()等函数的查询
    return (
      normalizedSql.startsWith('select') &&
      !normalizedSql.includes('now()') &&
      !normalizedSql.includes('random()') &&
      !normalizedSql.includes('current_timestamp')
    );
  }

  /**
   * 缓存查询结果
   */
  cacheResult(queryKey, result, ttl = 300000) {
    // 默认5分钟
    // 如果缓存已满，删除最旧的条目
    if (this.queryCache.size >= this.options.cacheSize) {
      const firstKey = this.queryCache.keys().next().value;
      this.queryCache.delete(firstKey);
    }

    this.queryCache.set(queryKey, {
      result: JSON.parse(JSON.stringify(result)), // 深拷贝
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * 检查缓存是否过期
   */
  isCacheExpired(cached) {
    return Date.now() - cached.timestamp > cached.ttl;
  }

  /**
   * 记录查询统计
   */
  recordQueryStats(sql, executionTime, fromCache, error = null) {
    const queryType = this.getQueryType(sql);

    if (!this.queryStats.has(queryType)) {
      this.queryStats.set(queryType, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
        cacheHits: 0,
        errors: 0
      });
    }

    const stats = this.queryStats.get(queryType);
    stats.count++;

    if (fromCache) {
      stats.cacheHits++;
    } else {
      stats.totalTime += executionTime;
      stats.avgTime = stats.totalTime / (stats.count - stats.cacheHits);
      stats.minTime = Math.min(stats.minTime, executionTime);
      stats.maxTime = Math.max(stats.maxTime, executionTime);
    }

    if (error) {
      stats.errors++;
    }

    if (this.options.enableQueryLogging) {
      logger.debug('查询执行', {
        sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
        executionTime: `${executionTime.toFixed(2)}ms`,
        fromCache,
        queryType
      });
    }
  }

  /**
   * 获取查询类型
   */

  // TODO: 考虑将此函数拆分为更小的函数 (当前 23 行)

  getQueryType(sql) {
    const normalizedSql = sql.toLowerCase().trim();
    if (normalizedSql.startsWith('select')) {
      return 'SELECT';
    }
    if (normalizedSql.startsWith('insert')) {
      return 'INSERT';
    }
    if (normalizedSql.startsWith('update')) {
      return 'UPDATE';
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (normalizedSql.startsWith('delete')) {
      return 'DELETE';
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (normalizedSql.startsWith('create')) {
      return 'CREATE';
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (normalizedSql.startsWith('drop')) {
      return 'DROP';
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (normalizedSql.startsWith('alter')) {
      return 'ALTER';
    }
    return 'OTHER';
  }

  /**
   * 记录慢查询
   */
  logSlowQuery(sql, params, executionTime) {
    logger.warn('慢查询检测', {
      sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
      params: JSON.stringify(params),
      executionTime: `${executionTime.toFixed(2)}ms`,
      threshold: `${this.options.slowQueryThreshold}ms`
    });
  }

  /**
   * 获取查询统计信息
   */
  getQueryStats() {
    const stats = {};
    for (const [queryType, data] of this.queryStats.entries()) {
      stats[queryType] = { ...data };
    }
    return {
      queryStats: stats,
      cacheStats: {
        size: this.queryCache.size,
        maxSize: this.options.cacheSize,
        hitRate: this.calculateCacheHitRate()
      },
      preparedStatements: {
        count: this.preparedStatements.size
      }
    };
  }

  /**
   * 计算缓存命中率
   */
  calculateCacheHitRate() {
    let totalQueries = 0;
    let totalCacheHits = 0;

    for (const stats of this.queryStats.values()) {
      totalQueries += stats.count;
      totalCacheHits += stats.cacheHits;
    }

    return totalQueries > 0 ? ((totalCacheHits / totalQueries) * 100).toFixed(2) : 0;
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.queryCache.clear();
    logger.info('查询缓存已清理');
  }

  /**
   * 清理预处理语句
   */
  clearPreparedStatements() {
    for (const stmt of this.preparedStatements.values()) {
      try {
        stmt.finalize();
      } catch (error) {
        logger.error('清理预处理语句失败', { error: error.message });
      }
    }
    this.preparedStatements.clear();
    logger.info('预处理语句已清理');
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.queryStats.clear();
    logger.info('查询统计信息已重置');
  }

  /**
   * 关闭优化器
   */
  close() {
    this.clearCache();
    this.clearPreparedStatements();
    this.resetStats();
  }
}

/**
 * 数据库连接池管理器
 */
export class ConnectionPoolManager {
  constructor(options = {}) {
    this.options = {
      maxConnections: options.maxConnections || 10,
      minConnections: options.minConnections || 2,
      acquireTimeout: options.acquireTimeout || 30000,
      idleTimeout: options.idleTimeout || 300000,
      ...options
    };

    this.pool = [];
    this.activeConnections = new Set();
    this.waitingQueue = [];
    this.stats = {
      created: 0,
      acquired: 0,
      released: 0,
      destroyed: 0,
      timeouts: 0
    };
  }

  /**
   * 获取连接
   */
  async acquire() {
    return new Promise((resolve, reject) => {
      // 检查是否有可用连接
      const availableConnection = this.pool.find((conn) => !conn.inUse);
      if (availableConnection) {
        availableConnection.inUse = true;
        availableConnection.lastUsed = Date.now();
        this.activeConnections.add(availableConnection);
        this.stats.acquired++;
        resolve(availableConnection.connection);
        return;
      }

      // 如果可以创建新连接
      if (this.pool.length < this.options.maxConnections) {
        this.createConnection()
          .then((connection) => {
            this.stats.acquired++;
            resolve(connection);
          })
          .catch(reject);
        return;
      }

      // 加入等待队列
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex((item) => item.resolve === resolve);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
          this.stats.timeouts++;
          reject(new Error('获取数据库连接超时'));
        }
      }, this.options.acquireTimeout);

      this.waitingQueue.push({ resolve, reject, timeout });
    });
  }

  /**
   * 释放连接
   */
  release(connection) {
    const poolConnection = this.pool.find((conn) => conn.connection === connection);
    if (poolConnection) {
      poolConnection.inUse = false;
      poolConnection.lastUsed = Date.now();
      this.activeConnections.delete(poolConnection);
      this.stats.released++;

      // 处理等待队列
      if (this.waitingQueue.length > 0) {
        const { resolve, timeout } = this.waitingQueue.shift();
        clearTimeout(timeout);
        poolConnection.inUse = true;
        poolConnection.lastUsed = Date.now();
        this.activeConnections.add(poolConnection);
        this.stats.acquired++;
        resolve(connection);
      }
    }
  }

  /**
   * 创建新连接
   */
  async createConnection() {
    // 这里需要根据实际的数据库类型实现
    // 示例使用SQLite
    const sqlite3 = require('sqlite3').verbose();
    const connection = new sqlite3.Database(':memory:');

    const poolConnection = {
      connection,
      inUse: true,
      created: Date.now(),
      lastUsed: Date.now()
    };

    this.pool.push(poolConnection);
    this.activeConnections.add(poolConnection);
    this.stats.created++;

    return connection;
  }

  /**
   * 清理空闲连接
   */
  cleanupIdleConnections() {
    const now = Date.now();
    const connectionsToRemove = [];

    for (const poolConnection of this.pool) {
      if (
        !poolConnection.inUse &&
        now - poolConnection.lastUsed > this.options.idleTimeout &&
        this.pool.length > this.options.minConnections
      ) {
        connectionsToRemove.push(poolConnection);
      }
    }

    for (const poolConnection of connectionsToRemove) {
      this.destroyConnection(poolConnection);
    }
  }

  /**
   * 销毁连接
   */
  destroyConnection(poolConnection) {
    try {
      poolConnection.connection.close();
      const index = this.pool.indexOf(poolConnection);
      if (index !== -1) {
        this.pool.splice(index, 1);
      }
      this.activeConnections.delete(poolConnection);
      this.stats.destroyed++;
    } catch (error) {
      logger.error('销毁数据库连接失败', { error: error.message });
    }
  }

  /**
   * 获取连接池统计信息
   */
  getStats() {
    return {
      ...this.stats,
      totalConnections: this.pool.length,
      activeConnections: this.activeConnections.size,
      idleConnections: this.pool.length - this.activeConnections.size,
      waitingRequests: this.waitingQueue.length,
      maxConnections: this.options.maxConnections,
      minConnections: this.options.minConnections
    };
  }

  /**
   * 关闭连接池
   */
  async close() {
    // 清理等待队列
    for (const { reject, timeout } of this.waitingQueue) {
      clearTimeout(timeout);
      reject(new Error('连接池正在关闭'));
    }
    this.waitingQueue = [];

    // 关闭所有连接
    for (const poolConnection of this.pool) {
      this.destroyConnection(poolConnection);
    }

    logger.info('数据库连接池已关闭');
  }
}

// 导出默认实例
export const defaultQueryOptimizer = new QueryOptimizer();
export const defaultConnectionPool = new ConnectionPoolManager();
