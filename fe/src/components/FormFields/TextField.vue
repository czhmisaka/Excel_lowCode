<template>
  <el-form-item 
    :label="field.label" 
    :prop="field.name" 
    :rules="rules"
    class="form-field"
  >
    <el-input
      v-model="fieldValue"
      :placeholder="field.placeholder || `请输入${field.label}`"
      :clearable="field.clearable !== false"
      :disabled="field.disabled"
      :maxlength="field.maxLength"
      :show-word-limit="field.showWordLimit"
      :type="field.type === 'password' ? 'password' : 'text'"
      @input="handleInput"
      @blur="handleBlur"
    >
      <template v-if="field.prefix" #prefix>
        <span class="prefix-text">{{ field.prefix }}</span>
      </template>
      <template v-if="field.suffix" #suffix>
        <span class="suffix-text">{{ field.suffix }}</span>
      </template>
    </el-input>
    <div v-if="field.description" class="field-description">
      {{ field.description }}
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface TextFieldProps {
  field: {
    name: string
    label: string
    type?: 'text' | 'password' | 'textarea'
    placeholder?: string
    required?: boolean
    disabled?: boolean
    clearable?: boolean
    maxLength?: number
    showWordLimit?: boolean
    prefix?: string
    suffix?: string
    description?: string
    validation?: {
      pattern?: string
      minLength?: number
      maxLength?: number
    }
  }
  modelValue?: string
}

const props = defineProps<TextFieldProps>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [value: string, field: string]
  'blur': [value: string, field: string]
}>()

const fieldValue = computed({
  get: () => props.modelValue || '',
  set: (value) => {
    emit('update:modelValue', value)
    emit('change', value, props.field.name)
  }
})

// 验证规则
const rules = computed(() => {
  const rules = []
  
  if (props.field.required) {
    rules.push({
      required: true,
      message: `${props.field.label}不能为空`,
      trigger: 'blur'
    })
  }
  
  if (props.field.validation?.pattern) {
    rules.push({
      pattern: new RegExp(props.field.validation.pattern),
      message: `${props.field.label}格式不正确`,
      trigger: 'blur'
    })
  }
  
  if (props.field.validation?.minLength) {
    rules.push({
      min: props.field.validation.minLength,
      message: `${props.field.label}至少需要${props.field.validation.minLength}个字符`,
      trigger: 'blur'
    })
  }
  
  if (props.field.validation?.maxLength) {
    rules.push({
      max: props.field.validation.maxLength,
      message: `${props.field.label}不能超过${props.field.validation.maxLength}个字符`,
      trigger: 'blur'
    })
  }
  
  return rules
})

const handleInput = (value: string) => {
  emit('change', value, props.field.name)
}

const handleBlur = (event: FocusEvent) => {
  const target = event.target as HTMLInputElement
  emit('blur', target.value, props.field.name)
}
</script>

<style scoped>
.form-field {
  margin-bottom: 20px;
}

.field-description {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.prefix-text,
.suffix-text {
  color: #909399;
  font-size: 14px;
}
</style>
