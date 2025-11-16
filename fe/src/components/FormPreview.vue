<!--
 * @Date: 2025-11-11 01:22:28
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-16 04:11:12
 * @FilePath: /lowCode_excel/fe/src/components/FormPreview.vue
-->
<template>
  <div class="form-preview">
    <div class="preview-header">
      <h3 class="preview-title">表单预览</h3>
      <p class="preview-description">实时预览表单效果，支持表单填写测试</p>
    </div>
    
    <div class="preview-content">
      <DynamicFormRenderer
        :form-definition="getParsedFormDefinition()"
        :show-actions="true"
        :disabled="false"
        label-width="120px"
        @submit="handleFormSubmit"
        @change="handleFormChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import DynamicFormRenderer from './DynamicFormRenderer.vue'

interface FormPreviewProps {
  formData: any
}

const props = defineProps<FormPreviewProps>()

// 解析表单定义
const getParsedFormDefinition = () => {
  if (!props.formData || !props.formData.definition) {
    return { fields: [] }
  }
  
  const definition = props.formData.definition
  
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

// 处理表单提交
const handleFormSubmit = (formData: any) => {
  ElMessage.success('表单提交成功！提交数据：' + JSON.stringify(formData, null, 2))
  console.log('表单提交数据:', formData)
}

// 处理表单变化
const handleFormChange = (formData: any) => {
  console.log('表单数据变化:', formData)
}
</script>

<style scoped>
.form-preview {
  padding: 20px;
}

.preview-header {
  margin-bottom: 24px;
  text-align: center;
}

.preview-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.preview-description {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.preview-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-preview {
    padding: 16px;
  }
  
  .preview-content {
    padding: 16px;
  }
}
</style>
