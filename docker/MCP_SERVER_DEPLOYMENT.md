# MCP Server Docker 部署说明

## 概述

MCP (Model Context Protocol) Server 已成功打包为 Docker 容器，并与现有的后端和前端服务集成。

## 服务配置

### 端口绑定
- **前端服务**: 端口 `FRONTEND_PORT` (默认8080) → 容器80端口
- **后端服务**: 端口 3000 → 容器3000端口  
- **MCP Server**: 端口 `MCP_SERVER_PORT` (默认3001) → 容器3001端口

### 环境变量配置
在 `docker/.env` 文件中添加了以下配置：
```
# MCP服务器配置
MCP_SERVER_PORT=3001
MCP_SERVER_TAG=latest
```

### 服务间通信
MCP server 通过 Docker 网络连接到后端服务：
- API_BASE_URL: `http://backend:3000`

## 部署文件

### 1. MCP Server Dockerfile
位置: `docker/mcp-server/Dockerfile`
- 基于 Node.js 18-alpine 镜像
- 安装所有依赖（包括开发依赖用于构建）
- 构建 TypeScript 代码
- 清理开发依赖以减小镜像大小
- 配置健康检查
- 暴露端口 3001

### 2. Docker Compose 配置
在 `docker/docker-compose.yml` 中添加了 mcp-server 服务：
- 镜像: `${IMAGE_PREFIX}-mcp-server:${MCP_SERVER_TAG}`
- 端口映射: `${MCP_SERVER_PORT}:3001`
- 环境变量: 配置 API_BASE_URL 和运行模式
- 卷挂载: mcp-exports 用于导出文件
- 健康检查: 监控 /health 端点
- 依赖关系: 依赖于 backend 服务

### 3. 生产环境配置
创建了 `MCPServer/.env.production` 文件：
- API_BASE_URL: `http://backend:3000`
- MCP_SERVER_PORT: 3001
- NODE_ENV: production
- MODE: http-streams

## 验证测试

### 健康检查
```bash
curl http://localhost:3001/health
```
响应:
```json
{
  "status": "ok",
  "server": "excel-data-mcp-server",
  "mode": "http-streams",
  "port": 3001,
  "timestamp": "2025-10-15T05:10:58.531Z"
}
```

### 服务器信息
```bash
curl http://localhost:3001/info
```
响应:
```json
{
  "name": "Excel Data MCP Server",
  "version": "1.0.0",
  "protocol": "MCP",
  "mode": "http-streams",
  "endpoints": {
    "health": "/health",
    "info": "/info",
    "mcp": "/mcp"
  }
}
```

## 可用端点

1. **健康检查**: `GET /health`
2. **服务器信息**: `GET /info`  
3. **MCP 端点**: `POST /mcp`
4. **导出文件**: `GET /export/*`

## 部署命令

### 使用 run.sh 脚本（推荐）
```bash
# 使用默认端口
./run.sh

# 设置 MCP server 端口为 9100
./run.sh --mcp-port 9100

# 自定义所有端口
./run.sh --backend-port 4000 --frontend-port 9000 --mcp-port 9100
```

### 手动部署
#### 构建镜像
```bash
cd docker
docker compose build mcp-server
```

#### 启动所有服务
```bash
# 使用默认端口
cd docker
docker compose up -d

# 使用自定义 MCP server 端口
cd docker
MCP_SERVER_PORT=9100 docker compose up -d
```

#### 查看服务状态
```bash
cd docker
docker compose ps
```

#### 查看日志
```bash
cd docker
docker compose logs mcp-server
```

## 注意事项

1. MCP server 依赖于后端服务，确保后端服务正常运行
2. 导出文件存储在 Docker 卷 `mcp-exports` 中
3. 服务使用 http-streams 模式运行，支持 MCP 协议
4. 健康检查每30秒执行一次，确保服务可用性

## 故障排除

如果 MCP server 无法启动：
1. 检查后端服务是否正常运行
2. 查看 MCP server 日志：`docker compose logs mcp-server`
3. 验证环境变量配置是否正确
4. 确认端口 3001 未被占用
