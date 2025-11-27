import { csvService, type CSVRow } from './csv-service'
import { wordRepository } from './word-repository'
import { importJobRepository } from './import-job-repository'
import { createImportJob, type ImportJob } from '@/types/import-job'
import { createWord, type Word } from '@/types/word'
import { logger } from '@/utils/logger'
import { ValidationError } from '@/utils/error-handler'

export type DuplicateAction = 'skip' | 'overwrite'
export type DatabaseAction = 'append' | 'clear'

export interface ImportOptions {
  duplicateAction?: DuplicateAction
  databaseAction?: DatabaseAction
  onProgress?: (current: number, total: number, word: string) => void
}

export interface ImportResult {
  job: ImportJob
  successCount: number
  errorCount: number
  duplicateCount: number
  skippedCount: number
}

export class ImportService {
  /**
   * 匯入 CSV 檔案
   */
  async importCSV(
    file: File,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    // 驗證檔案
    const validation = csvService.validateCSVFile(file)
    if (!validation.valid) {
      throw new ValidationError(validation.message || 'CSV 檔案驗證失敗')
    }

    // 解析 CSV
    const parseResult = await csvService.parseCSV(file)
    
    // 建立匯入任務
    const job = createImportJob(file.name, parseResult.rows.length)
    job.errors = parseResult.errors
    job.status = 'running'
    await importJobRepository.create(job)

    // 開始匯入流程
    try {
      const result = await this.processImport(job, parseResult.rows, options)
      return result
    } catch (error) {
      logger.error('Import processing failed', { jobId: job.id, error })
      job.status = 'failed'
      job.endedAt = new Date().toISOString()
      await importJobRepository.update(job)
      throw error
    }
  }

  /**
   * 從已解析的 CSV 資料匯入（不需要重新解析檔案）
   */
  async importCSVFromRows(
    rows: CSVRow[],
    filename: string,
    parseErrors: Array<{ row: number; message: string }>,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    // 建立匯入任務
    const job = createImportJob(filename, rows.length)
    job.errors = parseErrors
    job.status = 'running'
    await importJobRepository.create(job)

    // 開始匯入流程
    try {
      const result = await this.processImport(job, rows, options)
      return result
    } catch (error) {
      logger.error('Import processing failed', { jobId: job.id, error })
      job.status = 'failed'
      job.endedAt = new Date().toISOString()
      await importJobRepository.update(job)
      throw error
    }
  }

  /**
   * 清除所有單字
   */
  async clearAllWords(): Promise<void> {
    const allWords = await wordRepository.getAll()
    for (const word of allWords) {
      await wordRepository.delete(word.id)
    }
    logger.info('All words cleared from database')
  }

  /**
   * 處理匯入流程
   */
  private async processImport(
    job: ImportJob,
    rows: CSVRow[],
    options: ImportOptions
  ): Promise<ImportResult> {
    const { duplicateAction = 'skip', databaseAction = 'append', onProgress } = options
    let successCount = 0
    let errorCount = 0
    let duplicateCount = 0
    let skippedCount = 0

    // 如果選擇清除資料庫，先清除所有單字
    if (databaseAction === 'clear') {
      logger.info('Clearing database before import')
      await this.clearAllWords()
    }

    // 取得現有單字以檢查重複
    const existingWords = await wordRepository.getAll()
    const existingWordMap = new Map<string, Word>()
    existingWords.forEach(word => {
      existingWordMap.set(word.lemma.toLowerCase(), word)
    })

    // 處理每一列
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      job.processedWords = i + 1

      try {
        // 檢查重複
        const existingWord = existingWordMap.get(row.word.toLowerCase())
        
        if (existingWord) {
          duplicateCount++
          
          if (duplicateAction === 'skip') {
            skippedCount++
            job.errors.push({
              row: i + 2, // +2 因為有標題行，且 index 從 0 開始
              message: `單字 "${row.word}" 已存在，已跳過`
            })
            continue
          } else if (duplicateAction === 'overwrite') {
            // 覆蓋現有單字
            const updatedWord = this.convertRowToWord(row, existingWord.id)
            await wordRepository.update(updatedWord)
            successCount++
          }
        } else {
          // 新增單字
          const newWord = this.convertRowToWord(row)
          await wordRepository.create(newWord)
          successCount++
          // 更新現有單字映射，避免同一批次內重複
          existingWordMap.set(newWord.lemma.toLowerCase(), newWord)
        }

        // 更新進度
        if (onProgress) {
          onProgress(i + 1, rows.length, row.word)
        }

        // 定期更新任務狀態
        if ((i + 1) % 10 === 0) {
          await importJobRepository.update(job)
        }
      } catch (error) {
        errorCount++
        const errorMessage = error instanceof Error ? error.message : String(error)
        job.errors.push({
          row: i + 2,
          message: `匯入單字 "${row.word}" 時發生錯誤: ${errorMessage}`
        })
        logger.error('Failed to import word', { row, error })
      }
    }

    // 完成匯入
    job.status = 'completed'
    job.endedAt = new Date().toISOString()
    await importJobRepository.update(job)

    return {
      job,
      successCount,
      errorCount,
      duplicateCount,
      skippedCount
    }
  }

  /**
   * 將 CSV 列轉換為 Word 物件
   */
  private convertRowToWord(row: CSVRow, existingId?: string): Word {
    const word = existingId 
      ? { ...createWord(row.word, 'csv'), id: existingId }
      : createWord(row.word, 'csv')

    // 設定音標
    if (row.phonetic) {
      // 移除方括號並正規化格式
      const normalizedPhonetic = row.phonetic.replace(/[[\]()]/g, '').trim()
      if (normalizedPhonetic) {
        word.phonetics = [normalizedPhonetic]
      }
    }

    // 設定發音音檔連結
    if (row.audioUrl) {
      word.audioUrls = [row.audioUrl]
    }

    // 設定詞類
    if (row.partOfSpeech) {
      word.partOfSpeech = row.partOfSpeech
    }

    // 設定中文解釋
    if (row.definition) {
      word.definitionZh = row.definition
    }

    // 更新資訊完整度
    if (word.definitionZh && word.audioUrls.length > 0 && word.phonetics.length > 0) {
      word.infoCompleteness = 'complete'
    } else if (!word.definitionZh) {
      word.infoCompleteness = 'missing-definition'
    } else if (word.audioUrls.length === 0) {
      word.infoCompleteness = 'missing-audio'
    } else {
      word.infoCompleteness = 'complete'
    }

    return word
  }

  /**
   * 檢查 CSV 檔案中的重複單字
   */
  async checkDuplicates(file: File): Promise<{ duplicates: string[]; total: number }> {
    const parseResult = await csvService.parseCSV(file)
    const existingWords = await wordRepository.getAll()
    const existingWordSet = new Set(existingWords.map(w => w.lemma.toLowerCase()))
    
    const duplicates: string[] = []
    const seenInFile = new Set<string>()

    parseResult.rows.forEach(row => {
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
      total: parseResult.rows.length
    }
  }
}

export const importService = new ImportService()

