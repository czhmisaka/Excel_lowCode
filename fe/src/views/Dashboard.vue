<template>
    <div class="dashboard fade-in-up">
        <!-- 统计卡片 - 签到系统数据概览 -->
        <el-row :gutter="16">
            <el-col :span="4">
                <div class="compact-stat-card company-stat">
                    <div class="compact-stat-background">
                        <div class="icon-matrix">
                            <div class="icon-row" v-for="row in 4" :key="row">
                                <div class="icon-item" v-for="col in 4" :key="col">
                                    <el-icon>
                                        <OfficeBuilding />
                                    </el-icon>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="compact-stat-content">
                        <div class="compact-stat-info">
                            <div class="stat-value-container">
                                <div v-if="loading" class="skeleton skeleton-value"></div>
                                <div v-else class="compact-stat-value">{{ companyCount }}</div>
                            </div>
                            <div v-if="loading" class="skeleton skeleton-label"></div>
                            <div v-else class="compact-stat-label">公司总数</div>
                        </div>
                    </div>
                </div>
            </el-col>

            <el-col :span="4">
                <div class="compact-stat-card user-stat">
                    <div class="compact-stat-background">
                        <div class="icon-matrix">
                            <div class="icon-row" v-for="row in 4" :key="row">
                                <div class="icon-item" v-for="col in 4" :key="col">
                                    <el-icon>
                                        <User />
                                    </el-icon>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="compact-stat-content">
                        <div class="compact-stat-info">
                            <div class="stat-value-container">
                                <div v-if="loading" class="skeleton skeleton-value"></div>
                                <div v-else class="compact-stat-value">{{ userCount }}</div>
                            </div>
                            <div v-if="loading" class="skeleton skeleton-label"></div>
                            <div v-else class="compact-stat-label">用户总数</div>
                        </div>
                    </div>
                </div>
            </el-col>

            <el-col :span="4">
                <div class="compact-stat-card checkin-stat">
                    <div class="compact-stat-background">
                        <div class="icon-matrix">
                            <div class="icon-row" v-for="row in 4" :key="row">
                                <div class="icon-item" v-for="col in 4" :key="col">
                                    <el-icon>
                                        <Check />
                                    </el-icon>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="compact-stat-content">
                        <div class="compact-stat-info">
                            <div class="stat-value-container">
                                <div v-if="loading" class="skeleton skeleton-value"></div>
                                <div v-else class="compact-stat-value">{{ todayCheckinCount }}</div>
                            </div>
                            <div v-if="loading" class="skeleton skeleton-label"></div>
                            <div v-else class="compact-stat-label">今日签到</div>
                        </div>
                    </div>
                </div>
            </el-col>

            <el-col :span="4">
                <div class="compact-stat-card checkout-stat">
                    <div class="compact-stat-background">
                        <div class="icon-matrix">
                            <div class="icon-row" v-for="row in 4" :key="row">
                                <div class="icon-item" v-for="col in 4" :key="col">
                                    <el-icon>
                                        <SwitchButton />
                                    </el-icon>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="compact-stat-content">
                        <div class="compact-stat-info">
                            <div class="stat-value-container">
                                <div v-if="loading" class="skeleton skeleton-value"></div>
                                <div v-else class="compact-stat-value">{{ todayCheckoutCount }}</div>
                            </div>
                            <div v-if="loading" class="skeleton skeleton-label"></div>
                            <div v-else class="compact-stat-label">今日签退</div>
                        </div>
                    </div>
                </div>
            </el-col>

            <el-col :span="4">
                <div class="compact-stat-card active-stat">
                    <div class="compact-stat-background">
                        <div class="icon-matrix">
                            <div class="icon-row" v-for="row in 4" :key="row">
                                <div class="icon-item" v-for="col in 4" :key="col">
                                    <el-icon>
                                        <UserFilled />
                                    </el-icon>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="compact-stat-content">
                        <div class="compact-stat-info">
                            <div class="stat-value-container">
                                <div v-if="loading" class="skeleton skeleton-value"></div>
                                <div v-else class="compact-stat-value">{{ activeUserCount }}</div>
                            </div>
                            <div v-if="loading" class="skeleton skeleton-label"></div>
                            <div v-else class="compact-stat-label">活跃用户</div>
                        </div>
                    </div>
                </div>
            </el-col>

            <el-col :span="4">
                <div class="compact-stat-card duration-stat">
                    <div class="compact-stat-background">
                        <div class="icon-matrix">
                            <div class="icon-row" v-for="row in 4" :key="row">
                                <div class="icon-item" v-for="col in 4" :key="col">
                                    <el-icon>
                                        <Clock />
                                    </el-icon>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="compact-stat-content">
                        <div class="compact-stat-info">
                            <div class="stat-value-container">
                                <div v-if="loading" class="skeleton skeleton-value"></div>
                                <div v-else class="compact-stat-value">{{ avgWorkDuration }}</div>
                            </div>
                            <div v-if="loading" class="skeleton skeleton-label"></div>
                            <div v-else class="compact-stat-label">平均工时(小时)</div>
                        </div>
                    </div>
                </div>
            </el-col>
        </el-row>

        <!-- 今日签到时间分布柱状图 -->
        <div class="modern-card" style="margin-top: 20px;">
            <div class="modern-card-header">
                <span>今日签到时间分布</span>
                <el-button type="primary" text @click="refreshCheckinData" class="modern-button">刷新数据</el-button>
            </div>
            <div class="chart-container">
                <div v-if="loading" class="chart-skeleton">
                    <div class="skeleton skeleton-chart"></div>
                </div>
                <div v-else class="time-distribution-chart">
                    <div class="chart-bars">
                        <div v-for="(count, hour) in checkinTimeDistribution" :key="hour" class="chart-bar-container">
                            <div class="chart-bar" :style="{ height: getBarHeight(count) + 'px' }">
                                <div class="bar-value">{{ count }}</div>
                            </div>
                            <div class="chart-label">{{ hour }}:00</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 最近签到记录和系统状态 -->
        <el-row :gutter="16" style="margin-top: 20px;">
            <el-col :span="12">
                <div class="compact-card">
                    <div class="compact-card-header">
                        <span>最近签到记录</span>
                        <el-button type="primary" text @click="goToCheckinRecords" class="compact-button">查看全部</el-button>
                    </div>
                    <div class="recent-checkin-records">
                        <div v-if="recentCheckinRecords.length === 0" class="no-records">
                            <el-empty description="暂无签到记录" :image-size="60" />
                        </div>
                        <div v-else class="checkin-list">
                            <div v-for="record in recentCheckinRecords" :key="record.id" class="checkin-item">
                                <div class="checkin-icon">
                                    <el-icon>
                                        <Check />
                                    </el-icon>
                                </div>
                                <div class="checkin-content">
                                    <div class="checkin-title">
                                        <span class="user-name">{{ record.realName || record.real_name || record.user?.realName || record.user?.username || '未知用户' }}</span>
                                        <span class="company-name">{{ record.company?.name || '未知公司' }}</span>
                                    </div>
                                    <div class="checkin-meta">
                                        <span class="checkin-time">{{ formatCheckinTime(record.checkinTime) }}</span>
                                        <span class="checkin-type">{{ record.checkinType === 'checkin' ? '签到' : '签退' }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </el-col>

            <el-col :span="12">
                <div class="compact-card">
                    <div class="compact-card-header">
                        <span>系统状态概览</span>
                        <div class="refresh-controls">
                            <el-button 
                                type="primary" 
                                text 
                                @click="refreshSystemInfo" 
                                class="compact-button"
                                :loading="isAutoRefreshing"
                            >
                                {{ isAutoRefreshing ? '刷新中...' : '手动刷新' }}
                            </el-button>
                        </div>
                    </div>
                    <div class="compact-info-grid">
                        <div class="compact-info-item">
                            <span class="compact-info-label">后端服务</span>
                            <div class="compact-info-value">
                                <el-tag :type="getStatusTagType(systemInfo?.services?.backend?.status)" size="small">
                                    {{ systemInfo?.services?.backend?.status || '未知' }}
                                </el-tag>
                                <span class="compact-info-desc">端口: {{ systemInfo?.services?.backend?.port || '-'
                                }}</span>
                            </div>
                        </div>
                        <div class="compact-info-item">
                            <span class="compact-info-label">前端服务</span>
                            <div class="compact-info-value">
                                <el-tag :type="getStatusTagType(systemInfo?.services?.frontend?.status)" size="small">
                                    {{ systemInfo?.services?.frontend?.status || '未知' }}
                                </el-tag>
                                <span class="compact-info-desc">端口: {{ systemInfo?.services?.frontend?.port || '-'
                                }}</span>
                            </div>
                        </div>
                        <div class="compact-info-item">
                            <span class="compact-info-label">数据库</span>
                            <div class="compact-info-value">
                                <el-tag :type="getStatusTagType(systemInfo?.database?.status)" size="small">
                                    {{ systemInfo?.database?.status || '未知' }}
                                </el-tag>
                                <span class="compact-info-desc">{{ systemInfo?.database?.type || '-' }}</span>
                            </div>
                        </div>
                        <div class="compact-info-item">
                            <span class="compact-info-label">MCP服务</span>
                            <div class="compact-info-value">
                                <el-tag :type="getStatusTagType(systemInfo?.services?.mcpServer?.status)" size="small">
                                    {{ systemInfo?.services?.mcpServer?.status || '未知' }}
                                </el-tag>
                                <span class="compact-info-desc">端口: {{ systemInfo?.services?.mcpServer?.port || '-'
                                }}</span>
                            </div>
                        </div>
                        <div class="compact-info-item">
                            <span class="compact-info-label">运行时间 & 数据库</span>
                            <div class="compact-info-value">
                                <span class="compact-info-main">{{ formatUptime(systemInfo?.system?.uptime) }}</span>
                                <span class="compact-info-desc">{{ formatBytes(systemInfo?.database?.size) }} | {{ systemInfo?.database?.tableCount || 0 }} 个表</span>
                            </div>
                        </div>
                        <div class="compact-info-item">
                            <span class="compact-info-label">请求频率</span>
                            <div class="compact-info-value">
                                <span class="compact-info-main">{{ systemInfo?.system?.requestsPerMinute || 0 }} 次/分钟</span>
                                <span class="compact-info-desc">
                                    当前负载
                                    <span v-if="lastRefreshTime" class="refresh-info">
                                        | 更新时间: {{ lastRefreshTime }} | 耗时: {{ apiResponseTime }}ms
                                    </span>
                                </span>
                            </div>
                        </div>
                        <div class="compact-info-item">
                            <span class="compact-info-label">环境</span>
                            <div class="compact-info-value">
                                <el-tag :type="getEnvironmentTagType(systemInfo?.system?.environment)" size="small">
                                    {{ systemInfo?.system?.environment || '-' }}
                                </el-tag>
                            </div>
                        </div>
                    </div>
                </div>
            </el-col>
        </el-row>

        <!-- 最近操作记录 -->
        <div class="compact-card" style="margin-top: 20px;">
            <div class="compact-card-header">
                <span>最近操作记录</span>
                <div class="operation-controls">
                    <el-select v-model="selectedTable" placeholder="选择表" size="small"
                        style="width: 150px; margin-right: 12px;" @change="loadRecentOperations">
                        <el-option v-for="table in availableTables" :key="table" :label="table" :value="table" />
                    </el-select>
                    <el-button type="primary" text @click="goToLogManagement" class="compact-button">查看全部</el-button>
                </div>
            </div>
            <div class="recent-operations">
                <div v-if="recentOperations.length === 0" class="no-operations">
                    <el-empty description="暂无操作记录" :image-size="60" />
                </div>
                <div v-else class="operations-list">
                    <div v-for="operation in recentOperations" :key="operation.id" class="operation-item-wrapper">
                        <div class="operation-item" :class="{ 'expanded': expandedOperations.includes(operation.id) }"
                            @click="toggleOperationDetails(operation.id)">
                            <div class="operation-icon" :data-type="operation.operationType">
                                <el-icon
                                    v-if="operation.operationType === 'INSERT' || operation.operationType === 'create'">
                                    <Plus />
                                </el-icon>
                                <el-icon
                                    v-else-if="operation.operationType === 'UPDATE' || operation.operationType === 'update'">
                                    <Edit />
                                </el-icon>
                                <el-icon
                                    v-else-if="operation.operationType === 'DELETE' || operation.operationType === 'delete'">
                                    <Delete />
                                </el-icon>
                                <el-icon v-else>
                                    <Document />
                                </el-icon>
                            </div>
                            <div class="operation-content">
                                <div class="operation-title">
                                    {{ getOperationTypeText(operation.operationType) }}
                                    <span class="operation-table">{{ operation.tableName }}</span>
                                    <span class="operation-record-id">#{{ operation.recordId }}</span>
                                </div>
                                <div class="operation-meta">
                                    <span class="operation-user">{{ operation.username || '系统' }}</span>
                                    <span class="operation-time">{{ formatOperationTime(operation.operationTime ||
                                        operation.createdAt) }}</span>
                                </div>
                                <div class="operation-description" v-if="operation.description">
                                    {{ operation.description }}
                                </div>
                                <div class="operation-data-summary" v-if="showDataSummary(operation)">
                                    {{ getDataSummary(operation) }}
                                </div>

                                <!-- 展开的详细信息 - 内嵌在操作项内 -->
                                <div v-if="expandedOperations.includes(operation.id)" class="operation-details">
                                    <div class="details-section">
                                        <h4>操作详情</h4>
                                        <div class="details-grid">
                                            <div class="detail-item">
                                                <span class="detail-label">操作ID:</span>
                                                <span class="detail-value">{{ operation.id }}</span>
                                            </div>
                                            <div class="detail-item">
                                                <span class="detail-label">记录ID:</span>
                                                <span class="detail-value">{{ operation.recordId }}</span>
                                            </div>
                                            <div class="detail-item">
                                                <span class="detail-label">表哈希:</span>
                                                <span class="detail-value">{{ operation.tableHash }}</span>
                                            </div>
                                            <div class="detail-item">
                                                <span class="detail-label">IP地址:</span>
                                                <span class="detail-value">{{ operation.ipAddress || '未知' }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="details-section" v-if="operation.isRolledBack">
                                        <h4>回退信息</h4>
                                        <div class="details-grid">
                                            <div class="detail-item">
                                                <span class="detail-label">回退时间:</span>
                                                <span class="detail-value">{{
                                                    formatOperationTime(operation.rollbackTime)
                                                }}</span>
                                            </div>
                                            <div class="detail-item">
                                                <span class="detail-label">回退用户:</span>
                                                <span class="detail-value">{{ operation.rollbackUsername || '系统'
                                                }}</span>
                                            </div>
                                            <div class="detail-item">
                                                <span class="detail-label">回退描述:</span>
                                                <span class="detail-value">{{ operation.rollbackDescription || '无'
                                                }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="details-section" v-if="operation.userAgent">
                                        <h4>客户端信息</h4>
                                        <div class="detail-item">
                                            <span class="detail-label">用户代理:</span>
                                            <span class="detail-value">{{ operation.userAgent }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="operation-status">
                                <el-tag v-if="operation.isRolledBack" type="info" size="small">已回退</el-tag>
                                <el-tag v-else type="success" size="small">正常</el-tag>
                            </div>
                            <div class="operation-expand">
                                <el-icon :class="{ 'expanded': expandedOperations.includes(operation.id) }">
                                    <ArrowDown />
                                </el-icon>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
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
    Plus,
    Edit,
    Delete,
    Document,
    ArrowUp,
    ArrowDown,
    OfficeBuilding,
    User,
    SwitchButton,
    UserFilled
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
const recentOperations = ref<any[]>([])
const selectedTable = ref('')
const availableTables = ref<string[]>([])
const expandedOperations = ref<number[]>([])

// 签到系统状态
const companyCount = ref(0)
const userCount = ref(0)
const todayCheckinCount = ref(0)
const todayCheckoutCount = ref(0)
const activeUserCount = ref(0)
const avgWorkDuration = ref('0.0')
const checkinTimeDistribution = ref<number[]>(new Array(24).fill(0))
const recentCheckinRecords = ref<any[]>([])

// 自动刷新相关状态
const autoRefreshTimer = ref<NodeJS.Timeout | null>(null)
const isAutoRefreshing = ref(false)
const lastRefreshTime = ref<string>('')
const apiResponseTime = ref<number>(0)

// 初始化数据
const initData = async () => {
    loading.value = true
    try {
        // 获取签到系统数据
        await refreshCheckinData()
        
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

// 刷新签到数据
const refreshCheckinData = async () => {
    try {
        // 获取公司列表 - 只获取有效的公司
        const companiesResponse = await apiService.getCompanies({ 
            limit: 1000,
            isActive: true 
        })
        console.log('公司API响应:', companiesResponse)
        companyCount.value = companiesResponse.data?.length || companiesResponse.data?.total || 0

        // 获取用户列表 - 只获取有效的用户
        const usersResponse = await apiService.getUsers({ 
            limit: 1000,
            isActive: true 
        })
        console.log('用户API响应:', usersResponse)
        userCount.value = usersResponse.data?.length || usersResponse.data?.total || 0

        // 获取今日签到记录（用于统计）- 使用本地时间
        const today = new Date()
        
        // 创建本地时间的今日开始和结束
        const startDateLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
        const endDateLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
        
        // 手动构建本地时间的ISO字符串（避免toISOString的UTC转换）
        const formatLocalISO = (date: Date) => {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            const seconds = String(date.getSeconds()).padStart(2, '0')
            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`
        }
        
        const startDate = formatLocalISO(startDateLocal)
        const endDate = formatLocalISO(endDateLocal)
        
        console.log('今日时间范围:', startDate, '到', endDate)
        console.log('本地时间:', startDateLocal.toLocaleString(), '到', endDateLocal.toLocaleString())
        
        const todayCheckinResponse = await apiService.getCheckinRecords({
            startDate,
            endDate,
            limit: 1000
        })
        
        console.log('今日签到API响应:', todayCheckinResponse)
        // 获取今日签到记录 - 根据接口返回结构，数据直接是 response.data
        let todayRecords = todayCheckinResponse.data || []
        console.log('今日签到API完整响应:', todayCheckinResponse)
        console.log('今日签到记录数量:', todayRecords.length)
        console.log('今日签到记录详情:', todayRecords)
        
        // 调试：检查数据解析是否正确
        if (todayCheckinResponse.data && Array.isArray(todayCheckinResponse.data)) {
          console.log('数据直接是数组:', todayCheckinResponse.data)
        } else if (todayCheckinResponse.data && todayCheckinResponse.data.data) {
          console.log('数据在data.data中:', todayCheckinResponse.data.data)
          // 如果数据在data.data中，重新赋值
          todayRecords = todayCheckinResponse.data.data
        }
        
        // 计算今日签到数据 - 只统计有效的签到记录
        todayCheckinCount.value = todayRecords.filter((record: any) => 
            record.checkinType === 'checkin' && record.isActive !== false
        ).length
        todayCheckoutCount.value = todayRecords.filter((record: any) => 
            record.checkinType === 'checkout' && record.isActive !== false
        ).length
        
        // 计算活跃用户数 - 基于手机号去重
        const activePhones = new Set(todayRecords
            .filter((record: any) => record.isActive !== false)
            .map((record: any) => record.phone)
        )
        activeUserCount.value = activePhones.size
        
        // 计算平均工作时长 - 只计算有效的已完成记录
        const completedRecords = todayRecords.filter((record: any) => 
            record.workDuration && record.isActive !== false
        )
        if (completedRecords.length > 0) {
            const totalDuration = completedRecords.reduce((sum: number, record: any) => sum + record.workDuration, 0)
            avgWorkDuration.value = (totalDuration / completedRecords.length / 60).toFixed(1)
        } else {
            avgWorkDuration.value = '0.0'
        }
        
        // 计算时间分布 - 只统计有效的签到记录
        const distribution = new Array(24).fill(0)
        console.log('开始计算时间分布，今日记录数量:', todayRecords.length)
        
        todayRecords.forEach((record: any) => {
            if (record.checkinType === 'checkin' && record.isActive !== false) {
                try {
                    const checkinTime = new Date(record.checkinTime)
                    // 使用本地时间的小时数，而不是UTC时间
                    const hour = checkinTime.getHours()
                    console.log(`记录ID: ${record.id}, 签到时间: ${record.checkinTime}, 本地小时: ${hour}`)
                    distribution[hour]++
                } catch (error) {
                    console.error('处理签到时间错误:', error, record)
                }
            }
        })
        
        console.log('时间分布计算结果:', distribution)
        checkinTimeDistribution.value = distribution
        
        // 获取最近签到记录（所有记录，不限制日期）- 后端已经过滤了无效公司和记录
        const recentCheckinResponse = await apiService.getCheckinRecords({
            limit: 5
        })
        
        console.log('最近签到API响应:', recentCheckinResponse)
        // 获取最近签到记录 - 根据接口返回结构，数据直接是 response.data
        let recentRecords = recentCheckinResponse.data || []
        console.log('最近签到记录数量:', recentRecords.length)
        
        // 调试：检查数据解析是否正确
        if (recentCheckinResponse.data && Array.isArray(recentCheckinResponse.data)) {
          console.log('最近数据直接是数组:', recentCheckinResponse.data)
        } else if (recentCheckinResponse.data && recentCheckinResponse.data.data) {
          console.log('最近数据在data.data中:', recentCheckinResponse.data.data)
          // 如果数据在data.data中，重新赋值
          recentRecords = recentCheckinResponse.data.data
        }
        
        recentCheckinRecords.value = recentRecords
        
    } catch (error) {
        console.error('刷新签到数据失败:', error)
    }
}

// 获取柱状图高度
const getBarHeight = (count: number): number => {
    const maxCount = Math.max(...checkinTimeDistribution.value)
    if (maxCount === 0) return 0
    return (count / maxCount) * 120 // 最大高度120px
}

// 格式化签到时间
const formatCheckinTime = (time: string): string => {
    if (!time) return '-'
    const date = new Date(time)
    return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    })
}

// 导航到签到记录页面
const goToCheckinRecords = () => {
    router.push('/checkin-records')
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

// 刷新系统信息（带耗时统计）
const refreshSystemInfo = async () => {
    const startTime = Date.now()
    isAutoRefreshing.value = true
    
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
        
        // 计算接口响应时间
        const endTime = Date.now()
        apiResponseTime.value = endTime - startTime
        lastRefreshTime.value = new Date().toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        })
    } catch (error) {
        console.error('获取系统信息失败:', error)
        systemStatus.value = '异常'
        apiResponseTime.value = 0
    } finally {
        isAutoRefreshing.value = false
    }
}

// 启动自动刷新
const startAutoRefresh = () => {
    // 先立即刷新一次
    refreshSystemInfo()
    refreshCheckinData()
    
    // 然后每5秒刷新一次
    autoRefreshTimer.value = setInterval(() => {
        refreshSystemInfo()
        refreshCheckinData()
    }, 5000)
}

// 停止自动刷新
const stopAutoRefresh = () => {
    if (autoRefreshTimer.value) {
        clearInterval(autoRefreshTimer.value)
        autoRefreshTimer.value = null
    }
}

// 切换自动刷新状态
const toggleAutoRefresh = () => {
    if (isAutoRefreshing.value) {
        stopAutoRefresh()
    } else {
        startAutoRefresh()
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

// 格式化字节大小
const formatBytes = (bytes: number | undefined): string => {
    if (!bytes || bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 导航到日志管理
const goToLogManagement = () => {
    router.push('/logs')
}

// 获取操作类型文本
const getOperationTypeText = (operationType: string): string => {
    switch (operationType) {
        case 'INSERT':
            return '新增数据'
        case 'UPDATE':
            return '更新数据'
        case 'DELETE':
            return '删除数据'
        default:
            return '其他操作'
    }
}

// 格式化操作时间
const formatOperationTime = (time: string): string => {
    if (!time) return '-'
    const date = new Date(time)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // 如果是今天，显示时间
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }

    // 如果是昨天，显示"昨天"
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
        return '昨天'
    }

    // 其他情况显示日期
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

// 获取可用表列表
const loadAvailableTables = async () => {
    try {
        const mappings = await apiService.getMappings()
        availableTables.value = mappings.map(mapping => mapping.tableName).filter(Boolean)
    } catch (error) {
        console.error('加载表列表失败:', error)
        availableTables.value = []
    }
}

// 加载最近操作记录
const loadRecentOperations = async () => {
    try {
        const params: any = {
            page: 1,
            limit: 5
        }

        // 如果选择了特定表，添加表名筛选
        if (selectedTable.value) {
            params.tableName = selectedTable.value
        }

        const response = await apiService.getLogs(params)
        if (response.success && response.data) {
            // 根据用户提供的curl响应，数据在response.data.logs中
            recentOperations.value = response.data.logs || []
        }
    } catch (error) {
        console.error('加载操作记录失败:', error)
        recentOperations.value = []
    }
}

// 初始化时设置默认表
const initDefaultTable = async () => {
    await loadAvailableTables()
    if (availableTables.value.length > 0) {
        selectedTable.value = availableTables.value[0]
        await loadRecentOperations()
    }
}

// 切换操作详情展开/收起
const toggleOperationDetails = (operationId: number) => {
    const index = expandedOperations.value.indexOf(operationId)
    if (index > -1) {
        expandedOperations.value.splice(index, 1)
    } else {
        expandedOperations.value.push(operationId)
    }
}

// 判断是否显示数据摘要
const showDataSummary = (operation: any): boolean => {
    return operation.oldData || operation.newData
}

// 获取数据变更摘要
const getDataSummary = (operation: any): string => {
    const operationType = operation.operationType?.toLowerCase()

    if (operationType === 'create' || operationType === 'insert') {
        if (operation.newData) {
            try {
                const data = JSON.parse(operation.newData)
                const fieldCount = Object.keys(data).length
                return `新增了 ${fieldCount} 个字段的数据`
            } catch {
                return '新增数据'
            }
        }
        return '新增数据'
    } else if (operationType === 'update') {
        if (operation.oldData && operation.newData) {
            try {
                const oldData = JSON.parse(operation.oldData)
                const newData = JSON.parse(operation.newData)
                const changedFields = Object.keys(newData).filter(key =>
                    JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])
                )
                return `更新了 ${changedFields.length} 个字段`
            } catch {
                return '更新数据'
            }
        }
        return '更新数据'
    } else if (operationType === 'delete') {
        if (operation.oldData) {
            try {
                const data = JSON.parse(operation.oldData)
                const fieldCount = Object.keys(data).length
                return `删除了 ${fieldCount} 个字段的数据`
            } catch {
                return '删除数据'
            }
        }
        return '删除数据'
    }

    return '数据操作'
}

onMounted(() => {
    initData()
    refreshSystemInfo()
    initDefaultTable()
    startAutoRefresh()
})

// 组件销毁时清理定时器
onUnmounted(() => {
    stopAutoRefresh()
})
</script>

<style scoped>
.dashboard {
    padding: 0;
}

/* 紧凑统计卡片样式 */
.compact-stat-card {
    border-radius: 12px;
    padding: 12px;
    color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
    cursor: pointer;
    height: 100%;
    min-height: 120px;
    position: relative;
    overflow: hidden;
}

.compact-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 背景图标矩阵 */
.compact-stat-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    opacity: 0.15;
    pointer-events: none;
}

.icon-matrix {
    display: grid;
    grid-template-rows: repeat(4, 1fr);
    gap: 8px;
    height: 100%;
    transform: rotate(-5deg);
    transform-origin: center;
}

.icon-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
}

.icon-item {
    display: flex;
    align-items: center;
    justify-content: center;
}

.icon-item .el-icon {
    font-size: 40px;
    color: rgba(255, 255, 255, 0.7);
    transition: all 0.3s ease;
}

.compact-stat-card:hover .icon-item .el-icon {
    transform: scale(1.1);
    color: rgba(255, 255, 255, 0.9);
}

.compact-stat-content {
    display: flex;
    align-items: center;
    height: 100%;
    position: relative;
    z-index: 2;
}

.compact-stat-icon {
    font-size: 24px;
    margin-right: 12px;
    opacity: 0.9;
    flex-shrink: 0;
}

.compact-stat-info {
    flex: 1;
}

.compact-stat-value {
    font-size: 44px;
    font-weight: bold;
    margin-bottom: 2px;
    line-height: 1.2;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.compact-stat-label {
    font-size: 12px;
    opacity: 0.9;
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 不同统计卡片的配色 */
.file-stat {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.record-stat {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.status-stat {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.update-stat {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

/* 状态指示器 */
.status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-left: 8px;
    display: inline-block;
}

.status-normal {
    background-color: #52c41a;
}

.status-warning {
    background-color: #faad14;
}

.status-error {
    background-color: #ff4d4f;
}

/* 紧凑卡片样式 */
.compact-card {
    background: white;
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border: 1px solid #f5f5f5;
    transition: all 0.3s ease;
    height: 100%;
}

.compact-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
}

.compact-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    min-height: 24px;
}

.compact-card-header span {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    line-height: 1.2;
}

.operation-controls {
    display: flex;
    align-items: center;
}

.refresh-controls {
    display: flex;
    align-items: center;
    gap: 8px;
}

.refresh-info {
    color: #409eff;
    font-size: 9px;
    font-weight: 500;
}

.compact-action-buttons {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.compact-button {
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.2s ease;
    border: none;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    font-size: 13px;
    padding: 6px 12px;
}

.compact-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.compact-button:active {
    transform: translateY(0);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* 增强卡片悬停效果 */
.compact-card:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modern-card:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 紧凑信息网格 */
.compact-info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
}

.compact-info-item {
    display: flex;
    flex-direction: column;
    padding: 6px;
    border-radius: 6px;
    background: #fafafa;
    transition: all 0.2s ease;
}

.compact-info-item:hover {
    background: #f5f5f5;
    transform: translateY(-1px);
}

.compact-info-label {
    font-size: 11px;
    color: #909399;
    font-weight: 500;
    margin-bottom: 2px;
}

.compact-info-value {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.compact-info-main {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
}

.compact-info-desc {
    font-size: 10px;
    color: #8c8c8c;
}

/* 现代化卡片样式 */
.modern-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #f0f0f0;
}

.modern-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #f0f0f0;
}

.modern-card-header span {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.action-buttons {
    display: flex;
    flex-direction: column;
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

.service-status {
    display: flex;
    align-items: center;
    gap: 10px;
}

.service-port {
    font-size: 12px;
    color: #909399;
}

/* 最近操作记录样式 */
.recent-operations {
    min-height: 160px;
}

.no-operations {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 160px;
}

.operations-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.operation-item-wrapper {
    display: flex;
    flex-direction: column;
}

.operation-item {
    display: flex;
    align-items: center;
    padding: 8px;
    border-radius: 6px;
    background: #fafafa;
    transition: all 0.2s ease;
    border: 1px solid #f0f0f0;
    cursor: pointer;
}

.operation-item.expanded {
    align-items: flex-start;
    padding-bottom: 0;
}

.operation-item:hover {
    background: #f5f5f5;
    transform: translateY(-1px);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.operation-item.expanded:hover {
    transform: none;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.operation-item:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.operation-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
    flex-shrink: 0;
}

.operation-icon .el-icon {
    font-size: 14px;
    color: white;
}

.operation-icon[data-type="INSERT"] {
    background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
}

.operation-icon[data-type="UPDATE"] {
    background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
}

.operation-icon[data-type="DELETE"] {
    background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
}

.operation-icon[data-type="OTHER"] {
    background: linear-gradient(135deg, #722ed1 0%, #9254de 100%);
}

.operation-content {
    flex: 1;
    min-width: 0;
}

.operation-title {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.operation-table {
    font-size: 11px;
    color: #8c8c8c;
    background: #f0f0f0;
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: 500;
}

.operation-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: #8c8c8c;
}

.operation-user {
    font-weight: 500;
}

.operation-time {
    color: #bfbfbf;
}

.operation-status {
    flex-shrink: 0;
    margin-left: 8px;
}

.operation-record-id {
    font-size: 11px;
    color: #8c8c8c;
    background: #f0f0f0;
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: 500;
}

.operation-description {
    font-size: 11px;
    color: #606266;
    margin-top: 2px;
    line-height: 1.3;
}

.operation-data-summary {
    font-size: 10px;
    color: #8c8c8c;
    margin-top: 1px;
    font-style: italic;
}

.operation-expand {
    flex-shrink: 0;
    margin-left: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #8c8c8c;
}

.operation-expand:hover {
    color: #409eff;
}

.operation-expand .el-icon.expanded {
    transform: rotate(180deg);
}

.operation-details {
    margin-top: 8px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;
}

.details-section {
    margin-bottom: 12px;
}

.details-section:last-child {
    margin-bottom: 0;
}

.details-section h4 {
    font-size: 12px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid #e9ecef;
}

.details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 8px;
}

.detail-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
}

.detail-label {
    font-size: 11px;
    color: #8c8c8c;
    font-weight: 500;
    min-width: 60px;
    flex-shrink: 0;
}

.detail-value {
    font-size: 11px;
    color: #303133;
    word-break: break-all;
    flex: 1;
}

/* 趋势指示器样式 */
.stat-value-container {
    display: flex;
    align-items: flex-end;
    gap: 8px;
}

.trend-indicator {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 4px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);
    transition: all 0.3s ease;
}

.trend-indicator .el-icon {
    font-size: 10px;
}

.trend-up {
    color: #52c41a;
}

.trend-down {
    color: #ff4d4f;
}

.trend-neutral {
    color: #faad14;
}

/* 骨架屏样式 */
.skeleton {
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.2) 25%, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0.2) 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
    border-radius: 4px;
}

.skeleton-value {
    height: 44px;
    width: 80px;
    margin-bottom: 2px;
}

.skeleton-label {
    height: 12px;
    width: 40px;
}

@keyframes skeleton-loading {
    0% {
        background-position: 200% 0;
    }

    100% {
        background-position: -200% 0;
    }
}

/* 响应式设计 */
@media (max-width: 768px) {
    .compact-stat-card {
        padding: 12px;
        min-height: 80px;
    }

    .compact-stat-icon {
        font-size: 24px;
        margin-right: 12px;
    }

    .compact-stat-value {
        font-size: 18px;
    }

    .compact-stat-label {
        font-size: 12px;
    }

    /* 移动端优化图标矩阵 */
    .icon-matrix {
        gap: 4px;
        transform: rotate(-3deg);
    }

    .icon-row {
        gap: 4px;
    }

    .icon-item .el-icon {
        font-size: 24px;
    }

    .compact-info-grid {
        grid-template-columns: 1fr;
        gap: 8px;
    }

    .operation-item {
        padding: 8px;
    }

    .operation-title {
        font-size: 13px;
    }

    .operation-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }

    /* 移动端趋势指示器优化 */
    .stat-value-container {
        gap: 6px;
    }

    .trend-indicator {
        font-size: 9px;
        padding: 1px 3px;
    }

    .trend-indicator .el-icon {
        font-size: 9px;
    }
}

/* 超小屏幕优化 */
@media (max-width: 480px) {
    .compact-stat-card {
        min-height: 70px;
        padding: 8px;
    }

    .compact-stat-value {
        font-size: 16px;
    }

    .compact-stat-label {
        font-size: 11px;
    }

    .icon-matrix {
        gap: 2px;
        transform: rotate(-2deg);
    }

    .icon-row {
        gap: 2px;
    }

    .icon-item .el-icon {
        font-size: 16px;
    }

    /* 超小屏幕趋势指示器隐藏 */
    .trend-indicator {
        display: none;
    }
}

/* 柱状图样式 */
.chart-container {
    height: 200px;
    padding: 20px 0;
}

.chart-skeleton {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.skeleton-chart {
    height: 150px;
    width: 100%;
}

.time-distribution-chart {
    height: 100%;
    display: flex;
    align-items: flex-end;
}

.chart-bars {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    height: 150px;
    width: 100%;
    gap: 4px;
}

.chart-bar-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    height: 100%;
}

.chart-bar {
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    border-radius: 4px 4px 0 0;
    min-width: 20px;
    width: 80%;
    position: relative;
    transition: all 0.3s ease;
    cursor: pointer;
}

.chart-bar:hover {
    background: linear-gradient(135deg, #66b1ff 0%, #8cc5ff 100%);
    transform: scale(1.05);
}

.bar-value {
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    font-weight: 600;
    color: #409eff;
    white-space: nowrap;
}

.chart-label {
    margin-top: 8px;
    font-size: 10px;
    color: #8c8c8c;
    text-align: center;
}

/* 最近签到记录样式 */
.recent-checkin-records {
    min-height: 160px;
}

.no-records {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 160px;
}

.checkin-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.checkin-item {
    display: flex;
    align-items: center;
    padding: 8px;
    border-radius: 6px;
    background: #fafafa;
    transition: all 0.2s ease;
    border: 1px solid #f0f0f0;
}

.checkin-item:hover {
    background: #f5f5f5;
    transform: translateY(-1px);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.checkin-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
    flex-shrink: 0;
    background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
}

.checkin-icon .el-icon {
    font-size: 14px;
    color: white;
}

.checkin-content {
    flex: 1;
    min-width: 0;
}

.checkin-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 2px;
}

.user-name {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
}

.company-name {
    font-size: 11px;
    color: #8c8c8c;
    background: #f0f0f0;
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: 500;
}

.checkin-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: #8c8c8c;
}

.checkin-time {
    font-weight: 500;
}

.checkin-type {
    color: #bfbfbf;
}

/* 新统计卡片配色 */
.company-stat {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.user-stat {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.checkin-stat {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.checkout-stat {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.active-stat {
    background: linear-gradient(135deg, #faad14 0%, #ffc53d 100%);
}

.duration-stat {
    background: linear-gradient(135deg, #722ed1 0%, #9254de 100%);
}

/* 超小屏幕优化 */
@media (max-width: 480px) {
    .compact-stat-card {
        min-height: 70px;
        padding: 8px;
    }

    .compact-stat-value {
        font-size: 16px;
    }

    .compact-stat-label {
        font-size: 11px;
    }

    .icon-matrix {
        gap: 2px;
        transform: rotate(-2deg);
    }

    .icon-row {
        gap: 2px;
    }

    .icon-item .el-icon {
        font-size: 16px;
    }

    /* 移动端柱状图优化 */
    .chart-bars {
        gap: 2px;
    }

    .chart-bar {
        min-width: 12px;
    }

    .bar-value {
        font-size: 8px;
        top: -16px;
    }

    .chart-label {
        font-size: 8px;
        margin-top: 6px;
    }

    /* 移动端签到记录优化 */
    .checkin-title {
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
    }

    .checkin-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
    }
}
</style>
