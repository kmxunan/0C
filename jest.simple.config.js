export default {
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['**/tests/unit/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js', '!src/database/**', '!src/config/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^(\\..*/.*)\\.js$': '$1',
  },
  transform: {},
};
