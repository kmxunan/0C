/**
 * @fileoverview Hardhat配置文件
 * @description 配置Hardhat开发环境，包括网络、编译器、测试和部署设置
 * @author VPP开发团队
 * @version 1.0.0
 */

require('@nomicfoundation/hardhat-toolbox');
require('@nomiclabs/hardhat-etherscan');
require('hardhat-gas-reporter');
require('solidity-coverage');
require('hardhat-deploy');
require('dotenv').config();

const {
    PRIVATE_KEY,
    INFURA_PROJECT_ID,
    ALCHEMY_API_KEY,
    ETHERSCAN_API_KEY,
    POLYGONSCAN_API_KEY,
    BSCSCAN_API_KEY,
    ARBISCAN_API_KEY,
    COINMARKETCAP_API_KEY,
    REPORT_GAS = false
} = process.env;

// 默认私钥（仅用于本地开发）
const DEFAULT_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

/**
 * Hardhat配置
 */
module.exports = {
    // Solidity编译器配置
    solidity: {
        compilers: [
            {
                version: '0.8.19',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    },
                    viaIR: true
                }
            },
            {
                version: '0.8.18',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            }
        ]
    },
    
    // 网络配置
    networks: {
        // 本地开发网络
        hardhat: {
            chainId: 31337,
            gas: 12000000,
            blockGasLimit: 12000000,
            allowUnlimitedContractSize: true,
            timeout: 1800000,
            accounts: {
                mnemonic: 'test test test test test test test test test test test junk',
                count: 20,
                accountsBalance: '10000000000000000000000' // 10000 ETH
            },
            forking: {
                // 可以fork主网进行测试
                // url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
                // blockNumber: 18500000
            }
        },
        
        // 本地节点
        localhost: {
            url: 'http://127.0.0.1:8545',
            chainId: 31337,
            gas: 12000000,
            blockGasLimit: 12000000,
            timeout: 1800000
        },
        
        // 以太坊主网
        mainnet: {
            url: ALCHEMY_API_KEY 
                ? `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`
                : `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
            chainId: 1,
            accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
            gas: 'auto',
            gasPrice: 'auto',
            gasMultiplier: 1.2,
            timeout: 1800000,
            confirmations: 2
        },
        
        // 以太坊Sepolia测试网
        sepolia: {
            url: ALCHEMY_API_KEY 
                ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
                : `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
            chainId: 11155111,
            accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [DEFAULT_PRIVATE_KEY],
            gas: 'auto',
            gasPrice: 'auto',
            gasMultiplier: 1.2,
            timeout: 1800000,
            confirmations: 2
        },
        
        // Polygon主网
        polygon: {
            url: ALCHEMY_API_KEY 
                ? `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
                : 'https://polygon-rpc.com',
            chainId: 137,
            accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
            gas: 'auto',
            gasPrice: 'auto',
            gasMultiplier: 1.2,
            timeout: 1800000,
            confirmations: 2
        },
        
        // Polygon Mumbai测试网
        mumbai: {
            url: ALCHEMY_API_KEY 
                ? `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
                : 'https://rpc-mumbai.maticvigil.com',
            chainId: 80001,
            accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [DEFAULT_PRIVATE_KEY],
            gas: 'auto',
            gasPrice: 'auto',
            gasMultiplier: 1.2,
            timeout: 1800000,
            confirmations: 2
        },
        
        // BSC主网
        bsc: {
            url: 'https://bsc-dataseed1.binance.org',
            chainId: 56,
            accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
            gas: 'auto',
            gasPrice: 'auto',
            gasMultiplier: 1.2,
            timeout: 1800000,
            confirmations: 3
        },
        
        // BSC测试网
        bscTestnet: {
            url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
            chainId: 97,
            accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [DEFAULT_PRIVATE_KEY],
            gas: 'auto',
            gasPrice: 'auto',
            gasMultiplier: 1.2,
            timeout: 1800000,
            confirmations: 3
        },
        
        // Arbitrum主网
        arbitrum: {
            url: ALCHEMY_API_KEY 
                ? `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
                : 'https://arb1.arbitrum.io/rpc',
            chainId: 42161,
            accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
            gas: 'auto',
            gasPrice: 'auto',
            gasMultiplier: 1.2,
            timeout: 1800000,
            confirmations: 2
        },
        
        // Arbitrum Goerli测试网
        arbitrumGoerli: {
            url: ALCHEMY_API_KEY 
                ? `https://arb-goerli.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
                : 'https://goerli-rollup.arbitrum.io/rpc',
            chainId: 421613,
            accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [DEFAULT_PRIVATE_KEY],
            gas: 'auto',
            gasPrice: 'auto',
            gasMultiplier: 1.2,
            timeout: 1800000,
            confirmations: 2
        }
    },
    
    // 合约验证配置
    etherscan: {
        apiKey: {
            mainnet: ETHERSCAN_API_KEY,
            sepolia: ETHERSCAN_API_KEY,
            polygon: POLYGONSCAN_API_KEY,
            polygonMumbai: POLYGONSCAN_API_KEY,
            bsc: BSCSCAN_API_KEY,
            bscTestnet: BSCSCAN_API_KEY,
            arbitrumOne: ARBISCAN_API_KEY,
            arbitrumGoerli: ARBISCAN_API_KEY
        },
        customChains: [
            {
                network: 'arbitrumGoerli',
                chainId: 421613,
                urls: {
                    apiURL: 'https://api-goerli.arbiscan.io/api',
                    browserURL: 'https://goerli.arbiscan.io'
                }
            }
        ]
    },
    
    // Gas报告配置
    gasReporter: {
        enabled: REPORT_GAS === 'true',
        currency: 'USD',
        gasPrice: 20,
        coinmarketcap: COINMARKETCAP_API_KEY,
        outputFile: 'gas-report.txt',
        noColors: true,
        excludeContracts: ['Migrations']
    },
    
    // 测试配置
    mocha: {
        timeout: 300000, // 5分钟
        reporter: 'spec',
        slow: 10000 // 10秒
    },
    
    // 路径配置
    paths: {
        sources: './src/contracts',
        tests: './src/tests',
        cache: './cache',
        artifacts: './artifacts',
        deploy: './deploy',
        deployments: './deployments'
    },
    
    // 部署配置
    namedAccounts: {
        deployer: {
            default: 0,
            mainnet: 0,
            sepolia: 0,
            polygon: 0,
            mumbai: 0,
            bsc: 0,
            bscTestnet: 0,
            arbitrum: 0,
            arbitrumGoerli: 0
        },
        user1: {
            default: 1
        },
        user2: {
            default: 2
        },
        verifier: {
            default: 3
        },
        manufacturer: {
            default: 4
        }
    },
    
    // 外部合约配置
    external: {
        contracts: [
            {
                artifacts: 'node_modules/@openzeppelin/contracts/build/contracts',
                deploy: 'node_modules/@openzeppelin/contracts/deploy'
            }
        ]
    },
    
    // 类型链配置
    typechain: {
        outDir: 'typechain-types',
        target: 'ethers-v5',
        alwaysGenerateOverloads: false,
        externalArtifacts: ['externalArtifacts/*.json']
    },
    
    // 覆盖率配置
    solidity_coverage: {
        skipFiles: [
            'test/',
            'mock/',
            'interfaces/'
        ]
    },
    
    // 文档生成配置
    docgen: {
        path: './docs',
        clear: true,
        runOnCompile: false
    },
    
    // 合约大小检查
    contractSizer: {
        alphaSort: true,
        disambiguatePaths: false,
        runOnCompile: true,
        strict: true,
        only: [':EnergyTradingContract$', ':CarbonCreditContract$', ':SupplyChainContract$']
    },
    
    // 依赖管理
    dependencyCompiler: {
        paths: [
            '@openzeppelin/contracts/token/ERC20/ERC20.sol',
            '@openzeppelin/contracts/token/ERC721/ERC721.sol',
            '@openzeppelin/contracts/access/Ownable.sol',
            '@openzeppelin/contracts/security/ReentrancyGuard.sol',
            '@openzeppelin/contracts/security/Pausable.sol'
        ]
    },
    
    // 警告设置
    warnings: {
        'contracts/**/*': {
            default: 'error'
        }
    }
};

// 任务定义
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();
    
    for (const account of accounts) {
        const balance = await account.getBalance();
        console.log(`${account.address}: ${hre.ethers.utils.formatEther(balance)} ETH`);
    }
});

task('balance', 'Prints an account\'s balance')
    .addParam('account', 'The account\'s address')
    .setAction(async (taskArgs, hre) => {
        const balance = await hre.ethers.provider.getBalance(taskArgs.account);
        console.log(hre.ethers.utils.formatEther(balance), 'ETH');
    });

task('deploy-contracts', 'Deploy all smart contracts')
    .addOptionalParam('network', 'The network to deploy to', 'localhost')
    .setAction(async (taskArgs, hre) => {
        const deployScript = require('./src/scripts/deployBlockchain.js');
        await deployScript.main();
    });

task('verify-contracts', 'Verify deployed contracts')
    .addParam('address', 'Contract address to verify')
    .addParam('contract', 'Contract name')
    .addOptionalParam('args', 'Constructor arguments (JSON array)', '[]')
    .setAction(async (taskArgs, hre) => {
        const constructorArgs = JSON.parse(taskArgs.args);
        
        try {
            await hre.run('verify:verify', {
                address: taskArgs.address,
                contract: taskArgs.contract,
                constructorArguments: constructorArgs
            });
            console.log(`✅ Contract ${taskArgs.contract} verified successfully`);
        } catch (error) {
            console.error(`❌ Verification failed:`, error.message);
        }
    });

task('test-contracts', 'Run smart contract tests')
    .addOptionalParam('grep', 'Test pattern to match')
    .setAction(async (taskArgs, hre) => {
        const testCommand = taskArgs.grep 
            ? `npx hardhat test --grep "${taskArgs.grep}"`
            : 'npx hardhat test';
        
        console.log(`Running: ${testCommand}`);
        await hre.run('test', { grep: taskArgs.grep });
    });

task('coverage', 'Generate test coverage report')
    .setAction(async (taskArgs, hre) => {
        await hre.run('coverage');
    });

task('gas-report', 'Generate gas usage report')
    .setAction(async (taskArgs, hre) => {
        process.env.REPORT_GAS = 'true';
        await hre.run('test');
    });

task('clean-all', 'Clean all generated files')
    .setAction(async (taskArgs, hre) => {
        await hre.run('clean');
        
        const fs = require('fs');
        const path = require('path');
        
        // 清理额外的目录
        const dirsToClean = ['typechain-types', 'coverage', 'deployments'];
        
        for (const dir of dirsToClean) {
            const dirPath = path.join(__dirname, dir);
            if (fs.existsSync(dirPath)) {
                fs.rmSync(dirPath, { recursive: true, force: true });
                console.log(`🗑️  Cleaned ${dir}`);
            }
        }
        
        console.log('✅ All generated files cleaned');
    });

// 导出配置
module.exports.networks = module.exports.networks;
module.exports.solidity = module.exports.solidity;