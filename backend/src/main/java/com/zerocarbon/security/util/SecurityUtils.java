package com.zerocarbon.security.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.GrantedAuthority;
import lombok.extern.slf4j.Slf4j;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 安全工具类
 * 零碳园区数字孪生系统安全管理
 * 
 * @author 零碳园区数字孪生系统开发团队
 * @version 1.0
 * @since 2025-06-01
 */
@Slf4j
public class SecurityUtils {
    
    /**
     * 获取当前认证信息
     */
    public static Authentication getCurrentAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }
    
    /**
     * 获取当前用户名
     */
    public static String getCurrentUsername() {
        Authentication authentication = getCurrentAuthentication();
        if (authentication == null) {
            return null;
        }
        
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            return (String) principal;
        }
        
        return null;
    }
    
    /**
     * 获取当前用户ID
     */
    public static Long getCurrentUserId() {
        Authentication authentication = getCurrentAuthentication();
        if (authentication == null) {
            return null;
        }
        
        Object principal = authentication.getPrincipal();
        
        // 如果principal是自定义的UserDetails实现，尝试获取用户ID
        if (principal instanceof UserDetails) {
            try {
                // 假设UserDetails实现类有getId方法
                java.lang.reflect.Method getIdMethod = principal.getClass().getMethod("getId");
                Object userId = getIdMethod.invoke(principal);
                if (userId instanceof Long) {
                    return (Long) userId;
                } else if (userId instanceof Number) {
                    return ((Number) userId).longValue();
                } else if (userId instanceof String) {
                    return Long.parseLong((String) userId);
                }
            } catch (Exception e) {
                log.debug("无法从UserDetails获取用户ID", e);
            }
        }
        
        // 尝试从认证详情中获取用户ID
        Object details = authentication.getDetails();
        if (details instanceof java.util.Map) {
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> detailsMap = (java.util.Map<String, Object>) details;
            Object userId = detailsMap.get("userId");
            if (userId instanceof Long) {
                return (Long) userId;
            } else if (userId instanceof Number) {
                return ((Number) userId).longValue();
            } else if (userId instanceof String) {
                try {
                    return Long.parseLong((String) userId);
                } catch (NumberFormatException e) {
                    log.debug("无法解析用户ID: {}", userId);
                }
            }
        }
        
        return null;
    }
    
    /**
     * 获取当前用户的权限列表
     */
    public static List<String> getCurrentUserAuthorities() {
        Authentication authentication = getCurrentAuthentication();
        if (authentication == null) {
            return java.util.Collections.emptyList();
        }
        
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
    }
    
    /**
     * 检查当前用户是否有指定权限
     */
    public static boolean hasAuthority(String authority) {
        List<String> authorities = getCurrentUserAuthorities();
        return authorities.contains(authority);
    }
    
    /**
     * 检查当前用户是否有任一指定权限
     */
    public static boolean hasAnyAuthority(String... authorities) {
        List<String> userAuthorities = getCurrentUserAuthorities();
        for (String authority : authorities) {
            if (userAuthorities.contains(authority)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 检查当前用户是否有所有指定权限
     */
    public static boolean hasAllAuthorities(String... authorities) {
        List<String> userAuthorities = getCurrentUserAuthorities();
        for (String authority : authorities) {
            if (!userAuthorities.contains(authority)) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * 检查当前用户是否有指定角色
     */
    public static boolean hasRole(String role) {
        String roleAuthority = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        return hasAuthority(roleAuthority);
    }
    
    /**
     * 检查当前用户是否有任一指定角色
     */
    public static boolean hasAnyRole(String... roles) {
        for (String role : roles) {
            if (hasRole(role)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 检查当前用户是否已认证
     */
    public static boolean isAuthenticated() {
        Authentication authentication = getCurrentAuthentication();
        return authentication != null && authentication.isAuthenticated() && 
               !"anonymousUser".equals(authentication.getPrincipal());
    }
    
    /**
     * 检查当前用户是否为匿名用户
     */
    public static boolean isAnonymous() {
        return !isAuthenticated();
    }
    
    /**
     * 获取当前用户的详细信息
     */
    public static UserDetails getCurrentUserDetails() {
        Authentication authentication = getCurrentAuthentication();
        if (authentication == null) {
            return null;
        }
        
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails) {
            return (UserDetails) principal;
        }
        
        return null;
    }
    
    /**
     * 检查当前用户是否为系统管理员
     */
    public static boolean isAdmin() {
        return hasAnyRole("ADMIN", "SUPER_ADMIN", "SYSTEM_ADMIN");
    }
    
    /**
     * 检查当前用户是否为超级管理员
     */
    public static boolean isSuperAdmin() {
        return hasRole("SUPER_ADMIN");
    }
    
    /**
     * 获取当前用户的IP地址
     */
    public static String getCurrentUserIpAddress() {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attributes = 
                (org.springframework.web.context.request.ServletRequestAttributes) 
                org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            
            if (attributes != null) {
                jakarta.servlet.http.HttpServletRequest request = attributes.getRequest();
                return getClientIpAddress(request);
            }
        } catch (Exception e) {
            log.debug("获取用户IP地址失败", e);
        }
        
        return null;
    }
    
    /**
     * 获取客户端真实IP地址
     */
    private static String getClientIpAddress(jakarta.servlet.http.HttpServletRequest request) {
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
    
    /**
     * 获取当前用户的会话ID
     */
    public static String getCurrentSessionId() {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attributes = 
                (org.springframework.web.context.request.ServletRequestAttributes) 
                org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            
            if (attributes != null) {
                jakarta.servlet.http.HttpServletRequest request = attributes.getRequest();
                jakarta.servlet.http.HttpSession session = request.getSession(false);
                if (session != null) {
                    return session.getId();
                }
            }
        } catch (Exception e) {
            log.debug("获取会话ID失败", e);
        }
        
        return null;
    }
    
    /**
     * 获取当前用户的User-Agent
     */
    public static String getCurrentUserAgent() {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attributes = 
                (org.springframework.web.context.request.ServletRequestAttributes) 
                org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            
            if (attributes != null) {
                jakarta.servlet.http.HttpServletRequest request = attributes.getRequest();
                return request.getHeader("User-Agent");
            }
        } catch (Exception e) {
            log.debug("获取User-Agent失败", e);
        }
        
        return null;
    }
    
    /**
     * 清除当前安全上下文
     */
    public static void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }
    
    /**
     * 检查用户是否有访问指定资源的权限
     */
    public static boolean canAccessResource(String resourceType, String resourceId, String operation) {
        // 这里可以集成具体的权限检查逻辑
        // 目前返回基本的权限检查结果
        if (!isAuthenticated()) {
            return false;
        }
        
        // 超级管理员有所有权限
        if (isSuperAdmin()) {
            return true;
        }
        
        // 管理员有大部分权限
        if (isAdmin() && !"DELETE".equals(operation)) {
            return true;
        }
        
        // 其他用户需要具体的权限检查
        String permissionCode = String.format("%s:%s:%s", resourceType, operation, resourceId != null ? resourceId : "*");
        return hasAuthority(permissionCode);
    }
    
    /**
     * 获取当前用户的基本信息
     */
    public static java.util.Map<String, Object> getCurrentUserInfo() {
        java.util.Map<String, Object> userInfo = new java.util.HashMap<>();
        
        userInfo.put("userId", getCurrentUserId());
        userInfo.put("username", getCurrentUsername());
        userInfo.put("authorities", getCurrentUserAuthorities());
        userInfo.put("authenticated", isAuthenticated());
        userInfo.put("admin", isAdmin());
        userInfo.put("superAdmin", isSuperAdmin());
        userInfo.put("ipAddress", getCurrentUserIpAddress());
        userInfo.put("sessionId", getCurrentSessionId());
        userInfo.put("userAgent", getCurrentUserAgent());
        
        return userInfo;
    }
    
    /**
     * 私有构造函数，防止实例化
     */
    private SecurityUtils() {
        throw new UnsupportedOperationException("工具类不能被实例化");
    }
}