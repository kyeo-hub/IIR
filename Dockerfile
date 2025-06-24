# 使用官方Node.js镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装应用程序依赖项
# 首先复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖项
RUN npm ci --omit=dev

# 复制应用程序代码
COPY . .

# 创建日志目录并设置权限
RUN mkdir -p /app/logs && \
    chmod -R 755 /app/logs

# 暴露应用程序端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production

# 启动应用程序
CMD ["node", "src/index.js"]