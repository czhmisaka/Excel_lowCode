import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

console.log('API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
// API基础配置 - 使用相对路径通过nginx代理
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/backend'

// 创建axios实例
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
})


/**
 * 检测是否为安全整数（避免JavaScript精度问题）
 * @param {*} value - 要检测的值
 * @returns {boolean} 是否为安全整数
 */
const isSafeInteger = (value: any): boolean => {
    if (value === null || value === undefined || value === '') {
        return true
    }
    
    const num = Number(value)
    return Number.isSafeInteger(num)
}

/**
 * 处理大数字，避免精度丢失
 * @param {*} value - 原始值
 * @returns {*} 处理后的值
 */
const handleLargeNumber = (value: any): any => {
    if (value === null || value === undefined || value === '') {
        return value
    }
    
    // 如果是数字类型且超出安全整数范围，转换为字符串
    if (typeof value === 'number' && !Number.isSafeInteger(value)) {
        return value.toString()
    }
    
    // 如果是字符串，检查是否可以转换为数字且超出安全范围
    if (typeof value === 'string') {
        const trimmedValue = value.trim()
        if (trimmedValue === '') {
            return value
        }
        
        const num = Number(trimmedValue)
        if (!isNaN(num) && !Number.isSafeInteger(num)) {
            return trimmedValue // 保持原字符串，避免精度丢失
        }
    }
    
    return value
}

/**
 * 深度处理对象中的大数字
 * @param {*} obj - 要处理的对象
 * @returns {*} 处理后的对象
 */
const processLargeNumbers = (obj: any): any => {
    if (obj === null || obj === undefined) {
        return obj
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => processLargeNumbers(item))
    }
    
    if (typeof obj === 'object') {
        const processed: any = {}
        for (const [key, value] of Object.entries(obj)) {
            processed[key] = processLargeNumbers(value)
        }
        return processed
    }
    
    return handleLargeNumber(obj)
}

// 请求拦截器
apiClient.interceptors.request.use(
    (config) => {
        console.log('请求拦截器:', config.method, config.url, 'Content-Type:', config.headers['Content-Type'])
        
        // 添加认证token
        const authStore = useAuthStore()
        if (authStore.token) {
            config.headers.Authorization = `Bearer ${authStore.token}`
        }
        
        // 处理请求数据中的大数字 - 仅对JSON请求处理，避免影响FormData
        const contentType = config.headers['Content-Type']
        if (config.data && contentType === 'application/json') {
            console.log('处理JSON数据中的大数字')
            config.data = processLargeNumbers(config.data)
        } else if (config.data && typeof contentType === 'string' && contentType.includes('multipart/form-data')) {
            console.log('跳过FormData请求的大数字处理')
        }
        
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// 响应拦截器
apiClient.interceptors.response.use(
    (response) => {
        // 处理响应数据中的大数字
        if (response.data) {
            response.data = processLargeNumbers(response.data)
        }
        return response
    },
    (error) => {
        console.error('API请求错误:', error)

        // 处理认证失败
        if (error.response?.status === 401) {
            const authStore = useAuthStore()
            authStore.logout()
        }

        return Promise.reject(error)
    }
)

// Excel预览响应
export interface PreviewResponse {
    success: boolean
    message: string
    data: {
        sheetName: string
        totalRows: number
        totalColumns: number
        rows: {
            rowIndex: number
            data: string[]
        }[]
    }
}

// 动态解析响应
export interface DynamicParseResponse {
    success: boolean
    message: string
    data: {
        sheetName: string
        headers: string[]
        originalHeaders: string[]
        columnDefinitions: ColumnDefinition[]
        dataPreview: any[]
        rowCount: number
        columnCount: number
        headerRow: number
    }
}

// 文件上传响应
export interface UploadResponse {
    success: boolean
    message: string
    data: {
        hash: string
        tableName: string
        originalFileName: string
        recordCount: number
        columnCount: number
        headerRow: number
        createdAt: string
    }
}

// 映射关系
export interface Mapping {
    id: number
    tableName: string
    hashValue: string
    originalFileName?: string
    columnCount: number
    rowCount: number
    columnDefinitions: ColumnDefinition[]
    createdAt: string
    updatedAt: string
}

// 列定义
export interface ColumnDefinition {
    name: string
    type: string
    nullable: boolean
    defaultValue?: any
}

// 数据查询参数
export interface QueryParams {
    page?: number
    limit?: number
    search?: string // JSON字符串格式的条件
}

// 数据响应
export interface DataResponse {
    success: boolean
    data: any[]
    total?: number
    pagination: {
        page: number
        limit: number
        total: number
        pages: number
    }
}

// 系统信息
export interface SystemInfo {
    system: {
        environment: string
        nodeVersion: string
        platform: string
        uptime: number
        timestamp: string
        requestsPerMinute: number
    }
    database: {
        type: string
        host: string
        port: number
        name: string
        status: string
        tableCount: number
        totalRecords: number
        size: number
        dialect: string
    }
    services: {
        backend: {
            status: string
            port: number
            version: string
        }
        frontend: {
            status: string
            port: number
            version: string
        }
        mcpServer: {
            status: string
            port: number
            version: string
        }
    }
    deployment: {
        mode: string
        composeVersion: string
        healthChecks: boolean
        volumes: string[]
    }
}

// 签到系统类型定义
export interface User {
    id: number
    username: string
    displayName?: string
    email?: string
    status: string
    createdAt: string
    updatedAt: string
}

export interface Company {
    id: number
    name: string
    code: string
    description?: string
    status: string
    checkinUrl?: string
    checkoutUrl?: string
    createdAt: string
    updatedAt: string
}

export interface CheckinRecord {
    id: number
    userId: number
    companyId: number
    checkinTime: string
    checkoutTime?: string
    workHours?: number
    status: string
    ipAddress?: string
    userAgent?: string
    createdAt: string
    updatedAt: string
    user?: User
    company?: Company
}

export interface CompanyStats {
    company: Company
    stats: {
        totalCheckins: number
        completedCheckins: number
        activeCheckins: number
        avgWorkHours: string
    }
}

// 导入规则配置
export interface ImportRules {
    deduplicationFields: string[]
    conflictStrategy: 'skip' | 'overwrite' | 'error'
    validationRules: string[]
}

// 导入响应
export interface ImportResponse {
    success: boolean
    message: string
    data: {
        successCount: number
        errorCount: number
        totalRecords: number
        matchedColumns: string[]
        missingColumns: string[]
        errors: string[]
    }
}

// API服务类
class ApiService {
    // 预览Excel文件
    async previewExcelFile(file: File): Promise<PreviewResponse> {
        const formData = new FormData()
        formData.append('file', file)

        const response = await apiClient.post('/api/upload/preview', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })

        return response.data
    }

    // 动态解析Excel文件
    async dynamicParseExcel(file: File, headerRow: number = 0): Promise<DynamicParseResponse> {
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('headerRow', headerRow.toString())

            const response = await apiClient.post('/api/upload/dynamic-parse', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 30000 // 30秒超时
            })

            return response.data
        } catch (error: any) {
            // 处理浏览器扩展导致的错误
            if (error.message?.includes('asynchronous response') || error.message?.includes('message channel closed')) {
                console.warn('浏览器扩展导致的错误，忽略:', error.message)
                // 重新尝试请求
                const formData = new FormData()
                formData.append('file', file)
                formData.append('headerRow', headerRow.toString())

                const response = await apiClient.post('/api/upload/dynamic-parse', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    timeout: 30000
                })
                return response.data
            }
            throw error
        }
    }

    // 文件上传（支持指定表头行）
    async uploadFile(file: File, headerRow: number = 0): Promise<UploadResponse> {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('headerRow', headerRow.toString())

        const response = await apiClient.post('/api/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })

        return response.data
    }

    // 获取映射关系
    async getMappings(): Promise<Mapping[]> {
        const response = await apiClient.get('/api/mappings')
        return response.data.data || []
    }

    // 查询数据
    async getData(hash: string, params: QueryParams = {}): Promise<DataResponse> {
        const queryParams: Record<string, string> = {
            page: params.page?.toString() || '1',
            limit: params.limit?.toString() || '10'
        }

        // 处理search参数，确保是字符串格式
        if (params.search) {
            if (typeof params.search === 'string') {
                queryParams.search = params.search
            } else {
                // 如果是对象，转换为JSON字符串
                queryParams.search = JSON.stringify(params.search)
            }
        }

        const queryString = new URLSearchParams(queryParams).toString()
        const response = await apiClient.get(`/api/data/${hash}?${queryString}`)
        return response.data
    }

    // 更新数据
    async updateData(hash: string, conditions: any, updates: any): Promise<any> {
        const response = await apiClient.put(`/api/data/${hash}`, {
            conditions,
            updates
        })

        return response.data
    }

    // 新增数据
    async addData(hash: string, data: any): Promise<any> {
        const response = await apiClient.post(`/api/data/${hash}/add`, {
            data
        })

        return response.data
    }

    // 删除数据
    async deleteData(hash: string, conditions: any): Promise<any> {
        const response = await apiClient.delete(`/api/data/${hash}`, {
            data: { conditions }
        })

        return response.data
    }

    // 删除映射关系
    async deleteMapping(hash: string): Promise<any> {
        const response = await apiClient.delete(`/api/mappings/${hash}`)
        return response.data
    }

    // 更新映射关系表名
    async updateMapping(hash: string, tableName: string): Promise<any> {
        const response = await apiClient.put(`/api/mappings/${hash}`, {
            tableName
        })
        return response.data
    }

    // 获取表的列信息
    async getTableColumns(hash: string): Promise<ColumnDefinition[]> {
        const response = await apiClient.get(`/api/mappings/${hash}/columns`)
        return response.data.data || []
    }

    // 根据表哈希获取表结构信息
    async getTableStructureByHash(hash: string): Promise<{
        columns: ColumnDefinition[],
        tableName: string
    }> {
        try {
            // 先获取映射关系详情
            const mappingResponse = await apiClient.get(`/api/mappings/${hash}`)
            const mapping = mappingResponse.data.data

            // 再获取列信息
            const columnsResponse = await apiClient.get(`/api/mappings/${hash}/columns`)
            const columns = columnsResponse.data.data || []

            return {
                columns,
                tableName: mapping.tableName
            }
        } catch (error) {
            console.error('获取表结构信息失败:', error)
            // 如果获取失败，返回空结构
            return {
                columns: [],
                tableName: ''
            }
        }
    }

    // 获取表结构信息（包含搜索能力）
    async getTableStructure(hash: string): Promise<{
        columns: ColumnDefinition[],
        searchCapabilities: { [key: string]: string[] } // 字段名 -> 可用的操作符列表
    }> {
        const response = await apiClient.get(`/api/mappings/${hash}/columns`)
        const columns = response.data.data || []

        // 根据字段类型生成搜索能力
        const searchCapabilities: { [key: string]: string[] } = {}

        columns.forEach((column: ColumnDefinition) => {
            const capabilities = this.getSearchOperatorsForType(column.type)
            searchCapabilities[column.name] = capabilities
        })

        return {
            columns,
            searchCapabilities
        }
    }

    // 获取表数据（用于文件管理页面的展开预览）
    async getTableData(hash: string, page: number = 1, limit: number = 10): Promise<DataResponse> {
        const queryParams: Record<string, string> = {
            page: page.toString(),
            limit: limit.toString()
        }

        const queryString = new URLSearchParams(queryParams).toString()
        const response = await apiClient.get(`/api/data/${hash}?${queryString}`)
        return response.data
    }

    // 根据字段类型获取可用的搜索操作符
    private getSearchOperatorsForType(type: string): string[] {
        const baseOperators = ['eq', 'ne']

        switch (type) {
            case 'string':
                return [...baseOperators, 'like']
            case 'number':
                return [...baseOperators, 'gt', 'lt', 'gte', 'lte']
            case 'date':
                return [...baseOperators, 'gt', 'lt', 'gte', 'lte']
            case 'boolean':
                return ['eq']
            default:
                return [...baseOperators, 'like']
        }
    }

    // 系统健康检查
    async healthCheck(): Promise<any> {
        const response = await apiClient.get('/health')
        return response.data
    }

    // 获取系统信息
    async getSystemInfo(): Promise<SystemInfo> {
        const response = await apiClient.get('/api/system/info')
        return response.data.data
    }

    // 导入Excel数据到现有表
    async importExcelData(
        file: File,
        targetHash: string,
        headerRow: number = 0,
        importRules: ImportRules = {
            deduplicationFields: [],
            conflictStrategy: 'skip',
            validationRules: []
        }
    ): Promise<ImportResponse> {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('targetHash', targetHash)
        formData.append('headerRow', headerRow.toString())
        formData.append('importRules', JSON.stringify(importRules))

        const response = await apiClient.post('/api/import/excel', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            timeout: 60000 // 60秒超时，导入可能比较耗时
        })

        return response.data
    }

    // 用户登录
    async login(username: string, password: string): Promise<any> {
        const response = await apiClient.post('/api/auth/login', {
            username,
            password
        })
        return response.data
    }

    // 获取当前用户信息
    async getCurrentUser(): Promise<any> {
        const response = await apiClient.get('/api/auth/me')
        return response.data
    }

    // 更新当前用户信息
    async updateCurrentUser(userData: {
        displayName?: string
        email?: string
        phone?: string
        idCard?: string
        realName?: string
    }): Promise<any> {
        const response = await apiClient.put('/api/auth/me', userData)
        return response.data
    }

    // 修改密码
    async changePassword(passwordData: {
        currentPassword: string
        newPassword: string
    }): Promise<any> {
        const response = await apiClient.post('/api/auth/change-password', passwordData)
        return response.data
    }

    // 用户注册
    async register(userData: {
        username: string
        password: string
        email?: string
        displayName?: string
    }): Promise<any> {
        const response = await apiClient.post('/api/auth/register', userData)
        return response.data
    }


    // 更新用户信息
    async updateUser(userId: number, userData: any): Promise<any> {
        const response = await apiClient.put(`/api/users/${userId}`, userData)
        return response.data
    }

    // 删除用户（管理员权限）
    async deleteUser(userId: number): Promise<any> {
        const response = await apiClient.delete(`/api/users/${userId}`)
        return response.data
    }

    // 管理员修改用户密码
    async adminChangePassword(userId: number, newPassword: string): Promise<any> {
        const response = await apiClient.put(`/api/users/${userId}/password`, {
            newPassword
        })
        return response.data
    }

    // 获取操作日志
    async getOperationLogs(params: {
        tableHash?: string
        page?: number
        limit?: number
    } = {}): Promise<any> {
        const queryParams = new URLSearchParams()
        if (params.tableHash) queryParams.append('tableHash', params.tableHash)
        if (params.page) queryParams.append('page', params.page.toString())
        if (params.limit) queryParams.append('limit', params.limit.toString())

        const response = await apiClient.get(`/api/rollback/logs?${queryParams.toString()}`)
        return response.data
    }

    // 获取日志列表（支持高级筛选）
    async getLogs(params: {
        operationType?: string
        tableName?: string
        username?: string
        startTime?: string
        endTime?: string
        isRolledBack?: boolean
        page?: number
        limit?: number
    } = {}): Promise<any> {
        const queryParams = new URLSearchParams()
        if (params.operationType) queryParams.append('operationType', params.operationType)
        if (params.tableName) queryParams.append('tableName', params.tableName)
        if (params.username) queryParams.append('username', params.username)
        if (params.startTime) queryParams.append('startTime', params.startTime)
        if (params.endTime) queryParams.append('endTime', params.endTime)
        if (params.isRolledBack !== undefined) queryParams.append('isRolledBack', params.isRolledBack.toString())
        if (params.page) queryParams.append('page', params.page.toString())
        if (params.limit) queryParams.append('limit', params.limit.toString())

        const response = await apiClient.get(`/api/rollback/logs?${queryParams.toString()}`)
        return response.data
    }

    // 回退操作
    async rollbackOperation(logId: number, description?: string): Promise<any> {
        const response = await apiClient.post(`/api/rollback/logs/${logId}/rollback`, {
            description
        })
        return response.data
    }

    // 回退日志（别名方法，与前端页面保持一致）
    async rollbackLog(logId: number, data: { description?: string } = {}): Promise<any> {
        const response = await apiClient.post(`/api/rollback/logs/${logId}/rollback`, data)
        return response.data
    }


    // 获取字段配置
    async getFieldConfig(hash: string): Promise<any> {
        const response = await apiClient.get(`/api/field-config/${hash}`)
        return response.data.data
    }

    // 更新字段配置
    async updateFieldConfig(hash: string, config: any): Promise<any> {
        const response = await apiClient.put(`/api/field-config/${hash}`, {
            fieldConfig: config
        })
        return response.data
    }

    // 获取表结构信息（包含字段配置）
    async getTableStructureWithConfig(hash: string): Promise<any> {
        const response = await apiClient.get(`/api/field-config/${hash}/structure`)
        return response.data.data
    }


    // === 新的签到系统API ===

    // 手机号登录/自动注册
    async loginByPhone(data: {
        phone: string
        companyCode?: string
    }): Promise<any> {
        const response = await apiClient.post('/api/users/login', data)
        return response.data
    }

  // 签到
  async checkin(data: {
    realName: string
    phone: string
    companyCode: string
    laborSource: string
    location?: string
    remark?: string
  }): Promise<any> {
    const response = await apiClient.post('/api/checkin/checkin', data)
    return response.data
  }

    // 签退
    async checkout(data: {
        phone: string
        companyCode: string
        remark?: string
    }): Promise<any> {
        const response = await apiClient.post('/api/checkin/checkout', data)
        return response.data
    }

    // 获取今日状态
    async getTodayStatus(params: {
        phone: string
        companyId: string
    }): Promise<any> {
        const response = await apiClient.get('/api/checkin/today-status', { params })
        return response.data
    }

    // 获取签到历史
    async getCheckinHistory(params: {
        userId?: string
        companyId?: string
        startDate?: string
        endDate?: string
        page?: number
        limit?: number
    } = {}): Promise<any> {
        const response = await apiClient.get('/api/checkin/history', { params })
        return response.data
    }

    // 获取用户列表
    async getUsers(params: {
        page?: number
        limit?: number
        search?: string
        companyId?: string
        isActive?: boolean
    } = {}): Promise<any> {
        const response = await apiClient.get('/api/users', { params })
        return response.data
    }

    // 根据手机号获取用户信息
    async getUserByPhone(phone: string): Promise<any> {
        const response = await apiClient.get(`/api/users/phone/${phone}`)
        return response.data
    }

    // === 公司管理API ===

    // 获取公司列表
    async getCompanies(params: {
        page?: number
        limit?: number
        search?: string
        isActive?: boolean
    } = {}): Promise<any> {
        const response = await apiClient.get('/api/companies', { params })
        return response.data
    }

    // 根据公司代码获取公司信息
    async getCompanyByCode(companyCode: string): Promise<any> {
        const response = await apiClient.get(`/api/companies/code/${companyCode}`)
        return response.data
    }

    // 创建公司
    async createCompany(companyData: {
        name: string
        code: string
        description?: string
    }): Promise<any> {
        const response = await apiClient.post('/api/companies', companyData)
        return response.data
    }

    // 更新公司信息
    async updateCompany(companyId: string, companyData: {
        name?: string
        description?: string
        status?: string
    }): Promise<any> {
        const response = await apiClient.put(`/api/companies/${companyId}`, companyData)
        return response.data
    }

    // 删除公司
    async deleteCompany(companyId: string): Promise<any> {
        const response = await apiClient.delete(`/api/companies/${companyId}`)
        return response.data
    }

    // 批量创建公司
    async batchCreateCompanies(companies: any[]): Promise<any> {
        const response = await apiClient.post('/api/companies/batch', { companies })
        return response.data
    }

    // === 打卡记录管理API ===

    // 获取打卡记录
    async getCheckinRecords(params: {
        page?: number
        limit?: number
        search?: string
        companyId?: string
        startDate?: string
        endDate?: string
    } = {}): Promise<any> {
        const response = await apiClient.get('/api/checkin/records', { params })
        return response.data
    }

    // 导出打卡记录
    async exportCheckinRecords(params: {
        companyId?: string
        startDate?: string
        endDate?: string
        search?: string
    } = {}): Promise<any> {
        const response = await apiClient.get('/api/checkin/export', { params })
        return response.data
    }

    // 获取单个公司信息
    async getCompany(companyId: string): Promise<any> {
        const response = await apiClient.get(`/api/companies/${companyId}`)
        return response.data
    }

    // 删除打卡记录
    async deleteCheckinRecord(recordId: string): Promise<any> {
        const response = await apiClient.delete(`/api/checkin/record/${recordId}`)
        return response.data
    }
}

export const apiService = new ApiService()
