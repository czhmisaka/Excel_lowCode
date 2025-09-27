# 前端管理界面开发手册

## 1. 项目概述
基于现有的Node.js Excel数据管理服务器，开发一个功能完整的前端管理界面，提供直观的Excel数据管理操作体验。

## 2. 技术栈建议
- **前端框架**: Vue 3 + TypeScript
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **HTTP客户端**: Axios
- **构建工具**: Vite
- **样式方案**: CSS Modules + SCSS

## 3. 页面结构设计

### 3.1 核心页面

#### 3.1.1 仪表盘页面 (Dashboard)
- **功能**: 系统概览、数据统计、快速操作入口
- **内容**:
  - 已上传文件数量统计
  - 总数据记录数
  - 最近上传的文件列表
  - 系统健康状态显示
- **API接口**: `/health` (系统状态检查)

#### 3.1.2 文件管理页面 (File Management)
- **功能**: Excel文件上传、文件列表管理
- **内容**:
  - 文件上传区域（拖拽上传）
  - 已上传文件列表（文件名、大小、上传时间、记录数）
  - 文件删除功能
  - 文件搜索和筛选
- **API接口**: 
  - `POST /api/upload` (文件上传)
  - `GET /api/mappings` (获取映射关系)
  - `DELETE /api/mappings/{hash}` (删除映射关系)

#### 3.1.3 数据浏览页面 (Data Browser)
- **功能**: 查看和管理Excel数据
- **内容**:
  - 文件选择器（下拉选择已上传的文件）
  - 数据表格展示（支持分页）
  - 列筛选和排序
  - 数据搜索功能
  - 数据导出功能
- **API接口**: `GET /api/data/{hash}` (查询数据)

#### 3.1.4 数据编辑页面 (Data Editor)
- **功能**: 在线编辑Excel数据
- **内容**:
  - 行级编辑（双击编辑）
  - 批量编辑功能
  - 新增数据记录
  - 删除数据记录
  - 数据验证和错误提示
- **API接口**:
  - `PUT /api/data/{hash}` (更新数据)
  - `POST /api/data/{hash}/add` (新增数据)
  - `DELETE /api/data/{hash}` (删除数据)

#### 3.1.5 映射关系页面 (Mapping Relations)
- **功能**: 查看文件与数据表的映射关系
- **内容**:
  - 映射关系列表展示
  - 表结构信息查看
  - 列定义详情
- **API接口**: `GET /api/mappings` (获取映射关系)

### 3.2 辅助页面

#### 3.2.1 系统设置页面 (Settings)
- **功能**: 系统配置管理
- **内容**:
  - API端点配置
  - 分页大小设置
  - 主题设置

#### 3.2.2 帮助文档页面 (Help)
- **功能**: 使用说明和API文档
- **内容**:
  - 操作指南
  - API接口文档链接
  - 常见问题解答

## 4. 功能模块详细设计

### 4.1 文件上传模块
- 支持拖拽上传和点击上传
- 文件类型验证（.xlsx, .xls）
- 文件大小限制（10MB）
- 上传进度显示
- 上传结果反馈

### 4.2 数据表格模块
- 响应式表格设计
- 分页功能（可配置每页条数）
- 列排序（升序/降序）
- 列筛选（文本搜索、下拉选择）
- 行选择（单选/多选）
- 数据导出（Excel、CSV）

### 4.3 数据编辑模块
- 行内编辑（双击进入编辑模式）
- 批量编辑（选择多行批量修改）
- 数据验证（必填项、格式验证）
- 撤销/重做功能
- 实时保存提示

### 4.4 搜索和筛选模块
- 全局搜索（跨字段搜索）
- 高级筛选（多条件组合）
- 筛选条件保存
- 搜索历史记录

## 5. 组件设计

### 5.1 核心组件

#### 5.1.1 FileUploader - 文件上传组件
```typescript
interface FileUploaderProps {
  onUploadSuccess: (response: UploadResponse) => void;
  onUploadError: (error: string) => void;
  maxSize?: number; // 默认10MB
  accept?: string; // 默认".xlsx,.xls"
}
```

#### 5.1.2 DataTable - 数据表格组件
```typescript
interface DataTableProps {
  data: any[];
  columns: TableColumn[];
  pagination?: PaginationConfig;
  onPageChange?: (page: number, pageSize: number) => void;
  onSort?: (field: string, order: 'ascend' | 'descend') => void;
  onFilter?: (filters: Record<string, any>) => void;
}
```

#### 5.1.3 DataEditor - 数据编辑器组件
```typescript
interface DataEditorProps {
  data: any[];
  columns: TableColumn[];
  onSave: (updatedData: any[]) => Promise<void>;
  onCancel: () => void;
}
```

### 5.2 布局组件
- `Layout` - 主布局组件
- `Sidebar` - 侧边栏导航
- `Header` - 页面头部
- `Footer` - 页面底部

## 6. API集成设计

### 6.1 API服务层接口定义
```typescript
// 文件上传响应
interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    hash: string;
    tableName: string;
    originalFileName: string;
    recordCount: number;
    columnCount: number;
    createdAt: string;
  };
}

// 映射关系
interface Mapping {
  id: number;
  tableName: string;
  hashValue: string;
  originalFileName?: string;
  columnCount: number;
  rowCount: number;
  columnDefinitions: ColumnDefinition[];
  createdAt: string;
  updatedAt: string;
}

// 数据查询参数
interface QueryParams {
  page?: number;
  limit?: number;
  search?: string; // JSON字符串格式的条件
}

// 数据响应
interface DataResponse {
  success: boolean;
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

### 6.2 API服务实现
```typescript
class ApiService {
  private baseURL: string;
  
  constructor(baseURL: string = 'http://localhost:3000') {
    this.baseURL = baseURL;
  }
  
  // 文件上传
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseURL}/api/upload`, {
      method: 'POST',
      body: formData,
    });
    
    return response.json();
  }
  
  // 获取映射关系
  async getMappings(): Promise<Mapping[]> {
    const response = await fetch(`${this.baseURL}/api/mappings`);
    const result = await response.json();
    return result.data;
  }
  
  // 查询数据
  async getData(hash: string, params: QueryParams = {}): Promise<DataResponse> {
    const queryString = new URLSearchParams({
      page: params.page?.toString() || '1',
      limit: params.limit?.toString() || '10',
      ...(params.search && { search: params.search })
    }).toString();
    
    const response = await fetch(`${this.baseURL}/api/data/${hash}?${queryString}`);
    return response.json();
  }
  
  // 更新数据
  async updateData(hash: string, conditions: any, updates: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/data/${hash}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conditions, updates }),
    });
    
    return response.json();
  }
  
  // 新增数据
  async addData(hash: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/data/${hash}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    
    return response.json();
  }
  
  // 删除数据
  async deleteData(hash: string, conditions: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/data/${hash}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conditions }),
    });
    
    return response.json();
  }
}
```

## 7. 状态管理设计

### 7.1 Pinia Store结构
```typescript
// 文件管理store
interface FilesState {
  list: FileItem[];
  loading: boolean;
  error: string | null;
  uploadProgress: number;
}

export const useFilesStore = defineStore('files', {
  state: (): FilesState => ({
    list: [],
    loading: false,
    error: null,
    uploadProgress: 0,
  }),
  actions: {
    async uploadStart() {
      this.loading = true;
      this.uploadProgress = 0;
    },
    uploadProgress(progress: number) {
      this.uploadProgress = progress;
    },
    async uploadSuccess(fileData: FileItem) {
      this.loading = false;
      this.list.unshift(fileData);
      this.uploadProgress = 100;
    },
    async uploadError(error: string) {
      this.loading = false;
      this.error = error;
      this.uploadProgress = 0;
    },
  },
});

// 数据管理store
interface DataState {
  currentHash: string;
  currentData: any[];
  pagination: PaginationInfo;
  loading: boolean;
  editing: boolean;
  searchConditions: any;
}

export const useDataStore = defineStore('data', {
  state: (): DataState => ({
    currentHash: '',
    currentData: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    loading: false,
    editing: false,
    searchConditions: {},
  }),
  actions: {
    async fetchData(hash: string, params: QueryParams = {}) {
      this.loading = true;
      this.currentHash = hash;
      try {
        const response = await apiService.getData(hash, params);
        this.currentData = response.data;
        this.pagination = response.pagination;
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        this.loading = false;
      }
    },
  },
});
```

## 8. 路由设计

### 8.1 路由配置
```typescript
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'Dashboard', component: () => import('@/pages/Dashboard.vue') },
      { path: '/files', name: 'FileManagement', component: () => import('@/pages/FileManagement.vue') },
      { path: '/data', name: 'DataBrowser', component: () => import('@/pages/DataBrowser.vue') },
      { path: '/editor', name: 'DataEditor', component: () => import('@/pages/DataEditor.vue') },
      { path: '/mappings', name: 'MappingRelations', component: () => import('@/pages/MappingRelations.vue') },
      { path: '/settings', name: 'Settings', component: () => import('@/pages/Settings.vue') },
      { path: '/help', name: 'Help', component: () => import('@/pages/Help.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
```

## 9. 用户体验设计

### 9.1 交互设计原则
- **即时反馈**: 所有操作都有明确的反馈
- **错误预防**: 表单验证和操作确认
- **一致性**: 统一的交互模式和视觉风格
- **可访问性**: 支持键盘操作和屏幕阅读器

### 9.2 响应式设计
- **移动端**: 单列布局，简化操作
- **平板端**: 适中布局，保持功能完整
- **桌面端**: 多列布局，充分利用屏幕空间

### 9.3 加载状态设计
- **骨架屏**: 数据加载时的占位显示
- **进度条**: 文件上传进度显示
- **加载动画**: 异步操作时的视觉反馈

## 10. 开发计划

### 阶段1：基础框架搭建（1-2周）
- [ ] 项目初始化和配置（Vite + Vue 3 + TypeScript）
- [ ] 安装和配置依赖（Element Plus、Pinia等）
- [ ] 基础布局组件开发
- [ ] API服务层实现

### 阶段2：核心功能开发（2-3周）
- [ ] 文件上传功能实现
- [ ] 数据表格展示组件
- [ ] 分页和搜索功能
- [ ] 基本数据操作（增删改查）

### 阶段3：高级功能开发（2周）
- [ ] 数据编辑功能（行内编辑、批量编辑）
- [ ] 数据导出功能
- [ ] 高级搜索和筛选
- [ ] 错误处理和用户提示

### 阶段4：优化和测试（1周）
- [ ] 性能优化（代码分割、懒加载）
- [ ] 响应式设计优化
- [ ] 用户体验测试和优化
- [ ] 浏览器兼容性测试

## 11. 项目结构

```
frontend/
├── public/                 # 静态资源
├── src/
│   ├── components/         # 通用组件
│   │   ├── common/        # 基础组件
│   │   ├── layout/        # 布局组件
│   │   └── ui/            # UI组件
│   ├── views/             # 页面组件
│   │   ├── Dashboard/     # 仪表盘
│   │   ├── FileManagement/# 文件管理
│   │   ├── DataBrowser/   # 数据浏览
│   │   ├── DataEditor/    # 数据编辑
│   │   └── ...           # 其他页面
│   ├── services/          # API服务
│   │   ├── api.ts         # API接口
│   │   └── types.ts       # 类型定义
│   ├── stores/            # 状态管理
│   │   ├── files.ts       # 文件管理store
│   │   ├── data.ts        # 数据管理store
│   │   └── index.ts       # Store配置
│   ├── router/            # 路由配置
│   │   └── index.ts       # 路由配置
│   ├── utils/             # 工具函数
│   ├── styles/            # 样式文件
│   ├── App.vue            # 根组件
│   └── main.ts            # 入口文件
├── package.json
├── vite.config.ts         # Vite配置
└── tsconfig.json          # TypeScript配置
```

## 12. 部署配置

### 12.1 构建配置
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          element: ['element-plus'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

### 12.2 环境配置
```typescript
// 环境变量配置
interface EnvConfig {
  VITE_API_BASE_URL: string;
  VITE_UPLOAD_MAX_SIZE: string;
}

export const config: EnvConfig = {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  VITE_UPLOAD_MAX_SIZE: import.meta.env.VITE_UPLOAD_MAX_SIZE || '10485760', // 10MB
};
```

## 13. 最佳实践

### 13.1 代码规范
- 使用ESLint和Prettier进行代码格式化
- 遵循TypeScript严格模式
- 组件采用Composition API和<script setup>语法
- 使用Vue的响应式系统优化性能

### 13.2 错误处理
- 统一的错误处理中间件
- 用户友好的错误提示
- Vue错误边界组件捕获错误
- 网络错误重试机制

### 13.3 性能优化
- 代码分割和懒加载
- 图片和资源优化
- 虚拟滚动处理大数据量
- 防抖和节流优化用户交互

## 14. 测试策略

### 14.1 单元测试
- 工具函数测试
- 组件逻辑测试
- Pinia store测试

### 14.2 集成测试
- 页面功能测试
- API集成测试
- 用户交互流程测试

### 14.3 E2E测试
- 完整业务流程测试
- 跨浏览器兼容性测试
- 性能测试

## 15. 维护和扩展

### 15.1 版本管理
- 遵循语义化版本控制
- 保持依赖库更新
- 定期进行安全审计

### 15.2 功能扩展建议
- 数据可视化图表
- 批量操作功能
- 数据导入模板
- 操作日志记录

---
**文档版本**: v1.0  
**创建时间**: 2025-09-28  
**维护者**: CZH  
**项目状态**: 📋 设计方案完成
