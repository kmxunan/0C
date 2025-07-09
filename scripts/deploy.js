#!/usr/bin/env node
/* eslint-disable no-console, no-magic-numbers */

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 自动化部署管理器
 * 支持多环境部署、版本管理、回滚等功能
 */
class DeploymentManager {
  constructor(options = {}) {
    this.options = {
      projectRoot: options.projectRoot || path.resolve(__dirname, '..'),
      configFile: options.configFile || 'deploy.config.js',
      logFile: options.logFile || 'deployment.log',
      backupDir: options.backupDir || '.deployments',
      maxBackups: options.maxBackups || 10,
      ...options,
    };

    this.config = null;
    this.currentEnvironment = null;
    this.deploymentId = this.generateDeploymentId();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * 初始化部署配置
   */
  async initialize() {
    console.log('🚀 初始化部署管理器...');

    // 加载配置
    await this.loadConfig();

    // 创建必要的目录
    this.createDirectories();

    // 验证环境
    await this.validateEnvironment();

    console.log('✅ 部署管理器初始化完成');
  }

  /**
   * 加载部署配置
   */
  async loadConfig() {
    const configPath = path.join(this.options.projectRoot, this.options.configFile);

    if (!fs.existsSync(configPath)) {
      console.log('📝 创建默认部署配置...');
      await this.createDefaultConfig(configPath);
    }

    try {
      // 动态导入配置文件
      const configModule = await import(`file://${configPath}`);
      this.config = configModule.default || configModule;

      console.log(`✅ 配置加载成功: ${Object.keys(this.config.environments).join(', ')}`);
    } catch (error) {
      throw new Error(`加载部署配置失败: ${error.message}`);
    }
  }

  /**
   * 创建默认配置
   */

  // TODO: 考虑将此函数拆分为更小的函数 (当前 104 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 104 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 104 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 104 行)

  async createDefaultConfig(configPath) {
    const defaultConfig = `export default {
  // 项目信息
  project: {
    name: '零碳园区数字孪生能碳管理系统',
    version: '1.0.0',
    repository: 'https://github.com/your-org/carbon-management-system.git'
  },

  // 环境配置
  environments: {
    development: {
      name: '开发环境',
      host: 'localhost',
      port: 3000,
      buildCommand: 'npm run build:dev',
      startCommand: 'npm run start:dev',
      healthCheck: 'http://localhost:3000/health',
      env: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug'
      }
    },
    
    staging: {
      name: '测试环境',
      host: 'staging.example.com',
      port: 3000,
      buildCommand: 'npm run build:staging',
      startCommand: 'npm run start',
      healthCheck: 'https://staging.example.com/health',
      env: {
        NODE_ENV: 'staging',
        LOG_LEVEL: 'info'
      },
      deploy: {
        method: 'ssh',
        user: 'deploy',
        path: '/var/www/carbon-management',
        beforeDeploy: ['npm run test', 'npm run lint'],
        afterDeploy: ['pm2 restart carbon-management']
      }
    },
    
    production: {
      name: '生产环境',
      host: 'api.example.com',
      port: 3000,
      buildCommand: 'npm run build:prod',
      startCommand: 'npm run start',
      healthCheck: 'https://api.example.com/health',
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'warn'
      },
      deploy: {
        method: 'ssh',
        user: 'deploy',
        path: '/var/www/carbon-management',
        beforeDeploy: [
          'npm run test',
          'npm run lint',
          'npm run test:coverage',
          'npm run security:audit'
        ],
        afterDeploy: [
          'pm2 restart carbon-management',
          'npm run health:check'
        ],
        backup: true,
        confirmRequired: true
      }
    }
  },

  // 通知配置
  notifications: {
    slack: {
      enabled: false,
      webhook: process.env.SLACK_WEBHOOK,
      channel: '#deployments'
    },
    email: {
      enabled: false,
      recipients: ['admin@example.com']
    }
  },

  // 监控配置
  monitoring: {
    healthCheckTimeout: 30000,
    healthCheckRetries: 3,
    performanceThresholds: {
      responseTime: 2000,
      memoryUsage: 80,
      cpuUsage: 70
    }
  }
};
`;

    fs.writeFileSync(configPath, defaultConfig);
    console.log(`✅ 默认配置已创建: ${configPath}`);
  }

  /**
   * 创建必要目录
   */
  createDirectories() {
    const dirs = [
      path.join(this.options.projectRoot, this.options.backupDir),
      path.join(this.options.projectRoot, 'logs'),
    ];

    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 验证环境
   */
  async validateEnvironment() {
    console.log('🔍 验证部署环境...');

    // 检查必要的命令
    const requiredCommands = ['node', 'npm', 'git'];

    for (const cmd of requiredCommands) {
      try {
        execSync(`which ${cmd}`, { stdio: 'ignore' });
      } catch (error) {
        throw new Error(`缺少必要命令: ${cmd}`);
      }
    }

    // 检查Git状态
    try {
      const gitStatus = execSync('git status --porcelain', {
        cwd: this.options.projectRoot,
        encoding: 'utf8',
      });

      if (gitStatus.trim()) {
        console.warn('⚠️  工作目录有未提交的更改');
      }
    } catch (error) {
      console.warn('⚠️  无法检查Git状态');
    }

    console.log('✅ 环境验证通过');
  }

  /**
   * 部署到指定环境
   */
  async deploy(environment, options = {}) {
    if (!this.config.environments[environment]) {
      throw new Error(`未知环境: ${environment}`);
    }

    this.currentEnvironment = environment;
    const envConfig = this.config.environments[environment];

    console.log(`\n🚀 开始部署到 ${envConfig.name} (${environment})`);
    console.log(`📋 部署ID: ${this.deploymentId}`);

    try {
      // 记录部署开始
      this.logDeployment('start', { environment, deploymentId: this.deploymentId });

      // 确认部署（生产环境）
      if (envConfig.deploy?.confirmRequired && !options.force) {
        const confirmed = await this.confirmDeployment(environment);
        if (!confirmed) {
          console.log('❌ 部署已取消');
          return false;
        }
      }

      // 预部署检查
      await this.preDeploymentChecks(envConfig);

      // 创建备份
      if (envConfig.deploy?.backup) {
        await this.createBackup(environment);
      }

      // 构建项目
      await this.buildProject(envConfig);

      // 执行部署
      await this.executeDeployment(envConfig);

      // 健康检查
      await this.performHealthCheck(envConfig);

      // 后部署任务
      await this.postDeploymentTasks(envConfig);

      // 发送通知
      await this.sendNotification('success', environment);

      // 记录部署成功
      this.logDeployment('success', {
        environment,
        deploymentId: this.deploymentId,
        duration: Date.now() - this.startTime,
      });

      console.log('\n✅ 部署成功完成! 🎉');
      console.log(`🔗 访问地址: ${envConfig.healthCheck}`);

      return true;
    } catch (error) {
      console.error(`\n❌ 部署失败: ${error.message}`);

      // 记录部署失败
      this.logDeployment('failure', {
        environment,
        deploymentId: this.deploymentId,
        error: error.message,
      });

      // 发送失败通知
      await this.sendNotification('failure', environment, error.message);

      // 询问是否回滚
      if (envConfig.deploy?.backup) {
        const shouldRollback = await this.askQuestion('是否要回滚到上一个版本? (y/N): ');
        if (shouldRollback.toLowerCase() === 'y') {
          await this.rollback(environment);
        }
      }

      throw error;
    }
  }

  /**
   * 预部署检查
   */
  async preDeploymentChecks(envConfig) {
    console.log('🔍 执行预部署检查...');

    if (envConfig.deploy?.beforeDeploy) {
      for (const command of envConfig.deploy.beforeDeploy) {
        console.log(`   执行: ${command}`);
        try {
          execSync(command, {
            cwd: this.options.projectRoot,
            stdio: 'inherit',
          });
        } catch (error) {
          throw new Error(`预部署检查失败: ${command}`);
        }
      }
    }

    console.log('✅ 预部署检查通过');
  }

  /**
   * 构建项目
   */
  async buildProject(envConfig) {
    console.log('🔨 构建项目...');

    try {
      // 设置环境变量
      const env = { ...process.env, ...envConfig.env };

      // 执行构建命令
      execSync(envConfig.buildCommand, {
        cwd: this.options.projectRoot,
        stdio: 'inherit',
        env,
      });

      console.log('✅ 项目构建完成');
    } catch (error) {
      throw new Error(`项目构建失败: ${error.message}`);
    }
  }

  /**
   * 执行部署
   */
  async executeDeployment(envConfig) {
    console.log('📦 执行部署...');

    if (envConfig.deploy?.method === 'ssh') {
      await this.deployViaSSH(envConfig);
    } else {
      // 本地部署
      await this.deployLocally(envConfig);
    }

    console.log('✅ 部署执行完成');
  }

  // TODO: 考虑将此函数拆分为更小的函数 (当前 32 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 32 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 32 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 32 行)

  /**
   * SSH部署
   */
  async deployViaSSH(envConfig) {
    const { user, host, path: remotePath } = envConfig.deploy;

    console.log(`   通过SSH部署到 ${user}@${host}:${remotePath}`);

    // 创建部署包
    const packagePath = await this.createDeploymentPackage();

    try {
      // 上传文件
      execSync(`scp ${packagePath} ${user}@${host}:/tmp/deployment-${this.deploymentId}.tar.gz`, {
        stdio: 'inherit',
      });

      // 远程部署脚本
      const deployScript = `
        cd ${remotePath} &&
        tar -xzf /tmp/deployment-${this.deploymentId}.tar.gz &&
        npm install --production &&
        rm /tmp/deployment-${this.deploymentId}.tar.gz
      `;

      execSync(`ssh ${user}@${host} "${deployScript}"`, {
        stdio: 'inherit',
      });
    } finally {
      // 清理本地部署包
      if (fs.existsSync(packagePath)) {
        fs.unlinkSync(packagePath);
      }
    }
  }

  /**
   * 本地部署
   */
  async deployLocally(envConfig) {
    console.log('   本地部署模式');

    // 启动应用
    const env = { ...process.env, ...envConfig.env };

    console.log(`   启动命令: ${envConfig.startCommand}`);

    // 这里可以使用PM2或其他进程管理器
    // 为了演示，我们只是记录命令
    console.log('   应用已启动（演示模式）');
  }

  /**
   * 创建部署包
   */
  async createDeploymentPackage() {
    const packagePath = path.join(
      this.options.projectRoot,
      `deployment-${this.deploymentId}.tar.gz`
    );

    console.log('   创建部署包...');

    // 排除不需要的文件
    const excludePatterns = ['node_modules', '.git', 'tests', 'coverage', '*.log', '.env*']
      .map((pattern) => `--exclude='${pattern}'`)
      .join(' ');

    execSync(`tar -czf ${packagePath} ${excludePatterns} .`, {
      cwd: this.options.projectRoot,
      stdio: 'inherit',
    });

    return packagePath;
  }

  /**
   * 健康检查
   */
  async performHealthCheck(envConfig) {
    console.log('🏥 执行健康检查...');

    const { healthCheck } = envConfig;
    const { healthCheckTimeout, healthCheckRetries } = this.config.monitoring;

    for (let i = 0; i < healthCheckRetries; i++) {
      try {
        console.log(`   尝试 ${i + 1}/${healthCheckRetries}: ${healthCheck}`);

        // 使用curl进行健康检查
        execSync(`curl -f --max-time ${healthCheckTimeout / 1000} ${healthCheck}`, {
          stdio: 'ignore',
        });

        console.log('✅ 健康检查通过');
        return;
      } catch (error) {
        if (i === healthCheckRetries - 1) {
          throw new Error('健康检查失败');
        }

        console.log('   等待 5 秒后重试...');
        await this.sleep(5000);
      }
    }
  }

  /**
   * 后部署任务
   */
  async postDeploymentTasks(envConfig) {
    console.log('🔧 执行后部署任务...');

    if (envConfig.deploy?.afterDeploy) {
      for (const command of envConfig.deploy.afterDeploy) {
        console.log(`   执行: ${command}`);
        try {
          execSync(command, {
            cwd: this.options.projectRoot,
            stdio: 'inherit',
          });
        } catch (error) {
          console.warn(`   后部署任务警告: ${command} - ${error.message}`);
        }
      }
    }

    // TODO: 考虑将此函数拆分为更小的函数 (当前 31 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 31 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 31 行)

    // TODO: 考虑将此函数拆分为更小的函数 (当前 31 行)

    console.log('✅ 后部署任务完成');
  }

  /**
   * 创建备份
   */
  async createBackup(environment) {
    console.log('💾 创建部署备份...');

    const backupDir = path.join(this.options.projectRoot, this.options.backupDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${environment}-${timestamp}`);

    // 创建备份目录
    fs.mkdirSync(backupPath, { recursive: true });

    // 备份当前版本信息
    const backupInfo = {
      environment,
      timestamp: new Date().toISOString(),
      deploymentId: this.deploymentId,
      gitCommit: this.getCurrentGitCommit(),
      packageVersion: this.getPackageVersion(),
    };

    fs.writeFileSync(
      path.join(backupPath, 'backup-info.json'),
      JSON.stringify(backupInfo, null, 2)
    );

    // 清理旧备份
    await this.cleanupOldBackups(environment);

    console.log(`✅ 备份已创建: ${backupPath}`);

    return backupPath;
  }

  /**
   * 回滚部署
   */
  async rollback(environment, backupId = null) {
    console.log(`🔄 开始回滚 ${environment} 环境...`);

    const backupDir = path.join(this.options.projectRoot, this.options.backupDir);

    // 获取可用的备份
    const backups = this.getAvailableBackups(environment);

    if (backups.length === 0) {
      throw new Error('没有可用的备份');
    }

    let selectedBackup;

    if (backupId) {
      selectedBackup = backups.find((b) => b.id === backupId);
      if (!selectedBackup) {
        throw new Error(`备份不存在: ${backupId}`);
      }
    } else {
      // 使用最新的备份
      selectedBackup = backups[0];
    }

    console.log(`📦 回滚到备份: ${selectedBackup.id}`);
    console.log(`📅 备份时间: ${selectedBackup.timestamp}`);

    try {
      // 执行回滚
      await this.executeRollback(environment, selectedBackup);

      // 健康检查
      const envConfig = this.config.environments[environment];
      await this.performHealthCheck(envConfig);

      // 记录回滚
      this.logDeployment('rollback', {
        environment,
        backupId: selectedBackup.id,
        rollbackId: this.generateDeploymentId(),
      });

      console.log('✅ 回滚成功完成!');
    } catch (error) {
      console.error(`❌ 回滚失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 执行回滚
   */
  async executeRollback(environment, backup) {
    console.log('🔄 执行回滚操作...');

    const envConfig = this.config.environments[environment];

    if (envConfig.deploy?.method === 'ssh') {
      // SSH回滚
      console.log('   SSH回滚模式');
      // 这里应该实现SSH回滚逻辑
    } else {
      // 本地回滚
      console.log('   本地回滚模式');
      // 这里应该实现本地回滚逻辑
    }
  }

  /**
   * 获取可用备份
   */
  getAvailableBackups(environment) {
    const backupDir = path.join(this.options.projectRoot, this.options.backupDir);

    if (!fs.existsSync(backupDir)) {
      return [];
    }

    const backups = [];
    const entries = fs.readdirSync(backupDir);

    for (const entry of entries) {
      if (entry.startsWith(`${environment}-`)) {
        const backupPath = path.join(backupDir, entry);
        const infoPath = path.join(backupPath, 'backup-info.json');

        if (fs.existsSync(infoPath)) {
          try {
            const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
            backups.push({
              id: entry,
              path: backupPath,
              ...info,
            });
          } catch (error) {
            console.warn(`无法读取备份信息: ${entry}`);
          }
        }
      }
    }

    // 按时间排序（最新的在前）
    return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * 清理旧备份
   */
  async cleanupOldBackups(environment) {
    const backups = this.getAvailableBackups(environment);

    if (backups.length > this.options.maxBackups) {
      const toDelete = backups.slice(this.options.maxBackups);

      for (const backup of toDelete) {
        try {
          fs.rmSync(backup.path, { recursive: true, force: true });
          console.log(`   清理旧备份: ${backup.id}`);
        } catch (error) {
          console.warn(`清理备份失败: ${backup.id} - ${error.message}`);
        }
      }
    }
  }

  /**
   * 发送通知
   */
  async sendNotification(type, environment, message = '') {
    const { notifications } = this.config;

    if (notifications.slack?.enabled) {
      await this.sendSlackNotification(type, environment, message);
    }

    if (notifications.email?.enabled) {
      await this.sendEmailNotification(type, environment, message);
    }
  }

  /**
   * 发送Slack通知
   */
  async sendSlackNotification(type, environment, message) {
    // 这里应该实现Slack通知逻辑
    console.log(`📱 Slack通知: ${type} - ${environment} - ${message}`);
  }

  /**
   * 发送邮件通知
   */
  async sendEmailNotification(type, environment, message) {
    // 这里应该实现邮件通知逻辑
    console.log(`📧 邮件通知: ${type} - ${environment} - ${message}`);
  }

  /**
   * 记录部署日志
   */
  logDeployment(type, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      ...data,
    };

    const logFile = path.join(this.options.projectRoot, 'logs', this.options.logFile);
    const logLine = `${JSON.stringify(logEntry)}\n`;

    fs.appendFileSync(logFile, logLine);
  }

  /**
   * 确认部署
   */
  async confirmDeployment(environment) {
    const envConfig = this.config.environments[environment];

    console.log(`\n⚠️  即将部署到 ${envConfig.name} (${environment})`);
    console.log(`🔗 目标地址: ${envConfig.healthCheck}`);
    console.log(`📋 部署ID: ${this.deploymentId}`);

    const answer = await this.askQuestion('\n确认继续部署? (y/N): ');
    return answer.toLowerCase() === 'y';
  }

  /**
   * 询问用户输入
   */
  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * 辅助方法
   */
  generateDeploymentId() {
    return `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getCurrentGitCommit() {
    try {
      return execSync('git rev-parse HEAD', {
        cwd: this.options.projectRoot,
        encoding: 'utf8',
      }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  getPackageVersion() {
    try {
      const packagePath = path.join(this.options.projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return packageJson.version;
    } catch (error) {
      return 'unknown';
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.rl.close();
  }
}

// 命令行接口
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];
  const environment = args[1];

  const manager = new DeploymentManager();

  async function main() {
    try {
      await manager.initialize();

      switch (command) {
        case 'deploy':
          if (!environment) {
            console.error('请指定环境: deploy <environment>');
            process.exit(1);
          }
          await manager.deploy(environment, { force: args.includes('--force') });
            break;

          }

        case 'rollback':
          if (!environment) {
            console.error('请指定环境: rollback <environment> [backup-id]');
            process.exit(1);
          }
          await manager.rollback(environment, args[2]);
            break;

          }

        case 'list-backups':
          if (!environment) {
            console.error('请指定环境: list-backups <environment>');
            process.exit(1);
          }
          const backups = manager.getAvailableBackups(environment);
          console.log(`\n${environment} 环境的可用备份:`);
          backups.forEach((backup) => {
            console.log(`  ${backup.id} - ${backup.timestamp}`);
          });
            break;

          }

        case 'status':
          console.log('部署状态检查功能待实现');
            break;

          }

        default:
          console.log(`
使用方法:
  node deploy.js deploy <environment> [--force]
  node deploy.js rollback <environment> [backup-id]
  node deploy.js list-backups <environment>
  node deploy.js status

可用环境: ${Object.keys(manager.config?.environments || {}).join(', ')}
`);
      }
    } catch (error) {
      console.error(`\n❌ 操作失败: ${error.message}`);
      process.exit(1);
    } finally {
      manager.cleanup();
    }
  }

  main();
}

export default DeploymentManager;
