package com.zerocarbon.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT认证入口点
 * 处理未认证用户的访问请求
 * 
 * @author Zero Carbon Team
 * @version 1.0.0
 * @since 2025
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationEntryPoint.class);
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        
        logger.warn("未认证访问被拒绝: {} {}, 来源IP: {}, User-Agent: {}", 
                request.getMethod(), request.getRequestURI(), 
                getClientIpAddress(request), request.getHeader("User-Agent"));
        
        // 设置响应状态和内容类型
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        
        // 构建错误响应
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        errorResponse.put("status", HttpServletResponse.SC_UNAUTHORIZED);
        errorResponse.put("error", "Unauthorized");
        errorResponse.put("message", "访问被拒绝，请先登录");
        errorResponse.put("path", request.getRequestURI());
        errorResponse.put("method", request.getMethod());
        
        // 根据请求路径提供更具体的错误信息
        String requestURI = request.getRequestURI();
        if (requestURI.contains("/api/auth/")) {
            errorResponse.put("message", "认证失败，请检查登录凭据");
            errorResponse.put("code", "AUTH_FAILED");
        } else if (requestURI.contains("/api/admin/")) {
            errorResponse.put("message", "管理员权限不足，请联系系统管理员");
            errorResponse.put("code", "ADMIN_ACCESS_DENIED");
        } else if (requestURI.contains("/api/user/")) {
            errorResponse.put("message", "用户未登录或会话已过期，请重新登录");
            errorResponse.put("code", "USER_NOT_AUTHENTICATED");
        } else {
            errorResponse.put("message", "访问被拒绝，请先登录");
            errorResponse.put("code", "ACCESS_DENIED");
        }
        
        // 添加帮助信息
        Map<String, Object> help = new HashMap<>();
        help.put("loginUrl", "/api/auth/login");
        help.put("refreshUrl", "/api/auth/refresh");
        help.put("documentation", "/swagger-ui/");
        errorResponse.put("help", help);
        
        // 如果是AJAX请求，添加特殊标识
        String xRequestedWith = request.getHeader("X-Requested-With");
        if ("XMLHttpRequest".equals(xRequestedWith)) {
            errorResponse.put("ajaxRequest", true);
            response.setHeader("X-Auth-Required", "true");
        }
        
        // 添加CORS头部（如果需要）
        String origin = request.getHeader("Origin");
        if (origin != null) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
        }
        
        // 写入响应
        try {
            String jsonResponse = objectMapper.writeValueAsString(errorResponse);
            response.getWriter().write(jsonResponse);
            response.getWriter().flush();
        } catch (Exception e) {
            logger.error("写入认证错误响应时发生异常", e);
            response.getWriter().write("{\"error\":\"认证失败\",\"message\":\"请先登录\"}");
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