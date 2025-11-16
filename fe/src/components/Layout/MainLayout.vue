<template>
    <el-container class="layout-container modern-layout">
        <!-- 侧边栏 -->
        <el-aside :width="sidebarWidth" class="sidebar modern-sidebar">
            <div class="logo modern-logo">
                <div class="logo-icon">
                    <el-icon size="24">
                        <DataBoard />
                    </el-icon>
                </div>
                <h2 class="logo-text" v-show="!isCollapsed">Excel数据管理</h2>
            </div>
            <el-menu :default-active="activeMenu" router class="sidebar-menu modern-sidebar-menu"
                :collapse="isCollapsed" background-color="transparent" text-color="#bfcbd9" active-text-color="#ffffff">
                <el-menu-item index="/" class="modern-menu-item">
                    <template #title>
                        <el-icon>
                            <House />
                        </el-icon>
                        <span>仪表盘</span>
                    </template>
                </el-menu-item>
                <el-menu-item index="/files" class="modern-menu-item">
                    <template #title>
                        <el-icon>
                            <Folder />
                        </el-icon>
                        <span>文件管理</span>
                    </template>
                </el-menu-item>
                <el-menu-item index="/data" class="modern-menu-item">
                    <template #title>
                        <el-icon>
                            <DataBoard />
                        </el-icon>
                        <span>数据浏览</span>
                    </template>
                </el-menu-item>
                <el-menu-item index="/editor" class="modern-menu-item">
                    <template #title>
                        <el-icon>
                            <Edit />
                        </el-icon>
                        <span>数据编辑</span>
                    </template>
                </el-menu-item>
                <el-menu-item index="/mappings" class="modern-menu-item">
                    <template #title>
                        <el-icon>
                            <Connection />
                        </el-icon>
                        <span>映射关系</span>
                    </template>
                </el-menu-item>
                <el-menu-item index="/forms" class="modern-menu-item">
                    <template #title>
                        <el-icon>
                            <Document />
                        </el-icon>
                        <span>表单管理</span>
                    </template>
                </el-menu-item>
                <el-menu-item index="/api-guide" class="modern-menu-item">
                    <template #title>
                        <el-icon>
                            <Document />
                        </el-icon>
                        <span>API指南</span>
                    </template>
                </el-menu-item>
                <el-menu-item index="/users" class="modern-menu-item">
                    <template #title>
                        <el-icon>
                            <User />
                        </el-icon>
                        <span>用户管理</span>
                    </template>
                </el-menu-item>
                <el-menu-item index="/logs" class="modern-menu-item">
                    <template #title>
                        <el-icon>
                            <Notebook />
                        </el-icon>
                        <span>操作日志</span>
                    </template>
                </el-menu-item>
            </el-menu>
            <div class="sidebar-footer">
                <el-button type="text" class="collapse-btn" @click="toggleSidebar"
                    :title="isCollapsed ? '展开侧边栏' : '折叠侧边栏'">
                    <el-icon>
                        <ArrowLeft v-if="!isCollapsed" />
                        <ArrowRight v-else />
                    </el-icon>
                    <span v-show="!isCollapsed">折叠菜单</span>
                </el-button>
            </div>
        </el-aside>

        <!-- 主内容区 -->
        <el-container>
            <!-- 头部 -->
            <el-header class="header modern-header">
                <div class="header-left">
                    <el-breadcrumb separator="/" class="modern-breadcrumb">
                        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
                        <el-breadcrumb-item>{{ currentRouteName }}</el-breadcrumb-item>
                    </el-breadcrumb>
                </div>
                <div class="header-right">
                    <div class="header-actions">
                        <el-button type="text" class="action-btn" @click="toggleTheme">
                            <el-icon size="18">
                                <Sunny />
                            </el-icon>
                        </el-button>
                        <el-dropdown @command="handleCommand" class="user-dropdown">
                            <span class="user-info modern-user-info">
                                <div class="user-avatar">
                                    <el-icon>
                                        <User />
                                    </el-icon>
                                </div>
                                <span class="username">{{ authStore.userInfo?.username }}</span>
                                <el-icon class="dropdown-arrow">
                                    <ArrowDown />
                                </el-icon>
                            </span>
                            <template #dropdown>
                                <el-dropdown-menu class="modern-dropdown-menu">
                                    <el-dropdown-item command="profile" class="dropdown-item">
                                        <el-icon>
                                            <User />
                                        </el-icon>
                                        <span>个人资料</span>
                                    </el-dropdown-item>
                                    <el-dropdown-item command="settings" class="dropdown-item">
                                        <el-icon>
                                            <Setting />
                                        </el-icon>
                                        <span>系统设置</span>
                                    </el-dropdown-item>
                                    <el-dropdown-item divided command="logout" class="dropdown-item logout-item">
                                        <el-icon>
                                            <SwitchButton />
                                        </el-icon>
                                        <span>退出登录</span>
                                    </el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </div>
                </div>
            </el-header>

            <!-- 主要内容 -->
            <el-main class="main-content modern-main-content">
                <router-view />
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
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
    Notebook,
    ArrowLeft,
    ArrowRight,
    ArrowDown,
    Setting,
    SwitchButton
} from '@element-plus/icons-vue'

const route = useRoute()
const authStore = useAuthStore()

// 侧边栏折叠状态
const isCollapsed = ref(false)

// 侧边栏宽度计算
const sidebarWidth = computed(() => isCollapsed.value ? '64px' : '200px')

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
        '/forms': '表单管理',
        '/api-guide': 'API指南',
        '/users': '用户管理',
        '/logs': '操作日志'
    }
    return routeMap[route.path] || '未知页面'
})

// 切换侧边栏折叠状态
const toggleSidebar = () => {
    isCollapsed.value = !isCollapsed.value
}

// 切换主题（暂未实现）
const toggleTheme = () => {
    ElMessage.info('主题切换功能开发中...')
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
    } else if (command === 'profile') {
        ElMessage.info('个人资料功能开发中...')
    } else if (command === 'settings') {
        ElMessage.info('系统设置功能开发中...')
    }
}
</script>

<style scoped>
.layout-container {
    height: 100vh;
}

.modern-layout {
    background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
}

/* 侧边栏样式 */
.sidebar {
    overflow: hidden;
    transition: all var(--transition-base);
}

.modern-sidebar {
    background: linear-gradient(180deg, #1f2d3d 0%, #304156 100%);
    box-shadow: var(--shadow-lg);
    border-right: none;
    position: relative;
}

.modern-logo {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 16px;
    color: #fff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    gap: 12px;
}

.logo-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
    border-radius: var(--radius-base);
    color: white;
}

.logo-text {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.sidebar-menu {
    border: none;
    background: transparent !important;
}

.modern-sidebar-menu {
    padding: 8px 0;
}

.modern-sidebar-menu .el-menu-item {
    height: 48px;
    line-height: 48px;
    margin: 4px 8px;
    border-radius: var(--radius-base);
    transition: all var(--transition-base);
    position: relative;
    overflow: hidden;
}

.modern-sidebar-menu .el-menu-item:not(.is-active):hover {
    background: rgba(255, 255, 255, 0.08) !important;
    transform: translateX(4px);
}

.modern-sidebar-menu .el-menu-item.is-active {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%) !important;
    box-shadow: var(--gradient-shadow);
    color: #fff !important;
}

.modern-sidebar-menu .el-menu-item.is-active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 20px;
    background: #fff;
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.modern-sidebar-menu .el-icon {
    font-size: 18px;
    margin-right: 12px;
}

/* 修复折叠状态下tooltip中的图标显示 */
.modern-sidebar-menu.el-menu--collapse .el-menu-item .el-icon {
    margin-right: 0;
    font-size: 20px;
}

/* 确保tooltip中的图标可见 */
.el-menu-tooltip__trigger .el-icon {
    font-size: 20px !important;
    color: #bfcbd9 !important;
}

.sidebar-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
}

.collapse-btn {
    width: 100%;
    color: #bfcbd9 !important;
    transition: all var(--transition-base);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: var(--radius-base);
}

.collapse-btn:hover {
    color: #fff !important;
    background: rgba(255, 255, 255, 0.1) !important;
    transform: translateX(-2px);
}

/* 折叠状态下按钮样式优化 */
.modern-sidebar .collapse-btn {
    justify-content: flex-start;
}

.modern-sidebar .collapse-btn span {
    display: inline;
}

/* 折叠状态下的样式 */
.modern-sidebar[style*="width: 64px"] .collapse-btn,
.modern-sidebar[style*="width: 64px;"] .collapse-btn {
    justify-content: center;
}

.modern-sidebar[style*="width: 64px"] .collapse-btn span,
.modern-sidebar[style*="width: 64px;"] .collapse-btn span {
    display: none;
}

/* Header样式 */
.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all var(--transition-base);
}

.modern-header {
    background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
    border-bottom: 1px solid var(--border-light);
    box-shadow: var(--shadow-base);
    padding: 0 24px;
    height: 64px;
}

.header-left {
    display: flex;
    align-items: center;
}

.modern-breadcrumb {
    font-size: 14px;
}

.modern-breadcrumb .el-breadcrumb__item:last-child .el-breadcrumb__inner {
    color: var(--primary-color);
    font-weight: 500;
}

.header-right {
    display: flex;
    align-items: center;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.action-btn {
    color: var(--text-secondary) !important;
    padding: 8px;
    border-radius: var(--radius-base);
    transition: all var(--transition-base);
}

.action-btn:hover {
    color: var(--primary-color) !important;
    background: var(--bg-tertiary) !important;
    transform: scale(1.05);
}

.user-dropdown {
    margin-left: 8px;
}

.modern-user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: var(--radius-base);
    cursor: pointer;
    transition: all var(--transition-base);
    background: var(--bg-tertiary);
    border: 1px solid var(--border-light);
}

.modern-user-info:hover {
    background: var(--bg-secondary);
    border-color: var(--border-base);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
}

.user-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
    border-radius: var(--radius-full);
    color: white;
}

.username {
    font-weight: 500;
    color: var(--text-primary);
    font-size: 14px;
}

.dropdown-arrow {
    color: var(--text-tertiary);
    transition: transform var(--transition-base);
}

.user-dropdown:hover .dropdown-arrow {
    transform: rotate(180deg);
}

.modern-dropdown-menu {
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-light);
    padding: 8px 0;
}

.dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    font-size: 14px;
    transition: all var(--transition-fast);
}

.dropdown-item:hover {
    background: var(--bg-tertiary);
    color: var(--primary-color);
}

.dropdown-item .el-icon {
    font-size: 16px;
}

.logout-item:hover {
    color: var(--error-color) !important;
}

/* 主内容区样式 */
.main-content {
    background-color: var(--bg-tertiary);
    transition: all var(--transition-base);
}

.modern-main-content {
    padding: 24px;
    background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
}

/* 响应式设计 */
@media (max-width: 768px) {
    .modern-header {
        padding: 0 16px;
    }

    .modern-main-content {
        padding: 16px;
    }

    .modern-user-info .username {
        display: none;
    }

    .sidebar-footer {
        padding: 12px;
    }
}

/* 动画效果 */
.modern-layout {
    animation: fadeInUp var(--transition-slow) ease-out;
}

.modern-sidebar {
    animation: slideInRight var(--transition-base) ease-out;
}

/* 侧边栏折叠动画 */
.modern-sidebar {
    transition: all var(--transition-base) cubic-bezier(0.4, 0, 0.2, 1);
}

.modern-sidebar-menu .el-menu-item {
    transition: all var(--transition-base) cubic-bezier(0.4, 0, 0.2, 1);
}

/* Logo图标悬停动画 */
.logo-icon {
    transition: all var(--transition-base);
    animation: pulse 2s infinite;
}

.logo-icon:hover {
    transform: scale(1.1) rotate(5deg);
    animation: none;
}

/* 菜单项图标动画 */
.modern-sidebar-menu .el-menu-item .el-icon {
    transition: transform var(--transition-fast);
}

.modern-sidebar-menu .el-menu-item:hover .el-icon {
    transform: scale(1.2);
}

.modern-sidebar-menu .el-menu-item.is-active .el-icon {
    transform: scale(1.1);
    animation: bounce 0.5s ease-in-out;
}

/* 折叠按钮动画 */
.collapse-btn {
    transition: all var(--transition-base) cubic-bezier(0.4, 0, 0.2, 1);
}

.collapse-btn:hover {
    transform: translateX(-2px);
}

/* Header按钮动画 */
.action-btn {
    position: relative;
    overflow: hidden;
}

.action-btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(24, 144, 255, 0.1);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: all var(--transition-base);
}

.action-btn:hover::before {
    width: 40px;
    height: 40px;
}

/* 用户信息悬停动画 */
.modern-user-info {
    position: relative;
    overflow: hidden;
}

.modern-user-info::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left var(--transition-slow);
}

.modern-user-info:hover::before {
    left: 100%;
}

/* 下拉菜单动画 */
.modern-dropdown-menu {
    animation: scaleIn var(--transition-fast) ease-out;
}

.dropdown-item {
    position: relative;
    overflow: hidden;
}

.dropdown-item::before {
    content: '';
    position: absolute;
    left: -100%;
    top: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, var(--bg-tertiary), transparent);
    transition: left var(--transition-base);
}

.dropdown-item:hover::before {
    left: 100%;
}

/* 面包屑动画 */
.modern-breadcrumb .el-breadcrumb__inner {
    position: relative;
    transition: all var(--transition-fast);
}

.modern-breadcrumb .el-breadcrumb__inner:hover {
    color: var(--primary-color);
    transform: translateY(-1px);
}

/* 新增动画关键帧 */
@keyframes pulse {

    0%,
    100% {
        box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4);
    }

    50% {
        box-shadow: 0 0 0 8px rgba(24, 144, 255, 0);
    }
}

@keyframes bounce {

    0%,
    20%,
    53%,
    80%,
    100% {
        transform: scale(1.1) translate3d(0, 0, 0);
    }

    40%,
    43% {
        transform: scale(1.15) translate3d(0, -3px, 0);
    }

    70% {
        transform: scale(1.1) translate3d(0, -2px, 0);
    }
}

@keyframes scaleIn {
    0% {
        opacity: 0;
        transform: scale(0.9) translateY(-10px);
    }

    100% {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

@keyframes glow {

    0%,
    100% {
        box-shadow: var(--gradient-shadow);
    }

    50% {
        box-shadow: var(--gradient-shadow-hover);
    }
}

/* 页面切换动画 */
.main-content {
    animation: fadeInUp var(--transition-base) ease-out;
}

/* 响应式动画优化 */
@media (max-width: 768px) {
    .modern-sidebar-menu .el-menu-item:hover {
        transform: none;
    }

    .action-btn:hover::before {
        width: 30px;
        height: 30px;
    }
}
</style>
