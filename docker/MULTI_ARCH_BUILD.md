# 多架构 Docker 镜像构建说明

## 概述

本项目现在支持使用 Docker Buildx 构建多架构 Docker 镜像，支持 `linux/amd64` (x86) 和 `linux/arm64` (ARM) 架构。这使得项目可以在任何 Linux 服务器上运行，包括传统的 x86 服务器和现代的 ARM 服务器。

## 支持的架构

- **linux/amd64**: 传统的 x86-64 架构服务器
- **linux/arm64**: ARM64 架构服务器（如 Apple Silicon Mac、AWS Graviton、树莓派等）

## 使用方法

### 1. 使用多架构构建脚本（推荐）

```bash
# 构建统一镜像（多架构）
docker/build-multi-arch.sh unified

# 构建所有镜像（多架构）
docker/build-multi-arch.sh all

# 构建并推送镜像到仓库
docker/build-multi-arch.sh unified --push

# 构建并清理缓存
docker/build-multi-arch.sh all --clean
```

### 2. 通过现有构建脚本

```bash
# 使用 --multi-arch 参数
docker/build.sh --multi-arch

# 结合其他参数
docker/build.sh --multi-arch --clean
```

### 3. 通过完整运行脚本

```bash
# 使用多架构构建
./run.sh --multi-arch --unified

# 多架构构建并清理
./run.sh --multi-arch --unified --clean
```

## 技术实现

### Dockerfile 优化

统一 Dockerfile 已针对多架构构建进行优化：

1. **原生模块重新编译**: 确保 `sqlite3` 等原生模块在目标架构上重新编译
2. **多架构兼容的基础镜像**: 使用 `node:20-alpine` 等支持多架构的基础镜像
3. **平台特定的依赖**: 使用 `apk add` 安装多架构兼容的运行时依赖

### 构建流程

多架构构建使用 Docker Buildx，具体流程如下：

1. **创建多架构构建器**: 自动设置支持多架构的构建环境
2. **并行构建**: 同时为所有目标架构构建镜像
3. **清单合并**: 创建统一的镜像清单，支持自动架构选择
4. **缓存优化**: 利用构建缓存提高后续构建速度

## 环境变量配置

可以通过环境变量自定义构建行为：

```bash
# 镜像前缀
export IMAGE_PREFIX="excel-lowcode"

# 镜像标签
export UNIFIED_TAG="latest"
export BACKEND_TAG="latest" 
export FRONTEND_TAG="latest"

# API 基础 URL（用于前端构建）
export API_BASE_URL="http://localhost:3000"
```

## 部署到不同架构服务器

### x86 服务器部署

```bash
# 在 x86 服务器上直接部署
./run.sh --unified
```

### ARM 服务器部署

```bash
# 在 ARM 服务器上直接部署
./run.sh --unified
```

Docker 会自动根据服务器架构选择正确的镜像版本。

## 验证多架构镜像

### 检查镜像清单

```bash
# 检查统一镜像的多架构支持
docker manifest inspect excel-lowcode-unified:latest
```

### 查看支持的架构

```bash
# 查看镜像支持的架构
docker buildx imagetools inspect excel-lowcode-unified:latest
```

## 优势

1. **跨平台兼容**: 支持 x86 和 ARM 架构服务器
2. **性能优化**: 每个架构使用原生编译的二进制文件
3. **部署简化**: 无需为不同架构维护不同的镜像
4. **CI/CD 友好**: 适合自动化部署流水线

## 注意事项

1. **构建时间**: 多架构构建需要为每个架构单独构建，时间会稍长
2. **存储空间**: 多架构镜像会占用更多存储空间
3. **网络要求**: 构建时需要访问 Docker Hub 获取基础镜像

## 故障排除

### 构建器设置问题

如果遇到构建器问题，可以手动设置：

```bash
# 创建新的构建器
docker buildx create --name multi-arch-builder --use

# 启动构建器
docker buildx inspect --bootstrap
```

### 平台不支持

如果某些平台不支持，可以指定特定平台：

```bash
# 只构建 x86 镜像
docker buildx build --platform linux/amd64 -t your-image:latest .
```

## 参考链接

- [Docker Buildx 官方文档](https://docs.docker.com/buildx/working-with-buildx/)
- [多平台镜像构建指南](https://docs.docker.com/build/building/multi-platform/)
- [Docker 清单命令](https://docs.docker.com/engine/reference/commandline/manifest/)
