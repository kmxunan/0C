package com.zerocarbon.security.repository;

import com.zerocarbon.security.entity.DataPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 数据权限数据访问层
 * 零碳园区数字孪生系统数据权限管理
 */
@Repository
public interface DataPermissionRepository extends JpaRepository<DataPermission, Long> {
    
    /**
     * 根据角色ID查找数据权限
     */
    List<DataPermission> findByRoleId(Long roleId);
    
    /**
     * 根据表名查找数据权限
     */
    List<DataPermission> findByTableName(String tableName);
    
    /**
     * 根据字段名查找数据权限
     */
    List<DataPermission> findByFieldName(String fieldName);
    
    /**
     * 根据表名和字段名查找数据权限
     */
    List<DataPermission> findByTableNameAndFieldName(String tableName, String fieldName);
    
    /**
     * 根据角色ID、表名和字段名查找数据权限
     */
    Optional<DataPermission> findByRoleIdAndTableNameAndFieldName(Long roleId, String tableName, String fieldName);
    
    /**
     * 根据权限类型查找数据权限
     */
    List<DataPermission> findByPermissionType(DataPermission.DataPermissionType permissionType);
    
    /**
     * 根据数据范围查找数据权限
     */
    List<DataPermission> findByDataScope(DataPermission.DataScope dataScope);
    
    /**
     * 查找启用的数据权限
     */
    List<DataPermission> findByEnabledTrue();
    
    /**
     * 查找禁用的数据权限
     */
    List<DataPermission> findByEnabledFalse();
    
    /**
     * 根据角色ID查找启用的数据权限
     */
    List<DataPermission> findByRoleIdAndEnabledTrue(Long roleId);
    
    /**
     * 根据表名查找启用的数据权限
     */
    List<DataPermission> findByTableNameAndEnabledTrue(String tableName);
    
    /**
     * 根据角色ID和表名查找启用的数据权限
     */
    List<DataPermission> findByRoleIdAndTableNameAndEnabledTrue(Long roleId, String tableName);
    
    /**
     * 根据优先级查找数据权限
     */
    List<DataPermission> findByPriorityGreaterThanEqual(Integer priority);
    
    /**
     * 根据优先级范围查找数据权限
     */
    List<DataPermission> findByPriorityBetween(Integer minPriority, Integer maxPriority);
    
    /**
     * 查找当前有效的数据权限
     */
    @Query("SELECT dp FROM DataPermission dp WHERE dp.enabled = true AND (dp.effectiveTime IS NULL OR dp.effectiveTime <= :now) AND (dp.expireTime IS NULL OR dp.expireTime > :now)")
    List<DataPermission> findEffectivePermissions(@Param("now") LocalDateTime now);
    
    /**
     * 根据角色ID查找当前有效的数据权限
     */
    @Query("SELECT dp FROM DataPermission dp WHERE dp.roleId = :roleId AND dp.enabled = true AND (dp.effectiveTime IS NULL OR dp.effectiveTime <= :now) AND (dp.expireTime IS NULL OR dp.expireTime > :now)")
    List<DataPermission> findEffectivePermissionsByRoleId(@Param("roleId") Long roleId, @Param("now") LocalDateTime now);
    
    /**
     * 根据表名查找当前有效的数据权限
     */
    @Query("SELECT dp FROM DataPermission dp WHERE dp.tableName = :tableName AND dp.enabled = true AND (dp.effectiveTime IS NULL OR dp.effectiveTime <= :now) AND (dp.expireTime IS NULL OR dp.expireTime > :now)")
    List<DataPermission> findEffectivePermissionsByTableName(@Param("tableName") String tableName, @Param("now") LocalDateTime now);
    
    /**
     * 根据角色ID和表名查找当前有效的数据权限
     */
    @Query("SELECT dp FROM DataPermission dp WHERE dp.roleId = :roleId AND dp.tableName = :tableName AND dp.enabled = true AND (dp.effectiveTime IS NULL OR dp.effectiveTime <= :now) AND (dp.expireTime IS NULL OR dp.expireTime > :now) ORDER BY dp.priority DESC")
    List<DataPermission> findEffectivePermissionsByRoleIdAndTableName(@Param("roleId") Long roleId, @Param("tableName") String tableName, @Param("now") LocalDateTime now);
    
    /**
     * 查找需要脱敏的数据权限
     */
    @Query("SELECT dp FROM DataPermission dp WHERE dp.permissionType = 'MASK' AND dp.enabled = true")
    List<DataPermission> findMaskPermissions();
    
    /**
     * 查找拒绝访问的数据权限
     */
    @Query("SELECT dp FROM DataPermission dp WHERE dp.permissionType = 'DENY' AND dp.enabled = true")
    List<DataPermission> findDenyPermissions();
    
    /**
     * 查找只读权限
     */
    @Query("SELECT dp FROM DataPermission dp WHERE dp.permissionType = 'READ' AND dp.enabled = true")
    List<DataPermission> findReadOnlyPermissions();
    
    /**
     * 查找读写权限
     */
    @Query("SELECT dp FROM DataPermission dp WHERE dp.permissionType = 'WRITE' AND dp.enabled = true")
    List<DataPermission> findWritePermissions();
    
    /**
     * 根据角色ID列表查找数据权限
     */
    @Query("SELECT dp FROM DataPermission dp WHERE dp.roleId IN :roleIds AND dp.enabled = true")
    List<DataPermission> findByRoleIds(@Param("roleIds") List<Long> roleIds);
    
    /**
     * 根据表名列表查找数据权限
     */
    List<DataPermission> findByTableNameIn(List<String> tableNames);
    
    /**
     * 根据字段名列表查找数据权限
     */
    List<DataPermission> findByFieldNameIn(List<String> fieldNames);
    
    /**
     * 查找具有数据过滤条件的权限
     */
    @Query("SELECT dp FROM DataPermission dp WHERE dp.dataFilter IS NOT NULL AND dp.dataFilter != '' AND dp.enabled = true")
    List<DataPermission> findPermissionsWithDataFilter();
    
    /**
     * 查找具有脱敏规则的权限
     */
    @Query("SELECT dp FROM DataPermission dp WHERE dp.maskRule IS NOT NULL AND dp.maskRule != '' AND dp.enabled = true")
    List<DataPermission> findPermissionsWithMaskRule();
    
    /**
     * 统计数据权限数量
     */
    @Query("SELECT COUNT(dp) FROM DataPermission dp WHERE dp.enabled = true")
    Long countActiveDataPermissions();
    
    /**
     * 统计各类型数据权限数量
     */
    @Query("SELECT dp.permissionType, COUNT(dp) FROM DataPermission dp GROUP BY dp.permissionType")
    List<Object[]> countDataPermissionsByType();
    
    /**
     * 统计各范围数据权限数量
     */
    @Query("SELECT dp.dataScope, COUNT(dp) FROM DataPermission dp GROUP BY dp.dataScope")
    List<Object[]> countDataPermissionsByScope();
    
    /**
     * 统计各表数据权限数量
     */
    @Query("SELECT dp.tableName, COUNT(dp) FROM DataPermission dp GROUP BY dp.tableName")
    List<Object[]> countDataPermissionsByTable();
    
    /**
     * 查找即将过期的数据权限
     */
    @Query("SELECT dp FROM DataPermission dp WHERE dp.expireTime IS NOT NULL AND dp.expireTime BETWEEN :now AND :threshold AND dp.enabled = true")
    List<DataPermission> findExpiringPermissions(@Param("now") LocalDateTime now, @Param("threshold") LocalDateTime threshold);
    
    /**
     * 查找已过期的数据权限
     */
    @Query("SELECT dp FROM DataPermission dp WHERE dp.expireTime IS NOT NULL AND dp.expireTime < :now")
    List<DataPermission> findExpiredPermissions(@Param("now") LocalDateTime now);
    
    /**
     * 查找未生效的数据权限
     */
    @Query("SELECT dp FROM DataPermission dp WHERE dp.effectiveTime IS NOT NULL AND dp.effectiveTime > :now")
    List<DataPermission> findPendingPermissions(@Param("now") LocalDateTime now);
    
    /**
     * 根据创建者查找数据权限
     */
    List<DataPermission> findByCreatedBy(String createdBy);
    
    /**
     * 查找高优先级数据权限
     */
    @Query("SELECT dp FROM DataPermission dp WHERE dp.priority >= :minPriority AND dp.enabled = true ORDER BY dp.priority DESC")
    List<DataPermission> findHighPriorityPermissions(@Param("minPriority") Integer minPriority);
    
    /**
     * 查找冲突的数据权限
     */
    @Query("SELECT dp1, dp2 FROM DataPermission dp1, DataPermission dp2 WHERE dp1.id != dp2.id AND dp1.roleId = dp2.roleId AND dp1.tableName = dp2.tableName AND dp1.fieldName = dp2.fieldName AND dp1.enabled = true AND dp2.enabled = true")
    List<Object[]> findConflictingPermissions();
    
    /**
     * 查找重复的数据权限
     */
    @Query("SELECT dp FROM DataPermission dp WHERE EXISTS (SELECT 1 FROM DataPermission dp2 WHERE dp2.id != dp.id AND dp2.roleId = dp.roleId AND dp2.tableName = dp.tableName AND dp2.fieldName = dp.fieldName AND dp2.permissionType = dp.permissionType)")
    List<DataPermission> findDuplicatePermissions();
    
    /**
     * 删除过期的数据权限
     */
    @Query("DELETE FROM DataPermission dp WHERE dp.expireTime IS NOT NULL AND dp.expireTime < :now")
    void deleteExpiredPermissions(@Param("now") LocalDateTime now);
    
    /**
     * 批量更新数据权限状态
     */
    @Query("UPDATE DataPermission dp SET dp.enabled = :enabled WHERE dp.id IN :ids")
    void updatePermissionStatus(@Param("ids") List<Long> ids, @Param("enabled") Boolean enabled);
}