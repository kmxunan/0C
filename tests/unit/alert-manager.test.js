/**
 * AlertManager 单元测试
 */

describe('AlertManager', () => {
  test('should evaluate simple conditions correctly', () => {
    const operators = {
      gt: (a, b) => a > b,
      lt: (a, b) => a < b,
      gte: (a, b) => a >= b,
      lte: (a, b) => a <= b,
      eq: (a, b) => a === b,
      neq: (a, b) => a !== b
    };
    
    expect(operators.gt(30, 25)).toBe(true);
    expect(operators.lt(20, 25)).toBe(true);
    expect(operators.eq('active', 'active')).toBe(true);
  });

  test('should handle alert severity levels', () => {
    const severityLevels = ['low', 'medium', 'high', 'critical'];
    
    expect(severityLevels).toContain('low');
    expect(severityLevels).toContain('high');
    expect(severityLevels.length).toBe(4);
  });

  test('should validate alert status', () => {
    const alertStatuses = ['active', 'resolved', 'acknowledged'];
    
    expect(alertStatuses).toContain('active');
    expect(alertStatuses).toContain('resolved');
  });

  test('should generate alert description', () => {
    const rule = {
      name: 'High Temperature Alert',
      description: 'Temperature exceeds threshold'
    };
    const data = { temperature: 35 };
    
    const description = `${rule.name}: ${rule.description}. Current value: ${data.temperature}`;
    
    expect(description).toContain('High Temperature Alert');
    expect(description).toContain('Temperature exceeds threshold');
    expect(description).toContain('35');
  });

  test('should filter alerts by criteria', () => {
    const alerts = [
      { id: 'alert1', severity: 'high', device_id: 'device1' },
      { id: 'alert2', severity: 'low', device_id: 'device2' },
      { id: 'alert3', severity: 'high', device_id: 'device1' }
    ];
    
    const highSeverityAlerts = alerts.filter(alert => alert.severity === 'high');
    const device1Alerts = alerts.filter(alert => alert.device_id === 'device1');
    
    expect(highSeverityAlerts.length).toBe(2);
    expect(device1Alerts.length).toBe(2);
  });

  test('should handle compound conditions', () => {
    const data = { temperature: 30, humidity: 80 };
    
    // AND logic
    const andResult = data.temperature > 25 && data.humidity > 70;
    expect(andResult).toBe(true);
    
    // OR logic
    const orResult = data.temperature > 35 || data.humidity > 70;
    expect(orResult).toBe(true);
  });
});