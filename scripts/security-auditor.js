#!/usr/bin/env node
/* eslint-disable no-console, no-magic-numbers */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SecurityAuditor {
  constructor() {
    this.vulnerabilities = [];
    this.securityRules = this.initializeSecurityRules();
  }

  // 初始化安全规则

  // TODO: 考虑将此函数拆分为更小的函数 (当前 24 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 24 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 24 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 24 行)

  initializeSecurityRules() {
    return [
      {
        id: 'hardcoded-secrets',
        name: '硬编码密钥检测',
        severity: 'high',
        patterns: [
          /password\s*[=:]\s*['"][^'"]{8,}['"]/gi,
          /api[_-]?key\s*[=:]\s*['"][^'"]{16,}['"]/gi,
          /secret\s*[=:]\s*['"][^'"]{16,}['"]/gi,
          /token\s*[=:]\s*['"][^'"]{20,}['"]/gi,
          /private[_-]?key\s*[=:]\s*['"][^'"]{32,}['"]/gi,
          /access[_-]?key\s*[=:]\s*['"][^'"]{16,}['"]/gi,
        ],
        description: '检测硬编码的密码、API密钥等敏感信息',
      },
      {
        id: 'sql-injection',
        name: 'SQL注入风险',
        severity: 'high',
        patterns: [
          /query\s*\(\s*['"][^'"]*\$\{[^}]+\}[^'"]*['"]/gi,
          /execute\s*\(\s*['"][^'"]*\+[^'"]*['"]/gi,
          /\$\{[^}]+\}.*(?:SELECT|INSERT|UPDATE|DELETE)/gi,
          /['"]\s*\+\s*\w+\s*\+\s*['"].*(?:WHERE|SET|VALUES)/gi,
        ],
        description: '检测可能的SQL注入漏洞',
      },
      {
        id: 'xss-vulnerability',
        name: 'XSS漏洞风险',
        severity: 'high',
        patterns: [
          /innerHTML\s*=\s*[^;]+\$\{[^}]+\}/gi,
          /document\.write\s*\([^)]*\$\{[^}]+\}/gi,
          /eval\s*\([^)]*\$\{[^}]+\}/gi,
          /outerHTML\s*=\s*[^;]+\$\{[^}]+\}/gi,
        ],
        description: '检测可能的XSS攻击漏洞',
      },
      {
        id: 'command-injection',
        name: '命令注入风险',
        severity: 'high',
        patterns: [
          /exec\s*\([^)]*\$\{[^}]+\}/gi,
          /spawn\s*\([^)]*\$\{[^}]+\}/gi,
          /system\s*\([^)]*\$\{[^}]+\}/gi,
          /shell_exec\s*\([^)]*\$\{[^}]+\}/gi,
        ],
        description: '检测可能的命令注入漏洞',
      },
      {
        id: 'insecure-random',
        name: '不安全的随机数',
        severity: 'medium',
        patterns: [/Math\.random\s*\(\s*\)/gi, /new\s+Date\s*\(\s*\)\.getTime\s*\(\s*\)/gi],
        description: '检测使用不安全的随机数生成方法',
      },
      {
        id: 'weak-crypto',
        name: '弱加密算法',
        severity: 'medium',
        patterns: [
          /createHash\s*\(\s*['"]md5['"]/gi,
          /createHash\s*\(\s*['"]sha1['"]/gi,
          /createCipher\s*\(\s*['"]des['"]/gi,
          /createCipher\s*\(\s*['"]rc4['"]/gi,
        ],
        description: '检测使用弱加密算法',
      },
      {
        id: 'path-traversal',
        name: '路径遍历风险',
        severity: 'high',
        patterns: [
          /readFile\s*\([^)]*\$\{[^}]+\}/gi,
          /writeFile\s*\([^)]*\$\{[^}]+\}/gi,
          /path\.join\s*\([^)]*\$\{[^}]+\}/gi,
          /\.\.\/|\.\.\\/gi,
        ],
        description: '检测可能的路径遍历攻击',
      },
      {
        id: 'unsafe-eval',
        name: '不安全的代码执行',
        severity: 'high',
        patterns: [
          /\beval\s*\(/gi,
          /Function\s*\(/gi,
          /setTimeout\s*\(\s*['"][^'"]*['"]/gi,
          /setInterval\s*\(\s*['"][^'"]*['"]/gi,
        ],
        description: '检测不安全的代码执行方法',
      },
      {
        id: 'insecure-headers',
        name: '不安全的HTTP头',
        severity: 'medium',
        patterns: [
          /res\.header\s*\(\s*['"]X-Powered-By['"]/gi,
          /res\.setHeader\s*\(\s*['"]Server['"]/gi,
          /Access-Control-Allow-Origin\s*['"]\*['"]/gi,
        ],
        description: '检测不安全的HTTP响应头设置',
      },
      {
        id: 'debug-code',
        name: '调试代码残留',
        severity: 'low',
        patterns: [
          /console\.log\s*\(/gi,
          /console\.debug\s*\(/gi,
          /debugger\s*;/gi,
          /alert\s*\(/gi,
        ],
        description: '检测残留的调试代码',
      },
      {
        id: 'sensitive-data-exposure',
        name: '敏感数据暴露',
        severity: 'medium',
        patterns: [
          /process\.env\.[A-Z_]+.*console\.log/gi,
          /JSON\.stringify\s*\([^)]*password[^)]*\)/gi,
          /JSON\.stringify\s*\([^)]*token[^)]*\)/gi,
        ],
        description: '检测可能的敏感数据暴露',
      },
      {
        id: 'insecure-dependencies',
        name: '不安全的依赖',
        severity: 'medium',
        patterns: [
          /require\s*\(\s*['"][^'"]*\$\{[^}]+\}[^'"]*['"]/gi,
          /import\s+[^'"]*from\s+['"][^'"]*\$\{[^}]+\}[^'"]*['"]/gi,
        ],
        description: '检测动态加载依赖的安全风险',
      },
    ];
  }

  // 扫描单个文件
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const fileVulnerabilities = [];

      this.securityRules.forEach((rule) => {
        rule.patterns.forEach((pattern) => {
          lines.forEach((line, lineNumber) => {
            const matches = line.match(pattern);
            if (matches) {
              matches.forEach((match) => {
                fileVulnerabilities.push({
                  file: filePath,
                  line: lineNumber + 1,
                  rule: rule.id,
                  name: rule.name,
                  severity: rule.severity,
                  description: rule.description,
                  code: line.trim(),
                  match: match.trim(),
                });
              });
            }
          });
        });
      });

      return fileVulnerabilities;
    } catch (error) {
      console.error(`Error scanning file ${filePath}:`, error.message);
      return [];
    }
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

  // 检查依赖漏洞
  async checkDependencyVulnerabilities() {
    try {
      console.log('🔍 检查依赖漏洞...');
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(auditResult);

      const dependencyVulnerabilities = [];

      if (auditData.vulnerabilities) {
        Object.entries(auditData.vulnerabilities).forEach(([packageName, vuln]) => {
          dependencyVulnerabilities.push({
            type: 'dependency',
            package: packageName,
            severity: vuln.severity,
            title: vuln.title,
            description: vuln.overview,
            recommendation: vuln.recommendation,
            versions: vuln.range,
          });
        });
      }

      return dependencyVulnerabilities;
    } catch (error) {
      console.warn('⚠️ 无法执行 npm audit:', error.message);
      return [];
    }
  }

  // 检查环境配置安全性
  checkEnvironmentSecurity() {
    const envVulnerabilities = [];
    const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];

    envFiles.forEach((envFile) => {
      const envPath = path.join(process.cwd(), envFile);
      if (fs.existsSync(envPath)) {
        try {
          // TODO: 考虑将此函数拆分为更小的函数 (当前 27 行)

          // TODO: 考虑将此函数拆分为更小的函数 (当前 27 行)

          // TODO: 考虑将此函数拆分为更小的函数 (当前 27 行)

          // TODO: 考虑将此函数拆分为更小的函数 (当前 27 行)

          const content = fs.readFileSync(envPath, 'utf8');
          const lines = content.split('\n');

          lines.forEach((line, lineNumber) => {
            // 检查是否有明文密码
            if (/password\s*=\s*[^\s]+/i.test(line) && !/\*\*\*|xxx|placeholder/i.test(line)) {
              envVulnerabilities.push({
                file: envPath,
                line: lineNumber + 1,
                rule: 'env-plaintext-password',
                name: '环境文件明文密码',
                severity: 'high',
                description: '环境配置文件中包含明文密码',
                code: line.trim(),
              });
            }

            // 检查是否有过于宽松的CORS设置
            if (/CORS.*\*/.test(line)) {
              envVulnerabilities.push({
                file: envPath,
                line: lineNumber + 1,
                rule: 'env-cors-wildcard',
                name: '过于宽松的CORS设置',
                severity: 'medium',
                description: '环境配置中CORS设置过于宽松',
                code: line.trim(),
              });
            }
          });
        } catch (error) {
          console.error(`Error reading ${envFile}:`, error.message);
        }
      }
    });

    return envVulnerabilities;
  }

  // 生成安全报告
  generateSecurityReport() {
    const vulnerabilitiesBySeverity = {
      high: this.vulnerabilities.filter((v) => v.severity === 'high'),
      medium: this.vulnerabilities.filter((v) => v.severity === 'medium'),
      low: this.vulnerabilities.filter((v) => v.severity === 'low'),
    };

    const vulnerabilitiesByType = {};
    this.vulnerabilities.forEach((vuln) => {
      if (!vulnerabilitiesByType[vuln.rule]) {
        vulnerabilitiesByType[vuln.rule] = [];
      }
      vulnerabilitiesByType[vuln.rule].push(vuln);
    });

    const securityScore = this.calculateSecurityScore();

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalVulnerabilities: this.vulnerabilities.length,
        highSeverity: vulnerabilitiesBySeverity.high.length,
        mediumSeverity: vulnerabilitiesBySeverity.medium.length,
        lowSeverity: vulnerabilitiesBySeverity.low.length,
        securityScore,
        riskLevel: this.getRiskLevel(securityScore),
      },
      vulnerabilities: this.vulnerabilities,
      vulnerabilitiesBySeverity,
      vulnerabilitiesByType,
      recommendations: this.generateRecommendations(vulnerabilitiesBySeverity),
    };
  }

  // 计算安全评分
  calculateSecurityScore() {
    let score = 100;

    this.vulnerabilities.forEach((vuln) => {
      switch (vuln.severity) {
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 8;
          break;
        case 'low':
          score -= 3;
          break;
      }
    });

    return Math.max(0, score);
  }

  // 获取风险等级
  getRiskLevel(score) {
    if (score >= 90) {
      return '低风险';
    }
    if (score >= 70) {
      return '中等风险';
    }
    if (score >= 50) {
      return '高风险';
    }
    return '极高风险';
  }

  // 生成修复建议
  generateRecommendations(vulnerabilitiesBySeverity) {
    const recommendations = [];

    if (vulnerabilitiesBySeverity.high.length > 0) {
      recommendations.push({
        priority: 'urgent',
        title: '立即修复高危漏洞',
        description: `发现 ${vulnerabilitiesBySeverity.high.length} 个高危安全漏洞，需要立即修复`,
        actions: [
          '移除硬编码的密钥和密码',
          '修复SQL注入和XSS漏洞',
          '替换不安全的加密算法',
          '验证所有用户输入',
        ],
      });
    }

    if (vulnerabilitiesBySeverity.medium.length > 0) {
      recommendations.push({
        priority: 'high',
        title: '修复中等风险漏洞',
        description: `发现 ${vulnerabilitiesBySeverity.medium.length} 个中等风险漏洞`,
        actions: [
          '使用安全的随机数生成器',
          '配置安全的HTTP响应头',
          '审查敏感数据处理逻辑',
          '更新不安全的依赖包',
        ],
      });
    }

    if (vulnerabilitiesBySeverity.low.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: '清理低风险问题',
        description: `发现 ${vulnerabilitiesBySeverity.low.length} 个低风险问题`,
        actions: [
          '移除调试代码和console.log',
          '清理未使用的代码',
          '添加代码注释和文档',
          '优化错误处理逻辑',
        ],
      });
    }

    // 通用安全建议
    recommendations.push({
      priority: 'ongoing',
      title: '持续安全改进',
      description: '建立持续的安全开发流程',
      actions: [
        '集成自动化安全扫描到CI/CD流程',
        '定期进行安全代码审查',
        '建立安全编码规范',
        '进行安全培训和意识提升',
        '实施最小权限原则',
        '定期更新依赖包',
        '建立安全事件响应流程',
      ],
    });

    return recommendations;
  }

  // 运行安全审计
  async run(targetPath = '.') {
    console.log('🔒 开始安全审计...');

    const startTime = Date.now();
    const absolutePath = path.resolve(targetPath);

    // 扫描代码文件
    const files = this.scanDirectory(absolutePath);
    console.log(`📁 发现 ${files.length} 个文件`);

    let processedFiles = 0;
    for (const filePath of files) {
      const fileVulnerabilities = this.scanFile(filePath);
      this.vulnerabilities.push(...fileVulnerabilities);
      processedFiles++;

      if (processedFiles % 20 === 0) {
        console.log(`🔍 已扫描 ${processedFiles}/${files.length} 个文件`);
      }
    }

    // 检查环境配置
    const envVulnerabilities = this.checkEnvironmentSecurity();
    this.vulnerabilities.push(...envVulnerabilities);

    // 检查依赖漏洞
    const dependencyVulnerabilities = await this.checkDependencyVulnerabilities();
    this.vulnerabilities.push(...dependencyVulnerabilities);

    // 生成报告
    const report = this.generateSecurityReport();
    const endTime = Date.now();

    console.log(`✅ 安全审计完成，耗时 ${endTime - startTime}ms`);

    // 保存报告
    const reportPath = path.join(process.cwd(), 'security-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 报告已保存到: ${reportPath}`);

    // 显示摘要
    this.displaySummary(report);

    return report;
  }

  // 显示摘要
  displaySummary(report) {
    const { summary, recommendations } = report;

    console.log('\n🔒 安全审计摘要:');
    console.log(`   总漏洞数: ${summary.totalVulnerabilities}`);
    console.log(`   高危漏洞: ${summary.highSeverity}`);
    console.log(`   中危漏洞: ${summary.mediumSeverity}`);
    console.log(`   低危漏洞: ${summary.lowSeverity}`);
    console.log(`   安全评分: ${summary.securityScore}/100`);
    console.log(`   风险等级: ${summary.riskLevel}`);

    if (summary.highSeverity > 0) {
      console.log('\n⚠️  发现高危漏洞，建议立即修复！');
    }

    if (recommendations.length > 0) {
      console.log('\n💡 修复建议:');
      recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
      });
    }
  }
}

// 命令行执行
if (import.meta.url === `file://${process.argv[1]}`) {
  const auditor = new SecurityAuditor();
  const targetPath = process.argv[2] || '.';

  auditor.run(targetPath).catch((error) => {
    console.error('❌ 安全审计失败:', error.message);
    process.exit(1);
  });
}

export default SecurityAuditor;
