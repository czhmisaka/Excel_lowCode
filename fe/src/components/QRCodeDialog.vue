<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="500px"
    :close-on-click-modal="false"
    class="qrcode-dialog"
    append-to-body
  >
    <div class="qrcode-content">
      <!-- 二维码类型选择 -->
      <div class="qrcode-type-selector" v-if="showTypeSelector">
        <el-radio-group v-model="selectedType" @change="generateQRCode">
          <el-radio label="checkin">签到二维码</el-radio>
          <el-radio label="checkout">签退二维码</el-radio>
        </el-radio-group>
      </div>

      <!-- 二维码显示区域 -->
      <div class="qrcode-display">
        <div class="qrcode-image-container">
          <canvas ref="qrcodeCanvas" class="qrcode-canvas"></canvas>
        </div>
        
        <!-- URL显示 -->
        <div class="qrcode-url">
          <el-input
            v-model="currentUrl"
            readonly
            placeholder="二维码链接"
            class="url-input"
          >
            <template #append>
              <el-button
                :icon="CopyDocument"
                @click="copyUrl"
                title="复制链接"
              />
            </template>
          </el-input>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="qrcode-actions">
        <el-button
          type="primary"
          :icon="Download"
          @click="downloadQRCode"
          :loading="downloading"
        >
          下载二维码
        </el-button>
        <el-button @click="visible = false">关闭</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument, Download } from '@element-plus/icons-vue'
import QRCode from 'qrcode'

interface Props {
  modelValue: boolean
  companyCode: string
  companyName: string
  showTypeSelector?: boolean
  defaultType?: 'checkin' | 'checkout'
}

const props = withDefaults(defineProps<Props>(), {
  showTypeSelector: true,
  defaultType: 'checkin'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const selectedType = ref<'checkin' | 'checkout'>(props.defaultType)
const currentUrl = ref('')
const qrcodeCanvas = ref<HTMLCanvasElement>()
const downloading = ref(false)

// 计算属性
const dialogTitle = computed(() => {
  const typeText = selectedType.value === 'checkin' ? '签到' : '签退'
  return `${props.companyName} - ${typeText}二维码`
})

// 生成二维码URL
const generateQRUrl = (type: 'checkin' | 'checkout') => {
  const baseUrl = window.location.origin
  const path = type === 'checkin' ? '/checkin' : '/checkout'
  return `${baseUrl}${path}/${props.companyCode}`
}

// 生成二维码
const generateQRCode = async () => {
  if (!qrcodeCanvas.value) return

  try {
    const url = generateQRUrl(selectedType.value)
    currentUrl.value = url

    await QRCode.toCanvas(qrcodeCanvas.value, url, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  } catch (error) {
    console.error('生成二维码失败:', error)
    ElMessage.error('生成二维码失败')
  }
}

// 复制URL
const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(currentUrl.value)
    ElMessage.success('链接已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

// 下载二维码
const downloadQRCode = async () => {
  if (!qrcodeCanvas.value) return

  downloading.value = true
  try {
    const typeText = selectedType.value === 'checkin' ? '签到' : '签退'
    const fileName = `${props.companyName}_${typeText}_二维码.png`
    
    const dataUrl = qrcodeCanvas.value.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = fileName
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('二维码下载成功')
  } catch (error) {
    console.error('下载二维码失败:', error)
    ElMessage.error('下载二维码失败')
  } finally {
    downloading.value = false
  }
}

// 监听显示状态变化
watch(visible, (newValue) => {
  if (newValue) {
    nextTick(() => {
      generateQRCode()
    })
  }
})

// 监听公司代码变化
watch(() => props.companyCode, () => {
  if (visible.value) {
    generateQRCode()
  }
})
</script>

<style scoped>
.qrcode-dialog {
  :deep(.el-dialog__body) {
    padding: 20px;
  }
}

.qrcode-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.qrcode-type-selector {
  text-align: center;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.qrcode-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.qrcode-image-container {
  padding: 10px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.qrcode-canvas {
  border-radius: 4px;
}

.qrcode-url {
  width: 100%;
  max-width: 400px;
}

.url-input {
  :deep(.el-input-group__append) {
    background-color: #409eff;
    color: white;
    border-color: #409eff;
    
    .el-button {
      color: white;
    }
  }
}

.qrcode-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

@media (max-width: 768px) {
  .qrcode-dialog {
    :deep(.el-dialog) {
      width: 90% !important;
      max-width: 400px;
    }
  }
  
  .qrcode-image-container {
    padding: 8px;
  }
  
  .qrcode-canvas {
    width: 200px !important;
    height: 200px !important;
  }
}
</style>
