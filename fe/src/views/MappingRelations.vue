<template>
    <div class="mapping-relations">
        <el-card>
            <template #header>
                <div class="card-header">
                    <span>映射关系</span>
                    <el-button type="primary" @click="refreshMappings">
                        <el-icon>
                            <Refresh />
                        </el-icon>
                        刷新
                    </el-button>
                </div>
            </template>

            <div class="mapping-list">
                <el-table :data="mappingList" v-loading="loading">
                    <el-table-column prop="tableName" label="表名" width="200" />
                    <el-table-column prop="hashValue" label="文件哈希" width="280">
                        <template #default="scope">
                            <el-tooltip :content="scope.row.hashValue" placement="top">
                                <span class="hash-value">{{ formatHash(scope.row.hashValue) }}</span>
                            </el-tooltip>
                        </template>
                    </el-table-column>
                    <el-table-column prop="originalFileName" label="原始文件名" min-width="200" />
                    <el-table-column prop="rowCount" label="记录数" width="100" />
                    <el-table-column prop="columnCount" label="列数" width="80" />
                    <el-table-column prop="createdAt" label="创建时间" width="180" />
                    <el-table-column prop="updatedAt" label="更新时间" width="180" />
                    <el-table-column label="操作" width="120">
                        <template #default="scope">
                            <el-button type="primary" link @click="viewColumnDefinitions(scope.row)">
                                查看结构
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </el-card>

        <!-- 列定义对话框 -->
        <el-dialog v-model="showColumnDialog" title="表结构信息" width="600px">
            <div class="column-definitions" v-if="selectedMapping">
                <div class="table-info">
                    <h3>{{ selectedMapping.tableName }}</h3>
                    <p>文件: {{ selectedMapping.originalFileName }}</p>
                    <p>记录数: {{ selectedMapping.rowCount }} | 列数: {{ selectedMapping.columnCount }}</p>
                </div>

                <el-table :data="selectedMapping.columnDefinitions" border>
                    <el-table-column prop="name" label="列名" width="150" />
                    <el-table-column prop="type" label="数据类型" width="120" />
                    <el-table-column prop="nullable" label="可空" width="80">
                        <template #default="scope">
                            <el-tag :type="scope.row.nullable ? 'info' : 'warning'">
                                {{ scope.row.nullable ? '是' : '否' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="defaultValue" label="默认值" />
                </el-table>
            </div>

            <template #footer>
                <el-button @click="showColumnDialog = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFilesStore } from '@/stores/files'
import { Refresh } from '@element-plus/icons-vue'

const filesStore = useFilesStore()

// 状态
const loading = ref(false)
const mappingList = ref<any[]>([])
const showColumnDialog = ref(false)
const selectedMapping = ref<any>(null)

// 初始化数据
const initData = async () => {
    loading.value = true
    try {
        await filesStore.fetchMappings()
        mappingList.value = filesStore.fileList.map(file => ({
            tableName: file.tableName,
            hashValue: file.hash,
            originalFileName: file.originalFileName,
            rowCount: file.recordCount,
            columnCount: file.columnCount,
            createdAt: file.createdAt,
            updatedAt: file.createdAt, // 暂时使用创建时间
            columnDefinitions: generateColumnDefinitions(file.columnCount)
        }))
    } catch (error) {
        console.error('获取映射关系失败:', error)
    } finally {
        loading.value = false
    }
}

// 生成模拟的列定义（实际应该从后端获取）
const generateColumnDefinitions = (columnCount: number) => {
    const types = ['string', 'number', 'date', 'boolean']
    const definitions = []

    for (let i = 1; i <= columnCount; i++) {
        definitions.push({
            name: `column_${i}`,
            type: types[Math.floor(Math.random() * types.length)],
            nullable: Math.random() > 0.5,
            defaultValue: null
        })
    }

    return definitions
}

// 刷新映射关系
const refreshMappings = async () => {
    await initData()
}

// 格式化哈希值显示
const formatHash = (hash: string) => {
    if (hash.length > 20) {
        return `${hash.substring(0, 10)}...${hash.substring(hash.length - 10)}`
    }
    return hash
}

// 查看列定义
const viewColumnDefinitions = (mapping: any) => {
    selectedMapping.value = mapping
    showColumnDialog.value = true
}

onMounted(() => {
    initData()
})
</script>

<style scoped>
.mapping-relations {
    padding: 0;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.hash-value {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #666;
    cursor: pointer;
}

.table-info {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.table-info h3 {
    margin: 0 0 10px 0;
    color: #303133;
}

.table-info p {
    margin: 5px 0;
    color: #606266;
}
</style>
