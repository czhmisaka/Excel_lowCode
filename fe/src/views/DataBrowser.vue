<template>
    <div class="data-browser fade-in-up">
        <!-- 工具栏 -->
        <div class="modern-toolbar">
            <div class="toolbar-content">
                <el-select v-model="selectedHash" placeholder="选择文件" class="modern-input"
                    style="width: 200px; margin-right: 10px;">
                    <el-option v-for="file in fileList" :key="file.hash" :label="file.originalFileName"
                        :value="file.hash" />
                </el-select>
                <el-button type="primary" @click="loadData" :disabled="!selectedHash" class="modern-button"
                    :icon="Refresh">
                    加载数据
                </el-button>
            </div>
        </div>

        <!-- 数据表格 -->
        <div class="modern-card">
            <el-table :data="tableData" v-loading="loading" border stripe class="modern-table" style="width: 100%">
                <el-table-column v-for="column in tableColumns" :key="column" :prop="column" :label="column"
                    min-width="120" />
            </el-table>

            <div class="modern-pagination" v-if="tableData.length > 0">
                <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                    :page-sizes="[10, 20, 50, 100]" :total="totalRecords"
                    layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
                    @current-change="handleCurrentChange" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFilesStore } from '@/stores/files'
import { useDataStore } from '@/stores/data'
import { Refresh } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const filesStore = useFilesStore()
const dataStore = useDataStore()

// 状态
const loading = ref(false)
const selectedHash = ref('')
const fileList = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)

// 计算属性
const tableData = computed(() => dataStore.currentData)
const tableColumns = computed(() => {
    if (tableData.value.length === 0) return []
    return Object.keys(tableData.value[0])
})
const totalRecords = computed(() => dataStore.pagination.total)

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
            await loadData()
        } else {
            console.warn(`URL中的hash参数 ${hashFromUrl} 不在文件列表中`)
        }
    } else if (fileList.value.length > 0) {
        // 如果没有hash参数，默认加载第一个表
        selectedHash.value = fileList.value[0].hash
        await loadData()
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
            await loadData()
        }
    }
})

// 加载数据
const loadData = async () => {
    if (!selectedHash.value) return

    loading.value = true
    try {
        await dataStore.fetchData(selectedHash.value, {
            page: currentPage.value,
            limit: pageSize.value
        })
    } catch (error) {
        console.error('加载数据失败:', error)
    } finally {
        loading.value = false
    }
}

// 分页处理
const handleSizeChange = (size: number) => {
    pageSize.value = size
    currentPage.value = 1
    loadData()
}

const handleCurrentChange = (page: number) => {
    currentPage.value = page
    loadData()
}

onMounted(() => {
    initData()
})
</script>

<style scoped>
.data-browser {
    padding: 0;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-actions {
    display: flex;
    align-items: center;
}

.data-table {
    margin-top: 20px;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}
</style>
