import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { wordRepository } from '@/services/word-repository'
import type { Word, WordStatus } from '@/types/word'
import { handleError } from '@/utils/error-handler'
import { logger } from '@/utils/logger'

export const useWordsStore = defineStore('words', () => {
  const words = ref<Word[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const unlearnedWords = computed(() =>
    words.value.filter((w) => w.status === 'unlearned')
  )
  const learningWords = computed(() =>
    words.value.filter((w) => w.status === 'learning')
  )
  const masteredWords = computed(() =>
    words.value.filter((w) => w.status === 'mastered')
  )
  const needsReviewWords = computed(() =>
    words.value.filter((w) => w.needsReview)
  )

  async function loadWords(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      words.value = await wordRepository.getAll()
      logger.info('Words loaded', { count: words.value.length })
    } catch (err) {
      const appError = handleError(err)
      error.value = appError.message
      logger.error('Failed to load words', { error: appError })
      throw appError
    } finally {
      loading.value = false
    }
  }

  async function addWord(word: Word): Promise<void> {
    try {
      await wordRepository.create(word)
      words.value.push(word)
      logger.info('Word added', { wordId: word.id, lemma: word.lemma })
    } catch (err) {
      const appError = handleError(err)
      logger.error('Failed to add word', { error: appError })
      throw appError
    }
  }

  async function updateWord(word: Word): Promise<void> {
    try {
      await wordRepository.update(word)
      const index = words.value.findIndex((w) => w.id === word.id)
      if (index !== -1) {
        words.value[index] = word
      }
      logger.info('Word updated', { wordId: word.id })
    } catch (err) {
      const appError = handleError(err)
      logger.error('Failed to update word', { error: appError })
      throw appError
    }
  }

  async function updateWordStatus(wordId: string, status: WordStatus): Promise<void> {
    const word = words.value.find((w) => w.id === wordId)
    if (!word) {
      throw new Error(`Word with id ${wordId} not found`)
    }
    word.status = status
    word.lastStudiedAt = new Date().toISOString()
    await updateWord(word)
  }

  async function markAsMastered(wordId: string): Promise<void> {
    const word = words.value.find((w) => w.id === wordId)
    if (!word) {
      throw new Error(`Word with id ${wordId} not found`)
    }
    // Mark as mastered and clear needsReview flag (mastered words don't need review)
    word.status = 'mastered'
    word.needsReview = false
    word.lastStudiedAt = new Date().toISOString()
    await updateWord(word)
    logger.info('Word marked as mastered', { wordId })
  }

  async function markAsNeedsReview(wordId: string): Promise<void> {
    const word = words.value.find((w) => w.id === wordId)
    if (!word) {
      throw new Error(`Word with id ${wordId} not found`)
    }
    // Set needsReview flag and update status to 'learning'
    // If word is already mastered, change to learning (needs review means not fully mastered yet)
    word.needsReview = true
    if (word.status === 'mastered') {
      word.status = 'learning'
      logger.info('Word status changed from mastered to learning (needs review)', { wordId })
    } else if (word.status === 'unlearned') {
      word.status = 'learning'
    }
    word.lastStudiedAt = new Date().toISOString()
    await updateWord(word)
    logger.info('Word marked as needs review', { wordId, status: word.status })
  }

  async function deleteWord(wordId: string): Promise<void> {
    try {
      await wordRepository.delete(wordId)
      words.value = words.value.filter((w) => w.id !== wordId)
      logger.info('Word deleted', { wordId })
    } catch (err) {
      const appError = handleError(err)
      logger.error('Failed to delete word', { error: appError })
      throw appError
    }
  }

  async function searchWords(query: string): Promise<Word[]> {
    if (!query.trim()) {
      // If query is empty, reload all words from database
      await loadWords()
      return words.value
    }
    try {
      const results = await wordRepository.searchByLemma(query)
      // Update the words array with search results to maintain reactivity
      // But keep the original words in store for when search is cleared
      return results
    } catch (err) {
      const appError = handleError(err)
      logger.error('Failed to search words', { error: appError })
      return []
    }
  }

  return {
    words,
    loading,
    error,
    unlearnedWords,
    learningWords,
    masteredWords,
    needsReviewWords,
    loadWords,
    addWord,
    updateWord,
    updateWordStatus,
    markAsMastered,
    markAsNeedsReview,
    deleteWord,
    searchWords
  }
})

