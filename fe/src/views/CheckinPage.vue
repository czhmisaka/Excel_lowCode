<template>
  <div class="checkin-page">
    <div class="page-header">
      <h1>{{ company.name }} - 签到</h1>
      <p class="company-description">{{ company.description }}</p>
    </div>

    <div class="checkin-form-container">
      <el-card class="checkin-card">
        <template #header>
          <div class="card-header">
            <span>签到信息</span>
            <div>
              <el-tag v-if="!company.requireCheckout" type="info" style="margin-right: 8px;">
                该公司只需签到
              </el-tag>
              <el-tag v-if="todayStatus.hasCheckedIn" type="success">今日已签到</el-tag>
              <el-tag v-else type="info">未签到</el-tag>
            </div>
          </div>
        </template>
        
        <!-- 时间限制提示 -->
        <div v-if="company.enableCheckinTimeLimit" class="time-limit-notice">
          <el-alert 
            type="info" 
            :title="`签到时间限制：${formatTimeRange(company.checkinStartTime, company.checkinEndTime)}`"
            :description="getCurrentTimeStatus('checkin')"
            show-icon
            :closable="false"
          />
        </div>

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
              :disabled="todayStatus.hasCheckedIn"
            />
          </el-form-item>

          <el-form-item label="手机号" prop="phone">
            <el-input 
              v-model="form.phone" 
              placeholder="请输入手机号" 
              maxlength="11"
              :disabled="todayStatus.hasCheckedIn"
            />
          </el-form-item>

          <el-form-item label="隶属单位" prop="laborSource">
            <el-select
              v-model="form.laborSource"
              placeholder="请选择隶属单位"
              style="width: 100%"
              :disabled="todayStatus.hasCheckedIn"
              :loading="loadingLaborSources"
            >
              <el-option
                v-for="source in laborSources"
                :key="source.code"
                :label="source.name"
                :value="source.code"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="备注" prop="remark">
            <el-input 
              v-model="form.remark" 
              type="textarea"
              placeholder="请输入备注信息（最多300字）" 
              maxlength="300"
              :rows="3"
              show-word-limit
              :disabled="todayStatus.hasCheckedIn"
            />
          </el-form-item>

          <el-form-item>
            <el-button 
              type="primary" 
              @click="handleCheckin" 
              :loading="checkinLoading"
              :disabled="todayStatus.hasCheckedIn"
            >
              {{ todayStatus.hasCheckedIn ? '今日已签到' : '签到' }}
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 签到结果 -->
        <div v-if="checkinResult" class="result-section">
          <el-divider />
          <h3>签到成功</h3>
          <div class="result-info">
            <p><strong>用户:</strong> {{ checkinResult.user.realName }}</p>
            <p><strong>手机号:</strong> {{ checkinResult.user.phone }}</p>
            <p><strong>签到时间:</strong> {{ formatTime(checkinResult.checkinRecord.checkinTime) }}</p>
            <p v-if="checkinResult.checkinRecord.location">
              <strong>位置:</strong> {{ checkinResult.checkinRecord.location }}
            </p>
          </div>
        </div>

        <!-- 今日状态 -->
        <div v-if="todayStatus.hasCheckedIn" class="today-status">
          <el-divider />
          <h4>今日状态</h4>
          <div class="status-info">
            <p><strong>签到时间:</strong> {{ formatTime(todayStatus.checkinTime) }}</p>
            <p v-if="todayStatus.hasCheckedOut">
              <strong>签退时间:</strong> {{ formatTime(todayStatus.checkoutTime) }}
            </p>
            <p v-if="todayStatus.workDuration">
              <strong>工作时长:</strong> {{ formatWorkDuration(todayStatus.workDuration) }}
            </p>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import { apiService } from '@/services/api'
import { saveUserInfo, getUserInfo } from '@/utils/localstorage'

const route = useRoute()

// 响应式数据
const company = ref({
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
  laborSource: '',
  remark: ''
})

const formRef = ref()
const loading = ref(false)
const checkinLoading = ref(false)
const loadingLaborSources = ref(false)
const checkinResult = ref<any>(null)
const todayStatus = ref({
  hasCheckedIn: false,
  hasCheckedOut: false,
  checkinTime: null,
  checkoutTime: null,
  workDuration: null
})
const laborSources = ref<Array<{code: string, name: string}>>([])

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
  laborSource: [
    { required: true, message: '请选择隶属单位', trigger: 'change' }
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

// 获取公司信息
const getCompanyInfo = async () => {
  try {
    loading.value = true
    const companyCode = route.params.companyCode as string
    const response = await apiService.getCompanyByCode(companyCode)
    if (response.success) {
      company.value = response.data
      // 获取公司的劳务来源选项
      await getLaborSources(companyCode)
    } else {
      ElMessage.error('获取公司信息失败')
    }
  } catch (error) {
    console.error('获取公司信息失败:', error)
    ElMessage.error('获取公司信息失败')
  } finally {
    loading.value = false
  }
}

// 获取劳务来源选项
const getLaborSources = async (companyCode: string) => {
  try {
    loadingLaborSources.value = true
    const response = await apiService.getActiveLaborSourcesByCompanyCode(companyCode)
    if (response.success) {
      laborSources.value = response.data || []
      if (laborSources.value.length === 0) {
        ElMessage.warning('该公司未配置隶属单位选项，请联系管理员配置')
      }
    } else {
      ElMessage.error('获取隶属单位选项失败')
      laborSources.value = []
    }
  } catch (error) {
    console.error('获取隶属单位选项失败:', error)
    ElMessage.error('获取隶属单位选项失败')
    laborSources.value = []
  } finally {
    loadingLaborSources.value = false
  }
}

// 获取今日状态
const getTodayStatus = async () => {
  try {
    // 这里需要用户ID和公司ID，在签到成功后更新
    // 暂时留空，签到成功后会自动更新
  } catch (error) {
    console.error('获取今日状态失败:', error)
  }
}

// 处理签到
const handleCheckin = async () => {
  try {
    await formRef.value.validate()
    
    checkinLoading.value = true
    
    // 使用签到API
    const response = await apiService.checkin({
      realName: form.realName,
      phone: form.phone,
      companyCode: company.value.code,
      laborSource: form.laborSource,
      remark: form.remark
    })
    
    if (response.success) {
      checkinResult.value = response.data
      todayStatus.value.hasCheckedIn = true
      todayStatus.value.checkinTime = checkinResult.value.checkinRecord.checkinTime
      
      // 保存用户信息到localstorage
      saveUserInfo({
        realName: form.realName,
        phone: form.phone,
        lastCheckinTime: checkinResult.value.checkinRecord.checkinTime
      })
      
      ElMessage.success('签到成功')
    } else {
      ElMessage.error(response.message || '签到失败')
    }
  } catch (error: any) {
    console.error('签到失败:', error)
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('签到失败，请重试')
    }
  } finally {
    checkinLoading.value = false
  }
}

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
      return
    }
    
    // 如果没有保存的用户信息，则显示提示让用户手动输入
    console.log('请手动输入您的个人信息')
  } catch (error) {
    console.error('自动填充用户信息失败:', error)
  }
}

// 页面加载时初始化
onMounted(() => {
  getCompanyInfo()
  autoFillUserInfo()
})
</script>

<style scoped>
.checkin-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #409EFF;
  margin-bottom: 10px;
}

.company-description {
  color: #666;
  font-size: 14px;
}

.checkin-form-container {
  margin-bottom: 30px;
}

.checkin-card {
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

.time-limit-notice {
  margin-bottom: 20px;
}
</style>
