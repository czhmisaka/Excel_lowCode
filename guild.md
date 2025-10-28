# Excel_lowCode 项目配置指南

## 📋 概述

本文档提供从零开始配置 Excel_lowCode 项目的完整流程，从环境准备到使用 `run.sh` 启动项目的详细步骤。基于代码审查，确保所有功能描述准确反映实际实现。

## 🛠️ 环境准备

### 系统要求

- **操作系统**: macOS, Linux, Windows (WSL2 推荐)
- **Node.js**: >= 16.0.0 (推荐 20.x)
- **Docker**: >= 20.10 (用于容器化部署)
- **MySQL**: >= 8.0 (可选，支持 SQLite 本地模式)

### 依赖软件安装

#### 1. Node.js 安装（可选，你可以使用 unified 参数来使用 docker容器打包）
```bash
# 使用 nvm 安装 Node.js (推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# 或者从官网下载安装包
# https://nodejs.org/
```

#### 2. Docker 安装
```bash
# macOS (使用 Homebrew)
brew install --cask docker

# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Windows
# 从 Docker Desktop 官网下载: https://www.docker.com/products/docker-desktop/
```

#### 3. MySQL 安装 (可选)
```bash
# macOS
brew install mysql

# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# 启动 MySQL 服务
sudo systemctl start mysql
sudo systemctl enable mysql
```

## 📁 项目初始化

### 1. 克隆项目
```bash
git clone <项目地址>
cd Excel_lowCode
```

### 2. 项目结构了解
```
Excel_lowCode/
├── backend/          # 后端服务 (Node.js + Express)
├── fe/              # 前端应用 (Vue 3 + TypeScript)
├── MCPServer/       # MCP 服务器
├── docker/          # Docker 配置和部署脚本
├── run.sh           # 主启动脚本
└── ReadMe.md        # 项目文档
```

## ⚙️ 环境配置

### 1. Docker 环境配置

复制环境模板文件并配置：

```bash
cd docker
cp .env.template .env
```

编辑 `.env` 文件，配置以下关键参数：

```env
# 应用配置
NODE_ENV=production
PORT=3000

# 数据库配置 (MySQL 模式)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=excel_lowcode
DB_USER=your_username
DB_PASSWORD=your_password

# 文件上传配置
UPLOAD_MAX_SIZE=10mb
UPLOAD_ALLOWED_TYPES=xlsx,xls

# 安全配置
JWT_SECRET=your_secure_jwt_secret_here
BCRYPT_SALT_ROUNDS=12

# 前端配置
FRONTEND_PORT=8080
API_BASE_URL=/backend/

# MCP服务器配置
MCP_SERVER_PORT=3001

# 导出配置
EXPORT_DIR=./exports
COMPRESS_IMAGES=true
```

### 2. 本地开发环境配置 (可选)

如果需要本地开发环境配置：

```bash
cd docker
cp .env.template .env.local
```

编辑 `.env.local` 文件，配置开发环境参数。

### 3. 数据库初始化

#### MySQL 模式
```sql
-- 创建数据库
CREATE DATABASE excel_lowcode;

-- 创建用户并授权 (可选)
CREATE USER 'excel_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON excel_lowcode.* TO 'excel_user'@'%';
FLUSH PRIVILEGES;

-- 导入初始化脚本
USE excel_lowcode;
SOURCE docker/init-database.sql;
```

#### SQLite 模式 (推荐用于本地开发)
无需额外配置，系统会自动创建 SQLite 数据库文件。

## 🚀 启动项目

### 使用 run.sh 脚本启动

`run.sh` 是项目的主启动脚本，支持多种运行模式：

#### 1. 完整构建和部署 (默认)
```bash
# 在项目根目录执行
./run.sh
```

#### 2. 本地 SQLite 模式 (推荐开发使用)
```bash
./run.sh --run-local
```

#### 3. 单容器模式 (推荐懒人使用，比如我)
```bash
./run.sh --unified
```

#### 4. 自定义端口运行
```bash
# 自定义所有服务端口
./run.sh --backend-port 4000 --frontend-port 9000 --mcp-port 9100

# 或者只自定义部分端口
./run.sh --frontend-port 9000
```

#### 5. 构建后清理缓存
```bash
./run.sh --clean
```

#### 6. 数据备份和恢复
```bash
# 部署前备份
./run.sh --backup

# 部署后恢复指定备份
./run.sh --restore /path/to/backup/file
```

### run.sh 完整参数说明

| 参数                   | 说明                   | 示例                               |
| ---------------------- | ---------------------- | ---------------------------------- |
| `--run-local`          | 使用 SQLite 本地数据库 | `./run.sh --run-local`             |
| `--unified`            | 单容器模式部署         | `./run.sh --unified`               |
| `--backend-port PORT`  | 设置后端端口           | `./run.sh --backend-port 4000`     |
| `--frontend-port PORT` | 设置前端端口           | `./run.sh --frontend-port 9000`    |
| `--mcp-port PORT`      | 设置 MCP Server 端口   | `./run.sh --mcp-port 9100`         |
| `--clean`              | 构建后清理 Docker 缓存 | `./run.sh --clean`                 |
| `--backup`             | 部署前备份数据         | `./run.sh --backup`                |
| `--restore FILE`       | 恢复指定备份文件       | `./run.sh --restore backup.tar.gz` |
| `--stop-only`          | 仅停止服务             | `./run.sh --stop-only`             |
| `--start-only`         | 仅启动服务             | `./run.sh --start-only`            |
| `--help`               | 显示帮助信息           | `./run.sh --help`                  |

## 🔍 服务验证

### 1. 检查服务状态
```bash
# 查看所有容器状态
docker-compose ps

# 查看服务日志
docker-compose logs -f
```

### 2. 访问服务
启动成功后，可以访问以下服务：

- **前端界面**: http://localhost:8080
- **后端 API**: http://localhost:3000
- **API 文档**: http://localhost:3000/api-docs
- **MCP Server**: http://localhost:3001 (如果启用)

### 3. 健康检查
```bash
# 后端健康检查
curl http://localhost:3000/health

# MCP Server 健康检查
curl http://localhost:3001/health
```

## 🐳 Docker 部署说明

### 服务架构

项目支持多种部署模式：

#### 1. 多容器模式 (默认)
- `excel-lowcode-frontend`: 前端服务 (Nginx)
- `excel-lowcode-backend`: 后端服务 (Node.js)
- `excel-lowcode-mysql`: MySQL 数据库 (开发环境)

#### 2. 单容器模式 (推荐生产)
- `excel-lowcode-unified`: 集成所有服务的单容器

#### 3. 本地 SQLite 模式 (推荐开发)
- 使用 SQLite 数据库，无需外部数据库服务

### 网络配置

- 使用自定义桥接网络 `app-network`
- 前端通过 `backend` 主机名访问后端服务
- 后端通过 `mysql` 主机名访问数据库服务

## 🔧 故障排除

### 常见问题及解决方案

#### 1. 端口冲突
```bash
# 查看端口占用
lsof -i :3000

# 使用自定义端口
./run.sh --backend-port 4000 --frontend-port 9000
```

#### 2. 数据库连接失败
- 检查 MySQL 服务是否运行
- 验证数据库连接配置
- 检查网络连接

#### 3. 文件上传失败
- 检查文件大小限制配置
- 验证文件格式支持
- 检查存储目录权限

#### 4. 镜像构建失败
```bash
# 清理 Docker 缓存
docker system prune -a

# 重新构建
./run.sh --clean
```

#### 5. 权限问题
```bash
# 确保脚本有执行权限
chmod +x run.sh
chmod +x docker/*.sh
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs

# 实时查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 查看容器内部日志
docker logs <container_name>
```

## 📊 配置检查清单

在启动项目前，请确认以下配置：

- [ ] Node.js 版本 >= 16.0.0
- [ ] Docker 已安装并运行
- [ ] 环境变量文件已配置 (.env)
- [ ] 数据库服务可用 (如果使用 MySQL)
- [ ] 端口 3000, 8080, 3001 未被占用
- [ ] 脚本文件具有执行权限

## 🔄 更新和维护

### 项目更新
```bash
# 拉取最新代码
git pull origin main

# 重新构建和部署
./run.sh --clean
```

### 数据备份
```bash
# 手动备份数据
./run.sh --backup

# 备份文件保存在 ./exports/ 目录
```

### 服务管理
```bash
# 停止所有服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps
```

## 📞 技术支持

如果遇到问题，请按以下步骤排查：

1. 检查环境变量配置是否正确
2. 查看服务日志获取详细错误信息
3. 验证端口占用情况
4. 检查数据库连接状态
5. 确认 Docker 服务正常运行

如需进一步帮助，请参考项目文档或联系技术支持。

---

**注意**: 本文档会随着项目发展持续更新，请定期查看最新版本。

*最后更新: 2025-10-19*
