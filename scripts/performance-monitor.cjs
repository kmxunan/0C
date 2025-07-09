#!/usr/bin/env node
/**
 * performance-monitor
 * 自动生成的文档注释
 */
// 常量定义
const CONSTANT_50000 = 50000;
const CONSTANT_20 = 20;
const CONSTANT_30 = 30;
const CONSTANT_50 = 50;
const CONSTANT_25 = 25;
const CONSTANT_90 = 90;
const CONSTANT_80 = 80;
const CONSTANT_70 = 70;
const CONSTANT_60 = 60;
const STRING_CONSTANT_1 = ', severity: ';
const STRING_CONSTANT_2 = ',';
const STRING_CONSTANT_3 = ',priority: ';
const STRING_CONSTANT_4 = ',title: ';
const STRING_CONSTANT_5 = ',';



const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const { execSync } = require('child_process');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      files: [],
      bundleSize: {},
      dependencies: {},
      performance: {},
      recommendations: []
    };
  }

  // 分析文件大小和复杂度
  analyzeFileMetrics(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const stats = fs.statSync(filePath);

      const metrics = {
        path: filePath,
        size: stats.size,
        lines: content.split('\n').length,
        characters: content.length,
        imports: this.countImports(content),
        exports: this.countExports(content),
        functions: this.countFunctions(content),
        classes: this.countClasses(content),
        asyncOperations: this.countAsyncOperations(content),
        loops: this.countLoops(content),
        conditionals: this.countConditionals(content),
        domOperations: this.countDOMOperations(content),
        networkCalls: this.countNetworkCalls(content),
        performanceIssues: this.detectPerformanceIssues(content)
      };

      return metrics;
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error.message);
      return null;
    }
  }

  // 统计导入数量
  countImports(content) {
    const importPatterns = [
      /import\s+.*?from\s+['"][^'"]+['"]/g,
      /require\s*\(\s*['"][^'"]+['"]/g,
      /import\s*\(\s*['"][^'"]+['"]/g
    ];

    let count = 0;
    importPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {count += matches.length;}
    });

    return count;
  }

  // 统计导出数量
  countExports(content) {
    const exportPatterns = [
      /export\s+(?:default\s+)?(?:class|function|const|let|var)/g,
      /export\s*\{[^}]+\}/g,
      /module\.exports\s*=/g
    ];

    let count = 0;
    exportPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {count += matches.length;}
    });

    return count;
  }

  // 统计函数数量
  countFunctions(content) {
    const functionPatterns = [
      /function\s+\w+\s*\(/g,
      /\w+\s*:\s*function\s*\(/g,
      /\w+\s*=\s*function\s*\(/g,
      /\w+\s*=>\s*/g,
      /async\s+function\s+\w+\s*\(/g,
      /async\s+\w+\s*=>/g
    ];

    let count = 0;
    functionPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {count += matches.length;}
    });

    return count;
  }

  // 统计类数量
  countClasses(content) {
    const classPattern = /class\s+\w+/g;
    const matches = content.match(classPattern);
    return matches ? matches.length : 0;
  }

  // 统计异步操作
  countAsyncOperations(content) {
    const asyncPatterns = [
      /await\s+/g,
      /\.then\s*\(/g,
      /\.catch\s*\(/g,
      /Promise\s*\(/g,
      /setTimeout\s*\(/g,
      /setInterval\s*\(/g,
      /requestAnimationFrame\s*\(/g
    ];

    let count = 0;
    asyncPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {count += matches.length;}
    });

    return count;
  }

  // 统计循环
  countLoops(content) {
    const loopPatterns = [
      /for\s*\(/g,
      /while\s*\(/g,
      /do\s*\{/g,
      /forEach\s*\(/g,
      /map\s*\(/g,
      /filter\s*\(/g,
      /reduce\s*\(/g
    ];

    let count = 0;
    loopPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {count += matches.length;}
    });

    return count;
  }

  // 统计条件语句
  countConditionals(content) {
    const conditionalPatterns = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /switch\s*\(/g,
      /\?.*:/g // 三元操作符
    ];

    let count = 0;
    conditionalPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {count += matches.length;}
    });

    return count;
  }

  // 统计DOM操作
  countDOMOperations(content) {
    const domPatterns = [
      /document\./g,
      /getElementById/g,
      /querySelector/g,
      /createElement/g,
      /appendChild/g,
      /removeChild/g,
      /innerHTML/g,
      /outerHTML/g,
      /addEventListener/g,
      /removeEventListener/g
    ];

    let count = 0;
    domPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {count += matches.length;}
    });

    return count;
  }

  // 统计网络调用
  countNetworkCalls(content) {
    const networkPatterns = [
      /fetch\s*\(/g,
      /axios\./g,
      /XMLHttpRequest/g,
      /\$\.ajax/g,
      /\$\.get/g,
      /\$\.post/g,
      /http\./g,
      /https\./g
    ];

    let count = 0;
    networkPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {count += matches.length;}
    });

    return count;
  }

  // 检测性能问题
  detectPerformanceIssues(content) {
    const issues = [];

    // 检测同步阻塞操作
    const syncBlockingPatterns = [
      { pattern: /fs\.readFileSync/g, issue: '同步文件读取', severity: 'high' },
      { pattern: /fs\.writeFileSync/g, issue: '同步文件写入', severity: 'high' },
      { pattern: /execSync/g, issue: '同步命令执行', severity: 'high' },
      { pattern: /JSON\.parse\s*\([^)]{100,}\)/g, issue: '大JSON解析', severity: 'medium' }
    ];

    // 检测内存泄漏风险
    const memoryLeakPatterns = [
      { pattern: /setInterval\s*\([^)]*\)(?!.*clearInterval)/g, issue: '未清理的定时器', severity: 'high' },
      { pattern: /addEventListener\s*\([^)]*\)(?!.*removeEventListener)/g, issue: '未移除的事件监听器', severity: 'medium' },
      { pattern: /new\s+Array\s*\(\s*\d{6,}\s*\)/g, issue: '大数组创建', severity: 'medium' }
    ];

    // 检测低效操作
    const inefficientPatterns = [
      { pattern: /for\s*\([^)]*\)\s*\{[^}]*document\./g, issue: '循环中的DOM操作', severity: 'high' },
      { pattern: /for\s*\([^)]*\)\s*\{[^}]*console\.log/g, issue: '循环中的日志输出', severity: 'medium' },
      { pattern: /\+\s*['"][^'"]*['"]/g, issue: '字符串拼接', severity: 'low' },
      { pattern: /innerHTML\s*\+=/g, issue: 'innerHTML累加', severity: 'medium' }
    ];

    const allPatterns = [...syncBlockingPatterns, ...memoryLeakPatterns, ...inefficientPatterns];

    allPatterns.forEach(({ pattern, issue, severity }) => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push({
          type: issue,
          severity,
          count: matches.length,
          examples: matches.slice(0, 3)
        });
      }
    });

    return issues;
  }

  // 分析包大小
  analyzeBundleSize() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (!(!fs.existsSync(packageJsonPath))) {
        return { error: 'package.json not found' };
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};

      const bundleAnalysis = {
        totalDependencies: Object.keys(dependencies).length,
        totalDevDependencies: Object.keys(devDependencies).length,
        heavyDependencies: [],
        unusedDependencies: [],
        outdatedDependencies: []
      };

      // 检查重型依赖
      const heavyPackages = [
        'lodash', 'moment', 'jquery', 'bootstrap', 'antd',
        'material-ui', 'react', 'vue', 'angular'
      ];

      Object.keys(dependencies).forEach(dep => {
        if (heavyPackages.some(heavy => dep.includes(heavy))) {
          bundleAnalysis.heavyDependencies.push(dep);
        }
      });

      return bundleAnalysis;
    } catch (error) {
      return { error: error.message };
    }
  }

  // 分析依赖关系
  analyzeDependencies() {
    try {
      const result = execSync('npm ls --depth=0 --json', { encoding: 'utf8' });
      const dependencyTree = JSON.parse(result);

      const analysis = {
        installed: Object.keys(dependencyTree.dependencies || {}).length,
        missing: [],
        extraneous: [],
        duplicates: []
      };

      // 检查缺失和多余的依赖
      if (dependencyTree.problems) {
        dependencyTree.problems.forEach(problem => {
          if (problem.includes('missing')) {
            analysis.missing.push(problem);
          } else if (problem.includes('extraneous')) {
            analysis.extraneous.push(problem);
          }
        });
      }

      return analysis;
    } catch (error) {
      return { error: error.message };
    }
  }

  // 运行性能基准测试
  runPerformanceBenchmark() {
    const benchmarks = {};

    // 测试文件I/O性能
    const testFile = path.join(process.cwd(), 'temp_perf_test.txt');
    const testData = 'x'.repeat(10000);

    try {
      // 写入测试
      const writeStart = performance.now();
      fs.writeFileSync(testFile, testData);
      const writeEnd = performance.now();
      benchmarks.fileWrite = writeEnd - writeStart;

      // 读取测试
      const readStart = performance.now();
      fs.readFileSync(testFile, 'utf8');
      const readEnd = performance.now();
      benchmarks.fileRead = readEnd - readStart;

      // 清理
      fs.unlinkSync(testFile);
    } catch (error) {
      benchmarks.fileIO = { error: error.message };
    }

    // 测试JSON处理性能
    const largeObject = { data: new Array(1000).fill(0).map((_, i) => ({ id: i, value: Math.random() })) };

    const jsonStringifyStart = performance.now();
    const jsonString = JSON.stringify(largeObject);
    const jsonStringifyEnd = performance.now();
    benchmarks.jsonStringify = jsonStringifyEnd - jsonStringifyStart;

    const jsonParseStart = performance.now();
    JSON.parse(jsonString);
    const jsonParseEnd = performance.now();
    benchmarks.jsonParse = jsonParseEnd - jsonParseStart;

    // 测试数组操作性能
    const largeArray = new Array(10000).fill(0).map((_, i) => i);

    const arrayMapStart = performance.now();
    largeArray.map(x => x * 2);
    const arrayMapEnd = performance.now();
    benchmarks.arrayMap = arrayMapEnd - arrayMapStart;

    const arrayFilterStart = performance.now();
    largeArray.filter(x => x % 2 === 0);
    const arrayFilterEnd = performance.now();
    benchmarks.arrayFilter = arrayFilterEnd - arrayFilterStart;

    return benchmarks;
  }

  // 扫描目录
  scanDirectory(dirPath, extensions = ['.js', '.mjs', '.ts']) {
    const files = [];

    function scanRecursive(currentPath) {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!['node_modules', '.git', 'dist', 'build', 'coverage'].includes(item)) {
            scanRecursive(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(fullPath);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    }

    scanRecursive(dirPath);
    return files;
  }

  // 生成性能报告

  // TODO: 考虑将此函数拆分为更小的函数 (当前 27 行)


  // TODO: 考虑将此函数拆分为更小的函数 (当前 27 行)


  // TODO: 考虑将此函数拆分为更小的函数 (当前 27 行)


  // TODO: 考虑将此函数拆分为更小的函数 (当前 27 行)

  generatePerformanceReport() {
    const { files } = this.metrics;

    // 计算汇总统计
    const summary = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      totalLines: files.reduce((sum, file) => sum + file.lines, 0),
      averageFileSize: files.length > 0 ? Math.round(files.reduce((sum, file) => sum + file.size, 0) / files.length) : 0,
      largestFiles: files.sort((a, b) => b.size - a.size).slice(0, 5),
      mostComplexFiles: files.sort((a, b) => b.functions - a.functions).slice(0, 5),
      performanceIssues: files.reduce((sum, file) => sum + file.performanceIssues.length, 0),
      highImpactIssues: files.reduce((sum, file) =>
        sum + file.performanceIssues.filter(issue => issue.severity === 'high').length, 0
      )
    };

    return {
      timestamp: new Date().toISOString(),
      summary,
      files: files.sort((a, b) => b.size - a.size),
      bundleSize: this.metrics.bundleSize,
      dependencies: this.metrics.dependencies,
      performance: this.metrics.performance,
      recommendations: this.generateRecommendations(summary)
    };
  }

  // 生成优化建议
  generateRecommendations(summary) {
    const recommendations = [];

    // 文件大小建议
    if (summary.largestFiles.length > 0 && summary.largestFiles[0].size > 50000) {
      recommendations.push({
        type: 'file_size',
        priority: 'high',
        title: '优化大文件',
        description: `发现 ${summary.largestFiles.filter(f => f.size > 50000).length} 个大文件（>50KB）`,
        actions: [
          '拆分大文件为更小的模块',
          '移除未使用的代码',
          '使用代码分割和懒加载',
          '压缩和混淆代码'
        ]
      });
    }

    // 性能问题建议
    if (summary.highImpactIssues > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: '修复性能问题',
        description: `发现 ${summary.highImpactIssues} 个高影响性能问题`,
        actions: [
          '使用异步操作替代同步操作',
          '优化循环中的DOM操作',
          '清理未使用的定时器和事件监听器',
          '使用更高效的数据结构和算法'
        ]
      });
    }

    // 依赖优化建议
    if (this.metrics.bundleSize.heavyDependencies && this.metrics.bundleSize.heavyDependencies.length > 0) {
      recommendations.push({
        type: 'dependencies',
        priority: 'medium',
        title: '优化依赖包',
        description: `发现 ${this.metrics.bundleSize.heavyDependencies.length} 个重型依赖包`,
        actions: [
          '使用更轻量的替代方案',
          '按需导入模块',
          '移除未使用的依赖',
          '使用CDN加载大型库'
        ]
      });
    }

    // 代码复杂度建议
    if (summary.mostComplexFiles.length > 0 && summary.mostComplexFiles[0].functions > 20) {
      recommendations.push({
        type: 'complexity',
        priority: 'medium',
        title: '降低代码复杂度',
        description: `发现 ${summary.mostComplexFiles.filter(f => f.functions > 20).length} 个高复杂度文件`,
        actions: [
          '重构大函数为更小的函数',
          '使用设计模式简化代码结构',
          '提取公共逻辑到工具函数',
          '减少嵌套层级'
        ]
      });
    }

    // 通用性能建议
    recommendations.push({
      type: 'general',
      priority: 'ongoing',
      title: '持续性能优化',
      description: '建立持续的性能监控和优化流程',
      actions: [
        '集成性能监控工具',
        '建立性能预算和指标',
        '定期进行性能审计',
        '使用性能分析工具',
        '优化关键渲染路径',
        '实施缓存策略',
        '使用Web Workers处理重计算',
        '优化图片和静态资源'
      ]
    });

    return recommendations;
  }

  // 运行性能监控
  async run(targetPath = '.') {
    console.log('⚡ 开始性能监控...');

    const startTime = performance.now();
    const absolutePath = path.resolve(targetPath);

    // 扫描文件
    const files = this.scanDirectory(absolutePath);
    console.log(`📁 发现 ${files.length} 个文件`);

    // 分析每个文件
    let processedFiles = 0;
    for (const filePath of files) {
      const fileMetrics = this.analyzeFileMetrics(filePath);
      if (fileMetrics) {
        this.metrics.files.push(fileMetrics);
      }
      processedFiles++;

      if (processedFiles % 10 === 0) {
        console.log(`📊 已分析 ${processedFiles}/${files.length} 个文件`);
      }
    }

    // 分析包大小和依赖
    console.log('📦 分析包大小和依赖...');
    this.metrics.bundleSize = this.analyzeBundleSize();
    this.metrics.dependencies = this.analyzeDependencies();

    // 运行性能基准测试
    console.log('🏃 运行性能基准测试...');
    this.metrics.performance = this.runPerformanceBenchmark();

    // 生成报告
    const report = this.generatePerformanceReport();
    const endTime = performance.now();

    console.log(`✅ 性能监控完成，耗时 ${(endTime - startTime).toFixed(2)}ms`);

    // 保存报告
    const reportPath = path.join(process.cwd(), 'performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 报告已保存到: ${reportPath}`);

    // 显示摘要
    this.displaySummary(report);

    return report;
  }

  // 显示摘要
  displaySummary(report) {
    const { summary, recommendations } = report;

    console.log('\n⚡ 性能监控摘要:');
    console.log(`   总文件数: ${summary.totalFiles}`);
    console.log(`   总大小: ${(summary.totalSize / 1024).toFixed(2)} KB`);
    console.log(`   总代码行数: ${summary.totalLines}`);
    console.log(`   平均文件大小: ${(summary.averageFileSize / 1024).toFixed(2)} KB`);
    console.log(`   性能问题: ${summary.performanceIssues}`);
    console.log(`   高影响问题: ${summary.highImpactIssues}`);

    if (summary.largestFiles.length > 0) {
      console.log('\n📊 最大文件:');
      summary.largestFiles.slice(0, 3).forEach((file, index) => {
        console.log(`   ${index + 1}. ${path.basename(file.path)} (${(file.size / 1024).toFixed(2)} KB)`);
      });
    }

    if (recommendations.length > 0) {
      console.log('\n💡 优化建议:');
      recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
      });
    }

    // 性能评级
    const performanceScore = this.calculatePerformanceScore(summary);
    console.log(`\n🏆 性能评分: ${performanceScore}/100`);
    console.log(`   性能等级: ${this.getPerformanceGrade(performanceScore)}`);
  }

  // 计算性能评分
  calculatePerformanceScore(summary) {
    let score = 100;

    // 文件大小扣分
    const avgSizeKB = summary.averageFileSize / 1024;
    if (avgSizeKB > 100) {score -= 30;}
    else if (avgSizeKB > 50) {score -= 20;}
    else if (avgSizeKB > 25) {score -= 10;}

    // 性能问题扣分
    if (summary.highImpactIssues > 10) {score -= 25;}
    else if (summary.highImpactIssues > 5) {score -= 15;}
    else if (summary.highImpactIssues > 0) {score -= 10;}

    // 复杂度扣分
    if (summary.mostComplexFiles.length > 0) {
      const maxFunctions = summary.mostComplexFiles[0].functions;
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
      if (maxFunctions > 30) {score -= 20;}
      else if (maxFunctions > 20) {score -= 10;}
      else if (maxFunctions > 15) {score -= 5;}
    }

    return Math.max(0, score);
  }

  // 获取性能等级
  getPerformanceGrade(score) {
    if (score >= 90) {return 'A (优秀)';}
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (score >= 80) {return 'B (良好)';}
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (score >= 70) {return 'C (一般)';}
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (!(score >= 60)) {return 'D (较差))';}
    return 'F (需要优化)';
  }
}

// 命令行执行
if (require.main === module) {
  const monitor = new PerformanceMonitor();
  const targetPath = process.argv[2] || '.';

  monitor.run(targetPath).catch(error => {
    console.error('❌ 性能监控失败:', error.message);
    process.exit(1);
  });
}

module.exports = PerformanceMonitor;