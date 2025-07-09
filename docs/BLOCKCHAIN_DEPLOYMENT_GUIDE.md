# 零碳园区数字孪生系统 - 区块链部署指南

## 概述

本文档提供零碳园区数字孪生系统区块链模块的完整部署指南，包括智能合约部署、配置和测试流程。

## 系统架构

### 智能合约架构

```
区块链层
├── EnergyTradingContract.sol     # 能源交易合约
├── CarbonCreditContract.sol      # 碳信用合约
└── SupplyChainContract.sol       # 供应链溯源合约

服务层
├── BlockchainIntegrationService  # 区块链集成服务
├── BlockchainIntegrationController # 区块链控制器
└── blockchainIntegrationRoutes   # 区块链路由

配置层
├── blockchainConfig.js          # 区块链配置
├── hardhat.config.js           # Hardhat配置
└── .env                        # 环境变量
```

## 环境准备

### 1. 系统要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- Git
- 足够的磁盘空间（至少2GB）

### 2. 依赖安装

```bash
# 安装项目依赖
npm install

# 验证Hardhat安装
npx hardhat --version
```

### 3. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

#### 关键环境变量配置

```env
# 区块链网络配置
PRIVATE_KEY=0x...
INFURA_PROJECT_ID=your-infura-project-id
ALCHEMY_API_KEY=your-alchemy-api-key

# 合约验证
ETHERSCAN_API_KEY=your-etherscan-api-key
POLYGONSCAN_API_KEY=your-polygonscan-api-key

# Gas报告
REPORT_GAS=true
COINMARKETCAP_API_KEY=your-coinmarketcap-api-key
```

## 智能合约部署

### 1. 编译合约

```bash
# 编译所有智能合约
npm run blockchain:compile

# 或使用Hardhat直接编译
npx hardhat compile
```

### 2. 本地部署

```bash
# 启动本地Hardhat网络
npm run blockchain:node

# 在新终端中部署合约
npm run blockchain:deploy:local
```

### 3. 测试网部署

#### Sepolia测试网

```bash
# 部署到Sepolia测试网
npm run blockchain:deploy:sepolia

# 验证合约
npm run blockchain:verify
```

#### Polygon Mumbai测试网

```bash
# 部署到Mumbai测试网
npx hardhat run src/scripts/deployBlockchain.js --network mumbai
```

### 4. 主网部署

```bash
# 部署到Polygon主网
npm run blockchain:deploy:polygon

# 部署到以太坊主网
npx hardhat run src/scripts/deployBlockchain.js --network mainnet
```

## 合约功能测试

### 1. 单元测试

```bash
# 运行所有区块链测试
npm run test:blockchain

# 运行特定测试
npx hardhat test --grep "EnergyTradingContract"
```

### 2. 集成测试

```bash
# 运行集成测试
npm run test:integration

# 测试覆盖率
npm run test:blockchain:coverage
```

### 3. Gas使用分析

```bash
# 生成Gas报告
npm run test:blockchain:gas

# 合约大小检查
npm run blockchain:size
```

## 合约验证

### 1. 自动验证

```bash
# 使用Hardhat验证
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### 2. 手动验证

1. 访问对应的区块链浏览器
2. 找到合约地址
3. 上传合约源码
4. 设置编译器版本和优化参数

## 配置管理

### 1. 网络配置

```javascript
// hardhat.config.js
networks: {
  localhost: {
    url: 'http://127.0.0.1:8545',
    chainId: 31337
  },
  sepolia: {
    url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    accounts: [PRIVATE_KEY]
  },
  polygon: {
    url: 'https://polygon-rpc.com',
    accounts: [PRIVATE_KEY]
  }
}
```

### 2. 合约配置

```javascript
// src/config/blockchainConfig.js
const contractConfig = {
  energyTrading: {
    name: 'EnergyTradingContract',
    gasLimit: 8000000,
    constructorArgs: []
  },
  carbonCredit: {
    name: 'CarbonCreditContract',
    gasLimit: 6000000,
    constructorArgs: []
  }
};
```

## 监控和运维

### 1. 合约状态监控

```bash
# 检查合约状态
npx hardhat run scripts/checkContractStatus.js --network sepolia
```

### 2. 事件监听

```javascript
// 监听合约事件
const contract = new ethers.Contract(address, abi, provider);
contract.on('EnergyOrderCreated', (orderId, seller, buyer, amount) => {
  console.log('新能源订单创建:', { orderId, seller, buyer, amount });
});
```

### 3. 性能优化

- 使用批量操作减少Gas消耗
- 实现合约升级机制
- 优化存储结构
- 使用事件替代存储

## 安全考虑

### 1. 私钥管理

- 使用硬件钱包存储主网私钥
- 测试网使用专用私钥
- 定期轮换API密钥

### 2. 合约安全

- 实施访问控制
- 使用重入保护
- 设置紧急暂停机制
- 定期安全审计

### 3. 网络安全

- 使用HTTPS连接
- 实施速率限制
- 监控异常交易

## 故障排除

### 1. 常见问题

#### 编译错误

```bash
# 清理缓存
npx hardhat clean

# 重新编译
npx hardhat compile
```

#### 部署失败

- 检查网络连接
- 验证私钥和余额
- 确认Gas设置

#### 测试失败

- 检查测试环境
- 验证合约地址
- 确认网络配置

### 2. 调试工具

```bash
# 启用调试模式
DEBUG=hardhat:* npx hardhat test

# 查看交易详情
npx hardhat run scripts/debugTransaction.js
```

## 升级和维护

### 1. 合约升级

```bash
# 部署新版本合约
npx hardhat run scripts/upgradeContract.js --network sepolia
```

### 2. 数据迁移

```bash
# 迁移合约数据
npx hardhat run scripts/migrateData.js --network sepolia
```

### 3. 版本管理

- 使用语义化版本控制
- 维护变更日志
- 备份重要数据

## 最佳实践

### 1. 开发流程

1. 本地开发和测试
2. 测试网部署验证
3. 安全审计
4. 主网部署
5. 监控和维护

### 2. 代码质量

- 编写全面的测试
- 使用代码检查工具
- 遵循编码规范
- 定期代码审查

### 3. 文档维护

- 更新API文档
- 记录配置变更
- 维护部署日志
- 编写用户指南

## 支持和联系

- 技术支持：tech-support@zero-carbon-park.com
- 文档更新：docs@zero-carbon-park.com
- 安全报告：security@zero-carbon-park.com

---

**注意：** 本文档会随着系统更新而持续更新，请定期查看最新版本。

**版本：** 1.0.0  
**更新日期：** 2024年12月  
**维护团队：** VPP区块链开发团队