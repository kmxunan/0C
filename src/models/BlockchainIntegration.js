/**
 * 区块链集成数据模型
 * 定义区块链相关功能的数据结构和数据库操作
 *
 * 模型包括:
 * 1. 智能合约管理
 * 2. 能源交易订单
 * 3. 碳信用管理
 * 4. 绿色能源证书
 * 5. 供应链产品追踪
 * 6. 交易历史记录
 *
 * @author VPP开发团队
 * @version 1.0.0
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// ==================== 智能合约模型 ====================

/**
 * 智能合约模型
 * 记录部署的智能合约信息
 */
const SmartContract = sequelize.define('SmartContract', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    contractType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '合约类型 (energy_trading, carbon_credit, green_certificate, supply_chain)'
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '合约名称'
    },
    version: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: '1.0.0',
        comment: '合约版本'
    },
    address: {
        type: DataTypes.STRING(42),
        allowNull: false,
        unique: true,
        comment: '合约地址'
    },
    deploymentTx: {
        type: DataTypes.STRING(66),
        allowNull: false,
        comment: '部署交易哈希'
    },
    abi: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '合约ABI (JSON格式)'
    },
    bytecode: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '合约字节码'
    },
    functions: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        comment: '合约函数列表'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'deprecated'),
        defaultValue: 'active',
        comment: '合约状态'
    },
    gasUsed: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: '部署时消耗的Gas'
    },
    deployedBy: {
        type: DataTypes.STRING(42),
        allowNull: false,
        comment: '部署者地址'
    },
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
        comment: '合约元数据'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'blockchain_smart_contracts',
    indexes: [
        { fields: ['contractType'] },
        { fields: ['status'] },
        { fields: ['address'] },
        { fields: ['deployedBy'] }
    ]
});

// ==================== 能源交易订单模型 ====================

/**
 * 能源交易订单模型
 * 记录去中心化能源交易订单
 */
const EnergyTradeOrder = sequelize.define('EnergyTradeOrder', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    sellerId: {
        type: DataTypes.STRING(42),
        allowNull: false,
        comment: '卖方地址'
    },
    buyerId: {
        type: DataTypes.STRING(42),
        allowNull: true,
        comment: '买方地址'
    },
    energyType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '能源类型 (solar, wind, hydro, biomass, etc.)'
    },
    quantity: {
        type: DataTypes.DECIMAL(15, 6),
        allowNull: false,
        comment: '能源数量 (kWh)'
    },
    price: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
        comment: '单价 (元/kWh)'
    },
    totalValue: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        comment: '总价值 (元)'
    },
    deliveryTime: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '交付时间'
    },
    location: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '交付地点'
    },
    carbonIntensity: {
        type: DataTypes.DECIMAL(8, 4),
        allowNull: true,
        comment: '碳强度 (kg CO2/kWh)'
    },
    renewableSource: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: '是否为可再生能源'
    },
    certificateId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: '关联的绿色证书ID'
    },
    status: {
        type: DataTypes.ENUM('pending', 'executing', 'completed', 'cancelled'),
        defaultValue: 'pending',
        comment: '订单状态'
    },
    transactionHash: {
        type: DataTypes.STRING(66),
        allowNull: true,
        comment: '区块链交易哈希'
    },
    smartContractAddress: {
        type: DataTypes.STRING(42),
        allowNull: true,
        comment: '智能合约地址'
    },
    executedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '执行时间'
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '完成时间'
    },
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
        comment: '订单元数据'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'blockchain_energy_trade_orders',
    indexes: [
        { fields: ['sellerId'] },
        { fields: ['buyerId'] },
        { fields: ['energyType'] },
        { fields: ['status'] },
        { fields: ['deliveryTime'] },
        { fields: ['transactionHash'] }
    ]
});

// ==================== 碳信用模型 ====================

/**
 * 碳信用模型
 * 记录碳信用的发行、转移和退役
 */
const CarbonCredit = sequelize.define('CarbonCredit', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    projectId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '项目ID'
    },
    serialNumber: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: '碳信用序列号'
    },
    amount: {
        type: DataTypes.DECIMAL(15, 6),
        allowNull: false,
        comment: '碳信用数量 (tCO2e)'
    },
    verifier: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '验证机构'
    },
    methodology: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '方法学'
    },
    vintage: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '年份'
    },
    geography: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '地理位置'
    },
    standard: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '标准 (VCS, CDM, GS, etc.)'
    },
    owner: {
        type: DataTypes.STRING(42),
        allowNull: false,
        comment: '当前持有者地址'
    },
    issuer: {
        type: DataTypes.STRING(42),
        allowNull: false,
        comment: '发行者地址'
    },
    issuedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '发行时间'
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '过期时间'
    },
    status: {
        type: DataTypes.ENUM('active', 'retired', 'cancelled', 'transferred'),
        defaultValue: 'active',
        comment: '碳信用状态'
    },
    transactionHash: {
        type: DataTypes.STRING(66),
        allowNull: false,
        comment: '发行交易哈希'
    },
    smartContractAddress: {
        type: DataTypes.STRING(42),
        allowNull: false,
        comment: '智能合约地址'
    },
    tokenId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'NFT Token ID'
    },
    retiredAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '退役时间'
    },
    retiredBy: {
        type: DataTypes.STRING(42),
        allowNull: true,
        comment: '退役者地址'
    },
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
        comment: '碳信用元数据'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'blockchain_carbon_credits',
    indexes: [
        { fields: ['projectId'] },
        { fields: ['owner'] },
        { fields: ['issuer'] },
        { fields: ['status'] },
        { fields: ['vintage'] },
        { fields: ['serialNumber'] },
        { fields: ['transactionHash'] }
    ]
});

// ==================== 绿色能源证书模型 ====================

/**
 * 绿色能源证书模型
 * 记录绿色能源证书的发行和转移
 */
const GreenCertificate = sequelize.define('GreenCertificate', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    orderId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: '关联的能源交易订单ID'
    },
    certificateNumber: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: '证书编号'
    },
    energyType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '能源类型'
    },
    quantity: {
        type: DataTypes.DECIMAL(15, 6),
        allowNull: false,
        comment: '能源数量 (kWh)'
    },
    generator: {
        type: DataTypes.STRING(42),
        allowNull: false,
        comment: '发电方地址'
    },
    consumer: {
        type: DataTypes.STRING(42),
        allowNull: false,
        comment: '消费方地址'
    },
    generationPeriod: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '发电周期'
    },
    location: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '发电地点'
    },
    technology: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '发电技术'
    },
    carbonOffset: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: true,
        comment: '碳减排量 (tCO2e)'
    },
    issuedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '发行时间'
    },
    validUntil: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '有效期至'
    },
    status: {
        type: DataTypes.ENUM('active', 'used', 'expired', 'cancelled'),
        defaultValue: 'active',
        comment: '证书状态'
    },
    transactionHash: {
        type: DataTypes.STRING(66),
        allowNull: false,
        comment: '发行交易哈希'
    },
    smartContractAddress: {
        type: DataTypes.STRING(42),
        allowNull: false,
        comment: '智能合约地址'
    },
    tokenId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'NFT Token ID'
    },
    usedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '使用时间'
    },
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
        comment: '证书元数据'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'blockchain_green_certificates',
    indexes: [
        { fields: ['orderId'] },
        { fields: ['generator'] },
        { fields: ['consumer'] },
        { fields: ['energyType'] },
        { fields: ['status'] },
        { fields: ['certificateNumber'] },
        { fields: ['transactionHash'] }
    ]
});

// ==================== 供应链产品追踪模型 ====================

/**
 * 供应链产品追踪模型
 * 记录产品的供应链信息和碳足迹
 */
const SupplyChainProduct = sequelize.define('SupplyChainProduct', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    productId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: '产品ID'
    },
    manufacturer: {
        type: DataTypes.STRING(42),
        allowNull: false,
        comment: '制造商地址'
    },
    productType: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '产品类型'
    },
    productName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '产品名称'
    },
    batchNumber: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '批次号'
    },
    carbonFootprint: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: false,
        comment: '碳足迹 (kg CO2e)'
    },
    location: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '生产地点'
    },
    materials: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: '原材料列表'
    },
    energySource: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '能源来源'
    },
    recyclable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否可回收'
    },
    certifications: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: '认证列表'
    },
    supplyChainSteps: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: '供应链步骤'
    },
    currentOwner: {
        type: DataTypes.STRING(42),
        allowNull: false,
        comment: '当前持有者地址'
    },
    status: {
        type: DataTypes.ENUM('manufactured', 'in_transit', 'delivered', 'consumed', 'recycled'),
        defaultValue: 'manufactured',
        comment: '产品状态'
    },
    transactionHash: {
        type: DataTypes.STRING(66),
        allowNull: false,
        comment: '创建交易哈希'
    },
    smartContractAddress: {
        type: DataTypes.STRING(42),
        allowNull: false,
        comment: '智能合约地址'
    },
    tokenId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'NFT Token ID'
    },
    manufacturedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '生产时间'
    },
    deliveredAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '交付时间'
    },
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
        comment: '产品元数据'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'blockchain_supply_chain_products',
    indexes: [
        { fields: ['productId'] },
        { fields: ['manufacturer'] },
        { fields: ['currentOwner'] },
        { fields: ['productType'] },
        { fields: ['status'] },
        { fields: ['batchNumber'] },
        { fields: ['transactionHash'] }
    ]
});

// ==================== 交易历史模型 ====================

/**
 * 交易历史模型
 * 记录所有区块链交易的历史
 */
const TransactionHistory = sequelize.define('TransactionHistory', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    transactionHash: {
        type: DataTypes.STRING(66),
        allowNull: false,
        unique: true,
        comment: '交易哈希'
    },
    blockNumber: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: '区块号'
    },
    blockHash: {
        type: DataTypes.STRING(66),
        allowNull: false,
        comment: '区块哈希'
    },
    fromAddress: {
        type: DataTypes.STRING(42),
        allowNull: false,
        comment: '发送方地址'
    },
    toAddress: {
        type: DataTypes.STRING(42),
        allowNull: false,
        comment: '接收方地址'
    },
    value: {
        type: DataTypes.DECIMAL(30, 18),
        allowNull: false,
        defaultValue: 0,
        comment: '交易金额 (Wei)'
    },
    gasUsed: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: '消耗的Gas'
    },
    gasPrice: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'Gas价格 (Wei)'
    },
    transactionFee: {
        type: DataTypes.DECIMAL(30, 18),
        allowNull: false,
        comment: '交易费用 (Wei)'
    },
    transactionType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '交易类型 (contract_deployment, energy_trade, carbon_credit, green_certificate, supply_chain)'
    },
    contractAddress: {
        type: DataTypes.STRING(42),
        allowNull: true,
        comment: '合约地址'
    },
    functionName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '调用的函数名'
    },
    inputData: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '输入数据'
    },
    outputData: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '输出数据'
    },
    status: {
        type: DataTypes.ENUM('pending', 'success', 'failed'),
        allowNull: false,
        comment: '交易状态'
    },
    errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '错误信息'
    },
    relatedEntityId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: '关联实体ID'
    },
    relatedEntityType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '关联实体类型'
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '交易时间戳'
    },
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
        comment: '交易元数据'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'blockchain_transaction_history',
    indexes: [
        { fields: ['transactionHash'] },
        { fields: ['blockNumber'] },
        { fields: ['fromAddress'] },
        { fields: ['toAddress'] },
        { fields: ['transactionType'] },
        { fields: ['contractAddress'] },
        { fields: ['status'] },
        { fields: ['timestamp'] },
        { fields: ['relatedEntityId', 'relatedEntityType'] }
    ]
});

// ==================== 模型关联关系 ====================

// 能源交易订单与绿色证书的关联
EnergyTradeOrder.hasOne(GreenCertificate, {
    foreignKey: 'orderId',
    as: 'greenCertificate'
});
GreenCertificate.belongsTo(EnergyTradeOrder, {
    foreignKey: 'orderId',
    as: 'energyOrder'
});

// 交易历史与各实体的关联
TransactionHistory.belongsTo(SmartContract, {
    foreignKey: 'relatedEntityId',
    constraints: false,
    as: 'smartContract'
});
TransactionHistory.belongsTo(EnergyTradeOrder, {
    foreignKey: 'relatedEntityId',
    constraints: false,
    as: 'energyOrder'
});
TransactionHistory.belongsTo(CarbonCredit, {
    foreignKey: 'relatedEntityId',
    constraints: false,
    as: 'carbonCredit'
});
TransactionHistory.belongsTo(GreenCertificate, {
    foreignKey: 'relatedEntityId',
    constraints: false,
    as: 'greenCertificate'
});
TransactionHistory.belongsTo(SupplyChainProduct, {
    foreignKey: 'relatedEntityId',
    constraints: false,
    as: 'supplyChainProduct'
});

// ==================== 模型方法 ====================

// 智能合约模型方法
SmartContract.prototype.isActive = function() {
    return this.status === 'active';
};

SmartContract.prototype.getContractInfo = function() {
    return {
        id: this.id,
        type: this.contractType,
        name: this.name,
        version: this.version,
        address: this.address,
        status: this.status,
        functions: this.functions
    };
};

// 能源交易订单模型方法
EnergyTradeOrder.prototype.canExecute = function() {
    return this.status === 'pending' && this.deliveryTime > new Date();
};

EnergyTradeOrder.prototype.calculateTotalValue = function() {
    return parseFloat(this.quantity) * parseFloat(this.price);
};

// 碳信用模型方法
CarbonCredit.prototype.isActive = function() {
    return this.status === 'active' && (!this.expiresAt || this.expiresAt > new Date());
};

CarbonCredit.prototype.canTransfer = function() {
    return this.isActive() && this.status !== 'retired';
};

// 绿色证书模型方法
GreenCertificate.prototype.isValid = function() {
    return this.status === 'active' && this.validUntil > new Date();
};

GreenCertificate.prototype.canUse = function() {
    return this.isValid() && this.status !== 'used';
};

// 供应链产品模型方法
SupplyChainProduct.prototype.addSupplyChainStep = function(step) {
    const steps = this.supplyChainSteps || [];
    steps.push({
        ...step,
        timestamp: new Date(),
        stepId: uuidv4()
    });
    this.supplyChainSteps = steps;
    return this.save();
};

SupplyChainProduct.prototype.getCurrentLocation = function() {
    const steps = this.supplyChainSteps || [];
    if (steps.length === 0) return this.location;
    return steps[steps.length - 1].location || this.location;
};

// ==================== 静态方法 ====================

// 获取活跃的智能合约
SmartContract.getActiveContracts = async function(contractType = null) {
    const where = { status: 'active' };
    if (contractType) {
        where.contractType = contractType;
    }
    return await this.findAll({ where });
};

// 获取待执行的能源交易订单
EnergyTradeOrder.getPendingOrders = async function() {
    return await this.findAll({
        where: {
            status: 'pending',
            deliveryTime: {
                [sequelize.Sequelize.Op.gt]: new Date()
            }
        },
        order: [['deliveryTime', 'ASC']]
    });
};

// 获取活跃的碳信用
CarbonCredit.getActiveCredits = async function(owner = null) {
    const where = {
        status: 'active',
        [sequelize.Sequelize.Op.or]: [
            { expiresAt: null },
            { expiresAt: { [sequelize.Sequelize.Op.gt]: new Date() } }
        ]
    };
    if (owner) {
        where.owner = owner;
    }
    return await this.findAll({ where });
};

// 获取有效的绿色证书
GreenCertificate.getValidCertificates = async function(consumer = null) {
    const where = {
        status: 'active',
        validUntil: {
            [sequelize.Sequelize.Op.gt]: new Date()
        }
    };
    if (consumer) {
        where.consumer = consumer;
    }
    return await this.findAll({ where });
};

// 获取供应链产品追踪信息
SupplyChainProduct.getProductsByManufacturer = async function(manufacturer) {
    return await this.findAll({
        where: { manufacturer },
        order: [['manufacturedAt', 'DESC']]
    });
};

// 获取交易历史统计
TransactionHistory.getTransactionStats = async function(timeRange = '24h') {
    const timeMap = {
        '1h': 1,
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30
    };
    
    const hours = timeMap[timeRange] || 24;
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const stats = await this.findAll({
        where: {
            timestamp: {
                [sequelize.Sequelize.Op.gte]: startTime
            }
        },
        attributes: [
            'transactionType',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            [sequelize.fn('SUM', sequelize.col('gasUsed')), 'totalGasUsed'],
            [sequelize.fn('AVG', sequelize.col('transactionFee')), 'avgFee']
        ],
        group: ['transactionType'],
        raw: true
    });
    
    return stats;
};

module.exports = {
    SmartContract,
    EnergyTradeOrder,
    CarbonCredit,
    GreenCertificate,
    SupplyChainProduct,
    TransactionHistory
};