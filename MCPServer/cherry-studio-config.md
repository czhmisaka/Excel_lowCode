# Cherry Studio 连接配置指南

## MCP服务器连接信息

您构建的Excel数据管理MCP服务器是一个基于官方 MCP SDK 的 Streamable 服务器，支持多种传输模式。以下是连接配置信息：

### 服务器基本信息
- **服务器类型**: Streamable MCP Server (基于官方 SDK)
- **传输协议**: stdio (默认) / HTTP streams
- **服务器地址**: 
  - stdio 模式: 通过命令启动
  - HTTP streams 模式: `http://localhost:3001/mcp`
- **健康检查**: `http://localhost:3001/health`
- **服务器信息**: `http://localhost:3001/info`

### Cherry Studio 配置方法

#### 方法一：通过配置文件配置（推荐）

在Cherry Studio的配置文件中添加以下配置：

```json
{
  "mcpServers": {
    "excel-data-mcp-server": {
      "command": "node",
      "args": [
        "--env-file=/Users/chenzhihan/Desktop/lowCode_excel/MCPServer/.env",
        "/Users/chenzhihan/Desktop/lowCode_excel/MCPServer/build/main.js"
      ]
    }
  }
}
```

#### 方法二：HTTP Streams 模式连接

如果服务器已经在 HTTP streams 模式下运行，可以直接连接：

```json
{
  "mcpServers": {
    "excel-data-mcp-server": {
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

**注意**：某些 MCP 客户端可能需要完整的服务器配置，而不仅仅是 URL。如果直接连接失败，请使用方法一。

### 配置说明

1. **服务器路径**: 
   - 确保路径 `/Users/chenzhihan/Desktop/lowCode_excel/MCPServer/build/main.js` 是正确的
   - 如果部署在其他位置，请相应调整路径

2. **环境变量**:
   - `API_BASE_URL`: Excel数据管理系统的API地址（默认: http://localhost:3000）
   - `MCP_SERVER_PORT`: MCP服务器端口（默认: 3001）
   - `NODE_ENV`: 运行环境（默认: development）

3. **前置要求**:
   - Excel数据管理系统必须在指定端口运行
   - Node.js 18.0.0 或更高版本
   - 需要先构建项目：`npm run build`

### 验证连接

在配置之前，可以通过以下方式验证服务器是否正常工作：

1. **构建项目**:
   ```bash
   cd /Users/chenzhihan/Desktop/lowCode_excel/MCPServer
   npm run build
   ```

2. **启动MCP服务器**:
   ```bash
   npm start
   ```

3. **测试健康检查**:
   ```bash
   curl http://localhost:3001/health
   ```

4. **查看服务器信息**:
   ```bash
   curl http://localhost:3001/info
   ```

5. **测试HTTP streams模式**:
   ```bash
   npm start -- --mode=http-streams
   ```

### 可用工具列表

配置成功后，Cherry Studio将可以使用以下工具：

- **Excel文件操作**:
  - `upload_excel_file` - 上传Excel文件
  - `list_excel_files` - 列出Excel文件
  - `get_excel_metadata` - 获取文件元数据

- **数据操作**:
  - `query_table_data` - 查询表数据
  - `add_table_record` - 新增记录
  - `update_table_record` - 更新记录
  - `delete_table_record` - 删除记录

- **映射关系操作**:
  - `list_table_mappings` - 列出表映射
  - `get_table_info` - 获取表信息
  - `update_table_name` - 更新表名
  - `delete_table_mapping` - 删除表映射
  - `check_system_health` - 检查系统健康

### 故障排除

1. **连接失败**:
   - 检查MCP服务器是否正在运行
   - 验证端口3001是否被占用
   - 检查Excel数据管理系统是否在端口3000运行

2. **工具调用失败**:
   - 查看服务器日志获取详细错误信息
   - 检查API_BASE_URL配置是否正确

3. **初始化错误**:
   - 如果出现"未知的方法: initialize"错误，请确保使用最新版本的服务器代码
   - 服务器已修复并支持标准的MCP `initialize` 方法

4. **Cherry Studio 连接问题**:
   - 如果直接HTTP streams连接失败，请使用方法一（通过命令启动）
   - 确保服务器路径和环境变量配置正确
   - 检查 Cherry Studio 的 MCP 配置格式是否符合要求
   - 确保项目已构建：`npm run build`

5. **权限问题**:
   - 确保有足够的文件系统权限
   - 检查数据库连接配置

### 日志查看

MCP服务器会输出详细的日志信息，包括：
- 客户端连接和断开
- 工具调用记录
- API请求和响应
- 错误信息

如需查看日志，请查看运行MCP服务器的终端输出。
