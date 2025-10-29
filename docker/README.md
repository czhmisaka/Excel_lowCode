# Excel_lowCode Docker 容器管理工具

本目录包含用于管理 Excel_lowCode 项目的 Docker 容器导入导出工具，专门用于处理 unified 容器的镜像和数据卷管理。

## 文件说明

- `docker.sh` - 主要的导入导出脚本
- `docker-compose.unified.yml` - Unified 容器配置
- `docker-compose.sqlite.yml` - SQLite 版本配置
- `docker-compose.local.yml` - 本地开发版本配置
- `docker-compose.yml` - 默认配置
- `.env.template` - 环境变量模板

## 快速开始

### 1. 导出 Unified 容器

```bash
# 导出容器镜像和数据卷，并自动打包为ZIP
./docker.sh export

# 仅导出镜像，不备份数据卷
./docker.sh export --no-volumes

# 导出镜像不压缩
./docker.sh export --no-compress

# 仅导出文件，不打包为ZIP
./docker.sh export --no-package
```

### 2. 导入 Unified 容器

```bash
# 导入最新的容器包
./docker.sh import

# 导入指定版本的容器包
./docker.sh import exports/metadata-unified-20250101-120000-abc123.json
```

## 详细功能说明

### 导出功能

导出功能会创建以下文件：
- Docker 镜像文件（压缩格式）
- 元数据文件（JSON格式）
- 数据卷备份（uploads、data、exports）
- 完整的部署ZIP包（默认）

#### 导出选项

| 选项            | 说明                 |
| --------------- | -------------------- |
| `--no-compress` | 不压缩导出的镜像文件 |
| `--no-volumes`  | 不备份数据卷         |
| `--no-package`  | 不打包为ZIP文件      |

#### 导出文件结构

```
exports/
├── annual-leave-unified_latest-unified-{版本标签}.tar.gz  # Docker镜像
├── metadata-unified-{版本标签}.json                       # 元数据文件
├── uploads-{版本标签}.tar.gz                             # 上传文件备份
├── data-{版本标签}.tar.gz                                # 数据备份
├── exports-{版本标签}.tar.gz                             # 导出文件备份
└── excel-lowcode-unified-{版本标签}.zip                  # 完整部署包
```

### 导入功能

导入功能会：
1. 加载 Docker 镜像
2. 启动容器
3. 恢复数据卷（如果存在备份）
4. 重启容器应用更改

#### 导入流程

```bash
# 1. 导入镜像
./docker.sh import

# 2. 配置环境变量
cp .env.template .env
# 编辑 .env 文件配置数据库连接等信息

# 3. 启动服务
docker-compose -f docker-compose.unified.yml up -d

# 4. 检查服务状态
docker ps
```

## 部署包使用

### 部署包内容

当使用默认导出时，会生成一个完整的部署ZIP包，包含：

```
excel-lowcode-unified-{版本标签}.zip
├── annual-leave-unified_latest-{版本标签}.tar.gz  # Docker镜像
├── metadata-unified-{版本标签}.json               # 元数据
├── docker-compose.unified.yml                     # Unified配置
├── docker-compose.sqlite.yml                      # SQLite配置
├── docker-compose.local.yml                       # 本地开发配置
├── docker-compose.yml                             # 默认配置
├── .env.template                                  # 环境变量模板
├── start.sh                                       # 启动脚本
├── import.sh                                      # 导入脚本
└── README.md                                      # 说明文档
```

### 快速部署

1. **解压部署包**
   ```bash
   unzip excel-lowcode-unified-{版本标签}.zip
   ```

2. **自动部署（推荐）**
   ```bash
   # 导入镜像
   ./import.sh
   
   # 启动服务
   ./start.sh
   ```

3. **手动部署**
   ```bash
   # 1. 配置环境变量
   cp .env.template .env
   # 编辑 .env 文件配置数据库等信息
   
   # 2. 导入镜像
   docker load -i annual-leave-unified_latest-{版本标签}.tar.gz
   
   # 3. 启动服务
   docker-compose -f docker-compose.unified.yml up -d
   ```

### 部署配置选择

启动脚本 `start.sh` 支持多种部署配置：

- **Unified 容器** (推荐) - 单容器包含所有服务
- **SQLite 版本** - 使用 SQLite 数据库
- **本地开发版本** - 开发环境配置

## 数据卷管理

### 备份的数据卷

- `uploads` - 文件上传目录
- `data` - 应用数据目录
- `exports` - 导出文件目录

### 数据卷恢复

导入时会自动恢复所有存在备份的数据卷，确保数据完整性。

## 环境配置

### 必需的环境变量

复制 `.env.template` 为 `.env` 并配置：

```bash
# 数据库配置
DB_HOST=your_database_host
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password

# 端口配置
FRONTEND_PORT=8080
BACKEND_PORT=3000
MCP_SERVER_PORT=3001

# 镜像配置
IMAGE_PREFIX=annual-leave
UNIFIED_TAG=latest
```

### 支持的数据库类型

- **MySQL** (默认) - 生产环境推荐
- **SQLite** - 开发和测试环境

## 管理命令

### 服务管理

```bash
# 查看服务状态
docker ps

# 查看日志
docker-compose -f docker-compose.unified.yml logs -f

# 停止服务
docker-compose -f docker-compose.unified.yml down

# 重启服务
docker-compose -f docker-compose.unified.yml restart
```

### 容器管理

```bash
# 查看所有容器
docker ps -a

# 查看镜像
docker images

# 进入容器
docker exec -it annual-leave-unified bash

# 查看容器日志
docker logs annual-leave-unified
```

## 故障排除

### 常见问题

1. **Docker 未安装**
   ```bash
   # 安装 Docker
   # 参考: https://docs.docker.com/get-docker/
   ```

2. **端口冲突**
   - 修改 `.env` 文件中的端口配置
   - 或停止占用端口的其他服务

3. **数据库连接失败**
   - 检查数据库服务是否运行
   - 验证 `.env` 中的数据库配置
   - 检查网络连接

4. **权限问题**
   ```bash
   # 给脚本添加执行权限
   chmod +x docker.sh start.sh import.sh
   ```

### 日志查看

```bash
# 查看所有服务日志
docker-compose -f docker-compose.unified.yml logs

# 实时查看日志
docker-compose -f docker-compose.unified.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.unified.yml logs app
```

## 版本管理

### 版本标签格式

导出文件使用以下版本标签格式：
```
unified-{时间戳}-{Git哈希}
```

例如：`unified-20251029-110041-db48ee1`

### 元数据文件

每个导出都会生成元数据文件，包含：
- 导出时间戳
- 版本信息
- 文件校验和
- 环境信息

## 最佳实践

### 备份策略

1. **定期备份**
   ```bash
   # 每周备份
   0 2 * * 0 cd /path/to/project/docker && ./docker.sh export --no-package
   ```

2. **版本控制**
   - 保留重要版本的导出文件
   - 使用版本标签追踪变更

3. **测试恢复**
   - 定期测试导入功能
   - 验证数据完整性

### 部署建议

1. **生产环境**
   - 使用 MySQL 数据库
   - 配置适当的环境变量
   - 启用数据卷备份

2. **开发环境**
   - 使用 SQLite 数据库
   - 启用调试模式
   - 使用本地开发配置

## 技术支持

如果遇到问题，请检查：
1. Docker 和 Docker Compose 版本
2. 系统资源（磁盘空间、内存）
3. 网络连接
4. 日志文件中的错误信息

如需进一步帮助，请参考项目文档或联系技术支持。
