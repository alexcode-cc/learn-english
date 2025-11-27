import { quizService } from './quiz-service'
import { quizRepository } from './quiz-repository'
import type { Quiz } from '@/types/quiz'
import { logger } from '@/utils/logger'

export interface QuizScore {
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  scorePercent: number
  incorrectQuestionIds: string[]
}

export class QuizScoringService {
  /**
   * Calculate detailed score for a quiz
   */
  async calculateDetailedScore(quizId: string): Promise<QuizScore> {
    const questions = await quizService.getQuestions(quizId)
    
    const correctAnswers = questions.filter(q => q.isCorrect).length
    const incorrectAnswers = questions.filter(q => !q.isCorrect).length
    const totalQuestions = questions.length
    const scorePercent = totalQuestions > 0 
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 0

    const incorrectQuestionIds = questions
      .filter(q => !q.isCorrect)
      .map(q => q.id)

    const score: QuizScore = {
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      scorePercent,
      incorrectQuestionIds
    }

    // Update quiz with score
    const quiz = await quizRepository.getById(quizId)
    if (quiz) {
      quiz.scorePercent = scorePercent
      await quizRepository.update(quiz)
    }

    logger.info(`Calculated score for quiz ${quizId}`, score)

    return score
  }

  /**
   * Get score for a quiz (convenience method)
   */
  async getScore(quizId: string): Promise<number> {
    const score = await this.calculateDetailedScore(quizId)
    return score.scorePercent
  }

  /**
   * Check if quiz is passing (≥70% score)
   */
  async isPassing(quizId: string): Promise<boolean> {
    const score = await this.getScore(quizId)
    return score >= 70
  }

  /**
   * Get performance level based on score
   */
  getPerformanceLevel(scorePercent: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (scorePercent >= 90) return 'excellent'
    if (scorePercent >= 70) return 'good'
    if (scorePercent >= 50) return 'fair'
    return 'poor'
  }
}

export const quizScoringService = new QuizScoringService()

