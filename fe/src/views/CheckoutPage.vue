<template>
  <div class="checkout-page">
    <div class="page-header">
      <h1>{{ company.name }} - 签退</h1>
      <p class="company-description">{{ company.description }}</p>
    </div>

    <div class="checkout-form-container">
      <el-card class="checkout-card">
        <template #header>
          <div class="card-header">
            <span>签退信息</span>
            <el-tag v-if="todayStatus.hasCheckedOut" type="success">已签退（可再次签退更新）</el-tag>
            <el-tag v-else-if="todayStatus.hasCheckedIn" type="warning">已签到，待签退</el-tag>
            <el-tag v-else type="info">未签到</el-tag>
          </div>
        </template>

        <el-form 
          :model="form" 
          :rules="rules" 
          ref="formRef" 
          label-width="100px"
          v-loading="loading"
        >
          <el-form-item label="姓名" prop="realName">
            <el-input 
              v-model="form.realName" 
              placeholder="请输入姓名" 
              maxlength="50"
            />
          </el-form-item>

          <el-form-item label="手机号" prop="phone">
            <el-input 
              v-model="form.phone" 
              placeholder="请输入手机号" 
              maxlength="11"
            />
          </el-form-item>

          <el-form-item label="身份证号" prop="idCard">
            <el-input 
              v-model="form.idCard" 
              placeholder="请输入身份证号" 
              maxlength="18"
            />
          </el-form-item>

          <el-form-item>
            <el-button 
              type="primary" 
              @click="handleCheckout" 
              :loading="checkoutLoading"
              :disabled="!todayStatus.hasCheckedIn"
            >
              {{ getCheckoutButtonText() }}
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 今日状态 -->
        <div class="today-status">
          <el-divider />
          <h4>今日状态</h4>
          <div class="status-info">
            <p>
              <strong>签到状态:</strong> 
              <el-tag :type="todayStatus.hasCheckedIn ? 'success' : 'info'" size="small">
                {{ todayStatus.hasCheckedIn ? '已签到' : '未签到' }}
              </el-tag>
            </p>
            <p v-if="todayStatus.hasCheckedIn">
              <strong>签到时间:</strong> {{ formatTime(todayStatus.checkinTime) }}
            </p>
            <p>
              <strong>签退状态:</strong> 
              <el-tag :type="todayStatus.hasCheckedOut ? 'success' : 'warning'" size="small">
                {{ todayStatus.hasCheckedOut ? '已签退' : '未签退' }}
              </el-tag>
            </p>
            <p v-if="todayStatus.hasCheckedOut">
              <strong>签退时间:</strong> {{ formatTime(todayStatus.checkoutTime) }}
            </p>
            <p v-if="todayStatus.workDuration">
              <strong>工作时长:</strong> {{ formatWorkDuration(todayStatus.workDuration) }}
            </p>
          </div>
        </div>

        <!-- 签退结果 -->
        <div v-if="checkoutResult" class="result-section">
          <el-divider />
          <h3>签退成功</h3>
          <div class="result-info">
            <p><strong>用户:</strong> {{ checkoutResult.user.realName }}</p>
            <p><strong>手机号:</strong> {{ checkoutResult.user.phone }}</p>
            <p><strong>签退时间:</strong> {{ formatTime(checkoutResult.checkoutRecord.checkoutTime) }}</p>
            <p><strong>工作时长:</strong> {{ formatWorkDuration(checkoutResult.checkoutRecord.workDuration) }}</p>
            <p><strong>今日签到时间:</strong> {{ formatTime(checkoutResult.checkinRecord.checkinTime) }}</p>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import { apiService } from '@/services/api'

const route = useRoute()

// 响应式数据
const company = ref({
  id: 0,
  name: '',
  code: '',
  description: ''
})

const form = reactive({
  realName: '',
  phone: '',
  idCard: ''
})

const formRef = ref()
const loading = ref(false)
const checkoutLoading = ref(false)
const checkoutResult = ref<any>(null)
const todayStatus = ref({
  hasCheckedIn: false,
  hasCheckedOut: false,
  checkinTime: null as string | null,
  checkoutTime: null as string | null,
  workDuration: null as number | null
})

// 表单验证规则
const rules = {
  realName: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '姓名长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, message: '请输入正确的身份证号', trigger: 'blur' }
  ]
}

// 格式化时间
const formatTime = (time: string | null) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

// 格式化工作时长
const formatWorkDuration = (minutes: number | null) => {
  if (!minutes) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}小时${mins}分钟`
}

// 获取签退按钮文本
const getCheckoutButtonText = () => {
  if (!todayStatus.value.hasCheckedIn) {
    return '请先签到'
  } else if (todayStatus.value.hasCheckedOut) {
    return '再次签退（更新）'
  } else {
    return '签退'
  }
}

// 获取今日状态
const getTodayStatus = async () => {
  try {
    // 需要用户信息才能查询状态，在用户输入信息后调用
    if (!form.phone || !company.value.id) {
      return
    }
    
    // 先根据手机号获取用户信息
    const userResponse = await apiService.getUserByPhone(form.phone)
    if (userResponse.success && userResponse.data) {
      const user = userResponse.data
      
      // 然后获取今日状态
      const statusResponse = await apiService.getTodayStatus({
        userId: user.id.toString(),
        companyId: company.value.id.toString()
      })
      
      if (statusResponse.success) {
        todayStatus.value = statusResponse.data
      }
    } else {
      // 如果用户不存在，重置今日状态为未签到
      todayStatus.value = {
        hasCheckedIn: false,
        hasCheckedOut: false,
        checkinTime: null,
        checkoutTime: null,
        workDuration: null
      }
    }
  } catch (error) {
    console.error('获取今日状态失败:', error)
    // 出错时也重置状态
    todayStatus.value = {
      hasCheckedIn: false,
      hasCheckedOut: false,
      checkinTime: null,
      checkoutTime: null,
      workDuration: null
    }
  }
}

// 获取公司信息
const getCompanyInfo = async () => {
  try {
    loading.value = true
    const companyCode = route.params.companyCode as string
    const response = await apiService.getCompanyByCode(companyCode)
    if (response.success) {
      company.value = response.data
    } else {
      ElMessage.error(response.message || '获取公司信息失败')
    }
  } catch (error) {
    console.error('获取公司信息失败:', error)
    ElMessage.error('获取公司信息失败')
  } finally {
    loading.value = false
  }
}

// 处理签退
const handleCheckout = async () => {
  try {
    await formRef.value.validate()
    
    checkoutLoading.value = true
    
    // 使用签退API
    const response = await apiService.checkout({
      phone: form.phone,
      companyCode: company.value.code
    })
    
    if (response.success) {
      checkoutResult.value = response.data
      todayStatus.value.hasCheckedOut = true
      todayStatus.value.checkoutTime = checkoutResult.value.checkoutRecord.checkoutTime
      todayStatus.value.workDuration = checkoutResult.value.checkoutRecord.workDuration
      ElMessage.success('签退成功')
    } else {
      ElMessage.error(response.message || '签退失败')
    }
  } catch (error: any) {
    console.error('签退失败:', error)
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('签退失败，请重试')
    }
  } finally {
    checkoutLoading.value = false
  }
}

// 监听手机号变化，自动查询今日状态
watch(() => form.phone, (newPhone) => {
  if (newPhone && newPhone.length === 11 && company.value.id) {
    // 延迟500ms查询，避免频繁请求
    setTimeout(() => {
      getTodayStatus()
    }, 500)
  }
})

// 页面加载时初始化
onMounted(() => {
  getCompanyInfo()
})
</script>

<style scoped>
.checkout-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #E6A23C;
  margin-bottom: 10px;
}

.company-description {
  color: #666;
  font-size: 14px;
}

.checkout-form-container {
  margin-bottom: 30px;
}

.checkout-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-section {
  margin-top: 20px;
}

.result-section h3 {
  color: #67C23A;
  margin-bottom: 15px;
}

.result-info p,
.status-info p {
  margin: 8px 0;
  line-height: 1.6;
}

.today-status {
  margin-top: 20px;
}

.today-status h4 {
  color: #409EFF;
  margin-bottom: 15px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input) {
  max-width: 300px;
}

.status-info .el-tag {
  margin-left: 8px;
}
</style>
