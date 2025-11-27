import { learningSessionService } from './learning-session-service'
import { quizRepository } from './quiz-repository'
import { logger } from '@/utils/logger'

export interface LearningTrend {
  date: string // YYYY-MM-DD
  minutes: number
  wordCount: number
}

export interface QuizScoreTrend {
  date: string // YYYY-MM-DD
  score: number // Average score for the day
  quizCount: number
}

export class StatisticsService {
  /**
   * Aggregate learning trends over a period
   */
  async aggregateLearningTrends(days: number = 30): Promise<LearningTrend[]> {
    const sessions = await learningSessionService.getAll()
    const endedSessions = sessions.filter(s => s.endedAt !== null)
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    // Filter sessions within date range
    const recentSessions = endedSessions.filter(s => {
      if (!s.endedAt) return false
      const sessionDate = new Date(s.endedAt)
      return sessionDate >= cutoffDate
    })

    // Group by date
    const trendsMap = new Map<string, { minutes: number; wordCount: number }>()

    for (const session of recentSessions) {
      if (!session.endedAt) continue
      
      const dateStr = session.endedAt.split('T')[0]
      const minutes = Math.round(session.durationMs / (60 * 1000))
      const wordCount = session.wordIds.length

      const existing = trendsMap.get(dateStr) || { minutes: 0, wordCount: 0 }
      trendsMap.set(dateStr, {
        minutes: existing.minutes + minutes,
        wordCount: existing.wordCount + wordCount
      })
    }

    // Convert to array and sort by date
    const trends: LearningTrend[] = Array.from(trendsMap.entries())
      .map(([date, data]) => ({
        date,
        minutes: data.minutes,
        wordCount: data.wordCount
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    logger.debug(`Aggregated learning trends for ${days} days`, {
      trendCount: trends.length
    })

    return trends
  }

  /**
   * Aggregate quiz scores over a period
   */
  async aggregateQuizScores(days: number = 30): Promise<QuizScoreTrend[]> {
    const quizzes = await quizRepository.getAll()
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    // Filter quizzes within date range
    const recentQuizzes = quizzes.filter(q => {
      const quizDate = new Date(q.createdAt)
      return quizDate >= cutoffDate
    })

    // Group by date and calculate average score
    const scoresMap = new Map<string, { totalScore: number; count: number }>()

    for (const quiz of recentQuizzes) {
      const dateStr = quiz.createdAt.split('T')[0]
      const existing = scoresMap.get(dateStr) || { totalScore: 0, count: 0 }
      scoresMap.set(dateStr, {
        totalScore: existing.totalScore + quiz.scorePercent,
        count: existing.count + 1
      })
    }

    // Convert to array and calculate averages
    const trends: QuizScoreTrend[] = Array.from(scoresMap.entries())
      .map(([date, data]) => ({
        date,
        score: Math.round(data.totalScore / data.count),
        quizCount: data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    logger.debug(`Aggregated quiz scores for ${days} days`, {
      trendCount: trends.length
    })

    return trends
  }

  /**
   * Get daily activity minutes for a specific date
   */
  async getDailyActivity(dateStr: string): Promise<number> {
    const sessions = await learningSessionService.getAll()
    const endedSessions = sessions.filter(s => s.endedAt !== null)
    
    const targetDate = dateStr.split('T')[0] // Ensure YYYY-MM-DD format
    
    const daySessions = endedSessions.filter(s => {
      if (!s.endedAt) return false
      return s.endedAt.split('T')[0] === targetDate
    })

    const totalMs = daySessions.reduce((sum, session) => sum + session.durationMs, 0)
    return Math.round(totalMs / (60 * 1000))
  }

  /**
   * Get heatmap data for calendar view
   */
  async getHeatmapData(days: number = 365): Promise<Record<string, number>> {
    const trends = await this.aggregateLearningTrends(days)
    const heatmap: Record<string, number> = {}
    
    for (const trend of trends) {
      heatmap[trend.date] = trend.minutes
    }
    
    return heatmap
  }
}

export const statisticsService = new StatisticsService()

