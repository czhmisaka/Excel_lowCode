<template>
    <div class="file-management">
        <el-card>
            <template #header>
                <div class="card-header">
                    <span>文件管理</span>
                    <el-button type="primary" @click="showUploadDialog = true">
                        <el-icon>
                            <Upload />
                        </el-icon>
                        上传文件
                    </el-button>
                </div>
            </template>

            <div class="file-list">
                <el-table :data="fileList" v-loading="loading">
                    <el-table-column prop="originalFileName" label="文件名" min-width="200" />
                    <el-table-column prop="tableName" label="表名" width="150" />
                    <el-table-column prop="recordCount" label="记录数" width="100" />
                    <el-table-column prop="columnCount" label="列数" width="80" />
                    <el-table-column prop="createdAt" label="上传时间" width="180" />
                    <el-table-column label="操作" width="200">
                        <template #default="scope">
                            <el-button type="primary" link @click="editData(scope.row)">编辑数据</el-button>
                            <el-button type="primary" link @click="viewData(scope.row)">查看数据</el-button>
                            <el-button type="danger" link @click="deleteFile(scope.row)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </el-card>

        <!-- 文件上传对话框 -->
        <el-dialog v-model="showUploadDialog" title="上传Excel文件" width="500px">
            <div class="upload-area">
                <el-upload drag action="#" :auto-upload="false" :on-change="handleFileChange"
                    :before-upload="beforeUpload" accept=".xlsx,.xls">
                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                    <div class="el-upload__text">
                        将文件拖到此处，或<em>点击上传</em>
                    </div>
                    <template #tip>
                        <div class="el-upload__tip">
                            只能上传 xlsx/xls 文件，且不超过10MB
                        </div>
                    </template>
                </el-upload>
            </div>
            <template #footer>
                <el-button @click="showUploadDialog = false">取消</el-button>
                <el-button type="primary" @click="uploadFile" :loading="uploading">
                    上传
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFilesStore } from '@/stores/files'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, UploadFilled } from '@element-plus/icons-vue'

const router = useRouter()
const filesStore = useFilesStore()

// 状态
const loading = ref(false)
const showUploadDialog = ref(false)
const uploading = ref(false)
const selectedFile = ref<File | null>(null)
const fileList = ref<any[]>([])

// 初始化数据
const initData = async () => {
    loading.value = true
    try {
        await filesStore.fetchMappings()
        fileList.value = filesStore.fileList
    } catch (error) {
        console.error('获取文件列表失败:', error)
    } finally {
        loading.value = false
    }
}

// 文件选择处理
const handleFileChange = (file: any) => {
    selectedFile.value = file.raw
}

// 上传前验证
const beforeUpload = (file: File) => {
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel'
    const isLt10M = file.size / 1024 / 1024 < 10

    if (!isExcel) {
        ElMessage.error('只能上传Excel文件!')
        return false
    }
    if (!isLt10M) {
        ElMessage.error('文件大小不能超过10MB!')
        return false
    }
    return true
}

// 上传文件
const uploadFile = async () => {
    if (!selectedFile.value) {
        ElMessage.warning('请选择要上传的文件')
        return
    }

    uploading.value = true
    try {
        await filesStore.uploadFile(selectedFile.value)
        ElMessage.success('文件上传成功')
        showUploadDialog.value = false
        selectedFile.value = null
        await initData() // 刷新文件列表
    } catch (error: any) {
        ElMessage.error(error.message || '文件上传失败')
    } finally {
        uploading.value = false
    }
}

// 查看数据
const viewData = (file: any) => {
    router.push({ name: 'DataBrowser', query: { hash: file.hash } })
}

// 查看数据
const editData = (file: any) => {
    router.push({ name: 'DataEditor', query: { hash: file.hash } })
}

// 删除文件
const deleteFile = async (file: any) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除文件 "${file.originalFileName}" 吗？此操作将删除所有相关数据。`,
            '确认删除',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )

        await filesStore.deleteFile(file.hash)
        ElMessage.success('文件删除成功')
        await initData() // 刷新文件列表
    } catch (error: any) {
        if (error !== 'cancel') {
            ElMessage.error(error.message || '文件删除失败')
        }
    }
}

onMounted(() => {
    initData()
})
</script>

<style scoped>
.file-management {
    padding: 0;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.upload-area {
    text-align: center;
    padding: 20px 0;
}
</style>
