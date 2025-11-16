<template>
  <el-form-item 
    :label="field.label" 
    :prop="field.name" 
    :rules="rules"
    class="form-field"
  >
    <el-select
      v-model="fieldValue"
      :placeholder="field.placeholder || `请选择${field.label}`"
      :clearable="field.clearable !== false"
      :disabled="field.disabled"
      :multiple="field.multiple"
      :filterable="field.filterable"
      :allow-create="field.allowCreate"
      style="width: 100%"
      @change="handleChange"
      @blur="handleBlur"
    >
      <el-option
        v-for="option in options"
        :key="getOptionKey(option)"
        :label="getOptionLabel(option)"
        :value="getOptionValue(option)"
      />
    </el-select>
    <div v-if="field.description" class="field-description">
      {{ field.description }}
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface SelectFieldProps {
  field: {
    name: string
    label: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    clearable?: boolean
    multiple?: boolean
    filterable?: boolean
    allowCreate?: boolean
    description?: string
    options: Array<string | { label: string; value: any }>
  }
  modelValue?: any
}

const props = defineProps<SelectFieldProps>()
const emit = defineEmits<{
  'update:modelValue': [value: any]
  'change': [value: any, field: string]
  'blur': [value: any, field: string]
}>()

const fieldValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
    emit('change', value, props.field.name)
  }
})

// 处理选项数据
const options = computed(() => {
  return props.field.options || []
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
  
  return rules
})

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

const handleChange = (value: any) => {
  emit('change', value, props.field.name)
}

const handleBlur = () => {
  emit('blur', fieldValue.value, props.field.name)
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
