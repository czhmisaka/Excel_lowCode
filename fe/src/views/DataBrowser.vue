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

        <!-- 搜索工具栏 -->
        <SearchToolbar 
            v-model:show-advanced="showAdvancedSearch"
            @quick-search="handleQuickSearch"
            @clear-quick-search="handleClearQuickSearch"
        />

        <!-- 高级搜索面板 -->
        <AdvancedSearchPanel
            :show="showAdvancedSearch"
            :table-columns="tableColumns"
            :search-capabilities="searchCapabilities"
            :loading="loading"
            @search="handleAdvancedSearch"
            @cancel="handleCancelAdvancedSearch"
        />

        <!-- 搜索状态指示器 -->
        <div class="search-status" v-if="hasActiveSearch">
            <el-tag type="info" closable @close="clearAllSearch">
                <span v-if="quickSearchText">快速搜索: "{{ quickSearchText }}"</span>
                <span v-else-if="advancedSearchConditions.length > 0">高级搜索: {{ advancedSearchConditions.length }} 个条件</span>
                <span> (共 {{ totalRecords }} 条记录)</span>
            </el-tag>
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
import SearchToolbar from '@/components/Search/SearchToolbar.vue'
import AdvancedSearchPanel from '@/components/Search/AdvancedSearchPanel.vue'
import { apiService } from '@/services/api'

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
const showAdvancedSearch = ref(false)
const quickSearchText = ref('')
const advancedSearchConditions = ref<any[]>([])
const searchCapabilities = ref<{ [key: string]: string[] }>({})

// 计算属性
const tableData = computed(() => dataStore.currentData)
const tableColumns = computed(() => {
    if (tableData.value.length === 0) return []
    return Object.keys(tableData.value[0])
})
const totalRecords = computed(() => dataStore.pagination.total)
const hasActiveSearch = computed(() => {
    return quickSearchText.value !== '' || advancedSearchConditions.value.length > 0
})

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

// 搜索相关方法
const handleQuickSearch = async (text: string) => {
    quickSearchText.value = text
    advancedSearchConditions.value = []
    
    if (text) {
        // 构建快速搜索条件 - 在所有文本字段中搜索
        const searchConditions: any[] = []
        const columns = tableColumns.value
        
        columns.forEach(column => {
            searchConditions.push({
                [column]: {
                    '$like': `%${text}%`
                }
            })
        })
        
        // 使用 OR 逻辑组合所有字段的搜索条件
        advancedSearchConditions.value = [{
            '$or': searchConditions
        }]
    } else {
        advancedSearchConditions.value = []
    }
    
    await performSearch()
}

const handleClearQuickSearch = () => {
    quickSearchText.value = ''
    advancedSearchConditions.value = []
    performSearch()
}

const handleAdvancedSearch = async (conditions: any[], logicOperator: string) => {
    quickSearchText.value = ''
    showAdvancedSearch.value = false
    
    if (conditions.length > 0) {
        if (conditions.length === 1) {
            advancedSearchConditions.value = conditions
        } else {
            // 多个条件使用指定的逻辑操作符组合
            advancedSearchConditions.value = [{
                [`$${logicOperator}`]: conditions
            }]
        }
    } else {
        advancedSearchConditions.value = []
    }
    
    await performSearch()
}

const handleCancelAdvancedSearch = () => {
    showAdvancedSearch.value = false
}

const clearAllSearch = () => {
    quickSearchText.value = ''
    advancedSearchConditions.value = []
    performSearch()
}

// 执行搜索
const performSearch = async () => {
    if (!selectedHash.value) return
    
    loading.value = true
    try {
        // 构建搜索参数
        const searchParams: any = {
            page: currentPage.value,
            limit: pageSize.value
        }
        
        // 如果有搜索条件，添加到参数中
        if (advancedSearchConditions.value.length > 0) {
            searchParams.search = JSON.stringify(advancedSearchConditions.value[0])
        }
        
        await dataStore.fetchData(selectedHash.value, searchParams)
        
        // 获取搜索能力信息
        if (selectedHash.value) {
            try {
                const structure = await apiService.getTableStructure(selectedHash.value)
                searchCapabilities.value = structure.searchCapabilities
            } catch (error) {
                console.warn('获取搜索能力信息失败:', error)
                // 如果获取失败，使用默认搜索能力
                searchCapabilities.value = {}
                tableColumns.value.forEach(column => {
                    searchCapabilities.value[column] = ['eq', 'ne', 'like']
                })
            }
        }
    } catch (error) {
        console.error('搜索数据失败:', error)
    } finally {
        loading.value = false
    }
}

// 监听分页变化，重新执行搜索
watch([currentPage, pageSize], () => {
    if (hasActiveSearch.value) {
        performSearch()
    }
})

// 监听选中的hash变化，重置搜索状态
watch(selectedHash, () => {
    quickSearchText.value = ''
    advancedSearchConditions.value = []
    searchCapabilities.value = {}
    currentPage.value = 1
})

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

.search-status {
    margin-bottom: 16px;
}

.search-status .el-tag {
    padding: 8px 12px;
    font-size: 14px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}
</style>
