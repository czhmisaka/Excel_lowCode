# 统一Dockerfile - 单容器解决方案
# 多阶段构建，包含前端构建、后端依赖安装和运行时环境

# 第一阶段：前端构建
FROM node:20-alpine AS frontend-builder

# 设置工作目录
WORKDIR /app/frontend

# 复制前端package.json
COPY fe/package*.json ./

# 设置npm配置并安装前端依赖（优化网络和缓存）
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set progress false && \
    npm ci --no-optional --prefer-offline

# 确保npm-run-all2包正确安装并具有执行权限
RUN npm list npm-run-all2 || npm install npm-run-all2 && \
    # 修复整个node_modules/.bin目录的权限，确保所有二进制文件可执行
    chmod -R +x node_modules/.bin && \
    # 特别确保run-p和npm-run-all2有执行权限
    find node_modules/.bin -name "run-p" -exec chmod +x {} \; && \
    find node_modules/.bin -name "npm-run-all2" -exec chmod +x {} \; && \
    # 验证权限设置
    ls -la node_modules/.bin/run-p && \
    ls -la node_modules/.bin/npm-run-all2


# 复制前端源代码
COPY fe/ ./

# 复制生产环境配置文件
COPY ./fe/.env.production ./

# 设置构建时的环境变量（后端API地址）
ARG VITE_API_BASE_URL=/backend
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# 构建前端应用（添加重试机制和权限修复）
RUN npm run build || (rm -rf node_modules package-lock.json && npm install && npm run build)

# 第二阶段：后端构建
FROM node:16-alpine AS backend-builder

# 安装构建工具和Python（用于编译SQLite）
RUN apk add --no-cache python3 make g++

# 设置工作目录
WORKDIR /app/backend

# 复制后端package.json
COPY backend/package*.json ./

# 设置国内npm镜像源并安装后端依赖（添加重试机制和网络超时设置）
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm ci --no-optional

# 复制后端源代码
COPY backend/ ./

# 创建上传目录和数据目录（用于SQLite）
RUN mkdir -p uploads && mkdir -p data

# 强制重新构建原生模块（确保在当前架构上编译）
RUN npm rebuild sqlite3 --build-from-source

# 第三阶段：MCP服务器构建
FROM node:16-alpine AS mcp-builder

# 安装构建工具
RUN apk add --no-cache python3 make g++

# 设置工作目录
WORKDIR /app/mcp-server

# 复制MCP服务器package.json
COPY MCPServer/package*.json ./

# 设置国内npm镜像源并安装MCP服务器依赖
RUN npm config set registry https://registry.npmmirror.com && \
    npm ci

# 修复node_modules/.bin目录权限，确保tsc等二进制文件可执行
RUN chmod -R +x node_modules/.bin && \
    # 特别确保tsc有执行权限
    find node_modules/.bin -name "tsc" -exec chmod +x {} \; && \
    # 验证权限设置
    ls -la node_modules/.bin/tsc

# 复制MCP服务器源代码
COPY MCPServer/ ./

# 构建TypeScript代码
RUN npm run build

# 创建导出目录
RUN mkdir -p exports

# 第三阶段：运行时环境
FROM node:16-alpine

# 安装运行时依赖
RUN apk add --no-cache nginx supervisor sqlite-libs

# 创建工作目录
WORKDIR /app

# 从前端构建阶段复制构建好的静态文件
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# 修复文件权限 - 确保Nginx可以访问前端文件
RUN chown -R nginx:nginx /usr/share/nginx/html/ && \
    chmod -R 755 /usr/share/nginx/html/

# 从后端构建阶段复制后端代码和依赖
COPY --from=backend-builder /app/backend ./

# 从MCP服务器构建阶段复制MCP服务器代码和依赖
COPY --from=mcp-builder /app/mcp-server ./mcp-server

# 创建必要的目录
RUN mkdir -p uploads && mkdir -p data && mkdir -p /var/log/supervisor && mkdir -p exports

# 复制Nginx配置
COPY docker/unified/nginx.conf /etc/nginx/nginx.conf

# 复制Supervisor配置模板
COPY docker/unified/supervisord.conf /etc/supervisor/conf.d/supervisord.conf.template

# 复制启动脚本
COPY docker/unified/startup-simple.sh /app/startup.sh

# 设置启动脚本执行权限
RUN chmod +x /app/startup.sh

# 安装curl用于健康检查和API调用
RUN apk add --no-cache curl

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV MCP_SERVER_PORT=3001
ENV API_BASE_URL=http://localhost:3000

# 暴露端口
EXPOSE 80 3000 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 启动应用（使用自定义启动脚本）
CMD ["/app/startup.sh"]
