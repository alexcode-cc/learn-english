<template>
  <v-card>
    <v-card-title>
      <v-icon
        :color="resultType"
        class="mr-2"
      >
        {{ resultIcon }}
      </v-icon>
      匯入結果
    </v-card-title>
    <v-card-text>
      <v-alert
        :type="resultType"
        variant="tonal"
        class="mb-4"
      >
        <div class="d-flex flex-column">
          <span class="text-h6 mb-2">
            {{ resultTitle }}
          </span>
          <div class="d-flex flex-column gap-1">
            <span>
              <v-icon size="small" class="mr-1">mdi-check-circle</v-icon>
              成功匯入：<strong>{{ result.successCount }}</strong> 個單字
            </span>
            <span v-if="result.errorCount > 0">
              <v-icon size="small" color="error" class="mr-1">mdi-alert-circle</v-icon>
              錯誤：<strong>{{ result.errorCount }}</strong> 個
            </span>
            <span v-if="result.duplicateCount > 0">
              <v-icon size="small" color="warning" class="mr-1">mdi-alert</v-icon>
              重複：<strong>{{ result.duplicateCount }}</strong> 個
              <span v-if="result.skippedCount > 0">
                ({{ result.skippedCount }} 個已跳過)
              </span>
            </span>
          </div>
        </div>
      </v-alert>

      <!-- 錯誤詳情 -->
      <v-expansion-panels
        v-if="result.job.errors.length > 0"
        class="mb-4"
      >
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="mr-2">mdi-alert-circle</v-icon>
            查看錯誤詳情 ({{ result.job.errors.length }} 個錯誤)
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list density="compact">
              <v-list-item
                v-for="(error, index) in result.job.errors"
                :key="index"
                :title="`第 ${error.row} 行`"
                :subtitle="error.message"
              >
                <template v-slot:prepend>
                  <v-icon color="error" size="small">mdi-alert-circle</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <!-- 匯入資訊 -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-subtitle-1">
          匯入資訊
        </v-card-title>
        <v-card-text>
          <div class="d-flex flex-column gap-2">
            <div class="d-flex justify-space-between">
              <span class="text-body-2">檔案名稱</span>
              <span class="text-body-2 font-weight-medium">{{ result.job.filename }}</span>
            </div>
            <div class="d-flex justify-space-between">
              <span class="text-body-2">總單字數</span>
              <span class="text-body-2 font-weight-medium">{{ result.job.totalWords }}</span>
            </div>
            <div class="d-flex justify-space-between">
              <span class="text-body-2">開始時間</span>
              <span class="text-body-2 font-weight-medium">{{ formatDate(result.job.startedAt) }}</span>
            </div>
            <div v-if="result.job.endedAt" class="d-flex justify-space-between">
              <span class="text-body-2">結束時間</span>
              <span class="text-body-2 font-weight-medium">{{ formatDate(result.job.endedAt) }}</span>
            </div>
            <div v-if="result.job.endedAt" class="d-flex justify-space-between">
              <span class="text-body-2">耗時</span>
              <span class="text-body-2 font-weight-medium">{{ calculateDuration(result.job.startedAt, result.job.endedAt) }}</span>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- 操作按鈕 -->
      <div class="d-flex gap-2">
        <v-btn
          color="primary"
          @click="handleImportAnother"
        >
          <v-icon class="mr-2">mdi-file-import</v-icon>
          匯入另一個檔案
        </v-btn>
        <v-btn
          variant="outlined"
          to="/study"
        >
          <v-icon class="mr-2">mdi-book-open-variant</v-icon>
          前往學習頁面
        </v-btn>
        <v-btn
          variant="outlined"
          to="/dashboard"
        >
          <v-icon class="mr-2">mdi-view-dashboard</v-icon>
          查看單字庫
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ImportResult } from '@/services/import-service'

const props = defineProps<{
  result: ImportResult
}>()

const emit = defineEmits<{
  (e: 'import-another'): void
}>()

const resultType = computed(() => {
  if (props.result.errorCount > 0) {
    return 'warning'
  }
  return 'success'
})

const resultIcon = computed(() => {
  if (props.result.errorCount > 0) {
    return 'mdi-alert'
  }
  return 'mdi-check-circle'
})

const resultTitle = computed(() => {
  if (props.result.errorCount > 0) {
    return `匯入完成（有 ${props.result.errorCount} 個錯誤）`
  }
  return '匯入成功完成！'
})

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function calculateDuration(start: string, end: string): string {
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()
  const duration = endTime - startTime

  const seconds = Math.floor(duration / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours} 小時 ${minutes % 60} 分鐘 ${seconds % 60} 秒`
  } else if (minutes > 0) {
    return `${minutes} 分鐘 ${seconds % 60} 秒`
  } else {
    return `${seconds} 秒`
  }
}

function handleImportAnother(): void {
  emit('import-another')
}
</script>

<style scoped>
.mr-1 {
  margin-right: 0.25rem;
}
.mr-2 {
  margin-right: 0.5rem;
}
.gap-1 {
  gap: 0.25rem;
}
.gap-2 {
  gap: 0.5rem;
}
</style>

