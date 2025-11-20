<template>
    <div class="profile-view fade-in-up">
        <!-- 页面标题 -->
        <div class="page-header">
            <h1>个人中心</h1>
            <p>管理您的个人信息和账户设置</p>
        </div>

        <!-- 主要内容区域 -->
        <div class="profile-content">
            <el-row :gutter="20">
                <!-- 左侧：用户信息卡片 -->
                <el-col :span="8">
                    <div class="modern-card">
                        <div class="user-info-card">
                            <div class="user-avatar">
                                <el-avatar :size="80" :src="safeUserInfo.avatar" class="avatar">
                                    {{ safeUserInfo.displayName?.charAt(0) || safeUserInfo.username?.charAt(0) }}
                                </el-avatar>
                            </div>
                            <div class="user-details">
                                <h3>{{ safeUserInfo.displayName || safeUserInfo.username }}</h3>
                                <p class="username">@{{ safeUserInfo.username }}</p>
                                <p class="email">{{ safeUserInfo.email || '未设置邮箱' }}</p>
                                <el-tag :type="safeUserInfo.role === 'admin' ? 'danger' : 'primary'" class="role-tag">
                                    {{ safeUserInfo.role === 'admin' ? '管理员' : '用户' }}
                                </el-tag>
                            </div>
                            <div class="user-stats">
                                <div class="stat-item">
                                    <span class="stat-label">最后登录</span>
                                    <span class="stat-value">{{ formatDate(safeUserInfo.lastLogin) }}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">注册时间</span>
                                    <span class="stat-value">{{ formatDate(safeUserInfo.createdAt) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </el-col>

                <!-- 右侧：设置区域 -->
                <el-col :span="16">
                    <!-- 基本信息编辑 -->
                    <div class="modern-card" style="margin-bottom: 20px;">
                        <div class="card-header">
                            <h3>基本信息</h3>
                            <el-button 
                                v-if="!editingProfile" 
                                type="primary" 
                                :icon="Edit" 
                                @click="startEditProfile"
                            >
                                编辑信息
                            </el-button>
                            <div v-else>
                                <el-button @click="cancelEditProfile">取消</el-button>
                                <el-button type="primary" @click="saveProfile" :loading="savingProfile">
                                    保存
                                </el-button>
                            </div>
                        </div>
                        
                        <el-form 
                            v-if="editingProfile" 
                            ref="profileFormRef" 
                            :model="profileForm" 
                            :rules="profileFormRules" 
                            label-width="100px"
                        >
                            <el-form-item label="显示名称" prop="displayName">
                                <el-input v-model="profileForm.displayName" placeholder="请输入显示名称" />
                            </el-form-item>
                            <el-form-item label="邮箱" prop="email">
                                <el-input v-model="profileForm.email" placeholder="请输入邮箱地址" />
                            </el-form-item>
                        </el-form>
                        
                        <div v-else class="info-display">
                            <div class="info-item">
                                <span class="info-label">显示名称：</span>
                                <span class="info-value">{{ safeUserInfo.displayName || '未设置' }}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">邮箱：</span>
                                <span class="info-value">{{ safeUserInfo.email || '未设置' }}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">用户名：</span>
                                <span class="info-value">{{ safeUserInfo.username }}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">角色：</span>
                                <span class="info-value">{{ safeUserInfo.role === 'admin' ? '管理员' : '用户' }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- 密码修改 -->
                    <div class="modern-card">
                        <div class="card-header">
                            <h3>安全设置</h3>
                            <el-button 
                                v-if="!changingPassword" 
                                type="warning" 
                                :icon="Lock" 
                                @click="startChangePassword"
                            >
                                修改密码
                            </el-button>
                            <div v-else>
                                <el-button @click="cancelChangePassword">取消</el-button>
                                <el-button type="primary" @click="savePassword" :loading="savingPassword">
                                    确认修改
                                </el-button>
                            </div>
                        </div>
                        
                        <el-form 
                            v-if="changingPassword" 
                            ref="passwordFormRef" 
                            :model="passwordForm" 
                            :rules="passwordFormRules" 
                            label-width="120px"
                        >
                            <el-form-item label="当前密码" prop="currentPassword">
                                <el-input 
                                    v-model="passwordForm.currentPassword" 
                                    type="password" 
                                    placeholder="请输入当前密码" 
                                    show-password 
                                />
                            </el-form-item>
                            <el-form-item label="新密码" prop="newPassword">
                                <el-input 
                                    v-model="passwordForm.newPassword" 
                                    type="password" 
                                    placeholder="请输入新密码" 
                                    show-password 
                                />
                            </el-form-item>
                            <el-form-item label="确认新密码" prop="confirmPassword">
                                <el-input 
                                    v-model="passwordForm.confirmPassword" 
                                    type="password" 
                                    placeholder="请再次输入新密码" 
                                    show-password 
                                />
                            </el-form-item>
                        </el-form>
                        
                        <div v-else class="security-info">
                            <p>为了账户安全，建议您定期修改密码。</p>
                            <p>密码应包含字母、数字和特殊字符，长度不少于6位。</p>
                        </div>
                    </div>
                </el-col>
            </el-row>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Edit, Lock } from '@element-plus/icons-vue'
import { apiService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

interface UserInfo {
    id: number
    username: string
    email?: string
    displayName?: string
    role: string
    isActive: boolean
    lastLogin?: string
    createdAt: string
    updatedAt: string
    avatar?: string
}

interface ProfileForm {
    displayName: string
    email: string
}

interface PasswordForm {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

// 响应式数据
const authStore = useAuthStore()
const loading = ref(false)
const editingProfile = ref(false)
const changingPassword = ref(false)
const savingProfile = ref(false)
const savingPassword = ref(false)

const profileFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

// 计算属性
const userInfo = computed(() => authStore.userInfo as UserInfo | null)

// 安全的用户信息获取
const safeUserInfo = computed(() => userInfo.value || {
    id: 0,
    username: '',
    email: '',
    displayName: '',
    role: 'user',
    isActive: true,
    createdAt: '',
    updatedAt: ''
})

// 表单数据
const profileForm = reactive<ProfileForm>({
    displayName: '',
    email: ''
})

const passwordForm = reactive<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
})

// 表单验证规则
const profileFormRules: FormRules = {
    displayName: [
        { required: true, message: '请输入显示名称', trigger: 'blur' },
        { min: 2, max: 50, message: '显示名称长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
    ]
}

const passwordFormRules: FormRules = {
    currentPassword: [
        { required: true, message: '请输入当前密码', trigger: 'blur' }
    ],
    newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        {
            validator: (rule, value, callback) => {
                if (value !== passwordForm.newPassword) {
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

const startEditProfile = () => {
    if (!userInfo.value) return
    
    profileForm.displayName = userInfo.value.displayName || ''
    profileForm.email = userInfo.value.email || ''
    editingProfile.value = true
}

const cancelEditProfile = () => {
    editingProfile.value = false
    if (profileFormRef.value) {
        profileFormRef.value.resetFields()
    }
}

const saveProfile = async () => {
    if (!profileFormRef.value) return

    const valid = await profileFormRef.value.validate()
    if (!valid) return

    savingProfile.value = true
    try {
        const response = await apiService.updateCurrentUser({
            displayName: profileForm.displayName,
            email: profileForm.email
        })

        if (response.success) {
            ElMessage.success('个人信息更新成功')
            editingProfile.value = false
            // 刷新用户信息
            await authStore.getCurrentUser()
        } else {
            ElMessage.error(response.message || '更新个人信息失败')
        }
    } catch (error: any) {
        ElMessage.error(error.message || '更新个人信息失败')
    } finally {
        savingProfile.value = false
    }
}

const startChangePassword = () => {
    changingPassword.value = true
}

const cancelChangePassword = () => {
    changingPassword.value = false
    if (passwordFormRef.value) {
        passwordFormRef.value.resetFields()
    }
}

const savePassword = async () => {
    if (!passwordFormRef.value) return

    const valid = await passwordFormRef.value.validate()
    if (!valid) return

    savingPassword.value = true
    try {
        const response = await apiService.changePassword({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword
        })

        if (response.success) {
            ElMessage.success('密码修改成功')
            changingPassword.value = false
            // 清空密码表单
            if (passwordFormRef.value) {
                passwordFormRef.value.resetFields()
            }
        } else {
            ElMessage.error(response.message || '密码修改失败')
        }
    } catch (error: any) {
        ElMessage.error(error.message || '密码修改失败')
    } finally {
        savingPassword.value = false
    }
}

// 生命周期
onMounted(() => {
    // 确保用户信息已加载
    if (!userInfo.value) {
        authStore.getCurrentUser()
    }
})
</script>

<style scoped>
.profile-view {
    padding: 20px;
}

.page-header {
    margin-bottom: 30px;
}

.page-header h1 {
    margin: 0;
    color: #303133;
    font-size: 24px;
    font-weight: 600;
}

.page-header p {
    margin: 5px 0 0;
    color: #909399;
    font-size: 14px;
}

.profile-content {
    margin-top: 20px;
}

.user-info-card {
    text-align: center;
    padding: 20px;
}

.user-avatar {
    margin-bottom: 20px;
}

.avatar {
    background-color: #409eff;
    color: white;
    font-weight: bold;
    font-size: 24px;
}

.user-details h3 {
    margin: 0 0 8px;
    color: #303133;
    font-size: 18px;
}

.username {
    margin: 0 0 8px;
    color: #606266;
    font-size: 14px;
}

.email {
    margin: 0 0 12px;
    color: #909399;
    font-size: 14px;
}

.role-tag {
    margin-bottom: 20px;
}

.user-stats {
    border-top: 1px solid #ebeef5;
    padding-top: 20px;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
}

.stat-item:last-child {
    margin-bottom: 0;
}

.stat-label {
    color: #909399;
    font-size: 14px;
}

.stat-value {
    color: #303133;
    font-size: 14px;
    font-weight: 500;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #ebeef5;
}

.card-header h3 {
    margin: 0;
    color: #303133;
    font-size: 18px;
    font-weight: 600;
}

.info-display {
    padding: 10px 0;
}

.info-item {
    display: flex;
    margin-bottom: 12px;
    padding: 8px 0;
}

.info-item:last-child {
    margin-bottom: 0;
}

.info-label {
    color: #606266;
    font-weight: 500;
    min-width: 80px;
}

.info-value {
    color: #303133;
    flex: 1;
}

.security-info {
    padding: 10px 0;
    color: #606266;
    line-height: 1.6;
}

.security-info p {
    margin: 0 0 8px;
}

.security-info p:last-child {
    margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .profile-content .el-col {
        width: 100%;
    }
    
    .info-item {
        flex-direction: column;
    }
    
    .info-label {
        margin-bottom: 4px;
    }
}
</style>
