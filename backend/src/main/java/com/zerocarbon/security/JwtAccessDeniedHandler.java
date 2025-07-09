package com.zerocarbon.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * JWT访问拒绝处理器
 * 处理已认证但权限不足的用户访问请求
 * 
 * @author Zero Carbon Team
 * @version 1.0.0
 * @since 2025
 */
@Component
public class JwtAccessDeniedHandler implements AccessDeniedHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtAccessDeniedHandler.class);
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException, ServletException {
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication != null ? authentication.getName() : "anonymous";
        
        logger.warn("用户 {} 访问被拒绝: {} {}, 来源IP: {}, 权限: {}", 
                username, request.getMethod(), request.getRequestURI(), 
                getClientIpAddress(request), 
                authentication != null ? authentication.getAuthorities().stream()
                        .map(Object::toString)
                        .collect(Collectors.joining(", ")) : "none");
        
        // 设置响应状态和内容类型
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        
        // 构建错误响应
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        errorResponse.put("status", HttpServletResponse.SC_FORBIDDEN);
        errorResponse.put("error", "Forbidden");
        errorResponse.put("path", request.getRequestURI());
        errorResponse.put("method", request.getMethod());
        errorResponse.put("user", username);
        
        // 根据请求路径提供更具体的错误信息
        String requestURI = request.getRequestURI();
        if (requestURI.contains("/api/admin/")) {
            errorResponse.put("message", "管理员权限不足，无法访问此资源");
            errorResponse.put("code", "ADMIN_PERMISSION_DENIED");
            errorResponse.put("requiredRole", "ADMIN");
        } else if (requestURI.contains("/api/security/users")) {
            errorResponse.put("message", "用户管理权限不足，请联系管理员");
            errorResponse.put("code", "USER_MANAGEMENT_DENIED");
            errorResponse.put("requiredPermission", "USER_MANAGEMENT");
        } else if (requestURI.contains("/api/security/roles")) {
            errorResponse.put("message", "角色管理权限不足，请联系管理员");
            errorResponse.put("code", "ROLE_MANAGEMENT_DENIED");
            errorResponse.put("requiredPermission", "ROLE_MANAGEMENT");
        } else if (requestURI.contains("/api/security/permissions")) {
            errorResponse.put("message", "权限管理权限不足，请联系管理员");
            errorResponse.put("code", "PERMISSION_MANAGEMENT_DENIED");
            errorResponse.put("requiredPermission", "PERMISSION_MANAGEMENT");
        } else if (requestURI.contains("/api/security/data-permissions")) {
            errorResponse.put("message", "数据权限管理权限不足，请联系管理员");
            errorResponse.put("code", "DATA_PERMISSION_DENIED");
            errorResponse.put("requiredPermission", "DATA_PERMISSION_MANAGEMENT");
        } else if (requestURI.contains("/api/system/")) {
            errorResponse.put("message", "系统配置权限不足，请联系管理员");
            errorResponse.put("code", "SYSTEM_CONFIG_DENIED");
            errorResponse.put("requiredPermission", "SYSTEM_CONFIG");
        } else {
            errorResponse.put("message", "权限不足，无法访问此资源");
            errorResponse.put("code", "ACCESS_DENIED");
        }
        
        // 添加用户当前权限信息
        if (authentication != null && authentication.getAuthorities() != null) {
            errorResponse.put("currentAuthorities", authentication.getAuthorities().stream()
                    .map(Object::toString)
                    .collect(Collectors.toList()));
        }
        
        // 添加帮助信息
        Map<String, Object> help = new HashMap<>();
        help.put("contactAdmin", "请联系系统管理员获取相应权限");
        help.put("adminEmail", "admin@zerocarbon.com");
        help.put("documentation", "/swagger-ui/");
        help.put("userProfile", "/api/auth/profile");
        errorResponse.put("help", help);
        
        // 如果是AJAX请求，添加特殊标识
        String xRequestedWith = request.getHeader("X-Requested-With");
        if ("XMLHttpRequest".equals(xRequestedWith)) {
            errorResponse.put("ajaxRequest", true);
            response.setHeader("X-Permission-Required", "true");
        }
        
        // 添加CORS头部（如果需要）
        String origin = request.getHeader("Origin");
        if (origin != null) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
        }
        
        // 记录详细的访问拒绝信息
        Map<String, Object> auditInfo = new HashMap<>();
        auditInfo.put("user", username);
        auditInfo.put("action", "ACCESS_DENIED");
        auditInfo.put("resource", requestURI);
        auditInfo.put("method", request.getMethod());
        auditInfo.put("ip", getClientIpAddress(request));
        auditInfo.put("userAgent", request.getHeader("User-Agent"));
        auditInfo.put("timestamp", LocalDateTime.now());
        
        logger.info("访问拒绝审计日志: {}", auditInfo);
        
        // 写入响应
        try {
            String jsonResponse = objectMapper.writeValueAsString(errorResponse);
            response.getWriter().write(jsonResponse);
            response.getWriter().flush();
        } catch (Exception e) {
            logger.error("写入访问拒绝响应时发生异常", e);
            response.getWriter().write("{\"error\":\"权限不足\",\"message\":\"无法访问此资源\"}");
        }
    }
    
    /**
     * 获取客户端真实IP地址
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
        
        String xForwardedProto = request.getHeader("X-Forwarded-Proto");
        if (xForwardedProto != null) {
            String proxyClientIp = request.getHeader("Proxy-Client-IP");
            if (proxyClientIp != null && !proxyClientIp.isEmpty() && !"unknown".equalsIgnoreCase(proxyClientIp)) {
                return proxyClientIp;
            }
            
            String wlProxyClientIp = request.getHeader("WL-Proxy-Client-IP");
            if (wlProxyClientIp != null && !wlProxyClientIp.isEmpty() && !"unknown".equalsIgnoreCase(wlProxyClientIp)) {
                return wlProxyClientIp;
            }
        }
        
        return request.getRemoteAddr();
    }
}