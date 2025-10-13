<template>
    <div class="login-container">
        <div class="login-box">
            <div class="login-header">
                <h2>Excel数据管理系统</h2>
                <p>请登录以继续访问</p>
            </div>

            <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form"
                @submit.prevent="handleLogin">
                <el-form-item prop="username">
                    <el-input v-model="loginForm.username" placeholder="用户名" size="large" prefix-icon="User" />
                </el-form-item>

                <el-form-item prop="password">
                    <el-input v-model="loginForm.password" type="password" placeholder="密码" size="large"
                        prefix-icon="Lock" show-password @keyup.enter="handleLogin" />
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" size="large" class="login-button" :loading="loading" @click="handleLogin">
                        {{ loading ? '登录中...' : '登录' }}
                    </el-button>
                </el-form-item>
            </el-form>

            <div class="login-footer">
                <p>提示：请使用 admin/admin 登录系统</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
    username: '',
    password: ''
})

const loginRules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 3, max: 20, message: '密码长度在 3 到 20 个字符', trigger: 'blur' }
    ]
}

const handleLogin = async () => {
    if (!loginFormRef.value) return

    try {
        await loginFormRef.value.validate()
        loading.value = true

        const result = await authStore.login(loginForm.username, loginForm.password)

        if (result.success) {
            ElMessage.success(result.message)

            // 跳转到原请求页面或默认页面
            const redirect = route.query.redirect as string || '/'
            router.push(redirect)
        } else {
            ElMessage.error(result.message)
        }
    } catch (error) {
        console.error('登录验证失败:', error)
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.login-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.login-box {
    width: 400px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    padding: 40px;
}

.login-header {
    text-align: center;
    margin-bottom: 30px;
}

.login-header h2 {
    margin: 0 0 8px 0;
    color: #303133;
    font-size: 24px;
    font-weight: 600;
}

.login-header p {
    margin: 0;
    color: #909399;
    font-size: 14px;
}

.login-form {
    margin-bottom: 20px;
}

.login-button {
    width: 100%;
    margin-top: 10px;
}

.login-footer {
    text-align: center;
    border-top: 1px solid #ebeef5;
    padding-top: 20px;
}

.login-footer p {
    margin: 0;
    color: #c0c4cc;
    font-size: 12px;
}
</style>
