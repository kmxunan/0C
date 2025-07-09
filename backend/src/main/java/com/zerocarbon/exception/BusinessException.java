package com.zerocarbon.exception;

/**
 * 业务异常类
 * 用于处理应用程序中的业务逻辑异常
 * 
 * @author Zero Carbon Team
 * @version 1.0.0
 * @since 2024
 */
public class BusinessException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 错误代码
     */
    private String code;
    
    /**
     * 错误消息
     */
    private String message;
    
    /**
     * 错误详情
     */
    private Object details;
    
    /**
     * 构造函数
     */
    public BusinessException() {
        super();
    }
    
    /**
     * 构造函数
     * 
     * @param message 错误消息
     */
    public BusinessException(String message) {
        super(message);
        this.message = message;
        this.code = "BUSINESS_ERROR";
    }
    
    /**
     * 构造函数
     * 
     * @param code 错误代码
     * @param message 错误消息
     */
    public BusinessException(String code, String message) {
        super(message);
        this.code = code;
        this.message = message;
    }
    
    /**
     * 构造函数
     * 
     * @param code 错误代码
     * @param message 错误消息
     * @param details 错误详情
     */
    public BusinessException(String code, String message, Object details) {
        super(message);
        this.code = code;
        this.message = message;
        this.details = details;
    }
    
    /**
     * 构造函数
     * 
     * @param message 错误消息
     * @param cause 原因
     */
    public BusinessException(String message, Throwable cause) {
        super(message, cause);
        this.message = message;
        this.code = "BUSINESS_ERROR";
    }
    
    /**
     * 构造函数
     * 
     * @param code 错误代码
     * @param message 错误消息
     * @param cause 原因
     */
    public BusinessException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
        this.message = message;
    }
    
    /**
     * 构造函数
     * 
     * @param code 错误代码
     * @param message 错误消息
     * @param details 错误详情
     * @param cause 原因
     */
    public BusinessException(String code, String message, Object details, Throwable cause) {
        super(message, cause);
        this.code = code;
        this.message = message;
        this.details = details;
    }
    
    // Getter和Setter方法
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    @Override
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public Object getDetails() {
        return details;
    }
    
    public void setDetails(Object details) {
        this.details = details;
    }
    
    // 常用的静态工厂方法
    
    /**
     * 创建用户不存在异常
     */
    public static BusinessException userNotFound(String username) {
        return new BusinessException("USER_NOT_FOUND", "用户不存在: " + username);
    }
    
    /**
     * 创建用户已存在异常
     */
    public static BusinessException userAlreadyExists(String username) {
        return new BusinessException("USER_ALREADY_EXISTS", "用户已存在: " + username);
    }
    
    /**
     * 创建角色不存在异常
     */
    public static BusinessException roleNotFound(String roleCode) {
        return new BusinessException("ROLE_NOT_FOUND", "角色不存在: " + roleCode);
    }
    
    /**
     * 创建角色已存在异常
     */
    public static BusinessException roleAlreadyExists(String roleCode) {
        return new BusinessException("ROLE_ALREADY_EXISTS", "角色已存在: " + roleCode);
    }
    
    /**
     * 创建权限不存在异常
     */
    public static BusinessException permissionNotFound(String permissionCode) {
        return new BusinessException("PERMISSION_NOT_FOUND", "权限不存在: " + permissionCode);
    }
    
    /**
     * 创建权限已存在异常
     */
    public static BusinessException permissionAlreadyExists(String permissionCode) {
        return new BusinessException("PERMISSION_ALREADY_EXISTS", "权限已存在: " + permissionCode);
    }
    
    /**
     * 创建密码错误异常
     */
    public static BusinessException invalidPassword() {
        return new BusinessException("INVALID_PASSWORD", "密码错误");
    }
    
    /**
     * 创建账户被锁定异常
     */
    public static BusinessException accountLocked(String username) {
        return new BusinessException("ACCOUNT_LOCKED", "账户已被锁定: " + username);
    }
    
    /**
     * 创建账户被禁用异常
     */
    public static BusinessException accountDisabled(String username) {
        return new BusinessException("ACCOUNT_DISABLED", "账户已被禁用: " + username);
    }
    
    /**
     * 创建令牌无效异常
     */
    public static BusinessException invalidToken() {
        return new BusinessException("INVALID_TOKEN", "令牌无效或已过期");
    }
    
    /**
     * 创建会话无效异常
     */
    public static BusinessException invalidSession() {
        return new BusinessException("INVALID_SESSION", "会话无效或已过期");
    }
    
    /**
     * 创建权限不足异常
     */
    public static BusinessException insufficientPermission(String permission) {
        return new BusinessException("INSUFFICIENT_PERMISSION", "权限不足: " + permission);
    }
    
    /**
     * 创建数据不存在异常
     */
    public static BusinessException dataNotFound(String dataType, Object id) {
        return new BusinessException("DATA_NOT_FOUND", dataType + "不存在: " + id);
    }
    
    /**
     * 创建数据已存在异常
     */
    public static BusinessException dataAlreadyExists(String dataType, Object key) {
        return new BusinessException("DATA_ALREADY_EXISTS", dataType + "已存在: " + key);
    }
    
    /**
     * 创建参数无效异常
     */
    public static BusinessException invalidParameter(String parameterName, Object value) {
        return new BusinessException("INVALID_PARAMETER", "参数无效: " + parameterName + " = " + value);
    }
    
    /**
     * 创建操作不允许异常
     */
    public static BusinessException operationNotAllowed(String operation) {
        return new BusinessException("OPERATION_NOT_ALLOWED", "操作不允许: " + operation);
    }
    
    /**
     * 创建系统错误异常
     */
    public static BusinessException systemError(String message) {
        return new BusinessException("SYSTEM_ERROR", "系统错误: " + message);
    }
    
    /**
     * 创建配置错误异常
     */
    public static BusinessException configurationError(String configKey) {
        return new BusinessException("CONFIGURATION_ERROR", "配置错误: " + configKey);
    }
    
    /**
     * 创建外部服务错误异常
     */
    public static BusinessException externalServiceError(String serviceName, String message) {
        return new BusinessException("EXTERNAL_SERVICE_ERROR", 
                "外部服务错误 [" + serviceName + "]: " + message);
    }
    
    @Override
    public String toString() {
        return "BusinessException{" +
                "code='" + code + '\'' +
                ", message='" + message + '\'' +
                ", details=" + details +
                '}';
    }
}