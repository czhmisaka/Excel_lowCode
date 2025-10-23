<template>
    <div class="excel-import">
        <div class="import-header">
            <h3>Excel数据导入</h3>
            <div class="header-actions">
                <el-button type="primary" @click="confirmImport" :loading="importing">
                    确认导入
                </el-button>
                <el-button @click="cancelImport">取消</el-button>
            </div>
        </div>

        <div class="import-content">
            <!-- 文件上传区域 -->
            <div class="upload-section">
                <el-card>
                    <template #header>
                        <span>选择Excel文件</span>
                    </template>
                    <div class="upload-area">
                        <el-upload drag action="#" :auto-upload="false" :on-change="handleFileChange"
                            :before-upload="beforeUpload" accept=".xlsx,.xls">
                            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                            <div class="el-upload__text">
                                将文件拖到此处，或<em>点击上传</em>
                            </div>
                            <template #tip>
                                <div class="el-upload__tip">
                                    只能上传 xlsx/xls 文件，且不超过10MB
                                </div>
                            </template>
                        </el-upload>
                    </div>
                </el-card>
            </div>

            <!-- 表头行选择和数据预览 -->
            <div v-if="selectedFile" class="preview-section">
                <div class="three-column-layout">
                    <!-- 左列：预览信息和操作 -->
                    <div class="left-column">
                        <el-card>
                            <template #header>
                                <span>表头行选择</span>
                            </template>
                            <div class="preview-info">
                                <el-alert title="请选择表头行" description="点击任意行将其设置为表头，该行将作为字段名，后续行将作为数据" type="info"
                                    show-icon :closable="false" />
                                <div class="info-stats">
                                    <span>总行数: {{ previewData.totalRows }}</span>
                                    <span>总列数: {{ previewData.totalColumns }}</span>
                                    <span>当前选择表头行: {{ selectedHeaderRow + 1 }}</span>
                                </div>
                            </div>

                            <!-- 解析加载状态 -->
                            <div class="parsing-status" v-if="parsing">
                                <el-alert title="正在解析表结构..." type="info" show-icon :closable="false" />
                            </div>

                            <div class="preview-footer">
                                <el-alert v-if="selectedHeaderRow !== -1 && !parsing"
                                    :title="`已选择第 ${selectedHeaderRow + 1} 行作为表头`" type="success" show-icon
                                    :closable="false" />
                            </div>
                        </el-card>
                    </div>

                    <!-- 中列：Excel数据预览表格 -->
                    <div class="middle-column">
                        <el-card>
                            <template #header>
                                <span>数据预览</span>
                            </template>
                            <div class="preview-table-container">
                                <el-table :data="previewData.rows" border stripe highlight-current-row
                                    @row-click="handleRowClick" :row-class-name="getRowClassName" max-height="400">
                                    <el-table-column type="index" label="行号" width="80" align="center">
                                        <template #default="scope">
                                            {{ scope.$index + 1 }}
                                        </template>
                                    </el-table-column>
                                    <el-table-column v-for="(cell, cellIndex) in previewData.rows[0]?.data || []"
                                        :key="cellIndex" :label="`列 ${cellIndex + 1}`" :prop="`data[${cellIndex}]`"
                                        min-width="120">
                                        <template #default="scope">
                                            <div class="cell-content"
                                                :class="{ 'header-row': scope.$index === selectedHeaderRow }">
                                                {{ scope.row.data[cellIndex] }}
                                            </div>
                                        </template>
                                    </el-table-column>
                                </el-table>
                            </div>
                        </el-card>
                    </div>

                    <!-- 右列：表结构预览 -->
                    <div class="right-column" v-if="tableStructure && !parsing">
                        <el-card>
                            <template #header>
                                <span>表结构预览</span>
                            </template>
                            <div class="table-structure-preview">
                                <el-alert :title="`当前表结构（基于第 ${selectedHeaderRow + 1} 行作为表头）`" type="success" show-icon
                                    :closable="false" />

                                <div class="structure-info">
                                    <div class="structure-stats">
                                        <span>字段数量: {{ tableStructure.columnCount }}</span>
                                        <span>数据行数: {{ tableStructure.rowCount }}</span>
                                        <span>工作表: {{ tableStructure.sheetName }}</span>
                                    </div>
                                </div>

                                <!-- 字段定义表格 -->
                                <div class="field-definition-container">
                                    <el-table :data="tableStructure.columnDefinitions" border stripe max-height="200">
                                        <el-table-column prop="index" label="序号" width="60" align="center">
                                            <template #default="scope">
                                                {{ scope.$index + 1 }}
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="originalName" label="原始表头" min-width="120"
                                            show-overflow-tooltip>
                                            <template #default="scope">
                                                <div class="header-cell">
                                                    {{ scope.row.originalName || `列 ${scope.$index + 1}` }}
                                                </div>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="name" label="字段名" min-width="100" show-overflow-tooltip>
                                            <template #default="scope">
                                                <el-tag type="primary" size="small">{{ scope.row.name }}</el-tag>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="type" label="数据类型" width="80" align="center">
                                            <template #default="scope">
                                                <el-tag :type="getDataTypeTagType(scope.row.type)" size="small">
                                                    {{ scope.row.type }}
                                                </el-tag>
                                            </template>
                                        </el-table-column>
                                    </el-table>
                                </div>

                                <!-- 数据预览 -->
                                <div class="data-preview-container"
                                    v-if="tableStructure.dataPreview && tableStructure.dataPreview.length > 0">
                                    <el-divider content-position="left">数据预览（前5行）</el-divider>
                                    <el-table :data="tableStructure.dataPreview" border stripe max-height="200">
                                        <el-table-column v-for="column in tableStructure.columnDefinitions"
                                            :key="column.name" :prop="column.name" :label="column.name" min-width="120">
                                            <template #default="scope">
                                                <div class="data-cell" :class="`type-${column.type}`">
                                                    {{ scope.row[column.name] }}
                                                </div>
                                            </template>
                                        </el-table-column>
                                    </el-table>
                                </div>
                            </div>
                        </el-card>
                    </div>
                </div>
            </div>

            <!-- 导入规则配置 -->
            <div v-if="selectedFile && tableStructure && !parsing" class="rules-section">
                <el-card>
                    <template #header>
                        <span>导入规则配置</span>
                    </template>
                    <div class="rules-content">
                        <!-- 去重规则 -->
                        <div class="rule-group">
                            <h4>去重规则</h4>
                            <div class="rule-description">
                                <el-text type="info">选择用于去重的字段，导入时会根据这些字段的值进行去重处理</el-text>
                            </div>
                            <div class="deduplication-fields">
                                <el-checkbox-group v-model="importRules.deduplicationFields">
                                    <el-checkbox v-for="column in tableStructure.columnDefinitions" :key="column.name"
                                        :label="column.name" :disabled="column.type === 'boolean'">
                                        {{ column.name }}
                                        <el-tag v-if="column.type === 'boolean'" size="small" type="info">布尔值</el-tag>
                                    </el-checkbox>
                                </el-checkbox-group>
                            </div>
                        </div>

                        <!-- 冲突处理策略 -->
                        <div class="rule-group">
                            <h4>冲突处理策略</h4>
                            <div class="rule-description">
                                <el-text type="info">当遇到重复数据时的处理方式</el-text>
                            </div>
                            <div class="conflict-strategy">
                                <el-radio-group v-model="importRules.conflictStrategy">
                                    <el-radio label="skip">跳过重复记录</el-radio>
                                    <el-radio label="overwrite">覆盖重复记录</el-radio>
                                    <el-radio label="error">遇到重复时报错</el-radio>
                                </el-radio-group>
                            </div>
                        </div>

                        <!-- 数据验证规则 -->
                        <div class="rule-group">
                            <h4>数据验证规则</h4>
                            <div class="rule-description">
                                <el-text type="info">设置数据验证规则，确保导入数据的质量</el-text>
                            </div>
                            <div class="validation-rules">
                                <el-checkbox-group v-model="importRules.validationRules">
                                    <el-checkbox label="requiredFields">检查必填字段</el-checkbox>
                                    <el-checkbox label="dataTypes">验证数据类型</el-checkbox>
                                    <el-checkbox label="uniqueConstraints">检查唯一性约束</el-checkbox>
                                </el-checkbox-group>
                            </div>
                        </div>

                        <!-- 规则摘要 -->
                        <div class="rules-summary" v-if="hasRulesConfigured">
                            <el-divider content-position="left">规则摘要</el-divider>
                            <div class="summary-content">
                                <div v-if="importRules.deduplicationFields.length > 0" class="summary-item">
                                    <el-icon>
                                        <Check />
                                    </el-icon>
                                    <span>去重字段: {{ importRules.deduplicationFields.join(', ') }}</span>
                                </div>
                                <div class="summary-item">
                                    <el-icon>
                                        <Check />
                                    </el-icon>
                                    <span>冲突处理: {{ getConflictStrategyText(importRules.conflictStrategy) }}</span>
                                </div>
                                <div v-if="importRules.validationRules.length > 0" class="summary-item">
                                    <el-icon>
                                        <Check />
                                    </el-icon>
                                    <span>验证规则: {{ importRules.validationRules.join(', ') }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </el-card>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { apiService } from '@/services/api'
import { ElMessage } from 'element-plus'
import { UploadFilled, Check } from '@element-plus/icons-vue'

interface Props {
    targetHash: string // 目标表的哈希值
}

interface Emits {
    (e: 'confirm', data: { successCount: number; errorCount: number }): void
    (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 状态
const selectedFile = ref<File | null>(null)
const selectedHeaderRow = ref(0) // 默认选择第一行作为表头
const importing = ref(false)
const parsing = ref(false)
const tableStructure = ref<any>(null)

// 预览数据
const previewData = ref({
    sheetName: '',
    totalRows: 0,
    totalColumns: 0,
    rows: [] as any[]
})

// 导入规则配置
const importRules = ref({
    deduplicationFields: [] as string[], // 去重字段
    conflictStrategy: 'skip' as 'skip' | 'overwrite' | 'error', // 冲突处理策略
    validationRules: [] as string[] // 验证规则
})

// 计算属性
const hasRulesConfigured = computed(() => {
    return importRules.value.deduplicationFields.length > 0 ||
        importRules.value.validationRules.length > 0
})

// 文件选择处理
const handleFileChange = (file: any) => {
    const fileObj = file.raw
    if (!fileObj) return

    selectedFile.value = fileObj
    previewExcelFile(fileObj)
}

// 上传前验证
const beforeUpload = (file: File) => {
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel'
    const isLt10M = file.size / 1024 / 1024 < 10

    if (!isExcel) {
        ElMessage.error('只能上传Excel文件!')
        return false
    }
    if (!isLt10M) {
        ElMessage.error('文件大小不能超过10MB!')
        return false
    }
    return true
}

// 预览Excel文件
const previewExcelFile = async (file: File) => {
    parsing.value = true
    try {
        const response = await apiService.previewExcelFile(file)
        if (response.success) {
            previewData.value = response.data
            // 默认选择第一行作为表头
            selectedHeaderRow.value = 0
            await parseTableStructure(0)
        } else {
            ElMessage.error(response.message || '文件预览失败')
        }
    } catch (error: any) {
        ElMessage.error(error.message || '文件预览失败')
    } finally {
        parsing.value = false
    }
}

// 动态解析表结构
const parseTableStructure = async (headerRow: number) => {
    parsing.value = true
    try {
        const response = await apiService.dynamicParseExcel(selectedFile.value!, headerRow)
        if (response.success) {
            tableStructure.value = response.data
        } else {
            ElMessage.error(response.message || '表结构解析失败')
        }
    } catch (error: any) {
        ElMessage.error(error.message || '表结构解析失败')
    } finally {
        parsing.value = false
    }
}

// 监听表头行变化，动态解析表结构
watch(selectedHeaderRow, async (newHeaderRow, oldHeaderRow) => {
    if (selectedFile.value && newHeaderRow !== oldHeaderRow) {
        await parseTableStructure(newHeaderRow)
    }
})

// 处理行点击事件
const handleRowClick = (row: any) => {
    selectedHeaderRow.value = row.rowIndex
}

// 获取行类名
const getRowClassName = ({ row }: { row: any }) => {
    if (row.rowIndex === selectedHeaderRow.value) {
        return 'selected-header-row'
    }
    return ''
}

// 获取数据类型对应的标签类型
const getDataTypeTagType = (type: string) => {
    switch (type) {
        case 'string':
            return 'success'
        case 'number':
            return 'warning'
        case 'date':
            return 'info'
        case 'boolean':
            return 'danger'
        default:
            return ''
    }
}

// 获取冲突策略文本
const getConflictStrategyText = (strategy: string) => {
    const strategyMap: { [key: string]: string } = {
        'skip': '跳过重复记录',
        'overwrite': '覆盖重复记录',
        'error': '遇到重复时报错'
    }
    return strategyMap[strategy] || strategy
}

// 确认导入
const confirmImport = async () => {
    if (!selectedFile.value) {
        ElMessage.warning('请先选择要导入的Excel文件')
        return
    }

    if (selectedHeaderRow.value === -1) {
        ElMessage.warning('请先选择表头行')
        return
    }

    importing.value = true
    try {
        // 调用实际的导入API
        const result = await apiService.importExcelData(
            selectedFile.value,
            props.targetHash,
            selectedHeaderRow.value,
            importRules.value
        )

        if (result.success) {
            ElMessage.success(result.message)
            emit('confirm', result.data)
        } else {
            ElMessage.error(result.message || '导入失败')
        }
    } catch (error: any) {
        ElMessage.error(error.message || '导入失败')
    } finally {
        importing.value = false
    }
}

// 取消导入
const cancelImport = () => {
    emit('cancel')
}
</script>

<style scoped>
.excel-import {
    padding: 0;
}

.import-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #e4e7ed;
}

.import-header h3 {
    margin: 0;
    color: #303133;
}

.header-actions {
    display: flex;
    gap: 10px;
}

.import-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* 三列布局样式 */
.three-column-layout {
    display: grid;
    grid-template-columns: 280px 1fr 320px;
    gap: 16px;
    align-items: start;
}

.left-column,
.middle-column,
.right-column {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.preview-info {
    margin-bottom: 0;
}

.info-stats {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;
    color: #666;
}

.preview-table-container {
    margin-bottom: 0;
}

.cell-content {
    padding: 4px 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.cell-content.header-row {
    background-color: #e6f7ff;
    font-weight: bold;
    color: #1890ff;
}

.preview-footer {
    margin-top: 0;
}

:deep(.selected-header-row) {
    background-color: #f0f9ff !important;
}

:deep(.selected-header-row .cell) {
    background-color: #f0f9ff !important;
    font-weight: bold;
    color: #1890ff;
}

/* 表结构预览样式 */
.table-structure-preview {
    margin-top: 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.structure-info {
    margin: 15px 0;
}

.structure-stats {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;
    color: #666;
    margin-bottom: 15px;
}

.header-cell {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 字段定义表格容器 */
.field-definition-container {
    height: auto;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

:deep(.field-definition-container .el-table) {
    flex: 1;
}

:deep(.field-definition-container .el-table .el-table__body-wrapper) {
    overflow-y: auto;
}

:deep(.field-definition-container .el-table .el-table__header-wrapper) {
    position: sticky;
    top: 0;
    z-index: 1;
    background: white;
}

/* 数据预览容器 */
.data-preview-container {
    height: 220px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

:deep(.data-preview-container .el-table) {
    flex: 1;
}

:deep(.data-preview-container .el-table .el-table__body-wrapper) {
    overflow-y: auto;
}

:deep(.data-preview-container .el-table .el-table__header-wrapper) {
    position: sticky;
    top: 0;
    z-index: 1;
    background: white;
}

/* 表格单元格样式 */
:deep(.table-structure-preview .el-table .el-table__cell) {
    padding: 4px 8px;
}

:deep(.table-structure-preview .el-table .el-table__cell .cell) {
    padding: 0;
    line-height: 1.4;
}

.data-cell {
    padding: 4px 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.data-cell.type-number {
    text-align: right;
    font-family: 'Courier New', monospace;
}

.data-cell.type-date {
    color: #1890ff;
}

.data-cell.type-boolean {
    font-weight: bold;
}

/* 右列整体样式 */
.right-column {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 600px;
    overflow-y: auto;
}

.right-column::-webkit-scrollbar {
    width: 6px;
}

.right-column::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.right-column::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.right-column::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

.parsing-status {
    margin: 0;
}

/* 导入规则配置样式 */
.rules-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.rule-group {
    padding: 16px;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    background-color: #f8f9fa;
}

.rule-group h4 {
    margin: 0 0 8px 0;
    color: #303133;
    font-weight: 600;
}

.rule-description {
    margin-bottom: 12px;
}

.deduplication-fields,
.conflict-strategy,
.validation-rules {
    margin-top: 12px;
}

.deduplication-fields .el-checkbox {
    display: block;
    margin-bottom: 8px;
}

.deduplication-fields .el-checkbox:last-child {
    margin-bottom: 0;
}

.conflict-strategy .el-radio {
    display: block;
    margin-bottom: 8px;
}

.conflict-strategy .el-radio:last-child {
    margin-bottom: 0;
}

.validation-rules .el-checkbox {
    display: block;
    margin-bottom: 8px;
}

.validation-rules .el-checkbox:last-child {
    margin-bottom: 0;
}

/* 规则摘要样式 */
.rules-summary {
    margin-top: 16px;
}

.summary-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.summary-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background-color: #f0f9ff;
    border-radius: 4px;
    border-left: 3px solid #1890ff;
}

.summary-item .el-icon {
    color: #52c41a;
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .three-column-layout {
        grid-template-columns: 1fr 1fr;
        grid-template-areas:
            "left middle"
            "right right";
    }

    .left-column {
        grid-area: left;
    }

    .middle-column {
        grid-area: middle;
    }

    .right-column {
        grid-area: right;
        margin-top: 20px;
    }
}

@media (max-width: 768px) {
    .three-column-layout {
        grid-template-columns: 1fr;
        grid-template-areas:
            "left"
            "middle"
            "right";
        gap: 15px;
    }

    .left-column {
        grid-area: left;
    }

    .middle-column {
        grid-area: middle;
    }

    .right-column {
        grid-area: right;
        margin-top: 0;
    }

    .info-stats,
    .structure-stats {
        flex-direction: column;
        gap: 5px;
    }

    .import-header {
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
    }

    .header-actions {
        width: 100%;
        justify-content: flex-start;
    }

    .rules-content {
        gap: 16px;
    }

    .rule-group {
        padding: 12px;
    }
}
</style>
