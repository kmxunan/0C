# 零碳园区数字孪生系统后端

## 项目简介

零碳园区数字孪生系统是一个基于Spring Boot的企业级后端应用，专注于提供完整的用户管理、权限控制、数据安全和系统监控功能。系统采用现代化的微服务架构设计，具备高性能、高可用、高安全性的特点。

## 技术栈

### 核心框架
- **Spring Boot 2.7.x** - 应用框架
- **Spring Security** - 安全框架
- **Spring Data JPA** - 数据访问层
- **Spring Cache** - 缓存抽象
- **Spring Scheduling** - 定时任务

### 数据库
- **MySQL 8.0** - 主数据库
- **HikariCP** - 连接池
- **Hibernate** - ORM框架

### 缓存
- **Caffeine** - 本地缓存
- **Redis** - 分布式缓存（可选）

### 安全认证
- **JWT** - 令牌认证
- **BCrypt** - 密码加密

### 文档工具
- **Swagger/OpenAPI 3** - API文档
- **Knife4j** - API文档增强

### 工具库
- **Hutool** - Java工具库
- **Fastjson** - JSON处理
- **MapStruct** - 对象映射
- **Guava** - Google工具库

### 监控运维
- **Spring Boot Actuator** - 应用监控
- **Micrometer** - 指标收集
- **Logback** - 日志框架

## 功能特性

### 🔐 安全管理
- **用户管理**：用户注册、登录、密码策略、账户锁定
- **角色管理**：角色创建、权限分配、角色继承
- **权限管理**：权限定义、权限树、动态权限检查
- **数据权限**：数据级权限控制、字段权限、数据脱敏

### 🔑 认证授权
- **JWT认证**：无状态令牌认证
- **会话管理**：会话创建、超时、并发控制
- **单点登录**：统一认证入口
- **多端支持**：Web、移动端、API

### 📊 审计监控
- **登录日志**：登录成功/失败记录、IP追踪
- **操作日志**：用户操作审计、数据变更记录
- **安全统计**：登录趋势、风险分析、异常检测
- **系统监控**：性能指标、健康检查、告警通知

### ⚡ 性能优化
- **多级缓存**：本地缓存 + 分布式缓存
- **异步处理**：异步任务、事件驱动
- **连接池**：数据库连接池优化
- **批量操作**：批量插入、更新优化

### 🛠 运维支持
- **定时任务**：数据清理、统计更新、健康检查
- **配置管理**：多环境配置、动态配置
- **日志管理**：结构化日志、日志轮转
- **错误处理**：全局异常处理、友好错误提示

## 快速开始

### 环境要求

- **JDK 8+**
- **Maven 3.6+**
- **MySQL 8.0+**
- **Redis 6.0+**（可选）

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/zerocarbon/digital-twin-backend.git
cd digital-twin-backend
```

2. **配置数据库**
```sql
-- 创建数据库
CREATE DATABASE zero_carbon_digital_twin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（可选）
CREATE USER 'zerocarbon'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON zero_carbon_digital_twin.* TO 'zerocarbon'@'localhost';
FLUSH PRIVILEGES;
```

3. **修改配置文件**
```yaml
# application-dev.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/zero_carbon_digital_twin?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
    username: zerocarbon
    password: your_password
```

4. **编译运行**
```bash
# 编译项目
mvn clean compile

# 运行项目
mvn spring-boot:run

# 或者打包后运行
mvn clean package
java -jar target/zero-carbon-digital-twin-1.0.0.jar
```

5. **访问应用**
- **应用地址**：http://localhost:8080
- **API文档**：http://localhost:8080/swagger-ui/
- **监控端点**：http://localhost:8080/actuator

### 默认账户

系统启动后会自动创建默认管理员账户：

- **用户名**：admin
- **密码**：admin123
- **角色**：超级管理员

> ⚠️ **安全提示**：生产环境请立即修改默认密码！

## API文档

### 认证相关

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

#### 刷新令牌
```http
POST /api/auth/refresh
Authorization: Bearer {refresh_token}
```

#### 获取用户信息
```http
GET /api/auth/profile
Authorization: Bearer {access_token}
```

### 用户管理

#### 创建用户
```http
POST /api/security/users
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123",
  "email": "test@example.com",
  "realName": "测试用户"
}
```

#### 查询用户列表
```http
GET /api/security/users?page=0&size=10&sort=createTime,desc
Authorization: Bearer {access_token}
```

更多API详情请查看：[Swagger文档](http://localhost:8080/swagger-ui/)

## 配置说明

### 应用配置

```yaml
app:
  system:
    name: 零碳园区数字孪生系统
    version: 1.0.0
    description: 零碳园区数字孪生系统后端API
  
  security:
    jwt:
      secret: your-jwt-secret-key
      accessTokenExpiration: 3600000    # 1小时
      refreshTokenExpiration: 604800000  # 7天
    
    password:
      minLength: 8
      requireUppercase: true
      requireLowercase: true
      requireDigits: true
      requireSpecialChars: true
      expirationDays: 90
    
    account:
      maxLoginAttempts: 5
      lockoutDuration: 1800000  # 30分钟
      autoUnlock: true
    
    session:
      timeout: 7200000           # 2小时
      maxConcurrentSessions: 3
      cleanupInterval: 300000    # 5分钟
```

### 数据库配置

```yaml
spring:
  datasource:
    type: com.zaxxer.hikari.HikariDataSource
    hikari:
      minimum-idle: 5
      maximum-pool-size: 20
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      leak-detection-threshold: 60000
```

### 缓存配置

```yaml
spring:
  cache:
    type: caffeine
    caffeine:
      spec: maximumSize=1000,expireAfterWrite=30m
```

## 部署指南

### Docker部署

1. **构建镜像**
```bash
# 使用Maven插件构建
mvn clean package docker:build

# 或使用Dockerfile
docker build -t zero-carbon-digital-twin:1.0.0 .
```

2. **运行容器**
```bash
docker run -d \
  --name zero-carbon-backend \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_HOST=mysql-server \
  -e DB_USERNAME=zerocarbon \
  -e DB_PASSWORD=your_password \
  zero-carbon-digital-twin:1.0.0
```

### Docker Compose部署

```yaml
version: '3.8'
services:
  app:
    image: zero-carbon-digital-twin:1.0.0
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - DB_HOST=mysql
      - DB_USERNAME=zerocarbon
      - DB_PASSWORD=your_password
    depends_on:
      - mysql
      - redis
  
  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=zero_carbon_digital_twin
      - MYSQL_USER=zerocarbon
      - MYSQL_PASSWORD=your_password
    volumes:
      - mysql_data:/var/lib/mysql
  
  redis:
    image: redis:6.2-alpine
    volumes:
      - redis_data:/data

volumes:
  mysql_data:
  redis_data:
```

### 生产环境配置

```yaml
# application-prod.yml
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:zero_carbon_digital_twin}?useUnicode=true&characterEncoding=utf8&useSSL=true&serverTimezone=Asia/Shanghai
    username: ${DB_USERNAME:zerocarbon}
    password: ${DB_PASSWORD}
  
  jpa:
    hibernate:
      ddl-auto: validate  # 生产环境使用validate
    show-sql: false

logging:
  level:
    com.zerocarbon: INFO
    org.springframework.security: WARN
  file:
    name: /var/log/zero-carbon/application.log

app:
  security:
    jwt:
      secret: ${JWT_SECRET}
  audit:
    retentionDays: 365  # 生产环境保留1年
```

## 监控运维

### 健康检查

```bash
# 应用健康状态
curl http://localhost:8080/actuator/health

# 详细健康信息
curl http://localhost:8080/actuator/health/details
```

### 性能指标

```bash
# JVM指标
curl http://localhost:8080/actuator/metrics/jvm.memory.used

# 数据库连接池指标
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active

# 缓存指标
curl http://localhost:8080/actuator/metrics/cache.gets
```

### 日志管理

```bash
# 查看应用日志
tail -f /var/log/zero-carbon/application.log

# 查看错误日志
grep "ERROR" /var/log/zero-carbon/application.log

# 查看登录日志
grep "LOGIN" /var/log/zero-carbon/application.log
```

## 开发指南

### 项目结构

```
src/main/java/com/zerocarbon/
├── config/              # 配置类
│   ├── DatabaseConfig.java
│   ├── SecurityConfig.java
│   ├── CacheConfig.java
│   └── SwaggerConfig.java
├── controller/          # 控制器
│   ├── AuthController.java
│   └── SecurityController.java
├── service/            # 服务层
│   ├── UserService.java
│   ├── RoleService.java
│   └── PermissionService.java
├── entity/             # 实体类
├── repository/         # 数据访问层
├── security/           # 安全相关
│   ├── JwtAuthenticationFilter.java
│   └── JwtAuthenticationEntryPoint.java
├── exception/          # 异常处理
│   ├── GlobalExceptionHandler.java
│   └── BusinessException.java
└── ZeroCarbonDigitalTwinApplication.java
```

### 代码规范

1. **命名规范**
   - 类名：大驼峰命名法（PascalCase）
   - 方法名：小驼峰命名法（camelCase）
   - 常量：全大写下划线分隔（UPPER_SNAKE_CASE）

2. **注释规范**
   - 类和方法必须有JavaDoc注释
   - 复杂逻辑必须有行内注释
   - 注释内容要准确、简洁

3. **异常处理**
   - 使用统一的异常处理机制
   - 业务异常使用BusinessException
   - 记录详细的错误日志

### 测试指南

```bash
# 运行所有测试
mvn test

# 运行特定测试类
mvn test -Dtest=UserServiceTest

# 生成测试报告
mvn test jacoco:report
```

## 常见问题

### Q: 启动时数据库连接失败？
A: 请检查数据库配置和网络连接，确保MySQL服务正常运行。

### Q: JWT令牌验证失败？
A: 检查JWT密钥配置，确保客户端和服务端使用相同的密钥。

### Q: 权限验证不生效？
A: 确认用户角色和权限配置正确，检查Spring Security配置。

### Q: 缓存不生效？
A: 检查缓存配置和注解使用，确保方法是public且被Spring管理。

### Q: 定时任务不执行？
A: 确认@EnableScheduling注解已添加，检查cron表达式格式。

## 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系我们

- **项目主页**：https://github.com/zerocarbon/digital-twin-backend
- **技术支持**：admin@zerocarbon.com
- **问题反馈**：https://github.com/zerocarbon/digital-twin-backend/issues

---

**Zero Carbon Team** © 2024