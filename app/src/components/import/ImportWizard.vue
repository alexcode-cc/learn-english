<template>
  <v-card>
    <v-card-title>
      <v-icon class="mr-2">mdi-file-import</v-icon>
      CSV 匯入精靈
    </v-card-title>
    <v-card-text>
      <v-stepper
        v-model="currentStep"
        :items="steps"
        show-actions
      >
        <template v-slot:item.1>
          <v-card-text>
            <h3 class="text-h6 mb-4">步驟 1: 選擇檔案</h3>
            <v-file-input
              v-model="selectedFile"
              label="選擇 CSV 檔案"
              accept=".csv"
              prepend-icon="mdi-file-document"
              variant="outlined"
              :disabled="isProcessing"
              @update:model-value="handleFileSelected"
            />
            <v-alert
              v-if="fileError"
              type="error"
              variant="tonal"
              class="mt-4"
            >
              {{ fileError }}
            </v-alert>
            <v-alert
              v-if="selectedFile && !fileError"
              type="info"
              variant="tonal"
              class="mt-4"
            >
              已選擇檔案：<strong>{{ selectedFile.name }}</strong>
              <br>
              檔案大小：{{ formatFileSize(selectedFile.size) }}
            </v-alert>
          </v-card-text>
        </template>

        <template v-slot:item.2>
          <v-card-text>
            <h3 class="text-h6 mb-4">步驟 2: 選擇資料庫操作</h3>
            <v-radio-group
              v-model="databaseAction"
              label="資料庫操作方式"
            >
              <v-radio
                label="附加到現有資料庫（保留現有單字）"
                value="append"
              />
              <v-radio
                label="清除資料庫後匯入（刪除所有現有單字）"
                value="clear"
              />
            </v-radio-group>
            <v-alert
              v-if="databaseAction === 'clear'"
              type="warning"
              variant="tonal"
              class="mt-4"
            >
              <strong>警告：</strong>選擇清除資料庫將刪除所有現有的單字資料，此操作無法復原！
            </v-alert>
          </v-card-text>
        </template>

        <template v-slot:item.3>
          <v-card-text>
            <h3 class="text-h6 mb-4">步驟 3: 處理重複單字</h3>
            <v-radio-group
              v-model="duplicateAction"
              label="處理重複單字的方式"
            >
              <v-radio
                label="跳過重複的單字（保留現有資料）"
                value="skip"
              />
              <v-radio
                label="覆蓋重複的單字（使用 CSV 中的資料）"
                value="overwrite"
              />
            </v-radio-group>
            <v-alert
              v-if="duplicateInfo && duplicateInfo.duplicates.length > 0"
              type="warning"
              variant="tonal"
              class="mt-4"
            >
              發現 {{ duplicateInfo.duplicates.length }} 個重複單字
              <div class="mt-2">
                <v-chip
                  v-for="(word, index) in duplicateInfo.duplicates.slice(0, 10)"
                  :key="index"
                  size="small"
                  class="ma-1"
                >
                  {{ word }}
                </v-chip>
                <span v-if="duplicateInfo.duplicates.length > 10" class="text-caption">
                  還有 {{ duplicateInfo.duplicates.length - 10 }} 個...
                </span>
              </div>
            </v-alert>
            <v-alert
              v-else-if="duplicateInfo"
              type="success"
              variant="tonal"
              class="mt-4"
            >
              未發現重複單字
            </v-alert>
          </v-card-text>
        </template>

        <template v-slot:item.4>
          <v-card-text>
            <h3 class="text-h6 mb-4">步驟 4: 確認並匯入</h3>
            <v-alert
              type="info"
              variant="tonal"
              class="mb-4"
            >
              <div class="d-flex flex-column">
                <span><strong>檔案名稱：</strong>{{ selectedFile?.name }}</span>
                <span><strong>資料庫操作：</strong>{{ databaseAction === 'append' ? '附加' : '清除' }}</span>
                <span><strong>重複處理：</strong>{{ duplicateAction === 'skip' ? '跳過' : '覆蓋' }}</span>
                <span v-if="parsedData"><strong>單字數量：</strong>{{ parsedData.length }}</span>
              </div>
            </v-alert>
            <v-btn
              color="primary"
              size="large"
              block
              :loading="isProcessing"
              :disabled="!canStartImport"
              @click="handleStartImport"
            >
              開始匯入
            </v-btn>
          </v-card-text>
        </template>

        <template v-slot:actions="{ prev, next }">
          <v-btn
            v-if="currentStep > 1"
            variant="text"
            @click="prev"
            :disabled="isProcessing"
          >
            上一步
          </v-btn>
          <v-spacer />
          <v-btn
            v-if="currentStep < steps.length"
            color="primary"
            @click="next"
            :disabled="!canProceedToNext"
            :loading="isProcessing"
          >
            下一步
          </v-btn>
        </template>
      </v-stepper>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useImportStore } from '@/stores/useImportStore'
import { logger } from '@/utils/logger'
import { handleError } from '@/utils/error-handler'
import type { CSVRow } from '@/services/csv-service'

const emit = defineEmits<{
  (e: 'import-complete'): void
  (e: 'import-error', error: Error): void
}>()

const importStore = useImportStore()

const currentStep = ref(1)
const steps = ['選擇檔案', '資料庫操作', '處理重複', '確認匯入']
const selectedFile = ref<File | null>(null)
const fileError = ref<string>('')
const databaseAction = ref<'append' | 'clear'>('append')
const duplicateAction = ref<'skip' | 'overwrite'>('skip')
const duplicateInfo = ref<{ duplicates: string[]; total: number } | null>(null)
const parsedData = ref<CSVRow[] | null>(null)
const isProcessing = ref(false)

const canProceedToNext = computed(() => {
  switch (currentStep.value) {
    case 1:
      return selectedFile.value !== null && fileError.value === ''
    case 2:
      return databaseAction.value !== null
    case 3:
      return duplicateAction.value !== null
    case 4:
      return true
    default:
      return false
  }
})

const canStartImport = computed(() => {
  return selectedFile.value !== null && parsedData.value !== null && !isProcessing.value
})

// 監聽步驟變化，自動執行相應操作
watch(currentStep, async (newStep) => {
  if (newStep === 2 && selectedFile.value) {
    // 解析 CSV
    await parseCSV()
  } else if (newStep === 3 && databaseAction.value === 'append') {
    // 檢查重複
    await checkDuplicates()
  }
})

async function handleFileSelected(files: File | File[] | null): Promise<void> {
  const file = Array.isArray(files) ? files[0] : files
  if (!file) {
    fileError.value = ''
    return
  }

  // 驗證檔案
  if (!file.name.endsWith('.csv')) {
    fileError.value = '檔案必須是 CSV 格式'
    return
  }

  if (file.size === 0) {
    fileError.value = '檔案不能為空'
    return
  }

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    fileError.value = '檔案大小不能超過 10MB'
    return
  }

  fileError.value = ''
}

async function parseCSV(): Promise<void> {
  if (!selectedFile.value) {
    return
  }

  try {
    isProcessing.value = true
    await importStore.parseCSV(selectedFile.value)
    parsedData.value = importStore.parsedCSVData
    logger.info('CSV parsed in wizard')
  } catch (error) {
    const appError = handleError(error)
    fileError.value = `解析 CSV 失敗: ${appError.message}`
    logger.error('Failed to parse CSV in wizard', { error: appError })
  } finally {
    isProcessing.value = false
  }
}

async function checkDuplicates(): Promise<void> {
  if (!importStore.parsedCSVData) {
    return
  }

  try {
    isProcessing.value = true
    duplicateInfo.value = await importStore.checkDuplicatesFromParsedData()
    logger.info('Duplicate check completed in wizard', duplicateInfo.value)
  } catch (error) {
    const appError = handleError(error)
    logger.error('Failed to check duplicates in wizard', { error: appError })
    duplicateInfo.value = { duplicates: [], total: 0 }
  } finally {
    isProcessing.value = false
  }
}

async function handleStartImport(): Promise<void> {
  if (!selectedFile.value || !importStore.parsedCSVData) {
    return
  }

  try {
    isProcessing.value = true
    importStore.setDatabaseAction(databaseAction.value)
    importStore.setDuplicateAction(duplicateAction.value)

    await importStore.startImportFromParsedData()
    logger.info('Import started from wizard')
    emit('import-complete')
  } catch (error) {
    const appError = handleError(error)
    logger.error('Import failed in wizard', { error: appError })
    emit('import-error', appError)
  } finally {
    isProcessing.value = false
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped>
.mr-2 {
  margin-right: 0.5rem;
}
</style>

