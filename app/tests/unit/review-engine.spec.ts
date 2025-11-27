import { describe, it, expect, beforeEach, vi } from 'vitest'
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

// Import will be available after implementation
// import { reviewEngine } from '@/services/review-engine'

describe('ReviewEngine', () => {
  beforeEach(async () => {
    // Clear database
    const db = await initDB()
    const tx = db.transaction(['words'], 'readwrite')
    await tx.objectStore('words').clear()
    await tx.done
    vi.clearAllMocks()
  })

  describe('calculateNextReviewDate', () => {
    it('should calculate next review date for newly learned word', async () => {
      // This test will fail until implementation
      const word = createWord('hello')
      word.status = 'learning'
      word.lastStudiedAt = new Date().toISOString()
      await wordRepository.create(word)

      // TODO: Implement reviewEngine.calculateNextReviewDate
      // const nextReview = await reviewEngine.calculateNextReviewDate(word.id)
      // expect(nextReview).toBeDefined()
      // expect(new Date(nextReview).getTime()).toBeGreaterThan(Date.now())
    })

    it('should use shorter interval for words marked as needs review', async () => {
      const word = createWord('world')
      word.status = 'learning'
      word.needsReview = true
      word.lastStudiedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      await wordRepository.create(word)

      // TODO: Implement reviewEngine.calculateNextReviewDate with needsReview flag
      // const nextReview = await reviewEngine.calculateNextReviewDate(word.id)
      // expect(nextReview).toBeDefined()
    })

    it('should use longer interval for mastered words', async () => {
      const word = createWord('test')
      word.status = 'mastered'
      word.lastStudiedAt = new Date().toISOString()
      await wordRepository.create(word)

      // TODO: Implement reviewEngine.calculateNextReviewDate for mastered words
      // const nextReview = await reviewEngine.calculateNextReviewDate(word.id)
      // expect(nextReview).toBeDefined()
      // const interval = new Date(nextReview).getTime() - new Date(word.lastStudiedAt!).getTime()
      // expect(interval).toBeGreaterThan(7 * 24 * 60 * 60 * 1000) // At least 7 days
    })
  })

  describe('getWordsDueForReview', () => {
    it('should return words that are due for review', async () => {
      const word1 = createWord('hello')
      word1.reviewDueAt = new Date(Date.now() - 1000).toISOString() // Past due
      word1.needsReview = true
      await wordRepository.create(word1)

      const word2 = createWord('world')
      word2.reviewDueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Future
      await wordRepository.create(word2)

      // TODO: Implement reviewEngine.getWordsDueForReview
      // const dueWords = await reviewEngine.getWordsDueForReview()
      // expect(dueWords).toHaveLength(1)
      // expect(dueWords[0].id).toBe(word1.id)
    })

    it('should return empty array when no words are due', async () => {
      const word = createWord('test')
      word.reviewDueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      await wordRepository.create(word)

      // TODO: Implement reviewEngine.getWordsDueForReview
      // const dueWords = await reviewEngine.getWordsDueForReview()
      // expect(dueWords).toHaveLength(0)
    })

    it('should include words marked as needsReview even if reviewDueAt is null', async () => {
      const word = createWord('example')
      word.needsReview = true
      word.reviewDueAt = null
      await wordRepository.create(word)

      // TODO: Implement reviewEngine.getWordsDueForReview
      // const dueWords = await reviewEngine.getWordsDueForReview()
      // expect(dueWords).toHaveLength(1)
      // expect(dueWords[0].id).toBe(word.id)
    })
  })

  describe('updateReviewSchedule', () => {
    it('should update review schedule after successful review', async () => {
      const word = createWord('hello')
      word.status = 'learning'
      word.lastStudiedAt = new Date().toISOString()
      await wordRepository.create(word)

      // TODO: Implement reviewEngine.updateReviewSchedule
      // await reviewEngine.updateReviewSchedule(word.id, true) // Successfully reviewed
      // const updatedWord = await wordRepository.getById(word.id)
      // expect(updatedWord?.reviewDueAt).toBeDefined()
      // expect(updatedWord?.needsReview).toBe(false)
    })

    it('should schedule earlier review for failed review', async () => {
      const word = createWord('world')
      word.status = 'learning'
      word.lastStudiedAt = new Date().toISOString()
      await wordRepository.create(word)

      // TODO: Implement reviewEngine.updateReviewSchedule
      // await reviewEngine.updateReviewSchedule(word.id, false) // Failed review
      // const updatedWord = await wordRepository.getById(word.id)
      // expect(updatedWord?.needsReview).toBe(true)
      // expect(updatedWord?.reviewDueAt).toBeDefined()
      // const interval = new Date(updatedWord!.reviewDueAt!).getTime() - Date.now()
      // expect(interval).toBeLessThan(24 * 60 * 60 * 1000) // Should be within 24 hours
    })
  })

  describe('spacedRepetitionAlgorithm', () => {
    it('should increase interval exponentially for successful reviews', async () => {
      const word = createWord('test')
      word.status = 'learning'
      word.lastStudiedAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      await wordRepository.create(word)

      // TODO: Implement spaced repetition algorithm
      // First review: 1 day interval
      // Second review: 3 days interval
      // Third review: 7 days interval
      // etc.
    })

    it('should reset interval for failed reviews', async () => {
      const word = createWord('example')
      word.status = 'learning'
      word.lastStudiedAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      await wordRepository.create(word)

      // TODO: Implement interval reset on failure
      // After failed review, next interval should be shorter (e.g., 1 day)
    })
  })
})

