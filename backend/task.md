<!--
 * @Date: 2025-09-27 23:02:51
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-11 17:02:21
 * @FilePath: /lowCode_excel/backend/task.md
-->

# Node.js Excel数据管理服务器设计文档

## 1. 项目概述
设计并实现一个基于Node.js的服务器，支持Excel文件上传、解析、数据存储和查询功能。

## 2. 技术栈
- **后端框架**: Node.js + Express
- **ORM**: Sequelize
- **文件上传**: Multer
- **Excel处理**: XLSX
- **API文档**: Swagger
- **数据库**: MySQL

## 3. 数据库设计

### 3.1 数据库连接配置
```javascript
{
  host: '118.196.16.32',
  port: 3306,
  database: 'max',
  username: 'max',
  password: 'max'
}
```

### 3.2 数据表结构

#### 3.2.1 映射关系表 (table_mappings)
| 字段名     | 类型                                                           | 说明           |
| ---------- | -------------------------------------------------------------- | -------------- |
| id         | INT PRIMARY KEY AUTO_INCREMENT                                 | 主键           |
| table_name | VARCHAR(255) NOT NULL                                          | 原始表名       |
| hash_value | VARCHAR(64) UNIQUE NOT NULL                                    | 哈希值(SHA256) |
| created_at | DATETIME DEFAULT CURRENT_TIMESTAMP                             | 创建时间       |
| updated_at | DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间       |

#### 3.2.2 动态数据表
- 表名格式: `data_${hash_value}`
- 字段根据Excel文件第一行自动生成
- 自动推断字段类型（字符串、数字、日期等）
- 包含自增主键 `id` 字段

## 4. 项目结构
```
backend/
├── config/
│   └── database.js          # 数据库配置
├── models/
│   ├── index.js             # 模型初始化
│   ├── TableMapping.js      # 映射关系模型
│   └── dynamic/             # 动态模型目录
├── controllers/
│   ├── uploadController.js  # 文件上传控制器
│   ├── queryController.js   # 数据查询控制器
│   └── editController.js    # 数据编辑控制器
├── routes/
│   ├── upload.js            # 上传路由
│   ├── query.js             # 查询路由
│   └── edit.js              # 编辑路由
├── middleware/
│   ├── upload.js            # 文件上传中间件
│   └── validation.js        # 参数验证中间件
├── utils/
│   ├── hashGenerator.js     # 哈希生成工具
│   ├── excelParser.js       # Excel解析工具
│   └── tableCreator.js      # 动态表创建工具
├── docs/
│   └── swagger.yaml         # Swagger文档
├── app.js                   # 应用入口
└── package.json
```

## 5. API接口详细设计

### 5.1 文件上传接口 (POST /api/upload)
**功能**: 上传Excel文件并创建对应的数据表

**请求参数**:
- multipart/form-data格式
- file: Excel文件（.xlsx, .xls）

**响应格式**:
```json
{
  "success": true,
  "message": "文件上传成功",
  "data": {
    "hash": "abc123...",
    "tableName": "原始文件名",
    "recordCount": 100,
    "createdAt": "2025-09-27T23:11:16.000Z"
  }
}
```

### 5.2 查询映射关系接口 (GET /api/mappings)
**功能**: 获取所有表名和哈希值的映射关系

**响应格式**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tableName": "员工信息表",
      "hash": "abc123...",
      "createdAt": "2025-09-27T23:11:16.000Z"
    }
  ],
  "total": 1
}
```

### 5.3 查询数据接口 (GET /api/data/:hash)
**功能**: 根据哈希值查询对应表的数据（分页+条件查询）

**查询参数**:
- page: 页码（默认1）
- limit: 每页条数（默认10）
- search: 搜索条件（JSON字符串，如 {"name": "张三", "age": 25}）

**响应格式**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "张三",
      "age": 25,
      "department": "技术部"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### 5.4 编辑数据接口 (PUT /api/data/:hash)
**功能**: 根据哈希值和条件更新数据

**请求体**:
```json
{
  "conditions": {
    "id": 1
  },
  "updates": {
    "name": "李四",
    "age": 26
  }
}
```


### 5.5 新增数据接口 (PUT /api/data/:hash/add)
**功能**: 根据哈希值和条件更新数据

**请求体**:
```json
{
  "updates": {
    "name": "李四",
    "age": 26
  }
}
```

**响应格式**:
```json
{
  "success": true,
  "message": "数据更新成功",
  "affectedRows": 1
}
```

### 5.6 删除映射关系接口 (DELETE /api/mappings/{hash})
**功能**: 根据哈希值删除表映射关系，并同步删除对应的数据表

**参数**:
- hash: 表的哈希值（路径参数）

**响应格式**:
```json
{
  "success": true,
  "message": "映射关系删除成功",
  "data": {
    "id": 1,
    "tableName": "员工信息表",
    "hashValue": "abc123def456...",
    "originalFileName": "员工信息表.xlsx",
    "tableDropped": true,
    "deletedAt": "2025-09-28T02:30:00.000Z"
  }
}
```

**错误响应**:
- 400: 无效的哈希值格式
- 404: 映射关系不存在
- 500: 服务器内部错误

### 5.7 导出数据为Excel接口 (GET /api/data/{hash}/export)
**功能**: 根据哈希值导出对应表的所有数据为Excel文件

**参数**:
- hash: 表的哈希值（路径参数）

**响应格式**:
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- Content-Disposition: attachment; filename="{原始文件名}_export_{时间戳}.xlsx"
- 直接返回Excel文件二进制流

**错误响应**:
- 400: 无效的哈希值格式
- 404: 表不存在
- 500: 服务器内部错误或Excel生成失败

### 5.8 获取导出状态接口 (GET /api/data/{hash}/export/status)
**功能**: 检查表是否存在以及是否支持导出

**参数**:
- hash: 表的哈希值（路径参数）

**响应格式**:
```json
{
  "success": true,
  "data": {
    "tableName": "员工信息表",
    "originalFileName": "员工信息表.xlsx",
    "columnCount": 5,
    "rowCount": 100,
    "createdAt": "2025-09-28T08:39:05.000Z",
    "exportSupported": true
  }
}
```

**错误响应**:
- 400: 无效的哈希值格式
- 404: 表不存在
- 500: 服务器内部错误

## 6. 技术实现细节

### 6.1 哈希生成算法
- 使用SHA256算法生成唯一哈希值
- 基于文件名+时间戳+随机数生成
- 确保哈希值的唯一性和安全性

### 6.2 Excel解析逻辑
1. 读取Excel文件第一行作为字段名
2. 自动推断每列的数据类型
3. 处理空值和特殊字符
4. 验证数据格式和完整性

### 6.3 动态表创建
1. 根据解析的字段信息生成Sequelize模型
2. 动态创建数据库表
3. 在映射表中记录表信息
4. 批量插入Excel数据

### 6.4 文件上传配置
- 支持文件类型: .xlsx, .xls
- 最大文件大小: 10MB
- 文件存储: 内存存储（处理完成后删除）

## 7. 开发完成情况

### 阶段1: 项目基础搭建 ✅
- [x] 初始化Node.js项目结构
- [x] 配置数据库连接和Sequelize
- [x] 创建基础模型和配置

### 阶段2: 核心功能实现 ✅
- [x] 实现文件上传和Excel解析
- [x] 实现动态表创建功能
- [x] 实现数据查询接口
- [x] 实现数据编辑接口

### 阶段3: 功能完善 ✅
- [x] 添加参数验证和错误处理
- [x] 实现分页和条件查询
- [x] 添加Swagger文档

### 阶段4: 优化和部署 ✅
- [x] 性能优化和代码重构
- [x] 添加日志记录
- [x] 部署配置

## 8. 技术实现细节和问题解决

### 8.1 动态表模型创建的关键问题

#### 8.1.1 字段映射问题
**问题**: Sequelize默认将字段名转换为下划线命名，导致中文字段名查询失败
**解决方案**: 在模型配置中设置 `underscored: false` 和明确指定 `field` 属性

```javascript
attributes[fieldName] = {
    type: dataType,
    allowNull: true,
    comment: column.originalName || column.name,
    field: fieldName // 明确指定数据库字段名
};
```

#### 8.1.2 时间戳字段问题
**问题**: 现有动态表没有 `createdAt` 和 `updatedAt` 字段，但Sequelize默认会查询这些字段
**解决方案**: 在模型配置中设置 `timestamps: false`

```javascript
const DynamicModel = sequelize.define(`Data_${hashValue}`, attributes, {
    tableName: `data_${hashValue}`,
    timestamps: false, // 禁用时间戳
    underscored: false,
    freezeTableName: true
});
```

#### 8.1.3 JSON数据解析问题
**问题**: `columnDefinitions` 在数据库中存储为JSON字符串，但使用时需要解析为数组
**解决方案**: 在getDynamicModel函数中添加JSON解析逻辑

```javascript
// 确保columnDefinitions是数组格式
let columnDefs = columnDefinitions;
if (typeof columnDefs === 'string') {
    try {
        columnDefs = JSON.parse(columnDefs);
    } catch (error) {
        console.error('解析columnDefinitions失败:', error);
        columnDefs = [];
    }
}
```

### 8.2 数据类型映射
- **字符串类型**: `DataTypes.STRING`
- **数字类型**: `DataTypes.FLOAT`
- **日期类型**: `DataTypes.DATE`
- **布尔类型**: `DataTypes.BOOLEAN`

### 8.3 调试和日志记录
- 在关键函数中添加调试信息
- 记录SQL查询语句
- 捕获并记录错误信息

## 9. 功能验证和测试结果

### 9.1 核心功能验证

#### 9.1.1 文件上传功能 ✅
- 支持.xlsx和.xls格式文件
- 自动解析Excel表头生成字段定义
- 创建动态数据表并存储映射关系

#### 9.1.2 数据查询功能 ✅
- 支持分页查询（page, limit参数）
- 支持条件查询（search参数）
- 正确返回完整的Excel数据字段
- 包含分页信息和表结构信息

#### 9.1.3 数据编辑功能 ✅
- 支持根据条件更新数据
- 支持批量更新操作
- 返回受影响的行数

#### 9.1.4 映射关系查询 ✅
- 显示所有上传的Excel文件信息
- 包含表名、哈希值、列定义等详细信息

### 9.2 性能测试结果
- 文件上传：支持10MB以内文件
- 数据查询：支持分页，默认每页10条
- 并发访问：基础支持，建议生产环境优化

### 9.3 兼容性测试
- 数据库：MySQL 5.7+ ✅
- Node.js版本：14+ ✅
- 操作系统：Windows/macOS/Linux ✅

## 10. 部署和运维

### 10.1 环境要求
- Node.js 14+
- MySQL 5.7+
- 足够的内存处理大文件上传

### 10.2 部署步骤
1. 安装依赖：`npm install`
2. 配置数据库连接信息
3. 启动服务：`npm run dev`（开发）或 `npm start`（生产）

### 10.3 监控和日志
- 建议集成日志记录系统
- 监控数据库连接状态
- 监控文件上传和处理性能

## 11. API使用示例

### 11.1 完整工作流程示例

#### 步骤1: 上传Excel文件
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@员工信息表.xlsx"
```

#### 步骤2: 查看映射关系
```bash
curl -X GET http://localhost:3000/api/mappings
```

#### 步骤3: 查询数据
```bash
curl -X GET "http://localhost:3000/api/data/abc123def456?page=1&limit=5"
```

#### 步骤4: 条件查询
```bash
curl -X GET "http://localhost:3000/api/data/abc123def456?search=%7B%22department%22%3A%22技术部%22%7D"
```

#### 步骤5: 编辑数据
```bash
curl -X PUT http://localhost:3000/api/data/abc123def456 \
  -H "Content-Type: application/json" \
  -d '{
    "conditions": {"id": 1},
    "updates": {"name": "张三丰", "age": 30}
  }'
```

#### 步骤6: 导出数据为Excel
```bash
# 检查导出状态
curl -X GET "http://localhost:3000/api/data/abc123def456/export/status"

# 导出数据为Excel文件
curl -X GET "http://localhost:3000/api/data/abc123def456/export" --output 员工信息表_export.xlsx
```

### 11.2 前端集成示例

#### React组件示例
```javascript
import React, { useState, useEffect } from 'react';

const ExcelDataManager = () => {
  const [mappings, setMappings] = useState([]);
  const [selectedHash, setSelectedHash] = useState('');
  const [data, setData] = useState([]);
  
  // 获取映射关系
  const fetchMappings = async () => {
    const response = await fetch('/api/mappings');
    const result = await response.json();
    setMappings(result.data);
  };
  
  // 查询数据
  const fetchData = async (hash, page = 1, limit = 10) => {
    const response = await fetch(`/api/data/${hash}?page=${page}&limit=${limit}`);
    const result = await response.json();
    setData(result.data);
  };
  
  useEffect(() => {
    fetchMappings();
  }, []);
  
  return (
    <div>
      <h2>Excel数据管理</h2>
      {/* 映射关系列表 */}
      <div>
        {mappings.map(mapping => (
          <button key={mapping.id} onClick={() => fetchData(mapping.hash)}>
            {mapping.tableName}
          </button>
        ))}
      </div>
      {/* 数据表格 */}
      <table>
        <thead>
          <tr>
            {data.length > 0 && Object.keys(data[0]).map(key => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {Object.values(row).map((value, i) => (
                <td key={i}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExcelDataManager;
```

## 12. 最佳实践

### 12.1 文件上传优化
- 限制文件大小，避免内存溢出
- 实现文件类型验证
- 添加进度条显示上传状态
- 支持断点续传（大文件）

### 12.2 数据查询优化
- 实现数据库索引优化
- 使用分页避免大数据量查询
- 添加查询缓存机制
- 实现异步数据处理

### 12.3 安全性考虑
- 验证用户输入，防止SQL注入
- 实现文件上传安全检查
- 添加API访问频率限制
- 使用HTTPS加密传输

### 12.4 错误处理
- 统一的错误响应格式
- 详细的错误日志记录
- 友好的用户错误提示
- 异常情况的优雅降级

## 13. 扩展功能建议

### 13.1 数据导出功能 ✅
- ✅ 支持将查询结果导出为Excel
- ✅ 支持自定义导出字段
- ✅ 支持多种格式导出（CSV、JSON等）
- ✅ MCP服务器已集成导出功能

### 13.2 数据统计功能
- 添加数据统计和报表功能
- 支持图表可视化
- 实现数据趋势分析

### 13.3 权限管理
- 实现用户权限控制
- 支持数据访问权限管理
- 添加操作日志记录

### 13.4 数据备份和恢复
- 定期备份动态数据表
- 实现数据恢复功能
- 支持数据版本管理

## 14. 注意事项
- 确保数据库连接的安全性
- 处理大文件上传的内存管理
- 实现适当的错误处理和日志记录
- 考虑并发访问的数据一致性
- 动态表创建时确保字段名与数据库表结构一致
- 定期清理无效的映射关系和数据表

## 15. 项目总结

### 15.1 项目成果
本项目成功实现了一个功能完整的Excel数据管理服务器，具备以下核心能力：

1. **动态表管理**: 支持根据Excel文件自动创建和管理数据库表
2. **数据查询**: 提供灵活的分页和条件查询功能
3. **数据编辑**: 支持数据的更新和新增操作
4. **API文档**: 完整的Swagger API文档
5. **错误处理**: 完善的错误处理和日志记录机制

### 15.2 技术亮点
- **动态模型创建**: 解决了Sequelize动态模型创建的关键技术问题
- **字段映射优化**: 正确处理中文字段名和数据库字段映射
- **JSON数据处理**: 优化了JSON数据的存储和解析
- **性能优化**: 实现了分页查询和条件查询的性能优化

### 15.3 项目价值
- **提高效率**: 自动化Excel数据处理流程，减少人工操作
- **数据安全**: 提供安全的数据存储和访问机制
- **扩展性强**: 模块化设计便于功能扩展和维护
- **易于集成**: 提供标准的RESTful API接口，便于前端集成

### 15.4 后续维护建议
1. **定期更新**: 保持依赖库的版本更新
2. **性能监控**: 建立性能监控和告警机制
3. **安全审计**: 定期进行安全漏洞扫描和修复
4. **功能迭代**: 根据用户需求持续优化和扩展功能

### 15.5 部署状态
- ✅ 项目已完全开发完成
- ✅ 所有核心功能已验证通过
- ✅ API接口文档已完善
- ✅ 代码质量经过优化和重构
- ✅ 服务器已部署并正常运行

---
**文档版本**: v1.0  
**最后更新**: 2025-09-28  
**维护者**: CZH  
**项目状态**: ✅ 已完成
