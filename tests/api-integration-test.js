/**
 * API集成测试脚本
 * 测试所有后端API接口的功能完整性
 */

import fetch from 'node-fetch';
import config from '../src/config/index.js';
import logger from '../src/utils/logger.js';

const BASE_URL = 'http://localhost:1125';
const API_URL = `${BASE_URL}/api`;

// 测试结果统计
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// API测试用例定义
const apiTests = [
  // 系统健康检查
  {
    category: '系统健康',
    tests: [
      {
        name: '系统健康检查',
        method: 'GET',
        url: `${BASE_URL}/health`,
        expectedStatus: 200
      },
      {
        name: '性能监控指标',
        method: 'GET',
        url: `${API_URL}/performance/metrics`,
        expectedStatus: 200
      }
    ]
  },
  
  // 数据采集API
  {
    category: '数据采集',
    tests: [
      {
        name: '获取最新能源数据',
        method: 'GET',
        url: `${API_URL}/energy/latest`,
        expectedStatus: [200, 404] // 可能没有数据
      },
      {
        name: '获取设备列表',
        method: 'GET',
        url: `${API_URL}/devices`,
        expectedStatus: 200
      },
      {
        name: '获取设备状态',
        method: 'GET',
        url: `${API_URL}/devices/status`,
        expectedStatus: 200
      }
    ]
  },
  
  // 能源分析API
  {
    category: '能源分析',
    tests: [
      {
        name: '能源消耗分析',
        method: 'GET',
        url: `${API_URL}/energy/analysis/consumption?scope=building&scopeId=1`,
        expectedStatus: 200
      },
      {
        name: '能源效率评估',
        method: 'GET',
        url: `${API_URL}/energy/analysis/efficiency?scope=building&scopeId=1`,
        expectedStatus: 200
      },
      {
        name: '能源趋势分析',
        method: 'GET',
        url: `${API_URL}/energy/analysis/trend?scope=building&scopeId=1&period=7d`,
        expectedStatus: 200
      },
      {
        name: '能源成本分析',
        method: 'GET',
        url: `${API_URL}/energy/analysis/cost?scope=building&scopeId=1`,
        expectedStatus: 200
      }
    ]
  },
  
  // 碳排放管理API
  {
    category: '碳排放管理',
    tests: [
      {
        name: '碳排放计算',
        method: 'GET',
        url: `${API_URL}/carbon/emissions/building/1`,
        expectedStatus: 200
      },
      {
        name: '碳排放趋势',
        method: 'GET',
        url: `${API_URL}/carbon/trend/building/1`,
        expectedStatus: 200
      },
      {
        name: '碳足迹计算',
        method: 'GET',
        url: `${API_URL}/carbon/footprint/building/1`,
        expectedStatus: 200
      },
      {
        name: '获取碳排放因子',
        method: 'GET',
        url: `${API_URL}/carbon/factors`,
        expectedStatus: 200
      },
      {
        name: '获取碳中和目标',
        method: 'GET',
        url: `${API_URL}/carbon/targets/building/1`,
        expectedStatus: [200, 404]
      }
    ]
  },
  
  // 智能运维API
  {
    category: '智能运维',
    tests: [
      {
        name: '设备健康度评估',
        method: 'GET',
        url: `${API_URL}/maintenance/health/device1`,
        expectedStatus: 200
      },
      {
        name: '故障预测',
        method: 'GET',
        url: `${API_URL}/maintenance/prediction/device1`,
        expectedStatus: 200
      },
      {
        name: '维护调度',
        method: 'GET',
        url: `${API_URL}/maintenance/schedule`,
        expectedStatus: 200
      },
      {
        name: '维护成本分析',
        method: 'GET',
        url: `${API_URL}/maintenance/cost/building/1`,
        expectedStatus: 200
      },
      {
        name: '技师管理',
        method: 'GET',
        url: `${API_URL}/maintenance/technicians`,
        expectedStatus: 200
      }
    ]
  },
  
  // 数字孪生API
  {
    category: '数字孪生',
    tests: [
      {
        name: '获取场景数据',
        method: 'GET',
        url: `${API_URL}/digital-twin/scene`,
        expectedStatus: 200
      },
      {
        name: '获取实时数据',
        method: 'GET',
        url: `${API_URL}/digital-twin/realtime`,
        expectedStatus: 200
      },
      {
        name: '获取历史数据',
        method: 'GET',
        url: `${API_URL}/digital-twin/history?start=2024-01-01&end=2024-01-02`,
        expectedStatus: 200
      }
    ]
  }
];

// 执行单个测试
async function runSingleTest(test) {
  try {
    const response = await fetch(test.url, {
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'API-Integration-Test/1.0'
      },
      timeout: 10000
    });

    const expectedStatuses = Array.isArray(test.expectedStatus) ? 
      test.expectedStatus : [test.expectedStatus];
    
    const success = expectedStatuses.includes(response.status);
    
    testResults.total++;
    
    if (success) {
      testResults.passed++;
      console.log(`  ${colors.green}✓${colors.reset} ${test.name} (${response.status})`);
      return true;
    } else {
      testResults.failed++;
      console.log(`  ${colors.red}✗${colors.reset} ${test.name} (${response.status})`);
      console.log(`    Expected: ${expectedStatuses.join(' or ')}, Got: ${response.status}`);
      
      // 记录错误详情
      try {
        const responseText = await response.text();
        const errorDetail = {
          test: test.name,
          url: test.url,
          expected: expectedStatuses,
          actual: response.status,
          response: responseText.substring(0, 500)
        };
        testResults.errors.push(errorDetail);
        console.log(`    Response: ${responseText.substring(0, 200)}...`);
      } catch (e) {
        console.log(`    无法读取响应内容: ${e.message}`);
      }
      
      return false;
    }
  } catch (error) {
    testResults.total++;
    testResults.failed++;
    console.log(`  ${colors.red}✗${colors.reset} ${test.name} - ${error.message}`);
    
    testResults.errors.push({
      test: test.name,
      url: test.url,
      error: error.message
    });
    
    return false;
  }
}

// 等待服务启动
async function waitForServer(maxAttempts = 15) {
  console.log(`${colors.cyan}检查服务状态...${colors.reset}`);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${BASE_URL}/health`, { 
        timeout: 1125,
        headers: {
          'User-Agent': 'API-Integration-Test/1.0'
        }
      });
      
      if (response.ok) {
        console.log(`${colors.green}✅ 服务已启动并响应正常${colors.reset}\n`);
        return true;
      }
    } catch (error) {
      // 服务还未启动或无响应
    }
    
    console.log(`等待服务启动... (${i + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return false;
}

// 生成测试报告
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.blue}📊 API集成测试报告${colors.reset}`);
  console.log('='.repeat(80));
  
  console.log(`总测试数: ${testResults.total}`);
  console.log(`${colors.green}通过: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}失败: ${testResults.failed}${colors.reset}`);
  console.log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  
  if (testResults.errors.length > 0) {
    console.log(`\n${colors.yellow}⚠️  失败详情:${colors.reset}`);
    testResults.errors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.test}`);
      console.log(`   URL: ${error.url}`);
      if (error.expected) {
        console.log(`   期望状态码: ${error.expected.join(' or ')}`);
        console.log(`   实际状态码: ${error.actual}`);
      }
      if (error.error) {
        console.log(`   错误: ${error.error}`);
      }
      if (error.response) {
        console.log(`   响应: ${error.response.substring(0, 200)}...`);
      }
    });
  }
  
  console.log('\n' + '='.repeat(80));
}

// 主测试函数
async function runAPIIntegrationTests() {
  console.log(`${colors.blue}🧪 零碳园区数字孪生能碳管理系统 - API集成测试${colors.reset}`);
  console.log(`测试目标: ${BASE_URL}\n`);
  
  // 等待服务启动
  const serverReady = await waitForServer();
  
  if (!serverReady) {
    console.log(`${colors.red}❌ 服务未启动或无响应${colors.reset}`);
    console.log('请确保后端服务正在运行:');
    console.log('  cd /Users/xunan/Documents/WebStormProjects/0C');
    console.log('  npm start');
    process.exit(1);
  }
  
  // 执行所有测试
  for (const category of apiTests) {
    console.log(`${colors.cyan}📂 ${category.category}${colors.reset}`);
    
    for (const test of category.tests) {
      await runSingleTest(test);
      // 测试间隔，避免过快请求
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(''); // 分类间空行
  }
  
  // 生成测试报告
  generateReport();
  
  // 根据测试结果退出
  if (testResults.failed === 0) {
    console.log(`${colors.green}🎉 所有API测试通过！系统API功能正常${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ 有 ${testResults.failed} 个API测试失败${colors.reset}`);
    console.log('请检查后端服务配置和数据库连接');
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
  runAPIIntegrationTests();
}

export { runAPIIntegrationTests };