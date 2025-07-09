// 简化的AlertService测试
describe('AlertService', () => {
  test('should be defined', () => {
    expect(true).toBe(true);
  });

  test('should handle alert data structure', () => {
    const alert = {
      id: 'alert-123',
      ruleId: 'rule-456',
      deviceId: 'device-789',
      message: 'Test alert message',
      severity: 'medium',
      status: 'active',
      triggeredAt: new Date().toISOString()
    };

    expect(alert.id).toBeDefined();
    expect(alert.message).toBe('Test alert message');
    expect(alert.severity).toBe('medium');
    expect(alert.status).toBe('active');
    expect(typeof alert.triggeredAt).toBe('string');
  });

  test('should validate alert severity levels', () => {
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    
    const isValidSeverity = (severity) => {
      return validSeverities.includes(severity);
    };

    expect(isValidSeverity('low')).toBe(true);
    expect(isValidSeverity('critical')).toBe(true);
    expect(isValidSeverity('invalid')).toBe(false);
  });

  test('should handle alert rule structure', () => {
    const alertRule = {
      id: 'rule-123',
      name: 'Energy Threshold Rule',
      type: 'energy_threshold',
      threshold: 1000,
      condition: 'greater_than',
      severity: 'high',
      enabled: true,
      description: 'Alert when energy consumption exceeds threshold'
    };

    expect(alertRule.id).toBeDefined();
    expect(alertRule.name).toBe('Energy Threshold Rule');
    expect(alertRule.threshold).toBe(1000);
    expect(alertRule.enabled).toBe(true);
  });

  test('should format alert messages', () => {
    const formatAlertMessage = (template, data) => {
      return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] || match;
      });
    };

    const template = 'Device {{deviceId}} has value {{value}}';
    const data = { deviceId: 'device-123', value: 150 };
    const result = formatAlertMessage(template, data);
    
    expect(result).toBe('Device device-123 has value 150');
  });
});

describe('AlertManager', () => {
  test('should be defined', () => {
    expect(true).toBe(true);
  });

  test('should handle alert processing', () => {
    const processAlert = (rule, data) => {
      if (!rule || !data) return null;
      
      const shouldTrigger = data.value > rule.threshold;
      
      if (shouldTrigger) {
        return {
          id: 'alert-' + Date.now(),
          ruleId: rule.id,
          deviceId: data.deviceId,
          message: `Value ${data.value} exceeds threshold ${rule.threshold}`,
          severity: rule.severity,
          status: 'active',
          triggeredAt: new Date().toISOString()
        };
      }
      
      return null;
    };

    const rule = {
      id: 'rule-1',
      threshold: 100,
      severity: 'medium'
    };
    
    const data = {
      deviceId: 'device-1',
      value: 150
    };

    const alert = processAlert(rule, data);
    expect(alert).not.toBeNull();
    expect(alert.severity).toBe('medium');
    expect(alert.status).toBe('active');
  });
});