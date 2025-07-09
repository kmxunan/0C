/**
 * 区块链集成配置文件
 * 定义区块链网络连接、智能合约和安全相关配置
 * 
 * 配置包括:
 * 1. 网络配置 (主网、测试网、本地网络)
 * 2. 智能合约配置
 * 3. 安全配置
 * 4. 性能配置
 * 5. 监控配置
 * 
 * @author VPP开发团队
 * @version 1.0.0
 */

const path = require('path');
const fs = require('fs');

// 环境变量配置
const {
    NODE_ENV = 'development',
    BLOCKCHAIN_NETWORK = 'sepolia',
    ETHEREUM_RPC_URL,
    ETHEREUM_WS_URL,
    PRIVATE_KEY,
    CONTRACT_DEPLOYER_ADDRESS,
    INFURA_PROJECT_ID,
    ALCHEMY_API_KEY,
    ETHERSCAN_API_KEY,
    POLYGON_RPC_URL,
    BSC_RPC_URL,
    ARBITRUM_RPC_URL
} = process.env;

// ==================== 网络配置 ====================

/**
 * 区块链网络配置
 * 支持多个网络环境
 */
const NETWORKS = {
    // 以太坊主网
    mainnet: {
        name: 'Ethereum Mainnet',
        chainId: 1,
        rpcUrl: ETHEREUM_RPC_URL || `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
        wsUrl: ETHEREUM_WS_URL || `wss://mainnet.infura.io/ws/v3/${INFURA_PROJECT_ID}`,
        explorerUrl: 'https://etherscan.io',
        explorerApiUrl: 'https://api.etherscan.io/api',
        explorerApiKey: ETHERSCAN_API_KEY,
        gasPrice: {
            slow: 20000000000,    // 20 Gwei
            standard: 25000000000, // 25 Gwei
            fast: 30000000000     // 30 Gwei
        },
        confirmations: 12,
        blockTime: 13000, // 13 seconds
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        }
    },
    
    // 以太坊Sepolia测试网
    sepolia: {
        name: 'Ethereum Sepolia Testnet',
        chainId: 11155111,
        rpcUrl: ETHEREUM_RPC_URL || `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
        wsUrl: ETHEREUM_WS_URL || `wss://sepolia.infura.io/ws/v3/${INFURA_PROJECT_ID}`,
        explorerUrl: 'https://sepolia.etherscan.io',
        explorerApiUrl: 'https://api-sepolia.etherscan.io/api',
        explorerApiKey: ETHERSCAN_API_KEY,
        gasPrice: {
            slow: 1000000000,     // 1 Gwei
            standard: 2000000000, // 2 Gwei
            fast: 3000000000      // 3 Gwei
        },
        confirmations: 3,
        blockTime: 12000, // 12 seconds
        nativeCurrency: {
            name: 'Sepolia Ether',
            symbol: 'SEP',
            decimals: 18
        },
        faucet: 'https://sepoliafaucet.com'
    },
    
    // Polygon主网
    polygon: {
        name: 'Polygon Mainnet',
        chainId: 137,
        rpcUrl: POLYGON_RPC_URL || 'https://polygon-rpc.com',
        wsUrl: 'wss://polygon-rpc.com',
        explorerUrl: 'https://polygonscan.com',
        explorerApiUrl: 'https://api.polygonscan.com/api',
        gasPrice: {
            slow: 30000000000,    // 30 Gwei
            standard: 35000000000, // 35 Gwei
            fast: 40000000000     // 40 Gwei
        },
        confirmations: 10,
        blockTime: 2000, // 2 seconds
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
        }
    },
    
    // BSC主网
    bsc: {
        name: 'Binance Smart Chain',
        chainId: 56,
        rpcUrl: BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
        wsUrl: 'wss://bsc-ws-node.nariox.org:443',
        explorerUrl: 'https://bscscan.com',
        explorerApiUrl: 'https://api.bscscan.com/api',
        gasPrice: {
            slow: 5000000000,     // 5 Gwei
            standard: 10000000000, // 10 Gwei
            fast: 15000000000     // 15 Gwei
        },
        confirmations: 10,
        blockTime: 3000, // 3 seconds
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
        }
    },
    
    // Arbitrum主网
    arbitrum: {
        name: 'Arbitrum One',
        chainId: 42161,
        rpcUrl: ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
        wsUrl: 'wss://arb1.arbitrum.io/ws',
        explorerUrl: 'https://arbiscan.io',
        explorerApiUrl: 'https://api.arbiscan.io/api',
        gasPrice: {
            slow: 100000000,      // 0.1 Gwei
            standard: 200000000,  // 0.2 Gwei
            fast: 300000000       // 0.3 Gwei
        },
        confirmations: 5,
        blockTime: 1000, // 1 second
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        }
    },
    
    // 本地开发网络
    localhost: {
        name: 'Localhost',
        chainId: 31337,
        rpcUrl: 'http://127.0.0.1:8545',
        wsUrl: 'ws://127.0.0.1:8545',
        explorerUrl: null,
        explorerApiUrl: null,
        gasPrice: {
            slow: 1000000000,     // 1 Gwei
            standard: 2000000000, // 2 Gwei
            fast: 3000000000      // 3 Gwei
        },
        confirmations: 1,
        blockTime: 2000, // 2 seconds
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        }
    }
};

// ==================== 智能合约配置 ====================

/**
 * 智能合约配置
 * 定义各类智能合约的部署和交互配置
 */
const SMART_CONTRACTS = {
    // 能源交易合约
    energyTrading: {
        name: 'EnergyTradingContract',
        version: '1.0.0',
        gasLimit: 3000000,
        constructorArgs: [],
        upgradeable: true,
        functions: [
            'createOrder',
            'executeOrder',
            'cancelOrder',
            'getOrder',
            'getOrdersByUser',
            'updateOrderStatus'
        ],
        events: [
            'OrderCreated',
            'OrderExecuted',
            'OrderCancelled',
            'OrderStatusUpdated'
        ]
    },
    
    // 碳信用合约
    carbonCredit: {
        name: 'CarbonCreditContract',
        version: '1.0.0',
        gasLimit: 2500000,
        constructorArgs: [],
        upgradeable: true,
        functions: [
            'issueCredit',
            'transferCredit',
            'retireCredit',
            'getCredit',
            'getCreditsByOwner',
            'getTotalSupply'
        ],
        events: [
            'CreditIssued',
            'CreditTransferred',
            'CreditRetired'
        ]
    },
    
    // 绿色能源证书合约
    greenCertificate: {
        name: 'GreenCertificateContract',
        version: '1.0.0',
        gasLimit: 2000000,
        constructorArgs: [],
        upgradeable: true,
        functions: [
            'issueCertificate',
            'useCertificate',
            'transferCertificate',
            'getCertificate',
            'getCertificatesByOwner',
            'verifyCertificate'
        ],
        events: [
            'CertificateIssued',
            'CertificateUsed',
            'CertificateTransferred'
        ]
    },
    
    // 供应链追踪合约
    supplyChain: {
        name: 'SupplyChainContract',
        version: '1.0.0',
        gasLimit: 2500000,
        constructorArgs: [],
        upgradeable: true,
        functions: [
            'createProduct',
            'updateProductStatus',
            'transferProduct',
            'addSupplyChainStep',
            'getProduct',
            'getProductHistory'
        ],
        events: [
            'ProductCreated',
            'ProductStatusUpdated',
            'ProductTransferred',
            'SupplyChainStepAdded'
        ]
    }
};

// ==================== 安全配置 ====================

/**
 * 安全配置
 * 定义私钥管理、签名和验证相关配置
 */
const SECURITY_CONFIG = {
    // 私钥管理
    keyManagement: {
        useHardwareWallet: NODE_ENV === 'production',
        keyDerivationPath: "m/44'/60'/0'/0/0",
        encryptionAlgorithm: 'aes-256-gcm',
        keyRotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
        backupRequired: true
    },
    
    // 交易安全
    transactionSecurity: {
        maxGasPrice: 100000000000, // 100 Gwei
        maxGasLimit: 5000000,
        requireConfirmations: true,
        enableReplayProtection: true,
        signatureValidation: true
    },
    
    // 合约安全
    contractSecurity: {
        enableAccessControl: true,
        requireMultiSig: NODE_ENV === 'production',
        pausable: true,
        upgradeable: true,
        timelock: NODE_ENV === 'production' ? 24 * 60 * 60 : 0 // 24 hours for production
    },
    
    // API安全
    apiSecurity: {
        rateLimiting: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            maxRequests: 100
        },
        authentication: {
            required: true,
            tokenExpiry: 60 * 60 * 1000, // 1 hour
            refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000 // 7 days
        },
        encryption: {
            algorithm: 'aes-256-gcm',
            keyLength: 32,
            ivLength: 16
        }
    }
};

// ==================== 性能配置 ====================

/**
 * 性能配置
 * 定义连接池、缓存和优化相关配置
 */
const PERFORMANCE_CONFIG = {
    // 连接池配置
    connectionPool: {
        maxConnections: 10,
        minConnections: 2,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 600000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200
    },
    
    // 缓存配置
    cache: {
        enabled: true,
        ttl: 300, // 5 minutes
        maxSize: 1000,
        strategy: 'lru',
        compression: true
    },
    
    // 批处理配置
    batchProcessing: {
        enabled: true,
        batchSize: 100,
        batchTimeout: 5000, // 5 seconds
        maxRetries: 3,
        retryDelay: 1000
    },
    
    // 监控配置
    monitoring: {
        metricsInterval: 60000, // 1 minute
        healthCheckInterval: 30000, // 30 seconds
        alertThresholds: {
            responseTime: 5000, // 5 seconds
            errorRate: 0.05, // 5%
            gasUsage: 0.8 // 80% of limit
        }
    }
};

// ==================== 日志配置 ====================

/**
 * 日志配置
 * 定义区块链相关操作的日志记录
 */
const LOGGING_CONFIG = {
    level: NODE_ENV === 'production' ? 'info' : 'debug',
    format: 'json',
    timestamp: true,
    
    // 日志分类
    categories: {
        transaction: {
            enabled: true,
            level: 'info',
            includeGasInfo: true,
            includeTimestamp: true
        },
        contract: {
            enabled: true,
            level: 'info',
            includeAbi: false,
            includeBytecode: false
        },
        security: {
            enabled: true,
            level: 'warn',
            sensitiveDataMasking: true
        },
        performance: {
            enabled: true,
            level: 'debug',
            includeMetrics: true
        }
    },
    
    // 日志输出
    outputs: {
        console: NODE_ENV !== 'production',
        file: true,
        database: NODE_ENV === 'production',
        external: NODE_ENV === 'production'
    }
};

// ==================== 获取当前网络配置 ====================

/**
 * 获取当前网络配置
 * @returns {Object} 当前网络配置
 */
function getCurrentNetwork() {
    const network = NETWORKS[BLOCKCHAIN_NETWORK];
    if (!network) {
        throw new Error(`Unsupported blockchain network: ${BLOCKCHAIN_NETWORK}`);
    }
    return network;
}

/**
 * 获取智能合约配置
 * @param {string} contractType 合约类型
 * @returns {Object} 合约配置
 */
function getContractConfig(contractType) {
    const config = SMART_CONTRACTS[contractType];
    if (!config) {
        throw new Error(`Unknown contract type: ${contractType}`);
    }
    return config;
}

/**
 * 验证网络连接
 * @param {string} networkName 网络名称
 * @returns {boolean} 是否有效
 */
function validateNetwork(networkName) {
    return Object.keys(NETWORKS).includes(networkName);
}

/**
 * 获取Gas价格配置
 * @param {string} speed 速度等级 (slow, standard, fast)
 * @returns {number} Gas价格
 */
function getGasPrice(speed = 'standard') {
    const network = getCurrentNetwork();
    return network.gasPrice[speed] || network.gasPrice.standard;
}

/**
 * 获取合约部署配置
 * @param {string} contractType 合约类型
 * @returns {Object} 部署配置
 */
function getDeploymentConfig(contractType) {
    const contractConfig = getContractConfig(contractType);
    const network = getCurrentNetwork();
    
    return {
        gasLimit: contractConfig.gasLimit,
        gasPrice: getGasPrice('standard'),
        confirmations: network.confirmations,
        constructorArgs: contractConfig.constructorArgs,
        upgradeable: contractConfig.upgradeable
    };
}

// ==================== 配置验证 ====================

/**
 * 验证配置完整性
 */
function validateConfig() {
    const errors = [];
    
    // 验证网络配置
    if (!BLOCKCHAIN_NETWORK || !NETWORKS[BLOCKCHAIN_NETWORK]) {
        errors.push('Invalid or missing BLOCKCHAIN_NETWORK');
    }
    
    // 验证RPC URL
    const network = NETWORKS[BLOCKCHAIN_NETWORK];
    if (network && !network.rpcUrl) {
        errors.push('Missing RPC URL for selected network');
    }
    
    // 验证私钥（生产环境）
    if (NODE_ENV === 'production' && !PRIVATE_KEY) {
        errors.push('Missing PRIVATE_KEY in production environment');
    }
    
    // 验证部署者地址
    if (!CONTRACT_DEPLOYER_ADDRESS) {
        errors.push('Missing CONTRACT_DEPLOYER_ADDRESS');
    }
    
    if (errors.length > 0) {
        throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }
    
    return true;
}

// 初始化时验证配置
if (NODE_ENV !== 'test') {
    try {
        validateConfig();
        console.log(`✅ Blockchain configuration validated for network: ${BLOCKCHAIN_NETWORK}`);
    } catch (error) {
        console.error('❌ Blockchain configuration validation failed:', error.message);
        if (NODE_ENV === 'production') {
            process.exit(1);
        }
    }
}

module.exports = {
    NETWORKS,
    SMART_CONTRACTS,
    SECURITY_CONFIG,
    PERFORMANCE_CONFIG,
    LOGGING_CONFIG,
    getCurrentNetwork,
    getContractConfig,
    validateNetwork,
    getGasPrice,
    getDeploymentConfig,
    validateConfig,
    
    // 常用配置快捷访问
    CURRENT_NETWORK: BLOCKCHAIN_NETWORK,
    NETWORK_CONFIG: getCurrentNetwork(),
    IS_PRODUCTION: NODE_ENV === 'production',
    IS_TESTNET: ['sepolia', 'goerli', 'mumbai'].includes(BLOCKCHAIN_NETWORK)
};