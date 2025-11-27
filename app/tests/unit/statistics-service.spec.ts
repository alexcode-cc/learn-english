import { describe, it, expect, beforeEach, vi } from 'vitest'
import { statisticsService } from '@/services/statistics-service'
import { learningSessionService } from '@/services/learning-session-service'
import { quizRepository } from '@/services/quiz-repository'
import { createQuiz } from '@/types/quiz'
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

describe('StatisticsService', () => {
  beforeEach(async () => {
    // Clear database
    const db = await initDB()
    const tx = db.transaction(['learningSessions', 'quizzes', 'quizQuestions'], 'readwrite')
    await tx.objectStore('learningSessions').clear()
    await tx.objectStore('quizzes').clear()
    await tx.objectStore('quizQuestions').clear()
    await tx.done
    vi.clearAllMocks()
  })

  describe('aggregateLearningTrends', () => {
    it('should aggregate learning trends by date', async () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      // Create sessions for different dates
      const session1 = await learningSessionService.createSession('study', [])
      session1.startedAt = today.toISOString()
      session1.durationMs = 30 * 60 * 1000 // 30 minutes
      session1.endedAt = today.toISOString()
      await learningSessionService.update(session1)

      const session2 = await learningSessionService.createSession('review', [])
      session2.startedAt = yesterday.toISOString()
      session2.durationMs = 15 * 60 * 1000 // 15 minutes
      session2.endedAt = yesterday.toISOString()
      await learningSessionService.update(session2)

      const trends = await statisticsService.aggregateLearningTrends(7) // Last 7 days

      expect(trends.length).toBeGreaterThan(0)
      const todayTrend = trends.find(t => t.date === today.toISOString().split('T')[0])
      expect(todayTrend).toBeDefined()
      expect(todayTrend?.minutes).toBe(30)
    })

    it('should return empty array when no sessions exist', async () => {
      const trends = await statisticsService.aggregateLearningTrends(7)
      expect(trends).toEqual([])
    })

    it('should filter by date range', async () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 10) // 10 days ago

      const session = await learningSessionService.createSession('study', [])
      session.startedAt = oldDate.toISOString()
      session.durationMs = 20 * 60 * 1000
      session.endedAt = oldDate.toISOString()
      await learningSessionService.update(session)

      const trends = await statisticsService.aggregateLearningTrends(7) // Last 7 days only

      // Should not include session from 10 days ago
      expect(trends.length).toBe(0)
    })
  })

  describe('aggregateQuizScores', () => {
    it('should aggregate quiz scores by date', async () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      // Create quizzes with scores
      const quiz1 = createQuiz('multiple-choice')
      quiz1.createdAt = today.toISOString()
      quiz1.scorePercent = 85
      await quizRepository.create(quiz1)

      const quiz2 = createQuiz('fill-in')
      quiz2.createdAt = yesterday.toISOString()
      quiz2.scorePercent = 70
      await quizRepository.create(quiz2)

      const scores = await statisticsService.aggregateQuizScores(7) // Last 7 days

      expect(scores.length).toBeGreaterThan(0)
      const todayScore = scores.find(s => s.date === today.toISOString().split('T')[0])
      expect(todayScore).toBeDefined()
      expect(todayScore?.score).toBe(85)
    })

    it('should return empty array when no quizzes exist', async () => {
      const scores = await statisticsService.aggregateQuizScores(7)
      expect(scores).toEqual([])
    })

    it('should calculate average score for multiple quizzes on same day', async () => {
      const today = new Date()

      const quiz1 = createQuiz('multiple-choice')
      quiz1.createdAt = today.toISOString()
      quiz1.scorePercent = 80
      await quizRepository.create(quiz1)

      const quiz2 = createQuiz('fill-in')
      quiz2.createdAt = today.toISOString()
      quiz2.scorePercent = 90
      await quizRepository.create(quiz2)

      const scores = await statisticsService.aggregateQuizScores(7)

      const todayScore = scores.find(s => s.date === today.toISOString().split('T')[0])
      expect(todayScore).toBeDefined()
      expect(todayScore?.score).toBe(85) // Average of 80 and 90
    })
  })

  describe('getDailyActivity', () => {
    it('should return daily activity minutes', async () => {
      const today = new Date()
      const dateStr = today.toISOString().split('T')[0]

      const session1 = await learningSessionService.createSession('study', [])
      session1.startedAt = today.toISOString()
      session1.durationMs = 20 * 60 * 1000
      session1.endedAt = today.toISOString()
      await learningSessionService.update(session1)

      const session2 = await learningSessionService.createSession('review', [])
      session2.startedAt = today.toISOString()
      session2.durationMs = 10 * 60 * 1000
      session2.endedAt = today.toISOString()
      await learningSessionService.update(session2)

      const activity = await statisticsService.getDailyActivity(dateStr)

      expect(activity).toBe(30) // 20 + 10 minutes
    })

    it('should return zero for date with no activity', async () => {
      const activity = await statisticsService.getDailyActivity('2024-01-01')
      expect(activity).toBe(0)
    })
  })
})

