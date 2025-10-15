<template>
    <div class="dashboard">
        <el-row :gutter="20">
            <!-- 统计卡片 -->
            <el-col :span="6">
                <el-card class="stat-card">
                    <div class="stat-content">
                        <div class="stat-icon">
                            <el-icon>
                                <Folder />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">{{ fileCount }}</div>
                            <div class="stat-label">已上传文件</div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="6">
                <el-card class="stat-card">
                    <div class="stat-content">
                        <div class="stat-icon">
                            <el-icon>
                                <DataBoard />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">{{ totalRecords }}</div>
                            <div class="stat-label">总数据记录</div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="6">
                <el-card class="stat-card">
                    <div class="stat-content">
                        <div class="stat-icon">
                            <el-icon>
                                <Check />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">{{ systemStatus }}</div>
                            <div class="stat-label">系统状态</div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="6">
                <el-card class="stat-card">
                    <div class="stat-content">
                        <div class="stat-icon">
                            <el-icon>
                                <Clock />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value">{{ lastUpdate }}</div>
                            <div class="stat-label">最后更新</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 最近上传文件 -->
        <el-card class="recent-files" style="margin-top: 20px;">
            <template #header>
                <div class="card-header">
                    <span>最近上传的文件</span>
                    <el-button type="primary" text @click="goToFileManagement">查看全部</el-button>
                </div>
            </template>

            <el-table :data="recentFiles" v-loading="loading">
                <el-table-column prop="originalFileName" label="文件名" min-width="200" />
                <el-table-column prop="recordCount" label="记录数" width="100" />
                <el-table-column prop="columnCount" label="列数" width="80" />
                <el-table-column prop="createdAt" label="上传时间" width="180" />
                <el-table-column label="操作" width="120">
                    <template #default="scope">
                        <el-button type="primary" link @click="viewData(scope.row)">查看数据</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 快速操作 -->
        <el-row :gutter="20" style="margin-top: 20px;">
            <el-col :span="8">
                <el-card class="quick-action">
                    <template #header>
                        <div class="card-header">
                            <span>快速操作</span>
                        </div>
                    </template>
                    <div class="action-buttons">
                        <el-button type="primary" @click="goToFileManagement" style="width: 100%; margin-bottom: 10px;">
                            <el-icon>
                                <Upload />
                            </el-icon>
                            上传文件
                        </el-button>
                        <el-button @click="goToDataBrowser" style="width: 100%; margin-bottom: 10px;">
                            <el-icon>
                                <DataBoard />
                            </el-icon>
                            浏览数据
                        </el-button>
                        <el-button @click="goToMappingRelations" style="width: 100%;">
                            <el-icon>
                                <Connection />
                            </el-icon>
                            查看映射
                        </el-button>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="16">
                <el-card class="system-info">
                    <template #header>
                        <div class="card-header">
                            <span>系统信息</span>
                            <el-button type="primary" text @click="refreshSystemInfo">刷新</el-button>
                        </div>
                    </template>
                    <div class="info-list">
                        <div class="info-item">
                            <span class="info-label">后端服务:</span>
                            <span class="info-value">{{ backendStatus }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">API版本:</span>
                            <span class="info-value">v1.0.0</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">前端版本:</span>
                            <span class="info-value">v1.0.0</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">最后检查:</span>
                            <span class="info-value">{{ lastCheckTime }}</span>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 部署信息 -->
        <el-row :gutter="20" style="margin-top: 20px;">
            <el-col :span="12">
                <el-card class="deployment-info">
                    <template #header>
                        <div class="card-header">
                            <span>部署信息</span>
                            <el-button type="primary" text @click="refreshSystemInfo">刷新</el-button>
                        </div>
                    </template>
                    <div class="info-list">
                        <div class="info-item">
                            <span class="info-label">部署模式:</span>
                            <span class="info-value">{{ systemInfo?.deployment?.mode || '-' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">数据库类型:</span>
                            <span class="info-value">{{ systemInfo?.database?.type || '-' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">数据库状态:</span>
                            <el-tag :type="getStatusTagType(systemInfo?.database?.status)">
                                {{ systemInfo?.database?.status || '未知' }}
                            </el-tag>
                        </div>
                        <div class="info-item">
                            <span class="info-label">数据表数量:</span>
                            <span class="info-value">{{ systemInfo?.database?.tableCount || 0 }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">总记录数:</span>
                            <span class="info-value">{{ systemInfo?.database?.totalRecords || 0 }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">环境:</span>
                            <el-tag :type="getEnvironmentTagType(systemInfo?.system?.environment)">
                                {{ systemInfo?.system?.environment || '-' }}
                            </el-tag>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="12">
                <el-card class="services-info">
                    <template #header>
                        <div class="card-header">
                            <span>服务状态</span>
                            <el-button type="primary" text @click="refreshSystemInfo">刷新</el-button>
                        </div>
                    </template>
                    <div class="info-list">
                        <div class="info-item">
                            <span class="info-label">后端服务:</span>
                            <div class="service-status">
                                <el-tag :type="getStatusTagType(systemInfo?.services?.backend?.status)">
                                    {{ systemInfo?.services?.backend?.status || '未知' }}
                                </el-tag>
                                <span class="service-port">端口: {{ systemInfo?.services?.backend?.port || '-' }}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-label">前端服务:</span>
                            <div class="service-status">
                                <el-tag :type="getStatusTagType(systemInfo?.services?.frontend?.status)">
                                    {{ systemInfo?.services?.frontend?.status || '未知' }}
                                </el-tag>
                                <span class="service-port">端口: {{ systemInfo?.services?.frontend?.port || '-' }}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-label">MCP服务器:</span>
                            <div class="service-status">
                                <el-tag :type="getStatusTagType(systemInfo?.services?.mcpServer?.status)">
                                    {{ systemInfo?.services?.mcpServer?.status || '未知' }}
                                </el-tag>
                                <span class="service-port">端口: {{ systemInfo?.services?.mcpServer?.port || '-' }}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-label">系统运行时间:</span>
                            <span class="info-value">{{ formatUptime(systemInfo?.system?.uptime) }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Node.js版本:</span>
                            <span class="info-value">{{ systemInfo?.system?.nodeVersion || '-' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">平台:</span>
                            <span class="info-value">{{ systemInfo?.system?.platform || '-' }}</span>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFilesStore } from '@/stores/files'
import { apiService, type SystemInfo } from '@/services/api'
import {
    Folder,
    DataBoard,
    Check,
    Clock,
    Upload,
    Connection,
    Monitor,
    DataAnalysis,
    Setting
} from '@element-plus/icons-vue'

const router = useRouter()
const filesStore = useFilesStore()

// 状态
const loading = ref(false)
const fileCount = ref(0)
const totalRecords = ref(0)
const systemStatus = ref('正常')
const lastUpdate = ref('-')
const recentFiles = ref<any[]>([])
const backendStatus = ref('检查中...')
const lastCheckTime = ref('-')
const systemInfo = ref<SystemInfo | null>(null)

// 初始化数据
const initData = async () => {
    loading.value = true
    try {
        // 获取文件列表
        await filesStore.fetchMappings()
        fileCount.value = filesStore.fileList.length
        totalRecords.value = filesStore.fileList.reduce((sum, file) => sum + file.recordCount, 0)
        recentFiles.value = filesStore.fileList.slice(0, 5)

        // 检查后端服务状态
        await checkBackendStatus()

        // 更新最后更新时间
        if (filesStore.fileList.length > 0) {
            const latestFile = filesStore.fileList[0]
            lastUpdate.value = new Date(latestFile.createdAt).toLocaleString()
        }
    } catch (error) {
        console.error('初始化数据失败:', error)
    } finally {
        loading.value = false
    }
}

// 检查后端服务状态
const checkBackendStatus = async () => {
    try {
        const response = await apiService.healthCheck()
        backendStatus.value = '正常'
        systemStatus.value = '正常'
    } catch (error) {
        backendStatus.value = '异常'
        systemStatus.value = '异常'
    }
    lastCheckTime.value = new Date().toLocaleString()
}

// 查看数据
const viewData = (file: any) => {
    router.push({ name: 'DataBrowser', query: { hash: file.hash } })
}

// 导航到文件管理
const goToFileManagement = () => {
    router.push('/files')
}

// 导航到数据浏览
const goToDataBrowser = () => {
    router.push('/data')
}

// 导航到映射关系
const goToMappingRelations = () => {
    router.push('/mappings')
}

// 刷新系统信息
const refreshSystemInfo = async () => {
    try {
        const info = await apiService.getSystemInfo()
        systemInfo.value = info

        // 更新系统状态
        if (info.database.status === 'connected' && info.services.backend.status === 'running') {
            systemStatus.value = '正常'
        } else {
            systemStatus.value = '异常'
        }

        lastCheckTime.value = new Date().toLocaleString()
    } catch (error) {
        console.error('获取系统信息失败:', error)
        systemStatus.value = '异常'
    }
}

// 获取状态标签类型
const getStatusTagType = (status: string | undefined): string => {
    switch (status) {
        case 'connected':
        case 'running':
            return 'success'
        case 'disconnected':
        case 'stopped':
            return 'danger'
        default:
            return 'info'
    }
}

// 获取环境标签类型
const getEnvironmentTagType = (environment: string | undefined): string => {
    switch (environment) {
        case 'production':
            return 'danger'
        case 'development':
            return 'warning'
        case 'testing':
            return 'info'
        default:
            return 'info'
    }
}

// 格式化运行时间
const formatUptime = (uptime: number | undefined): string => {
    if (!uptime) return '-'

    const hours = Math.floor(uptime / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const seconds = uptime % 60

    if (hours > 0) {
        return `${hours}小时 ${minutes}分钟 ${seconds}秒`
    } else if (minutes > 0) {
        return `${minutes}分钟 ${seconds}秒`
    } else {
        return `${seconds}秒`
    }
}

onMounted(() => {
    initData()
    refreshSystemInfo()
})
</script>

<style scoped>
.dashboard {
    padding: 0;
}

.stat-card {
    margin-bottom: 0;
}

.stat-content {
    display: flex;
    align-items: center;
}

.stat-icon {
    font-size: 48px;
    color: #409EFF;
    margin-right: 20px;
}

.stat-info {
    flex: 1;
}

.stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #303133;
}

.stat-label {
    font-size: 14px;
    color: #909399;
    margin-top: 5px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.recent-files {
    min-height: 300px;
}

.quick-action {
    min-height: 200px;
}

.action-buttons {
    display: flex;
    flex-direction: column;
}

.system-info {
    min-height: 200px;
}

.info-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
}

.info-label {
    color: #606266;
    font-weight: 500;
}

.info-value {
    color: #303133;
}

.deployment-info,
.services-info {
    min-height: 300px;
}

.service-status {
    display: flex;
    align-items: center;
    gap: 10px;
}

.service-port {
    font-size: 12px;
    color: #909399;
}
</style>
