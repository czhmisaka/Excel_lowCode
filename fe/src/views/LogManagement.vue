<template>
    <div class="log-management fade-in-up">
        <!-- 搜索和筛选栏 -->
        <div class="modern-toolbar">
            <el-form :model="filterForm" :inline="true">
                <el-form-item label="操作类型">
                    <el-select v-model="filterForm.operationType" placeholder="全部类型" clearable>
                        <el-option label="新增" value="create" />
                        <el-option label="更新" value="update" />
                        <el-option label="删除" value="delete" />
                    </el-select>
                </el-form-item>
                <el-form-item label="表名">
                    <el-select v-model="filterForm.tableName" placeholder="选择表名" clearable filterable>
                        <el-option v-for="table in availableTables" :key="table.tableName" :label="table.tableName"
                            :value="table.tableName" />
                    </el-select>
                </el-form-item>
                <el-form-item label="用户名">
                    <el-input v-model="filterForm.username" placeholder="输入用户名" clearable />
                </el-form-item>
                <el-form-item label="时间范围">
                    <el-date-picker v-model="filterForm.dateRange" type="datetimerange" range-separator="至"
                        start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss" />
                </el-form-item>
                <el-form-item label="回退状态">
                    <el-select v-model="filterForm.isRolledBack" placeholder="全部状态" clearable>
                        <el-option label="未回退" :value="false" />
                        <el-option label="已回退" :value="true" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" :icon="Search" @click="handleSearch">
                        搜索
                    </el-button>
                    <el-button :icon="Refresh" @click="handleReset">
                        重置
                    </el-button>
                </el-form-item>
            </el-form>
        </div>

        <!-- 日志表格 -->
        <div class="modern-card" style="margin-bottom: 20px;">
            <el-table v-loading="loading" :data="logList" border stripe class="modern-table" style="width: 100%">
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="operationType" label="操作类型" width="100">
                    <template #default="{ row }">
                        <el-tag :type="getOperationTypeTag(row.operationType)">
                            {{ getOperationTypeText(row.operationType) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="tableName" label="表名" min-width="150" />
                <el-table-column prop="tableHash" label="表哈希" min-width="120">
                    <template #default="{ row }">
                        <el-tooltip :content="row.tableHash" placement="top">
                            <span>{{ row.tableHash.substring(0, 8) }}...</span>
                        </el-tooltip>
                    </template>
                </el-table-column>
                <el-table-column prop="recordId" label="记录ID" width="100" />
                <el-table-column prop="username" label="操作用户" width="120" />
                <el-table-column prop="operationTime" label="操作时间" width="180">
                    <template #default="{ row }">
                        {{ formatDate(row.operationTime) }}
                    </template>
                </el-table-column>
                <el-table-column prop="isRolledBack" label="回退状态" width="100">
                    <template #default="{ row }">
                        <el-tag :type="row.isRolledBack ? 'info' : 'success'">
                            {{ row.isRolledBack ? '已回退' : '未回退' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="description" label="操作描述" min-width="200" show-overflow-tooltip />
                <el-table-column label="操作" width="150" fixed="right">
                    <template #default="{ row }">
                        <el-button size="small" type="primary" :icon="View" @click="handleViewDetail(row)">
                            详情
                        </el-button>
                        <el-button v-if="!row.isRolledBack" size="small" type="warning" :icon="RefreshLeft"
                            @click="handleRollback(row)">
                            回退
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="modern-pagination">
                <el-pagination v-model:current-page="pagination.currentPage" v-model:page-size="pagination.pageSize"
                    :page-sizes="[10, 20, 50, 100]" :total="pagination.total"
                    layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
                    @current-change="handleCurrentChange" />
            </div>

            <!-- 日志详情对话框 -->
            <el-dialog v-model="detailDialogVisible" title="操作日志详情" width="800px" :close-on-click-modal="false"
                class="modern-dialog" append-to-body>
                <div v-if="currentLog" class="log-detail">
                    <el-descriptions :column="2" border>
                        <el-descriptions-item label="操作ID">{{ currentLog.id }}</el-descriptions-item>
                        <el-descriptions-item label="操作类型">
                            <el-tag :type="getOperationTypeTag(currentLog.operationType)">
                                {{ getOperationTypeText(currentLog.operationType) }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="表名">{{ currentLog.tableName }}</el-descriptions-item>
                        <el-descriptions-item label="表哈希">{{ currentLog.tableHash }}</el-descriptions-item>
                        <el-descriptions-item label="记录ID">{{ currentLog.recordId || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="操作用户">{{ currentLog.username }}</el-descriptions-item>
                        <el-descriptions-item label="操作时间">{{ formatDate(currentLog.operationTime)
                        }}</el-descriptions-item>
                        <el-descriptions-item label="回退状态">
                            <el-tag :type="currentLog.isRolledBack ? 'info' : 'success'">
                                {{ currentLog.isRolledBack ? '已回退' : '未回退' }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="操作描述" :span="2">
                            {{ currentLog.description || '-' }}
                        </el-descriptions-item>
                    </el-descriptions>

                    <!-- 数据对比 -->
                    <div class="data-comparison">
                        <h3>数据对比</h3>
                        <DataComparison :old-data="currentLog.oldData" :new-data="currentLog.newData"
                            :table-structure="tableStructure" :operation-type="currentLog.operationType" />
                    </div>

                    <!-- 回退信息 -->
                    <div v-if="currentLog.isRolledBack" class="rollback-info">
                        <h3>回退信息</h3>
                        <el-descriptions :column="2" border>
                            <el-descriptions-item label="回退时间">{{ formatDate(currentLog.rollbackTime)
                            }}</el-descriptions-item>
                            <el-descriptions-item label="回退用户">{{ currentLog.rollbackUsername }}</el-descriptions-item>
                            <el-descriptions-item label="回退描述" :span="2">
                                {{ currentLog.rollbackDescription || '-' }}
                            </el-descriptions-item>
                        </el-descriptions>
                    </div>
                </div>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="detailDialogVisible = false">关闭</el-button>
                    </span>
                </template>
            </el-dialog>

            <!-- 回退确认对话框 -->
            <el-dialog v-model="rollbackDialogVisible" title="确认回退操作" width="500px" :close-on-click-modal="false"
                class="modern-dialog" append-to-body>
                <div v-if="currentLog" class="rollback-confirm">
                    <p>确定要回退以下操作吗？</p>
                    <el-descriptions :column="1" border>
                        <el-descriptions-item label="操作类型">{{ getOperationTypeText(currentLog.operationType)
                        }}</el-descriptions-item>
                        <el-descriptions-item label="表名">{{ currentLog.tableName }}</el-descriptions-item>
                        <el-descriptions-item label="记录ID">{{ currentLog.recordId || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="操作时间">{{ formatDate(currentLog.operationTime)
                        }}</el-descriptions-item>
                    </el-descriptions>
                    <el-form :model="rollbackForm" label-width="100px" style="margin-top: 20px;">
                        <el-form-item label="回退描述">
                            <el-input v-model="rollbackForm.description" type="textarea" :rows="3"
                                placeholder="请输入回退操作的描述（可选）" />
                        </el-form-item>
                    </el-form>
                </div>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="rollbackDialogVisible = false">取消</el-button>
                        <el-button type="warning" @click="handleConfirmRollback" :loading="submitting">
                            确认回退
                        </el-button>
                    </span>
                </template>
            </el-dialog>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, View, RefreshLeft } from '@element-plus/icons-vue'
import { apiService, type ColumnDefinition } from '@/services/api'
import DataComparison from '@/components/DataComparison.vue'

interface Log {
    id: number
    operationType: string
    tableName: string
    tableHash: string
    recordId?: number
    oldData?: any
    newData?: any
    description?: string
    userId: number
    username: string
    operationTime: string
    isRolledBack: boolean
    rollbackTime?: string
    rollbackUserId?: number
    rollbackUsername?: string
    rollbackDescription?: string
    ipAddress?: string
    userAgent?: string
    createdAt: string
    updatedAt: string
}

interface FilterForm {
    operationType?: string
    tableName?: string
    username?: string
    dateRange?: string[]
    isRolledBack?: boolean
}

interface RollbackForm {
    description: string
}

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const detailDialogVisible = ref(false)
const rollbackDialogVisible = ref(false)
const logList = ref<Log[]>([])
const currentLog = ref<Log | null>(null)
const availableTables = ref<Array<{ tableName: string }>>([])
const tableStructure = ref<{
    columns: ColumnDefinition[]
    tableName: string
}>({
    columns: [],
    tableName: ''
})

const pagination = reactive({
    currentPage: 1,
    pageSize: 10,
    total: 0
})

const filterForm = reactive<FilterForm>({
    operationType: '',
    tableName: '',
    username: '',
    dateRange: [],
    isRolledBack: undefined
})

const rollbackForm = reactive<RollbackForm>({
    description: ''
})

// 方法
const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('zh-CN')
}

const formatJsonData = (data: any) => {
    if (!data) return '-'
    try {
        return JSON.stringify(data, null, 2)
    } catch {
        return data
    }
}

const getOperationTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
        create: '新增',
        update: '更新',
        delete: '删除'
    }
    return typeMap[type] || type
}

const getOperationTypeTag = (type: string) => {
    const tagMap: Record<string, string> = {
        create: 'success',
        update: 'warning',
        delete: 'danger'
    }
    return tagMap[type] || 'info'
}

const loadLogs = async () => {
    loading.value = true
    try {
        const params: any = {
            page: pagination.currentPage,
            limit: pagination.pageSize
        }

        // 添加筛选条件
        if (filterForm.operationType) {
            params.operationType = filterForm.operationType
        }
        if (filterForm.tableName) {
            params.tableName = filterForm.tableName
        }
        if (filterForm.username) {
            params.username = filterForm.username
        }
        if (filterForm.dateRange && filterForm.dateRange.length === 2) {
            params.startTime = filterForm.dateRange[0]
            params.endTime = filterForm.dateRange[1]
        }
        if (filterForm.isRolledBack !== undefined) {
            params.isRolledBack = filterForm.isRolledBack
        }

        const response = await apiService.getLogs(params)
        if (response.success) {
            // 修复：response.data 已经是数据数组，不需要 response.data.logs
            const logsData = response.data
            logList.value = Array.isArray(logsData) ? logsData : []
            
            // 修复：分页信息在 response.pagination，不是 response.data.pagination
            // 修复：避免 0 被误判为假值
            const total = response.pagination?.total
            pagination.total = total !== undefined ? total : logList.value.length
        } else {
            ElMessage.error(response.message || '获取日志列表失败')
        }
    } catch (error: any) {
        ElMessage.error(error.message || '获取日志列表失败')
    } finally {
        loading.value = false
    }
}

const handleSearch = () => {
    pagination.currentPage = 1
    loadLogs()
}

const handleReset = () => {
    Object.assign(filterForm, {
        operationType: '',
        tableName: '',
        username: '',
        dateRange: [],
        isRolledBack: undefined
    })
    pagination.currentPage = 1
    loadLogs()
}

const handleSizeChange = (size: number) => {
    pagination.pageSize = size
    loadLogs()
}

const handleCurrentChange = (page: number) => {
    pagination.currentPage = page
    loadLogs()
}

const handleViewDetail = async (log: Log) => {
    currentLog.value = log
    detailDialogVisible.value = true

    // 获取表结构信息
    try {
        const structure = await apiService.getTableStructureByHash(log.tableHash)
        tableStructure.value = structure
    } catch (error) {
        console.error('获取表结构信息失败:', error)
        // 如果获取失败，使用空结构
        tableStructure.value = {
            columns: [],
            tableName: ''
        }
    }
}

const handleRollback = (log: Log) => {
    currentLog.value = log
    rollbackForm.description = ''
    rollbackDialogVisible.value = true
}

const handleConfirmRollback = async () => {
    if (!currentLog.value) return

    submitting.value = true
    try {
        const response = await apiService.rollbackLog(currentLog.value.id, {
            description: rollbackForm.description
        })
        if (response.success) {
            ElMessage.success('操作回退成功')
            rollbackDialogVisible.value = false
            loadLogs()
        } else {
            ElMessage.error(response.message || '回退操作失败')
        }
    } catch (error: any) {
        ElMessage.error(error.message || '回退操作失败')
    } finally {
        submitting.value = false
    }
}

// 获取可用表名列表
const loadAvailableTables = async () => {
    try {
        // 从映射关系获取表名
        const mappings = await apiService.getMappings()
        availableTables.value = mappings.map(mapping => ({
            tableName: mapping.tableName
        }))
    } catch (error: any) {
        console.error('获取表名列表失败:', error.message)
        // 如果获取失败，使用空列表
        availableTables.value = []
    }
}

// 生命周期
onMounted(() => {
    loadLogs()
    loadAvailableTables()
})
</script>

<style scoped>
.log-management {}

.page-header {
    margin-bottom: 20px;
}

.page-header h1 {
    margin: 0;
    color: #303133;
}

.page-header p {
    margin: 5px 0 0;
    color: #909399;
}

.toolbar {
    margin-bottom: 20px;
}

.pagination {
    margin-top: 20px;
    text-align: right;
}

.log-detail {
    max-height: 600px;
    overflow-y: auto;
}

.data-comparison {
    margin-top: 20px;
}

.data-comparison h3 {
    margin-bottom: 10px;
    color: #303133;
}

.comparison-content {
    display: flex;
    gap: 20px;
}

.old-data,
.new-data {
    flex: 1;
}

.old-data h4,
.new-data h4 {
    margin-bottom: 8px;
    color: #606266;
}

.old-data pre,
.new-data pre {
    background: #f5f7fa;
    padding: 12px;
    border-radius: 4px;
    border: 1px solid #e4e7ed;
    font-size: 12px;
    line-height: 1.4;
    max-height: 200px;
    overflow-y: auto;
}

.rollback-info {
    margin-top: 20px;
}

.rollback-info h3 {
    margin-bottom: 10px;
    color: #303133;
}

.rollback-confirm p {
    margin-bottom: 15px;
    color: #606266;
}
</style>
