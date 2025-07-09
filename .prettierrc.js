module.exports = {
  // 基本格式化选项
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',

  // JSX 选项
  jsxSingleQuote: true,

  // 尾随逗号
  trailingComma: 'es5',

  // 括号间距
  bracketSpacing: true,
  bracketSameLine: false,

  // 箭头函数参数
  arrowParens: 'avoid',

  // 换行符
  endOfLine: 'lf',

  // 嵌入式语言格式化
  embeddedLanguageFormatting: 'auto',

  // HTML 空白敏感性
  htmlWhitespaceSensitivity: 'css',

  // Vue 文件中的脚本和样式标签缩进
  vueIndentScriptAndStyle: false,

  // 插件
  plugins: [],

  // 覆盖特定文件类型的配置
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: '*.yaml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
};
