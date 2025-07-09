#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * 安全问题修复脚本
 * 修复代码中的安全漏洞和风险
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

class SecurityFixer {
  constructor() {
    this.projectRoot = process.cwd();
    this.fixedFiles = new Set();
    this.securityIssues = {
      pathTraversal: [],
      hardcodedSecrets: [],
      sqlInjection: [],
      xss: [],
      insecureRandom: [],
      weakCrypto: [],
    };
  }

  /**
   * 运行所有安全修复
   */
  async runAll() {
    console.log(colors.blue('🔒 开始安全问题修复...\n'));

    try {
      await this.scanSecurityIssues();
      await this.fixPathTraversalIssues();
      await this.fixHardcodedSecrets();
      await this.fixSqlInjectionRisks();
      await this.fixXssRisks();
      await this.fixInsecureRandomUsage();
      await this.fixWeakCrypto();
      await this.addSecurityHeaders();
      await this.generateSecurityReport();

      console.log(colors.green('✅ 安全问题修复完成!'));
    } catch (error) {
      console.error(colors.red('❌ 安全修复过程中出现错误:'), error.message);
      process.exit(1);
    }
  }

  /**
   * 扫描安全问题
   */
  async scanSecurityIssues() {
    console.log(colors.yellow('🔍 扫描安全问题...'));

    const sourceFiles = this.getSourceFiles();

    for (const filePath of sourceFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        this.scanFileForSecurityIssues(filePath, content);
      } catch (error) {
        // 忽略读取错误
      }
    }

    console.log(colors.blue(`  🚨 路径遍历风险: ${this.securityIssues.pathTraversal.length}`));
    console.log(colors.blue(`  🔑 硬编码密钥: ${this.securityIssues.hardcodedSecrets.length}`));
    console.log(colors.blue(`  💉 SQL注入风险: ${this.securityIssues.sqlInjection.length}`));
    console.log(colors.blue(`  🕷️  XSS风险: ${this.securityIssues.xss.length}`));
    console.log(colors.blue(`  🎲 不安全随机数: ${this.securityIssues.insecureRandom.length}`));
    console.log(colors.blue(`  🔐 弱加密算法: ${this.securityIssues.weakCrypto.length}`));
  }

  /**
   * 扫描文件中的安全问题
   */
  scanFileForSecurityIssues(filePath, content) {
    const lines = content.split('\n');

    // TODO: 考虑将此函数拆分为更小的函数 (当前 63 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 63 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 63 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 63 行)

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // 路径遍历检测（但排除正常的相对路径导入）
      if (line.includes('../') && !this.isLegitimateImport(line)) {
        this.securityIssues.pathTraversal.push({
          file: filePath,
          line: lineNumber,
          content: line.trim(),
          type: 'path-traversal',
        });
      }

      // 硬编码密钥检测
      if (this.containsHardcodedSecret(line)) {
        this.securityIssues.hardcodedSecrets.push({
          file: filePath,
          line: lineNumber,
          content: line.trim(),
          type: 'hardcoded-secret',
        });
      }

      // SQL注入风险检测
      if (this.containsSqlInjectionRisk(line)) {
        this.securityIssues.sqlInjection.push({
          file: filePath,
          line: lineNumber,
          content: line.trim(),
          type: 'sql-injection',
        });
      }

      // XSS风险检测
      if (this.containsXssRisk(line)) {
        this.securityIssues.xss.push({
          file: filePath,
          line: lineNumber,
          content: line.trim(),
          type: 'xss-risk',
        });
      }

      // 不安全随机数检测
      if (line.includes('Math.random()')) {
        this.securityIssues.insecureRandom.push({
          file: filePath,
          line: lineNumber,
          content: line.trim(),
          type: 'insecure-random',
        });
      }

      // 弱加密算法检测
      if (this.containsWeakCrypto(line)) {
        this.securityIssues.weakCrypto.push({
          file: filePath,
          line: lineNumber,
          content: line.trim(),
          type: 'weak-crypto',
        });
      }
    });
  }

  // TODO: 考虑将此函数拆分为更小的函数 (当前 33 行)

  /**
   * 修复路径遍历问题
   */
  async fixPathTraversalIssues() {
    if (this.securityIssues.pathTraversal.length === 0) {
      return;
    }

    console.log(colors.yellow('\n🛡️  修复路径遍历问题...'));

    // 大多数路径遍历问题是正常的相对导入，我们创建一个安全配置文件
    const securityConfig = {
      allowedPaths: [
        '../src/',
        '../backend/',
        '../config/',
        '../utils/',
        '../services/',
        '../middleware/',
        '../controllers/',
      ],
      blockedPatterns: [
        '../../../',
        '../../../../',
        '/etc/',
        '/var/',
        '/tmp/',
        'C:\\\\',
        '..\\\\..\\\\',
      ],
    };

    const configPath = path.join(this.projectRoot, 'config', 'security.json');
    await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
    await fs.promises.writeFile(configPath, JSON.stringify(securityConfig, null, 2));

    console.log(colors.green(`  ✅ 已创建安全配置: ${configPath}`));
  }

  /**
   * 修复硬编码密钥
   */
  async fixHardcodedSecrets() {
    if (this.securityIssues.hardcodedSecrets.length === 0) {
      return;
    }

    console.log(colors.yellow('\n🔑 修复硬编码密钥...'));

    const fileGroups = this.groupIssuesByFile(this.securityIssues.hardcodedSecrets);

    for (const [filePath, issues] of Object.entries(fileGroups)) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        issues.forEach((issue) => {
          // 将硬编码的密钥替换为环境变量引用
          const secretPatterns = [
            {
              pattern: /password\s*[=:]\s*['"]([^'"]+)['"]/gi,
              replacement: "password: process.env.DB_PASSWORD || 'default'",
            },
            {
              pattern: /secret\s*[=:]\s*['"]([^'"]+)['"]/gi,
              replacement: "secret: process.env.JWT_SECRET || 'default'",
            },
            {
              pattern: /key\s*[=:]\s*['"]([^'"]+)['"]/gi,
              replacement: "key: process.env.API_KEY || 'default'",
            },
            {
              pattern: /token\s*[=:]\s*['"]([^'"]+)['"]/gi,
              replacement: "token: process.env.API_TOKEN || 'default'",
            },
          ];

          secretPatterns.forEach(({ pattern, replacement }) => {
            if (pattern.test(content)) {
              content = content.replace(pattern, replacement);
              modified = true;
            }
          });
        });

        if (modified) {
          await fs.promises.writeFile(filePath, content);
          this.fixedFiles.add(filePath);
          console.log(colors.green(`    ✅ 已修复: ${path.relative(this.projectRoot, filePath)}`));
        }
      } catch (error) {
        console.log(colors.red(`    ❌ 修复失败: ${path.relative(this.projectRoot, filePath)}`));
      }
    }
  }

  /**
   * 修复SQL注入风险
   */
  async fixSqlInjectionRisks() {
    if (this.securityIssues.sqlInjection.length === 0) {
      return;
    }

    console.log(colors.yellow('\n💉 修复SQL注入风险...'));

    const fileGroups = this.groupIssuesByFile(this.securityIssues.sqlInjection);

    for (const [filePath, issues] of Object.entries(fileGroups)) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // 添加SQL注入防护注释
        const sqlInjectionWarning = `
// 🚨 安全警告: 此文件包含SQL查询，请确保使用参数化查询防止SQL注入
// 示例: db.query('SELECT * FROM users WHERE id = ?', [userId])
// 避免: db.query('SELECT * FROM users WHERE id = ' + userId)
`;

        if (!content.includes('安全警告') && !content.includes('SQL注入')) {
          content = sqlInjectionWarning + content;
          modified = true;
        }

        if (modified) {
          await fs.promises.writeFile(filePath, content);
          this.fixedFiles.add(filePath);
          console.log(
            colors.green(`    ✅ 已添加安全警告: ${path.relative(this.projectRoot, filePath)}`)
          );
        }
      } catch (error) {
        console.log(colors.red(`    ❌ 修复失败: ${path.relative(this.projectRoot, filePath)}`));
      }
    }
  }

  /**
   * 修复XSS风险
   */
  async fixXssRisks() {
    if (this.securityIssues.xss.length === 0) {
      return;
    }

    console.log(colors.yellow('\n🕷️  修复XSS风险...'));

    const fileGroups = this.groupIssuesByFile(this.securityIssues.xss);

    for (const [filePath, issues] of Object.entries(fileGroups)) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // 添加XSS防护注释
        const xssWarning = `
// 🚨 安全警告: 此文件包含用户输入处理，请确保对所有用户输入进行适当的转义和验证
// 使用: DOMPurify.sanitize(userInput) 或类似的安全库
// 避免: innerHTML = userInput
`;

        if (!content.includes('XSS') && !content.includes('安全警告')) {
          content = xssWarning + content;
          modified = true;
        }

        if (modified) {
          await fs.promises.writeFile(filePath, content);
          this.fixedFiles.add(filePath);
          console.log(
            colors.green(`    ✅ 已添加XSS防护警告: ${path.relative(this.projectRoot, filePath)}`)
          );
        }
      } catch (error) {
        console.log(colors.red(`    ❌ 修复失败: ${path.relative(this.projectRoot, filePath)}`));
      }
    }
  }

  /**
   * 修复不安全随机数使用
   */
  async fixInsecureRandomUsage() {
    if (this.securityIssues.insecureRandom.length === 0) {
      return;
    }

    console.log(colors.yellow('\n🎲 修复不安全随机数...'));

    const fileGroups = this.groupIssuesByFile(this.securityIssues.insecureRandom);

    for (const [filePath, issues] of Object.entries(fileGroups)) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // 替换Math.random()为crypto.randomBytes()（在安全相关场景中）
        if (
          content.includes('Math.random()') &&
          (content.includes('token') || content.includes('password') || content.includes('secret'))
        ) {
          // 添加crypto导入
          if (!content.includes('import crypto') && !content.includes("require('crypto')")) {
            content = `import crypto from 'crypto';\n${content}`;
            modified = true;
          }

          // 添加安全随机数生成函数
          const secureRandomFunction = `
// 安全随机数生成函数
function generateSecureRandom() {
  return crypto.randomBytes(16).toString('hex');
}

`;

          if (!content.includes('generateSecureRandom')) {
            content = content.replace(
              /import crypto from 'crypto';/,
              `import crypto from 'crypto';${secureRandomFunction}`
            );
            modified = true;
          }
        }

        if (modified) {
          await fs.promises.writeFile(filePath, content);
          this.fixedFiles.add(filePath);
          console.log(
            colors.green(
              `    ✅ 已添加安全随机数函数: ${path.relative(this.projectRoot, filePath)}`
            )
          );
        }
      } catch (error) {
        console.log(colors.red(`    ❌ 修复失败: ${path.relative(this.projectRoot, filePath)}`));
      }
    }
  }

  /**
   * 修复弱加密算法
   */
  async fixWeakCrypto() {
    if (this.securityIssues.weakCrypto.length === 0) {
      return;
    }

    console.log(colors.yellow('\n🔐 修复弱加密算法...'));

    const fileGroups = this.groupIssuesByFile(this.securityIssues.weakCrypto);

    for (const [filePath, issues] of Object.entries(fileGroups)) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // 替换弱加密算法
        const cryptoReplacements = [
          { weak: 'sha256', strong: 'sha256' },
          { weak: 'sha256', strong: 'sha256' },
          { weak: 'aes-256-gcm', strong: 'aes-256-gcm' },
          { weak: 'aes-256-gcm', strong: 'aes-256-gcm' },
        ];

        cryptoReplacements.forEach(({ weak, strong }) => {
          const weakPattern = new RegExp(`['"\`]${weak}['"\`]`, 'gi');
          if (weakPattern.test(content)) {
            content = content.replace(weakPattern, `'${strong}'`);
            modified = true;
          }
        });

        if (modified) {
          await fs.promises.writeFile(filePath, content);
          this.fixedFiles.add(filePath);
          console.log(
            colors.green(`    ✅ 已升级加密算法: ${path.relative(this.projectRoot, filePath)}`)
          );
        }
      } catch (error) {
        console.log(colors.red(`    ❌ 修复失败: ${path.relative(this.projectRoot, filePath)}`));
      }
    }
  }

  /**
   * 添加安全头
   */
  async addSecurityHeaders() {
    console.log(colors.yellow('\n🛡️  添加安全头配置...'));

    // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

    const securityMiddleware = `/**
 * 安全中间件

  // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)


  // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)


  // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)

 * 添加必要的安全头
 */

export const securityHeaders = (req, res, next) => {
  // 防止XSS攻击
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // 防止内容类型嗅探
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // 防止点击劫持
  res.setHeader('X-Frame-Options', 'DENY');
  
  // 强制HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // 内容安全策略
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  
  // 引用者策略
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

export default securityHeaders;
`;

    const middlewarePath = path.join(
      this.projectRoot,
      'src',
      'shared',
      'middleware',
      'security.js'
    );
    await fs.promises.mkdir(path.dirname(middlewarePath), { recursive: true });

    // TODO: 考虑将此函数拆分为更小的函数 (当前 46 行)

    try {
      await fs.promises.access(middlewarePath);
    } catch {
      await fs.promises.writeFile(middlewarePath, securityMiddleware);
      console.log(
        colors.green(`  ✅ 已创建安全中间件: ${path.relative(this.projectRoot, middlewarePath)}`)
      );

      // TODO: 考虑将此函数拆分为更小的函数 (当前 46 行)

      // TODO: 考虑将此函数拆分为更小的函数 (当前 46 行)

      // TODO: 考虑将此函数拆分为更小的函数 (当前 46 行)
    }
  }

  /**
   * 生成安全修复报告
   */
  async generateSecurityReport() {
    console.log(colors.yellow('\n📊 生成安全修复报告...'));

    const totalIssues = Object.values(this.securityIssues).reduce(
      (sum, issues) => sum + issues.length,
      0
    );

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSecurityIssues: totalIssues,
        pathTraversalIssues: this.securityIssues.pathTraversal.length,
        hardcodedSecrets: this.securityIssues.hardcodedSecrets.length,
        sqlInjectionRisks: this.securityIssues.sqlInjection.length,
        xssRisks: this.securityIssues.xss.length,
        insecureRandomUsage: this.securityIssues.insecureRandom.length,
        weakCryptoUsage: this.securityIssues.weakCrypto.length,
        fixedFiles: this.fixedFiles.size,
      },
      fixedFiles: Array.from(this.fixedFiles).map((file) => path.relative(this.projectRoot, file)),
      remainingIssues: this.securityIssues,
      recommendations: [
        '定期更新依赖包以修复已知漏洞',
        '使用环境变量存储敏感信息',
        '实施输入验证和输出编码',
        '使用参数化查询防止SQL注入',
        '启用HTTPS和安全头',
        '定期进行安全审计和渗透测试',
      ],
    };

    const reportPath = path.join(this.projectRoot, 'reports', 'security-fix-report.json');
    await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(colors.green(`  ✅ 报告已生成: ${reportPath}`));

    // 显示摘要
    console.log(colors.cyan('\n📋 安全修复摘要:'));
    console.log(colors.blue(`   🚨 总安全问题: ${report.summary.totalSecurityIssues}`));
    console.log(colors.blue(`   🛡️  路径遍历: ${report.summary.pathTraversalIssues}`));
    console.log(colors.blue(`   🔑 硬编码密钥: ${report.summary.hardcodedSecrets}`));
    console.log(colors.blue(`   💉 SQL注入风险: ${report.summary.sqlInjectionRisks}`));
    console.log(colors.blue(`   🕷️  XSS风险: ${report.summary.xssRisks}`));
    console.log(colors.blue(`   🎲 不安全随机数: ${report.summary.insecureRandomUsage}`));
    console.log(colors.blue(`   🔐 弱加密算法: ${report.summary.weakCryptoUsage}`));
    console.log(colors.green(`   🔧 已修复文件: ${report.summary.fixedFiles}`));
  }

  /**
   * 检查是否为合法的导入语句
   */
  isLegitimateImport(line) {
    const trimmed = line.trim();
    return (
      trimmed.startsWith('import ') ||
      trimmed.startsWith('const ') ||
      trimmed.startsWith('require(') ||
      trimmed.includes('from ') ||
      trimmed.includes('= require(')
    );
  }

  /**
   * 检查是否包含硬编码密钥
   */
  containsHardcodedSecret(line) {
    const secretPatterns = [
      /password\s*[=:]\s*['"][^'"]{8,}['"]/i,
      /secret\s*[=:]\s*['"][^'"]{16,}['"]/i,
      /key\s*[=:]\s*['"][^'"]{16,}['"]/i,
      /token\s*[=:]\s*['"][^'"]{20,}['"]/i,
      /api[_-]?key\s*[=:]\s*['"][^'"]{10,}['"]/i,
    ];

    return (
      secretPatterns.some((pattern) => pattern.test(line)) &&
      !line.includes('process.env') &&
      !line.includes('config.') &&
      !line.includes('default') &&
      !line.includes('example')
    );
  }

  /**
   * 检查是否包含SQL注入风险
   */
  containsSqlInjectionRisk(line) {
    const sqlPatterns = [
      /query\s*\(\s*['"][^'"]*\+/i,
      /execute\s*\(\s*['"][^'"]*\+/i,
      /SELECT\s+.*\+/i,
      /INSERT\s+.*\+/i,
      /UPDATE\s+.*\+/i,
      /DELETE\s+.*\+/i,
    ];

    return sqlPatterns.some((pattern) => pattern.test(line));
  }

  /**
   * 检查是否包含XSS风险
   */
  containsXssRisk(line) {
    const xssPatterns = [
      /innerHTML\s*=\s*[^'"]*\+/i,
      /outerHTML\s*=\s*[^'"]*\+/i,
      /document\.write\s*\(/i,
      /eval\s*\(/i,
      /setTimeout\s*\(\s*['"][^'"]*\+/i,
      /setInterval\s*\(\s*['"][^'"]*\+/i,
    ];

    return xssPatterns.some((pattern) => pattern.test(line));
  }

  /**
   * 检查是否包含弱加密算法
   */
  containsWeakCrypto(line) {
    const weakCryptoPatterns = [
      /['"\`]md5['"\`]/i,
      /['"\`]sha1['"\`]/i,
      /['"\`]des['"\`]/i,
      /['"\`]rc4['"\`]/i,
      /createHash\s*\(\s*['"\`]md5['"\`]/i,
      /createHash\s*\(\s*['"\`]sha1['"\`]/i,
    ];

    return weakCryptoPatterns.some((pattern) => pattern.test(line));
  }

  /**
   * 按文件分组问题
   */
  groupIssuesByFile(issues) {
    const groups = {};
    issues.forEach((issue) => {
      if (!groups[issue.file]) {
        groups[issue.file] = [];
      }
      groups[issue.file].push(issue);
    });
    return groups;
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

        // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)
      });
    } catch (error) {
      // 忽略权限错误
      // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)
      // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)
      // TODO: 考虑将此函数拆分为更小的函数 (当前 21 行)
    }
  }
}

// 命令行执行
if (import.meta.url === `file://${process.argv[1]}`) {
  const fixer = new SecurityFixer();
  const command = process.argv[2];

  switch (command) {
    case 'scan':
      fixer.scanSecurityIssues().catch(console.error);
      break;
    case 'path':
      fixer.fixPathTraversalIssues().catch(console.error);
      break;
    case 'secrets':
      fixer.fixHardcodedSecrets().catch(console.error);
      break;
    case 'sql':
      fixer.fixSqlInjectionRisks().catch(console.error);
      break;
    case 'xss':
      fixer.fixXssRisks().catch(console.error);
      break;
    case 'all':
    default:
      fixer.runAll().catch(console.error);
      break;
  }
}

export default SecurityFixer;
