package com.zerocarbon.security.repository;

import com.zerocarbon.security.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * 角色数据访问层
 * 零碳园区数字孪生系统角色管理
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    
    /**
     * 根据角色代码查找角色
     */
    Optional<Role> findByCode(String code);
    
    /**
     * 根据角色名称查找角色
     */
    Optional<Role> findByName(String name);
    
    /**
     * 检查角色代码是否存在
     */
    boolean existsByCode(String code);
    
    /**
     * 检查角色名称是否存在
     */
    boolean existsByName(String name);
    
    /**
     * 根据角色类型查找角色
     */
    List<Role> findByType(Role.RoleType type);
    
    /**
     * 查找启用的角色
     */
    List<Role> findByEnabledTrue();
    
    /**
     * 查找禁用的角色
     */
    List<Role> findByEnabledFalse();
    
    /**
     * 查找默认角色
     */
    List<Role> findByIsDefaultTrue();
    
    /**
     * 根据角色级别查找角色
     */
    List<Role> findByLevelGreaterThanEqual(Integer level);
    
    /**
     * 根据角色级别范围查找角色
     */
    List<Role> findByLevelBetween(Integer minLevel, Integer maxLevel);
    
    /**
     * 查找系统角色
     */
    @Query("SELECT r FROM Role r WHERE r.type = 'SYSTEM'")
    List<Role> findSystemRoles();
    
    /**
     * 查找业务角色
     */
    @Query("SELECT r FROM Role r WHERE r.type = 'BUSINESS'")
    List<Role> findBusinessRoles();
    
    /**
     * 查找自定义角色
     */
    @Query("SELECT r FROM Role r WHERE r.type = 'CUSTOM'")
    List<Role> findCustomRoles();
    
    /**
     * 根据用户ID查找角色
     */
    @Query("SELECT r FROM Role r JOIN r.users u WHERE u.id = :userId")
    Set<Role> findByUserId(@Param("userId") Long userId);
    
    /**
     * 根据权限代码查找角色
     */
    @Query("SELECT r FROM Role r JOIN r.permissions p WHERE p.code = :permissionCode")
    List<Role> findByPermissionCode(@Param("permissionCode") String permissionCode);
    
    /**
     * 查找具有指定权限的角色
     */
    @Query("SELECT DISTINCT r FROM Role r JOIN r.permissions p WHERE p.code IN :permissionCodes")
    List<Role> findByPermissionCodes(@Param("permissionCodes") List<String> permissionCodes);
    
    /**
     * 查找角色层级关系
     */
    @Query("SELECT r FROM Role r WHERE r.level > :level ORDER BY r.level ASC")
    List<Role> findHigherLevelRoles(@Param("level") Integer level);
    
    /**
     * 查找角色层级关系
     */
    @Query("SELECT r FROM Role r WHERE r.level < :level ORDER BY r.level DESC")
    List<Role> findLowerLevelRoles(@Param("level") Integer level);
    
    /**
     * 统计角色数量
     */
    @Query("SELECT COUNT(r) FROM Role r WHERE r.enabled = true")
    Long countActiveRoles();
    
    /**
     * 统计各类型角色数量
     */
    @Query("SELECT r.type, COUNT(r) FROM Role r GROUP BY r.type")
    List<Object[]> countRolesByType();
    
    /**
     * 统计各级别角色数量
     */
    @Query("SELECT r.level, COUNT(r) FROM Role r GROUP BY r.level ORDER BY r.level")
    List<Object[]> countRolesByLevel();
    
    /**
     * 模糊查询角色
     */
    @Query("SELECT r FROM Role r WHERE r.code LIKE %:keyword% OR r.name LIKE %:keyword% OR r.description LIKE %:keyword%")
    List<Role> searchRoles(@Param("keyword") String keyword);
    
    /**
     * 查找未分配给任何用户的角色
     */
    @Query("SELECT r FROM Role r WHERE r.users IS EMPTY")
    List<Role> findUnassignedRoles();
    
    /**
     * 查找没有权限的角色
     */
    @Query("SELECT r FROM Role r WHERE r.permissions IS EMPTY")
    List<Role> findRolesWithoutPermissions();
    
    /**
     * 查找具有特定权限数量的角色
     */
    @Query("SELECT r FROM Role r WHERE SIZE(r.permissions) >= :minCount")
    List<Role> findRolesWithMinPermissions(@Param("minCount") int minCount);
    
    /**
     * 查找具有特定用户数量的角色
     */
    @Query("SELECT r FROM Role r WHERE SIZE(r.users) >= :minCount")
    List<Role> findRolesWithMinUsers(@Param("minCount") int minCount);
    
    /**
     * 根据创建者查找角色
     */
    List<Role> findByCreatedBy(String createdBy);
    
    /**
     * 查找可分配的角色（启用且非系统角色）
     */
    @Query("SELECT r FROM Role r WHERE r.enabled = true AND r.type != 'SYSTEM'")
    List<Role> findAssignableRoles();
    
    /**
     * 查找角色继承关系
     */
    @Query("SELECT r1, r2 FROM Role r1, Role r2 WHERE r1.level < r2.level AND r1.enabled = true AND r2.enabled = true")
    List<Object[]> findRoleHierarchy();
}