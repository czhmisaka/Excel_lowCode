# 后端Dockerfile - 多阶段构建（修复SQLite架构问题）
FROM node:16-alpine AS builder

# 安装构建工具和Python（用于编译SQLite）
RUN apk add --no-cache python3 make g++

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY ../backend/package*.json ./

# 安装所有依赖（包括dev依赖用于编译）
RUN npm ci

# 复制源代码
COPY ../backend/ ./

# 创建上传目录和数据目录（用于SQLite）
RUN mkdir -p uploads && mkdir -p data

# 生产阶段
FROM node:16-alpine

# 安装运行时依赖和构建工具（用于重新编译SQLite）
RUN apk add --no-cache sqlite-libs python3 make g++

# 设置工作目录
WORKDIR /app

# 从构建阶段复制node_modules
COPY --from=builder /app/node_modules ./node_modules

# 从构建阶段复制源代码
COPY --from=builder /app/ ./

# 强制重新构建原生模块（确保在当前架构上编译）
RUN npm rebuild sqlite3 --build-from-source

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 启动应用
CMD ["npm", "start"]
