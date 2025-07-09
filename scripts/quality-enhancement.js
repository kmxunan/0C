#!/usr/bin/env node
/* eslint-disable no-console, no-magic-numbers */

/**
 * 代码质量提升自动化脚本
 * 执行各种代码质量检查和改进任务
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// 导入新的分析工具
import ComplexityAnalyzer from './complexity-analyzer.js';
import SecurityAuditor from './security-auditor.js';
import PerformanceMonitor from './performance-monitor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 简单的颜色输出函数
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
};

class QualityEnhancer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.results = {
      tests: { passed: 0, failed: 0, coverage: 0 },
      lint: { errors: 0, warnings: 0 },
      security: { vulnerabilities: 0 },
      performance: { score: 0 },
      complexity: { average: 0, max: 0 },
    };
  }

  /**
   * 执行所有质量检查
   */
  async runAll() {
    console.log(colors.blue('🚀 开始代码质量提升检查...\n'));

    try {
      await this.runTests();
      await this.runLinting();
      await this.runSecurityAudit();
      await this.analyzeComplexity();
      await this.checkDependencies();
      await this.runPerformanceMonitoring();
      await this.generateReport();

      console.log(colors.green('✅ 所有质量检查完成!'));
    } catch (error) {
      console.error(colors.red('❌ 质量检查过程中出现错误:'), error.message);
      process.exit(1);
    }
  }

  /**
   * 运行测试并收集覆盖率
   */
  async runTests() {
    console.log(colors.yellow('📋 运行测试套件...'));

    try {
      // 运行单元测试
      const testOutput = execSync(
        'npx jest --config jest.simple.config.js tests/unit/ --coverage --json',
        {
          cwd: this.projectRoot,
          encoding: 'utf8',
        }
      );

      const testResults = JSON.parse(testOutput);
      this.results.tests.passed = testResults.numPassedTests;
      this.results.tests.failed = testResults.numFailedTests;

      if (testResults.coverageMap) {
        // 计算平均覆盖率
        const coverage =
          (Object.values(testResults.coverageMap).reduce(
            (acc, file) =>
              acc +
              (file.s
                ? Object.values(file.s).filter(Boolean).length / Object.keys(file.s).length
                : 0),
            0
          ) /
            Object.keys(testResults.coverageMap).length) *
          100;

        this.results.tests.coverage = Math.round(coverage);
      }

      console.log(colors.green(`  ✓ 测试通过: ${this.results.tests.passed}`));
      console.log(colors.red(`  ✗ 测试失败: ${this.results.tests.failed}`));
      console.log(colors.blue(`  📊 代码覆盖率: ${this.results.tests.coverage}%`));
    } catch (error) {
      console.log(colors.red('  ❌ 测试执行失败'));
      this.results.tests.failed = 1;
    }
  }

  /**
   * 运行代码检查
   */
  async runLinting() {
    console.log(colors.yellow('\n🔍 运行代码检查...'));

    try {
      // 使用质量配置进行检查
      const lintOutput = execSync('npx eslint . --config .eslintrc.quality.cjs --format json', {
        cwd: this.projectRoot,
        encoding: 'utf8',
      });

      const lintResults = JSON.parse(lintOutput);
      this.results.lint.errors = lintResults.reduce((acc, file) => acc + file.errorCount, 0);
      this.results.lint.warnings = lintResults.reduce((acc, file) => acc + file.warningCount, 0);

      console.log(colors.red(`  ❌ 错误: ${this.results.lint.errors}`));
      console.log(colors.yellow(`  ⚠️  警告: ${this.results.lint.warnings}`));

      // 如果有错误，尝试自动修复
      if (this.results.lint.errors > 0 || this.results.lint.warnings > 0) {
        console.log(colors.yellow('  🔧 尝试自动修复...'));
        try {
          execSync('npx eslint . --config .eslintrc.quality.cjs --fix', {
            cwd: this.projectRoot,
            encoding: 'utf8',
          });

          // 运行Prettier格式化
          execSync('npx prettier --write . --config .prettierrc.quality.json', {
            cwd: this.projectRoot,
            encoding: 'utf8',
          });

          console.log(colors.green('  ✅ 代码问题已自动修复'));
        } catch (fixError) {
          console.log(colors.yellow('  ⚠️  部分问题无法自动修复'));
        }
      }
    } catch (error) {
      console.log(colors.red('  ❌ 代码检查失败'));
      this.results.lint.errors = 1;
    }
  }

  /**
   * 运行安全审计
   */
  async runSecurityAudit() {
    console.log(colors.yellow('\n🔒 运行安全审计...'));

    try {
      // 运行npm audit
      const auditOutput = execSync('npm audit --json', {
        cwd: this.projectRoot,
        encoding: 'utf8',
      });

      const auditResults = JSON.parse(auditOutput);
      this.results.security.vulnerabilities = auditResults.metadata?.vulnerabilities?.total || 0;

      console.log(colors.red(`  🚨 npm安全漏洞: ${this.results.security.vulnerabilities}`));

      // 运行自定义安全审计
      try {
        const securityAuditor = new SecurityAuditor();
        const securityReport = await securityAuditor.run(this.projectRoot);
        this.results.security.customAudit = securityReport;

        console.log(colors.blue('  🔍 自定义安全检查完成'));
        console.log(colors.blue(`  📊 安全评分: ${securityReport.summary.securityScore}/100`));
      } catch (customError) {
        console.log(colors.yellow('  ⚠️  自定义安全审计失败'));
      }
    } catch (error) {
      console.log(colors.yellow('  ⚠️  安全审计完成 (可能存在漏洞)'));
    }
  }

  /**
   * 分析代码复杂度
   */
  async analyzeComplexity() {
    console.log(colors.yellow('\n📈 分析代码复杂度...'));

    try {
      // 使用新的复杂度分析器
      const complexityAnalyzer = new ComplexityAnalyzer();
      const complexityReport = await complexityAnalyzer.run(this.projectRoot);

      this.results.complexity.average = complexityReport.summary.averageComplexity;
      this.results.complexity.max = complexityReport.summary.maxComplexity;
      this.results.complexity.report = complexityReport;

      console.log(colors.blue(`  📊 平均复杂度: ${this.results.complexity.average}`));
      console.log(colors.blue(`  📊 最大复杂度: ${this.results.complexity.max}`));
      console.log(
        colors.blue(`  🔍 高复杂度文件: ${complexityReport.summary.highComplexityFiles.length}`)
      );
    } catch (error) {
      console.log(colors.red('  ❌ 复杂度分析失败'));
      // 回退到简化的复杂度分析
      try {
        const sourceFiles = this.getSourceFiles();
        let totalComplexity = 0;
        let maxComplexity = 0;
        let fileCount = 0;

        sourceFiles.forEach((file) => {
          const content = fs.readFileSync(file, 'utf8');
          const complexity = this.calculateComplexity(content);
          totalComplexity += complexity;
          maxComplexity = Math.max(maxComplexity, complexity);
          fileCount++;
        });

        this.results.complexity.average = Math.round(totalComplexity / fileCount);
        this.results.complexity.max = maxComplexity;

        console.log(colors.blue(`  📊 平均复杂度: ${this.results.complexity.average}`));
        console.log(colors.blue(`  📊 最大复杂度: ${this.results.complexity.max}`));
      } catch (fallbackError) {
        console.log(colors.red('  ❌ 复杂度分析完全失败'));
      }
    }
  }

  /**
   * 检查依赖项
   */
  async checkDependencies() {
    console.log(colors.yellow('\n📦 检查依赖项...'));

    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8')
      );
      const dependencies = Object.keys(packageJson.dependencies || {});
      const devDependencies = Object.keys(packageJson.devDependencies || {});

      console.log(colors.blue(`  📦 生产依赖: ${dependencies.length}`));
      console.log(colors.blue(`  🔧 开发依赖: ${devDependencies.length}`));

      // 检查过时的依赖
      try {
        const outdatedOutput = execSync('npm outdated --json', {
          cwd: this.projectRoot,
          encoding: 'utf8',
        });
        const outdated = JSON.parse(outdatedOutput || '{}');

        if (Object.keys(outdated).length > 0) {
          console.log(colors.yellow(`  ⚠️  过时依赖: ${Object.keys(outdated).length}`));
          Object.keys(outdated)
            .slice(0, 3)
            .forEach((pkg) => {
              console.log(
                colors.yellow(`    - ${pkg}: ${outdated[pkg].current} → ${outdated[pkg].latest}`)
              );
            });
        } else {
          console.log(colors.green('  ✅ 所有依赖都是最新的'));
        }
      } catch (error) {
        console.log(colors.green('  ✅ 所有依赖都是最新的'));
      }
    } catch (error) {
      console.log(colors.red('  ❌ 依赖检查失败'));
    }
  }

  /**
   * 运行性能监控
   */
  async runPerformanceMonitoring() {
    console.log(colors.yellow('\n⚡ 运行性能监控...'));

    try {
      const performanceMonitor = new PerformanceMonitor();
      const performanceReport = await performanceMonitor.run(this.projectRoot);

      this.results.performance = {
        score: performanceReport.summary.performanceScore,
        issues: performanceReport.summary.highImpactIssues,
        report: performanceReport,
      };

      console.log(colors.blue(`  📊 性能评分: ${performanceReport.summary.performanceScore}/100`));
      console.log(colors.blue(`  🚨 高影响问题: ${performanceReport.summary.highImpactIssues}`));
    } catch (error) {
      console.log(colors.red('  ❌ 性能监控失败'));
      this.results.performance = { score: 0, issues: 0 };
    }
  }

  /**
   * 生成质量报告
   */

  // TODO: 考虑将此函数拆分为更小的函数 (当前 23 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 23 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 23 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 23 行)

  async generateReport() {
    console.log(colors.yellow('\n📊 生成质量报告...'));

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        overallScore: this.calculateOverallScore(),
        recommendations: this.generateRecommendations(),
      },
      details: this.results,
    };

    // 保存报告
    const reportPath = path.join(this.projectRoot, 'reports', 'quality-enhancement-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // 生成 HTML 报告
    this.generateHtmlReport(report);

    console.log(colors.green(`  ✅ 报告已生成: ${reportPath}`));
    console.log(colors.blue('  🌐 HTML 报告: reports/quality-enhancement-report.html'));
  }

  /**
   * 计算总体质量分数
   */
  calculateOverallScore() {
    const score = 100;

    // 测试分数 (30%)
    const testScore = this.results.tests.failed === 0 ? 30 : 0;
    const coverageScore = (this.results.tests.coverage / 100) * 15;

    // 代码质量分数 (25%)
    const lintScore =
      this.results.lint.errors === 0 ? 25 : Math.max(0, 25 - this.results.lint.errors * 5);

    // 安全分数 (20%)
    let securityScore =
      this.results.security.vulnerabilities === 0
        ? 20
        : Math.max(0, 20 - this.results.security.vulnerabilities * 2);
    if (this.results.security.customAudit) {
      securityScore = Math.min(
        securityScore,
        this.results.security.customAudit.summary.securityScore / 5
      );
    }

    // 复杂度分数 (15%)
    const complexityScore =
      this.results.complexity.average <= 10
        ? 15
        : Math.max(0, 15 - (this.results.complexity.average - 10));

    // 性能分数 (10%)
    const performanceScore = this.results.performance
      ? (this.results.performance.score / 100) * 10
      : 0;

    return Math.round(
      testScore + coverageScore + lintScore + securityScore + complexityScore + performanceScore
    );
  }

  /**
   * 生成改进建议
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.results.tests.failed > 0) {
      recommendations.push('修复失败的测试用例');
    }

    if (this.results.tests.coverage < 80) {
      recommendations.push('提高测试覆盖率至80%以上');
    }

    if (this.results.lint.errors > 0) {
      recommendations.push('修复ESLint错误');
    }

    if (this.results.lint.warnings > 10) {
      recommendations.push('减少ESLint警告');
    }

    if (this.results.security.vulnerabilities > 0) {
      recommendations.push('修复npm安全漏洞');
    }

    if (
      this.results.security.customAudit &&
      this.results.security.customAudit.summary.securityScore < 80
    ) {
      recommendations.push('改进代码安全性');
    }

    if (this.results.complexity.average > 10) {
      recommendations.push('降低代码复杂度');
    }

    if (
      this.results.complexity.report &&
      this.results.complexity.report.summary.highComplexityFiles.length > 5
    ) {
      recommendations.push('重构高复杂度文件');
    }

    if (this.results.performance && this.results.performance.score < 70) {
      recommendations.push('优化代码性能');
    }

    if (this.results.performance && this.results.performance.issues > 10) {
      recommendations.push('修复高影响性能问题');
    }

    if (recommendations.length === 0) {
      recommendations.push('代码质量良好，继续保持!');
    }

    return recommendations;
  }

  // TODO: 考虑将此函数拆分为更小的函数 (当前 73 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 73 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 73 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 73 行)

  /**
   * 生成 HTML 报告
   */
  generateHtmlReport(report) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>代码质量提升报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .score { font-size: 48px; font-weight: bold; color: ${report.summary.overallScore >= 80 ? '#4CAF50' : report.summary.overallScore >= 60 ? '#FF9800' : '#F44336'}; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .recommendations { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .recommendations ul { margin: 10px 0; }
        .timestamp { text-align: center; color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>代码质量提升报告</h1>
            <div class="score">${report.summary.overallScore}/100</div>
            <p>总体质量评分</p>
        </div>
        
        <div class="metrics">
            <div class="metric">
                <h3>🧪 测试结果</h3>
                <p>通过: ${report.details.tests.passed}</p>
                <p>失败: ${report.details.tests.failed}</p>
                <p>覆盖率: ${report.details.tests.coverage}%</p>
            </div>
            
            <div class="metric">
                <h3>🔍 代码检查</h3>
                <p>错误: ${report.details.lint.errors}</p>
                <p>警告: ${report.details.lint.warnings}</p>
            </div>
            
            <div class="metric">
                <h3>🔒 安全审计</h3>
                <p>漏洞: ${report.details.security.vulnerabilities}</p>
            </div>
            
            <div class="metric">
                <h3>📈 代码复杂度</h3>
                <p>平均: ${report.details.complexity.average}</p>
                <p>最大: ${report.details.complexity.max}</p>
            </div>
        </div>
        
        <div class="recommendations">
            <h3>💡 改进建议</h3>
            <ul>
                ${report.summary.recommendations.map((rec) => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        
        <div class="timestamp">
            <p>报告生成时间: ${new Date(report.timestamp).toLocaleString('zh-CN')}</p>
        </div>
    </div>
</body>
</html>
    `;

    const htmlPath = path.join(this.projectRoot, 'reports', 'quality-enhancement-report.html');
    fs.writeFileSync(htmlPath, htmlContent);
  }

  /**
   * 获取源代码文件列表
   */
  getSourceFiles() {
    const files = [];
    const searchDirs = ['src', 'backend'];

    searchDirs.forEach((dir) => {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        this.walkDir(dirPath, files);
      }
    });

    return files.filter((file) => file.endsWith('.js') || file.endsWith('.ts'));
  }

  /**
   * 递归遍历目录
   */
  walkDir(dir, files) {
    const items = fs.readdirSync(dir);

    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        this.walkDir(fullPath, files);
      } else {
        files.push(fullPath);
      }
    });
  }

  /**
   * 简单的复杂度计算
   */
  calculateComplexity(content) {
    // 简化的圈复杂度计算
    const patterns = [
      /if\s*\(/g,
      /else\s*if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /switch\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /&&/g,
      /\|\|/g,
      /\?/g,
    ];

    let complexity = 1; // 基础复杂度

    patterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }
}

// TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

// TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

// TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

// TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

// 命令行执行
if (import.meta.url === `file://${process.argv[1]}`) {
  const enhancer = new QualityEnhancer();
  const command = process.argv[2];

  switch (command) {
    case 'test':
      enhancer.runTests().catch(console.error);
      break;
    case 'lint':
      enhancer.runLinting().catch(console.error);
      break;
    case 'security':
      enhancer.runSecurityAudit().catch(console.error);
      break;
    case 'complexity':
      enhancer.analyzeComplexity().catch(console.error);
      break;
    case 'performance':
      enhancer.runPerformanceMonitoring().catch(console.error);
      break;
    case 'all':
    default:
      enhancer.runAll().catch(console.error);
      break;
  }
}

export default QualityEnhancer;
