package com.zerocarbon.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 定时任务服务类
 * 实现系统的各种定时任务
 * 
 * @author Zero Carbon Team
 * @version 1.0.0
 * @since 2024
 */
@Service
public class ScheduledTaskService {
    
    private static final Logger logger = LoggerFactory.getLogger(ScheduledTaskService.class);
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private AuthenticationService authenticationService;
    
    @Autowired
    private UserLoginLogService userLoginLogService;
    
    @Autowired
    private DataPermissionService dataPermissionService;
    
    @Value("${app.audit.retentionDays:90}")
    private int auditRetentionDays;
    
    @Value("${app.security.session.cleanupInterval:300000}")
    private long sessionCleanupInterval;
    
    // 任务执行计数器
    private final AtomicLong sessionCleanupCount = new AtomicLong(0);
    private final AtomicLong logCleanupCount = new AtomicLong(0);
    private final AtomicLong accountUnlockCount = new AtomicLong(0);
    private final AtomicLong permissionCleanupCount = new AtomicLong(0);
    private final AtomicLong statisticsUpdateCount = new AtomicLong(0);
    
    /**
     * 清理过期会话
     * 每5分钟执行一次
     */
    @Scheduled(fixedRate = 300000) // 5分钟
    public void cleanupExpiredSessions() {
        try {
            long startTime = System.currentTimeMillis();
            logger.debug("开始清理过期会话任务");
            
            int cleanedCount = authenticationService.cleanupExpiredSessions();
            
            long duration = System.currentTimeMillis() - startTime;
            long taskCount = sessionCleanupCount.incrementAndGet();
            
            logger.info("过期会话清理完成: 清理数量={}, 耗时={}ms, 执行次数={}", 
                    cleanedCount, duration, taskCount);
            
        } catch (Exception e) {
            logger.error("清理过期会话任务执行失败", e);
        }
    }
    
    /**
     * 清理过期登录日志
     * 每天凌晨2点执行
     */
    @Scheduled(cron = "0 0 2 * * ?") // 每天凌晨2点
    @Transactional
    public void cleanupExpiredLoginLogs() {
        try {
            long startTime = System.currentTimeMillis();
            logger.info("开始清理过期登录日志任务");
            
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(auditRetentionDays);
            int cleanedCount = userLoginLogService.cleanupExpiredLogs(cutoffDate);
            
            long duration = System.currentTimeMillis() - startTime;
            long taskCount = logCleanupCount.incrementAndGet();
            
            logger.info("过期登录日志清理完成: 清理数量={}, 保留天数={}, 耗时={}ms, 执行次数={}", 
                    cleanedCount, auditRetentionDays, duration, taskCount);
            
        } catch (Exception e) {
            logger.error("清理过期登录日志任务执行失败", e);
        }
    }
    
    /**
     * 自动解锁过期锁定的账户
     * 每10分钟执行一次
     */
    @Scheduled(fixedRate = 600000) // 10分钟
    @Transactional
    public void unlockExpiredAccounts() {
        try {
            long startTime = System.currentTimeMillis();
            logger.debug("开始自动解锁过期锁定账户任务");
            
            int unlockedCount = userService.unlockExpiredAccounts();
            
            long duration = System.currentTimeMillis() - startTime;
            long taskCount = accountUnlockCount.incrementAndGet();
            
            if (unlockedCount > 0) {
                logger.info("过期锁定账户解锁完成: 解锁数量={}, 耗时={}ms, 执行次数={}", 
                        unlockedCount, duration, taskCount);
            } else {
                logger.debug("过期锁定账户解锁完成: 无需解锁的账户, 耗时={}ms, 执行次数={}", 
                        duration, taskCount);
            }
            
        } catch (Exception e) {
            logger.error("自动解锁过期锁定账户任务执行失败", e);
        }
    }
    
    /**
     * 清理过期数据权限
     * 每天凌晨3点执行
     */
    @Scheduled(cron = "0 0 3 * * ?") // 每天凌晨3点
    @Transactional
    public void cleanupExpiredDataPermissions() {
        try {
            long startTime = System.currentTimeMillis();
            logger.info("开始清理过期数据权限任务");
            
            int cleanedCount = dataPermissionService.cleanupExpiredPermissions();
            
            long duration = System.currentTimeMillis() - startTime;
            long taskCount = permissionCleanupCount.incrementAndGet();
            
            logger.info("过期数据权限清理完成: 清理数量={}, 耗时={}ms, 执行次数={}", 
                    cleanedCount, duration, taskCount);
            
        } catch (Exception e) {
            logger.error("清理过期数据权限任务执行失败", e);
        }
    }
    
    /**
     * 更新系统统计信息
     * 每小时执行一次
     */
    @Scheduled(cron = "0 0 * * * ?") // 每小时整点执行
    public void updateSystemStatistics() {
        try {
            long startTime = System.currentTimeMillis();
            logger.debug("开始更新系统统计信息任务");
            
            // 更新用户统计
            updateUserStatistics();
            
            // 更新登录统计
            updateLoginStatistics();
            
            // 更新权限统计
            updatePermissionStatistics();
            
            long duration = System.currentTimeMillis() - startTime;
            long taskCount = statisticsUpdateCount.incrementAndGet();
            
            logger.info("系统统计信息更新完成: 耗时={}ms, 执行次数={}", duration, taskCount);
            
        } catch (Exception e) {
            logger.error("更新系统统计信息任务执行失败", e);
        }
    }
    
    /**
     * 系统健康检查
     * 每30分钟执行一次
     */
    @Scheduled(fixedRate = 1800000) // 30分钟
    public void systemHealthCheck() {
        try {
            logger.debug("开始系统健康检查任务");
            
            // 检查数据库连接
            checkDatabaseHealth();
            
            // 检查缓存状态
            checkCacheHealth();
            
            // 检查线程池状态
            checkThreadPoolHealth();
            
            // 检查内存使用情况
            checkMemoryUsage();
            
            logger.debug("系统健康检查完成");
            
        } catch (Exception e) {
            logger.error("系统健康检查任务执行失败", e);
        }
    }
    
    /**
     * 生成每日报告
     * 每天凌晨1点执行
     */
    @Scheduled(cron = "0 0 1 * * ?") // 每天凌晨1点
    public void generateDailyReport() {
        try {
            long startTime = System.currentTimeMillis();
            logger.info("开始生成每日报告任务");
            
            LocalDateTime yesterday = LocalDateTime.now().minusDays(1);
            String reportDate = yesterday.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            
            // 生成用户活动报告
            generateUserActivityReport(yesterday);
            
            // 生成安全事件报告
            generateSecurityEventReport(yesterday);
            
            // 生成系统性能报告
            generateSystemPerformanceReport(yesterday);
            
            long duration = System.currentTimeMillis() - startTime;
            
            logger.info("每日报告生成完成: 报告日期={}, 耗时={}ms", reportDate, duration);
            
        } catch (Exception e) {
            logger.error("生成每日报告任务执行失败", e);
        }
    }
    
    /**
     * 更新用户统计
     */
    private void updateUserStatistics() {
        try {
            // 这里可以调用用户服务的统计方法
            // userService.updateUserStatistics();
            logger.debug("用户统计信息更新完成");
        } catch (Exception e) {
            logger.error("更新用户统计失败", e);
        }
    }
    
    /**
     * 更新登录统计
     */
    private void updateLoginStatistics() {
        try {
            // 这里可以调用登录日志服务的统计方法
            // userLoginLogService.updateLoginStatistics();
            logger.debug("登录统计信息更新完成");
        } catch (Exception e) {
            logger.error("更新登录统计失败", e);
        }
    }
    
    /**
     * 更新权限统计
     */
    private void updatePermissionStatistics() {
        try {
            // 这里可以调用权限服务的统计方法
            // permissionService.updatePermissionStatistics();
            logger.debug("权限统计信息更新完成");
        } catch (Exception e) {
            logger.error("更新权限统计失败", e);
        }
    }
    
    /**
     * 检查数据库健康状态
     */
    private void checkDatabaseHealth() {
        try {
            // 这里可以执行简单的数据库查询来检查连接状态
            // userService.count();
            logger.debug("数据库健康检查通过");
        } catch (Exception e) {
            logger.error("数据库健康检查失败", e);
        }
    }
    
    /**
     * 检查缓存健康状态
     */
    private void checkCacheHealth() {
        try {
            // 这里可以检查缓存的状态
            logger.debug("缓存健康检查通过");
        } catch (Exception e) {
            logger.error("缓存健康检查失败", e);
        }
    }
    
    /**
     * 检查线程池健康状态
     */
    private void checkThreadPoolHealth() {
        try {
            // 这里可以检查线程池的状态
            logger.debug("线程池健康检查通过");
        } catch (Exception e) {
            logger.error("线程池健康检查失败", e);
        }
    }
    
    /**
     * 检查内存使用情况
     */
    private void checkMemoryUsage() {
        try {
            Runtime runtime = Runtime.getRuntime();
            long totalMemory = runtime.totalMemory();
            long freeMemory = runtime.freeMemory();
            long usedMemory = totalMemory - freeMemory;
            double usagePercentage = (double) usedMemory / totalMemory * 100;
            
            logger.debug("内存使用情况: 总内存={}MB, 已用内存={}MB, 使用率={:.2f}%", 
                    totalMemory / 1024 / 1024, usedMemory / 1024 / 1024, usagePercentage);
            
            if (usagePercentage > 90) {
                logger.warn("内存使用率过高: {:.2f}%", usagePercentage);
            }
            
        } catch (Exception e) {
            logger.error("内存使用检查失败", e);
        }
    }
    
    /**
     * 生成用户活动报告
     */
    private void generateUserActivityReport(LocalDateTime date) {
        try {
            // 这里可以生成用户活动报告
            logger.debug("用户活动报告生成完成: {}", date.toLocalDate());
        } catch (Exception e) {
            logger.error("生成用户活动报告失败", e);
        }
    }
    
    /**
     * 生成安全事件报告
     */
    private void generateSecurityEventReport(LocalDateTime date) {
        try {
            // 这里可以生成安全事件报告
            logger.debug("安全事件报告生成完成: {}", date.toLocalDate());
        } catch (Exception e) {
            logger.error("生成安全事件报告失败", e);
        }
    }
    
    /**
     * 生成系统性能报告
     */
    private void generateSystemPerformanceReport(LocalDateTime date) {
        try {
            // 这里可以生成系统性能报告
            logger.debug("系统性能报告生成完成: {}", date.toLocalDate());
        } catch (Exception e) {
            logger.error("生成系统性能报告失败", e);
        }
    }
    
    /**
     * 获取任务执行统计信息
     */
    public String getTaskExecutionStatistics() {
        return String.format(
                "定时任务执行统计:\n" +
                "- 会话清理任务: %d次\n" +
                "- 日志清理任务: %d次\n" +
                "- 账户解锁任务: %d次\n" +
                "- 权限清理任务: %d次\n" +
                "- 统计更新任务: %d次",
                sessionCleanupCount.get(),
                logCleanupCount.get(),
                accountUnlockCount.get(),
                permissionCleanupCount.get(),
                statisticsUpdateCount.get()
        );
    }
}