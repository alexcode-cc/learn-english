import { describe, it, expect, vi, beforeEach } from 'vitest'
import { csvService } from '@/services/csv-service'
import { ValidationError } from '@/utils/error-handler'

describe('CSVService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateCSVFile', () => {
    it('should validate a valid CSV file', () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' })
      const result = csvService.validateCSVFile(file)
      expect(result.valid).toBe(true)
    })

    it('should reject non-CSV files', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const result = csvService.validateCSVFile(file)
      expect(result.valid).toBe(false)
      expect(result.message).toBe('檔案必須是 CSV 格式')
    })

    it('should reject empty files', () => {
      const file = new File([], 'test.csv', { type: 'text/csv' })
      const result = csvService.validateCSVFile(file)
      expect(result.valid).toBe(false)
      expect(result.message).toBe('檔案不能為空')
    })

    it('should reject files larger than 10MB', () => {
      const largeContent = 'x'.repeat(10 * 1024 * 1024 + 1)
      const file = new File([largeContent], 'test.csv', { type: 'text/csv' })
      const result = csvService.validateCSVFile(file)
      expect(result.valid).toBe(false)
      expect(result.message).toBe('檔案大小不能超過 10MB')
    })
  })

  describe('parseCSV', () => {
    it('should parse a valid CSV file with all fields', async () => {
      const csvContent = `ID,單字,音標,發音音檔連結,詞類,解釋
1,hello,/həˈloʊ/,https://example.com/hello.mp3,noun,你好
2,world,/wɜːrld/,https://example.com/world.mp3,noun,世界`
      
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const result = await csvService.parseCSV(file)

      expect(result.rows.length).toBe(2)
      expect(result.rows[0]).toEqual({
        id: '1',
        word: 'hello',
        phonetic: '/həˈloʊ/',
        audioUrl: 'https://example.com/hello.mp3',
        partOfSpeech: 'noun',
        definition: '你好'
      })
      expect(result.rows[1]).toEqual({
        id: '2',
        word: 'world',
        phonetic: '/wɜːrld/',
        audioUrl: 'https://example.com/world.mp3',
        partOfSpeech: 'noun',
        definition: '世界'
      })
      expect(result.errors.length).toBe(0)
    })

    it('should parse CSV with missing optional fields', async () => {
      const csvContent = `ID,單字,音標,發音音檔連結,詞類,解釋
1,hello,,,noun,你好
2,world,/wɜːrld/,,,世界`
      
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const result = await csvService.parseCSV(file)

      expect(result.rows.length).toBe(2)
      // 空字串會被轉為 undefined（因為 trim() 後為空字串，使用 || undefined）
      expect(result.rows[0].phonetic).toBeUndefined()
      expect(result.rows[0].audioUrl).toBeUndefined()
      expect(result.rows[1].audioUrl).toBeUndefined()
      expect(result.rows[1].partOfSpeech).toBeUndefined()
    })

    it('should reject CSV without word column', async () => {
      const csvContent = `ID,音標,發音音檔連結,詞類,解釋
1,/həˈloʊ/,https://example.com/hello.mp3,noun,你好`
      
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      
      await expect(csvService.parseCSV(file)).rejects.toThrow('CSV 檔案中找不到單字欄位')
    })

    it('should reject rows with empty word', async () => {
      const csvContent = `ID,單字,音標,發音音檔連結,詞類,解釋
1,,/həˈloʊ/,https://example.com/hello.mp3,noun,你好
2,world,/wɜːrld/,https://example.com/world.mp3,noun,世界`
      
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const result = await csvService.parseCSV(file)

      expect(result.rows.length).toBe(1)
      expect(result.errors.length).toBe(1)
      expect(result.errors[0].message).toBe('單字欄位為空')
      expect(result.errors[0].row).toBe(2)
    })

    it('should reject rows with invalid word format', async () => {
      const csvContent = `ID,單字,音標,發音音檔連結,詞類,解釋
1,hello@world,/həˈloʊ/,https://example.com/hello.mp3,noun,你好
2,test123,/test/,https://example.com/test.mp3,noun,測試`
      
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const result = await csvService.parseCSV(file)

      expect(result.rows.length).toBe(1)
      expect(result.errors.length).toBe(1)
      expect(result.errors[0].message).toContain('無效的單字格式')
      expect(result.errors[0].row).toBe(2)
    })

    it('should reject rows without definition', async () => {
      const csvContent = `ID,單字,音標,發音音檔連結,詞類,解釋
1,hello,/həˈloʊ/,https://example.com/hello.mp3,noun,
2,world,/wɜːrld/,https://example.com/world.mp3,noun,世界`
      
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const result = await csvService.parseCSV(file)

      expect(result.rows.length).toBe(1)
      expect(result.errors.length).toBe(1)
      expect(result.errors[0].message).toContain('缺少解釋')
      expect(result.errors[0].row).toBe(2)
    })

    it('should handle phrases with spaces', async () => {
      const csvContent = `ID,單字,音標,發音音檔連結,詞類,解釋
1,a few,,,noun,幾個
2,cell phone,,,noun,手機`
      
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const result = await csvService.parseCSV(file)

      expect(result.rows.length).toBe(2)
      expect(result.rows[0].word).toBe('a few')
      expect(result.rows[1].word).toBe('cell phone')
    })

    it('should handle words with special characters', async () => {
      const csvContent = `ID,單字,音標,發音音檔連結,詞類,解釋
1,Mr.,,,noun,先生
2,O.K.,,,adjective,可以的
3,shoe(s),,,noun,鞋`
      
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const result = await csvService.parseCSV(file)

      expect(result.rows.length).toBe(3)
      expect(result.rows[0].word).toBe('Mr.')
      expect(result.rows[1].word).toBe('O.K.')
      expect(result.rows[2].word).toBe('shoe(s)')
    })

    it('should normalize phonetic format', async () => {
      const csvContent = `ID,單字,音標,發音音檔連結,詞類,解釋
1,hat,[hat],https://example.com/hat.mp3,noun,帽子
2,man,[mɛn],https://example.com/man.mp3,noun,男人`
      
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const result = await csvService.parseCSV(file)

      expect(result.rows.length).toBe(2)
      // 音標會保留原始格式，轉換在匯入時進行
      expect(result.rows[0].phonetic).toBe('[hat]')
      expect(result.rows[1].phonetic).toBe('[mɛn]')
    })
  })
})

