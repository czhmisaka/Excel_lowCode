<template>
    <div class="user-management fade-in-up">
        <!-- 搜索和操作栏 -->
        <div class="modern-toolbar">
            <el-row :gutter="20">
                <el-col :span="8">
                    <el-input v-model="searchKeyword" placeholder="搜索用户名、邮箱或显示名称" clearable @clear="handleSearch"
                        @keyup.enter="handleSearch">
                        <template #append>
                            <el-button :icon="Search" @click="handleSearch" />
                        </template>
                    </el-input>
                </el-col>
                <el-col :span="16" class="text-right">
                    <el-button type="primary" :icon="Plus" @click="handleAddUser">
                        新增用户
                    </el-button>
                    <el-button :icon="Refresh" @click="loadUsers">
                        刷新
                    </el-button>
                </el-col>
            </el-row>
        </div>

        <!-- 用户表格 -->
        <div class="modern-card" style="margin-bottom: 20px;">
            <el-table v-loading="loading" :data="userList" border stripe class="modern-table" style="width: 100%">
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="username" label="用户名" min-width="120" />
                <el-table-column prop="email" label="邮箱" min-width="180" />
                <el-table-column prop="displayName" label="显示名称" min-width="120" />
                <el-table-column prop="role" label="角色" width="100">
                    <template #default="{ row }">
                        <el-tag :type="row.role === 'admin' ? 'danger' : 'primary'">
                            {{ row.role === 'admin' ? '管理员' : '用户' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="isActive" label="状态" width="80">
                    <template #default="{ row }">
                        <el-tag :type="row.isActive ? 'success' : 'info'">
                            {{ row.isActive ? '启用' : '禁用' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="lastLogin" label="最后登录" width="180">
                    <template #default="{ row }">
                        {{ formatDate(row.lastLogin) }}
                    </template>
                </el-table-column>
                <el-table-column prop="createdAt" label="创建时间" width="180">
                    <template #default="{ row }">
                        {{ formatDate(row.createdAt) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200" fixed="right">
                    <template #default="{ row }">
                        <el-button size="small" type="primary" :icon="Edit" @click="handleEditUser(row)">
                            编辑
                        </el-button>
                        <el-button size="small" type="danger" :icon="Delete" @click="handleDeleteUser(row)"
                            :disabled="row.id === currentUser?.id">
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

            <!-- 新增/编辑用户对话框 -->
            <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" :close-on-click-modal="false"
                class="modern-dialog" append-to-body>
                <el-form ref="userFormRef" :model="userForm" :rules="userFormRules" label-width="100px">
                    <el-form-item label="用户名" prop="username">
                        <el-input v-model="userForm.username" placeholder="请输入用户名" :disabled="isEditMode" />
                    </el-form-item>
                    <el-form-item label="邮箱" prop="email">
                        <el-input v-model="userForm.email" placeholder="请输入邮箱地址" />
                    </el-form-item>
                    <el-form-item label="显示名称" prop="displayName">
                        <el-input v-model="userForm.displayName" placeholder="请输入显示名称" />
                    </el-form-item>
                    <el-form-item label="角色" prop="role">
                        <el-select v-model="userForm.role" placeholder="请选择角色">
                            <el-option label="用户" value="user" />
                            <el-option label="管理员" value="admin" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="状态" prop="isActive">
                        <el-switch v-model="userForm.isActive" active-text="启用" inactive-text="禁用" />
                    </el-form-item>
                    <el-form-item v-if="!isEditMode" label="密码" prop="password">
                        <el-input v-model="userForm.password" type="password" placeholder="请输入密码" show-password />
                    </el-form-item>
                    <el-form-item v-if="!isEditMode" label="确认密码" prop="confirmPassword">
                        <el-input v-model="userForm.confirmPassword" type="password" placeholder="请再次输入密码"
                            show-password />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="dialogVisible = false">取消</el-button>
                        <el-button type="primary" @click="handleSubmitUser" :loading="submitting">
                            确定
                        </el-button>
                    </span>
                </template>
            </el-dialog>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Edit, Delete, Refresh, Search } from '@element-plus/icons-vue'
import { apiService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

interface User {
    id: number
    username: string
    email?: string
    displayName?: string
    role: string
    isActive: boolean
    lastLogin?: string
    createdAt: string
    updatedAt: string
}

interface UserForm {
    username: string
    email: string
    displayName: string
    role: string
    isActive: boolean
    password: string
    confirmPassword: string
}

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const searchKeyword = ref('')
const userList = ref<User[]>([])
const userFormRef = ref<FormInstance>()
const currentUser = computed(() => useAuthStore().userInfo)

const pagination = reactive({
    currentPage: 1,
    pageSize: 10,
    total: 0
})

const userForm = reactive<UserForm>({
    username: '',
    email: '',
    displayName: '',
    role: 'user',
    isActive: true,
    password: '',
    confirmPassword: ''
})

// 计算属性
const dialogTitle = computed(() => isEditMode.value ? '编辑用户' : '新增用户')
const isEditMode = computed(() => editingUserId.value !== null)

// 编辑状态
const editingUserId = ref<number | null>(null)

// 表单验证规则
const userFormRules: FormRules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' }
    ],
    email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
    ],
    displayName: [
        { required: true, message: '请输入显示名称', trigger: 'blur' },
        { min: 2, max: 50, message: '显示名称长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    role: [
        { required: true, message: '请选择角色', trigger: 'change' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        {
            validator: (rule, value, callback) => {
                if (value !== userForm.password) {
                    callback(new Error('两次输入密码不一致'))
                } else {
                    callback()
                }
            },
            trigger: 'blur'
        }
    ]
}

// 方法
const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('zh-CN')
}

const loadUsers = async () => {
    loading.value = true
    try {
        const response = await apiService.getUsers()
        if (response.success) {
            // 正确处理 API 返回的数据结构：response.data.data.users
            const usersData = response.data?.data?.users || response.data?.users || response.data
            userList.value = Array.isArray(usersData) ? usersData : []
            pagination.total = response.data?.data?.pagination?.total || response.data?.pagination?.total || userList.value.length
        } else {
            ElMessage.error(response.message || '获取用户列表失败')
            userList.value = [] // 确保数据是数组
        }
    } catch (error: any) {
        ElMessage.error(error.message || '获取用户列表失败')
        userList.value = [] // 确保数据是数组
    } finally {
        loading.value = false
    }
}

const handleSearch = () => {
    pagination.currentPage = 1
    loadUsers()
}

const handleSizeChange = (size: number) => {
    pagination.pageSize = size
    loadUsers()
}

const handleCurrentChange = (page: number) => {
    pagination.currentPage = page
    loadUsers()
}

const handleAddUser = () => {
    resetForm()
    editingUserId.value = null // 设置为新增模式
    dialogVisible.value = true
}

const handleEditUser = (user: User) => {
    resetForm()
    editingUserId.value = user.id // 设置为编辑模式
    Object.assign(userForm, {
        username: user.username,
        email: user.email || '',
        displayName: user.displayName || '',
        role: user.role,
        isActive: user.isActive,
        password: '',
        confirmPassword: ''
    })
    dialogVisible.value = true
}

const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser.value?.id) {
        ElMessage.warning('不能删除当前登录用户')
        return
    }

    try {
        await ElMessageBox.confirm(
            `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
            '删除确认',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        const response = await apiService.deleteUser(user.id)
        if (response.success) {
            ElMessage.success('用户删除成功')
            loadUsers()
        } else {
            ElMessage.error(response.message || '删除用户失败')
        }
    } catch (error) {
        // 用户取消删除
    }
}

const resetForm = () => {
    if (userFormRef.value) {
        userFormRef.value.resetFields()
    }
    Object.assign(userForm, {
        username: '',
        email: '',
        displayName: '',
        role: 'user',
        isActive: true,
        password: '',
        confirmPassword: ''
    })
    editingUserId.value = null // 重置编辑状态
}

const handleSubmitUser = async () => {
    if (!userFormRef.value) return

    const valid = await userFormRef.value.validate()
    if (!valid) return

    submitting.value = true
    try {
        if (isEditMode.value) {
            // 编辑用户
            const userData = {
                email: userForm.email,
                displayName: userForm.displayName,
                role: userForm.role,
                isActive: userForm.isActive
            }
            const user = userList.value.find(u => u.username === userForm.username)
            if (user) {
                const response = await apiService.updateUser(user.id, userData)
                if (response.success) {
                    ElMessage.success('用户信息更新成功')
                    dialogVisible.value = false
                    loadUsers()
                } else {
                    ElMessage.error(response.message || '更新用户信息失败')
                }
            }
        } else {
            // 新增用户
            const userData = {
                username: userForm.username,
                email: userForm.email,
                displayName: userForm.displayName,
                role: userForm.role,
                isActive: userForm.isActive,
                password: userForm.password
            }
            const response = await apiService.register(userData)
            if (response.success) {
                ElMessage.success('用户创建成功')
                dialogVisible.value = false
                loadUsers()
            } else {
                ElMessage.error(response.message || '创建用户失败')
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
    loadUsers()
})
</script>

<style scoped>
.user-management {}

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
