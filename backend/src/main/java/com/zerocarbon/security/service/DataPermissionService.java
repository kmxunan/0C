package com.zerocarbon.security.service;

import com.zerocarbon.security.entity.DataPermission;
import com.zerocarbon.security.entity.Role;
import com.zerocarbon.security.entity.User;
import com.zerocarbon.security.repository.DataPermissionRepository;
import com.zerocarbon.security.repository.RoleRepository;
import com.zerocarbon.security.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * 数据权限服务类
 * 零碳园区数字孪生系统数据权限管理
 */
@Service
@Transactional
public class DataPermissionService {
    
    @Autowired
    private DataPermissionRepository dataPermissionRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    // 脱敏规则模式
    private static final Map<String, Pattern> MASK_PATTERNS = new HashMap<>();
    
    static {
        MASK_PATTERNS.put("phone", Pattern.compile("(\\d{3})\\d{4}(\\d{4})"));
        MASK_PATTERNS.put("email", Pattern.compile("(\\w{1,3})\\w*@(\\w+\\.\\w+)"));
        MASK_PATTERNS.put("idcard", Pattern.compile("(\\d{6})\\d{8}(\\d{4})"));
        MASK_PATTERNS.put("bankcard", Pattern.compile("(\\d{4})\\d*(\\d{4})"));
    }
    
    /**
     * 创建数据权限
     */
    public DataPermission createDataPermission(DataPermission dataPermission) {
        validateDataPermissionForCreation(dataPermission);
        
        // 设置默认值
        if (dataPermission.getEnabled() == null) {
            dataPermission.setEnabled(true);
        }
        if (dataPermission.getPriority() == null) {
            dataPermission.setPriority(0);
        }
        if (dataPermission.getDataScope() == null) {
            dataPermission.setDataScope(DataPermission.DataScope.ALL);
        }
        
        // 检查权限冲突
        checkPermissionConflict(dataPermission);
        
        return dataPermissionRepository.save(dataPermission);
    }
    
    /**
     * 更新数据权限
     */
    public DataPermission updateDataPermission(Long permissionId, DataPermission permissionDetails) {
        DataPermission existingPermission = getDataPermissionById(permissionId);
        
        // 更新基本信息
        if (permissionDetails.getPermissionType() != null) {
            existingPermission.setPermissionType(permissionDetails.getPermissionType());
        }
        
        if (StringUtils.hasText(permissionDetails.getDataFilter())) {
            validateDataFilter(permissionDetails.getDataFilter());
            existingPermission.setDataFilter(permissionDetails.getDataFilter());
        }
        
        if (StringUtils.hasText(permissionDetails.getMaskRule())) {
            validateMaskRule(permissionDetails.getMaskRule());
            existingPermission.setMaskRule(permissionDetails.getMaskRule());
        }
        
        if (permissionDetails.getDataScope() != null) {
            existingPermission.setDataScope(permissionDetails.getDataScope());
        }
        
        if (permissionDetails.getPriority() != null) {
            existingPermission.setPriority(permissionDetails.getPriority());
        }
        
        if (permissionDetails.getEnabled() != null) {
            existingPermission.setEnabled(permissionDetails.getEnabled());
        }
        
        if (permissionDetails.getEffectiveTime() != null) {
            existingPermission.setEffectiveTime(permissionDetails.getEffectiveTime());
        }
        
        if (permissionDetails.getExpireTime() != null) {
            existingPermission.setExpireTime(permissionDetails.getExpireTime());
        }
        
        // 检查权限冲突
        checkPermissionConflict(existingPermission);
        
        return dataPermissionRepository.save(existingPermission);
    }
    
    /**
     * 删除数据权限
     */
    public void deleteDataPermission(Long permissionId) {
        DataPermission permission = getDataPermissionById(permissionId);
        dataPermissionRepository.delete(permission);
    }
    
    /**
     * 启用数据权限
     */
    public void enableDataPermission(Long permissionId) {
        DataPermission permission = getDataPermissionById(permissionId);
        permission.setEnabled(true);
        dataPermissionRepository.save(permission);
    }
    
    /**
     * 禁用数据权限
     */
    public void disableDataPermission(Long permissionId) {
        DataPermission permission = getDataPermissionById(permissionId);
        permission.setEnabled(false);
        dataPermissionRepository.save(permission);
    }
    
    /**
     * 批量创建数据权限
     */
    public List<DataPermission> batchCreateDataPermissions(List<DataPermission> dataPermissions) {
        List<DataPermission> createdPermissions = new ArrayList<>();;
        
        for (DataPermission permission : dataPermissions) {
            try {
                createdPermissions.add(createDataPermission(permission));
            } catch (Exception e) {
                // 记录错误但继续处理其他权限
                System.err.println("创建数据权限失败: " + e.getMessage());
            }
        }
        
        return createdPermissions;
    }
    
    /**
     * 复制数据权限
     */
    public DataPermission copyDataPermission(Long sourcePermissionId, Long targetRoleId) {
        DataPermission sourcePermission = getDataPermissionById(sourcePermissionId);
        
        // 检查目标角色是否存在
        Role targetRole = roleRepository.findById(targetRoleId)
            .orElseThrow(() -> new IllegalArgumentException("目标角色不存在: " + targetRoleId));
        
        // 创建新的数据权限
        DataPermission newPermission = new DataPermission();
        newPermission.setRoleId(targetRoleId);
        newPermission.setTableName(sourcePermission.getTableName());
        newPermission.setFieldName(sourcePermission.getFieldName());
        newPermission.setPermissionType(sourcePermission.getPermissionType());
        newPermission.setDataFilter(sourcePermission.getDataFilter());
        newPermission.setMaskRule(sourcePermission.getMaskRule());
        newPermission.setDataScope(sourcePermission.getDataScope());
        newPermission.setEnabled(true);
        newPermission.setPriority(sourcePermission.getPriority());
        newPermission.setEffectiveTime(sourcePermission.getEffectiveTime());
        newPermission.setExpireTime(sourcePermission.getExpireTime());
        
        return dataPermissionRepository.save(newPermission);
    }
    
    /**
     * 查询数据权限
     */
    @Transactional(readOnly = true)
    public DataPermission getDataPermissionById(Long permissionId) {
        return dataPermissionRepository.findById(permissionId)
            .orElseThrow(() -> new IllegalArgumentException("数据权限不存在: " + permissionId));
    }
    
    @Transactional(readOnly = true)
    public List<DataPermission> getDataPermissionsByRole(Long roleId) {
        return dataPermissionRepository.findByRoleId(roleId);
    }
    
    @Transactional(readOnly = true)
    public List<DataPermission> getDataPermissionsByTable(String tableName) {
        return dataPermissionRepository.findByTableName(tableName);
    }
    
    @Transactional(readOnly = true)
    public List<DataPermission> getEffectiveDataPermissions(Long roleId, String tableName) {
        LocalDateTime now = LocalDateTime.now();
        return dataPermissionRepository.findEffectivePermissionsByRoleIdAndTableName(roleId, tableName, now);
    }
    
    @Transactional(readOnly = true)
    public List<DataPermission> getUserDataPermissions(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + userId));
        
        List<Long> roleIds = user.getRoles().stream()
            .map(Role::getId)
            .collect(Collectors.toList());
        
        return dataPermissionRepository.findByRoleIds(roleIds);
    }
    
    /**
     * 数据权限检查
     */
    @Transactional(readOnly = true)
    public boolean canAccessField(Long userId, String tableName, String fieldName) {
        List<DataPermission> userPermissions = getUserEffectiveDataPermissions(userId, tableName, fieldName);
        
        // 检查是否有拒绝权限
        boolean hasDenyPermission = userPermissions.stream()
            .anyMatch(permission -> permission.getPermissionType() == DataPermission.DataPermissionType.DENY);
        
        if (hasDenyPermission) {
            return false;
        }
        
        // 检查是否有读取权限
        return userPermissions.stream()
            .anyMatch(permission -> 
                permission.getPermissionType() == DataPermission.DataPermissionType.READ ||
                permission.getPermissionType() == DataPermission.DataPermissionType.WRITE
            );
    }
    
    @Transactional(readOnly = true)
    public boolean canWriteField(Long userId, String tableName, String fieldName) {
        List<DataPermission> userPermissions = getUserEffectiveDataPermissions(userId, tableName, fieldName);
        
        // 检查是否有拒绝权限
        boolean hasDenyPermission = userPermissions.stream()
            .anyMatch(permission -> permission.getPermissionType() == DataPermission.DataPermissionType.DENY);
        
        if (hasDenyPermission) {
            return false;
        }
        
        // 检查是否有写入权限
        return userPermissions.stream()
            .anyMatch(permission -> permission.getPermissionType() == DataPermission.DataPermissionType.WRITE);
    }
    
    @Transactional(readOnly = true)
    public boolean needsMasking(Long userId, String tableName, String fieldName) {
        List<DataPermission> userPermissions = getUserEffectiveDataPermissions(userId, tableName, fieldName);
        
        return userPermissions.stream()
            .anyMatch(permission -> permission.getPermissionType() == DataPermission.DataPermissionType.MASK);
    }
    
    /**
     * 数据脱敏
     */
    @Transactional(readOnly = true)
    public String maskFieldValue(Long userId, String tableName, String fieldName, String originalValue) {
        if (!StringUtils.hasText(originalValue)) {
            return originalValue;
        }
        
        List<DataPermission> userPermissions = getUserEffectiveDataPermissions(userId, tableName, fieldName);
        
        // 查找脱敏权限
        Optional<DataPermission> maskPermission = userPermissions.stream()
            .filter(permission -> permission.getPermissionType() == DataPermission.DataPermissionType.MASK)
            .findFirst();
        
        if (maskPermission.isPresent() && StringUtils.hasText(maskPermission.get().getMaskRule())) {
            return applyMaskRule(originalValue, maskPermission.get().getMaskRule());
        }
        
        return originalValue;
    }
    
    /**
     * 重载方法：根据字段名进行脱敏
     */
    @Transactional(readOnly = true)
    public String maskFieldValue(String originalValue, String fieldName) {
        if (!StringUtils.hasText(originalValue)) {
            return originalValue;
        }
        
        // 根据字段名应用默认脱敏规则
        String maskRule = getDefaultMaskRuleByFieldName(fieldName);
        if (maskRule != null) {
            return applyMaskRule(originalValue, maskRule);
        }
        
        return originalValue;
    }
    
    /**
     * 数据过滤
     */
    @Transactional(readOnly = true)
    public String getDataFilter(Long userId, String tableName) {
        List<DataPermission> userPermissions = getUserEffectiveDataPermissions(userId, tableName, null);
        
        List<String> filters = userPermissions.stream()
            .filter(permission -> StringUtils.hasText(permission.getDataFilter()))
            .map(DataPermission::getDataFilter)
            .collect(Collectors.toList());
        
        if (filters.isEmpty()) {
            return null;
        }
        
        // 合并多个过滤条件
        return "(" + String.join(") AND (", filters) + ")";
    }
    
    /**
     * 权限统计
     */
    @Transactional(readOnly = true)
    public Long getActiveDataPermissionCount() {
        return dataPermissionRepository.countActiveDataPermissions();
    }
    
    @Transactional(readOnly = true)
    public Map<DataPermission.DataPermissionType, Long> getDataPermissionCountByType() {
        List<Object[]> results = dataPermissionRepository.countDataPermissionsByType();
        return results.stream()
            .collect(Collectors.toMap(
                result -> (DataPermission.DataPermissionType) result[0],
                result -> (Long) result[1]
            ));
    }
    
    @Transactional(readOnly = true)
    public Map<DataPermission.DataScope, Long> getDataPermissionCountByScope() {
        List<Object[]> results = dataPermissionRepository.countDataPermissionsByScope();
        return results.stream()
            .collect(Collectors.toMap(
                result -> (DataPermission.DataScope) result[0],
                result -> (Long) result[1]
            ));
    }
    
    /**
     * 权限维护
     */
    public void cleanupExpiredPermissions() {
        LocalDateTime now = LocalDateTime.now();
        dataPermissionRepository.deleteExpiredPermissions(now);
    }
    
    @Transactional(readOnly = true)
    public List<DataPermission> getExpiringPermissions(int daysBeforeExpiry) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.plusDays(daysBeforeExpiry);
        return dataPermissionRepository.findExpiringPermissions(now, threshold);
    }
    
    @Transactional(readOnly = true)
    public List<DataPermission> getConflictingPermissions() {
        List<Object[]> conflicts = dataPermissionRepository.findConflictingPermissions();
        return conflicts.stream()
            .flatMap(conflict -> Arrays.stream(conflict))
            .map(obj -> (DataPermission) obj)
            .collect(Collectors.toList());
    }
    
    // 私有辅助方法
    
    private void validateDataPermissionForCreation(DataPermission dataPermission) {
        if (dataPermission.getRoleId() == null) {
            throw new IllegalArgumentException("角色ID不能为空");
        }
        
        if (!StringUtils.hasText(dataPermission.getTableName())) {
            throw new IllegalArgumentException("表名不能为空");
        }
        
        if (!StringUtils.hasText(dataPermission.getFieldName())) {
            throw new IllegalArgumentException("字段名不能为空");
        }
        
        if (dataPermission.getPermissionType() == null) {
            throw new IllegalArgumentException("权限类型不能为空");
        }
        
        // 验证角色是否存在
        if (!roleRepository.existsById(dataPermission.getRoleId())) {
            throw new IllegalArgumentException("角色不存在: " + dataPermission.getRoleId());
        }
        
        // 验证数据过滤条件
        if (StringUtils.hasText(dataPermission.getDataFilter())) {
            validateDataFilter(dataPermission.getDataFilter());
        }
        
        // 验证脱敏规则
        if (StringUtils.hasText(dataPermission.getMaskRule())) {
            validateMaskRule(dataPermission.getMaskRule());
        }
        
        // 验证时间范围
        if (dataPermission.getEffectiveTime() != null && dataPermission.getExpireTime() != null) {
            if (dataPermission.getEffectiveTime().isAfter(dataPermission.getExpireTime())) {
                throw new IllegalArgumentException("生效时间不能晚于过期时间");
            }
        }
    }
    
    private void validateDataFilter(String dataFilter) {
        // 简单的SQL注入检查
        String lowerFilter = dataFilter.toLowerCase();
        String[] dangerousKeywords = {"drop", "delete", "update", "insert", "exec", "execute", "union", "--", "/*", "*/"};
        
        for (String keyword : dangerousKeywords) {
            if (lowerFilter.contains(keyword)) {
                throw new IllegalArgumentException("数据过滤条件包含危险关键字: " + keyword);
            }
        }
    }
    
    private void validateMaskRule(String maskRule) {
        // 验证脱敏规则格式
        if (!MASK_PATTERNS.containsKey(maskRule) && !maskRule.matches("\\*{1,10}")) {
            throw new IllegalArgumentException("无效的脱敏规则: " + maskRule);
        }
    }
    
    private void checkPermissionConflict(DataPermission dataPermission) {
        // 检查是否存在相同角色、表、字段的权限
        Optional<DataPermission> existingPermission = dataPermissionRepository
            .findByRoleIdAndTableNameAndFieldName(
                dataPermission.getRoleId(),
                dataPermission.getTableName(),
                dataPermission.getFieldName()
            );
        
        if (existingPermission.isPresent() && !existingPermission.get().getId().equals(dataPermission.getId())) {
            throw new IllegalArgumentException("已存在相同的数据权限配置");
        }
    }
    
    private List<DataPermission> getUserEffectiveDataPermissions(Long userId, String tableName, String fieldName) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + userId));
        
        List<Long> roleIds = user.getRoles().stream()
            .map(Role::getId)
            .collect(Collectors.toList());
        
        LocalDateTime now = LocalDateTime.now();
        List<DataPermission> allPermissions = dataPermissionRepository.findByRoleIds(roleIds);
        
        return allPermissions.stream()
            .filter(permission -> permission.getEnabled())
            .filter(permission -> permission.getTableName().equals(tableName))
            .filter(permission -> fieldName == null || permission.getFieldName().equals(fieldName))
            .filter(permission -> permission.getEffectiveTime() == null || !permission.getEffectiveTime().isAfter(now))
            .filter(permission -> permission.getExpireTime() == null || !permission.getExpireTime().isBefore(now))
            .sorted(Comparator.comparing(DataPermission::getPriority).reversed())
            .collect(Collectors.toList());
    }
    
    private String applyMaskRule(String originalValue, String maskRule) {
        if (MASK_PATTERNS.containsKey(maskRule)) {
            Pattern pattern = MASK_PATTERNS.get(maskRule);
            switch (maskRule) {
                case "phone":
                    return pattern.matcher(originalValue).replaceAll("$1****$2");
                case "email":
                    return pattern.matcher(originalValue).replaceAll("$1***@$2");
                case "idcard":
                    return pattern.matcher(originalValue).replaceAll("$1********$2");
                case "bankcard":
                    return pattern.matcher(originalValue).replaceAll("$1****$2");
                default:
                    return originalValue;
            }
        } else if (maskRule.matches("\\*{1,10}")) {
            // 简单的星号脱敏
            int maskLength = maskRule.length();
            if (originalValue.length() <= maskLength) {
                return maskRule;
            } else {
                int keepLength = (originalValue.length() - maskLength) / 2;
                return originalValue.substring(0, keepLength) + maskRule + 
                       originalValue.substring(originalValue.length() - keepLength);
            }
        }
        
        return originalValue;
    }
    
    /**
     * 根据字段名获取默认脱敏规则
     */
    private String getDefaultMaskRuleByFieldName(String fieldName) {
        if (fieldName == null) {
            return null;
        }
        
        String lowerFieldName = fieldName.toLowerCase();
        
        if (lowerFieldName.contains("phone") || lowerFieldName.contains("mobile") || lowerFieldName.contains("tel")) {
            return "phone";
        } else if (lowerFieldName.contains("email") || lowerFieldName.contains("mail")) {
            return "email";
        } else if (lowerFieldName.contains("idcard") || lowerFieldName.contains("identity") || lowerFieldName.contains("id_card")) {
            return "idcard";
        } else if (lowerFieldName.contains("bank") || lowerFieldName.contains("card")) {
            return "bankcard";
        } else if (lowerFieldName.contains("name") || lowerFieldName.contains("username")) {
            return "***";
        } else if (lowerFieldName.contains("address") || lowerFieldName.contains("addr")) {
            return "****";
        }
        
        return null;
    }
    
    /**
     * 检查表级权限
     */
    @Transactional(readOnly = true)
    public boolean hasTablePermission(Long userId, String tableName, String operation) {
        try {
            List<DataPermission> userPermissions = getUserEffectiveDataPermissions(userId, tableName, null);
            
            // 检查是否有拒绝权限
            boolean hasDenyPermission = userPermissions.stream()
                .anyMatch(permission -> permission.getPermissionType() == DataPermission.DataPermissionType.DENY);
            
            if (hasDenyPermission) {
                return false;
            }
            
            // 根据操作类型检查权限
            return checkOperationPermission(userPermissions, operation);
        } catch (Exception e) {
            // 权限检查失败时，默认拒绝访问
            return false;
        }
    }
    
    /**
     * 检查字段级权限
     */
    @Transactional(readOnly = true)
    public boolean hasFieldPermission(Long userId, String tableName, String fieldName, String operation) {
        try {
            List<DataPermission> userPermissions = getUserEffectiveDataPermissions(userId, tableName, fieldName);
            
            // 检查是否有拒绝权限
            boolean hasDenyPermission = userPermissions.stream()
                .anyMatch(permission -> permission.getPermissionType() == DataPermission.DataPermissionType.DENY);
            
            if (hasDenyPermission) {
                return false;
            }
            
            // 根据操作类型检查权限
            return checkOperationPermission(userPermissions, operation);
        } catch (Exception e) {
            // 权限检查失败时，默认拒绝访问
            return false;
        }
    }
    
    /**
     * 检查行级权限
     */
    @Transactional(readOnly = true)
    public boolean hasRowPermission(Long userId, String tableName, String resourceId, String operation) {
        try {
            List<DataPermission> userPermissions = getUserEffectiveDataPermissions(userId, tableName, null);
            
            // 检查是否有拒绝权限
            boolean hasDenyPermission = userPermissions.stream()
                .anyMatch(permission -> permission.getPermissionType() == DataPermission.DataPermissionType.DENY);
            
            if (hasDenyPermission) {
                return false;
            }
            
            // 检查数据范围权限
            for (DataPermission permission : userPermissions) {
                if (!checkDataScopePermission(permission, userId, resourceId)) {
                    return false;
                }
            }
            
            // 根据操作类型检查权限
            return checkOperationPermission(userPermissions, operation);
        } catch (Exception e) {
            // 权限检查失败时，默认拒绝访问
            return false;
        }
    }
    
    /**
     * 检查操作权限
     */
    private boolean checkOperationPermission(List<DataPermission> permissions, String operation) {
        if (operation == null) {
            return true;
        }
        
        String upperOperation = operation.toUpperCase();
        
        switch (upperOperation) {
            case "READ":
            case "SELECT":
            case "QUERY":
                return permissions.stream().anyMatch(permission -> 
                    permission.getPermissionType() == DataPermission.DataPermissionType.READ ||
                    permission.getPermissionType() == DataPermission.DataPermissionType.WRITE
                );
                
            case "WRITE":
            case "INSERT":
            case "UPDATE":
            case "DELETE":
                return permissions.stream().anyMatch(permission -> 
                    permission.getPermissionType() == DataPermission.DataPermissionType.WRITE
                );
                
            default:
                // 对于未知操作，检查是否有任何权限
                return permissions.stream().anyMatch(permission -> 
                    permission.getPermissionType() != DataPermission.DataPermissionType.DENY
                );
        }
    }
    
    /**
     * 检查数据范围权限
     */
    private boolean checkDataScopePermission(DataPermission permission, Long userId, String resourceId) {
        if (permission.getDataScope() == null) {
            return true;
        }
        
        switch (permission.getDataScope()) {
            case ALL:
                return true;
                
            case SELF:
                // 只能访问自己的数据
                return userId != null && userId.toString().equals(resourceId);
                
            case DEPARTMENT:
                // 可以访问同部门的数据（这里需要根据实际业务逻辑实现）
                return checkDepartmentPermission(userId, resourceId);
                
            case CUSTOM:
                // 自定义数据范围（根据数据过滤条件判断）
                return checkCustomDataScope(permission, userId, resourceId);
                
            default:
                return false;
        }
    }
    
    /**
     * 检查部门权限（示例实现）
     */
    private boolean checkDepartmentPermission(Long userId, String resourceId) {
        // 这里应该根据实际的组织架构来实现
        // 示例：检查用户是否与资源属于同一部门
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return false;
            }
            
            // 简化实现：假设resourceId是用户ID，检查是否在同一部门
            Long resourceUserId = Long.parseLong(resourceId);
            User resourceUser = userRepository.findById(resourceUserId).orElse(null);
            
            if (resourceUser == null) {
                return false;
            }
            
            // 这里应该比较部门ID，暂时返回true
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * 检查自定义数据范围
     */
    private boolean checkCustomDataScope(DataPermission permission, Long userId, String resourceId) {
        String dataFilter = permission.getDataFilter();
        if (!StringUtils.hasText(dataFilter)) {
            return true;
        }
        
        // 简化实现：检查数据过滤条件中是否包含用户ID或资源ID
        return dataFilter.contains(userId.toString()) || dataFilter.contains(resourceId);
    }
}