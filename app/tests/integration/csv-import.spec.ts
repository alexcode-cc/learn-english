import { describe, it, expect, beforeEach, vi } from 'vitest'
import { importService } from '@/services/import-service'
import { wordRepository } from '@/services/word-repository'
import { initDB } from '@/services/db'
import { createWord } from '@/types/word'
import type { CSVRow } from '@/services/csv-service'

// Mock CSV service
vi.mock('@/services/csv-service', async () => {
  const actual = await vi.importActual('@/services/csv-service')
  return {
    ...actual,
    csvService: {
      validateCSVFile: vi.fn((file: File) => ({ valid: true })),
      parseCSV: vi.fn()
    }
  }
})

describe('CSV Import Integration', () => {
  beforeEach(async () => {
    // Clear database
    const db = await initDB()
    const tx = db.transaction(['words', 'importJobs'], 'readwrite')
    await tx.objectStore('words').clear()
    await tx.objectStore('importJobs').clear()
    await tx.done
    vi.clearAllMocks()
  })

  it('should complete full import flow with append mode', async () => {
    // Create existing word
    const existingWord = createWord('existing')
    existingWord.definitionZh = '已存在'
    await wordRepository.create(existingWord)

    const rows: CSVRow[] = [
      {
        word: 'hello',
        phonetic: '/həˈloʊ/',
        audioUrl: 'https://example.com/hello.mp3',
        partOfSpeech: 'noun',
        definition: '你好'
      },
      {
        word: 'existing',
        definition: '已存在（新）'
      },
      {
        word: 'world',
        definition: '世界'
      }
    ]

    const { csvService } = await import('@/services/csv-service')
    vi.mocked(csvService.parseCSV).mockResolvedValue({
      rows,
      errors: []
    })

    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    const result = await importService.importCSV(file, {
      databaseAction: 'append',
      duplicateAction: 'skip'
    })

    // Verify import result
    expect(result.successCount).toBe(2) // hello and world
    expect(result.duplicateCount).toBe(1) // existing
    expect(result.skippedCount).toBe(1)

    // Verify database state
    const allWords = await wordRepository.getAll()
    expect(allWords.length).toBe(3) // existing + hello + world
    
    const helloWord = allWords.find(w => w.lemma === 'hello')
    expect(helloWord).toBeDefined()
    expect(helloWord?.definitionZh).toBe('你好')
    expect(helloWord?.phonetics).toContain('/həˈloʊ/')
    expect(helloWord?.audioUrls).toContain('https://example.com/hello.mp3')

    // Existing word should remain unchanged
    const existingWordInDb = allWords.find(w => w.lemma === 'existing')
    expect(existingWordInDb?.definitionZh).toBe('已存在')
  })

  it('should complete full import flow with clear mode', async () => {
    // Create existing words
    const word1 = createWord('old1')
    const word2 = createWord('old2')
    await wordRepository.create(word1)
    await wordRepository.create(word2)

    const rows: CSVRow[] = [
      {
        word: 'new1',
        definition: '新的1'
      },
      {
        word: 'new2',
        definition: '新的2'
      }
    ]

    const { csvService } = await import('@/services/csv-service')
    vi.mocked(csvService.parseCSV).mockResolvedValue({
      rows,
      errors: []
    })

    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    const result = await importService.importCSV(file, {
      databaseAction: 'clear',
      duplicateAction: 'skip'
    })

    // Verify all old words are cleared
    const allWords = await wordRepository.getAll()
    expect(allWords.length).toBe(2)
    expect(allWords.find(w => w.lemma === 'old1')).toBeUndefined()
    expect(allWords.find(w => w.lemma === 'old2')).toBeUndefined()
    expect(allWords.find(w => w.lemma === 'new1')).toBeDefined()
    expect(allWords.find(w => w.lemma === 'new2')).toBeDefined()
  })

  it('should handle mixed valid and invalid rows', async () => {
    const rows: CSVRow[] = [
      {
        word: 'valid1',
        definition: '有效1'
      },
      {
        word: '',
        definition: '無效（空單字）'
      },
      {
        word: 'valid2',
        definition: '有效2'
      },
      {
        word: 'invalid@word',
        definition: '無效（格式錯誤）'
      }
    ]

    const { csvService } = await import('@/services/csv-service')
    vi.mocked(csvService.parseCSV).mockResolvedValue({
      rows: rows.filter(r => r.word && /^[a-zA-Z0-9\s\-'.,()]+$/.test(r.word) && r.definition),
      errors: [
        { row: 3, message: '單字欄位為空' },
        { row: 5, message: '無效的單字格式: invalid@word' }
      ]
    })

    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    const result = await importService.importCSV(file)

    expect(result.successCount).toBe(2)
    expect(result.job.errors.length).toBe(2)

    const allWords = await wordRepository.getAll()
    expect(allWords.length).toBe(2)
  })

  it('should preserve word IDs when overwriting', async () => {
    // Create existing word
    const existingWord = createWord('hello')
    existingWord.definitionZh = '你好（舊）'
    const originalId = existingWord.id
    await wordRepository.create(existingWord)

    const rows: CSVRow[] = [
      {
        word: 'hello',
        definition: '你好（新）'
      }
    ]

    const { csvService } = await import('@/services/csv-service')
    vi.mocked(csvService.parseCSV).mockResolvedValue({
      rows,
      errors: []
    })

    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    await importService.importCSV(file, {
      databaseAction: 'append',
      duplicateAction: 'overwrite'
    })

    const allWords = await wordRepository.getAll()
    const updatedWord = allWords.find(w => w.lemma === 'hello')
    
    expect(updatedWord?.id).toBe(originalId)
    expect(updatedWord?.definitionZh).toBe('你好（新）')
  })
})

