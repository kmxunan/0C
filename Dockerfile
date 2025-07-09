# 使用官方Node.js镜像作为基础镜像
FROM node:16-alpine

# 设置工作目录
WORKDIR /usr/src/app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装生产依赖
RUN npm ci --only=production

# 复制项目文件
COPY . .

# 暴露端口
EXPOSE 1125

# 启动命令
CMD ["npm", "start"]