package com.zerocarbon.security.controller;

import com.zerocarbon.common.response.ApiResponse;
import com.zerocarbon.security.entity.User;
import com.zerocarbon.security.entity.Role;
import com.zerocarbon.security.entity.Permission;
import com.zerocarbon.security.entity.DataPermission;
import com.zerocarbon.security.service.UserService;
import com.zerocarbon.security.service.RoleService;
import com.zerocarbon.security.service.PermissionService;
import com.zerocarbon.security.service.DataPermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 安全控制器
 * 零碳园区数字孪生系统安全管理API
 */
@RestController
@RequestMapping("/api/security")
@CrossOrigin(origins = "*")
public class SecurityController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private RoleService roleService;
    
    @Autowired
    private PermissionService permissionService;
    
    @Autowired
    private DataPermissionService dataPermissionService;
    
    // ==================== 用户管理 API ====================
    
    /**
     * 创建用户
     */
    @PostMapping("/users")
    public ResponseEntity<ApiResponse<User>> createUser(@Valid @RequestBody User user) {
        try {
            User createdUser = userService.createUser(user);
            return ResponseEntity.ok(ApiResponse.success(createdUser, "用户创建成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 更新用户信息
     */
    @PutMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<User>> updateUser(
            @PathVariable Long userId,
            @Valid @RequestBody User userDetails) {
        try {
            User updatedUser = userService.updateUser(userId, userDetails);
            return ResponseEntity.ok(ApiResponse.success(updatedUser, "用户信息更新成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 获取用户信息
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<User>> getUser(@PathVariable Long userId) {
        try {
            User user = userService.getUserById(userId);
            return ResponseEntity.ok(ApiResponse.success(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 获取所有用户
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            return ResponseEntity.ok(ApiResponse.success(users));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 搜索用户
     */
    @GetMapping("/users/search")
    public ResponseEntity<ApiResponse<List<User>>> searchUsers(@RequestParam String keyword) {
        try {
            List<User> users = userService.searchUsers(keyword);
            return ResponseEntity.ok(ApiResponse.success(users));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 修改密码
     */
    @PostMapping("/users/{userId}/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @PathVariable Long userId,
            @RequestBody Map<String, String> passwordData) {
        try {
            String oldPassword = passwordData.get("oldPassword");
            String newPassword = passwordData.get("newPassword");
            userService.changePassword(userId, oldPassword, newPassword);
            return ResponseEntity.ok(ApiResponse.success(null, "密码修改成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 重置密码
     */
    @PostMapping("/users/{userId}/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@PathVariable Long userId) {
        try {
            String tempPassword = userService.resetPassword(userId);
            return ResponseEntity.ok(ApiResponse.success(tempPassword, "密码重置成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 启用用户
     */
    @PostMapping("/users/{userId}/enable")
    public ResponseEntity<ApiResponse<Void>> enableUser(@PathVariable Long userId) {
        try {
            userService.enableUser(userId);
            return ResponseEntity.ok(ApiResponse.success(null, "用户启用成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 禁用用户
     */
    @PostMapping("/users/{userId}/disable")
    public ResponseEntity<ApiResponse<Void>> disableUser(@PathVariable Long userId) {
        try {
            userService.disableUser(userId);
            return ResponseEntity.ok(ApiResponse.success(null, "用户禁用成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 锁定用户
     */
    @PostMapping("/users/{userId}/lock")
    public ResponseEntity<ApiResponse<Void>> lockUser(
            @PathVariable Long userId,
            @RequestBody Map<String, String> lockData) {
        try {
            String reason = lockData.get("reason");
            userService.lockUser(userId, reason);
            return ResponseEntity.ok(ApiResponse.success(null, "用户锁定成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 解锁用户
     */
    @PostMapping("/users/{userId}/unlock")
    public ResponseEntity<ApiResponse<Void>> unlockUser(@PathVariable Long userId) {
        try {
            userService.unlockUser(userId);
            return ResponseEntity.ok(ApiResponse.success(null, "用户解锁成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 分配角色
     */
    @PostMapping("/users/{userId}/roles")
    public ResponseEntity<ApiResponse<Void>> assignRoles(
            @PathVariable Long userId,
            @RequestBody List<Long> roleIds) {
        try {
            userService.assignRoles(userId, roleIds);
            return ResponseEntity.ok(ApiResponse.success(null, "角色分配成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    // ==================== 角色管理 API ====================
    
    /**
     * 创建角色
     */
    @PostMapping("/roles")
    public ResponseEntity<ApiResponse<Role>> createRole(@Valid @RequestBody Role role) {
        try {
            Role createdRole = roleService.createRole(role);
            return ResponseEntity.ok(ApiResponse.success(createdRole, "角色创建成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 更新角色信息
     */
    @PutMapping("/roles/{roleId}")
    public ResponseEntity<ApiResponse<Role>> updateRole(
            @PathVariable Long roleId,
            @Valid @RequestBody Role roleDetails) {
        try {
            Role updatedRole = roleService.updateRole(roleId, roleDetails);
            return ResponseEntity.ok(ApiResponse.success(updatedRole, "角色信息更新成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 获取角色信息
     */
    @GetMapping("/roles/{roleId}")
    public ResponseEntity<ApiResponse<Role>> getRole(@PathVariable Long roleId) {
        try {
            Role role = roleService.getRoleById(roleId);
            return ResponseEntity.ok(ApiResponse.success(role));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 获取所有角色
     */
    @GetMapping("/roles")
    public ResponseEntity<ApiResponse<List<Role>>> getAllRoles() {
        try {
            List<Role> roles = roleService.getAllRoles();
            return ResponseEntity.ok(ApiResponse.success(roles));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 获取可分配的角色
     */
    @GetMapping("/roles/assignable")
    public ResponseEntity<ApiResponse<List<Role>>> getAssignableRoles() {
        try {
            List<Role> roles = roleService.getAssignableRoles();
            return ResponseEntity.ok(ApiResponse.success(roles));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 搜索角色
     */
    @GetMapping("/roles/search")
    public ResponseEntity<ApiResponse<List<Role>>> searchRoles(@RequestParam String keyword) {
        try {
            List<Role> roles = roleService.searchRoles(keyword);
            return ResponseEntity.ok(ApiResponse.success(roles));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 删除角色
     */
    @DeleteMapping("/roles/{roleId}")
    public ResponseEntity<ApiResponse<Void>> deleteRole(@PathVariable Long roleId) {
        try {
            roleService.deleteRole(roleId);
            return ResponseEntity.ok(ApiResponse.success(null, "角色删除成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 分配权限给角色
     */
    @PostMapping("/roles/{roleId}/permissions")
    public ResponseEntity<ApiResponse<Void>> assignPermissions(
            @PathVariable Long roleId,
            @RequestBody List<Long> permissionIds) {
        try {
            roleService.assignPermissions(roleId, permissionIds);
            return ResponseEntity.ok(ApiResponse.success(null, "权限分配成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 复制角色
     */
    @PostMapping("/roles/{roleId}/copy")
    public ResponseEntity<ApiResponse<Role>> copyRole(
            @PathVariable Long roleId,
            @RequestBody Map<String, String> copyData) {
        try {
            String newRoleName = copyData.get("name");
            String newRoleCode = copyData.get("code");
            Role copiedRole = roleService.copyRole(roleId, newRoleName, newRoleCode);
            return ResponseEntity.ok(ApiResponse.success(copiedRole, "角色复制成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    // ==================== 权限管理 API ====================
    
    /**
     * 创建权限
     */
    @PostMapping("/permissions")
    public ResponseEntity<ApiResponse<Permission>> createPermission(@Valid @RequestBody Permission permission) {
        try {
            Permission createdPermission = permissionService.createPermission(permission);
            return ResponseEntity.ok(ApiResponse.success(createdPermission, "权限创建成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 更新权限信息
     */
    @PutMapping("/permissions/{permissionId}")
    public ResponseEntity<ApiResponse<Permission>> updatePermission(
            @PathVariable Long permissionId,
            @Valid @RequestBody Permission permissionDetails) {
        try {
            Permission updatedPermission = permissionService.updatePermission(permissionId, permissionDetails);
            return ResponseEntity.ok(ApiResponse.success(updatedPermission, "权限信息更新成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 获取权限信息
     */
    @GetMapping("/permissions/{permissionId}")
    public ResponseEntity<ApiResponse<Permission>> getPermission(@PathVariable Long permissionId) {
        try {
            Permission permission = permissionService.getPermissionById(permissionId);
            return ResponseEntity.ok(ApiResponse.success(permission));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 获取所有权限
     */
    @GetMapping("/permissions")
    public ResponseEntity<ApiResponse<List<Permission>>> getAllPermissions() {
        try {
            List<Permission> permissions = permissionService.getAllPermissions();
            return ResponseEntity.ok(ApiResponse.success(permissions));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 获取权限树
     */
    @GetMapping("/permissions/tree")
    public ResponseEntity<ApiResponse<List<Permission>>> getPermissionTree() {
        try {
            List<Permission> permissionTree = permissionService.getPermissionTree();
            return ResponseEntity.ok(ApiResponse.success(permissionTree));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 获取用户权限
     */
    @GetMapping("/users/{userId}/permissions")
    public ResponseEntity<ApiResponse<Set<Permission>>> getUserPermissions(@PathVariable Long userId) {
        try {
            Set<Permission> permissions = permissionService.getUserPermissions(userId);
            return ResponseEntity.ok(ApiResponse.success(permissions));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 删除权限
     */
    @DeleteMapping("/permissions/{permissionId}")
    public ResponseEntity<ApiResponse<Void>> deletePermission(@PathVariable Long permissionId) {
        try {
            permissionService.deletePermission(permissionId);
            return ResponseEntity.ok(ApiResponse.success(null, "权限删除成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    // ==================== 数据权限管理 API ====================
    
    /**
     * 创建数据权限
     */
    @PostMapping("/data-permissions")
    public ResponseEntity<ApiResponse<DataPermission>> createDataPermission(@Valid @RequestBody DataPermission dataPermission) {
        try {
            DataPermission createdPermission = dataPermissionService.createDataPermission(dataPermission);
            return ResponseEntity.ok(ApiResponse.success(createdPermission, "数据权限创建成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 更新数据权限
     */
    @PutMapping("/data-permissions/{permissionId}")
    public ResponseEntity<ApiResponse<DataPermission>> updateDataPermission(
            @PathVariable Long permissionId,
            @Valid @RequestBody DataPermission permissionDetails) {
        try {
            DataPermission updatedPermission = dataPermissionService.updateDataPermission(permissionId, permissionDetails);
            return ResponseEntity.ok(ApiResponse.success(updatedPermission, "数据权限更新成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 获取角色的数据权限
     */
    @GetMapping("/roles/{roleId}/data-permissions")
    public ResponseEntity<ApiResponse<List<DataPermission>>> getRoleDataPermissions(@PathVariable Long roleId) {
        try {
            List<DataPermission> permissions = dataPermissionService.getDataPermissionsByRole(roleId);
            return ResponseEntity.ok(ApiResponse.success(permissions));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 检查字段访问权限
     */
    @GetMapping("/users/{userId}/field-access")
    public ResponseEntity<ApiResponse<Boolean>> checkFieldAccess(
            @PathVariable Long userId,
            @RequestParam String tableName,
            @RequestParam String fieldName) {
        try {
            boolean canAccess = dataPermissionService.canAccessField(userId, tableName, fieldName);
            return ResponseEntity.ok(ApiResponse.success(canAccess));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 数据脱敏
     */
    @PostMapping("/users/{userId}/mask-field")
    public ResponseEntity<ApiResponse<String>> maskFieldValue(
            @PathVariable Long userId,
            @RequestBody Map<String, String> maskData) {
        try {
            String tableName = maskData.get("tableName");
            String fieldName = maskData.get("fieldName");
            String originalValue = maskData.get("originalValue");
            
            String maskedValue = dataPermissionService.maskFieldValue(userId, tableName, fieldName, originalValue);
            return ResponseEntity.ok(ApiResponse.success(maskedValue));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 删除数据权限
     */
    @DeleteMapping("/data-permissions/{permissionId}")
    public ResponseEntity<ApiResponse<Void>> deleteDataPermission(@PathVariable Long permissionId) {
        try {
            dataPermissionService.deleteDataPermission(permissionId);
            return ResponseEntity.ok(ApiResponse.success(null, "数据权限删除成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    // ==================== 统计信息 API ====================
    
    /**
     * 获取安全统计信息
     */
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSecurityStatistics() {
        try {
            Map<String, Object> statistics = Map.of(
                "activeUserCount", userService.getActiveUsers().size(),
                "activeRoleCount", roleService.getActiveRoleCount(),
                "activePermissionCount", permissionService.getActivePermissionCount(),
                "activeDataPermissionCount", dataPermissionService.getActiveDataPermissionCount(),
                "roleCountByType", roleService.getRoleCountByType(),
                "permissionCountByType", permissionService.getPermissionCountByType(),
                "dataPermissionCountByType", dataPermissionService.getDataPermissionCountByType()
            );
            return ResponseEntity.ok(ApiResponse.success(statistics));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 初始化系统数据
     */
    @PostMapping("/initialize")
    public ResponseEntity<ApiResponse<Void>> initializeSystemData() {
        try {
            roleService.initializeSystemRoles();
            permissionService.initializeSystemPermissions();
            return ResponseEntity.ok(ApiResponse.success(null, "系统数据初始化成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}