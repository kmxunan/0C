package com.zerocarbon.security.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 用户登录日志实体类
 * 零碳园区数字孪生系统用户行为审计
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user_login_logs")
public class UserLoginLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 用户ID
     */
    @Column(nullable = false)
    private Long userId;
    
    /**
     * 用户名
     */
    @Column(nullable = false, length = 50)
    private String username;
    
    /**
     * 登录类型（WEB, MOBILE, API）
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoginType loginType;
    
    /**
     * 登录状态（SUCCESS, FAILED, LOCKED）
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoginStatus status;
    
    /**
     * 登录IP地址
     */
    @Column(length = 50)
    private String ipAddress;
    
    /**
     * 用户代理（浏览器信息）
     */
    @Column(length = 500)
    private String userAgent;
    
    /**
     * 登录时间
     */
    @Column(nullable = false)
    private LocalDateTime loginTime;
    
    /**
     * 登出时间
     */
    private LocalDateTime logoutTime;
    
    /**
     * 会话ID
     */
    @Column(length = 100)
    private String sessionId;
    
    /**
     * 登录失败原因
     */
    @Column(length = 200)
    private String failureReason;
    
    /**
     * 地理位置信息
     */
    @Column(length = 200)
    private String location;
    
    /**
     * 设备信息
     */
    @Column(length = 200)
    private String deviceInfo;
    
    /**
     * 是否为可疑登录
     */
    @Column(nullable = false)
    private Boolean suspicious;
    
    /**
     * 风险评分（0-100）
     */
    @Column
    private Integer riskScore;
    
    /**
     * 备注信息
     */
    @Column(length = 500)
    private String remarks;
    
    /**
     * 登录类型枚举
     */
    public enum LoginType {
        WEB("网页登录"),
        MOBILE("移动端登录"),
        API("API登录"),
        SSO("单点登录");
        
        private final String description;
        
        LoginType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 登录状态枚举
     */
    public enum LoginStatus {
        SUCCESS("登录成功"),
        FAILED("登录失败"),
        LOCKED("账户锁定"),
        EXPIRED("密码过期"),
        DISABLED("账户禁用");
        
        private final String description;
        
        LoginStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 风险等级定义
     */
    public static class RiskLevels {
        public static final int LOW_RISK = 20;
        public static final int MEDIUM_RISK = 50;
        public static final int HIGH_RISK = 80;
        public static final int CRITICAL_RISK = 100;
    }
    
    /**
     * 检查是否为成功登录
     */
    public boolean isSuccessful() {
        return status == LoginStatus.SUCCESS;
    }
    
    /**
     * 检查是否为失败登录
     */
    public boolean isFailed() {
        return status == LoginStatus.FAILED;
    }
    
    /**
     * 检查是否为可疑登录
     */
    public boolean isSuspicious() {
        return suspicious != null && suspicious;
    }
    
    /**
     * 检查是否为高风险登录
     */
    public boolean isHighRisk() {
        return riskScore != null && riskScore >= RiskLevels.HIGH_RISK;
    }
    
    /**
     * 计算会话时长（分钟）
     */
    public Long getSessionDurationMinutes() {
        if (loginTime == null || logoutTime == null) {
            return null;
        }
        return java.time.Duration.between(loginTime, logoutTime).toMinutes();
    }
    
    /**
     * 获取风险等级描述
     */
    public String getRiskLevelDescription() {
        if (riskScore == null) {
            return "未知";
        }
        
        if (riskScore >= RiskLevels.CRITICAL_RISK) {
            return "极高风险";
        } else if (riskScore >= RiskLevels.HIGH_RISK) {
            return "高风险";
        } else if (riskScore >= RiskLevels.MEDIUM_RISK) {
            return "中等风险";
        } else if (riskScore >= RiskLevels.LOW_RISK) {
            return "低风险";
        } else {
            return "安全";
        }
    }
    
    /**
     * 解析用户代理信息
     */
    public String getBrowserInfo() {
        if (userAgent == null) {
            return "未知";
        }
        
        // 简单的浏览器识别
        if (userAgent.contains("Chrome")) {
            return "Chrome";
        } else if (userAgent.contains("Firefox")) {
            return "Firefox";
        } else if (userAgent.contains("Safari")) {
            return "Safari";
        } else if (userAgent.contains("Edge")) {
            return "Edge";
        } else {
            return "其他";
        }
    }
    
    /**
     * 获取操作系统信息
     */
    public String getOperatingSystem() {
        if (userAgent == null) {
            return "未知";
        }
        
        // 简单的操作系统识别
        if (userAgent.contains("Windows")) {
            return "Windows";
        } else if (userAgent.contains("Mac")) {
            return "macOS";
        } else if (userAgent.contains("Linux")) {
            return "Linux";
        } else if (userAgent.contains("Android")) {
            return "Android";
        } else if (userAgent.contains("iOS")) {
            return "iOS";
        } else {
            return "其他";
        }
    }
    
    @PrePersist
    protected void onCreate() {
        if (loginTime == null) {
            loginTime = LocalDateTime.now();
        }
        if (suspicious == null) {
            suspicious = false;
        }
        if (riskScore == null) {
            riskScore = 0;
        }
    }
}