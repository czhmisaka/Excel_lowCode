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

                    <!-- 获取所有表映射关系 -->
                    <el-card class="api-card">
                        <template #header>
                            <div class="api-header">
                                <el-tag type="success">GET</el-tag>
                                <span>/api/mappings</span>
                            </div>
                        </template>
                        <div class="api-detail">
                            <p><strong>描述：</strong>获取所有Excel文件与动态表的映射关系</p>
                            <p><strong>参数：</strong>无</p>
                            <p><strong>响应：</strong></p>
                            <pre><code>{
                        "success": true,
                        "data": [
                        {
                        "id": 1,
                        "tableName": "员工信息表",
                        "hashValue": "abc123def456...",
                        "createdAt": "2025-09-27T23:11:16.000Z",
                        "updatedAt": "2025-09-27T23:11:16.000Z"
                        }
                        ],
                        "total": 1
                        }</code></pre>
                        </div>
                    </el-card>

                    <!-- 获取表映射关系详情 -->
                    <el-card class="api-card">
                        <template #header>
                            <div class="api-header">
                                <el-tag type="success">GET</el-tag>
                                <span>/api/mappings/{hash}</span>
                            </div>
                        </template>
                        <div class="api-detail">
                            <p><strong>描述：</strong>根据哈希值获取特定的表映射关系详情</p>
                            <p><strong>参数：</strong></p>
                            <ul>
                                <li><code>hash</code> (路径参数) - 表的哈希值</li>
                            </ul>
                            <p><strong>响应：</strong></p>
                            <pre><code>{
                        "success": true,
                        "data": {
                        "id": 1,
                        "tableName": "员工信息表",
                        "hashValue": "abc123def456...",
                        "createdAt": "2025-09-27T23:11:16.000Z",
                        "updatedAt": "2025-09-27T23:11:16.000Z"
                        }
                        }</code></pre>
                        </div>
                    </el-card>

                    <!-- 获取表列信息 -->
                    <el-card class="api-card">
                        <template #header>
                            <div class="api-header">
                                <el-tag type="success">GET</el-tag>
                                <span>/api/mappings/{hash}/columns</span>
                            </div>
                        </template>
                        <div class="api-detail">
                            <p><strong>描述：</strong>根据哈希值获取表的列定义信息，用于前端表单配置</p>
                            <p><strong>参数：</strong></p>
                            <ul>
                                <li><code>hash</code> (路径参数) - 表的哈希值</li>
                            </ul>
                            <p><strong>响应：</strong></p>
                            <pre><code>{
                        "success": true,
                        "data": [
                        {
                        "name": "name",
                        "type": "string",
                        "nullable": true,
                        "defaultValue": null
                        }
                        ]
                        }</code></pre>
                        </div>
                    </el-card>

                    <!-- 更新表名 -->
                    <el-card class="api-card">
                        <template #header>
                            <div class="api-header">
                                <el-tag type="warning">PUT</el-tag>
                                <span>/api/mappings/{hash}</span>
                            </div>
                        </template>
                        <div class="api-detail">
                            <p><strong>描述：</strong>根据哈希值更新表映射关系的表名</p>
                            <p><strong>参数：</strong></p>
                            <ul>
                                <li><code>hash</code> (路径参数) - 表的哈希值</li>
                                <li><code>tableName</code> (请求体) - 新的表名</li>
                            </ul>
                            <p><strong>响应：</strong></p>
                            <pre><code>{
                        "success": true,
                        "message": "表名更新成功",
                        "data": {
                        "id": 1,
                        "tableName": "新的表名",
                        "hashValue": "abc123def456...",
                        "createdAt": "2025-09-27T23:11:16.000Z",
                        "updatedAt": "2025-09-28T16:42:00.000Z"
                        }
                        }</code></pre>
                        </div>
                    </el-card>

                    <!-- 删除表映射关系 -->
                    <el-card class="api-card">
                        <template #header>
                            <div class="api-header">
                                <el-tag type="danger">DELETE</el-tag>
                                <span>/api/mappings/{hash}</span>
                            </div>
                        </template>
                        <div class="api-detail">
                            <p><strong>描述：</strong>根据哈希值删除表映射关系，并同步删除对应的数据表</p>
                            <p><strong>参数：</strong></p>
                            <ul>
                                <li><code>hash</code> (路径参数) - 表的哈希值</li>
                            </ul>
                            <p><strong>响应：</strong></p>
                            <pre><code>{
                        "success": true,
                        "message": "映射关系删除成功",
                        "data": {
                        "id": 1,
                        "tableName": "员工信息表",
                        "hashValue": "abc123def456...",
                        "originalFileName": "员工信息表.xlsx",
                        "tableDropped": true,
                        "deletedAt": "2025-09-28T02:30:00.000Z"
                        }
                        }</code></pre>
                        </div>
                    </el-card>

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
                                <el-form-item label="选择表">
                                    <div class="table-selector">
                                        <el-select v-model="testConfig.selectedTable" placeholder="请选择表"
                                            style="width: 300px; margin-right: 10px;" @change="handleTableChange"
                                            filterable>
                                            <el-option v-for="table in availableTables" :key="table.hashValue"
                                                :label="table.tableName" :value="table" />
                                        </el-select>
                                        <el-button v-if="testConfig.hash" @click="copyHash" type="primary" link
                                            :disabled="!testConfig.hash">
                                            <el-icon>
                                                <DocumentCopy />
                                            </el-icon>
                                            复制Hash
                                        </el-button>
                                    </div>
                                </el-form-item>
                                <el-form-item label="Hash值">
                                    <el-input v-model="testConfig.hash" placeholder="或手动输入哈希值" style="width: 300px;"
                                        @input="handleManualHashInput" />
                                </el-form-item>
                                <el-form-item label="选择接口">
                                    <el-radio-group v-model="selectedApi">
                                        <el-radio label="query">查询数据</el-radio>
                                        <el-radio label="add">新增数据</el-radio>
                                        <el-radio label="update">更新数据</el-radio>
                                        <el-radio label="delete">删除数据</el-radio>
                                        <el-radio label="columns">获取列信息</el-radio>
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
                        <div class="curl-command">
                            <h4>cURL 调用指令</h4>
                            <div class="curl-actions">
                                <el-button @click="copyCurlCommand" type="primary" link>
                                    <el-icon>
                                        <DocumentCopy />
                                    </el-icon>
                                    复制cURL指令
                                </el-button>
                            </div>
                            <pre class="json-preview">{{ generatedCurlCommand }}</pre>
                        </div>
                        <div class="test-buttons">
                            <el-button type="primary" @click="executeTest" :loading="testing"
                                :disabled="!testConfig.hash">
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
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Remove, VideoPlay, Refresh, DocumentCopy } from '@element-plus/icons-vue'
import { apiService } from '@/services/api'

// 测试配置
const testConfig = reactive({
    hash: '',
    selectedTable: null as any
})

// 可用表列表
const availableTables = ref<any[]>([])
const loadingTables = ref(false)

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

// 生成cURL命令
const generatedCurlCommand = computed(() => {
    if (!testResult.value) return ''

    const requestData = JSON.parse(testResult.value.request)
    const baseUrl = 'http://localhost:3000' // 后端服务地址

    let curlCommand = ''

    switch (selectedApi.value) {
        case 'query':
            const queryParams = new URLSearchParams()
            if (requestData.params.page) queryParams.append('page', requestData.params.page.toString())
            if (requestData.params.limit) queryParams.append('limit', requestData.params.limit.toString())
            if (requestData.params.search) queryParams.append('search', requestData.params.search)

            const queryString = queryParams.toString()
            const url = `${baseUrl}/api/data/${requestData.hash}${queryString ? `?${queryString}` : ''}`

            curlCommand = `curl -X GET "${url}"`
            break

        case 'add':
            curlCommand = `curl -X POST "${baseUrl}/api/data/${requestData.hash}/add" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(requestData.data)}'`
            break

        case 'update':
            curlCommand = `curl -X PUT "${baseUrl}/api/data/${requestData.hash}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify({ conditions: requestData.conditions, updates: requestData.updates })}'`
            break

        case 'delete':
            curlCommand = `curl -X DELETE "${baseUrl}/api/data/${requestData.hash}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify({ conditions: requestData.conditions })}'`
            break

        case 'columns':
            curlCommand = `curl -X GET "${baseUrl}/api/mappings/${requestData.hash}/columns"`
            break
    }

    return curlCommand
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

            case 'columns':
                requestData = {
                    hash: testConfig.hash
                }
                response = await apiService.getTableColumns(testConfig.hash)
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

// 获取可用表列表
const fetchAvailableTables = async () => {
    loadingTables.value = true
    try {
        const mappings = await apiService.getMappings()
        availableTables.value = mappings
    } catch (error: any) {
        console.error('获取表列表失败:', error)
        ElMessage.error(`获取表列表失败: ${error.message}`)
        availableTables.value = []
    } finally {
        loadingTables.value = false
    }
}

// 处理表选择变化
const handleTableChange = (selectedTable: any) => {
    if (selectedTable) {
        testConfig.hash = selectedTable.hashValue
    } else {
        testConfig.hash = ''
    }
}

// 处理手动输入哈希值
const handleManualHashInput = () => {
    // 当手动输入哈希值时，清空选择的表
    testConfig.selectedTable = null
}

// 复制哈希值到剪贴板
const copyHash = async () => {
    if (!testConfig.hash) {
        ElMessage.warning('没有可复制的哈希值')
        return
    }

    try {
        await navigator.clipboard.writeText(testConfig.hash)
        ElMessage.success('哈希值已复制到剪贴板')
    } catch (error) {
        console.error('复制失败:', error)
        // 降级方案：使用 document.execCommand
        const textArea = document.createElement('textarea')
        textArea.value = testConfig.hash
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

// 复制cURL命令到剪贴板
const copyCurlCommand = async () => {
    if (!generatedCurlCommand.value) {
        ElMessage.warning('没有可复制的cURL指令')
        return
    }

    try {
        await navigator.clipboard.writeText(generatedCurlCommand.value)
        ElMessage.success('cURL指令已复制到剪贴板')
    } catch (error) {
        console.error('复制cURL指令失败:', error)
        // 降级方案：使用 document.execCommand
        const textArea = document.createElement('textarea')
        textArea.value = generatedCurlCommand.value
        document.body.appendChild(textArea)
        textArea.select()
        try {
            document.execCommand('copy')
            ElMessage.success('cURL指令已复制到剪贴板')
        } catch (err) {
            ElMessage.error('复制失败，请手动复制')
        }
        document.body.removeChild(textArea)
    }
}

// 组件挂载时获取表列表
onMounted(() => {
    fetchAvailableTables()
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

.api-test {
    min-width: 600px;
    max-width: 1200px;
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

.table-selector {
    display: flex;
    align-items: center;
    gap: 10px;
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
    word-wrap: break-word;
    word-break: break-all;
    white-space: pre-wrap;
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
    flex-direction: column;
    gap: 20px;
}

.test-buttons {
    display: flex;
    gap: 10px;
    align-items: center;
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

.curl-command {
    margin-bottom: 20px;
}

.curl-command h4 {
    margin-bottom: 10px;
    color: #303133;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.curl-actions {
    margin-bottom: 10px;
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

    .test-buttons {
        flex-direction: column;
        align-items: stretch;
    }

    .test-buttons .el-button {
        width: 100%;
        margin-bottom: 10px;
    }

    .table-selector {
        flex-direction: column;
        align-items: stretch;
    }

    .table-selector .el-select {
        width: 100% !important;
        margin-right: 0 !important;
        margin-bottom: 10px;
    }

    .curl-command h4 {
        flex-direction: column;
        align-items: flex-start;
    }

    .json-preview {
        font-size: 12px;
        padding: 10px;
    }

    .api-test {
        min-width: unset;
        max-width: unset;
    }
}

@media (max-width: 480px) {
    .api-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
    }

    .config-section .el-form-item {
        margin-bottom: 15px;
    }

    .config-section .el-form-item__label {
        width: 80px !important;
    }

    .config-section .el-input,
    .config-section .el-select {
        width: 100% !important;
    }
}
</style>
