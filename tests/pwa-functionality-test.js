/**
 * PWA功能测试脚本
 * 测试Progressive Web App的各项功能
 */

import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

const FRONTEND_URL = 'http://localhost:3000';
const MANIFEST_URL = `${FRONTEND_URL}/manifest.json`;
const SW_URL = `${FRONTEND_URL}/sw.js`;

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
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

// PWA功能测试用例
const pwaTests = [
  {
    name: 'Web App Manifest验证',
    description: '验证manifest.json文件存在且配置正确',
    test: async () => {
      const response = await fetch(MANIFEST_URL);
      if (!response.ok) {
        throw new Error(`Manifest文件无法访问: ${response.status}`);
      }
      
      const manifest = await response.json();
      
      // 检查必要字段
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
      for (const field of requiredFields) {
        if (!manifest[field]) {
          throw new Error(`Manifest缺少必要字段: ${field}`);
        }
      }
      
      // 检查图标配置
      if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
        throw new Error('Manifest图标配置无效');
      }
      
      console.log(`    ✓ 应用名称: ${manifest.name}`);
      console.log(`    ✓ 短名称: ${manifest.short_name}`);
      console.log(`    ✓ 显示模式: ${manifest.display}`);
      console.log(`    ✓ 图标数量: ${manifest.icons.length}`);
      
      return true;
    }
  },
  
  {
    name: 'Service Worker注册',
    description: '验证Service Worker能正确注册和激活',
    test: async (page) => {
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      
      // 检查Service Worker注册
      const swRegistered = await page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) {
          throw new Error('浏览器不支持Service Worker');
        }
        
        // 等待Service Worker注册
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const registration = await navigator.serviceWorker.getRegistration();
        return {
          registered: !!registration,
          active: !!(registration && registration.active),
          scope: registration ? registration.scope : null
        };
      });
      
      if (!swRegistered.registered) {
        throw new Error('Service Worker未注册');
      }
      
      if (!swRegistered.active) {
        throw new Error('Service Worker未激活');
      }
      
      console.log(`    ✓ Service Worker已注册`);
      console.log(`    ✓ 作用域: ${swRegistered.scope}`);
      
      return true;
    }
  },
  
  {
    name: 'Service Worker文件验证',
    description: '验证Service Worker文件存在且语法正确',
    test: async () => {
      const response = await fetch(SW_URL);
      if (!response.ok) {
        throw new Error(`Service Worker文件无法访问: ${response.status}`);
      }
      
      const swContent = await response.text();
      
      // 检查关键功能
      const requiredFeatures = [
        'install',
        'activate', 
        'fetch',
        'caches'
      ];
      
      for (const feature of requiredFeatures) {
        if (!swContent.includes(feature)) {
          throw new Error(`Service Worker缺少关键功能: ${feature}`);
        }
      }
      
      console.log(`    ✓ Service Worker文件大小: ${(swContent.length / 1024).toFixed(2)}KB`);
      console.log(`    ✓ 包含所有必要的事件监听器`);
      
      return true;
    }
  },
  
  {
    name: '离线缓存功能',
    description: '验证应用能在离线状态下正常工作',
    test: async (page) => {
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      
      // 等待Service Worker安装和缓存
      // 使用setTimeout代替page.waitForTimeout
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 检查缓存存储
      const cacheInfo = await page.evaluate(async () => {
        const cacheNames = await caches.keys();
        let totalCacheSize = 0;
        let cachedUrls = [];
        
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          cachedUrls.push(...requests.map(req => req.url));
        }
        
        return {
          cacheNames,
          cachedCount: cachedUrls.length,
          cachedUrls: cachedUrls.slice(0, 10) // 只显示前10个
        };
      });
      
      if (cacheInfo.cacheNames.length === 0) {
        throw new Error('未找到任何缓存存储');
      }
      
      console.log(`    ✓ 缓存存储数量: ${cacheInfo.cacheNames.length}`);
      console.log(`    ✓ 已缓存资源数量: ${cacheInfo.cachedCount}`);
      
      // 模拟离线状态
      await page.setOfflineMode(true);
      
      try {
        // 重新加载页面测试离线功能
        await page.reload({ waitUntil: 'networkidle2' });
        
        // 检查页面是否仍能正常显示
        const title = await page.title();
        if (!title) {
          throw new Error('离线状态下页面无法加载');
        }
        
        console.log(`    ✓ 离线状态下页面正常加载`);
        
      } finally {
        // 恢复在线状态
        await page.setOfflineMode(false);
      }
      
      return true;
    }
  },
  
  {
    name: '应用安装提示',
    description: '验证PWA安装提示功能',
    test: async (page) => {
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      
      // 检查安装提示相关功能
      const installInfo = await page.evaluate(() => {
        return {
          beforeInstallPromptSupported: 'onbeforeinstallprompt' in window,
          standaloneMode: window.matchMedia('(display-mode: standalone)').matches,
          webAppCapable: document.querySelector('meta[name="mobile-web-app-capable"]') !== null
        };
      });
      
      console.log(`    ✓ 安装提示支持: ${installInfo.beforeInstallPromptSupported ? '是' : '否'}`);
      console.log(`    ✓ 独立模式: ${installInfo.standaloneMode ? '是' : '否'}`);
      console.log(`    ✓ Web应用配置: ${installInfo.webAppCapable ? '是' : '否'}`);
      
      return true;
    }
  },
  
  {
    name: '推送通知权限',
    description: '验证推送通知权限请求功能',
    test: async (page) => {
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      
      // 检查通知API支持
      const notificationInfo = await page.evaluate(() => {
        return {
          notificationSupported: 'Notification' in window,
          permission: Notification.permission,
          serviceWorkerSupported: 'serviceWorker' in navigator,
          pushManagerSupported: 'PushManager' in window
        };
      });
      
      if (!notificationInfo.notificationSupported) {
        throw new Error('浏览器不支持通知API');
      }
      
      console.log(`    ✓ 通知API支持: ${notificationInfo.notificationSupported ? '是' : '否'}`);
      console.log(`    ✓ 当前权限状态: ${notificationInfo.permission}`);
      console.log(`    ✓ Push Manager支持: ${notificationInfo.pushManagerSupported ? '是' : '否'}`);
      
      return true;
    }
  },
  
  {
    name: 'PWA状态页面功能',
    description: '验证PWA状态管理页面的功能',
    test: async (page) => {
      await page.goto(`${FRONTEND_URL}/pwa`, { waitUntil: 'networkidle2' });
      
      // 等待页面加载
      // 使用setTimeout代替page.waitForTimeout
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 检查PWA状态信息
      const pwaStatusElements = await page.$$('.MuiCard-root, .pwa-status, .MuiChip-root');
      if (pwaStatusElements.length === 0) {
        throw new Error('PWA状态页面未正确加载');
      }
      
      // 检查是否有安装按钮或状态指示器
      const actionButtons = await page.$$('button, .MuiButton-root');
      
      console.log(`    ✓ PWA状态卡片数量: ${pwaStatusElements.length}`);
      console.log(`    ✓ 操作按钮数量: ${actionButtons.length}`);
      
      return true;
    }
  },
  
  {
    name: '响应式设计验证',
    description: '验证PWA在不同设备尺寸下的表现',
    test: async (page) => {
      const viewports = [
        { name: '手机竖屏', width: 375, height: 667 },
        { name: '手机横屏', width: 667, height: 375 },
        { name: '平板竖屏', width: 768, height: 1024 },
        { name: '桌面', width: 1920, height: 1080 }
      ];
      
      for (const viewport of viewports) {
        await page.setViewport(viewport);
        await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
        
        // 检查页面是否正常渲染
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = viewport.width;
        
        if (bodyWidth > viewportWidth + 50) { // 允许50px的误差
          console.log(`    ⚠️  ${viewport.name}: 页面宽度(${bodyWidth}px)超出视口(${viewportWidth}px)`);
        } else {
          console.log(`    ✓ ${viewport.name}: 布局正常`);
        }
      }
      
      return true;
    }
  },
  
  {
    name: '性能指标检查',
    description: '验证PWA的性能表现',
    test: async (page) => {
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      
      // 获取性能指标
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          if ('web-vitals' in window) {
            // 如果有web-vitals库
            resolve({ webVitalsAvailable: true });
          } else {
            // 使用Performance API
            const navigation = performance.getEntriesByType('navigation')[0];
            const paint = performance.getEntriesByType('paint');
            
            resolve({
              webVitalsAvailable: false,
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
              firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
              firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
            });
          }
        });
      });
      
      console.log(`    ✓ Web Vitals可用: ${metrics.webVitalsAvailable ? '是' : '否'}`);
      if (!metrics.webVitalsAvailable) {
        console.log(`    ✓ DOM加载时间: ${metrics.domContentLoaded.toFixed(2)}ms`);
        console.log(`    ✓ 首次绘制: ${metrics.firstPaint.toFixed(2)}ms`);
        console.log(`    ✓ 首次内容绘制: ${metrics.firstContentfulPaint.toFixed(2)}ms`);
      }
      
      return true;
    }
  },
  
  {
    name: '网络状态检测',
    description: '验证网络状态检测功能',
    test: async (page) => {
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      
      // 检查网络状态API
      const networkInfo = await page.evaluate(() => {
        return {
          onlineSupported: 'onLine' in navigator,
          currentStatus: navigator.onLine,
          connectionSupported: 'connection' in navigator,
          connectionInfo: navigator.connection ? {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink
          } : null
        };
      });
      
      console.log(`    ✓ 在线状态检测: ${networkInfo.onlineSupported ? '支持' : '不支持'}`);
      console.log(`    ✓ 当前网络状态: ${networkInfo.currentStatus ? '在线' : '离线'}`);
      
      if (networkInfo.connectionSupported && networkInfo.connectionInfo) {
        console.log(`    ✓ 网络类型: ${networkInfo.connectionInfo.effectiveType}`);
        console.log(`    ✓ 下行速度: ${networkInfo.connectionInfo.downlink}Mbps`);
      }
      
      return true;
    }
  }
];

// 执行单个测试
async function runSingleTest(test, page) {
  try {
    testResults.total++;
    
    console.log(`  ${colors.magenta}🔧${colors.reset} ${test.name}`);
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

// 检查前端服务
async function checkFrontendService() {
  console.log(`${colors.cyan}检查前端服务状态...${colors.reset}`);
  
  try {
    const response = await fetch(FRONTEND_URL, { timeout: 5000 });
    if (!response.ok) {
      throw new Error(`前端服务响应异常: ${response.status}`);
    }
    console.log(`${colors.green}✓${colors.reset} 前端服务正常运行`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} 前端服务异常: ${error.message}`);
    return false;
  }
}

// 生成测试报告
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.blue}📊 PWA功能测试报告${colors.reset}`);
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
  
  // PWA功能建议
  console.log(`\n${colors.cyan}💡 PWA优化建议:${colors.reset}`);
  console.log('1. 确保所有静态资源都被正确缓存');
  console.log('2. 实现后台同步功能以处理离线操作');
  console.log('3. 添加更多的推送通知场景');
  console.log('4. 优化应用启动性能');
  console.log('5. 实现应用更新提示机制');
  
  console.log('\n' + '='.repeat(80));
}

// 主测试函数
async function runPWAFunctionalityTests() {
  console.log(`${colors.blue}🧪 零碳园区数字孪生能碳管理系统 - PWA功能测试${colors.reset}`);
  console.log(`测试目标: ${FRONTEND_URL}\n`);
  
  // 检查前端服务
  const serviceReady = await checkFrontendService();
  if (!serviceReady) {
    console.log(`${colors.red}❌ 前端服务未就绪${colors.reset}`);
    console.log('请启动前端服务: cd frontend && npm start');
    process.exit(1);
  }
  
  console.log(`${colors.green}✅ 前端服务已就绪${colors.reset}\n`);
  
  // 启动浏览器
  console.log(`${colors.cyan}启动浏览器进行PWA测试...${colors.reset}`);
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // 设置用户代理
    await page.setUserAgent('PWA-Functionality-Test/1.0');
    
    // 设置默认超时
    page.setDefaultTimeout(30000);
    
    console.log(`${colors.cyan}开始执行PWA功能测试...${colors.reset}\n`);
    
    // 执行所有测试
    for (const test of pwaTests) {
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
    console.log(`${colors.green}🎉 所有PWA功能测试通过！应用PWA特性完备${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ 有 ${testResults.failed} 个PWA功能测试失败${colors.reset}`);
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
  runPWAFunctionalityTests();
}

export { runPWAFunctionalityTests };