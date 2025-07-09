package com.zerocarbon.security.service;

import com.zerocarbon.security.entity.Permission;
import com.zerocarbon.security.entity.Role;
import com.zerocarbon.security.repository.PermissionRepository;
import com.zerocarbon.security.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 权限服务类
 * 零碳园区数字孪生系统权限管理
 */
@Service
@Transactional
public class PermissionService {
    
    @Autowired
    private PermissionRepository permissionRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    /**
     * 创建权限
     */
    public Permission createPermission(Permission permission) {
        validatePermissionForCreation(permission);
        
        // 设置默认值
        if (permission.getEnabled() == null) {
            permission.setEnabled(true);
        }
        if (permission.getIsSystem() == null) {
            permission.setIsSystem(false);
        }
        if (permission.getType() == null) {
            permission.setType(Permission.PermissionType.OPERATION);
        }
        if (permission.getLevel() == null) {
            permission.setLevel(Permission.PermissionLevels.BASIC);
        }
        if (permission.getSortOrder() == null) {
            permission.setSortOrder(0);
        }
        
        // 生成权限代码（如果未提供）
        if (!StringUtils.hasText(permission.getCode())) {
            permission.setCode(Permission.generateCode(permission.getResource(), permission.getAction()));
        }
        
        // 设置权限路径
        updatePermissionPath(permission);
        
        return permissionRepository.save(permission);
    }
    
    /**
     * 更新权限信息
     */
    public Permission updatePermission(Long permissionId, Permission permissionDetails) {
        Permission existingPermission = getPermissionById(permissionId);
        
        // 检查是否为系统权限
        if (existingPermission.getIsSystem()) {
            throw new IllegalArgumentException("系统权限不允许修改");
        }
        
        // 更新基本信息
        if (StringUtils.hasText(permissionDetails.getName())) {
            validatePermissionNameUniqueness(permissionDetails.getName(), permissionId);
            existingPermission.setName(permissionDetails.getName());
        }
        
        if (StringUtils.hasText(permissionDetails.getDescription())) {
            existingPermission.setDescription(permissionDetails.getDescription());
        }
        
        if (StringUtils.hasText(permissionDetails.getGroup())) {
            existingPermission.setGroup(permissionDetails.getGroup());
        }
        
        if (permissionDetails.getLevel() != null) {
            existingPermission.setLevel(permissionDetails.getLevel());
        }
        
        if (permissionDetails.getSortOrder() != null) {
            existingPermission.setSortOrder(permissionDetails.getSortOrder());
        }
        
        if (permissionDetails.getEnabled() != null) {
            existingPermission.setEnabled(permissionDetails.getEnabled());
        }
        
        // 更新父权限
        if (permissionDetails.getParentId() != null && !permissionDetails.getParentId().equals(existingPermission.getParentId())) {
            validateParentPermission(permissionDetails.getParentId(), permissionId);
            existingPermission.setParentId(permissionDetails.getParentId());
            updatePermissionPath(existingPermission);
        }
        
        return permissionRepository.save(existingPermission);
    }
    
    /**
     * 删除权限
     */
    public void deletePermission(Long permissionId) {
        Permission permission = getPermissionById(permissionId);
        
        // 检查是否为系统权限
        if (permission.getIsSystem()) {
            throw new IllegalArgumentException("系统权限不允许删除");
        }
        
        // 检查是否有子权限
        List<Permission> childPermissions = permissionRepository.findByParentId(permissionId);
        if (!childPermissions.isEmpty()) {
            throw new IllegalArgumentException("该权限存在子权限，无法删除");
        }
        
        // 检查是否有角色使用该权限
        if (!permission.getRoles().isEmpty()) {
            throw new IllegalArgumentException("该权限正在被角色使用，无法删除");
        }
        
        permissionRepository.delete(permission);
    }
    
    /**
     * 启用权限
     */
    public void enablePermission(Long permissionId) {
        Permission permission = getPermissionById(permissionId);
        permission.setEnabled(true);
        permissionRepository.save(permission);
    }
    
    /**
     * 禁用权限
     */
    public void disablePermission(Long permissionId) {
        Permission permission = getPermissionById(permissionId);
        
        // 检查是否为系统权限
        if (permission.getIsSystem()) {
            throw new IllegalArgumentException("系统权限不允许禁用");
        }
        
        permission.setEnabled(false);
        permissionRepository.save(permission);
    }
    
    /**
     * 移动权限（更改父权限）
     */
    public void movePermission(Long permissionId, Long newParentId) {
        Permission permission = getPermissionById(permissionId);
        
        if (newParentId != null) {
            validateParentPermission(newParentId, permissionId);
        }
        
        permission.setParentId(newParentId);
        updatePermissionPath(permission);
        
        permissionRepository.save(permission);
        
        // 更新所有子权限的路径
        updateChildPermissionPaths(permissionId);
    }
    
    /**
     * 复制权限
     */
    public Permission copyPermission(Long sourcePermissionId, String newPermissionName, String newPermissionCode) {
        Permission sourcePermission = getPermissionById(sourcePermissionId);
        
        // 验证新权限信息
        validatePermissionCodeUniqueness(newPermissionCode);
        validatePermissionNameUniqueness(newPermissionName, null);
        
        // 创建新权限
        Permission newPermission = new Permission();
        newPermission.setCode(newPermissionCode);
        newPermission.setName(newPermissionName);
        newPermission.setDescription("复制自: " + sourcePermission.getName());
        newPermission.setType(sourcePermission.getType());
        newPermission.setGroup(sourcePermission.getGroup());
        newPermission.setResource(sourcePermission.getResource());
        newPermission.setAction(sourcePermission.getAction());
        newPermission.setLevel(sourcePermission.getLevel());
        newPermission.setEnabled(true);
        newPermission.setIsSystem(false);
        newPermission.setParentId(sourcePermission.getParentId());
        newPermission.setSortOrder(sourcePermission.getSortOrder());
        
        updatePermissionPath(newPermission);
        
        return permissionRepository.save(newPermission);
    }
    
    /**
     * 查询权限
     */
    @Transactional(readOnly = true)
    public Permission getPermissionById(Long permissionId) {
        return permissionRepository.findById(permissionId)
            .orElseThrow(() -> new IllegalArgumentException("权限不存在: " + permissionId));
    }
    
    @Transactional(readOnly = true)
    public Permission getPermissionByCode(String permissionCode) {
        return permissionRepository.findByCode(permissionCode)
            .orElseThrow(() -> new IllegalArgumentException("权限不存在: " + permissionCode));
    }
    
    @Transactional(readOnly = true)
    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public List<Permission> getActivePermissions() {
        return permissionRepository.findByEnabledTrue();
    }
    
    @Transactional(readOnly = true)
    public List<Permission> getPermissionsByType(Permission.PermissionType type) {
        return permissionRepository.findByType(type);
    }
    
    @Transactional(readOnly = true)
    public List<Permission> getPermissionsByGroup(String group) {
        return permissionRepository.findByGroup(group);
    }
    
    @Transactional(readOnly = true)
    public List<Permission> getPermissionsByResource(String resource) {
        return permissionRepository.findByResource(resource);
    }
    
    @Transactional(readOnly = true)
    public List<Permission> getSystemPermissions() {
        return permissionRepository.findByIsSystemTrue();
    }
    
    @Transactional(readOnly = true)
    public List<Permission> getCustomPermissions() {
        return permissionRepository.findByIsSystemFalse();
    }
    
    @Transactional(readOnly = true)
    public List<Permission> getAssignablePermissions() {
        return permissionRepository.findAssignablePermissions();
    }
    
    @Transactional(readOnly = true)
    public Set<Permission> getUserPermissions(Long userId) {
        return permissionRepository.findByUserId(userId);
    }
    
    @Transactional(readOnly = true)
    public Set<Permission> getUserPermissions(String username) {
        return permissionRepository.findByUsername(username);
    }
    
    @Transactional(readOnly = true)
    public Set<Permission> getRolePermissions(Long roleId) {
        return permissionRepository.findByRoleId(roleId);
    }
    
    @Transactional(readOnly = true)
    public List<Permission> searchPermissions(String keyword) {
        return permissionRepository.searchPermissions(keyword);
    }
    
    /**
     * 权限树结构
     */
    @Transactional(readOnly = true)
    public List<Permission> getPermissionTree() {
        List<Permission> rootPermissions = permissionRepository.findRootPermissions();
        return buildPermissionTree(rootPermissions);
    }
    
    @Transactional(readOnly = true)
    public List<Permission> getChildPermissions(Long parentId) {
        return permissionRepository.findByParentId(parentId);
    }
    
    @Transactional(readOnly = true)
    public List<Permission> getLeafPermissions() {
        return permissionRepository.findLeafPermissions();
    }
    
    /**
     * 权限统计
     */
    @Transactional(readOnly = true)
    public Long getActivePermissionCount() {
        return permissionRepository.countActivePermissions();
    }
    
    @Transactional(readOnly = true)
    public Map<Permission.PermissionType, Long> getPermissionCountByType() {
        List<Object[]> results = permissionRepository.countPermissionsByType();
        return results.stream()
            .collect(Collectors.toMap(
                result -> (Permission.PermissionType) result[0],
                result -> (Long) result[1]
            ));
    }
    
    @Transactional(readOnly = true)
    public Map<String, Long> getPermissionCountByGroup() {
        List<Object[]> results = permissionRepository.countPermissionsByGroup();
        return results.stream()
            .collect(Collectors.toMap(
                result -> (String) result[0],
                result -> (Long) result[1]
            ));
    }
    
    /**
     * 权限检查
     */
    @Transactional(readOnly = true)
    public boolean hasPermission(Long userId, String permissionCode) {
        Set<Permission> userPermissions = getUserPermissions(userId);
        return userPermissions.stream()
            .anyMatch(permission -> permission.getCode().equals(permissionCode));
    }
    
    @Transactional(readOnly = true)
    public boolean hasAnyPermission(Long userId, List<String> permissionCodes) {
        Set<Permission> userPermissions = getUserPermissions(userId);
        Set<String> userPermissionCodes = userPermissions.stream()
            .map(Permission::getCode)
            .collect(Collectors.toSet());
        
        return permissionCodes.stream()
            .anyMatch(userPermissionCodes::contains);
    }
    
    @Transactional(readOnly = true)
    public boolean hasAllPermissions(Long userId, List<String> permissionCodes) {
        Set<Permission> userPermissions = getUserPermissions(userId);
        Set<String> userPermissionCodes = userPermissions.stream()
            .map(Permission::getCode)
            .collect(Collectors.toSet());
        
        return userPermissionCodes.containsAll(permissionCodes);
    }
    
    @Transactional(readOnly = true)
    public boolean hasResourcePermission(Long userId, String resource, String action) {
        String permissionCode = Permission.generateCode(resource, action);
        return hasPermission(userId, permissionCode);
    }
    
    /**
     * 初始化系统权限
     */
    public void initializeSystemPermissions() {
        // 用户管理权限
        createSystemPermissionIfNotExists(
            Permission.SystemPermissions.USER_MANAGE,
            "用户管理",
            "用户管理权限",
            Permission.PermissionType.MODULE,
            "用户管理",
            "user",
            "manage",
            Permission.PermissionLevels.ADMIN
        );
        
        // 角色管理权限
        createSystemPermissionIfNotExists(
            Permission.SystemPermissions.ROLE_MANAGE,
            "角色管理",
            "角色管理权限",
            Permission.PermissionType.MODULE,
            "权限管理",
            "role",
            "manage",
            Permission.PermissionLevels.ADMIN
        );
        
        // 权限管理权限
        createSystemPermissionIfNotExists(
            Permission.SystemPermissions.PERMISSION_MANAGE,
            "权限管理",
            "权限管理权限",
            Permission.PermissionType.MODULE,
            "权限管理",
            "permission",
            "manage",
            Permission.PermissionLevels.SUPER_ADMIN
        );
        
        // 数据查看权限
        createSystemPermissionIfNotExists(
            Permission.SystemPermissions.DATA_VIEW,
            "数据查看",
            "数据查看权限",
            Permission.PermissionType.DATA,
            "数据管理",
            "data",
            "view",
            Permission.PermissionLevels.BASIC
        );
        
        // 数据编辑权限
        createSystemPermissionIfNotExists(
            Permission.SystemPermissions.DATA_EDIT,
            "数据编辑",
            "数据编辑权限",
            Permission.PermissionType.DATA,
            "数据管理",
            "data",
            "edit",
            Permission.PermissionLevels.MANAGER
        );
        
        // 系统配置权限
        createSystemPermissionIfNotExists(
            Permission.SystemPermissions.SYSTEM_CONFIG,
            "系统配置",
            "系统配置权限",
            Permission.PermissionType.MODULE,
            "系统管理",
            "system",
            "config",
            Permission.PermissionLevels.SUPER_ADMIN
        );
    }
    
    // 私有辅助方法
    
    private void validatePermissionForCreation(Permission permission) {
        if (!StringUtils.hasText(permission.getName())) {
            throw new IllegalArgumentException("权限名称不能为空");
        }
        
        if (StringUtils.hasText(permission.getCode())) {
            validatePermissionCodeUniqueness(permission.getCode());
        }
        
        validatePermissionNameUniqueness(permission.getName(), null);
        
        if (permission.getParentId() != null) {
            validateParentPermission(permission.getParentId(), null);
        }
    }
    
    private void validatePermissionCodeUniqueness(String permissionCode) {
        if (permissionRepository.existsByCode(permissionCode)) {
            throw new IllegalArgumentException("权限代码已存在: " + permissionCode);
        }
    }
    
    private void validatePermissionNameUniqueness(String permissionName, Long excludePermissionId) {
        Optional<Permission> existingPermission = permissionRepository.findByName(permissionName);
        if (existingPermission.isPresent() && !existingPermission.get().getId().equals(excludePermissionId)) {
            throw new IllegalArgumentException("权限名称已存在: " + permissionName);
        }
    }
    
    private void validateParentPermission(Long parentId, Long excludePermissionId) {
        if (parentId.equals(excludePermissionId)) {
            throw new IllegalArgumentException("权限不能设置自己为父权限");
        }
        
        Permission parentPermission = getPermissionById(parentId);
        if (!parentPermission.getEnabled()) {
            throw new IllegalArgumentException("父权限已被禁用");
        }
        
        // 检查是否会形成循环引用
        if (excludePermissionId != null && wouldCreateCircularReference(parentId, excludePermissionId)) {
            throw new IllegalArgumentException("设置父权限会形成循环引用");
        }
    }
    
    private boolean wouldCreateCircularReference(Long parentId, Long childId) {
        Permission parent = getPermissionById(parentId);
        while (parent.getParentId() != null) {
            if (parent.getParentId().equals(childId)) {
                return true;
            }
            parent = getPermissionById(parent.getParentId());
        }
        return false;
    }
    
    private void updatePermissionPath(Permission permission) {
        if (permission.getParentId() == null) {
            permission.setPath("/" + permission.getId());
        } else {
            Permission parent = getPermissionById(permission.getParentId());
            permission.setPath(parent.getPath() + "/" + permission.getId());
        }
    }
    
    private void updateChildPermissionPaths(Long parentId) {
        List<Permission> childPermissions = permissionRepository.findByParentId(parentId);
        for (Permission child : childPermissions) {
            updatePermissionPath(child);
            permissionRepository.save(child);
            updateChildPermissionPaths(child.getId());
        }
    }
    
    private List<Permission> buildPermissionTree(List<Permission> permissions) {
        for (Permission permission : permissions) {
            List<Permission> children = permissionRepository.findByParentId(permission.getId());
            if (!children.isEmpty()) {
                buildPermissionTree(children);
            }
        }
        return permissions;
    }
    
    private void createSystemPermissionIfNotExists(String code, String name, String description,
                                                   Permission.PermissionType type, String group,
                                                   String resource, String action, Integer level) {
        if (!permissionRepository.existsByCode(code)) {
            Permission permission = new Permission();
            permission.setCode(code);
            permission.setName(name);
            permission.setDescription(description);
            permission.setType(type);
            permission.setGroup(group);
            permission.setResource(resource);
            permission.setAction(action);
            permission.setLevel(level);
            permission.setEnabled(true);
            permission.setIsSystem(true);
            permission.setSortOrder(0);
            
            updatePermissionPath(permission);
            permissionRepository.save(permission);
        }
    }
}