import { wordRepository } from './word-repository'
import type { Word } from '@/types/word'
import { logger } from '@/utils/logger'

export interface ReviewSchedule {
  nextReviewDate: string
  intervalDays: number
}

/**
 * Spaced Repetition Review Engine
 * 
 * Implements a simplified spaced repetition algorithm:
 * - New words: 1 day interval
 * - Learning words: 1-3 days based on success
 * - Mastered words: 7-30 days based on success
 * - Failed reviews reset to 1 day
 */
export class ReviewEngine {
  /**
   * Calculate next review date based on word status and last review
   */
  async calculateNextReviewDate(wordId: string): Promise<string> {
    const word = await wordRepository.getById(wordId)
    if (!word) {
      throw new Error(`Word with id ${wordId} not found`)
    }

    const now = new Date()
    const lastStudied = word.lastStudiedAt ? new Date(word.lastStudiedAt) : now
    const daysSinceLastStudy = Math.floor(
      (now.getTime() - lastStudied.getTime()) / (24 * 60 * 60 * 1000)
    )

    let intervalDays: number

    if (word.status === 'mastered') {
      // Mastered words: longer intervals (7-30 days)
      intervalDays = Math.min(30, Math.max(7, daysSinceLastStudy * 2))
    } else if (word.status === 'learning') {
      // Learning words: medium intervals (1-7 days)
      if (word.needsReview) {
        // Needs review: shorter interval (1 day)
        intervalDays = 1
      } else {
        // Normal progression: 1-3 days
        intervalDays = Math.min(7, Math.max(1, daysSinceLastStudy + 1))
      }
    } else {
      // Unlearned words: start with 1 day
      intervalDays = 1
    }

    const nextReviewDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000)
    return nextReviewDate.toISOString()
  }

  /**
   * Get words that are due for review
   */
  async getWordsDueForReview(): Promise<Word[]> {
    const allWords = await wordRepository.getAll()
    const now = new Date()

    return allWords.filter(word => {
      // Include words explicitly marked as needs review
      if (word.needsReview) {
        return true
      }

      // Include words where reviewDueAt is in the past
      if (word.reviewDueAt) {
        const dueDate = new Date(word.reviewDueAt)
        return dueDate.getTime() <= now.getTime()
      }

      return false
    })
  }

  /**
   * Update review schedule after a review session
   * @param wordId - Word ID
   * @param success - Whether the review was successful
   */
  async updateReviewSchedule(wordId: string, success: boolean): Promise<void> {
    const word = await wordRepository.getById(wordId)
    if (!word) {
      throw new Error(`Word with id ${wordId} not found`)
    }

    const now = new Date().toISOString()

    if (success) {
      // Successful review: calculate next review date
      const nextReviewDate = await this.calculateNextReviewDate(wordId)
      
      // Update word
      const updatedWord: Word = {
        ...word,
        lastStudiedAt: now,
        reviewDueAt: nextReviewDate,
        needsReview: false
      }

      // If word was unlearned and reviewed successfully, move to learning
      if (word.status === 'unlearned') {
        updatedWord.status = 'learning'
      }

      await wordRepository.update(updatedWord)
      logger.info(`Updated review schedule for word ${wordId}`, {
        nextReviewDate,
        success: true
      })
    } else {
      // Failed review: schedule earlier review (1 day) and mark as needs review
      const nextReviewDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      
      const updatedWord: Word = {
        ...word,
        lastStudiedAt: now,
        reviewDueAt: nextReviewDate,
        needsReview: true,
        status: word.status === 'mastered' ? 'learning' : word.status
      }

      await wordRepository.update(updatedWord)
      logger.info(`Scheduled earlier review for word ${wordId}`, {
        nextReviewDate,
        success: false
      })
    }
  }

  /**
   * Mark word as reviewed (convenience method)
   */
  async markAsReviewed(wordId: string, success: boolean = true): Promise<void> {
    await this.updateReviewSchedule(wordId, success)
  }

  /**
   * Get count of words due for review
   */
  async getDueReviewCount(): Promise<number> {
    const dueWords = await this.getWordsDueForReview()
    return dueWords.length
  }
}

export const reviewEngine = new ReviewEngine()

