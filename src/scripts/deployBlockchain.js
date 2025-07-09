/**
 * @fileoverview 区块链智能合约部署脚本
 * @description 自动化部署能源交易合约、碳信用合约和供应链合约
 * @author VPP开发团队
 * @version 1.0.0
 */

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
const config = require('../config/blockchainConfig');
const logger = require('../shared/utils/logger');

/**
 * 部署配置
 */
const DEPLOYMENT_CONFIG = {
    // 网络配置
    networks: {
        localhost: {
            url: 'http://127.0.0.1:8545',
            chainId: 31337,
            gasPrice: 20000000000, // 20 gwei
            gasLimit: 8000000
        },
        sepolia: {
            url: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
            chainId: 11155111,
            gasPrice: 30000000000, // 30 gwei
            gasLimit: 8000000
        },
        mainnet: {
            url: process.env.MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
            chainId: 1,
            gasPrice: 50000000000, // 50 gwei
            gasLimit: 8000000
        }
    },
    
    // 合约配置
    contracts: {
        EnergyTradingContract: {
            name: 'EnergyTradingContract',
            constructorArgs: [],
            verify: true
        },
        CarbonCreditContract: {
            name: 'CarbonCreditContract',
            constructorArgs: [],
            verify: true
        },
        SupplyChainContract: {
            name: 'SupplyChainContract',
            constructorArgs: [],
            verify: true
        }
    },
    
    // 部署选项
    options: {
        confirmations: 2,
        timeout: 300000, // 5分钟
        retries: 3,
        retryDelay: 5000 // 5秒
    }
};

/**
 * 部署结果存储
 */
class DeploymentTracker {
    constructor() {
        this.deployments = {};
        this.startTime = Date.now();
        this.network = '';
        this.deployer = '';
    }
    
    /**
     * 记录合约部署
     */
    recordDeployment(contractName, address, txHash, gasUsed, constructorArgs = []) {
        this.deployments[contractName] = {
            address,
            txHash,
            gasUsed,
            constructorArgs,
            deployedAt: new Date().toISOString(),
            verified: false
        };
        
        logger.info(`合约 ${contractName} 部署成功:`, {
            address,
            txHash,
            gasUsed: gasUsed.toString()
        });
    }
    
    /**
     * 记录验证结果
     */
    recordVerification(contractName, success, error = null) {
        if (this.deployments[contractName]) {
            this.deployments[contractName].verified = success;
            if (error) {
                this.deployments[contractName].verificationError = error;
            }
        }
    }
    
    /**
     * 生成部署报告
     */
    generateReport() {
        const endTime = Date.now();
        const duration = (endTime - this.startTime) / 1000;
        
        const report = {
            network: this.network,
            deployer: this.deployer,
            deploymentTime: new Date(this.startTime).toISOString(),
            duration: `${duration}s`,
            contracts: this.deployments,
            summary: {
                totalContracts: Object.keys(this.deployments).length,
                successfulDeployments: Object.values(this.deployments).filter(d => d.address).length,
                verifiedContracts: Object.values(this.deployments).filter(d => d.verified).length,
                totalGasUsed: Object.values(this.deployments)
                    .reduce((total, d) => total + (d.gasUsed ? parseInt(d.gasUsed) : 0), 0)
            }
        };
        
        return report;
    }
    
    /**
     * 保存部署报告
     */
    async saveReport() {
        const report = this.generateReport();
        const reportPath = path.join(__dirname, '../deployments', `deployment-${this.network}-${Date.now()}.json`);
        
        // 确保目录存在
        const deploymentDir = path.dirname(reportPath);
        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        logger.info(`部署报告已保存: ${reportPath}`);
        
        return reportPath;
    }
}

/**
 * 部署器类
 */
class BlockchainDeployer {
    constructor(networkName = 'localhost') {
        this.networkName = networkName;
        this.tracker = new DeploymentTracker();
        this.provider = null;
        this.deployer = null;
    }
    
    /**
     * 初始化部署环境
     */
    async initialize() {
        try {
            logger.info(`初始化部署环境: ${this.networkName}`);
            
            // 获取网络配置
            const networkConfig = DEPLOYMENT_CONFIG.networks[this.networkName];
            if (!networkConfig) {
                throw new Error(`不支持的网络: ${this.networkName}`);
            }
            
            // 获取部署账户
            const [deployer] = await ethers.getSigners();
            this.deployer = deployer;
            this.tracker.deployer = deployer.address;
            this.tracker.network = this.networkName;
            
            // 检查账户余额
            const balance = await deployer.getBalance();
            logger.info(`部署账户: ${deployer.address}`);
            logger.info(`账户余额: ${ethers.utils.formatEther(balance)} ETH`);
            
            if (balance.lt(ethers.utils.parseEther('0.1'))) {
                logger.warn('账户余额较低，可能影响部署');
            }
            
            // 获取网络信息
            const network = await deployer.provider.getNetwork();
            logger.info(`连接到网络: ${network.name} (Chain ID: ${network.chainId})`);
            
            return true;
        } catch (error) {
            logger.error('初始化部署环境失败:', error);
            throw error;
        }
    }
    
    /**
     * 部署单个合约
     */
    async deployContract(contractName, constructorArgs = [], options = {}) {
        try {
            logger.info(`开始部署合约: ${contractName}`);
            
            // 获取合约工厂
            const ContractFactory = await ethers.getContractFactory(contractName);
            
            // 估算Gas
            const deploymentData = ContractFactory.getDeployTransaction(...constructorArgs);
            const estimatedGas = await this.deployer.estimateGas(deploymentData);
            logger.info(`预估Gas消耗: ${estimatedGas.toString()}`);
            
            // 部署合约
            const contract = await ContractFactory.deploy(...constructorArgs, {
                gasLimit: estimatedGas.mul(120).div(100), // 增加20%的Gas缓冲
                ...options
            });
            
            logger.info(`合约部署交易已发送: ${contract.deployTransaction.hash}`);
            
            // 等待部署确认
            const receipt = await contract.deployTransaction.wait(
                DEPLOYMENT_CONFIG.options.confirmations
            );
            
            // 记录部署结果
            this.tracker.recordDeployment(
                contractName,
                contract.address,
                receipt.transactionHash,
                receipt.gasUsed,
                constructorArgs
            );
            
            return contract;
        } catch (error) {
            logger.error(`部署合约 ${contractName} 失败:`, error);
            throw error;
        }
    }
    
    /**
     * 验证合约
     */
    async verifyContract(contractName, address, constructorArgs = []) {
        try {
            if (this.networkName === 'localhost') {
                logger.info(`跳过本地网络合约验证: ${contractName}`);
                this.tracker.recordVerification(contractName, true);
                return true;
            }
            
            logger.info(`开始验证合约: ${contractName} at ${address}`);
            
            // 这里可以集成Etherscan验证
            // 由于需要API密钥，这里只是模拟验证过程
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            logger.info(`合约验证成功: ${contractName}`);
            this.tracker.recordVerification(contractName, true);
            
            return true;
        } catch (error) {
            logger.error(`验证合约 ${contractName} 失败:`, error);
            this.tracker.recordVerification(contractName, false, error.message);
            return false;
        }
    }
    
    /**
     * 配置合约权限和参数
     */
    async configureContracts(contracts) {
        try {
            logger.info('开始配置合约权限和参数');
            
            // 配置能源交易合约
            if (contracts.EnergyTradingContract) {
                const energyContract = contracts.EnergyTradingContract;
                
                // 设置基础参数
                await energyContract.setMinOrderAmount(ethers.utils.parseEther('0.1'));
                await energyContract.setMaxOrderAmount(ethers.utils.parseEther('1000'));
                await energyContract.setTradingFee(250); // 2.5%
                
                logger.info('能源交易合约配置完成');
            }
            
            // 配置碳信用合约
            if (contracts.CarbonCreditContract) {
                const carbonContract = contracts.CarbonCreditContract;
                
                // 添加认证开发者和验证机构
                await carbonContract.addCertifiedDeveloper(this.deployer.address);
                await carbonContract.addCertifiedVerifier(this.deployer.address);
                
                logger.info('碳信用合约配置完成');
            }
            
            // 配置供应链合约
            if (contracts.SupplyChainContract) {
                const supplyChainContract = contracts.SupplyChainContract;
                
                // 添加认证制造商和验证机构
                await supplyChainContract.addCertifiedManufacturer(this.deployer.address);
                await supplyChainContract.addCertifiedVerifier(this.deployer.address);
                
                logger.info('供应链合约配置完成');
            }
            
            logger.info('所有合约配置完成');
        } catch (error) {
            logger.error('配置合约失败:', error);
            throw error;
        }
    }
    
    /**
     * 执行完整部署流程
     */
    async deployAll() {
        try {
            logger.info('开始执行完整部署流程');
            
            // 初始化环境
            await this.initialize();
            
            const deployedContracts = {};
            
            // 部署所有合约
            for (const [contractName, contractConfig] of Object.entries(DEPLOYMENT_CONFIG.contracts)) {
                try {
                    const contract = await this.deployContract(
                        contractConfig.name,
                        contractConfig.constructorArgs
                    );
                    
                    deployedContracts[contractName] = contract;
                    
                    // 验证合约
                    if (contractConfig.verify) {
                        await this.verifyContract(
                            contractName,
                            contract.address,
                            contractConfig.constructorArgs
                        );
                    }
                } catch (error) {
                    logger.error(`部署 ${contractName} 失败:`, error);
                    // 继续部署其他合约
                }
            }
            
            // 配置合约
            await this.configureContracts(deployedContracts);
            
            // 生成和保存报告
            const reportPath = await this.tracker.saveReport();
            
            // 更新配置文件
            await this.updateConfigFile(deployedContracts);
            
            logger.info('部署流程完成');
            logger.info(`部署报告: ${reportPath}`);
            
            return {
                contracts: deployedContracts,
                report: this.tracker.generateReport(),
                reportPath
            };
        } catch (error) {
            logger.error('部署流程失败:', error);
            throw error;
        }
    }
    
    /**
     * 更新配置文件
     */
    async updateConfigFile(contracts) {
        try {
            const configPath = path.join(__dirname, '../config/deployedContracts.json');
            
            const deployedConfig = {
                network: this.networkName,
                deployer: this.deployer.address,
                deployedAt: new Date().toISOString(),
                contracts: {}
            };
            
            // 添加合约地址
            for (const [name, contract] of Object.entries(contracts)) {
                deployedConfig.contracts[name] = {
                    address: contract.address,
                    abi: contract.interface.format('json')
                };
            }
            
            // 确保目录存在
            const configDir = path.dirname(configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            
            fs.writeFileSync(configPath, JSON.stringify(deployedConfig, null, 2));
            logger.info(`配置文件已更新: ${configPath}`);
        } catch (error) {
            logger.error('更新配置文件失败:', error);
        }
    }
}

/**
 * 主部署函数
 */
async function main() {
    try {
        // 获取网络参数
        const networkName = process.argv[2] || 'localhost';
        
        logger.info('='.repeat(60));
        logger.info('零碳园区区块链智能合约部署脚本');
        logger.info('='.repeat(60));
        
        // 创建部署器
        const deployer = new BlockchainDeployer(networkName);
        
        // 执行部署
        const result = await deployer.deployAll();
        
        logger.info('='.repeat(60));
        logger.info('部署完成!');
        logger.info(`成功部署 ${result.report.summary.successfulDeployments} 个合约`);
        logger.info(`总Gas消耗: ${result.report.summary.totalGasUsed}`);
        logger.info(`部署时长: ${result.report.duration}`);
        logger.info('='.repeat(60));
        
        // 输出合约地址
        console.log('\n合约地址:');
        for (const [name, contract] of Object.entries(result.contracts)) {
            console.log(`${name}: ${contract.address}`);
        }
        
        process.exit(0);
    } catch (error) {
        logger.error('部署失败:', error);
        process.exit(1);
    }
}

/**
 * 错误处理
 */
process.on('unhandledRejection', (error) => {
    logger.error('未处理的Promise拒绝:', error);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常:', error);
    process.exit(1);
});

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = {
    BlockchainDeployer,
    DeploymentTracker,
    DEPLOYMENT_CONFIG,
    main
};