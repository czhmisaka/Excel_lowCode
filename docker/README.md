# 年假计算系统 - Docker部署指南

本文档介绍如何使用Docker部署年假计算系统的前后端应用。

## 项目结构

```
docker/
├── frontend/              # 前端相关配置
│   ├── Dockerfile        # 前端Dockerfile
│   └── nginx.conf        # Nginx配置
├── backend/              # 后端相关配置
│   └── Dockerfile        # 后端Dockerfile
├── docker-compose.yml    # Docker Compose配置（生产环境）
├── docker-compose.local.yml # Docker Compose配置（本地开发环境）
├── .env.template         # 环境变量模板
├── .env.local            # 本地开发环境配置
├── init-database.sql     # 数据库初始化脚本
├── build.sh             # 镜像构建脚本
├── deploy.sh            # 部署脚本（生产环境）
├── localRun.sh          # 本地开发环境部署脚本
├── export-images.sh     # 镜像导出脚本
├── import-images.sh     # 镜像导入脚本
└── README.md           # 本文档
```

## 前置要求

1. **Docker** - 版本 20.10+
2. **Docker Compose** - 版本 2.0+
3. **MySQL数据库** - 需要提前准备好数据库服务

## 快速开始

### 1. 配置环境变量

```bash
# 复制环境变量模板
cp .env.template .env

# 编辑环境变量文件，配置数据库连接等信息
vim .env
```

主要配置项：
```bash
# 数据库配置（必须修改）
DB_HOST=your_mysql_host
DB_PORT=3306
DB_NAME=annual_leave
DB_USER=your_username
DB_PASSWORD=your_password

# 应用配置
NODE_ENV=production
PORT=3000

# 镜像标签配置
IMAGE_PREFIX=annual-leave
FRONTEND_TAG=latest
BACKEND_TAG=latest
```

### 2. 构建镜像

```bash
# 构建所有镜像
./build.sh

# 构建并清理缓存
./build.sh --clean
```

### 3. 部署应用

#### 生产环境部署（使用外部数据库）

```bash
# 完整部署（停止旧服务 -> 启动新服务）
./deploy.sh

# 仅停止服务
./deploy.sh --stop-only

# 仅启动服务
./deploy.sh --start-only

# 部署前备份数据
./deploy.sh --backup

# 部署后恢复数据
./deploy.sh --restore backup-file.tar.gz
```

#### 本地开发环境部署（包含MySQL数据库）

```bash
# 完整本地部署（包含MySQL数据库）
./localRun.sh

# 仅停止本地服务
./localRun.sh --stop-only

# 仅启动本地服务
./localRun.sh --start-only

# 查看本地服务状态
./localRun.sh --status

# 查看容器日志
./localRun.sh --logs
```

### 4. 验证部署

部署完成后，访问以下地址验证服务状态：

- **前端应用**: http://localhost:80
- **后端API**: http://localhost:3000
- **API文档**: http://localhost:3000/api-docs
- **健康检查**: http://localhost:3000/health

## 镜像导出和导入

### 导出镜像（用于离线部署）

```bash
# 导出所有镜像（默认压缩）
./export-images.sh

# 导出不压缩的镜像
./export-images.sh --no-compress

# 仅导出前端镜像
./export-images.sh --frontend-only

# 仅导出后端镜像
./export-images.sh --backend-only
```

导出文件将保存在 `exports/` 目录，包含：
- 镜像文件（.tar 或 .tar.gz）
- 元数据文件（metadata-*.json）

### 导入镜像

```bash
# 导入最新的镜像包
./import-images.sh

# 导入指定版本的镜像包
./import-images.sh exports/metadata-20250101-120000-abc123.json
```

## 手动操作命令

### 构建镜像

```bash
# 构建前端镜像
docker build -t annual-leave-frontend:latest -f frontend/Dockerfile .

# 构建后端镜像
docker build -t annual-leave-backend:latest -f backend/Dockerfile .
```

### 启动服务

```bash
# 使用Docker Compose启动
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 导出/导入镜像（手动）

```bash
# 导出镜像
docker save -o frontend.tar annual-leave-frontend:latest
docker save -o backend.tar annual-leave-backend:latest

# 导入镜像
docker load -i frontend.tar
docker load -i backend.tar
```

## 本地开发环境 (localRun)

本地开发环境使用 `localRun.sh` 脚本，提供完整的本地Docker环境，包含MySQL数据库服务。

### 本地环境特点

1. **独立数据库**: 包含MySQL 8.0数据库容器
2. **自动初始化**: 自动创建数据库和示例数据
3. **数据持久化**: 数据库数据保存在Docker卷中
4. **健康检查**: 完整的服务健康检查机制
5. **开发友好**: 适合本地开发和测试

### 本地服务配置

#### MySQL数据库服务
- **容器名**: annual-leave-mysql
- **端口映射**: 3306:3306
- **数据库名**: annual_leave
- **用户名**: annual_user
- **密码**: annual_password
- **根密码**: root
- **数据卷**: mysql-data (持久化存储)

#### 前端服务
- **容器名**: annual-leave-frontend
- **端口映射**: 8080:80
- **健康检查**: http://localhost:8080/health
- **静态文件**: 使用Nginx服务

#### 后端服务
- **容器名**: annual-leave-backend
- **端口映射**: 3000:3000
- **健康检查**: http://localhost:3000/health
- **数据卷**: uploads目录持久化存储
- **数据库连接**: 自动连接到本地MySQL容器

### 网络配置
- 使用自定义桥接网络 `app-network`
- 前端可通过 `backend` 主机名访问后端服务
- 后端可通过 `mysql` 主机名访问数据库服务

## 服务配置说明

### 前端服务
- **容器名**: annual-leave-frontend
- **端口映射**: 80:80
- **健康检查**: http://localhost:80/health
- **静态文件**: 使用Nginx服务

### 后端服务
- **容器名**: annual-leave-backend
- **端口映射**: 3000:3000
- **健康检查**: http://localhost:3000/health
- **数据卷**: uploads目录持久化存储

### 网络配置
- 使用自定义桥接网络 `app-network`
- 前端可通过 `backend` 主机名访问后端服务

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 `.env` 文件中的数据库配置
   - 确认数据库服务正常运行
   - 检查网络连接

2. **端口冲突**
   - 修改 `docker-compose.yml` 中的端口映射
   - 停止占用端口的其他服务

3. **镜像构建失败**
   - 检查网络连接
   - 清理Docker缓存：`docker system prune`
   - 重新构建：`./build.sh --clean`

4. **服务启动失败**
   - 查看日志：`docker-compose logs`
   - 检查环境变量配置
   - 验证镜像是否存在：`docker images`

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs

# 实时查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs frontend
docker-compose logs backend

# 查看最近100行日志
docker-compose logs --tail=100
```

### 数据备份和恢复

```bash
# 备份上传文件
tar -czf backup-uploads-$(date +%Y%m%d-%H%M%S).tar.gz uploads/

# 恢复上传文件
tar -xzf backup-file.tar.gz -C ./
```

## 生产环境部署建议

1. **使用生产数据库**: 配置独立的MySQL服务器
2. **配置反向代理**: 使用Nginx作为反向代理，配置SSL证书
3. **监控和日志**: 配置日志收集和监控告警
4. **备份策略**: 定期备份数据库和上传文件
5. **安全配置**: 修改默认密码，配置防火墙规则

## 开发环境

开发环境下可以使用以下命令快速重启服务：

```bash
# 重新构建并启动
docker-compose up --build -d

# 仅重启特定服务
docker-compose restart frontend
docker-compose restart backend
```

## 技术支持

如有问题，请检查：
1. Docker和Docker Compose版本
2. 环境变量配置是否正确
3. 端口是否被占用
4. 数据库连接是否正常
