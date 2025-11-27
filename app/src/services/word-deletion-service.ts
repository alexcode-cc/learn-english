import { wordRepository } from './word-repository'
import { noteRepository } from './note-repository'
import { tagRepository } from './tag-repository'
import { logger } from '@/utils/logger'

export class WordDeletionService {
  async deleteWord(wordId: string): Promise<void> {
    const word = await wordRepository.getById(wordId)
    if (!word) {
      throw new Error(`Word with id ${wordId} not found`)
    }

    // Delete associated notes
    const notes = await noteRepository.getByWordId(wordId)
    for (const note of notes) {
      await noteRepository.delete(note.id)
    }

    // Decrement tag word counts
    for (const tagId of word.tags) {
      await tagRepository.decrementWordCount(tagId)
    }

    // Delete the word
    await wordRepository.delete(wordId)

    logger.info(`Word ${wordId} deleted successfully`)
  }

  async deleteWords(wordIds: string[]): Promise<void> {
    for (const wordId of wordIds) {
      await this.deleteWord(wordId)
    }
  }
}

export const wordDeletionService = new WordDeletionService()

