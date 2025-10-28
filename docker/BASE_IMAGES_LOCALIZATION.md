# Excel_lowCode Docker基础镜像本地化方案

## 问题背景

在构建Excel_lowCode项目时，Docker构建过程中经常遇到以下错误：
```
ERROR [internal] load metadata for docker.io/library/nginx:alpine
ERROR [internal] load metadata for docker.io/library/node:20-alpine
```

这些错误是由于网络问题或Docker Hub服务不稳定导致的，影响项目的正常构建和部署。

## 解决方案

我们创建了一套完整的Docker基础镜像本地化管理方案，包含以下组件：

### 1. 管理脚本

- **`manage-base-images.sh`** - 主管理脚本，提供统一的操作界面
- **`pull-base-images.sh`** - 基础镜像拉取和导出脚本
- **`import-base-images.sh`** - 基础镜像导入脚本
- **`configure-mirrors.sh`** - Docker镜像源配置脚本

### 2. 本地化包

创建了完整的本地化包：`docker-base-images-20251023/`，包含：
- 所有基础镜像的tar文件
- 管理脚本
- 使用说明文档
- 镜像列表文件

## 包含的基础镜像

- `nginx:alpine` (51MB) - Web服务器
- `node:20-alpine` (128MB) - Node.js 20运行时
- `node:16-alpine` (112MB) - Node.js 16运行时

## 使用方法

### 快速开始

```bash
# 1. 检查当前镜像状态
cd docker
./manage-base-images.sh status

# 2. 拉取缺失的基础镜像
./manage-base-images.sh pull

# 3. 导出镜像到本地文件
./manage-base-images.sh export

# 4. 创建完整的本地化包
./manage-base-images.sh package
```

### 在无网络环境下使用

```bash
# 1. 复制本地化包到目标机器
cp -r docker-base-images-20251023/ /path/to/target/

# 2. 导入所有基础镜像
cd /path/to/target/docker-base-images-20251023
./import-base-images.sh

# 3. 验证镜像状态
./manage-base-images.sh status
```

### 镜像源优化（可选）

```bash
# 配置国内镜像源加速下载
cd docker
./manage-base-images.sh mirrors

# 测试镜像源速度
./manage-base-images.sh test
```

## 脚本功能详解

### manage-base-images.sh

```bash
# 显示镜像状态（默认命令）
./manage-base-images.sh status

# 拉取基础镜像
./manage-base-images.sh pull

# 导出镜像到指定目录
./manage-base-images.sh export [目录路径]

# 从文件导入镜像
./manage-base-images.sh import [模式] [路径]

# 配置镜像源
./manage-base-images.sh mirrors

# 测试镜像源速度
./manage-base-images.sh test

# 创建完整本地化包
./manage-base-images.sh package [包目录]
```

### 导入模式说明

- **auto** - 自动检测模式（默认）
- **directory** - 从目录导入所有tar文件
- **list** - 从列表文件导入指定镜像

## 优势特点

1. **网络独立性** - 无需访问Docker Hub即可构建项目
2. **快速恢复** - 镜像导入速度远快于网络下载
3. **版本控制** - 可以管理不同版本的基础镜像
4. **完整性校验** - 自动检查镜像文件完整性
5. **灵活部署** - 支持多种导入模式和配置选项

## 文件结构

```
docker/
├── manage-base-images.sh          # 主管理脚本
├── pull-base-images.sh            # 镜像拉取和导出脚本
├── import-base-images.sh          # 镜像导入脚本
├── configure-mirrors.sh           # 镜像源配置脚本
├── base-images/                   # 导出目录
│   ├── base-images-list.txt       # 镜像列表
│   ├── nginx-alpine.tar           # nginx镜像
│   ├── node-20-alpine.tar         # node 20镜像
│   └── node-16-alpine.tar         # node 16镜像
└── docker-base-images-20251023/   # 完整本地化包
    ├── README.md                  # 使用说明
    ├── *.sh                       # 所有管理脚本
    └── *.tar                      # 所有镜像文件
```

## 验证方法

构建项目验证镜像本地化效果：

```bash
# 使用统一Dockerfile构建
cd docker
docker-compose -f docker-compose.unified.yml build

# 或者直接构建
docker build -f unified/Dockerfile -t excel-lowcode-unified .
```

## 维护建议

1. **定期更新** - 每季度检查并更新基础镜像版本
2. **版本管理** - 为不同项目版本保存对应的基础镜像包
3. **备份策略** - 将本地化包纳入版本控制系统或备份计划
4. **安全扫描** - 定期扫描镜像中的安全漏洞

## 故障排除

### 常见问题

1. **权限问题**
   ```bash
   chmod +x *.sh
   ```

2. **磁盘空间不足**
   - 确保有至少500MB可用空间
   - 清理不需要的Docker镜像：`docker system prune`

3. **导入失败**
   - 检查文件完整性：`file *.tar`
   - 重新导出镜像

4. **构建仍然失败**
   - 检查Dockerfile中的基础镜像版本
   - 验证所有依赖镜像是否都已本地化

## 总结

通过这套本地化方案，您已经成功将 `nginx:alpine` 和 `node:20-alpine` 等基础镜像放到本地，解决了Docker构建过程中的网络依赖问题。现在可以：
- 在无网络环境下正常构建项目
- 大幅减少构建时间
- 提高构建成功率
- 实现离线部署能力

本地化包已创建在 `docker/docker-base-images-20251023/` 目录中，可以复制到任何需要离线构建的环境中使用。
