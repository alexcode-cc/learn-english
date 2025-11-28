import axios from 'axios'
import config from '@/config'
import { logger } from '@/utils/logger'
import { NetworkError } from '@/utils/error-handler'
import type { Word } from '@/types/word'

export interface DictionaryEntry {
  word: string
  phonetic?: string
  phonetics?: Array<{ text?: string; audio?: string }>
  meanings: Array<{
    partOfSpeech: string
    definitions: Array<{
      definition: string
      example?: string
      synonyms?: string[]
      antonyms?: string[]
    }>
  }>
}

export interface EnrichmentResult {
  word: Word
  success: boolean
  error?: string
}

export class DictionaryService {
  private cache = new Map<string, DictionaryEntry>()

  /**
   * 從字典 API 取得單字資訊
   */
  async lookupWord(word: string): Promise<DictionaryEntry | null> {
    // 檢查快取
    const cached = this.cache.get(word.toLowerCase())
    if (cached) {
      logger.debug('Using cached dictionary entry', { word })
      return cached
    }

    try {
      const url = `${config.dictionaryApi.baseUrl}/${encodeURIComponent(word)}`
      logger.debug('Fetching dictionary entry', { word, url })

      const response = await axios.get<DictionaryEntry[]>(url, {
        timeout: config.dictionaryApi.timeout
      })

      if (!response.data || response.data.length === 0) {
        logger.warn('No dictionary entry found', { word })
        return null
      }

      // 使用第一個結果
      const entry = response.data[0]
      this.cache.set(word.toLowerCase(), entry)
      
      logger.info('Dictionary entry fetched', { word })
      return entry
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          logger.warn('Word not found in dictionary', { word })
          return null
        }
        logger.error('Dictionary API error', { word, error: error.message })
        throw new NetworkError(`無法取得單字 "${word}" 的資訊`, error)
      }
      logger.error('Unexpected error in dictionary lookup', { word, error })
      throw new NetworkError(`查詢單字 "${word}" 時發生錯誤`, error as Error)
    }
  }

  /**
   * 將字典資料轉換為 Word 物件
   */
  convertToWord(lemma: string, entry: DictionaryEntry | null): Word {
    const word: Word = {
      id: crypto.randomUUID(),
      lemma: lemma.trim(),
      phonetics: [],
      audioUrls: [],
      partOfSpeech: '',
      definitionEn: '',
      definitionZh: '', // 需要額外的中文翻譯 API
      examples: [],
      synonyms: [],
      antonyms: [],
      status: 'unlearned',
      needsReview: false,
      lastStudiedAt: null,
      reviewDueAt: null,
      notes: '',
      source: 'csv',
      infoCompleteness: entry ? 'complete' : 'missing-definition',
      tags: [],
      setIds: []
    }

    if (!entry) {
      return word
    }

    // 提取音標
    if (entry.phonetic) {
      word.phonetics.push(entry.phonetic)
    } else if (entry.phonetics && entry.phonetics.length > 0) {
      entry.phonetics.forEach(ph => {
        if (ph.text && !word.phonetics.includes(ph.text)) {
          word.phonetics.push(ph.text)
        }
        if (ph.audio) {
          word.audioUrls.push(ph.audio)
        }
      })
    }

    // 提取第一個 meaning 的主要資訊
    if (entry.meanings && entry.meanings.length > 0) {
      const firstMeaning = entry.meanings[0]
      word.partOfSpeech = firstMeaning.partOfSpeech || ''

      if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
        const firstDef = firstMeaning.definitions[0]
        word.definitionEn = firstDef.definition || ''

        // 提取例句
        if (firstDef.example) {
          word.examples.push(firstDef.example)
        }

        // 提取同義詞和反義詞
        if (firstDef.synonyms) {
          word.synonyms = firstDef.synonyms.slice(0, 5) // 最多 5 個
        }
        if (firstDef.antonyms) {
          word.antonyms = firstDef.antonyms.slice(0, 5) // 最多 5 個
        }
      }

      // 從所有 meanings 中收集更多例句
      entry.meanings.forEach(meaning => {
        meaning.definitions?.forEach(def => {
          if (def.example && word.examples.length < 5) {
            word.examples.push(def.example)
          }
        })
      })
    }

    return word
  }

  /**
   * 補足單字資訊（包含重試機制）
   */
  async enrichWord(lemma: string, retryCount = 0): Promise<EnrichmentResult> {
    try {
      const entry = await this.lookupWord(lemma)
      const word = this.convertToWord(lemma, entry)
      
      return {
        word,
        success: entry !== null
      }
    } catch (error: any) {
      // 重試機制
      if (retryCount < config.dictionaryApi.retryAttempts) {
        logger.warn('Retrying dictionary lookup', {
          word: lemma,
          attempt: retryCount + 1
        })
        
        // 等待後重試
        await new Promise(resolve =>
          setTimeout(resolve, config.dictionaryApi.retryDelay)
        )
        
        return this.enrichWord(lemma, retryCount + 1)
      }

      logger.error('Dictionary lookup failed after retries', {
        word: lemma,
        error: error.message
      })

      // 即使失敗也返回單字（標記為資訊不完整）
      const word = this.convertToWord(lemma, null)
      return {
        word,
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 批次補足多個單字
   */
  async enrichWords(
    words: string[],
    onProgress?: (current: number, total: number, word: string) => void
  ): Promise<EnrichmentResult[]> {
    const results: EnrichmentResult[] = []

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      onProgress?.(i + 1, words.length, word)
      
      const result = await this.enrichWord(word)
      results.push(result)
    }

    return results
  }

  /**
   * 清除快取
   */
  clearCache(): void {
    this.cache.clear()
    logger.debug('Dictionary cache cleared')
  }
}

export const dictionaryService = new DictionaryService()

