import { initDB } from './db'
import { wordRepository } from './word-repository'
import { learningSessionService } from './learning-session-service'
import type { UserProgress } from '@/types/user-progress'
import { createUserProgress } from '@/types/user-progress'
import { logger } from '@/utils/logger'

export class ProgressService {
  private dbPromise = initDB()

  /**
   * Calculate current progress from words
   */
  async calculateProgress(): Promise<UserProgress> {
    const words = await wordRepository.getAll()
    const totalWords = words.length
    const masteredWords = words.filter(w => w.status === 'mastered').length
    const totalStudyMinutes = await this.calculateTotalStudyMinutes()
    
    // Get existing progress or create new
    let progress = await this.getProgress()
    if (!progress) {
      progress = createUserProgress()
    }

    // Update calculated fields
    progress.totalWords = totalWords
    progress.masteredWords = masteredWords
    progress.totalStudyMinutes = totalStudyMinutes

    // Update last activity from words
    const lastStudiedWords = words
      .filter(w => w.lastStudiedAt)
      .sort((a, b) => {
        const aTime = a.lastStudiedAt ? new Date(a.lastStudiedAt).getTime() : 0
        const bTime = b.lastStudiedAt ? new Date(b.lastStudiedAt).getTime() : 0
        return bTime - aTime
      })

    if (lastStudiedWords.length > 0 && lastStudiedWords[0].lastStudiedAt) {
      progress.lastActivityAt = lastStudiedWords[0].lastStudiedAt
    }

    logger.debug('Calculated progress', {
      totalWords,
      masteredWords,
      totalStudyMinutes
    })

    return progress
  }

  /**
   * Calculate total study minutes from all ended sessions
   */
  async calculateTotalStudyMinutes(): Promise<number> {
    const sessions = await learningSessionService.getAll()
    const endedSessions = sessions.filter(s => s.endedAt !== null)
    
    const totalMs = endedSessions.reduce((sum, session) => sum + session.durationMs, 0)
    return Math.round(totalMs / (60 * 1000)) // Convert to minutes
  }

  /**
   * Get progress from database
   */
  async getProgress(): Promise<UserProgress | undefined> {
    const db = await this.dbPromise
    return db.get('userProgress', 'progress')
  }

  /**
   * Update progress in database
   */
  async updateProgress(progress: UserProgress): Promise<void> {
    const db = await this.dbPromise
    await db.put('userProgress', progress)
    
    logger.info('Updated progress', {
      totalWords: progress.totalWords,
      masteredWords: progress.masteredWords,
      streakDays: progress.streakDays
    })
  }

  /**
   * Refresh progress (recalculate and save)
   */
  async refreshProgress(): Promise<UserProgress> {
    const progress = await this.calculateProgress()
    await this.updateProgress(progress)
    return progress
  }
}

export const progressService = new ProgressService()

