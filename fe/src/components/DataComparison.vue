<template>
    <div class="data-comparison">
        <div class="comparison-content">
            <div class="old-data">
                <h4>操作前数据</h4>
                <div v-if="tableStructure.columns.length > 0" class="data-table">
                    <el-table :data="formattedOldData" border stripe size="small" max-height="300">
                        <el-table-column prop="fieldName" label="字段名" width="150" />
                        <el-table-column prop="fieldType" label="类型" width="80">
                            <template #default="{ row }">
                                <el-tag size="small" :type="getTypeTag(row.fieldType)">
                                    {{ row.fieldType }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="value" label="值" min-width="200">
                            <template #default="{ row }">
                                <span :class="{ 'changed-value': row.isChanged }">
                                    {{ row.value }}
                                </span>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
                <div v-else class="no-data">
                    <pre>{{ formatJsonData(oldData) }}</pre>
                </div>
            </div>

            <div class="new-data">
                <h4>操作后数据</h4>
                <div v-if="tableStructure.columns.length > 0" class="data-table">
                    <el-table :data="formattedNewData" border stripe size="small" max-height="300">
                        <el-table-column prop="fieldName" label="字段名" width="150" />
                        <el-table-column prop="fieldType" label="类型" width="80">
                            <template #default="{ row }">
                                <el-tag size="small" :type="getTypeTag(row.fieldType)">
                                    {{ row.fieldType }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="value" label="值" min-width="200">
                            <template #default="{ row }">
                                <span :class="{ 'changed-value': row.isChanged }">
                                    {{ row.value }}
                                </span>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
                <div v-else class="no-data">
                    <pre>{{ formatJsonData(newData) }}</pre>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ColumnDefinition } from '@/services/api'

interface Props {
    oldData?: any
    newData?: any
    tableStructure: {
        columns: ColumnDefinition[]
        tableName: string
    }
    operationType: string
}

const props = defineProps<Props>()

// 格式化数据为表格格式
const formattedOldData = computed(() => {
    return formatDataForTable(props.oldData, props.tableStructure.columns, props.operationType)
})

const formattedNewData = computed(() => {
    return formatDataForTable(props.newData, props.tableStructure.columns, props.operationType)
})

// 根据字段类型获取标签类型
const getTypeTag = (type: string) => {
    const tagMap: Record<string, string> = {
        string: 'primary',
        number: 'success',
        date: 'warning',
        boolean: 'info',
        default: ''
    }
    return tagMap[type] || tagMap.default
}

// 格式化数据为表格格式
const formatDataForTable = (data: any, columns: ColumnDefinition[], operationType: string) => {
    if (!data) {
        // 对于删除操作，显示所有字段为空
        if (operationType === 'delete') {
            return columns.map(column => ({
                fieldName: column.name,
                fieldType: column.type,
                value: '-',
                isChanged: false
            }))
        }
        return []
    }

    const parsedData = typeof data === 'string' ? JSON.parse(data) : data

    return columns.map(column => {
        const value = parsedData[column.name]
        const isChanged = checkIfFieldChanged(column.name, props.oldData, props.newData)

        return {
            fieldName: column.name,
            fieldType: column.type,
            value: formatValue(value, column.type),
            isChanged
        }
    })
}

// 检查字段是否发生变化
const checkIfFieldChanged = (fieldName: string, oldData: any, newData: any) => {
    if (!oldData || !newData) return false

    const oldParsed = typeof oldData === 'string' ? JSON.parse(oldData) : oldData
    const newParsed = typeof newData === 'string' ? JSON.parse(newData) : newData

    return oldParsed[fieldName] !== newParsed[fieldName]
}

// 格式化值显示
const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined || value === '') {
        return '-'
    }

    switch (type) {
        case 'date':
            return new Date(value).toLocaleDateString('zh-CN')
        case 'boolean':
            return value ? '是' : '否'
        default:
            return String(value)
    }
}

// 备用格式化方法（当没有表结构信息时使用）
const formatJsonData = (data: any) => {
    if (!data) return '-'
    try {
        return JSON.stringify(data, null, 2)
    } catch {
        return data
    }
}
</script>

<style scoped>
.data-comparison {
    margin-top: 20px;
}

.comparison-content {
    display: flex;
    gap: 20px;
}

.old-data,
.new-data {
    flex: 1;
}

.old-data h4,
.new-data h4 {
    margin-bottom: 8px;
    color: #606266;
    font-size: 14px;
    font-weight: 600;
}

.data-table {
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    overflow: hidden;
}

.no-data pre {
    background: #f5f7fa;
    padding: 12px;
    border-radius: 4px;
    border: 1px solid #e4e7ed;
    font-size: 12px;
    line-height: 1.4;
    max-height: 200px;
    overflow-y: auto;
    margin: 0;
}

.changed-value {
    background-color: #fff2e8;
    padding: 2px 4px;
    border-radius: 2px;
    font-weight: 600;
    color: #e6a23c;
}

:deep(.el-table .el-table__cell) {
    padding: 4px 8px;
}

:deep(.el-table .cell) {
    font-size: 12px;
    line-height: 1.2;
}
</style>
