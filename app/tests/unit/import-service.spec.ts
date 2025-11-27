import { describe, it, expect, beforeEach, vi } from 'vitest'
import { importService } from '@/services/import-service'
import { wordRepository } from '@/services/word-repository'
import { initDB } from '@/services/db'
import { createWord } from '@/types/word'
import type { CSVRow } from '@/services/csv-service'
import { csvService } from '@/services/csv-service'

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

describe('ImportService', () => {
  beforeEach(async () => {
    // Clear database before each test
    const db = await initDB()
    const tx = db.transaction(['words', 'importJobs'], 'readwrite')
    await tx.objectStore('words').clear()
    await tx.objectStore('importJobs').clear()
    await tx.done
    vi.clearAllMocks()
  })

  describe('clearAllWords', () => {
    it('should clear all words from database', async () => {
      // Create some words
      const word1 = createWord('hello')
      const word2 = createWord('world')
      await wordRepository.create(word1)
      await wordRepository.create(word2)

      expect((await wordRepository.getAll()).length).toBe(2)

      await importService.clearAllWords()

      expect((await wordRepository.getAll()).length).toBe(0)
    })
  })

  describe('checkDuplicates', () => {
    it('should detect duplicates in database', async () => {
      // Create existing word
      const existingWord = createWord('hello')
      existingWord.definitionZh = '你好'
      await wordRepository.create(existingWord)

      const { csvService } = await import('@/services/csv-service')
      vi.mocked(csvService.parseCSV).mockResolvedValue({
        rows: [
          { word: 'hello', definition: '你好' },
          { word: 'world', definition: '世界' }
        ],
        errors: []
      })

      const file = new File(['test'], 'test.csv', { type: 'text/csv' })
      const result = await importService.checkDuplicates(file)

      expect(result.duplicates).toContain('hello')
      expect(result.duplicates).not.toContain('world')
      expect(result.total).toBe(2)
    })

    it('should detect duplicates within file', async () => {
      const { csvService } = await import('@/services/csv-service')
      vi.mocked(csvService.parseCSV).mockResolvedValue({
        rows: [
          { word: 'hello', definition: '你好' },
          { word: 'hello', definition: '你好' },
          { word: 'world', definition: '世界' }
        ],
        errors: []
      })

      const file = new File(['test'], 'test.csv', { type: 'text/csv' })
      const result = await importService.checkDuplicates(file)

      expect(result.duplicates).toContain('hello')
      expect(result.total).toBe(3)
    })
  })

  describe('importCSV', () => {
    it('should import words with append mode', async () => {
      const rows: CSVRow[] = [
        {
          id: '1',
          word: 'hello',
          phonetic: '/həˈloʊ/',
          audioUrl: 'https://example.com/hello.mp3',
          partOfSpeech: 'noun',
          definition: '你好'
        },
        {
          id: '2',
          word: 'world',
          phonetic: '/wɜːrld/',
          audioUrl: 'https://example.com/world.mp3',
          partOfSpeech: 'noun',
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

      expect(result.successCount).toBe(2)
      expect(result.errorCount).toBe(0)
      expect(result.duplicateCount).toBe(0)
      expect(result.job.status).toBe('completed')

      const allWords = await wordRepository.getAll()
      expect(allWords.length).toBe(2)
      expect(allWords.find(w => w.lemma === 'hello')).toBeDefined()
      expect(allWords.find(w => w.lemma === 'world')).toBeDefined()
    })

    it('should clear database before import in clear mode', async () => {
      // Create existing words
      const existingWord = createWord('old')
      existingWord.definitionZh = '舊的'
      await wordRepository.create(existingWord)

      const rows: CSVRow[] = [
        {
          word: 'hello',
          phonetic: '/həˈloʊ/',
          definition: '你好'
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

      expect(result.successCount).toBe(1)
      const allWords = await wordRepository.getAll()
      expect(allWords.length).toBe(1)
      expect(allWords[0].lemma).toBe('hello')
      expect(allWords.find(w => w.lemma === 'old')).toBeUndefined()
    })

    it('should skip duplicate words when duplicateAction is skip', async () => {
      // Create existing word
      const existingWord = createWord('hello')
      existingWord.definitionZh = '你好'
      await wordRepository.create(existingWord)

      const rows: CSVRow[] = [
        {
          word: 'hello',
          definition: '你好（新）'
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

      expect(result.successCount).toBe(1)
      expect(result.duplicateCount).toBe(1)
      expect(result.skippedCount).toBe(1)

      const allWords = await wordRepository.getAll()
      expect(allWords.length).toBe(2)
      // Original word should remain unchanged
      const helloWord = allWords.find(w => w.lemma === 'hello')
      expect(helloWord?.definitionZh).toBe('你好')
    })

    it('should overwrite duplicate words when duplicateAction is overwrite', async () => {
      // Create existing word
      const existingWord = createWord('hello')
      existingWord.definitionZh = '你好（舊）'
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
      const result = await importService.importCSV(file, {
        databaseAction: 'append',
        duplicateAction: 'overwrite'
      })

      expect(result.successCount).toBe(1)
      expect(result.duplicateCount).toBe(1)
      expect(result.skippedCount).toBe(0)

      const allWords = await wordRepository.getAll()
      expect(allWords.length).toBe(1)
      expect(allWords[0].definitionZh).toBe('你好（新）')
    })

    it('should call onProgress callback', async () => {
      const rows: CSVRow[] = [
        { word: 'hello', definition: '你好' },
        { word: 'world', definition: '世界' }
      ]

      const { csvService } = await import('@/services/csv-service')
      vi.mocked(csvService.parseCSV).mockResolvedValue({
        rows,
        errors: []
      })

      const progressCalls: Array<[number, number, string]> = []
      const file = new File(['test'], 'test.csv', { type: 'text/csv' })
      
      await importService.importCSV(file, {
        onProgress: (current, total, word) => {
          progressCalls.push([current, total, word])
        }
      })

      expect(progressCalls.length).toBe(2)
      expect(progressCalls[0]).toEqual([1, 2, 'hello'])
      expect(progressCalls[1]).toEqual([2, 2, 'world'])
    })

    it('should handle errors during import', async () => {
      const rows: CSVRow[] = [
        { word: 'hello', definition: '你好' },
        { word: 'world', definition: '世界' }
      ]

      const { csvService } = await import('@/services/csv-service')
      vi.mocked(csvService.parseCSV).mockResolvedValue({
        rows,
        errors: []
      })

      // Mock repository to throw error for second word
      const originalCreate = wordRepository.create.bind(wordRepository)
      let callCount = 0
      vi.spyOn(wordRepository, 'create').mockImplementation(async (word) => {
        callCount++
        if (callCount === 2) {
          throw new Error('Database error')
        }
        return originalCreate(word)
      })

      const file = new File(['test'], 'test.csv', { type: 'text/csv' })
      const result = await importService.importCSV(file)

      expect(result.successCount).toBe(1)
      expect(result.errorCount).toBe(1)
      expect(result.job.errors.length).toBe(1)
      expect(result.job.errors[0].message).toContain('world')
    })

    it('should convert CSV row to Word correctly', async () => {
      const rows: CSVRow[] = [
        {
          word: 'hello',
          phonetic: '[həˈloʊ]',
          audioUrl: 'https://example.com/hello.mp3',
          partOfSpeech: 'noun',
          definition: '你好'
        }
      ]

      const { csvService } = await import('@/services/csv-service')
      vi.mocked(csvService.parseCSV).mockResolvedValue({
        rows,
        errors: []
      })

      const file = new File(['test'], 'test.csv', { type: 'text/csv' })
      await importService.importCSV(file)

      const allWords = await wordRepository.getAll()
      const word = allWords[0]
      
      expect(word.lemma).toBe('hello')
      expect(word.definitionZh).toBe('你好')
      expect(word.partOfSpeech).toBe('noun')
      expect(word.audioUrls).toContain('https://example.com/hello.mp3')
      expect(word.phonetics.length).toBeGreaterThan(0)
      expect(word.source).toBe('csv')
    })

    it('should not import CSV ID field', async () => {
      const rows: CSVRow[] = [
        {
          id: '999',
          word: 'hello',
          definition: '你好'
        }
      ]

      const { csvService } = await import('@/services/csv-service')
      vi.mocked(csvService.parseCSV).mockResolvedValue({
        rows,
        errors: []
      })

      const file = new File(['test'], 'test.csv', { type: 'text/csv' })
      await importService.importCSV(file)

      const allWords = await wordRepository.getAll()
      const word = allWords[0]
      
      // ID should be generated by database, not from CSV
      expect(word.id).not.toBe('999')
      expect(word.id).toBeDefined()
    })
  })
})

