<template>
  <el-dialog
    v-model="visible"
    title="Hook测试"
    width="600px"
    class="modern-dialog"
    :close-on-click-modal="false"
    append-to-body
  >
    <div class="hook-test-container">
      <!-- Hook基本信息 -->
      <div class="hook-info">
        <h4>Hook信息</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Hook名称:</span>
            <span class="value">{{ hook?.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">所属表单:</span>
            <span class="value">{{ hook?.formId }}</span>
          </div>
          <div class="info-item">
            <span class="label">Hook类型:</span>
            <span class="value">{{ getHookTypeText(hook?.type) }}</span>
          </div>
          <div class="info-item">
            <span class="label">触发时机:</span>
            <span class="value">{{ getTriggerTypeText(hook?.triggerType) }}</span>
          </div>
        </div>
      </div>

      <!-- 测试数据输入 -->
      <div class="test-data-section">
        <h4>测试数据</h4>
        <div class="form-data-editor">
          <div class="editor-header">
            <span>表单数据 (JSON格式)</span>
            <el-button type="text" @click="handleInsertSampleData" size="small">
              插入示例数据
            </el-button>
          </div>
          <el-input
            v-model="testData.formData"
            type="textarea"
            :rows="8"
            placeholder="请输入表单数据，JSON格式"
            class="json-editor"
            resize="none"
          />
          <div class="form-tip">
            支持标准的JSON格式，例如：{"name": "张三", "age": 25}
          </div>
        </div>
      </div>

      <!-- 上下文数据 -->
      <div class="context-data-section">
        <h4>上下文数据</h4>
        <div class="context-data-editor">
          <div class="editor-header">
            <span>上下文信息 (JSON格式)</span>
            <el-button type="text" @click="handleInsertSampleContext" size="small">
              插入示例上下文
            </el-button>
          </div>
          <el-input
            v-model="testData.context"
            type="textarea"
            :rows="6"
            placeholder="请输入上下文数据，JSON格式"
            class="json-editor"
            resize="none"
          />
          <div class="form-tip">
            包含表单ID、用户信息等上下文数据
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleExecuteTest" :loading="testing">
          执行测试
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

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

interface HookTestDialogProps {
  visible: boolean
  hook: FormHook | null
}

interface TestData {
  formData: string
  context: string
}

const props = defineProps<HookTestDialogProps>()
const emit = defineEmits<{
  'update:visible': [visible: boolean]
  'test': [testData: any]
  'close': []
}>()

const testing = ref(false)
const testData = ref<TestData>({
  formData: '',
  context: ''
})

// 方法
const getHookTypeText = (type?: string) => {
  const typeMap: Record<string, string> = {
    javascript: 'JavaScript',
    http: 'HTTP请求',
    database: '数据库操作',
    email: '邮件通知'
  }
  return type ? (typeMap[type] || type) : '-'
}

const getTriggerTypeText = (triggerType?: string) => {
  const triggerMap: Record<string, string> = {
    beforeSubmit: '提交前',
    afterSubmit: '提交后',
    beforeValidate: '验证前',
    afterValidate: '验证后'
  }
  return triggerType ? (triggerMap[triggerType] || triggerType) : '-'
}

const handleInsertSampleData = () => {
  const sampleData = {
    name: '张三',
    age: 25,
    email: 'zhangsan@example.com',
    department: '技术部',
    position: '前端工程师',
    signInTime: new Date().toISOString(),
    signOutTime: null,
    workHours: 0
  }
  testData.value.formData = JSON.stringify(sampleData, null, 2)
  ElMessage.success('示例数据已插入')
}

const handleInsertSampleContext = () => {
  const sampleContext = {
    formId: props.hook?.formId || 'labor_sign_in',
    userId: 'user_001',
    userName: '测试用户',
    timestamp: new Date().toISOString(),
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
  testData.value.context = JSON.stringify(sampleContext, null, 2)
  ElMessage.success('示例上下文已插入')
}

const handleExecuteTest = async () => {
  if (!props.hook) return

  try {
    // 验证JSON格式
    let parsedFormData
    let parsedContext
    
    try {
      parsedFormData = testData.value.formData ? JSON.parse(testData.value.formData) : {}
    } catch (error) {
      ElMessage.error('表单数据JSON格式错误')
      return
    }

    try {
      parsedContext = testData.value.context ? JSON.parse(testData.value.context) : {}
    } catch (error) {
      ElMessage.error('上下文数据JSON格式错误')
      return
    }

    testing.value = true

    // 发送测试事件
    const testPayload = {
      formData: parsedFormData,
      context: parsedContext
    }

    emit('test', testPayload)
    
    // 关闭对话框
    emit('update:visible', false)
  } catch (error) {
    console.error('测试执行失败:', error)
    ElMessage.error('测试执行失败')
  } finally {
    testing.value = false
  }
}

const handleCancel = () => {
  emit('update:visible', false)
  emit('close')
}

// 监听visible变化，重置数据
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    testData.value = {
      formData: '',
      context: ''
    }
  }
})
</script>

<style scoped>
.hook-test-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hook-info {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-base);
  padding: 16px;
  background: var(--bg-secondary);
}

.hook-info h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item .label {
  font-weight: 500;
  color: var(--text-secondary);
  margin-right: 8px;
  min-width: 80px;
}

.info-item .value {
  color: var(--text-primary);
  font-weight: 500;
}

.test-data-section,
.context-data-section {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-base);
  padding: 16px;
}

.test-data-section h4,
.context-data-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.editor-header span {
  font-weight: 500;
  color: var(--text-primary);
}

.json-editor {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.4;
}

.form-tip {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 4px;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .editor-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .editor-header .el-button {
    align-self: flex-end;
  }
}
</style>
