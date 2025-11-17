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
              <el-icon>
                <Document />
              </el-icon>
              字段: {{ formData.fieldCount || 0 }}
            </el-tag>
            <el-tag type="info" class="modern-tag">
              <el-icon>
                <Connection />
              </el-icon>
              Hook: {{ formData.hookCount || 0 }}
            </el-tag>
            <el-tag type="info" class="modern-tag">
              <el-icon>
                <Calendar />
              </el-icon>
              更新: {{ formatDate(formData.updatedAt) }}
            </el-tag>
          </div>
        </div>
        <div class="header-right">
          <el-button-group>
            <el-button @click="handleBack" :icon="ArrowLeft" class="modern-button">
              返回列表
            </el-button>
            <el-button type="primary" @click="handleSave" :loading="saving" :icon="Check" class="modern-button">
              保存配置
            </el-button>
            <el-button type="success" @click="generateQRCode" :icon="DataBoard" class="modern-button">
              生成二维码
            </el-button>
          </el-button-group>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Check, Document, Connection, Calendar, DataBoard } from '@element-plus/icons-vue'
import { apiService } from '@/services/api'
import FormFieldsConfig from '@/components/FormFieldsConfig.vue'
import FormHooksConfig from '@/components/FormHooksConfig.vue'
import FormPreview from '@/components/FormPreview.vue'
import QRCode from 'qrcode'

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
    if (typeof response.data.definition == 'string') {
      Object.keys(JSON.parse(response.data.definition)).map(key => {
        if (key.length > 2) {
          definition[key] = JSON.parse(response.data.definition)[key]
        }
      })
    } else {
      definition = response.data.definition
    }
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
  let definition = {} as any
  Object.keys(formData.value.definition).map(key => {
    console.log('处理定义键:', key, typeof key)
    if (['fields'].indexOf(key) > -1) {
      definition[key] = formData.value.definition[key]
    }
  })
  try {
    await apiService.updateForm(formId.value, {
      definition
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

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 生成二维码
const generateQRCode = async () => {
  if (!formId.value) {
    ElMessage.warning('请先加载表单数据')
    return
  }

  try {
    // 构建表单填写页面的URL
    const formUrl = `${window.location.origin}/form/${formId.value}`

    // 生成二维码
    const qrCodeDataUrl = await QRCode.toDataURL(formUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // 创建弹窗显示二维码
    ElMessageBox.alert(
      `
      <div style="text-align: center;">
        <img src="${qrCodeDataUrl}" alt="表单填写二维码" style="width: 100%; max-width: 300px; height: auto;" />
        <p style="margin-top: 16px; color: #666;">
          <strong>表单链接：</strong><br>
          <span style="word-break: break-all; font-size: 12px;">${formUrl}</span>
        </p>
        <p style="margin-top: 8px; color: #999; font-size: 12px;">
          使用手机扫描二维码即可访问表单填写页面
        </p>
      </div>
      `,
      '表单填写二维码',
      {
        dangerouslyUseHTMLString: true,
        customClass: 'modern-dialog',
        showConfirmButton: true,
        confirmButtonText: '复制链接',
        callback: async (action: string) => {
          if (action === 'confirm') {
            try {
              await navigator.clipboard.writeText(formUrl)
              ElMessage.success('表单链接已复制到剪贴板')
            } catch (error) {
              console.error('复制失败:', error)
              // 备用复制方法
              const textArea = document.createElement('textarea')
              textArea.value = formUrl
              document.body.appendChild(textArea)
              textArea.select()
              document.execCommand('copy')
              document.body.removeChild(textArea)
              ElMessage.success('表单链接已复制到剪贴板')
            }
          }
        }
      }
    )
  } catch (error) {
    console.error('生成二维码失败:', error)
    ElMessage.error('生成二维码失败')
  }
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

.header-left h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-left p {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: var(--text-secondary);
  font-weight: 400;
}

.form-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.form-stats .modern-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-base);
  font-weight: 500;
  border: none;
  box-shadow: var(--shadow-sm);
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.modern-tabs {
  margin-top: 0;
}

.modern-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.modern-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0 16px;
}

.modern-tabs :deep(.el-tabs__item) {
  font-weight: 500;
  padding: 12px 20px;
  transition: all var(--transition-base);
}

.modern-tabs :deep(.el-tabs__item.is-active) {
  color: var(--primary-color);
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.08) 0%, rgba(64, 169, 255, 0.04) 100%);
}

.modern-tabs :deep(.el-tabs__item:hover) {
  color: var(--primary-hover);
}

.loading-state {
  padding: 40px 0;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 20px;
  }

  .header-left h1 {
    font-size: 24px;
  }

  .header-left p {
    font-size: 14px;
  }

  .form-stats {
    gap: 8px;
  }

  .form-stats .modern-tag {
    padding: 4px 8px;
    font-size: 12px;
  }

  .header-right {
    width: 100%;
    justify-content: flex-end;
  }

  .header-right .el-button-group {
    width: 100%;
    display: flex;
  }

  .header-right .el-button-group .el-button {
    flex: 1;
  }

  .modern-tabs :deep(.el-tabs__item) {
    padding: 8px 12px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .form-stats {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-right .el-button-group {
    flex-direction: column;
  }
}
</style>
