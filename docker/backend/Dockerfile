# 后端Dockerfile
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY ../backend/package*.json ./

# 安装依赖（包括SQLite支持）
RUN npm ci --only=production

# 复制源代码
COPY ../backend/ ./

# 创建上传目录和数据目录（用于SQLite）
RUN mkdir -p uploads && mkdir -p data

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
