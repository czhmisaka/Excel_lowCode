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

// 请求拦截器
apiClient.interceptors.request.use(
    (config) => {
        // 添加认证token
        const authStore = useAuthStore()
        if (authStore.token) {
            config.headers.Authorization = `Bearer ${authStore.token}`
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
    }
    database: {
        type: string
        host: string
        port: number
        name: string
        status: string
        tableCount: number
        totalRecords: number
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
}

export const apiService = new ApiService()
