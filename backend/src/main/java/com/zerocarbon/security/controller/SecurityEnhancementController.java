package com.zerocarbon.security.controller;

import com.zerocarbon.security.annotation.PermissionAudit;
import com.zerocarbon.security.entity.PermissionAuditLog;
import com.zerocarbon.security.service.DataBackupService;
import com.zerocarbon.security.service.DataEncryptionService;
import com.zerocarbon.security.service.PermissionAuditService;
import com.zerocarbon.security.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * 安全增强控制器
 * 提供数据安全加固相关的API接口
 */
@RestController
@RequestMapping("/api/security")
@Tag(name = "安全增强", description = "数据安全加固相关接口")
public class SecurityEnhancementController {
    
    @Autowired
    private DataEncryptionService encryptionService;
    
    @Autowired
    private DataBackupService backupService;
    
    @Autowired
    private PermissionAuditService auditService;
    
    // ==================== 数据加密相关接口 ====================
    
    @PostMapping("/encryption/encrypt")
    @Operation(summary = "加密数据", description = "对敏感数据进行加密")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('SECURITY_MANAGE')")
    @PermissionAudit(type = PermissionAuditLog.AuditType.DATA_ACCESS, description = "数据加密操作")
    public ResponseEntity<Map<String, String>> encryptData(
            @RequestBody Map<String, String> data,
            @Parameter(description = "加密密钥ID") @RequestParam(required = false) String keyId) {
        
        Map<String, String> encryptedData = encryptionService.encryptBatch(data, keyId);
        return ResponseEntity.ok(encryptedData);
    }
    
    @PostMapping("/encryption/decrypt")
    @Operation(summary = "解密数据", description = "对加密数据进行解密")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('SECURITY_MANAGE')")
    @PermissionAudit(type = PermissionAuditLog.AuditType.DATA_ACCESS, description = "数据解密操作")
    public ResponseEntity<Map<String, String>> decryptData(
            @RequestBody Map<String, String> encryptedData,
            @Parameter(description = "解密密钥ID") @RequestParam(required = false) String keyId) {
        
        Map<String, String> decryptedData = encryptionService.decryptBatch(encryptedData, keyId);
        return ResponseEntity.ok(decryptedData);
    }
    
    @PostMapping("/encryption/hash")
    @Operation(summary = "计算哈希值", description = "计算数据的哈希值")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('SECURITY_MANAGE')")
    @PermissionAudit(type = PermissionAuditLog.AuditType.DATA_ACCESS, description = "数据哈希计算")
    public ResponseEntity<String> hashData(
            @Parameter(description = "待哈希的数据") @RequestParam String data,
            @Parameter(description = "盐值") @RequestParam(required = false) String salt) {
        
        String hash = encryptionService.hash(data, salt);
        return ResponseEntity.ok(hash);
    }
    
    @PostMapping("/encryption/verify-hash")
    @Operation(summary = "验证哈希值", description = "验证数据的哈希值是否正确")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('SECURITY_MANAGE')")
    @PermissionAudit(type = PermissionAuditLog.AuditType.DATA_ACCESS, description = "哈希值验证")
    public ResponseEntity<Boolean> verifyHash(
            @Parameter(description = "原始数据") @RequestParam String data,
            @Parameter(description = "哈希值") @RequestParam String hash,
            @Parameter(description = "盐值") @RequestParam(required = false) String salt) {
        
        boolean isValid = encryptionService.verifyHash(data, hash, salt);
        return ResponseEntity.ok(isValid);
    }
    
    @PostMapping("/encryption/generate-key")
    @Operation(summary = "生成加密密钥", description = "生成新的加密密钥")
    @PreAuthorize("hasRole('ADMIN')")
    @PermissionAudit(type = PermissionAuditLog.AuditType.SECURITY_EVENT, description = "生成加密密钥")
    public ResponseEntity<String> generateKey() {
        String key = encryptionService.generateKey();
        return ResponseEntity.ok(key);
    }
    
    @GetMapping("/encryption/info")
    @Operation(summary = "获取加密信息", description = "获取当前加密算法信息")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('SECURITY_MANAGE')")
    public ResponseEntity<Map<String, String>> getEncryptionInfo() {
        Map<String, String> info = encryptionService.getEncryptionInfo();
        return ResponseEntity.ok(info);
    }
    
    // ==================== 数据备份相关接口 ====================
    
    @PostMapping("/backup/full")
    @Operation(summary = "执行全量备份", description = "执行数据库和文件的全量备份")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('BACKUP_MANAGE')")
    @PermissionAudit(type = PermissionAuditLog.AuditType.SYSTEM_OPERATION, description = "执行全量备份")
    public ResponseEntity<CompletableFuture<DataBackupService.BackupInfo>> performFullBackup() {
        CompletableFuture<DataBackupService.BackupInfo> backup = backupService.performFullBackup();
        return ResponseEntity.ok(backup);
    }
    
    @PostMapping("/backup/incremental")
    @Operation(summary = "执行增量备份", description = "执行数据库和文件的增量备份")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('BACKUP_MANAGE')")
    @PermissionAudit(type = PermissionAuditLog.AuditType.SYSTEM_OPERATION, description = "执行增量备份")
    public ResponseEntity<CompletableFuture<DataBackupService.BackupInfo>> performIncrementalBackup() {
        CompletableFuture<DataBackupService.BackupInfo> backup = backupService.performIncrementalBackup();
        return ResponseEntity.ok(backup);
    }
    
    @GetMapping("/backup/list")
    @Operation(summary = "获取备份列表", description = "获取所有备份的列表")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('BACKUP_MANAGE')")
    public ResponseEntity<List<DataBackupService.BackupInfo>> getBackupList() {
        List<DataBackupService.BackupInfo> backups = backupService.getAllBackups();
        return ResponseEntity.ok(backups);
    }
    
    @GetMapping("/backup/{backupId}")
    @Operation(summary = "获取备份信息", description = "获取指定备份的详细信息")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('BACKUP_MANAGE')")
    public ResponseEntity<DataBackupService.BackupInfo> getBackupInfo(
            @Parameter(description = "备份ID") @PathVariable String backupId) {
        
        DataBackupService.BackupInfo backup = backupService.getBackupInfo(backupId);
        if (backup == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(backup);
    }
    
    @PostMapping("/backup/{backupId}/restore")
    @Operation(summary = "恢复备份", description = "从指定备份恢复数据")
    @PreAuthorize("hasRole('ADMIN')")
    @PermissionAudit(type = PermissionAuditLog.AuditType.SYSTEM_OPERATION, description = "恢复备份数据")
    public ResponseEntity<Boolean> restoreBackup(
            @Parameter(description = "备份ID") @PathVariable String backupId) {
        
        boolean success = backupService.restoreFromBackup(backupId);
        return ResponseEntity.ok(success);
    }
    
    @DeleteMapping("/backup/{backupId}")
    @Operation(summary = "删除备份", description = "删除指定的备份")
    @PreAuthorize("hasRole('ADMIN')")
    @PermissionAudit(type = PermissionAuditLog.AuditType.SYSTEM_OPERATION, description = "删除备份")
    public ResponseEntity<Boolean> deleteBackup(
            @Parameter(description = "备份ID") @PathVariable String backupId) {
        
        boolean success = backupService.deleteBackup(backupId);
        return ResponseEntity.ok(success);
    }
    
    // ==================== 权限审计相关接口 ====================
    
    @GetMapping("/audit/logs")
    @Operation(summary = "获取审计日志", description = "分页获取权限审计日志")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('AUDIT_VIEW')")
    public ResponseEntity<Page<PermissionAuditLog>> getAuditLogs(
            @Parameter(description = "用户ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "审计类型") @RequestParam(required = false) PermissionAuditLog.AuditType auditType,
            @Parameter(description = "开始时间") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @Parameter(description = "结束时间") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @Parameter(description = "操作结果") @RequestParam(required = false) PermissionAuditLog.OperationResult result,
            Pageable pageable) {
        
        Page<PermissionAuditLog> logs = auditService.findAuditLogs(userId, auditType, startTime, endTime, result, pageable);
        return ResponseEntity.ok(logs);
    }
    
    @GetMapping("/audit/logs/user/{userId}")
    @Operation(summary = "获取用户审计日志", description = "获取指定用户的审计日志")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('AUDIT_VIEW') or #userId == authentication.principal.id")
    public ResponseEntity<Page<PermissionAuditLog>> getUserAuditLogs(
            @Parameter(description = "用户ID") @PathVariable Long userId,
            @Parameter(description = "开始时间") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @Parameter(description = "结束时间") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            Pageable pageable) {
        
        Page<PermissionAuditLog> logs = auditService.findByUserId(userId, startTime, endTime, pageable);
        return ResponseEntity.ok(logs);
    }
    
    @GetMapping("/audit/stats/user/{userId}")
    @Operation(summary = "获取用户操作统计", description = "获取指定用户的操作统计信息")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('AUDIT_VIEW')")
    public ResponseEntity<Map<String, Object>> getUserOperationStats(
            @Parameter(description = "用户ID") @PathVariable Long userId,
            @Parameter(description = "开始时间") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @Parameter(description = "结束时间") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        
        Map<String, Object> stats = auditService.getUserOperationStats(userId, startTime, endTime);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/audit/stats/active-users")
    @Operation(summary = "获取活跃用户统计", description = "获取指定时间段内的活跃用户统计")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('AUDIT_VIEW')")
    public ResponseEntity<Map<String, Object>> getActiveUserStats(
            @Parameter(description = "开始时间") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @Parameter(description = "结束时间") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        
        Map<String, Object> stats = auditService.getActiveUserStats(startTime, endTime);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/audit/stats/operations")
    @Operation(summary = "获取操作类型统计", description = "获取指定时间段内的操作类型统计")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('AUDIT_VIEW')")
    public ResponseEntity<Map<String, Object>> getOperationTypeStats(
            @Parameter(description = "开始时间") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @Parameter(description = "结束时间") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        
        Map<String, Object> stats = auditService.getOperationTypeStats(startTime, endTime);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/audit/suspicious-activities")
    @Operation(summary = "获取可疑活动", description = "获取可疑IP活动记录")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('SECURITY_MONITOR')")
    public ResponseEntity<List<Map<String, Object>>> getSuspiciousActivities(
            @Parameter(description = "开始时间") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @Parameter(description = "结束时间") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @Parameter(description = "最小操作次数阈值") @RequestParam(defaultValue = "100") int minOperations) {
        
        List<Map<String, Object>> activities = auditService.findSuspiciousIpActivities(startTime, endTime, minOperations);
        return ResponseEntity.ok(activities);
    }
    
    @DeleteMapping("/audit/cleanup")
    @Operation(summary = "清理过期日志", description = "清理过期的审计日志")
    @PreAuthorize("hasRole('ADMIN')")
    @PermissionAudit(type = PermissionAuditLog.AuditType.SYSTEM_OPERATION, description = "清理过期审计日志")
    public ResponseEntity<Integer> cleanupExpiredLogs(
            @Parameter(description = "保留天数") @RequestParam(defaultValue = "90") int retentionDays) {
        
        int deletedCount = auditService.cleanupExpiredLogs(retentionDays);
        return ResponseEntity.ok(deletedCount);
    }
    
    // ==================== 安全状态相关接口 ====================
    
    @GetMapping("/status")
    @Operation(summary = "获取安全状态", description = "获取系统安全状态概览")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('SECURITY_VIEW')")
    public ResponseEntity<Map<String, Object>> getSecurityStatus() {
        Map<String, Object> status = Map.of(
            "currentUser", SecurityUtils.getCurrentUsername(),
            "isAuthenticated", SecurityUtils.isAuthenticated(),
            "authorities", SecurityUtils.getCurrentUserAuthorities(),
            "sessionId", SecurityUtils.getSessionId(),
            "clientIp", SecurityUtils.getCurrentUserIp(),
            "userAgent", SecurityUtils.getCurrentUserAgent()
        );
        return ResponseEntity.ok(status);
    }
    
    @PostMapping("/test-permission")
    @Operation(summary = "测试权限", description = "测试用户是否具有指定权限")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Boolean> testPermission(
            @Parameter(description = "权限代码") @RequestParam String permission) {
        
        boolean hasPermission = SecurityUtils.hasPermission(permission);
        return ResponseEntity.ok(hasPermission);
    }
    
    @PostMapping("/test-role")
    @Operation(summary = "测试角色", description = "测试用户是否具有指定角色")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Boolean> testRole(
            @Parameter(description = "角色名称") @RequestParam String role) {
        
        boolean hasRole = SecurityUtils.hasRole(role);
        return ResponseEntity.ok(hasRole);
    }
}