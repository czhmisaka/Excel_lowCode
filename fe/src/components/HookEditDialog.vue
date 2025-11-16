<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="800px"
    class="modern-dialog"
    :close-on-click-modal="false"
    append-to-body
  >
    <el-form
      ref="hookFormRef"
      :model="hookData"
      :rules="formRules"
      label-width="120px"
    >
      <el-form-item label="Hook名称" prop="name">
        <el-input
          v-model="hookData.name"
          placeholder="请输入Hook名称"
          maxlength="50"
          show-word-limit
        />
        <div class="form-tip">Hook的唯一标识，用于区分不同的Hook</div>
      </el-form-item>

      <el-form-item label="所属表单" prop="formId">
        <el-select
          v-model="hookData.formId"
          placeholder="请选择所属表单"
          style="width: 100%"
          filterable
        >
          <el-option
            v-for="form in forms"
            :key="form.formId"
            :label="form.name"
            :value="form.formId"
          />
        </el-select>
        <div class="form-tip">选择Hook所属的表单</div>
      </el-form-item>

      <el-form-item label="Hook类型" prop="type">
        <el-select
          v-model="hookData.type"
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
          v-model="hookData.triggerType"
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
        <el-checkbox v-model="hookData.enabled">
          启用此Hook
        </el-checkbox>
        <div class="form-tip">禁用后Hook将不会执行</div>
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="hookData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入Hook描述"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <!-- JavaScript Hook配置 -->
      <template v-if="hookData.type === 'javascript'">
        <el-divider content-position="left">JavaScript Hook配置</el-divider>
        <el-form-item label="JavaScript代码" prop="config.code">
          <div class="code-editor-container">
            <div class="code-editor-header">
              <span>JavaScript代码编辑器</span>
              <div class="code-editor-actions">
                <el-button type="text" @click="handleFormatCode" size="small">
                  格式化代码
                </el-button>
                <el-button type="text" @click="handleInsertTemplate" size="small" :icon="DocumentAdd">
                  插入模板
                </el-button>
              </div>
            </div>
            <el-input
              v-model="hookData.config.code"
              type="textarea"
              :rows="12"
              placeholder="请输入JavaScript代码"
              class="code-editor"
              resize="none"
            />
            <div class="form-tip">
              <div>可用的变量：</div>
              <div><code>formData</code> - 表单提交数据</div>
              <div><code>context</code> - 上下文信息（包含表单ID、用户信息等）</div>
              <div><code>result</code> - 返回结果对象（可修改）</div>
              <div><code>utils</code> - 工具函数集合</div>
            </div>
          </div>
        </el-form-item>
      </template>

      <!-- HTTP Hook配置 -->
      <template v-if="hookData.type === 'http'">
        <el-divider content-position="left">HTTP Hook配置</el-divider>
        <el-form-item label="请求URL" prop="config.url">
          <el-input
            v-model="hookData.config.url"
            placeholder="请输入HTTP请求URL"
          />
          <div class="form-tip">支持使用 &#123;&#123;formData.fieldName&#125;&#125; 格式引用表单字段值</div>
        </el-form-item>

        <el-form-item label="请求方法" prop="config.method">
          <el-select
            v-model="hookData.config.method"
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
                v-for="(header, index) in hookData.config.headers"
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
            v-model="hookData.config.body"
            type="textarea"
            :rows="4"
            placeholder="请输入请求体（JSON格式）"
          />
          <div class="form-tip">支持使用 &#123;&#123;formData.fieldName&#125;&#125; 格式引用表单字段值</div>
        </el-form-item>
      </template>

      <!-- 数据库Hook配置 -->
      <template v-if="hookData.type === 'database'">
        <el-divider content-position="left">数据库Hook配置</el-divider>
        <el-form-item label="数据库操作" prop="config.operation">
          <el-select
            v-model="hookData.config.operation"
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
            v-model="hookData.config.table"
            placeholder="请输入目标表名"
          />
        </el-form-item>

        <el-form-item label="数据映射" prop="config.mapping">
          <el-input
            v-model="hookData.config.mapping"
            type="textarea"
            :rows="4"
            placeholder="请输入数据映射配置（JSON格式）"
          />
          <div class="form-tip">定义表单字段到数据库字段的映射关系，例如：{"formField": "dbField"}</div>
        </el-form-item>
      </template>

      <!-- 邮件Hook配置 -->
      <template v-if="hookData.type === 'email'">
        <el-divider content-position="left">邮件Hook配置</el-divider>
        <el-form-item label="收件人" prop="config.to">
          <el-input
            v-model="hookData.config.to"
            placeholder="请输入收件人邮箱"
          />
          <div class="form-tip">支持多个邮箱，用逗号分隔</div>
        </el-form-item>

        <el-form-item label="邮件主题" prop="config.subject">
          <el-input
            v-model="hookData.config.subject"
            placeholder="请输入邮件主题"
          />
          <div class="form-tip">支持使用 &#123;&#123;formData.fieldName&#125;&#125; 格式引用表单字段值</div>
        </el-form-item>

        <el-form-item label="邮件内容" prop="config.content">
          <el-input
            v-model="hookData.config.content"
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
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          保存
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Delete, DocumentAdd } from '@element-plus/icons-vue'

interface FormDefinition {
  formId: string
  name: string
  description?: string
}

interface FormHook {
  id?: string
  formId: string
  name: string
  type: string
  triggerType: string
  enabled?: boolean
  description?: string
  config: any
}

interface HookEditDialogProps {
  visible: boolean
  hookData: FormHook | null
  forms: FormDefinition[]
}

const props = defineProps<HookEditDialogProps>()
const emit = defineEmits<{
  'update:visible': [visible: boolean]
  'save': [hookData: FormHook]
  'close': []
}>()

const hookFormRef = ref<FormInstance>()
const saving = ref(false)

// 计算属性
const dialogTitle = computed(() => {
  return props.hookData?.id ? '编辑Hook' : '创建Hook'
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入Hook名称', trigger: 'blur' },
    { min: 2, max: 50, message: 'Hook名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  formId: [
    { required: true, message: '请选择所属表单', trigger: 'change' }
  ],
  type: [
    { required: true, message: '请选择Hook类型', trigger: 'change' }
  ],
  triggerType: [
    { required: true, message: '请选择触发时机', trigger: 'change' }
  ]
}

// 方法
const handleHookTypeChange = () => {
  // 根据Hook类型初始化配置
  const type = props.hookData?.type
  if (!props.hookData?.config) {
    if (props.hookData) {
      props.hookData.config = {}
    }
  }
  
  if (!props.hookData) return
  
  switch (type) {
    case 'javascript':
      props.hookData.config.code = props.hookData.config.code || ''
      break
    case 'http':
      props.hookData.config.url = props.hookData.config.url || ''
      props.hookData.config.method = props.hookData.config.method || 'POST'
      props.hookData.config.headers = props.hookData.config.headers || []
      props.hookData.config.body = props.hookData.config.body || ''
      break
    case 'database':
      props.hookData.config.operation = props.hookData.config.operation || 'insert'
      props.hookData.config.table = props.hookData.config.table || ''
      props.hookData.config.mapping = props.hookData.config.mapping || ''
      break
    case 'email':
      props.hookData.config.to = props.hookData.config.to || ''
      props.hookData.config.subject = props.hookData.config.subject || ''
      props.hookData.config.content = props.hookData.config.content || ''
      break
  }
}

const handleAddHeader = () => {
  if (!props.hookData?.config.headers) {
    if (props.hookData) {
      props.hookData.config.headers = []
    }
  }
  props.hookData?.config.headers?.push({ key: '', value: '' })
}

const handleRemoveHeader = (index: number) => {
  props.hookData?.config.headers?.splice(index, 1)
}

const handleFormatCode = () => {
  ElMessage.info('代码格式化功能开发中...')
}

const handleInsertTemplate = () => {
  if (!props.hookData) return
  
  const template = `// JavaScript Hook 模板
// 可用的变量：formData, context, result, utils

/**
 * 处理表单数据
 * @param {Object} formData - 表单提交数据
 * @param {Object} context - 上下文信息
 * @param {Object} result - 返回结果对象
 */
function processFormData(formData, context, result) {
  // 在这里编写你的业务逻辑
  
  // 示例：修改表单数据
  // formData.processedField = '已处理';
  
  // 示例：设置返回结果
  // result.success = true;
  // result.message = '处理成功';
  
  // 示例：调用工具函数
  // const timestamp = utils.getCurrentTimestamp();
  // formData.timestamp = timestamp;
  
  return formData;
}

// 执行处理函数
processFormData(formData, context, result);`

  props.hookData.config.code = template
  ElMessage.success('模板已插入')
}

const handleSave = async () => {
  if (!hookFormRef.value || !props.hookData) return

  try {
    await hookFormRef.value.validate()
    
    saving.value = true
    
    // 确保配置对象存在
    if (!props.hookData.config) {
      props.hookData.config = {}
    }
    
    // 发送保存事件
    emit('save', { ...props.hookData })
    
    // 关闭对话框
    emit('update:visible', false)
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  emit('update:visible', false)
  emit('close')
}

// 监听visible变化，初始化数据
watch(() => props.visible, (newVisible) => {
  if (newVisible && props.hookData) {
    // 确保配置对象存在
    if (!props.hookData.config) {
      props.hookData.config = {}
    }
    
    // 根据Hook类型初始化配置
    handleHookTypeChange()
  }
})
</script>

<style scoped>
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

.code-editor-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.code-editor {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
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

.form-tip {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 4px;
  line-height: 1.4;
}

.form-tip code {
  background: var(--bg-secondary);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .code-editor-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .code-editor-actions {
    justify-content: flex-end;
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
