package com.zerocarbon.security.service;

import com.zerocarbon.security.entity.UserLoginLog;
import com.zerocarbon.security.repository.UserLoginLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 用户登录日志服务类
 * 零碳园区数字孪生系统用户登录日志管理
 */
@Service
@Transactional
public class UserLoginLogService {
    
    @Autowired
    private UserLoginLogRepository userLoginLogRepository;
    
    // 风险评分阈值
    private static final int HIGH_RISK_THRESHOLD = 80;
    private static final int MEDIUM_RISK_THRESHOLD = 50;
    
    // 异常登录检测参数
    private static final int MAX_LOGIN_ATTEMPTS_PER_HOUR = 10;
    private static final int MAX_FAILED_ATTEMPTS_PER_DAY = 5;
    private static final long SUSPICIOUS_SESSION_DURATION_HOURS = 12;
    
    /**
     * 记录登录成功
     */
    public UserLoginLog recordLoginSuccess(Long userId, String username, 
                                         UserLoginLog.LoginType loginType,
                                         String ipAddress, String userAgent) {
        UserLoginLog loginLog = new UserLoginLog();
        loginLog.setUserId(userId);
        loginLog.setUsername(username);
        loginLog.setLoginType(loginType);
        loginLog.setStatus(UserLoginLog.LoginStatus.SUCCESS);
        loginLog.setIpAddress(ipAddress);
        loginLog.setUserAgent(userAgent);
        loginLog.setSessionId(generateSessionId());
        
        // 解析地理位置和设备信息
        loginLog.setLocation(parseLocation(ipAddress));
        loginLog.setDeviceInfo(parseDeviceInfo(userAgent));
        
        // 计算风险评分
        int riskScore = calculateRiskScore(userId, ipAddress, userAgent);
        loginLog.setRiskScore(riskScore);
        loginLog.setSuspicious(riskScore >= MEDIUM_RISK_THRESHOLD);
        
        return userLoginLogRepository.save(loginLog);
    }
    
    /**
     * 记录登录失败
     */
    public UserLoginLog recordLoginFailure(String username, 
                                         UserLoginLog.LoginType loginType,
                                         String ipAddress, String userAgent,
                                         String failureReason) {
        UserLoginLog loginLog = new UserLoginLog();
        loginLog.setUsername(username);
        loginLog.setLoginType(loginType);
        loginLog.setStatus(UserLoginLog.LoginStatus.FAILURE);
        loginLog.setIpAddress(ipAddress);
        loginLog.setUserAgent(userAgent);
        loginLog.setFailureReason(failureReason);
        
        // 解析地理位置和设备信息
        loginLog.setLocation(parseLocation(ipAddress));
        loginLog.setDeviceInfo(parseDeviceInfo(userAgent));
        
        // 失败登录风险评分较高
        int riskScore = calculateFailureRiskScore(username, ipAddress);
        loginLog.setRiskScore(riskScore);
        loginLog.setSuspicious(true);
        
        return userLoginLogRepository.save(loginLog);
    }
    
    /**
     * 记录登出
     */
    public void recordLogout(String sessionId) {
        Optional<UserLoginLog> loginLogOpt = userLoginLogRepository.findBySessionId(sessionId);
        if (loginLogOpt.isPresent()) {
            UserLoginLog loginLog = loginLogOpt.get();
            loginLog.setLogoutTime(LocalDateTime.now());
            userLoginLogRepository.save(loginLog);
        }
    }
    
    /**
     * 获取用户登录历史
     */
    @Transactional(readOnly = true)
    public List<UserLoginLog> getUserLoginHistory(Long userId, int limit) {
        return userLoginLogRepository.findByUserIdOrderByLoginTimeDesc(userId)
                .stream()
                .limit(limit)
                .collect(Collectors.toList());
    }
    
    /**
     * 获取用户最近登录记录
     */
    @Transactional(readOnly = true)
    public Optional<UserLoginLog> getLastSuccessfulLogin(Long userId) {
        return userLoginLogRepository.findFirstByUserIdAndStatusOrderByLoginTimeDesc(
                userId, UserLoginLog.LoginStatus.SUCCESS);
    }
    
    /**
     * 获取用户今日登录失败次数
     */
    @Transactional(readOnly = true)
    public long getTodayFailureCount(String username) {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        return userLoginLogRepository.countByUsernameAndStatusAndLoginTimeBetween(
                username, UserLoginLog.LoginStatus.FAILURE, startOfDay, endOfDay);
    }
    
    /**
     * 获取IP地址今日登录尝试次数
     */
    @Transactional(readOnly = true)
    public long getTodayLoginAttempts(String ipAddress) {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        return userLoginLogRepository.countByIpAddressAndLoginTimeBetween(
                ipAddress, startOfDay, endOfDay);
    }
    
    /**
     * 检查是否存在异常登录模式
     */
    @Transactional(readOnly = true)
    public boolean hasAbnormalLoginPattern(Long userId) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        
        // 检查一小时内登录次数
        long recentLogins = userLoginLogRepository.countByUserIdAndLoginTimeAfter(userId, oneHourAgo);
        if (recentLogins > MAX_LOGIN_ATTEMPTS_PER_HOUR) {
            return true;
        }
        
        // 检查今日失败次数
        Optional<UserLoginLog> lastLogin = userLoginLogRepository.findFirstByUserIdOrderByLoginTimeDesc(userId);
        if (lastLogin.isPresent()) {
            long todayFailures = getTodayFailureCount(lastLogin.get().getUsername());
            if (todayFailures > MAX_FAILED_ATTEMPTS_PER_DAY) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 获取活跃会话
     */
    @Transactional(readOnly = true)
    public List<UserLoginLog> getActiveSessions() {
        return userLoginLogRepository.findByLogoutTimeIsNull();
    }
    
    /**
     * 获取可疑登录记录
     */
    @Transactional(readOnly = true)
    public List<UserLoginLog> getSuspiciousLogins(LocalDateTime since) {
        return userLoginLogRepository.findBySuspiciousAndLoginTimeAfter(true, since);
    }
    
    /**
     * 获取高风险登录记录
     */
    @Transactional(readOnly = true)
    public List<UserLoginLog> getHighRiskLogins(LocalDateTime since) {
        return userLoginLogRepository.findByRiskScoreGreaterThanEqualAndLoginTimeAfter(
                HIGH_RISK_THRESHOLD, since);
    }
    
    /**
     * 获取登录统计信息
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getLoginStatistics(LocalDateTime startTime, LocalDateTime endTime) {
        Map<String, Object> statistics = new HashMap<>();
        
        // 总登录次数
        long totalLogins = userLoginLogRepository.countByLoginTimeBetween(startTime, endTime);
        statistics.put("totalLogins", totalLogins);
        
        // 成功登录次数
        long successfulLogins = userLoginLogRepository.countByStatusAndLoginTimeBetween(
                UserLoginLog.LoginStatus.SUCCESS, startTime, endTime);
        statistics.put("successfulLogins", successfulLogins);
        
        // 失败登录次数
        long failedLogins = userLoginLogRepository.countByStatusAndLoginTimeBetween(
                UserLoginLog.LoginStatus.FAILURE, startTime, endTime);
        statistics.put("failedLogins", failedLogins);
        
        // 可疑登录次数
        long suspiciousLogins = userLoginLogRepository.countBySuspiciousAndLoginTimeBetween(
                true, startTime, endTime);
        statistics.put("suspiciousLogins", suspiciousLogins);
        
        // 高风险登录次数
        long highRiskLogins = userLoginLogRepository.countByRiskScoreGreaterThanEqualAndLoginTimeBetween(
                HIGH_RISK_THRESHOLD, startTime, endTime);
        statistics.put("highRiskLogins", highRiskLogins);
        
        // 成功率
        double successRate = totalLogins > 0 ? (double) successfulLogins / totalLogins * 100 : 0;
        statistics.put("successRate", Math.round(successRate * 100.0) / 100.0);
        
        // 登录类型分布
        Map<UserLoginLog.LoginType, Long> loginTypeDistribution = 
                userLoginLogRepository.findByLoginTimeBetween(startTime, endTime)
                        .stream()
                        .collect(Collectors.groupingBy(
                                UserLoginLog::getLoginType,
                                Collectors.counting()));
        statistics.put("loginTypeDistribution", loginTypeDistribution);
        
        // 每日登录趋势
        Map<String, Long> dailyTrend = userLoginLogRepository.findByLoginTimeBetween(startTime, endTime)
                .stream()
                .collect(Collectors.groupingBy(
                        log -> log.getLoginTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
                        Collectors.counting()));
        statistics.put("dailyTrend", dailyTrend);
        
        // 每小时登录趋势
        Map<Integer, Long> hourlyTrend = userLoginLogRepository.findByLoginTimeBetween(startTime, endTime)
                .stream()
                .collect(Collectors.groupingBy(
                        log -> log.getLoginTime().getHour(),
                        Collectors.counting()));
        statistics.put("hourlyTrend", hourlyTrend);
        
        return statistics;
    }
    
    /**
     * 获取IP地址登录统计
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getIpAddressStatistics(LocalDateTime since) {
        return userLoginLogRepository.findByLoginTimeAfter(since)
                .stream()
                .collect(Collectors.groupingBy(
                        UserLoginLog::getIpAddress,
                        Collectors.counting()))
                .entrySet()
                .stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(20)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new));
    }
    
    /**
     * 获取地理位置登录统计
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getLocationStatistics(LocalDateTime since) {
        return userLoginLogRepository.findByLoginTimeAfter(since)
                .stream()
                .filter(log -> log.getLocation() != null && !log.getLocation().trim().isEmpty())
                .collect(Collectors.groupingBy(
                        UserLoginLog::getLocation,
                        Collectors.counting()))
                .entrySet()
                .stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(20)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new));
    }
    
    /**
     * 清理过期日志
     */
    public int cleanupExpiredLogs(int retentionDays) {
        LocalDateTime cutoffTime = LocalDateTime.now().minusDays(retentionDays);
        return userLoginLogRepository.deleteByLoginTimeBefore(cutoffTime);
    }
    
    /**
     * 批量更新登出时间
     */
    public int batchUpdateLogoutTime(List<String> sessionIds) {
        return userLoginLogRepository.batchUpdateLogoutTime(sessionIds, LocalDateTime.now());
    }
    
    /**
     * 查找超时会话
     */
    @Transactional(readOnly = true)
    public List<UserLoginLog> findTimeoutSessions(int timeoutHours) {
        LocalDateTime timeoutThreshold = LocalDateTime.now().minusHours(timeoutHours);
        return userLoginLogRepository.findByLogoutTimeIsNullAndLoginTimeBefore(timeoutThreshold);
    }
    
    /**
     * 查找并发登录
     */
    @Transactional(readOnly = true)
    public List<UserLoginLog> findConcurrentLogins(Long userId) {
        return userLoginLogRepository.findConcurrentLoginsByUserId(userId);
    }
    
    // ==================== 私有辅助方法 ====================
    
    /**
     * 生成会话ID
     */
    private String generateSessionId() {
        return "SESSION_" + System.currentTimeMillis() + "_" + 
               UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }
    
    /**
     * 解析地理位置
     */
    private String parseLocation(String ipAddress) {
        // 这里可以集成第三方IP地理位置服务
        // 暂时返回简单的本地/外部判断
        if (ipAddress.startsWith("192.168.") || 
            ipAddress.startsWith("10.") || 
            ipAddress.startsWith("172.") ||
            ipAddress.equals("127.0.0.1") ||
            ipAddress.equals("localhost")) {
            return "内网";
        }
        return "外网";
    }
    
    /**
     * 解析设备信息
     */
    private String parseDeviceInfo(String userAgent) {
        if (userAgent == null || userAgent.trim().isEmpty()) {
            return "未知设备";
        }
        
        String lowerUserAgent = userAgent.toLowerCase();
        
        // 操作系统检测
        String os = "未知系统";
        if (lowerUserAgent.contains("windows")) {
            os = "Windows";
        } else if (lowerUserAgent.contains("mac")) {
            os = "macOS";
        } else if (lowerUserAgent.contains("linux")) {
            os = "Linux";
        } else if (lowerUserAgent.contains("android")) {
            os = "Android";
        } else if (lowerUserAgent.contains("iphone") || lowerUserAgent.contains("ipad")) {
            os = "iOS";
        }
        
        // 浏览器检测
        String browser = "未知浏览器";
        if (lowerUserAgent.contains("chrome")) {
            browser = "Chrome";
        } else if (lowerUserAgent.contains("firefox")) {
            browser = "Firefox";
        } else if (lowerUserAgent.contains("safari")) {
            browser = "Safari";
        } else if (lowerUserAgent.contains("edge")) {
            browser = "Edge";
        } else if (lowerUserAgent.contains("opera")) {
            browser = "Opera";
        }
        
        return os + " / " + browser;
    }
    
    /**
     * 计算登录成功的风险评分
     */
    private int calculateRiskScore(Long userId, String ipAddress, String userAgent) {
        int riskScore = 0;
        
        // 检查是否为新IP地址
        boolean isNewIp = !userLoginLogRepository.existsByUserIdAndIpAddress(userId, ipAddress);
        if (isNewIp) {
            riskScore += 30;
        }
        
        // 检查是否为新设备
        String deviceInfo = parseDeviceInfo(userAgent);
        boolean isNewDevice = !userLoginLogRepository.existsByUserIdAndDeviceInfo(userId, deviceInfo);
        if (isNewDevice) {
            riskScore += 20;
        }
        
        // 检查登录时间（非工作时间风险较高）
        int hour = LocalDateTime.now().getHour();
        if (hour < 6 || hour > 22) {
            riskScore += 15;
        }
        
        // 检查最近登录失败次数
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        long recentFailures = userLoginLogRepository.countByUserIdAndStatusAndLoginTimeAfter(
                userId, UserLoginLog.LoginStatus.FAILURE, oneHourAgo);
        if (recentFailures > 0) {
            riskScore += Math.min(recentFailures * 10, 30);
        }
        
        // 检查是否为外网IP
        if (parseLocation(ipAddress).equals("外网")) {
            riskScore += 10;
        }
        
        return Math.min(riskScore, 100);
    }
    
    /**
     * 计算登录失败的风险评分
     */
    private int calculateFailureRiskScore(String username, String ipAddress) {
        int riskScore = 50; // 失败登录基础风险分
        
        // 检查今日失败次数
        long todayFailures = getTodayFailureCount(username);
        riskScore += Math.min(todayFailures * 10, 30);
        
        // 检查IP地址今日尝试次数
        long todayAttempts = getTodayLoginAttempts(ipAddress);
        if (todayAttempts > 10) {
            riskScore += 20;
        }
        
        return Math.min(riskScore, 100);
    }
}