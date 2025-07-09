package com.zerocarbon.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.Components;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

/**
 * Swagger配置类
 * 配置API文档生成
 * 
 * @author Zero Carbon Team
 * @version 1.0.0
 * @since 2024
 */
@Configuration
public class SwaggerConfig {
    
    @Value("${app.system.name:零碳园区数字孪生系统}")
    private String systemName;
    
    @Value("${app.system.version:1.0.0}")
    private String systemVersion;
    
    @Value("${app.system.description:零碳园区数字孪生系统后端API}")
    private String systemDescription;
    
    @Value("${app.system.contact.name:Zero Carbon Team}")
    private String contactName;
    
    @Value("${app.system.contact.email:admin@zerocarbon.com}")
    private String contactEmail;
    
    @Value("${app.system.contact.url:https://www.zerocarbon.com}")
    private String contactUrl;
    
    @Value("${server.port:8080}")
    private String serverPort;
    
    @Value("${server.servlet.context-path:}")
    private String contextPath;
    
    /**
     * 配置OpenAPI
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(apiInfo())
                .servers(serverList())
                .components(securityComponents())
                .addSecurityItem(securityRequirement());
    }
    
    /**
     * API信息
     */
    private Info apiInfo() {
        return new Info()
                .title(systemName + " API")
                .version(systemVersion)
                .description(buildDescription())
                .contact(new Contact()
                        .name(contactName)
                        .email(contactEmail)
                        .url(contactUrl))
                .license(new License()
                        .name("MIT License")
                        .url("https://opensource.org/licenses/MIT"));
    }
    
    /**
     * 构建API描述
     */
    private String buildDescription() {
        return systemDescription + "\n\n" +
                "## 功能特性\n" +
                "- 用户管理：用户注册、登录、权限管理\n" +
                "- 角色管理：角色创建、权限分配、角色继承\n" +
                "- 权限管理：权限定义、权限树、权限检查\n" +
                "- 数据权限：数据级权限控制、字段权限、数据脱敏\n" +
                "- 认证授权：JWT令牌、会话管理、单点登录\n" +
                "- 安全审计：登录日志、操作日志、安全统计\n" +
                "- 系统监控：健康检查、性能指标、错误追踪\n\n" +
                "## 技术栈\n" +
                "- Spring Boot 2.7.x\n" +
                "- Spring Security\n" +
                "- Spring Data JPA\n" +
                "- MySQL 8.0\n" +
                "- Redis\n" +
                "- JWT\n" +
                "- Swagger/OpenAPI 3\n\n" +
                "## 认证说明\n" +
                "大部分API需要JWT令牌认证，请先调用登录接口获取令牌，然后在请求头中添加：\n" +
                "`Authorization: Bearer {token}`\n\n" +
                "## 错误码说明\n" +
                "- 200: 成功\n" +
                "- 400: 请求参数错误\n" +
                "- 401: 未认证或令牌无效\n" +
                "- 403: 权限不足\n" +
                "- 404: 资源不存在\n" +
                "- 500: 服务器内部错误";
    }
    
    /**
     * 服务器列表
     */
    private List<Server> serverList() {
        String baseUrl = "http://localhost:" + serverPort + (contextPath != null ? contextPath : "");
        
        Server localServer = new Server()
                .url(baseUrl)
                .description("本地开发环境");
        
        Server testServer = new Server()
                .url("https://test-api.zerocarbon.com")
                .description("测试环境");
        
        Server prodServer = new Server()
                .url("https://api.zerocarbon.com")
                .description("生产环境");
        
        return Arrays.asList(localServer, testServer, prodServer);
    }
    
    /**
     * 安全组件配置
     */
    private Components securityComponents() {
        return new Components()
                .addSecuritySchemes("bearerAuth", new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("JWT认证令牌，格式：Bearer {token}"))
                .addSecuritySchemes("apiKey", new SecurityScheme()
                        .type(SecurityScheme.Type.APIKEY)
                        .in(SecurityScheme.In.HEADER)
                        .name("X-API-Key")
                        .description("API密钥认证（可选）"));
    }
    
    /**
     * 安全要求
     */
    private SecurityRequirement securityRequirement() {
        return new SecurityRequirement()
                .addList("bearerAuth")
                .addList("apiKey");
    }
}