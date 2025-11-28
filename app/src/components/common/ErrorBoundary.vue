<template>
  <div v-if="hasError" class="error-boundary">
    <v-alert
      type="error"
      variant="tonal"
      prominent
      class="mb-4"
    >
      <template #prepend>
        <v-icon size="48">mdi-alert-circle</v-icon>
      </template>
      <v-alert-title class="text-h6 mb-2">
        發生錯誤
      </v-alert-title>
      <div class="text-body-1 mb-4">
        {{ errorMessage }}
      </div>
      <div class="d-flex gap-2">
        <v-btn
          color="error"
          variant="flat"
          @click="handleRetry"
        >
          <v-icon start>mdi-refresh</v-icon>
          重試
        </v-btn>
        <v-btn
          color="error"
          variant="outlined"
          @click="handleGoHome"
        >
          <v-icon start>mdi-home</v-icon>
          返回首頁
        </v-btn>
        <v-btn
          v-if="showDetails"
          color="error"
          variant="text"
          @click="showDetails = false"
        >
          隱藏詳情
        </v-btn>
        <v-btn
          v-else
          color="error"
          variant="text"
          @click="showDetails = true"
        >
          顯示詳情
        </v-btn>
      </div>
      <v-expand-transition>
        <div v-if="showDetails" class="mt-4">
          <v-card variant="outlined" class="pa-4">
            <div class="text-caption text-medium-emphasis mb-2">錯誤詳情：</div>
            <pre class="error-details">{{ errorDetails }}</pre>
          </v-card>
        </div>
      </v-expand-transition>
    </v-alert>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, provide, watch } from 'vue'
import { useRouter } from 'vue-router'
import { logger } from '@/utils/logger'

interface Props {
  fallback?: string
  onError?: (error: Error, instance: any, info: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  fallback: '發生未預期的錯誤，請重新整理頁面或返回首頁。'
})

const router = useRouter()
const hasError = ref(false)
const errorMessage = ref('')
const errorDetails = ref('')
const showDetails = ref(false)

// 提供錯誤處理方法給子組件
provide('errorBoundary', {
  reportError: (error: Error, context?: string) => {
    handleError(error, context)
  }
})

function handleError(error: Error, context?: string) {
  hasError.value = true
  errorMessage.value = error.message || props.fallback
  errorDetails.value = [
    `錯誤訊息: ${error.message}`,
    `錯誤堆疊: ${error.stack || '無堆疊資訊'}`,
    context ? `發生位置: ${context}` : '',
    `時間: ${new Date().toISOString()}`
  ].filter(Boolean).join('\n')

  logger.error('ErrorBoundary caught error', {
    error: error.message,
    stack: error.stack,
    context
  })

  // 調用外部錯誤處理器
  if (props.onError) {
    props.onError(error, null, context || 'unknown')
  }
}

function handleRetry() {
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = ''
  showDetails.value = false
  // 重新載入當前路由
  router.go(0)
}

function handleGoHome() {
  router.push('/study')
}

// 捕獲子組件錯誤
onErrorCaptured((error: Error, instance, info) => {
  handleError(error, info)
  return false // 阻止錯誤繼續向上傳播
})

// 監聽路由變化，重置錯誤狀態
watch(() => router.currentRoute.value.path, () => {
  if (hasError.value) {
    hasError.value = false
    errorMessage.value = ''
    errorDetails.value = ''
    showDetails.value = false
  }
})
</script>

<style scoped>
.error-boundary {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.error-details {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  background: rgba(0, 0, 0, 0.05);
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}

@media (prefers-color-scheme: dark) {
  .error-details {
    background: rgba(255, 255, 255, 0.05);
  }
}
</style>

