import Papa from 'papaparse'
import { logger } from '@/utils/logger'
import { NetworkError, ValidationError } from '@/utils/error-handler'

export interface CSVParseResult {
  words: string[]
  errors: Array<{ row: number; message: string }>
}

export class CSVService {
  /**
   * 解析 CSV 檔案並提取單字
   * @param file CSV 檔案
   * @returns 解析結果，包含單字列表和錯誤
   */
  async parseCSV(file: File): Promise<CSVParseResult> {
    return new Promise((resolve, reject) => {
      const words: string[] = []
      const errors: Array<{ row: number; message: string }> = []

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            logger.warn('CSV parsing errors', { errors: results.errors })
          }

          // 提取單字欄位
          const wordColumn = this.findWordColumn(results.meta.fields || [])
          
          if (!wordColumn) {
            reject(new ValidationError('CSV 檔案中找不到單字欄位（word 或 單字）'))
            return
          }

          results.data.forEach((row: any, index: number) => {
            const word = String(row[wordColumn] || '').trim()
            
            if (!word) {
              errors.push({
                row: index + 2, // +2 因為有標題行，且 index 從 0 開始
                message: '空白的單字'
              })
              return
            }

            // 驗證單字格式（只包含英文字母、空格、連字號、撇號）
            if (!/^[a-zA-Z\s\-']+$/.test(word)) {
              errors.push({
                row: index + 2,
                message: `無效的單字格式: ${word}`
              })
              return
            }

            // 移除重複
            if (!words.includes(word.toLowerCase())) {
              words.push(word)
            }
          })

          logger.info('CSV parsed successfully', {
            totalWords: words.length,
            errors: errors.length
          })

          resolve({ words, errors })
        },
        error: (error) => {
          logger.error('CSV parsing failed', { error })
          reject(new NetworkError('CSV 檔案解析失敗', error))
        }
      })
    })
  }

  /**
   * 尋找單字欄位（支援多種欄位名稱）
   */
  private findWordColumn(fields: string[]): string | null {
    const possibleNames = ['word', '單字', 'words', 'vocabulary', 'lemma']
    
    for (const name of possibleNames) {
      const found = fields.find(
        field => field.toLowerCase() === name.toLowerCase()
      )
      if (found) {
        return found
      }
    }

    // 如果找不到，使用第一個欄位
    return fields.length > 0 ? fields[0] : null
  }

  /**
   * 驗證 CSV 檔案格式
   */
  validateCSVFile(file: File): { valid: boolean; message?: string } {
    if (!file.name.endsWith('.csv')) {
      return {
        valid: false,
        message: '檔案必須是 CSV 格式'
      }
    }

    if (file.size === 0) {
      return {
        valid: false,
        message: '檔案不能為空'
      }
    }

    // 檢查檔案大小（限制為 10MB）
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        valid: false,
        message: '檔案大小不能超過 10MB'
      }
    }

    return { valid: true }
  }
}

export const csvService = new CSVService()

