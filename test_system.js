#!/usr/bin/env node

/**
 * 系统集成测试脚本
 * 用于验证重构后的零碳园区数字孪生能碳管理系统
 */

import fetch from 'node-fetch';
import config from './src/config/index.js';
import logger from './src/utils/logger.js';

const BASE_URL = `http://localhost:${config.app.port}`;
const API_URL = `${BASE_URL}/api`;

// 测试用例
const tests = [
  {
    name: '系统健康检查',
    method: 'GET',
    url: `${BASE_URL}/health`,
    expectedStatus: 200
  },
  {
    name: '基础路由测试',
    method: 'GET',
    url: BASE_URL,
    expectedStatus: 200
  },
  {
    name: 'API路由测试',
    method: 'GET',
    url: `${BASE_URL}/api/energy/latest`,
    expectedStatus: 404
  },
  {
    name: '性能监控指标',
    method: 'GET',
    url: `${BASE_URL}/api/performance/metrics`,
    expectedStatus: 200
  },
  {
    name: '测试数据访问',
    method: 'GET',
    url: `${BASE_URL}/api/test-data/energy`,
    expectedStatus: 200
  },
  {
    name: '404错误处理',
    method: 'GET',
    url: `${BASE_URL}/nonexistent`,
    expectedStatus: 404
  }
];

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// 执行单个测试
async function runTest(test) {
  try {
    const response = await fetch(test.url, {
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'System-Test/1.0'
      },
      timeout: 5000
    });

    const success = response.status === test.expectedStatus;
    const status = success ? 
      `${colors.green}✓ PASS${colors.reset}` : 
      `${colors.red}✗ FAIL${colors.reset}`;

    console.log(`${status} ${test.name} (${response.status})`);
    
    if (!success) {
      console.log(`  Expected: ${test.expectedStatus}, Got: ${response.status}`);
      const text = await response.text();
      console.log(`  Response: ${text.substring(0, 200)}...`);
    }

    return success;
  } catch (error) {
    console.log(`${colors.red}✗ FAIL${colors.reset} ${test.name} - ${error.message}`);
    return false;
  }
}

// 等待服务启动
async function waitForServer(maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${BASE_URL}/health`, { timeout: 2000 });
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // 服务还未启动
    }
    
    console.log(`等待服务启动... (${i + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return false;
}

// 主测试函数
async function runAllTests() {
  console.log(`${colors.blue}🧪 零碳园区数字孪生能碳管理系统 - 集成测试${colors.reset}\n`);
  
  // 等待服务启动
  console.log('检查服务状态...');
  const serverReady = await waitForServer();
  
  if (!serverReady) {
    console.log(`${colors.red}❌ 服务未启动，请先启动系统${colors.reset}`);
    console.log('运行命令: npm start');
    process.exit(1);
  }
  
  console.log(`${colors.green}✅ 服务已启动${colors.reset}\n`);
  
  // 执行测试
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const success = await runTest(test);
    if (success) {
      passed++;
    } else {
      failed++;
    }
    
    // 测试间隔
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 测试结果
  console.log('\n' + '='.repeat(50));
  console.log(`测试完成: ${colors.green}${passed} 通过${colors.reset}, ${colors.red}${failed} 失败${colors.reset}`);
  
  if (failed === 0) {
    console.log(`${colors.green}🎉 所有测试通过！系统运行正常${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ 有 ${failed} 个测试失败，请检查系统配置${colors.reset}`);
    process.exit(1);
  }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { runAllTests };