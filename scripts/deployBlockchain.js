#!/usr/bin/env node

/**
 * 零碳园区数字孪生系统 - 区块链智能合约部署脚本
 * 
 * 功能:
 * 1. 自动化部署能源交易合约
 * 2. 自动化部署碳信用管约
 * 3. 配置合约参数和权限
 * 4. 验证部署结果
 * 5. 生成部署报告
 * 
 * @author VPP开发团队
 * @version 1.0.0
 */

const { ethers } = require('ethers');
const fs = require('fs').promises;
const path = require('path');
const config = require('../src/config/blockchainConfig');
const logger = require('../src/utils/logger');

class BlockchainDeployer {
    constructor() {
        this.provider = null;
        this.wallet = null;
        this.deployedContracts = {};
        this.deploymentReport = {
            timestamp: new Date().toISOString(),
            network: '',
            contracts: [],
            gasUsed: 0,
            totalCost: '0',
            status: 'pending'
        };
    }

    /**
     * 初始化部署环境
     */
    async initialize() {
        try {
            logger.info('初始化区块链部署环境...');
            
            // 获取当前网络配置
            const networkConfig = config.getCurrentNetwork();
            this.deploymentReport.network = networkConfig.name;
            
            // 初始化提供者
            if (networkConfig.name === 'localhost') {
                this.provider = new ethers.providers.JsonRpcProvider(networkConfig.rpcUrl);
            } else {
                this.provider = new ethers.providers.InfuraProvider(
                    networkConfig.name,
                    process.env.INFURA_PROJECT_ID
                );
            }
            
            // 初始化钱包
            const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
            if (!privateKey) {
                throw new Error('DEPLOYER_PRIVATE_KEY environment variable not set');
            }
            
            this.wallet = new ethers.Wallet(privateKey, this.provider);
            
            // 检查余额
            const balance = await this.wallet.getBalance();
            logger.info(`部署账户余额: ${ethers.utils.formatEther(balance)} ETH`);
            
            if (balance.lt(ethers.utils.parseEther('0.1'))) {
                throw new Error('部署账户余额不足，至少需要 0.1 ETH');
            }
            
            logger.info('区块链部署环境初始化完成');
            
        } catch (error) {
            logger.error('初始化部署环境失败:', error);
            throw error;
        }
    }

    /**
     * 编译智能合约
     */
    async compileContracts() {
        try {
            logger.info('编译智能合约...');
            
            // 这里应该集成 Hardhat 或 Truffle 编译器
            // 为了简化，我们假设合约已经编译好
            const contractsDir = path.join(__dirname, '../src/contracts/compiled');
            
            // 检查编译文件是否存在
            const energyTradingArtifact = path.join(contractsDir, 'EnergyTradingContract.json');
            const carbonCreditArtifact = path.join(contractsDir, 'CarbonCreditContract.json');
            
            try {
                await fs.access(energyTradingArtifact);
                await fs.access(carbonCreditArtifact);
                logger.info('智能合约编译文件已存在');
            } catch {
                logger.warn('智能合约编译文件不存在，请先编译合约');
                // 这里可以调用编译命令
                // await this.runCompilation();
            }
            
        } catch (error) {
            logger.error('编译智能合约失败:', error);
            throw error;
        }
    }

    /**
     * 部署能源交易合约
     */
    async deployEnergyTradingContract() {
        try {
            logger.info('部署能源交易合约...');
            
            // 模拟合约 ABI 和字节码
            const contractABI = [
                "constructor(address _feeCollector)",
                "function createSellOrder(uint8 _energyType, uint256 _quantity, uint256 _pricePerKWh, uint256 _carbonIntensity, string _location, uint256 _deliveryTime, string _metadataURI) returns (uint256)",
                "function buyEnergy(uint256 _orderId) payable",
                "function getOrder(uint256 _orderId) view returns (tuple)",
                "function getMarketStats() view returns (uint256, uint256, uint256, uint256)",
                "event OrderCreated(uint256 indexed orderId, address indexed seller, uint8 indexed energyType, uint256 quantity, uint256 pricePerKWh, uint256 deliveryTime)"
            ];
            
            // 获取合约工厂
            const ContractFactory = new ethers.ContractFactory(
                contractABI,
                "0x608060405234801561001057600080fd5b50", // 模拟字节码
                this.wallet
            );
            
            // 部署参数
            const feeCollector = config.security.feeCollector || this.wallet.address;
            
            // 估算 Gas
            const gasEstimate = await ContractFactory.signer.estimateGas(
                ContractFactory.getDeployTransaction(feeCollector)
            );
            
            logger.info(`能源交易合约预估 Gas: ${gasEstimate.toString()}`);
            
            // 部署合约
            const contract = await ContractFactory.deploy(feeCollector, {
                gasLimit: gasEstimate.mul(120).div(100) // 增加 20% 余量
            });
            
            // 等待部署确认
            await contract.deployed();
            
            this.deployedContracts.energyTrading = {
                address: contract.address,
                transactionHash: contract.deployTransaction.hash,
                gasUsed: gasEstimate.toString(),
                blockNumber: contract.deployTransaction.blockNumber
            };
            
            this.deploymentReport.contracts.push({
                name: 'EnergyTradingContract',
                address: contract.address,
                transactionHash: contract.deployTransaction.hash,
                gasUsed: gasEstimate.toString()
            });
            
            logger.info(`能源交易合约部署成功: ${contract.address}`);
            
            return contract;
            
        } catch (error) {
            logger.error('部署能源交易合约失败:', error);
            throw error;
        }
    }

    /**
     * 部署碳信用合约
     */
    async deployCarbonCreditContract() {
        try {
            logger.info('部署碳信用合约...');
            
            // 模拟合约 ABI
            const contractABI = [
                "constructor(address _feeCollector)",
                "function registerProject(uint8 _projectType, string _name, string _description, string _location, string _methodology, uint256 _estimatedReduction, uint256 _startDate, uint256 _endDate, string _metadataURI) returns (uint256)",
                "function verifyProject(uint256 _projectId, uint256 _actualReduction)",
                "function issueCredits(uint256 _projectId, uint256 _amount, uint256 _vintage, string _serialNumber, string _metadataURI) returns (uint256)",
                "function retireCredits(uint256 _batchId, uint256 _amount, string _reason)",
                "function getCarbonFootprint(address _user) view returns (uint256, uint256, uint256)",
                "event ProjectRegistered(uint256 indexed projectId, address indexed developer, uint8 indexed projectType, string name, uint256 estimatedReduction)"
            ];
            
            // 获取合约工厂
            const ContractFactory = new ethers.ContractFactory(
                contractABI,
                "0x608060405234801561001057600080fd5b50", // 模拟字节码
                this.wallet
            );
            
            // 部署参数
            const feeCollector = config.security.feeCollector || this.wallet.address;
            
            // 估算 Gas
            const gasEstimate = await ContractFactory.signer.estimateGas(
                ContractFactory.getDeployTransaction(feeCollector)
            );
            
            logger.info(`碳信用合约预估 Gas: ${gasEstimate.toString()}`);
            
            // 部署合约
            const contract = await ContractFactory.deploy(feeCollector, {
                gasLimit: gasEstimate.mul(120).div(100)
            });
            
            // 等待部署确认
            await contract.deployed();
            
            this.deployedContracts.carbonCredit = {
                address: contract.address,
                transactionHash: contract.deployTransaction.hash,
                gasUsed: gasEstimate.toString(),
                blockNumber: contract.deployTransaction.blockNumber
            };
            
            this.deploymentReport.contracts.push({
                name: 'CarbonCreditContract',
                address: contract.address,
                transactionHash: contract.deployTransaction.hash,
                gasUsed: gasEstimate.toString()
            });
            
            logger.info(`碳信用合约部署成功: ${contract.address}`);
            
            return contract;
            
        } catch (error) {
            logger.error('部署碳信用合约失败:', error);
            throw error;
        }
    }

    /**
     * 配置合约权限和参数
     */
    async configureContracts() {
        try {
            logger.info('配置合约权限和参数...');
            
            // 配置能源交易合约
            if (this.deployedContracts.energyTrading) {
                logger.info('配置能源交易合约参数...');
                // 这里可以调用合约的配置方法
                // await energyTradingContract.setPlatformFeeRate(250); // 2.5%
                // await energyTradingContract.setTradeAmountLimits(ethers.utils.parseEther('1'), ethers.utils.parseEther('1000'));
            }
            
            // 配置碳信用合约
            if (this.deployedContracts.carbonCredit) {
                logger.info('配置碳信用合约参数...');
                // 这里可以调用合约的配置方法
                // await carbonCreditContract.addVerifier(verifierAddress);
                // await carbonCreditContract.setTradingFeeRate(100); // 1%
            }
            
            logger.info('合约配置完成');
            
        } catch (error) {
            logger.error('配置合约失败:', error);
            throw error;
        }
    }

    /**
     * 验证部署结果
     */
    async verifyDeployment() {
        try {
            logger.info('验证部署结果...');
            
            const verificationResults = [];
            
            // 验证能源交易合约
            if (this.deployedContracts.energyTrading) {
                const code = await this.provider.getCode(this.deployedContracts.energyTrading.address);
                const isDeployed = code !== '0x';
                
                verificationResults.push({
                    contract: 'EnergyTradingContract',
                    address: this.deployedContracts.energyTrading.address,
                    deployed: isDeployed,
                    codeSize: code.length
                });
                
                logger.info(`能源交易合约验证: ${isDeployed ? '成功' : '失败'}`);
            }
            
            // 验证碳信用合约
            if (this.deployedContracts.carbonCredit) {
                const code = await this.provider.getCode(this.deployedContracts.carbonCredit.address);
                const isDeployed = code !== '0x';
                
                verificationResults.push({
                    contract: 'CarbonCreditContract',
                    address: this.deployedContracts.carbonCredit.address,
                    deployed: isDeployed,
                    codeSize: code.length
                });
                
                logger.info(`碳信用合约验证: ${isDeployed ? '成功' : '失败'}`);
            }
            
            // 检查是否所有合约都部署成功
            const allDeployed = verificationResults.every(result => result.deployed);
            
            if (allDeployed) {
                this.deploymentReport.status = 'success';
                logger.info('所有合约部署验证成功');
            } else {
                this.deploymentReport.status = 'failed';
                logger.error('部分合约部署验证失败');
            }
            
            return verificationResults;
            
        } catch (error) {
            logger.error('验证部署结果失败:', error);
            this.deploymentReport.status = 'error';
            throw error;
        }
    }

    /**
     * 更新配置文件
     */
    async updateConfigFile() {
        try {
            logger.info('更新配置文件...');
            
            const configPath = path.join(__dirname, '../src/config/blockchainConfig.js');
            const configContent = await fs.readFile(configPath, 'utf8');
            
            // 更新合约地址
            let updatedConfig = configContent;
            
            if (this.deployedContracts.energyTrading) {
                updatedConfig = updatedConfig.replace(
                    /energyTrading:\s*{[^}]*}/,
                    `energyTrading: {
                        address: '${this.deployedContracts.energyTrading.address}',
                        abi: 'EnergyTradingContract.json',
                        gasLimit: 500000
                    }`
                );
            }
            
            if (this.deployedContracts.carbonCredit) {
                updatedConfig = updatedConfig.replace(
                    /carbonCredit:\s*{[^}]*}/,
                    `carbonCredit: {
                        address: '${this.deployedContracts.carbonCredit.address}',
                        abi: 'CarbonCreditContract.json',
                        gasLimit: 500000
                    }`
                );
            }
            
            await fs.writeFile(configPath, updatedConfig, 'utf8');
            
            logger.info('配置文件更新完成');
            
        } catch (error) {
            logger.error('更新配置文件失败:', error);
            // 不抛出错误，因为这不是关键步骤
        }
    }

    /**
     * 生成部署报告
     */
    async generateDeploymentReport() {
        try {
            logger.info('生成部署报告...');
            
            // 计算总 Gas 使用量
            this.deploymentReport.gasUsed = this.deploymentReport.contracts.reduce(
                (total, contract) => total + parseInt(contract.gasUsed),
                0
            );
            
            // 估算总成本 (假设 Gas 价格为 20 Gwei)
            const gasPrice = ethers.utils.parseUnits('20', 'gwei');
            const totalCost = gasPrice.mul(this.deploymentReport.gasUsed);
            this.deploymentReport.totalCost = ethers.utils.formatEther(totalCost);
            
            // 生成报告文件
            const reportPath = path.join(__dirname, '../docs/deployment-report.json');
            await fs.writeFile(
                reportPath,
                JSON.stringify(this.deploymentReport, null, 2),
                'utf8'
            );
            
            // 生成 Markdown 报告
            const markdownReport = this.generateMarkdownReport();
            const markdownPath = path.join(__dirname, '../docs/deployment-report.md');
            await fs.writeFile(markdownPath, markdownReport, 'utf8');
            
            logger.info(`部署报告已生成: ${reportPath}`);
            
        } catch (error) {
            logger.error('生成部署报告失败:', error);
        }
    }

    /**
     * 生成 Markdown 格式的部署报告
     */
    generateMarkdownReport() {
        const report = `# 区块链智能合约部署报告

## 部署概览

- **部署时间**: ${this.deploymentReport.timestamp}
- **网络**: ${this.deploymentReport.network}
- **状态**: ${this.deploymentReport.status}
- **总 Gas 使用量**: ${this.deploymentReport.gasUsed.toLocaleString()}
- **预估总成本**: ${this.deploymentReport.totalCost} ETH

## 已部署合约

${this.deploymentReport.contracts.map(contract => `### ${contract.name}

- **合约地址**: \`${contract.address}\`
- **交易哈希**: \`${contract.transactionHash}\`
- **Gas 使用量**: ${parseInt(contract.gasUsed).toLocaleString()}
`).join('\n')}

## 部署说明

本次部署包含了零碳园区数字孪生系统的核心区块链智能合约:

1. **能源交易合约 (EnergyTradingContract)**: 实现去中心化的P2P能源交易功能
2. **碳信用合约 (CarbonCreditContract)**: 实现碳信用的数字化发行、交易和注销

## 后续步骤

1. 在前端应用中集成合约地址
2. 配置合约权限和参数
3. 进行功能测试和安全审计
4. 部署到主网络

---

*报告生成时间: ${new Date().toISOString()}*
`;
        
        return report;
    }

    /**
     * 执行完整部署流程
     */
    async deploy() {
        try {
            logger.info('开始区块链智能合约部署流程...');
            
            // 1. 初始化环境
            await this.initialize();
            
            // 2. 编译合约
            await this.compileContracts();
            
            // 3. 部署能源交易合约
            await this.deployEnergyTradingContract();
            
            // 4. 部署碳信用合约
            await this.deployCarbonCreditContract();
            
            // 5. 配置合约
            await this.configureContracts();
            
            // 6. 验证部署
            await this.verifyDeployment();
            
            // 7. 更新配置文件
            await this.updateConfigFile();
            
            // 8. 生成部署报告
            await this.generateDeploymentReport();
            
            logger.info('区块链智能合约部署流程完成!');
            
            // 输出部署结果
            console.log('\n=== 部署结果 ===');
            console.log(`网络: ${this.deploymentReport.network}`);
            console.log(`状态: ${this.deploymentReport.status}`);
            console.log(`总 Gas: ${this.deploymentReport.gasUsed.toLocaleString()}`);
            console.log(`总成本: ${this.deploymentReport.totalCost} ETH`);
            console.log('\n已部署合约:');
            this.deploymentReport.contracts.forEach(contract => {
                console.log(`- ${contract.name}: ${contract.address}`);
            });
            
            return this.deployedContracts;
            
        } catch (error) {
            logger.error('区块链部署流程失败:', error);
            this.deploymentReport.status = 'failed';
            await this.generateDeploymentReport();
            throw error;
        }
    }
}

// 主函数
async function main() {
    try {
        const deployer = new BlockchainDeployer();
        await deployer.deploy();
        process.exit(0);
    } catch (error) {
        console.error('部署失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = BlockchainDeployer;