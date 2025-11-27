import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { importService, type ImportOptions, type ImportResult } from '@/services/import-service'
import { csvService, type CSVRow } from '@/services/csv-service'
import { importJobRepository } from '@/services/import-job-repository'
import { wordRepository } from '@/services/word-repository'
import type { ImportJob } from '@/types/import-job'
import { logger } from '@/utils/logger'
import { handleError } from '@/utils/error-handler'

export const useImportStore = defineStore('import', () => {
  const currentJob = ref<ImportJob | null>(null)
  const isImporting = ref(false)
  const importProgress = ref({ current: 0, total: 0, currentWord: '' })
  const importResult = ref<ImportResult | null>(null)
  const duplicateAction = ref<'skip' | 'overwrite'>('skip')
  const databaseAction = ref<'append' | 'clear'>('append')
  
  // CSV 資料臨時存儲
  const parsedCSVData = ref<CSVRow[] | null>(null)
  const csvFileName = ref<string>('')
  const csvParseErrors = ref<Array<{ row: number; message: string }>>([])

  /**
   * 解析 CSV 檔案並存儲到 store（不立即匯入資料庫）
   */
  async function parseCSV(file: File): Promise<void> {
    try {
      const result = await csvService.parseCSV(file)
      parsedCSVData.value = result.rows
      csvFileName.value = file.name
      csvParseErrors.value = result.errors
      logger.info('CSV parsed and stored in store', {
        rows: result.rows.length,
        errors: result.errors.length
      })
    } catch (error) {
      const appError = handleError(error)
      logger.error('Failed to parse CSV', { error: appError })
      throw appError
    }
  }

  /**
   * 檢查資料庫是否有資料
   */
  async function checkDatabaseHasData(): Promise<boolean> {
    try {
      const count = await wordRepository.count()
      return count > 0
    } catch (error) {
      const appError = handleError(error)
      logger.error('Failed to check database', { error: appError })
      return false
    }
  }

  /**
   * 檢查重複單字（基於已解析的 CSV 資料）
   */
  async function checkDuplicatesFromParsedData(): Promise<{ duplicates: string[]; total: number }> {
    if (!parsedCSVData.value) {
      throw new Error('沒有已解析的 CSV 資料')
    }

    try {
      const existingWords = await wordRepository.getAll()
      const existingWordSet = new Set(existingWords.map(w => w.lemma.toLowerCase()))
      
      const duplicates: string[] = []
      const seenInFile = new Set<string>()

      parsedCSVData.value.forEach(row => {
        const wordLower = row.word.toLowerCase()
        
        // 檢查檔案內重複
        if (seenInFile.has(wordLower)) {
          if (!duplicates.includes(row.word)) {
            duplicates.push(row.word)
          }
        } else {
          seenInFile.add(wordLower)
        }

        // 檢查與資料庫重複
        if (existingWordSet.has(wordLower)) {
          if (!duplicates.includes(row.word)) {
            duplicates.push(row.word)
          }
        }
      })

      return {
        duplicates,
        total: parsedCSVData.value.length
      }
    } catch (error) {
      const appError = handleError(error)
      logger.error('Failed to check duplicates', { error: appError })
      throw appError
    }
  }

  /**
   * 開始匯入已解析的 CSV 資料到資料庫
   */
  async function startImportFromParsedData(options?: ImportOptions): Promise<ImportResult> {
    if (isImporting.value) {
      throw new Error('匯入正在進行中，請稍候')
    }

    if (!parsedCSVData.value) {
      throw new Error('沒有已解析的 CSV 資料，請先解析 CSV 檔案')
    }

    isImporting.value = true
    importProgress.value = { current: 0, total: 0, currentWord: '' }
    importResult.value = null

    try {
      // 創建一個臨時的 File 對象用於匯入服務
      // 注意：這裡我們實際上使用已解析的資料，但 importService 需要 File 對象
      // 我們需要修改 importService 來支持直接使用已解析的資料
      // 或者創建一個臨時的 File 對象
      const blob = new Blob([''], { type: 'text/csv' })
      const tempFile = new File([blob], csvFileName.value, { type: 'text/csv' })

      const optionsWithProgress: ImportOptions = {
        duplicateAction: duplicateAction.value,
        databaseAction: databaseAction.value,
        ...options,
        onProgress: (current, total, word) => {
          importProgress.value = { current, total, currentWord: word }
          if (options?.onProgress) {
            options.onProgress(current, total, word)
          }
        }
      }

      // 使用已解析的資料進行匯入
      // 注意：需要深度克隆 reactive 物件，否則 IndexedDB 無法序列化
      const rowsToImport = JSON.parse(JSON.stringify(parsedCSVData.value)) as CSVRow[]
      const errorsToImport = JSON.parse(JSON.stringify(csvParseErrors.value)) as Array<{ row: number; message: string }>
      
      const result = await importService.importCSVFromRows(
        rowsToImport,
        csvFileName.value,
        errorsToImport,
        optionsWithProgress
      )
      
      currentJob.value = result.job
      importResult.value = result
      
      logger.info('Import completed', {
        successCount: result.successCount,
        errorCount: result.errorCount,
        duplicateCount: result.duplicateCount
      })

      return result
    } catch (error) {
      const appError = handleError(error)
      logger.error('Import failed', { error: appError })
      throw appError
    } finally {
      isImporting.value = false
    }
  }

  /**
   * 載入最新的匯入任務
   */
  async function loadLatestJob(): Promise<void> {
    try {
      const job = await importJobRepository.getLatest()
      currentJob.value = job || null
    } catch (error) {
      const appError = handleError(error)
      logger.error('Failed to load latest job', { error: appError })
    }
  }

  /**
   * 載入指定的匯入任務
   */
  async function loadJob(jobId: string): Promise<void> {
    try {
      const job = await importJobRepository.getById(jobId)
      currentJob.value = job || null
    } catch (error) {
      const appError = handleError(error)
      logger.error('Failed to load job', { jobId, error: appError })
    }
  }

  /**
   * 設定重複處理方式
   */
  function setDuplicateAction(action: 'skip' | 'overwrite'): void {
    duplicateAction.value = action
  }

  /**
   * 設定資料庫處理方式
   */
  function setDatabaseAction(action: 'append' | 'clear'): void {
    databaseAction.value = action
  }

  /**
   * 重置匯入狀態
   */
  function reset(): void {
    currentJob.value = null
    isImporting.value = false
    importProgress.value = { current: 0, total: 0, currentWord: '' }
    importResult.value = null
    parsedCSVData.value = null
    csvFileName.value = ''
    csvParseErrors.value = []
  }

  const progressPercentage = computed(() => {
    if (importProgress.value.total === 0) return 0
    return Math.round((importProgress.value.current / importProgress.value.total) * 100)
  })

  return {
    // State
    currentJob,
    isImporting,
    importProgress,
    importResult,
    duplicateAction,
    databaseAction,
    progressPercentage,
    parsedCSVData,
    csvFileName,
    csvParseErrors,
    
    // Actions
    parseCSV,
    checkDatabaseHasData,
    checkDuplicatesFromParsedData,
    startImportFromParsedData,
    loadLatestJob,
    loadJob,
    setDuplicateAction,
    setDatabaseAction,
    reset
  }
})

