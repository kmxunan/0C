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
  plugins: [],
  rules: {
    // TypeScript 特定规则 (暂时禁用直到安装依赖)
    // '@typescript-eslint/no-explicit-any': 'warn',
    // '@typescript-eslint/explicit-function-return-type': 'warn',
    // '@typescript-eslint/no-unused-vars': [
    //   'error',
    //   {
    //     argsIgnorePattern: '^_',
    //     varsIgnorePattern: '^_',
    //   },
    // ],
    // '@typescript-eslint/prefer-nullish-coalescing': 'error',
    // '@typescript-eslint/prefer-optional-chain': 'error',
    // '@typescript-eslint/no-non-null-assertion': 'warn',
    // '@typescript-eslint/strict-boolean-expressions': 'warn',
    // '@typescript-eslint/prefer-readonly': 'warn',
    // '@typescript-eslint/prefer-readonly-parameter-types': 'off',
    // '@typescript-eslint/explicit-member-accessibility': [
    //   'error',
    //   {
    //     accessibility: 'explicit',
    //     overrides: {
    //       accessors: 'explicit',
    //       constructors: 'no-public',
    //       methods: 'explicit',
    //       properties: 'off',
    //       parameterProperties: 'explicit',
    //     },
    //   },
    // ],

    // 安全相关规则 (暂时禁用直到安装依赖)
    // 'security/detect-sql-injection': 'error',
    // 'security/detect-non-literal-fs-filename': 'warn',
    // 'security/detect-unsafe-regex': 'error',
    // 'security/detect-buffer-noassert': 'error',
    // 'security/detect-child-process': 'warn',
    // 'security/detect-disable-mustache-escape': 'error',
    // 'security/detect-eval-with-expression': 'error',
    // 'security/detect-no-csrf-before-method-override': 'error',
    // 'security/detect-non-literal-regexp': 'warn',
    // 'security/detect-non-literal-require': 'warn',
    // 'security/detect-object-injection': 'warn',
    // 'security/detect-possible-timing-attacks': 'warn',
    // 'security/detect-pseudoRandomBytes': 'error',

    // 导入相关规则 (暂时禁用直到安装依赖)
    // 'import/order': [
    //   'error',
    //   {
    //     groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
    //     'newlines-between': 'always',
    //     alphabetize: {
    //       order: 'asc',
    //       caseInsensitive: true,
    //     },
    //   },
    // ],
    // 'import/no-unresolved': 'error',
    // 'import/no-cycle': 'error',
    // 'import/no-unused-modules': 'warn',
    // 'import/no-deprecated': 'warn',

    // Promise 相关规则 (暂时禁用直到安装依赖)
    // 'promise/always-return': 'error',
    // 'promise/no-return-wrap': 'error',
    // 'promise/param-names': 'error',
    // 'promise/catch-or-return': 'error',
    // 'promise/no-native': 'off',
    // 'promise/no-nesting': 'warn',
    // 'promise/no-promise-in-callback': 'warn',
    // 'promise/no-callback-in-promise': 'warn',
    // 'promise/avoid-new': 'off',
    // 'promise/no-new-statics': 'error',
    // 'promise/no-return-in-finally': 'warn',
    // 'promise/valid-params': 'warn',

    // Node.js 相关规则 (暂时禁用直到安装依赖)
    // 'node/no-deprecated-api': 'error',
    // 'node/no-extraneous-import': 'error',
    // 'node/no-extraneous-require': 'error',
    // 'node/no-missing-import': 'off', // TypeScript 处理
    // 'node/no-missing-require': 'off', // TypeScript 处理
    // 'node/no-unpublished-import': 'off',
    // 'node/no-unpublished-require': 'off',
    // 'node/no-unsupported-features/es-syntax': 'off',
    // 'node/prefer-global/buffer': 'error',
    // 'node/prefer-global/console': 'error',
    // 'node/prefer-global/process': 'error',
    // 'node/prefer-global/url-search-params': 'error',
    // 'node/prefer-global/url': 'error',
    // 'node/prefer-promises/dns': 'error',
    // 'node/prefer-promises/fs': 'error',

    // 代码质量规则
    'no-unused-vars': 'off', // 使用 TypeScript 版本
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-return-await': 'error',
    'prefer-const': 'error',
    'prefer-template': 'error',
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

    // 复杂度控制
    complexity: ['warn', 10],
    'max-depth': ['warn', 4],
    'max-lines': ['warn', 500],
    'max-lines-per-function': ['warn', 100],
    'max-nested-callbacks': ['warn', 3],
    'max-params': ['warn', 5],

    // 代码风格规则（由 Prettier 处理，这里只保留逻辑相关的）
    'consistent-return': 'error',
    'default-case': 'error',
    'default-case-last': 'error',
    'dot-notation': 'error',
    eqeqeq: ['error', 'always'],
    'guard-for-in': 'error',
    'no-else-return': 'error',
    'no-empty-function': 'error',
    'no-magic-numbers': [
      'warn',
      {
        ignore: [-1, 0, 1, 2],
        ignoreArrayIndexes: true,
        enforceConst: true,
        detectObjects: false,
      },
    ],
    'no-multi-assign': 'error',
    'no-nested-ternary': 'error',
    'no-param-reassign': 'error',
    'no-return-assign': 'error',
    'no-self-compare': 'error',
    'no-throw-literal': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unused-expressions': 'error',
    'no-useless-call': 'error',
    'no-useless-concat': 'error',
    'no-useless-return': 'error',
    'require-await': 'error',
    yoda: 'error',
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.test.ts', '**/*.spec.js', '**/*.spec.ts'],
      rules: {
        'no-magic-numbers': 'off',
        'no-unused-expressions': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'max-lines-per-function': 'off',
      },
    },
    {
      files: ['**/config/**/*.js', '**/config/**/*.ts'],
      rules: {
        'no-magic-numbers': 'off',
      },
    },
    {
      files: ['**/*.js'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-member-accessibility': 'off',
      },
    },
  ],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  globals: {
    process: 'readonly',
    Buffer: 'readonly',
    __dirname: 'readonly',
    __filename: 'readonly',
    global: 'readonly',
  },
};
