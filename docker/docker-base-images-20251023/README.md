# Excel_lowCode Docker基础镜像本地化包

## 概述
此包包含了Excel_lowCode项目所需的所有Docker基础镜像，可以在无网络环境下使用。

## 包含的镜像
- nginx:alpine
- node:20-alpine  
- node:16-alpine

## 使用方法

### 1. 导入所有基础镜像
```bash
./import-base-images.sh
```

### 2. 检查镜像状态
```bash
./manage-base-images.sh status
```

### 3. 配置镜像源（可选）
```bash
./configure-mirrors.sh configure
```

## 文件说明
- `*.tar` - Docker镜像文件
- `base-images-list.txt` - 镜像列表
- `*.sh` - 管理脚本
- `README.md` - 使用说明

## 系统要求
- Docker 20.10+
- Linux/macOS/Windows WSL2
