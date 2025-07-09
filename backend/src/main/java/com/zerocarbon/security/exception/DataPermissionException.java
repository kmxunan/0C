package com.zerocarbon.security.exception;

/**
 * 数据权限异常
 * 零碳园区数字孪生系统数据权限管理
 * 
 * @author 零碳园区数字孪生系统开发团队
 * @version 1.0
 * @since 2025-01-01
 */
public class DataPermissionException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 权限代码
     */
    private String permissionCode;
    
    /**
     * 资源类型
     */
    private String resourceType;
    
    /**
     * 资源ID
     */
    private String resourceId;
    
    /**
     * 用户ID
     */
    private Long userId;
    
    /**
     * 操作类型
     */
    private String operation;
    
    public DataPermissionException() {
        super();
    }
    
    public DataPermissionException(String message) {
        super(message);
    }
    
    public DataPermissionException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public DataPermissionException(Throwable cause) {
        super(cause);
    }
    
    public DataPermissionException(String message, String permissionCode) {
        super(message);
        this.permissionCode = permissionCode;
    }
    
    public DataPermissionException(String message, String permissionCode, String resourceType) {
        super(message);
        this.permissionCode = permissionCode;
        this.resourceType = resourceType;
    }
    
    public DataPermissionException(String message, String permissionCode, String resourceType, String resourceId) {
        super(message);
        this.permissionCode = permissionCode;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
    }
    
    public DataPermissionException(String message, Long userId, String operation, String resourceType) {
        super(message);
        this.userId = userId;
        this.operation = operation;
        this.resourceType = resourceType;
    }
    
    public DataPermissionException(String message, Long userId, String operation, String resourceType, String resourceId) {
        super(message);
        this.userId = userId;
        this.operation = operation;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
    }
    
    public DataPermissionException(String message, Long userId, String operation, String resourceType, String resourceId, String permissionCode) {
        super(message);
        this.userId = userId;
        this.operation = operation;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.permissionCode = permissionCode;
    }
    
    // Getters and Setters
    
    public String getPermissionCode() {
        return permissionCode;
    }
    
    public void setPermissionCode(String permissionCode) {
        this.permissionCode = permissionCode;
    }
    
    public String getResourceType() {
        return resourceType;
    }
    
    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }
    
    public String getResourceId() {
        return resourceId;
    }
    
    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public String getOperation() {
        return operation;
    }
    
    public void setOperation(String operation) {
        this.operation = operation;
    }
    
    /**
     * 获取详细的错误信息
     */
    public String getDetailedMessage() {
        StringBuilder sb = new StringBuilder();
        sb.append(getMessage());
        
        if (userId != null) {
            sb.append(" [用户ID: ").append(userId).append("]");
        }
        
        if (operation != null) {
            sb.append(" [操作: ").append(operation).append("]");
        }
        
        if (resourceType != null) {
            sb.append(" [资源类型: ").append(resourceType).append("]");
        }
        
        if (resourceId != null) {
            sb.append(" [资源ID: ").append(resourceId).append("]");
        }
        
        if (permissionCode != null) {
            sb.append(" [权限代码: ").append(permissionCode).append("]");
        }
        
        return sb.toString();
    }
    
    /**
     * 创建表级权限异常
     */
    public static DataPermissionException createTablePermissionException(Long userId, String operation, String tableName) {
        String message = String.format("用户 %d 没有对表 %s 执行 %s 操作的权限", userId, tableName, operation);
        return new DataPermissionException(message, userId, operation, tableName);
    }
    
    /**
     * 创建字段级权限异常
     */
    public static DataPermissionException createFieldPermissionException(Long userId, String operation, String tableName, String fieldName) {
        String message = String.format("用户 %d 没有对表 %s 字段 %s 执行 %s 操作的权限", userId, tableName, fieldName, operation);
        DataPermissionException exception = new DataPermissionException(message, userId, operation, tableName);
        exception.setPermissionCode(fieldName);
        return exception;
    }
    
    /**
     * 创建行级权限异常
     */
    public static DataPermissionException createRowPermissionException(Long userId, String operation, String tableName, String resourceId) {
        String message = String.format("用户 %d 没有对表 %s 资源 %s 执行 %s 操作的权限", userId, tableName, resourceId, operation);
        return new DataPermissionException(message, userId, operation, tableName, resourceId);
    }
    
    /**
     * 创建权限代码异常
     */
    public static DataPermissionException createPermissionCodeException(String permissionCode, String resourceType) {
        String message = String.format("缺少权限代码 %s 对资源类型 %s 的访问权限", permissionCode, resourceType);
        return new DataPermissionException(message, permissionCode, resourceType);
    }
    
    /**
     * 创建用户未认证异常
     */
    public static DataPermissionException createUnauthenticatedException() {
        return new DataPermissionException("用户未认证，无法进行权限检查");
    }
    
    /**
     * 创建权限配置错误异常
     */
    public static DataPermissionException createConfigurationException(String message) {
        return new DataPermissionException("权限配置错误: " + message);
    }
    
    /**
     * 创建权限检查失败异常
     */
    public static DataPermissionException createPermissionCheckFailedException(String message, Throwable cause) {
        return new DataPermissionException("权限检查失败: " + message, cause);
    }
    
    @Override
    public String toString() {
        return "DataPermissionException{" +
                "message='" + getMessage() + '\'' +
                ", permissionCode='" + permissionCode + '\'' +
                ", resourceType='" + resourceType + '\'' +
                ", resourceId='" + resourceId + '\'' +
                ", userId=" + userId +
                ", operation='" + operation + '\'' +
                '}';
    }
}