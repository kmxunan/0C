#!/usr/bin/env node
/* eslint-disable no-console, no-magic-numbers */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

/**
 * 代码质量检查脚本
 * 集成ESLint、Prettier、测试和安全检查
 */
class QualityChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.projectRoot = process.cwd();
    this.startTime = Date.now();
  }

  /**
   * 运行所有质量检查
   */
  async runAll() {
    console.log(chalk.blue.bold('🔍 开始代码质量检查...\n'));

    try {
      await this.checkDependencies();
      await this.runPrettierCheck();
      await this.runESLintCheck();
      await this.runTests();
      await this.runSecurityCheck();
      await this.checkFileStructure();
      await this.generateReport();
    } catch (error) {
      this.errors.push(`质量检查过程中发生错误: ${error.message}`);
    }

    this.printSummary();
    process.exit(this.errors.length > 0 ? 1 : 0);
  }

  /**
   * 检查依赖项
   */
  async checkDependencies() {
    console.log(chalk.yellow('📦 检查项目依赖...'));

    try {
      // 检查package.json是否存在
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        this.errors.push('package.json 文件不存在');
        return;
      }

      // 检查node_modules是否存在
      const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        console.log(chalk.yellow('  正在安装依赖...'));
        execSync('npm install', { stdio: 'inherit' });
      }

      // 检查关键依赖
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const requiredDeps = ['express', 'sqlite3', 'jest'];
      const missingDeps = requiredDeps.filter(
        (dep) => !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
      );

      if (missingDeps.length > 0) {
        this.warnings.push(`缺少推荐依赖: ${missingDeps.join(', ')}`);
      }

      console.log(chalk.green('  ✅ 依赖检查完成'));
    } catch (error) {
      this.errors.push(`依赖检查失败: ${error.message}`);
    }
  }

  /**
   * 运行Prettier格式检查
   */
  async runPrettierCheck() {
    console.log(chalk.yellow('🎨 检查代码格式...'));

    try {
      // 检查是否有Prettier配置
      const prettierConfigExists = [
        '.prettierrc',
        '.prettierrc.json',
        '.prettierrc.js',
        'prettier.config.js',
      ].some((config) => fs.existsSync(path.join(this.projectRoot, config)));

      if (!prettierConfigExists) {
        this.warnings.push('未找到Prettier配置文件');
        return;
      }

      // 运行Prettier检查
      const result = execSync('npx prettier --check "src/**/*.js" "tests/**/*.js" "*.js"', {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      console.log(chalk.green('  ✅ 代码格式检查通过'));
    } catch (error) {
      if (error.status === 1) {
        this.warnings.push('代码格式不符合Prettier规范');
        console.log(chalk.yellow('  ⚠️  代码格式需要修复'));
        console.log(chalk.gray('  运行 "npm run format" 自动修复格式问题'));
      } else {
        this.errors.push(`Prettier检查失败: ${error.message}`);
      }
    }
  }

  /**
   * 运行ESLint检查
   */
  async runESLintCheck() {
    console.log(chalk.yellow('🔧 运行ESLint检查...'));

    try {
      // 检查ESLint配置
      const eslintConfigExists = [
        '.eslintrc',
        '.eslintrc.json',
        '.eslintrc.js',
        '.eslintrc.yml',
        '.eslintrc.yaml',
      ].some((config) => fs.existsSync(path.join(this.projectRoot, config)));

      if (!eslintConfigExists) {
        this.warnings.push('未找到ESLint配置文件');
        return;
      }

      // 运行ESLint
      const result = execSync('npx eslint "src/**/*.js" "tests/**/*.js" "*.js" --format=json', {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      const eslintResults = JSON.parse(result);
      let totalErrors = 0;
      let totalWarnings = 0;

      eslintResults.forEach((file) => {
        totalErrors += file.errorCount;
        totalWarnings += file.warningCount;

        if (file.errorCount > 0 || file.warningCount > 0) {
          console.log(chalk.gray(`  ${file.filePath}:`));
          file.messages.forEach((message) => {
            const level = message.severity === 2 ? 'error' : 'warning';
            const color = message.severity === 2 ? chalk.red : chalk.yellow;
            console.log(color(`    ${level}: ${message.message} (${message.ruleId})`));
          });
        }
      });

      if (totalErrors > 0) {
        this.errors.push(`ESLint发现 ${totalErrors} 个错误`);
      }
      if (totalWarnings > 0) {
        this.warnings.push(`ESLint发现 ${totalWarnings} 个警告`);
      }

      if (totalErrors === 0 && totalWarnings === 0) {
        console.log(chalk.green('  ✅ ESLint检查通过'));
      }
    } catch (error) {
      if (error.status === 1) {
        // ESLint找到了问题，但这已经在上面处理了
      } else {
        this.errors.push(`ESLint检查失败: ${error.message}`);
      }
    }
  }

  /**
   * 运行测试
   */
  async runTests() {
    console.log(chalk.yellow('🧪 运行测试套件...'));

    try {
      const result = execSync('npm test', {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, CI: 'true' },
      });

      console.log(chalk.green('  ✅ 所有测试通过'));
    } catch (error) {
      this.errors.push('测试失败');
      console.log(chalk.red('  ❌ 测试失败'));
      console.log(chalk.gray(error.stdout));
    }
  }

  /**
   * 运行安全检查
   */
  async runSecurityCheck() {
    console.log(chalk.yellow('🔒 运行安全检查...'));

    try {
      // 检查npm audit
      const auditResult = execSync('npm audit --audit-level=moderate --json', {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      const audit = JSON.parse(auditResult);
      if (audit.metadata.vulnerabilities.total > 0) {
        const { high, critical } = audit.metadata.vulnerabilities;
        if (high > 0 || critical > 0) {
          this.errors.push(`发现 ${high} 个高危和 ${critical} 个严重安全漏洞`);
        } else {
          this.warnings.push(`发现 ${audit.metadata.vulnerabilities.total} 个安全漏洞`);
        }
      } else {
        console.log(chalk.green('  ✅ 未发现安全漏洞'));
      }
    } catch (error) {
      if (error.status === 1) {
        // npm audit 发现了漏洞，但这已经在上面处理了
      } else {
        this.warnings.push('安全检查失败，请手动运行 npm audit');
      }
    }

    // 检查敏感文件
    this.checkSensitiveFiles();
  }

  /**
   * 检查敏感文件
   */
  checkSensitiveFiles() {
    const sensitivePatterns = [
      /\.env$/,
      /\.env\./,
      /private.*key/i,
      /.*\.pem$/,
      /.*\.p12$/,
      /.*\.pfx$/,
      /config.*secret/i,
    ];

    const checkDirectory = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          checkDirectory(filePath);
        } else if (stat.isFile()) {
          sensitivePatterns.forEach((pattern) => {
            if (pattern.test(file)) {
              this.warnings.push(`发现敏感文件: ${filePath}`);
            }
          });
        }
      });
    };

    try {
      checkDirectory(this.projectRoot);
    } catch (error) {
      this.warnings.push(`敏感文件检查失败: ${error.message}`);
    }
  }

  /**
   * 检查文件结构
   */
  async checkFileStructure() {
    console.log(chalk.yellow('📁 检查项目结构...'));

    const requiredFiles = ['package.json', 'README.md', '.gitignore'];

    const recommendedDirs = ['src', 'tests'];

    requiredFiles.forEach((file) => {
      if (!fs.existsSync(path.join(this.projectRoot, file))) {
        this.warnings.push(`缺少必要文件: ${file}`);
      }
    });

    recommendedDirs.forEach((dir) => {
      if (!fs.existsSync(path.join(this.projectRoot, dir))) {
        this.warnings.push(`缺少推荐目录: ${dir}`);
      }
    });

    console.log(chalk.green('  ✅ 项目结构检查完成'));
  }

  /**
   * 生成质量报告
   */

  // TODO: 考虑将此函数拆分为更小的函数 (当前 22 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 22 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 22 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 22 行)

  async generateReport() {
    console.log(chalk.yellow('📊 生成质量报告...'));

    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary: {
        errors: this.errors.length,
        warnings: this.warnings.length,
        status: this.errors.length === 0 ? 'PASS' : 'FAIL',
      },
      details: {
        errors: this.errors,
        warnings: this.warnings,
      },
    };

    const reportPath = path.join(this.projectRoot, 'quality-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(chalk.green(`  ✅ 质量报告已生成: ${reportPath}`));
  }

  /**
   * 打印总结
   */
  printSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

    console.log(`\n${chalk.blue.bold('📋 质量检查总结')}`);
    console.log(chalk.gray(`执行时间: ${duration}秒`));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(chalk.green.bold('🎉 所有检查通过！代码质量良好。'));
    } else {
      if (this.errors.length > 0) {
        console.log(chalk.red.bold(`❌ 发现 ${this.errors.length} 个错误:`));
        this.errors.forEach((error) => {
          console.log(chalk.red(`  • ${error}`));
        });
      }

      if (this.warnings.length > 0) {
        console.log(chalk.yellow.bold(`⚠️  发现 ${this.warnings.length} 个警告:`));
        this.warnings.forEach((warning) => {
          console.log(chalk.yellow(`  • ${warning}`));
        });
      }
    }

    console.log(`\n${chalk.blue('建议的修复命令:')}`);
    console.log(chalk.gray('  npm run format    # 自动修复格式问题'));
    console.log(chalk.gray('  npm run lint:fix  # 自动修复ESLint问题'));
    console.log(chalk.gray('  npm audit fix     # 修复安全漏洞'));
  }
}

// ES模块中直接执行主函数
const checker = new QualityChecker();
checker.runAll().catch((error) => {
  console.error(chalk.red('质量检查失败:'), error);
  process.exit(1);
});

export default QualityChecker;
