<!--
 * @Date: 2025-11-11 00:50:04
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-16 04:24:39
 * @FilePath: /lowCode_excel/task.md
-->
# 自定义表单系统开发计划 - 更新版

## 项目概述

### 项目背景
基于现有低代码Excel数据管理系统，开发一个灵活的自定义表单系统，实现表单与数据表的分离，通过Hook机制处理复杂的业务逻辑。

### 核心需求
1. **表单与数据表分离**：表单定义独立于数据库表结构
2. **Hook机制**：支持多种Hook类型（JavaScript、HTTP、数据库、条件）
3. **智能签到系统**：基于新架构重新实现签到逻辑
4. **可视化配置**：表单设计器和Hook配置界面

## 当前开发状态

### ✅ 已完成功能

#### 后端核心功能 ✅
- [x] 表单定义管理API
- [x] Hook执行引擎（JavaScript、HTTP、数据库、条件）
- [x] 公开表单API扩展
- [x] 智能签到系统示例
- [x] 数据库表结构创建
- [x] 修复FormDefinition和FormHook关联关系
- [x] 优化formController的include配置
- [x] 修复公开表单路由配置
- [x] 创建劳务签到系统Hook配置
  - [x] 自动签到时间Hook
  - [x] 计算工作时间Hook
  - [x] 重复签到验证Hook

#### 前端核心组件 ✅
- [x] API服务扩展（表单系统API）
- [x] 表单字段组件库
  - [x] TextField - 文本和密码输入
  - [x] NumberField - 数字输入
  - [x] SelectField - 下拉选择
  - [x] DateField - 日期选择
- [x] DynamicFormRenderer - 动态表单渲染器
- [x] FormManagement - 表单管理页面
- [x] FormDetail - 表单详情页面
- [x] FormFieldsConfig - 字段配置组件
- [x] FormHooksConfig - Hook配置组件
- [x] FormPreview - 表单预览组件
- [x] 修复DynamicFormRenderer空字段错误
- [x] 修复FormHooksConfig空formId问题
- [x] 集成表单管理到系统导航

## 下一步开发计划

### 高优先级：表单管理页面开发 ✅ 已完成

#### 1. 表单列表页面 ✅ 已完成
- [x] 创建表单管理页面组件
- [x] 实现表单列表展示
- [x] 添加表单搜索和筛选功能
- [x] 实现表单创建、编辑、删除操作
- [x] 集成到侧边栏导航
- [x] 添加二维码生成功能
- [x] 添加跳转到表单功能

#### 2. 表单详情页面 ✅ 已完成
- [x] 表单基本信息展示
- [x] 字段配置管理界面
- [x] Hook配置管理界面
- [x] 表单预览功能

#### 3. 表单创建/编辑页面 ✅ 已完成
- [x] 表单基本信息配置
- [x] 字段设计器界面
- [x] 数据表映射配置
- [x] 表单预览和测试

### 中优先级：Hook配置界面开发 ✅ 已完成

#### 4. Hook管理界面 ✅ 已完成
- [x] Hook列表展示
- [x] Hook创建和编辑界面
- [x] JavaScript代码编辑器
- [x] HTTP Hook配置界面
- [x] 数据库Hook配置界面
- [x] 邮件通知Hook配置界面

#### 5. Hook测试和调试 ✅ 已完成
- [x] Hook执行测试功能
- [x] 测试数据输入界面
- [x] JSON格式验证
- [x] 示例数据插入功能

### 低优先级：系统集成和优化

#### 6. 系统集成 ✅ 已完成
- [x] 添加到主布局导航
- [x] 权限控制集成
- [x] 用户界面优化
- [x] 系统健康检查接口集成

#### 7. 智能签到系统迁移
- [ ] 创建新的签到表单定义
- [ ] 实现智能签到Hook
- [ ] 测试和验证功能

## 详细开发计划

### 第一阶段：表单管理页面（预计3-4天）

#### 第1天：基础页面结构
- [ ] 创建表单管理页面组件 `FormManagement.vue`
- [ ] 实现表单列表API调用
- [ ] 创建基础表格展示
- [ ] 添加路由配置

#### 第2天：表单操作功能
- [ ] 实现表单创建功能
- [ ] 实现表单编辑功能
- [ ] 实现表单删除功能
- [ ] 添加操作确认和提示

#### 第3天：搜索和筛选
- [ ] 添加表单搜索功能
- [ ] 实现状态筛选
- [ ] 添加分页功能
- [ ] 优化用户体验

#### 第4天：集成和测试
- [ ] 集成到侧边栏导航
- [ ] 添加权限控制
- [ ] 完整功能测试
- [ ] 修复已知问题

### 第二阶段：Hook配置界面（预计3-4天）

#### 第5天：Hook列表管理
- [ ] 创建Hook管理组件
- [ ] 实现Hook列表展示
- [ ] 添加Hook创建和编辑功能

#### 第6天：Hook配置界面
- [ ] JavaScript代码编辑器
- [ ] HTTP Hook配置界面
- [ ] 数据库Hook配置界面

#### 第7天：Hook测试功能
- [ ] Hook执行测试功能
- [ ] 执行日志查看
- [ ] 错误处理优化

### 第三阶段：系统集成（预计2天）

#### 第8天：系统集成
- [ ] 权限控制集成
- [ ] 用户界面优化
- [ ] 响应式设计优化

#### 第9天：测试和部署
- [ ] 完整功能测试
- [ ] 性能优化
- [ ] 文档更新

## 技术实现要点

### 表单管理页面设计
```vue
<!-- FormManagement.vue 结构 -->
<template>
  <div class="form-management">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="createForm">创建表单</el-button>
      <el-input placeholder="搜索表单..." v-model="searchKeyword" />
    </div>
    
    <!-- 表单列表 -->
    <el-table :data="filteredForms">
      <el-table-column prop="formId" label="表单ID" />
      <el-table-column prop="name" label="表单名称" />
      <el-table-column prop="tableMapping" label="关联表" />
      <el-table-column prop="createdAt" label="创建时间" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button link @click="editForm(scope.row)">编辑</el-button>
          <el-button link @click="previewForm(scope.row)">预览</el-button>
          <el-button link @click="deleteForm(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
```

### Hook配置界面设计
```vue
<!-- HookManagement.vue 结构 -->
<template>
  <div class="hook-management">
    <!-- Hook类型选择 -->
    <el-select v-model="hookType" placeholder="选择Hook类型">
      <el-option label="JavaScript Hook" value="javascript" />
      <el-option label="HTTP Hook" value="http" />
      <el-option label="数据库 Hook" value="database" />
      <el-option label="条件 Hook" value="conditional" />
    </el-select>
    
    <!-- 动态配置区域 -->
    <div v-if="hookType === 'javascript'">
      <code-editor v-model="javascriptCode" />
    </div>
    
    <div v-if="hookType === 'http'">
      <http-config v-model="httpConfig" />
    </div>
    
    <!-- 测试按钮 -->
    <el-button @click="testHook">测试Hook</el-button>
  </div>
</template>
```

## 风险评估与应对

### 技术风险
- **复杂Hook配置**：可能增加用户使用难度
- **应对**：提供模板和示例，简化配置流程

### 集成风险
- **与现有系统冲突**：可能影响现有功能
- **应对**：充分测试，渐进式部署

### 性能风险
- **Hook执行性能**：复杂Hook可能影响响应时间
- **应对**：添加执行超时，优化Hook执行逻辑

## 验收标准

### 第一阶段验收标准
- [ ] 表单管理页面功能完整
- [ ] 表单创建、编辑、删除操作正常
- [ ] 搜索和筛选功能可用
- [ ] 集成到现有系统

### 第二阶段验收标准
- [ ] Hook配置界面功能完整
- [ ] 各种Hook类型配置正常
- [ ] Hook测试功能可用
- [ ] 执行日志查看正常

### 最终验收标准
- [ ] 所有功能测试通过
- [ ] 性能满足要求
- [ ] 用户体验良好
- [ ] 文档完整

---

**文档版本**: v2.1  
**更新时间**: 2025-11-11  
**维护者**: Cline AI Assistant  
**项目状态**: 🟢 第一阶段完成 - 表单管理功能已实现

## 最新更新

### 2025-11-11 数据库同步问题修复

#### 问题分析
- ✅ **识别问题根源**：数据库同步失败是由于 form_definitions 表中存在 form_id 为 null 或重复的数据
- ✅ **分析错误信息**：SequelizeUniqueConstraintError - form_id must be unique

#### 解决方案实施
- ✅ **增强数据验证**：修改 FormDefinition 模型，添加严格的 form_id 验证
- ✅ **改进数据检查**：在 initModels 函数中添加数据完整性检查
- ✅ **更新控制器验证**：在 formController 中添加数据清理和验证逻辑
- ✅ **创建数据迁移脚本**：enhancedDataMigration.js 用于清理现有问题数据
- ✅ **创建直接修复脚本**：fixFormDefinitionsDirectly.js 用于直接修复数据库问题

#### 预防性措施
- ✅ **数据完整性检查**：服务器启动时自动检查 form_definitions 表数据完整性
- ✅ **严格的数据验证**：在模型层和控制器层都添加了 form_id 验证
- ✅ **错误处理优化**：提供详细的错误信息和修复建议

### 2025-11-11 问题修复和功能完善

#### 问题修复
- ✅ **修复公开表单URL无法访问问题**：原URL `http://localhost:5173/form/labor_sign_in` 无法正确打开页面
- ✅ **创建基于表单ID的公开表单页面**：新增 `PublicFormView.vue` 组件
- ✅ **修复前端路由配置**：添加 `/form/:formId` 路由支持
- ✅ **完善API服务**：确保公开表单API方法正确实现
- ✅ **修复表单预览弹窗显示问题**：表单预览弹窗现在可以正确显示表单内容
- ✅ **修复公开表单页面显示问题**：公开表单页面现在可以正确解析和显示表单定义
- ✅ **修复表单详情页面显示问题**：表单详情页面中的字段编辑和预览功能现在可以正确显示内容
- ✅ **修复正则校验为空时的验证问题**：当正则校验设置为空时，不再显示校验不通过

#### 新增功能
- ✅ **二维码生成功能**：为每个表单生成独立的二维码，方便移动端访问
- ✅ **快速跳转功能**：支持一键跳转到公开表单页面
- ✅ **URL复制功能**：方便分享表单链接
- ✅ **二维码下载功能**：支持下载二维码图片
- ✅ **表单预览优化**：在管理页面直接预览表单效果
- ✅ **Hook功能完善**：完整的Hook配置和测试功能

### 2025-11-16 Hook功能开发完成

#### Hook配置界面完善
- ✅ **JavaScript代码编辑器增强**：
  - 代码格式化功能
  - 代码模板插入
  - 语法验证功能
  - 专业的代码编辑体验

- ✅ **HTTP Hook配置完善**：
  - 完整的HTTP请求配置（URL、方法、头部、体）
  - 请求头动态管理
  - 模板变量支持（{{formData.fieldName}}）

- ✅ **数据库Hook配置优化**：
  - 数据库操作类型选择
  - 目标表配置
  - 数据映射配置

- ✅ **邮件Hook配置**：
  - 收件人配置
  - 邮件主题和内容
  - 模板变量支持

#### Hook测试功能增强
- ✅ **单个Hook测试**：支持对单个Hook进行测试执行
- ✅ **批量Hook测试**：一键测试所有启用的Hook
- ✅ **测试数据管理**：内置测试数据生成
- ✅ **测试结果反馈**：详细的执行结果和错误信息

#### Hook管理功能
- ✅ **Hook配置导出**：支持将Hook配置导出为JSON文件
- ✅ **Hook状态管理**：启用/禁用状态控制
- ✅ **触发时机配置**：支持多种触发时机（提交前、提交后、验证前、验证后）

#### 技术实现亮点
1. **TypeScript类型安全**：完整的类型定义和错误处理
2. **响应式设计**：适配不同屏幕尺寸
3. **用户体验优化**：直观的操作界面和实时反馈
4. **代码质量保证**：语法验证和格式化功能
5. **数据安全**：安全的代码执行环境

#### 可用Hook类型
1. **JavaScript Hook**：自定义JavaScript代码处理
2. **HTTP Hook**：调用外部API服务
3. **数据库 Hook**：执行数据库操作
4. **邮件 Hook**：发送邮件通知

#### 触发时机支持
- beforeSubmit：表单提交前
- afterSubmit：表单提交后  
- beforeValidate：表单验证前
- afterValidate：表单验证后

现在Hook功能已经完全可用，您可以在表单详情页面的"Hook配置"标签页中体验所有功能。

### 功能亮点
1. **移动端友好**：通过二维码快速访问表单
2. **便捷分享**：支持URL复制和二维码下载
3. **用户体验优化**：直观的操作界面和流畅的交互体验
4. **响应式设计**：适配不同屏幕尺寸
5. **完整的公开表单支持**：基于表单ID的免认证访问

### 技术实现
- 使用 `qrcode` 库生成二维码
- 集成到现有的表单管理页面
- 支持多种二维码操作（生成、复制、下载、跳转）
- 完整的错误处理和用户反馈
- 基于表单ID的公开表单路由系统
- 免认证的公开表单API调用

### 修复的问题详情
1. **问题**：`http://localhost:5173/form/labor_sign_in` 无法正确打开页面并提交表单
2. **原因**：前端路由配置缺少基于表单ID的公开表单路由
3. **解决方案**：
   - 添加 `/form/:formId` 路由到前端路由配置
   - 创建 `PublicFormView.vue` 组件处理基于表单ID的公开表单
   - 使用 `DynamicFormRenderer` 组件渲染表单
   - 调用公开表单API获取表单定义和提交数据
   - 支持Hook处理的表单提交

### 现在可以正常使用的功能
1. 在表单管理页面点击"二维码"按钮
2. 扫描二维码或点击"打开表单"按钮
3. 访问 `http://localhost:5173/form/{formId}` 公开表单页面
4. 填写并提交表单数据（支持Hook处理）
5. 复制URL分享给他人
6. 下载二维码图片
