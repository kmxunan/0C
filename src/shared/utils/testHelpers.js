// import crypto from 'crypto';

// 测试常量定义
const TEST_CONSTANTS = {
  // 数字范围
  MIN_ID: 1,
  MAX_ID: 10000,
  MAX_LARGE_ID: 100000,
  MAX_USER_ID: 100,
  MAX_RULE_ID: 1000,
  
  // 数据生成
  DEFAULT_COUNT: 10,
  LARGE_COUNT: 100,
  BCRYPT_ROUNDS: 10,
  RANDOM_BYTES: 16,
  
  // 能源数据范围
  MAX_ENERGY: 1000,
  MAX_POWER: 500,
  MIN_VOLTAGE: 200,
  MAX_VOLTAGE: 250,
  MAX_CURRENT: 50,
  MIN_FREQUENCY: 49,
  MAX_FREQUENCY: 51,
  MIN_POWER_FACTOR: 0.8,
  MAX_POWER_FACTOR: 1.0,
  
  // 碳排放
  MAX_CARBON: 100,
  MIN_EMISSION_FACTOR: 0.5,
  MAX_EMISSION_FACTOR: 1.2,
  
  // 储能设备
  MIN_CAPACITY: 10,
  MAX_CAPACITY: 1000,
  MIN_RATE: 1,
  MAX_RATE: 50,
  MIN_EFFICIENCY: 80,
  MAX_EFFICIENCY: 95,
  
  // 性能测试
  DEFAULT_ITERATIONS: 1,
  DEFAULT_CONCURRENCY: 10,
  CONCURRENCY_ITERATIONS: 100,
  MEMORY_DIVISOR: 1000000,
  
  // 时间
  YEAR_2020: 2020,
  MONTH_JANUARY: 0,
  DAY_FIRST: 1,
  
  // 随机数
  DEFAULT_STRING_LENGTH: 10,
  MIN_RANDOM: 1,
  MAX_RANDOM: 1000,
  ALPHANUMERIC_LENGTH: 8,
  RANDOM_RULE_LENGTH: 6,
  DEVICE_ID_LENGTH: 8,
  
  // HTTP状态码
  HTTP_OK: 200,
  HTTP_BAD_REQUEST: 400,
  
  // 概率
  PROBABILITY_HALF: 0.5,
  PROBABILITY_SEVENTY: 0.7,
  
  // 测试数据
  SEED_DEVICE_COUNT: 5,
  SEED_USER_COUNT: 10,
  SEED_ENERGY_COUNT: 50,
  
  // 精度
  PRECISION_HUNDREDTH: 0.01,
  PRECISION_TENTH: 0.1,
  PRECISION_THOUSANDTH: 0.001
};

// 安全随机数生成函数（内部使用）
// function _generateSecureRandom() {
//   return crypto.randomBytes(TEST_CONSTANTS.RANDOM_BYTES).toString('hex');
// }

/**
 * 测试工具和辅助函数
 * 提供统一的测试工具和模拟数据生成
 */

import { faker } from '@faker-js/faker';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// 设置中文本地化
faker.locale = 'zh_CN';

// 测试数据生成器
export class TestDataGenerator {
  // 生成用户数据
  static generateUser(overrides = {}) {
    const defaultUser = {
      id: faker.datatype.number({ min: TEST_CONSTANTS.MIN_ID, max: TEST_CONSTANTS.MAX_ID }),
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password_hash: bcrypt.hashSync('Test123!@#', TEST_CONSTANTS.BCRYPT_ROUNDS),
      role: faker.helpers.arrayElement(['admin', 'operator', 'viewer', 'user']),
      is_active: faker.datatype.boolean(),
      last_login: faker.date.recent(),
      created_at: faker.date.past(),
      updated_at: faker.date.recent()
    };

    return { ...defaultUser, ...overrides };
  }

  // 生成用户列表
  static generateUsers(count = TEST_CONSTANTS.DEFAULT_COUNT, overrides = {}) {
    return Array.from({ length: count }, () => this.generateUser(overrides));
  }

  // 生成设备数据
  static generateDevice(overrides = {}) {
    const deviceTypes = [
      'sensor',
      'actuator',
      'gateway',
      'storage',
      'solar_panel',
      'wind_turbine',
      'battery'
    ];
    const statuses = ['online', 'offline', 'maintenance', 'error'];

    const defaultDevice = {
      id: faker.datatype.number({ min: TEST_CONSTANTS.MIN_ID, max: TEST_CONSTANTS.MAX_ID }),
      device_id: `DEV_${faker.random.alphaNumeric(TEST_CONSTANTS.ALPHANUMERIC_LENGTH).toUpperCase()}`,
      name: faker.commerce.productName(),
      type: faker.helpers.arrayElement(deviceTypes),
      location: `${faker.address.city()}${faker.address.streetAddress()}`,
      status: faker.helpers.arrayElement(statuses),
      last_seen: faker.date.recent(),
      metadata: JSON.stringify({
        manufacturer: faker.company.name(),
        model: faker.commerce.productName(),
        version: faker.system.semver()
      }),
      created_at: faker.date.past(),
      updated_at: faker.date.recent()
    };

    return { ...defaultDevice, ...overrides };
  }

  // 生成设备列表
  static generateDevices(count = TEST_CONSTANTS.DEFAULT_COUNT, overrides = {}) {
    return Array.from({ length: count }, () => this.generateDevice(overrides));
  }

  // 生成能耗数据
  static generateEnergyData(overrides = {}) {
    const defaultEnergyData = {
      id: faker.datatype.number({ min: TEST_CONSTANTS.MIN_ID, max: TEST_CONSTANTS.MAX_LARGE_ID }),
      device_id: `DEV_${faker.random.alphaNumeric(TEST_CONSTANTS.ALPHANUMERIC_LENGTH).toUpperCase()}`,
      timestamp: faker.date.recent(),
      energy_consumption: faker.datatype.float({ min: 0, max: TEST_CONSTANTS.MAX_ENERGY, precision: TEST_CONSTANTS.PRECISION_HUNDREDTH }),
      power: faker.datatype.float({ min: 0, max: TEST_CONSTANTS.MAX_POWER, precision: TEST_CONSTANTS.PRECISION_HUNDREDTH }),
      voltage: faker.datatype.float({ min: TEST_CONSTANTS.MIN_VOLTAGE, max: TEST_CONSTANTS.MAX_VOLTAGE, precision: TEST_CONSTANTS.PRECISION_TENTH }),
      current: faker.datatype.float({ min: 0, max: TEST_CONSTANTS.MAX_CURRENT, precision: TEST_CONSTANTS.PRECISION_HUNDREDTH }),
      frequency: faker.datatype.float({ min: TEST_CONSTANTS.MIN_FREQUENCY, max: TEST_CONSTANTS.MAX_FREQUENCY, precision: TEST_CONSTANTS.PRECISION_HUNDREDTH }),
      power_factor: faker.datatype.float({ min: TEST_CONSTANTS.MIN_POWER_FACTOR, max: TEST_CONSTANTS.MAX_POWER_FACTOR, precision: TEST_CONSTANTS.PRECISION_HUNDREDTH }),
      created_at: faker.date.recent()
    };

    return { ...defaultEnergyData, ...overrides };
  }

  // 生成能耗数据列表
  static generateEnergyDataList(count = TEST_CONSTANTS.LARGE_COUNT, overrides = {}) {
    return Array.from({ length: count }, () => this.generateEnergyData(overrides));
  }

  // 生成碳排放数据
  static generateCarbonData(overrides = {}) {
    const defaultCarbonData = {
      id: faker.datatype.number({ min: TEST_CONSTANTS.MIN_ID, max: TEST_CONSTANTS.MAX_LARGE_ID }),
      device_id: `DEV_${faker.random.alphaNumeric(TEST_CONSTANTS.ALPHANUMERIC_LENGTH).toUpperCase()}`,
      timestamp: faker.date.recent(),
      carbon_emission: faker.datatype.float({ min: 0, max: TEST_CONSTANTS.MAX_CARBON, precision: TEST_CONSTANTS.PRECISION_THOUSANDTH }),
      emission_factor: faker.datatype.float({ min: TEST_CONSTANTS.MIN_EMISSION_FACTOR, max: TEST_CONSTANTS.MAX_EMISSION_FACTOR, precision: TEST_CONSTANTS.PRECISION_THOUSANDTH }),
      calculation_method: faker.helpers.arrayElement(['direct', 'indirect', 'lifecycle']),
      created_at: faker.date.recent()
    };

    return { ...defaultCarbonData, ...overrides };
  }

  // 生成储能设备数据
  static generateStorageDevice(overrides = {}) {
    const capacity = faker.datatype.float({ min: TEST_CONSTANTS.MIN_CAPACITY, max: TEST_CONSTANTS.MAX_CAPACITY, precision: TEST_CONSTANTS.PRECISION_TENTH });
    const currentCharge = faker.datatype.float({ min: 0, max: capacity, precision: TEST_CONSTANTS.PRECISION_TENTH });

    const defaultStorageDevice = {
      id: faker.datatype.number({ min: TEST_CONSTANTS.MIN_ID, max: TEST_CONSTANTS.MAX_ID }),
      device_id: `STORAGE_${faker.random.alphaNumeric(TEST_CONSTANTS.ALPHANUMERIC_LENGTH).toUpperCase()}`,
      capacity,
      current_charge: currentCharge,
      charge_rate: faker.datatype.float({ min: TEST_CONSTANTS.MIN_RATE, max: TEST_CONSTANTS.MAX_RATE, precision: TEST_CONSTANTS.PRECISION_TENTH }),
      discharge_rate: faker.datatype.float({ min: TEST_CONSTANTS.MIN_RATE, max: TEST_CONSTANTS.MAX_RATE, precision: TEST_CONSTANTS.PRECISION_TENTH }),
      efficiency: faker.datatype.float({ min: TEST_CONSTANTS.MIN_EFFICIENCY, max: TEST_CONSTANTS.MAX_EFFICIENCY, precision: TEST_CONSTANTS.PRECISION_TENTH }),
      status: faker.helpers.arrayElement(['charging', 'discharging', 'idle', 'maintenance']),
      last_updated: faker.date.recent(),
      created_at: faker.date.past(),
      updated_at: faker.date.recent()
    };

    return { ...defaultStorageDevice, ...overrides };
  }

  // 生成告警规则
  static generateAlertRule(overrides = {}) {
    const defaultAlertRule = {
      id: faker.datatype.number({ min: TEST_CONSTANTS.MIN_ID, max: TEST_CONSTANTS.MAX_ID }),
      name: `告警规则_${faker.random.alphaNumeric(TEST_CONSTANTS.RANDOM_RULE_LENGTH)}`,
      description: faker.lorem.sentence(),
      condition_type: faker.helpers.arrayElement(['threshold', 'range', 'change_rate', 'offline']),
      condition_value: faker.datatype.float({ min: TEST_CONSTANTS.MIN_RANDOM, max: TEST_CONSTANTS.MAX_RANDOM, precision: TEST_CONSTANTS.PRECISION_HUNDREDTH }),
      device_type: faker.helpers.arrayElement(['sensor', 'actuator', 'storage']),
      device_id: Math.random() > TEST_CONSTANTS.PROBABILITY_HALF ? `DEV_${faker.random.alphaNumeric(TEST_CONSTANTS.ALPHANUMERIC_LENGTH)}` : null,
      is_active: faker.datatype.boolean(),
      severity: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
      created_by: faker.datatype.number({ min: TEST_CONSTANTS.MIN_ID, max: TEST_CONSTANTS.MAX_USER_ID }),
      created_at: faker.date.past(),
      updated_at: faker.date.recent()
    };

    return { ...defaultAlertRule, ...overrides };
  }

  // 生成告警
  static generateAlert(overrides = {}) {
    const defaultAlert = {
      id: faker.datatype.number({ min: TEST_CONSTANTS.MIN_ID, max: TEST_CONSTANTS.MAX_LARGE_ID }),
      rule_id: faker.datatype.number({ min: TEST_CONSTANTS.MIN_ID, max: TEST_CONSTANTS.MAX_RULE_ID }),
      device_id: `DEV_${faker.random.alphaNumeric(TEST_CONSTANTS.ALPHANUMERIC_LENGTH).toUpperCase()}`,
      message: faker.lorem.sentence(),
      severity: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
      status: faker.helpers.arrayElement(['active', 'acknowledged', 'resolved']),
      triggered_at: faker.date.recent(),
      acknowledged_at: Math.random() > TEST_CONSTANTS.PROBABILITY_HALF ? faker.date.recent() : null,
      acknowledged_by: Math.random() > TEST_CONSTANTS.PROBABILITY_HALF ? faker.datatype.number({ min: TEST_CONSTANTS.MIN_ID, max: TEST_CONSTANTS.MAX_USER_ID }) : null,
      resolved_at: Math.random() > TEST_CONSTANTS.PROBABILITY_SEVENTY ? faker.date.recent() : null,
      resolved_by: Math.random() > TEST_CONSTANTS.PROBABILITY_SEVENTY ? faker.datatype.number({ min: TEST_CONSTANTS.MIN_ID, max: TEST_CONSTANTS.MAX_USER_ID }) : null,
      created_at: faker.date.recent()
    };

    return { ...defaultAlert, ...overrides };
  }

  // 生成JWT令牌
  static generateJWTToken(payload = {}, secret = 'test-secret', expiresIn = '1h') {
    const defaultPayload = {
      id: faker.datatype.number({ min: TEST_CONSTANTS.MIN_ID, max: TEST_CONSTANTS.MAX_ID }),
      username: faker.internet.userName(),
      role: 'user',
      iat: Math.floor(Date.now() / TEST_CONSTANTS.MEMORY_DIVISOR)
    };

    return jwt.sign({ ...defaultPayload, ...payload }, secret, { expiresIn });
  }

  // 生成API请求数据
  static generateApiRequest(method = 'GET', path = '/api/test', overrides = {}) {
    const defaultRequest = {
      method,
      path,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': faker.internet.userAgent(),
        'X-Request-ID': faker.datatype.uuid()
      },
      query: {},
      body: {},
      ip: faker.internet.ip(),
      timestamp: new Date().toISOString()
    };

    return { ...defaultRequest, ...overrides };
  }

  // 生成时间序列数据
  static generateTimeSeriesData(startDate, endDate, interval = 'hour', deviceId = null) {
    const data = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    let current = new Date(start);

    while (current <= end) {
      data.push({
        device_id: deviceId || `DEV_${faker.random.alphaNumeric(TEST_CONSTANTS.DEVICE_ID_LENGTH)}`,
        timestamp: new Date(current),
        energy_consumption: faker.datatype.float({ min: 0, max: 100, precision: 0.01 }),
        power: faker.datatype.float({ min: 0, max: 50, precision: 0.01 }),
        carbon_emission: faker.datatype.float({ min: 0, max: 10, precision: 0.001 })
      });

      // 增加时间间隔
      const MINUTE_MS = 60000; // 1分钟
      const HOUR_MS = 3600000; // 1小时
      const DAY_MS = 86400000; // 1天
      
      switch (interval) {
        case 'minute':
          current = new Date(current.getTime() + MINUTE_MS);
          break;
        case 'hour':
          current = new Date(current.getTime() + HOUR_MS);
          break;
        case 'day':
          current = new Date(current.getTime() + DAY_MS);
          break;
        default:
          current = new Date(current.getTime() + HOUR_MS); // 默认1小时
      }
    }

    return data;
  }
}

// 测试工具类
export class TestUtils {
  // 等待指定时间
  static async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 创建模拟的Express请求对象
  static createMockRequest(overrides = {}) {
    const defaultRequest = {
      method: 'GET',
      url: '/test',
      originalUrl: '/test',
      path: '/test',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'test-agent'
      },
      query: {},
      params: {},
      body: {},
      user: {
        id: faker.datatype.number({ min: TEST_CONSTANTS.MIN_ID, max: TEST_CONSTANTS.MAX_RULE_ID }),
        username: faker.internet.userName(),
        role: 'user'
      },
      ip: faker.internet.ip(),
      get(header) {
        return this.headers[header.toLowerCase()];
      }
    };

    return { ...defaultRequest, ...overrides };
  }

  // 创建模拟的Express响应对象
  static createMockResponse() {
    const response = {
      statusCode: 200,
      headers: {},
      data: null,

      status(code) {
        this.statusCode = code;
        return this;
      },

      json(data) {
        this.data = data;
        return this;
      },

      send(data) {
        this.data = data;
        return this;
      },

      set(header, value) {
        this.headers[header] = value;
        return this;
      },

      get(header) {
        return this.headers[header];
      }
    };

    // 添加API响应方法
    response.apiSuccess = function (data, message, meta) {
      return this.status(TEST_CONSTANTS.HTTP_OK).json({
        success: true,
        data,
        message,
        meta,
        timestamp: new Date().toISOString()
      });
    };

    response.apiError = function (code, message, errors) {
      return this.status(TEST_CONSTANTS.HTTP_BAD_REQUEST).json({
        success: false,
        code,
        message,
        errors,
        timestamp: new Date().toISOString()
      });
    };

    return response;
  }

  // 创建模拟的数据库连接
  static createMockDatabase() {
    const mockDb = {
      data: new Map(),

      // 模拟查询
      select(table) {
        return {
          where: (conditions) => {
            const tableData = this.data.get(table) || [];
            return tableData.filter((row) =>
              Object.entries(conditions).every(([key, value]) => row[key] === value)
            );
          },
          first: () => {
            const tableData = this.data.get(table) || [];
            return tableData[0] || null;
          },
          orderBy: (column, direction = 'asc') => {
            const tableData = this.data.get(table) || [];
            return tableData.sort((a, b) => {
              if (direction === 'desc') {
                return b[column] > a[column] ? 1 : -1;
              }
              return a[column] > b[column] ? 1 : -1;
            });
          },
          limit: (count) => {
            const tableData = this.data.get(table) || [];
            return tableData.slice(0, count);
          }
        };
      },

      // 模拟插入
      insert(table, data) {
        const tableData = this.data.get(table) || [];
        const newRecord = { id: tableData.length + TEST_CONSTANTS.MIN_ID, ...data };
        tableData.push(newRecord);
        this.data.set(table, tableData);
        return [newRecord.id];
      },

      // 模拟更新
      update(table, conditions, updates) {
        const tableData = this.data.get(table) || [];
        const updatedRows = tableData.map((row) => {
          const matches = Object.entries(conditions).every(([key, value]) => row[key] === value);
          return matches ? { ...row, ...updates } : row;
        });
        this.data.set(table, updatedRows);
        return updatedRows.filter((row) =>
          Object.entries(conditions).every(([key, value]) => row[key] === value)
        ).length;
      },

      // 模拟删除
      delete(table, conditions) {
        const tableData = this.data.get(table) || [];
        const filteredData = tableData.filter(
          (row) => !Object.entries(conditions).every(([key, value]) => row[key] === value)
        );
        this.data.set(table, filteredData);
        return tableData.length - filteredData.length;
      },

      // 设置测试数据
      setTestData(table, data) {
        this.data.set(table, data);
      },

      // 清空数据
      clear() {
        this.data.clear();
      }
    };

    return mockDb;
  }

  // 验证API响应格式
  static validateApiResponse(response, expectedStructure = {}) {
    const errors = [];

    // 检查基本结构
    if (typeof response.success !== 'boolean') {
      errors.push('success字段必须是布尔值');
    }

    if (!response.timestamp) {
      errors.push('timestamp字段是必需的');
    }

    if (!response.code) {
      errors.push('code字段是必需的');
    }

    // 检查自定义结构
    Object.entries(expectedStructure).forEach(([key, expectedType]) => {
      if (response[key] === undefined) {
        errors.push(`${key}字段是必需的`);
      } else if (typeof response[key] !== expectedType) {
        errors.push(`${key}字段类型应为${expectedType}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // 比较对象
  static deepEqual(obj1, obj2, ignoreFields = []) {
    const clean1 = this.removeFields(obj1, ignoreFields);
    const clean2 = this.removeFields(obj2, ignoreFields);

    return JSON.stringify(clean1) === JSON.stringify(clean2);
  }

  // 移除指定字段
  static removeFields(obj, fields) {
    const cleaned = { ...obj };
    fields.forEach((field) => {
      delete cleaned[field];
    });
    return cleaned;
  }

  // 生成随机字符串
  static randomString(length = TEST_CONSTANTS.DEFAULT_STRING_LENGTH) {
    return faker.random.alphaNumeric(length);
  }

  // 生成随机数字
  static randomNumber(min = TEST_CONSTANTS.MIN_RANDOM, max = TEST_CONSTANTS.MAX_RANDOM) {
    return faker.datatype.number({ min, max });
  }

  // 生成随机邮箱
  static randomEmail() {
    return faker.internet.email();
  }

  // 生成随机日期
  static randomDate(start = new Date(TEST_CONSTANTS.YEAR_2020, TEST_CONSTANTS.MONTH_JANUARY, TEST_CONSTANTS.DAY_FIRST), end = new Date()) {
    return faker.date.between(start, end);
  }
}

// 性能测试工具
export class PerformanceTestUtils {
  // 测试函数执行时间
  static async measureExecutionTime(fn, iterations = TEST_CONSTANTS.DEFAULT_ITERATIONS) {
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      await fn();
      const end = process.hrtime.bigint();

      times.push(Number(end - start) / TEST_CONSTANTS.MEMORY_DIVISOR); // 转换为毫秒
    }

    return {
      times,
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      total: times.reduce((a, b) => a + b, 0)
    };
  }

  // 内存使用测试
  static measureMemoryUsage(fn) {
    const before = process.memoryUsage();
    const result = fn();
    const after = process.memoryUsage();

    return {
      result,
      memoryDelta: {
        rss: after.rss - before.rss,
        heapTotal: after.heapTotal - before.heapTotal,
        heapUsed: after.heapUsed - before.heapUsed,
        external: after.external - before.external
      },
      before,
      after
    };
  }

  // 并发测试
  static async concurrencyTest(fn, concurrency = TEST_CONSTANTS.DEFAULT_CONCURRENCY, iterations = TEST_CONSTANTS.CONCURRENCY_ITERATIONS) {
    const results = [];
    const errors = [];

    const executeTask = async () => {
      try {
        const start = Date.now();
        const result = await fn();
        const duration = Date.now() - start;
        results.push({ result, duration });
      } catch (error) {
        errors.push(error);
      }
    };

    const batches = [];
    for (let i = 0; i < iterations; i += concurrency) {
      const batch = [];
      for (let j = 0; j < concurrency && i + j < iterations; j++) {
        batch.push(executeTask());
      }
      batches.push(Promise.all(batch));
    }

    await Promise.all(batches);

    return {
      totalRequests: iterations,
      successfulRequests: results.length,
      failedRequests: errors.length,
      averageResponseTime: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
      errors
    };
  }
}

// 数据库测试工具
export class DatabaseTestUtils {
  // 创建测试数据库
  static async setupTestDatabase(db) {
    // 清空所有表
    const tables = [
      'alerts',
      'alert_rules',
      'storage_devices',
      'carbon_data',
      'energy_data',
      'devices',
      'users'
    ];

    for (const table of tables) {
      try {
        await db.raw(`DELETE FROM ${table}`);
      } catch (error) {
        // 表可能不存在，忽略错误
      }
    }
  }

  // 插入测试数据
  static async seedTestData(db) {
    // 插入测试用户
    const users = TestDataGenerator.generateUsers(TEST_CONSTANTS.SEED_USER_COUNT);
    await db('users').insert(users);

    // 插入测试设备
    const devices = TestDataGenerator.generateDevices(TEST_CONSTANTS.SEED_DEVICE_COUNT);
    await db('devices').insert(devices);

    // 插入测试能耗数据
    const energyData = TestDataGenerator.generateEnergyDataList(TEST_CONSTANTS.SEED_ENERGY_COUNT, {
      device_id: devices[0].device_id
    });
    await db('energy_data').insert(energyData);

    return { users, devices, energyData };
  }

  // 清理测试数据
  static async cleanupTestData(db) {
    await this.setupTestDatabase(db);
  }
}

// 导出所有工具
// 所有类已在上面单独导出，无需重复导出
