<template>
    <div class="search-toolbar">
        <!-- 快速搜索 -->
        <div class="quick-search">
            <el-input
                v-model="quickSearchText"
                placeholder="输入关键词搜索..."
                class="quick-search-input"
                :prefix-icon="Search"
                clearable
                @input="handleQuickSearch"
                @clear="handleClearQuickSearch"
            >
                <template #append>
                    <el-button :icon="Search" @click="handleQuickSearch" />
                </template>
            </el-input>
        </div>

        <!-- 高级搜索按钮 -->
        <div class="advanced-search-toggle">
            <el-button
                type="primary"
                link
                :icon="Filter"
                @click="toggleAdvancedSearch"
            >
                高级搜索
                <el-icon v-if="showAdvanced">
                    <ArrowUp />
                </el-icon>
                <el-icon v-else>
                    <ArrowDown />
                </el-icon>
            </el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Search, Filter, ArrowUp, ArrowDown } from '@element-plus/icons-vue'

// Props
interface Props {
    showAdvanced?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    showAdvanced: false
})

// Emits
const emit = defineEmits<{
    'update:showAdvanced': [value: boolean]
    'quick-search': [text: string]
    'clear-quick-search': []
}>()

// 状态
const quickSearchText = ref('')

// 处理快速搜索
const handleQuickSearch = () => {
    emit('quick-search', quickSearchText.value)
}

// 清除快速搜索
const handleClearQuickSearch = () => {
    emit('clear-quick-search')
}

// 切换高级搜索显示
const toggleAdvancedSearch = () => {
    emit('update:showAdvanced', !props.showAdvanced)
}

// 监听快速搜索文本变化，防抖处理
let searchTimeout: NodeJS.Timeout | null = null
watch(quickSearchText, (newText) => {
    if (searchTimeout) {
        clearTimeout(searchTimeout)
    }
    searchTimeout = setTimeout(() => {
        emit('quick-search', newText)
    }, 300)
})
</script>

<style scoped>
.search-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-light);
    margin-bottom: 16px;
}

.quick-search {
    flex: 1;
    max-width: 400px;
}

.quick-search-input {
    width: 100%;
}

.advanced-search-toggle {
    flex-shrink: 0;
}

@media (max-width: 768px) {
    .search-toolbar {
        flex-direction: column;
        align-items: stretch;
    }
    
    .quick-search {
        max-width: none;
    }
    
    .advanced-search-toggle {
        align-self: flex-end;
    }
}
</style>
