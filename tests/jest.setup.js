// Jest测试环境设置
// 设置测试环境
process.env.NODE_ENV = 'test';

// 设置测试超时时间
jest.setTimeout(30000);

// 禁用LogAggregator的文件操作
process.env.DISABLE_LOG_FILES = 'true';

// 禁用控制台输出以减少测试噪音（可选）
// console.log = jest.fn();
// console.warn = jest.fn();
// console.error = jest.fn();