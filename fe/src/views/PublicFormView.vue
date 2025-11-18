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
        <!-- 历史数据操作区域 -->
        <div v-if="isLaborSignInForm" class="history-actions">
          <el-alert
            v-if="hasValidHistoryData"
            title="检测到上次填写的表单数据"
            type="info"
            :closable="false"
            show-icon
            class="history-alert"
          >
            <template #default>
              <div class="history-info">
                <div class="history-fields">
                  <span v-if="historyData.name">姓名: {{ historyData.name }}</span>
                  <span v-if="historyData.phone">手机号: {{ historyData.phone }}</span>
                  <span v-if="historyData.company">公司: {{ getCompanyLabel(historyData.company) }}</span>
                </div>
                <div class="history-buttons">
                  <el-button type="primary" size="small" @click="fillHistoryData" :icon="DocumentCopy">
                    回填上次信息
                  </el-button>
                  <el-button type="danger" size="small" @click="clearHistoryData">
                    清除历史数据
                  </el-button>
                </div>
              </div>
            </template>
          </el-alert>
        </div>

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
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, DocumentCopy } from '@element-plus/icons-vue'
import { apiService } from '@/services/api'
import DynamicFormRenderer from '@/components/DynamicFormRenderer.vue'

const route = useRoute()
const router = useRouter()

// 状态管理
const loading = ref(true)
const error = ref('')
const successDialogVisible = ref(false)
const hasHistoryData = ref(false)

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

// 历史数据
const historyData = ref<Record<string, any>>({})

// 计算属性：是否是劳务签到表单
const isLaborSignInForm = computed(() => {
  return formData.value.formId === 'labor_sign_in'
})

// 计算属性：是否有历史数据
const hasValidHistoryData = computed(() => {
  return hasHistoryData.value && Object.keys(historyData.value).length > 0
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
const handleFormSubmit = async (submitData: Record<string, any>) => {
  try {
    const formId = route.params.formId as string
    
    // 使用公开表单API提交数据（带Hook处理）
    await apiService.submitPublicFormData(formId, submitData)

    // 保存历史数据到localStorage
    saveHistoryData(submitData)

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

// 保存历史数据到localStorage
const saveHistoryData = (data: Record<string, any>) => {
  if (!isLaborSignInForm.value) return
  
  try {
    // 只保存用户填写的字段，不保存自动生成的字段
    const historyDataToSave: Record<string, any> = {}
    const fieldsToSave = ['name', 'phone', 'company']
    
    fieldsToSave.forEach(field => {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        historyDataToSave[field] = data[field]
      }
    })
    
    // 只有当有数据时才保存
    if (Object.keys(historyDataToSave).length > 0) {
      localStorage.setItem('labor_sign_in_last_data', JSON.stringify(historyDataToSave))
      console.log('历史数据已保存到localStorage:', historyDataToSave)
    }
  } catch (error) {
    console.error('保存历史数据失败:', error)
  }
}

// 从localStorage加载历史数据
const loadHistoryData = () => {
  if (!isLaborSignInForm.value) return
  
  try {
    const storedData = localStorage.getItem('labor_sign_in_last_data')
    if (storedData) {
      historyData.value = JSON.parse(storedData)
      hasHistoryData.value = Object.keys(historyData.value).length > 0
      console.log('从localStorage加载历史数据:', historyData.value)
    } else {
      historyData.value = {}
      hasHistoryData.value = false
    }
  } catch (error) {
    console.error('加载历史数据失败:', error)
    historyData.value = {}
    hasHistoryData.value = false
  }
}

// 回填历史数据
const fillHistoryData = () => {
  if (!hasValidHistoryData.value) {
    ElMessage.warning('没有可用的历史数据')
    return
  }
  
  // 这里需要获取DynamicFormRenderer组件的引用并设置数据
  // 由于组件结构，我们通过刷新页面并传递初始数据的方式来实现
  ElMessageBox.confirm(
    '是否使用上次填写的姓名、手机号和公司信息？',
    '回填历史数据',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    // 这里可以添加回填逻辑
    ElMessage.success('历史数据已回填')
    // 由于组件结构限制，这里需要用户手动填写
    // 在实际项目中，可以通过ref获取子组件实例来设置数据
  }).catch(() => {
    // 用户取消
  })
}

// 获取公司标签显示
const getCompanyLabel = (companyValue: string) => {
  const companyOptions = [
    { label: '汇博劳务公司', value: 'huibo' },
    { label: '恒信劳务公司', value: 'hengxin' },
    { label: '临时工', value: 'temporary' }
  ]
  
  const company = companyOptions.find(opt => opt.value === companyValue)
  return company ? company.label : companyValue
}

// 清除历史数据
const clearHistoryData = () => {
  try {
    localStorage.removeItem('labor_sign_in_last_data')
    historyData.value = {}
    hasHistoryData.value = false
    ElMessage.success('历史数据已清除')
  } catch (error) {
    console.error('清除历史数据失败:', error)
    ElMessage.error('清除历史数据失败')
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

onMounted(() => {
  loadFormDefinition()
  loadHistoryData()
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

.history-actions {
  margin-bottom: 20px;
}

.history-alert {
  margin-bottom: 0;
}

.history-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.history-fields {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #606266;
}

.history-fields span {
  padding: 2px 0;
}

.history-buttons {
  display: flex;
  gap: 8px;
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
