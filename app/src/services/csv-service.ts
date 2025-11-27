import Papa from 'papaparse'
import { logger } from '@/utils/logger'
import { NetworkError, ValidationError } from '@/utils/error-handler'

export interface CSVRow {
  id?: string // CSV 中的 ID，不會匯入到資料庫
  word: string // 單字
  phonetic?: string // 音標
  audioUrl?: string // 發音音檔連結
  partOfSpeech?: string // 詞類
  definition?: string // 解釋
}

export interface CSVParseResult {
  rows: CSVRow[]
  errors: Array<{ row: number; message: string }>
}

export class CSVService {
  /**
   * 解析 CSV 檔案並提取單字資料
   * 格式：ID,單字,音標,發音音檔連結,詞類,解釋
   * @param file CSV 檔案
   * @returns 解析結果，包含單字資料列表和錯誤
   */
  async parseCSV(file: File): Promise<CSVParseResult> {
    return new Promise((resolve, reject) => {
      const rows: CSVRow[] = []
      const errors: Array<{ row: number; message: string }> = []

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            logger.warn('CSV parsing errors', { errors: results.errors })
          }

          const fields = results.meta.fields || []
          
          // 檢查必要的欄位
          const wordColumn = this.findColumn(fields, ['word', '單字', 'words', 'vocabulary', 'lemma'])
          if (!wordColumn) {
            reject(new ValidationError('CSV 檔案中找不到單字欄位（word 或 單字）'))
            return
          }

          // 尋找其他欄位（可選）
          const idColumn = this.findColumn(fields, ['id', 'ID', '序號'])
          const phoneticColumn = this.findColumn(fields, ['phonetic', '音標', 'phonetics'])
          const audioColumn = this.findColumn(fields, ['audio', 'audioUrl', '發音音檔連結', 'audio_url'])
          const partOfSpeechColumn = this.findColumn(fields, ['partOfSpeech', 'part_of_speech', 'pos', '詞類'])
          const definitionColumn = this.findColumn(fields, ['definition', '解釋', 'meaning', 'def', '中文解釋'])

          results.data.forEach((row: any, index: number) => {
            const rowNumber = index + 2 // +2 因為有標題行，且 index 從 0 開始
            
            try {
              // 驗證並提取單字
              const word = String(row[wordColumn] || '').trim()
              if (!word) {
                errors.push({
                  row: rowNumber,
                  message: '單字欄位為空'
                })
                return
              }

              // 驗證單字格式（允許英文字母、空格、連字號、撇號、句點、括號等）
              if (!/^[a-zA-Z0-9\s\-'.,()]+$/.test(word)) {
                errors.push({
                  row: rowNumber,
                  message: `無效的單字格式: ${word}`
                })
                return
              }

              // 提取其他欄位
              const csvRow: CSVRow = {
                id: idColumn ? (String(row[idColumn] || '').trim() || undefined) : undefined,
                word: word,
                phonetic: phoneticColumn ? (String(row[phoneticColumn] || '').trim() || undefined) : undefined,
                audioUrl: audioColumn ? (String(row[audioColumn] || '').trim() || undefined) : undefined,
                partOfSpeech: partOfSpeechColumn ? (String(row[partOfSpeechColumn] || '').trim() || undefined) : undefined,
                definition: definitionColumn ? (String(row[definitionColumn] || '').trim() || undefined) : undefined
              }

              // 驗證資料完整性（至少要有單字和解釋）
              if (!csvRow.definition || csvRow.definition.length === 0) {
                errors.push({
                  row: rowNumber,
                  message: `單字 "${word}" 缺少解釋`
                })
                return
              }

              rows.push(csvRow)
            } catch (error) {
              errors.push({
                row: rowNumber,
                message: `解析第 ${rowNumber} 行時發生錯誤: ${error instanceof Error ? error.message : String(error)}`
              })
            }
          })

          logger.info('CSV parsed successfully', {
            totalRows: rows.length,
            errors: errors.length
          })

          resolve({ rows, errors })
        },
        error: (error) => {
          logger.error('CSV parsing failed', { error })
          reject(new NetworkError('CSV 檔案解析失敗', error))
        }
      })
    })
  }

  /**
   * 尋找欄位（支援多種欄位名稱）
   */
  private findColumn(fields: string[], possibleNames: string[]): string | null {
    for (const name of possibleNames) {
      const found = fields.find(
        field => field.toLowerCase() === name.toLowerCase()
      )
      if (found) {
        return found
      }
    }
    return null
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

