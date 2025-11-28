/*
 * @Date: 2025-10-13 10:08:31
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-29 00:45:42
 * @FilePath: /打卡/fe/src/stores/auth.ts
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { apiService } from '../services/api'

interface UserInfo {
    id: number
    username: string
    email?: string
    displayName?: string
    realName?: string
    phone?: string
    idCard?: string
    role: string
    isActive: boolean
    lastLogin?: string
    createdAt: string
    updatedAt: string
}

export const useAuthStore = defineStore('auth', () => {
    const router = useRouter()

    // 状态
    const token = ref<string | null>(localStorage.getItem('auth_token'))
    const userInfo = ref<UserInfo | null>(null)
    const isAuthenticated = computed(() => !!token.value)

    // 登录
    const login = async (username: string, password: string) => {
        try {
            const response = await apiService.login(username, password)

            if (response.success) {
                const { token: authToken, user } = response.data

                token.value = authToken
                userInfo.value = user

                // 保存到本地存储
                localStorage.setItem('auth_token', authToken)
                localStorage.setItem('user_info', JSON.stringify(user))

                return { success: true, message: '登录成功' }
            } else {
                return { success: false, message: response.message || '登录失败' }
            }
        } catch (error: any) {
            console.error('登录失败:', error)
            const errorMessage = error.response?.data?.message || '登录失败，请检查用户名和密码'
            return { success: false, message: errorMessage }
        }
    }

    // 登出
    const logout = () => {
        token.value = null
        userInfo.value = null
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_info')

        // 跳转到登录页面
        router.push('/login')
    }

    // 获取当前用户信息
    const getCurrentUser = async () => {
        try {
            const response = await apiService.getCurrentUser()

            if (response.success) {
                userInfo.value = response.data
                localStorage.setItem('user_info', JSON.stringify(response.data))
                return { success: true, data: response.data }
            } else {
                return { success: false, message: response.message }
            }
        } catch (error: any) {
            console.error('获取用户信息失败:', error)
            // 如果token无效，自动登出
            if (error.response?.status === 401) {
                logout()
            }
            return { success: false, message: '获取用户信息失败' }
        }
    }

    // 检查登录状态
    const checkAuth = async () => {
        const storedToken = localStorage.getItem('auth_token')
        const storedUserInfo = localStorage.getItem('user_info')

        if (storedToken) {
            token.value = storedToken

            if (storedUserInfo) {
                try {
                    userInfo.value = JSON.parse(storedUserInfo)
                    // 验证token是否仍然有效
                    await getCurrentUser()
                } catch (error) {
                    console.error('解析用户信息失败:', error)
                    // 如果解析失败，重新获取用户信息
                    await getCurrentUser()
                }
            } else {
                // 如果没有用户信息，重新获取
                await getCurrentUser()
            }
        }
    }

    // 初始化时检查登录状态
    checkAuth()

    return {
        token,
        userInfo,
        isAuthenticated,
        login,
        logout,
        getCurrentUser,
        checkAuth
    }
})
