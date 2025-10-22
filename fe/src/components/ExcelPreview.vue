<template>
    <div class="excel-preview">
        <el-card>
            <template #header>
                <div class="card-header">
                    <span>Excel数据预览 - {{ previewData.sheetName }}</span>
                    <div class="header-actions">
                        <el-button type="primary" @click="confirmUpload" :loading="uploading">
                            确认上传
                        </el-button>
                        <el-button @click="cancelPreview">取消</el-button>
                    </div>
                </div>
            </template>

            <div class="three-column-layout">
                <!-- 左列：预览信息和操作 -->
                <div class="left-column">
                    <div class="preview-info">
                        <el-alert title="请选择表头行" description="点击任意行将其设置为表头，该行将作为字段名，后续行将作为数据" type="info" show-icon
                            :closable="false" />
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
                            :title="`已选择第 ${selectedHeaderRow + 1} 行作为表头`" type="success" show-icon :closable="false" />
                    </div>
                </div>

                <!-- 中列：Excel数据预览表格 -->
                <div class="middle-column">
                    <div class="preview-table-container">
                        <el-table :data="previewData.rows" border stripe highlight-current-row
                            @row-click="handleRowClick" :row-class-name="getRowClassName" max-height="500">
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
                </div>

                <!-- 右列：表结构预览 -->
                <div class="right-column" v-if="tableStructure && !parsing">
                    <div class="table-structure-preview">
                        <el-divider content-position="left">表结构预览</el-divider>
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
                            <el-table :data="tableStructure.columnDefinitions" border stripe>
                                <el-table-column prop="index" label="序号" width="60" align="center">
                                    <template #default="scope">
                                        {{ scope.$index + 1 }}
                                    </template>
                                </el-table-column>
                                <el-table-column prop="originalName" label="原始表头" min-width="120" show-overflow-tooltip>
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
                            <el-table :data="tableStructure.dataPreview" border stripe>
                                <el-table-column v-for="column in tableStructure.columnDefinitions" :key="column.name"
                                    :prop="column.name" :label="column.name" min-width="120">
                                    <template #default="scope">
                                        <div class="data-cell" :class="`type-${column.type}`">
                                            {{ scope.row[column.name] }}
                                        </div>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>
                    </div>
                </div>
            </div>

        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useFilesStore } from '@/stores/files'
import { apiService } from '@/services/api'
import { ElMessage } from 'element-plus'

interface Props {
    file: File
}

const props = defineProps<Props>()
const emit = defineEmits(['confirm', 'cancel'])

const filesStore = useFilesStore()
const selectedHeaderRow = ref(0) // 默认选择第一行作为表头
const uploading = ref(false)
const parsing = ref(false)
const tableStructure = ref<any>(null)

const previewData = computed(() => filesStore.previewData)

// 动态解析表结构
const parseTableStructure = async (headerRow: number) => {
    parsing.value = true
    try {
        console.log('开始动态解析，表头行:', headerRow, '文件:', props.file?.name)
        const response = await apiService.dynamicParseExcel(props.file, headerRow)
        console.log('动态解析响应:', response)
        if (response.success) {
            tableStructure.value = response.data
            console.log('表结构更新成功:', response.data)
        } else {
            console.error('表结构解析失败:', response.message)
            ElMessage.error(response.message || '表结构解析失败')
        }
    } catch (error: any) {
        console.error('动态解析错误:', error)
        ElMessage.error(error.message || '表结构解析失败')
    } finally {
        parsing.value = false
    }
}

// 监听表头行变化，动态解析表结构
watch(selectedHeaderRow, async (newHeaderRow, oldHeaderRow) => {
    if (previewData.value && newHeaderRow !== oldHeaderRow) {
        console.log('表头行变化:', oldHeaderRow, '->', newHeaderRow)
        await parseTableStructure(newHeaderRow)
    }
}, { immediate: true })

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

// 确认上传
const confirmUpload = async () => {
    if (selectedHeaderRow.value === -1) {
        ElMessage.warning('请先选择表头行')
        return
    }

    uploading.value = true
    try {
        await filesStore.uploadFile(props.file, selectedHeaderRow.value)
        ElMessage.success('文件上传成功')
        emit('confirm')
    } catch (error: any) {
        ElMessage.error(error.message || '文件上传失败')
    } finally {
        uploading.value = false
    }
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

// 取消预览
const cancelPreview = () => {
    filesStore.clearPreviewData()
    emit('cancel')
}
</script>

<style scoped>
.excel-preview {
    padding: 0;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-actions {
    display: flex;
    gap: 10px;
}

/* 三列布局样式 */
.three-column-layout {
    display: grid;
    grid-template-columns: 280px 320px 1fr;
    gap: 16px;
    align-items: start;
    min-height: 600px;
}

.left-column {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: fit-content;
}

.middle-column {
    min-height: 500px;
    overflow: hidden;
}

.right-column {
    min-height: 500px;
    overflow: hidden;
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

    .card-header {
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
    }

    .header-actions {
        width: 100%;
        justify-content: flex-start;
    }
}
</style>
