<template>
    <div class="search-condition-builder">
        <div class="condition-row">
            <!-- 字段选择 -->
            <el-select
                v-model="localCondition.field"
                placeholder="选择字段"
                class="field-select"
                @change="handleFieldChange"
                clearable
            >
                <el-option
                    v-for="column in tableColumns"
                    :key="column"
                    :label="column"
                    :value="column"
                />
            </el-select>

            <!-- 操作符选择 -->
            <el-select
                v-model="localCondition.operator"
                placeholder="选择操作符"
                class="operator-select"
                :disabled="!localCondition.field"
            >
                <el-option
                    v-for="operator in availableOperators"
                    :key="operator.value"
                    :label="operator.label"
                    :value="operator.value"
                />
            </el-select>

            <!-- 值输入 -->
            <div class="value-input">
                <el-input
                    v-if="!isBooleanField"
                    v-model="localCondition.value"
                    :placeholder="getValuePlaceholder()"
                    @input="handleValueChange"
                    clearable
                />
                <el-select
                    v-else
                    v-model="localCondition.value"
                    placeholder="选择值"
                    @change="handleValueChange"
                >
                    <el-option label="是" :value="true" />
                    <el-option label="否" :value="false" />
                </el-select>
            </div>

            <!-- 删除按钮 -->
            <el-button
                type="danger"
                :icon="Delete"
                circle
                @click="$emit('remove')"
                class="remove-button"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Delete } from '@element-plus/icons-vue'

// Props
interface Props {
    condition: {
        id: number
        field: string
        operator: string
        value: any
    }
    tableColumns: string[]
    searchCapabilities: { [key: string]: string[] }
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
    'update': [condition: any]
    'remove': []
}>()

// 本地状态
const localCondition = ref({ ...props.condition })

// 计算属性
const availableOperators = computed(() => {
    if (!localCondition.value.field) {
        return []
    }

    const fieldCapabilities = props.searchCapabilities[localCondition.value.field] || []
    
    const operatorMap: { [key: string]: { value: string; label: string } } = {
        'eq': { value: 'eq', label: '等于' },
        'ne': { value: 'ne', label: '不等于' },
        'like': { value: 'like', label: '包含' },
        'gt': { value: 'gt', label: '大于' },
        'lt': { value: 'lt', label: '小于' },
        'gte': { value: 'gte', label: '大于等于' },
        'lte': { value: 'lte', label: '小于等于' }
    }

    return fieldCapabilities.map(op => operatorMap[op] || { value: op, label: op })
})

const isBooleanField = computed(() => {
    // 根据字段名或搜索能力判断是否为布尔字段
    const field = localCondition.value.field
    if (!field) return false
    
    // 检查字段名是否包含布尔相关的关键词
    const booleanKeywords = ['is', 'has', 'enable', 'disable', 'active', 'inactive']
    return booleanKeywords.some(keyword => field.toLowerCase().includes(keyword))
})

// 方法
const handleFieldChange = () => {
    // 切换字段时重置操作符和值
    localCondition.value.operator = ''
    localCondition.value.value = ''
    emitUpdate()
}

const handleValueChange = () => {
    emitUpdate()
}

const getValuePlaceholder = () => {
    if (!localCondition.value.operator) {
        return '输入值'
    }
    
    switch (localCondition.value.operator) {
        case 'like':
            return '输入关键词'
        case 'gt':
        case 'lt':
        case 'gte':
        case 'lte':
            return '输入数值'
        default:
            return '输入值'
    }
}

const emitUpdate = () => {
    emit('update', { ...localCondition.value })
}

// 监听props变化
watch(() => props.condition, (newCondition) => {
    localCondition.value = { ...newCondition }
}, { deep: true })

// 监听本地状态变化
watch(localCondition, () => {
    emitUpdate()
}, { deep: true })
</script>

<style scoped>
.search-condition-builder {
    width: 100%;
}

.condition-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.field-select {
    flex: 2;
    min-width: 120px;
}

.operator-select {
    flex: 1;
    min-width: 100px;
}

.value-input {
    flex: 2;
    min-width: 150px;
}

.remove-button {
    flex-shrink: 0;
}

@media (max-width: 768px) {
    .condition-row {
        flex-direction: column;
        align-items: stretch;
    }
    
    .field-select,
    .operator-select,
    .value-input {
        flex: none;
        width: 100%;
    }
    
    .remove-button {
        align-self: flex-end;
    }
}
</style>
