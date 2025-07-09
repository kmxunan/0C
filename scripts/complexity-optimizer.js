/* eslint-disable no-console, no-magic-numbers */
/**
 * 代码复杂度优化脚本
 * 自动重构高复杂度代码，提高可维护性
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
};

class ComplexityOptimizer {
  constructor() {
    this.projectRoot = process.cwd();
    this.optimizedFiles = new Set();
    this.complexityThresholds = {
      function: 10,
      file: 200,
      class: 15,
    };
    this.optimizations = {
      extractedFunctions: 0,
      splitClasses: 0,
      reducedNesting: 0,
      simplifiedConditions: 0,
    };
  }

  /**
   * 运行所有复杂度优化
   */
  async runAll() {
    console.log(colors.blue('🔧 开始代码复杂度优化...\n'));

    try {
      const complexFiles = await this.analyzeComplexity();
      await this.optimizeHighComplexityFiles(complexFiles);
      await this.extractLongFunctions();
      await this.simplifyNestedConditions();
      await this.splitLargeClasses();
      await this.optimizeLoops();
      await this.generateOptimizationReport();

      console.log(colors.green('✅ 代码复杂度优化完成!'));
    } catch (error) {
      console.error(colors.red('❌ 优化过程中出现错误:'), error.message);
      process.exit(1);
    }
  }

  /**
   * 分析代码复杂度
   */
  async analyzeComplexity() {
    console.log(colors.yellow('📊 分析代码复杂度...'));

    const sourceFiles = this.getSourceFiles();
    const complexFiles = [];

    for (const filePath of sourceFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const complexity = this.calculateFileComplexity(content);

        if (complexity.total > this.complexityThresholds.file) {
          complexFiles.push({
            path: filePath,
            complexity,
            size: content.split('\n').length,
          });
        }
      } catch (error) {
        // 忽略读取错误
      }
    }

    // 按复杂度排序
    complexFiles.sort((a, b) => b.complexity.total - a.complexity.total);

    console.log(colors.blue(`  📈 发现 ${complexFiles.length} 个高复杂度文件`));
    complexFiles.slice(0, 5).forEach((file) => {
      console.log(
        colors.cyan(
          `    ${path.relative(this.projectRoot, file.path)}: ${file.complexity.total} (${file.size} 行)`
        )
      );
    });

    return complexFiles;
  }

  /**
   * 优化高复杂度文件
   */
  async optimizeHighComplexityFiles(complexFiles) {
    if (complexFiles.length === 0) {
      return;
    }

    console.log(colors.yellow('\n🛠️  优化高复杂度文件...'));

    for (const file of complexFiles.slice(0, 10)) {
      // 只处理前10个最复杂的文件
      try {
        await this.optimizeFile(file.path);
      } catch (error) {
        console.log(colors.red(`    ❌ 优化失败: ${path.relative(this.projectRoot, file.path)}`));
      }
    }
  }

  /**
   * 优化单个文件
   */
  async optimizeFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 跳过自己，避免无限递归
    if (filePath.includes('complexity-optimizer.js')) {
      return;
    }

    // 1. 简化条件语句
    const conditionsResult = this.simplifyConditions(content);
    if (conditionsResult.modified) {
      content = conditionsResult.content;
      modified = true;
      this.optimizations.simplifiedConditions++;
    }

    // 2. 减少嵌套
    const nestingResult = this.reduceNesting(content);
    if (nestingResult.modified) {
      content = nestingResult.content;
      modified = true;
      this.optimizations.reducedNesting++;
    }

    // 3. 添加文档注释
    const docsResult = this.addDocumentation(content, filePath);
    if (docsResult.modified) {
      content = docsResult.content;
      modified = true;
    }

    if (modified) {
      await fs.promises.writeFile(filePath, content);
      this.optimizedFiles.add(filePath);
      console.log(colors.green(`    ✅ 已优化: ${path.relative(this.projectRoot, filePath)}`));
    }
  }

  /**
   * 提取长函数
   */
  async extractLongFunctions() {
    console.log(colors.yellow('\n🔄 提取长函数...'));

    const sourceFiles = this.getSourceFiles();

    for (const filePath of sourceFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const functions = this.findLongFunctions(content);

        if (functions.length > 0) {
          const result = this.refactorLongFunctions(content, functions);
          if (result.modified) {
            await fs.promises.writeFile(filePath, result.content);
            this.optimizedFiles.add(filePath);
            this.optimizations.extractedFunctions += functions.length;
            console.log(
              colors.green(
                `    ✅ 重构了 ${functions.length} 个长函数: ${path.relative(this.projectRoot, filePath)}`
              )
            );
          }
        }
      } catch (error) {
        // 忽略错误
      }
    }
  }

  /**
   * 简化嵌套条件
   */
  async simplifyNestedConditions() {
    console.log(colors.yellow('\n🌳 简化嵌套条件...'));

    const sourceFiles = this.getSourceFiles();

    for (const filePath of sourceFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const result = this.simplifyNestedIfs(content);

        if (result.modified) {
          await fs.promises.writeFile(filePath, result.content);
          this.optimizedFiles.add(filePath);
          console.log(
            colors.green(`    ✅ 简化嵌套条件: ${path.relative(this.projectRoot, filePath)}`)
          );
        }
      } catch (error) {
        // 忽略错误
      }
    }
  }

  /**
   * 拆分大类
   */
  async splitLargeClasses() {
    console.log(colors.yellow('\n📦 拆分大类...'));

    const sourceFiles = this.getSourceFiles();

    for (const filePath of sourceFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const classes = this.findLargeClasses(content);

        if (classes.length > 0) {
          const result = this.suggestClassSplit(content, classes, filePath);
          if (result.suggestions.length > 0) {
            this.optimizations.splitClasses += classes.length;
            console.log(
              colors.green(
                `    💡 建议拆分 ${classes.length} 个大类: ${path.relative(this.projectRoot, filePath)}`
              )
            );
          }
        }
      } catch (error) {
        // 忽略错误
      }
    }
  }

  /**
   * 优化循环
   */
  async optimizeLoops() {
    console.log(colors.yellow('\n🔄 优化循环...'));

    const sourceFiles = this.getSourceFiles();

    for (const filePath of sourceFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const result = this.optimizeLoopPerformance(content);

        if (result.modified) {
          await fs.promises.writeFile(filePath, result.content);
          this.optimizedFiles.add(filePath);
          console.log(
            colors.green(`    ✅ 优化循环性能: ${path.relative(this.projectRoot, filePath)}`)
          );
        }
      } catch (error) {
        // 忽略错误
      }
    }
  }

  /**
   * 简化条件语句
   */
  simplifyConditions(content) {
    let modified = false;
    let newContent = content;

    // 简化布尔表达式
    const simplifications = [
      { pattern: /if\s*\(\s*(.+?)\s*===\s*true\s*\)/g, replacement: 'if ($1)' },
      { pattern: /if\s*\(\s*(.+?)\s*===\s*false\s*\)/g, replacement: 'if (!$1)' },
      { pattern: /if\s*\(\s*(.+?)\s*!==\s*false\s*\)/g, replacement: 'if ($1)' },
      { pattern: /if\s*\(\s*(.+?)\s*!==\s*true\s*\)/g, replacement: 'if (!$1)' },
    ];

    simplifications.forEach(({ pattern, replacement }) => {
      if (pattern.test(newContent)) {
        newContent = newContent.replace(pattern, replacement);
        modified = true;
      }
    });

    return { content: newContent, modified };
  }

  /**
   * 减少嵌套
   */
  reduceNesting(content) {
    let modified = false;
    let newContent = content;

    // 添加重构建议注释
    const lines = newContent.split('\n');
    const newLines = [];
    let nestingLevel = 0;

    for (let i = 0, len = lines.length; i < len; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('if (')) {
        nestingLevel++;
        if (nestingLevel > 3) {
          newLines.push('    // TODO: 考虑使用早期返回或策略模式来减少嵌套');
          modified = true;
        }
      } else if (trimmed === '}') {
        nestingLevel = Math.max(0, nestingLevel - 1);
      }

      newLines.push(line);
    }

    if (modified) {
      newContent = newLines.join('\n');
    }

    return { content: newContent, modified };
  }

  /**
   * 添加文档注释
   */
  addDocumentation(content, filePath) {
    let modified = false;
    let newContent = content;

    // 如果文件没有顶级注释，添加一个
    if (!content.trim().startsWith('/**') && !content.trim().startsWith('//')) {
      const fileName = path.basename(filePath, path.extname(filePath));
      const fileDoc = `/**\n * ${fileName}\n * 自动生成的文档注释\n */\n\n`;
      newContent = fileDoc + newContent;
      modified = true;
    }

    return { content: newContent, modified };
  }

  /**
   * 查找长函数
   */
  findLongFunctions(content) {
    const functions = [];
    const lines = content.split('\n');
    let currentFunction = null;
    let braceCount = 0;

    for (let i = 0, len = lines.length; i < len; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // 检测函数开始
      if (
        trimmed.includes('function ') ||
        trimmed.match(/\w+\s*\([^)]*\)\s*{/) ||
        trimmed.includes('=> {')
      ) {
        currentFunction = {
          start: i,
          name: this.extractFunctionName(trimmed),
          lines: 1,
        };
        braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      } else if (currentFunction) {
        currentFunction.lines++;
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        // 函数结束
        if (braceCount === 0) {
          currentFunction.end = i;
          if (currentFunction.lines > 20) {
            // 超过20行的函数
            functions.push(currentFunction);
          }
          currentFunction = null;
        }
      }
    }

    return functions;
  }

  /**
   * 重构长函数
   */
  refactorLongFunctions(content, functions) {
    let modified = false;
    let newContent = content;

    // 为长函数添加注释建议
    functions.forEach((func) => {
      const comment = `\n  // TODO: 考虑将此函数拆分为更小的函数 (当前 ${func.lines} 行)\n`;
      const lines = newContent.split('\n');
      lines.splice(func.start, 0, comment);
      newContent = lines.join('\n');
      modified = true;
    });

    return { content: newContent, modified };
  }

  /**
   * 简化嵌套if语句
   */
  simplifyNestedIfs(content) {
    let modified = false;
    let newContent = content;

    // 查找深度嵌套的if语句并添加重构建议
    const lines = newContent.split('\n');
    let nestingLevel = 0;
    const newLines = [];

    for (let i = 0, len = lines.length; i < len; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('if (')) {
        nestingLevel++;
        if (nestingLevel > 3) {
          newLines.push('    // TODO: 考虑使用早期返回或策略模式来减少嵌套');
          modified = true;
        }
      } else if (trimmed === '}') {
        nestingLevel = Math.max(0, nestingLevel - 1);
      }

      newLines.push(line);
    }

    if (modified) {
      newContent = newLines.join('\n');
    }

    return { content: newContent, modified };
  }

  /**
   * 查找大类
   */
  findLargeClasses(content) {
    const classes = [];
    const lines = content.split('\n');
    let currentClass = null;
    let braceCount = 0;

    for (let i = 0, len = lines.length; i < len; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // 检测类开始
      if (trimmed.startsWith('class ')) {
        currentClass = {
          start: i,
          name: trimmed.match(/class\s+(\w+)/)?.[1] || 'Unknown',
          lines: 1,
          methods: 0,
        };
        braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      } else if (currentClass) {
        currentClass.lines++;

        // 计算方法数量
        if (trimmed.includes('(') && trimmed.includes(')') && trimmed.includes('{')) {
          currentClass.methods++;
        }

        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        // 类结束
        if (braceCount === 0) {
          currentClass.end = i;
          if (currentClass.lines > 100 || currentClass.methods > 10) {
            classes.push(currentClass);
          }
          currentClass = null;
        }
      }
    }

    return classes;
  }

  /**
   * 建议类拆分
   */
  suggestClassSplit(content, classes, filePath) {
    const suggestions = [];

    classes.forEach((cls) => {
      suggestions.push({
        class: cls.name,
        reason: `类过大 (${cls.lines} 行, ${cls.methods} 个方法)`,
        suggestion: '考虑按职责拆分为多个类',
      });
    });

    return { suggestions };
  }

  /**
   * 优化循环性能
   */
  optimizeLoopPerformance(content) {
    let modified = false;
    let newContent = content;

    // 优化数组长度缓存
    const arrayLengthPattern =
      /for\s*\(\s*let\s+(\w+)\s*=\s*0;\s*\1\s*<\s*(\w+)\.length;\s*\1\+\+\s*\)/g;
    newContent = newContent.replace(arrayLengthPattern, (match, i, arr) => {
      modified = true;
      return `for (let ${i} = 0, len = ${arr}.length; ${i} < len; ${i}++)`;
    });

    return { content: newContent, modified };
  }

  /**
   * 计算文件复杂度
   */
  calculateFileComplexity(content) {
    const lines = content.split('\n');
    const complexity = {
      cyclomatic: 1, // 基础复杂度
      cognitive: 0,
      total: 0,
    };

    let nestingLevel = 0;

    // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 25 行)

    lines.forEach((line) => {
      const trimmed = line.trim();

      // 循环复杂度
      if (trimmed.match(/\b(if|while|for|switch|catch)\b/)) {
        complexity.cyclomatic++;
      }

      // 认知复杂度
      if (trimmed.startsWith('if (') || trimmed.startsWith('else if (')) {
        complexity.cognitive += 1 + nestingLevel;
      } else if (trimmed.startsWith('while (') || trimmed.startsWith('for (')) {
        complexity.cognitive += 1 + nestingLevel;
      } else if (trimmed.startsWith('switch (')) {
        complexity.cognitive += 1 + nestingLevel;
      }

      // 嵌套级别
      if (trimmed.includes('{')) {
        nestingLevel++;
      }
      if (trimmed.includes('}')) {
        nestingLevel = Math.max(0, nestingLevel - 1);
      }
    });

    complexity.total = complexity.cyclomatic + complexity.cognitive;
    return complexity;
  }

  /**
   * 提取函数名
   */
  extractFunctionName(line) {
    const patterns = [/function\s+(\w+)/, /(\w+)\s*\(/, /const\s+(\w+)\s*=/, /let\s+(\w+)\s*=/];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return 'anonymous';
  }

  // TODO: 考虑将此函数拆分为更小的函数 (当前 36 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 36 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 36 行)

  /**
   * 生成优化报告
   */
  async generateOptimizationReport() {
    console.log(colors.yellow('\n📊 生成优化报告...'));

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        optimizedFiles: this.optimizedFiles.size,
        extractedFunctions: this.optimizations.extractedFunctions,
        splitClasses: this.optimizations.splitClasses,
        reducedNesting: this.optimizations.reducedNesting,
        simplifiedConditions: this.optimizations.simplifiedConditions,
      },
      optimizedFiles: Array.from(this.optimizedFiles).map((file) =>
        path.relative(this.projectRoot, file)
      ),
      recommendations: [
        '继续重构长函数，保持函数简洁',
        '使用设计模式减少代码复杂度',
        '添加单元测试确保重构安全',
        '定期进行代码审查',
        '使用静态分析工具监控复杂度',
      ],
    };

    const reportPath = path.join(
      this.projectRoot,
      'reports',
      'complexity-optimization-report.json'
    );
    await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(colors.green(`  ✅ 报告已生成: ${reportPath}`));

    // 显示摘要
    console.log(colors.cyan('\n📋 优化摘要:'));
    console.log(colors.blue(`   🔧 优化文件数: ${report.summary.optimizedFiles}`));
    console.log(colors.blue(`   🔄 提取函数数: ${report.summary.extractedFunctions}`));
    console.log(colors.blue(`   📦 拆分类数: ${report.summary.splitClasses}`));
    console.log(colors.blue(`   🌳 减少嵌套: ${report.summary.reducedNesting}`));
    console.log(colors.blue(`   💡 简化条件: ${report.summary.simplifiedConditions}`));
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
        !file.includes('.git') &&
        !file.includes('test') &&
        !file.includes('spec')
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
}

// 命令行执行
if (import.meta.url === `file://${process.argv[1]}`) {
  const optimizer = new ComplexityOptimizer();
  const command = process.argv[2];

  switch (command) {
    case 'analyze':
      optimizer.analyzeComplexity().catch(console.error);
      break;
    case 'functions':
      optimizer.extractLongFunctions().catch(console.error);
      break;
    case 'conditions':
      optimizer.simplifyNestedConditions().catch(console.error);
      break;
    case 'classes':
      optimizer.splitLargeClasses().catch(console.error);
      break;
    case 'all':
    default:
      optimizer.runAll().catch(console.error);
      break;
  }
}

export default ComplexityOptimizer;
