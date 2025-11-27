import { learningSessionService } from './learning-session-service'
import { progressService } from './progress-service'
import { logger } from '@/utils/logger'

export class StreakService {
  /**
   * Calculate current streak days
   */
  async calculateStreak(): Promise<number> {
    const sessions = await learningSessionService.getAll()
    const endedSessions = sessions.filter(s => s.endedAt !== null)
    
    if (endedSessions.length === 0) {
      return 0
    }

    // Get unique dates with activity
    const activityDates = new Set<string>()
    for (const session of endedSessions) {
      if (session.endedAt) {
        const dateStr = session.endedAt.split('T')[0]
        activityDates.add(dateStr)
      }
    }

    if (activityDates.size === 0) {
      return 0
    }

    // Sort dates descending
    const sortedDates = Array.from(activityDates).sort((a, b) => b.localeCompare(a))
    
    // Calculate streak
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < sortedDates.length; i++) {
      const dateStr = sortedDates[i]
      const activityDate = new Date(dateStr)
      activityDate.setHours(0, 0, 0, 0)
      
      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() - i)
      
      // Check if this date matches expected date in streak
      if (activityDate.getTime() === expectedDate.getTime()) {
        streak++
      } else {
        // If we're checking today and it's not there, check yesterday
        if (i === 0) {
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          if (activityDate.getTime() === yesterday.getTime()) {
            streak++
            // Continue checking from yesterday
            continue
          }
        }
        // Streak broken
        break
      }
    }

    logger.debug('Calculated streak', { streak })
    return streak
  }

  /**
   * Update streak in progress
   */
  async updateStreak(): Promise<number> {
    const streak = await this.calculateStreak()
    const progress = await progressService.getProgress()
    
    if (progress) {
      progress.streakDays = streak
      await progressService.updateProgress(progress)
    }

    return streak
  }

  /**
   * Check if user has activity today
   */
  async hasActivityToday(): Promise<boolean> {
    const sessions = await learningSessionService.getAll()
    const today = new Date().toISOString().split('T')[0]
    
    return sessions.some(s => {
      if (!s.endedAt) return false
      return s.endedAt.split('T')[0] === today
    })
  }
}

export const streakService = new StreakService()

