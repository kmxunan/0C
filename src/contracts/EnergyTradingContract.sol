// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title EnergyTradingContract
 * @dev 零碳园区去中心化能源交易智能合约
 * 
 * 功能特性:
 * 1. P2P能源交易订单管理
 * 2. 自动化交易执行和结算
 * 3. 绿色能源证书集成
 * 4. 实时价格发现机制
 * 5. 多重安全保障
 * 
 * @author VPP开发团队
 * @version 1.0.0
 */
contract EnergyTradingContract is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    // ==================== 状态变量 ====================
    
    Counters.Counter private _orderIds;
    Counters.Counter private _certificateIds;
    
    // 能源代币合约地址
    address public energyTokenAddress;
    
    // 交易手续费率 (基点，1% = 100)
    uint256 public tradingFeeRate = 50; // 0.5%
    
    // 最小交易量 (kWh * 1e18)
    uint256 public minTradeAmount = 1e18; // 1 kWh
    
    // 最大交易量 (kWh * 1e18)
    uint256 public maxTradeAmount = 1000000e18; // 1,000,000 kWh
    
    // 订单有效期 (秒)
    uint256 public orderValidityPeriod = 86400; // 24小时
    
    // 认证的能源生产者
    mapping(address => bool) public certifiedProducers;
    
    // 认证的能源消费者
    mapping(address => bool) public certifiedConsumers;
    
    // ==================== 数据结构 ====================
    
    /**
     * @dev 能源类型枚举
     */
    enum EnergyType {
        SOLAR,          // 太阳能
        WIND,           // 风能
        HYDRO,          // 水能
        BIOMASS,        // 生物质能
        GEOTHERMAL,     // 地热能
        NUCLEAR,        // 核能
        COAL,           // 煤炭
        NATURAL_GAS,    // 天然气
        OTHER           // 其他
    }
    
    /**
     * @dev 订单状态枚举
     */
    enum OrderStatus {
        ACTIVE,         // 活跃
        PARTIALLY_FILLED, // 部分成交
        FILLED,         // 完全成交
        CANCELLED,      // 已取消
        EXPIRED         // 已过期
    }
    
    /**
     * @dev 订单类型枚举
     */
    enum OrderType {
        BUY,            // 买单
        SELL            // 卖单
    }
    
    /**
     * @dev 能源交易订单结构
     */
    struct EnergyOrder {
        uint256 orderId;            // 订单ID
        address trader;             // 交易者
        OrderType orderType;        // 订单类型
        EnergyType energyType;      // 能源类型
        uint256 amount;             // 能源数量 (kWh * 1e18)
        uint256 price;              // 单价 (wei per kWh)
        uint256 filledAmount;       // 已成交数量
        uint256 createdAt;          // 创建时间
        uint256 expiresAt;          // 过期时间
        OrderStatus status;         // 订单状态
        string location;            // 地理位置
        uint256 carbonIntensity;    // 碳强度 (gCO2/kWh)
        bool requiresCertificate;   // 是否需要绿色证书
        string metadataURI;         // 元数据URI
    }
    
    /**
     * @dev 绿色能源证书结构
     */
    struct GreenEnergyCertificate {
        uint256 certificateId;      // 证书ID
        uint256 orderId;            // 关联订单ID
        address issuer;             // 发行者
        address owner;              // 拥有者
        EnergyType energyType;      // 能源类型
        uint256 amount;             // 能源数量
        uint256 issuedAt;          // 发行时间
        uint256 validUntil;        // 有效期至
        string facilityLocation;   // 设施位置
        string certificationBody;  // 认证机构
        bool isRetired;            // 是否已退役
        string metadataURI;        // 元数据URI
    }
    
    /**
     * @dev 交易记录结构
     */
    struct TradeRecord {
        uint256 tradeId;            // 交易ID
        uint256 buyOrderId;         // 买单ID
        uint256 sellOrderId;        // 卖单ID
        address buyer;              // 买方
        address seller;             // 卖方
        uint256 amount;             // 交易数量
        uint256 price;              // 交易价格
        uint256 timestamp;          // 交易时间
        uint256 certificateId;      // 绿色证书ID
        uint256 tradingFee;         // 交易手续费
    }
    
    // ==================== 映射存储 ====================
    
    // 订单ID => 订单信息
    mapping(uint256 => EnergyOrder) public orders;
    
    // 证书ID => 证书信息
    mapping(uint256 => GreenEnergyCertificate) public certificates;
    
    // 交易ID => 交易记录
    mapping(uint256 => TradeRecord) public trades;
    
    // 用户地址 => 订单ID列表
    mapping(address => uint256[]) public userOrders;
    
    // 用户地址 => 证书ID列表
    mapping(address => uint256[]) public userCertificates;
    
    // 能源类型 => 活跃买单列表
    mapping(uint8 => uint256[]) public activeBuyOrders;
    
    // 能源类型 => 活跃卖单列表
    mapping(uint8 => uint256[]) public activeSellOrders;
    
    // 累计交易统计
    mapping(address => uint256) public totalTradeVolume;
    mapping(address => uint256) public totalTradeValue;
    
    // ==================== 事件定义 ====================
    
    /**
     * @dev 订单创建事件
     */
    event OrderCreated(
        uint256 indexed orderId,
        address indexed trader,
        uint8 indexed orderType,
        uint8 energyType,
        uint256 amount,
        uint256 price
    );
    
    /**
     * @dev 订单匹配事件
     */
    event OrderMatched(
        uint256 indexed buyOrderId,
        uint256 indexed sellOrderId,
        address indexed buyer,
        address seller,
        uint256 amount,
        uint256 price
    );
    
    /**
     * @dev 订单取消事件
     */
    event OrderCancelled(
        uint256 indexed orderId,
        address indexed trader
    );
    
    /**
     * @dev 绿色证书发行事件
     */
    event CertificateIssued(
        uint256 indexed certificateId,
        uint256 indexed orderId,
        address indexed owner,
        uint8 energyType,
        uint256 amount
    );
    
    /**
     * @dev 价格更新事件
     */
    event PriceUpdated(
        uint8 indexed energyType,
        uint256 newPrice,
        uint256 timestamp
    );
    
    // ==================== 修饰符 ====================
    
    /**
     * @dev 仅认证生产者
     */
    modifier onlyCertifiedProducer() {
        require(certifiedProducers[msg.sender], "Not a certified producer");
        _;
    }
    
    /**
     * @dev 仅认证消费者
     */
    modifier onlyCertifiedConsumer() {
        require(certifiedConsumers[msg.sender], "Not a certified consumer");
        _;
    }
    
    /**
     * @dev 仅有效订单
     */
    modifier onlyValidOrder(uint256 orderId) {
        require(orders[orderId].orderId != 0, "Order does not exist");
        require(orders[orderId].status == OrderStatus.ACTIVE || 
                orders[orderId].status == OrderStatus.PARTIALLY_FILLED, "Order not active");
        require(block.timestamp <= orders[orderId].expiresAt, "Order expired");
        _;
    }
    
    // ==================== 构造函数 ====================
    
    /**
     * @dev 构造函数
     * @param _energyTokenAddress 能源代币合约地址
     */
    constructor(address _energyTokenAddress) 
        ERC721("Green Energy Certificate", "GEC") 
    {
        energyTokenAddress = _energyTokenAddress;
    }
    
    // ==================== 核心交易功能 ====================
    
    /**
     * @dev 创建能源交易订单
     * @param orderType 订单类型 (0: 买单, 1: 卖单)
     * @param energyType 能源类型
     * @param amount 能源数量 (kWh * 1e18)
     * @param price 单价 (wei per kWh)
     * @param location 地理位置
     * @param carbonIntensity 碳强度
     * @param requiresCertificate 是否需要绿色证书
     * @param metadataURI 元数据URI
     */
    function createOrder(
        uint8 orderType,
        uint8 energyType,
        uint256 amount,
        uint256 price,
        string memory location,
        uint256 carbonIntensity,
        bool requiresCertificate,
        string memory metadataURI
    ) external whenNotPaused nonReentrant {
        require(amount >= minTradeAmount && amount <= maxTradeAmount, "Invalid amount");
        require(price > 0, "Price must be positive");
        require(energyType <= uint8(EnergyType.OTHER), "Invalid energy type");
        
        if (orderType == uint8(OrderType.SELL)) {
            require(certifiedProducers[msg.sender], "Seller must be certified producer");
        } else {
            require(certifiedConsumers[msg.sender], "Buyer must be certified consumer");
        }
        
        _orderIds.increment();
        uint256 orderId = _orderIds.current();
        
        orders[orderId] = EnergyOrder({
            orderId: orderId,
            trader: msg.sender,
            orderType: OrderType(orderType),
            energyType: EnergyType(energyType),
            amount: amount,
            price: price,
            filledAmount: 0,
            createdAt: block.timestamp,
            expiresAt: block.timestamp.add(orderValidityPeriod),
            status: OrderStatus.ACTIVE,
            location: location,
            carbonIntensity: carbonIntensity,
            requiresCertificate: requiresCertificate,
            metadataURI: metadataURI
        });
        
        userOrders[msg.sender].push(orderId);
        
        if (orderType == uint8(OrderType.BUY)) {
            activeBuyOrders[energyType].push(orderId);
        } else {
            activeSellOrders[energyType].push(orderId);
        }
        
        emit OrderCreated(orderId, msg.sender, orderType, energyType, amount, price);
        
        // 尝试自动匹配订单
        _tryMatchOrder(orderId);
    }
    
    /**
     * @dev 取消订单
     * @param orderId 订单ID
     */
    function cancelOrder(uint256 orderId) external nonReentrant {
        require(orders[orderId].trader == msg.sender, "Not order owner");
        require(orders[orderId].status == OrderStatus.ACTIVE || 
                orders[orderId].status == OrderStatus.PARTIALLY_FILLED, "Cannot cancel order");
        
        orders[orderId].status = OrderStatus.CANCELLED;
        
        emit OrderCancelled(orderId, msg.sender);
    }
    
    /**
     * @dev 手动匹配订单
     * @param buyOrderId 买单ID
     * @param sellOrderId 卖单ID
     * @param amount 交易数量
     */
    function matchOrders(
        uint256 buyOrderId,
        uint256 sellOrderId,
        uint256 amount
    ) external onlyValidOrder(buyOrderId) onlyValidOrder(sellOrderId) nonReentrant {
        EnergyOrder storage buyOrder = orders[buyOrderId];
        EnergyOrder storage sellOrder = orders[sellOrderId];
        
        require(buyOrder.orderType == OrderType.BUY, "First order must be buy order");
        require(sellOrder.orderType == OrderType.SELL, "Second order must be sell order");
        require(buyOrder.energyType == sellOrder.energyType, "Energy types must match");
        require(buyOrder.price >= sellOrder.price, "Price mismatch");
        
        uint256 availableBuyAmount = buyOrder.amount.sub(buyOrder.filledAmount);
        uint256 availableSellAmount = sellOrder.amount.sub(sellOrder.filledAmount);
        uint256 tradeAmount = amount;
        
        if (tradeAmount > availableBuyAmount) {
            tradeAmount = availableBuyAmount;
        }
        if (tradeAmount > availableSellAmount) {
            tradeAmount = availableSellAmount;
        }
        
        require(tradeAmount > 0, "No available amount to trade");
        
        _executeTradeInternal(buyOrderId, sellOrderId, tradeAmount);
    }
    
    // ==================== 绿色证书功能 ====================
    
    /**
     * @dev 发行绿色能源证书
     * @param orderId 订单ID
     * @param facilityLocation 设施位置
     * @param certificationBody 认证机构
     * @param validityPeriod 有效期 (秒)
     * @param metadataURI 元数据URI
     */
    function issueCertificate(
        uint256 orderId,
        string memory facilityLocation,
        string memory certificationBody,
        uint256 validityPeriod,
        string memory metadataURI
    ) external onlyCertifiedProducer nonReentrant {
        require(orders[orderId].orderId != 0, "Order does not exist");
        require(orders[orderId].trader == msg.sender, "Not order owner");
        require(orders[orderId].orderType == OrderType.SELL, "Only for sell orders");
        
        _certificateIds.increment();
        uint256 certificateId = _certificateIds.current();
        
        certificates[certificateId] = GreenEnergyCertificate({
            certificateId: certificateId,
            orderId: orderId,
            issuer: msg.sender,
            owner: msg.sender,
            energyType: orders[orderId].energyType,
            amount: orders[orderId].amount,
            issuedAt: block.timestamp,
            validUntil: block.timestamp.add(validityPeriod),
            facilityLocation: facilityLocation,
            certificationBody: certificationBody,
            isRetired: false,
            metadataURI: metadataURI
        });
        
        userCertificates[msg.sender].push(certificateId);
        
        // 铸造NFT
        _safeMint(msg.sender, certificateId);
        _setTokenURI(certificateId, metadataURI);
        
        emit CertificateIssued(
            certificateId,
            orderId,
            msg.sender,
            uint8(orders[orderId].energyType),
            orders[orderId].amount
        );
    }
    
    /**
     * @dev 转移绿色证书
     * @param certificateId 证书ID
     * @param to 接收者地址
     */
    function transferCertificate(uint256 certificateId, address to) external {
        require(ownerOf(certificateId) == msg.sender, "Not certificate owner");
        require(!certificates[certificateId].isRetired, "Certificate is retired");
        require(block.timestamp <= certificates[certificateId].validUntil, "Certificate expired");
        
        certificates[certificateId].owner = to;
        userCertificates[to].push(certificateId);
        
        // 从原拥有者列表中移除
        _removeCertificateFromUser(msg.sender, certificateId);
        
        safeTransferFrom(msg.sender, to, certificateId);
    }
    
    /**
     * @dev 退役绿色证书
     * @param certificateId 证书ID
     */
    function retireCertificate(uint256 certificateId) external {
        require(ownerOf(certificateId) == msg.sender, "Not certificate owner");
        require(!certificates[certificateId].isRetired, "Already retired");
        
        certificates[certificateId].isRetired = true;
    }
    
    // ==================== 查询功能 ====================
    
    /**
     * @dev 获取订单信息
     * @param orderId 订单ID
     */
    function getOrder(uint256 orderId) external view returns (EnergyOrder memory) {
        return orders[orderId];
    }
    
    /**
     * @dev 获取用户订单列表
     * @param user 用户地址
     */
    function getUserOrders(address user) external view returns (uint256[] memory) {
        return userOrders[user];
    }
    
    /**
     * @dev 获取活跃买单列表
     * @param energyType 能源类型
     */
    function getActiveBuyOrders(uint8 energyType) external view returns (uint256[] memory) {
        return activeBuyOrders[energyType];
    }
    
    /**
     * @dev 获取活跃卖单列表
     * @param energyType 能源类型
     */
    function getActiveSellOrders(uint8 energyType) external view returns (uint256[] memory) {
        return activeSellOrders[energyType];
    }
    
    /**
     * @dev 获取证书信息
     * @param certificateId 证书ID
     */
    function getCertificate(uint256 certificateId) external view returns (GreenEnergyCertificate memory) {
        return certificates[certificateId];
    }
    
    /**
     * @dev 获取用户证书列表
     * @param user 用户地址
     */
    function getUserCertificates(address user) external view returns (uint256[] memory) {
        return userCertificates[user];
    }
    
    /**
     * @dev 获取市场统计
     * @param energyType 能源类型
     */
    function getMarketStats(uint8 energyType) external view returns (
        uint256 totalBuyOrders,
        uint256 totalSellOrders,
        uint256 avgBuyPrice,
        uint256 avgSellPrice
    ) {
        uint256[] memory buyOrders = activeBuyOrders[energyType];
        uint256[] memory sellOrders = activeSellOrders[energyType];
        
        totalBuyOrders = buyOrders.length;
        totalSellOrders = sellOrders.length;
        
        if (totalBuyOrders > 0) {
            uint256 totalBuyPrice = 0;
            for (uint256 i = 0; i < totalBuyOrders; i++) {
                totalBuyPrice = totalBuyPrice.add(orders[buyOrders[i]].price);
            }
            avgBuyPrice = totalBuyPrice.div(totalBuyOrders);
        }
        
        if (totalSellOrders > 0) {
            uint256 totalSellPrice = 0;
            for (uint256 i = 0; i < totalSellOrders; i++) {
                totalSellPrice = totalSellPrice.add(orders[sellOrders[i]].price);
            }
            avgSellPrice = totalSellPrice.div(totalSellOrders);
        }
    }
    
    // ==================== 管理功能 ====================
    
    /**
     * @dev 添加认证生产者
     * @param producer 生产者地址
     */
    function addCertifiedProducer(address producer) external onlyOwner {
        certifiedProducers[producer] = true;
    }
    
    /**
     * @dev 移除认证生产者
     * @param producer 生产者地址
     */
    function removeCertifiedProducer(address producer) external onlyOwner {
        certifiedProducers[producer] = false;
    }
    
    /**
     * @dev 添加认证消费者
     * @param consumer 消费者地址
     */
    function addCertifiedConsumer(address consumer) external onlyOwner {
        certifiedConsumers[consumer] = true;
    }
    
    /**
     * @dev 移除认证消费者
     * @param consumer 消费者地址
     */
    function removeCertifiedConsumer(address consumer) external onlyOwner {
        certifiedConsumers[consumer] = false;
    }
    
    /**
     * @dev 设置交易手续费率
     * @param newFeeRate 新的手续费率 (基点)
     */
    function setTradingFeeRate(uint256 newFeeRate) external onlyOwner {
        require(newFeeRate <= 1000, "Fee rate too high"); // 最大10%
        tradingFeeRate = newFeeRate;
    }
    
    /**
     * @dev 设置最小交易量
     * @param newMinAmount 新的最小交易量
     */
    function setMinTradeAmount(uint256 newMinAmount) external onlyOwner {
        minTradeAmount = newMinAmount;
    }
    
    /**
     * @dev 设置最大交易量
     * @param newMaxAmount 新的最大交易量
     */
    function setMaxTradeAmount(uint256 newMaxAmount) external onlyOwner {
        maxTradeAmount = newMaxAmount;
    }
    
    /**
     * @dev 暂停合约
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev 恢复合约
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ==================== 内部函数 ====================
    
    /**
     * @dev 尝试匹配订单
     * @param orderId 订单ID
     */
    function _tryMatchOrder(uint256 orderId) internal {
        EnergyOrder storage order = orders[orderId];
        uint8 energyType = uint8(order.energyType);
        
        if (order.orderType == OrderType.BUY) {
            // 匹配卖单
            uint256[] storage sellOrders = activeSellOrders[energyType];
            for (uint256 i = 0; i < sellOrders.length; i++) {
                uint256 sellOrderId = sellOrders[i];
                EnergyOrder storage sellOrder = orders[sellOrderId];
                
                if (sellOrder.status == OrderStatus.ACTIVE && 
                    order.price >= sellOrder.price &&
                    block.timestamp <= sellOrder.expiresAt) {
                    
                    uint256 availableBuyAmount = order.amount.sub(order.filledAmount);
                    uint256 availableSellAmount = sellOrder.amount.sub(sellOrder.filledAmount);
                    uint256 tradeAmount = availableBuyAmount < availableSellAmount ? 
                                        availableBuyAmount : availableSellAmount;
                    
                    if (tradeAmount > 0) {
                        _executeTradeInternal(orderId, sellOrderId, tradeAmount);
                        
                        if (order.filledAmount == order.amount) {
                            break; // 买单已完全成交
                        }
                    }
                }
            }
        } else {
            // 匹配买单
            uint256[] storage buyOrders = activeBuyOrders[energyType];
            for (uint256 i = 0; i < buyOrders.length; i++) {
                uint256 buyOrderId = buyOrders[i];
                EnergyOrder storage buyOrder = orders[buyOrderId];
                
                if (buyOrder.status == OrderStatus.ACTIVE && 
                    buyOrder.price >= order.price &&
                    block.timestamp <= buyOrder.expiresAt) {
                    
                    uint256 availableBuyAmount = buyOrder.amount.sub(buyOrder.filledAmount);
                    uint256 availableSellAmount = order.amount.sub(order.filledAmount);
                    uint256 tradeAmount = availableBuyAmount < availableSellAmount ? 
                                        availableBuyAmount : availableSellAmount;
                    
                    if (tradeAmount > 0) {
                        _executeTradeInternal(buyOrderId, orderId, tradeAmount);
                        
                        if (order.filledAmount == order.amount) {
                            break; // 卖单已完全成交
                        }
                    }
                }
            }
        }
    }
    
    /**
     * @dev 执行交易内部逻辑
     * @param buyOrderId 买单ID
     * @param sellOrderId 卖单ID
     * @param amount 交易数量
     */
    function _executeTradeInternal(
        uint256 buyOrderId,
        uint256 sellOrderId,
        uint256 amount
    ) internal {
        EnergyOrder storage buyOrder = orders[buyOrderId];
        EnergyOrder storage sellOrder = orders[sellOrderId];
        
        // 使用卖单价格作为成交价格
        uint256 tradePrice = sellOrder.price;
        uint256 totalValue = amount.mul(tradePrice).div(1e18);
        uint256 tradingFee = totalValue.mul(tradingFeeRate).div(10000);
        
        // 更新订单状态
        buyOrder.filledAmount = buyOrder.filledAmount.add(amount);
        sellOrder.filledAmount = sellOrder.filledAmount.add(amount);
        
        if (buyOrder.filledAmount == buyOrder.amount) {
            buyOrder.status = OrderStatus.FILLED;
        } else {
            buyOrder.status = OrderStatus.PARTIALLY_FILLED;
        }
        
        if (sellOrder.filledAmount == sellOrder.amount) {
            sellOrder.status = OrderStatus.FILLED;
        } else {
            sellOrder.status = OrderStatus.PARTIALLY_FILLED;
        }
        
        // 更新交易统计
        totalTradeVolume[buyOrder.trader] = totalTradeVolume[buyOrder.trader].add(amount);
        totalTradeVolume[sellOrder.trader] = totalTradeVolume[sellOrder.trader].add(amount);
        totalTradeValue[buyOrder.trader] = totalTradeValue[buyOrder.trader].add(totalValue);
        totalTradeValue[sellOrder.trader] = totalTradeValue[sellOrder.trader].add(totalValue);
        
        emit OrderMatched(
            buyOrderId,
            sellOrderId,
            buyOrder.trader,
            sellOrder.trader,
            amount,
            tradePrice
        );
        
        emit PriceUpdated(
            uint8(buyOrder.energyType),
            tradePrice,
            block.timestamp
        );
    }
    
    /**
     * @dev 从用户证书列表中移除证书
     * @param user 用户地址
     * @param certificateId 证书ID
     */
    function _removeCertificateFromUser(address user, uint256 certificateId) internal {
        uint256[] storage userCerts = userCertificates[user];
        for (uint256 i = 0; i < userCerts.length; i++) {
            if (userCerts[i] == certificateId) {
                userCerts[i] = userCerts[userCerts.length - 1];
                userCerts.pop();
                break;
            }
        }
    }
    
    // ==================== 重写函数 ====================
    
    /**
     * @dev 重写tokenURI函数
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev 重写supportsInterface函数
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev 重写_burn函数
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
}