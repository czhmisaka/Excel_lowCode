<template>
  <MainLayout>
    <template #header>
      <div class="page-header">
        <h1 class="page-title">Hook管理</h1>
        <div class="page-subtitle">管理所有表单的Hook配置和执行</div>
      </div>
    </template>

    <div class="hook-management">
      <!-- 工具栏 -->
      <div class="modern-toolbar">
        <div class="toolbar-content">
          <div class="toolbar-left">
            <el-button type="primary" @click="handleCreateHook" :icon="Plus">
              创建Hook
            </el-button>
            <el-button @click="handleRefresh" :icon="Refresh">
              刷新
            </el-button>
          </div>
          <div class="toolbar-right">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索Hook名称、表单ID..."
              style="width: 300px"
              :prefix-icon="Search"
              clearable
            />
            <el-select
              v-model="filterFormId"
              placeholder="筛选表单"
              style="width: 200px; margin-left: 12px;"
              clearable
            >
              <el-option
                v-for="form in forms"
                :key="form.formId"
                :label="form.name"
                :value="form.formId"
              />
            </el-select>
            <el-select
              v-model="filterType"
              placeholder="筛选类型"
              style="width: 150px; margin-left: 12px;"
              clearable
            >
              <el-option label="JavaScript" value="javascript" />
              <el-option label="HTTP请求" value="http" />
              <el-option label="数据库操作" value="database" />
              <el-option label="邮件通知" value="email" />
            </el-select>
          </div>
        </div>
      </div>

      <!-- Hook列表 -->
      <div class="modern-card">
        <el-table
          :data="filteredHooks"
          stripe
          class="modern-table"
          style="width: 100%"
          v-loading="loading"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="name" label="Hook名称" min-width="150" show-overflow-tooltip>
            <template #default="scope">
              <div class="hook-name">
                <span class="name-text">{{ scope.row.name }}</span>
                <el-tag
                  v-if="!scope.row.enabled"
                  size="small"
                  type="info"
                  style="margin-left: 8px;"
                >
                  已禁用
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="formId" label="所属表单" min-width="120" show-overflow-tooltip>
            <template #default="scope">
              <el-tag type="primary" size="small">
                {{ getFormName(scope.row.formId) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="Hook类型" width="120">
            <template #default="scope">
              <el-tag
                :type="getHookTypeTagType(scope.row.type)"
                size="small"
              >
                {{ getHookTypeText(scope.row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="triggerType" label="触发时机" width="120">
            <template #default="scope">
              <el-tag type="warning" size="small">
                {{ getTriggerTypeText(scope.row.triggerType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip>
            <template #default="scope">
              <span class="description-text">{{ scope.row.description || '无描述' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="160">
            <template #default="scope">
              {{ formatDate(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button
                type="primary"
                link
                size="small"
                @click="handleEditHook(scope.row)"
                :icon="Edit"
              >
                编辑
              </el-button>
              <el-button
                type="warning"
                link
                size="small"
                @click="handleTestHook(scope.row)"
                :icon="VideoPlay"
              >
                测试
              </el-button>
              <el-button
                type="danger"
                link
                size="small"
                @click="handleDeleteHook(scope.row)"
                :icon="Delete"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 空状态 -->
        <div v-if="filteredHooks.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无Hook配置">
            <el-button type="primary" @click="handleCreateHook" :icon="Plus">
              创建第一个Hook
            </el-button>
          </el-empty>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-container" v-if="filteredHooks.length > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredHooks.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- Hook编辑对话框 -->
    <HookEditDialog
      v-model:visible="hookDialogVisible"
      :hook-data="currentHook"
      :forms="forms"
      @save="handleSaveHook"
      @close="handleCloseDialog"
    />

    <!-- Hook测试对话框 -->
    <HookTestDialog
      v-model:visible="testDialogVisible"
      :hook="currentHook"
      @test="handleExecuteTest"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search, Edit, Delete, VideoPlay } from '@element-plus/icons-vue'
import MainLayout from '@/components/Layout/MainLayout.vue'
import HookEditDialog from '@/components/HookEditDialog.vue'
import HookTestDialog from '@/components/HookTestDialog.vue'
import { apiService } from '@/services/api'

interface FormDefinition {
  formId: string
  name: string
  description?: string
}

interface FormHook {
  id?: string
  formId: string
  name: string
  type: string
  triggerType: string
  enabled?: boolean
  description?: string
  config: any
  createdAt?: string
  updatedAt?: string
}

// 响应式数据
const loading = ref(false)
const hooks = ref<FormHook[]>([])
const forms = ref<FormDefinition[]>([])
const searchKeyword = ref('')
const filterFormId = ref('')
const filterType = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const hookDialogVisible = ref(false)
const testDialogVisible = ref(false)
const currentHook = ref<FormHook | null>(null)

// 计算属性
const filteredHooks = computed(() => {
  let filtered = hooks.value

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(hook => 
      hook.name.toLowerCase().includes(keyword) ||
      hook.formId.toLowerCase().includes(keyword) ||
      (hook.description && hook.description.toLowerCase().includes(keyword))
    )
  }

  // 表单过滤
  if (filterFormId.value) {
    filtered = filtered.filter(hook => hook.formId === filterFormId.value)
  }

  // 类型过滤
  if (filterType.value) {
    filtered = filtered.filter(hook => hook.type === filterType.value)
  }

  return filtered
})

const paginatedHooks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredHooks.value.slice(start, end)
})

// 方法
const loadData = async () => {
  loading.value = true
  try {
    // 加载表单列表
    const formsResponse = await apiService.getFormDefinitions()
    console.log('表单列表:', formsResponse.data,'fuck')
    forms.value = formsResponse.data || []

    // 加载所有Hook
    const hooksPromises = forms.value.map(form => 
      apiService.getFormHooks(form.formId).catch(() => ({ data: [] }))
    )
    
    const hooksResponses = await Promise.all(hooksPromises)
    hooks.value = hooksResponses.flatMap((response, index) => 
      (response.data || []).map((hook: FormHook) => ({
        ...hook,
        formId: forms.value[index].formId
      }))
    )
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const getFormName = (formId: string) => {
  const form = forms.value.find(f => f.formId === formId)
  return form ? form.name : formId
}

const getHookTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    javascript: 'JavaScript',
    http: 'HTTP请求',
    database: '数据库操作',
    email: '邮件通知'
  }
  return typeMap[type] || type
}

const getHookTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    javascript: 'success',
    http: 'primary',
    database: 'warning',
    email: 'info'
  }
  return typeMap[type] || 'default'
}

const getTriggerTypeText = (triggerType: string) => {
  const triggerMap: Record<string, string> = {
    beforeSubmit: '提交前',
    afterSubmit: '提交后',
    beforeValidate: '验证前',
    afterValidate: '验证后'
  }
  return triggerMap[triggerType] || triggerType
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

const handleCreateHook = () => {
  currentHook.value = {
    formId: '',
    name: '',
    type: 'javascript',
    triggerType: 'beforeSubmit',
    enabled: true,
    description: '',
    config: {}
  }
  hookDialogVisible.value = true
}

const handleEditHook = (hook: FormHook) => {
  currentHook.value = { ...hook }
  hookDialogVisible.value = true
}

const handleDeleteHook = async (hook: FormHook) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除Hook "${hook.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 调用API删除Hook
    await apiService.deleteFormHook(hook.formId, hook.id!)
    
    // 从本地列表中移除
    const index = hooks.value.findIndex(h => h.id === hook.id)
    if (index !== -1) {
      hooks.value.splice(index, 1)
    }
    
    ElMessage.success('Hook删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除Hook失败:', error)
      ElMessage.error('删除Hook失败')
    }
  }
}

const handleTestHook = (hook: FormHook) => {
  currentHook.value = { ...hook }
  testDialogVisible.value = true
}

const handleSaveHook = async (hookData: FormHook) => {
  try {
    if (hookData.id) {
      // 更新Hook
      await apiService.updateFormHook(hookData.formId, hookData.id, hookData)
      
      // 更新本地列表
      const index = hooks.value.findIndex(h => h.id === hookData.id)
      if (index !== -1) {
        hooks.value[index] = { ...hookData }
      }
      
      ElMessage.success('Hook更新成功')
    } else {
      // 创建Hook
      const response = await apiService.createFormHook(hookData.formId, hookData)
      const newHook = response.data
      
      // 添加到本地列表
      hooks.value.push({ ...newHook, formId: hookData.formId })
      
      ElMessage.success('Hook创建成功')
    }
    
    hookDialogVisible.value = false
  } catch (error) {
    console.error('保存Hook失败:', error)
    ElMessage.error('保存Hook失败')
  }
}

const handleExecuteTest = async (testData: any) => {
  try {
    if (!currentHook.value) return
    
    const response = await apiService.testFormHook(
      currentHook.value.formId,
      currentHook.value.id!,
      testData
    )
    
    ElMessage.success('Hook测试执行成功')
    console.log('测试结果:', response.data)
  } catch (error) {
    console.error('Hook测试失败:', error)
    ElMessage.error('Hook测试失败')
  }
}

const handleCloseDialog = () => {
  hookDialogVisible.value = false
  currentHook.value = null
}

const handleRefresh = () => {
  loadData()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.hook-management {
  padding: 0;
}

.page-header {
  padding: 0 0 24px 0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.toolbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hook-name {
  display: flex;
  align-items: center;
}

.name-text {
  font-weight: 500;
}

.description-text {
  color: var(--text-secondary);
  font-size: 13px;
}

.empty-state {
  padding: 60px 0;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding: 16px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar-content {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .toolbar-left,
  .toolbar-right {
    width: 100%;
  }
  
  .toolbar-right {
    flex-direction: column;
  }
  
  .toolbar-right .el-input,
  .toolbar-right .el-select {
    width: 100% !important;
    margin-left: 0 !important;
  }
}
</style>
