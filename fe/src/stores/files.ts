import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiService, type UploadResponse, type Mapping } from '@/services/api'

// 文件项接口
export interface FileItem {
    hash: string
    tableName: string
    originalFileName: string
    recordCount: number
    columnCount: number
    createdAt: string
    fileSize?: number
}

// 文件管理store
export const useFilesStore = defineStore('files', () => {
    // 状态
    const fileList = ref<FileItem[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)
    const uploadProgress = ref(0)

    // 获取映射关系列表
    const fetchMappings = async () => {
        loading.value = true
        error.value = null
        try {
            const mappings: Mapping[] = await apiService.getMappings()
            fileList.value = mappings.map(mapping => ({
                hash: mapping.hashValue,
                tableName: mapping.tableName,
                originalFileName: mapping.originalFileName || mapping.tableName,
                recordCount: mapping.rowCount,
                columnCount: mapping.columnCount,
                createdAt: mapping.createdAt
            }))
        } catch (err: any) {
            error.value = err.message || '获取文件列表失败'
            console.error('获取映射关系失败:', err)
        } finally {
            loading.value = false
        }
    }

    // 上传文件
    const uploadFile = async (file: File) => {
        loading.value = true
        error.value = null
        uploadProgress.value = 0

        try {
            // 模拟上传进度
            const progressInterval = setInterval(() => {
                if (uploadProgress.value < 90) {
                    uploadProgress.value += 10
                }
            }, 200)

            const response: UploadResponse = await apiService.uploadFile(file)

            clearInterval(progressInterval)
            uploadProgress.value = 100

            if (response.success) {
                // 添加新文件到列表
                const newFile: FileItem = {
                    hash: response.data.hash,
                    tableName: response.data.tableName,
                    originalFileName: response.data.originalFileName,
                    recordCount: response.data.recordCount,
                    columnCount: response.data.columnCount,
                    createdAt: response.data.createdAt,
                    fileSize: file.size
                }

                fileList.value.unshift(newFile)
                return newFile
            } else {
                throw new Error(response.message || '文件上传失败')
            }
        } catch (err: any) {
            error.value = err.message || '文件上传失败'
            console.error('文件上传失败:', err)
            throw err
        } finally {
            loading.value = false
            setTimeout(() => {
                uploadProgress.value = 0
            }, 1000)
        }
    }

    // 删除文件
    const deleteFile = async (hash: string) => {
        try {
            await apiService.deleteMapping(hash)
            // 从列表中移除
            const index = fileList.value.findIndex(file => file.hash === hash)
            if (index !== -1) {
                fileList.value.splice(index, 1)
            }
        } catch (err: any) {
            error.value = err.message || '删除文件失败'
            console.error('删除文件失败:', err)
            throw err
        }
    }

    // 根据hash获取文件信息
    const getFileByHash = (hash: string) => {
        return fileList.value.find(file => file.hash === hash)
    }

    // 清空错误
    const clearError = () => {
        error.value = null
    }

    return {
        // 状态
        fileList,
        loading,
        error,
        uploadProgress,

        // 方法
        fetchMappings,
        uploadFile,
        deleteFile,
        getFileByHash,
        clearError
    }
})
