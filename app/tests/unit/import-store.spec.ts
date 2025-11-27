import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useImportStore } from '@/stores/useImportStore'
import { wordRepository } from '@/services/word-repository'
import { initDB } from '@/services/db'
import { createWord } from '@/types/word'
import type { CSVRow } from '@/services/csv-service'

// Mock CSV service
vi.mock('@/services/csv-service', () => ({
  csvService: {
    parseCSV: vi.fn(),
    validateCSVFile: vi.fn(() => ({ valid: true }))
  }
}))

// Mock import service
vi.mock('@/services/import-service', () => ({
  importService: {
    importCSVFromRows: vi.fn()
  }
}))

describe('useImportStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    
    // Clear database
    const db = await initDB()
    const tx = db.transaction(['words', 'importJobs'], 'readwrite')
    await tx.objectStore('words').clear()
    await tx.objectStore('importJobs').clear()
    await tx.done
    
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const store = useImportStore()
    
    expect(store.currentJob).toBeNull()
    expect(store.isImporting).toBe(false)
    expect(store.duplicateAction).toBe('skip')
    expect(store.databaseAction).toBe('append')
    expect(store.importProgress.current).toBe(0)
    expect(store.importProgress.total).toBe(0)
    expect(store.parsedCSVData).toBeNull()
    expect(store.csvFileName).toBe('')
    expect(store.csvParseErrors).toEqual([])
  })

  it('should set duplicate action', () => {
    const store = useImportStore()
    
    store.setDuplicateAction('overwrite')
    expect(store.duplicateAction).toBe('overwrite')
    
    store.setDuplicateAction('skip')
    expect(store.duplicateAction).toBe('skip')
  })

  it('should set database action', () => {
    const store = useImportStore()
    
    store.setDatabaseAction('clear')
    expect(store.databaseAction).toBe('clear')
    
    store.setDatabaseAction('append')
    expect(store.databaseAction).toBe('append')
  })

  it('should parse CSV and check duplicates from parsed data', async () => {
    const store = useImportStore()
    const { csvService } = await import('@/services/csv-service')
    
    const mockRows: CSVRow[] = [
      { word: 'hello', definition: '你好' },
      { word: 'world', definition: '世界' }
    ]

    // Create existing word
    const existingWord = createWord('hello')
    existingWord.definitionZh = '你好'
    await wordRepository.create(existingWord)

    vi.mocked(csvService.parseCSV).mockResolvedValue({
      rows: mockRows,
      errors: []
    })

    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    await store.parseCSV(file)

    const result = await store.checkDuplicatesFromParsedData()

    expect(result.duplicates).toContain('hello')
    expect(result.duplicates).not.toContain('world')
    expect(result.total).toBe(2)
  })

  it('should parse CSV and start import with progress tracking', async () => {
    const store = useImportStore()
    const { csvService } = await import('@/services/csv-service')
    const { importService } = await import('@/services/import-service')
    
    const mockRows: CSVRow[] = [
      { word: 'hello', definition: '你好' },
      { word: 'world', definition: '世界' }
    ]

    const mockResult = {
      job: {
        id: 'job-1',
        filename: 'test.csv',
        totalWords: 2,
        processedWords: 2,
        status: 'completed' as const,
        errors: [],
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString()
      },
      successCount: 2,
      errorCount: 0,
      duplicateCount: 0,
      skippedCount: 0
    }

    vi.mocked(csvService.parseCSV).mockResolvedValue({
      rows: mockRows,
      errors: []
    })

    vi.mocked(importService.importCSVFromRows).mockImplementation(async (rows, filename, errors, options) => {
      // Simulate progress
      if (options?.onProgress) {
        options.onProgress(1, 2, 'hello')
        options.onProgress(2, 2, 'world')
      }
      return mockResult
    })

    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    await store.parseCSV(file)
    const result = await store.startImportFromParsedData()

    expect(store.isImporting).toBe(false)
    expect(store.importResult).toEqual(mockResult)
    expect(store.currentJob).toEqual(mockResult.job)
    expect(result).toEqual(mockResult)
  })

  it('should prevent concurrent imports', async () => {
    const store = useImportStore()
    const { csvService } = await import('@/services/csv-service')
    const { importService } = await import('@/services/import-service')
    
    const mockRows: CSVRow[] = [
      { word: 'hello', definition: '你好' }
    ]

    vi.mocked(csvService.parseCSV).mockResolvedValue({
      rows: mockRows,
      errors: []
    })
    
    vi.mocked(importService.importCSVFromRows).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        job: {
          id: 'job-1',
          filename: 'test.csv',
          totalWords: 1,
          processedWords: 1,
          status: 'completed' as const,
          errors: [],
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString()
        },
        successCount: 1,
        errorCount: 0,
        duplicateCount: 0,
        skippedCount: 0
      }), 100))
    )

    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    await store.parseCSV(file)
    
    // Start first import
    const promise1 = store.startImportFromParsedData()
    expect(store.isImporting).toBe(true)
    
    // Try to start second import (should fail)
    await expect(store.startImportFromParsedData()).rejects.toThrow('匯入正在進行中')
    
    await promise1
    expect(store.isImporting).toBe(false)
  })

  it('should calculate progress percentage', async () => {
    const store = useImportStore()
    const { csvService } = await import('@/services/csv-service')
    const { importService } = await import('@/services/import-service')
    
    const mockRows: CSVRow[] = [
      { word: 'word1', definition: '單字1' },
      { word: 'word2', definition: '單字2' },
      { word: 'word3', definition: '單字3' },
      { word: 'word4', definition: '單字4' }
    ]

    vi.mocked(csvService.parseCSV).mockResolvedValue({
      rows: mockRows,
      errors: []
    })
    
    vi.mocked(importService.importCSVFromRows).mockImplementation(async (rows, filename, errors, options) => {
      if (options?.onProgress) {
        options.onProgress(1, 4, 'word1')
        options.onProgress(2, 4, 'word2')
        options.onProgress(3, 4, 'word3')
        options.onProgress(4, 4, 'word4')
      }
      return {
        job: {
          id: 'job-1',
          filename: 'test.csv',
          totalWords: 4,
          processedWords: 4,
          status: 'completed' as const,
          errors: [],
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString()
        },
        successCount: 4,
        errorCount: 0,
        duplicateCount: 0,
        skippedCount: 0
      }
    })

    const file = new File(['test'], 'test.csv', { type: 'text/csv' })
    await store.parseCSV(file)
    await store.startImportFromParsedData()

    expect(store.progressPercentage).toBe(100)
  })

  it('should reset state', () => {
    const store = useImportStore()
    
    store.setDuplicateAction('overwrite')
    store.setDatabaseAction('clear')
    store.importProgress.current = 5
    store.importProgress.total = 10
    
    store.reset()
    
    expect(store.currentJob).toBeNull()
    expect(store.isImporting).toBe(false)
    expect(store.importProgress.current).toBe(0)
    expect(store.importProgress.total).toBe(0)
    expect(store.importResult).toBeNull()
    expect(store.parsedCSVData).toBeNull()
    expect(store.csvFileName).toBe('')
    expect(store.csvParseErrors).toEqual([])
    // Note: duplicateAction and databaseAction are not reset (by design)
  })
})

