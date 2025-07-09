package com.zerocarbon.security;

import com.zerocarbon.service.AuthenticationService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

/**
 * JWT认证过滤器
 * 用于验证JWT令牌并设置用户认证信息
 * 
 * @author Zero Carbon Team
 * @version 1.0.0
 * @since 2024
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    
    @Value("${app.security.jwt.secret}")
    private String jwtSecret;
    
    private final AuthenticationService authenticationService;
    
    public JwtAuthenticationFilter(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);
            
            if (StringUtils.hasText(jwt) && validateToken(jwt)) {
                Claims claims = getClaimsFromToken(jwt);
                
                if (claims != null) {
                    String username = claims.getSubject();
                    Long userId = claims.get("userId", Long.class);
                    String sessionId = claims.get("sessionId", String.class);
                    
                    // 验证会话是否有效
                    if (authenticationService.isSessionValid(sessionId)) {
                        // 获取用户权限
                        @SuppressWarnings("unchecked")
                        List<String> authorities = claims.get("authorities", List.class);
                        
                        List<SimpleGrantedAuthority> grantedAuthorities = authorities.stream()
                                .map(SimpleGrantedAuthority::new)
                                .collect(Collectors.toList());
                        
                        // 创建认证对象
                        UsernamePasswordAuthenticationToken authentication = 
                                new UsernamePasswordAuthenticationToken(username, null, grantedAuthorities);
                        
                        // 设置详细信息
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        
                        // 在认证对象中添加用户ID和会话ID
                        JwtAuthenticationDetails details = new JwtAuthenticationDetails(
                                request, userId, sessionId);
                        authentication.setDetails(details);
                        
                        // 设置认证上下文
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        
                        logger.debug("用户 {} 认证成功，会话ID: {}", username, sessionId);
                    } else {
                        logger.warn("会话已失效，会话ID: {}", sessionId);
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.getWriter().write("{\"error\":\"会话已失效，请重新登录\"}");
                        return;
                    }
                }
            }
        } catch (ExpiredJwtException e) {
            logger.warn("JWT令牌已过期: {}", e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"令牌已过期，请重新登录\"}");
            return;
        } catch (UnsupportedJwtException e) {
            logger.warn("不支持的JWT令牌: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            logger.warn("无效的JWT令牌: {}", e.getMessage());
        } catch (SignatureException e) {
            logger.warn("JWT签名验证失败: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.warn("JWT令牌为空: {}", e.getMessage());
        } catch (Exception e) {
            logger.error("JWT认证过程中发生错误: {}", e.getMessage(), e);
        }
        
        filterChain.doFilter(request, response);
    }
    
    /**
     * 从请求中获取JWT令牌
     */
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        return null;
    }
    
    /**
     * 验证JWT令牌
     */
    private boolean validateToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            logger.debug("JWT令牌验证失败: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * 从JWT令牌中获取Claims
     */
    private Claims getClaimsFromToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception e) {
            logger.debug("获取JWT Claims失败: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * 自定义认证详细信息
     */
    public static class JwtAuthenticationDetails extends WebAuthenticationDetailsSource {
        private final Long userId;
        private final String sessionId;
        private final String remoteAddress;
        private final String sessionId2;
        
        public JwtAuthenticationDetails(HttpServletRequest request, Long userId, String sessionId) {
            this.userId = userId;
            this.sessionId = sessionId;
            this.remoteAddress = request.getRemoteAddr();
            this.sessionId2 = request.getSession(false) != null ? request.getSession(false).getId() : null;
        }
        
        public Long getUserId() {
            return userId;
        }
        
        public String getSessionId() {
            return sessionId;
        }
        
        public String getRemoteAddress() {
            return remoteAddress;
        }
        
        public String getHttpSessionId() {
            return sessionId2;
        }
        
        @Override
        public String toString() {
            return "JwtAuthenticationDetails{" +
                    "userId=" + userId +
                    ", sessionId='" + sessionId + '\'' +
                    ", remoteAddress='" + remoteAddress + '\'' +
                    ", httpSessionId='" + sessionId2 + '\'' +
                    '}';
        }
    }
}