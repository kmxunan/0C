import { performance } from 'node:perf_hooks';
import { Histogram } from 'prom-client';
import os from 'os'; // 引入操作系统模块
/* eslint-disable no-console, no-magic-numbers */

// 全局变量跟踪活动连接数
let activeConnections = 0;

// 创建API延迟指标直方图
export const apiLatencyHistogram = new Histogram({
  name: 'api_latency_seconds',
  help: 'API请求延迟分布',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

// 性能监控中间件
export function monitorAPILatency(req, res, next) {
  const start = performance.now();
  let connectionCounted = false;

  // 增加活动连接数
  activeConnections++;

  // 定义减少连接数的函数，确保只执行一次
  const decreaseConnection = () => {
    if (!connectionCounted) {
      activeConnections--;
      connectionCounted = true;
    }
  };

  res.on('finish', () => {
    const duration = performance.now() - start;
    console.log(
      `API: ${req.method} ${req.originalUrl} | 延迟: ${duration.toFixed(2)}ms | 状态码: ${res.statusCode}`
    );
    // 记录性能指标
    apiLatencyHistogram.observe(
      {
        method: req.method,
        route: req.route ? req.route.path : req.path,
        status_code: res.statusCode
      },
      duration / 1000
    ); // 转换为秒

    // 减少活动连接数
    decreaseConnection();
  });

  res.on('close', () => {
    // 连接关闭时也减少计数
    decreaseConnection();
  });

  next();
}

// 获取当前活动连接数
export function getActiveConnections() {
  return activeConnections;
}

// 创建性能指标路由
export function setupPerformanceRoutes(app) {
  // 获取系统性能指标
  app.get('/api/performance/metrics', (req, res) => {
    const [cpuLoad] = os.loadavg();
    const metrics = {
      apiLatency: collectAPILatencyMetrics(),
      memoryUsage: process.memoryUsage(),
      cpuLoad,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
    res.json(metrics);
  });

  return app;
}

// 收集API延迟指标
export function collectAPILatencyMetrics() {
  const metrics = {};

  try {
    // 获取直方图指标
    const histogramData = apiLatencyHistogram.get();

    // 返回基本的指标信息
    metrics.summary = {
      name: histogramData.name,
      help: histogramData.help,
      type: histogramData.type,
      values: histogramData.values || []
    };

    // 添加简单的统计信息
    metrics.totalRequests = histogramData.values ? histogramData.values.length : 0;
  } catch (error) {
    // 如果获取指标失败，返回默认值
    metrics.summary = {
      name: 'api_latency_seconds',
      help: 'API请求延迟分布',
      type: 'histogram',
      values: []
    };
    metrics.totalRequests = 0;
  }

  return metrics;
}

// 启动性能监控
export function startPerformanceMonitoring() {
  // 记录启动时间
  const startTime = Date.now();

  // 定期记录性能指标
  setInterval(() => {
    const uptime = (Date.now() - startTime) / 1000 / 60; // 运行时间（分钟）
    const memoryUsage = process.memoryUsage();
    const [cpuLoad] = os.loadavg();

    // 记录性能日志
    console.log(`\n📊 系统性能报告 - 运行时间: ${uptime.toFixed(2)} 分钟`);
    console.log(`💾 内存使用: ${Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100}MB`);
    console.log(`🧠 CPU负载: ${cpuLoad.toFixed(2)}`);
    console.log(`📦 活动连接数: ${activeConnections}`);

    // 如果需要，可以添加更多自定义性能指标
  }, 5000); // 每5分钟记录一次性能数据
}

// 设置延迟测试路由
export function delayTestRoute(app, authenticateToken) {
  // 添加需要身份验证的延迟测试端点
  app.get('/test/delay', authenticateToken(), (req, res) => {
    // 记录请求开始时间
    const startTime = performance.now();

    // 模拟处理延迟（100ms）
    setTimeout(() => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // 返回延迟信息
      res.json({
        message: '延迟测试成功',
        requestTime: startTime,
        responseTime: endTime,
        delay: duration,
        unit: 'milliseconds'
      });
    }, 100);
  });

  return app;
}

// 创建性能监控实例
export const performanceMonitor = {
  monitorAPILatency,
  setupPerformanceRoutes,
  collectAPILatencyMetrics,
  apiLatencyHistogram,
  delayTestRoute,
  startPerformanceMonitoring
};

// 将性能监控中间件导出
export default performanceMonitor;
