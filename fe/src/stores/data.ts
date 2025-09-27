import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiService, type DataResponse, type QueryParams } from '@/services/api'

// 数据管理store
export const useDataStore = defineStore('data', () => {
    // 状态
    const currentHash = ref('')
    const currentData = ref<any[]>([])
    const pagination = ref({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    })
    const loading = ref(false)
    const editing = ref(false)
    const searchConditions = ref<any>({})
    const error = ref<string | null>(null)

    // 查询数据
    const fetchData = async (hash: string, params: QueryParams = {}) => {
        loading.value = true
        error.value = null
        currentHash.value = hash

        try {
            const response: DataResponse = await apiService.getData(hash, params)

            if (response.success) {
                currentData.value = response.data
                pagination.value = response.pagination
            } else {
                throw new Error('获取数据失败')
            }
        } catch (err: any) {
            error.value = err.message || '获取数据失败'
            console.error('获取数据失败:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    // 更新数据
    const updateData = async (conditions: any, updates: any) => {
        if (!currentHash.value) {
            throw new Error('未选择文件')
        }

        try {
            const response = await apiService.updateData(currentHash.value, conditions, updates)
            if (response.success) {
                // 重新获取当前页数据
                await fetchData(currentHash.value, {
                    page: pagination.value.page,
                    limit: pagination.value.limit,
                    search: Object.keys(searchConditions.value).length > 0 ? JSON.stringify(searchConditions.value) : undefined
                })
                return response
            } else {
                throw new Error(response.message || '更新数据失败')
            }
        } catch (err: any) {
            error.value = err.message || '更新数据失败'
            console.error('更新数据失败:', err)
            throw err
        }
    }

    // 新增数据
    const addData = async (data: any) => {
        if (!currentHash.value) {
            throw new Error('未选择文件')
        }

        try {
            const response = await apiService.addData(currentHash.value, data)
            if (response.success) {
                // 重新获取当前页数据
                await fetchData(currentHash.value, {
                    page: pagination.value.page,
                    limit: pagination.value.limit,
                    search: Object.keys(searchConditions.value).length > 0 ? JSON.stringify(searchConditions.value) : undefined
                })
                return response
            } else {
                throw new Error(response.message || '新增数据失败')
            }
        } catch (err: any) {
            error.value = err.message || '新增数据失败'
            console.error('新增数据失败:', err)
            throw err
        }
    }

    // 删除数据
    const deleteData = async (conditions: any) => {
        if (!currentHash.value) {
            throw new Error('未选择文件')
        }

        try {
            const response = await apiService.deleteData(currentHash.value, conditions)
            if (response.success) {
                // 重新获取当前页数据
                await fetchData(currentHash.value, {
                    page: pagination.value.page,
                    limit: pagination.value.limit,
                    search: Object.keys(searchConditions.value).length > 0 ? JSON.stringify(searchConditions.value) : undefined
                })
                return response
            } else {
                throw new Error(response.message || '删除数据失败')
            }
        } catch (err: any) {
            error.value = err.message || '删除数据失败'
            console.error('删除数据失败:', err)
            throw err
        }
    }

    // 设置搜索条件
    const setSearchConditions = (conditions: any) => {
        searchConditions.value = conditions
    }

    // 清空搜索条件
    const clearSearchConditions = () => {
        searchConditions.value = {}
    }

    // 设置分页
    const setPagination = (page: number, limit: number) => {
        pagination.value.page = page
        pagination.value.limit = limit
    }

    // 清空当前数据
    const clearCurrentData = () => {
        currentHash.value = ''
        currentData.value = []
        pagination.value = {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0
        }
        searchConditions.value = {}
        error.value = null
    }

    // 清空错误
    const clearError = () => {
        error.value = null
    }

    return {
        // 状态
        currentHash,
        currentData,
        pagination,
        loading,
        editing,
        searchConditions,
        error,

        // 方法
        fetchData,
        updateData,
        addData,
        deleteData,
        setSearchConditions,
        clearSearchConditions,
        setPagination,
        clearCurrentData,
        clearError
    }
})
