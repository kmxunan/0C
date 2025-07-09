# 开发环境配置

## 1. 环境要求

### 1.1 基础环境
- Node.js v16.x
- npm 或 yarn
- Docker
- Mosquitto (MQTT Broker)

### 1.2 可选工具
- Kubernetes (用于负载均衡和自动扩容)
- Nginx (反向代理)
- Puppeteer (E2E测试)

## 2. 环境搭建步骤

### 2.1 初始化项目
```bash
# 克隆仓库
git clone https://github.com/kmxunan/0C.git
cd 0C

# 安装依赖
npm install
cd frontend && npm install && cd ..
```

### 2.2 启动MQTT Broker
```bash
mosquitto -v -c config/mosquitto/mosquitto.conf
```

### 2.3 启动开发服务器
```bash
# 启动前后端开发服务器
npm run dev:backend
npm run dev:frontend
```

## 3. 构建与部署

### 3.1 构建命令
```bash
# 构建Docker镜像
docker build -t zero-carbon-park .
```

### 3.2 本地开发
```bash
# 启动前后端开发服务器
npm run dev:backend
npm run dev:frontend
```

### 3.3 部署命令
```bash
# 使用Docker Compose一键部署
docker-compose up -d

# 或者使用部署脚本
./deploy.sh
```

## 4. 开发规范

### 4.1 代码规范
- 遵循ESLint + Prettier代码规范
- 所有新功能必须包含单元测试
- API变更需要更新文档

### 4.2 模块开发规范
- 新功能模块应与现有API服务集成并保持相同的安全认证机制
- 功能实现后应及时重启服务进行验证以确保实时性要求（延迟<5秒）
- 实现储能优化功能时，应优先创建独立模块并使用TensorFlow.js等机器学习框架
- 储能优化模块需要提供RESTful API接口供其他系统调用