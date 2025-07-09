/**
 * @fileoverview 区块链智能合约测试套件
 * @description 测试能源交易、碳信用和供应链智能合约的功能
 * @author VPP开发团队
 * @version 1.0.0
 */

const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const logger = require('../shared/utils/logger');

/**
 * 测试配置
 */
const TEST_CONFIG = {
    // 测试账户数量
    accountCount: 10,
    
    // 测试代币数量
    testTokenAmount: ethers.utils.parseEther('1000'),
    
    // 测试超时时间
    timeout: 30000,
    
    // Gas限制
    gasLimit: 5000000
};

/**
 * 部署合约的fixture
 */
async function deployContractsFixture() {
    // 获取测试账户
    const [owner, user1, user2, user3, verifier, manufacturer] = await ethers.getSigners();
    
    // 部署能源交易合约
    const EnergyTradingContract = await ethers.getContractFactory('EnergyTradingContract');
    const energyTrading = await EnergyTradingContract.deploy();
    await energyTrading.deployed();
    
    // 部署碳信用合约
    const CarbonCreditContract = await ethers.getContractFactory('CarbonCreditContract');
    const carbonCredit = await CarbonCreditContract.deploy();
    await carbonCredit.deployed();
    
    // 部署供应链合约
    const SupplyChainContract = await ethers.getContractFactory('SupplyChainContract');
    const supplyChain = await SupplyChainContract.deploy();
    await supplyChain.deployed();
    
    // 初始化合约配置
    await energyTrading.setMinOrderAmount(ethers.utils.parseEther('0.1'));
    await energyTrading.setMaxOrderAmount(ethers.utils.parseEther('1000'));
    await energyTrading.setTradingFee(250); // 2.5%
    
    await carbonCredit.addCertifiedDeveloper(owner.address);
    await carbonCredit.addCertifiedVerifier(verifier.address);
    
    await supplyChain.addCertifiedManufacturer(manufacturer.address);
    await supplyChain.addCertifiedVerifier(verifier.address);
    
    return {
        energyTrading,
        carbonCredit,
        supplyChain,
        owner,
        user1,
        user2,
        user3,
        verifier,
        manufacturer
    };
}

/**
 * 能源交易合约测试
 */
describe('EnergyTradingContract', function () {
    this.timeout(TEST_CONFIG.timeout);
    
    describe('部署和初始化', function () {
        it('应该正确部署合约', async function () {
            const { energyTrading, owner } = await loadFixture(deployContractsFixture);
            
            expect(await energyTrading.owner()).to.equal(owner.address);
            expect(await energyTrading.minOrderAmount()).to.equal(ethers.utils.parseEther('0.1'));
            expect(await energyTrading.maxOrderAmount()).to.equal(ethers.utils.parseEther('1000'));
            expect(await energyTrading.tradingFee()).to.equal(250);
        });
        
        it('应该正确设置合约参数', async function () {
            const { energyTrading } = await loadFixture(deployContractsFixture);
            
            const newMinAmount = ethers.utils.parseEther('0.5');
            await energyTrading.setMinOrderAmount(newMinAmount);
            expect(await energyTrading.minOrderAmount()).to.equal(newMinAmount);
            
            const newFee = 300; // 3%
            await energyTrading.setTradingFee(newFee);
            expect(await energyTrading.tradingFee()).to.equal(newFee);
        });
    });
    
    describe('能源订单管理', function () {
        it('应该能够创建买单', async function () {
            const { energyTrading, user1 } = await loadFixture(deployContractsFixture);
            
            const orderAmount = ethers.utils.parseEther('10');
            const orderPrice = ethers.utils.parseEther('0.1');
            const energyType = 0; // SOLAR
            
            const tx = await energyTrading.connect(user1).createBuyOrder(
                orderAmount,
                orderPrice,
                energyType,
                Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
                'ipfs://test-metadata',
                { value: orderAmount.mul(orderPrice).div(ethers.utils.parseEther('1')) }
            );
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'OrderCreated');
            
            expect(event).to.not.be.undefined;
            expect(event.args.buyer).to.equal(user1.address);
            expect(event.args.amount).to.equal(orderAmount);
            expect(event.args.price).to.equal(orderPrice);
        });
        
        it('应该能够创建卖单', async function () {
            const { energyTrading, user2 } = await loadFixture(deployContractsFixture);
            
            const orderAmount = ethers.utils.parseEther('5');
            const orderPrice = ethers.utils.parseEther('0.08');
            const energyType = 1; // WIND
            
            const tx = await energyTrading.connect(user2).createSellOrder(
                orderAmount,
                orderPrice,
                energyType,
                Math.floor(Date.now() / 1000) + 3600,
                'ipfs://test-metadata'
            );
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'OrderCreated');
            
            expect(event).to.not.be.undefined;
            expect(event.args.seller).to.equal(user2.address);
            expect(event.args.amount).to.equal(orderAmount);
            expect(event.args.price).to.equal(orderPrice);
        });
        
        it('应该能够执行匹配的订单', async function () {
            const { energyTrading, user1, user2 } = await loadFixture(deployContractsFixture);
            
            const orderAmount = ethers.utils.parseEther('10');
            const orderPrice = ethers.utils.parseEther('0.1');
            const energyType = 0; // SOLAR
            
            // 创建买单
            await energyTrading.connect(user1).createBuyOrder(
                orderAmount,
                orderPrice,
                energyType,
                Math.floor(Date.now() / 1000) + 3600,
                'ipfs://test-metadata',
                { value: orderAmount.mul(orderPrice).div(ethers.utils.parseEther('1')) }
            );
            
            // 创建卖单
            await energyTrading.connect(user2).createSellOrder(
                orderAmount,
                orderPrice,
                energyType,
                Math.floor(Date.now() / 1000) + 3600,
                'ipfs://test-metadata'
            );
            
            // 执行订单
            const tx = await energyTrading.executeOrder(1, 2, orderAmount);
            const receipt = await tx.wait();
            
            const event = receipt.events.find(e => e.event === 'OrderExecuted');
            expect(event).to.not.be.undefined;
        });
        
        it('应该能够取消订单', async function () {
            const { energyTrading, user1 } = await loadFixture(deployContractsFixture);
            
            const orderAmount = ethers.utils.parseEther('10');
            const orderPrice = ethers.utils.parseEther('0.1');
            
            await energyTrading.connect(user1).createBuyOrder(
                orderAmount,
                orderPrice,
                0,
                Math.floor(Date.now() / 1000) + 3600,
                'ipfs://test-metadata',
                { value: orderAmount.mul(orderPrice).div(ethers.utils.parseEther('1')) }
            );
            
            const tx = await energyTrading.connect(user1).cancelOrder(1);
            const receipt = await tx.wait();
            
            const event = receipt.events.find(e => e.event === 'OrderCancelled');
            expect(event).to.not.be.undefined;
            expect(event.args.orderId).to.equal(1);
        });
    });
    
    describe('绿色能源证书', function () {
        it('应该能够发行绿色能源证书', async function () {
            const { energyTrading, user1 } = await loadFixture(deployContractsFixture);
            
            const amount = ethers.utils.parseEther('100');
            const energyType = 0; // SOLAR
            
            const tx = await energyTrading.issueGreenCertificate(
                user1.address,
                amount,
                energyType,
                'Test Certificate',
                'ipfs://certificate-metadata'
            );
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'GreenCertificateIssued');
            
            expect(event).to.not.be.undefined;
            expect(event.args.recipient).to.equal(user1.address);
            expect(event.args.amount).to.equal(amount);
        });
        
        it('应该能够使用绿色能源证书', async function () {
            const { energyTrading, user1 } = await loadFixture(deployContractsFixture);
            
            const amount = ethers.utils.parseEther('100');
            
            // 先发行证书
            await energyTrading.issueGreenCertificate(
                user1.address,
                amount,
                0,
                'Test Certificate',
                'ipfs://certificate-metadata'
            );
            
            // 使用证书
            const useAmount = ethers.utils.parseEther('50');
            const tx = await energyTrading.connect(user1).useGreenCertificate(1, useAmount);
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'GreenCertificateUsed');
            
            expect(event).to.not.be.undefined;
            expect(event.args.certificateId).to.equal(1);
            expect(event.args.amount).to.equal(useAmount);
        });
    });
});

/**
 * 碳信用合约测试
 */
describe('CarbonCreditContract', function () {
    this.timeout(TEST_CONFIG.timeout);
    
    describe('项目管理', function () {
        it('应该能够创建碳减排项目', async function () {
            const { carbonCredit, owner } = await loadFixture(deployContractsFixture);
            
            const tx = await carbonCredit.createProject(
                'Solar Farm Project',
                'Large scale solar energy project',
                0, // RENEWABLE_ENERGY
                ethers.utils.parseEther('1000'), // 1000 tCO2e
                Math.floor(Date.now() / 1000),
                Math.floor(Date.now() / 1000) + 365 * 24 * 3600, // 1年后
                'California, USA',
                'ACM0002',
                'ipfs://project-metadata'
            );
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'ProjectCreated');
            
            expect(event).to.not.be.undefined;
            expect(event.args.name).to.equal('Solar Farm Project');
            expect(event.args.developer).to.equal(owner.address);
        });
        
        it('应该能够验证项目', async function () {
            const { carbonCredit, owner, verifier } = await loadFixture(deployContractsFixture);
            
            // 创建项目
            await carbonCredit.createProject(
                'Wind Farm Project',
                'Wind energy project',
                0,
                ethers.utils.parseEther('500'),
                Math.floor(Date.now() / 1000),
                Math.floor(Date.now() / 1000) + 365 * 24 * 3600,
                'Texas, USA',
                'ACM0002',
                'ipfs://project-metadata'
            );
            
            // 验证项目
            const tx = await carbonCredit.connect(verifier).validateProject(
                1,
                ethers.utils.parseEther('450'), // 验证450 tCO2e
                'VCS',
                'ipfs://verification-report'
            );
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'ProjectValidated');
            
            expect(event).to.not.be.undefined;
            expect(event.args.projectId).to.equal(1);
            expect(event.args.verifier).to.equal(verifier.address);
        });
    });
    
    describe('碳信用发行', function () {
        it('应该能够发行碳信用', async function () {
            const { carbonCredit, owner, verifier } = await loadFixture(deployContractsFixture);
            
            // 创建并验证项目
            await carbonCredit.createProject(
                'Forestry Project',
                'Forest conservation project',
                2, // FORESTRY
                ethers.utils.parseEther('1000'),
                Math.floor(Date.now() / 1000),
                Math.floor(Date.now() / 1000) + 365 * 24 * 3600,
                'Brazil',
                'AR-ACM0003',
                'ipfs://project-metadata'
            );
            
            await carbonCredit.connect(verifier).validateProject(
                1,
                ethers.utils.parseEther('800'),
                'VCS',
                'ipfs://verification-report'
            );
            
            await carbonCredit.registerProject(1);
            
            // 发行碳信用
            const tx = await carbonCredit.issueCredit(
                1,
                ethers.utils.parseEther('500'),
                '2024',
                365 * 24 * 3600, // 1年有效期
                'ipfs://credit-metadata'
            );
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'CreditIssued');
            
            expect(event).to.not.be.undefined;
            expect(event.args.projectId).to.equal(1);
            expect(event.args.amount).to.equal(ethers.utils.parseEther('500'));
        });
        
        it('应该能够转移碳信用', async function () {
            const { carbonCredit, owner, verifier, user1 } = await loadFixture(deployContractsFixture);
            
            // 创建、验证、注册项目并发行信用
            await carbonCredit.createProject(
                'Hydro Project',
                'Hydroelectric project',
                0,
                ethers.utils.parseEther('1000'),
                Math.floor(Date.now() / 1000),
                Math.floor(Date.now() / 1000) + 365 * 24 * 3600,
                'Norway',
                'ACM0002',
                'ipfs://project-metadata'
            );
            
            await carbonCredit.connect(verifier).validateProject(1, ethers.utils.parseEther('800'), 'VCS', 'ipfs://report');
            await carbonCredit.registerProject(1);
            await carbonCredit.issueCredit(1, ethers.utils.parseEther('500'), '2024', 365 * 24 * 3600, 'ipfs://metadata');
            
            // 转移信用
            const transferAmount = ethers.utils.parseEther('200');
            const tx = await carbonCredit.transferCredit(1, user1.address, transferAmount);
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'CreditTransferred');
            
            expect(event).to.not.be.undefined;
            expect(event.args.to).to.equal(user1.address);
            expect(event.args.amount).to.equal(transferAmount);
        });
    });
    
    describe('碳中和', function () {
        it('应该能够执行碳中和', async function () {
            const { carbonCredit, owner, verifier, user1 } = await loadFixture(deployContractsFixture);
            
            // 准备碳信用
            await carbonCredit.createProject('Test Project', 'Description', 0, ethers.utils.parseEther('1000'), Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000) + 365 * 24 * 3600, 'Location', 'Methodology', 'ipfs://metadata');
            await carbonCredit.connect(verifier).validateProject(1, ethers.utils.parseEther('800'), 'VCS', 'ipfs://report');
            await carbonCredit.registerProject(1);
            await carbonCredit.issueCredit(1, ethers.utils.parseEther('500'), '2024', 365 * 24 * 3600, 'ipfs://metadata');
            await carbonCredit.transferCredit(1, user1.address, ethers.utils.parseEther('200'));
            
            // 执行碳中和
            const offsetAmount = ethers.utils.parseEther('100');
            const tx = await carbonCredit.connect(user1).offsetCarbon(
                2, // 转移后的新信用ID
                offsetAmount,
                'Corporate carbon neutrality',
                'Annual carbon offset for company operations'
            );
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'CarbonOffset');
            
            expect(event).to.not.be.undefined;
            expect(event.args.entity).to.equal(user1.address);
            expect(event.args.amount).to.equal(offsetAmount);
        });
    });
});

/**
 * 供应链合约测试
 */
describe('SupplyChainContract', function () {
    this.timeout(TEST_CONFIG.timeout);
    
    describe('产品管理', function () {
        it('应该能够创建产品', async function () {
            const { supplyChain, manufacturer } = await loadFixture(deployContractsFixture);
            
            const tx = await supplyChain.connect(manufacturer).createProduct(
                'Solar Panel SP-2024',
                'High efficiency solar panel',
                0, // SOLAR_PANEL
                'SP2024001',
                'ipfs://product-metadata'
            );
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'ProductCreated');
            
            expect(event).to.not.be.undefined;
            expect(event.args.name).to.equal('Solar Panel SP-2024');
            expect(event.args.manufacturer).to.equal(manufacturer.address);
        });
        
        it('应该能够更新产品状态', async function () {
            const { supplyChain, manufacturer } = await loadFixture(deployContractsFixture);
            
            await supplyChain.connect(manufacturer).createProduct(
                'Wind Turbine WT-2024',
                'Large wind turbine',
                1, // WIND_TURBINE
                'WT2024001',
                'ipfs://product-metadata'
            );
            
            const tx = await supplyChain.connect(manufacturer).updateProductStatus(
                1,
                2, // IN_TRANSIT
                'Product shipped to customer',
                'ipfs://shipping-metadata'
            );
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'ProductStatusUpdated');
            
            expect(event).to.not.be.undefined;
            expect(event.args.productId).to.equal(1);
            expect(event.args.newStatus).to.equal(2);
        });
        
        it('应该能够转移产品所有权', async function () {
            const { supplyChain, manufacturer, user1 } = await loadFixture(deployContractsFixture);
            
            await supplyChain.connect(manufacturer).createProduct(
                'Battery Pack BP-2024',
                'Lithium battery pack',
                2, // BATTERY
                'BP2024001',
                'ipfs://product-metadata'
            );
            
            const tx = await supplyChain.connect(manufacturer).transferProduct(
                1,
                user1.address,
                'Sale to customer'
            );
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'ProductTransferred');
            
            expect(event).to.not.be.undefined;
            expect(event.args.productId).to.equal(1);
            expect(event.args.to).to.equal(user1.address);
        });
    });
    
    describe('供应链追踪', function () {
        it('应该能够添加供应链步骤', async function () {
            const { supplyChain, manufacturer } = await loadFixture(deployContractsFixture);
            
            await supplyChain.connect(manufacturer).createProduct(
                'Inverter INV-2024',
                'Solar inverter',
                3, // INVERTER
                'INV2024001',
                'ipfs://product-metadata'
            );
            
            const tx = await supplyChain.connect(manufacturer).addSupplyChainStep(
                1,
                'Quality Control',
                'Passed all quality tests',
                'Factory QC Department',
                'ipfs://qc-report'
            );
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'SupplyChainStepAdded');
            
            expect(event).to.not.be.undefined;
            expect(event.args.productId).to.equal(1);
            expect(event.args.stepType).to.equal('Quality Control');
        });
        
        it('应该能够获取产品历史', async function () {
            const { supplyChain, manufacturer } = await loadFixture(deployContractsFixture);
            
            await supplyChain.connect(manufacturer).createProduct(
                'Smart Meter SM-2024',
                'IoT smart meter',
                4, // SMART_METER
                'SM2024001',
                'ipfs://product-metadata'
            );
            
            await supplyChain.connect(manufacturer).addSupplyChainStep(
                1,
                'Manufacturing',
                'Product manufactured',
                'Main Factory',
                'ipfs://manufacturing-data'
            );
            
            await supplyChain.connect(manufacturer).addSupplyChainStep(
                1,
                'Testing',
                'Product tested',
                'QA Department',
                'ipfs://test-results'
            );
            
            const history = await supplyChain.getProductHistory(1);
            expect(history.length).to.equal(2);
            expect(history[0].stepType).to.equal('Manufacturing');
            expect(history[1].stepType).to.equal('Testing');
        });
    });
    
    describe('认证管理', function () {
        it('应该能够添加产品认证', async function () {
            const { supplyChain, manufacturer, verifier } = await loadFixture(deployContractsFixture);
            
            await supplyChain.connect(manufacturer).createProduct(
                'EV Charger EVC-2024',
                'Electric vehicle charger',
                5, // EV_CHARGER
                'EVC2024001',
                'ipfs://product-metadata'
            );
            
            const tx = await supplyChain.connect(verifier).addCertification(
                1,
                0, // QUALITY
                'ISO 9001:2015',
                'Quality management system certification',
                Math.floor(Date.now() / 1000) + 365 * 24 * 3600, // 1年有效期
                'ipfs://certification-document'
            );
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'CertificationAdded');
            
            expect(event).to.not.be.undefined;
            expect(event.args.productId).to.equal(1);
            expect(event.args.certificationType).to.equal(0);
        });
    });
});

/**
 * 集成测试
 */
describe('区块链集成测试', function () {
    this.timeout(TEST_CONFIG.timeout);
    
    it('应该能够执行完整的能源交易流程', async function () {
        const { energyTrading, carbonCredit, user1, user2, verifier } = await loadFixture(deployContractsFixture);
        
        // 1. 创建能源订单
        const orderAmount = ethers.utils.parseEther('100');
        const orderPrice = ethers.utils.parseEther('0.1');
        
        await energyTrading.connect(user1).createBuyOrder(
            orderAmount,
            orderPrice,
            0, // SOLAR
            Math.floor(Date.now() / 1000) + 3600,
            'ipfs://buy-order-metadata',
            { value: orderAmount.mul(orderPrice).div(ethers.utils.parseEther('1')) }
        );
        
        await energyTrading.connect(user2).createSellOrder(
            orderAmount,
            orderPrice,
            0, // SOLAR
            Math.floor(Date.now() / 1000) + 3600,
            'ipfs://sell-order-metadata'
        );
        
        // 2. 执行订单
        await energyTrading.executeOrder(1, 2, orderAmount);
        
        // 3. 发行绿色能源证书
        await energyTrading.issueGreenCertificate(
            user2.address,
            orderAmount,
            0, // SOLAR
            'Green Energy Certificate',
            'ipfs://certificate-metadata'
        );
        
        // 4. 创建碳减排项目
        await carbonCredit.createProject(
            'Solar Energy Project',
            'Clean energy generation',
            0, // RENEWABLE_ENERGY
            ethers.utils.parseEther('500'),
            Math.floor(Date.now() / 1000),
            Math.floor(Date.now() / 1000) + 365 * 24 * 3600,
            'California',
            'ACM0002',
            'ipfs://project-metadata'
        );
        
        // 5. 验证项目并发行碳信用
        await carbonCredit.connect(verifier).validateProject(1, ethers.utils.parseEther('400'), 'VCS', 'ipfs://report');
        await carbonCredit.registerProject(1);
        await carbonCredit.issueCredit(1, ethers.utils.parseEther('300'), '2024', 365 * 24 * 3600, 'ipfs://credit-metadata');
        
        // 验证整个流程的结果
        const order1 = await energyTrading.getOrder(1);
        const order2 = await energyTrading.getOrder(2);
        const certificate = await energyTrading.getGreenCertificate(1);
        const project = await carbonCredit.getProject(1);
        const credit = await carbonCredit.getCredit(1);
        
        expect(order1.status).to.equal(2); // EXECUTED
        expect(order2.status).to.equal(2); // EXECUTED
        expect(certificate.amount).to.equal(orderAmount);
        expect(project.status).to.equal(4); // ACTIVE
        expect(credit.amount).to.equal(ethers.utils.parseEther('300'));
    });
});

/**
 * 性能测试
 */
describe('性能测试', function () {
    this.timeout(60000); // 1分钟超时
    
    it('应该能够处理大量订单', async function () {
        const { energyTrading, user1, user2 } = await loadFixture(deployContractsFixture);
        
        const orderCount = 50;
        const orderAmount = ethers.utils.parseEther('1');
        const orderPrice = ethers.utils.parseEther('0.1');
        
        const startTime = Date.now();
        
        // 创建大量订单
        for (let i = 0; i < orderCount; i++) {
            await energyTrading.connect(user1).createBuyOrder(
                orderAmount,
                orderPrice,
                0,
                Math.floor(Date.now() / 1000) + 3600,
                `ipfs://metadata-${i}`,
                { value: orderAmount.mul(orderPrice).div(ethers.utils.parseEther('1')) }
            );
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        logger.info(`创建 ${orderCount} 个订单耗时: ${duration}ms`);
        expect(duration).to.be.lessThan(30000); // 应该在30秒内完成
    });
});

/**
 * 安全测试
 */
describe('安全测试', function () {
    this.timeout(TEST_CONFIG.timeout);
    
    it('应该防止未授权的合约操作', async function () {
        const { energyTrading, carbonCredit, supplyChain, user1 } = await loadFixture(deployContractsFixture);
        
        // 测试未授权的参数设置
        await expect(
            energyTrading.connect(user1).setTradingFee(500)
        ).to.be.revertedWith('Ownable: caller is not the owner');
        
        // 测试未授权的项目验证
        await expect(
            carbonCredit.connect(user1).validateProject(1, ethers.utils.parseEther('100'), 'VCS', 'ipfs://report')
        ).to.be.revertedWith('Not a certified verifier');
        
        // 测试未授权的产品创建
        await expect(
            supplyChain.connect(user1).createProduct('Test Product', 'Description', 0, 'SKU001', 'ipfs://metadata')
        ).to.be.revertedWith('Not a certified manufacturer');
    });
    
    it('应该防止重入攻击', async function () {
        const { energyTrading, user1 } = await loadFixture(deployContractsFixture);
        
        const orderAmount = ethers.utils.parseEther('10');
        const orderPrice = ethers.utils.parseEther('0.1');
        
        await energyTrading.connect(user1).createBuyOrder(
            orderAmount,
            orderPrice,
            0,
            Math.floor(Date.now() / 1000) + 3600,
            'ipfs://metadata',
            { value: orderAmount.mul(orderPrice).div(ethers.utils.parseEther('1')) }
        );
        
        // 尝试重复取消同一个订单
        await energyTrading.connect(user1).cancelOrder(1);
        
        await expect(
            energyTrading.connect(user1).cancelOrder(1)
        ).to.be.revertedWith('Order not active');
    });
});