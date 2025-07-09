import os from 'os';
import process from 'process';
import { performance } from 'perf_hooks';
import logger from '../utils/logger.js';
/* eslint-disable no-magic-numbers */

/**
 * 性能监控中间件
 */
export class PerformanceMonitor {
  // TODO: 考虑将此函数拆分为更小的函数 (当前 44 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 44 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 44 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 44 行)

  constructor(options = {}) {
    this.options = {
      enableMetrics: options.enableMetrics !== false,
      enableLogging: options.enableLogging !== false,
      slowRequestThreshold: options.slowRequestThreshold || 1000, // 1秒
      memoryWarningThreshold: options.memoryWarningThreshold || 0.8, // 80%
      cpuWarningThreshold: options.cpuWarningThreshold || 0.8, // 80%
      ...options
    };

    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        slow: 0
      },
      responseTime: {
        min: Infinity,
        max: 0,
        avg: 0,
        p95: 0,
        p99: 0
      },
      memory: {
        used: 0,
        free: 0,
        total: 0,
        percentage: 0
      },
      cpu: {
        usage: 0,
        loadAverage: [0, 0, 0]
      },
      errors: new Map(),
      endpoints: new Map()
    };

    this.responseTimes = [];
    this.maxResponseTimeHistory = 1000; // 保留最近1000个响应时间

    // 暂时禁用系统监控，避免高资源使用率警告
    // this.startSystemMonitoring();
  }

  /**
   * 启动系统监控
   */
  startSystemMonitoring() {
    setInterval(() => {
      this.updateSystemMetrics();
    }, 5000); // 每5秒更新一次
  }

  // TODO: 考虑将此函数拆分为更小的函数 (当前 29 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 29 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 29 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 29 行)

  /**
   * 更新系统指标
   */
  updateSystemMetrics() {
    // 内存使用情况
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    this.metrics.memory = {
      used: usedMem,
      free: freeMem,
      total: totalMem,
      percentage: usedMem / totalMem,
      heap: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      }
    };

    // CPU负载
    this.metrics.cpu = {
      loadAverage: os.loadavg(),
      cpuCount: os.cpus().length
    };

    // 检查警告阈值
    this.checkThresholds();
  }

  /**
   * 检查性能阈值
   */
  checkThresholds() {
    // 内存警告
    if (this.metrics.memory.percentage > this.options.memoryWarningThreshold) {
      logger.warn('内存使用率过高', {
        usage: `${(this.metrics.memory.percentage * 100).toFixed(2)}%`,
        used: `${(this.metrics.memory.used / 1024 / 1024 / 1024).toFixed(2)}GB`,
        total: `${(this.metrics.memory.total / 1024 / 1024 / 1024).toFixed(2)}GB`
      });
    }

    // CPU负载警告
    const [avgLoad] = this.metrics.cpu.loadAverage;
    const cpuUsage = avgLoad / this.metrics.cpu.cpuCount;
    if (cpuUsage > this.options.cpuWarningThreshold) {
      logger.warn('CPU负载过高', {
        usage: `${(cpuUsage * 100).toFixed(2)}%`,
        loadAverage: this.metrics.cpu.loadAverage,
        cpuCount: this.metrics.cpu.cpuCount
      });
    }
  }

  /**
   * 记录请求指标
   */
  recordRequest(req, res, responseTime) {
    this.metrics.requests.total++;

    // 记录响应时间
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.maxResponseTimeHistory) {
      this.responseTimes.shift();
    }

    // 更新响应时间统计
    this.updateResponseTimeStats();

    // 记录慢请求
    if (responseTime > this.options.slowRequestThreshold) {
      this.metrics.requests.slow++;
      logger.warn('慢请求检测', {
        method: req.method,
        path: req.path,
        responseTime: `${responseTime}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }

    // 记录状态码
    if (res.statusCode >= 200 && res.statusCode < 400) {
      this.metrics.requests.success++;
    } else if (res.statusCode >= 400) {
      this.metrics.requests.error++;
    }

    // 记录端点统计
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    if (!this.metrics.endpoints.has(endpoint)) {
      this.metrics.endpoints.set(endpoint, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
        errors: 0
      });
    }

    const endpointStats = this.metrics.endpoints.get(endpoint);
    endpointStats.count++;
    endpointStats.totalTime += responseTime;
    endpointStats.avgTime = endpointStats.totalTime / endpointStats.count;
    endpointStats.minTime = Math.min(endpointStats.minTime, responseTime);
    endpointStats.maxTime = Math.max(endpointStats.maxTime, responseTime);

    if (res.statusCode >= 400) {
      endpointStats.errors++;
    }
  }

  /**
   * 更新响应时间统计
   */
  updateResponseTimeStats() {
    if (this.responseTimes.length === 0) {
      return;
    }

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const len = sorted.length;

    this.metrics.responseTime = {
      min: sorted[0],
      max: sorted[len - 1],
      avg: sorted.reduce((sum, time) => sum + time, 0) / len,
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)]
    };
  }

  /**
   * 记录错误
   */
  recordError(error, req) {
    const errorKey = `${error.name}: ${error.message}`;
    const errorCount = this.metrics.errors.get(errorKey) || 0;
    this.metrics.errors.set(errorKey, errorCount + 1);

    logger.error('请求处理错误', {
      error: error.message,
      stack: error.stack,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  /**
   * 获取性能指标
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch()
    };
  }

  /**
   * 重置指标
   */
  resetMetrics() {
    this.metrics.requests = {
      total: 0,
      success: 0,
      error: 0,
      slow: 0
    };
    this.metrics.errors.clear();
    this.metrics.endpoints.clear();
    this.responseTimes = [];
  }

  /**
   * 性能监控中间件
   */
  middleware() {
    return (req, res, next) => {
      const startTime = performance.now();

      // 记录请求开始时间
      req.startTime = startTime;

      // 监听响应结束事件
      res.on('finish', () => {
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);

        if (this.options.enableMetrics) {
          this.recordRequest(req, res, responseTime);
        }

        if (this.options.enableLogging) {
          logger.info('请求完成', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
        }
      });

      // 监听错误事件
      res.on('error', (error) => {
        if (this.options.enableMetrics) {
          this.recordError(error, req);
        }
      });

      next();
    };

    // TODO: 考虑将此函数拆分为更小的函数 (当前 33 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 36 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 39 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 42 行)
  }
}

/**
 * 健康检查中间件
 */
export const healthCheck = (monitor) => (req, res) => {
  const metrics = monitor.getMetrics();

  // 判断系统健康状态
  const isHealthy =
    metrics.memory.percentage < 0.9 && // 内存使用率小于90%
    metrics.cpu.loadAverage[0] / metrics.cpu.cpuCount < 0.9 && // CPU负载小于90%
    metrics.responseTime.avg < 2000; // 平均响应时间小于2秒

  const status = isHealthy ? 'healthy' : 'unhealthy';
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      usage: `${(metrics.memory.percentage * 100).toFixed(2)}%`,
      used: `${(metrics.memory.used / 1024 / 1024 / 1024).toFixed(2)}GB`,
      total: `${(metrics.memory.total / 1024 / 1024 / 1024).toFixed(2)}GB`
    },
    cpu: {
      loadAverage: metrics.cpu.loadAverage,
      usage: `${((metrics.cpu.loadAverage[0] / metrics.cpu.cpuCount) * 100).toFixed(2)}%`
    },
    requests: metrics.requests,
    responseTime: {
      avg: `${metrics.responseTime.avg.toFixed(2)}ms`,

      // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

      // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

      // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

      // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

      p95: `${metrics.responseTime.p95}ms`,
      p99: `${metrics.responseTime.p99}ms`
    }
  });
};

/**
 * 性能指标API中间件
 */
export const metricsEndpoint = (monitor) => (req, res) => {
  const metrics = monitor.getMetrics();

  // 转换端点统计为数组格式
  const endpoints = Array.from(metrics.endpoints.entries()).map(([path, stats]) => ({
    path,
    ...stats
  }));

  // 转换错误统计为数组格式
  const errors = Array.from(metrics.errors.entries()).map(([error, count]) => ({
    error,
    count
  }));

  res.json({
    ...metrics,
    endpoints,
    errors
  });
};

// 创建默认性能监控实例
export const defaultPerformanceMonitor = new PerformanceMonitor();

// 导出中间件函数
export const performanceMiddleware = defaultPerformanceMonitor.middleware();
export const healthCheckEndpoint = healthCheck(defaultPerformanceMonitor);
export const metricsApiEndpoint = metricsEndpoint(defaultPerformanceMonitor);
