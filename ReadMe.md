# Excel_lowCode

一个完整的低代码Excel数据处理系统，提供Excel数据上传、解析、存储和可视化管理的全流程解决方案。

## 🚀 项目简介

本项目是一个通用的低代码Excel数据处理系统，支持Excel文件上传、数据解析、关系映射和数据管理等功能。系统采用前后端分离架构，支持Docker容器化部署。

### 主要特性

- 📊 **Excel数据管理**: 支持Excel文件上传、解析和数据存储
- 🔄 **智能映射**: 自动识别和建立表间映射关系
- 📱 **响应式界面**: 基于Vue 3和Element Plus的现代化UI
- 🗄️ **数据持久化**: 使用MySQL进行数据存储和管理
- 🐳 **容器化部署**: 完整的Docker部署方案
- 📚 **API文档**: 自动生成的Swagger API文档
- 🔍 **数据查询**: 支持复杂数据查询和筛选

## 🛠️ 技术栈

### 前端技术
- **框架**: Vue 3 + TypeScript
- **UI组件库**: Element Plus
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **构建工具**: Vite
- **HTTP客户端**: Axios
- **表格处理**: SheetJS (xlsx)

### 后端技术
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: MySQL + Sequelize ORM
- **文件上传**: Multer
- **API文档**: Swagger UI + Swagger JSDoc
- **安全**: bcryptjs + jsonwebtoken
- **数据处理**: SheetJS (xlsx)

### 部署技术
- **容器化**: Docker + Docker Compose
- **Web服务器**: Nginx
- **数据库**: MySQL 8.0

### MCP 服务器技术
- **MCP 协议**: Model Context Protocol
- **传输模式**: stdio、HTTP streams
- **开发语言**: TypeScript
- **核心依赖**: @modelcontextprotocol/sdk、express、axios

## 📁 项目结构

```
Excel_lowCode/
├── backend/                    # 后端服务
│   ├── config/               # 配置文件
│   │   └── database.js       # 数据库配置
│   ├── controllers/          # 控制器
│   │   ├── deleteController.js
│   │   ├── editController.js
│   │   ├── queryController.js
│   │   ├── updateMappingController.js
│   │   └── uploadController.js
│   ├── docs/                 # 文档
│   │   └── swagger.yaml      # Swagger配置
│   ├── middleware/           # 中间件
│   │   └── upload.js         # 文件上传中间件
│   ├── models/               # 数据模型
│   │   ├── index.js          # 模型初始化
│   │   └── TableMapping.js   # 表映射模型
│   ├── routes/               # 路由
│   │   ├── data.js           # 数据操作路由
│   │   ├── mappings.js       # 映射关系路由
│   │   └── upload.js         # 文件上传路由
│   ├── utils/                # 工具类
│   │   ├── excelParser.js    # Excel解析器
│   │   └── hashGenerator.js  # 哈希生成器
│   ├── app.js                # 应用入口
│   ├── package.json          # 依赖配置
│   └── task.md               # 开发任务
├── fe/                       # 前端应用
│   ├── src/
│   │   ├── components/       # 组件
│   │   │   ├── Layout/       # 布局组件
│   │   │   │   └── MainLayout.vue
│   │   │   └── icons/        # 图标组件
│   │   ├── router/           # 路由配置
│   │   │   └── index.ts
│   │   ├── services/         # 服务层
│   │   │   └── api.ts        # API服务
│   │   ├── stores/           # 状态管理
│   │   │   ├── counter.ts
│   │   │   ├── data.ts       # 数据状态
│   │   │   └── files.ts      # 文件状态
│   │   ├── views/            # 页面视图
│   │   │   ├── Dashboard.vue         # 仪表板
│   │   │   ├── FileManagement.vue    # 文件管理
│   │   │   ├── DataBrowser.vue       # 数据浏览
│   │   │   ├── DataEditor.vue        # 数据编辑
│   │   │   ├── MappingRelations.vue  # 映射关系
│   │   │   └── ApiGuide.vue          # API指南
│   │   ├── App.vue           # 根组件
│   │   └── main.ts           # 入口文件
│   ├── package.json          # 依赖配置
│   └── task.md               # 开发任务
├── docker/                   # Docker配置
│   ├── frontend/             # 前端Docker配置
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   ├── backend/              # 后端Docker配置
│   │   └── Dockerfile
│   ├── docker-compose.yml    # 生产环境配置
│   ├── docker-compose.local.yml # 本地开发配置
│   ├── init-database.sql     # 数据库初始化脚本
│   └── README.md             # Docker部署文档
├── MCPServer/                # MCP 服务器
│   ├── src/                 # 源代码
│   │   ├── main.ts         # 主服务器入口
│   │   ├── tools/          # 工具定义
│   │   │   ├── excelTools.ts   # Excel 相关工具
│   │   │   ├── dataTools.ts    # 数据操作工具
│   │   │   └── mappingTools.ts # 映射关系工具
│   │   └── utils/          # 工具类
│   │       └── httpClient.ts   # HTTP 客户端
│   ├── build/              # 编译输出
│   ├── package.json        # 依赖配置
│   └── README.md           # MCP 服务器文档
├── run.sh                    # 启动脚本
└── ReadMe.md                 # 项目文档
```

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 16.0.0 (推荐 20.x)
- **MySQL**: >= 8.0
- **Docker**: >= 20.10 (可选，用于容器化部署)

### 本地开发环境搭建

#### 1. 克隆项目
```bash
git clone <项目地址>
cd Excel_lowCode
```

#### 2. 后端服务配置
```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑.env文件，配置数据库连接等信息

# 启动开发服务器
npm run dev
```

#### 3. 前端服务配置
```bash
cd fe

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

#### 4. 数据库初始化
确保MySQL服务运行，并执行数据库初始化脚本：
```sql
-- 创建数据库
CREATE DATABASE excel_lowcode;

-- 导入初始化脚本
source docker/init-database.sql
```

#### 5. MCP Server 配置（可选）
```bash
cd MCPServer

# 安装依赖
npm install

# 构建项目
npm run build

# 启动MCP服务器（stdio模式）
npm start

# 或者启动HTTP streams模式
MODE=http-streams npm start
```

### Docker部署（推荐）

#### 本地开发环境部署
```bash
# 进入docker目录
cd docker

# 配置环境变量
cp .env.template .env.local
# 编辑.env.local文件

# 启动本地开发环境
./localRun.sh
```

#### 生产环境部署
```bash
# 进入docker目录
cd docker

# 配置环境变量
cp .env.template .env
# 编辑.env文件，配置生产环境参数

# 构建镜像
./build.sh

# 部署应用
./deploy.sh
```

## 📊 功能模块

### 1. 仪表板 (Dashboard)
- 系统概览和统计信息
- 快速访问常用功能

### 2. 文件管理 (FileManagement)
- Excel文件上传和解析
- 文件列表管理
- 文件状态监控

### 3. 数据浏览 (DataBrowser)
- 数据表格展示
- 数据筛选和搜索
- 分页浏览

### 4. 数据编辑 (DataEditor)
- 在线数据编辑
- 批量操作支持
- 数据验证

### 5. 映射关系 (MappingRelations)
- 表间关系管理
- 映射规则配置
- 关系可视化

### 6. API指南 (ApiGuide)
- 接口文档查看
- 接口测试工具
- 使用示例

## 🤖 MCP Server 安装和使用指南

### 前置要求

1. **Node.js**: >= 18.0.0 (推荐 20.x)
2. **Excel数据管理系统**: 运行在 http://localhost:3000
3. **MCP客户端**: Claude Desktop 或其他支持 MCP 协议的客户端

### 安装和配置

#### 1. 安装依赖
```bash
cd MCPServer
npm install
```

#### 2. 构建项目
```bash
npm run build
```

#### 3. 环境配置
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

### 启动和使用

#### 开发模式
```bash
# 开发模式（支持热重载）
npm run dev

# 或者
npm run start:dev
```

#### 生产模式
```bash
# 构建项目
npm run build

# 启动服务器
npm start
```

#### 传输模式

**stdio 模式（默认）**
适用于Claude Desktop等本地客户端：
```bash
MODE=stdio npm start
```

**HTTP streams 模式**
适用于Web客户端和远程连接：
```bash
MODE=http-streams npm start
```

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

### 测试

#### 健康检查
```bash
curl http://localhost:3001/health
```

#### 服务器信息
```bash
curl http://localhost:3001/info
```

#### 测试WebSocket连接
```bash
node test-websocket.js
```

## 🤖 MCP Server 功能特性

### Excel 文件操作工具
- **`upload_excel_file`** - 上传Excel文件并创建对应的数据表
- **`list_excel_files`** - 列出所有已上传的Excel文件及其映射关系
- **`get_excel_metadata`** - 根据哈希值获取Excel文件的详细信息

### 数据操作工具
- **`query_table_data`** - 根据哈希值查询对应表的数据（支持分页和条件查询）
- **`add_table_record`** - 向指定表中新增数据记录
- **`update_table_record`** - 根据条件更新表中的数据记录
- **`delete_table_record`** - 根据条件删除表中的数据记录

### 映射关系操作工具
- **`list_table_mappings`** - 列出所有Excel文件与动态表的映射关系
- **`get_table_info`** - 根据哈希值获取表的详细信息
- **`update_table_name`** - 根据哈希值更新表映射关系的表名
- **`delete_table_mapping`** - 根据哈希值删除表映射关系，并同步删除对应的数据表
- **`check_system_health`** - 检查Excel数据管理系统的健康状态

## 🔧 API接口

### 主要接口

#### 文件上传
- `POST /api/upload` - 上传Excel文件
- `GET /api/upload/files` - 获取文件列表

#### 数据操作
- `GET /api/data` - 查询数据
- `POST /api/data` - 新增数据
- `PUT /api/data/:id` - 更新数据
- `DELETE /api/data/:id` - 删除数据

#### 映射关系
- `GET /api/mappings` - 获取映射关系
- `POST /api/mappings` - 创建映射关系
- `PUT /api/mappings/:id` - 更新映射关系

### API文档访问

启动后端服务后，访问以下地址查看完整的API文档：
```
http://localhost:3000/api-docs
```

## 🗄️ 数据库设计

### 主要数据表

#### TableMapping (表映射)
```sql
CREATE TABLE table_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    hash_value VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 动态数据表
系统会根据上传的Excel文件自动创建对应的数据表，表名格式为：`data_[hash]`

## 🐳 Docker部署说明

### 服务配置

#### 前端服务
- **容器名**: excel-lowcode-frontend
- **端口**: 80 (生产) / 8080 (开发)
- **健康检查**: http://localhost:80/health

#### 后端服务
- **容器名**: excel-lowcode-backend
- **端口**: 3000
- **健康检查**: http://localhost:3000/health

#### MySQL数据库 (开发环境)
- **容器名**: excel-lowcode-mysql
- **端口**: 3306
- **数据库**: excel_lowcode

### 网络配置
- 使用自定义桥接网络 `app-network`
- 前端通过 `backend` 主机名访问后端服务
- 后端通过 `mysql` 主机名访问数据库服务

### 部署脚本

#### 镜像管理
```bash
# 构建镜像
./build.sh

# 导出镜像
./export-images.sh

# 导入镜像
./import-images.sh
```

#### 服务管理
```bash
# 生产环境部署
./deploy.sh

# 本地开发环境
./localRun.sh

# 服务状态查看
docker-compose ps

# 日志查看
docker-compose logs -f
```

## 🔍 开发指南

### 前端开发

#### 技术栈说明
- 使用Vue 3 Composition API
- TypeScript类型支持
- Element Plus组件库
- Pinia状态管理

#### 开发命令
```bash
cd fe

# 开发模式
npm run dev

# 类型检查
npm run type-check

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 后端开发

#### 技术栈说明
- Express.js框架
- Sequelize ORM
- JWT认证
- Swagger文档

#### 开发命令
```bash
cd backend

# 开发模式
npm run dev

# 生产模式
npm start

# 测试
npm test
```

## 🚨 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务状态
   - 验证连接配置
   - 检查网络连接

2. **文件上传失败**
   - 检查文件大小限制
   - 验证文件格式
   - 检查存储权限

3. **端口冲突**
   - 修改docker-compose.yml中的端口映射
   - 停止占用端口的服务

4. **镜像构建失败**
   - 清理Docker缓存
   - 检查网络连接
   - 重新构建镜像

5. **MCP Server 连接失败**
   - 检查Excel数据管理系统是否运行在指定端口
   - 验证API_BASE_URL配置是否正确
   - 检查网络连接和防火墙设置

6. **MCP 工具调用失败**
   - 检查MCP客户端配置是否正确
   - 查看MCP服务器日志获取详细错误信息
   - 验证传输模式配置（stdio/http-streams）

7. **MCP Server 构建错误**
   - 运行 `npm run build` 确保TypeScript编译成功
   - 检查所有依赖是否已安装
   - 验证Node.js版本是否符合要求（>=18.0.0）

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs

# 实时查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs frontend
docker-compose logs backend
```

## 📞 技术支持

如有问题，请按以下步骤排查：

1. 检查环境变量配置
2. 查看服务日志
3. 验证数据库连接
4. 检查端口占用情况

## 📄 许可证

MIT License

## 👥 贡献者

- CZH - 项目创建者和主要开发者

---

**注意**: 本文档会随着项目发展持续更新，请定期查看最新版本。
