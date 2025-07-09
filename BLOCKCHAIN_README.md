# 零碳园区数字孪生系统 - 区块链模块

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- Git

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd 0C

# 安装依赖
npm install
```

### 环境配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量（添加你的私钥和API密钥）
vim .env
```

### 编译和测试

```bash
# 编译智能合约
npm run blockchain:compile

# 运行测试
npm run test:blockchain

# 查看测试覆盖率
npm run test:blockchain:coverage
```

### 本地部署

```bash
# 启动本地Hardhat网络
npm run blockchain:node

# 在新终端中部署合约
npm run blockchain:deploy:local
```

## 📋 功能概述

### 🔋 能源交易合约 (EnergyTradingContract)
- P2P能源交易订单管理
- 自动化交易执行和结算
- 绿色能源证书集成
- 实时价格发现机制

### 🌱 碳信用合约 (CarbonCreditContract)
- 碳信用代币化发行与管理
- 碳减排项目认证与追踪
- 碳信用交易与转移
- 碳中和证明与验证

### 📦 供应链合约 (SupplyChainContract)
- 产品全生命周期追踪
- 供应链透明度保障
- 质量认证与验证
- 碳足迹记录与计算

## 🛠️ 开发命令

```bash
# 区块链开发
npm run blockchain:compile      # 编译智能合约
npm run blockchain:deploy:local # 本地部署
npm run blockchain:deploy:sepolia # 测试网部署
npm run blockchain:node         # 启动本地节点
npm run blockchain:verify       # 验证合约
npm run blockchain:clean        # 清理编译文件

# 测试
npm run test:blockchain         # 运行区块链测试
npm run test:blockchain:coverage # 测试覆盖率
npm run test:blockchain:gas     # Gas使用报告

# 代码质量
npm run lint:solidity          # Solidity代码检查
npm run blockchain:size         # 合约大小检查
```

## 📁 项目结构

```
src/
├── contracts/                 # 智能合约
│   ├── EnergyTradingContract.sol
│   ├── CarbonCreditContract.sol
│   └── SupplyChainContract.sol
├── services/                  # 区块链服务
│   └── BlockchainIntegrationService.js
├── controllers/               # 控制器
│   └── BlockchainIntegrationController.js
├── routes/                    # 路由
│   └── blockchainIntegrationRoutes.js
├── models/                    # 数据模型
│   └── BlockchainIntegration.js
├── config/                    # 配置文件
│   └── blockchainConfig.js
├── scripts/                   # 部署脚本
│   └── deployBlockchain.js
└── tests/                     # 测试文件
    └── blockchain.test.js
```

## 🌐 支持的网络

- **本地开发**: Hardhat Network
- **以太坊**: 主网 + Sepolia测试网
- **Polygon**: 主网 + Mumbai测试网
- **BSC**: 主网 + 测试网
- **Arbitrum**: 主网 + Goerli测试网

## 📚 文档

- [区块链部署指南](docs/BLOCKCHAIN_DEPLOYMENT_GUIDE.md)
- [VPP区块链实施总结](docs/VPP_BLOCKCHAIN_IMPLEMENTATION_SUMMARY.md)
- [项目状态概览](docs/PROJECT_STATUS_OVERVIEW.md)

## 🔒 安全注意事项

- 永远不要在代码中硬编码私钥
- 使用环境变量管理敏感信息
- 在主网部署前进行充分测试
- 定期更新依赖包
- 遵循智能合约安全最佳实践

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 支持

- 技术支持: blockchain-support@zero-carbon-park.com
- 文档反馈: docs@zero-carbon-park.com
- 安全报告: security@zero-carbon-park.com

---

**开发团队**: VPP区块链开发团队  
**版本**: 1.0.0  
**最后更新**: 2024年12月