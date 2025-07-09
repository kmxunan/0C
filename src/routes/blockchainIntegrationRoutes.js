/**
 * 区块链集成路由配置
 * 定义区块链相关功能的API路由
 * 
 * 路由分组:
 * 1. 网络状态和指标
 * 2. 智能合约管理
 * 3. 去中心化能源交易
 * 4. 碳信用交易
 * 5. 绿色能源证书
 * 6. 供应链溯源
 * 7. 交易历史
 * 
 * @author VPP开发团队
 * @version 1.0.0
 */

const express = require('express');
const BlockchainIntegrationController = require('../controllers/BlockchainIntegrationController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { validateApiKey } = require('../middleware/apiValidation');
const { logRequest } = require('../middleware/logging');

const router = express.Router();
const blockchainController = new BlockchainIntegrationController();

// 应用中间件
router.use(logRequest);
router.use(rateLimiter);
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     NetworkStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [connected, disconnected, syncing]
 *         blockHeight:
 *           type: integer
 *         gasPrice:
 *           type: number
 *         chainId:
 *           type: integer
 *         connectedContracts:
 *           type: integer
 *         activeTransactions:
 *           type: integer
 *     
 *     SmartContract:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *         name:
 *           type: string
 *         version:
 *           type: string
 *         address:
 *           type: string
 *         deploymentTx:
 *           type: string
 *         deployedAt:
 *           type: string
 *           format: date-time
 *         functions:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: string
 *         gasUsed:
 *           type: integer
 *     
 *     EnergyTradeOrder:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         sellerId:
 *           type: string
 *         buyerId:
 *           type: string
 *         energyType:
 *           type: string
 *         quantity:
 *           type: number
 *         price:
 *           type: number
 *         totalValue:
 *           type: number
 *         deliveryTime:
 *           type: string
 *           format: date-time
 *         location:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, executing, completed, cancelled]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         transactionHash:
 *           type: string
 *         metadata:
 *           type: object
 *     
 *     CarbonCredit:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         projectId:
 *           type: string
 *         amount:
 *           type: number
 *         verifier:
 *           type: string
 *         methodology:
 *           type: string
 *         issuedAt:
 *           type: string
 *           format: date-time
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *         owner:
 *           type: string
 *         transactionHash:
 *           type: string
 *         metadata:
 *           type: object
 *     
 *     GreenCertificate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         orderId:
 *           type: string
 *         energyType:
 *           type: string
 *         quantity:
 *           type: number
 *         generator:
 *           type: string
 *         consumer:
 *           type: string
 *         issuedAt:
 *           type: string
 *           format: date-time
 *         validUntil:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *         transactionHash:
 *           type: string
 *         metadata:
 *           type: object
 */

// ==================== 网络状态和指标 ====================

/**
 * @swagger
 * /api/blockchain/network/status:
 *   get:
 *     summary: 获取区块链网络状态
 *     tags: [Blockchain Network]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 网络状态获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/NetworkStatus'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get('/network/status', blockchainController.getNetworkStatus);

/**
 * @swagger
 * /api/blockchain/metrics:
 *   get:
 *     summary: 获取区块链指标
 *     tags: [Blockchain Network]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 指标获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionsProcessed:
 *                       type: integer
 *                     contractsDeployed:
 *                       type: integer
 *                     carbonCreditsTraded:
 *                       type: integer
 *                     certificatesIssued:
 *                       type: integer
 *                     averageGasUsed:
 *                       type: number
 *                     successRate:
 *                       type: string
 *                     totalValue:
 *                       type: number
 *                     activeCarbonCredits:
 *                       type: integer
 *                     activeGreenCertificates:
 *                       type: integer
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/metrics', blockchainController.getMetrics);

// ==================== 智能合约管理 ====================

/**
 * @swagger
 * /api/blockchain/contracts:
 *   get:
 *     summary: 获取智能合约列表
 *     tags: [Smart Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: 合约类型过滤
 *     responses:
 *       200:
 *         description: 合约列表获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     contracts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SmartContract'
 *                     total:
 *                       type: integer
 *                     types:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get('/contracts', blockchainController.getContracts);

/**
 * @swagger
 * /api/blockchain/contracts/deploy:
 *   post:
 *     summary: 部署智能合约
 *     tags: [Smart Contracts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contractType
 *               - name
 *             properties:
 *               contractType:
 *                 type: string
 *                 description: 合约类型
 *               name:
 *                 type: string
 *                 description: 合约名称
 *               version:
 *                 type: string
 *                 description: 合约版本
 *               functions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 合约函数列表
 *     responses:
 *       201:
 *         description: 合约部署成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/SmartContract'
 */
router.post('/contracts/deploy', authorizeRole(['admin', 'operator']), blockchainController.deployContract);

/**
 * @swagger
 * /api/blockchain/contracts/execute:
 *   post:
 *     summary: 执行智能合约函数
 *     tags: [Smart Contracts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contractType
 *               - functionName
 *             properties:
 *               contractType:
 *                 type: string
 *               functionName:
 *                 type: string
 *               params:
 *                 type: object
 *     responses:
 *       200:
 *         description: 合约执行成功
 */
router.post('/contracts/execute', authorizeRole(['admin', 'operator']), blockchainController.executeSmartContract);

// ==================== 去中心化能源交易 ====================

/**
 * @swagger
 * /api/blockchain/energy-trading/orders:
 *   get:
 *     summary: 获取能源交易订单列表
 *     tags: [Energy Trading]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, executing, completed, cancelled]
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: buyerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: energyType
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 订单列表获取成功
 *   post:
 *     summary: 创建能源交易订单
 *     tags: [Energy Trading]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sellerId
 *               - energyType
 *               - quantity
 *               - price
 *               - deliveryTime
 *               - location
 *             properties:
 *               sellerId:
 *                 type: string
 *               energyType:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 minimum: 0
 *               price:
 *                 type: number
 *                 minimum: 0
 *               deliveryTime:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               carbonIntensity:
 *                 type: number
 *               renewableSource:
 *                 type: boolean
 *               certificateId:
 *                 type: string
 *     responses:
 *       201:
 *         description: 订单创建成功
 */
router.get('/energy-trading/orders', blockchainController.getEnergyTradeOrders);
router.post('/energy-trading/orders', authorizeRole(['admin', 'trader', 'operator']), blockchainController.createEnergyTradeOrder);

/**
 * @swagger
 * /api/blockchain/energy-trading/orders/{orderId}/execute:
 *   post:
 *     summary: 执行能源交易订单
 *     tags: [Energy Trading]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - buyerId
 *             properties:
 *               buyerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: 订单执行成功
 */
router.post('/energy-trading/orders/:orderId/execute', authorizeRole(['admin', 'trader', 'operator']), blockchainController.executeEnergyTradeOrder);

// ==================== 碳信用交易 ====================

/**
 * @swagger
 * /api/blockchain/carbon-credits:
 *   get:
 *     summary: 获取碳信用列表
 *     tags: [Carbon Credits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: owner
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 碳信用列表获取成功
 */
router.get('/carbon-credits', blockchainController.getCarbonCredits);

/**
 * @swagger
 * /api/blockchain/carbon-credits/issue:
 *   post:
 *     summary: 发行碳信用
 *     tags: [Carbon Credits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - amount
 *               - verifier
 *               - methodology
 *             properties:
 *               projectId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               verifier:
 *                 type: string
 *               methodology:
 *                 type: string
 *               owner:
 *                 type: string
 *               vintage:
 *                 type: integer
 *               geography:
 *                 type: string
 *               standard:
 *                 type: string
 *               additionalInfo:
 *                 type: object
 *     responses:
 *       201:
 *         description: 碳信用发行成功
 */
router.post('/carbon-credits/issue', authorizeRole(['admin', 'verifier']), blockchainController.issueCarbonCredit);

/**
 * @swagger
 * /api/blockchain/carbon-credits/{creditId}/transfer:
 *   post:
 *     summary: 转移碳信用
 *     tags: [Carbon Credits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: creditId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromOwner
 *               - toOwner
 *               - amount
 *             properties:
 *               fromOwner:
 *                 type: string
 *               toOwner:
 *                 type: string
 *               amount:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: 碳信用转移成功
 */
router.post('/carbon-credits/:creditId/transfer', authorizeRole(['admin', 'trader', 'owner']), blockchainController.transferCarbonCredit);

// ==================== 绿色能源证书 ====================

/**
 * @swagger
 * /api/blockchain/green-certificates:
 *   get:
 *     summary: 获取绿色能源证书列表
 *     tags: [Green Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: generator
 *         schema:
 *           type: string
 *       - in: query
 *         name: consumer
 *         schema:
 *           type: string
 *       - in: query
 *         name: energyType
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 证书列表获取成功
 */
router.get('/green-certificates', blockchainController.getGreenCertificates);

/**
 * @swagger
 * /api/blockchain/green-certificates/issue:
 *   post:
 *     summary: 发行绿色能源证书
 *     tags: [Green Certificates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - energyType
 *               - quantity
 *               - sellerId
 *               - buyerId
 *             properties:
 *               energyType:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 minimum: 0
 *               sellerId:
 *                 type: string
 *               buyerId:
 *                 type: string
 *               orderId:
 *                 type: string
 *               generationPeriod:
 *                 type: string
 *               location:
 *                 type: string
 *               technology:
 *                 type: string
 *     responses:
 *       201:
 *         description: 证书发行成功
 */
router.post('/green-certificates/issue', authorizeRole(['admin', 'generator']), blockchainController.issueGreenCertificate);

// ==================== 供应链溯源 ====================

/**
 * @swagger
 * /api/blockchain/supply-chain/products:
 *   get:
 *     summary: 获取供应链产品列表
 *     tags: [Supply Chain]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 产品列表获取成功
 */
router.get('/supply-chain/products', blockchainController.getSupplyChainProducts);

/**
 * @swagger
 * /api/blockchain/supply-chain/track:
 *   post:
 *     summary: 创建供应链产品追踪
 *     tags: [Supply Chain]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - manufacturer
 *               - productType
 *               - carbonFootprint
 *             properties:
 *               productId:
 *                 type: string
 *               manufacturer:
 *                 type: string
 *               productType:
 *                 type: string
 *               carbonFootprint:
 *                 type: number
 *                 minimum: 0
 *               location:
 *                 type: string
 *               materials:
 *                 type: array
 *                 items:
 *                   type: string
 *               energySource:
 *                 type: string
 *               recyclable:
 *                 type: boolean
 *               certifications:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: 产品追踪创建成功
 */
router.post('/supply-chain/track', authorizeRole(['admin', 'manufacturer']), blockchainController.trackSupplyChainProduct);

// ==================== 交易历史 ====================

/**
 * @swagger
 * /api/blockchain/transactions/history:
 *   get:
 *     summary: 获取交易历史
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: address
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 交易历史获取成功
 */
router.get('/transactions/history', blockchainController.getTransactionHistory);

// 错误处理中间件
router.use((error, req, res, next) => {
    logger.error('区块链集成路由错误:', error);
    res.status(500).json({
        success: false,
        message: '区块链服务内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : '服务暂时不可用'
    });
});

module.exports = router;