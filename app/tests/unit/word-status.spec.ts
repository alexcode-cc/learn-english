import { describe, it, expect, beforeEach, vi } from 'vitest'
import { wordStatusService } from '@/services/word-status-service'
import { wordRepository } from '@/services/word-repository'
import { createWord } from '@/types/word'
import { initDB } from '@/services/db'

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

describe('WordStatusService', () => {
  beforeEach(async () => {
    // Clear database
    const db = await initDB()
    const tx = db.transaction(['words'], 'readwrite')
    await tx.objectStore('words').clear()
    await tx.done
    vi.clearAllMocks()
  })

  describe('updateStatus', () => {
    it('should update word status to mastered', async () => {
      const word = createWord('hello')
      word.definitionZh = '你好'
      await wordRepository.create(word)

      await wordStatusService.updateStatus(word.id, 'mastered')

      const updatedWord = await wordRepository.getById(word.id)
      expect(updatedWord?.status).toBe('mastered')
      expect(updatedWord?.lastStudiedAt).toBeDefined()
    })

    it('should update word status to learning', async () => {
      const word = createWord('world')
      word.status = 'unlearned'
      await wordRepository.create(word)

      await wordStatusService.updateStatus(word.id, 'learning')

      const updatedWord = await wordRepository.getById(word.id)
      expect(updatedWord?.status).toBe('learning')
      expect(updatedWord?.lastStudiedAt).toBeDefined()
    })

    it('should throw error if word not found', async () => {
      const nonExistentId = 'non-existent-id'

      await expect(
        wordStatusService.updateStatus(nonExistentId, 'mastered')
      ).rejects.toThrow('Word with id non-existent-id not found')
    })

    it('should update lastStudiedAt timestamp', async () => {
      const word = createWord('test')
      await wordRepository.create(word)

      const beforeUpdate = Date.now()
      await wordStatusService.updateStatus(word.id, 'mastered')
      const afterUpdate = Date.now()

      const updatedWord = await wordRepository.getById(word.id)
      expect(updatedWord?.lastStudiedAt).toBeDefined()
      if (updatedWord?.lastStudiedAt) {
        const lastStudied = new Date(updatedWord.lastStudiedAt).getTime()
        expect(lastStudied).toBeGreaterThanOrEqual(beforeUpdate)
        expect(lastStudied).toBeLessThanOrEqual(afterUpdate)
      }
    })
  })

  describe('markAsMastered', () => {
    it('should mark word as mastered', async () => {
      const word = createWord('hello')
      word.status = 'learning'
      await wordRepository.create(word)

      await wordStatusService.markAsMastered(word.id)

      const updatedWord = await wordRepository.getById(word.id)
      expect(updatedWord?.status).toBe('mastered')
      expect(updatedWord?.lastStudiedAt).toBeDefined()
    })

    it('should update lastStudiedAt when marking as mastered', async () => {
      const word = createWord('test')
      await wordRepository.create(word)

      await wordStatusService.markAsMastered(word.id)

      const updatedWord = await wordRepository.getById(word.id)
      expect(updatedWord?.lastStudiedAt).toBeDefined()
    })
  })

  describe('markAsNeedsReview', () => {
    it('should mark word as needs review', async () => {
      const word = createWord('hello')
      word.needsReview = false
      await wordRepository.create(word)

      await wordStatusService.markAsNeedsReview(word.id)

      const updatedWord = await wordRepository.getById(word.id)
      expect(updatedWord?.needsReview).toBe(true)
    })

    it('should throw error if word not found', async () => {
      const nonExistentId = 'non-existent-id'

      await expect(
        wordStatusService.markAsNeedsReview(nonExistentId)
      ).rejects.toThrow('Word with id non-existent-id not found')
    })

    it('should preserve other word properties when marking as needs review', async () => {
      const word = createWord('test')
      word.definitionZh = '測試'
      word.definitionEn = 'test'
      word.status = 'learning'
      await wordRepository.create(word)

      await wordStatusService.markAsNeedsReview(word.id)

      const updatedWord = await wordRepository.getById(word.id)
      expect(updatedWord?.needsReview).toBe(true)
      expect(updatedWord?.definitionZh).toBe('測試')
      expect(updatedWord?.definitionEn).toBe('test')
      expect(updatedWord?.status).toBe('learning')
    })
  })
})

