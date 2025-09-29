<template>
    <div class="api-guide">
        <el-card>
            <template #header>
                <div class="card-header">
                    <span>数据表 CRUD API 指南</span>
                </div>
            </template>

            <div class="guide-content">
                <!-- API文档部分 -->
                <div class="api-docs">
                    <h3>API接口文档</h3>

                    <!-- 查询接口 -->
                    <el-card class="api-card">
                        <template #header>
                            <div class="api-header">
                                <el-tag type="success">GET</el-tag>
                                <span>/api/data/{hash}</span>
                            </div>
                        </template>
                        <div class="api-detail">
                            <p><strong>描述：</strong>根据哈希值查询对应表的数据（支持分页和条件查询）</p>
                            <p><strong>参数：</strong></p>
                            <ul>
                                <li><code>hash</code> (路径参数) - 表的哈希值</li>
                                <li><code>page</code> (查询参数) - 页码，默认1</li>
                                <li><code>limit</code> (查询参数) - 每页条数，默认10</li>
                                <li><code>search</code> (查询参数) - 搜索条件（JSON字符串）</li>
                            </ul>
                            <p><strong>响应：</strong></p>
                            <pre><code>{
                        "success": true,
                        "data": [...],
                        "pagination": {
                        "page": 1,
                        "limit": 10,
                        "total": 100,
                        "pages": 10
                        }
                        }</code></pre>
                        </div>
                    </el-card>

                    <!-- 新增接口 -->
                    <el-card class="api-card">
                        <template #header>
                            <div class="api-header">
                                <el-tag type="primary">POST</el-tag>
                                <span>/api/data/{hash}/add</span>
                            </div>
                        </template>
                        <div class="api-detail">
                            <p><strong>描述：</strong>向指定表中新增数据</p>
                            <p><strong>参数：</strong></p>
                            <ul>
                                <li><code>hash</code> (路径参数) - 表的哈希值</li>
                                <li><code>data</code> (请求体) - 新增数据对象</li>
                            </ul>
                            <p><strong>响应：</strong></p>
                            <pre><code>{
                        "success": true,
                        "message": "数据新增成功",
                        "data": { ... }
                        }</code></pre>
                        </div>
                    </el-card>

                    <!-- 更新接口 -->
                    <el-card class="api-card">
                        <template #header>
                            <div class="api-header">
                                <el-tag type="warning">PUT</el-tag>
                                <span>/api/data/{hash}</span>
                            </div>
                        </template>
                        <div class="api-detail">
                            <p><strong>描述：</strong>根据哈希值和条件更新数据</p>
                            <p><strong>参数：</strong></p>
                            <ul>
                                <li><code>hash</code> (路径参数) - 表的哈希值</li>
                                <li><code>conditions</code> (请求体) - 更新条件</li>
                                <li><code>updates</code> (请求体) - 更新内容</li>
                            </ul>
                            <p><strong>响应：</strong></p>
                            <pre><code>{
                        "success": true,
                        "message": "数据更新成功",
                        "affectedRows": 1
                        }</code></pre>
                        </div>
                    </el-card>

                    <!-- 删除接口 -->
                    <el-card class="api-card">
                        <template #header>
                            <div class="api-header">
                                <el-tag type="danger">DELETE</el-tag>
                                <span>/api/data/{hash}</span>
                            </div>
                        </template>
                        <div class="api-detail">
                            <p><strong>描述：</strong>根据条件删除数据</p>
                            <p><strong>参数：</strong></p>
                            <ul>
                                <li><code>hash</code> (路径参数) - 表的哈希值</li>
                                <li><code>conditions</code> (请求体) - 删除条件</li>
                            </ul>
                            <p><strong>响应：</strong></p>
                            <pre><code>{
                        "success": true,
                        "message": "数据删除成功",
                        "affectedRows": 1
                        }</code></pre>
                        </div>
                    </el-card>
                </div>

                <!-- API测试部分 -->
                <div class="api-test">
                    <h3>API测试调用</h3>

                    <!-- 基础配置 -->
                    <el-card class="test-card">
                        <template #header>
                            <span>基础配置</span>
                        </template>
                        <div class="config-section">
                            <el-form :model="testConfig" label-width="100px">
                                <el-form-item label="Hash值">
                                    <el-input v-model="testConfig.hash" placeholder="请输入表的哈希值" style="width: 300px;" />
                                </el-form-item>
                                <el-form-item label="选择接口">
                                    <el-radio-group v-model="selectedApi">
                                        <el-radio label="query">查询数据</el-radio>
                                        <el-radio label="add">新增数据</el-radio>
                                        <el-radio label="update">更新数据</el-radio>
                                        <el-radio label="delete">删除数据</el-radio>
                                    </el-radio-group>
                                </el-form-item>
                            </el-form>
                        </div>
                    </el-card>

                    <!-- 查询参数构建 -->
                    <el-card class="test-card" v-if="selectedApi === 'query'">
                        <template #header>
                            <span>查询参数构建</span>
                        </template>
                        <div class="query-builder">
                            <!-- 分页参数 -->
                            <div class="pagination-section">
                                <el-form :model="queryParams" label-width="80px">
                                    <el-form-item label="页码">
                                        <el-input-number v-model="queryParams.page" :min="1" />
                                    </el-form-item>
                                    <el-form-item label="每页条数">
                                        <el-input-number v-model="queryParams.limit" :min="1" :max="100" />
                                    </el-form-item>
                                </el-form>
                            </div>

                            <!-- 搜索条件构建 -->
                            <div class="search-section">
                                <h4>搜索条件</h4>
                                <div v-for="(condition, index) in searchConditions" :key="index" class="condition-row">
                                    <el-select v-model="condition.column" placeholder="选择列"
                                        style="width: 150px; margin-right: 10px;">
                                        <el-option label="全部列" value="all" />
                                        <el-option v-for="col in availableColumns" :key="col" :label="col"
                                            :value="col" />
                                    </el-select>
                                    <el-select v-model="condition.operator" placeholder="操作符"
                                        style="width: 120px; margin-right: 10px;">
                                        <el-option label="包含" value="like" />
                                        <el-option label="等于" value="eq" />
                                        <el-option label="不等于" value="ne" />
                                        <el-option label="大于" value="gt" />
                                        <el-option label="小于" value="lt" />
                                    </el-select>
                                    <el-input v-model="condition.value" placeholder="输入值"
                                        style="width: 200px; margin-right: 10px;" />
                                    <el-button @click="removeSearchCondition(index)" type="danger" link>
                                        <el-icon>
                                            <Remove />
                                        </el-icon>
                                    </el-button>
                                </div>
                                <div class="condition-actions">
                                    <el-button @click="addSearchCondition" type="primary" link>
                                        <el-icon>
                                            <Plus />
                                        </el-icon>
                                        添加条件
                                    </el-button>
                                    <el-button @click="clearSearchConditions">
                                        清除条件
                                    </el-button>
                                </div>
                            </div>

                            <!-- 生成的查询条件预览 -->
                            <div class="preview-section" v-if="hasSearchConditions">
                                <h4>生成的查询条件</h4>
                                <pre class="json-preview">{{ generatedSearchCondition }}</pre>
                            </div>
                        </div>
                    </el-card>

                    <!-- 新增数据参数 -->
                    <el-card class="test-card" v-if="selectedApi === 'add'">
                        <template #header>
                            <span>新增数据参数</span>
                        </template>
                        <div class="data-input">
                            <el-form :model="addDataForm" label-width="100px">
                                <el-form-item v-for="col in availableColumns" :key="col" :label="col">
                                    <el-input v-model="addDataForm[col]" :placeholder="`请输入${col}`" />
                                </el-form-item>
                            </el-form>
                        </div>
                    </el-card>

                    <!-- 更新数据参数 -->
                    <el-card class="test-card" v-if="selectedApi === 'update'">
                        <template #header>
                            <span>更新数据参数</span>
                        </template>
                        <div class="update-input">
                            <h4>更新条件</h4>
                            <div class="condition-section">
                                <el-form :model="updateConditions" label-width="100px">
                                    <el-form-item v-for="col in availableColumns" :key="col" :label="col">
                                        <el-input v-model="updateConditions[col]" :placeholder="`条件值`" />
                                    </el-form-item>
                                </el-form>
                            </div>

                            <h4>更新内容</h4>
                            <div class="update-section">
                                <el-form :model="updateData" label-width="100px">
                                    <el-form-item v-for="col in availableColumns" :key="col" :label="col">
                                        <el-input v-model="updateData[col]" :placeholder="`新值`" />
                                    </el-form-item>
                                </el-form>
                            </div>
                        </div>
                    </el-card>

                    <!-- 删除数据参数 -->
                    <el-card class="test-card" v-if="selectedApi === 'delete'">
                        <template #header>
                            <span>删除数据参数</span>
                        </template>
                        <div class="delete-input">
                            <h4>删除条件</h4>
                            <div class="condition-section">
                                <el-form :model="deleteConditions" label-width="100px">
                                    <el-form-item v-for="col in availableColumns" :key="col" :label="col">
                                        <el-input v-model="deleteConditions[col]" :placeholder="`条件值`" />
                                    </el-form-item>
                                </el-form>
                            </div>
                        </div>
                    </el-card>

                    <!-- 测试按钮和结果 -->
                    <div class="test-actions">
                        <el-button type="primary" @click="executeTest" :loading="testing" :disabled="!testConfig.hash">
                            <el-icon>
                                <VideoPlay />
                            </el-icon>
                            执行测试
                        </el-button>
                        <el-button @click="resetTest">
                            <el-icon>
                                <Refresh />
                            </el-icon>
                            重置
                        </el-button>
                    </div>

                    <!-- 测试结果 -->
                    <el-card class="result-card" v-if="testResult">
                        <template #header>
                            <span>测试结果</span>
                        </template>
                        <div class="result-content">
                            <div class="request-info">
                                <h4>请求信息</h4>
                                <pre class="json-preview">{{ testResult.request }}</pre>
                            </div>
                            <div class="response-info">
                                <h4>响应信息</h4>
                                <pre class="json-preview">{{ testResult.response }}</pre>
                            </div>
                        </div>
                    </el-card>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Remove, VideoPlay, Refresh } from '@element-plus/icons-vue'
import { apiService } from '@/services/api'

// 测试配置
const testConfig = reactive({
    hash: ''
})

// 选择的API
const selectedApi = ref('query')

// 查询参数
const queryParams = reactive({
    page: 1,
    limit: 10
})

// 搜索条件
const searchConditions = ref<any[]>([
    { column: '', operator: 'like', value: '' }
])

// 可用列（动态从API获取）
const availableColumns = ref<string[]>([])

// 新增数据表单
const addDataForm = reactive<Record<string, string>>({})

// 更新数据参数
const updateConditions = reactive<Record<string, string>>({})
const updateData = reactive<Record<string, string>>({})

// 删除数据参数
const deleteConditions = reactive<Record<string, string>>({})

// 测试状态
const testing = ref(false)
const testResult = ref<any>(null)

// 计算属性
const hasSearchConditions = computed(() => {
    return searchConditions.value.some(condition =>
        condition.column && condition.value.trim() !== ''
    )
})

const generatedSearchCondition = computed(() => {
    if (!hasSearchConditions.value) return '{}'

    const conditions: any = {}

    searchConditions.value.forEach(condition => {
        if (condition.column && condition.value.trim() !== '') {
            const operator = getOperatorSymbol(condition.operator)
            if (condition.column === 'all') {
                // 在所有列中搜索
                conditions.$or = availableColumns.value.map(col => ({
                    [col]: { [operator]: `%${condition.value}%` }
                }))
            } else {
                conditions[condition.column] = { [operator]: condition.value }
            }
        }
    })

    return JSON.stringify(conditions, null, 2)
})

// 方法
const addSearchCondition = () => {
    searchConditions.value.push({ column: '', operator: 'like', value: '' })
}

const removeSearchCondition = (index: number) => {
    if (searchConditions.value.length > 1) {
        searchConditions.value.splice(index, 1)
    } else {
        searchConditions.value[0] = { column: '', operator: 'like', value: '' }
    }
}

const clearSearchConditions = () => {
    searchConditions.value = [{ column: '', operator: 'like', value: '' }]
}

const getOperatorSymbol = (operator: string): string => {
    const operatorMap: { [key: string]: string } = {
        'like': '$like',
        'eq': '$eq',
        'ne': '$ne',
        'gt': '$gt',
        'lt': '$lt'
    }
    return operatorMap[operator] || '$like'
}

const executeTest = async () => {
    if (!testConfig.hash) {
        ElMessage.warning('请输入Hash值')
        return
    }

    testing.value = true
    testResult.value = null

    let requestData: any = {}

    try {
        let response: any

        switch (selectedApi.value) {
            case 'query':
                requestData = {
                    hash: testConfig.hash,
                    params: {
                        page: queryParams.page,
                        limit: queryParams.limit,
                        search: hasSearchConditions.value ? generatedSearchCondition.value : undefined
                    }
                }
                response = await apiService.getData(testConfig.hash, {
                    page: queryParams.page,
                    limit: queryParams.limit,
                    search: hasSearchConditions.value ? JSON.parse(generatedSearchCondition.value) : undefined
                })
                break

            case 'add':
                requestData = {
                    hash: testConfig.hash,
                    data: { ...addDataForm }
                }
                response = await apiService.addData(testConfig.hash, addDataForm)
                break

            case 'update':
                requestData = {
                    hash: testConfig.hash,
                    conditions: { ...updateConditions },
                    updates: { ...updateData }
                }
                response = await apiService.updateData(testConfig.hash, updateConditions, updateData)
                break

            case 'delete':
                requestData = {
                    hash: testConfig.hash,
                    conditions: { ...deleteConditions }
                }
                response = await apiService.deleteData(testConfig.hash, deleteConditions)
                break
        }

        testResult.value = {
            request: JSON.stringify(requestData, null, 2),
            response: JSON.stringify(response, null, 2)
        }

        ElMessage.success('API调用成功')
    } catch (error: any) {
        ElMessage.error(`API调用失败: ${error.message}`)
        testResult.value = {
            request: JSON.stringify(requestData, null, 2),
            response: JSON.stringify({ error: error.message }, null, 2)
        }
    } finally {
        testing.value = false
    }
}

const resetTest = () => {
    testConfig.hash = ''
    selectedApi.value = 'query'
    queryParams.page = 1
    queryParams.limit = 10
    searchConditions.value = [{ column: '', operator: 'like', value: '' }]
    Object.keys(addDataForm).forEach(key => delete addDataForm[key])
    Object.keys(updateConditions).forEach(key => delete updateConditions[key])
    Object.keys(updateData).forEach(key => delete updateData[key])
    Object.keys(deleteConditions).forEach(key => delete deleteConditions[key])
    testResult.value = null
}

// 获取表的列信息
const fetchTableColumns = async (hash: string) => {
    if (!hash) {
        availableColumns.value = []
        return
    }

    try {
        const columns = await apiService.getTableColumns(hash)
        availableColumns.value = columns.map(col => col.name)

        // 重置表单数据
        resetFormData()
    } catch (error: any) {
        console.error('获取列信息失败:', error)
        ElMessage.error(`获取列信息失败: ${error.message}`)
        availableColumns.value = []
    }
}

// 重置表单数据
const resetFormData = () => {
    Object.keys(addDataForm).forEach(key => delete addDataForm[key])
    Object.keys(updateConditions).forEach(key => delete updateConditions[key])
    Object.keys(updateData).forEach(key => delete updateData[key])
    Object.keys(deleteConditions).forEach(key => delete deleteConditions[key])

    // 重新初始化表单数据
    availableColumns.value.forEach(col => {
        addDataForm[col] = ''
        updateConditions[col] = ''
        updateData[col] = ''
        deleteConditions[col] = ''
    })
}

// 监听hash值变化
watch(() => testConfig.hash, (newHash) => {
    if (newHash) {
        fetchTableColumns(newHash)
    } else {
        availableColumns.value = []
        resetFormData()
    }
})
</script>

<style scoped>
.api-guide {
    padding: 0;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.guide-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.api-docs h3,
.api-test h3 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #303133;
    font-weight: 600;
}

.api-card {
    margin-bottom: 20px;
}

.api-header {
    display: flex;
    align-items: center;
    gap: 10px;
}

.api-detail {
    line-height: 1.6;
}

.api-detail ul {
    margin: 10px 0;
    padding-left: 20px;
}

.api-detail code {
    background-color: #f5f7fa;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
}

.api-detail pre {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 6px;
    border: 1px solid #e9ecef;
    overflow-x: auto;
    font-size: 14px;
    line-height: 1.4;
}

.test-card {
    margin-bottom: 20px;
}

.config-section {
    padding: 15px 0;
}

.query-builder {
    padding: 15px 0;
}

.pagination-section {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 6px;
}

.search-section {
    margin-bottom: 20px;
}

.condition-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    padding: 10px;
    background-color: white;
    border-radius: 4px;
    border: 1px solid #e9ecef;
}

.condition-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
}

.preview-section {
    margin-top: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 6px;
}

.json-preview {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 6px;
    border: 1px solid #e9ecef;
    overflow-x: auto;
    font-size: 14px;
    line-height: 1.4;
    margin: 0;
}

.data-input,
.update-input,
.delete-input {
    padding: 15px 0;
}

.condition-section,
.update-section {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 6px;
}

.test-actions {
    margin: 20px 0;
    display: flex;
    gap: 10px;
}

.result-card {
    margin-top: 20px;
}

.result-content {
    padding: 15px 0;
}

.request-info,
.response-info {
    margin-bottom: 20px;
}

.request-info h4,
.response-info h4 {
    margin-bottom: 10px;
    color: #303133;
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .guide-content {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .condition-row {
        flex-direction: column;
        align-items: stretch;
    }

    .condition-row>* {
        margin-bottom: 10px;
        margin-right: 0 !important;
    }

    .test-actions {
        flex-direction: column;
    }
}
</style>
