/**
 * 区块链集成控制器
 * 提供区块链相关功能的API接口
 * 
 * 主要接口:
 * 1. 智能合约管理
 * 2. 去中心化能源交易
 * 3. 碳信用交易
 * 4. 绿色能源证书
 * 5. 供应链溯源
 * 6. 网络状态监控
 * 
 * @author VPP开发团队
 * @version 1.0.0
 */

const BlockchainIntegrationService = require('../services/BlockchainIntegrationService');
const logger = require('../utils/logger');
const { validateRequest, handleError } = require('../utils/apiHelpers');

class BlockchainIntegrationController {
    constructor() {
        this.blockchainService = new BlockchainIntegrationService();
        
        // 绑定方法上下文
        this.getNetworkStatus = this.getNetworkStatus.bind(this);
        this.getMetrics = this.getMetrics.bind(this);
        this.getContracts = this.getContracts.bind(this);
        this.deployContract = this.deployContract.bind(this);
        this.createEnergyTradeOrder = this.createEnergyTradeOrder.bind(this);
        this.executeEnergyTradeOrder = this.executeEnergyTradeOrder.bind(this);
        this.getEnergyTradeOrders = this.getEnergyTradeOrders.bind(this);
        this.issueCarbonCredit = this.issueCarbonCredit.bind(this);
        this.transferCarbonCredit = this.transferCarbonCredit.bind(this);
        this.getCarbonCredits = this.getCarbonCredits.bind(this);
        this.issueGreenCertificate = this.issueGreenCertificate.bind(this);
        this.getGreenCertificates = this.getGreenCertificates.bind(this);
        this.trackSupplyChainProduct = this.trackSupplyChainProduct.bind(this);
        this.getSupplyChainProducts = this.getSupplyChainProducts.bind(this);
        this.executeSmartContract = this.executeSmartContract.bind(this);
        this.getTransactionHistory = this.getTransactionHistory.bind(this);
    }
    
    /**
     * 获取区块链网络状态
     * GET /api/blockchain/network/status
     */
    async getNetworkStatus(req, res) {
        try {
            const status = this.blockchainService.getNetworkStatus();
            
            res.json({
                success: true,
                data: status,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('获取网络状态失败:', error);
            handleError(res, error, '获取网络状态失败');
        }
    }
    
    /**
     * 获取区块链指标
     * GET /api/blockchain/metrics
     */
    async getMetrics(req, res) {
        try {
            const metrics = this.blockchainService.getMetrics();
            
            res.json({
                success: true,
                data: metrics,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('获取区块链指标失败:', error);
            handleError(res, error, '获取区块链指标失败');
        }
    }
    
    /**
     * 获取智能合约列表
     * GET /api/blockchain/contracts
     */
    async getContracts(req, res) {
        try {
            const contracts = Array.from(this.blockchainService.contracts.values());
            
            // 支持按类型过滤
            const { type } = req.query;
            const filteredContracts = type ? 
                contracts.filter(contract => contract.type === type) : 
                contracts;
            
            res.json({
                success: true,
                data: {
                    contracts: filteredContracts,
                    total: filteredContracts.length,
                    types: [...new Set(contracts.map(c => c.type))]
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('获取智能合约列表失败:', error);
            handleError(res, error, '获取智能合约列表失败');
        }
    }
    
    /**
     * 部署智能合约
     * POST /api/blockchain/contracts/deploy
     */
    async deployContract(req, res) {
        try {
            const validation = validateRequest(req.body, {
                contractType: 'required|string',
                name: 'required|string',
                version: 'string',
                functions: 'array'
            });
            
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: '请求参数无效',
                    errors: validation.errors
                });
            }
            
            const { contractType, name, version, functions } = req.body;
            
            const contract = await this.blockchainService.deployContract(contractType, {
                name,
                version: version || '1.0.0',
                functions: functions || []
            });
            
            res.status(201).json({
                success: true,
                message: '智能合约部署成功',
                data: contract,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('部署智能合约失败:', error);
            handleError(res, error, '部署智能合约失败');
        }
    }
    
    /**
     * 创建去中心化能源交易订单
     * POST /api/blockchain/energy-trading/orders
     */
    async createEnergyTradeOrder(req, res) {
        try {
            const validation = validateRequest(req.body, {
                sellerId: 'required|string',
                energyType: 'required|string',
                quantity: 'required|number|min:0',
                price: 'required|number|min:0',
                deliveryTime: 'required|date',
                location: 'required|string'
            });
            
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: '请求参数无效',
                    errors: validation.errors
                });
            }
            
            const result = await this.blockchainService.createEnergyTradeOrder(req.body);
            
            res.status(201).json({
                success: true,
                message: '能源交易订单创建成功',
                data: result,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('创建能源交易订单失败:', error);
            handleError(res, error, '创建能源交易订单失败');
        }
    }
    
    /**
     * 执行能源交易订单
     * POST /api/blockchain/energy-trading/orders/:orderId/execute
     */
    async executeEnergyTradeOrder(req, res) {
        try {
            const { orderId } = req.params;
            const validation = validateRequest(req.body, {
                buyerId: 'required|string'
            });
            
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: '请求参数无效',
                    errors: validation.errors
                });
            }
            
            const { buyerId } = req.body;
            const result = await this.blockchainService.executeEnergyTradeOrder(orderId, buyerId);
            
            res.json({
                success: true,
                message: '能源交易订单执行成功',
                data: result,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('执行能源交易订单失败:', error);
            handleError(res, error, '执行能源交易订单失败');
        }
    }
    
    /**
     * 获取能源交易订单列表
     * GET /api/blockchain/energy-trading/orders
     */
    async getEnergyTradeOrders(req, res) {
        try {
            const orders = Array.from(this.blockchainService.transactions.values());
            
            // 支持过滤
            const { status, sellerId, buyerId, energyType } = req.query;
            let filteredOrders = orders;
            
            if (status) {
                filteredOrders = filteredOrders.filter(order => order.status === status);
            }
            if (sellerId) {
                filteredOrders = filteredOrders.filter(order => order.sellerId === sellerId);
            }
            if (buyerId) {
                filteredOrders = filteredOrders.filter(order => order.buyerId === buyerId);
            }
            if (energyType) {
                filteredOrders = filteredOrders.filter(order => order.energyType === energyType);
            }
            
            // 分页
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            
            const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
            
            res.json({
                success: true,
                data: {
                    orders: paginatedOrders,
                    pagination: {
                        page,
                        limit,
                        total: filteredOrders.length,
                        pages: Math.ceil(filteredOrders.length / limit)
                    },
                    summary: {
                        totalValue: filteredOrders.reduce((sum, order) => sum + (order.totalValue || 0), 0),
                        statusCounts: this.getStatusCounts(filteredOrders)
                    }
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('获取能源交易订单失败:', error);
            handleError(res, error, '获取能源交易订单失败');
        }
    }
    
    /**
     * 发行碳信用
     * POST /api/blockchain/carbon-credits/issue
     */
    async issueCarbonCredit(req, res) {
        try {
            const validation = validateRequest(req.body, {
                projectId: 'required|string',
                amount: 'required|number|min:0',
                verifier: 'required|string',
                methodology: 'required|string'
            });
            
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: '请求参数无效',
                    errors: validation.errors
                });
            }
            
            const result = await this.blockchainService.issueCarbonCredit(req.body);
            
            res.status(201).json({
                success: true,
                message: '碳信用发行成功',
                data: result,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('发行碳信用失败:', error);
            handleError(res, error, '发行碳信用失败');
        }
    }
    
    /**
     * 转移碳信用
     * POST /api/blockchain/carbon-credits/:creditId/transfer
     */
    async transferCarbonCredit(req, res) {
        try {
            const { creditId } = req.params;
            const validation = validateRequest(req.body, {
                fromOwner: 'required|string',
                toOwner: 'required|string',
                amount: 'required|number|min:0'
            });
            
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: '请求参数无效',
                    errors: validation.errors
                });
            }
            
            const { fromOwner, toOwner, amount } = req.body;
            const result = await this.blockchainService.transferCarbonCredit(
                creditId, fromOwner, toOwner, amount
            );
            
            res.json({
                success: true,
                message: '碳信用转移成功',
                data: result,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('转移碳信用失败:', error);
            handleError(res, error, '转移碳信用失败');
        }
    }
    
    /**
     * 获取碳信用列表
     * GET /api/blockchain/carbon-credits
     */
    async getCarbonCredits(req, res) {
        try {
            const credits = Array.from(this.blockchainService.carbonCredits.values());
            
            // 支持过滤
            const { owner, status, projectId } = req.query;
            let filteredCredits = credits;
            
            if (owner) {
                filteredCredits = filteredCredits.filter(credit => credit.owner === owner);
            }
            if (status) {
                filteredCredits = filteredCredits.filter(credit => credit.status === status);
            }
            if (projectId) {
                filteredCredits = filteredCredits.filter(credit => credit.projectId === projectId);
            }
            
            // 分页
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            
            const paginatedCredits = filteredCredits.slice(startIndex, endIndex);
            
            res.json({
                success: true,
                data: {
                    credits: paginatedCredits,
                    pagination: {
                        page,
                        limit,
                        total: filteredCredits.length,
                        pages: Math.ceil(filteredCredits.length / limit)
                    },
                    summary: {
                        totalAmount: filteredCredits.reduce((sum, credit) => sum + credit.amount, 0),
                        statusCounts: this.getStatusCounts(filteredCredits)
                    }
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('获取碳信用列表失败:', error);
            handleError(res, error, '获取碳信用列表失败');
        }
    }
    
    /**
     * 发行绿色能源证书
     * POST /api/blockchain/green-certificates/issue
     */
    async issueGreenCertificate(req, res) {
        try {
            const validation = validateRequest(req.body, {
                energyType: 'required|string',
                quantity: 'required|number|min:0',
                sellerId: 'required|string',
                buyerId: 'required|string'
            });
            
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: '请求参数无效',
                    errors: validation.errors
                });
            }
            
            const result = await this.blockchainService.issueGreenCertificate(req.body);
            
            res.status(201).json({
                success: true,
                message: '绿色能源证书发行成功',
                data: result,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('发行绿色能源证书失败:', error);
            handleError(res, error, '发行绿色能源证书失败');
        }
    }
    
    /**
     * 获取绿色能源证书列表
     * GET /api/blockchain/green-certificates
     */
    async getGreenCertificates(req, res) {
        try {
            const certificates = Array.from(this.blockchainService.greenCertificates.values());
            
            // 支持过滤
            const { generator, consumer, energyType, status } = req.query;
            let filteredCertificates = certificates;
            
            if (generator) {
                filteredCertificates = filteredCertificates.filter(cert => cert.generator === generator);
            }
            if (consumer) {
                filteredCertificates = filteredCertificates.filter(cert => cert.consumer === consumer);
            }
            if (energyType) {
                filteredCertificates = filteredCertificates.filter(cert => cert.energyType === energyType);
            }
            if (status) {
                filteredCertificates = filteredCertificates.filter(cert => cert.status === status);
            }
            
            // 分页
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            
            const paginatedCertificates = filteredCertificates.slice(startIndex, endIndex);
            
            res.json({
                success: true,
                data: {
                    certificates: paginatedCertificates,
                    pagination: {
                        page,
                        limit,
                        total: filteredCertificates.length,
                        pages: Math.ceil(filteredCertificates.length / limit)
                    },
                    summary: {
                        totalQuantity: filteredCertificates.reduce((sum, cert) => sum + cert.quantity, 0),
                        energyTypes: [...new Set(filteredCertificates.map(cert => cert.energyType))]
                    }
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('获取绿色能源证书失败:', error);
            handleError(res, error, '获取绿色能源证书失败');
        }
    }
    
    /**
     * 创建供应链产品追踪
     * POST /api/blockchain/supply-chain/track
     */
    async trackSupplyChainProduct(req, res) {
        try {
            const validation = validateRequest(req.body, {
                productId: 'required|string',
                manufacturer: 'required|string',
                productType: 'required|string',
                carbonFootprint: 'required|number|min:0'
            });
            
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: '请求参数无效',
                    errors: validation.errors
                });
            }
            
            const result = await this.blockchainService.trackSupplyChainProduct(req.body);
            
            res.status(201).json({
                success: true,
                message: '供应链产品追踪创建成功',
                data: result,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('创建供应链产品追踪失败:', error);
            handleError(res, error, '创建供应链产品追踪失败');
        }
    }
    
    /**
     * 获取供应链产品列表
     * GET /api/blockchain/supply-chain/products
     */
    async getSupplyChainProducts(req, res) {
        try {
            // 注意：这里需要从区块链服务中获取供应链产品数据
            // 由于当前实现中没有专门的供应链产品存储，这里返回模拟数据
            const products = [];
            
            res.json({
                success: true,
                data: {
                    products: products,
                    total: products.length
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('获取供应链产品失败:', error);
            handleError(res, error, '获取供应链产品失败');
        }
    }
    
    /**
     * 执行智能合约函数
     * POST /api/blockchain/contracts/execute
     */
    async executeSmartContract(req, res) {
        try {
            const validation = validateRequest(req.body, {
                contractType: 'required|string',
                functionName: 'required|string',
                params: 'object'
            });
            
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: '请求参数无效',
                    errors: validation.errors
                });
            }
            
            const { contractType, functionName, params } = req.body;
            const result = await this.blockchainService.executeSmartContract(
                contractType, functionName, params || {}
            );
            
            res.json({
                success: true,
                message: '智能合约执行成功',
                data: result,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('执行智能合约失败:', error);
            handleError(res, error, '执行智能合约失败');
        }
    }
    
    /**
     * 获取交易历史
     * GET /api/blockchain/transactions/history
     */
    async getTransactionHistory(req, res) {
        try {
            const transactions = Array.from(this.blockchainService.transactions.values());
            
            // 支持过滤
            const { type, status, address } = req.query;
            let filteredTransactions = transactions;
            
            if (status) {
                filteredTransactions = filteredTransactions.filter(tx => tx.status === status);
            }
            if (address) {
                filteredTransactions = filteredTransactions.filter(tx => 
                    tx.sellerId === address || tx.buyerId === address
                );
            }
            
            // 按时间排序（最新的在前）
            filteredTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            // 分页
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            
            const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
            
            res.json({
                success: true,
                data: {
                    transactions: paginatedTransactions,
                    pagination: {
                        page,
                        limit,
                        total: filteredTransactions.length,
                        pages: Math.ceil(filteredTransactions.length / limit)
                    },
                    summary: {
                        totalValue: filteredTransactions.reduce((sum, tx) => sum + (tx.totalValue || 0), 0),
                        statusCounts: this.getStatusCounts(filteredTransactions)
                    }
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('获取交易历史失败:', error);
            handleError(res, error, '获取交易历史失败');
        }
    }
    
    /**
     * 工具方法：获取状态统计
     */
    getStatusCounts(items) {
        const counts = {};
        items.forEach(item => {
            counts[item.status] = (counts[item.status] || 0) + 1;
        });
        return counts;
    }
}

module.exports = BlockchainIntegrationController;