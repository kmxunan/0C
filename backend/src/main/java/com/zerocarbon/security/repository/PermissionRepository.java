package com.zerocarbon.security.repository;

import com.zerocarbon.security.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * 权限数据访问层
 * 零碳园区数字孪生系统权限管理
 */
@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {
    
    /**
     * 根据权限代码查找权限
     */
    Optional<Permission> findByCode(String code);
    
    /**
     * 根据权限名称查找权限
     */
    Optional<Permission> findByName(String name);
    
    /**
     * 检查权限代码是否存在
     */
    boolean existsByCode(String code);
    
    /**
     * 检查权限名称是否存在
     */
    boolean existsByName(String name);
    
    /**
     * 根据权限类型查找权限
     */
    List<Permission> findByType(Permission.PermissionType type);
    
    /**
     * 根据权限分组查找权限
     */
    List<Permission> findByGroup(String group);
    
    /**
     * 根据资源标识查找权限
     */
    List<Permission> findByResource(String resource);
    
    /**
     * 根据操作标识查找权限
     */
    List<Permission> findByAction(String action);
    
    /**
     * 根据资源和操作查找权限
     */
    Optional<Permission> findByResourceAndAction(String resource, String action);
    
    /**
     * 查找启用的权限
     */
    List<Permission> findByEnabledTrue();
    
    /**
     * 查找禁用的权限
     */
    List<Permission> findByEnabledFalse();
    
    /**
     * 查找系统权限
     */
    List<Permission> findByIsSystemTrue();
    
    /**
     * 查找非系统权限
     */
    List<Permission> findByIsSystemFalse();
    
    /**
     * 根据权限级别查找权限
     */
    List<Permission> findByLevelGreaterThanEqual(Integer level);
    
    /**
     * 根据权限级别范围查找权限
     */
    List<Permission> findByLevelBetween(Integer minLevel, Integer maxLevel);
    
    /**
     * 根据父权限ID查找子权限
     */
    List<Permission> findByParentId(Long parentId);
    
    /**
     * 查找根权限（无父权限）
     */
    List<Permission> findByParentIdIsNull();
    
    /**
     * 根据角色ID查找权限
     */
    @Query("SELECT p FROM Permission p JOIN p.roles r WHERE r.id = :roleId")
    Set<Permission> findByRoleId(@Param("roleId") Long roleId);
    
    /**
     * 根据用户ID查找权限
     */
    @Query("SELECT DISTINCT p FROM Permission p JOIN p.roles r JOIN r.users u WHERE u.id = :userId")
    Set<Permission> findByUserId(@Param("userId") Long userId);
    
    /**
     * 根据用户名查找权限
     */
    @Query("SELECT DISTINCT p FROM Permission p JOIN p.roles r JOIN r.users u WHERE u.username = :username")
    Set<Permission> findByUsername(@Param("username") String username);
    
    /**
     * 查找模块权限
     */
    @Query("SELECT p FROM Permission p WHERE p.type = 'MODULE'")
    List<Permission> findModulePermissions();
    
    /**
     * 查找操作权限
     */
    @Query("SELECT p FROM Permission p WHERE p.type = 'OPERATION'")
    List<Permission> findOperationPermissions();
    
    /**
     * 查找数据权限
     */
    @Query("SELECT p FROM Permission p WHERE p.type = 'DATA'")
    List<Permission> findDataPermissions();
    
    /**
     * 查找字段权限
     */
    @Query("SELECT p FROM Permission p WHERE p.type = 'FIELD'")
    List<Permission> findFieldPermissions();
    
    /**
     * 根据权限代码列表查找权限
     */
    List<Permission> findByCodeIn(List<String> codes);
    
    /**
     * 查找权限树结构
     */
    @Query("SELECT p FROM Permission p WHERE p.parentId IS NULL ORDER BY p.sortOrder")
    List<Permission> findRootPermissions();
    
    /**
     * 查找权限层级路径
     */
    @Query("SELECT p FROM Permission p WHERE p.path LIKE :pathPattern ORDER BY p.path")
    List<Permission> findByPathPattern(@Param("pathPattern") String pathPattern);
    
    /**
     * 统计权限数量
     */
    @Query("SELECT COUNT(p) FROM Permission p WHERE p.enabled = true")
    Long countActivePermissions();
    
    /**
     * 统计各类型权限数量
     */
    @Query("SELECT p.type, COUNT(p) FROM Permission p GROUP BY p.type")
    List<Object[]> countPermissionsByType();
    
    /**
     * 统计各分组权限数量
     */
    @Query("SELECT p.group, COUNT(p) FROM Permission p WHERE p.group IS NOT NULL GROUP BY p.group")
    List<Object[]> countPermissionsByGroup();
    
    /**
     * 统计各级别权限数量
     */
    @Query("SELECT p.level, COUNT(p) FROM Permission p GROUP BY p.level ORDER BY p.level")
    List<Object[]> countPermissionsByLevel();
    
    /**
     * 模糊查询权限
     */
    @Query("SELECT p FROM Permission p WHERE p.code LIKE %:keyword% OR p.name LIKE %:keyword% OR p.description LIKE %:keyword%")
    List<Permission> searchPermissions(@Param("keyword") String keyword);
    
    /**
     * 查找未分配给任何角色的权限
     */
    @Query("SELECT p FROM Permission p WHERE p.roles IS EMPTY")
    List<Permission> findUnassignedPermissions();
    
    /**
     * 查找孤立权限（无父权限且无子权限）
     */
    @Query("SELECT p FROM Permission p WHERE p.parentId IS NULL AND NOT EXISTS (SELECT 1 FROM Permission child WHERE child.parentId = p.id)")
    List<Permission> findOrphanPermissions();
    
    /**
     * 查找具有子权限的权限
     */
    @Query("SELECT DISTINCT p FROM Permission p WHERE EXISTS (SELECT 1 FROM Permission child WHERE child.parentId = p.id)")
    List<Permission> findParentPermissions();
    
    /**
     * 查找叶子权限（无子权限）
     */
    @Query("SELECT p FROM Permission p WHERE NOT EXISTS (SELECT 1 FROM Permission child WHERE child.parentId = p.id)")
    List<Permission> findLeafPermissions();
    
    /**
     * 根据创建者查找权限
     */
    List<Permission> findByCreatedBy(String createdBy);
    
    /**
     * 查找可分配的权限（启用且非系统权限）
     */
    @Query("SELECT p FROM Permission p WHERE p.enabled = true AND p.isSystem = false")
    List<Permission> findAssignablePermissions();
    
    /**
     * 查找高级权限（高于指定级别）
     */
    @Query("SELECT p FROM Permission p WHERE p.level > :level AND p.enabled = true ORDER BY p.level DESC")
    List<Permission> findHighLevelPermissions(@Param("level") Integer level);
    
    /**
     * 查找基础权限（低于指定级别）
     */
    @Query("SELECT p FROM Permission p WHERE p.level <= :level AND p.enabled = true ORDER BY p.level ASC")
    List<Permission> findBasicPermissions(@Param("level") Integer level);
    
    /**
     * 根据资源列表查找权限
     */
    List<Permission> findByResourceIn(List<String> resources);
    
    /**
     * 根据操作列表查找权限
     */
    List<Permission> findByActionIn(List<String> actions);
    
    /**
     * 查找权限依赖关系
     */
    @Query("SELECT p1, p2 FROM Permission p1, Permission p2 WHERE p1.level < p2.level AND p1.resource = p2.resource")
    List<Object[]> findPermissionDependencies();
}