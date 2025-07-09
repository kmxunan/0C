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
    // 代码质量规则
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',

    // 代码风格规则 - 移除弃用规则，使用Prettier处理格式化

    // 最佳实践
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],
    'dot-notation': 'error',
    'no-else-return': 'error',
    'no-empty-function': 'error',
    'no-magic-numbers': [
      'warn',
      {
        ignore: [-1, 0, 1, 2],
        ignoreArrayIndexes: true,
        enforceConst: true,
      },
    ],
    // 'no-multi-spaces': 'error', // 弃用规则，由Prettier处理
    'no-return-assign': 'error',
    // 'no-return-await': 'error', // 弃用规则
    'no-self-compare': 'error',
    'no-throw-literal': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unused-expressions': 'error',
    'no-useless-call': 'error',
    'no-useless-concat': 'error',
    'no-useless-return': 'error',
    'prefer-const': 'error',
    'prefer-template': 'error',

    // ES6+ 规则
    // 'arrow-spacing': ['error', { before: true, after: true }], // 弃用规则，由Prettier处理
    'no-duplicate-imports': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-destructuring': [
      'error',
      {
        array: true,
        object: true,
      },
      {
        enforceForRenamedProperties: false,
      },
    ],
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    // 'template-curly-spacing': ['error', 'never'], // 弃用规则，由Prettier处理

    // 安全相关
    'no-unsafe-finally': 'error',
    'no-unsafe-negation': 'error',

    // 性能相关
    'no-loop-func': 'error',
    'no-object-constructor': 'error', // 替换弃用的no-new-object
    'no-new-wrappers': 'error',

    // 可访问性
    'no-implicit-globals': 'error',

    // Node.js 特定规则
    // 'no-process-exit': 'error', // 弃用规则
    // 'no-sync': 'warn', // 弃用规则
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      rules: {
        'no-magic-numbers': 'off',
        'no-unused-expressions': 'off',
      },
    },
    {
      files: ['**/config/**/*.js'],
      rules: {
        'no-magic-numbers': 'off',
      },
    },
  ],
  globals: {
    process: 'readonly',
    Buffer: 'readonly',
    __dirname: 'readonly',
    __filename: 'readonly',
    global: 'readonly',
  },
};
