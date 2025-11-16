<template>
    <div class="form-fill-container">
        <el-card class="form-card">
            <template #header>
                <div class="card-header">
                    <span class="form-title">数据录入表单</span>
                    <div class="form-info">
                        <el-tag v-if="tableInfo.tableName" type="primary">
                            {{ tableInfo.tableName }}
                        </el-tag>
                        <el-tag v-if="tableInfo.hash" type="info">
                            {{ tableInfo.hash }}
                        </el-tag>
                    </div>
                </div>
            </template>

            <!-- 加载状态 -->
            <div v-if="loading" class="loading-container">
                <el-skeleton :rows="5" animated />
            </div>

            <!-- 错误状态 -->
            <div v-else-if="error" class="error-container">
                <el-alert :title="error" type="error" show-icon :closable="false" />
                <div class="error-actions">
                    <el-button type="primary" @click="retryLoad">
                        <el-icon>
                            <Refresh />
                        </el-icon>
                        重新加载
                    </el-button>
                </div>
            </div>

            <!-- 表单内容 -->
            <div v-else-if="formFields.length > 0" class="form-content">
                <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" class="dynamic-form">
                    <el-form-item v-for="field in formFields" :key="field.name" :label="field.name" :prop="field.name"
                        :required="!field.nullable">
                        <!-- 文本输入框 -->
                        <el-input v-if="field.type === 'string'" v-model="formData[field.name]"
                            :placeholder="`请输入${field.name}`" clearable />

                        <!-- 数字输入框 -->
                        <el-input-number v-else-if="field.type === 'number'" v-model="formData[field.name]"
                            :placeholder="`请输入${field.name}`" controls-position="right" style="width: 100%" />

                        <!-- 日期选择器 -->
                        <el-date-picker v-else-if="field.type === 'date'" v-model="formData[field.name]" type="date"
                            :placeholder="`请选择${field.name}`" style="width: 100%" format="YYYY-MM-DD"
                            value-format="YYYY-MM-DD" />

                        <!-- 布尔值选择 -->
                        <el-radio-group v-else-if="field.type === 'boolean'" v-model="formData[field.name]">
                            <el-radio :label="true">是</el-radio>
                            <el-radio :label="false">否</el-radio>
                        </el-radio-group>

                        <!-- 默认文本输入框 -->
                        <el-input v-else v-model="formData[field.name]" :placeholder="`请输入${field.name}`" clearable />
                    </el-form-item>


                    <!-- 表单操作 -->
                    <el-form-item class="form-actions">
                        <el-button type="primary" @click="submitForm" :loading="submitting">
                            <el-icon>
                                <Check />
                            </el-icon>
                            提交数据
                        </el-button>
                        <el-button @click="resetForm">
                            <el-icon>
                                <Refresh />
                            </el-icon>
                            重置表单
                        </el-button>
                    </el-form-item>
                </el-form>
            </div>

            <!-- 无表单字段状态 -->
            <div v-else class="empty-container">
                <el-empty description="未找到可用的表单字段" />
            </div>
        </el-card>

        <!-- 提交成功提示 -->
        <el-dialog v-model="successDialogVisible" title="提交成功" width="400px" :show-close="false"
            :close-on-click-modal="false" :close-on-press-escape="false" append-to-body>
            <div class="success-content">
                <el-result icon="success" title="数据提交成功" :sub-title="`成功添加了1条记录到 ${tableInfo.tableName}`">
                    <template #extra>
                        <el-button type="primary" @click="handleSuccessClose">
                            继续添加
                        </el-button>
                        <el-button @click="goBack">
                            返回
                        </el-button>
                    </template>
                </el-result>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules, type FormItemRule } from 'element-plus'
import { Refresh, Check } from '@element-plus/icons-vue'
import { apiService } from '@/services/api'

const route = useRoute()
const router = useRouter()

// 表单引用
const formRef = ref<FormInstance>()

// 状态管理
const loading = ref(true)
const error = ref('')
const submitting = ref(false)
const successDialogVisible = ref(false)

// 表信息
const tableInfo = ref({
    hash: '',
    tableName: ''
})

// 表单字段定义
interface FormField {
    name: string
    type: string
    nullable: boolean
    defaultValue?: any
}

const formFields = ref<FormField[]>([])

// 表单数据
const formData = ref<Record<string, any>>({})

// 表单验证规则
const formRules = ref<FormRules>({})

// 计算属性：是否有有效的表哈希
const hasValidTableHash = computed(() => {
    const tableHash = route.query.table as string
    return tableHash && tableHash.trim() !== ''
})

// 初始化表单数据
const initFormData = () => {
    formData.value = {}
    formFields.value.forEach(field => {
        formData.value[field.name] = field.defaultValue || ''
    })
}

// 初始化验证规则
const initFormRules = () => {
    const rules: FormRules = {}
    formFields.value.forEach(field => {
        const fieldRules: FormItemRule[] = []

        // 必填验证
        if (!field.nullable) {
            fieldRules.push({
                required: true,
                message: `${field.name}是必填项`,
                trigger: 'blur'
            })
        }

        // 根据字段类型添加验证规则
        switch (field.type) {
            case 'number':
                fieldRules.push({
                    type: 'number',
                    message: `${field.name}必须是数字`,
                    trigger: 'blur'
                })
                break
            case 'date':
                fieldRules.push({
                    type: 'date',
                    message: `${field.name}必须是有效日期`,
                    trigger: 'change'
                })
                break
        }

        rules[field.name] = fieldRules
    })
    formRules.value = rules
}


// 加载表结构信息
const loadTableStructure = async () => {
    if (!hasValidTableHash.value) {
        error.value = 'URL中缺少table参数或参数无效'
        loading.value = false
        return
    }

    const tableHash = route.query.table as string
    tableInfo.value.hash = tableHash

    try {
        loading.value = true
        error.value = ''

        // 使用公开表单API获取表结构信息（免认证）
        const structure = await apiService.getPublicFormStructure(tableHash)

        // 过滤掉ID字段（通常由系统自动生成）
        const filteredColumns = structure.columns.filter(col =>
            col.name.toLowerCase() !== 'id'
        )

        if (filteredColumns.length === 0) {
            error.value = '未找到可用的表单字段'
            return
        }

        formFields.value = filteredColumns.map(col => ({
            name: col.name,
            type: col.type,
            nullable: col.nullable,
            defaultValue: col.defaultValue
        }))

        // 设置表名信息
        tableInfo.value.tableName = structure.tableName

        // 初始化表单数据和验证规则
        initFormData()
        initFormRules()

    } catch (err: any) {
        console.error('加载表结构失败:', err)
        error.value = err.response?.data?.message || err.message || '加载表结构失败'
    } finally {
        loading.value = false
    }
}

// 提交表单
const submitForm = async () => {
    if (!formRef.value) return

    try {
        // 验证表单
        await formRef.value.validate()

        submitting.value = true

        // 准备提交数据（过滤空值）
        const submitData: Record<string, any> = {}
        Object.keys(formData.value).forEach(key => {
            const value = formData.value[key]
            if (value !== '' && value !== null && value !== undefined) {
                submitData[key] = value
            }
        })

        // 使用公开表单API提交数据（免认证）
        await apiService.submitPublicForm(tableInfo.value.hash, submitData)

        // 显示成功提示
        successDialogVisible.value = true

    } catch (err: any) {
        if (err && err.fields) {
            // 表单验证失败
            ElMessage.warning('请检查表单填写是否正确')
        } else {
            // API调用失败
            console.error('提交数据失败:', err)
            ElMessage.error(err.response?.data?.message || err.message || '提交数据失败')
        }
    } finally {
        submitting.value = false
    }
}

// 重置表单
const resetForm = () => {
    if (formRef.value) {
        formRef.value.resetFields()
    }
    initFormData()
}

// 重新加载
const retryLoad = () => {
    loadTableStructure()
}

// 处理成功关闭
const handleSuccessClose = () => {
    successDialogVisible.value = false
    resetForm()
}

// 返回上一页
const goBack = () => {
    router.back()
}

// 监听URL参数变化
onMounted(() => {
    loadTableStructure()
})

// 监听路由参数变化
import { watch } from 'vue'
watch(
    () => route.query.table,
    (newTableHash) => {
        if (newTableHash && newTableHash !== tableInfo.value.hash) {
            loadTableStructure()
        }
    }
)
</script>

<style scoped>
.form-fill-container {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
}

.form-card {
    min-height: 400px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
}

.form-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}

.form-info {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.loading-container,
.error-container,
.empty-container {
    padding: 40px 20px;
    text-align: center;
}

.error-actions {
    margin-top: 20px;
}

.form-content {
    padding: 20px 0;
}

.dynamic-form {
    max-width: 600px;
    margin: 0 auto;
}

.form-actions {
    margin-top: 30px;
    text-align: center;
}

.form-actions .el-form-item__content {
    justify-content: center;
}

.success-content {
    text-align: center;
}


/* 响应式设计 */
@media (max-width: 768px) {
    .form-fill-container {
        padding: 10px;
    }

    .card-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .form-info {
        margin-top: 10px;
    }

    .dynamic-form {
        :deep(.el-form-item__label) {
            width: 100px !important;
        }

        :deep(.el-form-item__content) {
            margin-left: 100px !important;
        }
    }
}

@media (max-width: 480px) {
    .dynamic-form {
        :deep(.el-form-item__label) {
            width: 80px !important;
        }

        :deep(.el-form-item__content) {
            margin-left: 80px !important;
        }
    }
}
</style>
