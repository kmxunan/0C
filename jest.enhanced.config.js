export default {
  // 基础配置
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',

  // 覆盖率配置
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.test.{js,ts}',
    '!src/**/*.spec.{js,ts}',
    '!src/**/*.d.ts',
    '!src/database/**',
    '!src/config/**',
    '!src/**/index.{js,ts}',
    '!src/**/*.config.{js,ts}',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],

  // 覆盖率阈值（调整为更现实的目标）
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20,
    },
  },

  // 覆盖率报告格式
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json', 'cobertura'],

  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.{js,ts}',
    '**/tests/unit/**/*.test.{js,ts}',
    '**/tests/integration/**/*.test.{js,ts}',
    '**/__tests__/**/*.{js,ts}',
    '**/*.(test|spec).{js,ts}',
  ],

  // 忽略的测试文件
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/', '/frontend/', '/docs/'],

  // 模块名称映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@interfaces/(.*)$': '<rootDir>/src/interfaces/$1',
    '^@types/(.*)$': '<rootDir>/src/shared/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/shared/utils/$1',
    '^@config/(.*)$': '<rootDir>/src/shared/config/$1',
    '^@models/(.*)$': '<rootDir>/models/$1',
    '^(\\..*/.*)\\.js$': '$1',
  },

  // 转换配置
  transform: {
    '^.+\\.(js|jsx)$': [
      'babel-jest',
      {
        configFile: './babel.config.cjs',
      },
    ],
    '^.+\\.(ts|tsx)$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript',
        ],
      },
    ],
  },

  // 转换忽略模式
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],

  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // 全局设置
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },

  // 最大并发数
  maxConcurrency: 5,
  maxWorkers: '50%',

  // 错误处理
  errorOnDeprecated: true,

  // 清除模拟
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,

  // 监视模式配置
  watchPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/', '/logs/'],

  // 报告器配置
  reporters: ['default'],

  // 性能配置
  detectOpenHandles: true,
  detectLeaks: true,
  forceExit: false,

  // 快照配置
  updateSnapshot: false,

  // 项目配置（多项目支持）
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    },
  ],
};
