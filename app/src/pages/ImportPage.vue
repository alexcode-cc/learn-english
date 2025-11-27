<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">匯入單字</h1>
        <p class="text-body-1 mb-6">
          上傳 CSV 檔案以匯入單字。CSV 格式：ID,單字,音標,發音音檔連結,詞類,解釋
        </p>
      </v-col>
    </v-row>

    <!-- 檔案上傳 -->
    <v-row v-if="!importStore.parsedCSVData && !showDatabaseAction && !isCheckingDuplicates && !isImporting && !importStore.importResult">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>選擇 CSV 檔案</v-card-title>
          <v-card-text>
            <v-file-input
              v-model="selectedFile"
              label="選擇 CSV 檔案"
              accept=".csv"
              prepend-icon="mdi-file-document"
              variant="outlined"
              :disabled="isParsing"
            />
            <v-alert
              v-if="fileError"
              type="error"
              variant="tonal"
              class="mt-4"
            >
              {{ fileError }}
            </v-alert>
            
            <!-- 檔案確認和轉換按鈕 -->
            <div v-if="selectedFile" class="mt-4">
              <v-alert
                type="info"
                variant="tonal"
                class="mb-4"
              >
                已選擇檔案：<strong>{{ selectedFile.name }}</strong>
                <br>
                檔案大小：{{ formatFileSize(selectedFile.size) }}
              </v-alert>
              <div class="d-flex gap-2">
                <v-btn
                  color="primary"
                  @click="handleStartParse"
                  :loading="isParsing"
                  :disabled="isParsing || !isValidFile"
                >
                  開始轉換
                </v-btn>
                <v-btn
                  variant="outlined"
                  @click="handleCancel"
                  :disabled="isParsing"
                >
                  重新選擇
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 資料庫操作選擇 -->
    <v-row v-if="importStore.parsedCSVData && showDatabaseAction && !duplicateInfo && !isImporting && !importStore.importResult">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>選擇資料庫操作</v-card-title>
          <v-card-text>
            <v-alert
              type="info"
              variant="tonal"
              class="mb-4"
            >
              請選擇要如何處理現有的資料庫資料
            </v-alert>

            <v-radio-group
              v-model="importStore.databaseAction"
              label="資料庫操作方式"
              class="mb-4"
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
              v-if="importStore.databaseAction === 'clear'"
              type="warning"
              variant="tonal"
              class="mb-4"
            >
              <strong>警告：</strong>選擇清除資料庫將刪除所有現有的單字資料，此操作無法復原！
            </v-alert>

            <div class="d-flex gap-2">
              <v-btn
                color="primary"
                @click="handleCheckDuplicates"
                :disabled="isCheckingDuplicates"
                :loading="isCheckingDuplicates"
              >
                繼續
              </v-btn>
              <v-btn
                variant="outlined"
                @click="handleCancel"
                :disabled="isCheckingDuplicates"
              >
                取消
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 重複檢查結果 -->
    <v-row v-if="importStore.parsedCSVData && duplicateInfo && !isImporting && !importStore.importResult">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>檢查重複單字</v-card-title>
          <v-card-text>
            <v-alert
              v-if="duplicateInfo.duplicates.length > 0"
              type="warning"
              variant="tonal"
              class="mb-4"
            >
              發現 {{ duplicateInfo.duplicates.length }} 個重複單字
            </v-alert>
            <v-alert
              v-else
              type="success"
              variant="tonal"
              class="mb-4"
            >
              未發現重複單字
            </v-alert>

            <div v-if="duplicateInfo.duplicates.length > 0" class="mb-4">
              <p class="text-body-2 mb-2">重複的單字：</p>
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

            <v-radio-group
              v-model="importStore.duplicateAction"
              label="處理重複單字的方式"
              class="mb-4"
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

            <div class="d-flex gap-2">
              <v-btn
                color="primary"
                @click="handleStartImport"
                :disabled="isImporting"
              >
                開始匯入
              </v-btn>
              <v-btn
                variant="outlined"
                @click="handleCancel"
              >
                取消
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 匯入進度 -->
    <v-row v-if="isImporting">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>匯入中...</v-card-title>
          <v-card-text>
            <v-progress-linear
              :model-value="importStore.progressPercentage"
              color="primary"
              height="25"
              class="mb-4"
            >
              <template v-slot:default="{ value }">
                <strong>{{ Math.ceil(value) }}%</strong>
              </template>
            </v-progress-linear>
            <p class="text-body-2">
              正在處理：{{ importStore.importProgress.currentWord || '準備中...' }}
            </p>
            <p class="text-caption text-medium-emphasis">
              {{ importStore.importProgress.current }} / {{ importStore.importProgress.total }}
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 匯入結果 -->
    <v-row v-if="importStore.importResult && !isImporting">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon
              :color="importStore.importResult.errorCount > 0 ? 'warning' : 'success'"
              class="mr-2"
            >
              {{ importStore.importResult.errorCount > 0 ? 'mdi-alert' : 'mdi-check-circle' }}
            </v-icon>
            匯入完成
          </v-card-title>
          <v-card-text>
            <v-alert
              :type="importStore.importResult.errorCount > 0 ? 'warning' : 'success'"
              variant="tonal"
              class="mb-4"
            >
              <div class="d-flex flex-column">
                <span>成功匯入：{{ importStore.importResult.successCount }} 個單字</span>
                <span v-if="importStore.importResult.errorCount > 0">
                  錯誤：{{ importStore.importResult.errorCount }} 個
                </span>
                <span v-if="importStore.importResult.duplicateCount > 0">
                  重複：{{ importStore.importResult.duplicateCount }} 個
                  ({{ importStore.importResult.skippedCount }} 個已跳過)
                </span>
              </div>
            </v-alert>

            <!-- 錯誤列表 -->
            <div v-if="importStore.importResult.job.errors.length > 0" class="mt-4">
              <h3 class="text-h6 mb-2">匯入錯誤詳情</h3>
              <v-expansion-panels>
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    查看錯誤詳情 ({{ importStore.importResult.job.errors.length }} 個錯誤)
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-list density="compact">
                      <v-list-item
                        v-for="(error, index) in importStore.importResult.job.errors"
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
            </div>

            <div class="d-flex gap-2 mt-4">
              <v-btn
                color="primary"
                @click="handleReset"
              >
                匯入另一個檔案
              </v-btn>
              <v-btn
                variant="outlined"
                to="/study"
              >
                前往學習頁面
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useImportStore } from '@/stores/useImportStore'
import { useWordsStore } from '@/stores/useWordsStore'
import { logger } from '@/utils/logger'
import { handleError } from '@/utils/error-handler'

const importStore = useImportStore()
const wordsStore = useWordsStore()

// Vuetify 3 的 v-file-input v-model 綁定的是 File | File[] | null
const selectedFile = ref<File | null>(null)
const fileError = ref<string>('')
const showDatabaseAction = ref(false)
const isCheckingDuplicates = ref(false)
const isParsing = ref(false)
const duplicateInfo = ref<{ duplicates: string[]; total: number } | null>(null)

const isImporting = computed(() => importStore.isImporting)

// 檢查檔案是否有效
const isValidFile = computed(() => {
  if (!selectedFile.value) {
    return false
  }
  const file = selectedFile.value
  if (!file.name || !file.name.endsWith('.csv')) {
    return false
  }
  if (file.size === 0) {
    return false
  }
  return true
})

// 開始解析 CSV 並載入到 store
async function handleStartParse(): Promise<void> {
  if (!selectedFile.value) {
    fileError.value = '請先選擇 CSV 檔案'
    return
  }

  const file = selectedFile.value

  // 驗證檔案
  if (!file.name || !file.name.endsWith('.csv')) {
    fileError.value = '檔案必須是 CSV 格式'
    return
  }

  if (file.size === 0) {
    fileError.value = '檔案不能為空'
    return
  }

  try {
    isParsing.value = true
    fileError.value = ''

    // 解析 CSV 並載入到 store
    await importStore.parseCSV(file)
    logger.info('CSV parsed successfully')

    // 檢查資料庫是否有資料
    const hasData = await importStore.checkDatabaseHasData()
    
    if (hasData) {
      // 如果有資料，顯示覆蓋/附加選擇界面
      showDatabaseAction.value = true
    } else {
      // 如果沒有資料，直接開始匯入（使用附加模式）
      importStore.setDatabaseAction('append')
      await handleStartImport()
    }
  } catch (error) {
    const appError = handleError(error)
    fileError.value = `解析 CSV 失敗: ${appError.message}`
    logger.error('Failed to parse CSV', { error: appError })
  } finally {
    isParsing.value = false
  }
}

// 格式化檔案大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

async function handleCheckDuplicates(): Promise<void> {
  if (!importStore.parsedCSVData) {
    return
  }

  // 檢查重複（只有在附加模式下才需要檢查）
  try {
    isCheckingDuplicates.value = true
    if (importStore.databaseAction === 'append') {
      // 附加模式：檢查重複並顯示結果
      duplicateInfo.value = await importStore.checkDuplicatesFromParsedData()
      logger.info('Duplicate check completed', duplicateInfo.value)
    } else {
      // 清除模式：直接開始匯入
      await handleStartImport()
    }
  } catch (error) {
    const appError = handleError(error)
    fileError.value = `檢查重複時發生錯誤: ${appError.message}`
    logger.error('Failed to check duplicates', { error: appError })
  } finally {
    isCheckingDuplicates.value = false
  }
}

async function handleStartImport(): Promise<void> {
  if (!importStore.parsedCSVData) {
    fileError.value = '沒有已解析的 CSV 資料，請先解析 CSV 檔案'
    return
  }

  try {
    await importStore.startImportFromParsedData()
    logger.info('Import started successfully')
    
    // 重新載入單字列表（因為可能清除了資料庫或新增了單字）
    await wordsStore.loadWords()
  } catch (error) {
    const appError = handleError(error)
    fileError.value = `匯入失敗: ${appError.message}`
    logger.error('Import failed', { error: appError })
  }
}

function handleCancel(): void {
  selectedFile.value = null
  showDatabaseAction.value = false
  duplicateInfo.value = null
  fileError.value = ''
  importStore.reset()
}

function handleReset(): void {
  importStore.reset()
  selectedFile.value = null
  showDatabaseAction.value = false
  duplicateInfo.value = null
  fileError.value = ''
}
</script>

<style scoped>
.gap-2 {
  gap: 0.5rem;
}
</style>
