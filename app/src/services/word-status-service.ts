import { wordRepository } from './word-repository'
import type { WordStatus } from '@/types/word'
import { logger } from '@/utils/logger'

export class WordStatusService {
  async updateStatus(wordId: string, status: WordStatus): Promise<void> {
    const word = await wordRepository.getById(wordId)
    if (!word) {
      throw new Error(`Word with id ${wordId} not found`)
    }

    word.status = status
    word.lastStudiedAt = new Date().toISOString()

    await wordRepository.update(word)
    logger.info('Word status updated', { wordId, status })
  }

  async markAsMastered(wordId: string): Promise<void> {
    await this.updateStatus(wordId, 'mastered')
  }

  async markAsNeedsReview(wordId: string): Promise<void> {
    const word = await wordRepository.getById(wordId)
    if (!word) {
      throw new Error(`Word with id ${wordId} not found`)
    }

    word.needsReview = true
    await wordRepository.update(word)
    logger.info('Word marked as needs review', { wordId })
  }
}

export const wordStatusService = new WordStatusService()

