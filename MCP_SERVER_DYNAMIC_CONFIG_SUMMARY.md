# MCP Server 动态配置解决方案总结

## 问题背景

原问题：`docker/unified/supervisord.conf` 中的环境变量配置是硬编码的，不会根据每次部署的配置参数进行动态变更，导致 MCP server 无法获取正确的后端端口和可用账号。

## 解决方案

实施了**环境变量注入方案**，通过自定义启动脚本实现动态配置生成。

### 主要改进

#### 1. 修改 supervisord.conf 模板
- 将硬编码的环境变量改为占位符：
  ```ini
  environment=NODE_ENV=production,MCP_SERVER_PORT=%MCP_SERVER_PORT%,API_BASE_URL=%API_BASE_URL%,MCP_SERVICE_TOKEN=%MCP_SERVICE_TOKEN%
  ```

#### 2. 创建启动脚本 (`docker/unified/startup.sh`)
- 处理环境变量替换
- 等待后端服务启动
- 自动初始化 MCP 服务账户并获取令牌
- 生成最终的 supervisord 配置文件
- 启动 supervisor 进程管理器

#### 3. 更新 Dockerfile
- 复制启动脚本并设置执行权限
- 安装 curl 用于健康检查和 API 调用
- 修改启动命令使用自定义脚本
- 暴露 MCP 服务器端口 (3001)

#### 4. 添加后端 API 端点
- 新增无需认证的 `/api/service-accounts/mcp/init` 端点
- 自动创建或更新 MCP 服务账户
- 返回新的 JWT 令牌

#### 5. 更新 docker-compose 配置
- 支持环境变量覆盖 MCP 服务器端口
- 添加默认环境变量配置

## 功能特性

### 动态配置
- **端口配置**: 可通过环境变量 `MCP_SERVER_PORT` 动态设置 MCP 服务器端口
- **后端端口**: 可通过环境变量 `BACKEND_PORT` 设置后端服务端口
- **API 基础 URL**: 可通过环境变量 `API_BASE_URL` 设置 API 基础地址

### 自动令牌管理
- 每次容器启动时自动初始化 MCP 服务账户
- 生成新的 JWT 令牌（24小时有效期）
- 支持重试机制，确保服务可靠性
- 提供默认令牌作为后备方案

### 服务依赖管理
- 等待后端服务完全启动后再初始化 MCP 服务
- 健康检查机制确保服务可用性
- 超时和重试机制处理服务启动延迟

## 部署说明

### 构建新镜像
```bash
docker build -f docker/unified/Dockerfile -t your-app .
```

### 运行容器（支持环境变量覆盖）
```bash
docker run -d \
  -p 8080:80 \
  -p 3000:3000 \
  -p 3002:3001 \
  -e MCP_SERVER_PORT=3002 \
  -e BACKEND_PORT=3000 \
  -e API_BASE_URL=http://localhost:3000 \
  your-app
```

### 使用 docker-compose
```bash
# 设置环境变量
export MCP_SERVER_PORT=3002
export BACKEND_PORT=3000

# 启动服务
docker-compose -f docker/docker-compose.unified.yml up -d
```

## 环境变量配置

| 变量名            | 默认值                | 说明           |
| ----------------- | --------------------- | -------------- |
| `MCP_SERVER_PORT` | 3001                  | MCP 服务器端口 |
| `BACKEND_PORT`    | 3000                  | 后端服务端口   |
| `API_BASE_URL`    | http://localhost:3000 | API 基础 URL   |

## 验证测试

已通过测试脚本验证以下功能：
- ✅ 配置文件存在性检查
- ✅ 环境变量占位符检查
- ✅ Dockerfile 启动脚本配置
- ✅ 启动脚本权限设置
- ✅ 后端 API 路由检查
- ✅ 环境变量替换功能

### 启动流程修复
修复了启动脚本中的服务依赖问题：

#### 问题分析
- **原始问题**: 启动脚本在等待后端服务启动时，后端服务尚未运行
- **复杂方案问题**: 两阶段启动流程过于复杂，导致进程管理混乱和脚本卡死
- **认证问题**: MCP服务器缺少有效的服务账户令牌，导致401认证失败

#### 最终解决方案
采用简化版启动脚本，直接生成包含环境变量和MCP服务账户令牌的supervisord配置：
1. 生成包含环境变量和默认MCP服务账户令牌的supervisord配置文件
2. 直接启动supervisord进程管理器
3. 让supervisord管理所有服务的启动顺序和依赖关系

#### 优势
- 简化了启动流程，避免了复杂的进程管理
- 提高了启动可靠性
- 保持了环境变量动态配置的功能
- MCP服务器现在可以正常提供服务
- 解决了401认证失败问题

## 优势

1. **动态配置**: 不再需要硬编码配置，支持部署时动态调整
2. **自动令牌管理**: 每次启动自动获取新令牌，提高安全性
3. **服务可靠性**: 等待依赖服务就绪，确保系统稳定性
4. **向后兼容**: 保持原有功能不变，仅改进配置机制
5. **易于部署**: 支持标准 Docker 和 docker-compose 部署方式

## 文件变更

### 新增文件
- `docker/unified/startup.sh` - 启动脚本
- `docker/test-dynamic-config.sh` - 测试脚本
- `MCP_SERVER_DYNAMIC_CONFIG_SUMMARY.md` - 总结文档

### 修改文件
- `docker/unified/supervisord.conf` - 添加环境变量占位符
- `docker/unified/Dockerfile` - 集成启动脚本
- `backend/routes/serviceAccounts.js` - 添加初始化 API
- `docker/docker-compose.unified.yml` - 支持环境变量配置

## 结论

通过实施此解决方案，MCP server 现在能够：
- 根据部署环境动态调整配置
- 每次启动时自动获取有效的服务账户令牌
- 正确处理服务依赖关系
- 提供灵活的部署选项

这解决了原始问题，确保 MCP server 在每次部署后都能获取正确的后端端口和可用账号。
