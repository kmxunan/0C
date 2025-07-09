module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/jest.setup.js'],
  moduleNameMapper: {
    '^@models/(.*)$': '<rootDir>/models/$1',
    '^(\.{1,2}/.*)\.js$': '$1',
  },
  transform: {
    '^.+\.js$': ['babel-jest', { 
      presets: [['@babel/preset-env', { 
        targets: { node: 'current' },
        modules: 'auto'
      }]] 
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\.mjs$))',
  ],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/database/**',
    '!src/config/**',
    '!src/index.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};