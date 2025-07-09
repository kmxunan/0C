module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // 错误级别 - 必须修复
    'no-undef': 'error',
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'no-redeclare': 'error',
    'no-unreachable': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',

    // 警告级别 - 建议修复
    'no-console': 'warn',
    'no-debugger': 'warn',
    'no-alert': 'warn',

    // 关闭严格规则，允许渐进式改进
    'no-process-exit': 'off',
    'arrow-parens': 'off',
    complexity: 'off',
    'max-statements': 'off',
    'max-params': 'off',
    'max-nested-callbacks': 'off',
    'max-depth': 'off',
    'max-lines': 'off',
    'max-lines-per-function': 'off',
  },
  overrides: [
    {
      files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
      rules: {
        'no-console': 'off',
        'no-unused-expressions': 'off',
      },
    },
    {
      files: ['scripts/**/*.js'],
      rules: {
        'no-console': 'off',
        'no-process-exit': 'off',
      },
    },
  ],
};
