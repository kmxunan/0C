package com.zerocarbon.security.service;

import com.zerocarbon.security.entity.User;
import com.zerocarbon.security.entity.UserLoginLog;
import com.zerocarbon.security.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 认证服务类
 * 零碳园区数字孪生系统用户认证管理
 */
@Service
@Transactional
public class AuthenticationService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private UserLoginLogService loginLogService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    // 活跃会话存储
    private final Map<String, SessionInfo> activeSessions = new ConcurrentHashMap<>();
    
    // 登录尝试记录
    private final Map<String, LoginAttemptInfo> loginAttempts = new ConcurrentHashMap<>();
    
    // 配置参数
    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final int LOCKOUT_DURATION_MINUTES = 30;
    private static final int SESSION_TIMEOUT_HOURS = 8;
    private static final int MAX_CONCURRENT_SESSIONS = 3;
    
    /**
     * 用户登录
     */
    public LoginResult login(String username, String password, 
                           UserLoginLog.LoginType loginType,
                           String ipAddress, String userAgent) {
        try {
            // 检查登录尝试限制
            if (isAccountTemporarilyLocked(username, ipAddress)) {
                loginLogService.recordLoginFailure(username, loginType, ipAddress, userAgent, "账户临时锁定");
                return LoginResult.failure("账户临时锁定，请稍后再试");
            }
            
            // 查找用户
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (!userOpt.isPresent()) {
                recordFailedAttempt(username, ipAddress);
                loginLogService.recordLoginFailure(username, loginType, ipAddress, userAgent, "用户不存在");
                return LoginResult.failure("用户名或密码错误");
            }
            
            User user = userOpt.get();
            
            // 检查用户状态
            if (!user.isValid()) {
                loginLogService.recordLoginFailure(username, loginType, ipAddress, userAgent, "用户状态无效");
                return LoginResult.failure("用户账户已禁用或无效");
            }
            
            // 检查账户锁定
            if (user.isAccountLocked()) {
                loginLogService.recordLoginFailure(username, loginType, ipAddress, userAgent, "账户已锁定");
                return LoginResult.failure("账户已被锁定，请联系管理员");
            }
            
            // 验证密码
            if (!passwordEncoder.matches(password, user.getPassword())) {
                recordFailedAttempt(username, ipAddress);
                userService.recordLoginFailure(user.getId());
                loginLogService.recordLoginFailure(username, loginType, ipAddress, userAgent, "密码错误");
                return LoginResult.failure("用户名或密码错误");
            }
            
            // 检查并发会话限制
            if (getActiveSessionCount(user.getId()) >= MAX_CONCURRENT_SESSIONS) {
                // 踢出最早的会话
                removeOldestSession(user.getId());
            }
            
            // 登录成功
            clearFailedAttempts(username, ipAddress);
            userService.recordLoginSuccess(user.getId(), ipAddress);
            
            // 记录登录日志
            UserLoginLog loginLog = loginLogService.recordLoginSuccess(
                    user.getId(), username, loginType, ipAddress, userAgent);
            
            // 创建会话
            SessionInfo session = createSession(user, loginLog.getSessionId(), ipAddress, userAgent);
            
            // 生成访问令牌
            String accessToken = generateAccessToken(user, session);
            String refreshToken = generateRefreshToken(user, session);
            
            return LoginResult.success(user, accessToken, refreshToken, session);
            
        } catch (Exception e) {
            loginLogService.recordLoginFailure(username, loginType, ipAddress, userAgent, "系统错误: " + e.getMessage());
            return LoginResult.failure("登录失败，请稍后重试");
        }
    }
    
    /**
     * 用户登出
     */
    public void logout(String sessionId) {
        SessionInfo session = activeSessions.remove(sessionId);
        if (session != null) {
            loginLogService.recordLogout(sessionId);
        }
    }
    
    /**
     * 刷新访问令牌
     */
    public TokenRefreshResult refreshToken(String refreshToken) {
        try {
            // 验证刷新令牌
            TokenClaims claims = validateRefreshToken(refreshToken);
            if (claims == null) {
                return TokenRefreshResult.failure("无效的刷新令牌");
            }
            
            // 检查会话是否存在
            SessionInfo session = activeSessions.get(claims.getSessionId());
            if (session == null || session.isExpired()) {
                return TokenRefreshResult.failure("会话已过期");
            }
            
            // 获取用户信息
            Optional<User> userOpt = userRepository.findById(claims.getUserId());
            if (!userOpt.isPresent() || !userOpt.get().isValid()) {
                return TokenRefreshResult.failure("用户状态无效");
            }
            
            User user = userOpt.get();
            
            // 更新会话最后活跃时间
            session.updateLastActiveTime();
            
            // 生成新的访问令牌
            String newAccessToken = generateAccessToken(user, session);
            
            return TokenRefreshResult.success(newAccessToken);
            
        } catch (Exception e) {
            return TokenRefreshResult.failure("令牌刷新失败");
        }
    }
    
    /**
     * 验证访问令牌
     */
    public TokenValidationResult validateAccessToken(String accessToken) {
        try {
            TokenClaims claims = validateToken(accessToken, false);
            if (claims == null) {
                return TokenValidationResult.failure("无效的访问令牌");
            }
            
            // 检查会话是否存在
            SessionInfo session = activeSessions.get(claims.getSessionId());
            if (session == null || session.isExpired()) {
                return TokenValidationResult.failure("会话已过期");
            }
            
            // 更新会话最后活跃时间
            session.updateLastActiveTime();
            
            return TokenValidationResult.success(claims.getUserId(), claims.getUsername(), session);
            
        } catch (Exception e) {
            return TokenValidationResult.failure("令牌验证失败");
        }
    }
    
    /**
     * 获取用户活跃会话
     */
    public List<SessionInfo> getUserActiveSessions(Long userId) {
        return activeSessions.values().stream()
                .filter(session -> session.getUserId().equals(userId) && !session.isExpired())
                .sorted((s1, s2) -> s2.getLastActiveTime().compareTo(s1.getLastActiveTime()))
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
    }
    
    /**
     * 踢出用户会话
     */
    public boolean kickoutSession(String sessionId) {
        SessionInfo session = activeSessions.remove(sessionId);
        if (session != null) {
            loginLogService.recordLogout(sessionId);
            return true;
        }
        return false;
    }
    
    /**
     * 踢出用户所有会话
     */
    public int kickoutAllUserSessions(Long userId) {
        List<String> userSessions = activeSessions.entrySet().stream()
                .filter(entry -> entry.getValue().getUserId().equals(userId))
                .map(Map.Entry::getKey)
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
        
        userSessions.forEach(this::kickoutSession);
        return userSessions.size();
    }
    
    /**
     * 清理过期会话
     */
    public int cleanupExpiredSessions() {
        List<String> expiredSessions = activeSessions.entrySet().stream()
                .filter(entry -> entry.getValue().isExpired())
                .map(Map.Entry::getKey)
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
        
        expiredSessions.forEach(sessionId -> {
            activeSessions.remove(sessionId);
            loginLogService.recordLogout(sessionId);
        });
        
        return expiredSessions.size();
    }
    
    /**
     * 获取系统会话统计
     */
    public Map<String, Object> getSessionStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        long totalSessions = activeSessions.size();
        long activeSessions = activeSessions.values().stream()
                .filter(session -> !session.isExpired())
                .count();
        
        stats.put("totalSessions", totalSessions);
        stats.put("activeSessions", activeSessions);
        stats.put("expiredSessions", totalSessions - activeSessions);
        
        // 按用户统计
        Map<Long, Long> sessionsByUser = this.activeSessions.values().stream()
                .filter(session -> !session.isExpired())
                .collect(HashMap::new, 
                        (map, session) -> map.merge(session.getUserId(), 1L, Long::sum),
                        (map1, map2) -> { map1.putAll(map2); return map1; });
        stats.put("sessionsByUser", sessionsByUser);
        
        return stats;
    }
    
    // ==================== 私有辅助方法 ====================
    
    /**
     * 检查账户是否临时锁定
     */
    private boolean isAccountTemporarilyLocked(String username, String ipAddress) {
        String key = username + ":" + ipAddress;
        LoginAttemptInfo attemptInfo = loginAttempts.get(key);
        
        if (attemptInfo == null) {
            return false;
        }
        
        // 检查锁定是否过期
        if (attemptInfo.isLockoutExpired()) {
            loginAttempts.remove(key);
            return false;
        }
        
        return attemptInfo.isLocked();
    }
    
    /**
     * 记录失败尝试
     */
    private void recordFailedAttempt(String username, String ipAddress) {
        String key = username + ":" + ipAddress;
        LoginAttemptInfo attemptInfo = loginAttempts.computeIfAbsent(key, k -> new LoginAttemptInfo());
        attemptInfo.recordFailedAttempt();
        
        if (attemptInfo.getFailedAttempts() >= MAX_LOGIN_ATTEMPTS) {
            attemptInfo.lockAccount(LOCKOUT_DURATION_MINUTES);
        }
    }
    
    /**
     * 清除失败尝试记录
     */
    private void clearFailedAttempts(String username, String ipAddress) {
        String key = username + ":" + ipAddress;
        loginAttempts.remove(key);
    }
    
    /**
     * 获取用户活跃会话数量
     */
    private long getActiveSessionCount(Long userId) {
        return activeSessions.values().stream()
                .filter(session -> session.getUserId().equals(userId) && !session.isExpired())
                .count();
    }
    
    /**
     * 移除最早的会话
     */
    private void removeOldestSession(Long userId) {
        Optional<Map.Entry<String, SessionInfo>> oldestSession = activeSessions.entrySet().stream()
                .filter(entry -> entry.getValue().getUserId().equals(userId))
                .min(Map.Entry.comparingByValue((s1, s2) -> s1.getCreatedTime().compareTo(s2.getCreatedTime())));
        
        oldestSession.ifPresent(entry -> kickoutSession(entry.getKey()));
    }
    
    /**
     * 创建会话
     */
    private SessionInfo createSession(User user, String sessionId, String ipAddress, String userAgent) {
        SessionInfo session = new SessionInfo(
                sessionId,
                user.getId(),
                user.getUsername(),
                ipAddress,
                userAgent,
                LocalDateTime.now(),
                SESSION_TIMEOUT_HOURS
        );
        
        activeSessions.put(sessionId, session);
        return session;
    }
    
    /**
     * 生成访问令牌
     */
    private String generateAccessToken(User user, SessionInfo session) {
        // 这里应该使用JWT或其他令牌生成机制
        // 简化实现，实际项目中应该使用专业的JWT库
        String payload = user.getId() + ":" + user.getUsername() + ":" + session.getSessionId() + ":" + System.currentTimeMillis();
        return Base64.getEncoder().encodeToString(payload.getBytes());
    }
    
    /**
     * 生成刷新令牌
     */
    private String generateRefreshToken(User user, SessionInfo session) {
        // 刷新令牌通常有更长的有效期
        String payload = "REFRESH:" + user.getId() + ":" + user.getUsername() + ":" + session.getSessionId() + ":" + System.currentTimeMillis();
        return Base64.getEncoder().encodeToString(payload.getBytes());
    }
    
    /**
     * 验证令牌
     */
    private TokenClaims validateToken(String token, boolean isRefreshToken) {
        try {
            String payload = new String(Base64.getDecoder().decode(token));
            String[] parts = payload.split(":");
            
            if (isRefreshToken && !parts[0].equals("REFRESH")) {
                return null;
            }
            
            int offset = isRefreshToken ? 1 : 0;
            if (parts.length < 4 + offset) {
                return null;
            }
            
            Long userId = Long.parseLong(parts[offset]);
            String username = parts[1 + offset];
            String sessionId = parts[2 + offset];
            long timestamp = Long.parseLong(parts[3 + offset]);
            
            // 检查令牌是否过期（访问令牌1小时，刷新令牌24小时）
            long maxAge = isRefreshToken ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
            if (System.currentTimeMillis() - timestamp > maxAge) {
                return null;
            }
            
            return new TokenClaims(userId, username, sessionId, timestamp);
            
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * 验证刷新令牌
     */
    private TokenClaims validateRefreshToken(String refreshToken) {
        return validateToken(refreshToken, true);
    }
    
    // ==================== 内部类 ====================
    
    /**
     * 会话信息
     */
    public static class SessionInfo {
        private final String sessionId;
        private final Long userId;
        private final String username;
        private final String ipAddress;
        private final String userAgent;
        private final LocalDateTime createdTime;
        private LocalDateTime lastActiveTime;
        private final int timeoutHours;
        
        public SessionInfo(String sessionId, Long userId, String username, 
                          String ipAddress, String userAgent, 
                          LocalDateTime createdTime, int timeoutHours) {
            this.sessionId = sessionId;
            this.userId = userId;
            this.username = username;
            this.ipAddress = ipAddress;
            this.userAgent = userAgent;
            this.createdTime = createdTime;
            this.lastActiveTime = createdTime;
            this.timeoutHours = timeoutHours;
        }
        
        public void updateLastActiveTime() {
            this.lastActiveTime = LocalDateTime.now();
        }
        
        public boolean isExpired() {
            return LocalDateTime.now().isAfter(lastActiveTime.plusHours(timeoutHours));
        }
        
        // Getters
        public String getSessionId() { return sessionId; }
        public Long getUserId() { return userId; }
        public String getUsername() { return username; }
        public String getIpAddress() { return ipAddress; }
        public String getUserAgent() { return userAgent; }
        public LocalDateTime getCreatedTime() { return createdTime; }
        public LocalDateTime getLastActiveTime() { return lastActiveTime; }
        public int getTimeoutHours() { return timeoutHours; }
    }
    
    /**
     * 登录尝试信息
     */
    private static class LoginAttemptInfo {
        private int failedAttempts = 0;
        private LocalDateTime lockoutTime;
        private int lockoutDurationMinutes;
        
        public void recordFailedAttempt() {
            failedAttempts++;
        }
        
        public void lockAccount(int durationMinutes) {
            this.lockoutTime = LocalDateTime.now();
            this.lockoutDurationMinutes = durationMinutes;
        }
        
        public boolean isLocked() {
            return lockoutTime != null && !isLockoutExpired();
        }
        
        public boolean isLockoutExpired() {
            return lockoutTime != null && 
                   LocalDateTime.now().isAfter(lockoutTime.plusMinutes(lockoutDurationMinutes));
        }
        
        public int getFailedAttempts() {
            return failedAttempts;
        }
    }
    
    /**
     * 令牌声明
     */
    private static class TokenClaims {
        private final Long userId;
        private final String username;
        private final String sessionId;
        private final long timestamp;
        
        public TokenClaims(Long userId, String username, String sessionId, long timestamp) {
            this.userId = userId;
            this.username = username;
            this.sessionId = sessionId;
            this.timestamp = timestamp;
        }
        
        public Long getUserId() { return userId; }
        public String getUsername() { return username; }
        public String getSessionId() { return sessionId; }
        public long getTimestamp() { return timestamp; }
    }
    
    /**
     * 登录结果
     */
    public static class LoginResult {
        private final boolean success;
        private final String message;
        private final User user;
        private final String accessToken;
        private final String refreshToken;
        private final SessionInfo session;
        
        private LoginResult(boolean success, String message, User user, 
                           String accessToken, String refreshToken, SessionInfo session) {
            this.success = success;
            this.message = message;
            this.user = user;
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.session = session;
        }
        
        public static LoginResult success(User user, String accessToken, String refreshToken, SessionInfo session) {
            return new LoginResult(true, "登录成功", user, accessToken, refreshToken, session);
        }
        
        public static LoginResult failure(String message) {
            return new LoginResult(false, message, null, null, null, null);
        }
        
        // Getters
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public User getUser() { return user; }
        public String getAccessToken() { return accessToken; }
        public String getRefreshToken() { return refreshToken; }
        public SessionInfo getSession() { return session; }
    }
    
    /**
     * 令牌刷新结果
     */
    public static class TokenRefreshResult {
        private final boolean success;
        private final String message;
        private final String accessToken;
        
        private TokenRefreshResult(boolean success, String message, String accessToken) {
            this.success = success;
            this.message = message;
            this.accessToken = accessToken;
        }
        
        public static TokenRefreshResult success(String accessToken) {
            return new TokenRefreshResult(true, "令牌刷新成功", accessToken);
        }
        
        public static TokenRefreshResult failure(String message) {
            return new TokenRefreshResult(false, message, null);
        }
        
        // Getters
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public String getAccessToken() { return accessToken; }
    }
    
    /**
     * 令牌验证结果
     */
    public static class TokenValidationResult {
        private final boolean valid;
        private final String message;
        private final Long userId;
        private final String username;
        private final SessionInfo session;
        
        private TokenValidationResult(boolean valid, String message, Long userId, String username, SessionInfo session) {
            this.valid = valid;
            this.message = message;
            this.userId = userId;
            this.username = username;
            this.session = session;
        }
        
        public static TokenValidationResult success(Long userId, String username, SessionInfo session) {
            return new TokenValidationResult(true, "令牌有效", userId, username, session);
        }
        
        public static TokenValidationResult failure(String message) {
            return new TokenValidationResult(false, message, null, null, null);
        }
        
        // Getters
        public boolean isValid() { return valid; }
        public String getMessage() { return message; }
        public Long getUserId() { return userId; }
        public String getUsername() { return username; }
        public SessionInfo getSession() { return session; }
    }
}