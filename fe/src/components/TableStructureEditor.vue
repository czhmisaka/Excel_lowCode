<!--
 * 表结构编辑器组件
 * @Date: 2025-10-30
 -->
<template>
    <div class="table-structure-editor">
        <el-card class="editor-card">
            <template #header>
                <div class="editor-header">
                    <span class="editor-title">表结构编辑器</span>
                    <div class="header-info">
                        <el-tag v-if="tableHash" type="info">{{ tableHash }}</el-tag>
                        <span class="table-name">{{ tableName }}</span>
                    </div>
                </div>
            </template>

            <!-- 字段列表 -->
            <div class="field-list">
                <draggable v-model="fieldConfig.fields" item-key="name" handle=".drag-handle" @end="onDragEnd">
                    <template #item="{ element: field, index }">
                        <el-card class="field-card" shadow="hover">
                            <template #header>
                                <div class="field-header">
                                    <div class="field-drag-handle">
                                        <el-icon class="drag-handle">
                                            <Rank />
                                        </el-icon>
                                        <span class="field-original-name">{{ field.originalName }}</span>
                                    </div>
                                    <div class="field-actions">
                                        <el-switch v-model="field.visible" active-text="显示" inactive-text="隐藏"
                                            @change="onFieldVisibilityChange(field)" />
                                        <el-button type="danger" size="small" @click="removeField(index)">
                                            <el-icon>
                                                <Delete />
                                            </el-icon>
                                            删除
                                        </el-button>
                                    </div>
                                </div>
                            </template>

                            <!-- 字段配置表单 -->
                            <el-form :model="field" label-width="120px">
                                <el-form-item label="显示名称">
                                    <el-input v-model="field.displayName" :placeholder="field.originalName" />
                                </el-form-item>
                                <el-form-item label="字段类型">
                                    <el-select v-model="field.type" placeholder="请选择字段类型">
                                        <el-option label="文本" value="string" />
                                        <el-option label="数字" value="number" />
                                        <el-option label="日期" value="date" />
                                        <el-option label="布尔值" value="boolean" />
                                        <el-option label="选择" value="select" />
                                    </el-select>
                                </el-form-item>
                                <el-form-item label="是否必填">
                                    <el-switch v-model="field.required" />
                                </el-form-item>

                                <!-- 选项配置（用于select类型） -->
                                <el-form-item v-if="field.type === 'select'" label="选项">
                                    <div class="options-list">
                                        <div v-for="(option, optionIndex) in (field.options || [])" :key="optionIndex"
                                            class="option-item">
                                            <el-input v-model="field.options![optionIndex]" placeholder="请输入选项内容" />
                                            <el-button type="danger" size="small"
                                                @click="removeOption(field, optionIndex)">
                                                <el-icon>
                                                    <Delete />
                                                </el-icon>
                                            </el-button>
                                        </div>
                                        <el-button type="primary" size="small" @click="addOption(field)">
                                            <el-icon>
                                                <Plus />
                                            </el-icon>
                                            添加选项
                                        </el-button>
                                    </div>
                                </el-form-item>

                                <!-- 验证规则配置 -->
                                <el-form-item v-if="field.type === 'number'" label="数字范围">
                                    <div class="validation-rules">
                                        <el-input-number v-model="field.validation.min" placeholder="最小值" />
                                        <span class="rule-separator">至</span>
                                        <el-input-number v-model="field.validation.max" placeholder="最大值" />
                                    </div>
                                </el-form-item>

                                <el-form-item v-if="field.type === 'string'" label="正则验证">
                                    <el-input v-model="field.validation.pattern" placeholder="请输入正则表达式" />
                                    <div class="validation-tip">
                                        <el-text type="info" size="small">例如：^[a-zA-Z0-9]+$</el-text>
                                    </div>
                                </el-form-item>

                                <el-form-item label="显示顺序">
                                    <el-input-number v-model="field.order" :min="1" :max="fieldConfig.fields.length" />
                                </el-form-item>

                                <!-- 条件显示配置 -->
                                <el-form-item label="条件显示">
                                    <div class="condition-config">
                                        <el-select :model-value="field.condition?.field"
                                            @update:modelValue="handleConditionFieldChange(field, $event)"
                                            placeholder="选择依赖字段" clearable>
                                            <el-option v-for="depField in availableDependentFields(field)"
                                                :key="depField.name"
                                                :label="depField.displayName || depField.originalName"
                                                :value="depField.name" />
                                        </el-select>
                                        <el-select :model-value="field.condition?.operator"
                                            @update:modelValue="handleConditionOperatorChange(field, $event)"
                                            placeholder="操作符" style="margin-left: 8px;">
                                            <el-option label="等于" value="eq" />
                                            <el-option label="不等于" value="ne" />
                                            <el-option label="包含" value="contains" />
                                        </el-select>
                                        <el-input :model-value="field.condition?.value"
                                            @update:modelValue="handleConditionValueChange(field, $event)"
                                            placeholder="比较值" style="margin-left: 8px; width: 150px;" />
                                    </div>
                                </el-form-item>
                            </el-form>
                        </el-card>
                    </template>
                </draggable>
            </div>

            <!-- 空状态 -->
            <div v-if="fieldConfig.fields.length === 0" class="empty-state">
                <el-empty description="暂无字段配置" />
            </div>

            <!-- 操作按钮 -->
            <div class="editor-actions">
                <el-button type="primary" @click="saveConfig" :loading="saving">
                    <el-icon>
                        <Check />
                    </el-icon>
                    保存配置
                </el-button>
                <el-button @click="resetConfig">
                    <el-icon>
                        <Refresh />
                    </el-icon>
                    重置配置
                </el-button>
                <el-button @click="exportConfig">
                    <el-icon>
                        <Download />
                    </el-icon>
                    导出配置
                </el-button>
                <el-button @click="importConfig">
                    <el-icon>
                        <Upload />
                    </el-icon>
                    导入配置
                </el-button>
            </div>
        </el-card>

        <!-- 配置预览 -->
        <el-card class="preview-card" v-if="fieldConfig.fields.length > 0">
            <template #header>
                <span class="preview-title">配置预览</span>
            </template>
            <pre class="config-preview">{{ JSON.stringify(fieldConfig, null, 2) }}</pre>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Rank, Delete, Plus, Check, Refresh, Download, Upload } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import type { FieldConfig, TableStructureConfig } from '@/types/form'

interface Props {
    tableHash: string
    tableName: string
    originalColumns: string[]
    initialConfig?: TableStructureConfig
}

interface Emits {
    (e: 'save', config: TableStructureConfig): void
    (e: 'update', config: TableStructureConfig): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 字段配置
const fieldConfig = ref<TableStructureConfig>({
    fields: []
})

// 保存状态
const saving = ref(false)

// 初始化字段配置
const initFieldConfig = () => {
    if (props.initialConfig && props.initialConfig.fields) {
        fieldConfig.value = { ...props.initialConfig }
    } else {
        // 从原始列创建默认配置
        fieldConfig.value.fields = props.originalColumns.map((column, index) => ({
            name: column,
            originalName: column,
            displayName: column,
            type: 'string',
            required: false,
            visible: true,
            order: index + 1,
            validation: {},
            options: []
        }))
    }
}

// 获取可用的依赖字段
const availableDependentFields = (currentField: FieldConfig) => {
    return fieldConfig.value.fields.filter(field =>
        field.name !== currentField.name && field.visible
    )
}

// 拖拽结束处理
const onDragEnd = () => {
    // 更新字段的显示顺序
    fieldConfig.value.fields.forEach((field, index) => {
        field.order = index + 1
    })
}

// 字段可见性变化处理
const onFieldVisibilityChange = (field: FieldConfig) => {
    ElMessage.info(`${field.displayName} ${field.visible ? '已显示' : '已隐藏'}`)
}

// 添加选项
const addOption = (field: FieldConfig) => {
    if (!field.options) {
        field.options = []
    }
    field.options.push('新选项')
}

// 删除选项
const removeOption = (field: FieldConfig, index: number) => {
    field.options.splice(index, 1)
}

// 处理条件字段变化
const handleConditionFieldChange = (field: FieldConfig, value: string) => {
    if (!field.condition) {
        field.condition = { field: '', operator: 'eq', value: '' }
    }
    field.condition.field = value
}

// 处理条件操作符变化
const handleConditionOperatorChange = (field: FieldConfig, value: 'eq' | 'ne' | 'contains') => {
    if (!field.condition) {
        field.condition = { field: '', operator: 'eq', value: '' }
    }
    field.condition.operator = value
}

// 处理条件值变化
const handleConditionValueChange = (field: FieldConfig, value: string) => {
    if (!field.condition) {
        field.condition = { field: '', operator: 'eq', value: '' }
    }
    field.condition.value = value
}

// 删除字段
const removeField = async (index: number) => {
    try {
        await ElMessageBox.confirm(
            '确定要删除这个字段吗？删除后该字段将不再显示在表单中。',
            '确认删除',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        fieldConfig.value.fields.splice(index, 1)
        ElMessage.success('字段删除成功')
    } catch (error) {
        // 用户取消删除
    }
}

// 保存配置
const saveConfig = async () => {
    try {
        saving.value = true

        // 验证配置
        if (!validateConfig()) {
            return
        }

        // 触发保存事件
        emit('save', fieldConfig.value)
        ElMessage.success('表结构配置保存成功')
    } catch (error) {
        console.error('保存配置失败:', error)
        ElMessage.error('保存配置失败')
    } finally {
        saving.value = false
    }
}

// 验证配置
const validateConfig = (): boolean => {
    // 检查字段名称唯一性
    const fieldNames = fieldConfig.value.fields.map(field => field.name)
    const uniqueNames = new Set(fieldNames)
    if (fieldNames.length !== uniqueNames.size) {
        ElMessage.error('字段名称不能重复')
        return false
    }

    // 检查显示名称唯一性
    const displayNames = fieldConfig.value.fields
        .filter(field => field.visible)
        .map(field => field.displayName)
    const uniqueDisplayNames = new Set(displayNames)
    if (displayNames.length !== uniqueDisplayNames.size) {
        ElMessage.error('显示名称不能重复')
        return false
    }

    return true
}

// 重置配置
const resetConfig = async () => {
    try {
        await ElMessageBox.confirm(
            '确定要重置所有配置吗？这将恢复为原始字段设置。',
            '确认重置',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        initFieldConfig()
        ElMessage.info('配置已重置')
    } catch (error) {
        // 用户取消重置
    }
}

// 导出配置
const exportConfig = () => {
    const configStr = JSON.stringify(fieldConfig.value, null, 2)
    const blob = new Blob([configStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `table-structure-${props.tableHash}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    ElMessage.success('配置导出成功')
}

// 导入配置
const importConfig = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                try {
                    const config = JSON.parse(event.target?.result as string)
                    if (config.fields && Array.isArray(config.fields)) {
                        fieldConfig.value = config
                        ElMessage.success('配置导入成功')
                    } else {
                        ElMessage.error('配置文件格式不正确')
                    }
                } catch (error) {
                    ElMessage.error('配置文件解析失败')
                }
            }
            reader.readAsText(file)
        }
    }
    input.click()
}

// 监听配置变化
watch(
    () => fieldConfig.value,
    (newConfig) => {
        emit('update', newConfig)
    },
    { deep: true }
)

// 初始化
initFieldConfig()
</script>

<style scoped>
.table-structure-editor {
    padding: 20px;
}

.editor-card {
    margin-bottom: 20px;
}

.editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.editor-title {
    font-size: 18px;
    font-weight: 600;
}

.header-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.table-name {
    color: #606266;
    font-size: 14px;
}

.field-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.field-card {
    margin-bottom: 16px;
}

.field-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.field-drag-handle {
    display: flex;
    align-items: center;
    gap: 8px;
}

.drag-handle {
    cursor: move;
    color: #909399;
}

.field-original-name {
    color: #909399;
    font-size: 12px;
}

.field-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.options-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.option-item {
    display: flex;
    gap: 8px;
    align-items: center;
}

.validation-rules {
    display: flex;
    gap: 8px;
    align-items: center;
}

.rule-separator {
    color: #909399;
    padding: 0 8px;
}

.validation-tip {
    margin-top: 4px;
}

.condition-config {
    display: flex;
    gap: 8px;
    align-items: center;
}

.empty-state {
    padding: 40px 0;
}

.editor-actions {
    margin-top: 20px;
    text-align: center;
    display: flex;
    gap: 12px;
    justify-content: center;
}

.preview-card {
    margin-top: 20px;
}

.preview-title {
    font-weight: 600;
}

.config-preview {
    background-color: #f5f7fa;
    padding: 16px;
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    line-height: 1.5;
    overflow: auto;
    max-height: 300px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .table-structure-editor {
        padding: 10px;
    }

    .editor-header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
    }

    .field-header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
    }

    .condition-config {
        flex-direction: column;
        align-items: flex-start;
    }

    .editor-actions {
        flex-direction: column;
    }
}
</style>
