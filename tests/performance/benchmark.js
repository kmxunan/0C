import http from 'http';
import https from 'https';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 性能基准测试套件
 * 用于测试API端点的性能指标
 */
class PerformanceBenchmark {
  constructor(options = {}) {
    this.options = {
      baseUrl: options.baseUrl || 'http://localhost:3000',
      concurrency: options.concurrency || 10,
      duration: options.duration || 30000, // 30秒
      warmupTime: options.warmupTime || 5000, // 5秒预热
      timeout: options.timeout || 10000, // 10秒超时
      outputDir: options.outputDir || path.join(__dirname, '../../reports/performance'),
      ...options
    };
    
    this.results = [];
    this.isRunning = false;
    this.startTime = null;
    this.endTime = null;
    
    this.ensureOutputDir();
  }

  /**
   * 确保输出目录存在
   */
  ensureOutputDir() {
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }

  /**
   * 运行完整的基准测试
   */
  async runBenchmark() {
    console.log('🚀 开始性能基准测试...');
    console.log(`📊 配置: 并发=${this.options.concurrency}, 持续时间=${this.options.duration}ms`);
    
    try {
      // 预热
      await this.warmup();
      
      // 定义测试场景
      const scenarios = this.getTestScenarios();
      
      // 运行每个场景
      for (const scenario of scenarios) {
        console.log(`\n🎯 测试场景: ${scenario.name}`);
        await this.runScenario(scenario);
      }
      
      // 生成报告
      await this.generateReport();
      
      console.log('\n✅ 性能基准测试完成!');
      
    } catch (error) {
      console.error('❌ 基准测试失败:', error);
      throw error;
    }
  }

  /**
   * 预热系统
   */
  async warmup() {
    console.log('🔥 系统预热中...');
    
    const warmupRequests = [];
    const warmupEndTime = Date.now() + this.options.warmupTime;
    
    while (Date.now() < warmupEndTime) {
      warmupRequests.push(this.makeRequest({
        method: 'GET',
        path: '/health'
      }));
      
      if (warmupRequests.length >= this.options.concurrency) {
        await Promise.allSettled(warmupRequests);
        warmupRequests.length = 0;
      }
      
      await this.sleep(100);
    }
    
    // 等待剩余请求完成
    if (warmupRequests.length > 0) {
      await Promise.allSettled(warmupRequests);
    }
    
    console.log('✅ 预热完成');
  }

  /**
   * 获取测试场景
   */
  getTestScenarios() {
    return [
      {
        name: '健康检查端点',
        method: 'GET',
        path: '/health',
        expectedStatus: 200,
        maxResponseTime: 100
      },
      {
        name: '用户认证',
        method: 'POST',
        path: '/api/auth/login',
        body: {
          username: 'testuser',
          password: 'testpass'
        },
        expectedStatus: [200, 401],
        maxResponseTime: 500
      },
      {
        name: '设备列表查询',
        method: 'GET',
        path: '/api/devices',
        headers: {
          'Authorization': 'Bearer test-token'
        },
        expectedStatus: [200, 401],
        maxResponseTime: 300
      },
      {
        name: '能源数据查询',
        method: 'GET',
        path: '/api/energy-data?limit=50',
        headers: {
          'Authorization': 'Bearer test-token'
        },
        expectedStatus: [200, 401],
        maxResponseTime: 500
      },
      {
        name: '碳排放计算',
        method: 'POST',
        path: '/api/carbon/calculate',
        headers: {
          'Authorization': 'Bearer test-token'
        },
        body: {
          deviceId: 'test-device',
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date().toISOString()
        },
        expectedStatus: [200, 400, 401],
        maxResponseTime: 1000
      },
      {
        name: '实时数据推送',
        method: 'POST',
        path: '/api/energy-data',
        headers: {
          'Authorization': 'Bearer test-token'
        },
        body: {
          deviceId: 'test-device',
          timestamp: new Date().toISOString(),
          power: Math.random() * 100,
          energy: Math.random() * 1000
        },
        expectedStatus: [200, 201, 400, 401],
        maxResponseTime: 200
      }
    ];
  }

  /**
   * 运行单个测试场景
   */
  async runScenario(scenario) {
    const scenarioResults = {
      name: scenario.name,
      startTime: new Date().toISOString(),
      endTime: null,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      statusCodes: {},
      errors: [],
      throughput: 0,
      avgResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0
    };
    
    this.isRunning = true;
    this.startTime = performance.now();
    const endTime = this.startTime + this.options.duration;
    
    const workers = [];
    
    // 启动并发工作线程
    for (let i = 0; i < this.options.concurrency; i++) {
      workers.push(this.runWorker(scenario, scenarioResults, endTime));
    }
    
    // 等待所有工作线程完成
    await Promise.allSettled(workers);
    
    this.isRunning = false;
    this.endTime = performance.now();
    
    // 计算统计信息
    this.calculateStatistics(scenarioResults);
    
    // 验证性能指标
    this.validatePerformance(scenario, scenarioResults);
    
    this.results.push(scenarioResults);
    
    // 打印结果
    this.printScenarioResults(scenarioResults);
  }

  /**
   * 运行工作线程
   */
  async runWorker(scenario, results, endTime) {
    while (performance.now() < endTime && this.isRunning) {
      try {
        const startTime = performance.now();
        const response = await this.makeRequest(scenario);
        const responseTime = performance.now() - startTime;
        
        results.totalRequests++;
        results.responseTimes.push(responseTime);
        
        // 记录状态码
        const statusCode = response.statusCode;
        results.statusCodes[statusCode] = (results.statusCodes[statusCode] || 0) + 1;
        
        // 判断请求是否成功
        const expectedStatus = Array.isArray(scenario.expectedStatus) 
          ? scenario.expectedStatus 
          : [scenario.expectedStatus];
        
        if (expectedStatus.includes(statusCode)) {
          results.successfulRequests++;
        } else {
          results.failedRequests++;
          results.errors.push({
            timestamp: new Date().toISOString(),
            statusCode,
            responseTime,
            error: `Unexpected status code: ${statusCode}`
          });
        }
        
        // 更新响应时间统计
        results.minResponseTime = Math.min(results.minResponseTime, responseTime);
        results.maxResponseTime = Math.max(results.maxResponseTime, responseTime);
        
      } catch (error) {
        results.totalRequests++;
        results.failedRequests++;
        results.errors.push({
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack
        });
      }
      
      // 短暂延迟以避免过度负载
      await this.sleep(10);
    }
  }

  /**
   * 发起HTTP请求
   */
  makeRequest(options) {
    return new Promise((resolve, reject) => {
      const url = new URL(options.path, this.options.baseUrl);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PerformanceBenchmark/1.0',
          ...options.headers
        },
        timeout: this.options.timeout
      };
      
      const req = httpModule.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      // 发送请求体
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      
      req.end();
    });
  }

  /**
   * 计算统计信息
   */
  calculateStatistics(results) {
    results.endTime = new Date().toISOString();
    
    if (results.responseTimes.length === 0) {
      return;
    }
    
    // 排序响应时间
    const sortedTimes = results.responseTimes.sort((a, b) => a - b);
    
    // 计算平均响应时间
    results.avgResponseTime = sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length;
    
    // 计算百分位数
    results.p50ResponseTime = this.getPercentile(sortedTimes, 50);
    results.p95ResponseTime = this.getPercentile(sortedTimes, 95);
    results.p99ResponseTime = this.getPercentile(sortedTimes, 99);
    
    // 计算吞吐量 (请求/秒)
    const durationSeconds = this.options.duration / 1000;
    results.throughput = results.totalRequests / durationSeconds;
    
    // 计算错误率
    results.errorRate = results.failedRequests / results.totalRequests;
    
    // 修复无限值
    if (results.minResponseTime === Infinity) {
      results.minResponseTime = 0;
    }
  }

  /**
   * 获取百分位数
   */
  getPercentile(sortedArray, percentile) {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * 验证性能指标
   */
  validatePerformance(scenario, results) {
    const issues = [];
    
    // 检查响应时间
    if (scenario.maxResponseTime && results.avgResponseTime > scenario.maxResponseTime) {
      issues.push(`平均响应时间 ${results.avgResponseTime.toFixed(2)}ms 超过预期 ${scenario.maxResponseTime}ms`);
    }
    
    // 检查错误率
    if (results.errorRate > 0.05) { // 错误率超过5%
      issues.push(`错误率 ${(results.errorRate * 100).toFixed(2)}% 过高`);
    }
    
    // 检查吞吐量
    const minThroughput = 10; // 最小10 RPS
    if (results.throughput < minThroughput) {
      issues.push(`吞吐量 ${results.throughput.toFixed(2)} RPS 过低`);
    }
    
    results.performanceIssues = issues;
    
    if (issues.length > 0) {
      console.warn(`⚠️  性能问题:`);
      issues.forEach(issue => console.warn(`   - ${issue}`));
    }
  }

  /**
   * 打印场景结果
   */
  printScenarioResults(results) {
    console.log(`📈 结果统计:`);
    console.log(`   总请求数: ${results.totalRequests}`);
    console.log(`   成功请求: ${results.successfulRequests}`);
    console.log(`   失败请求: ${results.failedRequests}`);
    console.log(`   错误率: ${(results.errorRate * 100).toFixed(2)}%`);
    console.log(`   吞吐量: ${results.throughput.toFixed(2)} RPS`);
    console.log(`   平均响应时间: ${results.avgResponseTime.toFixed(2)}ms`);
    console.log(`   最小响应时间: ${results.minResponseTime.toFixed(2)}ms`);
    console.log(`   最大响应时间: ${results.maxResponseTime.toFixed(2)}ms`);
    console.log(`   P50响应时间: ${results.p50ResponseTime.toFixed(2)}ms`);
    console.log(`   P95响应时间: ${results.p95ResponseTime.toFixed(2)}ms`);
    console.log(`   P99响应时间: ${results.p99ResponseTime.toFixed(2)}ms`);
    
    // 显示状态码分布
    console.log(`   状态码分布:`);
    Object.entries(results.statusCodes).forEach(([code, count]) => {
      console.log(`     ${code}: ${count}`);
    });
  }

  /**
   * 生成性能报告
   */
  async generateReport() {
    console.log('\n📊 生成性能报告...');
    
    const report = {
      timestamp: new Date().toISOString(),
      configuration: this.options,
      summary: this.generateSummary(),
      scenarios: this.results,
      recommendations: this.generateRecommendations()
    };
    
    // 保存JSON报告
    const jsonPath = path.join(this.options.outputDir, `benchmark-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    
    // 生成HTML报告
    const htmlPath = path.join(this.options.outputDir, `benchmark-${Date.now()}.html`);
    const htmlContent = this.generateHtmlReport(report);
    fs.writeFileSync(htmlPath, htmlContent);
    
    // 生成CSV报告
    const csvPath = path.join(this.options.outputDir, `benchmark-${Date.now()}.csv`);
    const csvContent = this.generateCsvReport(report);
    fs.writeFileSync(csvPath, csvContent);
    
    console.log(`✅ 报告已生成:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}`);
    console.log(`   CSV: ${csvPath}`);
    
    return report;
  }

  /**
   * 生成摘要
   */
  generateSummary() {
    const totalRequests = this.results.reduce((sum, r) => sum + r.totalRequests, 0);
    const totalSuccessful = this.results.reduce((sum, r) => sum + r.successfulRequests, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failedRequests, 0);
    const avgThroughput = this.results.reduce((sum, r) => sum + r.throughput, 0) / this.results.length;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.avgResponseTime, 0) / this.results.length;
    
    return {
      totalScenarios: this.results.length,
      totalRequests,
      totalSuccessful,
      totalFailed,
      overallErrorRate: totalFailed / totalRequests,
      avgThroughput,
      avgResponseTime,
      testDuration: this.options.duration,
      concurrency: this.options.concurrency
    };
  }

  /**
   * 生成建议
   */
  generateRecommendations() {
    const recommendations = [];
    
    // 分析结果并生成建议
    for (const result of this.results) {
      if (result.errorRate > 0.05) {
        recommendations.push({
          type: 'error_rate',
          scenario: result.name,
          message: `${result.name} 错误率过高 (${(result.errorRate * 100).toFixed(2)}%)，建议检查服务稳定性`
        });
      }
      
      if (result.avgResponseTime > 1000) {
        recommendations.push({
          type: 'response_time',
          scenario: result.name,
          message: `${result.name} 响应时间过长 (${result.avgResponseTime.toFixed(2)}ms)，建议优化性能`
        });
      }
      
      if (result.throughput < 10) {
        recommendations.push({
          type: 'throughput',
          scenario: result.name,
          message: `${result.name} 吞吐量过低 (${result.throughput.toFixed(2)} RPS)，建议增加服务器资源`
        });
      }
    }
    
    return recommendations;
  }

  /**
   * 生成HTML报告
   */
  generateHtmlReport(report) {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>性能基准测试报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2196F3; }
        .metric-label { color: #666; margin-top: 5px; }
        .scenario { margin: 20px 0; border: 1px solid #ddd; border-radius: 5px; }
        .scenario-header { background: #f9f9f9; padding: 15px; font-weight: bold; }
        .scenario-content { padding: 15px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
        .stat { text-align: center; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .recommendation { margin: 10px 0; padding: 10px; background: white; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>性能基准测试报告</h1>
        <p>生成时间: ${report.timestamp}</p>
        <p>测试配置: 并发=${report.configuration.concurrency}, 持续时间=${report.configuration.duration}ms</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <div class="metric-value">${report.summary.totalRequests}</div>
            <div class="metric-label">总请求数</div>
        </div>
        <div class="metric">
            <div class="metric-value">${(report.summary.overallErrorRate * 100).toFixed(2)}%</div>
            <div class="metric-label">错误率</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.avgThroughput.toFixed(2)}</div>
            <div class="metric-label">平均吞吐量 (RPS)</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.avgResponseTime.toFixed(2)}ms</div>
            <div class="metric-label">平均响应时间</div>
        </div>
    </div>
    
    ${report.scenarios.map(scenario => `
    <div class="scenario">
        <div class="scenario-header">${scenario.name}</div>
        <div class="scenario-content">
            <div class="stats-grid">
                <div class="stat">
                    <strong>${scenario.totalRequests}</strong><br>
                    <small>总请求数</small>
                </div>
                <div class="stat">
                    <strong>${(scenario.errorRate * 100).toFixed(2)}%</strong><br>
                    <small>错误率</small>
                </div>
                <div class="stat">
                    <strong>${scenario.throughput.toFixed(2)}</strong><br>
                    <small>吞吐量 (RPS)</small>
                </div>
                <div class="stat">
                    <strong>${scenario.avgResponseTime.toFixed(2)}ms</strong><br>
                    <small>平均响应时间</small>
                </div>
                <div class="stat">
                    <strong>${scenario.p95ResponseTime.toFixed(2)}ms</strong><br>
                    <small>P95响应时间</small>
                </div>
                <div class="stat">
                    <strong>${scenario.p99ResponseTime.toFixed(2)}ms</strong><br>
                    <small>P99响应时间</small>
                </div>
            </div>
        </div>
    </div>
    `).join('')}
    
    ${report.recommendations.length > 0 ? `
    <div class="recommendations">
        <h3>优化建议</h3>
        ${report.recommendations.map(rec => `
        <div class="recommendation">
            <strong>${rec.type.toUpperCase()}:</strong> ${rec.message}
        </div>
        `).join('')}
    </div>
    ` : ''}
</body>
</html>
    `;
  }

  /**
   * 生成CSV报告
   */
  generateCsvReport(report) {
    const headers = [
      'Scenario',
      'Total Requests',
      'Successful Requests',
      'Failed Requests',
      'Error Rate (%)',
      'Throughput (RPS)',
      'Avg Response Time (ms)',
      'Min Response Time (ms)',
      'Max Response Time (ms)',
      'P50 Response Time (ms)',
      'P95 Response Time (ms)',
      'P99 Response Time (ms)'
    ];
    
    const rows = report.scenarios.map(scenario => [
      scenario.name,
      scenario.totalRequests,
      scenario.successfulRequests,
      scenario.failedRequests,
      (scenario.errorRate * 100).toFixed(2),
      scenario.throughput.toFixed(2),
      scenario.avgResponseTime.toFixed(2),
      scenario.minResponseTime.toFixed(2),
      scenario.maxResponseTime.toFixed(2),
      scenario.p50ResponseTime.toFixed(2),
      scenario.p95ResponseTime.toFixed(2),
      scenario.p99ResponseTime.toFixed(2)
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  /**
   * 睡眠函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const benchmark = new PerformanceBenchmark({
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    concurrency: parseInt(process.env.CONCURRENCY) || 10,
    duration: parseInt(process.env.DURATION) || 30000
  });
  
  benchmark.runBenchmark().catch(error => {
    console.error('基准测试失败:', error);
    process.exit(1);
  });
}

export default PerformanceBenchmark;