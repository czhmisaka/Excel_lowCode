<!--
 * 表结构编辑器页面
 * @Date: 2025-10-30
 -->
<template>
    <div class="table-structure-editor-view">
        <el-card>
            <template #header>
                <div class="page-header">
                    <span class="page-title">表结构编辑器</span>
                    <div class="header-actions">
                        <el-select v-model="selectedHash" placeholder="选择文件" style="width: 200px; margin-right: 10px;">
                            <el-option v-for="file in fileList" :key="file.hash" :label="file.originalFileName"
                                :value="file.hash" />
                        </el-select>
                        <el-button type="primary" @click="loadTableStructure" :disabled="!selectedHash">
                            <el-icon>
                                <Refresh />
                            </el-icon>
                            加载表结构
                        </el-button>
                        <el-button @click="goBack">
                            <el-icon>
                                <ArrowLeft />
                            </el-icon>
                            返回
                        </el-button>
                    </div>
                </div>
            </template>

            <div class="page-content">
                <div class="info-tip" v-if="!selectedHash">
                    <el-alert title="请先选择要编辑表结构的文件" type="info" show-icon :closable="false" />
                </div>

                <div v-else-if="loading">
                    <el-skeleton :rows="5" animated />
                </div>

                <div v-else-if="error">
                    <el-alert :title="error" type="error" show-icon :closable="false" />
                </div>

                <div v-else-if="tableStructure">
                    <TableStructureEditor :table-hash="selectedHash" :table-name="tableStructure.tableName"
                        :original-columns="originalColumns" :initial-config="fieldConfig" @save="handleSaveConfig"
                        @update="handleUpdateConfig" />
                </div>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFilesStore } from '@/stores/files'
import { apiService } from '@/services/api'
import { ElMessage } from 'element-plus'
import { Refresh, ArrowLeft } from '@element-plus/icons-vue'
import TableStructureEditor from '@/components/TableStructureEditor.vue'
import type { TableStructureConfig } from '@/types/form'

const route = useRoute()
const router = useRouter()
const filesStore = useFilesStore()

// 状态
const loading = ref(false)
const selectedHash = ref('')
const fileList = ref<any[]>([])
const tableStructure = ref<any>(null)
const fieldConfig = ref<TableStructureConfig | null>(null)
const error = ref('')

// 计算属性
const originalColumns = ref<string[]>([])

// 初始化数据
const initData = async () => {
    try {
        await filesStore.fetchMappings()
        fileList.value = filesStore.fileList

        // 检查URL参数并自动加载数据
        await handleUrlHashParam()
    } catch (error) {
        console.error('获取文件列表失败:', error)
    }
}

// 处理URL中的hash参数
const handleUrlHashParam = async () => {
    const hashFromUrl = route.query.hash as string
    if (hashFromUrl && fileList.value.length > 0) {
        // 检查hash是否在文件列表中
        const fileExists = fileList.value.some(file => file.hash === hashFromUrl)
        if (fileExists) {
            selectedHash.value = hashFromUrl
            await loadTableStructure()
        } else {
            console.warn(`URL中的hash参数 ${hashFromUrl} 不在文件列表中`)
        }
    } else if (fileList.value.length > 0) {
        // 如果没有hash参数，默认加载第一个表
        selectedHash.value = fileList.value[0].hash
        await loadTableStructure()
    }
}

// 监听selectedHash变化，更新URL参数
watch(selectedHash, (newHash) => {
    if (newHash) {
        // 更新URL参数，但不触发页面跳转
        router.replace({
            query: { ...route.query, hash: newHash }
        })
    } else {
        // 清除hash参数
        const { hash, ...otherQueries } = route.query
        router.replace({ query: otherQueries })
    }
})

// 监听路由参数变化
watch(() => route.query.hash, async (newHash) => {
    if (newHash && newHash !== selectedHash.value && fileList.value.length > 0) {
        const fileExists = fileList.value.some(file => file.hash === newHash)
        if (fileExists) {
            selectedHash.value = newHash as string
            await loadTableStructure()
        }
    }
})

// 加载表结构信息
const loadTableStructure = async () => {
    if (!selectedHash.value) return

    loading.value = true
    error.value = ''

    try {
        // 获取表结构信息
        const structure = await apiService.getTableStructureWithConfig(selectedHash.value)
        tableStructure.value = structure

        // 提取原始列名
        if (structure.columns && Array.isArray(structure.columns)) {
            originalColumns.value = structure.columns.map((col: any) => typeof col === 'string' ? col : col.name || '')
        } else {
            // 如果没有列信息，使用默认方式获取
            originalColumns.value = await getOriginalColumns(selectedHash.value)
        }

        // 获取字段配置
        await loadFieldConfig()
    } catch (err: any) {
        console.error('加载表结构失败:', err)
        error.value = err.message || '加载表结构失败'
        ElMessage.error('加载表结构失败')
    } finally {
        loading.value = false
    }
}

// 获取原始列名
const getOriginalColumns = async (hash: string): Promise<string[]> => {
    try {
        // 通过查询少量数据来获取列名
        const data = await apiService.getData(hash, { page: 1, limit: 1 })
        if (data.data && data.data.length > 0) {
            return Object.keys(data.data[0]).filter(key => key.toLowerCase() !== 'id')
        }
        return []
    } catch (error) {
        console.error('获取原始列名失败:', error)
        return []
    }
}

// 加载字段配置
const loadFieldConfig = async () => {
    if (!selectedHash.value) return

    try {
        const config = await apiService.getFieldConfig(selectedHash.value)
        if (config && config.fields) {
            fieldConfig.value = config
        } else {
            // 如果没有配置，创建默认配置
            fieldConfig.value = {
                fields: originalColumns.value.map((column, index) => ({
                    name: column,
                    originalName: column,
                    displayName: column,
                    type: 'string',
                    required: false,
                    visible: true,
                    order: index + 1,
                    validation: {},
                    options: []
                }))
            }
        }
    } catch (error) {
        console.error('加载字段配置失败:', error)
        // 如果加载失败，创建默认配置
        fieldConfig.value = {
            fields: originalColumns.value.map((column, index) => ({
                name: column,
                originalName: column,
                displayName: column,
                type: 'string',
                required: false,
                visible: true,
                order: index + 1,
                validation: {},
                options: []
            }))
        }
    }
}

// 处理保存配置
const handleSaveConfig = async (config: TableStructureConfig) => {
    try {
        await apiService.updateFieldConfig(selectedHash.value, config)
        ElMessage.success('表结构配置保存成功')
    } catch (error: any) {
        console.error('保存配置失败:', error)
        ElMessage.error(error.message || '保存配置失败')
    }
}

// 处理配置更新
const handleUpdateConfig = (config: TableStructureConfig) => {
    // 可以在这里处理配置的实时更新
    console.log('配置更新:', config)
}

// 返回上一页
const goBack = () => {
    router.back()
}

onMounted(() => {
    initData()
})
</script>

<style scoped>
.table-structure-editor-view {
    padding: 0;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.page-title {
    font-size: 18px;
    font-weight: 600;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.page-content {
    margin-top: 20px;
}

.info-tip {
    margin-bottom: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .page-header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
    }

    .header-actions {
        width: 100%;
        justify-content: space-between;
    }
}
</style>
