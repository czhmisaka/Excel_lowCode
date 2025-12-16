<template>
    <div class="company-management fade-in-up">
        <!-- 搜索和操作栏 -->
        <div class="modern-toolbar">
            <el-row :gutter="20">
                <el-col :span="8">
                    <el-input v-model="searchKeyword" placeholder="搜索公司名称或代码" clearable @clear="handleSearch"
                        @keyup.enter="handleSearch">
                        <template #append>
                            <el-button :icon="Search" @click="handleSearch" />
                        </template>
                    </el-input>
                </el-col>
                <el-col :span="16" class="text-right">
                    <el-button type="primary" :icon="Plus" @click="handleAddCompany">
                        新增公司
                    </el-button>
                    <el-button :icon="Refresh" @click="loadCompanies">
                        刷新
                    </el-button>
                </el-col>
            </el-row>
        </div>

        <!-- 公司表格 -->
        <div class="modern-card" style="margin-bottom: 20px;">
            <el-table v-loading="loading" :data="companyList" border stripe class="modern-table" style="width: 100%">
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="name" label="公司名称" min-width="150" />
                <el-table-column prop="code" label="公司代码" min-width="120" />
                <el-table-column prop="description" label="公司描述" min-width="200" show-overflow-tooltip />
                <el-table-column prop="status" label="状态" width="80">
                    <template #default="{ row }">
                        <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                            {{ row.status === 'active' ? '启用' : '禁用' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="createdAt" label="创建时间" width="180">
                    <template #default="{ row }">
                        {{ formatDate(row.createdAt) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="380" fixed="right">
                    <template #default="{ row }">
                        <el-button size="small" type="info" :icon="List" @click="handleManageLaborSources(row)">
                            劳务来源
                        </el-button>
                        <el-button size="small" type="success" :icon="View" @click="handleViewCheckinRecords(row)">
                            打卡记录
                        </el-button>
                        <el-button size="small" type="warning" :icon="Promotion" @click="handleShowQRCode(row)">
                            二维码
                        </el-button>
                        <el-button size="small" type="primary" :icon="Edit" @click="handleEditCompany(row)">
                            编辑
                        </el-button>
                        <el-button size="small" type="danger" :icon="Delete" @click="handleDeleteCompany(row)">
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

            <!-- 新增/编辑公司对话框 -->
            <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" :close-on-click-modal="false"
                class="modern-dialog" append-to-body>
                <el-form ref="companyFormRef" :model="companyForm" :rules="companyFormRules" label-width="100px">
                    <el-form-item label="公司名称" prop="name">
                        <el-input v-model="companyForm.name" placeholder="请输入公司名称" />
                    </el-form-item>
                    <el-form-item label="公司代码" prop="code">
                        <el-input v-model="companyForm.code" placeholder="请输入公司代码（唯一标识）" :disabled="isEditMode" />
                    </el-form-item>
                    <el-form-item label="公司描述" prop="description">
                        <el-input v-model="companyForm.description" type="textarea" :rows="3" placeholder="请输入公司描述" />
                    </el-form-item>
                    <el-form-item label="状态" prop="status">
                        <el-switch v-model="companyForm.status" active-value="active" inactive-value="inactive" 
                            active-text="启用" inactive-text="禁用" />
                    </el-form-item>
                    <el-form-item label="是否需要签退" prop="requireCheckout">
                        <el-switch v-model="companyForm.requireCheckout" 
                            active-text="需要签退（含工作时长计算）" 
                            inactive-text="只需签到" />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="dialogVisible = false">取消</el-button>
                        <el-button type="primary" @click="handleSubmitCompany" :loading="submitting">
                            确定
                        </el-button>
                    </span>
                </template>
            </el-dialog>

            <!-- 二维码对话框 -->
            <QRCodeDialog
                v-model="qrCodeDialogVisible"
                :company-code="selectedCompany?.code || ''"
                :company-name="selectedCompany?.name || ''"
                show-type-selector
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Edit, Delete, Refresh, Search, View, Promotion, List } from '@element-plus/icons-vue'
import { apiService } from '@/services/api'
import QRCodeDialog from '@/components/QRCodeDialog.vue'

interface Company {
    id: string
    name: string
    code: string
    description?: string
    status: string
    checkinUrl?: string
    checkoutUrl?: string
    requireCheckout?: boolean
    createdAt: string
    updatedAt: string
}

interface CompanyForm {
    name: string
    code: string
    description: string
    status: string
    requireCheckout: boolean
}

// 响应式数据
const router = useRouter()
const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const searchKeyword = ref('')
const companyList = ref<Company[]>([])
const companyFormRef = ref<FormInstance>()

// 二维码相关
const qrCodeDialogVisible = ref(false)
const selectedCompany = ref<Company | null>(null)

const pagination = reactive({
    currentPage: 1,
    pageSize: 10,
    total: 0
})

const companyForm = reactive<CompanyForm>({
    name: '',
    code: '',
    description: '',
    status: 'active',
    requireCheckout: true
})

// 计算属性
const dialogTitle = computed(() => isEditMode.value ? '编辑公司' : '新增公司')
const isEditMode = computed(() => editingCompanyId.value !== null)

// 编辑状态
const editingCompanyId = ref<string | null>(null)

// 表单验证规则
const companyFormRules: FormRules = {
    name: [
        { required: true, message: '请输入公司名称', trigger: 'blur' },
        { min: 2, max: 255, message: '公司名称长度在 2 到 255 个字符', trigger: 'blur' }
    ],
    code: [
        { required: true, message: '请输入公司代码', trigger: 'blur' },
        { min: 2, max: 100, message: '公司代码长度在 2 到 100 个字符', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9_-]+$/, message: '公司代码只能包含字母、数字、下划线和连字符', trigger: 'blur' }
    ],
    description: [
        { max: 1000, message: '公司描述不能超过 1000 个字符', trigger: 'blur' }
    ]
}

// 方法
const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('zh-CN')
}

const loadCompanies = async () => {
    loading.value = true
    try {
        const params = {
            page: pagination.currentPage,
            limit: pagination.pageSize,
            search: searchKeyword.value || undefined
        }
        
        const response = await apiService.getCompanies(params)
        if (response.success) {
            // 修复：response.data 已经是数据数组，不需要 response.data.data
            const companiesData = response.data
            companyList.value = Array.isArray(companiesData) ? companiesData : []
            
            // 修复：分页信息在 response.pagination，不是 response.data.pagination
            // 修复：避免 0 被误判为假值
            const total = response.pagination?.total
            pagination.total = total !== undefined ? total : companyList.value.length
        } else {
            ElMessage.error(response.message || '获取公司列表失败')
            companyList.value = [] // 确保数据是数组
        }
    } catch (error: any) {
        ElMessage.error(error.message || '获取公司列表失败')
        companyList.value = [] // 确保数据是数组
    } finally {
        loading.value = false
    }
}

const handleSearch = () => {
    pagination.currentPage = 1
    loadCompanies()
}

const handleSizeChange = (size: number) => {
    pagination.pageSize = size
    loadCompanies()
}

const handleCurrentChange = (page: number) => {
    pagination.currentPage = page
    loadCompanies()
}

const handleAddCompany = () => {
    resetForm()
    editingCompanyId.value = null // 设置为新增模式
    dialogVisible.value = true
}

const handleEditCompany = (company: Company) => {
    resetForm()
    editingCompanyId.value = company.id // 设置为编辑模式
    Object.assign(companyForm, {
        name: company.name,
        code: company.code,
        description: company.description || '',
        status: company.status,
        requireCheckout: company.requireCheckout !== undefined ? company.requireCheckout : true
    })
    dialogVisible.value = true
}

const handleViewCheckinRecords = (company: Company) => {
    router.push(`/company-checkin-records/${company.id}`)
}

const handleManageLaborSources = (company: Company) => {
    router.push(`/company/${company.id}/labor-sources`)
}

const handleShowQRCode = (company: Company) => {
    selectedCompany.value = company
    qrCodeDialogVisible.value = true
}

const handleDeleteCompany = async (company: Company) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除公司 "${company.name}" 吗？此操作不可恢复。`,
            '删除确认',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        const response = await apiService.deleteCompany(company.id)
        if (response.success) {
            ElMessage.success('公司删除成功')
            loadCompanies()
        } else {
            ElMessage.error(response.message || '删除公司失败')
        }
    } catch (error) {
        // 用户取消删除
    }
}

const resetForm = () => {
    if (companyFormRef.value) {
        companyFormRef.value.resetFields()
    }
    Object.assign(companyForm, {
        name: '',
        code: '',
        description: '',
        status: 'active',
        requireCheckout: true
    })
    editingCompanyId.value = null // 重置编辑状态
}

const handleSubmitCompany = async () => {
    if (!companyFormRef.value) return

    const valid = await companyFormRef.value.validate()
    if (!valid) return

    submitting.value = true
    try {
        if (isEditMode.value) {
            // 编辑公司
            const companyData = {
                name: companyForm.name,
                description: companyForm.description,
                status: companyForm.status,
                requireCheckout: companyForm.requireCheckout
            }
            const response = await apiService.updateCompany(editingCompanyId.value!, companyData)
            if (response.success) {
                ElMessage.success('公司信息更新成功')
                dialogVisible.value = false
                loadCompanies()
            } else {
                ElMessage.error(response.message || '更新公司信息失败')
            }
        } else {
            // 新增公司
            const companyData = {
                name: companyForm.name,
                code: companyForm.code,
                description: companyForm.description,
                requireCheckout: companyForm.requireCheckout
            }
            const response = await apiService.createCompany(companyData)
            if (response.success) {
                ElMessage.success('公司创建成功')
                dialogVisible.value = false
                loadCompanies()
            } else {
                ElMessage.error(response.message || '创建公司失败')
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
    loadCompanies()
})
</script>

<style scoped>
.company-management {}

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
</style>
