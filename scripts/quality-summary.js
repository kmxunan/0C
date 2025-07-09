#!/usr/bin/env node
/* eslint-disable no-console, no-magic-numbers */

/**
 * 代码质量提升总结脚本
 * 整合所有质量提升结果并生成综合报告
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

class QualitySummary {
  constructor() {
    this.projectRoot = process.cwd();
    this.reportsDir = path.join(this.projectRoot, 'reports');
    this.summary = {
      timestamp: new Date().toISOString(),
      overall: {
        qualityScore: 0,
        grade: 'F',
        improvements: 0,
      },
      codeQuality: {},
      security: {},
      complexity: {},
      performance: {},
      recommendations: [],
    };
  }

  /**
   * 生成综合质量报告
   */
  async generateSummary() {
    console.log(colors.bold(colors.blue('📊 生成代码质量提升综合报告...\n')));

    try {
      await this.loadReports();
      await this.calculateOverallScore();
      await this.generateRecommendations();
      await this.saveReport();
      await this.displaySummary();

      console.log(colors.green('\n✅ 综合报告生成完成!'));
    } catch (error) {
      console.error(colors.red('❌ 生成报告时出现错误:'), error.message);
      process.exit(1);
    }
  }

  /**
   * 加载所有报告
   */
  async loadReports() {
    console.log(colors.yellow('📂 加载质量报告...'));

    // 加载代码质量报告
    await this.loadCodeQualityReport();

    // 加载安全修复报告
    await this.loadSecurityReport();

    // 加载复杂度优化报告
    await this.loadComplexityReport();

    // 加载性能报告
    await this.loadPerformanceReport();

    console.log(colors.green('  ✅ 所有报告加载完成'));
  }

  /**
   * 加载代码质量报告
   */
  async loadCodeQualityReport() {
    const reportPaths = [
      path.join(this.reportsDir, 'quality-enhancement-report.json'),
      path.join(this.reportsDir, 'code-quality-fix-report.json'),
    ];

    for (const reportPath of reportPaths) {
      if (fs.existsSync(reportPath)) {
        try {
          const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
          this.summary.codeQuality = {
            ...this.summary.codeQuality,
            ...report,
          };
          console.log(colors.blue(`    📋 已加载: ${path.basename(reportPath)}`));
        } catch (error) {
          console.log(colors.yellow(`    ⚠️  无法解析: ${path.basename(reportPath)}`));
        }
      }
    }
  }

  /**
   * 加载安全报告
   */
  async loadSecurityReport() {
    const reportPath = path.join(this.reportsDir, 'security-fix-report.json');

    if (fs.existsSync(reportPath)) {
      try {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        this.summary.security = report;
        console.log(colors.blue('    🔒 已加载: security-fix-report.json'));
      } catch (error) {
        console.log(colors.yellow('    ⚠️  无法解析安全报告'));
      }
    }
  }

  /**
   * 加载复杂度报告
   */
  async loadComplexityReport() {
    const reportPath = path.join(this.reportsDir, 'complexity-optimization-report.json');

    if (fs.existsSync(reportPath)) {
      try {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        this.summary.complexity = report;
        console.log(colors.blue('    🔧 已加载: complexity-optimization-report.json'));
      } catch (error) {
        console.log(colors.yellow('    ⚠️  无法解析复杂度报告'));
      }
    }
  }

  /**
   * 加载性能报告
   */
  async loadPerformanceReport() {
    const reportPath = path.join(this.projectRoot, 'performance-report.json');

    if (fs.existsSync(reportPath)) {
      try {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        this.summary.performance = report;
        console.log(colors.blue('    ⚡ 已加载: performance-report.json'));
      } catch (error) {
        console.log(colors.yellow('    ⚠️  无法解析性能报告'));
      }
    }
  }

  /**
   * 计算总体质量评分
   */
  async calculateOverallScore() {
    console.log(colors.yellow('\n🧮 计算总体质量评分...'));

    let totalScore = 0;
    let maxScore = 0;

    // 代码质量评分 (40%)
    if (this.summary.codeQuality.qualityScore) {
      const codeScore = this.summary.codeQuality.qualityScore || 0;
      totalScore += codeScore * 0.4;
      maxScore += 100 * 0.4;
    }

    // 安全评分 (30%)
    if (this.summary.security.summary) {
      const securityScore = this.calculateSecurityScore();
      totalScore += securityScore * 0.3;
      maxScore += 100 * 0.3;
    }

    // 复杂度评分 (20%)
    if (this.summary.complexity.summary) {
      const complexityScore = this.calculateComplexityScore();
      totalScore += complexityScore * 0.2;
      maxScore += 100 * 0.2;
    }

    // 性能评分 (10%)
    if (this.summary.performance.performanceScore) {
      const perfScore = this.summary.performance.performanceScore || 0;
      totalScore += perfScore * 0.1;
      maxScore += 100 * 0.1;
    }

    this.summary.overall.qualityScore =
      maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    this.summary.overall.grade = this.getGrade(this.summary.overall.qualityScore);

    console.log(
      colors.green(
        `  📊 总体质量评分: ${this.summary.overall.qualityScore}/100 (${this.summary.overall.grade})`
      )
    );
  }

  /**
   * 计算安全评分
   */
  calculateSecurityScore() {
    const security = this.summary.security.summary;
    if (!security) {
      return 0;
    }

    const totalIssues = security.totalSecurityIssues || 0;
    const fixedFiles = security.fixedFiles || 0;

    if (totalIssues === 0) {
      return 100;
    }

    // 基于修复比例计算分数
    const fixRatio = fixedFiles / Math.max(totalIssues, 1);
    return Math.max(0, Math.min(100, 100 - totalIssues + fixRatio * 50));
  }

  /**
   * 计算复杂度评分
   */
  calculateComplexityScore() {
    const complexity = this.summary.complexity.summary;
    if (!complexity) {
      return 0;
    }

    const optimizedFiles = complexity.optimizedFiles || 0;
    const extractedFunctions = complexity.extractedFunctions || 0;
    const reducedNesting = complexity.reducedNesting || 0;

    // 基于优化数量计算分数
    const optimizationScore = Math.min(
      100,
      optimizedFiles * 2 + extractedFunctions * 1 + reducedNesting * 5
    );
    return optimizationScore;
  }

  /**
   * 获取等级
   */
  getGrade(score) {
    if (score >= 90) {
      return 'A+';
    }
    if (score >= 85) {
      return 'A';
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (score >= 80) {
      return 'A-';
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (score >= 75) {
      return 'B+';
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (score >= 70) {
      return 'B';
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (score >= 65) {
      return 'B-';
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (score >= 60) {
      return 'C+';
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (score >= 55) {
      return 'C';
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (score >= 50) {
      return 'C-';
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (score >= 45) {
      return 'D+';
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (score >= 40) {
      return 'D';
    }
    return 'F';
  }

  /**
   * 生成改进建议
   */
  async generateRecommendations() {
    console.log(colors.yellow('\n💡 生成改进建议...'));

    const recommendations = [];

    // 基于质量评分生成建议
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (this.summary.overall.qualityScore < 70) {
      recommendations.push({
        priority: 'high',
        category: '整体质量',
        suggestion: '代码质量需要显著改进，建议优先处理高影响问题',
      });
    }

    // 安全建议
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (this.summary.security.summary?.totalSecurityIssues > 0) {
      recommendations.push({
        priority: 'critical',
        category: '安全',
        suggestion: `发现 ${this.summary.security.summary.totalSecurityIssues} 个安全问题，需要立即处理`,
      });
    }

    // 复杂度建议
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (this.summary.complexity.summary?.optimizedFiles > 0) {
      recommendations.push({
        priority: 'medium',
        category: '复杂度',
        suggestion: `已优化 ${this.summary.complexity.summary.optimizedFiles} 个文件，继续重构剩余高复杂度代码`,
      });
    }

    // 性能建议
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (this.summary.performance.performanceScore < 80) {
      recommendations.push({
        priority: 'medium',
        category: '性能',
        suggestion: '性能有待提升，建议优化关键路径和减少资源消耗',
      });
    }

    // 通用建议
    recommendations.push(
      {
        priority: 'low',
        category: '维护',
        suggestion: '建立定期代码审查机制，持续监控代码质量',
      },
      {
        priority: 'low',
        category: '测试',
        suggestion: '增加单元测试覆盖率，确保代码变更的安全性',
      },
      {
        priority: 'low',
        category: '文档',
        suggestion: '完善代码文档和API文档，提高代码可维护性',
      }
    );

    this.summary.recommendations = recommendations;
    console.log(colors.green(`  💡 生成了 ${recommendations.length} 条改进建议`));
  }

  /**
   * 保存报告
   */
  async saveReport() {
    console.log(colors.yellow('\n💾 保存综合报告...'));

    // 保存JSON报告
    const jsonReportPath = path.join(this.reportsDir, 'quality-summary-report.json');
    await fs.promises.writeFile(jsonReportPath, JSON.stringify(this.summary, null, 2));

    // 生成HTML报告
    const htmlReport = this.generateHtmlReport();
    const htmlReportPath = path.join(this.reportsDir, 'quality-summary-report.html');
    await fs.promises.writeFile(htmlReportPath, htmlReport);

    console.log(colors.green(`  📄 JSON报告: ${jsonReportPath}`));
    console.log(colors.green(`  🌐 HTML报告: ${htmlReportPath}`));
  }

  /**
   * 生成HTML报告
   */

  // TODO: 考虑将此函数拆分为更小的函数 (当前 190 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 190 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 190 行)

  generateHtmlReport() {
    const gradeColor = this.getGradeColor(this.summary.overall.grade);

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>代码质量提升综合报告</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header .subtitle {
            margin-top: 10px;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .score-section {
            padding: 40px;
            text-align: center;
            background: #f8f9fa;
        }
        .score-circle {
            width: 200px;
            height: 200px;
            border-radius: 50%;
            background: conic-gradient(${gradeColor} ${this.summary.overall.qualityScore * 3.6}deg, #e9ecef 0deg);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            position: relative;
        }
        .score-circle::before {
            content: '';
            width: 160px;
            height: 160px;
            border-radius: 50%;
            background: white;
            position: absolute;
        }
        .score-text {
            position: relative;
            z-index: 1;
            font-size: 3em;
            font-weight: bold;
            color: ${gradeColor};
        }
        .grade {
            font-size: 2em;
            font-weight: bold;
            color: ${gradeColor};
            margin-top: 10px;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 40px;
        }
        .metric-card {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            border-left: 4px solid #3498db;
        }
        .metric-card h3 {
            margin: 0 0 15px 0;
            color: #2c3e50;
            font-size: 1.3em;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #3498db;
            margin-bottom: 10px;
        }
        .metric-description {
            color: #7f8c8d;
            font-size: 0.9em;
        }
        .recommendations {
            padding: 40px;
            background: #f8f9fa;
        }
        .recommendations h2 {
            color: #2c3e50;
            margin-bottom: 25px;
            font-size: 1.8em;
        }
        .recommendation {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            border-left: 4px solid #e74c3c;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .recommendation.high { border-left-color: #e74c3c; }
        .recommendation.medium { border-left-color: #f39c12; }
        .recommendation.low { border-left-color: #27ae60; }
        .recommendation.critical { border-left-color: #8e44ad; }
        .priority {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 10px;
        }
        .priority.critical { background: #8e44ad; color: white; }
        .priority.high { background: #e74c3c; color: white; }
        .priority.medium { background: #f39c12; color: white; }
        .priority.low { background: #27ae60; color: white; }
        .footer {
            padding: 30px;
            text-align: center;
            background: #2c3e50;
            color: white;
        }
        .timestamp {
            opacity: 0.7;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 代码质量提升综合报告</h1>
            <div class="subtitle">全面的代码质量分析与改进建议</div>
        </div>
        
        <div class="score-section">
            <div class="score-circle">
                <div class="score-text">${this.summary.overall.qualityScore}</div>
            </div>
            <div class="grade">等级: ${this.summary.overall.grade}</div>
            <p>综合质量评分基于代码质量、安全性、复杂度和性能等多个维度</p>
        </div>
        
        <div class="metrics">
            ${this.generateMetricCards()}
        </div>
        
        <div class="recommendations">
            <h2>📋 改进建议</h2>
            ${this.summary.recommendations
              .map(
                (rec) => `
                <div class="recommendation ${rec.priority}">
                    <span class="priority ${rec.priority}">${rec.priority}</span>
                    <h4>${rec.category}</h4>
                    <p>${rec.suggestion}</p>
                </div>
            `
              )
              .join('')}
        </div>
        
        <div class="footer">
            <div class="timestamp">报告生成时间: ${new Date(this.summary.timestamp).toLocaleString('zh-CN')}</div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * 生成指标卡片
   */
  generateMetricCards() {
    const cards = [];

    // 安全指标
    if (this.summary.security.summary) {
      const sec = this.summary.security.summary;
      cards.push(`
        <div class="metric-card">
            <h3>🔒 安全性</h3>
            <div class="metric-value">${sec.fixedFiles || 0}</div>
            <div class="metric-description">已修复文件数 / 总问题数: ${sec.totalSecurityIssues || 0}</div>
        </div>
      `);
    }

    // 复杂度指标
    if (this.summary.complexity.summary) {
      const comp = this.summary.complexity.summary;
      cards.push(`
        <div class="metric-card">
            <h3>🔧 复杂度优化</h3>
            <div class="metric-value">${comp.optimizedFiles || 0}</div>
            <div class="metric-description">已优化文件数 / 提取函数: ${comp.extractedFunctions || 0}</div>
        </div>
      `);
    }

    // 性能指标
    if (this.summary.performance.performanceScore) {
      cards.push(`
        <div class="metric-card">
            <h3>⚡ 性能</h3>
            <div class="metric-value">${this.summary.performance.performanceScore}</div>
            <div class="metric-description">性能评分 / 100</div>
        </div>
      `);
    }

    // 代码质量指标
    if (this.summary.codeQuality.qualityScore) {
      cards.push(`
        <div class="metric-card">
            <h3>📊 代码质量</h3>
            <div class="metric-value">${this.summary.codeQuality.qualityScore}</div>
            <div class="metric-description">代码质量评分 / 100</div>
        </div>
      `);
    }

    return cards.join('');
  }

  /**
   * 获取等级颜色
   */
  getGradeColor(grade) {
    const colorMap = {
      'A+': '#27ae60',
      A: '#2ecc71',
      'A-': '#58d68d',
      'B+': '#f39c12',
      B: '#f1c40f',
      'B-': '#f4d03f',
      'C+': '#e67e22',
      C: '#d68910',
      'C-': '#dc7633',
      'D+': '#e74c3c',
      D: '#cb4335',
      F: '#922b21',
    };
    return colorMap[grade] || '#95a5a6';
  }

  /**
   * 显示摘要
   */
  async displaySummary() {
    console.log(colors.bold(colors.cyan('\n📋 代码质量提升综合摘要')));
    console.log(colors.cyan('='.repeat(50)));

    // 总体评分
    console.log(
      colors.bold(
        `\n🎯 总体质量评分: ${this.summary.overall.qualityScore}/100 (${this.summary.overall.grade})`
      )
    );

    // 各项指标
    if (this.summary.security.summary) {
      const sec = this.summary.security.summary;
      console.log(colors.blue('\n🔒 安全性:'));
      console.log(colors.blue(`   • 总安全问题: ${sec.totalSecurityIssues || 0}`));
      console.log(colors.blue(`   • 已修复文件: ${sec.fixedFiles || 0}`));
      console.log(colors.blue(`   • 路径遍历: ${sec.pathTraversalIssues || 0}`));
      console.log(colors.blue(`   • 硬编码密钥: ${sec.hardcodedSecrets || 0}`));
    }

    if (this.summary.complexity.summary) {
      const comp = this.summary.complexity.summary;
      console.log(colors.yellow('\n🔧 复杂度优化:'));
      console.log(colors.yellow(`   • 优化文件数: ${comp.optimizedFiles || 0}`));
      console.log(colors.yellow(`   • 提取函数数: ${comp.extractedFunctions || 0}`));
      console.log(colors.yellow(`   • 拆分类数: ${comp.splitClasses || 0}`));
      console.log(colors.yellow(`   • 减少嵌套: ${comp.reducedNesting || 0}`));
    }

    if (this.summary.performance.performanceScore) {
      console.log(colors.magenta('\n⚡ 性能:'));
      console.log(
        colors.magenta(`   • 性能评分: ${this.summary.performance.performanceScore}/100`)
      );
    }

    // 关键建议
    const criticalRecs = this.summary.recommendations.filter(
      (r) => r.priority === 'critical' || r.priority === 'high'
    );
    if (criticalRecs.length > 0) {
      console.log(colors.red('\n🚨 关键建议:'));
      criticalRecs.forEach((rec) => {
        console.log(colors.red(`   • [${rec.category}] ${rec.suggestion}`));
      });
    }

    console.log(colors.cyan(`\n${'='.repeat(50)}`));
    console.log(colors.green('📊 详细报告已保存到 reports/ 目录'));
  }
}

// 命令行执行
if (import.meta.url === `file://${process.argv[1]}`) {
  const summary = new QualitySummary();
  summary.generateSummary().catch(console.error);
}

export default QualitySummary;
