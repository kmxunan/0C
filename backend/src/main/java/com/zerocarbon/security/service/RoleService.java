package com.zerocarbon.security.service;

import com.zerocarbon.security.entity.Role;
import com.zerocarbon.security.entity.Permission;
import com.zerocarbon.security.entity.User;
import com.zerocarbon.security.repository.RoleRepository;
import com.zerocarbon.security.repository.PermissionRepository;
import com.zerocarbon.security.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 角色服务类
 * 零碳园区数字孪生系统角色管理
 */
@Service
@Transactional
public class RoleService {
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private PermissionRepository permissionRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * 创建角色
     */
    public Role createRole(Role role) {
        validateRoleForCreation(role);
        
        // 设置默认值
        if (role.getEnabled() == null) {
            role.setEnabled(true);
        }
        if (role.getIsDefault() == null) {
            role.setIsDefault(false);
        }
        if (role.getType() == null) {
            role.setType(Role.RoleType.CUSTOM);
        }
        if (role.getLevel() == null) {
            role.setLevel(Role.RoleLevels.BASIC);
        }
        
        return roleRepository.save(role);
    }
    
    /**
     * 更新角色信息
     */
    public Role updateRole(Long roleId, Role roleDetails) {
        Role existingRole = getRoleById(roleId);
        
        // 检查是否为系统角色
        if (existingRole.getType() == Role.RoleType.SYSTEM) {
            throw new IllegalArgumentException("系统角色不允许修改");
        }
        
        // 更新基本信息
        if (StringUtils.hasText(roleDetails.getName())) {
            validateRoleNameUniqueness(roleDetails.getName(), roleId);
            existingRole.setName(roleDetails.getName());
        }
        
        if (StringUtils.hasText(roleDetails.getDescription())) {
            existingRole.setDescription(roleDetails.getDescription());
        }
        
        if (roleDetails.getLevel() != null) {
            existingRole.setLevel(roleDetails.getLevel());
        }
        
        if (roleDetails.getEnabled() != null) {
            existingRole.setEnabled(roleDetails.getEnabled());
        }
        
        return roleRepository.save(existingRole);
    }
    
    /**
     * 删除角色
     */
    public void deleteRole(Long roleId) {
        Role role = getRoleById(roleId);
        
        // 检查是否为系统角色
        if (role.getType() == Role.RoleType.SYSTEM) {
            throw new IllegalArgumentException("系统角色不允许删除");
        }
        
        // 检查是否有用户使用该角色
        if (!role.getUsers().isEmpty()) {
            throw new IllegalArgumentException("该角色正在被用户使用，无法删除");
        }
        
        roleRepository.delete(role);
    }
    
    /**
     * 启用角色
     */
    public void enableRole(Long roleId) {
        Role role = getRoleById(roleId);
        role.setEnabled(true);
        roleRepository.save(role);
    }
    
    /**
     * 禁用角色
     */
    public void disableRole(Long roleId) {
        Role role = getRoleById(roleId);
        
        // 检查是否为系统角色
        if (role.getType() == Role.RoleType.SYSTEM) {
            throw new IllegalArgumentException("系统角色不允许禁用");
        }
        
        role.setEnabled(false);
        roleRepository.save(role);
    }
    
    /**
     * 分配权限给角色
     */
    public void assignPermissions(Long roleId, List<Long> permissionIds) {
        Role role = getRoleById(roleId);
        Set<Permission> permissions = new HashSet<>();
        
        for (Long permissionId : permissionIds) {
            Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new IllegalArgumentException("权限不存在: " + permissionId));
            
            // 检查权限级别
            if (permission.getLevel() > role.getLevel()) {
                throw new IllegalArgumentException("角色级别不足，无法分配权限: " + permission.getName());
            }
            
            permissions.add(permission);
        }
        
        role.setPermissions(permissions);
        roleRepository.save(role);
    }
    
    /**
     * 移除角色权限
     */
    public void removePermissions(Long roleId, List<Long> permissionIds) {
        Role role = getRoleById(roleId);
        Set<Permission> currentPermissions = role.getPermissions();
        
        for (Long permissionId : permissionIds) {
            currentPermissions.removeIf(permission -> permission.getId().equals(permissionId));
        }
        
        role.setPermissions(currentPermissions);
        roleRepository.save(role);
    }
    
    /**
     * 复制角色
     */
    public Role copyRole(Long sourceRoleId, String newRoleName, String newRoleCode) {
        Role sourceRole = getRoleById(sourceRoleId);
        
        // 验证新角色信息
        validateRoleCodeUniqueness(newRoleCode);
        validateRoleNameUniqueness(newRoleName, null);
        
        // 创建新角色
        Role newRole = new Role();
        newRole.setCode(newRoleCode);
        newRole.setName(newRoleName);
        newRole.setDescription("复制自: " + sourceRole.getName());
        newRole.setType(Role.RoleType.CUSTOM);
        newRole.setLevel(sourceRole.getLevel());
        newRole.setEnabled(true);
        newRole.setIsDefault(false);
        
        // 复制权限
        newRole.setPermissions(new HashSet<>(sourceRole.getPermissions()));
        
        return roleRepository.save(newRole);
    }
    
    /**
     * 角色继承
     */
    public void inheritRole(Long childRoleId, Long parentRoleId) {
        Role childRole = getRoleById(childRoleId);
        Role parentRole = getRoleById(parentRoleId);
        
        // 检查角色级别
        if (childRole.getLevel() <= parentRole.getLevel()) {
            throw new IllegalArgumentException("子角色级别必须高于父角色级别");
        }
        
        // 继承父角色的所有权限
        Set<Permission> inheritedPermissions = new HashSet<>(childRole.getPermissions());
        inheritedPermissions.addAll(parentRole.getPermissions());
        
        childRole.setPermissions(inheritedPermissions);
        roleRepository.save(childRole);
    }
    
    /**
     * 查询角色
     */
    @Transactional(readOnly = true)
    public Role getRoleById(Long roleId) {
        return roleRepository.findById(roleId)
            .orElseThrow(() -> new IllegalArgumentException("角色不存在: " + roleId));
    }
    
    @Transactional(readOnly = true)
    public Role getRoleByCode(String roleCode) {
        return roleRepository.findByCode(roleCode)
            .orElseThrow(() -> new IllegalArgumentException("角色不存在: " + roleCode));
    }
    
    @Transactional(readOnly = true)
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public List<Role> getActiveRoles() {
        return roleRepository.findByEnabledTrue();
    }
    
    @Transactional(readOnly = true)
    public List<Role> getRolesByType(Role.RoleType type) {
        return roleRepository.findByType(type);
    }
    
    @Transactional(readOnly = true)
    public List<Role> getSystemRoles() {
        return roleRepository.findSystemRoles();
    }
    
    @Transactional(readOnly = true)
    public List<Role> getBusinessRoles() {
        return roleRepository.findBusinessRoles();
    }
    
    @Transactional(readOnly = true)
    public List<Role> getCustomRoles() {
        return roleRepository.findCustomRoles();
    }
    
    @Transactional(readOnly = true)
    public List<Role> getDefaultRoles() {
        return roleRepository.findByIsDefaultTrue();
    }
    
    @Transactional(readOnly = true)
    public List<Role> getAssignableRoles() {
        return roleRepository.findAssignableRoles();
    }
    
    @Transactional(readOnly = true)
    public Set<Role> getUserRoles(Long userId) {
        return roleRepository.findByUserId(userId);
    }
    
    @Transactional(readOnly = true)
    public List<Role> getRolesByPermission(String permissionCode) {
        return roleRepository.findByPermissionCode(permissionCode);
    }
    
    @Transactional(readOnly = true)
    public List<Role> searchRoles(String keyword) {
        return roleRepository.searchRoles(keyword);
    }
    
    @Transactional(readOnly = true)
    public List<Role> getRolesByLevel(Integer minLevel) {
        return roleRepository.findByLevelGreaterThanEqual(minLevel);
    }
    
    @Transactional(readOnly = true)
    public List<Role> getHigherLevelRoles(Integer level) {
        return roleRepository.findHigherLevelRoles(level);
    }
    
    @Transactional(readOnly = true)
    public List<Role> getLowerLevelRoles(Integer level) {
        return roleRepository.findLowerLevelRoles(level);
    }
    
    /**
     * 角色统计
     */
    @Transactional(readOnly = true)
    public Long getActiveRoleCount() {
        return roleRepository.countActiveRoles();
    }
    
    @Transactional(readOnly = true)
    public Map<Role.RoleType, Long> getRoleCountByType() {
        List<Object[]> results = roleRepository.countRolesByType();
        return results.stream()
            .collect(Collectors.toMap(
                result -> (Role.RoleType) result[0],
                result -> (Long) result[1]
            ));
    }
    
    @Transactional(readOnly = true)
    public Map<Integer, Long> getRoleCountByLevel() {
        List<Object[]> results = roleRepository.countRolesByLevel();
        return results.stream()
            .collect(Collectors.toMap(
                result -> (Integer) result[0],
                result -> (Long) result[1]
            ));
    }
    
    /**
     * 角色权限检查
     */
    @Transactional(readOnly = true)
    public boolean hasPermission(Long roleId, String permissionCode) {
        Role role = getRoleById(roleId);
        return role.getPermissions().stream()
            .anyMatch(permission -> permission.getCode().equals(permissionCode));
    }
    
    @Transactional(readOnly = true)
    public boolean hasAnyPermission(Long roleId, List<String> permissionCodes) {
        Role role = getRoleById(roleId);
        Set<String> rolePemissionCodes = role.getPermissions().stream()
            .map(Permission::getCode)
            .collect(Collectors.toSet());
        
        return permissionCodes.stream()
            .anyMatch(rolePemissionCodes::contains);
    }
    
    @Transactional(readOnly = true)
    public boolean hasAllPermissions(Long roleId, List<String> permissionCodes) {
        Role role = getRoleById(roleId);
        Set<String> rolePemissionCodes = role.getPermissions().stream()
            .map(Permission::getCode)
            .collect(Collectors.toSet());
        
        return rolePemissionCodes.containsAll(permissionCodes);
    }
    
    /**
     * 角色层级检查
     */
    @Transactional(readOnly = true)
    public boolean hasHigherLevel(Long roleId, Integer targetLevel) {
        Role role = getRoleById(roleId);
        return role.getLevel() > targetLevel;
    }
    
    @Transactional(readOnly = true)
    public boolean hasLevelOrHigher(Long roleId, Integer targetLevel) {
        Role role = getRoleById(roleId);
        return role.getLevel() >= targetLevel;
    }
    
    /**
     * 初始化系统角色
     */
    public void initializeSystemRoles() {
        // 创建超级管理员角色
        createSystemRoleIfNotExists(
            Role.SystemRoles.SUPER_ADMIN,
            "超级管理员",
            "系统超级管理员，拥有所有权限",
            Role.RoleLevels.SUPER_ADMIN
        );
        
        // 创建系统管理员角色
        createSystemRoleIfNotExists(
            Role.SystemRoles.SYSTEM_ADMIN,
            "系统管理员",
            "系统管理员，负责系统配置和用户管理",
            Role.RoleLevels.ADMIN
        );
        
        // 创建业务管理员角色
        createSystemRoleIfNotExists(
            Role.SystemRoles.BUSINESS_ADMIN,
            "业务管理员",
            "业务管理员，负责业务数据管理",
            Role.RoleLevels.MANAGER
        );
        
        // 创建普通用户角色
        createSystemRoleIfNotExists(
            Role.SystemRoles.USER,
            "普通用户",
            "普通用户，基本查看权限",
            Role.RoleLevels.BASIC
        );
    }
    
    // 私有辅助方法
    
    private void validateRoleForCreation(Role role) {
        if (!StringUtils.hasText(role.getCode())) {
            throw new IllegalArgumentException("角色代码不能为空");
        }
        
        if (!StringUtils.hasText(role.getName())) {
            throw new IllegalArgumentException("角色名称不能为空");
        }
        
        validateRoleCodeUniqueness(role.getCode());
        validateRoleNameUniqueness(role.getName(), null);
    }
    
    private void validateRoleCodeUniqueness(String roleCode) {
        if (roleRepository.existsByCode(roleCode)) {
            throw new IllegalArgumentException("角色代码已存在: " + roleCode);
        }
    }
    
    private void validateRoleNameUniqueness(String roleName, Long excludeRoleId) {
        Optional<Role> existingRole = roleRepository.findByName(roleName);
        if (existingRole.isPresent() && !existingRole.get().getId().equals(excludeRoleId)) {
            throw new IllegalArgumentException("角色名称已存在: " + roleName);
        }
    }
    
    private void createSystemRoleIfNotExists(String code, String name, String description, Integer level) {
        if (!roleRepository.existsByCode(code)) {
            Role role = new Role();
            role.setCode(code);
            role.setName(name);
            role.setDescription(description);
            role.setType(Role.RoleType.SYSTEM);
            role.setLevel(level);
            role.setEnabled(true);
            role.setIsDefault(Role.SystemRoles.USER.equals(code));
            
            roleRepository.save(role);
        }
    }
}