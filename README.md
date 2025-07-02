# 零碳园区数字孪生能碳管理系统

[![Build Status](https://img.shields.io/badge/build-passing-green)](https://github.com/yourusername/zero-carbon-park)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://opensource.org/licenses/MIT)

## 项目简介
零碳园区数字孪生能碳管理系统旨在通过数字化手段实现园区能源与碳排放的精细化管理，利用数字孪生技术模拟和预测园区运行状态，为园区管理者、能源运营方和政府监管机构提供数据驱动的优化建议。

## 核心功能
1. **能源监控** - 实时采集并展示园区能源消耗数据
2. **碳排放计算** - 基于能源数据进行碳排放量建模与统计
3. **数字孪生可视化** - 提供三维可视化界面展示园区运行状态
4. **性能监测** - 跟踪系统关键性能指标（KPI）
5. **能源预测** - 利用机器学习模型预测未来能源需求
6. **电池优化** - 对储能系统进行智能调度与优化

## 技术架构
### 架构模式
- 微服务架构 + 前后端分离 + MQTT消息中间件
- 分层架构（表现层、业务逻辑层、数据访问层）
- 消息队列模式（MQTT用于异步通信）

### 技术栈
- **前端**: React v18+, Three.js (三维可视化)
- **后端**: Node.js v16.x, Express
- **数据库**: SQLite (轻量级存储), MongoDB (时序数据)
- **消息中间件**: MQTT (Mosquitto)
- **AI框架**: TensorFlow.js (本地化AI推理)
- **安全**: JWT认证, RBAC权限控制
- **部署**: Docker容器化部署

## 系统要求
### 开发环境
- Node.js v16.x
- npm 或 yarn
- Docker
- Mosquitto (MQTT Broker)
- Git

### 生产环境
- Docker Engine 19.03+
- Docker Compose 1.29+
- Mosquitto 2.0+
- 至少2GB内存和2核CPU

## 安装部署
### 本地开发环境搭建
```bash
# 克隆仓库
git clone https://github.com/kmxunan/0C.git

# 进入项目目录
cd 0C

# 安装依赖
npm install

# 启动MQTT Broker
mosquitto -v -c config/mosquitto/mosquitto.conf

# 启动开发服务器
npm run dev
```

### 生产环境部署
```bash
# 使用Docker Compose一键部署
docker-compose up -d

# 或者使用部署脚本
./deploy.sh
```

## 环境配置
- 复制.env.example为.env并修改配置
- 生产环境请使用.env.prod文件
- 配置MQTT Broker安全设置
- 设置HTTPS证书路径（生产环境）

## API文档
详见[API接口文档](docs/api.md)

## 系统监控
- 提供GET /health健康检查端点
- 提供GET /performance/metrics性能监控端点
- 支持实时数据延迟低于1秒
- 包含API响应时间、内存使用、CPU负载等核心指标

## 安全特性
- 基于JWT的用户认证
- RBAC权限控制系统
- HTTPS加密传输
- 请求频率限制（默认15分钟100次）
- 输入验证机制

## 性能指标
- 实时数据延迟：≤5秒
- 关键API响应时间：≤500ms
- 支持并发用户数≥100

## 目录结构
```
├── src                 # 后端源代码
│   ├── auth            # 认证与权限模块
│   ├── carbon          # 碳排放计算模块
│   ├── components      # 数字孪生可视化组件
│   ├── database.js     # 数据库连接配置
│   └── index.js        # 主应用入口
├── frontend            # 前端React应用
├── docker-compose.yml  # Docker编排文件
├── Dockerfile          # Docker镜像构建文件
├── .env.example        # 环境变量示例文件
└── deploy.sh           # 自动化部署脚本
```

## 贡献指南
1. Fork项目
2. 创建新分支 `git checkout -b feature/new-feature`
3. 提交代码 `git commit -am 'Add new feature'`
4. 推送分支 `git push origin feature/new-feature`
5. 提交Pull Request

## 许可证
本项目采用MIT许可证。详情请参阅[LICENSE](LICENSE)文件。

## 联系方式
- 项目维护者: Your Name <your.email@example.com>
- 如有疑问或建议，请提交GitHub Issue# 0C
# 0C
