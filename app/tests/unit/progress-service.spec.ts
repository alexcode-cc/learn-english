import { describe, it, expect, beforeEach, vi } from 'vitest'
import { progressService } from '@/services/progress-service'
import { wordRepository } from '@/services/word-repository'
import { learningSessionService } from '@/services/learning-session-service'
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

describe('ProgressService', () => {
  beforeEach(async () => {
    // Clear database
    const db = await initDB()
    const tx = db.transaction(['words', 'learningSessions', 'userProgress'], 'readwrite')
    await tx.objectStore('words').clear()
    await tx.objectStore('learningSessions').clear()
    await tx.objectStore('userProgress').clear()
    await tx.done
    vi.clearAllMocks()
  })

  describe('calculateProgress', () => {
    it('should calculate total words and mastered words', async () => {
      // Create test words
      const word1 = createWord('hello')
      word1.status = 'mastered'
      await wordRepository.create(word1)

      const word2 = createWord('world')
      word2.status = 'learning'
      await wordRepository.create(word2)

      const word3 = createWord('test')
      word3.status = 'unlearned'
      await wordRepository.create(word3)

      const progress = await progressService.calculateProgress()

      expect(progress.totalWords).toBe(3)
      expect(progress.masteredWords).toBe(1)
    })

    it('should return zero progress when no words exist', async () => {
      const progress = await progressService.calculateProgress()

      expect(progress.totalWords).toBe(0)
      expect(progress.masteredWords).toBe(0)
    })

    it('should only count mastered words correctly', async () => {
      const word1 = createWord('hello')
      word1.status = 'mastered'
      await wordRepository.create(word1)

      const word2 = createWord('world')
      word2.status = 'mastered'
      await wordRepository.create(word2)

      const progress = await progressService.calculateProgress()

      expect(progress.totalWords).toBe(2)
      expect(progress.masteredWords).toBe(2)
    })
  })

  describe('updateProgress', () => {
    it('should update progress in database', async () => {
      const progress = await progressService.calculateProgress()
      progress.totalWords = 10
      progress.masteredWords = 5

      await progressService.updateProgress(progress)

      const updated = await progressService.getProgress()
      expect(updated?.totalWords).toBe(10)
      expect(updated?.masteredWords).toBe(5)
    })

    it('should create progress if it does not exist', async () => {
      const progress = await progressService.calculateProgress()
      progress.totalWords = 5
      progress.masteredWords = 2

      await progressService.updateProgress(progress)

      const saved = await progressService.getProgress()
      expect(saved).toBeDefined()
      expect(saved?.totalWords).toBe(5)
      expect(saved?.masteredWords).toBe(2)
    })
  })

  describe('getProgress', () => {
    it('should return progress from database', async () => {
      const progress = await progressService.calculateProgress()
      progress.totalWords = 10
      progress.masteredWords = 5
      await progressService.updateProgress(progress)

      const retrieved = await progressService.getProgress()

      expect(retrieved).toBeDefined()
      expect(retrieved?.totalWords).toBe(10)
      expect(retrieved?.masteredWords).toBe(5)
    })

    it('should return undefined if progress does not exist', async () => {
      const retrieved = await progressService.getProgress()
      expect(retrieved).toBeUndefined()
    })
  })

  describe('calculateTotalStudyMinutes', () => {
    it('should calculate total study minutes from sessions', async () => {
      // Create test sessions
      const session1 = await learningSessionService.createSession('study', [])
      session1.durationMs = 10 * 60 * 1000 // 10 minutes
      session1.endedAt = new Date().toISOString()
      await learningSessionService.update(session1)

      const session2 = await learningSessionService.createSession('review', [])
      session2.durationMs = 5 * 60 * 1000 // 5 minutes
      session2.endedAt = new Date().toISOString()
      await learningSessionService.update(session2)

      const totalMinutes = await progressService.calculateTotalStudyMinutes()

      expect(totalMinutes).toBe(15) // 10 + 5 minutes
    })

    it('should return zero when no sessions exist', async () => {
      const totalMinutes = await progressService.calculateTotalStudyMinutes()
      expect(totalMinutes).toBe(0)
    })

    it('should only count ended sessions', async () => {
      const session1 = await learningSessionService.createSession('study', [])
      session1.durationMs = 10 * 60 * 1000
      session1.endedAt = new Date().toISOString()
      await learningSessionService.update(session1)

      // Active session (not ended)
      await learningSessionService.createSession('study', [])

      const totalMinutes = await progressService.calculateTotalStudyMinutes()

      expect(totalMinutes).toBe(10) // Only ended session counts
    })
  })
})

