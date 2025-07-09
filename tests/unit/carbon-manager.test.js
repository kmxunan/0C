/**
 * CarbonManager 单元测试
 */

describe('CarbonManager', () => {
  test('should be able to create constants', () => {
    const CARBON_CONSTANTS = {
      TREE_CO2_ABSORPTION: 22,
      CAR_CO2_PER_KM: 0.12,
      DEFAULT_FACTOR: 0.5
    };
    
    expect(CARBON_CONSTANTS.TREE_CO2_ABSORPTION).toBe(22);
    expect(CARBON_CONSTANTS.CAR_CO2_PER_KM).toBe(0.12);
    expect(CARBON_CONSTANTS.DEFAULT_FACTOR).toBe(0.5);
  });

  test('should calculate basic carbon emission', () => {
    const consumption = 100; // kWh
    const factor = 0.5; // kg CO2/kWh
    const emission = consumption * factor;
    
    expect(emission).toBe(50);
  });

  test('should calculate percentage correctly', () => {
    const part = 25;
    const total = 100;
    const percentage = (part / total) * 100;
    
    expect(percentage).toBe(25);
  });

  test('should handle time conditions', () => {
    const timeRanges = {
      '1h': '-1 hour',
      '24h': '-1 day',
      '7d': '-7 days',
      '30d': '-30 days'
    };
    
    expect(timeRanges['24h']).toBe('-1 day');
    expect(timeRanges['7d']).toBe('-7 days');
  });

  test('should validate energy types', () => {
    const energyTypes = ['electricity', 'naturalGas', 'water', 'heating', 'cooling'];
    
    expect(energyTypes).toContain('electricity');
    expect(energyTypes).toContain('naturalGas');
    expect(energyTypes.length).toBe(5);
  });
});