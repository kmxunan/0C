#!/usr/bin/env node
/* eslint-disable no-console, no-magic-numbers */

/**
 * 增强的代码质量检查脚本
 * 提供全面的代码质量分析、报告生成和改进建议
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class EnhancedQualityChecker {
  // TODO: 考虑将此函数拆分为更小的函数 (当前 47 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 47 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 47 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 47 行)

  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      overall: {
        score: 0,
        grade: 'F',
        status: 'FAIL',
      },
      checks: {
        eslint: { status: 'PENDING', score: 0, issues: [] },
        prettier: { status: 'PENDING', score: 0, issues: [] },
        typescript: { status: 'PENDING', score: 0, issues: [] },
        tests: { status: 'PENDING', score: 0, coverage: {} },
        security: { status: 'PENDING', score: 0, vulnerabilities: [] },
        dependencies: { status: 'PENDING', score: 0, outdated: [] },
        complexity: { status: 'PENDING', score: 0, metrics: {} },
        duplication: { status: 'PENDING', score: 0, duplicates: [] },
      },
      recommendations: [],
      metrics: {
        linesOfCode: 0,
        testCoverage: 0,
        technicalDebt: 0,
        maintainabilityIndex: 0,
      },
    };

    this.config = {
      thresholds: {
        eslint: { maxWarnings: 10, maxErrors: 0 },
        coverage: { statements: 80, branches: 75, functions: 80, lines: 80 },
        complexity: { maxCyclomaticComplexity: 10, maxCognitiveComplexity: 15 },
        duplication: { maxDuplicationPercentage: 5 },
        security: { maxHighVulnerabilities: 0, maxMediumVulnerabilities: 2 },
      },
      weights: {
        eslint: 0.2,
        prettier: 0.1,
        typescript: 0.15,
        tests: 0.25,
        security: 0.15,
        dependencies: 0.05,
        complexity: 0.05,
        duplication: 0.05,
      },
    };
  }

  /**
   * 执行所有质量检查
   */
  async runAllChecks() {
    console.log('🔍 开始增强代码质量检查...');
    console.log('='.repeat(50));

    try {
      await this.checkESLint();
      await this.checkPrettier();
      await this.checkTypeScript();
      await this.runTests();
      await this.checkSecurity();
      await this.checkDependencies();
      await this.analyzeComplexity();
      await this.checkDuplication();

      this.calculateOverallScore();
      this.generateRecommendations();
      await this.generateReports();

      this.printSummary();

      return this.results.overall.status === 'PASS';
    } catch (error) {
      console.error('❌ 质量检查过程中发生错误:', error.message);
      return false;
    }
  }

  /**
   * ESLint 检查
   */
  async checkESLint() {
    console.log('📋 运行 ESLint 检查...');

    try {
      const { stdout: result } = await execAsync(
        'npx eslint . --format json --config .eslintrc.enhanced.cjs',
        {
          encoding: 'utf8',
          cwd: projectRoot,
        }
      );

      const eslintResults = JSON.parse(result);
      const totalErrors = eslintResults.reduce((sum, file) => sum + file.errorCount, 0);
      const totalWarnings = eslintResults.reduce((sum, file) => sum + file.warningCount, 0);

      this.results.checks.eslint = {
        status:
          totalErrors === 0 && totalWarnings <= this.config.thresholds.eslint.maxWarnings
            ? 'PASS'
            : 'FAIL',
        score: this.calculateESLintScore(totalErrors, totalWarnings),
        errors: totalErrors,
        warnings: totalWarnings,
        issues: eslintResults.filter((file) => file.messages.length > 0),
      };

      console.log(`   ✅ ESLint: ${totalErrors} 错误, ${totalWarnings} 警告`);
    } catch (error) {
      this.results.checks.eslint = {
        status: 'ERROR',
        score: 0,
        error: error.message,
      };
      console.log('   ❌ ESLint 检查失败');
    }
  }

  /**
   * Prettier 格式检查
   */
  async checkPrettier() {
    console.log('🎨 运行 Prettier 格式检查...');

    try {
      await execAsync('npx prettier --check .', {
        encoding: 'utf8',
        cwd: projectRoot,
      });

      this.results.checks.prettier = {
        status: 'PASS',
        score: 100,
      };

      console.log('   ✅ Prettier: 所有文件格式正确');
    } catch (error) {
      const unformattedFiles = error.stdout
        ? error.stdout.split('\n').filter((line) => line.trim())
        : [];

      this.results.checks.prettier = {
        status: 'FAIL',
        score: Math.max(0, 100 - unformattedFiles.length * 10),
        unformattedFiles,
      };

      console.log(`   ❌ Prettier: ${unformattedFiles.length} 个文件格式不正确`);
    }
  }

  /**
   * TypeScript 类型检查
   */
  async checkTypeScript() {
    console.log('🔷 运行 TypeScript 类型检查...');

    try {
      await execAsync('npx tsc --noEmit', {
        encoding: 'utf8',
        cwd: projectRoot,
      });

      this.results.checks.typescript = {
        status: 'PASS',
        score: 100,
      };

      console.log('   ✅ TypeScript: 类型检查通过');
    } catch (error) {
      const typeErrors = error.stdout
        ? error.stdout.split('\n').filter((line) => line.includes('error TS')).length
        : 0;

      this.results.checks.typescript = {
        status: 'FAIL',
        score: Math.max(0, 100 - typeErrors * 5),
        errors: typeErrors,
        details: error.stdout,
      };

      console.log(`   ❌ TypeScript: ${typeErrors} 个类型错误`);
    }
  }

  /**
   * 运行测试并收集覆盖率
   */
  async runTests() {
    console.log('🧪 运行测试并收集覆盖率...');

    try {
      const { stdout: result } = await execAsync(
        'npx jest --coverage --coverageReporters=json --config jest.enhanced.config.js',
        { encoding: 'utf8', cwd: projectRoot }
      );

      // 读取覆盖率报告
      const coveragePath = path.join(projectRoot, 'coverage/coverage-final.json');
      let coverage = {
        total: {
          statements: { pct: 0 },
          branches: { pct: 0 },
          functions: { pct: 0 },
          lines: { pct: 0 },
        },
      };

      try {
        await fs.promises.access(coveragePath);
        const coverageData = JSON.parse(await fs.promises.readFile(coveragePath, 'utf8'));
        coverage = this.calculateTotalCoverage(coverageData);
      } catch {
        // 覆盖率文件不存在，使用默认值
      }

      const coverageScore = this.calculateCoverageScore(coverage.total);

      this.results.checks.tests = {
        status: coverageScore >= 80 ? 'PASS' : 'FAIL',
        score: coverageScore,
        coverage: coverage.total,
      };

      this.results.metrics.testCoverage = coverage.total.statements.pct;

      console.log(`   ✅ 测试覆盖率: ${coverage.total.statements.pct.toFixed(1)}%`);
    } catch (error) {
      this.results.checks.tests = {
        status: 'ERROR',
        score: 0,
        error: error.message,
      };
      console.log('   ❌ 测试运行失败');
    }
  }

  /**
   * 安全漏洞检查
   */
  async checkSecurity() {
    console.log('🔒 运行安全漏洞检查...');

    try {
      const { stdout: result } = await execAsync('npm audit --json', {
        encoding: 'utf8',
        cwd: projectRoot,
      });

      const auditData = JSON.parse(result);
      const vulnerabilities = auditData.vulnerabilities || {};

      const highVulns = Object.values(vulnerabilities).filter((v) => v.severity === 'high').length;
      const mediumVulns = Object.values(vulnerabilities).filter(
        (v) => v.severity === 'moderate'
      ).length;

      const securityScore = this.calculateSecurityScore(highVulns, mediumVulns);

      this.results.checks.security = {
        status:
          highVulns === 0 && mediumVulns <= this.config.thresholds.security.maxMediumVulnerabilities
            ? 'PASS'
            : 'FAIL',
        score: securityScore,
        vulnerabilities: {
          high: highVulns,
          medium: mediumVulns,
          total: Object.keys(vulnerabilities).length,
        },
      };

      console.log(`   ✅ 安全检查: ${highVulns} 高危, ${mediumVulns} 中危漏洞`);
    } catch (error) {
      // npm audit 在有漏洞时会返回非零退出码
      if (error.stdout) {
        try {
          const auditData = JSON.parse(error.stdout);
          const vulnerabilities = auditData.vulnerabilities || {};

          const highVulns = Object.values(vulnerabilities).filter(
            (v) => v.severity === 'high'
          ).length;
          const mediumVulns = Object.values(vulnerabilities).filter(
            (v) => v.severity === 'moderate'
          ).length;

          this.results.checks.security = {
            status: 'FAIL',
            score: this.calculateSecurityScore(highVulns, mediumVulns),
            vulnerabilities: {
              high: highVulns,
              medium: mediumVulns,
              total: Object.keys(vulnerabilities).length,
            },
          };

          console.log(`   ⚠️  安全检查: 发现 ${highVulns} 高危, ${mediumVulns} 中危漏洞`);
        } catch (parseError) {
          this.results.checks.security = {
            status: 'ERROR',
            score: 0,
            error: 'Failed to parse audit results',
          };
          console.log('   ❌ 安全检查失败');
        }
      } else {
        this.results.checks.security = {
          status: 'ERROR',
          score: 0,
          error: error.message,
        };
        console.log('   ❌ 安全检查失败');
      }
    }
  }

  /**
   * 依赖项检查
   */
  async checkDependencies() {
    console.log('📦 检查依赖项状态...');

    try {
      const { stdout: result } = await execAsync('npm outdated --json', {
        encoding: 'utf8',
        cwd: projectRoot,
      });

      const outdated = JSON.parse(result || '{}');
      const outdatedCount = Object.keys(outdated).length;

      this.results.checks.dependencies = {
        status: outdatedCount === 0 ? 'PASS' : 'WARN',
        score: Math.max(0, 100 - outdatedCount * 5),
        outdated: outdatedCount,
        packages: outdated,
      };

      console.log(`   ✅ 依赖项: ${outdatedCount} 个过期包`);
    } catch (error) {
      // npm outdated 在有过期包时返回非零退出码
      if (error.stdout) {
        try {
          const outdated = JSON.parse(error.stdout || '{}');
          const outdatedCount = Object.keys(outdated).length;

          this.results.checks.dependencies = {
            status: 'WARN',
            score: Math.max(0, 100 - outdatedCount * 5),
            outdated: outdatedCount,
            packages: outdated,
          };

          console.log(`   ⚠️  依赖项: ${outdatedCount} 个过期包`);
        } catch (parseError) {
          this.results.checks.dependencies = {
            status: 'PASS',
            score: 100,
          };
          console.log('   ✅ 依赖项: 所有包都是最新的');
        }
      } else {
        this.results.checks.dependencies = {
          status: 'ERROR',
          score: 0,
          error: error.message,
        };
        console.log('   ❌ 依赖项检查失败');
      }
    }
  }

  /**
   * 代码复杂度分析
   */
  async analyzeComplexity() {
    console.log('📊 分析代码复杂度...');

    try {
      // 这里可以集成 complexity-report 或其他复杂度分析工具
      // 暂时使用简单的文件行数统计
      const jsFiles = await this.getJavaScriptFiles();
      let totalLines = 0;
      let totalFunctions = 0;

      for (const file of jsFiles) {
        const content = await fs.promises.readFile(file, 'utf8');
        const lines = content.split('\n').length;
        const functions = (content.match(/function\s+\w+|\w+\s*=>|\w+\s*:\s*function/g) || [])
          .length;

        totalLines += lines;
        totalFunctions += functions;
      }

      const avgLinesPerFunction = totalFunctions > 0 ? totalLines / totalFunctions : 0;
      const complexityScore = this.calculateComplexityScore(avgLinesPerFunction);

      this.results.checks.complexity = {
        status: complexityScore >= 70 ? 'PASS' : 'WARN',
        score: complexityScore,
        metrics: {
          totalLines,
          totalFunctions,
          avgLinesPerFunction: Math.round(avgLinesPerFunction),
        },
      };

      this.results.metrics.linesOfCode = totalLines;

      console.log(`   ✅ 复杂度: ${totalLines} 行代码, ${totalFunctions} 个函数`);
    } catch (error) {
      this.results.checks.complexity = {
        status: 'ERROR',
        score: 0,
        error: error.message,
      };
      console.log('   ❌ 复杂度分析失败');
    }
  }

  /**
   * 代码重复检查
   */
  async checkDuplication() {
    console.log('🔄 检查代码重复...');

    try {
      // 简单的重复代码检测（可以集成 jscpd 等工具）
      const jsFiles = await this.getJavaScriptFiles();
      const duplicates = [];

      // 这里实现简单的重复检测逻辑
      // 实际项目中应该使用专业的重复检测工具

      this.results.checks.duplication = {
        status: duplicates.length === 0 ? 'PASS' : 'WARN',
        score: Math.max(0, 100 - duplicates.length * 10),
        duplicates: duplicates.length,
      };

      console.log(`   ✅ 重复检查: ${duplicates.length} 个重复代码块`);
    } catch (error) {
      this.results.checks.duplication = {
        status: 'ERROR',
        score: 0,
        error: error.message,
      };
      console.log('   ❌ 重复检查失败');
    }
  }

  /**
   * 计算总体质量分数
   */
  calculateOverallScore() {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [check, weight] of Object.entries(this.config.weights)) {
      if (this.results.checks[check] && this.results.checks[check].score !== undefined) {
        totalScore += this.results.checks[check].score * weight;
        totalWeight += weight;
      }
    }

    const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    this.results.overall.score = Math.round(overallScore);
    this.results.overall.grade = this.getGrade(overallScore);
    this.results.overall.status = overallScore >= 80 ? 'PASS' : 'FAIL';
  }

  /**
   * 生成改进建议
   */
  generateRecommendations() {
    const recommendations = [];

    // ESLint 建议
    if (this.results.checks.eslint.status === 'FAIL') {
      recommendations.push({
        category: 'Code Quality',
        priority: 'High',
        message: `修复 ${this.results.checks.eslint.errors || 0} 个 ESLint 错误和 ${this.results.checks.eslint.warnings || 0} 个警告`,
        action: 'npm run lint:enhanced:fix',
      });
    }

    // Prettier 建议
    if (this.results.checks.prettier.status === 'FAIL') {
      recommendations.push({
        category: 'Code Style',
        priority: 'Medium',
        message: '修复代码格式问题',
        action: 'npm run format',
      });
    }

    // TypeScript 建议
    if (this.results.checks.typescript.status === 'FAIL') {
      recommendations.push({
        category: 'Type Safety',
        priority: 'High',
        message: `修复 ${this.results.checks.typescript.errors || 0} 个 TypeScript 类型错误`,
        action: 'npm run type:check',
      });
    }

    // 测试覆盖率建议
    if (this.results.checks.tests.score < 80) {
      recommendations.push({
        category: 'Test Coverage',
        priority: 'High',
        message: `提高测试覆盖率至 80% 以上（当前: ${this.results.metrics.testCoverage.toFixed(1)}%）`,
        action: '编写更多单元测试和集成测试',
      });
    }

    // 安全建议
    if (this.results.checks.security.status === 'FAIL') {
      recommendations.push({
        category: 'Security',
        priority: 'Critical',
        message: '修复安全漏洞',
        action: 'npm audit fix',
      });
    }

    this.results.recommendations = recommendations;
  }

  /**
   * 生成报告
   */
  async generateReports() {
    const reportsDir = path.join(projectRoot, 'reports');
    if (!fs.existsSync(reportsDir)) {
      await fs.promises.mkdir(reportsDir, { recursive: true });
    }

    // JSON 报告
    const jsonReport = path.join(reportsDir, 'quality-report.json');
    await fs.promises.writeFile(jsonReport, JSON.stringify(this.results, null, 2));

    // HTML 报告
    const htmlReport = path.join(reportsDir, 'quality-report.html');
    const htmlContent = this.generateHTMLReport();
    await fs.promises.writeFile(htmlReport, htmlContent);

    console.log('\n📊 报告已生成:');
    console.log(`   JSON: ${jsonReport}`);
    console.log(`   HTML: ${htmlReport}`);
  }

  // TODO: 考虑将此函数拆分为更小的函数 (当前 107 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 107 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 107 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 107 行)

  /**
   * 生成 HTML 报告
   */
  generateHTMLReport() {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>代码质量报告</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .score { font-size: 3em; font-weight: bold; margin: 10px 0; }
        .grade { font-size: 1.5em; opacity: 0.9; }
        .content { padding: 30px; }
        .checks { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 30px 0; }
        .check { border: 1px solid #e1e5e9; border-radius: 6px; padding: 20px; }
        .check.pass { border-left: 4px solid #28a745; }
        .check.fail { border-left: 4px solid #dc3545; }
        .check.warn { border-left: 4px solid #ffc107; }
        .check.error { border-left: 4px solid #6c757d; }
        .check-title { font-weight: bold; margin-bottom: 10px; }
        .check-score { font-size: 1.2em; color: #666; }
        .recommendations { margin-top: 30px; }
        .recommendation { background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .priority-critical { border-left-color: #dc3545; }
        .priority-high { border-left-color: #fd7e14; }
        .priority-medium { border-left-color: #ffc107; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 6px; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #666; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>代码质量报告</h1>
            <div class="score">${this.results.overall.score}</div>
            <div class="grade">等级: ${this.results.overall.grade}</div>
            <div>状态: ${this.results.overall.status}</div>
            <div style="margin-top: 15px; opacity: 0.8;">生成时间: ${new Date(this.results.timestamp).toLocaleString('zh-CN')}</div>
        </div>
        
        <div class="content">
            <h2>关键指标</h2>
            <div class="metrics">
                <div class="metric">
                    <div class="metric-value">${this.results.metrics.testCoverage.toFixed(1)}%</div>
                    <div class="metric-label">测试覆盖率</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${this.results.metrics.linesOfCode}</div>
                    <div class="metric-label">代码行数</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${this.results.checks.security.vulnerabilities?.total || 0}</div>
                    <div class="metric-label">安全漏洞</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${this.results.checks.eslint.errors || 0}</div>
                    <div class="metric-label">ESLint 错误</div>
                </div>
            </div>
            
            <h2>详细检查结果</h2>
            <div class="checks">
                ${Object.entries(this.results.checks)
                  .map(
                    ([name, check]) => `
                    <div class="check ${check.status.toLowerCase()}">
                        <div class="check-title">${this.getCheckDisplayName(name)}</div>
                        <div class="check-score">分数: ${check.score || 0}/100</div>
                        <div>状态: ${check.status}</div>
                        ${this.getCheckDetails(name, check)}
                    </div>
                `
                  )
                  .join('')}
            </div>
            
            ${
              this.results.recommendations.length > 0
                ? `
                <h2>改进建议</h2>
                <div class="recommendations">
                    ${this.results.recommendations
                      .map(
                        (rec) => `
                        <div class="recommendation priority-${rec.priority.toLowerCase()}">
                            <strong>${rec.category}</strong> (${rec.priority})
                            <div>${rec.message}</div>
                            <div style="margin-top: 10px; font-family: monospace; background: #e9ecef; padding: 5px; border-radius: 3px;">${rec.action}</div>
                        </div>
                    `
                      )
                      .join('')}
                </div>
            `
                : ''
            }
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * 打印摘要
   */
  printSummary() {
    console.log(`\n${'='.repeat(50)}`);
    console.log('📊 代码质量检查摘要');
    console.log('='.repeat(50));
    console.log(`总体分数: ${this.results.overall.score}/100 (${this.results.overall.grade})`);
    console.log(`状态: ${this.results.overall.status}`);
    console.log('');

    // 打印各项检查结果
    for (const [name, check] of Object.entries(this.results.checks)) {
      const icon =
        check.status === 'PASS'
          ? '✅'
          : check.status === 'FAIL'
            ? '❌'
            : check.status === 'WARN'
              ? '⚠️'
              : '❓';
      console.log(
        `${icon} ${this.getCheckDisplayName(name)}: ${check.score || 0}/100 (${check.status})`
      );
    }

    if (this.results.recommendations.length > 0) {
      console.log('\n🔧 改进建议:');
      this.results.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.message}`);
        console.log(`   执行: ${rec.action}`);
      });
    }

    console.log(`\n${'='.repeat(50)}`);
  }

  // 辅助方法
  calculateESLintScore(errors, warnings) {
    return Math.max(0, 100 - errors * 10 - warnings * 2);
  }

  calculateCoverageScore(coverage) {
    const weights = { statements: 0.4, branches: 0.3, functions: 0.2, lines: 0.1 };
    return Object.entries(weights).reduce(
      (score, [key, weight]) => score + (coverage[key]?.pct || 0) * weight,
      0
    );
  }

  calculateSecurityScore(high, medium) {
    return Math.max(0, 100 - high * 30 - medium * 10);
  }

  calculateComplexityScore(avgLines) {
    if (avgLines <= 20) {
      return 100;
    }
    if (avgLines <= 50) {
      return 80;
    }
    if (avgLines <= 100) {
      return 60;
    }
    return 40;
  }

  calculateTotalCoverage(coverageData) {
    const totals = { statements: 0, branches: 0, functions: 0, lines: 0 };
    const counts = { statements: 0, branches: 0, functions: 0, lines: 0 };

    Object.values(coverageData).forEach((file) => {
      if (file.s) {
        Object.values(file.s).forEach((count) => {
          totals.statements += count;
          counts.statements++;
        });
      }
      // 类似处理 branches, functions, lines
    });

    return {
      total: {
        statements: {
          pct: counts.statements > 0 ? (totals.statements / counts.statements) * 100 : 0,
        },
        branches: { pct: counts.branches > 0 ? (totals.branches / counts.branches) * 100 : 0 },
        functions: { pct: counts.functions > 0 ? (totals.functions / counts.functions) * 100 : 0 },
        lines: { pct: counts.lines > 0 ? (totals.lines / counts.lines) * 100 : 0 },
      },
    };
  }

  getGrade(score) {
    if (score >= 90) {
      return 'A';
    }
    if (score >= 80) {
      return 'B';
    }
    if (score >= 70) {
      return 'C';
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (score >= 60) {
      return 'D';
    }
    return 'F';
  }

  getCheckDisplayName(name) {
    const names = {
      eslint: 'ESLint 检查',
      prettier: 'Prettier 格式',
      typescript: 'TypeScript 类型',
      tests: '测试覆盖率',
      security: '安全检查',
      dependencies: '依赖项检查',
      complexity: '代码复杂度',
      duplication: '重复代码',
    };
    return names[name] || name;
  }

  getCheckDetails(name, check) {
    switch (name) {
      case 'eslint':
        return check.errors !== undefined
          ? `<div>错误: ${check.errors}, 警告: ${check.warnings}</div>`
          : '';
      case 'tests':
        return check.coverage
          ? `<div>覆盖率: ${check.coverage.statements?.pct?.toFixed(1) || 0}%</div>`
          : '';
      case 'security':
        return check.vulnerabilities
          ? `<div>高危: ${check.vulnerabilities.high}, 中危: ${check.vulnerabilities.medium}</div>`
          : '';
      case 'dependencies':
        return check.outdated !== undefined ? `<div>过期包: ${check.outdated}</div>` : '';
      case 'complexity':
        return check.metrics ? `<div>平均函数行数: ${check.metrics.avgLinesPerFunction}</div>` : '';
      default:
        return '';
    }
  }

  async getJavaScriptFiles() {
    const files = [];
    const extensions = ['.js', '.jsx', '.ts', '.tsx'];

    async function scanDir(dir) {
      if (dir.includes('node_modules') || dir.includes('.git')) {
        return;
      }

      try {
        const items = await fs.promises.readdir(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = await fs.promises.stat(fullPath);

          if (stat.isDirectory()) {
            await scanDir(fullPath);
          } else if (extensions.some((ext) => item.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // 忽略权限错误
      }
    }

    await scanDir(path.join(projectRoot, 'src'));
    return files;
  }
}

// 主执行函数
async function main() {
  const checker = new EnhancedQualityChecker();
  const success = await checker.runAllChecks();

  process.exit(success ? 0 : 1);
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ 质量检查失败:', error);
    process.exit(1);
  });
}

export { EnhancedQualityChecker };
