<template>
    <div class="data-editor">
        <el-card>
            <template #header>
                <div class="card-header">
                    <span>数据编辑</span>
                    <div class="header-actions">
                        <el-select v-model="selectedHash" placeholder="选择文件" style="width: 200px; margin-right: 10px;">
                            <el-option v-for="file in fileList" :key="file.hash" :label="file.originalFileName"
                                :value="file.hash" />
                        </el-select>
                        <el-button type="primary" @click="loadData" :disabled="!selectedHash">
                            <el-icon>
                                <Refresh />
                            </el-icon>
                            加载数据
                        </el-button>
                    </div>
                </div>
            </template>

            <div class="editor-content">
                <div class="info-tip" v-if="!selectedHash">
                    <el-alert title="请先选择要编辑的文件" type="info" show-icon :closable="false" />
                </div>

                <div v-else>
                    <div class="editor-toolbar">
                        <el-button type="primary" @click="showAddDialog">
                            <el-icon>
                                <Plus />
                            </el-icon>
                            新增记录
                        </el-button>
                        <el-button type="success" @click="handleImportExcel">
                            <el-icon>
                                <Upload />
                            </el-icon>
                            导入Excel
                        </el-button>
                        <el-button type="danger" @click="deleteSelectedRows" :disabled="selectedRows.length === 0">
                            <el-icon>
                                <Delete />
                            </el-icon>
                            删除选中
                        </el-button>
                    </div>

                    <el-table :data="tableData" v-loading="loading" border style="width: 100%"
                        @selection-change="handleSelectionChange">
                        <el-table-column type="selection" width="55" />
                        <el-table-column v-for="column in tableColumns" :key="column" :prop="column" :label="column"
                            min-width="120">
                            <template #default="scope">
                                <el-input v-if="editingRow === scope.$index && column.toLowerCase() !== 'id'"
                                    v-model="scope.row[column]" @blur="saveRowEdit(scope.row)" />
                                <span v-else @dblclick="column.toLowerCase() !== 'id' ? startEdit(scope.$index) : null"
                                    :class="{ 'non-editable': column.toLowerCase() === 'id' }">
                                    {{ scope.row[column] }}
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="150" fixed="right">
                            <template #default="scope">
                                <el-button type="primary" link @click="startEdit(scope.$index)"
                                    :disabled="hasIdColumn && scope.row.id">
                                    编辑
                                </el-button>
                                <el-button type="danger" link @click="deleteSingleRow(scope.row, scope.$index)">
                                    删除
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>

                    <div class="pagination" v-if="tableData.length > 0">
                        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                            :page-sizes="[10, 20, 50, 100]" :total="totalRecords"
                            layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
                            @current-change="handleCurrentChange" />
                    </div>
                </div>
            </div>
        </el-card>

        <!-- 新增记录弹窗 -->
        <el-dialog v-model="addDialogVisible" title="新增记录" width="600px" :before-close="handleAddDialogClose">
            <el-form :model="newRecordForm" label-width="100px" ref="addFormRef">
                <el-form-item v-for="column in filteredTableColumns" :key="column" :label="column" :prop="column">
                    <el-input v-model="newRecordForm[column]" :placeholder="`请输入${column}`" />
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="handleAddDialogClose">取消</el-button>
                    <el-button type="primary" @click="confirmAddRecord" :loading="addLoading">
                        确认新增
                    </el-button>
                </span>
            </template>
        </el-dialog>

        <!-- Excel导入弹窗 -->
        <el-dialog v-model="importDialogVisible" title="导入Excel数据" width="800px"
            :before-close="handleImportDialogClose">
            <div class="import-content">
                <!-- 文件上传区域 -->
                <div class="upload-section">
                    <el-upload class="upload-demo" :auto-upload="false" :show-file-list="false"
                        :on-change="handleFileChange" accept=".xlsx,.xls">
                        <template #trigger>
                            <el-button type="primary">选择Excel文件</el-button>
                        </template>
                        <template #tip>
                            <div class="el-upload__tip">
                                请选择.xlsx或.xls格式的Excel文件
                            </div>
                        </template>
                    </el-upload>
                    <div v-if="importFile" class="file-info">
                        <el-icon>
                            <Document />
                        </el-icon>
                        <span>{{ importFile.name }}</span>
                        <el-button type="text" @click="clearFile">清除</el-button>
                    </div>
                </div>

                <!-- 数据预览区域 -->
                <div v-if="importPreviewData.length > 0" class="preview-section">
                    <h4>数据预览 (共{{ importPreviewData.length }}条记录)</h4>
                    <el-table :data="importPreviewData.slice(0, 5)" border height="200">
                        <el-table-column v-for="column in Object.keys(importPreviewData[0] || {})" :key="column"
                            :prop="column" :label="column" min-width="120" />
                    </el-table>
                    <div v-if="importPreviewData.length > 5" class="preview-tip">
                        仅显示前5条记录，共{{ importPreviewData.length }}条记录
                    </div>
                </div>

                <!-- 字段匹配验证 -->
                <div v-if="importPreviewData.length > 0" class="validation-section">
                    <h4>字段匹配验证</h4>
                    <div v-if="isColumnsMatched" class="validation-success">
                        <el-icon color="#67C23A">
                            <SuccessFilled />
                        </el-icon>
                        <span v-if="missingColumnsCount === 0">
                            Excel字段与当前表字段完全匹配
                        </span>
                        <span v-else>
                            Excel字段与当前表字段部分匹配（{{ matchedColumnsCount }}/{{ totalColumnsCount }}个字段匹配，{{
                                missingColumnsCount
                            }}个字段缺失）
                        </span>
                    </div>
                    <div v-else class="validation-error">
                        <el-icon color="#F56C6C">
                            <WarningFilled />
                        </el-icon>
                        <span>Excel字段与当前表字段不匹配，请检查文件格式</span>
                    </div>
                </div>

                <!-- 导入进度 -->
                <div v-if="importProgress > 0" class="progress-section">
                    <h4>导入进度</h4>
                    <el-progress :percentage="importProgress" :status="importProgress === 100 ? 'success' : ''" />
                </div>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="handleImportDialogClose">取消</el-button>
                    <el-button type="primary" @click="confirmImport" :loading="importLoading"
                        :disabled="!importFile || importPreviewData.length === 0 || !isColumnsMatched">
                        确认导入 ({{ importPreviewData.length }}条记录)
                    </el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFilesStore } from '@/stores/files'
import { useDataStore } from '@/stores/data'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Plus, Delete, Upload, Document, SuccessFilled, WarningFilled } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'

const route = useRoute()
const router = useRouter()
const filesStore = useFilesStore()
const dataStore = useDataStore()

// 状态
const loading = ref(false)
const selectedHash = ref('')
const fileList = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const editingRow = ref(-1)
const selectedRows = ref<any[]>([])

// 新增记录弹窗相关状态
const addDialogVisible = ref(false)
const addLoading = ref(false)
const newRecordForm = ref<any>({})
const addFormRef = ref()

// Excel导入相关状态
const importDialogVisible = ref(false)
const importLoading = ref(false)
const importFile = ref<File | null>(null)
const importPreviewData = ref<any[]>([])
const importProgress = ref(0)

// 计算属性
const tableData = computed(() => dataStore.currentData)
const tableColumns = computed(() => {
    if (tableData.value.length === 0) return []
    return Object.keys(tableData.value[0])
})
const filteredTableColumns = computed(() => {
    return tableColumns.value.filter(col => col.toLowerCase() !== 'id')
})
const hasIdColumn = computed(() => {
    return tableColumns.value.some(col => col.toLowerCase() === 'id')
})
const totalRecords = computed(() => dataStore.pagination.total)

// 初始化数据
const initData = async () => {
    try {
        await filesStore.fetchMappings()
        fileList.value = filesStore.fileList

        // 检查URL参数并自动加载数据
        await handleUrlHashParam()
    } catch (error) {
        console.error('获取文件列表失败:', error)
    }
}

// 处理URL中的hash参数
const handleUrlHashParam = async () => {
    const hashFromUrl = route.query.hash as string
    if (hashFromUrl && fileList.value.length > 0) {
        // 检查hash是否在文件列表中
        const fileExists = fileList.value.some(file => file.hash === hashFromUrl)
        if (fileExists) {
            selectedHash.value = hashFromUrl
            await loadData()
        } else {
            console.warn(`URL中的hash参数 ${hashFromUrl} 不在文件列表中`)
        }
    } else if (fileList.value.length > 0) {
        // 如果没有hash参数，默认加载第一个表
        selectedHash.value = fileList.value[0].hash
        await loadData()
    }
}

// 监听selectedHash变化，更新URL参数
watch(selectedHash, (newHash) => {
    if (newHash) {
        // 更新URL参数，但不触发页面跳转
        router.replace({
            query: { ...route.query, hash: newHash }
        })
    } else {
        // 清除hash参数
        const { hash, ...otherQueries } = route.query
        router.replace({ query: otherQueries })
    }
})

// 监听路由参数变化
watch(() => route.query.hash, async (newHash) => {
    if (newHash && newHash !== selectedHash.value && fileList.value.length > 0) {
        const fileExists = fileList.value.some(file => file.hash === newHash)
        if (fileExists) {
            selectedHash.value = newHash as string
            await loadData()
        }
    }
})

// 加载数据
const loadData = async () => {
    if (!selectedHash.value) return

    loading.value = true
    try {
        await dataStore.fetchData(selectedHash.value, {
            page: currentPage.value,
            limit: pageSize.value
        })
    } catch (error) {
        console.error('加载数据失败:', error)
    } finally {
        loading.value = false
    }
}

// 分页处理
const handleSizeChange = (size: number) => {
    pageSize.value = size
    currentPage.value = 1
    loadData()
}

const handleCurrentChange = (page: number) => {
    currentPage.value = page
    loadData()
}

// 行选择处理
const handleSelectionChange = (selection: any[]) => {
    selectedRows.value = selection
}

// 开始编辑行
const startEdit = (index: number) => {
    editingRow.value = index
}

// 保存行编辑
const saveRowEdit = async (row: any) => {
    try {
        // 这里需要根据实际数据结构构建更新条件
        const conditions = { id: row.id } // 假设有id字段
        const updates = { ...row }
        delete updates.id // 移除id字段

        await dataStore.updateData(conditions, updates)
        ElMessage.success('数据更新成功')
        editingRow.value = -1
    } catch (error: any) {
        ElMessage.error(error.message || '数据更新失败')
    }
}


// 删除选中行
const deleteSelectedRows = async () => {
    try {
        await ElMessageBox.confirm(
            `确定要删除选中的 ${selectedRows.value.length} 条记录吗？`,
            '确认删除',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )

        // 这里需要根据实际数据结构构建删除条件
        for (const row of selectedRows.value) {
            const conditions = { id: row.id } // 假设有id字段
            await dataStore.deleteData(conditions)
        }

        ElMessage.success('删除成功')
        selectedRows.value = []
        await loadData() // 重新加载数据
    } catch (error: any) {
        if (error !== 'cancel') {
            ElMessage.error(error.message || '删除失败')
        }
    }
}

// 显示新增记录弹窗
const showAddDialog = () => {
    // 初始化表单数据，排除id字段
    newRecordForm.value = {}
    tableColumns.value.forEach(col => {
        if (col.toLowerCase() !== 'id') {
            newRecordForm.value[col] = ''
        }
    })
    addDialogVisible.value = true
}

// 处理弹窗关闭
const handleAddDialogClose = () => {
    addDialogVisible.value = false
    newRecordForm.value = {}
}

// 确认新增记录
const confirmAddRecord = async () => {
    addLoading.value = true
    try {
        await dataStore.addData(newRecordForm.value)
        ElMessage.success('新增记录成功')
        handleAddDialogClose()
        await loadData() // 重新加载数据以显示新增的记录
    } catch (error: any) {
        ElMessage.error(error.message || '新增记录失败')
    } finally {
        addLoading.value = false
    }
}

// 删除单行
const deleteSingleRow = async (row: any, index: number) => {
    try {
        await ElMessageBox.confirm(
            '确定要删除这条记录吗？',
            '确认删除',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )

        // 构建删除条件
        const conditions = { id: row.id } // 假设有id字段
        await dataStore.deleteData(conditions)

        ElMessage.success('删除成功')
        await loadData() // 重新加载数据
    } catch (error: any) {
        if (error !== 'cancel') {
            ElMessage.error(error.message || '删除失败')
        }
    }
}

// Excel导入相关方法

// 字段匹配验证计算属性
const isColumnsMatched = computed(() => {
    if (importPreviewData.value.length === 0 || tableColumns.value.length === 0) {
        return false
    }

    const excelColumns = Object.keys(importPreviewData.value[0])
    const tableColumnsLower = tableColumns.value.map(col => col.toLowerCase())
    const excelColumnsLower = excelColumns.map(col => col.toLowerCase())

    // 检查Excel列是否与表字段匹配（排除id列）
    const filteredTableColumns = tableColumnsLower.filter(col => col !== 'id')

    // 宽松匹配：只要至少有一个字段匹配就允许导入
    return filteredTableColumns.some(col => excelColumnsLower.includes(col))
})

// 获取匹配的字段数量
const matchedColumnsCount = computed(() => {
    if (importPreviewData.value.length === 0 || tableColumns.value.length === 0) {
        return 0
    }

    const excelColumns = Object.keys(importPreviewData.value[0])
    const tableColumnsLower = tableColumns.value.map(col => col.toLowerCase())
    const excelColumnsLower = excelColumns.map(col => col.toLowerCase())

    const filteredTableColumns = tableColumnsLower.filter(col => col !== 'id')
    return filteredTableColumns.filter(col => excelColumnsLower.includes(col)).length
})

// 获取缺失的字段数量
const missingColumnsCount = computed(() => {
    if (importPreviewData.value.length === 0 || tableColumns.value.length === 0) {
        return 0
    }

    const excelColumns = Object.keys(importPreviewData.value[0])
    const tableColumnsLower = tableColumns.value.map(col => col.toLowerCase())
    const excelColumnsLower = excelColumns.map(col => col.toLowerCase())

    const filteredTableColumns = tableColumnsLower.filter(col => col !== 'id')
    return filteredTableColumns.filter(col => !excelColumnsLower.includes(col)).length
})

// 获取总字段数量（排除id）
const totalColumnsCount = computed(() => {
    if (tableColumns.value.length === 0) {
        return 0
    }
    return tableColumns.value.filter(col => col.toLowerCase() !== 'id').length
})

// 处理Excel导入按钮点击
const handleImportExcel = () => {
    if (!selectedHash.value) {
        ElMessage.warning('请先选择要导入数据的文件')
        return
    }
    importDialogVisible.value = true
}

// 处理导入弹窗关闭
const handleImportDialogClose = () => {
    importDialogVisible.value = false
    clearImportData()
}

// 清除导入数据
const clearImportData = () => {
    importFile.value = null
    importPreviewData.value = []
    importProgress.value = 0
}

// 清除文件
const clearFile = () => {
    importFile.value = null
    importPreviewData.value = []
}

// 处理文件选择
const handleFileChange = (file: any) => {
    const fileObj = file.raw
    if (!fileObj) return

    // 检查文件类型
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
    if (!validTypes.includes(fileObj.type)) {
        ElMessage.error('请选择有效的Excel文件 (.xlsx 或 .xls)')
        return
    }

    importFile.value = fileObj
    parseExcelFile(fileObj)
}

// 解析Excel文件
const parseExcelFile = (file: File) => {
    const reader = new FileReader()

    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer)
            const workbook = XLSX.read(data, { type: 'array' })

            // 获取第一个工作表
            const firstSheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[firstSheetName]

            // 将工作表转换为JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet)

            if (jsonData.length === 0) {
                ElMessage.warning('Excel文件中没有数据')
                return
            }

            importPreviewData.value = jsonData
            ElMessage.success(`成功解析 ${jsonData.length} 条记录`)

        } catch (error) {
            console.error('Excel解析失败:', error)
            ElMessage.error('Excel文件解析失败，请检查文件格式')
        }
    }

    reader.onerror = () => {
        ElMessage.error('文件读取失败')
    }

    reader.readAsArrayBuffer(file)
}

// 确认导入
const confirmImport = async () => {
    if (!importFile.value || importPreviewData.value.length === 0 || !isColumnsMatched.value) {
        ElMessage.error('请先选择有效的Excel文件并确保字段匹配')
        return
    }

    try {
        await ElMessageBox.confirm(
            `确定要导入 ${importPreviewData.value.length} 条记录吗？${missingColumnsCount.value > 0 ? ` (${missingColumnsCount.value}个字段将自动填充为空值)` : ''}`,
            '确认导入',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )

        importLoading.value = true
        importProgress.value = 0

        // 批量导入数据
        const totalRecords = importPreviewData.value.length
        let successCount = 0
        let errorCount = 0
        const errorMessages: string[] = []

        // 获取表字段列表（排除id）
        const tableColumnsLower = tableColumns.value.map(col => col.toLowerCase())
        const targetColumns = tableColumns.value.filter(col => col.toLowerCase() !== 'id')

        for (let i = 0; i < totalRecords; i++) {
            try {
                const record = importPreviewData.value[i]

                // 构建完整的数据对象，自动填充缺失字段
                const completeRecord: any = {}

                // 为每个目标字段设置值
                targetColumns.forEach(column => {
                    const columnLower = column.toLowerCase()
                    // 查找Excel中对应的字段（不区分大小写）
                    const excelKey = Object.keys(record).find(key => key.toLowerCase() === columnLower)

                    if (excelKey !== undefined) {
                        // 如果Excel中有这个字段，使用Excel的值
                        completeRecord[column] = record[excelKey]
                    } else {
                        // 如果Excel中没有这个字段，填充为空值
                        completeRecord[column] = ''
                    }
                })

                await dataStore.addData(completeRecord)
                successCount++
            } catch (error: any) {
                errorCount++
                errorMessages.push(`第${i + 1}条记录导入失败: ${error.message}`)
            }

            // 更新进度
            importProgress.value = Math.round(((i + 1) / totalRecords) * 100)
        }

        // 显示导入结果
        if (errorCount === 0) {
            ElMessage.success(`成功导入 ${successCount} 条记录${missingColumnsCount.value > 0 ? ` (${missingColumnsCount.value}个字段已自动填充为空值)` : ''}`)
        } else {
            ElMessage.warning(`导入完成：成功 ${successCount} 条，失败 ${errorCount} 条${missingColumnsCount.value > 0 ? ` (${missingColumnsCount.value}个字段已自动填充为空值)` : ''}`)
            console.error('导入失败记录:', errorMessages)
        }

        // 关闭弹窗并重新加载数据
        handleImportDialogClose()
        await loadData()

    } catch (error: any) {
        if (error !== 'cancel') {
            ElMessage.error(error.message || '导入失败')
        }
    } finally {
        importLoading.value = false
    }
}

onMounted(() => {
    initData()
})
</script>

<style scoped>
.data-editor {
    padding: 0;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-actions {
    display: flex;
    align-items: center;
}

.editor-content {
    margin-top: 20px;
}

.info-tip {
    margin-bottom: 20px;
}

.editor-toolbar {
    margin-bottom: 20px;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

.non-editable {
    color: #909399;
    cursor: not-allowed;
    user-select: none;
}

/* Excel导入弹窗样式 */
.import-content {
    max-height: 60vh;
    overflow-y: auto;
}

.upload-section {
    margin-bottom: 20px;
    padding: 20px;
    border: 1px dashed #dcdfe6;
    border-radius: 4px;
    text-align: center;
}

.file-info {
    margin-top: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.preview-section {
    margin-bottom: 20px;
}

.preview-tip {
    margin-top: 10px;
    color: #909399;
    font-size: 12px;
    text-align: center;
}

.validation-section {
    margin-bottom: 20px;
    padding: 15px;
    border-radius: 4px;
}

.validation-success {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #67c23a;
    background-color: #f0f9eb;
    padding: 10px;
    border-radius: 4px;
}

.validation-error {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #f56c6c;
    background-color: #fef0f0;
    padding: 10px;
    border-radius: 4px;
}

.progress-section {
    margin-bottom: 10px;
}

.import-content h4 {
    margin: 15px 0 10px 0;
    color: #303133;
    font-weight: 600;
}
</style>
