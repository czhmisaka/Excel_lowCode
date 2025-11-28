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
            <el-tag v-if="todayStatus.hasCheckedIn" type="success">今日已签到</el-tag>
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

          <el-form-item label="身份证号" prop="idCard">
            <el-input 
              v-model="form.idCard" 
              placeholder="请输入身份证号" 
              maxlength="18"
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'
import { apiService } from '@/services/api'

const route = useRoute()

// 响应式数据
const company = ref({
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
const checkinLoading = ref(false)
const checkinResult = ref<any>(null)
const todayStatus = ref({
  hasCheckedIn: false,
  hasCheckedOut: false,
  checkinTime: null,
  checkoutTime: null,
  workDuration: null
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
const formatTime = (time: string) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

// 格式化工作时长
const formatWorkDuration = (minutes: number) => {
  if (!minutes) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}小时${mins}分钟`
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
      ElMessage.error('获取公司信息失败')
    }
  } catch (error) {
    console.error('获取公司信息失败:', error)
    ElMessage.error('获取公司信息失败')
  } finally {
    loading.value = false
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
      idCard: form.idCard,
      companyCode: company.value.code
    })
    
    if (response.success) {
      checkinResult.value = response.data
      todayStatus.value.hasCheckedIn = true
      todayStatus.value.checkinTime = checkinResult.value.checkinRecord.checkinTime
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

// 页面加载时初始化
onMounted(() => {
  getCompanyInfo()
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
</style>
