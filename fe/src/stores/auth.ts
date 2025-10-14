/*
 * @Date: 2025-10-13 10:08:31
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-14 20:35:43
 * @FilePath: /lowCode_excel/fe/src/stores/auth.ts
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

interface UserInfo {
    id: number
    username: string
    email?: string
    role?: string
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
            // 验证管理员账户
            if (username === 'admin' && password === '1017005349') {
                const mockToken = 'mock_jwt_token_' + Date.now()
                const mockUserInfo: UserInfo = {
                    id: 1,
                    username: 'admin',
                    email: 'admin@example.com',
                    role: 'admin'
                }

                token.value = mockToken
                userInfo.value = mockUserInfo

                // 保存到本地存储
                localStorage.setItem('auth_token', mockToken)
                localStorage.setItem('user_info', JSON.stringify(mockUserInfo))

                return { success: true, message: '登录成功' }
            } else {
                return { success: false, message: '用户名或密码错误' }
            }
        } catch (error) {
            console.error('登录失败:', error)
            return { success: false, message: '登录失败，请检查用户名和密码' }
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

    // 检查登录状态
    const checkAuth = () => {
        const storedToken = localStorage.getItem('auth_token')
        const storedUserInfo = localStorage.getItem('user_info')

        if (storedToken && storedUserInfo) {
            try {
                token.value = storedToken
                userInfo.value = JSON.parse(storedUserInfo)
            } catch (error) {
                console.error('解析用户信息失败:', error)
                logout()
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
        checkAuth
    }
})
