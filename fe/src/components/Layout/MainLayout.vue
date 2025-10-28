<template>
    <el-container class="layout-container">
        <!-- 侧边栏 -->
        <el-aside width="200px" class="sidebar">
            <div class="logo">
                <h2>Excel数据管理</h2>
            </div>
            <el-menu :default-active="activeMenu" router class="sidebar-menu" background-color="#304156"
                text-color="#bfcbd9" active-text-color="#409EFF">
                <el-menu-item index="/">
                    <el-icon>
                        <House />
                    </el-icon>
                    <span>仪表盘</span>
                </el-menu-item>
                <el-menu-item index="/files">
                    <el-icon>
                        <Folder />
                    </el-icon>
                    <span>文件管理</span>
                </el-menu-item>
                <el-menu-item index="/data">
                    <el-icon>
                        <DataBoard />
                    </el-icon>
                    <span>数据浏览</span>
                </el-menu-item>
                <el-menu-item index="/editor">
                    <el-icon>
                        <Edit />
                    </el-icon>
                    <span>数据编辑</span>
                </el-menu-item>
                <el-menu-item index="/mappings">
                    <el-icon>
                        <Connection />
                    </el-icon>
                    <span>映射关系</span>
                </el-menu-item>
                <el-menu-item index="/api-guide">
                    <el-icon>
                        <Document />
                    </el-icon>
                    <span>数据表 CRUD API 指南</span>
                </el-menu-item>
                <el-menu-item index="/users">
                    <el-icon>
                        <User />
                    </el-icon>
                    <span>用户管理</span>
                </el-menu-item>
                <el-menu-item index="/logs">
                    <el-icon>
                        <Notebook />
                    </el-icon>
                    <span>操作日志</span>
                </el-menu-item>
            </el-menu>
        </el-aside>

        <!-- 主内容区 -->
        <el-container>
            <!-- 头部 -->
            <el-header class="header">
                <div class="header-left">
                    <el-breadcrumb separator="/">
                        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
                        <el-breadcrumb-item>{{ currentRouteName }}</el-breadcrumb-item>
                    </el-breadcrumb>
                </div>
                <div class="header-right">
                    <el-dropdown @command="handleCommand">
                        <span class="user-info">
                            <el-icon>
                                <User />
                            </el-icon>
                            {{ authStore.userInfo?.username }}
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                    <el-button type="text" @click="toggleTheme">
                        <el-icon>
                            <Sunny />
                        </el-icon>
                    </el-button>
                </div>
            </el-header>

            <!-- 主要内容 -->
            <el-main class="main-content">
                <router-view />
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import {
    House,
    Folder,
    DataBoard,
    Edit,
    Connection,
    Sunny,
    Document,
    User,
    Notebook
} from '@element-plus/icons-vue'

const route = useRoute()
const authStore = useAuthStore()

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 当前路由名称
const currentRouteName = computed(() => {
    const routeMap: Record<string, string> = {
        '/': '仪表盘',
        '/files': '文件管理',
        '/data': '数据浏览',
        '/editor': '数据编辑',
        '/mappings': '映射关系',
        '/api-guide': '数据表 CRUD API 指南',
        '/users': '用户管理',
        '/logs': '操作日志'
    }
    return routeMap[route.path] || '未知页面'
})

// 切换主题（暂未实现）
const toggleTheme = () => {
    console.log('切换主题')
}

// 处理下拉菜单命令
const handleCommand = async (command: string) => {
    if (command === 'logout') {
        try {
            await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            })
            authStore.logout()
        } catch (error) {
            // 用户取消操作
        }
    }
}
</script>

<style scoped>
.layout-container {
    height: 100vh;
}

.sidebar {
    background-color: #304156;
    overflow: hidden;
}

.logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    border-bottom: 1px solid #1f2d3d;
}

.logo h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.sidebar-menu {
    border: none;
}

.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #fff;
    border-bottom: 1px solid #e6e6e6;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
    display: flex;
    align-items: center;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 16px;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.user-info:hover {
    background-color: #f5f7fa;
}

.main-content {
    background-color: #f0f2f5;
    padding: 20px;
    overflow: auto;
}
</style>
