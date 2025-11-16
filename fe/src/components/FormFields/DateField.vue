<template>
  <el-form-item 
    :label="field.label" 
    :prop="field.name" 
    :rules="rules"
    class="form-field"
  >
    <el-date-picker
      v-model="fieldValue"
      :type="field.type || 'date'"
      :placeholder="field.placeholder || `请选择${field.label}`"
      :disabled="field.disabled"
      :clearable="field.clearable !== false"
      :format="field.format"
      :value-format="field.valueFormat"
      :start-placeholder="field.startPlaceholder"
      :end-placeholder="field.endPlaceholder"
      :range-separator="field.rangeSeparator || '至'"
      style="width: 100%"
      @change="handleChange"
      @blur="handleBlur"
    />
    <div v-if="field.description" class="field-description">
      {{ field.description }}
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface DateFieldProps {
  field: {
    name: string
    label: string
    type?: 'date' | 'datetime' | 'daterange' | 'datetimerange'
    placeholder?: string
    required?: boolean
    disabled?: boolean
    clearable?: boolean
    format?: string
    valueFormat?: string
    startPlaceholder?: string
    endPlaceholder?: string
    rangeSeparator?: string
    description?: string
    validation?: {
      minDate?: string
      maxDate?: string
    }
  }
  modelValue?: string | string[]
}

const props = defineProps<DateFieldProps>()
const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
  'change': [value: string | string[], field: string]
  'blur': [value: string | string[], field: string]
}>()

const fieldValue = computed({
  get: () => props.modelValue,
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
      message: `请选择${props.field.label}`,
      trigger: 'change'
    })
  }
  
  if (props.field.validation?.minDate) {
    rules.push({
      validator: (rule: any, value: any, callback: any) => {
        if (!value) {
          callback()
          return
        }
        
        const selectedDate = new Date(value)
        const minDate = new Date(props.field.validation!.minDate!)
        
        if (selectedDate < minDate) {
          callback(new Error(`${props.field.label}不能早于${props.field.validation!.minDate}`))
        } else {
          callback()
        }
      },
      trigger: 'change'
    })
  }
  
  if (props.field.validation?.maxDate) {
    rules.push({
      validator: (rule: any, value: any, callback: any) => {
        if (!value) {
          callback()
          return
        }
        
        const selectedDate = new Date(value)
        const maxDate = new Date(props.field.validation!.maxDate!)
        
        if (selectedDate > maxDate) {
          callback(new Error(`${props.field.label}不能晚于${props.field.validation!.maxDate}`))
        } else {
          callback()
        }
      },
      trigger: 'change'
    })
  }
  
  return rules
})

const handleChange = (value: string | string[] | null) => {
  if (value !== null) {
    emit('change', value, props.field.name)
  }
}

const handleBlur = () => {
  if (fieldValue.value !== undefined) {
    emit('blur', fieldValue.value, props.field.name)
  }
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
