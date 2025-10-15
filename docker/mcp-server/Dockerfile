# MCP Server Dockerfile
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY MCPServer/package*.json ./

# 安装所有依赖（包括开发依赖用于构建）
RUN npm ci

# 复制源代码
COPY MCPServer/src ./src
COPY MCPServer/tsconfig.json ./
COPY MCPServer/.env.production ./.env

# 构建 TypeScript 代码
RUN npm run build

# 清理开发依赖（可选，为了减小镜像大小）
RUN npm prune --production

# 创建导出目录
RUN mkdir -p exports

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# 启动命令
CMD ["npm", "start"]
