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
                    <el-table-column prop="hashValue" label="文件哈希" width="320">
                        <template #default="scope">
                            <div class="hash-cell">
                                <el-tooltip :content="scope.row.hashValue" placement="top">
                                    <span class="hash-value">{{ formatHash(scope.row.hashValue) }}</span>
                                </el-tooltip>
                                <el-button type="text" size="small" @click="copyHash(scope.row.hashValue)"
                                    class="copy-btn">
                                    <el-icon>
                                        <CopyDocument />
                                    </el-icon>
                                </el-button>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="originalFileName" label="原始文件名" min-width="200" />
                    <el-table-column prop="rowCount" label="记录数" width="100" />
                    <el-table-column prop="columnCount" label="列数" width="80" />
                    <el-table-column prop="createdAt" label="创建时间" width="180" />
                    <el-table-column prop="updatedAt" label="更新时间" width="180" />
                    <el-table-column label="操作" width="180">
                        <template #default="scope">
                            <el-button type="primary" link @click="viewColumnDefinitions(scope.row)">
                                查看结构
                            </el-button>
                            <el-button type="primary" link @click="openEditTableNameDialog(scope.row)">
                                编辑表名
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

                <div v-if="loadingStructure" class="loading-structure">
                    <el-skeleton :rows="5" animated />
                </div>
                <el-table v-else :data="selectedMapping.columnDefinitions" border>
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

        <!-- 编辑表名对话框 -->
        <el-dialog v-model="showEditTableNameDialog" title="编辑表名" width="500px">
            <div class="edit-table-name-form" v-if="editingMapping">
                <el-form :model="editTableNameForm" :rules="editTableNameRules" ref="editTableNameFormRef"
                    label-width="80px">
                    <el-form-item label="表名" prop="tableName">
                        <el-input v-model="editTableNameForm.tableName" placeholder="请输入表名" maxlength="255"
                            show-word-limit />
                    </el-form-item>
                </el-form>
            </div>

            <template #footer>
                <el-button @click="showEditTableNameDialog = false">取消</el-button>
                <el-button type="primary" @click="saveTableName" :loading="savingTableName">保存</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useFilesStore } from '@/stores/files'
import { apiService } from '@/services/api'
import { Refresh, Edit, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const filesStore = useFilesStore()

// 状态
const loading = ref(false)
const mappingList = ref<any[]>([])
const showColumnDialog = ref(false)
const selectedMapping = ref<any>(null)
const loadingStructure = ref(false)

// 编辑表名相关状态
const showEditTableNameDialog = ref(false)
const editingMapping = ref<any>(null)
const savingTableName = ref(false)
const editTableNameFormRef = ref()
const editTableNameForm = ref({
    tableName: ''
})

// 表名验证规则
const editTableNameRules = {
    tableName: [
        { required: true, message: '请输入表名', trigger: 'blur' },
        { min: 1, max: 255, message: '表名长度在 1 到 255 个字符', trigger: 'blur' }
    ]
}

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
const viewColumnDefinitions = async (mapping: any) => {
    loadingStructure.value = true
    try {
        // 从后端获取真实的表结构信息
        const structure = await apiService.getTableStructure(mapping.hashValue)

        selectedMapping.value = {
            ...mapping,
            columnDefinitions: structure.columns || []
        }
        showColumnDialog.value = true
    } catch (error) {
        console.error('获取表结构信息失败:', error)
        // 如果获取失败，使用模拟数据作为备用
        selectedMapping.value = mapping
        showColumnDialog.value = true
        ElMessage.warning('获取表结构信息失败，显示模拟数据')
    } finally {
        loadingStructure.value = false
    }
}

// 显示编辑表名对话框
const openEditTableNameDialog = (mapping: any) => {
    editingMapping.value = mapping
    editTableNameForm.value.tableName = mapping.tableName
    showEditTableNameDialog.value = true

    // 重置表单验证
    nextTick(() => {
        if (editTableNameFormRef.value) {
            editTableNameFormRef.value.clearValidate()
        }
    })
}

// 复制哈希值
const copyHash = async (hash: string) => {
    try {
        await navigator.clipboard.writeText(hash)
        ElMessage.success('哈希值已复制到剪贴板')
    } catch (error) {
        // 如果clipboard API不可用，使用备用方法
        const textArea = document.createElement('textarea')
        textArea.value = hash
        document.body.appendChild(textArea)
        textArea.select()
        try {
            document.execCommand('copy')
            ElMessage.success('哈希值已复制到剪贴板')
        } catch (err) {
            ElMessage.error('复制失败，请手动复制')
        }
        document.body.removeChild(textArea)
    }
}

// 保存表名（对话框版本）
const saveTableName = async () => {
    if (!editTableNameFormRef.value) return

    // 验证表单
    const valid = await editTableNameFormRef.value.validate()
    if (!valid) return

    const newTableName = editTableNameForm.value.tableName.trim()

    // 如果表名没有变化，直接关闭对话框
    if (newTableName === editingMapping.value.tableName) {
        showEditTableNameDialog.value = false
        return
    }

    savingTableName.value = true
    try {
        // 调用API更新表名
        const response = await apiService.updateMapping(editingMapping.value.hashValue, newTableName)

        if (response.success) {
            ElMessage.success('表名更新成功')
            // 更新列表中的表名
            editingMapping.value.tableName = newTableName
            showEditTableNameDialog.value = false
        } else {
            ElMessage.error(response.message || '更新表名失败')
        }
    } catch (error: any) {
        console.error('更新表名失败:', error)
        ElMessage.error(error.response?.data?.message || '更新表名失败')
    } finally {
        savingTableName.value = false
    }
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

.hash-cell {
    display: flex;
    align-items: center;
    gap: 8px;
}

.hash-value {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #666;
    cursor: pointer;
    flex: 1;
}

.copy-btn {
    opacity: 0.6;
    transition: opacity 0.2s;
}

.copy-btn:hover {
    opacity: 1;
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

.table-name-cell {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 4px 0;
    min-height: 32px;
}

.table-name-text {
    flex: 1;
}

.edit-icon {
    margin-left: 8px;
    color: #c0c4cc;
    opacity: 0;
    transition: opacity 0.2s;
}

.table-name-cell:hover .edit-icon {
    opacity: 1;
}

.loading-structure {
    padding: 20px 0;
}
</style>
