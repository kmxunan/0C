# 零碳园区数字孪生能碳管理系统 - 测试框架

## 概述

本测试框架为零碳园区数字孪生能碳管理系统提供全面的自动化测试解决方案，包括API集成测试、前后端集成测试、PWA功能测试等多个测试套件。

## 测试架构

```
tests/
├── api-integration-test.js          # API集成测试
├── frontend-backend-integration.js  # 前后端集成测试
├── pwa-functionality-test.js        # PWA功能测试
├── run-all-tests.js                # 综合测试运行器
├── test-config.js                  # 测试配置文件
├── README.md                       # 测试文档
└── test-results/                   # 测试结果目录
    ├── screenshots/                # 测试截图
    ├── reports/                   # 测试报告
    └── logs/                      # 测试日志
```

## 测试套件说明

### 1. API集成测试 (api-integration-test.js)

**功能**: 验证所有后端API接口的功能完整性

**测试范围**:
- 系统健康检查
- 数据采集模块API
- 能源分析模块API
- 碳排放管理API
- 智能运维API
- 数字孪生API

**运行方式**:
```bash
# 单独运行
npm run test:api

# 或直接运行
node tests/api-integration-test.js
```

### 2. 前后端集成测试 (frontend-backend-integration.js)

**功能**: 验证前端界面与后端服务的数据交互

**测试范围**:
- 首页加载和数据展示
- 数字孪生仪表板功能
- 设备管理页面操作
- 能源监控数据展示
- 数据分析功能
- 碳排放管理界面
- 告警管理功能
- 移动端响应式测试

**运行方式**:
```bash
# 单独运行
npm run test:integration

# 或直接运行
node tests/frontend-backend-integration.js
```

### 3. PWA功能测试 (pwa-functionality-test.js)

**功能**: 验证Progressive Web App功能特性

**测试范围**:
- Web App Manifest验证
- Service Worker注册和缓存
- 离线功能测试
- 应用安装提示
- 推送通知权限
- 响应式设计验证
- 性能指标检查

**运行方式**:
```bash
# 单独运行
npm run test:pwa

# 或直接运行
node tests/pwa-functionality-test.js
```

### 4. 综合测试运行器 (run-all-tests.js)

**功能**: 按顺序执行所有测试套件，生成综合报告

**特性**:
- 自动检查服务依赖
- 智能跳过不可用的测试
- 详细的测试报告
- 支持单独运行指定测试

**运行方式**:
```bash
# 运行所有测试
npm run test:all

# 显示帮助
node tests/run-all-tests.js --help

# 列出所有测试套件
node tests/run-all-tests.js --list

# 运行指定测试套件
node tests/run-all-tests.js --suite api
```

## 前置条件

### 1. 服务启动

**后端服务**:
```bash
# 在项目根目录
npm start
# 或开发模式
npm run dev
```

**前端服务**:
```bash
# 在frontend目录
cd frontend
npm start
```

### 2. 依赖安装

**Puppeteer** (用于前端测试):
```bash
npm install puppeteer
```

**其他依赖**:
```bash
# 后端依赖
npm install

# 前端依赖
cd frontend && npm install
```

## 测试配置

测试配置文件 `test-config.js` 包含所有测试的配置参数:

- **服务URL**: 后端和前端服务地址
- **超时设置**: 各类测试的超时时间
- **Puppeteer配置**: 浏览器启动参数
- **移动端设备**: 响应式测试的设备配置
- **性能阈值**: 性能测试的判断标准
- **PWA配置**: PWA功能测试的预期值

## 测试报告

### 控制台输出

测试运行时会在控制台显示:
- 🟢 通过的测试 (绿色)
- 🔴 失败的测试 (红色)
- 🟡 跳过的测试 (黄色)
- 📊 测试统计信息
- 💡 下一步建议

### 测试结果文件

测试结果保存在 `test-results/` 目录:
- **screenshots/**: 测试截图 (失败时自动截图)
- **reports/**: JSON格式的详细报告
- **logs/**: 测试执行日志

## 性能指标

测试框架会检查以下性能指标:

| 指标 | 阈值 | 说明 |
|------|------|------|
| 页面加载时间 | < 3秒 | 完整页面加载时间 |
| 首次内容绘制 | < 1.5秒 | FCP时间 |
| 最大内容绘制 | < 2.5秒 | LCP时间 |
| 累积布局偏移 | < 0.1 | CLS分数 |
| 首次输入延迟 | < 100ms | FID时间 |

## 移动端测试

支持以下设备的响应式测试:
- iPhone 12 (390x844)
- iPad (768x1024)
- Android Phone (360x640)

## 故障排除

### 常见问题

1. **服务连接失败**
   ```
   ✗ 后端服务无法访问: connect ECONNREFUSED
   ```
   **解决**: 确保后端服务在端口7240运行

2. **Puppeteer启动失败**
   ```
   Error: Failed to launch the browser process
   ```
   **解决**: 安装Puppeteer或检查系统依赖
   ```bash
   npm install puppeteer
   ```

3. **前端页面加载超时**
   ```
   ❌ 页面加载超时
   ```
   **解决**: 确保前端服务在端口1125运行，检查网络连接

4. **API测试失败**
   ```
   ❌ API响应异常: 500
   ```
   **解决**: 检查后端服务状态，查看服务日志

### 调试模式

启用详细日志:
```bash
# 设置环境变量
export NODE_ENV=development

# 运行测试
npm run test:all
```

显示浏览器界面 (非无头模式):
```javascript
// 修改 test-config.js
puppeteer: {
  headless: false,  // 改为false
  // ...
}
```

## 持续集成

### GitHub Actions 示例

```yaml
name: 测试

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: 设置Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: 安装依赖
      run: |
        npm install
        cd frontend && npm install
    
    - name: 启动服务
      run: |
        npm start &
        cd frontend && npm start &
        sleep 30
    
    - name: 运行测试
      run: npm run test:all
```

## 扩展测试

### 添加新的API测试

在 `api-integration-test.js` 中添加:

```javascript
const newApiTests = [
  {
    name: '新API测试',
    url: '/api/new-endpoint',
    method: 'GET',
    expectedStatus: 200,
    validate: (data) => {
      return data && data.success === true;
    }
  }
];
```

### 添加新的页面测试

在 `frontend-backend-integration.js` 中添加:

```javascript
const pageTests = [
  {
    name: '新页面测试',
    url: '/new-page',
    test: async (page) => {
      // 页面测试逻辑
      await page.waitForSelector('.new-component');
      const element = await page.$('.new-component');
      return element !== null;
    }
  }
];
```

## 最佳实践

1. **测试隔离**: 每个测试应该独立，不依赖其他测试的结果
2. **数据清理**: 测试后清理生成的测试数据
3. **错误处理**: 提供清晰的错误信息和调试提示
4. **性能考虑**: 避免过度的等待时间，使用合理的超时设置
5. **可维护性**: 使用配置文件管理测试参数，便于维护

## 贡献指南

1. 添加新测试时，请更新相应的文档
2. 确保测试具有良好的错误处理
3. 遵循现有的代码风格和命名约定
4. 添加适当的注释说明测试目的

## 联系方式

如有问题或建议，请联系开发团队或提交Issue。