import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProgressStore } from '@/stores/useProgressStore'
import { wordRepository } from '@/services/word-repository'
import { learningSessionService } from '@/services/learning-session-service'
import { quizRepository } from '@/services/quiz-repository'
import { createWord } from '@/types/word'
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

describe('Progress Tracking Integration', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    
    // Clear database
    const db = await initDB()
    const tx = db.transaction(
      ['words', 'learningSessions', 'quizzes', 'userProgress'],
      'readwrite'
    )
    await tx.objectStore('words').clear()
    await tx.objectStore('learningSessions').clear()
    await tx.objectStore('quizzes').clear()
    await tx.objectStore('userProgress').clear()
    await tx.done
    vi.clearAllMocks()
  })

  it('should track progress from words and sessions', async () => {
    // Create test words
    const word1 = createWord('hello')
    word1.status = 'mastered'
    await wordRepository.create(word1)

    const word2 = createWord('world')
    word2.status = 'learning'
    await wordRepository.create(word2)

    // Create learning session
    const session = await learningSessionService.createSession('study', [word1.id, word2.id])
    session.durationMs = 30 * 60 * 1000 // 30 minutes
    session.endedAt = new Date().toISOString()
    await learningSessionService.update(session)

    // Load progress
    const progressStore = useProgressStore()
    await progressStore.loadProgress()

    expect(progressStore.progress).toBeDefined()
    expect(progressStore.progress?.totalWords).toBe(2)
    expect(progressStore.progress?.masteredWords).toBe(1)
    expect(progressStore.progress?.totalStudyMinutes).toBe(30)
  })

  it('should aggregate learning trends from sessions', async () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Create sessions for different dates
    const session1 = await learningSessionService.createSession('study', [])
    session1.startedAt = today.toISOString()
    session1.durationMs = 20 * 60 * 1000
    session1.endedAt = today.toISOString()
    await learningSessionService.update(session1)

    const session2 = await learningSessionService.createSession('review', [])
    session2.startedAt = yesterday.toISOString()
    session2.durationMs = 15 * 60 * 1000
    session2.endedAt = yesterday.toISOString()
    await learningSessionService.update(session2)

    const progressStore = useProgressStore()
    await progressStore.loadLearningTrends(7)

    expect(progressStore.learningTrends.length).toBeGreaterThan(0)
    const todayTrend = progressStore.learningTrends.find(
      t => t.date === today.toISOString().split('T')[0]
    )
    expect(todayTrend).toBeDefined()
    expect(todayTrend?.minutes).toBe(20)
  })

  it('should aggregate quiz scores', async () => {
    const today = new Date()

    const quiz1 = createQuiz('multiple-choice')
    quiz1.createdAt = today.toISOString()
    quiz1.scorePercent = 85
    await quizRepository.create(quiz1)

    const quiz2 = createQuiz('fill-in')
    quiz2.createdAt = today.toISOString()
    quiz2.scorePercent = 75
    await quizRepository.create(quiz2)

    const progressStore = useProgressStore()
    await progressStore.loadQuizScoreTrends(7)

    expect(progressStore.quizScoreTrends.length).toBeGreaterThan(0)
    const todayScore = progressStore.quizScoreTrends.find(
      s => s.date === today.toISOString().split('T')[0]
    )
    expect(todayScore).toBeDefined()
    expect(todayScore?.score).toBe(80) // Average of 85 and 75
  })

  it('should calculate streak from sessions', async () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Create sessions for consecutive days
    const session1 = await learningSessionService.createSession('study', [])
    session1.startedAt = today.toISOString()
    session1.durationMs = 10 * 60 * 1000
    session1.endedAt = today.toISOString()
    await learningSessionService.update(session1)

    const session2 = await learningSessionService.createSession('review', [])
    session2.startedAt = yesterday.toISOString()
    session2.durationMs = 5 * 60 * 1000
    session2.endedAt = yesterday.toISOString()
    await learningSessionService.update(session2)

    const progressStore = useProgressStore()
    await progressStore.loadProgress()

    expect(progressStore.progress?.streakDays).toBeGreaterThanOrEqual(1)
  })

  it('should update heatmap data', async () => {
    const today = new Date()

    const session = await learningSessionService.createSession('study', [])
    session.startedAt = today.toISOString()
    session.durationMs = 25 * 60 * 1000
    session.endedAt = today.toISOString()
    await learningSessionService.update(session)

    const progressStore = useProgressStore()
    await progressStore.loadHeatmapData(365)

    const dateStr = today.toISOString().split('T')[0]
    expect(progressStore.heatmapData[dateStr]).toBe(25)
  })
})

