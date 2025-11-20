<template>
    <div class="file-management fade-in-up">
        <!-- 工具栏 -->
        <div class="modern-toolbar">
            <div class="toolbar-content">
                <el-button type="primary" :icon="Upload" @click="showUploadDialog = true" class="modern-button">
                    上传文件
                </el-button>
                <el-button :icon="Refresh" @click="initData" class="modern-button">
                    刷新
                </el-button>
            </div>
        </div>

        <!-- 文件表格 -->
        <div class="modern-card">
            <el-table :data="fileList" v-loading="loading" border stripe class="modern-table" @expand-change="handleExpandChange">
                <el-table-column type="expand" width="50">
                    <template #default="scope">
                        <div class="table-data-preview">
                            <div class="preview-header">
                                <h3>{{ scope.row.originalFileName }} - 数据预览</h3>
                                <div class="preview-info">
                                    <span>共 {{ scope.row.totalRecords || 0 }} 条记录</span>
                                </div>
                            </div>
                            <div class="preview-content">
                                <el-table :data="scope.row.tableData" v-loading="scope.row.loadingData" border stripe
                                    size="small" class="preview-table">
                                    <el-table-column v-for="column in scope.row.tableColumns" :key="column.prop"
                                        :prop="column.prop" :label="column.label" :min-width="column.width || 120" />
                                </el-table>
                            </div>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="文件名" min-width="200">
                    <template #default="scope">
                        <div class="file-name-cell" @click="handleFileNameClick(scope.row, scope.$index)">
                            <span class="file-name">{{ scope.row.originalFileName }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="tableName" label="表名" width="150" />
                <el-table-column prop="hash" label="文件哈希" width="320">
                    <template #default="scope">
                        <div class="hash-cell">
                            <el-tooltip :content="scope.row.hash" placement="top">
                                <span class="hash-value">{{ formatHash(scope.row.hash) }}</span>
                            </el-tooltip>
                            <el-button type="text" size="small" @click="copyHash(scope.row.hash)" class="copy-btn">
                                <el-icon>
                                    <CopyDocument />
                                </el-icon>
                            </el-button>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="recordCount" label="记录数" width="100" />
                <el-table-column prop="columnCount" label="列数" width="80" />
                <el-table-column prop="createdAt" label="上传时间" width="180" />
                <el-table-column label="操作" width="280">
                    <template #default="scope">
                        <el-button type="primary" link @click="editData(scope.row)">编辑数据</el-button>
                        <el-button type="primary" link @click="viewData(scope.row)">查看数据</el-button>
                        <el-button type="primary" link @click="viewColumnDefinitions(scope.row)">查看结构</el-button>
                        <el-button type="primary" link @click="openEditTableNameDialog(scope.row)">编辑表名</el-button>
                        <el-button type="danger" link @click="deleteFile(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <!-- 文件上传对话框 -->
        <el-dialog v-model="showUploadDialog" title="上传Excel文件" width="500px">
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
            <template #footer>
                <el-button @click="showUploadDialog = false">取消</el-button>
                <el-button type="primary" @click="previewFile" :loading="previewLoading">
                    预览并上传
                </el-button>
            </template>
        </el-dialog>

        <!-- 数据预览对话框 -->
        <el-dialog v-model="showPreviewDialog" title="Excel数据预览" fullscreen>
            <ExcelPreview v-if="selectedFile" :file="selectedFile" @confirm="handlePreviewConfirm"
                @cancel="handlePreviewCancel" />
        </el-dialog>

        <!-- 列定义对话框 -->
        <el-dialog v-model="showColumnDialog" title="表结构信息" width="600px">
            <div class="column-definitions" v-if="selectedMapping">
                <div class="table-info">
                    <h3>{{ selectedMapping.tableName }}</h3>
                    <p>文件: {{ selectedMapping.originalFileName }}</p>
                    <p>记录数: {{ selectedMapping.recordCount }} | 列数: {{ selectedMapping.columnCount }}</p>
                </div>

                <div v-if="loadingStructure" class="loading-structure">
                    <el-skeleton :rows="5" animated />
                </div>
                <el-table v-else :data="selectedMapping.columnDefinitions" border>
                    <el-table-column prop="name" label="列名" width="150" />
                    <el-table-column prop="type" label="数据类型" width="120" />
                    <el-table-column prop="nullable" label="可空" width="80">
                        <template #default="scope">
                            <el-tag :type="scope.row.nullable ? 'info' : 'warning'">
                                {{ scope.row.nullable ? '是' : '否' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="defaultValue" label="默认值" />
                </el-table>
            </div>

            <template #footer>
                <el-button @click="showColumnDialog = false">关闭</el-button>
            </template>
        </el-dialog>

        <!-- 编辑表名对话框 -->
        <el-dialog v-model="showEditTableNameDialog" title="编辑表名" width="500px">
            <div class="edit-table-name-form" v-if="editingMapping">
                <el-form :model="editTableNameForm" :rules="editTableNameRules" ref="editTableNameFormRef"
                    label-width="80px">
                    <el-form-item label="表名" prop="tableName">
                        <el-input v-model="editTableNameForm.tableName" placeholder="请输入表名" maxlength="255"
                            show-word-limit />
                    </el-form-item>
                </el-form>
            </div>

            <template #footer>
                <el-button @click="showEditTableNameDialog = false">取消</el-button>
                <el-button type="primary" @click="saveTableName" :loading="savingTableName">保存</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useFilesStore } from '@/stores/files'
import { apiService } from '@/services/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, UploadFilled, Refresh, CopyDocument, ArrowRight } from '@element-plus/icons-vue'
import ExcelPreview from '@/components/ExcelPreview.vue'

const router = useRouter()
const filesStore = useFilesStore()

// 状态
const loading = ref(false)
const showUploadDialog = ref(false)
const showPreviewDialog = ref(false)
const previewLoading = ref(false)
const uploading = ref(false)
const selectedFile = ref<File | null>(null)
const fileList = ref<any[]>([])

// 映射关系相关状态
const showColumnDialog = ref(false)
const selectedMapping = ref<any>(null)
const loadingStructure = ref(false)
const showEditTableNameDialog = ref(false)
const editingMapping = ref<any>(null)
const savingTableName = ref(false)
const editTableNameFormRef = ref()
const editTableNameForm = ref({
    tableName: ''
})

// 表名验证规则
const editTableNameRules = {
    tableName: [
        { required: true, message: '请输入表名', trigger: 'blur' },
        { min: 1, max: 255, message: '表名长度在 1 到 255 个字符', trigger: 'blur' }
    ]
}

// 初始化数据
const initData = async () => {
    loading.value = true
    try {
        await filesStore.fetchMappings()
        fileList.value = filesStore.fileList
    } catch (error) {
        console.error('获取文件列表失败:', error)
    } finally {
        loading.value = false
    }
}

// 文件选择处理
const handleFileChange = (file: any) => {
    selectedFile.value = file.raw
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

// 预览文件
const previewFile = async () => {
    if (!selectedFile.value) {
        ElMessage.warning('请选择要上传的文件')
        return
    }

    previewLoading.value = true
    try {
        await filesStore.previewExcelFile(selectedFile.value)
        showUploadDialog.value = false
        showPreviewDialog.value = true
    } catch (error: any) {
        ElMessage.error(error.message || '文件预览失败')
    } finally {
        previewLoading.value = false
    }
}

// 处理预览确认
const handlePreviewConfirm = () => {
    showPreviewDialog.value = false
    selectedFile.value = null
    initData() // 刷新文件列表
}

// 处理预览取消
const handlePreviewCancel = () => {
    showPreviewDialog.value = false
    selectedFile.value = null
}

// 上传文件（旧版本，保持向后兼容）
const uploadFile = async () => {
    if (!selectedFile.value) {
        ElMessage.warning('请选择要上传的文件')
        return
    }

    uploading.value = true
    try {
        await filesStore.uploadFile(selectedFile.value)
        ElMessage.success('文件上传成功')
        showUploadDialog.value = false
        selectedFile.value = null
        await initData() // 刷新文件列表
    } catch (error: any) {
        ElMessage.error(error.message || '文件上传失败')
    } finally {
        uploading.value = false
    }
}

// 查看数据
const viewData = (file: any) => {
    router.push({ name: 'DataBrowser', query: { hash: file.hash } })
}

// 查看数据
const editData = (file: any) => {
    router.push({ name: 'DataEditor', query: { hash: file.hash } })
}

// 删除文件
const deleteFile = async (file: any) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除文件 "${file.originalFileName}" 吗？此操作将删除所有相关数据。`,
            '确认删除',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )

        await filesStore.deleteFile(file.hash)
        ElMessage.success('文件删除成功')
        await initData() // 刷新文件列表
    } catch (error: any) {
        if (error !== 'cancel') {
            ElMessage.error(error.message || '文件删除失败')
        }
    }
}

// 格式化哈希值显示
const formatHash = (hash: string) => {
    if (hash.length > 20) {
        return `${hash.substring(0, 10)}...${hash.substring(hash.length - 10)}`
    }
    return hash
}

// 复制哈希值
const copyHash = async (hash: string) => {
    try {
        await navigator.clipboard.writeText(hash)
        ElMessage.success('哈希值已复制到剪贴板')
    } catch (error) {
        // 如果clipboard API不可用，使用备用方法
        const textArea = document.createElement('textarea')
        textArea.value = hash
        document.body.appendChild(textArea)
        textArea.select()
        try {
            document.execCommand('copy')
            ElMessage.success('哈希值已复制到剪贴板')
        } catch (err) {
            ElMessage.error('复制失败，请手动复制')
        }
        document.body.removeChild(textArea)
    }
}

// 查看列定义
const viewColumnDefinitions = async (file: any) => {
    loadingStructure.value = true
    try {
        // 从后端获取真实的表结构信息
        const structure = await apiService.getTableStructure(file.hash)

        selectedMapping.value = {
            ...file,
            columnDefinitions: structure.columns || []
        }
        showColumnDialog.value = true
    } catch (error) {
        console.error('获取表结构信息失败:', error)
        // 如果获取失败，使用模拟数据作为备用
        selectedMapping.value = {
            ...file,
            columnDefinitions: generateColumnDefinitions(file.columnCount)
        }
        showColumnDialog.value = true
        ElMessage.warning('获取表结构信息失败，显示模拟数据')
    } finally {
        loadingStructure.value = false
    }
}

// 生成模拟的列定义（实际应该从后端获取）
const generateColumnDefinitions = (columnCount: number) => {
    const types = ['string', 'number', 'date', 'boolean']
    const definitions = []

    for (let i = 1; i <= columnCount; i++) {
        definitions.push({
            name: `column_${i}`,
            type: types[Math.floor(Math.random() * types.length)],
            nullable: Math.random() > 0.5,
            defaultValue: null
        })
    }

    return definitions
}

// 显示编辑表名对话框
const openEditTableNameDialog = (file: any) => {
    editingMapping.value = file
    editTableNameForm.value.tableName = file.tableName
    showEditTableNameDialog.value = true

    // 重置表单验证
    nextTick(() => {
        if (editTableNameFormRef.value) {
            editTableNameFormRef.value.clearValidate()
        }
    })
}

// 保存表名
const saveTableName = async () => {
    if (!editTableNameFormRef.value) return

    // 验证表单
    const valid = await editTableNameFormRef.value.validate()
    if (!valid) return

    const newTableName = editTableNameForm.value.tableName.trim()

    // 如果表名没有变化，直接关闭对话框
    if (newTableName === editingMapping.value.tableName) {
        showEditTableNameDialog.value = false
        return
    }

    savingTableName.value = true
    try {
        // 调用API更新表名
        const response = await apiService.updateMapping(editingMapping.value.hash, newTableName)

        if (response.success) {
            ElMessage.success('表名更新成功')
            // 更新列表中的表名
            editingMapping.value.tableName = newTableName
            showEditTableNameDialog.value = false
            await initData() // 刷新文件列表
        } else {
            ElMessage.error(response.message || '更新表名失败')
        }
    } catch (error: any) {
        console.error('更新表名失败:', error)
        ElMessage.error(error.response?.data?.message || '更新表名失败')
    } finally {
        savingTableName.value = false
    }
}

// 切换表格数据展开状态
const toggleTableData = async (file: any, index: number) => {
    // 如果已经展开，则关闭
    if (file.expanded) {
        file.expanded = false
        return
    }

    // 关闭其他展开的行
    fileList.value.forEach((item, i) => {
        if (i !== index) {
            item.expanded = false
        }
    })

    // 展开当前行
    file.expanded = true

    // 如果还没有加载过数据，则加载数据
    if (!file.tableData || file.tableData.length === 0) {
        await loadTableData(file)
    }
}

// 加载表格数据
const loadTableData = async (file: any, page: number = 1) => {
    file.loadingData = true
    try {
        // 获取表结构信息
        const structure = await apiService.getTableStructure(file.hash)

        // 获取表数据
        const dataResponse = await apiService.getTableData(file.hash, page, 10)

        // 设置表列信息
        file.tableColumns = structure.columns?.map((col: any) => ({
            prop: col.name,
            label: col.name,
            width: 120
        })) || []

        // 设置表数据
        file.tableData = dataResponse.data || []
        file.totalRecords = dataResponse.total || file.recordCount || 0
        file.currentPage = page

    } catch (error) {
        console.error('加载表格数据失败:', error)
        // 如果获取失败，使用模拟数据作为备用
        file.tableColumns = generatePreviewColumns(file.columnCount)
        file.tableData = generatePreviewData(file.columnCount, 10)
        file.totalRecords = file.recordCount || 0
        file.currentPage = 1
        ElMessage.warning('获取表格数据失败，显示模拟数据')
    } finally {
        file.loadingData = false
    }
}

// 生成预览列
const generatePreviewColumns = (columnCount: number) => {
    const columns = []
    for (let i = 1; i <= columnCount; i++) {
        columns.push({
            prop: `column_${i}`,
            label: `列${i}`,
            width: 120
        })
    }
    return columns
}

// 生成预览数据
const generatePreviewData = (columnCount: number, rowCount: number) => {
    const data = []
    for (let i = 1; i <= rowCount; i++) {
        const row: any = {}
        for (let j = 1; j <= columnCount; j++) {
            row[`column_${j}`] = `数据${i}-${j}`
        }
        data.push(row)
    }
    return data
}

// 处理分页变化
const handlePageChange = (file: any, page: number) => {
    // 保存当前的展开状态
    const wasExpanded = file.expanded
    
    // 加载新页面的数据
    loadTableData(file, page).then(() => {
        // 重新设置展开状态，确保展开内容保持展开
        if (wasExpanded) {
            file.expanded = true
            // 强制更新表格的展开状态
            nextTick(() => {
                // 这里可以添加额外的逻辑来确保表格保持展开状态
                // Element Plus 的表格会自动处理展开状态，但我们可以确保数据一致性
            })
        }
    })
}

// 处理文件名点击
const handleFileNameClick = async (file: any, index: number) => {
    // 展开当前行
    file.expanded = true
    // 如果还没有加载过数据，则加载数据
    if (!file.tableData || file.tableData.length === 0) {
        await loadTableData(file)
    }
}

// 处理表格展开变化
const handleExpandChange = (row: any, expandedRows: any[]) => {
    // 如果当前行被展开
    if (expandedRows.includes(row)) {
        row.expanded = true
        // 如果还没有加载过数据，则加载数据
        if (!row.tableData || row.tableData.length === 0) {
            loadTableData(row)
        }
    } else {
        // 如果当前行被收起
        row.expanded = false
    }
}

onMounted(() => {
    initData()
})
</script>

<style scoped>
.file-management {
    padding: 0;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.upload-area {
    text-align: center;
    padding: 20px 0;
}

.hash-cell {
    display: flex;
    align-items: center;
    gap: 8px;
}

.hash-value {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #666;
    cursor: pointer;
    flex: 1;
}

.copy-btn {
    opacity: 0.6;
    transition: opacity 0.2s;
}

.copy-btn:hover {
    opacity: 1;
}

.table-info {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.table-info h3 {
    margin: 0 0 10px 0;
    color: #303133;
}

.table-info p {
    margin: 5px 0;
    color: #606266;
}

.loading-structure {
    padding: 20px 0;
}

.file-name-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 4px 0;
    transition: all 0.2s;
}

.file-name-cell:hover {
    color: #409eff;
}

.expand-icon {
    transition: transform 0.2s;
    font-size: 12px;
    color: #c0c4cc;
}

.expand-icon.expanded {
    transform: rotate(90deg);
    color: #409eff;
}

.file-name {
    flex: 1;
}

.table-data-preview {
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
    margin: 10px 0;
}

.preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e4e7ed;
}

.preview-header h3 {
    margin: 0;
    color: #303133;
    font-size: 16px;
}

.preview-info {
    color: #606266;
    font-size: 14px;
}

.preview-content {
    background: white;
    border-radius: 6px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.preview-table {
    margin-bottom: 16px;
}

.pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e4e7ed;
}
</style>
