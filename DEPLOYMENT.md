# 零碳园区数字孪生能碳管理系统部署指南

## 环境要求
- Docker 24.0+
- Docker Compose v2.23+
- Node.js v16+（构建时需要）
- OpenSSL 1.1.1+
- Linux/Unix系统（推荐Ubuntu 22.04+）
- MQTT Broker（Mosquitto 2.0+）

## 生产环境部署步骤

### 1. 准备工作
```bash
# 克隆代码仓库
git clone https://your-repo-url/zero-carbon-energy-system.git
cd zero-carbon-energy-system

# 安装依赖（仅首次需要）
npm install
```

### 2. 配置生产环境
```bash
# 创建.env文件
cp .env.prod.example .env

# 编辑环境变量
nano .env
```

### 3. 构建和部署
```bash
# 赋予构建脚本执行权限
chmod +x deploy.sh

# 执行构建脚本
./deploy.sh
```

### 4. 验证部署
```bash
# 检查容器状态
docker ps

# 检查服务健康状态
curl -k https://localhost/health
```

### 5. 配置反向代理（可选）
对于生产环境，建议配置Nginx/Apache反向代理：

**Apache配置示例：**
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    
    # 强制HTTPS重定向
    Redirect permanent / https://your-domain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    
    # SSL配置
    SSLEngine on
    SSLCertificateFile "/path/to/cert.pem"
    SSLCertificateKeyFile "/path/to/privkey.pem"
    
    # 反向代理配置
    ProxyPreserveHost On
    ProxyPass / http://localhost:80/
    ProxyPassReverse / http://localhost:80/
    
    # WebSocket支持
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*) ws://localhost:80/$1 [P,L]
    
    # 安全头配置
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=63072000; includeSubdomains; preload"
</VirtualHost>
```

## 系统监控
- 使用`/monitor/performance`接口进行实时性能监控
- 使用`/health`接口检查系统健康状态
- 查看日志文件：`/Users/xunan/Documents/WebStormProjects/0C/logs/access.log`

## API测试示例
```bash
# 获取能源数据
curl -X GET "https://localhost/api/energy/data?start_time=2025-06-01T00:00:00Z&end_time=2025-06-02T00:00:00Z" -H "Authorization: Bearer <your_token>"

# 获取储能优化结果
curl -X GET "https://localhost/api/battery/optimization?start_time=2025-06-01T00:00:00Z&end_time=2025-06-02T00:00:00Z" -H "Authorization: Bearer <your_token>"

# 获取碳排放计算结果
curl -X GET "https://localhost/api/carbon/emissions?start_time=2025-06-01T00:00:00Z&end_time=2025-06-02T00:00:00Z" -H "Authorization: Bearer <your_token>"
```

## 安全加固建议
1. 定期更新TLS证书
2. 配置防火墙规则，限制非必要端口访问
3. 设置定期备份策略（建议每日凌晨2点执行）
4. 实施入侵检测和防护措施
5. 配置安全审计日志

## 压力测试指南

### 测试目标
验证系统在高负载下的性能表现，确保满足以下实时性要求：
- 数据采集延迟不超过5秒
- API响应时间低于500ms
- 系统在持续高负载下保持稳定运行

### 测试准备
```bash
# 安装压力测试工具
brew install httpd  # 包含Apache Bench工具

# 赋予执行权限
chmod +x load_test.sh
```

### 执行压力测试
```bash
# 启动生产环境服务（如果尚未启动）
docker-compose up -d

# 运行默认压力测试（测试能源数据API）
./load_test.sh

# 或者指定要测试的API端点
./load_test.sh "https://localhost/api/carbon/emissions?start_time=2025-06-01T00:00:00Z&end_time=2025-06-02T00:00:00Z"
```

### 监控系统性能
```bash
# 查看实时日志
tail -f ./test-results/load_test.log

# 查看性能监控数据
cat ./test-results/performance_monitor.csv
```

### 测试结果分析
测试完成后会自动生成摘要报告，包含以下关键指标：
- 总请求数
- 并发用户数
- 每秒请求数
- 平均响应时间
- 失败请求数
- 最大CPU使用率
- 最大内存使用率

### 优化建议
根据测试结果采取以下优化措施：
1. 如果API响应时间超过500ms：
   - 优化数据库查询语句
   - 添加缓存机制
   - 调整Node.js线程池大小

2. 如果CPU使用率过高：
   - 优化计算密集型算法
   - 使用Web Worker处理复杂计算
   - 调整MQTT消息处理逻辑

3. 如果内存使用增长异常：
   - 检查内存泄漏
   - 优化大数据处理流程
   - 调整Node.js垃圾回收参数

4. 如果出现失败请求：
   - 检查错误日志
   - 调整超时设置
   - 优化错误处理机制

## 常见问题排查
- **API响应缓慢**：检查`/monitor/performance`接口的内存使用情况
- **权限验证失败**：确认用户角色配置并检查`/auth/permission.js`模块
- **三维可视化加载缓慢**：优化Three.js模型复杂度
- **MQTT连接问题**：确保Mosquitto服务已启动且配置正确
- **HTTPS证书错误**：重新生成证书并检查Apache配置