<template>
  <div class="form-fields-config">
    <!-- 工具栏 -->
    <div class="modern-toolbar">
      <div class="toolbar-content">
        <el-button type="primary" @click="handleAddField" class="modern-button" :icon="Plus">
          添加字段
        </el-button>
        <div class="toolbar-actions">
          <el-button type="text" @click="handleImportFields" :icon="Upload">
            导入字段
          </el-button>
          <el-button type="text" @click="handleExportFields" :icon="Download">
            导出字段
          </el-button>
        </div>
      </div>
    </div>

    <!-- 字段列表 -->
    <div class="modern-card">
      <el-table
        :data="fields"
        stripe
        class="modern-table"
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="字段名" min-width="120">
          <template #default="scope">
            <el-input
              v-model="scope.row.name"
              placeholder="字段名"
              size="small"
              @blur="handleFieldChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="label" label="显示标签" min-width="120">
          <template #default="scope">
            <el-input
              v-model="scope.row.label"
              placeholder="显示标签"
              size="small"
              @blur="handleFieldChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="type" label="字段类型" width="120">
          <template #default="scope">
            <el-select
              v-model="scope.row.type"
              placeholder="选择类型"
              size="small"
              style="width: 100%"
              @change="handleFieldChange(scope.row)"
            >
              <el-option label="文本" value="text" />
              <el-option label="数字" value="number" />
              <el-option label="选择" value="select" />
              <el-option label="日期" value="date" />
              <el-option label="日期时间" value="datetime" />
              <el-option label="复选框" value="checkbox" />
              <el-option label="单选框" value="radio" />
              <el-option label="文本域" value="textarea" />
              <el-option label="密码" value="password" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="required" label="必填" width="80" align="center">
          <template #default="scope">
            <el-checkbox
              v-model="scope.row.required"
              @change="handleFieldChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="mapping" label="映射字段" min-width="120">
          <template #default="scope">
            <el-select
              v-model="scope.row.mapping"
              placeholder="映射字段"
              size="small"
              style="width: 100%"
              filterable
              clearable
              @change="handleFieldChange(scope.row)"
            >
              <el-option label="使用字段名" value="" />
              <el-option
                v-for="column in tableColumns"
                :key="column.name"
                :label="`${column.name} (${column.type})`"
                :value="column.name"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              link
              size="small"
              @click="handleEditField(scope.row)"
              :icon="Edit"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              @click="handleDeleteField(scope.$index)"
              :icon="Delete"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="fields.length === 0" class="empty-state">
        <el-empty description="暂无字段配置">
          <el-button type="primary" @click="handleAddField" :icon="Plus">
            添加第一个字段
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 字段编辑对话框 -->
    <el-dialog
      v-model="fieldDialogVisible"
      :title="fieldDialogTitle"
      width="600px"
      class="modern-dialog"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form
        ref="fieldDialogRef"
        :model="fieldDialogData"
        label-width="100px"
      >
        <el-form-item label="字段名" prop="name">
          <el-input
            v-model="fieldDialogData.name"
            placeholder="请输入字段名"
          />
          <div class="form-tip">字段的唯一标识，用于数据存储</div>
        </el-form-item>

        <el-form-item label="显示标签" prop="label">
          <el-input
            v-model="fieldDialogData.label"
            placeholder="请输入显示标签"
          />
          <div class="form-tip">在表单中显示的标签文字</div>
        </el-form-item>

        <el-form-item label="字段类型" prop="type">
          <el-select
            v-model="fieldDialogData.type"
            placeholder="请选择字段类型"
            style="width: 100%"
          >
            <el-option label="文本" value="text" />
            <el-option label="数字" value="number" />
            <el-option label="选择" value="select" />
            <el-option label="日期" value="date" />
            <el-option label="日期时间" value="datetime" />
            <el-option label="复选框" value="checkbox" />
            <el-option label="单选框" value="radio" />
            <el-option label="文本域" value="textarea" />
            <el-option label="密码" value="password" />
          </el-select>
        </el-form-item>

        <el-form-item label="必填" prop="required">
          <el-checkbox v-model="fieldDialogData.required">
            此字段为必填项
          </el-checkbox>
        </el-form-item>

        <el-form-item label="映射字段" prop="mapping">
          <el-select
            v-model="fieldDialogData.mapping"
            placeholder="请选择映射字段"
            style="width: 100%"
            filterable
            clearable
          >
            <el-option label="使用字段名" value="" />
            <el-option
              v-for="column in tableColumns"
              :key="column.name"
              :label="`${column.name} (${column.type})`"
              :value="column.name"
            />
          </el-select>
          <div class="form-tip">映射到数据表的字段名，为空则使用字段名</div>
        </el-form-item>

        <el-form-item label="占位符" prop="placeholder">
          <el-input
            v-model="fieldDialogData.placeholder"
            placeholder="请输入占位符文本"
          />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="fieldDialogData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入字段描述"
          />
        </el-form-item>

        <!-- 动态配置区域 -->
        <template v-if="fieldDialogData.type === 'select' || fieldDialogData.type === 'radio'">
          <el-form-item label="选项配置" prop="options">
            <div class="options-config">
              <div class="options-header">
                <span>选项列表</span>
                <el-button type="text" @click="handleAddOption" size="small" :icon="Plus">
                  添加选项
                </el-button>
              </div>
              <div class="options-list">
                <div
                  v-for="(option, index) in fieldDialogData.options"
                  :key="index"
                  class="option-item"
                >
                  <el-input
                    v-model="option.label"
                    placeholder="选项标签"
                    style="width: 45%; margin-right: 10px;"
                  />
                  <el-input
                    v-model="option.value"
                    placeholder="选项值"
                    style="width: 45%; margin-right: 10px;"
                  />
                  <el-button
                    type="danger"
                    link
                    size="small"
                    @click="handleRemoveOption(index)"
                    :icon="Delete"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </el-form-item>
        </template>

        <template v-if="fieldDialogData.type === 'number'">
          <el-form-item label="最小值" prop="validation.min">
            <el-input-number
              v-model="fieldDialogData.validation!.min"
              placeholder="最小值"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="最大值" prop="validation.max">
            <el-input-number
              v-model="fieldDialogData.validation!.max"
              placeholder="最大值"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="步长" prop="step">
            <el-input-number
              v-model="fieldDialogData.step"
              placeholder="步长"
              style="width: 100%"
            />
          </el-form-item>
        </template>

        <template v-if="fieldDialogData.type === 'text' || fieldDialogData.type === 'textarea'">
          <el-form-item label="最小长度" prop="validation.minLength">
            <el-input-number
              v-model="fieldDialogData.validation!.minLength"
              placeholder="最小长度"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="最大长度" prop="validation.maxLength">
            <el-input-number
              v-model="fieldDialogData.validation!.maxLength"
              placeholder="最大长度"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="正则验证" prop="validation.pattern">
            <el-input
              v-model="fieldDialogData.validation!.pattern"
              placeholder="正则表达式"
            />
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="fieldDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveField">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { Plus, Upload, Download, Edit, Delete } from '@element-plus/icons-vue'
import { apiService } from '@/services/api'

interface FormField {
  name: string
  label: string
  type: string
  required?: boolean
  mapping?: string
  placeholder?: string
  description?: string
  options?: Array<{ label: string; value: any }>
  validation?: {
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    pattern?: string
  }
  step?: number
}

interface FormFieldsConfigProps {
  formData: any
}

const props = defineProps<FormFieldsConfigProps>()
const emit = defineEmits<{
  'update': [data: any]
}>()

const fields = ref<FormField[]>([])
const fieldDialogVisible = ref(false)
const fieldDialogRef = ref<FormInstance>()
const fieldDialogData = ref<FormField>({
  name: '',
  label: '',
  type: 'text',
  required: false,
  mapping: '',
  placeholder: '',
  description: '',
  options: [],
  validation: {},
  step: 1
})
const isEditingField = ref(false)
const editingFieldIndex = ref(-1)
const tableColumns = ref<any[]>([])

// 计算属性
const fieldDialogTitle = computed(() => {
  return isEditingField.value ? '编辑字段' : '添加字段'
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

// 初始化字段数据
const initFields = () => {
  const parsedDefinition = parseFormDefinition(props.formData.definition)
  if (parsedDefinition.fields) {
    fields.value = [...parsedDefinition.fields]
  } else {
    fields.value = []
  }
}

// 获取关联表的字段列表
const loadTableColumns = async () => {
  try {
    const tableMapping = props.formData.tableMapping
    if (!tableMapping) {
      tableColumns.value = []
      return
    }

    // 使用API获取表的列信息
    const columns = await apiService.getTableColumns(tableMapping)
    tableColumns.value = columns || []
  } catch (error) {
    console.error('获取表字段列表失败:', error)
    tableColumns.value = []
    ElMessage.warning('获取关联表字段列表失败，请检查关联表配置')
  }
}

// 添加字段
const handleAddField = () => {
  isEditingField.value = false
  fieldDialogData.value = {
    name: '',
    label: '',
    type: 'text',
    required: false,
    mapping: '',
    placeholder: '',
    description: '',
    options: [],
    validation: {},
    step: 1
  }
  fieldDialogVisible.value = true
  // 加载关联表字段列表
  loadTableColumns()
}

// 编辑字段
const handleEditField = (field: FormField) => {
  isEditingField.value = true
  editingFieldIndex.value = fields.value.indexOf(field)
  fieldDialogData.value = { ...field }
  fieldDialogVisible.value = true
  // 加载关联表字段列表
  loadTableColumns()
}

// 删除字段
const handleDeleteField = (index: number) => {
  fields.value.splice(index, 1)
  updateFormData()
}

// 保存字段
const handleSaveField = () => {
  if (!fieldDialogData.value.name || !fieldDialogData.value.label) {
    ElMessage.error('请填写字段名和显示标签')
    return
  }

  if (isEditingField.value) {
    // 更新字段
    fields.value[editingFieldIndex.value] = { ...fieldDialogData.value }
  } else {
    // 添加新字段
    fields.value.push({ ...fieldDialogData.value })
  }

  fieldDialogVisible.value = false
  updateFormData()
  ElMessage.success(isEditingField.value ? '字段更新成功' : '字段添加成功')
}

// 处理字段变化
const handleFieldChange = (field: FormField) => {
  updateFormData()
}

// 更新表单数据
const updateFormData = () => {
  const updatedData = {
    ...props.formData,
    definition: {
      ...props.formData.definition,
      fields: [...fields.value]
    }
  }
  emit('update', updatedData)
}

// 添加选项
const handleAddOption = () => {
  if (!fieldDialogData.value.options) {
    fieldDialogData.value.options = []
  }
  fieldDialogData.value.options.push({ label: '', value: '' })
}

// 删除选项
const handleRemoveOption = (index: number) => {
  fieldDialogData.value.options?.splice(index, 1)
}

// 导入字段
const handleImportFields = () => {
  ElMessage.info('导入字段功能开发中...')
}

// 导出字段
const handleExportFields = () => {
  ElMessage.info('导出字段功能开发中...')
}

// 监听表单数据变化
watch(() => props.formData, () => {
  initFields()
}, { deep: true, immediate: true })
</script>

<style scoped>
.form-fields-config {
  padding: 0;
}

.toolbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.empty-state {
  padding: 40px 0;
}

.form-tip {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 4px;
  line-height: 1.4;
}

.options-config {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-base);
  padding: 16px;
}

.options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar-content {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .toolbar-actions {
    justify-content: space-between;
  }
  
  .option-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .option-item .el-input {
    width: 100% !important;
    margin-right: 0 !important;
  }
}
</style>
