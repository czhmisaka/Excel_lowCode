<template>
  <div class="public-form-container">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <span class="form-title">{{ formData.name }}</span>
          <div class="form-info">
            <el-tag v-if="formData.formId" type="primary">
              {{ formData.formId }}
            </el-tag>
            <el-tag v-if="formData.tableMapping" type="info">
              关联表: {{ formData.tableMapping }}
            </el-tag>
          </div>
        </div>
      </template>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-container">
        <el-alert :title="error" type="error" show-icon :closable="false" />
        <div class="error-actions">
          <el-button type="primary" @click="retryLoad">
            <el-icon>
              <Refresh />
            </el-icon>
            重新加载
          </el-button>
        </div>
      </div>

      <!-- 表单内容 -->
      <div v-else-if="formData.definition && formData.definition.fields && formData.definition.fields.length > 0" class="form-content">
        <DynamicFormRenderer
          :form-definition="formData.definition"
          :show-actions="true"
          :disabled="false"
          label-width="120px"
          @submit="handleFormSubmit"
          @reset="handleFormReset"
        />
      </div>

      <!-- 无表单字段状态 -->
      <div v-else class="empty-container">
        <el-empty description="表单定义为空或未配置字段" />
      </div>
    </el-card>

    <!-- 提交成功提示 -->
    <el-dialog v-model="successDialogVisible" title="提交成功" width="400px" :show-close="false"
      :close-on-click-modal="false" :close-on-press-escape="false" append-to-body>
      <div class="success-content">
        <el-result icon="success" title="表单提交成功" :sub-title="`成功提交了表单数据`">
          <template #extra>
            <el-button type="primary" @click="handleSuccessClose">
              继续填写
            </el-button>
            <el-button @click="goBack">
              返回
            </el-button>
          </template>
        </el-result>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { apiService } from '@/services/api'
import DynamicFormRenderer from '@/components/DynamicFormRenderer.vue'

const route = useRoute()
const router = useRouter()

// 状态管理
const loading = ref(true)
const error = ref('')
const successDialogVisible = ref(false)

// 表单数据
const formData = ref({
  formId: '',
  name: '',
  description: '',
  tableMapping: '',
  definition: {
    fields: []
  }
})

// 解析表单定义
const parseFormDefinition = (definition: any) => {
  if (!definition) {
    return { fields: [] }
  }
  
  // 如果definition是字符串，尝试解析为JSON
  if (typeof definition === 'string') {
    try {
      return JSON.parse(definition)
    } catch (error) {
      console.error('解析表单定义失败:', error)
      return { fields: [] }
    }
  }
  
  // 如果definition已经是对象，直接返回
  return definition
}

// 加载表单定义
const loadFormDefinition = async () => {
  const formId = route.params.formId as string
  if (!formId) {
    error.value = 'URL中缺少表单ID参数'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = ''

    // 使用公开表单API获取表单定义（免认证）
    const response = await apiService.getPublicFormDefinition(formId)
    formData.value = response.data

    // 解析表单定义
    if (formData.value.definition) {
      formData.value.definition = parseFormDefinition(formData.value.definition)
    }

    if (!formData.value.definition || !formData.value.definition.fields || formData.value.definition.fields.length === 0) {
      error.value = '表单未配置字段或表单定义为空'
    }

  } catch (err: any) {
    console.error('加载表单定义失败:', err)
    error.value = err.response?.data?.message || err.message || '加载表单定义失败'
  } finally {
    loading.value = false
  }
}

// 处理表单提交
const handleFormSubmit = async (formData: Record<string, any>) => {
  try {
    const formId = route.params.formId as string
    
    // 使用公开表单API提交数据（带Hook处理）
    await apiService.submitPublicFormData(formId, formData)

    // 显示成功提示
    successDialogVisible.value = true

  } catch (err: any) {
    console.error('提交表单数据失败:', err)
    ElMessage.error(err.response?.data?.message || err.message || '提交表单数据失败')
  }
}

// 处理表单重置
const handleFormReset = () => {
  // 可以在这里添加重置后的逻辑
  console.log('表单已重置')
}

// 重新加载
const retryLoad = () => {
  loadFormDefinition()
}

// 处理成功关闭
const handleSuccessClose = () => {
  successDialogVisible.value = false
  // 可以在这里添加重置表单的逻辑
  window.location.reload() // 简单刷新页面
}

// 返回上一页
const goBack = () => {
  router.back()
}

onMounted(() => {
  loadFormDefinition()
})
</script>

<style scoped>
.public-form-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.form-card {
  min-height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.form-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.form-info {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.loading-container,
.error-container,
.empty-container {
  padding: 40px 20px;
  text-align: center;
}

.error-actions {
  margin-top: 20px;
}

.form-content {
  padding: 20px 0;
}

.success-content {
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .public-form-container {
    padding: 10px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-info {
    margin-top: 10px;
  }
}
</style>
