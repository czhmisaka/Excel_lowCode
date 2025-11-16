<template>
  <el-form-item 
    :label="field.label" 
    :prop="field.name" 
    :rules="rules"
    class="form-field"
  >
    <el-input-number
      v-model="fieldValue"
      :placeholder="field.placeholder || `请输入${field.label}`"
      :disabled="field.disabled"
      :min="field.validation?.min"
      :max="field.validation?.max"
      :step="field.step || 1"
      :precision="field.precision || 0"
      :controls-position="field.controlsPosition"
      @change="handleChange"
      @blur="handleBlur"
      style="width: 100%"
    />
    <div v-if="field.description" class="field-description">
      {{ field.description }}
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface NumberFieldProps {
  field: {
    name: string
    label: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    step?: number
    precision?: number
    controlsPosition?: 'right' | ''
    description?: string
    validation?: {
      min?: number
      max?: number
    }
  }
  modelValue?: number
}

const props = defineProps<NumberFieldProps>()
const emit = defineEmits<{
  'update:modelValue': [value: number]
  'change': [value: number, field: string]
  'blur': [value: number, field: string]
}>()

const fieldValue = computed({
  get: () => props.modelValue || 0,
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
  
  if (props.field.validation?.min !== undefined) {
    rules.push({
      type: 'number',
      min: props.field.validation.min,
      message: `${props.field.label}不能小于${props.field.validation.min}`,
      trigger: 'blur'
    })
  }
  
  if (props.field.validation?.max !== undefined) {
    rules.push({
      type: 'number',
      max: props.field.validation.max,
      message: `${props.field.label}不能大于${props.field.validation.max}`,
      trigger: 'blur'
    })
  }
  
  return rules
})

const handleChange = (value: number) => {
  emit('change', value, props.field.name)
}

const handleBlur = (event: FocusEvent) => {
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value) || 0
  emit('blur', value, props.field.name)
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
</style>
