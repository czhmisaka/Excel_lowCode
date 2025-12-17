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
            <div>
              <el-tag v-if="!company.requireCheckout" type="info" style="margin-right: 8px;">
                该公司只需签到
              </el-tag>
              <el-tag v-if="todayStatus.hasCheckedOut" type="success">已签退（可再次签退更新）</el-tag>
              <el-tag v-else-if="todayStatus.hasCheckedIn" type="warning">已签到，待签退</el-tag>
              <el-tag v-else type="info">未签到</el-tag>
            </div>
          </div>
        </template>
        
        <!-- 时间限制提示 -->
        <div v-if="company.enableCheckoutTimeLimit" class="time-limit-notice">
          <el-alert 
            type="info" 
            :title="`签退时间限制：${formatTimeRange(company.checkoutStartTime, company.checkoutEndTime)}`"
            :description="getCurrentTimeStatus('checkout')"
            show-icon
            :closable="false"
          />
        </div>

        <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" v-loading="loading">
          <el-form-item label="姓名" prop="realName">
            <el-input v-model="form.realName" placeholder="请输入姓名" maxlength="50" />
          </el-form-item>

          <el-form-item label="手机号" prop="phone">
            <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
          </el-form-item>


          <el-form-item label="备注" prop="remark">
            <el-input 
              v-model="form.remark" 
              type="textarea"
              placeholder="请输入备注信息（最多300字）" 
              maxlength="300"
              :rows="3"
              show-word-limit
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleCheckout" :loading="checkoutLoading"
              :disabled="!todayStatus.hasCheckedIn">
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
import { getUserInfo } from '@/utils/localstorage'

const route = useRoute()

// 响应式数据
const company = ref({
  id: 0,
  name: '',
  code: '',
  description: '',
  requireCheckout: true,
  enableCheckinTimeLimit: false,
  checkinStartTime: '',
  checkinEndTime: '',
  enableCheckoutTimeLimit: false,
  checkoutStartTime: '',
  checkoutEndTime: ''
})

const form = reactive({
  realName: '',
  phone: '',
  remark: ''
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

// 格式化时间范围
const formatTimeRange = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return ''
  
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  
  const startTotalMinutes = startHour * 60 + startMinute
  const endTotalMinutes = endHour * 60 + endMinute
  
  if (endTotalMinutes < startTotalMinutes) {
    // 跨天情况
    return `${startTime} - 次日 ${endTime}`
  } else {
    // 正常情况
    return `${startTime} - ${endTime}`
  }
}

// 获取当前时间状态
const getCurrentTimeStatus = (type: 'checkin' | 'checkout') => {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTotalMinutes = currentHour * 60 + currentMinute
  
  let startTime = ''
  let endTime = ''
  
  if (type === 'checkin') {
    startTime = company.value.checkinStartTime
    endTime = company.value.checkinEndTime
  } else {
    startTime = company.value.checkoutStartTime
    endTime = company.value.checkoutEndTime
  }
  
  if (!startTime || !endTime) return ''
  
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  
  const startTotalMinutes = startHour * 60 + startMinute
  const endTotalMinutes = endHour * 60 + endMinute
  
  // 检查是否在时间范围内
  let isInRange = false
  if (endTotalMinutes < startTotalMinutes) {
    // 跨天情况：当前时间在开始时间之后或结束时间之前
    isInRange = currentTotalMinutes >= startTotalMinutes || currentTotalMinutes <= endTotalMinutes
  } else {
    // 正常情况：当前时间在开始时间和结束时间之间
    isInRange = currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes
  }
  
  const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
  
  if (isInRange) {
    return `当前时间 ${currentTimeStr} 在允许的时间范围内`
  } else {
    return `当前时间 ${currentTimeStr} 不在允许的时间范围内，请等待允许的时间段`
  }
}

// 获取签退按钮文本
const getCheckoutButtonText = () => {
  if (!company.value.requireCheckout) {
    return '该公司只需签到'
  }
  
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
    // 需要手机号和公司ID才能查询状态
    if (!form.phone || !company.value.id) {
      return
    }

    // 基于手机号查询今日状态
    const response = await apiService.getTodayStatus({
      phone: form.phone,
      companyId: company.value.id.toString()
    })

    if (response.success) {
      todayStatus.value = response.data
    } else {
      // 如果查询失败，重置状态为未签到
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

    // 检查公司是否需要签退
    if (!company.value.requireCheckout) {
      ElMessage.warning('该公司只需签到，无需签退')
      return
    }

    checkoutLoading.value = true

    // 使用签退API
    const response = await apiService.checkout({
      phone: form.phone,
      companyCode: company.value.code,
      remark: form.remark
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

// 自动填充用户信息
const autoFillUserInfo = async () => {
  try {
    // 首先尝试从localstorage读取用户信息
    const savedUserInfo = getUserInfo()
    if (savedUserInfo) {
      // 如果localstorage中有用户信息，则自动填充
      form.realName = savedUserInfo.realName
      form.phone = savedUserInfo.phone
      ElMessage.success('已自动填充您的个人信息（来自上次签到）')
      
      // 自动填充完成后，立即获取用户的签到数据
      // 等待公司信息加载完成后再获取状态
      if (form.phone && company.value.id) {
        await getTodayStatus()
      } else {
        // 如果公司信息还没加载完成，等待一下再尝试
        setTimeout(() => {
          if (form.phone && company.value.id) {
            getTodayStatus()
          }
        }, 1000)
      }
      return
    }
    
    // 如果没有保存的用户信息，则显示提示让用户手动输入
    console.log('请手动输入您的个人信息')
  } catch (error) {
    console.error('自动填充用户信息失败:', error)
  }
}

// 页面加载时初始化
onMounted(async () => {
  // 先获取公司信息
  await getCompanyInfo()
  // 然后自动填充用户信息
  await autoFillUserInfo()
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

.time-limit-notice {
  margin-bottom: 20px;
}
</style>
