import fs, { createWriteStream } from 'fs';
import path from 'path';
import EventEmitter from 'events';
import { MATH_CONSTANTS } from '../constants/MathConstants.js';
/* eslint-disable no-console, no-magic-numbers */

/**
 * 日志聚合器
 * 提供日志收集、分析、存储和查询功能
 */
class LogAggregator extends EventEmitter {
  // TODO: 考虑将此函数拆分为更小的函数 (当前 30 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 30 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 30 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 30 行)

  constructor(options = {}) {
    super();

    // 在测试环境中禁用文件操作
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.DISABLE_LOG_FILES === 'true';
    
    this.options = {
      logDir: isTestEnv ? null : (options.logDir || './logs'),
      maxFileSize: options.maxFileSize || 100 * 1024 * 1024, // 100MB
      maxFiles: options.maxFiles || 10,
      rotateInterval: options.rotateInterval || 24 * 60 * 60 * 1000, // 24小时
      enableAnalysis: isTestEnv ? false : (options.enableAnalysis !== false),
      enableAlerts: options.enableAlerts !== false,
      ...options
    };

    this.logStreams = new Map();
    this.logStats = {
      totalLogs: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      debugCount: 0,
      lastLogTime: null,
      startTime: new Date()
    };

    this.alertRules = new Map();
    this.logBuffer = [];
    this.bufferSize = options.bufferSize || 1000;

    this.init();
  }

  /**
   * 初始化日志聚合器
   */
  init() {
    // 确保日志目录存在
    this.ensureLogDir();

    // 设置日志轮转
    this.setupLogRotation();

    // 设置默认告警规则
    this.setupDefaultAlertRules();

    // 启动分析任务
    if (this.options.enableAnalysis) {
      this.startAnalysisTask();
    }

    console.log('📊 日志聚合器已启动');
  }

  /**
   * 确保日志目录存在
   */
  ensureLogDir() {
    if (this.options.logDir && !fs.existsSync(this.options.logDir)) {
      fs.mkdirSync(this.options.logDir, { recursive: true });
    }
  }

  /**
   * 记录日志
   */
  log(level, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      metadata,
      requestId: metadata.requestId,
      userId: metadata.userId,
      ip: metadata.ip,
      userAgent: metadata.userAgent,
      duration: metadata.duration,
      statusCode: metadata.statusCode,
      error: metadata.error
    };

    // 更新统计信息
    this.updateStats(logEntry);

    // 添加到缓冲区
    this.logBuffer.push(logEntry);

    // 写入日志文件
    this.writeToFile(logEntry);

    // 检查告警规则
    if (this.options.enableAlerts) {
      this.checkAlertRules(logEntry);
    }

    // 触发事件
    this.emit('log', logEntry);

    // 如果缓冲区满了，清理旧日志
    if (this.logBuffer.length > this.bufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.bufferSize);
    }
  }

  /**
   * 更新统计信息
   */
  updateStats(logEntry) {
    this.logStats.totalLogs++;
    this.logStats.lastLogTime = logEntry.timestamp;

    switch (logEntry.level) {
      case 'ERROR':
        this.logStats.errorCount++;
        break;
      case 'WARN':
        this.logStats.warningCount++;
        break;
      case 'INFO':
        this.logStats.infoCount++;
        break;
      case 'DEBUG':
        this.logStats.debugCount++;
        break;
    }
  }

  /**
   * 写入日志文件
   */
  writeToFile(logEntry) {
    // 如果没有配置logDir，跳过文件写入
    if (!this.options.logDir) {
      return;
    }
    
    const fileName = this.getLogFileName(logEntry.level);
    const filePath = path.join(this.options.logDir, fileName);

    if (!this.logStreams.has(fileName)) {
      this.logStreams.set(fileName, createWriteStream(filePath, { flags: 'a' }));
    }

    const stream = this.logStreams.get(fileName);
    const logLine = `${JSON.stringify(logEntry)}\n`;

    stream.write(logLine);
  }

  /**
   * 获取日志文件名
   */
  getLogFileName(level) {
    const [date] = new Date().toISOString().split('T');
    return `${level.toLowerCase()}-${date}.log`;
  }

  /**
   * 设置日志轮转
   */
  setupLogRotation() {
    this.rotationTimer = setInterval(() => {
      this.rotateLogFiles();
    }, this.options.rotateInterval);
  }

  /**
   * 轮转日志文件
   */
  rotateLogFiles() {
    // 如果没有配置logDir，跳过日志轮转
    if (!this.options.logDir) {
      return;
    }
    
    console.log('🔄 开始日志轮转...');

    // 关闭当前流
    for (const [_fileName, stream] of this.logStreams) {
      stream.end();
    }
    this.logStreams.clear();

    // 压缩旧日志文件
    this.compressOldLogs();

    // 清理过期日志
    this.cleanupOldLogs();

    console.log('✅ 日志轮转完成');
  }

  /**
   * 压缩旧日志文件
   */
  compressOldLogs() {
    // 这里可以添加日志压缩逻辑
    // 例如使用 gzip 压缩
  }

  /**
   * 清理过期日志
   */
  cleanupOldLogs() {
    // 如果没有配置logDir，跳过清理
    if (!this.options.logDir) {
      return;
    }
    
    const files = fs.readdirSync(this.options.logDir);
    const logFiles = files.filter((file) => file.endsWith('.log'));

    if (logFiles.length > this.options.maxFiles) {
      // 按修改时间排序
      const sortedFiles = logFiles
        .map((file) => ({
          name: file,
          path: path.join(this.options.logDir, file),
          mtime: fs.statSync(path.join(this.options.logDir, file)).mtime
        }))
        .sort((a, b) => a.mtime - b.mtime);

      // 删除最旧的文件
      const filesToDelete = sortedFiles.slice(0, sortedFiles.length - this.options.maxFiles);

      const deletedFiles = [];
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        deletedFiles.push(file.name);
      }

      if (deletedFiles.length > 0) {
        console.log(`🗑️  删除过期日志文件: ${deletedFiles.join(', ')}`);
      }
    }
  }

  /**
   * 设置默认告警规则
   */
  setupDefaultAlertRules() {
    // 错误率告警
    this.addAlertRule('high_error_rate', {
      condition: (stats) => {
        const errorRate = stats.errorCount / stats.totalLogs;
        return errorRate > MATH_CONSTANTS.ERROR_RATE_THRESHOLD; // 错误率超过5%
      },
      message: '错误率过高',
      cooldown: MATH_CONSTANTS.ERROR_RATE_COOLDOWN_MS // 5分钟冷却期
    });

    // 响应时间告警
    this.addAlertRule('slow_response', {
      condition: (logEntry) => logEntry.metadata.duration && logEntry.metadata.duration > MATH_CONSTANTS.SLOW_RESPONSE_THRESHOLD_MS, // 响应时间超过5秒
      message: '响应时间过长',
      cooldown: MATH_CONSTANTS.SLOW_RESPONSE_COOLDOWN_MS // 1分钟冷却期
    });

    // 频繁错误告警
    this.addAlertRule('frequent_errors', {
      condition: () => {
        const recentErrors = this.logBuffer
          .filter((log) => log.level === 'ERROR')
          .filter((log) => new Date() - new Date(log.timestamp) < MATH_CONSTANTS.ERROR_THRESHOLD_TIME_MS); // 5分钟内
        return recentErrors.length > MATH_CONSTANTS.ERROR_THRESHOLD_COUNT; // 5分钟内超过10个错误
      },
      message: '频繁出现错误',
      cooldown: MATH_CONSTANTS.ALERT_COOLDOWN_MS // 10分钟冷却期
    });
  }

  /**
   * 添加告警规则
   */
  addAlertRule(name, rule) {
    this.alertRules.set(name, {
      ...rule,
      lastTriggered: 0
    });
  }

  /**
   * 检查告警规则
   */
  checkAlertRules(logEntry) {
    const now = Date.now();

    for (const [name, rule] of this.alertRules) {
      // 检查冷却期
      if (now - rule.lastTriggered < rule.cooldown) {
        continue;
      }

      // 检查条件
      let shouldAlert = false;

      if (typeof rule.condition === 'function') {
        try {
          shouldAlert = rule.condition(logEntry, this.logStats, this.logBuffer);
        } catch (error) {
          console.error(`告警规则 ${name} 执行失败:`, error);
        }
      }

      if (shouldAlert) {
        this.triggerAlert(name, rule, logEntry);
        rule.lastTriggered = now;
      }
    }
  }

  // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

  /**
   * 触发告警
   */
  triggerAlert(ruleName, rule, logEntry) {
    const alert = {
      ruleName,
      message: rule.message,
      timestamp: new Date().toISOString(),
      logEntry,
      stats: { ...this.logStats }
    };

    console.warn(`🚨 告警触发: ${alert.message}`);

    // 触发告警事件
    this.emit('alert', alert);

    // 记录告警日志
    this.log('warn', `告警触发: ${alert.message}`, {
      alert: true,
      ruleName,
      originalLog: logEntry
    });
  }

  /**
   * 启动分析任务
   */
  startAnalysisTask() {
    if (!this.options.enableAnalysis || !this.options.logDir) {
      return;
    }

    // 每分钟执行一次分析
    this.analysisTimer = setInterval(() => {
      this.performAnalysis();
    }, MATH_CONSTANTS.MINUTES_TO_MS);

    console.log('📈 分析任务已启动');
  }

  /**
   * 执行日志分析
   */
  performAnalysis() {
    const analysis = {
      timestamp: new Date().toISOString(),
      stats: { ...this.logStats },
      trends: this.analyzeTrends(),
      topErrors: this.getTopErrors(),
      slowEndpoints: this.getSlowEndpoints(),
      userActivity: this.analyzeUserActivity()
    };

    // 触发分析事件
    this.emit('analysis', analysis);

    // 保存分析结果
    this.saveAnalysis(analysis);
  }

  /**
   * 分析趋势
   */
  analyzeTrends() {
    const now = new Date();
    const oneHourAgo = new Date(now - MATH_CONSTANTS.HOURS_TO_MS);

    const recentLogs = this.logBuffer.filter((log) => new Date(log.timestamp) > oneHourAgo);

    const hourlyStats = {
      total: recentLogs.length,
      errors: recentLogs.filter((log) => log.level === 'ERROR').length,
      warnings: recentLogs.filter((log) => log.level === 'WARN').length,
      avgResponseTime: this.calculateAverageResponseTime(recentLogs)
    };

    return {
      hourly: hourlyStats,
      errorRate: hourlyStats.errors / hourlyStats.total || 0,
      trend: this.calculateTrend(recentLogs)
    };
  }

  /**
   * 获取最常见错误
   */
  getTopErrors() {
    const errorLogs = this.logBuffer.filter((log) => log.level === 'ERROR');
    const errorCounts = new Map();

    for (const log of errorLogs) {
      const errorKey = log.message || log.metadata.error?.message || 'Unknown Error';
      errorCounts.set(errorKey, (errorCounts.get(errorKey) || 0) + 1);
    }

    return Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, MATH_CONSTANTS.TOP_ITEMS_LIMIT)
      .map(([error, count]) => ({ error, count }));
  }

  /**
   * 获取慢端点
   */
  getSlowEndpoints() {
    const logsWithDuration = this.logBuffer.filter(
      (log) => log.metadata.duration && log.metadata.url
    );

    const endpointStats = new Map();

    for (const log of logsWithDuration) {
      const endpoint = `${log.metadata.method} ${log.metadata.url}`;

      if (!endpointStats.has(endpoint)) {
        endpointStats.set(endpoint, {
          count: 0,
          totalDuration: 0,
          maxDuration: 0
        });
      }

      const stats = endpointStats.get(endpoint);
      stats.count++;
      stats.totalDuration += log.metadata.duration;
      stats.maxDuration = Math.max(stats.maxDuration, log.metadata.duration);
    }

    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgDuration: stats.totalDuration / stats.count,
        maxDuration: stats.maxDuration,
        count: stats.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, MATH_CONSTANTS.TOP_ITEMS_LIMIT);
  }

  /**
   * 分析用户活动
   */
  analyzeUserActivity() {
    const userLogs = this.logBuffer.filter((log) => log.userId);
    const userStats = new Map();

    for (const log of userLogs) {
      if (!userStats.has(log.userId)) {
        userStats.set(log.userId, {
          requests: 0,
          errors: 0,
          lastActivity: log.timestamp
        });
      }

      const stats = userStats.get(log.userId);
      stats.requests++;

      if (log.level === 'ERROR') {
        stats.errors++;
      }

      if (new Date(log.timestamp) > new Date(stats.lastActivity)) {
        stats.lastActivity = log.timestamp;
      }
    }

    return {
      activeUsers: userStats.size,
      topUsers: Array.from(userStats.entries())
        .sort((a, b) => b[1].requests - a[1].requests)
        .slice(0, MATH_CONSTANTS.TOP_ITEMS_LIMIT)
        .map(([userId, stats]) => ({ userId, ...stats }))
    };
  }

  /**
   * 计算平均响应时间
   */
  calculateAverageResponseTime(logs) {
    const logsWithDuration = logs.filter((log) => log.metadata.duration);

    if (logsWithDuration.length === 0) {
      return 0;
    }

    const totalDuration = logsWithDuration.reduce((sum, log) => sum + log.metadata.duration, 0);

    return totalDuration / logsWithDuration.length;
  }

  /**
   * 计算趋势
   */
  calculateTrend(logs) {
    if (logs.length < 2) {
      return 'stable';
    }

    const midpoint = Math.floor(logs.length / 2);
    const firstHalf = logs.slice(0, midpoint);
    const secondHalf = logs.slice(midpoint);

    const firstHalfErrors = firstHalf.filter((log) => log.level === 'ERROR').length;
    const secondHalfErrors = secondHalf.filter((log) => log.level === 'ERROR').length;

    const firstHalfRate = firstHalfErrors / firstHalf.length;
    const secondHalfRate = secondHalfErrors / secondHalf.length;

    if (secondHalfRate > firstHalfRate * MATH_CONSTANTS.TREND_INCREASE_THRESHOLD) {
      return 'increasing';
    } else if (secondHalfRate < firstHalfRate * MATH_CONSTANTS.TREND_DECREASE_THRESHOLD) {
      return 'decreasing';
    }
    return 'stable';
  }

  /**
   * 保存分析结果
   */
  async saveAnalysis(analysis) {
    // 确保logDir存在
    if (!this.options.logDir) {
      console.warn('LogAggregator: logDir未配置，跳过保存分析结果');
      return;
    }
    
    const fileName = `analysis-${new Date().toISOString().split('T')[0]}.json`;
    const filePath = path.join(this.options.logDir, fileName);

    let existingData = [];

    try {
      await fs.promises.access(filePath);
      try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        existingData = JSON.parse(content);
      } catch (error) {
        console.error('读取分析文件失败:', error);
      }
    } catch {
      // 文件不存在，使用空数组
    }

    existingData.push(analysis);

    try {
      await fs.promises.writeFile(filePath, JSON.stringify(existingData, null, 2));
    } catch (error) {
      console.error('保存分析结果失败:', error);
    }
  }

  /**
   * 查询日志
   */
  async queryLogs(options = {}) {
    const { level, startTime, endTime, userId, requestId, limit = MATH_CONSTANTS.DEFAULT_QUERY_LIMIT, offset = 0 } = options;

    let results = [...this.logBuffer];

    // 应用过滤条件
    if (level) {
      results = results.filter((log) => log.level === level.toUpperCase());
    }

    if (startTime) {
      results = results.filter((log) => new Date(log.timestamp) >= new Date(startTime));
    }

    if (endTime) {
      results = results.filter((log) => new Date(log.timestamp) <= new Date(endTime));
    }

    if (userId) {
      results = results.filter((log) => log.userId === userId);
    }

    if (requestId) {
      results = results.filter((log) => log.requestId === requestId);
    }

    // 排序（最新的在前）
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 分页
    const total = results.length;
    results = results.slice(offset, offset + limit);

    return {
      logs: results,
      total,
      offset,
      limit,
      hasMore: offset + limit < total
    };
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.logStats,
      uptime: Date.now() - this.logStats.startTime.getTime(),
      bufferSize: this.logBuffer.length,
      activeStreams: this.logStreams.size
    };
  }

  /**
   * 创建日志中间件
   */
  createMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      // 记录请求开始
      this.log('info', `${req.method} ${req.url}`, {
        requestId: req.requestId,
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        url: req.url,
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined
      });

      // 监听响应结束
      res.on('finish', () => {
        const duration = Date.now() - startTime;

        this.log('info', `${req.method} ${req.url} - ${res.statusCode}`, {
          requestId: req.requestId,
          userId: req.user?.id,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          responseSize: res.get('Content-Length')
        });
      });

      next();
    };
  }

  /**
   * 关闭日志聚合器
   */
  close() {
    console.log('🔄 关闭日志聚合器...');

    // 清理定时器
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = null;
    }

    // 关闭所有流
    for (const [_fileName, stream] of this.logStreams) {
      stream.end();
    }

    this.logStreams.clear();

    console.log('✅ 日志聚合器已关闭');
  }
}

// 创建默认实例
const defaultLogAggregator = new LogAggregator();

// 便捷方法
export const logInfo = (message, metadata) => defaultLogAggregator.log('info', message, metadata);
export const logWarn = (message, metadata) => defaultLogAggregator.log('warn', message, metadata);
export const logError = (message, metadata) => defaultLogAggregator.log('error', message, metadata);
export const logDebug = (message, metadata) => defaultLogAggregator.log('debug', message, metadata);

export { LogAggregator };
export default defaultLogAggregator;
