<template>
  <div class="form-management fade-in-up">
    <!-- 页面头部 -->
    <div class="modern-card">
      <div class="compact-card-header">
        <h2 class="page-title">表单管理</h2>
        <p class="page-description">管理自定义表单定义，支持动态表单渲染和Hook处理</p>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="modern-toolbar">
      <div class="toolbar-content">
        <el-button type="primary" @click="handleCreateForm" class="modern-button" :icon="Plus">
          创建表单
        </el-button>
        <div class="toolbar-actions">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索表单名称或ID..."
            class="modern-input"
            style="width: 240px; margin-right: 12px;"
            :prefix-icon="Search"
            clearable
          />
          <el-button type="text" @click="refreshList" :icon="Refresh" title="刷新列表">
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- 表单列表 -->
    <div class="modern-card">
      <el-table
        :data="filteredForms"
        v-loading="loading"
        stripe
        class="modern-table"
        style="width: 100%"
      >
        <el-table-column prop="formId" label="表单ID" min-width="180" />
        <el-table-column prop="name" label="表单名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="tableMapping" label="关联表" min-width="150">
          <template #default="scope">
            <el-popover
              placement="top-start"
              trigger="hover"
              :width="300"
            >
              <template #reference>
                <span class="table-name-display">
                  {{ getTableName(scope.row.tableMapping) }}
                </span>
              </template>
              <div class="table-hash-popover">
                <div class="popover-title">表哈希值</div>
                <div class="hash-value">
                  {{ scope.row.tableMapping || '未关联' }}
                </div>
                <div class="popover-actions">
                  <el-button
                    type="primary"
                    link
                    size="small"
                    @click="copyTableHash(scope.row.tableMapping)"
                    :disabled="!scope.row.tableMapping"
                  >
                    复制哈希值
                  </el-button>
                </div>
              </div>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column prop="fieldCount" label="字段数" width="80" align="center">
          <template #default="scope">
            <el-tag size="small" type="info">{{ scope.row.fieldCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="hookCount" label="Hook数" width="80" align="center">
          <template #default="scope">
            <el-tag size="small" type="info">{{ scope.row.hookCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              link
              size="small"
              @click="handleEditForm(scope.row)"
              :icon="Edit"
            >
              编辑
            </el-button>
            <el-button
              type="success"
              link
              size="small"
              @click="handlePreviewForm(scope.row)"
              :icon="View"
            >
              预览
            </el-button>
            <el-button
              type="info"
              link
              size="small"
              @click="generateQRCode(scope.row)"
              :icon="Link"
              :loading="generatingQrCode"
            >
              二维码
            </el-button>
            <el-button
              type="warning"
              link
              size="small"
              @click="handleManageHooks(scope.row)"
              :icon="Connection"
            >
              Hook
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              @click="handleDeleteForm(scope.row)"
              :icon="Delete"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="modern-pagination" v-if="forms.length > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalForms"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && forms.length === 0" class="empty-state">
        <el-empty description="暂无表单数据">
          <el-button type="primary" @click="handleCreateForm" :icon="Plus">
            创建第一个表单
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 创建/编辑表单对话框 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="formDialogTitle"
      width="600px"
      class="modern-dialog"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form
        ref="formDialogRef"
        :model="formDialogData"
        :rules="formDialogRules"
        label-width="100px"
      >
        <el-form-item label="表单ID" prop="formId">
          <el-input
            v-model="formDialogData.formId"
            placeholder="请输入表单唯一标识"
            :disabled="isEditing"
          />
          <div class="form-tip">表单的唯一标识，创建后不可修改</div>
        </el-form-item>

        <el-form-item label="表单名称" prop="name">
          <el-input
            v-model="formDialogData.name"
            placeholder="请输入表单名称"
          />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formDialogData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入表单描述"
          />
        </el-form-item>

        <el-form-item label="关联数据表" prop="tableMapping">
          <el-select
            v-model="formDialogData.tableMapping"
            placeholder="请选择关联的数据表"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="mapping in tableMappings"
              :key="mapping.hashValue"
              :label="`${mapping.tableName} (${mapping.originalFileName})`"
              :value="mapping.hashValue"
            />
          </el-select>
          <div class="form-tip">选择此表单数据将存储到的数据表</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="formDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveForm" :loading="saving">
            {{ isEditing ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

        <!-- 表单预览对话框 -->
        <el-dialog
          v-model="previewDialogVisible"
          title="表单预览"
          width="800px"
          class="modern-dialog"
          append-to-body
        >
          <div v-if="previewFormData && previewFormData.definition">
            <DynamicFormRenderer
              :form-definition="getParsedFormDefinition(previewFormData.definition)"
              :show-actions="false"
              :disabled="false"
              label-width="120px"
            />
          </div>
          <div v-else class="empty-preview">
            <el-empty description="表单定义为空" />
          </div>
          
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="previewDialogVisible = false">关闭</el-button>
              <el-button 
                type="primary" 
                @click="previewFormData && handleEditForm(previewFormData)"
                :disabled="!previewFormData"
              >
                编辑表单
              </el-button>
            </span>
          </template>
        </el-dialog>

        <!-- 二维码对话框 -->
        <el-dialog
          v-model="qrCodeDialogVisible"
          title="表单二维码"
          width="500px"
          class="modern-dialog"
          append-to-body
        >
          <div class="qr-code-container">
            <div class="qr-code-image">
              <img 
                v-if="currentQrCodeImage" 
                :src="currentQrCodeImage" 
                alt="表单二维码"
                class="qr-code"
              />
              <div v-else class="qr-code-placeholder">
                <el-empty description="正在生成二维码..." />
              </div>
            </div>
            
            <div class="qr-code-info">
              <div class="url-display">
                <el-input
                  v-model="currentQrCodeUrl"
                  readonly
                  placeholder="表单URL"
                  class="url-input"
                >
                  <template #append>
                    <el-button 
                      @click="copyUrlToClipboard" 
                      :icon="Link"
                      title="复制URL"
                    >
                      复制
                    </el-button>
                  </template>
                </el-input>
              </div>
              
              <div class="action-buttons">
                <el-button 
                  type="primary" 
                  @click="navigateToFormFromQrCode"
                  :icon="View"
                >
                  打开表单
                </el-button>
                <el-button 
                  @click="downloadQRCode"
                  :icon="Download"
                >
                  下载二维码
                </el-button>
              </div>
            </div>
          </div>
          
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="qrCodeDialogVisible = false">关闭</el-button>
            </span>
          </template>
        </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus, Search, Refresh, Edit, View, Connection, Delete, Link, Download } from '@element-plus/icons-vue'
import { apiService } from '@/services/api'
import DynamicFormRenderer from '@/components/DynamicFormRenderer.vue'
import QRCode from 'qrcode'

interface FormDefinition {
  id?: string
  formId: string
  name: string
  description?: string
  tableMapping?: string
  definition?: any
  createdAt?: string
  updatedAt?: string
  fieldCount?: number
  hookCount?: number
  fields?: any[]
}

// 用于DynamicFormRenderer的表单定义类型
interface FormDefinitionForRenderer {
  fields: any[]
  [key: string]: any
}

interface TableMapping {
  hashValue: string
  tableName: string
  originalFileName?: string
}

// 状态管理
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const forms = ref<FormDefinition[]>([])
const tableMappings = ref<TableMapping[]>([])
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 对话框状态
const formDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const qrCodeDialogVisible = ref(false)
const formDialogRef = ref<FormInstance>()
const formDialogData = ref<FormDefinition>({
  formId: '',
  name: '',
  description: '',
  tableMapping: ''
})
const previewFormData = ref<FormDefinition | null>(null)
const isEditing = ref(false)

// 二维码相关状态
const currentQrCodeUrl = ref('')
const currentQrCodeImage = ref('')
const generatingQrCode = ref(false)

// 计算属性
const totalForms = computed(() => forms.value.length)
const filteredForms = computed(() => {
  if (!searchKeyword.value) {
    return forms.value
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return forms.value.filter(form => 
    form.formId?.toLowerCase().includes(keyword) ||
    form.name?.toLowerCase().includes(keyword) ||
    form.description?.toLowerCase().includes(keyword)
  )
})

const formDialogTitle = computed(() => {
  return isEditing.value ? '编辑表单' : '创建表单'
})

// 表单验证规则
const formDialogRules = {
  formId: [
    { required: true, message: '请输入表单ID', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '表单ID只能包含字母、数字、下划线和连字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入表单名称', trigger: 'blur' }
  ]
}

// 初始化数据
const initData = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchForms(),
      fetchTableMappings()
    ])
  } catch (error) {
    console.error('初始化数据失败:', error)
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

// 获取表单列表
const fetchForms = async () => {
  try {
    const response = await apiService.getForms()
    forms.value = response.data || []
  } catch (error) {
    console.error('获取表单列表失败:', error)
    throw error
  }
}

// 获取表映射列表
const fetchTableMappings = async () => {
  try {
    const mappings = await apiService.getMappings()
    tableMappings.value = mappings
  } catch (error) {
    console.error('获取表映射列表失败:', error)
    throw error
  }
}

// 创建表单
const handleCreateForm = () => {
  isEditing.value = false
  formDialogData.value = {
    formId: '',
    name: '',
    description: '',
    tableMapping: ''
  }
  formDialogVisible.value = true
  nextTick(() => {
    formDialogRef.value?.clearValidate()
  })
}

// 编辑表单
const handleEditForm = (form: FormDefinition) => {
  // 跳转到表单详情页面
  router.push(`/forms/${form.formId}`)
}

// 预览表单
const handlePreviewForm = async (form: FormDefinition) => {
  try {
    const response = await apiService.getForm(form.formId)
    previewFormData.value = response.data
    previewDialogVisible.value = true
  } catch (error) {
    console.error('获取表单详情失败:', error)
    ElMessage.error('获取表单详情失败')
  }
}

// 管理Hook
const handleManageHooks = (form: FormDefinition) => {
  // 跳转到表单详情页面的Hook标签页
  router.push(`/forms/${form.formId}?tab=hooks`)
}

// 删除表单
const handleDeleteForm = async (form: FormDefinition) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除表单 "${form.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await apiService.deleteForm(form.formId)
    ElMessage.success('表单删除成功')
    await fetchForms()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除表单失败:', error)
      ElMessage.error('删除表单失败')
    }
  }
}

// 保存表单
const handleSaveForm = async () => {
  if (!formDialogRef.value) return
  
  try {
    const valid = await formDialogRef.value.validate()
    if (!valid) return
    
    saving.value = true
    
    if (isEditing.value) {
      // 更新表单
      await apiService.updateForm(formDialogData.value.formId, {
        name: formDialogData.value.name,
        description: formDialogData.value.description,
        tableMapping: formDialogData.value.tableMapping
      })
      ElMessage.success('表单更新成功')
    } else {
      // 创建表单
      await apiService.createForm({
        formId: formDialogData.value.formId,
        name: formDialogData.value.name,
        description: formDialogData.value.description,
        tableMapping: formDialogData.value.tableMapping,
        definition: {
          fields: []
        }
      })
      ElMessage.success('表单创建成功')
    }
    
    formDialogVisible.value = false
    await fetchForms()
  } catch (error) {
    console.error('保存表单失败:', error)
    ElMessage.error(isEditing.value ? '更新表单失败' : '创建表单失败')
  } finally {
    saving.value = false
  }
}

// 刷新列表
const refreshList = () => {
  initData()
}

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 日期格式化
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 生成二维码
const generateQRCode = async (form: FormDefinition) => {
  try {
    generatingQrCode.value = true
    const formUrl = `${window.location.origin}/form/${form.formId}`
    currentQrCodeUrl.value = formUrl
    
    // 生成二维码图片
    currentQrCodeImage.value = await QRCode.toDataURL(formUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    qrCodeDialogVisible.value = true
  } catch (error) {
    console.error('生成二维码失败:', error)
    ElMessage.error('生成二维码失败')
  } finally {
    generatingQrCode.value = false
  }
}

// 跳转到表单
const navigateToForm = (form: FormDefinition) => {
  const formUrl = `${window.location.origin}/form/${form.formId}`
  window.open(formUrl, '_blank')
}

// 复制URL到剪贴板
const copyUrlToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(currentQrCodeUrl.value)
    ElMessage.success('URL已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

// 从二维码对话框跳转到表单
const navigateToFormFromQrCode = () => {
  window.open(currentQrCodeUrl.value, '_blank')
}

// 下载二维码
const downloadQRCode = async () => {
  try {
    if (!currentQrCodeImage.value) return
    
    const link = document.createElement('a')
    link.href = currentQrCodeImage.value
    link.download = `form-qrcode-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('二维码下载成功')
  } catch (error) {
    console.error('下载二维码失败:', error)
    ElMessage.error('下载二维码失败')
  }
}

// 解析表单定义
const getParsedFormDefinition = (definition: any) => {
  if (!definition) {
    return { fields: [] }
  }
  
  // 如果definition是字符串，尝试解析为JSON
  if (typeof definition === 'string') {
    try {
      return JSON.parse(definition)
    } catch (error) {
      console.error('解析表单定义失败:', error)
      return { fields: [] }
    }
  }
  
  // 如果definition已经是对象，直接返回
  return definition
}

// 根据哈希值获取表名
const getTableName = (hashValue: string) => {
  if (!hashValue) return '未关联'
  
  const mapping = tableMappings.value.find(m => m.hashValue === hashValue)
  return mapping ? mapping.tableName : '未知表'
}

// 复制表哈希值到剪贴板
const copyTableHash = async (hashValue: string) => {
  if (!hashValue) return
  
  try {
    await navigator.clipboard.writeText(hashValue)
    ElMessage.success('哈希值已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

// 工具函数
const nextTick = (fn: () => void) => {
  setTimeout(fn, 0)
}

onMounted(() => {
  initData()
})
</script>

<style scoped>
.form-management {
  padding: 0;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.page-description {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.toolbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.empty-state {
  padding: 40px 0;
}

.form-tip {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 4px;
  line-height: 1.4;
}

.empty-preview {
  padding: 40px 0;
}

/* 二维码对话框样式 */
.qr-code-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px 0;
}

.qr-code-image {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 280px;
}

.qr-code {
  width: 256px;
  height: 256px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 8px;
  background: white;
}

.qr-code-placeholder {
  width: 256px;
  height: 256px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
}

.qr-code-info {
  width: 100%;
  max-width: 400px;
}

.url-display {
  margin-bottom: 16px;
}

.url-input {
  width: 100%;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 关联表显示样式 */
.table-name-display {
  color: var(--el-color-primary);
  cursor: pointer;
  font-weight: 500;
}

.table-name-display:hover {
  text-decoration: underline;
}

/* 表哈希值popover样式 */
.table-hash-popover {
  padding: 8px 0;
}

.popover-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.hash-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  background: var(--el-fill-color-light);
  padding: 8px 12px;
  border-radius: 4px;
  word-break: break-all;
  margin-bottom: 12px;
  border: 1px solid var(--el-border-color);
}

.popover-actions {
  display: flex;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar-content {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .toolbar-actions {
    justify-content: space-between;
  }
  
  .modern-input {
    width: 100% !important;
    margin-right: 0 !important;
  }
}
</style>
