/**
 * Jest 全局测试设置文件
 * 配置测试环境、模拟对象和全局工具
 */

const dotenv = require('dotenv');
const path = require('path');

// 获取项目根目录
const projectRoot = process.cwd();

// 加载测试环境变量
dotenv.config({ path: path.join(projectRoot, '.env.test') });

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.DB_NAME = 'test_zero_carbon_park';
process.env.REDIS_DB = '15'; // 使用专用的测试数据库

// 全局测试超时
jest.setTimeout(30000);

// 模拟外部依赖
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  }))
}));

jest.mock('twilio', () => {
  const mockTwilio = {
    messages: {
      create: jest.fn().mockResolvedValue({ sid: 'test-message-sid' })
    }
  };
  return jest.fn(() => mockTwilio);
});

jest.mock('mqtt', () => ({
  connect: jest.fn(() => ({
    on: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
    end: jest.fn()
  }))
}));

// 模拟 Redis 客户端
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    flushdb: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
    status: 'ready'
  }));
});

// 模拟文件系统操作（如果需要）
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn()
}));

// 全局测试工具
global.testUtils = {
  // 等待异步操作完成
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // 生成测试数据
  generateTestData: {
    user: (overrides = {}) => ({
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    }),
    
    device: (overrides = {}) => ({
      id: 'test-device-id',
      name: 'Test Device',
      type: 'solar_panel',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    }),
    
    energyData: (overrides = {}) => ({
      id: 'test-energy-id',
      device_id: 'test-device-id',
      timestamp: new Date(),
      power: 100.5,
      energy: 250.0,
      voltage: 220.0,
      current: 0.45,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    }),
    
    carbonData: (overrides = {}) => ({
      id: 'test-carbon-id',
      device_id: 'test-device-id',
      timestamp: new Date(),
      carbon_emission: 50.2,
      emission_factor: 0.5,
      energy_consumption: 100.4,
      calculation_method: 'standard',
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    }),
    
    alert: (overrides = {}) => ({
      id: 'test-alert-id',
      rule_id: 'test-rule-id',
      device_id: 'test-device-id',
      message: 'Test alert message',
      severity: 'medium',
      status: 'active',
      triggered_at: new Date().toISOString(),
      ...overrides
    })
  },
  
  // 模拟 HTTP 请求
  mockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides
  }),
  
  // 模拟 HTTP 响应
  mockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
      locals: {}
    };
    return res;
  },
  
  // 数据库测试工具
  database: {
    // 清理测试数据
    cleanup: async () => {
      // 这里可以添加清理测试数据的逻辑
      console.log('Cleaning up test data...');
    },
    
    // 创建测试数据
    seed: async () => {
      // 这里可以添加创建测试数据的逻辑
      console.log('Seeding test data...');
    }
  },
  
  // API 测试工具
  api: {
    // 模拟 JWT token
    generateToken: (payload = {}) => {
      return 'test-jwt-token';
    },
    
    // 验证 API 响应格式
    validateApiResponse: (response) => {
      expect(response).toHaveProperty('success');
      expect(typeof response.success).toBe('boolean');
      
      if (response.success) {
        expect(response).toHaveProperty('data');
      } else {
        expect(response).toHaveProperty('error');
        expect(response.error).toHaveProperty('code');
        expect(response.error).toHaveProperty('message');
      }
    },
    
    // 验证分页响应
    validatePaginatedResponse: (response) => {
      global.testUtils.api.validateApiResponse(response);
      
      if (response.success && response.pagination) {
        expect(response.pagination).toHaveProperty('page');
        expect(response.pagination).toHaveProperty('limit');
        expect(response.pagination).toHaveProperty('total');
        expect(response.pagination).toHaveProperty('totalPages');
      }
    }
  },
  
  // 性能测试工具
  performance: {
    // 测量执行时间
    measureTime: async (fn) => {
      const start = process.hrtime.bigint();
      const result = await fn();
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // 转换为毫秒
      
      return {
        result,
        duration
      };
    },
    
    // 内存使用测试
    measureMemory: (fn) => {
      const before = process.memoryUsage();
      const result = fn();
      const after = process.memoryUsage();
      
      return {
        result,
        memoryDiff: {
          rss: after.rss - before.rss,
          heapTotal: after.heapTotal - before.heapTotal,
          heapUsed: after.heapUsed - before.heapUsed,
          external: after.external - before.external
        }
      };
    }
  }
};

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// 测试前清理
beforeAll(async () => {
  console.log('🧪 开始测试环境初始化...');
  
  // 清理测试数据库
  await global.testUtils.database.cleanup();
  
  console.log('✅ 测试环境初始化完成');
});

// 每个测试后清理
afterEach(async () => {
  // 清理模拟调用
  jest.clearAllMocks();
});

// 测试完成后清理
afterAll(async () => {
  console.log('🧹 开始测试环境清理...');
  
  // 清理测试数据
  await global.testUtils.database.cleanup();
  
  console.log('✅ 测试环境清理完成');
});

// 导出测试工具（用于 CommonJS 模块）
module.exports = global.testUtils;