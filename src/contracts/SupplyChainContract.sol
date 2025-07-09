// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title SupplyChainContract
 * @dev 零碳园区供应链溯源智能合约
 * 
 * 功能特性:
 * 1. 产品全生命周期追踪
 * 2. 供应链透明度保障
 * 3. 质量认证与验证
 * 4. 碳足迹记录与计算
 * 5. 防伪与真实性验证
 * 
 * @author VPP开发团队
 * @version 1.0.0
 */
contract SupplyChainContract is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    // ==================== 状态变量 ====================
    
    Counters.Counter private _productIds;
    Counters.Counter private _batchIds;
    
    // 认证机构映射
    mapping(address => bool) public certifiers;
    
    // 供应商映射
    mapping(address => bool) public suppliers;
    
    // 制造商映射
    mapping(address => bool) public manufacturers;
    
    // ==================== 数据结构 ====================
    
    /**
     * @dev 产品状态枚举
     */
    enum ProductStatus {
        RAW_MATERIAL,    // 原材料
        IN_PRODUCTION,   // 生产中
        QUALITY_CHECK,   // 质检中
        PACKAGED,        // 已包装
        SHIPPED,         // 已发货
        DELIVERED,       // 已交付
        CONSUMED,        // 已消费
        RECYCLED         // 已回收
    }
    
    /**
     * @dev 认证类型枚举
     */
    enum CertificationType {
        ORGANIC,         // 有机认证
        FAIR_TRADE,      // 公平贸易
        CARBON_NEUTRAL,  // 碳中和
        QUALITY_ISO,     // ISO质量认证
        ENVIRONMENTAL,   // 环境认证
        SAFETY,          // 安全认证
        OTHER            // 其他
    }
    
    /**
     * @dev 产品信息结构
     */
    struct Product {
        uint256 productId;           // 产品ID
        string name;                 // 产品名称
        string description;          // 产品描述
        string category;             // 产品类别
        address manufacturer;        // 制造商
        address currentOwner;        // 当前拥有者
        ProductStatus status;        // 产品状态
        uint256 createdAt;          // 创建时间
        uint256 updatedAt;          // 更新时间
        string batchNumber;         // 批次号
        uint256 carbonFootprint;    // 碳足迹 (kg CO2e * 1e18)
        string metadataURI;         // 元数据URI
        bool isActive;              // 是否活跃
    }
    
    /**
     * @dev 供应链事件结构
     */
    struct SupplyChainEvent {
        uint256 eventId;            // 事件ID
        uint256 productId;          // 产品ID
        address actor;              // 参与者
        string eventType;           // 事件类型
        string location;            // 地点
        uint256 timestamp;          // 时间戳
        string description;         // 描述
        bytes32 dataHash;           // 数据哈希
        bool isVerified;            // 是否已验证
    }
    
    /**
     * @dev 认证记录结构
     */
    struct Certification {
        uint256 certId;             // 认证ID
        uint256 productId;          // 产品ID
        address certifier;          // 认证机构
        CertificationType certType; // 认证类型
        string certNumber;          // 认证编号
        uint256 issuedAt;          // 发行时间
        uint256 expiresAt;         // 过期时间
        bool isValid;              // 是否有效
        string metadataURI;        // 元数据URI
    }
    
    /**
     * @dev 批次信息结构
     */
    struct Batch {
        uint256 batchId;            // 批次ID
        string batchNumber;         // 批次号
        address manufacturer;       // 制造商
        uint256 quantity;           // 数量
        uint256 createdAt;         // 创建时间
        string rawMaterials;       // 原材料信息
        uint256 totalCarbonFootprint; // 总碳足迹
        bool isCompleted;          // 是否完成
    }
    
    // ==================== 映射存储 ====================
    
    // 产品ID => 产品信息
    mapping(uint256 => Product) public products;
    
    // 产品ID => 供应链事件列表
    mapping(uint256 => SupplyChainEvent[]) public productEvents;
    
    // 产品ID => 认证记录列表
    mapping(uint256 => Certification[]) public productCertifications;
    
    // 批次ID => 批次信息
    mapping(uint256 => Batch) public batches;
    
    // 批次号 => 批次ID
    mapping(string => uint256) public batchNumberToId;
    
    // 用户地址 => 产品ID列表
    mapping(address => uint256[]) public userProducts;
    
    // 产品ID => 拥有者历史
    mapping(uint256 => address[]) public ownershipHistory;
    
    // ==================== 事件定义 ====================
    
    /**
     * @dev 产品创建事件
     */
    event ProductCreated(
        uint256 indexed productId,
        string name,
        address indexed manufacturer,
        string batchNumber
    );
    
    /**
     * @dev 供应链事件记录
     */
    event SupplyChainEventRecorded(
        uint256 indexed productId,
        address indexed actor,
        string eventType,
        string location,
        uint256 timestamp
    );
    
    /**
     * @dev 产品转移事件
     */
    event ProductTransferred(
        uint256 indexed productId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );
    
    /**
     * @dev 认证发行事件
     */
    event CertificationIssued(
        uint256 indexed productId,
        address indexed certifier,
        uint8 indexed certType,
        string certNumber
    );
    
    /**
     * @dev 批次创建事件
     */
    event BatchCreated(
        uint256 indexed batchId,
        string batchNumber,
        address indexed manufacturer,
        uint256 quantity
    );
    
    // ==================== 修饰符 ====================
    
    /**
     * @dev 仅认证机构可调用
     */
    modifier onlyCertifier() {
        require(certifiers[msg.sender], "Not authorized certifier");
        _;
    }
    
    /**
     * @dev 仅供应商可调用
     */
    modifier onlySupplier() {
        require(suppliers[msg.sender], "Not authorized supplier");
        _;
    }
    
    /**
     * @dev 仅制造商可调用
     */
    modifier onlyManufacturer() {
        require(manufacturers[msg.sender], "Not authorized manufacturer");
        _;
    }
    
    /**
     * @dev 仅产品拥有者可调用
     */
    modifier onlyProductOwner(uint256 _productId) {
        require(products[_productId].currentOwner == msg.sender, "Not product owner");
        _;
    }
    
    /**
     * @dev 检查产品存在
     */
    modifier productExists(uint256 _productId) {
        require(_productId > 0 && _productId <= _productIds.current(), "Product does not exist");
        _;
    }
    
    // ==================== 构造函数 ====================
    
    /**
     * @dev 构造函数
     */
    constructor() ERC721("Supply Chain Product", "SCP") {
        // 设置合约拥有者为认证机构、供应商和制造商
        certifiers[msg.sender] = true;
        suppliers[msg.sender] = true;
        manufacturers[msg.sender] = true;
    }
    
    // ==================== 产品管理功能 ====================
    
    /**
     * @dev 创建产品
     * @param _name 产品名称
     * @param _description 产品描述
     * @param _category 产品类别
     * @param _batchNumber 批次号
     * @param _carbonFootprint 碳足迹
     * @param _metadataURI 元数据URI
     * @return productId 产品ID
     */
    function createProduct(
        string memory _name,
        string memory _description,
        string memory _category,
        string memory _batchNumber,
        uint256 _carbonFootprint,
        string memory _metadataURI
    ) external onlyManufacturer whenNotPaused returns (uint256) {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_batchNumber).length > 0, "Batch number required");
        
        _productIds.increment();
        uint256 productId = _productIds.current();
        
        products[productId] = Product({
            productId: productId,
            name: _name,
            description: _description,
            category: _category,
            manufacturer: msg.sender,
            currentOwner: msg.sender,
            status: ProductStatus.RAW_MATERIAL,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            batchNumber: _batchNumber,
            carbonFootprint: _carbonFootprint,
            metadataURI: _metadataURI,
            isActive: true
        });
        
        userProducts[msg.sender].push(productId);
        ownershipHistory[productId].push(msg.sender);
        
        // 铸造NFT
        _safeMint(msg.sender, productId);
        _setTokenURI(productId, _metadataURI);
        
        // 记录创建事件
        _recordSupplyChainEvent(
            productId,
            "PRODUCT_CREATED",
            "Manufacturing Facility",
            "Product created and registered"
        );
        
        emit ProductCreated(productId, _name, msg.sender, _batchNumber);
        
        return productId;
    }
    
    /**
     * @dev 更新产品状态
     * @param _productId 产品ID
     * @param _newStatus 新状态
     * @param _location 位置
     * @param _description 描述
     */
    function updateProductStatus(
        uint256 _productId,
        ProductStatus _newStatus,
        string memory _location,
        string memory _description
    ) external productExists(_productId) whenNotPaused {
        Product storage product = products[_productId];
        require(product.isActive, "Product not active");
        require(
            product.currentOwner == msg.sender || 
            manufacturers[msg.sender] || 
            suppliers[msg.sender],
            "Not authorized"
        );
        
        ProductStatus oldStatus = product.status;
        product.status = _newStatus;
        product.updatedAt = block.timestamp;
        
        // 记录状态变更事件
        string memory eventType = string(abi.encodePacked(
            "STATUS_CHANGED_",
            _getStatusString(oldStatus),
            "_TO_",
            _getStatusString(_newStatus)
        ));
        
        _recordSupplyChainEvent(_productId, eventType, _location, _description);
    }
    
    /**
     * @dev 转移产品所有权
     * @param _productId 产品ID
     * @param _to 接收者地址
     * @param _location 转移地点
     * @param _description 转移描述
     */
    function transferProduct(
        uint256 _productId,
        address _to,
        string memory _location,
        string memory _description
    ) external onlyProductOwner(_productId) productExists(_productId) whenNotPaused {
        require(_to != address(0), "Invalid recipient");
        require(_to != msg.sender, "Cannot transfer to self");
        
        Product storage product = products[_productId];
        require(product.isActive, "Product not active");
        
        address from = product.currentOwner;
        product.currentOwner = _to;
        product.updatedAt = block.timestamp;
        
        // 更新用户产品列表
        userProducts[_to].push(_productId);
        ownershipHistory[_productId].push(_to);
        
        // 转移NFT
        _transfer(from, _to, _productId);
        
        // 记录转移事件
        _recordSupplyChainEvent(
            _productId,
            "OWNERSHIP_TRANSFERRED",
            _location,
            _description
        );
        
        emit ProductTransferred(_productId, from, _to, block.timestamp);
    }
    
    // ==================== 供应链事件记录 ====================
    
    /**
     * @dev 记录供应链事件
     * @param _productId 产品ID
     * @param _eventType 事件类型
     * @param _location 地点
     * @param _description 描述
     */
    function _recordSupplyChainEvent(
        uint256 _productId,
        string memory _eventType,
        string memory _location,
        string memory _description
    ) internal {
        bytes32 dataHash = keccak256(abi.encodePacked(
            _productId,
            _eventType,
            _location,
            _description,
            block.timestamp,
            msg.sender
        ));
        
        SupplyChainEvent memory newEvent = SupplyChainEvent({
            eventId: productEvents[_productId].length,
            productId: _productId,
            actor: msg.sender,
            eventType: _eventType,
            location: _location,
            timestamp: block.timestamp,
            description: _description,
            dataHash: dataHash,
            isVerified: false
        });
        
        productEvents[_productId].push(newEvent);
        
        emit SupplyChainEventRecorded(
            _productId,
            msg.sender,
            _eventType,
            _location,
            block.timestamp
        );
    }
    
    /**
     * @dev 手动记录供应链事件
     * @param _productId 产品ID
     * @param _eventType 事件类型
     * @param _location 地点
     * @param _description 描述
     */
    function recordEvent(
        uint256 _productId,
        string memory _eventType,
        string memory _location,
        string memory _description
    ) external productExists(_productId) whenNotPaused {
        Product memory product = products[_productId];
        require(
            product.currentOwner == msg.sender || 
            manufacturers[msg.sender] || 
            suppliers[msg.sender] ||
            certifiers[msg.sender],
            "Not authorized"
        );
        
        _recordSupplyChainEvent(_productId, _eventType, _location, _description);
    }
    
    // ==================== 认证管理功能 ====================
    
    /**
     * @dev 发行产品认证
     * @param _productId 产品ID
     * @param _certType 认证类型
     * @param _certNumber 认证编号
     * @param _validityPeriod 有效期 (秒)
     * @param _metadataURI 元数据URI
     */
    function issueCertification(
        uint256 _productId,
        CertificationType _certType,
        string memory _certNumber,
        uint256 _validityPeriod,
        string memory _metadataURI
    ) external onlyCertifier productExists(_productId) whenNotPaused {
        require(bytes(_certNumber).length > 0, "Cert number required");
        require(_validityPeriod > 0, "Invalid validity period");
        
        Certification memory newCert = Certification({
            certId: productCertifications[_productId].length,
            productId: _productId,
            certifier: msg.sender,
            certType: _certType,
            certNumber: _certNumber,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp.add(_validityPeriod),
            isValid: true,
            metadataURI: _metadataURI
        });
        
        productCertifications[_productId].push(newCert);
        
        // 记录认证事件
        _recordSupplyChainEvent(
            _productId,
            "CERTIFICATION_ISSUED",
            "Certification Authority",
            string(abi.encodePacked("Certification issued: ", _certNumber))
        );
        
        emit CertificationIssued(_productId, msg.sender, uint8(_certType), _certNumber);
    }
    
    /**
     * @dev 撤销认证
     * @param _productId 产品ID
     * @param _certId 认证ID
     */
    function revokeCertification(uint256 _productId, uint256 _certId) 
        external 
        onlyCertifier 
        productExists(_productId) 
        whenNotPaused 
    {
        require(_certId < productCertifications[_productId].length, "Invalid cert ID");
        
        Certification storage cert = productCertifications[_productId][_certId];
        require(cert.certifier == msg.sender, "Not cert issuer");
        require(cert.isValid, "Cert already revoked");
        
        cert.isValid = false;
        
        // 记录撤销事件
        _recordSupplyChainEvent(
            _productId,
            "CERTIFICATION_REVOKED",
            "Certification Authority",
            string(abi.encodePacked("Certification revoked: ", cert.certNumber))
        );
    }
    
    // ==================== 批次管理功能 ====================
    
    /**
     * @dev 创建生产批次
     * @param _batchNumber 批次号
     * @param _quantity 数量
     * @param _rawMaterials 原材料信息
     * @param _totalCarbonFootprint 总碳足迹
     * @return batchId 批次ID
     */
    function createBatch(
        string memory _batchNumber,
        uint256 _quantity,
        string memory _rawMaterials,
        uint256 _totalCarbonFootprint
    ) external onlyManufacturer whenNotPaused returns (uint256) {
        require(bytes(_batchNumber).length > 0, "Batch number required");
        require(_quantity > 0, "Quantity must be positive");
        require(batchNumberToId[_batchNumber] == 0, "Batch number exists");
        
        _batchIds.increment();
        uint256 batchId = _batchIds.current();
        
        batches[batchId] = Batch({
            batchId: batchId,
            batchNumber: _batchNumber,
            manufacturer: msg.sender,
            quantity: _quantity,
            createdAt: block.timestamp,
            rawMaterials: _rawMaterials,
            totalCarbonFootprint: _totalCarbonFootprint,
            isCompleted: false
        });
        
        batchNumberToId[_batchNumber] = batchId;
        
        emit BatchCreated(batchId, _batchNumber, msg.sender, _quantity);
        
        return batchId;
    }
    
    // ==================== 查询功能 ====================
    
    /**
     * @dev 获取产品信息
     * @param _productId 产品ID
     * @return product 产品信息
     */
    function getProduct(uint256 _productId) external view returns (Product memory) {
        return products[_productId];
    }
    
    /**
     * @dev 获取产品供应链事件
     * @param _productId 产品ID
     * @return events 事件列表
     */
    function getProductEvents(uint256 _productId) external view returns (SupplyChainEvent[] memory) {
        return productEvents[_productId];
    }
    
    /**
     * @dev 获取产品认证
     * @param _productId 产品ID
     * @return certifications 认证列表
     */
    function getProductCertifications(uint256 _productId) external view returns (Certification[] memory) {
        return productCertifications[_productId];
    }
    
    /**
     * @dev 获取产品拥有者历史
     * @param _productId 产品ID
     * @return owners 拥有者列表
     */
    function getOwnershipHistory(uint256 _productId) external view returns (address[] memory) {
        return ownershipHistory[_productId];
    }
    
    /**
     * @dev 获取用户产品列表
     * @param _user 用户地址
     * @return productIds 产品ID列表
     */
    function getUserProducts(address _user) external view returns (uint256[] memory) {
        return userProducts[_user];
    }
    
    /**
     * @dev 验证产品真实性
     * @param _productId 产品ID
     * @return isAuthentic 是否真实
     * @return verificationScore 验证分数
     */
    function verifyProductAuthenticity(uint256 _productId) external view returns (bool isAuthentic, uint256 verificationScore) {
        if (_productId == 0 || _productId > _productIds.current()) {
            return (false, 0);
        }
        
        Product memory product = products[_productId];
        if (!product.isActive) {
            return (false, 0);
        }
        
        // 计算验证分数
        uint256 score = 50; // 基础分数
        
        // 有制造商认证 +20分
        if (manufacturers[product.manufacturer]) {
            score = score.add(20);
        }
        
        // 有有效认证 +30分
        Certification[] memory certs = productCertifications[_productId];
        for (uint256 i = 0; i < certs.length; i++) {
            if (certs[i].isValid && certs[i].expiresAt > block.timestamp) {
                score = score.add(30);
                break;
            }
        }
        
        isAuthentic = score >= 70;
        verificationScore = score;
    }
    
    // ==================== 辅助函数 ====================
    
    /**
     * @dev 获取状态字符串
     * @param _status 状态枚举
     * @return statusString 状态字符串
     */
    function _getStatusString(ProductStatus _status) internal pure returns (string memory) {
        if (_status == ProductStatus.RAW_MATERIAL) return "RAW_MATERIAL";
        if (_status == ProductStatus.IN_PRODUCTION) return "IN_PRODUCTION";
        if (_status == ProductStatus.QUALITY_CHECK) return "QUALITY_CHECK";
        if (_status == ProductStatus.PACKAGED) return "PACKAGED";
        if (_status == ProductStatus.SHIPPED) return "SHIPPED";
        if (_status == ProductStatus.DELIVERED) return "DELIVERED";
        if (_status == ProductStatus.CONSUMED) return "CONSUMED";
        if (_status == ProductStatus.RECYCLED) return "RECYCLED";
        return "UNKNOWN";
    }
    
    // ==================== 管理功能 ====================
    
    /**
     * @dev 添加认证机构
     * @param _certifier 认证机构地址
     */
    function addCertifier(address _certifier) external onlyOwner {
        require(_certifier != address(0), "Invalid certifier");
        certifiers[_certifier] = true;
    }
    
    /**
     * @dev 添加供应商
     * @param _supplier 供应商地址
     */
    function addSupplier(address _supplier) external onlyOwner {
        require(_supplier != address(0), "Invalid supplier");
        suppliers[_supplier] = true;
    }
    
    /**
     * @dev 添加制造商
     * @param _manufacturer 制造商地址
     */
    function addManufacturer(address _manufacturer) external onlyOwner {
        require(_manufacturer != address(0), "Invalid manufacturer");
        manufacturers[_manufacturer] = true;
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
    
    // ==================== 重写函数 ====================
    
    /**
     * @dev 重写tokenURI函数
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev 重写_burn函数
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    /**
     * @dev 支持接口检查
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}