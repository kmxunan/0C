package com.zerocarbon.security.config;

import com.zerocarbon.security.service.AuthenticationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;

/**
 * Spring Security 配置类
 * 零碳园区数字孪生系统安全配置
 */
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true, securedEnabled = true)
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    
    @Autowired
    private AuthenticationService authenticationService;
    
    /**
     * 密码编码器
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
    
    /**
     * JWT认证过滤器
     */
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(authenticationService);
    }
    
    /**
     * CORS配置
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // 允许的源
        configuration.setAllowedOriginPatterns(Collections.singletonList("*"));
        
        // 允许的HTTP方法
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        
        // 允许的请求头
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "Accept",
                "Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers",
                "X-Real-IP",
                "X-Forwarded-For"
        ));
        
        // 暴露的响应头
        configuration.setExposedHeaders(Arrays.asList(
                "Authorization",
                "Content-Disposition"
        ));
        
        // 允许凭证
        configuration.setAllowCredentials(true);
        
        // 预检请求缓存时间
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
    
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
                // 禁用CSRF（使用JWT时不需要）
                .csrf().disable()
                
                // 启用CORS
                .cors().configurationSource(corsConfigurationSource())
                
                .and()
                
                // 会话管理 - 无状态
                .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                
                .and()
                
                // 请求授权配置
                .authorizeRequests()
                
                // 公开访问的端点
                .antMatchers(
                        "/api/auth/login",
                        "/api/auth/refresh",
                        "/api/auth/validate",
                        "/actuator/**",
                        "/swagger-ui/**",
                        "/swagger-resources/**",
                        "/v2/api-docs",
                        "/v3/api-docs/**",
                        "/webjars/**",
                        "/favicon.ico",
                        "/error"
                ).permitAll()
                
                // 系统初始化端点（仅在开发环境开放）
                .antMatchers("/api/security/initialize").permitAll()
                
                // 认证相关端点需要认证
                .antMatchers("/api/auth/**").authenticated()
                
                // 用户管理端点需要用户管理权限
                .antMatchers("/api/security/users/**")
                .hasAnyAuthority("USER_MANAGE", "ADMIN")
                
                // 角色管理端点需要角色管理权限
                .antMatchers("/api/security/roles/**")
                .hasAnyAuthority("ROLE_MANAGE", "ADMIN")
                
                // 权限管理端点需要权限管理权限
                .antMatchers("/api/security/permissions/**")
                .hasAnyAuthority("PERMISSION_MANAGE", "ADMIN")
                
                // 数据权限管理端点需要数据权限管理权限
                .antMatchers("/api/security/data-permissions/**")
                .hasAnyAuthority("DATA_PERMISSION_MANAGE", "ADMIN")
                
                // 统计信息端点需要查看权限
                .antMatchers("/api/security/statistics")
                .hasAnyAuthority("SYSTEM_VIEW", "ADMIN")
                
                // 其他所有请求都需要认证
                .anyRequest().authenticated()
                
                .and()
                
                // 异常处理
                .exceptionHandling()
                .authenticationEntryPoint(new CustomAuthenticationEntryPoint())
                .accessDeniedHandler(new CustomAccessDeniedHandler())
                
                .and()
                
                // 添加JWT认证过滤器
                .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
                
                // 添加安全响应头
                .headers()
                .frameOptions().deny()
                .contentTypeOptions().and()
                .httpStrictTransportSecurity(hstsConfig -> hstsConfig
                        .maxAgeInSeconds(31536000)
                        .includeSubdomains(true)
                        .preload(true)
                )
                .and()
                
                // 禁用默认登录页面
                .formLogin().disable()
                .httpBasic().disable();
    }
    
    /**
     * JWT认证过滤器
     */
    public static class JwtAuthenticationFilter implements Filter {
        
        private final AuthenticationService authenticationService;
        
        public JwtAuthenticationFilter(AuthenticationService authenticationService) {
            this.authenticationService = authenticationService;
        }
        
        @Override
        public void doFilter(jakarta.servlet.ServletRequest request,
                             jakarta.servlet.ServletResponse response, 
                           FilterChain chain) throws IOException, ServletException {
            
            HttpServletRequest httpRequest = (HttpServletRequest) request;
            HttpServletResponse httpResponse = (HttpServletResponse) response;
            
            // 跳过公开端点
            String requestURI = httpRequest.getRequestURI();
            if (isPublicEndpoint(requestURI)) {
                chain.doFilter(request, response);
                return;
            }
            
            // 获取Authorization头
            String authHeader = httpRequest.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                sendUnauthorizedResponse(httpResponse, "缺少访问令牌");
                return;
            }
            
            // 提取令牌
            String token = authHeader.substring(7);
            
            // 验证令牌
            AuthenticationService.TokenValidationResult validationResult = 
                    authenticationService.validateAccessToken(token);
            
            if (!validationResult.isValid()) {
                sendUnauthorizedResponse(httpResponse, validationResult.getMessage());
                return;
            }
            
            // 设置用户信息到请求属性中
            httpRequest.setAttribute("userId", validationResult.getUserId());
            httpRequest.setAttribute("username", validationResult.getUsername());
            httpRequest.setAttribute("sessionId", validationResult.getSession().getSessionId());
            
            // 继续过滤链
            chain.doFilter(request, response);
        }
        
        /**
         * 检查是否为公开端点
         */
        private boolean isPublicEndpoint(String requestURI) {
            String[] publicEndpoints = {
                    "/api/auth/login",
                    "/api/auth/refresh",
                    "/api/auth/validate",
                    "/api/security/initialize",
                    "/actuator",
                    "/swagger-ui",
                    "/swagger-resources",
                    "/v2/api-docs",
                    "/v3/api-docs",
                    "/webjars",
                    "/favicon.ico",
                    "/error"
            };
            
            for (String endpoint : publicEndpoints) {
                if (requestURI.startsWith(endpoint)) {
                    return true;
                }
            }
            
            return false;
        }
        
        /**
         * 发送未授权响应
         */
        private void sendUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(String.format(
                    "{\"code\":401,\"message\":\"%s\",\"data\":null,\"timestamp\":\"%s\",\"success\":false}",
                    message,
                    java.time.LocalDateTime.now().toString()
            ));
        }
    }
    
    /**
     * 自定义认证入口点
     */
    public static class CustomAuthenticationEntryPoint implements org.springframework.security.web.AuthenticationEntryPoint {
        
        @Override
        public void commence(HttpServletRequest request, 
                           HttpServletResponse response, 
                           org.springframework.security.core.AuthenticationException authException) 
                throws IOException {
            
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(String.format(
                    "{\"code\":401,\"message\":\"未授权访问\",\"data\":null,\"timestamp\":\"%s\",\"success\":false}",
                    java.time.LocalDateTime.now().toString()
            ));
        }
    }
    
    /**
     * 自定义访问拒绝处理器
     */
    public static class CustomAccessDeniedHandler implements org.springframework.security.web.access.AccessDeniedHandler {
        
        @Override
        public void handle(HttpServletRequest request, 
                         HttpServletResponse response, 
                         org.springframework.security.access.AccessDeniedException accessDeniedException) 
                throws IOException {
            
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(String.format(
                    "{\"code\":403,\"message\":\"访问被拒绝，权限不足\",\"data\":null,\"timestamp\":\"%s\",\"success\":false}",
                    java.time.LocalDateTime.now().toString()
            ));
        }
    }
}