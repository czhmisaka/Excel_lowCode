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
                        <!-- 搜索区域 -->
                        <div class="search-section">
                            <el-select v-model="searchColumn" placeholder="选择列"
                                style="width: 150px; margin-right: 10px;">
                                <el-option label="全部列" value="all" />
                                <el-option v-for="column in availableSearchColumns" :key="column" :label="column"
                                    :value="column" />
                            </el-select>
                            <el-input v-model="searchKeyword" placeholder="输入搜索关键词"
                                style="width: 200px; margin-right: 10px;" @keyup.enter="handleSearch" clearable
                                @clear="clearSearch">
                                <template #append>
                                    <el-button @click="handleSearch">
                                        <el-icon>
                                            <Search />
                                        </el-icon>
                                    </el-button>
                                </template>
                            </el-input>
                            <el-button @click="clearSearch" :disabled="!hasSearchCondition">
                                <el-icon>
                                    <Close />
                                </el-icon>
                                清除
                            </el-button>
                            <el-button type="primary" @click="showAdvancedSearch = !showAdvancedSearch">
                                <el-icon>
                                    <Setting />
                                </el-icon>
                                高级搜索
                            </el-button>
                        </div>

                        <!-- 高级搜索面板 -->
                        <div v-if="showAdvancedSearch" class="advanced-search-panel">
                            <div class="advanced-search-form">
                                <div v-for="(condition, index) in advancedConditions" :key="index"
                                    class="condition-row">
                                    <el-select v-model="condition.column" placeholder="选择列"
                                        style="width: 150px; margin-right: 10px;">
                                        <el-option v-for="column in availableSearchColumns" :key="column"
                                            :label="column" :value="column" />
                                    </el-select>
                                    <el-select v-model="condition.operator" placeholder="操作符"
                                        style="width: 120px; margin-right: 10px;">
                                        <el-option v-for="option in getOperatorOptions(condition.column)"
                                            :key="option.value" :label="option.label" :value="option.value" />
                                    </el-select>
                                    <el-input v-model="condition.value" placeholder="输入值"
                                        style="width: 200px; margin-right: 10px;" />
                                    <el-button @click="removeCondition(index)" type="danger" link>
                                        <el-icon>
                                            <Remove />
                                        </el-icon>
                                    </el-button>
                                </div>
                                <div class="condition-actions">
                                    <el-button @click="addCondition" type="primary" link>
                                        <el-icon>
                                            <Plus />
                                        </el-icon>
                                        添加条件
                                    </el-button>
                                    <el-button @click="applyAdvancedSearch" type="primary">
                                        应用搜索
                                    </el-button>
                                    <el-button @click="clearAdvancedSearch">
                                        清除
                                    </el-button>
                                </div>
                            </div>
                        </div>

                        <!-- 操作按钮区域 -->
                        <div class="action-buttons">
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
                                <el-button type="primary" link @click="showEditDialog(scope.row)"
                                    :disabled="!scope.row.id">
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
                            :page-sizes="[10, 20, 50, 100, 1000]" :total="totalRecords"
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

        <!-- 编辑记录弹窗 -->
        <el-dialog v-model="editDialogVisible" title="编辑记录" width="600px" :before-close="handleEditDialogClose">
            <el-form :model="editRecordForm" label-width="100px" ref="editFormRef">
                <el-form-item v-for="column in filteredTableColumns" :key="column" :label="column" :prop="column">
                    <el-input v-model="editRecordForm[column]" :placeholder="`请输入${column}`" />
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="handleEditDialogClose">取消</el-button>
                    <el-button type="primary" @click="confirmEditRecord" :loading="editLoading">
                        确认编辑
                    </el-button>
                </span>
            </template>
        </el-dialog>

        <!-- Excel导入弹窗 -->
        <el-dialog v-model="importDialogVisible" title="导入Excel数据" width="90%" fullscreen
            :before-close="handleImportDialogClose">
            <ExcelImport v-if="importDialogVisible" :target-hash="selectedHash" @confirm="handleImportConfirm"
                @cancel="handleImportDialogClose" />
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFilesStore } from '@/stores/files'
import { useDataStore } from '@/stores/data'
import { apiService } from '@/services/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Plus, Delete, Upload, Search, Close, Setting, Remove } from '@element-plus/icons-vue'
import ExcelImport from '@/components/ExcelImport.vue'

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

// 编辑记录弹窗相关状态
const editDialogVisible = ref(false)
const editLoading = ref(false)
const editRecordForm = ref<any>({})
const editFormRef = ref()
const editingRecordId = ref<number | null>(null)

// Excel导入相关状态
const importDialogVisible = ref(false)

// 表结构信息
const tableStructure = ref<{
    columns: any[],
    searchCapabilities: { [key: string]: string[] }
}>({
    columns: [],
    searchCapabilities: {}
})

// 搜索相关状态
const searchColumn = ref('all')
const searchKeyword = ref('')
const showAdvancedSearch = ref(false)
const advancedConditions = ref<any[]>([
    { column: '', operator: 'like', value: '' }
])

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

// 搜索相关计算属性
const hasSearchCondition = computed(() => {
    return searchKeyword.value.trim() !== '' ||
        advancedConditions.value.some(condition =>
            condition.column && condition.value.trim() !== ''
        )
})

// 可用的搜索列（从表结构中获取）
const availableSearchColumns = computed(() => {
    if (tableStructure.value.columns.length === 0) {
        return tableColumns.value
    }
    return tableStructure.value.columns.map(col => col.name)
})

// 获取字段的操作符选项
const getOperatorOptions = (columnName: string) => {
    const capabilities = tableStructure.value.searchCapabilities[columnName] || ['like', 'eq', 'ne']
    const operatorLabels: { [key: string]: string } = {
        'like': '包含',
        'eq': '等于',
        'ne': '不等于',
        'gt': '大于',
        'lt': '小于',
        'gte': '大于等于',
        'lte': '小于等于'
    }
    return capabilities.map(op => ({
        label: operatorLabels[op] || op,
        value: op
    }))
}

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

// 显示编辑记录弹窗
const showEditDialog = (row: any) => {
    // 保存当前编辑的记录ID
    editingRecordId.value = row.id

    // 初始化表单数据，排除id字段
    editRecordForm.value = {}
    tableColumns.value.forEach(col => {
        if (col.toLowerCase() !== 'id') {
            editRecordForm.value[col] = row[col] || ''
        }
    })
    editDialogVisible.value = true
}

// 处理编辑弹窗关闭
const handleEditDialogClose = () => {
    editDialogVisible.value = false
    editRecordForm.value = {}
    editingRecordId.value = null
}

// 确认编辑记录
const confirmEditRecord = async () => {
    if (!editingRecordId.value) {
        ElMessage.error('未找到要编辑的记录')
        return
    }

    editLoading.value = true
    try {
        // 构建更新条件
        const conditions = { id: editingRecordId.value }
        const updates = { ...editRecordForm.value }

        await dataStore.updateData(conditions, updates)
        ElMessage.success('记录编辑成功')
        handleEditDialogClose()
        await loadData() // 重新加载数据以显示更新后的记录
    } catch (error: any) {
        ElMessage.error(error.message || '记录编辑失败')
    } finally {
        editLoading.value = false
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


// 处理Excel导入按钮点击
const handleImportExcel = () => {
    if (!selectedHash.value) {
        ElMessage.warning('请先选择要导入数据的文件')
        return
    }
    importDialogVisible.value = true
}

// 处理导入确认
const handleImportConfirm = (result: { successCount: number; errorCount: number }) => {
    ElMessage.success(`导入完成：成功 ${result.successCount} 条，失败 ${result.errorCount} 条`)
    handleImportDialogClose()
    loadData() // 重新加载数据
}

// 处理导入弹窗关闭
const handleImportDialogClose = () => {
    importDialogVisible.value = false
    clearImportData()
}

// 清除导入数据
const clearImportData = () => {
    // 清理导入相关数据（现在由ExcelImport组件管理）
}


// 搜索相关方法

// 处理搜索
const handleSearch = async () => {
    if (!searchKeyword.value.trim()) {
        ElMessage.warning('请输入搜索关键词')
        return
    }

    currentPage.value = 1
    await loadDataWithSearch()
}

// 清除搜索
const clearSearch = () => {
    searchColumn.value = 'all'
    searchKeyword.value = ''
    advancedConditions.value = [{ column: '', operator: 'like', value: '' }]
    currentPage.value = 1
    loadData()
}

// 添加搜索条件
const addCondition = () => {
    advancedConditions.value.push({ column: '', operator: 'like', value: '' })
}

// 移除搜索条件
const removeCondition = (index: number) => {
    if (advancedConditions.value.length > 1) {
        advancedConditions.value.splice(index, 1)
    } else {
        // 如果只剩一个条件，清空它而不是删除
        advancedConditions.value[0] = { column: '', operator: 'like', value: '' }
    }
}

// 应用高级搜索
const applyAdvancedSearch = async () => {
    const validConditions = advancedConditions.value.filter(condition =>
        condition.column && condition.value.trim() !== ''
    )

    if (validConditions.length === 0) {
        ElMessage.warning('请至少填写一个有效的搜索条件')
        return
    }

    currentPage.value = 1
    await loadDataWithSearch()
}

// 清除高级搜索
const clearAdvancedSearch = () => {
    advancedConditions.value = [{ column: '', operator: 'like', value: '' }]
}

// 带搜索条件的数据加载
const loadDataWithSearch = async () => {
    if (!selectedHash.value) return

    loading.value = true
    try {
        let searchConditions: any = {}

        // 处理简单搜索
        if (searchKeyword.value.trim()) {
            if (searchColumn.value === 'all') {
                // 在所有列中搜索
                searchConditions = {
                    $or: tableColumns.value.map(col => ({
                        [col]: { $like: `%${searchKeyword.value}%` }
                    }))
                }
            } else {
                // 在指定列中搜索
                searchConditions[searchColumn.value] = { $like: `%${searchKeyword.value}%` }
            }
        }

        // 处理高级搜索条件
        const validAdvancedConditions = advancedConditions.value.filter(condition =>
            condition.column && condition.value.trim() !== ''
        )

        if (validAdvancedConditions.length > 0) {
            validAdvancedConditions.forEach(condition => {
                const operator = getOperatorSymbol(condition.operator)
                searchConditions[condition.column] = { [operator]: condition.value }
            })
        }

        await dataStore.fetchData(selectedHash.value, {
            page: currentPage.value,
            limit: pageSize.value,
            search: Object.keys(searchConditions).length > 0 ? searchConditions : undefined
        })

        ElMessage.success('搜索完成')
    } catch (error) {
        console.error('搜索数据失败:', error)
        ElMessage.error('搜索失败，请检查搜索条件')
    } finally {
        loading.value = false
    }
}

// 获取操作符符号
const getOperatorSymbol = (operator: string): string => {
    const operatorMap: { [key: string]: string } = {
        'like': '$like',
        'eq': '$eq',
        'ne': '$ne',
        'gt': '$gt',
        'lt': '$lt'
    }
    return operatorMap[operator] || '$like'
}

// 修改原有的loadData方法，支持搜索参数
const originalLoadData = async () => {
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

// 获取表结构信息
const fetchTableStructure = async () => {
    if (!selectedHash.value) return

    try {
        const structure = await apiService.getTableStructure(selectedHash.value)
        tableStructure.value = structure
    } catch (error) {
        console.error('获取表结构信息失败:', error)
        ElMessage.error('获取表结构信息失败')
    }
}

// 重写loadData方法，支持搜索参数
const loadData = async () => {
    if (!selectedHash.value) return

    loading.value = true
    try {
        // 先获取表结构信息
        await fetchTableStructure()

        let searchConditions: any = {}

        // 处理简单搜索
        if (searchKeyword.value.trim()) {
            if (searchColumn.value === 'all') {
                searchConditions = {
                    $or: tableColumns.value.map(col => ({
                        [col]: { $like: `%${searchKeyword.value}%` }
                    }))
                }
            } else {
                searchConditions[searchColumn.value] = { $like: `%${searchKeyword.value}%` }
            }
        }

        // 处理高级搜索条件
        const validAdvancedConditions = advancedConditions.value.filter(condition =>
            condition.column && condition.value.trim() !== ''
        )

        if (validAdvancedConditions.length > 0) {
            validAdvancedConditions.forEach(condition => {
                const operator = getOperatorSymbol(condition.operator)
                searchConditions[condition.column] = { [operator]: condition.value }
            })
        }

        await dataStore.fetchData(selectedHash.value, {
            page: currentPage.value,
            limit: pageSize.value,
            search: Object.keys(searchConditions).length > 0 ? searchConditions : undefined
        })
    } catch (error) {
        console.error('加载数据失败:', error)
    } finally {
        loading.value = false
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

/* 搜索区域样式 */
.search-section {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;
}

.advanced-search-panel {
    margin-top: 15px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;
}

.advanced-search-form {
    margin-bottom: 15px;
}

.condition-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    padding: 10px;
    background-color: white;
    border-radius: 4px;
    border: 1px solid #e9ecef;
}

.condition-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
}

.action-buttons {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 15px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .search-section {
        flex-direction: column;
        align-items: stretch;
    }

    .search-section>* {
        margin-bottom: 10px;
        margin-right: 0 !important;
    }

    .condition-row {
        flex-direction: column;
        align-items: stretch;
    }

    .condition-row>* {
        margin-bottom: 10px;
        margin-right: 0 !important;
    }

    .action-buttons {
        flex-direction: column;
        align-items: stretch;
    }

    .action-buttons>* {
        margin-bottom: 10px;
    }
}
</style>
