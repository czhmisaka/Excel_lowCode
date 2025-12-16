<template>
    <div class="company-checkin-records fade-in-up">
        <!-- 页面头部 -->
        <div class="page-header">
            <h1>{{ companyName }} - 打卡记录</h1>
            <p>查看该公司的所有打卡记录</p>
        </div>

        <!-- 搜索和操作栏 -->
        <div class="modern-toolbar">
            <el-row :gutter="20">
                <el-col :span="8">
                    <el-input v-model="searchKeyword" placeholder="搜索姓名或手机号" clearable @clear="handleSearch"
                        @keyup.enter="handleSearch">
                        <template #append>
                            <el-button :icon="Search" @click="handleSearch" />
                        </template>
                    </el-input>
                </el-col>
                <el-col :span="8">
                    <el-date-picker
                        v-model="dateRange"
                        type="daterange"
                        range-separator="至"
                        start-placeholder="开始日期"
                        end-placeholder="结束日期"
                        value-format="YYYY-MM-DD"
                        @change="handleDateChange"
                    />
                </el-col>
                <el-col :span="8" class="text-right">
                    <el-button :icon="Refresh" @click="loadCheckinRecords">
                        刷新
                    </el-button>
                    <el-button type="primary" :icon="Download" @click="handleExport">
                        导出
                    </el-button>
                    <el-button type="info" :icon="ArrowLeft" @click="handleBack">
                        返回
                    </el-button>
                </el-col>
            </el-row>
        </div>

        <!-- 批量操作工具栏 -->
        <div v-if="selectedRecords.length > 0" class="batch-toolbar modern-card" style="margin-bottom: 15px; padding: 12px 20px;">
            <el-row :gutter="20" align="middle">
                <el-col :span="12">
                    <span style="font-size: 14px; color: #606266;">
                        已选择 <strong style="color: #409EFF;">{{ selectedRecords.length }}</strong> 条记录
                    </span>
                </el-col>
                <el-col :span="12" class="text-right">
                    <el-button type="danger" :icon="Delete" @click="handleBatchDelete" :disabled="batchDeleting">
                        {{ batchDeleting ? '删除中...' : '批量删除' }}
                    </el-button>
                    <el-button @click="clearSelection">
                        取消选择
                    </el-button>
                </el-col>
            </el-row>
        </div>

        <!-- 打卡记录表格 -->
        <div class="modern-card" style="margin-bottom: 20px;">
            <el-table 
                v-loading="loading" 
                :data="checkinRecords" 
                border 
                stripe 
                class="modern-table" 
                style="width: 100%"
                @selection-change="handleSelectionChange"
            >
                <el-table-column type="selection" width="55" />
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="realName" label="姓名" min-width="100">
                    <template #default="{ row }">
                        {{ row.realName || '-' }}
                    </template>
                </el-table-column>
                <el-table-column prop="phone" label="手机号" min-width="120">
                    <template #default="{ row }">
                        {{ row.phone || '-' }}
                    </template>
                </el-table-column>
                <el-table-column prop="laborSource" label="劳务来源" width="120">
                    <template #default="{ row }">
                        {{ row.laborSource || '-' }}
                    </template>
                </el-table-column>
                <el-table-column prop="checkinTime" label="签到时间" width="180">
                    <template #default="{ row }">
                        {{ formatDateTime(row.checkinTime) }}
                    </template>
                </el-table-column>
                <el-table-column prop="checkoutTime" label="签退时间" width="180">
                    <template #default="{ row }">
                        {{ row.workDuration ? formatDateTime(calculateCheckoutTime(row.checkinTime, row.workDuration) || '') : '-' }}
                    </template>
                </el-table-column>
                <el-table-column prop="workDuration" label="工作时长" width="100">
                    <template #default="{ row }">
                        {{ row.workDuration ? formatWorkDuration(row.workDuration) : '-' }}
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="200">
                    <template #default="{ row }">
                        <el-tag :type="row.workDuration ? 'success' : 'warning'">
                            {{ row.workDuration ? '已签退' : '已签到' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="createdAt" label="创建时间" width="180">
                    <template #default="{ row }">
                        {{ formatDateTime(row.createdAt) }}
                    </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" min-width="200">
                    <template #default="{ row }">
                        <div class="remark-content" :title="row.remark">
                            {{ row.remark || '-' }}
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="120" fixed="right">
                    <template #default="{ row }">
                        <el-button 
                            type="danger" 
                            :icon="Delete" 
                            size="small" 
                            @click="handleDelete(row.id)"
                            :disabled="loading"
                        >
                            删除
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
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { Search, Refresh, Download, ArrowLeft, Delete } from '@element-plus/icons-vue'
import { apiService } from '@/services/api'

interface CheckinRecord {
    id: string
    userId: string
    realName: string
    phone: string
    laborSource?: string
    idCard: string
    checkinTime: string
    checkoutTime?: string
    workHours?: string
    status: string
    createdAt: string
    updatedAt: string
}

// 路由参数
const route = useRoute()
const router = useRouter()
const companyId = route.params.id as string

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const dateRange = ref<string[]>([])
const companyName = ref('')
const checkinRecords = ref<CheckinRecord[]>([])
const selectedRecords = ref<CheckinRecord[]>([])
const batchDeleting = ref(false)

const pagination = reactive({
    currentPage: 1,
    pageSize: 10,
    total: 0
})

// 计算属性
const queryParams = computed(() => {
    const params: any = {
        page: pagination.currentPage,
        limit: pagination.pageSize,
        companyId: companyId
    }

    if (searchKeyword.value) {
        params.search = searchKeyword.value
    }

    if (dateRange.value && dateRange.value.length === 2) {
        params.startDate = dateRange.value[0]
        params.endDate = dateRange.value[1]
    }

    return params
})

// 方法
const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('zh-CN')
}

const formatWorkDuration = (minutes: number) => {
  if (!minutes) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}小时${mins}分钟`
}

// 计算签退时间
const calculateCheckoutTime = (checkinTime: string, workDuration: number) => {
  if (!checkinTime || !workDuration) return null
  const checkinDate = new Date(checkinTime)
  const checkoutDate = new Date(checkinDate.getTime() + workDuration * 60 * 1000)
  return checkoutDate.toISOString()
}

const loadCheckinRecords = async () => {
    loading.value = true
    try {
        const response = await apiService.getCheckinRecords(queryParams.value)
        if (response.success) {
            // 修复：response.data 已经是数据数组，不需要 response.data.data
            const recordsData = response.data
            checkinRecords.value = Array.isArray(recordsData) ? recordsData : []
            
            // 修复：分页信息在 response.pagination，不是 response.data.pagination
            // 修复：避免 0 被误判为假值
            const total = response.pagination?.total
            pagination.total = total !== undefined ? total : checkinRecords.value.length
            
            // 加载公司信息
            await loadCompanyInfo()
        } else {
            ElMessage.error(response.message || '获取打卡记录失败')
            checkinRecords.value = []
        }
    } catch (error: any) {
        ElMessage.error(error.message || '获取打卡记录失败')
        checkinRecords.value = []
    } finally {
        loading.value = false
    }
}

const loadCompanyInfo = async () => {
    try {
        const response = await apiService.getCompany(companyId)
        if (response.success) {
            const companyData = response.data
            companyName.value = companyData?.name || '未知公司'
        }
    } catch (error: any) {
        companyName.value = '未知公司'
    }
}

const handleSearch = () => {
    pagination.currentPage = 1
    loadCheckinRecords()
}

const handleDateChange = () => {
    pagination.currentPage = 1
    loadCheckinRecords()
}

const handleSizeChange = (size: number) => {
    pagination.pageSize = size
    loadCheckinRecords()
}

const handleCurrentChange = (page: number) => {
    pagination.currentPage = page
    loadCheckinRecords()
}

const handleExport = async () => {
    try {
        // 显示加载状态
        const loadingInstance = ElLoading.service({
            lock: true,
            text: '正在生成Excel文件，请稍候...',
            background: 'rgba(0, 0, 0, 0.7)'
        })
        
        try {
            // 获取Excel文件Blob
            const blob = await apiService.exportCheckinRecords(queryParams.value)
            
            // 创建下载链接
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            
            // 从响应头获取文件名，如果没有则使用默认文件名
            const timestamp = new Date().toISOString().split('T')[0]
            const fileName = `checkin_records_export_${timestamp}.xlsx`
            link.download = fileName
            
            // 触发下载
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
            // 释放URL对象
            window.URL.revokeObjectURL(url)
            
            ElMessage.success('导出成功，文件下载中...')
        } finally {
            loadingInstance.close()
        }
    } catch (error: any) {
        console.error('导出失败:', error)
        
        // 尝试解析错误响应（如果是JSON格式）
        if (error.response && error.response.data) {
            try {
                // 如果是Blob错误响应，尝试读取为文本
                if (error.response.data instanceof Blob) {
                    const errorText = await error.response.data.text()
                    const errorData = JSON.parse(errorText)
                    ElMessage.error(errorData.message || '导出失败')
                } else {
                    ElMessage.error(error.response.data.message || '导出失败')
                }
            } catch (parseError) {
                ElMessage.error('导出失败：服务器返回错误')
            }
        } else {
            ElMessage.error(error.message || '导出失败')
        }
    }
}

const handleDelete = async (recordId: string) => {
    try {
        // 确认删除
        await ElMessageBox.confirm(
            '确定要删除这条打卡记录吗？此操作不可恢复。',
            '确认删除',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )

        // 执行删除
        const response = await apiService.deleteCheckinRecord(recordId)
        if (response.success) {
            ElMessage.success('打卡记录删除成功')
            // 重新加载数据
            loadCheckinRecords()
        } else {
            ElMessage.error(response.message || '删除失败')
        }
    } catch (error: any) {
        if (error !== 'cancel') {
            ElMessage.error(error.message || '删除失败')
        }
    }
}

// 处理表格选择变化
const handleSelectionChange = (selection: CheckinRecord[]) => {
    selectedRecords.value = selection
}

// 批量删除打卡记录
const handleBatchDelete = async () => {
    if (selectedRecords.value.length === 0) {
        ElMessage.warning('请先选择要删除的记录')
        return
    }

    try {
        // 确认批量删除
        await ElMessageBox.confirm(
            `确定要删除选中的 ${selectedRecords.value.length} 条打卡记录吗？此操作不可恢复。`,
            '确认批量删除',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )

        batchDeleting.value = true

        // 提取记录ID
        const recordIds = selectedRecords.value.map(record => record.id)

        // 执行批量删除
        const response = await apiService.batchDeleteCheckinRecords(recordIds)
        if (response.success) {
            ElMessage.success(`成功删除 ${response.data?.deletedCount || selectedRecords.value.length} 条打卡记录`)
            // 清空选择
            selectedRecords.value = []
            // 重新加载数据
            loadCheckinRecords()
        } else {
            ElMessage.error(response.message || '批量删除失败')
        }
    } catch (error: any) {
        if (error !== 'cancel') {
            ElMessage.error(error.message || '批量删除失败')
        }
    } finally {
        batchDeleting.value = false
    }
}

// 清空选择
const clearSelection = () => {
    selectedRecords.value = []
}

const handleBack = () => {
    router.push('/companies')
}

// 生命周期
onMounted(() => {
    loadCheckinRecords()
})
</script>

<style scoped>
.company-checkin-records {}

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

.text-right {
    text-align: right;
}

.pagination {
    margin-top: 20px;
    text-align: right;
}

.remark-content {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: help;
}

.remark-content:hover {
    white-space: normal;
    overflow: visible;
    background-color: #f5f7fa;
    padding: 4px 8px;
    border-radius: 4px;
    position: relative;
    z-index: 10;
}
</style>
