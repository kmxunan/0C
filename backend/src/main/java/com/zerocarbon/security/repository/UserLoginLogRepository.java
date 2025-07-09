package com.zerocarbon.security.repository;

import com.zerocarbon.security.entity.UserLoginLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 用户登录日志数据访问层
 * 零碳园区数字孪生系统登录审计
 */
@Repository
public interface UserLoginLogRepository extends JpaRepository<UserLoginLog, Long> {
    
    /**
     * 根据用户ID查找登录日志
     */
    List<UserLoginLog> findByUserId(Long userId);
    
    /**
     * 根据用户名查找登录日志
     */
    List<UserLoginLog> findByUsername(String username);
    
    /**
     * 根据登录状态查找日志
     */
    List<UserLoginLog> findByStatus(UserLoginLog.LoginStatus status);
    
    /**
     * 根据登录类型查找日志
     */
    List<UserLoginLog> findByLoginType(UserLoginLog.LoginType loginType);
    
    /**
     * 根据IP地址查找登录日志
     */
    List<UserLoginLog> findByIpAddress(String ipAddress);
    
    /**
     * 根据会话ID查找登录日志
     */
    Optional<UserLoginLog> findBySessionId(String sessionId);
    
    /**
     * 查找成功登录的日志
     */
    List<UserLoginLog> findByStatusOrderByLoginTimeDesc(UserLoginLog.LoginStatus status);
    
    /**
     * 查找失败登录的日志
     */
    @Query("SELECT log FROM UserLoginLog log WHERE log.status = 'FAILED' ORDER BY log.loginTime DESC")
    List<UserLoginLog> findFailedLogins();
    
    /**
     * 查找可疑登录的日志
     */
    List<UserLoginLog> findBySuspiciousTrue();
    
    /**
     * 查找高风险登录的日志
     */
    @Query("SELECT log FROM UserLoginLog log WHERE log.riskScore >= :minRiskScore ORDER BY log.riskScore DESC")
    List<UserLoginLog> findHighRiskLogins(@Param("minRiskScore") Double minRiskScore);
    
    /**
     * 根据用户ID查找最近的登录记录
     */
    @Query("SELECT log FROM UserLoginLog log WHERE log.userId = :userId ORDER BY log.loginTime DESC")
    List<UserLoginLog> findRecentLoginsByUserId(@Param("userId") Long userId);
    
    /**
     * 根据用户名查找最近的登录记录
     */
    @Query("SELECT log FROM UserLoginLog log WHERE log.username = :username ORDER BY log.loginTime DESC")
    List<UserLoginLog> findRecentLoginsByUsername(@Param("username") String username);
    
    /**
     * 查找指定时间范围内的登录日志
     */
    List<UserLoginLog> findByLoginTimeBetween(LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * 查找指定时间范围内用户的登录日志
     */
    List<UserLoginLog> findByUserIdAndLoginTimeBetween(Long userId, LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * 查找指定时间范围内IP的登录日志
     */
    List<UserLoginLog> findByIpAddressAndLoginTimeBetween(String ipAddress, LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * 统计用户登录次数
     */
    @Query("SELECT COUNT(log) FROM UserLoginLog log WHERE log.userId = :userId")
    Long countLoginsByUserId(@Param("userId") Long userId);
    
    /**
     * 统计用户成功登录次数
     */
    @Query("SELECT COUNT(log) FROM UserLoginLog log WHERE log.userId = :userId AND log.status = 'SUCCESS'")
    Long countSuccessLoginsByUserId(@Param("userId") Long userId);
    
    /**
     * 统计用户失败登录次数
     */
    @Query("SELECT COUNT(log) FROM UserLoginLog log WHERE log.userId = :userId AND log.status = 'FAILED'")
    Long countFailedLoginsByUserId(@Param("userId") Long userId);
    
    /**
     * 统计指定时间范围内用户失败登录次数
     */
    @Query("SELECT COUNT(log) FROM UserLoginLog log WHERE log.userId = :userId AND log.status = 'FAILED' AND log.loginTime BETWEEN :startTime AND :endTime")
    Long countFailedLoginsByUserIdAndTimeRange(@Param("userId") Long userId, @Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
    
    /**
     * 统计IP地址登录次数
     */
    @Query("SELECT COUNT(log) FROM UserLoginLog log WHERE log.ipAddress = :ipAddress")
    Long countLoginsByIpAddress(@Param("ipAddress") String ipAddress);
    
    /**
     * 统计指定时间范围内IP地址失败登录次数
     */
    @Query("SELECT COUNT(log) FROM UserLoginLog log WHERE log.ipAddress = :ipAddress AND log.status = 'FAILED' AND log.loginTime BETWEEN :startTime AND :endTime")
    Long countFailedLoginsByIpAddressAndTimeRange(@Param("ipAddress") String ipAddress, @Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
    
    /**
     * 查找用户最后一次成功登录记录
     */
    @Query("SELECT log FROM UserLoginLog log WHERE log.userId = :userId AND log.status = 'SUCCESS' ORDER BY log.loginTime DESC")
    Optional<UserLoginLog> findLastSuccessLoginByUserId(@Param("userId") Long userId);
    
    /**
     * 查找用户最后一次登录记录
     */
    @Query("SELECT log FROM UserLoginLog log WHERE log.userId = :userId ORDER BY log.loginTime DESC")
    Optional<UserLoginLog> findLastLoginByUserId(@Param("userId") Long userId);
    
    /**
     * 查找活跃会话
     */
    @Query("SELECT log FROM UserLoginLog log WHERE log.status = 'SUCCESS' AND log.logoutTime IS NULL")
    List<UserLoginLog> findActiveSessions();
    
    /**
     * 查找用户的活跃会话
     */
    @Query("SELECT log FROM UserLoginLog log WHERE log.userId = :userId AND log.status = 'SUCCESS' AND log.logoutTime IS NULL")
    List<UserLoginLog> findActiveSessionsByUserId(@Param("userId") Long userId);
    
    /**
     * 查找超时会话
     */
    @Query("SELECT log FROM UserLoginLog log WHERE log.status = 'SUCCESS' AND log.logoutTime IS NULL AND log.loginTime < :timeoutThreshold")
    List<UserLoginLog> findTimeoutSessions(@Param("timeoutThreshold") LocalDateTime timeoutThreshold);
    
    /**
     * 查找异常登录模式
     */
    @Query("SELECT log FROM UserLoginLog log WHERE log.suspicious = true OR log.riskScore > :riskThreshold ORDER BY log.loginTime DESC")
    List<UserLoginLog> findAnomalousLogins(@Param("riskThreshold") Double riskThreshold);
    
    /**
     * 查找来自新设备的登录
     */
    @Query("SELECT log FROM UserLoginLog log WHERE log.userId = :userId AND log.deviceInfo NOT IN (SELECT DISTINCT l.deviceInfo FROM UserLoginLog l WHERE l.userId = :userId AND l.loginTime < :checkTime AND l.status = 'SUCCESS')")
    List<UserLoginLog> findLoginsFromNewDevices(@Param("userId") Long userId, @Param("checkTime") LocalDateTime checkTime);
    
    /**
     * 查找来自新位置的登录
     */
    @Query("SELECT log FROM UserLoginLog log WHERE log.userId = :userId AND log.location IS NOT NULL AND log.location NOT IN (SELECT DISTINCT l.location FROM UserLoginLog l WHERE l.userId = :userId AND l.loginTime < :checkTime AND l.status = 'SUCCESS')")
    List<UserLoginLog> findLoginsFromNewLocations(@Param("userId") Long userId, @Param("checkTime") LocalDateTime checkTime);
    
    /**
     * 统计每日登录数量
     */
    @Query("SELECT DATE(log.loginTime), COUNT(log) FROM UserLoginLog log WHERE log.loginTime BETWEEN :startDate AND :endDate GROUP BY DATE(log.loginTime) ORDER BY DATE(log.loginTime)")
    List<Object[]> countDailyLogins(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * 统计每小时登录数量
     */
    @Query("SELECT HOUR(log.loginTime), COUNT(log) FROM UserLoginLog log WHERE log.loginTime BETWEEN :startTime AND :endTime GROUP BY HOUR(log.loginTime) ORDER BY HOUR(log.loginTime)")
    List<Object[]> countHourlyLogins(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
    
    /**
     * 统计登录状态分布
     */
    @Query("SELECT log.status, COUNT(log) FROM UserLoginLog log GROUP BY log.status")
    List<Object[]> countLoginsByStatus();
    
    /**
     * 统计登录类型分布
     */
    @Query("SELECT log.loginType, COUNT(log) FROM UserLoginLog log GROUP BY log.loginType")
    List<Object[]> countLoginsByType();
    
    /**
     * 统计IP地址登录分布
     */
    @Query("SELECT log.ipAddress, COUNT(log) FROM UserLoginLog log GROUP BY log.ipAddress ORDER BY COUNT(log) DESC")
    List<Object[]> countLoginsByIpAddress();
    
    /**
     * 统计地理位置登录分布
     */
    @Query("SELECT log.location, COUNT(log) FROM UserLoginLog log WHERE log.location IS NOT NULL GROUP BY log.location ORDER BY COUNT(log) DESC")
    List<Object[]> countLoginsByLocation();
    
    /**
     * 查找并发登录
     */
    @Query("SELECT log1, log2 FROM UserLoginLog log1, UserLoginLog log2 WHERE log1.userId = log2.userId AND log1.id != log2.id AND log1.status = 'SUCCESS' AND log2.status = 'SUCCESS' AND log1.logoutTime IS NULL AND log2.logoutTime IS NULL")
    List<Object[]> findConcurrentLogins();
    
    /**
     * 删除过期的登录日志
     */
    @Query("DELETE FROM UserLoginLog log WHERE log.loginTime < :cutoffTime")
    void deleteOldLogs(@Param("cutoffTime") LocalDateTime cutoffTime);
    
    /**
     * 批量更新登出时间
     */
    @Query("UPDATE UserLoginLog log SET log.logoutTime = :logoutTime WHERE log.sessionId IN :sessionIds")
    void updateLogoutTime(@Param("sessionIds") List<String> sessionIds, @Param("logoutTime") LocalDateTime logoutTime);
}