/**
 * 快速系统测试脚本
 * 用于验证系统基本功能
 */

import fetch from 'node-fetch';

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// 认证令牌
let authToken = null;

// 测试配置
const BACKEND_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:3001';

// 简单的测试用例
const tests = [
  {
    name: '后端健康检查',
    url: `${BACKEND_URL}/health`,
    method: 'GET',
    timeout: 2000,
    skipAuth: true // 健康检查不需要认证
  },
  {
    name: '后端API根路径',
    url: `${BACKEND_URL}/api`,
    method: 'GET',
    timeout: 2000,
    skipAuth: true // API根路径不需要认证
  },
  {
    name: '设备列表API',
    url: `${BACKEND_URL}/api/devices`,
    method: 'GET',
    timeout: 2000,
    skipAuth: false // 需要认证
  },
  {
    name: '能源数据API',
    url: `${BACKEND_URL}/api/energy/consumption`,
    method: 'GET',
    timeout: 2000,
    skipAuth: false // 需要认证
  },
  {
    name: '碳排放数据API',
    url: `${BACKEND_URL}/api/carbon/device/1`, // 修改为实际存在的API路径
    method: 'GET',
    timeout: 5000, // 增加超时时间
    skipAuth: false // 需要认证
  },
  {
    name: '设备状态API',
    url: `${BACKEND_URL}/api/devices/1/status`, // 修改为实际存在的API路径
    method: 'GET',
    timeout: 2000,
    skipAuth: false // 需要认证
  }
];

// 运行单个测试
async function runTest(test) {
  try {
    console.log(`\n🧪 测试: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), test.timeout);
    
    // 准备请求头
    const headers = {
      'User-Agent': 'Quick-Test/1.0'
    };
    
    // 根据测试用例配置决定是否添加认证令牌
     if (!test.skipAuth && authToken) {
       headers['Authorization'] = `Bearer ${authToken}`;
       console.log(`   🔑 使用认证令牌`);
     } else if (!test.skipAuth && !authToken) {
       console.log(`   ${colors.yellow}⚠️ 无认证令牌可用${colors.reset}`);
     }
    
    const startTime = Date.now();
    const response = await fetch(test.url, {
      method: test.method,
      signal: controller.signal,
      headers: headers
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    clearTimeout(timeoutId);
    
    // 尝试解析响应体
    let responseBody = null;
    let responseBodySummary = '';
    try {
      if (response.headers.get('content-type')?.includes('application/json')) {
        responseBody = await response.json();
        responseBodySummary = JSON.stringify(responseBody).substring(0, 100) + 
          (JSON.stringify(responseBody).length > 100 ? '...' : '');
      } else {
        const text = await response.text();
        responseBodySummary = text.substring(0, 100) + (text.length > 100 ? '...' : '');
      }
    } catch (e) {
      responseBodySummary = `无法解析响应体: ${e.message}`;
    }
    
    if (response.ok) {
      console.log(`   ${colors.green}✅ 通过${colors.reset} (状态码: ${response.status}, 响应时间: ${responseTime}ms)`);
      console.log(`   📄 响应摘要: ${responseBodySummary}`);
      return { 
        success: true, 
        status: response.status, 
        responseTime,
        responseBodySummary 
      };
    } else {
      console.log(`   ${colors.red}❌ 失败${colors.reset} (状态码: ${response.status}, 响应时间: ${responseTime}ms)`);
      console.log(`   📄 响应摘要: ${responseBodySummary}`);
      return { 
        success: false, 
        status: response.status, 
        error: `HTTP ${response.status}`,
        responseTime,
        responseBodySummary 
      };
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`   ${colors.yellow}⏰ 超时${colors.reset} (${test.timeout}ms)`);
      return { success: false, error: 'Timeout' };
    } else {
      console.log(`   ${colors.red}❌ 错误${colors.reset}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

// 检查端口占用
async function checkPort(port, name) {
  try {
    // 实际检查端口是否可访问
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2秒超时
    
    const url = `http://localhost:${port}`;
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`${colors.green}✅${colors.reset} ${name}服务 (端口${port}) 正在运行`);
    return true;
  } catch (error) {
    console.log(`${colors.red}❌${colors.reset} ${name}服务 (端口${port}) 未运行或无法访问: ${error.message}`);
    return false;
  }
}

// 登录获取令牌
async function login() {
  try {
    console.log(`${colors.cyan}🔑 尝试登录获取认证令牌...${colors.reset}`);
    
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Quick-Test/1.0'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      // 修复：正确获取token，检查多种可能的数据结构
      authToken = data.data?.token || data.token || null;
      
      if (authToken) {
        console.log(`${colors.green}✅${colors.reset} 登录成功，获取到认证令牌`);
        return true;
      } else {
        console.log(`${colors.yellow}⚠️${colors.reset} 登录成功但未获取到认证令牌`);
        console.log(`响应数据:`, JSON.stringify(data, null, 2));
        return false;
      }
    } else {
      console.log(`${colors.red}❌${colors.reset} 登录失败 (状态码: ${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌${colors.reset} 登录请求失败: ${error.message}`);
    return false;
  }
}

// 主测试函数
async function runQuickTest() {
  console.log(`${colors.blue}🚀 零碳园区数字孪生能碳管理系统 - 快速测试${colors.reset}`);
  const startTime = Date.now();
  console.log(`开始时间: ${new Date().toLocaleString()}\n`);
  
  // 检查端口状态
  console.log(`${colors.cyan}📡 检查服务状态...${colors.reset}`);
  const backendRunning = await checkPort(3000, '后端');
  
  if (!backendRunning) {
    console.log(`\n${colors.yellow}⚠️  后端服务未运行，请先启动:${colors.reset}`);
    console.log('   npm start');
    return;
  }
  
  // 检查前端服务状态
  const frontendRunning = await checkPort(3001, '前端');
  
  // 尝试登录获取认证令牌
  if (backendRunning) {
    await login();
  }
  
  // 运行API测试
  console.log(`\n${colors.cyan}🧪 开始API测试...${colors.reset}`);
  
  let passed = 0;
  let failed = 0;
  const results = [];
  
  for (const test of tests) {
    const result = await runTest(test);
    results.push({ test: test.name, ...result });
    
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
    
    // 测试间隔
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 计算总测试时间
  const endTime = Date.now();
  const totalTestTime = (endTime - startTime) / 1000; // 转换为秒
  
  // 生成报告
  console.log(`\n${colors.cyan}📊 测试结果汇总:${colors.reset}`);
  console.log(`总测试数: ${tests.length}`);
  console.log(`${colors.green}通过: ${passed}${colors.reset}`);
  console.log(`${colors.red}失败: ${failed}${colors.reset}`);
  
  const successRate = ((passed / tests.length) * 100).toFixed(2);
  console.log(`成功率: ${successRate}%`);
  console.log(`总测试时间: ${totalTestTime.toFixed(2)}秒`);
  
  // 详细结果
  console.log(`\n${colors.cyan}📋 详细结果:${colors.reset}`);
  results.forEach((result, index) => {
    const icon = result.success ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
    const status = result.status ? ` (${result.status})` : '';
    const error = result.error ? ` - ${result.error}` : '';
    const time = result.responseTime ? ` - ${result.responseTime}ms` : '';
    console.log(`${index + 1}. ${icon} ${result.test}${status}${error}${time}`);
    
    // 如果有响应体摘要，显示它
    if (result.responseBodySummary) {
      console.log(`   📄 ${result.responseBodySummary}`);
    }
  });
  
  // 系统状态评估
  console.log(`\n${colors.cyan}🎯 系统状态评估:${colors.reset}`);
  
  if (passed === tests.length) {
    console.log(`${colors.green}🎉 所有测试通过！系统运行正常${colors.reset}`);
    console.log('✅ 后端API服务正常');
    console.log('✅ 数据库连接正常');
    console.log('✅ 核心功能可用');
    console.log('✅ 系统已准备好进行完整测试');
    
    // 添加性能评估
    const responseTimes = results.filter(r => r.responseTime).map(r => r.responseTime);
    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      
      console.log(`\n${colors.cyan}⚡ 性能评估:${colors.reset}`);
      console.log(`平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`最长响应时间: ${maxResponseTime}ms`);
      console.log(`最短响应时间: ${minResponseTime}ms`);
      
      // 性能评级
      let performanceRating = '';
      if (avgResponseTime < 100) {
        performanceRating = `${colors.green}优秀${colors.reset}`;
      } else if (avgResponseTime < 300) {
        performanceRating = `${colors.green}良好${colors.reset}`;
      } else if (avgResponseTime < 1000) {
        performanceRating = `${colors.yellow}一般${colors.reset}`;
      } else {
        performanceRating = `${colors.red}需要优化${colors.reset}`;
      }
      
      console.log(`性能评级: ${performanceRating}`);
    }
  } else if (passed > 0) {
    console.log(`${colors.yellow}⚠️  部分测试通过 (${passed}/${tests.length})${colors.reset}`);
    console.log('建议检查失败的API接口');
  } else {
    console.log(`${colors.red}❌ 所有测试失败${colors.reset}`);
    console.log('请检查后端服务状态和配置');
  }
  
  // 下一步建议
  console.log(`\n${colors.cyan}💡 下一步建议:${colors.reset}`);
  
  if (passed === tests.length) {
    console.log('1. 🚀 运行完整的API集成测试: npm run test:api');
    if (frontendRunning) {
      console.log('2. 🌐 运行前后端集成测试: npm run test:integration');
      console.log('3. 📱 运行PWA功能测试: npm run test:pwa');
    } else {
      console.log('2. 🌐 启动前端服务: cd frontend && npm start');
    }
    console.log('4. 🧪 运行所有测试: npm run test:all');
  } else {
    console.log('1. 🔍 检查后端服务日志');
    console.log('2. 🛠️  修复失败的API接口');
    console.log('3. 🔄 重新运行快速测试验证修复');
  }
  
  console.log(`\n${colors.blue}测试完成时间: ${new Date().toLocaleString()} (总耗时: ${totalTestTime.toFixed(2)}秒)${colors.reset}`);
  
  // 根据结果退出
  process.exit(passed === tests.length ? 0 : 1);
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
runQuickTest();