<template>
  <div class="form-hooks-config">
    <!-- 简化工具栏 -->
    <div class="hooks-toolbar">
      <el-button type="primary" @click="handleAddHook" :icon="Plus">
        添加Hook
      </el-button>
      <div class="toolbar-actions">
        <el-button type="text" @click="handleTestHooks" :icon="VideoPlay">
          测试Hook
        </el-button>
        <el-button type="text" @click="handleExportHooks" :icon="Download">
          导出配置
        </el-button>
      </div>
    </div>

    <!-- Hook列表 - 移除外层卡片 -->
    <el-table
      :data="hooks"
      stripe
      style="width: 100%"
      class="hooks-table"
    >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="Hook名称" min-width="120">
          <template #default="scope">
            <el-input
              v-model="scope.row.name"
              placeholder="Hook名称"
              size="small"
              @blur="handleHookChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="type" label="Hook类型" width="120">
          <template #default="scope">
            <el-select
              v-model="scope.row.type"
              placeholder="选择类型"
              size="small"
              style="width: 100%"
              @change="handleHookChange(scope.row)"
            >
              <el-option label="JavaScript" value="javascript" />
              <el-option label="HTTP请求" value="http" />
              <el-option label="数据库操作" value="database" />
              <el-option label="邮件通知" value="email" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="triggerType" label="触发时机" width="120">
          <template #default="scope">
            <el-select
              v-model="scope.row.triggerType"
              placeholder="触发时机"
              size="small"
              style="width: 100%"
              @change="handleHookChange(scope.row)"
            >
              <el-option label="提交前" value="beforeSubmit" />
              <el-option label="提交后" value="afterSubmit" />
              <el-option label="验证前" value="beforeValidate" />
              <el-option label="验证后" value="afterValidate" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="enabled" label="启用" width="80" align="center">
          <template #default="scope">
            <el-checkbox
              v-model="scope.row.enabled"
              @change="handleHookChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip>
          <template #default="scope">
            <el-input
              v-model="scope.row.description"
              placeholder="Hook描述"
              size="small"
              @blur="handleHookChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              link
              size="small"
              @click="handleEditHook(scope.row)"
              :icon="Edit"
            >
              编辑
            </el-button>
            <el-button
              type="warning"
              link
              size="small"
              @click="handleTestHook(scope.row)"
              :icon="VideoPlay"
            >
              测试
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              @click="handleDeleteHook(scope.$index)"
              :icon="Delete"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="hooks.length === 0" class="empty-state">
        <el-empty description="暂无Hook配置">
          <el-button type="primary" @click="handleAddHook" :icon="Plus">
            添加第一个Hook
          </el-button>
        </el-empty>
      </div>

    <!-- Hook编辑对话框 -->
    <el-dialog
      v-model="hookDialogVisible"
      :title="hookDialogTitle"
      width="800px"
      class="modern-dialog"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form
        ref="hookDialogRef"
        :model="hookDialogData"
        label-width="120px"
      >
        <el-form-item label="Hook名称" prop="name">
          <el-input
            v-model="hookDialogData.name"
            placeholder="请输入Hook名称"
          />
          <div class="form-tip">Hook的唯一标识，用于区分不同的Hook</div>
        </el-form-item>

        <el-form-item label="Hook类型" prop="type">
          <el-select
            v-model="hookDialogData.type"
            placeholder="请选择Hook类型"
            style="width: 100%"
            @change="handleHookTypeChange"
          >
            <el-option label="JavaScript" value="javascript" />
            <el-option label="HTTP请求" value="http" />
            <el-option label="数据库操作" value="database" />
            <el-option label="邮件通知" value="email" />
          </el-select>
        </el-form-item>

        <el-form-item label="触发时机" prop="triggerType">
          <el-select
            v-model="hookDialogData.triggerType"
            placeholder="请选择触发时机"
            style="width: 100%"
          >
            <el-option label="提交前" value="beforeSubmit" />
            <el-option label="提交后" value="afterSubmit" />
            <el-option label="验证前" value="beforeValidate" />
            <el-option label="验证后" value="afterValidate" />
          </el-select>
          <div class="form-tip">选择Hook在表单处理流程中的执行时机</div>
        </el-form-item>

        <el-form-item label="启用状态" prop="enabled">
          <el-checkbox v-model="hookDialogData.enabled">
            启用此Hook
          </el-checkbox>
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="hookDialogData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入Hook描述"
          />
        </el-form-item>

        <!-- JavaScript Hook配置 -->
        <template v-if="hookDialogData.type === 'javascript'">
          <el-form-item label="JavaScript代码" prop="config.code">
            <div class="code-editor-container">
              <div class="code-editor-header">
                <span>JavaScript代码编辑器</span>
                <div class="code-editor-actions">
                  <el-button type="text" @click="handleFormatCode" size="small" :icon="VideoPlay">
                    格式化代码
                  </el-button>
                  <el-button type="text" @click="handleInsertTemplate" size="small" :icon="Plus">
                    插入模板
                  </el-button>
                  <el-button type="text" @click="handleValidateCode" size="small" :icon="Check">
                    验证代码
                  </el-button>
                </div>
              </div>
              <el-input
                v-model="hookDialogData.config.code"
                type="textarea"
                :rows="12"
                placeholder="请输入JavaScript代码"
                class="code-editor"
              />
              <div class="form-tip">
                可用的变量：formData (表单数据), context (上下文信息), result (返回结果)
              </div>
            </div>
          </el-form-item>
        </template>

        <!-- HTTP Hook配置 -->
        <template v-if="hookDialogData.type === 'http'">
          <el-form-item label="请求URL" prop="config.url">
            <el-input
              v-model="hookDialogData.config.url"
              placeholder="请输入HTTP请求URL"
            />
          </el-form-item>

          <el-form-item label="请求方法" prop="config.method">
            <el-select
              v-model="hookDialogData.config.method"
              placeholder="请选择请求方法"
              style="width: 100%"
            >
              <el-option label="GET" value="GET" />
              <el-option label="POST" value="POST" />
              <el-option label="PUT" value="PUT" />
              <el-option label="DELETE" value="DELETE" />
            </el-select>
          </el-form-item>

          <el-form-item label="请求头" prop="config.headers">
            <div class="headers-config">
              <div class="headers-header">
                <span>请求头配置</span>
                <el-button type="text" @click="handleAddHeader" size="small" :icon="Plus">
                  添加请求头
                </el-button>
              </div>
              <div class="headers-list">
                <div
                  v-for="(header, index) in hookDialogData.config.headers"
                  :key="index"
                  class="header-item"
                >
                  <el-input
                    v-model="header.key"
                    placeholder="Header名称"
                    style="width: 45%; margin-right: 10px;"
                  />
                  <el-input
                    v-model="header.value"
                    placeholder="Header值"
                    style="width: 45%; margin-right: 10px;"
                  />
                  <el-button
                    type="danger"
                    link
                    size="small"
                    @click="handleRemoveHeader(index)"
                    :icon="Delete"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="请求体" prop="config.body">
            <el-input
              v-model="hookDialogData.config.body"
              type="textarea"
              :rows="4"
              placeholder="请输入请求体（JSON格式）"
            />
            <div class="form-tip">支持使用 &#123;&#123;formData.fieldName&#125;&#125; 格式引用表单字段值</div>
          </el-form-item>
        </template>

        <!-- 数据库Hook配置 -->
        <template v-if="hookDialogData.type === 'database'">
          <el-form-item label="数据库操作" prop="config.operation">
            <el-select
              v-model="hookDialogData.config.operation"
              placeholder="请选择数据库操作"
              style="width: 100%"
            >
              <el-option label="插入数据" value="insert" />
              <el-option label="更新数据" value="update" />
              <el-option label="查询数据" value="select" />
              <el-option label="删除数据" value="delete" />
            </el-select>
          </el-form-item>

          <el-form-item label="目标表" prop="config.table">
            <el-input
              v-model="hookDialogData.config.table"
              placeholder="请输入目标表名"
            />
          </el-form-item>

          <el-form-item label="数据映射" prop="config.mapping">
            <el-input
              v-model="hookDialogData.config.mapping"
              type="textarea"
              :rows="4"
              placeholder="请输入数据映射配置（JSON格式）"
            />
            <div class="form-tip">定义表单字段到数据库字段的映射关系</div>
          </el-form-item>
        </template>

        <!-- 邮件Hook配置 -->
        <template v-if="hookDialogData.type === 'email'">
          <el-form-item label="收件人" prop="config.to">
            <el-input
              v-model="hookDialogData.config.to"
              placeholder="请输入收件人邮箱"
            />
            <div class="form-tip">支持多个邮箱，用逗号分隔</div>
          </el-form-item>

          <el-form-item label="邮件主题" prop="config.subject">
            <el-input
              v-model="hookDialogData.config.subject"
              placeholder="请输入邮件主题"
            />
          </el-form-item>

          <el-form-item label="邮件内容" prop="config.content">
            <el-input
              v-model="hookDialogData.config.content"
              type="textarea"
              :rows="6"
              placeholder="请输入邮件内容"
            />
            <div class="form-tip">支持使用 &#123;&#123;formData.fieldName&#125;&#125; 格式引用表单字段值</div>
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="hookDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveHook">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { Plus, Download, Edit, Delete, VideoPlay, Check } from '@element-plus/icons-vue'
import { apiService } from '@/services/api'

interface FormHook {
  id?: string
  name: string
  type: string
  triggerType: string
  enabled?: boolean
  description?: string
  config: any
}

interface FormHooksConfigProps {
  formId: string
}

const props = defineProps<FormHooksConfigProps>()
const emit = defineEmits<{
  'update': [data: any]
}>()

const hooks = ref<FormHook[]>([])
const hookDialogVisible = ref(false)
const hookDialogRef = ref<FormInstance>()
const hookDialogData = ref<FormHook>({
  name: '',
  type: 'javascript',
  triggerType: 'beforeSubmit',
  enabled: true,
  description: '',
  config: {}
})
const isEditingHook = ref(false)
const editingHookIndex = ref(-1)

// 计算属性
const hookDialogTitle = computed(() => {
  return isEditingHook.value ? '编辑Hook' : '添加Hook'
})

// 初始化Hook数据
const initHooks = async () => {
  try {
    const response = await apiService.getFormHooks(props.formId)
    hooks.value = response.data || []
  } catch (error) {
    console.error('获取Hook列表失败:', error)
    hooks.value = []
  }
}

// 添加Hook
const handleAddHook = () => {
  isEditingHook.value = false
  hookDialogData.value = {
    name: '',
    type: 'javascript',
    triggerType: 'beforeSubmit',
    enabled: true,
    description: '',
    config: {
      code: '',
      url: '',
      method: 'POST',
      headers: [],
      body: '',
      operation: 'insert',
      table: '',
      mapping: '',
      to: '',
      subject: '',
      content: ''
    }
  }
  hookDialogVisible.value = true
}

// 编辑Hook
const handleEditHook = (hook: FormHook) => {
  isEditingHook.value = true
  editingHookIndex.value = hooks.value.indexOf(hook)
  hookDialogData.value = { ...hook }
  hookDialogVisible.value = true
}

// 删除Hook
const handleDeleteHook = (index: number) => {
  hooks.value.splice(index, 1)
  updateFormData()
}

// 保存Hook
const handleSaveHook = () => {
  if (!hookDialogData.value.name) {
    ElMessage.error('请填写Hook名称')
    return
  }

  if (isEditingHook.value) {
    // 更新Hook
    hooks.value[editingHookIndex.value] = { ...hookDialogData.value }
  } else {
    // 添加新Hook
    hooks.value.push({ ...hookDialogData.value })
  }

  hookDialogVisible.value = false
  updateFormData()
  ElMessage.success(isEditingHook.value ? 'Hook更新成功' : 'Hook添加成功')
}

// 处理Hook变化
const handleHookChange = (hook: FormHook) => {
  updateFormData()
}

// 处理Hook类型变化
const handleHookTypeChange = () => {
  // 根据Hook类型初始化配置
  const type = hookDialogData.value.type
  if (!hookDialogData.value.config) {
    hookDialogData.value.config = {}
  }
  
  switch (type) {
    case 'javascript':
      hookDialogData.value.config.code = hookDialogData.value.config.code || ''
      break
    case 'http':
      hookDialogData.value.config.url = hookDialogData.value.config.url || ''
      hookDialogData.value.config.method = hookDialogData.value.config.method || 'POST'
      hookDialogData.value.config.headers = hookDialogData.value.config.headers || []
      hookDialogData.value.config.body = hookDialogData.value.config.body || ''
      break
    case 'database':
      hookDialogData.value.config.operation = hookDialogData.value.config.operation || 'insert'
      hookDialogData.value.config.table = hookDialogData.value.config.table || ''
      hookDialogData.value.config.mapping = hookDialogData.value.config.mapping || ''
      break
    case 'email':
      hookDialogData.value.config.to = hookDialogData.value.config.to || ''
      hookDialogData.value.config.subject = hookDialogData.value.config.subject || ''
      hookDialogData.value.config.content = hookDialogData.value.config.content || ''
      break
  }
}

// 更新表单数据
const updateFormData = () => {
  const updatedData = {
    hooks: [...hooks.value]
  }
  emit('update', updatedData)
}

// 添加请求头
const handleAddHeader = () => {
  if (!hookDialogData.value.config.headers) {
    hookDialogData.value.config.headers = []
  }
  hookDialogData.value.config.headers.push({ key: '', value: '' })
}

// 删除请求头
const handleRemoveHeader = (index: number) => {
  hookDialogData.value.config.headers?.splice(index, 1)
}

// 格式化代码
const handleFormatCode = () => {
  try {
    // 简单的代码格式化 - 移除多余空格和空行
    const code = hookDialogData.value.config.code
    if (code) {
      const formattedCode = code
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .join('\n')
      hookDialogData.value.config.code = formattedCode
      ElMessage.success('代码格式化完成')
    }
  } catch (error) {
    ElMessage.error('代码格式化失败')
  }
}

// 插入代码模板
const handleInsertTemplate = () => {
  const template = `// JavaScript Hook 模板
// 可用的变量: formData, context, result

// 示例: 处理表单数据
function processFormData(formData) {
  // 在这里处理表单数据
  const processedData = { ...formData }
  
  // 示例: 添加时间戳
  processedData.timestamp = new Date().toISOString()
  
  // 示例: 计算字段
  if (processedData.quantity && processedData.price) {
    processedData.total = processedData.quantity * processedData.price
  }
  
  return processedData
}

// 执行处理
const result = processFormData(formData)

// 返回处理后的数据
return result`
  
  hookDialogData.value.config.code = template
  ElMessage.success('代码模板已插入')
}

// 验证代码
const handleValidateCode = () => {
  const code = hookDialogData.value.config.code
  if (!code || code.trim() === '') {
    ElMessage.warning('请先输入JavaScript代码')
    return
  }
  
  try {
    // 简单的语法检查 - 尝试解析代码
    new Function(code)
    ElMessage.success('代码语法验证通过')
  } catch (error: any) {
    ElMessage.error(`代码语法错误: ${error.message}`)
  }
}

// 测试Hook
const handleTestHook = async (hook: FormHook) => {
  try {
    ElMessage.info(`正在测试Hook "${hook.name}"...`)
    
    // 创建测试数据
    const testData = {
      name: '测试用户',
      email: 'test@example.com',
      phone: '13800138000'
    }
    
    // 调用后端测试接口
    const response = await apiService.testFormHook(props.formId, hook.id!, testData)
    
    if (response.success) {
      ElMessage.success(`Hook测试成功: ${response.message}`)
      console.log('Hook测试结果:', response.data)
    } else {
      ElMessage.error(`Hook测试失败: ${response.message}`)
    }
  } catch (error) {
    console.error('Hook测试失败:', error)
    ElMessage.error('Hook测试失败，请检查网络连接')
  }
}

// 测试所有Hook
const handleTestHooks = async () => {
  if (hooks.value.length === 0) {
    ElMessage.warning('没有可测试的Hook')
    return
  }
  
  try {
    ElMessage.info('正在测试所有Hook...')
    
    const testData = {
      name: '测试用户',
      email: 'test@example.com',
      phone: '13800138000'
    }
    
    let successCount = 0
    let errorCount = 0
    
    for (const hook of hooks.value) {
      if (hook.enabled) {
        try {
          const response = await apiService.testFormHook(props.formId, hook.id!, testData)
          if (response.success) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
        }
      }
    }
    
    ElMessage.success(`Hook测试完成: ${successCount} 成功, ${errorCount} 失败`)
  } catch (error) {
    console.error('批量测试Hook失败:', error)
    ElMessage.error('批量测试Hook失败')
  }
}

// 导出Hook配置
const handleExportHooks = () => {
  if (hooks.value.length === 0) {
    ElMessage.warning('没有可导出的Hook配置')
    return
  }
  
  try {
    const exportData = {
      formId: props.formId,
      hooks: hooks.value,
      exportTime: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = `hooks-config-${props.formId}-${Date.now()}.json`
    link.click()
    
    ElMessage.success('Hook配置导出成功')
  } catch (error) {
    console.error('导出Hook配置失败:', error)
    ElMessage.error('导出Hook配置失败')
  }
}

// 初始化
initHooks()
</script>

<style scoped>
.form-hooks-config {
  padding: 0;
}

/* 简化工具栏样式 */
.hooks-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 简化表格样式 */
.hooks-table {
  border-radius: var(--radius-base);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

.hooks-table :deep(.el-table__header) {
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
}

.hooks-table :deep(.el-table__body tr:hover > td) {
  background-color: rgba(24, 144, 255, 0.04) !important;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-base);
  margin-top: 16px;
}

.form-tip {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 4px;
  line-height: 1.4;
}

.code-editor-container {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-base);
  padding: 16px;
}

.code-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
}

.code-editor {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
}

.headers-config {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-base);
  padding: 16px;
}

.headers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
}

.headers-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hooks-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .toolbar-actions {
    justify-content: space-between;
  }
  
  .header-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-item .el-input {
    width: 100% !important;
    margin-right: 0 !important;
  }
}
</style>
