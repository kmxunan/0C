#!/usr/bin/env node
/* eslint-disable no-console, no-magic-numbers */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 代码覆盖率分析器
 * 分析测试覆盖率并生成详细报告
 */
class CoverageAnalyzer {
  // TODO: 考虑将此函数拆分为更小的函数 (当前 32 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 32 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 32 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 32 行)

  constructor(options = {}) {
    this.options = {
      projectRoot: options.projectRoot || path.resolve(__dirname, '..'),
      sourceDir: options.sourceDir || 'src',
      testDir: options.testDir || 'tests',
      outputDir: options.outputDir || 'coverage',
      minCoverage: {
        statements: options.minCoverage?.statements || 80,
        branches: options.minCoverage?.branches || 75,
        functions: options.minCoverage?.functions || 80,
        lines: options.minCoverage?.lines || 80,
      },
      excludePatterns: options.excludePatterns || [
        'node_modules/**',
        'tests/**',
        'coverage/**',
        '**/*.test.js',
        '**/*.spec.js',
        '**/test-*.js',
      ],
      ...options,
    };

    this.coverageData = null;
    this.analysisResults = {
      summary: {},
      files: [],
      uncoveredLines: [],
      recommendations: [],
      trends: [],
    };
  }

  /**
   * 运行完整的覆盖率分析
   */
  async analyze() {
    console.log('📊 开始代码覆盖率分析...');

    try {
      // 运行测试并生成覆盖率报告
      await this.runCoverageTests();

      // 解析覆盖率数据
      await this.parseCoverageData();

      // 分析覆盖率
      await this.performAnalysis();

      // 生成报告
      await this.generateReports();

      // 检查覆盖率阈值
      this.checkCoverageThresholds();

      console.log('✅ 代码覆盖率分析完成!');

      return this.analysisResults;
    } catch (error) {
      console.error('❌ 覆盖率分析失败:', error);
      throw error;
    }
  }

  /**
   * 运行测试并生成覆盖率报告
   */
  async runCoverageTests() {
    console.log('🧪 运行测试并收集覆盖率数据...');

    try {
      // 确保输出目录存在
      const coverageDir = path.join(this.options.projectRoot, this.options.outputDir);
      if (!fs.existsSync(coverageDir)) {
        fs.mkdirSync(coverageDir, { recursive: true });
      }

      // 运行Jest测试并生成覆盖率报告
      const jestCommand = [
        'npx jest',
        '--coverage',
        `--coverageDirectory=${this.options.outputDir}`,
        '--coverageReporters=json,lcov,text,html',
        '--collectCoverageFrom="src/**/*.js"',
        '--collectCoverageFrom="!src/**/*.test.js"',
        '--collectCoverageFrom="!src/**/*.spec.js"',
      ].join(' ');

      console.log('执行命令:', jestCommand);

      const output = execSync(jestCommand, {
        cwd: this.options.projectRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      console.log('✅ 测试执行完成');
    } catch (error) {
      // Jest可能会因为覆盖率不足而返回非零退出码，但仍会生成报告
      console.warn('⚠️  测试执行完成，但可能存在覆盖率问题');
    }
  }

  /**
   * 解析覆盖率数据
   */
  async parseCoverageData() {
    console.log('📋 解析覆盖率数据...');

    const coverageJsonPath = path.join(
      this.options.projectRoot,
      this.options.outputDir,
      'coverage-final.json'
    );

    if (!fs.existsSync(coverageJsonPath)) {
      throw new Error(`覆盖率数据文件不存在: ${coverageJsonPath}`);
    }

    try {
      const coverageJson = fs.readFileSync(coverageJsonPath, 'utf8');
      this.coverageData = JSON.parse(coverageJson);

      console.log(`✅ 成功解析 ${Object.keys(this.coverageData).length} 个文件的覆盖率数据`);
    } catch (error) {
      throw new Error(`解析覆盖率数据失败: ${error.message}`);
    }
  }

  /**
   * 执行覆盖率分析
   */
  async performAnalysis() {
    console.log('🔍 执行覆盖率分析...');

    // 计算总体覆盖率
    this.calculateOverallCoverage();

    // 分析文件级覆盖率
    this.analyzeFileCoverage();

    // 识别未覆盖的代码
    this.identifyUncoveredCode();

    // 生成改进建议
    this.generateRecommendations();

    // 分析覆盖率趋势（如果有历史数据）
    this.analyzeTrends();
  }

  // TODO: 考虑将此函数拆分为更小的函数 (当前 63 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 66 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 69 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 72 行)

  /**
   * 计算总体覆盖率
   */
  calculateOverallCoverage() {
    let totalStatements = 0;
    let coveredStatements = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalLines = 0;
    let coveredLines = 0;

    for (const [filePath, fileData] of Object.entries(this.coverageData)) {
      // 跳过排除的文件
      if (this.shouldExcludeFile(filePath)) {
        continue;
      }

      // 语句覆盖率
      const statements = fileData.s || {};
      totalStatements += Object.keys(statements).length;
      coveredStatements += Object.values(statements).filter((count) => count > 0).length;

      // 分支覆盖率
      const branches = fileData.b || {};
      for (const branchData of Object.values(branches)) {
        totalBranches += branchData.length;
        coveredBranches += branchData.filter((count) => count > 0).length;
      }

      // 函数覆盖率
      const functions = fileData.f || {};
      totalFunctions += Object.keys(functions).length;
      coveredFunctions += Object.values(functions).filter((count) => count > 0).length;

      // 行覆盖率
      const lines = fileData.statementMap || {};
      totalLines += Object.keys(lines).length;
      const executedLines = Object.keys(statements).filter((key) => statements[key] > 0);
      coveredLines += executedLines.length;
    }

    this.analysisResults.summary = {
      statements: {
        total: totalStatements,
        covered: coveredStatements,
        percentage: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0,
      },
      branches: {
        total: totalBranches,
        covered: coveredBranches,
        percentage: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
      },
      functions: {
        total: totalFunctions,
        covered: coveredFunctions,
        percentage: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0,
      },
      lines: {
        total: totalLines,
        covered: coveredLines,
        percentage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
      },

      // TODO: 考虑将此函数拆分为更小的函数 (当前 61 行)

      // TODO: 考虑将此函数拆分为更小的函数 (当前 61 行)

      // TODO: 考虑将此函数拆分为更小的函数 (当前 61 行)

      // TODO: 考虑将此函数拆分为更小的函数 (当前 61 行)
    };
  }

  /**
   * 分析文件级覆盖率
   */
  analyzeFileCoverage() {
    this.analysisResults.files = [];

    for (const [filePath, fileData] of Object.entries(this.coverageData)) {
      if (this.shouldExcludeFile(filePath)) {
        continue;
      }

      const relativePath = path.relative(this.options.projectRoot, filePath);

      // 计算文件的各项覆盖率
      const statements = fileData.s || {};
      const branches = fileData.b || {};
      const functions = fileData.f || {};

      const statementCoverage = this.calculateCoveragePercentage(
        Object.values(statements),
        (count) => count > 0
      );

      let branchCoverage = 0;
      if (Object.keys(branches).length > 0) {
        const allBranches = Object.values(branches).flat();
        branchCoverage = this.calculateCoveragePercentage(allBranches, (count) => count > 0);
      }

      const functionCoverage = this.calculateCoveragePercentage(
        Object.values(functions),
        (count) => count > 0
      );

      const fileAnalysis = {
        path: relativePath,
        absolutePath: filePath,
        statements: {
          total: Object.keys(statements).length,
          covered: Object.values(statements).filter((count) => count > 0).length,
          percentage: statementCoverage,
        },
        branches: {
          total: Object.values(branches).flat().length,
          covered: Object.values(branches)
            .flat()
            .filter((count) => count > 0).length,
          percentage: branchCoverage,
        },
        functions: {
          total: Object.keys(functions).length,
          covered: Object.values(functions).filter((count) => count > 0).length,
          percentage: functionCoverage,
        },
        uncoveredLines: this.getUncoveredLines(fileData),
        complexity: this.calculateComplexity(fileData),
      };

      this.analysisResults.files.push(fileAnalysis);
    }

    // 按覆盖率排序
    this.analysisResults.files.sort((a, b) => a.statements.percentage - b.statements.percentage);
  }

  /**
   * 识别未覆盖的代码
   */
  identifyUncoveredCode() {
    this.analysisResults.uncoveredLines = [];

    for (const fileAnalysis of this.analysisResults.files) {
      if (fileAnalysis.uncoveredLines.length > 0) {
        this.analysisResults.uncoveredLines.push({
          file: fileAnalysis.path,
          lines: fileAnalysis.uncoveredLines,
          count: fileAnalysis.uncoveredLines.length,
        });
      }
    }

    // 按未覆盖行数排序
    this.analysisResults.uncoveredLines.sort((a, b) => b.count - a.count);
  }

  /**
   * 生成改进建议
   */
  generateRecommendations() {
    const recommendations = [];

    // 检查总体覆盖率
    const { summary } = this.analysisResults;

    if (summary.statements.percentage < this.options.minCoverage.statements) {
      recommendations.push({
        type: 'overall_statements',
        priority: 'high',
        message: `语句覆盖率 ${summary.statements.percentage.toFixed(2)}% 低于目标 ${this.options.minCoverage.statements}%`,
        suggestion: '增加单元测试以提高语句覆盖率',
      });
    }

    if (summary.branches.percentage < this.options.minCoverage.branches) {
      recommendations.push({
        type: 'overall_branches',
        priority: 'high',
        message: `分支覆盖率 ${summary.branches.percentage.toFixed(2)}% 低于目标 ${this.options.minCoverage.branches}%`,
        suggestion: '添加测试用例覆盖更多的条件分支',
      });
    }

    if (summary.functions.percentage < this.options.minCoverage.functions) {
      recommendations.push({
        type: 'overall_functions',
        priority: 'high',
        message: `函数覆盖率 ${summary.functions.percentage.toFixed(2)}% 低于目标 ${this.options.minCoverage.functions}%`,
        suggestion: '为未测试的函数添加测试用例',
      });
    }

    // 检查文件级覆盖率
    const lowCoverageFiles = this.analysisResults.files.filter(
      (file) => file.statements.percentage < 50
    );

    if (lowCoverageFiles.length > 0) {
      recommendations.push({
        type: 'low_coverage_files',
        priority: 'medium',
        message: `${lowCoverageFiles.length} 个文件的覆盖率低于50%`,
        suggestion: '优先为这些文件添加测试用例',
        files: lowCoverageFiles.map((f) => f.path),
      });
    }

    // 检查复杂度高但覆盖率低的文件
    const complexUncoveredFiles = this.analysisResults.files.filter(
      (file) => file.complexity > 10 && file.statements.percentage < 70
    );

    if (complexUncoveredFiles.length > 0) {
      recommendations.push({
        type: 'complex_uncovered',
        priority: 'high',
        message: `${complexUncoveredFiles.length} 个复杂文件的覆盖率不足`,
        suggestion: '复杂代码需要更全面的测试覆盖',
        files: complexUncoveredFiles.map((f) => f.path),
      });
    }

    // 检查未覆盖行数最多的文件
    const topUncoveredFiles = this.analysisResults.uncoveredLines.slice(0, 5);
    if (topUncoveredFiles.length > 0) {
      recommendations.push({
        type: 'most_uncovered',
        priority: 'medium',
        message: '以下文件有最多的未覆盖代码行',
        suggestion: '优先为这些文件添加测试以快速提升覆盖率',
        files: topUncoveredFiles.map((f) => `${f.file} (${f.count} 行)`),
      });
    }

    this.analysisResults.recommendations = recommendations;
  }

  /**
   * 分析覆盖率趋势
   */
  analyzeTrends() {
    // 尝试读取历史覆盖率数据
    const historyFile = path.join(
      this.options.projectRoot,
      this.options.outputDir,
      'coverage-history.json'
    );

    let history = [];
    if (fs.existsSync(historyFile)) {
      try {
        const historyData = fs.readFileSync(historyFile, 'utf8');
        history = JSON.parse(historyData);
      } catch (error) {
        console.warn('读取覆盖率历史数据失败:', error.message);
      }
    }

    // 添加当前数据
    const currentData = {
      timestamp: new Date().toISOString(),
      summary: this.analysisResults.summary,
    };

    history.push(currentData);

    // 保留最近30次记录
    if (history.length > 30) {
      history = history.slice(-30);
    }

    // TODO: 考虑将此函数拆分为更小的函数 (当前 35 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 38 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 41 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 44 行)

    // 保存历史数据
    try {
      fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
    } catch (error) {
      console.warn('保存覆盖率历史数据失败:', error.message);
    }

    // 分析趋势
    if (history.length >= 2) {
      const previous = history[history.length - 2];
      const current = history[history.length - 1];

      this.analysisResults.trends = {
        statements: {
          change: current.summary.statements.percentage - previous.summary.statements.percentage,
          trend: this.getTrendDirection(
            current.summary.statements.percentage,
            previous.summary.statements.percentage
          ),
        },
        branches: {
          change: current.summary.branches.percentage - previous.summary.branches.percentage,
          trend: this.getTrendDirection(
            current.summary.branches.percentage,
            previous.summary.branches.percentage
          ),
        },
        functions: {
          change: current.summary.functions.percentage - previous.summary.functions.percentage,
          trend: this.getTrendDirection(
            current.summary.functions.percentage,
            previous.summary.functions.percentage
          ),
        },
        lines: {
          change: current.summary.lines.percentage - previous.summary.lines.percentage,

          // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

          // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

          // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

          // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

          trend: this.getTrendDirection(
            current.summary.lines.percentage,
            previous.summary.lines.percentage
          ),
        },
      };
    }
  }

  /**
   * 生成报告
   */
  async generateReports() {
    console.log('📊 生成覆盖率报告...');

    const outputDir = path.join(this.options.projectRoot, this.options.outputDir);

    // 生成JSON报告
    const jsonReport = {
      timestamp: new Date().toISOString(),
      configuration: this.options,
      ...this.analysisResults,
    };

    const jsonPath = path.join(outputDir, 'coverage-analysis.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));

    // 生成Markdown报告
    const markdownContent = this.generateMarkdownReport(jsonReport);
    const markdownPath = path.join(outputDir, 'coverage-report.md');
    fs.writeFileSync(markdownPath, markdownContent);

    console.log('✅ 报告已生成:');
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   Markdown: ${markdownPath}`);
    console.log(`   HTML: ${path.join(outputDir, 'lcov-report/index.html')}`);
  }

  /**
   * 生成Markdown报告
   */
  generateMarkdownReport(report) {
    const { summary } = report;

    let markdown = '# 代码覆盖率分析报告\n\n';
    markdown += `> 生成时间: ${report.timestamp}\n\n`;

    // 总体覆盖率
    markdown += '## 📊 总体覆盖率\n\n';
    markdown += '| 指标 | 覆盖数量 | 总数量 | 覆盖率 | 状态 |\n';
    markdown += '|------|----------|--------|--------|------|\n';

    const metrics = ['statements', 'branches', 'functions', 'lines'];
    const metricNames = { statements: '语句', branches: '分支', functions: '函数', lines: '行' };

    for (const metric of metrics) {
      const data = summary[metric];
      const status = data.percentage >= this.options.minCoverage[metric] ? '✅' : '❌';
      markdown += `| ${metricNames[metric]} | ${data.covered} | ${data.total} | ${data.percentage.toFixed(2)}% | ${status} |\n`;
    }

    // 趋势分析
    if (report.trends && Object.keys(report.trends).length > 0) {
      markdown += '\n## 📈 覆盖率趋势\n\n';
      markdown += '| 指标 | 变化 | 趋势 |\n';
      markdown += '|------|------|------|\n';

      for (const metric of metrics) {
        if (report.trends[metric]) {
          const trend = report.trends[metric];
          const trendIcon = trend.trend === 'up' ? '📈' : trend.trend === 'down' ? '📉' : '➡️';
          markdown += `| ${metricNames[metric]} | ${trend.change > 0 ? '+' : ''}${trend.change.toFixed(2)}% | ${trendIcon} |\n`;
        }
      }
    }

    // 文件覆盖率（最低的10个）
    markdown += '\n## 📁 文件覆盖率 (最需要改进的10个文件)\n\n';
    markdown += '| 文件 | 语句覆盖率 | 分支覆盖率 | 函数覆盖率 | 未覆盖行数 |\n';
    markdown += '|------|------------|------------|------------|------------|\n';

    const topFiles = report.files.slice(0, 10);
    for (const file of topFiles) {
      markdown += `| ${file.path} | ${file.statements.percentage.toFixed(2)}% | ${file.branches.percentage.toFixed(2)}% | ${file.functions.percentage.toFixed(2)}% | ${file.uncoveredLines.length} |\n`;
    }

    // 改进建议
    if (report.recommendations.length > 0) {
      markdown += '\n## 💡 改进建议\n\n';

      const priorityOrder = { high: 1, medium: 2, low: 3 };
      const sortedRecommendations = report.recommendations.sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );

      for (const rec of sortedRecommendations) {
        const priorityIcon =
          rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        markdown += `### ${priorityIcon} ${rec.message}\n\n`;
        markdown += `**建议**: ${rec.suggestion}\n\n`;

        if (rec.files && rec.files.length > 0) {
          markdown += '**相关文件**:\n';
          for (const file of rec.files.slice(0, 5)) {
            markdown += `- ${file}\n`;
          }
          if (rec.files.length > 5) {
            markdown += `- ... 还有 ${rec.files.length - 5} 个文件\n`;
          }
        }
        markdown += '\n';
      }
    }

    // 未覆盖代码统计
    if (report.uncoveredLines.length > 0) {
      markdown += '\n## 🔍 未覆盖代码统计\n\n';
      markdown += '| 文件 | 未覆盖行数 |\n';
      markdown += '|------|------------|\n';

      for (const uncovered of report.uncoveredLines.slice(0, 10)) {
        markdown += `| ${uncovered.file} | ${uncovered.count} |\n`;
      }
    }

    return markdown;
  }

  /**
   * 检查覆盖率阈值
   */
  checkCoverageThresholds() {
    const { summary } = this.analysisResults;
    const failures = [];

    if (summary.statements.percentage < this.options.minCoverage.statements) {
      failures.push(
        `语句覆盖率 ${summary.statements.percentage.toFixed(2)}% < ${this.options.minCoverage.statements}%`
      );
    }

    if (summary.branches.percentage < this.options.minCoverage.branches) {
      failures.push(
        `分支覆盖率 ${summary.branches.percentage.toFixed(2)}% < ${this.options.minCoverage.branches}%`
      );
    }

    if (summary.functions.percentage < this.options.minCoverage.functions) {
      failures.push(
        `函数覆盖率 ${summary.functions.percentage.toFixed(2)}% < ${this.options.minCoverage.functions}%`
      );
    }

    if (summary.lines.percentage < this.options.minCoverage.lines) {
      failures.push(
        `行覆盖率 ${summary.lines.percentage.toFixed(2)}% < ${this.options.minCoverage.lines}%`
      );
    }

    if (failures.length > 0) {
      console.warn('\n⚠️  覆盖率阈值检查失败:');
      failures.forEach((failure) => console.warn(`   - ${failure}`));

      if (process.env.CI === 'true') {
        console.error('\n❌ CI环境中覆盖率不足，构建失败');
        process.exit(1);
      }
    } else {
      console.log('\n✅ 所有覆盖率阈值检查通过');
    }
  }

  /**
   * 辅助方法
   */
  shouldExcludeFile(filePath) {
    return this.options.excludePatterns.some((pattern) => {
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
      return regex.test(filePath);
    });
  }

  calculateCoveragePercentage(values, predicate) {
    if (values.length === 0) {
      return 0;
    }
    const covered = values.filter(predicate).length;
    return (covered / values.length) * 100;
  }

  getUncoveredLines(fileData) {
    const uncoveredLines = [];
    const statements = fileData.s || {};
    const statementMap = fileData.statementMap || {};

    for (const [statementId, executionCount] of Object.entries(statements)) {
      if (executionCount === 0 && statementMap[statementId]) {
        const location = statementMap[statementId];
        uncoveredLines.push({
          line: location.start.line,
          column: location.start.column,
          endLine: location.end.line,
          endColumn: location.end.column,
        });
      }
    }

    return uncoveredLines.sort((a, b) => a.line - b.line);
  }

  calculateComplexity(fileData) {
    // 简单的复杂度计算：分支数量 + 函数数量
    const branches = fileData.b || {};
    const functions = fileData.f || {};

    const branchCount = Object.values(branches).reduce((sum, branch) => sum + branch.length, 0);
    const functionCount = Object.keys(functions).length;

    return branchCount + functionCount;
  }

  getTrendDirection(current, previous) {
    const diff = current - previous;
    if (Math.abs(diff) < 0.1) {
      return 'stable';
    }
    return diff > 0 ? 'up' : 'down';
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new CoverageAnalyzer();

  analyzer.analyze().catch((error) => {
    console.error('覆盖率分析失败:', error);
    process.exit(1);
  });
}

export default CoverageAnalyzer;
