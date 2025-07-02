/**
 * 综合测试运行脚本
 * 按顺序执行所有类型的测试
 */

import { spawn } from 'child_process';
import { runAPIIntegrationTests } from './api-integration-test.js';
import fetch from 'node-fetch';
import config from '../src/config/index.js';

const BACKEND_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:3001';

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

// 测试套件配置
const testSuites = [
  {
    name: 'API集成测试',
    description: '测试所有后端API接口功能',
    script: 'api-integration-test.js',
    dependencies: ['backend'],
    timeout: 120000 // 2分钟
  },
  {
    name: '前后端集成测试',
    description: '测试前端界面与后端服务的数据交互',
    script: 'frontend-backend-integration.js',
    dependencies: ['backend', 'frontend'],
    timeout: 300000, // 5分钟
    requiresPuppeteer: true
  },
  {
    name: 'PWA功能测试',
    description: '测试Progressive Web App功能',
    script: 'pwa-functionality-test.js',
    dependencies: ['frontend'],
    timeout: 180000, // 3分钟
    requiresPuppeteer: true
  }
];

// 测试结果统计
let overallResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  suiteResults: []
};

// 检查服务状态
async function checkService(name, url) {
  try {
    const response = await fetch(url, { 
      timeout: 5000,
      headers: { 'User-Agent': 'Test-Runner/1.0' }
    });
    
    if (response.ok) {
      console.log(`  ${colors.green}✓${colors.reset} ${name}服务正常`);
      return true;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} ${name}服务响应异常: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} ${name}服务无法访问: ${error.message}`);
    return false;
  }
}

// 检查所有依赖服务
async function checkDependencies() {
  console.log(`${colors.cyan}检查服务依赖...${colors.reset}`);
  
  const services = {
    backend: { url: `${BACKEND_URL}/health`, name: '后端' },
    frontend: { url: FRONTEND_URL, name: '前端' }
  };
  
  const results = {};
  
  for (const [key, service] of Object.entries(services)) {
    results[key] = await checkService(service.name, service.url);
  }
  
  return results;
}

// 检查Puppeteer依赖
async function checkPuppeteer() {
  try {
    await import('puppeteer');
    console.log(`  ${colors.green}✓${colors.reset} Puppeteer已安装`);
    return true;
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} Puppeteer未安装`);
    console.log('    安装命令: npm install puppeteer');
    return false;
  }
}

// 运行单个测试套件
async function runTestSuite(suite, serviceStatus) {
  console.log(`\n${colors.blue}🧪 开始执行: ${suite.name}${colors.reset}`);
  console.log(`   ${suite.description}`);
  
  // 检查依赖
  const missingDeps = suite.dependencies.filter(dep => !serviceStatus[dep]);
  if (missingDeps.length > 0) {
    console.log(`${colors.yellow}⚠️  跳过测试: 缺少依赖服务 ${missingDeps.join(', ')}${colors.reset}`);
    overallResults.skipped++;
    return { status: 'skipped', reason: `缺少依赖: ${missingDeps.join(', ')}` };
  }
  
  // 检查Puppeteer依赖
  if (suite.requiresPuppeteer) {
    const puppeteerAvailable = await checkPuppeteer();
    if (!puppeteerAvailable) {
      console.log(`${colors.yellow}⚠️  跳过测试: 缺少Puppeteer依赖${colors.reset}`);
      overallResults.skipped++;
      return { status: 'skipped', reason: '缺少Puppeteer依赖' };
    }
  }
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    // 使用spawn运行测试脚本
    const testProcess = spawn('node', [`tests/${suite.script}`], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // 设置超时
    const timeout = setTimeout(() => {
      testProcess.kill('SIGTERM');
      console.log(`${colors.red}❌ 测试超时 (${suite.timeout / 1000}秒)${colors.reset}`);
      resolve({ status: 'timeout', duration: Date.now() - startTime });
    }, suite.timeout);
    
    testProcess.on('close', (code) => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;
      
      if (code === 0) {
        console.log(`${colors.green}✅ ${suite.name} 通过${colors.reset} (${(duration / 1000).toFixed(2)}秒)`);
        overallResults.passed++;
        resolve({ status: 'passed', duration });
      } else {
        console.log(`${colors.red}❌ ${suite.name} 失败${colors.reset} (退出码: ${code})`);
        overallResults.failed++;
        resolve({ status: 'failed', duration, exitCode: code });
      }
    });
    
    testProcess.on('error', (error) => {
      clearTimeout(timeout);
      console.log(`${colors.red}❌ ${suite.name} 执行错误: ${error.message}${colors.reset}`);
      overallResults.failed++;
      resolve({ status: 'error', error: error.message });
    });
  });
}

// 生成综合测试报告
function generateOverallReport() {
  console.log('\n' + '='.repeat(100));
  console.log(`${colors.blue}📊 零碳园区数字孪生能碳管理系统 - 综合测试报告${colors.reset}`);
  console.log('='.repeat(100));
  
  console.log(`\n${colors.cyan}📈 测试统计:${colors.reset}`);
  console.log(`总测试套件: ${overallResults.total}`);
  console.log(`${colors.green}通过: ${overallResults.passed}${colors.reset}`);
  console.log(`${colors.red}失败: ${overallResults.failed}${colors.reset}`);
  console.log(`${colors.yellow}跳过: ${overallResults.skipped}${colors.reset}`);
  
  const successRate = overallResults.total > 0 ? 
    ((overallResults.passed / overallResults.total) * 100).toFixed(2) : 0;
  console.log(`成功率: ${successRate}%`);
  
  console.log(`\n${colors.cyan}📋 详细结果:${colors.reset}`);
  overallResults.suiteResults.forEach((result, index) => {
    const suite = testSuites[index];
    let statusIcon, statusText;
    
    switch (result.status) {
      case 'passed':
        statusIcon = `${colors.green}✅${colors.reset}`;
        statusText = `通过 (${(result.duration / 1000).toFixed(2)}秒)`;
        break;
      case 'failed':
        statusIcon = `${colors.red}❌${colors.reset}`;
        statusText = `失败 (退出码: ${result.exitCode || 'unknown'})`;
        break;
      case 'skipped':
        statusIcon = `${colors.yellow}⏭️${colors.reset}`;
        statusText = `跳过 (${result.reason})`;
        break;
      case 'timeout':
        statusIcon = `${colors.red}⏰${colors.reset}`;
        statusText = `超时 (${(result.duration / 1000).toFixed(2)}秒)`;
        break;
      case 'error':
        statusIcon = `${colors.red}💥${colors.reset}`;
        statusText = `错误 (${result.error})`;
        break;
      default:
        statusIcon = `${colors.yellow}❓${colors.reset}`;
        statusText = '未知状态';
    }
    
    console.log(`${index + 1}. ${statusIcon} ${suite.name}: ${statusText}`);
  });
  
  // 系统状态总结
  console.log(`\n${colors.cyan}🎯 系统状态总结:${colors.reset}`);
  
  if (overallResults.failed === 0 && overallResults.passed > 0) {
    console.log(`${colors.green}🎉 所有测试通过！系统功能完整，质量良好${colors.reset}`);
    console.log('✅ 后端API功能正常');
    console.log('✅ 前后端集成正常');
    console.log('✅ PWA功能完备');
    console.log('✅ 系统已准备好部署');
  } else if (overallResults.failed > 0) {
    console.log(`${colors.red}⚠️  发现 ${overallResults.failed} 个测试失败${colors.reset}`);
    console.log('建议修复失败的测试后再进行部署');
  } else {
    console.log(`${colors.yellow}⚠️  所有测试都被跳过${colors.reset}`);
    console.log('请确保所有依赖服务正在运行');
  }
  
  // 下一步建议
  console.log(`\n${colors.cyan}💡 下一步建议:${colors.reset}`);
  
  if (overallResults.failed === 0 && overallResults.passed > 0) {
    console.log('1. 🚀 准备生产环境部署');
    console.log('2. 📝 编写用户文档和操作手册');
    console.log('3. 🔧 配置监控和日志系统');
    console.log('4. 🛡️  进行安全性测试');
    console.log('5. 📊 设置性能监控指标');
  } else {
    console.log('1. 🔍 分析失败的测试用例');
    console.log('2. 🛠️  修复发现的问题');
    console.log('3. 🔄 重新运行测试验证修复');
    console.log('4. 📋 更新测试用例覆盖更多场景');
  }
  
  console.log('\n' + '='.repeat(100));
}

// 主测试函数
async function runAllTests() {
  console.log(`${colors.blue}🚀 零碳园区数字孪生能碳管理系统 - 综合测试套件${colors.reset}`);
  console.log(`开始时间: ${new Date().toLocaleString()}\n`);
  
  // 检查服务依赖
  const serviceStatus = await checkDependencies();
  
  console.log(`\n${colors.cyan}📋 测试计划:${colors.reset}`);
  testSuites.forEach((suite, index) => {
    console.log(`${index + 1}. ${suite.name} - ${suite.description}`);
  });
  
  console.log(`\n${colors.cyan}开始执行测试套件...${colors.reset}`);
  
  // 执行所有测试套件
  overallResults.total = testSuites.length;
  
  for (let i = 0; i < testSuites.length; i++) {
    const suite = testSuites[i];
    const result = await runTestSuite(suite, serviceStatus);
    overallResults.suiteResults.push(result);
    
    // 测试间隔
    if (i < testSuites.length - 1) {
      console.log(`\n${colors.cyan}等待下一个测试...${colors.reset}`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // 生成综合报告
  generateOverallReport();
  
  // 根据结果退出
  if (overallResults.failed === 0 && overallResults.passed > 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// 显示使用帮助
function showHelp() {
  console.log(`${colors.blue}零碳园区数字孪生能碳管理系统 - 测试运行器${colors.reset}\n`);
  
  console.log('用法:');
  console.log('  node tests/run-all-tests.js [选项]\n');
  
  console.log('选项:');
  console.log('  --help, -h     显示此帮助信息');
  console.log('  --list, -l     列出所有可用的测试套件');
  console.log('  --suite <name> 只运行指定的测试套件\n');
  
  console.log('示例:');
  console.log('  node tests/run-all-tests.js                    # 运行所有测试');
  console.log('  node tests/run-all-tests.js --list             # 列出测试套件');
  console.log('  node tests/run-all-tests.js --suite api        # 只运行API测试\n');
  
  console.log('前置条件:');
  console.log('  1. 后端服务运行在端口 3001 (npm start)');
  console.log('  2. 前端服务运行在端口 3000 (cd frontend && npm start)');
  console.log('  3. 已安装 puppeteer (npm install puppeteer)');
}

// 列出测试套件
function listTestSuites() {
  console.log(`${colors.blue}可用的测试套件:${colors.reset}\n`);
  
  testSuites.forEach((suite, index) => {
    console.log(`${index + 1}. ${colors.cyan}${suite.name}${colors.reset}`);
    console.log(`   描述: ${suite.description}`);
    console.log(`   脚本: ${suite.script}`);
    console.log(`   依赖: ${suite.dependencies.join(', ')}`);
    console.log(`   超时: ${suite.timeout / 1000}秒`);
    if (suite.requiresPuppeteer) {
      console.log(`   需要: Puppeteer`);
    }
    console.log('');
  });
}

// 运行指定测试套件
async function runSpecificSuite(suiteName) {
  const suite = testSuites.find(s => 
    s.name.toLowerCase().includes(suiteName.toLowerCase()) ||
    s.script.toLowerCase().includes(suiteName.toLowerCase())
  );
  
  if (!suite) {
    console.log(`${colors.red}❌ 未找到测试套件: ${suiteName}${colors.reset}`);
    console.log('\n可用的测试套件:');
    testSuites.forEach(s => console.log(`  - ${s.name}`));
    process.exit(1);
  }
  
  console.log(`${colors.blue}🧪 运行指定测试套件: ${suite.name}${colors.reset}\n`);
  
  const serviceStatus = await checkDependencies();
  const result = await runTestSuite(suite, serviceStatus);
  
  console.log(`\n${colors.cyan}测试结果:${colors.reset}`);
  console.log(`套件: ${suite.name}`);
  console.log(`状态: ${result.status}`);
  if (result.duration) {
    console.log(`耗时: ${(result.duration / 1000).toFixed(2)}秒`);
  }
  
  process.exit(result.status === 'passed' ? 0 : 1);
}

// 命令行参数处理
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

if (args.includes('--list') || args.includes('-l')) {
  listTestSuites();
  process.exit(0);
}

const suiteIndex = args.findIndex(arg => arg === '--suite');
if (suiteIndex !== -1 && args[suiteIndex + 1]) {
  runSpecificSuite(args[suiteIndex + 1]);
} else {
  // 运行所有测试
  runAllTests();
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