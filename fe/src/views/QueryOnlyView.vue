<template>
    <div class="query-only-view">
        <el-card class="query-card">
            <template #header>
                <div class="card-header">
                    <span class="title">数据查询</span>
                    <div class="header-actions">
                        <el-select v-model="selectedHash" placeholder="选择数据文件"
                            style="width: 240px; margin-right: 12px;">
                            <el-option v-for="file in fileList" :key="file.hash" :label="file.originalFileName"
                                :value="file.hash" />
                        </el-select>
                        <el-button type="primary" @click="loadData" :disabled="!selectedHash" :loading="loading">
                            <el-icon>
                                <Search />
                            </el-icon>
                            查询数据
                        </el-button>
                        <el-button @click="resetQuery" :disabled="loading">
                            <el-icon>
                                <Refresh />
                            </el-icon>
                            重置
                        </el-button>
                    </div>
                </div>
            </template>

            <!-- 查询条件区域 -->
            <div class="query-conditions" v-if="tableData.length > 0">
                <el-input v-model="searchText" placeholder="输入关键词搜索..." style="width: 300px; margin-bottom: 16px;"
                    clearable @clear="clearSearch" @keyup.enter="handleSearch">
                    <template #prefix>
                        <el-icon>
                            <Search />
                        </el-icon>
                    </template>
                </el-input>
                <el-button type="primary" @click="handleSearch" :loading="loading" style="margin-left: 8px;">
                    <el-icon>
                        <Search />
                    </el-icon>
                    搜索
                </el-button>
            </div>

            <!-- 数据表格 -->
            <div class="data-table-container">
                <el-table :data="tableData" v-loading="loading" border style="width: 100%"
                    :empty-text="selectedHash ? '暂无数据' : '请先选择数据文件'" height="500">
                    <el-table-column v-for="column in tableColumns" :key="column" :prop="column" :label="column"
                        min-width="150" show-overflow-tooltip />
                </el-table>

                <!-- 分页 -->
                <div class="pagination" v-if="tableData.length > 0">
                    <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                        :page-sizes="[10, 20, 50, 100]" :total="totalRecords"
                        layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
                        @current-change="handleCurrentChange" />
                </div>

                <!-- 数据统计 -->
                <div class="data-stats" v-if="tableData.length > 0">
                    <el-text type="info">
                        共 {{ totalRecords }} 条记录，当前显示 {{ tableData.length }} 条
                        <span v-if="searchText">（已搜索）</span>
                    </el-text>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFilesStore } from '@/stores/files'
import { useDataStore } from '@/stores/data'
import { Search, Refresh } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const filesStore = useFilesStore()
const dataStore = useDataStore()

// 状态
const loading = ref(false)
const selectedHash = ref('')
const fileList = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const searchText = ref('')

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
    searchText.value = '' // 重置搜索条件
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

// 搜索处理
const handleSearch = async () => {
    if (!selectedHash.value) return

    loading.value = true
    try {
        // 构建搜索条件
        let searchCondition: any = null
        if (searchText.value.trim()) {
            // 只对字符串字段使用 $like 操作符，避免数字字段的模糊查询问题
            const orConditions: any[] = []

            // 获取表的列定义信息
            const currentTable = fileList.value.find(file => file.hash === selectedHash.value)
            if (currentTable && currentTable.columnDefinitions) {
                // 使用实际的列类型信息，只对字符串字段使用模糊查询
                currentTable.columnDefinitions.forEach((column: any) => {
                    if (column.type === 'string') {
                        // 只对字符串字段使用模糊查询
                        orConditions.push({
                            [column.name]: { $like: `%${searchText.value}%` }
                        })
                    }
                    // 对于数字字段，使用精确匹配或范围查询
                    else if (column.type === 'number') {
                        // 尝试将搜索文本转换为数字进行精确匹配
                        const numericValue = Number(searchText.value)
                        if (!isNaN(numericValue)) {
                            orConditions.push({
                                [column.name]: { $eq: numericValue }
                            })
                        }
                    }
                })
            } else {
                // 如果没有列定义信息，回退到对所有列使用模糊查询
                // 但添加日志以便调试
                console.warn('没有列定义信息，回退到对所有字段使用模糊查询')
                tableColumns.value.forEach(column => {
                    orConditions.push({
                        [column]: { $like: `%${searchText.value}%` }
                    })
                })
            }

            if (orConditions.length > 0) {
                searchCondition = { $or: orConditions }
                console.log('构建的搜索条件:', searchCondition)
            } else {
                console.warn('没有有效的搜索条件构建')
            }
        }

        await dataStore.fetchData(selectedHash.value, {
            page: 1, // 搜索时重置到第一页
            limit: pageSize.value,
            search: searchCondition ? JSON.stringify(searchCondition) : undefined
        })
    } catch (error) {
        console.error('搜索数据失败:', error)
    } finally {
        loading.value = false
    }
}

const clearSearch = () => {
    searchText.value = ''
    // 清空搜索条件后重新加载数据
    if (selectedHash.value) {
        loadData()
    }
}

// 重置查询
const resetQuery = () => {
    selectedHash.value = ''
    searchText.value = ''
    currentPage.value = 1
    dataStore.clearCurrentData()
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
.query-only-view {
    padding: 0;
}

.query-card {
    min-height: 600px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 4px;
}

.card-header .title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.query-conditions {
    margin-bottom: 16px;
    padding: 0 4px;
}

.data-table-container {
    margin-top: 16px;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

.data-stats {
    margin-top: 12px;
    text-align: center;
    padding: 8px;
    background-color: #f8f9fa;
    border-radius: 4px;
}
</style>
