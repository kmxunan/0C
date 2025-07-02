#!/bin/bash

# 生产环境构建脚本
set -e

echo "🚀 开始构建生产环境镜像..."

# 检查Docker是否运行
docker info > /dev/null 2>&1 || { echo "⚠️ Docker未运行，请先启动Docker"; exit 1; }

# 创建必要的目录
mkdir -p ./data ./logs ./config/ssl ./config/mosquitto

# 生成SSL证书（测试用）
echo "🔐 生成SSL证书..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./config/ssl/ssl.key \
  -out ./config/ssl/ssl.crt \
  -subj "/C=CN/ST=Shanghai/L=Shanghai/O=EnergyTech/CN=zero-carbon-energy-system" > /dev/null 2>&1

# 构建Docker镜像
echo "🐋 构建Docker镜像..."
docker-compose -f docker-compose.yml build --no-cache

# 启动容器
echo "🔌 启动容器..."
docker-compose -f docker-compose.yml up -d

# 检查容器状态
echo "🔍 检查服务状态..."
sleep 5
docker ps

echo "✅ 生产环境部署完成！"
echo "🌐 访问地址: https://localhost"
echo "📄 文档参考: $(pwd)/DEPLOYMENT.md"
echo "🧪 健康检查: curl -k https://localhost/health"

echo ""
echo "==============================="
echo "部署完成时间: $(date)"
echo "==============================="