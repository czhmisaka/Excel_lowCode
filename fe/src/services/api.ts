import axios from 'axios'

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

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
        // 可以在这里添加认证token等
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
        return Promise.reject(error)
    }
)

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

// API服务类
class ApiService {
    // 文件上传
    async uploadFile(file: File): Promise<UploadResponse> {
        const formData = new FormData()
        formData.append('file', file)

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

    // 系统健康检查
    async healthCheck(): Promise<any> {
        const response = await apiClient.get('/health')
        return response.data
    }
}

export const apiService = new ApiService()
