import { dbPromise } from '../database.js';
import logger from '../utils/logger.js';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { WebhookClient } from 'discord.js';
import NotificationPreferences from '../models/NotificationPreferences.js';
import { MATH_CONSTANTS } from '../../shared/constants/MathConstants.js';

/**
 * 通知服务 - 处理各类告警通知的发送
 */
class NotificationService {
  constructor() {
    this.transporters = {
      email: this.initializeEmailTransporter(),
      sms: this.initializeSmsClient(),
      discord: this.initializeDiscordWebhook()
    };
    this.preferencesCache = new Map(); // { userId => preferences }
    this.initialize();
  }

  /**
   * 初始化通知服务
   */
  async initialize() {
    try {
      // 预加载用户通知偏好设置
      await this.loadNotificationPreferences();
      logger.info('通知服务初始化完成');
    } catch (error) {
      logger.error('通知服务初始化失败:', error);
    }
  }

  /**
   * 初始化邮件传输器
   */
  initializeEmailTransporter() {
    try {
      // 从环境变量获取邮件配置
      const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

      if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
        logger.warn('邮件服务配置不完整，邮件通知功能将不可用');
        return null;
      }

      return nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT),
        secure: parseInt(SMTP_PORT) === MATH_CONSTANTS.SMTP_SECURE_PORT,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        },
        from: SMTP_FROM || SMTP_USER
      });
    } catch (error) {
      logger.error('初始化邮件传输器失败:', error);
      return null;
    }
  }

  /**
   * 初始化SMS客户端
   */
  initializeSmsClient() {
    try {
      // 从环境变量获取Twilio配置
      const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
        logger.warn('SMS服务配置不完整，SMS通知功能将不可用');
        return null;
      }

      return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    } catch (error) {
      logger.error('初始化SMS客户端失败:', error);
      return null;
    }
  }

  /**
   * 初始化Discord Webhook
   */
  initializeDiscordWebhook() {
    try {
      const { DISCORD_WEBHOOK_URL } = process.env;

      if (!DISCORD_WEBHOOK_URL) {
        logger.warn('Discord Webhook URL未配置，Discord通知功能将不可用');
        return null;
      }

      return new WebhookClient({ url: DISCORD_WEBHOOK_URL });
    } catch (error) {
      logger.error('初始化Discord Webhook失败:', error);
      return null;
    }
  }

  /**
   * 加载用户通知偏好设置
   */
  async loadNotificationPreferences() {
    try {
      const db = await dbPromise;
      const preferences = await db.raw('SELECT * FROM notification_preferences');
      preferences.forEach((pref) => {
        try {
          pref.channels = JSON.parse(pref.channels);
          pref.severity_filters = JSON.parse(pref.severity_filters);
          this.preferencesCache.set(pref.user_id, pref);
        } catch (error) {
          logger.error(`解析用户通知偏好失败 (用户ID: ${pref.user_id}):`, error);
        }
      });
      logger.info(`加载了 ${preferences.length} 条用户通知偏好设置`);
    } catch (error) {
      logger.error('加载用户通知偏好设置失败:', error);
    }
  }

  /**
   * 获取用户的通知偏好
   * @param {string} userId - 用户ID
   */
  async getNotificationPreferences(userId) {
    // 先从缓存获取
    let prefs = this.preferencesCache.get(userId);

    if (!prefs) {
      // 缓存未命中，从数据库获取
      try {
        const db = await dbPromise;
        const result = await db.raw('SELECT * FROM notification_preferences WHERE user_id = ?', [
          userId
        ]);
        const row = result.rows ? result.rows[0] : undefined;

        if (row) {
          row.channels = JSON.parse(row.channels);
          row.severity_filters = JSON.parse(row.severity_filters);
          this.preferencesCache.set(userId, row);
          prefs = row;
        } else {
          // 使用默认偏好
          prefs = NotificationPreferences.getDefaultPreferences(userId);
          await this.saveNotificationPreferences(prefs);
        }
      } catch (error) {
        logger.error(`获取用户通知偏好失败 (用户ID: ${userId}):`, error);
        prefs = NotificationPreferences.getDefaultPreferences(userId);
      }
    }

    return prefs;
  }

  /**
   * 保存用户通知偏好
   * @param {Object} preferences - 用户通知偏好对象
   */
  async saveNotificationPreferences(preferences) {
    try {
      const db = await dbPromise;
      const result = await db.raw('SELECT id FROM notification_preferences WHERE user_id = ?', [
        preferences.user_id
      ]);
      const existing = result.rows ? result.rows[0] : undefined;

      const channelsJson = JSON.stringify(preferences.channels);
      const filtersJson = JSON.stringify(preferences.severity_filters);
      const now = new Date().toISOString();

      if (existing) {
        // 更新现有偏好
        const db = await dbPromise;
        await db.run(
          `UPDATE notification_preferences SET
            channels = ?, severity_filters = ?, updated_at = ?
           WHERE user_id = ?`,
          [channelsJson, filtersJson, now, preferences.user_id]
        );
      } else {
        // 创建新偏好
        const db = await dbPromise;
        await db.run(
          `INSERT INTO notification_preferences (
            user_id, channels, severity_filters, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?)`,
          [preferences.user_id, channelsJson, filtersJson, now, now]
        );
      }

      // 更新缓存
      this.preferencesCache.set(preferences.user_id, preferences);
      return true;
    } catch (error) {
      logger.error(`保存用户通知偏好失败 (用户ID: ${preferences.user_id}):`, error);
      return false;
    }
  }

  /**
   * 发送告警通知
   * @param {Object} alert - 告警对象
   * @param {Array} users - 需要通知的用户列表
   */
  async sendAlertNotifications(alert, users) {
    if (!alert || !users || users.length === 0) {
      logger.warn('告警信息或用户列表为空，无法发送通知');
      return;
    }

    try {
      // 记录告警到数据库
      const alertId = await this.recordAlert(alert);

      // 对每个用户处理通知
      for (const user of users) {
        try {
          const prefs = await this.getNotificationPreferences(user.id);

          // 检查告警级别是否符合用户偏好
          if (!prefs.severity_filters.includes(alert.severity)) {
            logger.debug(`用户 ${user.id} 已过滤 ${alert.severity} 级别的告警通知`);
            continue;
          }

          // 根据用户偏好的渠道发送通知
          for (const channel of prefs.channels) {
            switch (channel) {
              case 'email':
                await this.sendEmailNotification(user, alert);
                break;
              case 'sms':
                await this.sendSmsNotification(user, alert);
                break;
              case 'discord':
                await this.sendDiscordNotification(user, alert);
                break;
              default:
                logger.warn(`未知的通知渠道: ${channel}`);
            }
          }

          // 记录用户通知状态
          await this.recordUserAlert(user.id, alertId);
        } catch (error) {
          logger.error(`处理用户 ${user.id} 的告警通知失败:`, error);
          continue;
        }
      }
    } catch (error) {
      logger.error('发送告警通知失败:', error);
    }
  }

  /**
   * 记录告警到数据库
   * @param {Object} alert - 告警对象
   * @returns {number} - 告警ID
   */
  async recordAlert(alert) {
    const now = new Date().toISOString();
    const db = await dbPromise;
    const result = await db.run(
      `INSERT INTO alerts (
        device_id, type, severity, message, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [alert.deviceId, alert.type, alert.severity, alert.message, 'new', now, now]
    );
    return result.lastID;
  }

  /**
   * 记录用户告警通知状态
   * @param {string} userId - 用户ID
   * @param {number} alertId - 告警ID
   */
  async recordUserAlert(userId, alertId) {
    const now = new Date().toISOString();
    const db = await dbPromise;
    await db.run(
      `INSERT INTO user_alerts (user_id, alert_id, status, created_at)
       VALUES (?, ?, ?, ?)`,
      [userId, alertId, 'pending', now]
    );
  }

  /**
   * 发送邮件通知
   * @param {Object} user - 用户对象
   * @param {Object} alert - 告警对象
   */
  async sendEmailNotification(user, alert) {
    if (!this.transporters.email || !user.email) {
      logger.warn('邮件传输器未初始化或用户邮箱不存在，无法发送邮件通知');
      return;
    }

    try {
      const subject = `[${alert.severity.toUpperCase()}] 设备告警通知 - ${alert.deviceId}`;
      const html = `
        <h2>设备告警通知</h2>
        <p><strong>设备ID:</strong> ${alert.deviceId}</p>
        <p><strong>告警类型:</strong> ${alert.type}</p>
        <p><strong>严重级别:</strong> ${alert.severity}</p>
        <p><strong>告警信息:</strong> ${alert.message}</p>
        <p><strong>发生时间:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
        <p>请及时处理此告警。</p>
      `;

      await this.transporters.email.sendMail({
        to: user.email,
        subject,
        html
      });

      logger.info(`已向用户 ${user.id} 发送邮件告警通知`);
      await this.updateUserAlertStatus(user.id, alert.id, 'sent');
    } catch (error) {
      logger.error(`发送邮件通知失败 (用户ID: ${user.id}):`, error);
      await this.updateUserAlertStatus(user.id, alert.id, 'failed');
    }
  }

  /**
   * 发送SMS通知
   * @param {Object} user - 用户对象
   * @param {Object} alert - 告警对象
   */
  async sendSmsNotification(user, alert) {
    if (!this.transporters.sms || !user.phone) {
      logger.warn('SMS客户端未初始化或用户手机号不存在，无法发送SMS通知');
      return;
    }

    try {
      const message = `[${alert.severity.toUpperCase()}] 设备${alert.deviceId}告警: ${alert.message} 时间:${new Date(alert.timestamp).toLocaleString()}`;

      await this.transporters.sms.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: user.phone
      });

      logger.info(`已向用户 ${user.id} 发送SMS告警通知`);
      await this.updateUserAlertStatus(user.id, alert.id, 'sent');
    } catch (error) {
      logger.error(`发送SMS通知失败 (用户ID: ${user.id}):`, error);
      await this.updateUserAlertStatus(user.id, alert.id, 'failed');
    }
  }

  /**
   * 发送Discord通知
   * @param {Object} alert - 告警对象
   */
  async sendDiscordNotification(user, alert) {
    if (!this.transporters.discord) {
      logger.warn('Discord Webhook未初始化，无法发送Discord通知');
      return;
    }

    try {
      const embed = {
        title: `设备告警通知 [${alert.severity.toUpperCase()}]`,
        color: this.getSeverityColor(alert.severity),
        fields: [
          { name: '设备ID', value: alert.deviceId, inline: true },
          { name: '告警类型', value: alert.type, inline: true },
          { name: '严重级别', value: alert.severity, inline: true },
          { name: '告警信息', value: alert.message },
          { name: '发生时间', value: new Date(alert.timestamp).toLocaleString() }
        ],
        timestamp: new Date().toISOString()
      };

      await this.transporters.discord.send({ embeds: [embed] });
      logger.info('已发送Discord告警通知');
    } catch (error) {
      logger.error('发送Discord通知失败:', error);
    }
  }

  /**
   * 根据告警级别获取颜色代码
   * @param {string} severity - 告警级别
   * @returns {number} - 颜色代码
   */
  getSeverityColor(severity) {
    const colors = {
      critical: 0xff0000,
      high: 0xffa500,
      medium: 0xffff00,
      low: 0x00ff00
    };
    return colors[severity] || MATH_CONSTANTS.DEFAULT_GRAY_COLOR;
  }

  /**
   * 更新用户告警状态
   * @param {string} userId - 用户ID
   * @param {number} alertId - 告警ID
   * @param {string} status - 状态
   */
  async updateUserAlertStatus(userId, alertId, status) {
    const db = await dbPromise;
    await db.run(
      `UPDATE user_alerts SET status = ?, updated_at = ?
       WHERE user_id = ? AND alert_id = ?`,
      [status, new Date().toISOString(), userId, alertId]
    );
  }

  /**
   * 发送通知
   * @param {Object} notification - 通知对象
   * @param {string} notification.type - 通知类型 (system, alert, warning, info)
   * @param {string|string[]} notification.recipients - 接收者ID或'admin'表示管理员
   * @param {string} notification.title - 通知标题
   * @param {string} notification.message - 通知内容
   * @param {string} [notification.alert_id] - 关联的告警ID
   * @param {string} [notification.severity] - 告警级别 (critical, high, medium, low)
   */
  async sendNotification(notification) {
    try {
      const { type, recipients, title, message, alert_id, severity = 'medium' } = notification;

      // 处理接收者
      const userIds = await this.resolveRecipients(recipients);
      if (!userIds.length) {
        logger.warn('未找到有效的通知接收者');
        return false;
      }

      // 为每个接收者发送通知
      const results = [];
      for (const userId of userIds) {
        const prefs = await this.getNotificationPreferences(userId);

        // 检查该级别是否在用户的过滤范围内
        if (!prefs.severity_filters.includes(severity) && !prefs.severity_filters.includes('all')) {
          logger.debug(`用户 ${userId} 的通知偏好过滤了 ${severity} 级别的通知`);
          continue;
        }

        // 为每个启用的渠道发送通知
        for (const [channel, config] of Object.entries(prefs.channels)) {
          if (config.enabled) {
            const result = await this.sendViaChannel({
              channel,
              userId,
              contact: config.contact,
              title,
              message,
              alertId: alert_id,
              severity,
              type
            });
            results.push(result);
          }
        }
      }

      return results.every((r) => r.success);
    } catch (error) {
      logger.error('发送通知失败:', error);
      return false;
    }
  }

  /**
   * 解析接收者列表
   * @param {string|string[]} recipients - 接收者ID或'admin'表示管理员
   */
  async resolveRecipients(recipients) {
    try {
      if (!recipients) {
        return [];
      }

      // 标准化为数组
      const recipientsArray = Array.isArray(recipients) ? recipients : [recipients];
      const userIds = new Set();

      for (const recipient of recipientsArray) {
        if (recipient === 'admin') {
          // 获取所有管理员
          const db = await dbPromise;
          const admins = await db.raw('SELECT id FROM users WHERE role = "admin"');
          admins.forEach((admin) => userIds.add(admin.id));
        } else if (recipient.includes('@')) {
          // 直接指定邮箱
          // 这里可以添加通过邮箱查找用户的逻辑
          logger.warn('直接邮箱指定功能尚未实现');
        } else {
          // 用户ID
          userIds.add(recipient);
        }
      }

      return Array.from(userIds);
    } catch (error) {
      logger.error('解析通知接收者失败:', error);
      return [];
    }
  }

  /**
   * 通过指定渠道发送通知
   * @param {Object} params - 发送参数
   */
  async sendViaChannel(params) {
    const { channel, userId, contact, title, message, alertId, severity } = params;
    const result = { channel, userId, success: false, error: null };

    try {
      switch (channel) {
        case 'email':
          await this.sendEmail(contact, title, message);
          break;
        case 'sms':
          await this.sendSms(contact, message);
          break;
        case 'discord':
          await this.sendDiscord(title, message, severity);
          break;
        case 'in_app':
          await this.saveInAppNotification(userId, title, message, alertId, severity);
          break;
        default:
          throw new Error(`不支持的通知渠道: ${channel}`);
      }

      result.success = true;
      logger.info(`通知已发送 (渠道: ${channel}, 用户: ${userId})`);
    } catch (error) {
      result.error = error.message;
      logger.error(`通知发送失败 (渠道: ${channel}, 用户: ${userId}):`, error);
    }

    // 记录通知发送状态
    await this.logNotificationAttempt(params, result);
    return result;
  }

  /**
   * 发送邮件通知
   * @param {string} to - 收件人邮箱
   * @param {string} subject - 邮件主题
   * @param {string} body - 邮件内容
   */
  async sendEmail(to, subject, body) {
    if (!this.transporters.email) {
      throw new Error('邮件传输器未初始化');
    }

    // 构建HTML邮件内容
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">${subject}</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
          ${body}
        </div>
        <p style="color: #7f8c8d; margin-top: 20px;">这是系统自动发送的通知邮件，请勿直接回复。</p>
      </div>
    `;

    // 发送邮件
    return await this.transporters.email.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: htmlBody
    });
  }
}

export default NotificationService;
