import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { progressService } from '@/services/progress-service'
import { statisticsService } from '@/services/statistics-service'
import { streakService } from '@/services/streak-service'
import type { UserProgress } from '@/types/user-progress'
import type { LearningTrend, QuizScoreTrend } from '@/services/statistics-service'
import { handleError } from '@/utils/error-handler'
import { logger } from '@/utils/logger'

export const useProgressStore = defineStore('progress', () => {
  const progress = ref<UserProgress | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const learningTrends = ref<LearningTrend[]>([])
  const quizScoreTrends = ref<QuizScoreTrend[]>([])
  const heatmapData = ref<Record<string, number>>({})

  // Computed properties
  const masteryPercentage = computed(() => {
    if (!progress.value || progress.value.totalWords === 0) {
      return 0
    }
    return Math.round((progress.value.masteredWords / progress.value.totalWords) * 100)
  })

  const totalStudyHours = computed(() => {
    if (!progress.value) {
      return 0
    }
    return Math.round((progress.value.totalStudyMinutes / 60) * 10) / 10 // Round to 1 decimal
  })

  /**
   * Load progress data
   */
  async function loadProgress(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // Refresh progress calculation
      const calculatedProgress = await progressService.refreshProgress()
      
      // Update streak
      const streak = await streakService.updateStreak()
      calculatedProgress.streakDays = streak

      // Update heatmap
      const heatmap = await statisticsService.getHeatmapData(365)
      calculatedProgress.heatmap = heatmap

      // Save updated progress
      await progressService.updateProgress(calculatedProgress)
      progress.value = calculatedProgress

      logger.info('Progress loaded', {
        totalWords: calculatedProgress.totalWords,
        masteredWords: calculatedProgress.masteredWords,
        streakDays: streak
      })
    } catch (err) {
      const appError = handleError(err)
      error.value = appError.message
      logger.error('Failed to load progress', { error: appError })
      throw appError
    } finally {
      loading.value = false
    }
  }

  /**
   * Load learning trends
   */
  async function loadLearningTrends(days: number = 30): Promise<void> {
    try {
      const trends = await statisticsService.aggregateLearningTrends(days)
      learningTrends.value = trends
      logger.debug(`Loaded learning trends for ${days} days`, {
        trendCount: trends.length
      })
    } catch (err) {
      const appError = handleError(err)
      error.value = appError.message
      logger.error('Failed to load learning trends', { error: appError })
      throw appError
    }
  }

  /**
   * Load quiz score trends
   */
  async function loadQuizScoreTrends(days: number = 30): Promise<void> {
    try {
      const trends = await statisticsService.aggregateQuizScores(days)
      quizScoreTrends.value = trends
      logger.debug(`Loaded quiz score trends for ${days} days`, {
        trendCount: trends.length
      })
    } catch (err) {
      const appError = handleError(err)
      error.value = appError.message
      logger.error('Failed to load quiz score trends', { error: appError })
      throw appError
    }
  }

  /**
   * Load heatmap data
   */
  async function loadHeatmapData(days: number = 365): Promise<void> {
    try {
      const heatmap = await statisticsService.getHeatmapData(days)
      heatmapData.value = heatmap
      if (progress.value) {
        progress.value.heatmap = heatmap
      }
      logger.debug(`Loaded heatmap data for ${days} days`)
    } catch (err) {
      const appError = handleError(err)
      error.value = appError.message
      logger.error('Failed to load heatmap data', { error: appError })
      throw appError
    }
  }

  /**
   * Refresh all progress data
   */
  async function refreshAll(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await Promise.all([
        loadProgress(),
        loadLearningTrends(30),
        loadQuizScoreTrends(30),
        loadHeatmapData(365)
      ])
    } catch (err) {
      const appError = handleError(err)
      error.value = appError.message
      logger.error('Failed to refresh progress data', { error: appError })
      throw appError
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    progress,
    loading,
    error,
    learningTrends,
    quizScoreTrends,
    heatmapData,
    // Computed
    masteryPercentage,
    totalStudyHours,
    // Actions
    loadProgress,
    loadLearningTrends,
    loadQuizScoreTrends,
    loadHeatmapData,
    refreshAll
  }
})

