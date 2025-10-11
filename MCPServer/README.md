# Excel数据管理系统的Streamable MCP服务器

这是一个基于Model Context Protocol (MCP)的Streamable服务器，为Excel数据管理系统提供标准化的工具和资源接口。服务器使用官方MCP SDK构建，支持多种传输模式。

## 🚀 新特性

- **使用官方MCP SDK** - 完全兼容MCP协议标准
- **多种传输模式** - 支持stdio、HTTP streams模式
- **TypeScript支持** - 类型安全的代码实现
- **更好的错误处理** - 统一的错误处理机制
- **模块化设计** - 易于扩展和维护

## 📋 功能特性

### 工具 (Tools)

#### Excel文件操作
- `upload_excel_file` - 上传Excel文件并创建对应的数据表
- `list_excel_files` - 列出所有已上传的Excel文件及其映射关系
- `get_excel_metadata` - 根据哈希值获取Excel文件的详细信息

#### 数据操作
- `query_table_data` - 根据哈希值查询对应表的数据（支持分页和条件查询）
- `add_table_record` - 向指定表中新增数据记录
- `update_table_record` - 根据条件更新表中的数据记录
- `delete_table_record` - 根据条件删除表中的数据记录

#### 映射关系操作
- `list_table_mappings` - 列出所有Excel文件与动态表的映射关系
- `get_table_info` - 根据哈希值获取表的详细信息
- `update_table_name` - 根据哈希值更新表映射关系的表名
- `delete_table_mapping` - 根据哈希值删除表映射关系，并同步删除对应的数据表
- `check_system_health` - 检查Excel数据管理系统的健康状态

## 🛠️ 安装和配置

### 前置要求

1. Node.js 18.0.0 或更高版本
2. Excel数据管理系统运行在 http://localhost:3000

### 安装依赖

```bash
cd MCPServer
npm install
```

### 构建项目

```bash
npm run build
```

### 环境配置

复制 `.env` 文件并根据需要修改配置：

```bash
# Excel数据管理系统API配置
API_BASE_URL=http://localhost:3000
API_TIMEOUT=30000

# MCP服务器配置
MCP_SERVER_PORT=3001
NODE_ENV=development

# 传输模式配置
MODE=stdio  # 可选: stdio, http-streams

# API密钥（HTTP streams模式需要）
API_KEYS=your_api_key1,your_api_key2
```

## 🏃‍♀️ 使用方法

### 开发模式

```bash
# 开发模式（支持热重载）
npm run dev

# 或者
npm run start:dev
```

### 生产模式

```bash
# 构建项目
npm run build

# 启动服务器
npm start
```

### 传输模式

#### stdio 模式（默认）
适用于Claude Desktop等本地客户端：

```bash
MODE=stdio npm start
```

#### HTTP streams 模式
适用于Web客户端和远程连接：

```bash
MODE=http-streams npm start
```

## 🔌 集成

### Claude Desktop 集成

在Claude Desktop的配置文件中添加MCP服务器：

```json
{
  "mcpServers": {
    "excel-data-mcp-server": {
      "command": "node",
      "args": [
        "--env-file=/path/to/your/MCPServer/.env",
        "/path/to/your/MCPServer/build/main.js"
      ]
    }
  }
}
```

### HTTP Streams 模式集成

当运行在HTTP streams模式时，服务器提供以下端点：

**基础URL:** `http://localhost:3001` (或配置的端口)

**端点:**
- `POST /mcp` - 初始化会话或发送MCP消息
- `GET /mcp` - 检索服务器到客户端通知（需要会话ID）
- `DELETE /mcp` - 终止MCP会话
- `GET /health` - 健康检查端点
- `GET /info` - 服务器信息端点

**会话管理:**
HTTP streams模式使用基于会话的通信。在初始化后，在请求中包含 `mcp-session-id` 头：

```bash
# 初始化新会话
curl -X POST \
  -H "x-api-key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}' \
  http://localhost:3001/mcp

# 在后续请求中使用返回的会话ID
curl -X POST \
  -H "x-api-key: your_api_key" \
  -H "mcp-session-id: your-session-id" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  http://localhost:3001/mcp
```

**认证:**
为所有请求设置 `x-api-key` 头，使用配置的API密钥之一。

## 🧪 测试

### 测试WebSocket连接

```bash
node test-websocket.js
```

### 健康检查

```bash
curl http://localhost:3001/health
```

### 服务器信息

```bash
curl http://localhost:3001/info
```

## 📁 项目结构

```
MCPServer/
├── src/
│   ├── main.ts                 # 主服务器入口
│   ├── utils/
│   │   └── httpClient.ts       # HTTP客户端工具
│   └── tools/
│       ├── excelTools.ts       # Excel相关工具
│       ├── dataTools.ts        # 数据操作工具
│       └── mappingTools.ts     # 映射关系工具
├── build/                      # 编译输出目录
├── package.json
├── tsconfig.json
├── .env
└── README.md
```

## 🔧 开发

### 添加新工具

1. 在对应的工具文件中定义工具schema
2. 在工具处理器中实现工具逻辑
3. 在主服务器文件中注册工具

### 示例工具定义

```typescript
export const myTool = {
    name: 'my_tool',
    description: '工具描述',
    inputSchema: {
        type: 'object',
        properties: {
            param1: {
                type: 'string',
                description: '参数描述'
            }
        },
        required: ['param1']
    }
};

export class MyToolHandler {
    static async handleMyTool(args: any): Promise<any> {
        // 实现工具逻辑
        return {
            content: [{
                type: 'text',
                text: '工具响应'
            }]
        };
    }
}
```

## 🐛 故障排除

### 常见问题

1. **无法连接到API**
   - 检查Excel数据管理系统是否运行在指定端口
   - 验证API_BASE_URL配置是否正确

2. **工具调用失败**
   - 检查网络连接
   - 查看服务器日志获取详细错误信息

3. **构建错误**
   - 运行 `npm run build` 确保TypeScript编译成功
   - 检查所有依赖是否已安装

### 调试模式

启用详细日志记录：

```typescript
// 在main.ts中修改日志级别
capabilities: {
    logging: {
        level: 'debug', // 从'info'改为'debug'
        format: 'json',
        destination: 'stdout',
    }
}
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目。
