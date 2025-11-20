<template>
    <div class="advanced-search-panel" v-if="show">
        <div class="panel-header">
            <h4>高级搜索</h4>
            <div class="header-actions">
                <el-button type="primary" link :icon="Plus" @click="addCondition">
                    添加条件
                </el-button>
                <el-button type="danger" link :icon="Delete" @click="clearAllConditions">
                    清空条件
                </el-button>
            </div>
        </div>

        <div class="conditions-container">
            <!-- 搜索条件列表 -->
            <div 
                v-for="(condition, index) in conditions" 
                :key="condition.id"
                class="condition-item"
            >
                <SearchConditionBuilder
                    :condition="condition"
                    :tableColumns="tableColumns"
                    :searchCapabilities="searchCapabilities"
                    @update="(newCondition: any) => updateCondition(index, newCondition)"
                    @remove="removeCondition(index)"
                />
            </div>

            <!-- 空状态 -->
            <div v-if="conditions.length === 0" class="empty-state">
                <el-empty description="暂无搜索条件" :image-size="80">
                    <el-button type="primary" :icon="Plus" @click="addCondition">
                        添加第一个条件
                    </el-button>
                </el-empty>
            </div>
        </div>

        <!-- 操作按钮 -->
        <div class="panel-actions" v-if="conditions.length > 0">
            <div class="logic-operator">
                <el-radio-group v-model="logicOperator" size="small">
                    <el-radio-button label="and">并且 (AND)</el-radio-button>
                    <el-radio-button label="or">或者 (OR)</el-radio-button>
                </el-radio-group>
            </div>
            <div class="action-buttons">
                <el-button @click="cancelSearch">
                    取消
                </el-button>
                <el-button type="primary" :icon="Search" @click="applySearch" :loading="loading">
                    搜索
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search, Plus, Delete } from '@element-plus/icons-vue'
import SearchConditionBuilder from './SearchConditionBuilder.vue'

// Props
interface Props {
    show?: boolean
    tableColumns?: string[]
    searchCapabilities?: { [key: string]: string[] }
    loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    show: false,
    tableColumns: () => [],
    searchCapabilities: () => ({}),
    loading: false
})

// Emits
const emit = defineEmits<{
    'search': [conditions: any[], logicOperator: string]
    'cancel': []
}>()

// 状态
const conditions = ref<Array<{ id: number; field: string; operator: string; value: any }>>([])
const logicOperator = ref<'and' | 'or'>('and')
let conditionId = 0

// 计算属性
const hasValidConditions = computed(() => {
    return conditions.value.some(condition => 
        condition.field && condition.operator && condition.value !== undefined && condition.value !== ''
    )
})

// 添加条件
const addCondition = () => {
    conditions.value.push({
        id: ++conditionId,
        field: '',
        operator: '',
        value: ''
    })
}

// 更新条件
const updateCondition = (index: number, newCondition: any) => {
    conditions.value[index] = { ...conditions.value[index], ...newCondition }
}

// 删除条件
const removeCondition = (index: number) => {
    conditions.value.splice(index, 1)
}

// 清空所有条件
const clearAllConditions = () => {
    conditions.value = []
}

// 应用搜索
const applySearch = () => {
    if (!hasValidConditions.value) {
        return
    }

    // 构建搜索条件对象
    const searchConditions = buildSearchConditions()
    emit('search', searchConditions, logicOperator.value)
}

// 构建搜索条件
const buildSearchConditions = () => {
    const validConditions = conditions.value.filter(condition => 
        condition.field && condition.operator && condition.value !== undefined && condition.value !== ''
    )

    if (validConditions.length === 0) {
        return []
    }

    if (validConditions.length === 1) {
        return [buildSingleCondition(validConditions[0])]
    }

    // 多个条件使用逻辑操作符组合
    const combinedCondition: any = {}
    combinedCondition[`$${logicOperator.value}`] = validConditions.map(buildSingleCondition)

    return [combinedCondition]
}

// 构建单个条件
const buildSingleCondition = (condition: any) => {
    const fieldCondition: any = {}
    
    // 根据操作符构建条件
    switch (condition.operator) {
        case 'eq':
            fieldCondition['$eq'] = condition.value
            break
        case 'ne':
            fieldCondition['$ne'] = condition.value
            break
        case 'like':
            fieldCondition['$like'] = `%${condition.value}%`
            break
        case 'gt':
            fieldCondition['$gt'] = condition.value
            break
        case 'lt':
            fieldCondition['$lt'] = condition.value
            break
        case 'gte':
            fieldCondition['$gte'] = condition.value
            break
        case 'lte':
            fieldCondition['$lte'] = condition.value
            break
        default:
            fieldCondition['$eq'] = condition.value
    }

    return {
        [condition.field]: fieldCondition
    }
}

// 取消搜索
const cancelSearch = () => {
    emit('cancel')
}

// 监听显示状态变化
watch(() => props.show, (newShow) => {
    if (!newShow) {
        // 隐藏时清空条件
        clearAllConditions()
    }
})
</script>

<style scoped>
.advanced-search-panel {
    background: var(--el-bg-color-page);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.panel-header h4 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-weight: 600;
}

.header-actions {
    display: flex;
    gap: 8px;
}

.conditions-container {
    margin-bottom: 16px;
}

.condition-item {
    margin-bottom: 12px;
}

.empty-state {
    text-align: center;
    padding: 40px 0;
}

.panel-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-light);
}

.logic-operator {
    flex: 1;
}

.action-buttons {
    display: flex;
    gap: 8px;
}

@media (max-width: 768px) {
    .panel-actions {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
    }
    
    .logic-operator {
        display: flex;
        justify-content: center;
    }
}
</style>
