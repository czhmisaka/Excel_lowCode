# 前端Dockerfile - 多阶段构建
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY fe/package*.json ./

# 安装依赖（包含开发依赖，用于构建）
RUN npm ci

# 复制源代码
COPY fe/ ./

# 构建应用
RUN npm run build

# 生产阶段 - 使用Nginx
FROM nginx:alpine

# 复制构建好的文件到Nginx目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义Nginx配置
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
