#!/usr/bin/env node
/* eslint-disable no-console, no-magic-numbers */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ComplexityAnalyzer {
  constructor() {
    this.results = {
      files: [],
      summary: {
        totalFiles: 0,
        totalLines: 0,
        totalFunctions: 0,
        averageComplexity: 0,
        highComplexityFiles: [],
        duplicateCode: [],
      },
    };
  }

  // 计算圈复杂度
  calculateCyclomaticComplexity(code) {
    let complexity = 1; // 基础复杂度

    // 条件语句
    const conditionalPatterns = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bdo\s*\{/g,
      /\bswitch\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\?.*:/g, // 三元操作符
      /&&/g,
      /\|\|/g,
    ];

    conditionalPatterns.forEach((pattern) => {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  // 计算函数数量
  countFunctions(code) {
    const functionPatterns = [
      /function\s+\w+\s*\(/g,
      /\w+\s*:\s*function\s*\(/g,
      /\w+\s*=\s*function\s*\(/g,
      /\w+\s*=>\s*/g,
      /async\s+function\s+\w+\s*\(/g,
      /async\s+\w+\s*=>/g,
    ];

    let functionCount = 0;
    functionPatterns.forEach((pattern) => {
      const matches = code.match(pattern);
      if (matches) {
        functionCount += matches.length;
      }
    });

    return functionCount;
  }

  // 计算代码行数（排除空行和注释）
  countEffectiveLines(code) {
    const lines = code.split('\n');
    let effectiveLines = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      // 排除空行和单行注释
      if (
        trimmedLine &&
        !trimmedLine.startsWith('//') &&
        !trimmedLine.startsWith('*') &&
        !trimmedLine.startsWith('/*')
      ) {
        effectiveLines++;
      }
    }

    return effectiveLines;
  }

  // 检测重复代码
  detectDuplicateCode(code, filePath) {
    const lines = code.split('\n');
    const duplicates = [];
    const minDuplicateLength = 5; // 最小重复行数

    for (let i = 0; i < lines.length - minDuplicateLength; i++) {
      for (let j = i + minDuplicateLength; j < lines.length - minDuplicateLength; j++) {
        let duplicateLength = 0;

        // 检查连续重复行
        while (
          i + duplicateLength < lines.length &&
          j + duplicateLength < lines.length &&
          lines[i + duplicateLength].trim() === lines[j + duplicateLength].trim() &&
          lines[i + duplicateLength].trim() !== ''
        ) {
          duplicateLength++;
        }

        if (duplicateLength >= minDuplicateLength) {
          duplicates.push({
            file: filePath,
            startLine1: i + 1,
            endLine1: i + duplicateLength,
            startLine2: j + 1,
            endLine2: j + duplicateLength,
            duplicateLines: duplicateLength,
          });
        }
      }
    }

    return duplicates;
  }

  // 分析单个文件
  analyzeFile(filePath) {
    try {
      const code = fs.readFileSync(filePath, 'utf8');
      const lines = this.countEffectiveLines(code);
      const functions = this.countFunctions(code);
      const complexity = this.calculateCyclomaticComplexity(code);
      const duplicates = this.detectDuplicateCode(code, filePath);

      const fileResult = {
        path: filePath,
        lines,
        functions,
        complexity,
        averageComplexityPerFunction: functions > 0 ? (complexity / functions).toFixed(2) : 0,
        maintainabilityIndex: this.calculateMaintainabilityIndex(lines, complexity, functions),
        duplicates: duplicates.length,
      };

      this.results.files.push(fileResult);
      this.results.summary.duplicateCode.push(...duplicates);

      return fileResult;
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error.message);
      return null;
    }
  }

  // 计算可维护性指数
  calculateMaintainabilityIndex(lines, complexity, functions) {
    // 简化的可维护性指数计算
    // 基于 Halstead 复杂度和圈复杂度的简化版本
    const halsteadVolume = Math.log2(lines + functions) * (lines + functions);
    const maintainabilityIndex = Math.max(
      0,
      171 - 5.2 * Math.log(halsteadVolume) - 0.23 * complexity - 16.2 * Math.log(lines)
    );

    return Math.round(maintainabilityIndex);
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
          // 跳过 node_modules 和其他不需要的目录
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

  // 生成报告

  // TODO: 考虑将此函数拆分为更小的函数 (当前 22 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 22 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 22 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 22 行)

  generateReport() {
    const { files, summary } = this.results;

    // 计算汇总统计
    summary.totalFiles = files.length;
    summary.totalLines = files.reduce((sum, file) => sum + file.lines, 0);
    summary.totalFunctions = files.reduce((sum, file) => sum + file.functions, 0);
    summary.averageComplexity =
      files.length > 0
        ? (files.reduce((sum, file) => sum + file.complexity, 0) / files.length).toFixed(2)
        : 0;

    // 找出高复杂度文件
    summary.highComplexityFiles = files
      .filter((file) => file.complexity > 10 || file.maintainabilityIndex < 20)
      .sort((a, b) => b.complexity - a.complexity);

    return {
      timestamp: new Date().toISOString(),
      summary,
      files: files.sort((a, b) => b.complexity - a.complexity),
      recommendations: this.generateRecommendations(),
    };
  }

  // 生成改进建议
  generateRecommendations() {
    const { files, summary } = this.results;
    const recommendations = [];

    // 高复杂度文件建议
    if (summary.highComplexityFiles.length > 0) {
      recommendations.push({
        type: 'complexity',
        priority: 'high',
        message: `发现 ${summary.highComplexityFiles.length} 个高复杂度文件，建议重构以降低复杂度`,
        files: summary.highComplexityFiles.slice(0, 5).map((f) => f.path),
      });
    }

    // 重复代码建议
    if (summary.duplicateCode.length > 0) {
      recommendations.push({
        type: 'duplication',
        priority: 'medium',
        message: `发现 ${summary.duplicateCode.length} 处重复代码，建议提取公共函数`,
        duplicates: summary.duplicateCode.slice(0, 3),
      });
    }

    // 大文件建议
    const largeFiles = files.filter((file) => file.lines > 200);
    if (largeFiles.length > 0) {
      recommendations.push({
        type: 'file_size',
        priority: 'medium',
        message: `发现 ${largeFiles.length} 个大文件（>200行），建议拆分为更小的模块`,
        files: largeFiles.slice(0, 5).map((f) => f.path),
      });
    }

    // 函数过多建议
    const filesWithManyFunctions = files.filter((file) => file.functions > 10);
    if (filesWithManyFunctions.length > 0) {
      recommendations.push({
        type: 'function_count',
        priority: 'low',
        message: `发现 ${filesWithManyFunctions.length} 个文件包含过多函数（>10个），建议重新组织代码结构`,
        files: filesWithManyFunctions.slice(0, 5).map((f) => f.path),
      });
    }

    return recommendations;
  }

  // 运行分析
  async run(targetPath = '.') {
    console.log('🔍 开始代码复杂度分析...');

    const startTime = Date.now();
    const absolutePath = path.resolve(targetPath);

    // 扫描文件
    const files = this.scanDirectory(absolutePath);
    console.log(`📁 发现 ${files.length} 个文件`);

    // 分析每个文件
    let processedFiles = 0;
    for (const filePath of files) {
      this.analyzeFile(filePath);
      processedFiles++;

      if (processedFiles % 10 === 0) {
        console.log(`📊 已处理 ${processedFiles}/${files.length} 个文件`);
      }
    }

    // 生成报告
    const report = this.generateReport();
    const endTime = Date.now();

    console.log(`✅ 分析完成，耗时 ${endTime - startTime}ms`);

    // 保存报告
    const reportPath = path.join(process.cwd(), 'complexity-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 报告已保存到: ${reportPath}`);

    // 显示摘要
    this.displaySummary(report);

    return report;
  }

  // 显示摘要
  displaySummary(report) {
    const { summary, recommendations } = report;

    console.log('\n📈 复杂度分析摘要:');
    console.log(`   总文件数: ${summary.totalFiles}`);
    console.log(`   总代码行数: ${summary.totalLines}`);
    console.log(`   总函数数: ${summary.totalFunctions}`);
    console.log(`   平均复杂度: ${summary.averageComplexity}`);
    console.log(`   高复杂度文件: ${summary.highComplexityFiles.length}`);
    console.log(`   重复代码块: ${summary.duplicateCode.length}`);

    if (recommendations.length > 0) {
      console.log('\n💡 改进建议:');
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
      });
    }

    // 质量评级
    const qualityScore = this.calculateQualityScore(summary);
    console.log(`\n🏆 代码质量评分: ${qualityScore}/100`);
    console.log(`   质量等级: ${this.getQualityGrade(qualityScore)}`);
  }

  // 计算质量评分
  calculateQualityScore(summary) {
    let score = 100;

    // 复杂度扣分
    if (summary.averageComplexity > 15) {
      score -= 30;
    } else if (summary.averageComplexity > 10) {
      score -= 20;
    } else if (summary.averageComplexity > 5) {
      score -= 10;
    }

    // 高复杂度文件扣分
    const highComplexityRatio = summary.highComplexityFiles.length / summary.totalFiles;
    if (highComplexityRatio > 0.3) {
      score -= 25;
    } else if (highComplexityRatio > 0.2) {
      score -= 15;
    } else if (highComplexityRatio > 0.1) {
      score -= 10;
    }

    // 重复代码扣分
    if (summary.duplicateCode.length > 10) {
      score -= 20;
    } else if (summary.duplicateCode.length > 5) {
      score -= 10;
    } else if (summary.duplicateCode.length > 0) {
      score -= 5;
    }

    return Math.max(0, score);
  }

  // 获取质量等级
  getQualityGrade(score) {
    if (score >= 90) {
      return 'A (优秀)';
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (score >= 80) {
      return 'B (良好)';
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (score >= 70) {
      return 'C (一般)';
    }
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    // TODO: 考虑使用早期返回或策略模式来减少嵌套
    if (score >= 60) {
      return 'D (较差)';
    }
    return 'F (需要重构)';
  }
}

// 命令行执行
// TODO: 考虑使用早期返回或策略模式来减少嵌套
// TODO: 考虑使用早期返回或策略模式来减少嵌套
// TODO: 考虑使用早期返回或策略模式来减少嵌套
// TODO: 考虑使用早期返回或策略模式来减少嵌套
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new ComplexityAnalyzer();
  const targetPath = process.argv[2] || '.';

  analyzer.run(targetPath).catch((error) => {
    console.error('❌ 分析失败:', error.message);
    process.exit(1);
  });
}

export default ComplexityAnalyzer;
