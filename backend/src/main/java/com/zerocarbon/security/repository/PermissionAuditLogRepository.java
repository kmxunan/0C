package com.zerocarbon.security.repository;

import com.zerocarbon.security.entity.PermissionAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 权限审计日志数据访问层
 * 零碳园区数字孪生系统权限审计管理
 * 
 * @author 零碳园区数字孪生系统开发团队
 * @version 1.0
 * @since 2025-06-01
 */
@Repository
public interface PermissionAuditLogRepository extends JpaRepository<PermissionAuditLog, Long> {
    
    /**
     * 根据用户ID查找审计日志
     */
    Page<PermissionAuditLog> findByUserId(Long userId, Pageable pageable);
    
    /**
     * 根据审计类型查找日志
     */
    Page<PermissionAuditLog> findByAuditType(PermissionAuditLog.AuditType auditType, Pageable pageable);
    
    /**
     * 根据时间范围查找日志
     */
    @Query("SELECT p FROM PermissionAuditLog p WHERE p.operationTime BETWEEN :startTime AND :endTime ORDER BY p.operationTime DESC")
    Page<PermissionAuditLog> findByOperationTimeBetween(@Param("startTime") LocalDateTime startTime, 
                                                       @Param("endTime") LocalDateTime endTime, 
                                                       Pageable pageable);
    
    /**
     * 根据用户和时间范围查找日志
     */
    @Query("SELECT p FROM PermissionAuditLog p WHERE p.userId = :userId AND p.operationTime BETWEEN :startTime AND :endTime ORDER BY p.operationTime DESC")
    Page<PermissionAuditLog> findByUserIdAndOperationTimeBetween(@Param("userId") Long userId,
                                                                @Param("startTime") LocalDateTime startTime,
                                                                @Param("endTime") LocalDateTime endTime,
                                                                Pageable pageable);
    
    /**
     * 根据资源类型查找日志
     */
    Page<PermissionAuditLog> findByResourceType(String resourceType, Pageable pageable);
    
    /**
     * 根据操作结果查找日志
     */
    Page<PermissionAuditLog> findByResult(PermissionAuditLog.OperationResult result, Pageable pageable);
    
    /**
     * 根据审计级别查找日志
     */
    Page<PermissionAuditLog> findByAuditLevel(PermissionAuditLog.AuditLevel auditLevel, Pageable pageable);
    
    /**
     * 根据IP地址查找日志
     */
    Page<PermissionAuditLog> findByIpAddress(String ipAddress, Pageable pageable);
    
    /**
     * 查找失败的操作日志
     */
    @Query("SELECT p FROM PermissionAuditLog p WHERE p.result IN ('FAILURE', 'DENIED', 'ERROR') ORDER BY p.operationTime DESC")
    Page<PermissionAuditLog> findFailedOperations(Pageable pageable);
    
    /**
     * 查找特定用户的失败操作
     */
    @Query("SELECT p FROM PermissionAuditLog p WHERE p.userId = :userId AND p.result IN ('FAILURE', 'DENIED', 'ERROR') ORDER BY p.operationTime DESC")
    Page<PermissionAuditLog> findFailedOperationsByUser(@Param("userId") Long userId, Pageable pageable);
    
    /**
     * 统计用户在指定时间范围内的操作次数
     */
    @Query("SELECT COUNT(p) FROM PermissionAuditLog p WHERE p.userId = :userId AND p.operationTime BETWEEN :startTime AND :endTime")
    Long countUserOperations(@Param("userId") Long userId, 
                           @Param("startTime") LocalDateTime startTime, 
                           @Param("endTime") LocalDateTime endTime);
    
    /**
     * 统计失败操作次数
     */
    @Query("SELECT COUNT(p) FROM PermissionAuditLog p WHERE p.userId = :userId AND p.result IN ('FAILURE', 'DENIED', 'ERROR') AND p.operationTime BETWEEN :startTime AND :endTime")
    Long countUserFailedOperations(@Param("userId") Long userId, 
                                  @Param("startTime") LocalDateTime startTime, 
                                  @Param("endTime") LocalDateTime endTime);
    
    /**
     * 查找高风险操作（权限变更、安全事件等）
     */
    @Query("SELECT p FROM PermissionAuditLog p WHERE p.auditType IN ('PERMISSION_CHANGE', 'SECURITY_EVENT') OR p.auditLevel IN ('ERROR', 'CRITICAL') ORDER BY p.operationTime DESC")
    Page<PermissionAuditLog> findHighRiskOperations(Pageable pageable);
    
    /**
     * 根据权限代码查找相关日志
     */
    Page<PermissionAuditLog> findByPermissionCodeContaining(String permissionCode, Pageable pageable);
    
    /**
     * 复合条件查询
     */
    @Query("SELECT p FROM PermissionAuditLog p WHERE " +
           "(:userId IS NULL OR p.userId = :userId) AND " +
           "(:auditType IS NULL OR p.auditType = :auditType) AND " +
           "(:result IS NULL OR p.result = :result) AND " +
           "(:resourceType IS NULL OR p.resourceType = :resourceType) AND " +
           "(:startTime IS NULL OR p.operationTime >= :startTime) AND " +
           "(:endTime IS NULL OR p.operationTime <= :endTime) " +
           "ORDER BY p.operationTime DESC")
    Page<PermissionAuditLog> findByMultipleConditions(@Param("userId") Long userId,
                                                     @Param("auditType") PermissionAuditLog.AuditType auditType,
                                                     @Param("result") PermissionAuditLog.OperationResult result,
                                                     @Param("resourceType") String resourceType,
                                                     @Param("startTime") LocalDateTime startTime,
                                                     @Param("endTime") LocalDateTime endTime,
                                                     Pageable pageable);
    
    /**
     * 获取用户最近的登录日志
     */
    @Query("SELECT p FROM PermissionAuditLog p WHERE p.userId = :userId AND p.auditType = 'LOGIN' ORDER BY p.operationTime DESC")
    List<PermissionAuditLog> findRecentLoginsByUser(@Param("userId") Long userId, Pageable pageable);
    
    /**
     * 获取系统活跃用户统计
     */
    @Query("SELECT p.userId, COUNT(p) as operationCount FROM PermissionAuditLog p WHERE p.operationTime BETWEEN :startTime AND :endTime GROUP BY p.userId ORDER BY operationCount DESC")
    List<Object[]> getActiveUsersStatistics(@Param("startTime") LocalDateTime startTime, 
                                           @Param("endTime") LocalDateTime endTime, 
                                           Pageable pageable);
    
    /**
     * 获取操作类型统计
     */
    @Query("SELECT p.auditType, COUNT(p) as count FROM PermissionAuditLog p WHERE p.operationTime BETWEEN :startTime AND :endTime GROUP BY p.auditType")
    List<Object[]> getOperationTypeStatistics(@Param("startTime") LocalDateTime startTime, 
                                             @Param("endTime") LocalDateTime endTime);
    
    /**
     * 删除过期的审计日志
     */
    @Modifying
    @Query("DELETE FROM PermissionAuditLog p WHERE p.operationTime < :expireTime")
    int deleteExpiredLogs(@Param("expireTime") LocalDateTime expireTime);
    
    /**
     * 根据会话ID查找日志
     */
    List<PermissionAuditLog> findBySessionIdOrderByOperationTimeDesc(String sessionId);
    
    /**
     * 查找可疑的IP地址活动
     */
    @Query("SELECT p.ipAddress, COUNT(DISTINCT p.userId) as userCount, COUNT(p) as operationCount " +
           "FROM PermissionAuditLog p WHERE p.operationTime BETWEEN :startTime AND :endTime " +
           "GROUP BY p.ipAddress HAVING userCount > :maxUsers OR operationCount > :maxOperations")
    List<Object[]> findSuspiciousIpActivity(@Param("startTime") LocalDateTime startTime,
                                           @Param("endTime") LocalDateTime endTime,
                                           @Param("maxUsers") Long maxUsers,
                                           @Param("maxOperations") Long maxOperations);
}