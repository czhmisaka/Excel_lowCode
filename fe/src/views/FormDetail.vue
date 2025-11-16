<template>
  <div class="form-detail fade-in-up">
    <!-- 现代化页面头部 -->
    <div class="modern-page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>{{ formData.name }}</h1>
          <p>{{ formData.description || '表单详情配置' }}</p>
          <div class="form-stats">
            <el-tag type="info" class="modern-tag">
              <el-icon><Document /></el-icon>
              字段: {{ formData.fieldCount || 0 }}
            </el-tag>
            <el-tag type="info" class="modern-tag">
            <el-button type="primary" @click="handleSave" :loading="saving" :icon="Check" class="modern-button">
              保存配置
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 标签页导航 -->
    <div class="modern-card">
      <el-tabs v-model="activeTab" type="card" class="modern-tabs">
        <el-tab-pane label="字段配置" name="fields">
          <FormFieldsConfig :form-data="formData" @update="handleFormUpdate" />
        </el-tab-pane>
        <el-tab-pane label="Hook配置" name="hooks">
          <FormHooksConfig v-if="formId" :form-id="formId" @update="handleFormUpdate" />
          <div v-else class="loading-state">
            <el-empty description="正在加载表单数据..." />
          </div>
        </el-tab-pane>
        <el-tab-pane label="表单预览" name="preview">
          <FormPreview :form-data="formData" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Check } from '@element-plus/icons-vue'
import { apiService } from '@/services/api'
import FormFieldsConfig from '@/components/FormFieldsConfig.vue'
import FormHooksConfig from '@/components/FormHooksConfig.vue'
import FormPreview from '@/components/FormPreview.vue'

interface FormDefinition {
  id?: string
  formId: string
  name: string
  description?: string
  tableMapping?: string
  definition?: any
  createdAt?: string
  updatedAt?: string
  fieldCount?: number
  hookCount?: number
  fields?: any[]
}

const route = useRoute()
const router = useRouter()

const formId = ref('')
const formData = ref<FormDefinition>({
  formId: '',
  name: '',
  description: '',
  tableMapping: ''
})
const activeTab = ref('fields')

// 监听URL参数变化
watch(() => route.query.tab, (newTab) => {
  if (newTab && ['fields', 'hooks', 'preview'].includes(newTab as string)) {
    activeTab.value = newTab as string
  }
}, { immediate: true })
const saving = ref(false)
const loading = ref(false)

// 初始化数据
const initData = async () => {
  loading.value = true
  try {
    const formIdFromRoute = route.params.id as string
    console.log('路由参数ID:', formIdFromRoute)
    formId.value = formIdFromRoute

    console.log('正在请求表单详情，formId:', formIdFromRoute)
    let response = await apiService.getForm(formIdFromRoute)
    let definition = {} as any
    Object.keys(JSON.parse(response.data.definition)).map(key => {
      if (key.length > 2) {
        definition[key] = JSON.parse(response.data.definition)[key]
      }
    })
    response.data.definition = definition
    console.log('表单详情响应:', response.data)
    formData.value = response.data
  } catch (error) {
    console.error('获取表单详情失败:', error)
    ElMessage.error('获取表单详情失败')
  } finally {
    loading.value = false
  }
}

// 保存表单配置
const handleSave = async () => {
  saving.value = true
  console.log('正在保存表单配置，formId:', formId.value, formData.value)
  try {
    await apiService.updateForm(formId.value, {
      definition: formData.value.definition
    })
    ElMessage.success('表单配置保存成功')
  } catch (error) {
    console.error('保存表单配置失败:', error)
    ElMessage.error('保存表单配置失败')
  } finally {
    saving.value = false
  }
}

// 处理表单更新
const handleFormUpdate = (updatedData: any) => {
  formData.value = { ...formData.value, ...updatedData }
}

// 返回列表
const handleBack = () => {
  router.push('/forms')
}

onMounted(() => {
  initData()
})
</script>

<style scoped>
.form-detail {
  padding: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.page-description {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.modern-tabs {
  margin-top: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
  }

  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
