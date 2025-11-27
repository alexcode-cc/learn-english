import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { wordRepository } from '@/services/word-repository'
import type { Word, WordStatus } from '@/types/word'
import { handleError } from '@/utils/error-handler'
import { logger } from '@/utils/logger'

// 每頁載入的單字數量
const PAGE_SIZE = 20
// 背景載入的批次大小
const BACKGROUND_BATCH_SIZE = 50

export const useWordsStore = defineStore('words', () => {
  const words = ref<Word[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref<string | null>(null)
  const totalCount = ref(0)
  const hasMore = ref(false)
  const isFullyLoaded = ref(false)

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

  /**
   * 載入第一頁單字（快速顯示 UI）
   */
  async function loadWords(): Promise<void> {
    loading.value = true
    error.value = null
    isFullyLoaded.value = false
    
    try {
      // 先載入第一頁，讓 UI 可以快速顯示
      const result = await wordRepository.getPaginated(0, PAGE_SIZE)
      // Clear existing words before loading new ones to avoid duplicates
      words.value = result.items
      totalCount.value = result.total
      hasMore.value = result.hasMore
      
      logger.info('First page loaded', { 
        loaded: result.items.length, 
        total: result.total 
      })
      
      // 如果還有更多資料，在背景繼續載入
      if (result.hasMore) {
        // 使用 setTimeout 讓 UI 先更新
        setTimeout(() => {
          loadRemainingInBackground()
        }, 0)
      } else {
        isFullyLoaded.value = true
      }
    } catch (err) {
      const appError = handleError(err)
      error.value = appError.message
      logger.error('Failed to load words', { error: appError })
      throw appError
    } finally {
      loading.value = false
    }
  }

  /**
   * 在背景漸進式載入剩餘的單字
   */
  async function loadRemainingInBackground(): Promise<void> {
    if (loadingMore.value || isFullyLoaded.value) {
      return
    }
    
    loadingMore.value = true
    
    try {
      let offset = words.value.length
      
      while (offset < totalCount.value) {
        // 使用 requestIdleCallback 或 setTimeout 讓出主線程
        await new Promise<void>(resolve => {
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => resolve(), { timeout: 100 })
          } else {
            setTimeout(resolve, 10)
          }
        })
        
        const result = await wordRepository.getPaginated(offset, BACKGROUND_BATCH_SIZE)
        
        if (result.items.length === 0) {
          break
        }
        
        // 批次添加到陣列，避免頻繁觸發響應式更新
        words.value = [...words.value, ...result.items]
        offset = words.value.length
        hasMore.value = result.hasMore
        
        logger.debug('Background batch loaded', { 
          loaded: words.value.length, 
          total: totalCount.value 
        })
      }
      
      isFullyLoaded.value = true
      logger.info('All words loaded in background', { total: words.value.length })
    } catch (err) {
      const appError = handleError(err)
      logger.error('Failed to load remaining words', { error: appError })
      // 不拋出錯誤，因為第一頁已經載入成功
    } finally {
      loadingMore.value = false
    }
  }

  /**
   * 載入更多單字（手動觸發）
   */
  async function loadMore(): Promise<void> {
    if (loadingMore.value || !hasMore.value) {
      return
    }
    
    loadingMore.value = true
    
    try {
      const result = await wordRepository.getPaginated(words.value.length, PAGE_SIZE)
      words.value = [...words.value, ...result.items]
      hasMore.value = result.hasMore
      
      logger.info('More words loaded', { 
        loaded: words.value.length, 
        total: result.total 
      })
    } catch (err) {
      const appError = handleError(err)
      logger.error('Failed to load more words', { error: appError })
    } finally {
      loadingMore.value = false
    }
  }

  /**
   * 強制載入所有單字（用於需要完整資料的操作）
   */
  async function loadAllWords(force: boolean = false): Promise<void> {
    if (isFullyLoaded.value && !force) {
      return
    }
    
    loading.value = true
    error.value = null
    
    try {
      // Always fetch fresh data from database
      words.value = await wordRepository.getAll()
      totalCount.value = words.value.length
      hasMore.value = false
      isFullyLoaded.value = true
      logger.info('All words force loaded', { count: words.value.length, forced: force })
    } catch (err) {
      const appError = handleError(err)
      error.value = appError.message
      logger.error('Failed to load all words', { error: appError })
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
    loadingMore,
    error,
    totalCount,
    hasMore,
    isFullyLoaded,
    unlearnedWords,
    learningWords,
    masteredWords,
    needsReviewWords,
    loadWords,
    loadMore,
    loadAllWords,
    addWord,
    updateWord,
    updateWordStatus,
    markAsMastered,
    markAsNeedsReview,
    deleteWord,
    searchWords
  }
})

