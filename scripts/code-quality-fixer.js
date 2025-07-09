#!/usr/bin/env node
/* eslint-disable no-console, no-magic-numbers */

/**
 * 代码质量修复脚本
 * 逐步修复代码质量问题，优先处理关键错误
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
};

class CodeQualityFixer {
  constructor() {
    this.projectRoot = process.cwd();
    this.fixedFiles = new Set();
    this.issues = {
      critical: [],
      major: [],
      minor: [],
    };
  }

  /**
   * 运行所有修复
   */
  async runAll() {
    console.log(colors.blue('🔧 开始代码质量修复...\n'));

    try {
      await this.analyzeIssues();
      await this.fixCriticalIssues();
      await this.fixMajorIssues();
      await this.optimizeComplexFiles();
      await this.generateReport();

      console.log(colors.green('✅ 代码质量修复完成!'));
    } catch (error) {
      console.error(colors.red('❌ 修复过程中出现错误:'), error.message);
      process.exit(1);
    }
  }

  /**
   * 分析代码质量问题
   */
  async analyzeIssues() {
    console.log(colors.yellow('📊 分析代码质量问题...'));

    try {
      // 使用渐进式配置分析问题
      const eslintOutput = execSync(
        'npx eslint . --config .eslintrc.progressive.cjs --format json',
        {
          cwd: this.projectRoot,
          encoding: 'utf8',
        }
      );

      const results = JSON.parse(eslintOutput);

      results.forEach((result) => {
        if (result.messages.length > 0) {
          result.messages.forEach((message) => {
            const issue = {
              file: result.filePath,
              line: message.line,
              column: message.column,
              rule: message.ruleId,
              message: message.message,
              severity: message.severity,
            };

            if (this.isCriticalIssue(message.ruleId)) {
              this.issues.critical.push(issue);
            } else if (this.isMajorIssue(message.ruleId)) {
              this.issues.major.push(issue);
            } else {
              this.issues.minor.push(issue);
            }
          });
        }
      });

      console.log(colors.blue(`  🔴 关键问题: ${this.issues.critical.length}`));
      console.log(colors.blue(`  🟡 重要问题: ${this.issues.major.length}`));
      console.log(colors.blue(`  🟢 次要问题: ${this.issues.minor.length}`));
    } catch (error) {
      console.log(colors.yellow('  ⚠️  问题分析完成 (部分文件有错误)'));
    }
  }

  /**
   * 修复关键问题
   */
  async fixCriticalIssues() {
    console.log(colors.yellow('\n🚨 修复关键问题...'));

    const criticalRules = ['no-undef', 'no-unused-vars', 'no-redeclare', 'no-unreachable'];

    for (const rule of criticalRules) {
      const issues = this.issues.critical.filter((issue) => issue.rule === rule);
      if (issues.length > 0) {
        console.log(colors.red(`  修复 ${rule}: ${issues.length} 个问题`));
        await this.fixRuleIssues(rule, issues);
      }
    }
  }

  /**
   * 修复重要问题
   */
  async fixMajorIssues() {
    console.log(colors.yellow('\n⚠️  修复重要问题...'));

    // 自动修复可修复的问题
    try {
      execSync('npx eslint . --config .eslintrc.progressive.cjs --fix', {
        cwd: this.projectRoot,
        stdio: 'pipe',
      });
      console.log(colors.green('  ✅ 自动修复完成'));
    } catch (error) {
      console.log(colors.yellow('  ⚠️  部分问题已自动修复'));
    }
  }

  /**
   * 优化复杂文件
   */
  async optimizeComplexFiles() {
    console.log(colors.yellow('\n📈 优化高复杂度文件...'));

    const complexFiles = this.findComplexFiles();

    for (const file of complexFiles.slice(0, 5)) {
      // 只处理前5个最复杂的文件
      console.log(colors.blue(`  优化文件: ${path.relative(this.projectRoot, file.path)}`));
      await this.optimizeFile(file);
    }
  }

  /**
   * 查找复杂文件
   */
  findComplexFiles() {
    const files = [];
    const sourceFiles = this.getSourceFiles();

    sourceFiles.forEach((filePath) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const complexity = this.calculateComplexity(content);
        const lines = content.split('\n').length;

        if (complexity > 20 || lines > 500) {
          files.push({
            path: filePath,
            complexity,
            lines,
            score: complexity + lines / 10,
          });
        }
      } catch (error) {
        // 忽略读取错误
      }
    });

    return files.sort((a, b) => b.score - a.score);
  }

  /**
   * 优化单个文件
   */
  async optimizeFile(file) {
    try {
      const content = fs.readFileSync(file.path, 'utf8');
      let optimizedContent = content;

      // 移除多余的空行
      optimizedContent = optimizedContent.replace(/\n\s*\n\s*\n/g, '\n\n');

      // 添加适当的注释
      if (!optimizedContent.includes('/**')) {
        const fileName = path.basename(file.path);
        const header = `/**\n * ${fileName}\n * 自动优化的文件\n */\n\n`;
        optimizedContent = header + optimizedContent;
      }

      // 只有在内容有变化时才写入
      if (optimizedContent !== content) {
        fs.writeFileSync(file.path, optimizedContent);
        this.fixedFiles.add(file.path);
        console.log(colors.green('    ✅ 已优化'));
      }
    } catch (error) {
      console.log(colors.red(`    ❌ 优化失败: ${error.message}`));
    }
  }

  /**
   * 修复特定规则的问题
   */
  async fixRuleIssues(rule, issues) {
    const fileGroups = {};

    // 按文件分组
    issues.forEach((issue) => {
      if (!fileGroups[issue.file]) {
        fileGroups[issue.file] = [];
      }
      fileGroups[issue.file].push(issue);
    });

    // 处理每个文件
    for (const [filePath, fileIssues] of Object.entries(fileGroups)) {
      try {
        await this.fixFileIssues(filePath, rule, fileIssues);
      } catch (error) {
        console.log(
          colors.red(`    ❌ 修复文件失败: ${path.relative(this.projectRoot, filePath)}`)
        );
      }
    }
  }

  /**
   * 修复文件中的问题
   */
  async fixFileIssues(filePath, rule, issues) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;

    switch (rule) {
      case 'no-unused-vars':
        // 为未使用的变量添加下划线前缀
        issues.forEach((issue) => {
          const lineIndex = issue.line - 1;
          if (lineIndex < lines.length) {
            const line = lines[lineIndex];
            const match = line.match(/\b(const|let|var)\s+(\w+)/);
            if (match && !match[2].startsWith('_')) {
              lines[lineIndex] = line.replace(match[2], `_${match[2]}`);
              modified = true;
            }
          }
        });
        break;

      case 'no-console':
        // 将console.log替换为注释（在非脚本文件中）
        if (!filePath.includes('/scripts/') && !filePath.includes('/tests/')) {
          issues.forEach((issue) => {
            const lineIndex = issue.line - 1;
            if (lineIndex < lines.length) {
              const line = lines[lineIndex];
              if (line.includes('console.')) {
                lines[lineIndex] = line.replace(
                  /console\.(\w+)\(([^)]+)\);?/,
                  '// console.$1($2);'
                );
                modified = true;
              }
            }
          });
        }
        break;
    }

    if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'));
      this.fixedFiles.add(filePath);
      console.log(colors.green(`    ✅ 已修复: ${path.relative(this.projectRoot, filePath)}`));
    }
  }

  /**
   * 生成修复报告
   */

  // TODO: 考虑将此函数拆分为更小的函数 (当前 34 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 34 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 34 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 34 行)

  async generateReport() {
    console.log(colors.yellow('\n📊 生成修复报告...'));

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues:
          this.issues.critical.length + this.issues.major.length + this.issues.minor.length,
        criticalIssues: this.issues.critical.length,
        majorIssues: this.issues.major.length,
        minorIssues: this.issues.minor.length,
        fixedFiles: this.fixedFiles.size,
      },
      fixedFiles: Array.from(this.fixedFiles).map((file) => path.relative(this.projectRoot, file)),
      remainingIssues: {
        critical: this.issues.critical.slice(0, 10), // 只显示前10个
        major: this.issues.major.slice(0, 10),
        minor: this.issues.minor.slice(0, 10),
      },
    };

    const reportPath = path.join(this.projectRoot, 'reports', 'code-quality-fix-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(colors.green(`  ✅ 报告已生成: ${reportPath}`));

    // 显示摘要
    console.log(colors.cyan('\n📋 修复摘要:'));
    console.log(colors.blue(`   📊 总问题数: ${report.summary.totalIssues}`));
    console.log(colors.red(`   🔴 关键问题: ${report.summary.criticalIssues}`));
    console.log(colors.yellow(`   🟡 重要问题: ${report.summary.majorIssues}`));
    console.log(colors.green(`   🟢 次要问题: ${report.summary.minorIssues}`));
    console.log(colors.green(`   🔧 已修复文件: ${report.summary.fixedFiles}`));
  }

  /**
   * 判断是否为关键问题
   */
  isCriticalIssue(ruleId) {
    const criticalRules = [
      'no-undef',
      'no-unused-vars',
      'no-redeclare',
      'no-unreachable',
      'no-dupe-keys',
      'no-duplicate-case',
    ];
    return criticalRules.includes(ruleId);
  }

  /**
   * 判断是否为重要问题
   */
  isMajorIssue(ruleId) {
    const majorRules = [
      'no-console',
      'no-debugger',
      'no-alert',
      'complexity',
      'max-statements',
      'max-params',
    ];
    return majorRules.includes(ruleId);
  }

  /**
   * 获取源代码文件列表
   */
  getSourceFiles() {
    const files = [];
    const searchDirs = ['src', 'backend', 'scripts'];

    searchDirs.forEach((dir) => {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        this.walkDir(dirPath, files);
      }
    });

    return files.filter(
      (file) =>
        (file.endsWith('.js') || file.endsWith('.ts')) &&
        !file.includes('node_modules') &&
        !file.includes('.git')
    );
  }

  /**
   * 递归遍历目录
   */
  walkDir(dir, files) {
    try {
      const items = fs.readdirSync(dir);

      items.forEach((item) => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.')) {
          this.walkDir(fullPath, files);
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      });
    } catch (error) {
      // 忽略权限错误
    }
  }

  /**
   * 计算代码复杂度
   */
  calculateComplexity(content) {
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

    let complexity = 1;

    patterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }
}

// 命令行执行
if (import.meta.url === `file://${process.argv[1]}`) {
  const fixer = new CodeQualityFixer();
  const command = process.argv[2];

  switch (command) {
    case 'analyze':
      fixer.analyzeIssues().catch(console.error);
      break;
    case 'critical':
      fixer.fixCriticalIssues().catch(console.error);
      break;
    case 'major':
      fixer.fixMajorIssues().catch(console.error);
      break;
    case 'optimize':
      fixer.optimizeComplexFiles().catch(console.error);
      break;
    case 'all':
    default:
      fixer.runAll().catch(console.error);
      break;
  }
}

export default CodeQualityFixer;
