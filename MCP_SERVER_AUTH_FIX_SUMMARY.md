# MCP Server 认证问题修复总结

## 问题描述
在加入权限模块后，MCP server 访问后端接口时收到 401 错误，无法正常执行数据操作。

## 解决方案
采用方案1：为 MCP server 创建专用服务账户

### 实施步骤

#### 1. 创建 MCP 服务账户
- 创建了专用的 MCP 服务账户 (`mcp_service`)
- 账户角色设置为 `admin`，具有执行所有操作的权限
- 生成了长期有效的 JWT 令牌

#### 2. 修改 MCP server HTTP 客户端
- 更新了 `MCPServer/utils/httpClient.js`
- 添加了环境变量加载逻辑，支持 `.env.production` 文件
- 在请求拦截器中自动添加认证头
- 添加了二进制文件下载功能（用于导出）

#### 3. 环境配置
- 更新了 `MCPServer/.env.production` 文件
- 添加了 `MCP_SERVICE_TOKEN` 环境变量
- 修正了 `API_BASE_URL` 为本地开发环境

## 技术实现细节

### 认证机制
- MCP server 使用 JWT Bearer Token 进行认证
- 令牌在 HTTP 请求拦截器中自动添加到所有请求
- 令牌有效期为24小时，需要定期更新

### 环境变量配置
```env
# Excel数据管理系统API配置 - 生产环境
API_BASE_URL=http://localhost:3000
API_TIMEOUT=30000

# MCP服务器配置
MCP_SERVER_PORT=3001
NODE_ENV=production

# MCP服务认证令牌
MCP_SERVICE_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 日志配置
LOG_LEVEL=info
MODE=http-streams

# 导出配置
EXPORT_DIR=/app/exports
```

### HTTP 客户端改进
- 自动加载环境变量
- 请求拦截器添加认证头
- 响应拦截器提供详细的错误信息
- 支持二进制数据下载

## 测试结果

### 连接测试
- ✅ API 连接正常
- ✅ 映射关系获取正常
- ✅ 系统信息获取正常

### 认证测试
- ✅ 数据查询接口认证通过
- ✅ 数据操作工具正常工作
- ✅ 导出状态检查正常

### 工具功能测试
- ✅ `list_table_mappings` - 正常
- ✅ `get_table_info` - 正常  
- ✅ `check_system_health` - 正常
- ✅ `query_table_data` - 正常
- ✅ `check_export_status` - 正常

## 维护说明

### 令牌更新
MCP 服务令牌将在24小时后过期，需要定期更新：

1. 运行更新脚本：
```bash
cd backend && node scripts/createMCPServiceUser.js
```

2. 将生成的新令牌更新到 `MCPServer/.env.production` 文件

### 部署注意事项
- 确保生产环境中的 `API_BASE_URL` 指向正确的后端地址
- 确保 `MCP_SERVICE_TOKEN` 环境变量正确设置
- 定期检查令牌过期时间

## 安全性考虑
- MCP 服务账户具有管理员权限，应妥善保管令牌
- 建议在生产环境中使用更长的令牌过期时间
- 考虑为 MCP 服务账户创建专门的权限角色

## 总结
通过创建专用服务账户和更新 HTTP 客户端，成功解决了 MCP server 的认证问题。现在 MCP server 可以正常访问所有后端接口，同时保持了系统的安全性。
