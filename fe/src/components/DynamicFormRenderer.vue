<template>
  <div class="dynamic-form-renderer">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-width="labelWidth"
      :label-position="labelPosition"
      :disabled="disabled"
      class="dynamic-form"
    >
      <template v-if="formDefinition && formDefinition.fields" v-for="field in formDefinition.fields" :key="field.name">
        <!-- 文本字段 -->
        <TextField
          v-if="field.type === 'text' || field.type === 'password'"
          :field="{
            name: field.name,
            label: field.label,
            type: field.type as 'text' | 'password',
            placeholder: field.placeholder,
            required: field.required,
            disabled: field.disabled,
            clearable: field.clearable,
            maxLength: field.maxLength,
            showWordLimit: field.showWordLimit,
            prefix: field.prefix,
            suffix: field.suffix,
            description: field.description,
            validation: field.validation
          }"
          v-model="formData[field.name]"
          @change="handleFieldChange"
          @blur="handleFieldBlur"
        />

        <!-- 数字字段 -->
        <NumberField
          v-else-if="field.type === 'number'"
          :field="{
            name: field.name,
            label: field.label,
            placeholder: field.placeholder,
            required: field.required,
            disabled: field.disabled,
            step: field.step,
            precision: field.precision,
            controlsPosition: field.controlsPosition,
            description: field.description,
            validation: field.validation
          }"
          v-model="formData[field.name]"
          @change="handleFieldChange"
          @blur="handleFieldBlur"
        />

        <!-- 选择字段 -->
        <SelectField
          v-else-if="field.type === 'select'"
          :field="{
            name: field.name,
            label: field.label,
            placeholder: field.placeholder,
            required: field.required,
            disabled: field.disabled,
            clearable: field.clearable,
            multiple: field.multiple,
            filterable: field.filterable,
            allowCreate: field.allowCreate,
            description: field.description,
            options: field.options || []
          }"
          v-model="formData[field.name]"
          @change="handleFieldChange"
          @blur="handleFieldBlur"
        />

        <!-- 日期字段 -->
        <DateField
          v-else-if="field.type === 'date' || field.type === 'datetime' || field.type === 'daterange' || field.type === 'datetimerange'"
          :field="{
            name: field.name,
            label: field.label,
            type: field.type as 'date' | 'datetime' | 'daterange' | 'datetimerange',
            placeholder: field.placeholder,
            required: field.required,
            disabled: field.disabled,
            clearable: field.clearable,
            format: field.format,
            valueFormat: field.valueFormat,
            startPlaceholder: field.startPlaceholder,
            endPlaceholder: field.endPlaceholder,
            rangeSeparator: field.rangeSeparator,
            description: field.description,
            validation: field.validation
          }"
          v-model="formData[field.name]"
          @change="handleFieldChange"
          @blur="handleFieldBlur"
        />

        <!-- 复选框字段 -->
        <el-form-item
          v-else-if="field.type === 'checkbox'"
          :label="field.label"
          :prop="field.name"
          :rules="getFieldRules(field)"
          class="form-field"
        >
          <el-checkbox
            v-model="formData[field.name]"
            :disabled="field.disabled"
            @change="handleFieldChange"
          >
            {{ field.label }}
          </el-checkbox>
          <div v-if="field.description" class="field-description">
            {{ field.description }}
          </div>
        </el-form-item>

        <!-- 单选框字段 -->
        <el-form-item
          v-else-if="field.type === 'radio'"
          :label="field.label"
          :prop="field.name"
          :rules="getFieldRules(field)"
          class="form-field"
        >
          <el-radio-group
            v-model="formData[field.name]"
            :disabled="field.disabled"
            @change="handleFieldChange"
          >
            <el-radio
              v-for="option in field.options"
              :key="getOptionKey(option)"
              :label="getOptionValue(option)"
            >
              {{ getOptionLabel(option) }}
            </el-radio>
          </el-radio-group>
          <div v-if="field.description" class="field-description">
            {{ field.description }}
          </div>
        </el-form-item>

        <!-- 文本域字段 -->
        <el-form-item
          v-else-if="field.type === 'textarea'"
          :label="field.label"
          :prop="field.name"
          :rules="getFieldRules(field)"
          class="form-field"
        >
          <el-input
            v-model="formData[field.name]"
            type="textarea"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :disabled="field.disabled"
            :rows="field.rows || 4"
            :maxlength="field.maxLength"
            :show-word-limit="field.showWordLimit"
            @input="handleFieldChange"
            @blur="handleFieldBlur"
          />
          <div v-if="field.description" class="field-description">
            {{ field.description }}
          </div>
        </el-form-item>

        <!-- 未知字段类型 -->
        <div v-else class="unknown-field">
          <el-alert
            :title="`未知字段类型: ${field.type}`"
            type="warning"
            :closable="false"
          />
        </div>
      </template>

      <!-- 表单操作按钮 -->
      <div v-if="showActions" class="form-actions">
        <el-button
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
          class="submit-button"
        >
          {{ submitText }}
        </el-button>
        <el-button
          v-if="showReset"
          @click="handleReset"
          class="reset-button"
        >
          重置
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElForm, ElMessage } from 'element-plus'
import TextField from './FormFields/TextField.vue'
import NumberField from './FormFields/NumberField.vue'
import SelectField from './FormFields/SelectField.vue'
import DateField from './FormFields/DateField.vue'

interface FormField {
  name: string
  label: string
  type: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  description?: string
  options?: Array<string | { label: string; value: any }>
  validation?: any
  [key: string]: any
}

interface FormDefinition {
  fields: FormField[]
  [key: string]: any
}

interface DynamicFormRendererProps {
  formDefinition: FormDefinition
  initialData?: Record<string, any>
  labelWidth?: string
  labelPosition?: 'left' | 'right' | 'top'
  disabled?: boolean
  showActions?: boolean
  showReset?: boolean
  submitText?: string
}

const props = withDefaults(defineProps<DynamicFormRendererProps>(), {
  labelWidth: '120px',
  labelPosition: 'right',
  disabled: false,
  showActions: true,
  showReset: true,
  submitText: '提交'
})

const emit = defineEmits<{
  'submit': [data: Record<string, any>]
  'change': [data: Record<string, any>]
  'field-change': [value: any, field: string]
  'field-blur': [value: any, field: string]
}>()

const formRef = ref<InstanceType<typeof ElForm>>()
const formData = ref<Record<string, any>>({})
const submitting = ref(false)

// 初始化表单数据
const initFormData = () => {
  const data: Record<string, any> = {}
  
  // 检查formDefinition和fields是否存在
  if (!props.formDefinition || !props.formDefinition.fields) {
    formData.value = data
    return
  }
  
  props.formDefinition.fields.forEach(field => {
    // 设置默认值
    if (props.initialData && props.initialData[field.name] !== undefined) {
      data[field.name] = props.initialData[field.name]
    } else if (field.defaultValue !== undefined) {
      data[field.name] = field.defaultValue
    } else {
      // 根据字段类型设置默认值
      switch (field.type) {
        case 'text':
        case 'password':
        case 'textarea':
          data[field.name] = ''
          break
        case 'number':
          data[field.name] = 0
          break
        case 'checkbox':
          data[field.name] = false
          break
        case 'select':
        case 'radio':
        case 'date':
        case 'datetime':
          data[field.name] = null
          break
        case 'daterange':
        case 'datetimerange':
          data[field.name] = []
          break
        default:
          data[field.name] = null
      }
    }
  })
  
  formData.value = data
}

// 表单验证规则
const formRules = computed(() => {
  const rules: Record<string, any[]> = {}
  
  if (!props.formDefinition || !props.formDefinition.fields) {
    return rules
  }
  
  props.formDefinition.fields.forEach(field => {
    const fieldRules = getFieldRules(field)
    if (fieldRules.length > 0) {
      rules[field.name] = fieldRules
    }
  })
  
  return rules
})

// 获取字段验证规则
const getFieldRules = (field: FormField) => {
  const rules = []
  
  if (field.required) {
    rules.push({
      required: true,
      message: `${field.label}不能为空`,
      trigger: field.type === 'select' || field.type === 'radio' ? 'change' : 'blur'
    })
  }
  
  // 添加自定义验证规则
  if (field.validation) {
    // 只有当pattern不为空字符串时才添加正则验证
    if (field.validation.pattern && field.validation.pattern.trim() !== '') {
      try {
        rules.push({
          pattern: new RegExp(field.validation.pattern),
          message: field.validation.message || `${field.label}格式不正确`,
          trigger: 'blur'
        })
      } catch (error) {
        console.error(`正则表达式格式错误: ${field.validation.pattern}`, error)
        // 如果正则表达式格式错误，不添加验证规则
      }
    }
    
    if (field.validation.min !== undefined) {
      rules.push({
        type: 'number',
        min: field.validation.min,
        message: field.validation.message || `${field.label}不能小于${field.validation.min}`,
        trigger: 'blur'
      })
    }
    
    if (field.validation.max !== undefined) {
      rules.push({
        type: 'number',
        max: field.validation.max,
        message: field.validation.message || `${field.label}不能大于${field.validation.max}`,
        trigger: 'blur'
      })
    }
  }
  
  return rules
}

// 获取选项的key
const getOptionKey = (option: any) => {
  if (typeof option === 'string') {
    return option
  }
  return option.value
}

// 获取选项的显示标签
const getOptionLabel = (option: any) => {
  if (typeof option === 'string') {
    return option
  }
  return option.label
}

// 获取选项的值
const getOptionValue = (option: any) => {
  if (typeof option === 'string') {
    return option
  }
  return option.value
}

// 处理字段变化
const handleFieldChange = (value: any, field: string) => {
  emit('field-change', value, field)
  emit('change', formData.value)
}

// 处理字段失去焦点
const handleFieldBlur = (value: any, field: string) => {
  emit('field-blur', value, field)
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    const valid = await formRef.value.validate()
    if (valid) {
      submitting.value = true
      emit('submit', formData.value)
    }
  } catch (error) {
    ElMessage.error('表单验证失败，请检查输入')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const handleReset = () => {
  formRef.value?.resetFields()
  initFormData()
}

// 验证表单
const validate = () => {
  return formRef.value?.validate()
}

// 重置验证
const clearValidate = () => {
  formRef.value?.clearValidate()
}

// 暴露方法给父组件
defineExpose({
  validate,
  clearValidate,
  reset: handleReset
})

// 监听表单定义变化
watch(() => props.formDefinition, () => {
  nextTick(() => {
    initFormData()
  })
}, { deep: true })

// 初始化
initFormData()
</script>

<style scoped>
.dynamic-form-renderer {
  width: 100%;
}

.dynamic-form {
  max-width: 800px;
}

.form-field {
  margin-bottom: 20px;
}

.field-description {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.unknown-field {
  margin-bottom: 20px;
}

.form-actions {
  margin-top: 24px;
  text-align: center;
}

.submit-button {
  margin-right: 12px;
}

@media (max-width: 768px) {
  .dynamic-form {
    max-width: 100%;
  }
  
  .form-actions {
    text-align: left;
  }
}
</style>
