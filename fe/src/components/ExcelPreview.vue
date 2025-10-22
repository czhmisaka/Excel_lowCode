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

            <div class="preview-info">
                <el-alert title="请选择表头行" description="点击任意行将其设置为表头，该行将作为字段名，后续行将作为数据" type="info" show-icon
                    :closable="false" />
                <div class="info-stats">
                    <span>总行数: {{ previewData.totalRows }}</span>
                    <span>总列数: {{ previewData.totalColumns }}</span>
                    <span>当前选择表头行: {{ selectedHeaderRow + 1 }}</span>
                </div>
            </div>

            <div class="preview-table-container">
                <el-table :data="previewData.rows" border stripe highlight-current-row @row-click="handleRowClick"
                    :row-class-name="getRowClassName" max-height="500">
                    <el-table-column type="index" label="行号" width="80" align="center">
                        <template #default="scope">
                            {{ scope.$index + 1 }}
                        </template>
                    </el-table-column>
                    <el-table-column v-for="(cell, cellIndex) in previewData.rows[0]?.data || []" :key="cellIndex"
                        :label="`列 ${cellIndex + 1}`" :prop="`data[${cellIndex}]`" min-width="120">
                        <template #default="scope">
                            <div class="cell-content" :class="{ 'header-row': scope.$index === selectedHeaderRow }">
                                {{ scope.row.data[cellIndex] }}
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <div class="preview-footer">
                <el-alert v-if="selectedHeaderRow !== -1" :title="`已选择第 ${selectedHeaderRow + 1} 行作为表头`" type="success"
                    show-icon :closable="false" />
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFilesStore } from '@/stores/files'
import { ElMessage } from 'element-plus'

interface Props {
    file: File
}

const props = defineProps<Props>()
const emit = defineEmits(['confirm', 'cancel'])

const filesStore = useFilesStore()
const selectedHeaderRow = ref(0) // 默认选择第一行作为表头
const uploading = ref(false)

const previewData = computed(() => filesStore.previewData)

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

.preview-info {
    margin-bottom: 20px;
}

.info-stats {
    margin-top: 10px;
    display: flex;
    gap: 20px;
    font-size: 14px;
    color: #666;
}

.preview-table-container {
    margin-bottom: 20px;
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
    margin-top: 20px;
}

:deep(.selected-header-row) {
    background-color: #f0f9ff !important;
}

:deep(.selected-header-row .cell) {
    background-color: #f0f9ff !important;
    font-weight: bold;
    color: #1890ff;
}
</style>
