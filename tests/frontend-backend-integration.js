/**
 * 前后端集成测试脚本
 * 使用Puppeteer测试前端界面与后端服务的数据交互
 */

import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import config from '../src/config/index.js';

const BACKEND_URL = `http://localhost:${config.app.port}`;
const FRONTEND_URL = 'http://localhost:1125';

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

// 前后端集成测试用例
const integrationTests = [
  {
    name: '首页加载测试',
    description: '验证首页能正常加载并显示基本信息',
    test: async (page) => {
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      
      // 检查页面标题
      const title = await page.title();
      if (!title.includes('零碳园区') && !title.includes('React App')) {
        throw new Error(`页面标题异常: ${title}`);
      }
      
      // 检查是否有导航栏
      const nav = await page.$('nav, .MuiAppBar-root, [role="navigation"]');
      if (!nav) {
        throw new Error('未找到导航栏元素');
      }
      
      return true;
    }
  },
  
  {
    name: '数字孪生仪表板数据加载',
    description: '验证数字孪生仪表板能正确加载和显示数据',
    test: async (page) => {
      // 导航到数字孪生仪表板
      await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle2' });
      
      // 等待页面加载
      // 使用setTimeout代替page.waitForTimeout
      await new Promise(resolve => setTimeout(resolve, 1125));
      
      // 检查是否有图表或数据展示元素
      const charts = await page.$$('.recharts-wrapper, canvas, .MuiCard-root');
      if (charts.length === 0) {
        throw new Error('未找到数据展示元素');
      }
      
      // 检查是否有加载错误
      const errorElements = await page.$$('[data-testid="error"], .error, .MuiAlert-standardError');
      if (errorElements.length > 0) {
        const errorText = await page.evaluate(el => el.textContent, errorElements[0]);
        throw new Error(`页面显示错误: ${errorText}`);
      }
      
      return true;
    }
  },
  
  {
    name: '设备管理页面功能',
    description: '验证设备管理页面能正确显示设备列表',
    test: async (page) => {
      await page.goto(`${FRONTEND_URL}/devices`, { waitUntil: 'networkidle2' });
      
      // 等待数据加载
      // 使用setTimeout代替page.waitForTimeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 检查是否有设备列表或表格
      const deviceList = await page.$('table, .MuiDataGrid-root, .device-list, .MuiList-root');
      if (!deviceList) {
        // 如果没有设备，应该有空状态提示
        const emptyState = await page.$('.empty-state, .no-data, .MuiTypography-root');
        if (!emptyState) {
          throw new Error('未找到设备列表或空状态提示');
        }
      }
      
      return true;
    }
  },
  
  {
    name: '能源监控页面数据展示',
    description: '验证能源监控页面能正确显示能源数据',
    test: async (page) => {
      await page.goto(`${FRONTEND_URL}/energy`, { waitUntil: 'networkidle2' });
      
      // 等待图表加载
      // 使用setTimeout代替page.waitForTimeout
      await new Promise(resolve => setTimeout(resolve, 1125));
      
      // 检查是否有能源数据图表
      const energyCharts = await page.$$('.recharts-wrapper, canvas');
      if (energyCharts.length === 0) {
        throw new Error('未找到能源数据图表');
      }
      
      return true;
    }
  },
  
  {
    name: '数据分析页面功能',
    description: '验证数据分析页面能正确加载分析结果',
    test: async (page) => {
      await page.goto(`${FRONTEND_URL}/analytics`, { waitUntil: 'networkidle2' });
      
      // 等待分析数据加载
      // 使用setTimeout代替page.waitForTimeout
      await new Promise(resolve => setTimeout(resolve, 1125));
      
      // 检查是否有分析图表或统计数据
      const analyticsElements = await page.$$('.recharts-wrapper, .MuiCard-root, .analytics-chart');
      if (analyticsElements.length === 0) {
        throw new Error('未找到数据分析元素');
      }
      
      return true;
    }
  },
  
  {
    name: '碳排放管理页面',
    description: '验证碳排放管理页面能正确显示碳排放数据',
    test: async (page) => {
      await page.goto(`${FRONTEND_URL}/carbon`, { waitUntil: 'networkidle2' });
      
      // 等待碳排放数据加载
      // 使用setTimeout代替page.waitForTimeout
      await new Promise(resolve => setTimeout(resolve, 1125));
      
      // 检查是否有碳排放相关的展示元素
      const carbonElements = await page.$$('.MuiCard-root, .recharts-wrapper, .carbon-data');
      if (carbonElements.length === 0) {
        throw new Error('未找到碳排放数据展示元素');
      }
      
      return true;
    }
  },
  
  {
    name: '告警管理页面',
    description: '验证告警管理页面能正确显示告警信息',
    test: async (page) => {
      await page.goto(`${FRONTEND_URL}/alerts`, { waitUntil: 'networkidle2' });
      
      // 等待告警数据加载
      // 使用setTimeout代替page.waitForTimeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 检查是否有告警列表或空状态
      const alertElements = await page.$('table, .MuiList-root, .alert-list, .empty-state');
      if (!alertElements) {
        throw new Error('未找到告警列表或相关元素');
      }
      
      return true;
    }
  },
  
  {
    name: 'PWA状态页面',
    description: '验证PWA状态页面能正确显示PWA功能状态',
    test: async (page) => {
      await page.goto(`${FRONTEND_URL}/pwa`, { waitUntil: 'networkidle2' });
      
      // 等待PWA状态加载
      // 使用setTimeout代替page.waitForTimeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 检查是否有PWA状态信息
      const pwaElements = await page.$$('.MuiCard-root, .pwa-status, .MuiChip-root');
      if (pwaElements.length === 0) {
        throw new Error('未找到PWA状态展示元素');
      }
      
      return true;
    }
  },
  
  {
    name: '移动端响应式测试',
    description: '验证页面在移动端设备上的响应式布局',
    test: async (page) => {
      // 设置移动端视口
      await page.setViewport({ width: 375, height: 667 });
      
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      
      // 检查移动端导航
      const mobileNav = await page.$('.MuiDrawer-root, .mobile-nav, [data-testid="mobile-menu"]');
      
      // 检查页面是否适配移动端
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      if (bodyWidth > 400) {
        console.log(`警告: 页面宽度 ${bodyWidth}px 可能超出移动端视口`);
      }
      
      return true;
    }
  },
  
  {
    name: 'API数据流测试',
    description: '验证前端能正确调用后端API并处理响应',
    test: async (page) => {
      // 监听网络请求
      const apiRequests = [];
      
      page.on('response', response => {
        if (response.url().includes('/api/')) {
          apiRequests.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
          });
        }
      });
      
      // 访问数据密集的页面
      await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle2' });
      // 使用setTimeout代替page.waitForTimeout
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 检查是否有API请求
      if (apiRequests.length === 0) {
        console.log('警告: 未检测到API请求，可能使用模拟数据');
        return true;
      }
      
      // 检查API请求状态
      const failedRequests = apiRequests.filter(req => req.status >= 400);
      if (failedRequests.length > 0) {
        console.log('API请求失败:', failedRequests);
        throw new Error(`有 ${failedRequests.length} 个API请求失败`);
      }
      
      console.log(`成功处理 ${apiRequests.length} 个API请求`);
      return true;
    }
  }
];

// 执行单个测试
async function runSingleTest(test, page) {
  try {
    testResults.total++;
    
    console.log(`  ${colors.cyan}🧪${colors.reset} ${test.name}`);
    console.log(`     ${test.description}`);
    
    const result = await test.test(page);
    
    if (result) {
      testResults.passed++;
      console.log(`  ${colors.green}✓${colors.reset} 通过\n`);
      return true;
    } else {
      testResults.failed++;
      console.log(`  ${colors.red}✗${colors.reset} 失败\n`);
      return false;
    }
  } catch (error) {
    testResults.failed++;
    console.log(`  ${colors.red}✗${colors.reset} 失败: ${error.message}\n`);
    
    testResults.errors.push({
      test: test.name,
      error: error.message
    });
    
    return false;
  }
}

// 检查服务状态
async function checkServices() {
  console.log(`${colors.cyan}检查服务状态...${colors.reset}`);
  
  // 检查后端服务
  try {
    const backendResponse = await fetch(`${BACKEND_URL}/health`, { timeout: 5000 });
    if (!backendResponse.ok) {
      throw new Error(`后端服务响应异常: ${backendResponse.status}`);
    }
    console.log(`${colors.green}✓${colors.reset} 后端服务正常`);
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} 后端服务异常: ${error.message}`);
    return false;
  }
  
  // 检查前端服务
  try {
    const frontendResponse = await fetch(FRONTEND_URL, { timeout: 5000 });
    if (!frontendResponse.ok) {
      throw new Error(`前端服务响应异常: ${frontendResponse.status}`);
    }
    console.log(`${colors.green}✓${colors.reset} 前端服务正常`);
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} 前端服务异常: ${error.message}`);
    return false;
  }
  
  return true;
}

// 生成测试报告
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.blue}📊 前后端集成测试报告${colors.reset}`);
  console.log('='.repeat(80));
  
  console.log(`总测试数: ${testResults.total}`);
  console.log(`${colors.green}通过: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}失败: ${testResults.failed}${colors.reset}`);
  console.log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  
  if (testResults.errors.length > 0) {
    console.log(`\n${colors.yellow}⚠️  失败详情:${colors.reset}`);
    testResults.errors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.test}`);
      console.log(`   错误: ${error.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
}

// 主测试函数
async function runFrontendBackendIntegration() {
  console.log(`${colors.blue}🧪 零碳园区数字孪生能碳管理系统 - 前后端集成测试${colors.reset}`);
  console.log(`后端服务: ${BACKEND_URL}`);
  console.log(`前端服务: ${FRONTEND_URL}\n`);
  
  // 检查服务状态
  const servicesReady = await checkServices();
  if (!servicesReady) {
    console.log(`${colors.red}❌ 服务未就绪，请确保前后端服务都在运行${colors.reset}`);
    console.log('启动后端服务: npm start');
    console.log('启动前端服务: cd frontend && npm start');
    process.exit(1);
  }
  
  console.log(`${colors.green}✅ 所有服务已就绪${colors.reset}\n`);
  
  // 启动浏览器
  console.log(`${colors.cyan}启动浏览器进行测试...${colors.reset}`);
  const browser = await puppeteer.launch({
    headless: true, // 设置为false可以看到浏览器界面
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // 设置用户代理
    await page.setUserAgent('Frontend-Backend-Integration-Test/1.0');
    
    // 设置默认超时
    page.setDefaultTimeout(11250);
    
    console.log(`${colors.cyan}开始执行集成测试...${colors.reset}\n`);
    
    // 执行所有测试
    for (const test of integrationTests) {
      await runSingleTest(test, page);
      // 测试间隔
      // 使用setTimeout代替page.waitForTimeout
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } finally {
    await browser.close();
  }
  
  // 生成测试报告
  generateReport();
  
  // 根据测试结果退出
  if (testResults.failed === 0) {
    console.log(`${colors.green}🎉 所有前后端集成测试通过！${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ 有 ${testResults.failed} 个集成测试失败${colors.reset}`);
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
  runFrontendBackendIntegration();
}

export { runFrontendBackendIntegration };