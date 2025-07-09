package com.zerocarbon.security.controller;

import com.zerocarbon.common.response.ApiResponse;
import com.zerocarbon.security.entity.UserLoginLog;
import com.zerocarbon.security.service.AuthenticationService;
import com.zerocarbon.security.service.UserLoginLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 认证控制器
 * 零碳园区数字孪生系统用户认证API
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired
    private AuthenticationService authenticationService;
    
    @Autowired
    private UserLoginLogService loginLogService;
    
    /**
     * 用户登录
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(
            @Valid @RequestBody LoginRequest loginRequest,
            HttpServletRequest request) {
        try {
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            
            AuthenticationService.LoginResult result = authenticationService.login(
                    loginRequest.getUsername(),
                    loginRequest.getPassword(),
                    loginRequest.getLoginType(),
                    ipAddress,
                    userAgent
            );
            
            if (result.isSuccess()) {
                Map<String, Object> responseData = Map.of(
                        "user", Map.of(
                                "id", result.getUser().getId(),
                                "username", result.getUser().getUsername(),
                                "realName", result.getUser().getRealName(),
                                "email", result.getUser().getEmail(),
                                "department", result.getUser().getDepartment(),
                                "position", result.getUser().getPosition()
                        ),
                        "accessToken", result.getAccessToken(),
                        "refreshToken", result.getRefreshToken(),
                        "session", Map.of(
                                "sessionId", result.getSession().getSessionId(),
                                "createdTime", result.getSession().getCreatedTime(),
                                "timeoutHours", result.getSession().getTimeoutHours()
                        )
                );
                return ResponseEntity.ok(ApiResponse.success(responseData, "登录成功"));
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error(result.getMessage()));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("登录失败: " + e.getMessage()));
        }
    }
    
    /**
     * 用户登出
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody Map<String, String> logoutRequest) {
        try {
            String sessionId = logoutRequest.get("sessionId");
            authenticationService.logout(sessionId);
            return ResponseEntity.ok(ApiResponse.success(null, "登出成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("登出失败: " + e.getMessage()));
        }
    }
    
    /**
     * 刷新访问令牌
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Map<String, String>>> refreshToken(
            @RequestBody Map<String, String> refreshRequest) {
        try {
            String refreshToken = refreshRequest.get("refreshToken");
            AuthenticationService.TokenRefreshResult result = authenticationService.refreshToken(refreshToken);
            
            if (result.isSuccess()) {
                Map<String, String> responseData = Map.of("accessToken", result.getAccessToken());
                return ResponseEntity.ok(ApiResponse.success(responseData, "令牌刷新成功"));
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error(result.getMessage()));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("令牌刷新失败: " + e.getMessage()));
        }
    }
    
    /**
     * 验证访问令牌
     */
    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateToken(
            @RequestBody Map<String, String> validateRequest) {
        try {
            String accessToken = validateRequest.get("accessToken");
            AuthenticationService.TokenValidationResult result = authenticationService.validateAccessToken(accessToken);
            
            if (result.isValid()) {
                Map<String, Object> responseData = Map.of(
                        "userId", result.getUserId(),
                        "username", result.getUsername(),
                        "session", Map.of(
                                "sessionId", result.getSession().getSessionId(),
                                "lastActiveTime", result.getSession().getLastActiveTime(),
                                "ipAddress", result.getSession().getIpAddress()
                        )
                );
                return ResponseEntity.ok(ApiResponse.success(responseData, "令牌有效"));
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error(result.getMessage()));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("令牌验证失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取当前用户会话信息
     */
    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<AuthenticationService.SessionInfo>>> getCurrentUserSessions(
            @RequestParam Long userId) {
        try {
            List<AuthenticationService.SessionInfo> sessions = authenticationService.getUserActiveSessions(userId);
            return ResponseEntity.ok(ApiResponse.success(sessions));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("获取会话信息失败: " + e.getMessage()));
        }
    }
    
    /**
     * 踢出指定会话
     */
    @PostMapping("/sessions/{sessionId}/kickout")
    public ResponseEntity<ApiResponse<Void>> kickoutSession(@PathVariable String sessionId) {
        try {
            boolean success = authenticationService.kickoutSession(sessionId);
            if (success) {
                return ResponseEntity.ok(ApiResponse.success(null, "会话已踢出"));
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error("会话不存在或已过期"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("踢出会话失败: " + e.getMessage()));
        }
    }
    
    /**
     * 踢出用户所有会话
     */
    @PostMapping("/users/{userId}/kickout-all")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> kickoutAllUserSessions(@PathVariable Long userId) {
        try {
            int kickedOutCount = authenticationService.kickoutAllUserSessions(userId);
            Map<String, Integer> responseData = Map.of("kickedOutCount", kickedOutCount);
            return ResponseEntity.ok(ApiResponse.success(responseData, "已踢出所有会话"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("踢出会话失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取登录历史
     */
    @GetMapping("/users/{userId}/login-history")
    public ResponseEntity<ApiResponse<List<UserLoginLog>>> getLoginHistory(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "20") int limit) {
        try {
            List<UserLoginLog> loginHistory = loginLogService.getUserLoginHistory(userId, limit);
            return ResponseEntity.ok(ApiResponse.success(loginHistory));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("获取登录历史失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取登录统计信息
     */
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLoginStatistics(
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        try {
            LocalDateTime start = startTime != null ? LocalDateTime.parse(startTime) : LocalDateTime.now().minusDays(7);
            LocalDateTime end = endTime != null ? LocalDateTime.parse(endTime) : LocalDateTime.now();
            
            Map<String, Object> loginStats = loginLogService.getLoginStatistics(start, end);
            Map<String, Object> sessionStats = authenticationService.getSessionStatistics();
            
            Map<String, Object> combinedStats = Map.of(
                    "loginStatistics", loginStats,
                    "sessionStatistics", sessionStats
            );
            
            return ResponseEntity.ok(ApiResponse.success(combinedStats));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("获取统计信息失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取可疑登录记录
     */
    @GetMapping("/suspicious-logins")
    public ResponseEntity<ApiResponse<List<UserLoginLog>>> getSuspiciousLogins(
            @RequestParam(required = false) String since) {
        try {
            LocalDateTime sinceTime = since != null ? LocalDateTime.parse(since) : LocalDateTime.now().minusDays(1);
            List<UserLoginLog> suspiciousLogins = loginLogService.getSuspiciousLogins(sinceTime);
            return ResponseEntity.ok(ApiResponse.success(suspiciousLogins));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("获取可疑登录记录失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取高风险登录记录
     */
    @GetMapping("/high-risk-logins")
    public ResponseEntity<ApiResponse<List<UserLoginLog>>> getHighRiskLogins(
            @RequestParam(required = false) String since) {
        try {
            LocalDateTime sinceTime = since != null ? LocalDateTime.parse(since) : LocalDateTime.now().minusDays(1);
            List<UserLoginLog> highRiskLogins = loginLogService.getHighRiskLogins(sinceTime);
            return ResponseEntity.ok(ApiResponse.success(highRiskLogins));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("获取高风险登录记录失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取IP地址登录统计
     */
    @GetMapping("/ip-statistics")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getIpStatistics(
            @RequestParam(required = false) String since) {
        try {
            LocalDateTime sinceTime = since != null ? LocalDateTime.parse(since) : LocalDateTime.now().minusDays(7);
            Map<String, Long> ipStats = loginLogService.getIpAddressStatistics(sinceTime);
            return ResponseEntity.ok(ApiResponse.success(ipStats));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("获取IP统计失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取地理位置登录统计
     */
    @GetMapping("/location-statistics")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getLocationStatistics(
            @RequestParam(required = false) String since) {
        try {
            LocalDateTime sinceTime = since != null ? LocalDateTime.parse(since) : LocalDateTime.now().minusDays(7);
            Map<String, Long> locationStats = loginLogService.getLocationStatistics(sinceTime);
            return ResponseEntity.ok(ApiResponse.success(locationStats));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("获取地理位置统计失败: " + e.getMessage()));
        }
    }
    
    /**
     * 清理过期会话
     */
    @PostMapping("/cleanup-sessions")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> cleanupExpiredSessions() {
        try {
            int cleanedUpCount = authenticationService.cleanupExpiredSessions();
            Map<String, Integer> responseData = Map.of("cleanedUpCount", cleanedUpCount);
            return ResponseEntity.ok(ApiResponse.success(responseData, "过期会话清理完成"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("清理过期会话失败: " + e.getMessage()));
        }
    }
    
    /**
     * 清理过期登录日志
     */
    @PostMapping("/cleanup-logs")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> cleanupExpiredLogs(
            @RequestParam(defaultValue = "90") int retentionDays) {
        try {
            int cleanedUpCount = loginLogService.cleanupExpiredLogs(retentionDays);
            Map<String, Integer> responseData = Map.of("cleanedUpCount", cleanedUpCount);
            return ResponseEntity.ok(ApiResponse.success(responseData, "过期日志清理完成"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("清理过期日志失败: " + e.getMessage()));
        }
    }
    
    // ==================== 私有辅助方法 ====================
    
    /**
     * 获取客户端IP地址
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    // ==================== 请求/响应模型 ====================
    
    /**
     * 登录请求模型
     */
    public static class LoginRequest {
        private String username;
        private String password;
        private UserLoginLog.LoginType loginType = UserLoginLog.LoginType.WEB;
        
        // Getters and Setters
        public String getUsername() {
            return username;
        }
        
        public void setUsername(String username) {
            this.username = username;
        }
        
        public String getPassword() {
            return password;
        }
        
        public void setPassword(String password) {
            this.password = password;
        }
        
        public UserLoginLog.LoginType getLoginType() {
            return loginType;
        }
        
        public void setLoginType(UserLoginLog.LoginType loginType) {
            this.loginType = loginType;
        }
    }
}