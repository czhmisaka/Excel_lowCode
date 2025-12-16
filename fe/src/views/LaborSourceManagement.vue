<template>
    <div class="labor-source-management fade-in-up">
        <!-- 页面标题和返回按钮 -->
        <div class="page-header">
            <div class="header-content">
                <div class="header-left">
                    <el-button type="text" :icon="ArrowLeft" @click="goBack">
                        返回公司列表
                    </el-button>
                    <h1>{{ companyName }} - 劳务来源管理</h1>
                    <p>管理该公司的劳务来源配置，用于签到页面下拉选择</p>
                </div>
                <div class="header-right">
                    <el-button type="primary" :icon="Plus" @click="handleAddLaborSource">
                        新增劳务来源
                    </el-button>
                    <el-button :icon="Refresh" @click="loadLaborSources">
                        刷新
                    </el-button>
                </div>
            </div>
        </div>

        <!-- 搜索和筛选栏 -->
        <div class="modern-toolbar">
            <el-row :gutter="20">
                <el-col :span="8">
                    <el-input v-model="searchKeyword" placeholder="搜索劳务来源名称、代码或描述" clearable @clear="handleSearch"
                        @keyup.enter="handleSearch">
                        <template #append>
                            <el-button :icon="Search" @click="handleSearch" />
                        </template>
                    </el-input>
                </el-col>
                <el-col :span="8">
                    <el-select v-model="filterStatus" placeholder="状态筛选" clearable @change="handleSearch">
                        <el-option label="启用" value="true" />
                        <el-option label="停用" value="false" />
                    </el-select>
                </el-col>
                <el-col :span="8" class="text-right">
                    <!-- 导出功能已移除 -->
                </el-col>
            </el-row>
        </div>

        <!-- 劳务来源表格 -->
        <div class="modern-card">
            <el-table v-loading="loading" :data="laborSourceList" border stripe class="modern-table" style="width: 100%">
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="name" label="劳务来源名称" min-width="150" />
                <el-table-column prop="code" label="劳务来源代码" min-width="120" />
                <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
                <el-table-column prop="isActive" label="状态" width="80">
                    <template #default="{ row }">
                        <el-tag :type="row.isActive ? 'success' : 'info'">
                            {{ row.isActive ? '启用' : '停用' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="sortOrder" label="排序" width="80" />
                <el-table-column prop="createdAt" label="创建时间" width="180">
                    <template #default="{ row }">
                        {{ formatDate(row.createdAt) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="240" fixed="right">
                    <template #default="{ row }">
                        <el-button size="small" type="primary" :icon="Edit" @click="handleEditLaborSource(row)">
                            编辑
                        </el-button>
                        <el-button size="small" :type="row.isActive ? 'warning' : 'success'" :icon="Switch" 
                            @click="handleToggleStatus(row)">
                            {{ row.isActive ? '停用' : '启用' }}
                        </el-button>
                        <el-button size="small" type="danger" :icon="Delete" @click="handleDeleteLaborSource(row)">
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

        <!-- 新增/编辑劳务来源对话框 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" :close-on-click-modal="false"
            class="modern-dialog" append-to-body>
            <el-form ref="laborSourceFormRef" :model="laborSourceForm" :rules="laborSourceFormRules" label-width="120px">
                <el-form-item label="劳务来源名称" prop="name">
                    <el-input v-model="laborSourceForm.name" placeholder="请输入劳务来源名称" />
                </el-form-item>
                <el-form-item label="劳务来源代码" prop="code">
                    <el-input v-model="laborSourceForm.code" placeholder="请输入劳务来源代码（同一公司内唯一）" 
                        :disabled="isEditMode" />
                </el-form-item>
                <el-form-item label="描述" prop="description">
                    <el-input v-model="laborSourceForm.description" type="textarea" :rows="3" placeholder="请输入劳务来源描述" />
                </el-form-item>
                <el-form-item label="排序顺序" prop="sortOrder">
                    <el-input-number v-model="laborSourceForm.sortOrder" :min="0" :max="999" />
                    <div class="form-tip">数字越小，排序越靠前</div>
                </el-form-item>
                <el-form-item label="状态" prop="isActive">
                    <el-switch v-model="laborSourceForm.isActive" active-text="启用" inactive-text="停用" />
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleSubmitLaborSource" :loading="submitting">
                        确定
                    </el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Edit, Delete, Refresh, Search, ArrowLeft, Switch } from '@element-plus/icons-vue'
import { apiService } from '@/services/api'

interface LaborSource {
    id: string
    name: string
    code: string
    description?: string
    isActive: boolean
    sortOrder: number
    companyId: string
    createdAt: string
    updatedAt: string
}

interface LaborSourceForm {
    name: string
    code: string
    description: string
    isActive: boolean
    sortOrder: number
}

// 路由和响应式数据
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const searchKeyword = ref('')
const filterStatus = ref('')
const companyName = ref('')
const companyId = ref('')
const laborSourceList = ref<LaborSource[]>([])
const laborSourceFormRef = ref<FormInstance>()

const pagination = reactive({
    currentPage: 1,
    pageSize: 10,
    total: 0
})

const laborSourceForm = reactive<LaborSourceForm>({
    name: '',
    code: '',
    description: '',
    isActive: true,
    sortOrder: 0
})

// 计算属性
const dialogTitle = computed(() => isEditMode.value ? '编辑劳务来源' : '新增劳务来源')
const isEditMode = computed(() => editingLaborSourceId.value !== null)

// 编辑状态
const editingLaborSourceId = ref<string | null>(null)

// 表单验证规则
const laborSourceFormRules: FormRules = {
    name: [
        { required: true, message: '请输入劳务来源名称', trigger: 'blur' },
        { min: 2, max: 100, message: '劳务来源名称长度在 2 到 100 个字符', trigger: 'blur' }
    ],
    code: [
        { required: true, message: '请输入劳务来源代码', trigger: 'blur' },
        { min: 2, max: 50, message: '劳务来源代码长度在 2 到 50 个字符', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9_-]+$/, message: '劳务来源代码只能包含字母、数字、下划线和连字符', trigger: 'blur' }
    ],
    description: [
        { max: 500, message: '劳务来源描述不能超过 500 个字符', trigger: 'blur' }
    ],
    sortOrder: [
        { type: 'number', min: 0, max: 999, message: '排序顺序必须在 0-999 之间', trigger: 'blur' }
    ]
}

// 方法
const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('zh-CN')
}

const goBack = () => {
    router.push('/companies')
}

const loadCompanyInfo = async () => {
    try {
        const response = await apiService.getCompany(companyId.value)
        if (response.success) {
            companyName.value = response.data.name
        }
    } catch (error) {
        console.error('获取公司信息失败:', error)
    }
}

const loadLaborSources = async () => {
    loading.value = true
    try {
        const params = {
            page: pagination.currentPage,
            limit: pagination.pageSize,
            search: searchKeyword.value || undefined,
            isActive: filterStatus.value ? filterStatus.value === 'true' : undefined
        }
        
        const response = await apiService.getLaborSources(companyId.value, params)
        if (response.success) {
            // 修复：response.data 已经是数据数组，不需要 response.data.data
            laborSourceList.value = response.data || []
            // 修复：分页信息在 response.pagination，不是 response.data.pagination
            pagination.total = response.pagination?.total || laborSourceList.value.length
        } else {
            ElMessage.error(response.message || '获取劳务来源列表失败')
            laborSourceList.value = []
        }
    } catch (error: any) {
        ElMessage.error(error.message || '获取劳务来源列表失败')
        laborSourceList.value = []
    } finally {
        loading.value = false
    }
}

const handleSearch = () => {
    pagination.currentPage = 1
    loadLaborSources()
}

const handleSizeChange = (size: number) => {
    pagination.pageSize = size
    loadLaborSources()
}

const handleCurrentChange = (page: number) => {
    pagination.currentPage = page
    loadLaborSources()
}

const handleAddLaborSource = () => {
    resetForm()
    editingLaborSourceId.value = null
    dialogVisible.value = true
}

const handleEditLaborSource = (laborSource: LaborSource) => {
    resetForm()
    editingLaborSourceId.value = laborSource.id
    Object.assign(laborSourceForm, {
        name: laborSource.name,
        code: laborSource.code,
        description: laborSource.description || '',
        isActive: laborSource.isActive,
        sortOrder: laborSource.sortOrder
    })
    dialogVisible.value = true
}

const handleToggleStatus = async (laborSource: LaborSource) => {
    try {
        await ElMessageBox.confirm(
            `确定要${laborSource.isActive ? '停用' : '启用'}劳务来源 "${laborSource.name}" 吗？`,
            '状态切换确认',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        const response = await apiService.toggleLaborSourceStatus(companyId.value, laborSource.id)
        if (response.success) {
            ElMessage.success(`劳务来源已${laborSource.isActive ? '停用' : '启用'}`)
            loadLaborSources()
        } else {
            ElMessage.error(response.message || '切换状态失败')
        }
    } catch (error) {
        // 用户取消操作
    }
}

const handleDeleteLaborSource = async (laborSource: LaborSource) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除劳务来源 "${laborSource.name}" 吗？此操作不可恢复。`,
            '删除确认',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        const response = await apiService.deleteLaborSource(companyId.value, laborSource.id)
        if (response.success) {
            ElMessage.success('劳务来源删除成功')
            loadLaborSources()
        } else {
            ElMessage.error(response.message || '删除劳务来源失败')
        }
    } catch (error) {
        // 用户取消删除
    }
}


const resetForm = () => {
    if (laborSourceFormRef.value) {
        laborSourceFormRef.value.resetFields()
    }
    Object.assign(laborSourceForm, {
        name: '',
        code: '',
        description: '',
        isActive: true,
        sortOrder: 0
    })
    editingLaborSourceId.value = null
}

const handleSubmitLaborSource = async () => {
    if (!laborSourceFormRef.value) return

    const valid = await laborSourceFormRef.value.validate()
    if (!valid) return

    submitting.value = true
    try {
        if (isEditMode.value) {
            // 编辑劳务来源
            const laborSourceData = {
                name: laborSourceForm.name,
                description: laborSourceForm.description,
                isActive: laborSourceForm.isActive,
                sortOrder: laborSourceForm.sortOrder
            }
            const response = await apiService.updateLaborSource(companyId.value, editingLaborSourceId.value!, laborSourceData)
            if (response.success) {
                ElMessage.success('劳务来源信息更新成功')
                dialogVisible.value = false
                loadLaborSources()
            } else {
                ElMessage.error(response.message || '更新劳务来源信息失败')
            }
        } else {
            // 新增劳务来源
            const laborSourceData = {
                name: laborSourceForm.name,
                code: laborSourceForm.code,
                description: laborSourceForm.description,
                isActive: laborSourceForm.isActive,
                sortOrder: laborSourceForm.sortOrder
            }
            const response = await apiService.createLaborSource(companyId.value, laborSourceData)
            if (response.success) {
                ElMessage.success('劳务来源创建成功')
                dialogVisible.value = false
                loadLaborSources()
            } else {
                ElMessage.error(response.message || '创建劳务来源失败')
            }
        }
    } catch (error: any) {
        ElMessage.error(error.message || '操作失败')
    } finally {
        submitting.value = false
    }
}

// 生命周期
onMounted(() => {
    companyId.value = route.params.companyId as string
    if (!companyId.value) {
        ElMessage.error('公司ID不能为空')
        goBack()
        return
    }
    
    loadCompanyInfo()
    loadLaborSources()
})
</script>

<style scoped>
.labor-source-management {
    padding: 20px;
}

.page-header {
    margin-bottom: 20px;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
}

.header-left {
    flex: 1;
    min-width: 300px;
}

.header-left h1 {
    margin: 10px 0 5px;
    color: #303133;
    font-size: 24px;
}

.header-left p {
    margin: 0;
    color: #909399;
    font-size: 14px;
}

.header-right {
    display: flex;
    gap: 10px;
}

.text-right {
    text-align: right;
}

.form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
}

.modern-toolbar {
    margin-bottom: 20px;
}

.modern-pagination {
    margin-top: 20px;
    text-align: right;
}
</style>
