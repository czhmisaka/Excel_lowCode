# 综合部-年假计算系统

一个完整的年假计算管理系统，提供Excel数据上传、解析、存储和可视化管理的全流程解决方案。

## 🚀 项目简介

本项目是一个专为综合部设计的年假计算管理系统，支持Excel文件上传、数据解析、关系映射和数据管理等功能。系统采用前后端分离架构，支持Docker容器化部署。

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

## 📁 项目结构

```
综合部-年假计算/
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
cd 综合部-年假计算
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
CREATE DATABASE annual_leave;

-- 导入初始化脚本
source docker/init-database.sql
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
- **容器名**: annual-leave-frontend
- **端口**: 80 (生产) / 8080 (开发)
- **健康检查**: http://localhost:80/health

#### 后端服务
- **容器名**: annual-leave-backend
- **端口**: 3000
- **健康检查**: http://localhost:3000/health

#### MySQL数据库 (开发环境)
- **容器名**: annual-leave-mysql
- **端口**: 3306
- **数据库**: annual_leave

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
