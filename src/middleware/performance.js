import path from 'path';
import fs from 'fs';

/**
 * 性能监控中间件
 * 用于跟踪API响应时间、缓存命中率等性能指标
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      totalResponseTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      endpoints: new Map()
    };
    
    this.logFile = path.join(process.cwd(), 'logs', 'performance.log');
    this.reportFile = path.join(process.cwd(), 'test-results', 'performance_monitor.csv');
    
    // 确保日志目录存在
    this.ensureLogDirectory();
    
    // 定期生成性能报告
    this.startPeriodicReporting();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    const reportDir = path.dirname(this.reportFile);
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
  }

  /**
   * 创建性能监控中间件
   */
  middleware() {
    return (req, res, next) => {
      try {
        const startTime = Date.now();
        // 修复：安全地获取路径，避免未定义错误
        let endpoint = req.path;
        try {
          endpoint = `${req.method} ${req.route?.path || req.path}`;
        } catch (e) {
          // 如果获取route.path失败，使用req.path
          endpoint = `${req.method} ${req.path}`;
        }
        
        // 记录请求开始
        this.recordRequestStart(endpoint);
        
        // 监听响应结束
        res.on('finish', () => {
          try {
            const responseTime = Date.now() - startTime;
            const cacheHit = res.getHeader('X-Cache-Hit') === 'true';
            
            // 使用process.nextTick延迟记录，避免阻塞响应
            process.nextTick(() => {
              this.recordRequestEnd(endpoint, responseTime, cacheHit, res.statusCode);
            });
          } catch (error) {
            console.error('性能监控记录响应结束失败:', error);
          }
        });
      } catch (error) {
        console.error('性能监控中间件错误:', error);
      }
      
      // 无论如何都继续处理请求
      next();
    };
  }

  /**
   * 记录请求开始
   */
  recordRequestStart(endpoint) {
    this.metrics.requests++;
    
    if (!this.metrics.endpoints.has(endpoint)) {
      this.metrics.endpoints.set(endpoint, {
        requests: 0,
        totalTime: 0,
        cacheHits: 0,
        cacheMisses: 0,
        errors: 0
      });
    }
    
    this.metrics.endpoints.get(endpoint).requests++;
  }

  /**
   * 记录请求结束
   */
  recordRequestEnd(endpoint, responseTime, cacheHit, statusCode) {
    this.metrics.totalResponseTime += responseTime;
    
    const endpointMetrics = this.metrics.endpoints.get(endpoint);
    if (endpointMetrics) {
      endpointMetrics.totalTime += responseTime;
      
      if (cacheHit) {
        this.metrics.cacheHits++;
        endpointMetrics.cacheHits++;
      } else {
        this.metrics.cacheMisses++;
        endpointMetrics.cacheMisses++;
      }
      
      if (statusCode >= 400) {
        endpointMetrics.errors++;
      }
    }
    
    // 记录到日志文件
    this.logPerformanceData(endpoint, responseTime, cacheHit, statusCode);
  }

  /**
   * 记录性能数据到日志文件
   */
  logPerformanceData(endpoint, responseTime, cacheHit, statusCode) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        endpoint,
        responseTime,
        cacheHit,
        statusCode
      };
      
      const logLine = JSON.stringify(logEntry) + '\n';
      
      // 使用异步文件操作，避免阻塞请求
      // 使用setImmediate进一步延迟日志写入，确保不影响请求处理
      setImmediate(() => {
        fs.appendFile(this.logFile, logLine, (err) => {
          if (err) {
            console.error('写入性能日志失败:', err);
          }
        });
      });
    } catch (error) {
      console.error('记录性能数据失败:', error);
    }
  }

  /**
   * 获取性能统计信息
   */
  getStats() {
    const avgResponseTime = this.metrics.requests > 0 
      ? this.metrics.totalResponseTime / this.metrics.requests 
      : 0;
    
    const cacheHitRate = (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
      ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100
      : 0;
    
    const endpointStats = [];
    for (const [endpoint, metrics] of this.metrics.endpoints) {
      const avgTime = metrics.requests > 0 ? metrics.totalTime / metrics.requests : 0;
      const hitRate = (metrics.cacheHits + metrics.cacheMisses) > 0
        ? (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100
        : 0;
      
      endpointStats.push({
        endpoint,
        requests: metrics.requests,
        avgResponseTime: Math.round(avgTime),
        cacheHitRate: Math.round(hitRate * 100) / 100,
        errors: metrics.errors
      });
    }
    
    // 按请求数排序
    endpointStats.sort((a, b) => b.requests - a.requests);
    
    return {
      totalRequests: this.metrics.requests,
      avgResponseTime: Math.round(avgResponseTime),
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      totalCacheHits: this.metrics.cacheHits,
      totalCacheMisses: this.metrics.cacheMisses,
      endpoints: endpointStats
    };
  }

  /**
   * 生成性能报告
   */
  generateReport() {
    const stats = this.getStats();
    const timestamp = new Date().toISOString();
    
    // 生成CSV格式的报告
    const csvHeader = 'timestamp,endpoint,requests,avg_response_time,cache_hit_rate,errors\n';
    let csvContent = csvHeader;
    
    for (const endpoint of stats.endpoints) {
      csvContent += `${timestamp},"${endpoint.endpoint}",${endpoint.requests},${endpoint.avgResponseTime},${endpoint.cacheHitRate},${endpoint.errors}\n`;
    }
    
    // 写入CSV文件
    fs.writeFile(this.reportFile, csvContent, (err) => {
      if (err) {
        console.error('生成性能报告失败:', err);
      } else {
        console.log('性能报告已生成:', this.reportFile);
      }
    });
    
    // 生成Markdown格式的报告
    const markdownReport = this.generateMarkdownReport(stats);
    const markdownFile = path.join(process.cwd(), 'test-results', 'performance_report.md');
    
    fs.writeFile(markdownFile, markdownReport, (err) => {
      if (err) {
        console.error('生成Markdown报告失败:', err);
      } else {
        console.log('Markdown性能报告已生成:', markdownFile);
      }
    });
    
    return stats;
  }

  /**
   * 生成Markdown格式的性能报告
   */
  generateMarkdownReport(stats) {
    const timestamp = new Date().toLocaleString('zh-CN');
    
    let markdown = `# 系统性能监控报告\n\n`;
    markdown += `**生成时间:** ${timestamp}\n\n`;
    
    markdown += `## 总体性能指标\n\n`;
    markdown += `- **总请求数:** ${stats.totalRequests}\n`;
    markdown += `- **平均响应时间:** ${stats.avgResponseTime}ms\n`;
    markdown += `- **缓存命中率:** ${stats.cacheHitRate}%\n`;
    markdown += `- **缓存命中次数:** ${stats.totalCacheHits}\n`;
    markdown += `- **缓存未命中次数:** ${stats.totalCacheMisses}\n\n`;
    
    markdown += `## 接口性能详情\n\n`;
    markdown += `| 接口 | 请求数 | 平均响应时间(ms) | 缓存命中率(%) | 错误数 |\n`;
    markdown += `|------|--------|------------------|---------------|--------|\n`;
    
    for (const endpoint of stats.endpoints) {
      markdown += `| ${endpoint.endpoint} | ${endpoint.requests} | ${endpoint.avgResponseTime} | ${endpoint.cacheHitRate} | ${endpoint.errors} |\n`;
    }
    
    markdown += `\n## 性能优化建议\n\n`;
    
    if (stats.cacheHitRate < 50) {
      markdown += `- ⚠️ 缓存命中率较低(${stats.cacheHitRate}%)，建议检查缓存策略\n`;
    } else if (stats.cacheHitRate > 80) {
      markdown += `- ✅ 缓存命中率良好(${stats.cacheHitRate}%)\n`;
    }
    
    if (stats.avgResponseTime > 1000) {
      markdown += `- ⚠️ 平均响应时间较长(${stats.avgResponseTime}ms)，建议优化查询或增加缓存\n`;
    } else if (stats.avgResponseTime < 200) {
      markdown += `- ✅ 响应时间表现良好(${stats.avgResponseTime}ms)\n`;
    }
    
    // 找出响应时间最长的接口
    if (stats.endpoints && stats.endpoints.length > 0) {
      const slowestEndpoint = stats.endpoints.reduce((prev, current) => 
        (prev.avgResponseTime > current.avgResponseTime) ? prev : current
      );
      
      if (slowestEndpoint && slowestEndpoint.avgResponseTime > 500) {
        markdown += `- ⚠️ 最慢接口: ${slowestEndpoint.endpoint} (${slowestEndpoint.avgResponseTime}ms)，建议优化\n`;
      }
    }
    
    return markdown;
  }

  /**
   * 开始定期报告
   */
  startPeriodicReporting() {
    // 延迟启动报告生成，避免在应用启动时就开始生成报告
    setTimeout(() => {
      // 每5分钟生成一次报告
      setInterval(() => {
        try {
          this.generateReport();
        } catch (error) {
          console.error('生成性能报告失败:', error);
        }
      }, 5 * 60 * 1000);
      
      // 每小时输出一次统计信息到控制台
      setInterval(() => {
        try {
          const stats = this.getStats();
          console.log('\n=== 性能监控统计 ===');
          console.log(`总请求数: ${stats.totalRequests}`);
          console.log(`平均响应时间: ${stats.avgResponseTime}ms`);
          console.log(`缓存命中率: ${stats.cacheHitRate}%`);
          console.log('==================\n');
        } catch (error) {
          console.error('输出性能统计信息失败:', error);
        }
      }, 60 * 60 * 1000);
    }, 60 * 1000); // 延迟1分钟启动
  }

  /**
   * 重置统计数据
   */
  reset() {
    this.metrics = {
      requests: 0,
      totalResponseTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      endpoints: new Map()
    };
  }
}

// 创建全局性能监控实例
const performanceMonitor = new PerformanceMonitor();

export {
  performanceMonitor,
  performanceMonitor as default
};

export const performanceMiddleware = performanceMonitor.middleware.bind(performanceMonitor);