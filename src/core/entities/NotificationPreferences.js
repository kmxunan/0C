/**
 * 通知偏好设置模型
 * 管理用户的通知渠道偏好和告警级别过滤
 */
class NotificationPreferences {
  /**
   * 创建默认的通知偏好设置
   * @param {string} userId - 用户ID
   * @returns {Object} 默认偏好设置对象
   */
  static getDefaultPreferences(userId) {
    return {
      user_id: userId,
      channels: {
        email: { enabled: true, contact: '' },
        sms: { enabled: false, contact: '' },
        discord: { enabled: false, contact: '' },
        in_app: { enabled: true }
      },
      severity_filters: ['critical', 'high', 'medium', 'low'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

export default NotificationPreferences;
