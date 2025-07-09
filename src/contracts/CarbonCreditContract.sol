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
 * @title CarbonCreditContract
 * @dev 零碳园区碳信用数字化管理智能合约
 * 
 * 功能特性:
 * 1. 碳信用代币化发行与管理
 * 2. 碳减排项目认证与追踪
 * 3. 碳信用交易与转移
 * 4. 碳中和证明与验证
 * 5. 透明的碳足迹记录
 * 
 * @author VPP开发团队
 * @version 1.0.0
 */
contract CarbonCreditContract is ERC20, ERC721, ERC721URIStorage, Ownable, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    // ==================== 状态变量 ====================
    
    Counters.Counter private _projectIds;
    Counters.Counter private _creditIds;
    Counters.Counter private _offsetIds;
    
    // 碳信用单位精度 (1 tCO2e = 1e18)
    uint256 public constant CARBON_CREDIT_DECIMALS = 18;
    
    // 最小项目规模 (tCO2e)
    uint256 public minProjectSize = 100 * 10**CARBON_CREDIT_DECIMALS;
    
    // 最大项目规模 (tCO2e)
    uint256 public maxProjectSize = 1000000 * 10**CARBON_CREDIT_DECIMALS;
    
    // 项目验证期限 (秒)
    uint256 public projectValidityPeriod = 31536000; // 1年
    
    // 认证的验证机构
    mapping(address => bool) public certifiedVerifiers;
    
    // 认证的项目开发者
    mapping(address => bool) public certifiedDevelopers;
    
    // 碳信用价格 (wei per tCO2e)
    uint256 public carbonCreditPrice = 50 * 10**18; // 50 ETH per tCO2e
    
    // ==================== 数据结构 ====================
    
    /**
     * @dev 项目类型枚举
     */
    enum ProjectType {
        RENEWABLE_ENERGY,    // 可再生能源
        ENERGY_EFFICIENCY,   // 能效提升
        FORESTRY,           // 林业碳汇
        AGRICULTURE,        // 农业减排
        WASTE_MANAGEMENT,   // 废物管理
        INDUSTRIAL,         // 工业减排
        TRANSPORTATION,     // 交通减排
        BUILDING,           // 建筑减排
        OTHER               // 其他
    }
    
    /**
     * @dev 项目状态枚举
     */
    enum ProjectStatus {
        PROPOSED,           // 已提议
        UNDER_VALIDATION,   // 验证中
        VALIDATED,          // 已验证
        REGISTERED,         // 已注册
        ACTIVE,             // 活跃
        SUSPENDED,          // 暂停
        COMPLETED,          // 完成
        CANCELLED           // 取消
    }
    
    /**
     * @dev 碳信用状态枚举
     */
    enum CreditStatus {
        ISSUED,             // 已发行
        TRANSFERRED,        // 已转移
        RETIRED,            // 已退役
        CANCELLED           // 已取消
    }
    
    /**
     * @dev 碳减排项目结构
     */
    struct CarbonProject {
        uint256 projectId;          // 项目ID
        string name;                // 项目名称
        string description;         // 项目描述
        ProjectType projectType;    // 项目类型
        address developer;          // 项目开发者
        address verifier;           // 验证机构
        ProjectStatus status;       // 项目状态
        uint256 estimatedReduction; // 预计减排量 (tCO2e)
        uint256 actualReduction;    // 实际减排量 (tCO2e)
        uint256 issuedCredits;      // 已发行信用
        uint256 startDate;          // 开始日期
        uint256 endDate;            // 结束日期
        uint256 createdAt;          // 创建时间
        uint256 validatedAt;        // 验证时间
        string location;            // 项目位置
        string methodology;         // 方法学
        string metadataURI;         // 元数据URI
        bool isActive;              // 是否活跃
    }
    
    /**
     * @dev 碳信用结构
     */
    struct CarbonCredit {
        uint256 creditId;           // 信用ID
        uint256 projectId;          // 项目ID
        address issuer;             // 发行者
        address owner;              // 拥有者
        uint256 amount;             // 数量 (tCO2e)
        uint256 issuedAt;          // 发行时间
        uint256 validUntil;        // 有效期至
        CreditStatus status;        // 状态
        string vintage;             // 年份
        string serialNumber;       // 序列号
        string metadataURI;        // 元数据URI
        bool isRetired;            // 是否已退役
    }
    
    /**
     * @dev 碳中和记录结构
     */
    struct CarbonOffset {
        uint256 offsetId;           // 中和ID
        address entity;             // 中和实体
        uint256 creditId;           // 信用ID
        uint256 amount;             // 中和数量
        uint256 offsetAt;          // 中和时间
        string purpose;             // 中和目的
        string description;         // 描述
        bool isVerified;           // 是否已验证
        string metadataURI;        // 元数据URI
    }
    
    /**
     * @dev 验证记录结构
     */
    struct VerificationRecord {
        uint256 recordId;           // 记录ID
        uint256 projectId;          // 项目ID
        address verifier;           // 验证者
        uint256 verifiedAmount;     // 验证数量
        uint256 verifiedAt;        // 验证时间
        string verificationStandard; // 验证标准
        string reportURI;          // 报告URI
        bool isValid;              // 是否有效
    }
    
    // ==================== 映射存储 ====================
    
    // 项目ID => 项目信息
    mapping(uint256 => CarbonProject) public projects;
    
    // 信用ID => 信用信息
    mapping(uint256 => CarbonCredit) public credits;
    
    // 中和ID => 中和记录
    mapping(uint256 => CarbonOffset) public offsets;
    
    // 项目ID => 验证记录列表
    mapping(uint256 => VerificationRecord[]) public projectVerifications;
    
    // 用户地址 => 项目ID列表
    mapping(address => uint256[]) public userProjects;
    
    // 用户地址 => 信用ID列表
    mapping(address => uint256[]) public userCredits;
    
    // 用户地址 => 中和ID列表
    mapping(address => uint256[]) public userOffsets;
    
    // 项目ID => 信用ID列表
    mapping(uint256 => uint256[]) public projectCredits;
    
    // 年份 => 总发行量
    mapping(string => uint256) public vintageIssuance;
    
    // 用户地址 => 总碳足迹
    mapping(address => uint256) public userCarbonFootprint;
    
    // 用户地址 => 总中和量
    mapping(address => uint256) public userTotalOffset;
    
    // ==================== 事件定义 ====================
    
    /**
     * @dev 项目创建事件
     */
    event ProjectCreated(
        uint256 indexed projectId,
        string name,
        address indexed developer,
        uint8 indexed projectType,
        uint256 estimatedReduction
    );
    
    /**
     * @dev 项目验证事件
     */
    event ProjectValidated(
        uint256 indexed projectId,
        address indexed verifier,
        uint256 verifiedAmount,
        uint256 timestamp
    );
    
    /**
     * @dev 碳信用发行事件
     */
    event CreditIssued(
        uint256 indexed creditId,
        uint256 indexed projectId,
        address indexed owner,
        uint256 amount,
        string vintage
    );
    
    /**
     * @dev 碳信用转移事件
     */
    event CreditTransferred(
        uint256 indexed creditId,
        address indexed from,
        address indexed to,
        uint256 amount
    );
    
    /**
     * @dev 碳中和事件
     */
    event CarbonOffset(
        uint256 indexed offsetId,
        address indexed entity,
        uint256 indexed creditId,
        uint256 amount,
        string purpose
    );
    
    /**
     * @dev 价格更新事件
     */
    event PriceUpdated(
        uint256 newPrice,
        uint256 timestamp
    );
    
    // ==================== 修饰符 ====================
    
    /**
     * @dev 仅认证验证机构
     */
    modifier onlyCertifiedVerifier() {
        require(certifiedVerifiers[msg.sender], "Not a certified verifier");
        _;
    }
    
    /**
     * @dev 仅认证开发者
     */
    modifier onlyCertifiedDeveloper() {
        require(certifiedDevelopers[msg.sender], "Not a certified developer");
        _;
    }
    
    /**
     * @dev 仅有效项目
     */
    modifier onlyValidProject(uint256 projectId) {
        require(projects[projectId].projectId != 0, "Project does not exist");
        require(projects[projectId].isActive, "Project not active");
        _;
    }
    
    /**
     * @dev 仅有效信用
     */
    modifier onlyValidCredit(uint256 creditId) {
        require(credits[creditId].creditId != 0, "Credit does not exist");
        require(!credits[creditId].isRetired, "Credit is retired");
        require(block.timestamp <= credits[creditId].validUntil, "Credit expired");
        _;
    }
    
    // ==================== 构造函数 ====================
    
    /**
     * @dev 构造函数
     */
    constructor() 
        ERC20("Carbon Credit Token", "CCT")
        ERC721("Carbon Credit NFT", "CCNFT")
    {
        // 初始化合约
    }
    
    // ==================== 项目管理 ====================
    
    /**
     * @dev 创建碳减排项目
     * @param name 项目名称
     * @param description 项目描述
     * @param projectType 项目类型
     * @param estimatedReduction 预计减排量
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @param location 项目位置
     * @param methodology 方法学
     * @param metadataURI 元数据URI
     */
    function createProject(
        string memory name,
        string memory description,
        uint8 projectType,
        uint256 estimatedReduction,
        uint256 startDate,
        uint256 endDate,
        string memory location,
        string memory methodology,
        string memory metadataURI
    ) external onlyCertifiedDeveloper whenNotPaused {
        require(estimatedReduction >= minProjectSize && estimatedReduction <= maxProjectSize, "Invalid project size");
        require(endDate > startDate, "Invalid date range");
        require(projectType <= uint8(ProjectType.OTHER), "Invalid project type");
        
        _projectIds.increment();
        uint256 projectId = _projectIds.current();
        
        projects[projectId] = CarbonProject({
            projectId: projectId,
            name: name,
            description: description,
            projectType: ProjectType(projectType),
            developer: msg.sender,
            verifier: address(0),
            status: ProjectStatus.PROPOSED,
            estimatedReduction: estimatedReduction,
            actualReduction: 0,
            issuedCredits: 0,
            startDate: startDate,
            endDate: endDate,
            createdAt: block.timestamp,
            validatedAt: 0,
            location: location,
            methodology: methodology,
            metadataURI: metadataURI,
            isActive: true
        });
        
        userProjects[msg.sender].push(projectId);
        
        emit ProjectCreated(
            projectId,
            name,
            msg.sender,
            projectType,
            estimatedReduction
        );
    }
    
    /**
     * @dev 验证项目
     * @param projectId 项目ID
     * @param verifiedAmount 验证减排量
     * @param verificationStandard 验证标准
     * @param reportURI 报告URI
     */
    function validateProject(
        uint256 projectId,
        uint256 verifiedAmount,
        string memory verificationStandard,
        string memory reportURI
    ) external onlyCertifiedVerifier onlyValidProject(projectId) {
        CarbonProject storage project = projects[projectId];
        require(project.status == ProjectStatus.PROPOSED || project.status == ProjectStatus.UNDER_VALIDATION, "Invalid project status");
        require(verifiedAmount <= project.estimatedReduction, "Verified amount exceeds estimate");
        
        project.verifier = msg.sender;
        project.status = ProjectStatus.VALIDATED;
        project.actualReduction = verifiedAmount;
        project.validatedAt = block.timestamp;
        
        // 创建验证记录
        VerificationRecord memory verification = VerificationRecord({
            recordId: projectVerifications[projectId].length,
            projectId: projectId,
            verifier: msg.sender,
            verifiedAmount: verifiedAmount,
            verifiedAt: block.timestamp,
            verificationStandard: verificationStandard,
            reportURI: reportURI,
            isValid: true
        });
        
        projectVerifications[projectId].push(verification);
        
        emit ProjectValidated(
            projectId,
            msg.sender,
            verifiedAmount,
            block.timestamp
        );
    }
    
    /**
     * @dev 注册项目
     * @param projectId 项目ID
     */
    function registerProject(uint256 projectId) external onlyOwner onlyValidProject(projectId) {
        CarbonProject storage project = projects[projectId];
        require(project.status == ProjectStatus.VALIDATED, "Project not validated");
        
        project.status = ProjectStatus.REGISTERED;
    }
    
    // ==================== 碳信用发行 ====================
    
    /**
     * @dev 发行碳信用
     * @param projectId 项目ID
     * @param amount 发行数量
     * @param vintage 年份
     * @param validityPeriod 有效期 (秒)
     * @param metadataURI 元数据URI
     */
    function issueCredit(
        uint256 projectId,
        uint256 amount,
        string memory vintage,
        uint256 validityPeriod,
        string memory metadataURI
    ) external onlyValidProject(projectId) nonReentrant {
        CarbonProject storage project = projects[projectId];
        require(project.status == ProjectStatus.REGISTERED || project.status == ProjectStatus.ACTIVE, "Project not ready for issuance");
        require(project.developer == msg.sender || owner() == msg.sender, "Not authorized to issue");
        require(project.issuedCredits.add(amount) <= project.actualReduction, "Exceeds verified reduction");
        
        _creditIds.increment();
        uint256 creditId = _creditIds.current();
        
        // 生成序列号
        string memory serialNumber = string(abi.encodePacked(
            "CC-",
            _toString(projectId),
            "-",
            vintage,
            "-",
            _toString(creditId)
        ));
        
        credits[creditId] = CarbonCredit({
            creditId: creditId,
            projectId: projectId,
            issuer: msg.sender,
            owner: msg.sender,
            amount: amount,
            issuedAt: block.timestamp,
            validUntil: block.timestamp.add(validityPeriod),
            status: CreditStatus.ISSUED,
            vintage: vintage,
            serialNumber: serialNumber,
            metadataURI: metadataURI,
            isRetired: false
        });
        
        project.issuedCredits = project.issuedCredits.add(amount);
        project.status = ProjectStatus.ACTIVE;
        
        userCredits[msg.sender].push(creditId);
        projectCredits[projectId].push(creditId);
        vintageIssuance[vintage] = vintageIssuance[vintage].add(amount);
        
        // 铸造ERC20代币
        _mint(msg.sender, amount);
        
        // 铸造ERC721 NFT
        _safeMint(msg.sender, creditId);
        _setTokenURI(creditId, metadataURI);
        
        emit CreditIssued(
            creditId,
            projectId,
            msg.sender,
            amount,
            vintage
        );
    }
    
    /**
     * @dev 转移碳信用
     * @param creditId 信用ID
     * @param to 接收者地址
     * @param amount 转移数量
     */
    function transferCredit(
        uint256 creditId,
        address to,
        uint256 amount
    ) external onlyValidCredit(creditId) nonReentrant {
        CarbonCredit storage credit = credits[creditId];
        require(credit.owner == msg.sender, "Not credit owner");
        require(amount <= credit.amount, "Insufficient credit amount");
        require(to != address(0), "Invalid recipient");
        
        if (amount == credit.amount) {
            // 完全转移
            credit.owner = to;
            credit.status = CreditStatus.TRANSFERRED;
            
            userCredits[to].push(creditId);
            _removeCreditFromUser(msg.sender, creditId);
            
            // 转移NFT
            safeTransferFrom(msg.sender, to, creditId);
        } else {
            // 部分转移 - 创建新的信用记录
            _creditIds.increment();
            uint256 newCreditId = _creditIds.current();
            
            credits[newCreditId] = CarbonCredit({
                creditId: newCreditId,
                projectId: credit.projectId,
                issuer: credit.issuer,
                owner: to,
                amount: amount,
                issuedAt: credit.issuedAt,
                validUntil: credit.validUntil,
                status: CreditStatus.TRANSFERRED,
                vintage: credit.vintage,
                serialNumber: string(abi.encodePacked(credit.serialNumber, "-SPLIT-", _toString(newCreditId))),
                metadataURI: credit.metadataURI,
                isRetired: false
            });
            
            credit.amount = credit.amount.sub(amount);
            
            userCredits[to].push(newCreditId);
            projectCredits[credit.projectId].push(newCreditId);
            
            // 铸造新的NFT给接收者
            _safeMint(to, newCreditId);
            _setTokenURI(newCreditId, credit.metadataURI);
            
            emit CreditIssued(
                newCreditId,
                credit.projectId,
                to,
                amount,
                credit.vintage
            );
        }
        
        // 转移ERC20代币
        _transfer(msg.sender, to, amount);
        
        emit CreditTransferred(
            creditId,
            msg.sender,
            to,
            amount
        );
    }
    
    // ==================== 碳中和 ====================
    
    /**
     * @dev 执行碳中和
     * @param creditId 信用ID
     * @param amount 中和数量
     * @param purpose 中和目的
     * @param description 描述
     */
    function offsetCarbon(
        uint256 creditId,
        uint256 amount,
        string memory purpose,
        string memory description
    ) external onlyValidCredit(creditId) nonReentrant {
        CarbonCredit storage credit = credits[creditId];
        require(credit.owner == msg.sender, "Not credit owner");
        require(amount <= credit.amount, "Insufficient credit amount");
        
        _offsetIds.increment();
        uint256 offsetId = _offsetIds.current();
        
        offsets[offsetId] = CarbonOffset({
            offsetId: offsetId,
            entity: msg.sender,
            creditId: creditId,
            amount: amount,
            offsetAt: block.timestamp,
            purpose: purpose,
            description: description,
            isVerified: true,
            metadataURI: ""
        });
        
        // 更新信用状态
        if (amount == credit.amount) {
            credit.isRetired = true;
            credit.status = CreditStatus.RETIRED;
        } else {
            credit.amount = credit.amount.sub(amount);
        }
        
        // 更新用户统计
        userTotalOffset[msg.sender] = userTotalOffset[msg.sender].add(amount);
        userOffsets[msg.sender].push(offsetId);
        
        // 销毁对应的ERC20代币
        _burn(msg.sender, amount);
        
        emit CarbonOffset(
            offsetId,
            msg.sender,
            creditId,
            amount,
            purpose
        );
    }
    
    /**
     * @dev 批量碳中和
     * @param creditIds 信用ID列表
     * @param amounts 中和数量列表
     * @param purpose 中和目的
     * @param description 描述
     */
    function batchOffsetCarbon(
        uint256[] memory creditIds,
        uint256[] memory amounts,
        string memory purpose,
        string memory description
    ) external nonReentrant {
        require(creditIds.length == amounts.length, "Array length mismatch");
        require(creditIds.length > 0, "Empty arrays");
        
        for (uint256 i = 0; i < creditIds.length; i++) {
            offsetCarbon(creditIds[i], amounts[i], purpose, description);
        }
    }
    
    // ==================== 查询功能 ====================
    
    /**
     * @dev 获取项目信息
     * @param projectId 项目ID
     */
    function getProject(uint256 projectId) external view returns (CarbonProject memory) {
        return projects[projectId];
    }
    
    /**
     * @dev 获取信用信息
     * @param creditId 信用ID
     */
    function getCredit(uint256 creditId) external view returns (CarbonCredit memory) {
        return credits[creditId];
    }
    
    /**
     * @dev 获取中和记录
     * @param offsetId 中和ID
     */
    function getOffset(uint256 offsetId) external view returns (CarbonOffset memory) {
        return offsets[offsetId];
    }
    
    /**
     * @dev 获取用户项目列表
     * @param user 用户地址
     */
    function getUserProjects(address user) external view returns (uint256[] memory) {
        return userProjects[user];
    }
    
    /**
     * @dev 获取用户信用列表
     * @param user 用户地址
     */
    function getUserCredits(address user) external view returns (uint256[] memory) {
        return userCredits[user];
    }
    
    /**
     * @dev 获取用户中和记录
     * @param user 用户地址
     */
    function getUserOffsets(address user) external view returns (uint256[] memory) {
        return userOffsets[user];
    }
    
    /**
     * @dev 获取项目验证记录
     * @param projectId 项目ID
     */
    function getProjectVerifications(uint256 projectId) external view returns (VerificationRecord[] memory) {
        return projectVerifications[projectId];
    }
    
    /**
     * @dev 获取年份发行统计
     * @param vintage 年份
     */
    function getVintageIssuance(string memory vintage) external view returns (uint256) {
        return vintageIssuance[vintage];
    }
    
    /**
     * @dev 获取用户碳足迹和中和统计
     * @param user 用户地址
     */
    function getUserCarbonStats(address user) external view returns (
        uint256 totalFootprint,
        uint256 totalOffset,
        uint256 netEmissions,
        bool isNeutral
    ) {
        totalFootprint = userCarbonFootprint[user];
        totalOffset = userTotalOffset[user];
        
        if (totalOffset >= totalFootprint) {
            netEmissions = 0;
            isNeutral = true;
        } else {
            netEmissions = totalFootprint.sub(totalOffset);
            isNeutral = false;
        }
    }
    
    // ==================== 管理功能 ====================
    
    /**
     * @dev 添加认证验证机构
     * @param verifier 验证机构地址
     */
    function addCertifiedVerifier(address verifier) external onlyOwner {
        certifiedVerifiers[verifier] = true;
    }
    
    /**
     * @dev 移除认证验证机构
     * @param verifier 验证机构地址
     */
    function removeCertifiedVerifier(address verifier) external onlyOwner {
        certifiedVerifiers[verifier] = false;
    }
    
    /**
     * @dev 添加认证开发者
     * @param developer 开发者地址
     */
    function addCertifiedDeveloper(address developer) external onlyOwner {
        certifiedDevelopers[developer] = true;
    }
    
    /**
     * @dev 移除认证开发者
     * @param developer 开发者地址
     */
    function removeCertifiedDeveloper(address developer) external onlyOwner {
        certifiedDevelopers[developer] = false;
    }
    
    /**
     * @dev 设置碳信用价格
     * @param newPrice 新价格
     */
    function setCarbonCreditPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be positive");
        carbonCreditPrice = newPrice;
        
        emit PriceUpdated(newPrice, block.timestamp);
    }
    
    /**
     * @dev 设置项目规模限制
     * @param newMinSize 新的最小规模
     * @param newMaxSize 新的最大规模
     */
    function setProjectSizeLimits(uint256 newMinSize, uint256 newMaxSize) external onlyOwner {
        require(newMinSize < newMaxSize, "Invalid size limits");
        minProjectSize = newMinSize;
        maxProjectSize = newMaxSize;
    }
    
    /**
     * @dev 更新用户碳足迹
     * @param user 用户地址
     * @param footprint 碳足迹
     */
    function updateUserCarbonFootprint(address user, uint256 footprint) external onlyOwner {
        userCarbonFootprint[user] = footprint;
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
     * @dev 从用户信用列表中移除信用
     * @param user 用户地址
     * @param creditId 信用ID
     */
    function _removeCreditFromUser(address user, uint256 creditId) internal {
        uint256[] storage userCreditList = userCredits[user];
        for (uint256 i = 0; i < userCreditList.length; i++) {
            if (userCreditList[i] == creditId) {
                userCreditList[i] = userCreditList[userCreditList.length - 1];
                userCreditList.pop();
                break;
            }
        }
    }
    
    /**
     * @dev 将数字转换为字符串
     * @param value 数值
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
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
    
    /**
     * @dev 重写_beforeTokenTransfer函数
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}