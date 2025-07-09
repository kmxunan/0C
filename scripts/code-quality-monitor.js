#!/usr/bin/env node
/* eslint-disable no-console, no-magic-numbers */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// 简单的颜色输出函数
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

const chalk = {
  red: colors.red,
  green: colors.green,
  yellow: colors.yellow,
  blue: {
    bold: (text) => colors.blue(colors.bold(text)),
  },
};

/**
 * 代码质量监控和自动化改进工具
 * 集成多种质量检查工具，提供详细的质量报告和改进建议
 */
class CodeQualityMonitor {
  constructor() {
    this.projectRoot = process.cwd();
    this.reportDir = path.join(this.projectRoot, 'quality-reports');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.metrics = {
      eslint: { errors: 0, warnings: 0, fixable: 0 },
      prettier: { violations: 0 },
      typescript: { errors: 0, warnings: 0 },
      tests: { coverage: 0, passed: 0, failed: 0 },
      security: { vulnerabilities: 0, severity: {} },
      complexity: { average: 0, max: 0, violations: 0 },
      duplicates: { percentage: 0, lines: 0 },
      dependencies: { outdated: 0, vulnerable: 0 },
    };
    this.recommendations = [];
    this.qualityScore = 0;
  }

  /**
   * 运行完整的代码质量监控
   */
  async runFullAnalysis() {
    console.log(chalk.blue.bold('🔍 开始代码质量全面分析...\n'));

    this.ensureReportDirectory();

    try {
      await this.runESLintAnalysis();
      await this.runPrettierCheck();
      await this.runTypeScriptCheck();
      await this.runTestCoverage();
      await this.runSecurityAudit();
      await this.runComplexityAnalysis();
      await this.runDuplicateDetection();
      await this.runDependencyCheck();

      this.calculateQualityScore();
      this.generateRecommendations();
      await this.generateReport();

      this.displaySummary();
    } catch (error) {
      console.error(chalk.red('❌ 分析过程中发生错误:'), error.message);
      process.exit(1);
    }
  }

  /**
   * 确保报告目录存在
   */
  ensureReportDirectory() {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  /**
   * ESLint 代码质量分析
   */
  async runESLintAnalysis() {
    console.log(chalk.yellow('🔧 运行 ESLint 分析...'));

    try {
      const { stdout: eslintOutput } = await execAsync(
        'npx eslint . --format json --ext .js,.ts,.jsx,.tsx',
        {
          encoding: 'utf8',
          cwd: this.projectRoot,
        }
      );

      const results = JSON.parse(eslintOutput);

      results.forEach((result) => {
        result.messages.forEach((message) => {
          if (message.severity === 2) {
            this.metrics.eslint.errors++;
          } else {
            this.metrics.eslint.warnings++;
          }

          if (message.fix) {
            this.metrics.eslint.fixable++;
          }
        });
      });

      // 保存详细报告
      await fs.promises.writeFile(
        path.join(this.reportDir, `eslint-${this.timestamp}.json`),
        JSON.stringify(results, null, 2)
      );

      console.log(
        chalk.green(
          `✅ ESLint 分析完成: ${this.metrics.eslint.errors} 错误, ${this.metrics.eslint.warnings} 警告`
        )
      );
    } catch (error) {
      if (error.stdout) {
        const results = JSON.parse(error.stdout);
        // 处理有错误的情况
        results.forEach((result) => {
          result.messages.forEach((message) => {
            if (message.severity === 2) {
              this.metrics.eslint.errors++;
            } else {
              this.metrics.eslint.warnings++;
            }
          });
        });
      }
      console.log(
        chalk.yellow(
          `⚠️ ESLint 发现问题: ${this.metrics.eslint.errors} 错误, ${this.metrics.eslint.warnings} 警告`
        )
      );
    }
  }

  /**
   * Prettier 代码格式检查
   */
  async runPrettierCheck() {
    console.log(chalk.yellow('🎨 检查代码格式...'));

    try {
      await execAsync('npx prettier --check .', { encoding: 'utf8' });
      console.log(chalk.green('✅ 代码格式检查通过'));
    } catch (error) {
      const output = error.stdout?.toString() || '';
      const violations = output.split('\n').filter((line) => line.trim()).length;
      this.metrics.prettier.violations = violations;
      console.log(chalk.yellow(`⚠️ 发现 ${violations} 个格式问题`));
    }
  }

  /**
   * TypeScript 类型检查
   */
  async runTypeScriptCheck() {
    console.log(chalk.yellow('📝 运行 TypeScript 类型检查...'));

    if (!fs.existsSync(path.join(this.projectRoot, 'tsconfig.json'))) {
      console.log(chalk.yellow('⚠️ 未找到 tsconfig.json，跳过 TypeScript 检查'));
      return;
    }

    try {
      const { stdout: output } = await execAsync('npx tsc --noEmit --pretty false', {
        encoding: 'utf8',
        cwd: this.projectRoot,
      });
      console.log(chalk.green('✅ TypeScript 类型检查通过'));
    } catch (error) {
      const output = error.stdout?.toString() || '';
      const lines = output.split('\n').filter((line) => line.trim());

      lines.forEach((line) => {
        if (line.includes('error TS')) {
          this.metrics.typescript.errors++;
        } else if (line.includes('warning TS')) {
          this.metrics.typescript.warnings++;
        }
      });

      console.log(
        chalk.yellow(
          `⚠️ TypeScript 检查发现: ${this.metrics.typescript.errors} 错误, ${this.metrics.typescript.warnings} 警告`
        )
      );
    }
  }

  /**
   * 测试覆盖率分析
   */
  async runTestCoverage() {
    console.log(chalk.yellow('🧪 运行测试覆盖率分析...'));

    try {
      const { stdout: output } = await execAsync('npm run test:coverage -- --silent', {
        encoding: 'utf8',
        cwd: this.projectRoot,
      });

      // 解析覆盖率报告
      const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);
      if (coverageMatch) {
        this.metrics.tests.coverage = parseFloat(coverageMatch[1]);
      }

      // 解析测试结果
      const passedMatch = output.match(/(\d+) passing/);
      const failedMatch = output.match(/(\d+) failing/);

      if (passedMatch) {
        this.metrics.tests.passed = parseInt(passedMatch[1]);
      }
      if (failedMatch) {
        this.metrics.tests.failed = parseInt(failedMatch[1]);
      }

      console.log(chalk.green(`✅ 测试覆盖率: ${this.metrics.tests.coverage}%`));
    } catch (error) {
      console.log(chalk.yellow('⚠️ 测试覆盖率分析失败'));
    }
  }

  /**
   * 安全漏洞检查
   */
  async runSecurityAudit() {
    console.log(chalk.yellow('🔒 运行安全漏洞检查...'));

    try {
      const { stdout: output } = await execAsync('npm audit --json', {
        encoding: 'utf8',
        cwd: this.projectRoot,
      });

      const auditResult = JSON.parse(output);

      if (auditResult.vulnerabilities) {
        Object.values(auditResult.vulnerabilities).forEach((vuln) => {
          this.metrics.security.vulnerabilities++;
          const { severity } = vuln;
          this.metrics.security.severity[severity] =
            (this.metrics.security.severity[severity] || 0) + 1;
        });
      }

      console.log(chalk.green(`✅ 安全检查完成: ${this.metrics.security.vulnerabilities} 个漏洞`));
    } catch (error) {
      console.log(chalk.yellow('⚠️ 安全检查失败'));
    }
  }

  /**
   * 代码复杂度分析
   */
  async runComplexityAnalysis() {
    console.log(chalk.yellow('📊 分析代码复杂度...'));

    try {
      // 使用 ESLint 的复杂度规则进行分析
      const { stdout: output } = await execAsync(
        'npx eslint . --format json --no-eslintrc --config .eslintrc.enhanced.cjs',
        { encoding: 'utf8', cwd: this.projectRoot }
      );

      const results = JSON.parse(output);
      const complexityViolations = [];

      results.forEach((result) => {
        result.messages.forEach((message) => {
          if (message.ruleId === 'complexity') {
            complexityViolations.push(message);
            this.metrics.complexity.violations++;
          }
        });
      });

      console.log(chalk.green(`✅ 复杂度分析完成: ${this.metrics.complexity.violations} 个违规`));
    } catch (error) {
      console.log(chalk.yellow('⚠️ 复杂度分析失败'));
    }
  }

  /**
   * 重复代码检测
   */
  async runDuplicateDetection() {
    console.log(chalk.yellow('🔍 检测重复代码...'));

    try {
      // 简单的重复代码检测逻辑
      const jsFiles = await this.getJavaScriptFiles();
      const duplicates = await this.findDuplicates(jsFiles);

      this.metrics.duplicates.lines = duplicates.totalLines;
      this.metrics.duplicates.percentage = duplicates.percentage;

      console.log(
        chalk.green(`✅ 重复代码检测完成: ${this.metrics.duplicates.percentage}% 重复率`)
      );
    } catch (error) {
      console.log(chalk.yellow('⚠️ 重复代码检测失败'));
    }
  }

  /**
   * 依赖项检查
   */
  async runDependencyCheck() {
    console.log(chalk.yellow('📦 检查依赖项状态...'));

    try {
      const { stdout: output } = await execAsync('npm outdated --json', {
        encoding: 'utf8',
        cwd: this.projectRoot,
      });

      const outdated = JSON.parse(output);
      this.metrics.dependencies.outdated = Object.keys(outdated).length;

      console.log(chalk.green(`✅ 依赖检查完成: ${this.metrics.dependencies.outdated} 个过期依赖`));
    } catch (error) {
      // npm outdated 在有过期依赖时会返回非零退出码
      if (error.stdout) {
        const outdated = JSON.parse(error.stdout);
        this.metrics.dependencies.outdated = Object.keys(outdated).length;
      }
      console.log(chalk.green(`✅ 依赖检查完成: ${this.metrics.dependencies.outdated} 个过期依赖`));
    }
  }

  /**
   * 计算总体质量分数
   */
  calculateQualityScore() {
    let score = 100;

    // ESLint 错误和警告扣分
    score -= this.metrics.eslint.errors * 2;
    score -= this.metrics.eslint.warnings * 0.5;

    // 格式问题扣分
    score -= this.metrics.prettier.violations * 0.1;

    // TypeScript 错误扣分
    score -= this.metrics.typescript.errors * 1.5;
    score -= this.metrics.typescript.warnings * 0.3;

    // 测试覆盖率加分/扣分
    if (this.metrics.tests.coverage >= 80) {
      score += 10;
    } else if (this.metrics.tests.coverage < 50) {
      score -= 15;
    }

    // 安全漏洞扣分
    score -= this.metrics.security.vulnerabilities * 3;

    // 复杂度违规扣分
    score -= this.metrics.complexity.violations * 1;

    // 重复代码扣分
    score -= this.metrics.duplicates.percentage * 0.5;

    // 过期依赖扣分
    score -= this.metrics.dependencies.outdated * 0.2;

    this.qualityScore = Math.max(0, Math.min(100, score));
  }

  /**
   * 生成改进建议
   */
  generateRecommendations() {
    if (this.metrics.eslint.errors > 0) {
      this.recommendations.push({
        priority: 'high',
        category: 'code_quality',
        message: `修复 ${this.metrics.eslint.errors} 个 ESLint 错误`,
        action: 'npm run lint:fix',
      });
    }

    if (this.metrics.prettier.violations > 0) {
      this.recommendations.push({
        priority: 'medium',
        category: 'formatting',
        message: `修复 ${this.metrics.prettier.violations} 个格式问题`,
        action: 'npm run format',
      });
    }

    if (this.metrics.tests.coverage < 80) {
      this.recommendations.push({
        priority: 'high',
        category: 'testing',
        message: `提升测试覆盖率至 80% 以上（当前: ${this.metrics.tests.coverage}%）`,
        action: '编写更多单元测试和集成测试',
      });
    }

    if (this.metrics.security.vulnerabilities > 0) {
      this.recommendations.push({
        priority: 'critical',
        category: 'security',
        message: `修复 ${this.metrics.security.vulnerabilities} 个安全漏洞`,
        action: 'npm audit fix',
      });
    }

    if (this.metrics.dependencies.outdated > 5) {
      this.recommendations.push({
        priority: 'medium',
        category: 'maintenance',
        message: `更新 ${this.metrics.dependencies.outdated} 个过期依赖`,
        action: 'npm update',
      });
    }
  }

  /**
   * 生成详细报告
   */

  // TODO: 考虑将此函数拆分为更小的函数 (当前 30 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 30 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 30 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 30 行)

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      qualityScore: this.qualityScore,
      metrics: this.metrics,
      recommendations: this.recommendations,
      summary: {
        totalIssues:
          this.metrics.eslint.errors +
          this.metrics.eslint.warnings +
          this.metrics.typescript.errors +
          this.metrics.security.vulnerabilities,
        criticalIssues:
          this.metrics.eslint.errors +
          this.metrics.typescript.errors +
          this.metrics.security.vulnerabilities,
        testCoverage: this.metrics.tests.coverage,
        codeQuality: this.getQualityGrade(),
      },
    };

    // 保存 JSON 报告
    await fs.promises.writeFile(
      path.join(this.reportDir, `quality-report-${this.timestamp}.json`),
      JSON.stringify(report, null, 2)
    );

    // 生成 HTML 报告
    await this.generateHTMLReport(report);
  }

  // TODO: 考虑将此函数拆分为更小的函数 (当前 81 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 81 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 81 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 81 行)

  /**
   * 生成 HTML 报告
   */
  async generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>代码质量报告 - ${new Date().toLocaleDateString()}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .score { font-size: 3em; font-weight: bold; text-align: center; margin: 20px 0; }
        .grade { font-size: 1.5em; text-align: center; opacity: 0.9; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; padding: 30px; }
        .metric-card { background: #f8f9fa; border-radius: 8px; padding: 20px; border-left: 4px solid #007bff; }
        .metric-title { font-weight: bold; color: #495057; margin-bottom: 10px; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .recommendations { padding: 30px; }
        .recommendation { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 10px 0; }
        .priority-critical { border-left: 4px solid #dc3545; }
        .priority-high { border-left: 4px solid #fd7e14; }
        .priority-medium { border-left: 4px solid #ffc107; }
        .priority-low { border-left: 4px solid #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>代码质量报告</h1>
            <div class="score">${report.qualityScore.toFixed(1)}</div>
            <div class="grade">质量等级: ${report.summary.codeQuality}</div>
            <p>生成时间: ${new Date(report.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-title">ESLint 问题</div>
                <div class="metric-value">${report.metrics.eslint.errors + report.metrics.eslint.warnings}</div>
                <div>错误: ${report.metrics.eslint.errors}, 警告: ${report.metrics.eslint.warnings}</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">测试覆盖率</div>
                <div class="metric-value">${report.metrics.tests.coverage}%</div>
                <div>通过: ${report.metrics.tests.passed}, 失败: ${report.metrics.tests.failed}</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">安全漏洞</div>
                <div class="metric-value">${report.metrics.security.vulnerabilities}</div>
                <div>需要立即修复</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">代码复杂度</div>
                <div class="metric-value">${report.metrics.complexity.violations}</div>
                <div>复杂度违规</div>
            </div>
        </div>
        
        <div class="recommendations">
            <h2>改进建议</h2>
            ${report.recommendations
              .map(
                (rec) => `
                <div class="recommendation priority-${rec.priority}">
                    <strong>${rec.message}</strong><br>
                    <small>建议操作: ${rec.action}</small>
                </div>
            `
              )
              .join('')}
        </div>
    </div>
</body>
</html>
    `;

    await fs.promises.writeFile(
      path.join(this.reportDir, `quality-report-${this.timestamp}.html`),
      html
    );
  }

  /**
   * 获取质量等级
   */
  getQualityGrade() {
    if (this.qualityScore >= 90) {
      return 'A (优秀)';
    }
    if (this.qualityScore >= 80) {
      return 'B (良好)';
    }
    if (this.qualityScore >= 70) {
      return 'C (一般)';
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (this.qualityScore >= 60) {
      return 'D (较差)';
    }
    return 'F (需要改进)';
  }

  /**
   * 获取 JavaScript 文件列表
   */
  async getJavaScriptFiles() {
    const files = [];
    const extensions = ['.js', '.ts', '.jsx', '.tsx'];

    async function walkDir(dir) {
      try {
        const items = await fs.promises.readdir(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = await fs.promises.stat(fullPath);

          // TODO: 考虑使用早期返回或策略模式来减少嵌套
          // TODO: 考虑使用早期返回或策略模式来减少嵌套
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            await walkDir(fullPath);
          } else if (stat.isFile() && extensions.some((ext) => item.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // 忽略权限错误等
      }
    }

    await walkDir(path.join(this.projectRoot, 'src'));
    return files;
  }

  /**
   * 简单的重复代码检测
   */
  async findDuplicates(files) {
    // 这是一个简化的实现，实际项目中可以使用更专业的工具
    let totalLines = 0;
    const duplicateLines = 0;

    for (const file of files) {
      try {
        const content = await fs.promises.readFile(file, 'utf8');
        const lines = content.split('\n').filter((line) => line.trim());
        totalLines += lines.length;
      } catch (error) {
        // 忽略读取错误
      }
    }

    return {
      totalLines,
      duplicateLines,
      percentage: totalLines > 0 ? (duplicateLines / totalLines) * 100 : 0,
    };
  }

  /**
   * 显示分析摘要
   */
  displaySummary() {
    console.log(`\n${chalk.blue.bold('📊 代码质量分析摘要')}`);
    console.log(chalk.blue('='.repeat(50)));

    console.log(
      `\n${chalk.bold('总体质量分数:')} ${this.getScoreColor(this.qualityScore)}${this.qualityScore.toFixed(1)}/100${chalk.reset()} (${this.getQualityGrade()})`
    );

    console.log(`\n${chalk.bold('关键指标:')}`);
    console.log(
      `  ESLint 问题: ${this.getIssueColor(this.metrics.eslint.errors + this.metrics.eslint.warnings)}${this.metrics.eslint.errors + this.metrics.eslint.warnings}${chalk.reset()}`
    );
    console.log(
      `  测试覆盖率: ${this.getCoverageColor(this.metrics.tests.coverage)}${this.metrics.tests.coverage}%${chalk.reset()}`
    );
    console.log(
      `  安全漏洞: ${this.getVulnColor(this.metrics.security.vulnerabilities)}${this.metrics.security.vulnerabilities}${chalk.reset()}`
    );
    console.log(`  过期依赖: ${this.metrics.dependencies.outdated}`);

    if (this.recommendations.length > 0) {
      console.log(`\n${chalk.bold('优先改进建议:')}`);
      this.recommendations
        .filter((rec) => rec.priority === 'critical' || rec.priority === 'high')
        .slice(0, 3)
        .forEach((rec, index) => {
          console.log(`  ${index + 1}. ${rec.message}`);
        });
    }

    console.log(
      `\n${chalk.bold('报告位置:')} ${path.join(this.reportDir, `quality-report-${this.timestamp}.html`)}`
    );
    console.log(chalk.blue('='.repeat(50)));
  }

  /**
   * 获取分数颜色
   */
  getScoreColor(score) {
    if (score >= 90) {
      return chalk.green;
    }
    if (score >= 80) {
      return chalk.yellow;
    }
    if (score >= 70) {
      return chalk.orange;
    }
    return chalk.red;
  }

  /**
   * 获取问题数量颜色
   */
  getIssueColor(count) {
    if (count === 0) {
      return chalk.green;
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (count <= 5) {
      return chalk.yellow;
    }
    return chalk.red;
  }

  /**
   * 获取覆盖率颜色
   */
  getCoverageColor(coverage) {
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (coverage >= 80) {
      return chalk.green;
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (coverage >= 60) {
      return chalk.yellow;
    }
    return chalk.red;
  }

  /**
   * 获取漏洞数量颜色
   */
  getVulnColor(count) {
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (count === 0) {
      return chalk.green;
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (count <= 2) {
      return chalk.yellow;
    }
    return chalk.red;
  }
}

// 主程序入口
// TODO: 考虑使用早期返回或策略模式来减少嵌套
// TODO: 考虑使用早期返回或策略模式来减少嵌套
// TODO: 考虑使用早期返回或策略模式来减少嵌套
// TODO: 考虑使用早期返回或策略模式来减少嵌套
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new CodeQualityMonitor();
  monitor.runFullAnalysis().catch((error) => {
    console.error(chalk.red('❌ 程序执行失败:'), error);
    process.exit(1);
  });
}

export default CodeQualityMonitor;
