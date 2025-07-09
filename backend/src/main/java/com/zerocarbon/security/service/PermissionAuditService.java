package com.zerocarbon.security.service;

import com.zerocarbon.security.entity.PermissionAuditLog;
import com.zerocarbon.security.repository.PermissionAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * 权限审计服务
 * 零碳园区数字孪生系统权限审计管理
 *
 * @author 零碳园区数字孪生系统开发团队
 * @version 1.0
 * @since 2025-06-01
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PermissionAuditService {
    
    private final PermissionAuditLogRepository auditLogRepository;
    
    /**
     * 异步记录审计日志
     */
    @Async
    @Transactional
    public CompletableFuture<Void> recordAuditLogAsync(PermissionAuditLog auditLog) {
        try {
            // 补充请求信息
            enrichAuditLogWithRequestInfo(auditLog);
            
            // 保存审计日志
            auditLogRepository.save(auditLog);
            
            log.debug("权限审计日志记录成功: 用户={}, 操作={}, 资源={}", 
                     auditLog.getUserId(), auditLog.getAuditType(), auditLog.getResourceType());
                     
        } catch (Exception e) {
            log.error("记录权限审计日志失败", e);
        }
        
        return CompletableFuture.completedFuture(null);
    }
    
    /**
     * 同步记录审计日志
     */
    @Transactional
    public void recordAuditLog(PermissionAuditLog auditLog) {
        try {
            // 补充请求信息
            enrichAuditLogWithRequestInfo(auditLog);
            
            // 保存审计日志
            auditLogRepository.save(auditLog);
            
            log.debug("权限审计日志记录成功: 用户={}, 操作={}, 资源={}", 
                     auditLog.getUserId(), auditLog.getAuditType(), auditLog.getResourceType());
                     
        } catch (Exception e) {
            log.error("记录权限审计日志失败", e);
        }
    }
    
    /**
     * 记录登录审计
     */
    public void recordLoginAudit(Long userId, String username, boolean success, String failureReason) {
        PermissionAuditLog auditLog = PermissionAuditLog.createLoginAudit(
            userId, username, success, failureReason
        );
        recordAuditLogAsync(auditLog);
    }
    
    /**
     * 记录权限检查审计
     */
    public void recordPermissionCheckAudit(Long userId, String username, String permissionCode, 
                                          String resourceType, String resourceId, boolean granted) {
        PermissionAuditLog auditLog = PermissionAuditLog.createPermissionCheckAudit(
            userId, username, permissionCode, resourceType, resourceId, granted
        );
        recordAuditLogAsync(auditLog);
    }
    
    /**
     * 记录数据访问审计
     */
    public void recordDataAccessAudit(Long userId, String username, String operation, 
                                     String resourceType, String resourceId, boolean success) {
        PermissionAuditLog auditLog = PermissionAuditLog.createDataAccessAudit(
            userId, username, operation, resourceType, resourceId, success
        );
        recordAuditLogAsync(auditLog);
    }
    
    /**
     * 记录权限变更审计
     */
    public void recordPermissionChangeAudit(Long userId, String username, String operation, 
                                           String targetUser, String permissionDetails) {
        PermissionAuditLog auditLog = PermissionAuditLog.createPermissionChangeAudit(
            userId, username, operation, targetUser, permissionDetails
        );
        recordAuditLogAsync(auditLog);
    }
    
    /**
     * 记录安全事件审计
     */
    public void recordSecurityEventAudit(Long userId, String username, String eventType, 
                                        String description, PermissionAuditLog.AuditLevel level) {
        PermissionAuditLog auditLog = PermissionAuditLog.createSecurityEventAudit(
            userId, username, eventType, description, level
        );
        recordAuditLogAsync(auditLog);
    }
    
    /**
     * 记录系统操作审计
     */
    public void recordSystemOperationAudit(Long userId, String username, String operation, 
                                          String description, boolean success) {
        PermissionAuditLog auditLog = PermissionAuditLog.createSystemOperationAudit(
            userId, username, operation, description, success
        );
        recordAuditLogAsync(auditLog);
    }
    
    /**
     * 根据用户ID查询审计日志
     */
    @Transactional(readOnly = true)
    public Page<PermissionAuditLog> getAuditLogsByUser(Long userId, Pageable pageable) {
        return auditLogRepository.findByUserId(userId, pageable);
    }
    
    /**
     * 根据时间范围查询审计日志
     */
    @Transactional(readOnly = true)
    public Page<PermissionAuditLog> getAuditLogsByTimeRange(LocalDateTime startTime, LocalDateTime endTime, Pageable pageable) {
        return auditLogRepository.findByOperationTimeBetween(startTime, endTime, pageable);
    }
    
    /**
     * 查询失败的操作日志
     */
    @Transactional(readOnly = true)
    public Page<PermissionAuditLog> getFailedOperations(Pageable pageable) {
        return auditLogRepository.findFailedOperations(pageable);
    }
    
    /**
     * 查询高风险操作
     */
    @Transactional(readOnly = true)
    public Page<PermissionAuditLog> getHighRiskOperations(Pageable pageable) {
        return auditLogRepository.findHighRiskOperations(pageable);
    }
    
    /**
     * 复合条件查询
     */
    @Transactional(readOnly = true)
    public Page<PermissionAuditLog> searchAuditLogs(Long userId, PermissionAuditLog.AuditType auditType,
                                                   PermissionAuditLog.OperationResult result, String resourceType,
                                                   LocalDateTime startTime, LocalDateTime endTime, Pageable pageable) {
        return auditLogRepository.findByMultipleConditions(userId, auditType, result, resourceType, startTime, endTime, pageable);
    }
    
    /**
     * 获取用户操作统计
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getUserOperationStatistics(Long userId, LocalDateTime startTime, LocalDateTime endTime) {
        Long totalOperations = auditLogRepository.countUserOperations(userId, startTime, endTime);
        Long failedOperations = auditLogRepository.countUserFailedOperations(userId, startTime, endTime);
        
        return Map.of(
            "totalOperations", totalOperations,
            "failedOperations", failedOperations,
            "successRate", totalOperations > 0 ? (double)(totalOperations - failedOperations) / totalOperations * 100 : 0.0
        );
    }
    
    /**
     * 获取系统活跃用户统计
     */
    @Transactional(readOnly = true)
    public List<Object[]> getActiveUsersStatistics(LocalDateTime startTime, LocalDateTime endTime, Pageable pageable) {
        return auditLogRepository.getActiveUsersStatistics(startTime, endTime, pageable);
    }
    
    /**
     * 获取操作类型统计
     */
    @Transactional(readOnly = true)
    public List<Object[]> getOperationTypeStatistics(LocalDateTime startTime, LocalDateTime endTime) {
        return auditLogRepository.getOperationTypeStatistics(startTime, endTime);
    }
    
    /**
     * 查找可疑的IP地址活动
     */
    @Transactional(readOnly = true)
    public List<Object[]> findSuspiciousIpActivity(LocalDateTime startTime, LocalDateTime endTime, 
                                                   Long maxUsers, Long maxOperations) {
        return auditLogRepository.findSuspiciousIpActivity(startTime, endTime, maxUsers, maxOperations);
    }
    
    /**
     * 获取用户最近登录记录
     */
    @Transactional(readOnly = true)
    public List<PermissionAuditLog> getRecentLoginsByUser(Long userId, int limit) {
        return auditLogRepository.findRecentLoginsByUser(userId, Pageable.ofSize(limit));
    }
    
    /**
     * 根据会话ID查找相关日志
     */
    @Transactional(readOnly = true)
    public List<PermissionAuditLog> getLogsBySession(String sessionId) {
        return auditLogRepository.findBySessionIdOrderByOperationTimeDesc(sessionId);
    }
    
    /**
     * 清理过期的审计日志
     */
    @Transactional
    public int cleanExpiredLogs(LocalDateTime expireTime) {
        int deletedCount = auditLogRepository.deleteExpiredLogs(expireTime);
        log.info("清理过期审计日志完成，删除记录数: {}", deletedCount);
        return deletedCount;
    }
    
    /**
     * 检查用户是否存在异常行为
     */
    @Transactional(readOnly = true)
    public boolean checkUserAnomalousActivity(Long userId, LocalDateTime startTime, LocalDateTime endTime) {
        // 检查失败操作比例
        Long totalOperations = auditLogRepository.countUserOperations(userId, startTime, endTime);
        Long failedOperations = auditLogRepository.countUserFailedOperations(userId, startTime, endTime);
        
        if (totalOperations > 0) {
            double failureRate = (double) failedOperations / totalOperations;
            // 如果失败率超过30%，认为存在异常
            if (failureRate > 0.3) {
                return true;
            }
        }
        
        // 检查操作频率是否异常（每小时超过1000次操作）
        long hours = java.time.Duration.between(startTime, endTime).toHours();
        if (hours > 0 && totalOperations / hours > 1000) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 补充审计日志的请求信息
     */
    private void enrichAuditLogWithRequestInfo(PermissionAuditLog auditLog) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                
                // 设置IP地址
                if (auditLog.getIpAddress() == null) {
                    auditLog.setIpAddress(getClientIpAddress(request));
                }
                
                // 设置用户代理
                if (auditLog.getUserAgent() == null) {
                    auditLog.setUserAgent(request.getHeader("User-Agent"));
                }
                
                // 设置请求方法和URL
                if (auditLog.getRequestMethod() == null) {
                    auditLog.setRequestMethod(request.getMethod());
                }
                if (auditLog.getRequestUrl() == null) {
                    auditLog.setRequestUrl(request.getRequestURI());
                }
                
                // 设置会话ID
                if (auditLog.getSessionId() == null && request.getSession(false) != null) {
                    auditLog.setSessionId(request.getSession().getId());
                }
            }
        } catch (Exception e) {
            log.warn("补充审计日志请求信息失败", e);
        }
    }
    
    /**
     * 获取客户端真实IP地址
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String[] headerNames = {
            "X-Forwarded-For",
            "X-Real-IP",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_CLIENT_IP",
            "HTTP_X_FORWARDED_FOR"
        };
        
        for (String headerName : headerNames) {
            String ip = request.getHeader(headerName);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // 多级代理的情况，取第一个IP
                if (ip.contains(",")) {
                    ip = ip.split(",")[0].trim();
                }
                return ip;
            }
        }
        
        return request.getRemoteAddr();
    }
}