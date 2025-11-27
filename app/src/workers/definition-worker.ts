/**
 * Web Worker for background dictionary enrichment
 * This worker handles dictionary lookups in the background to avoid blocking the main thread
 */

import type { DictionaryEntry } from '@/services/dictionary-service'

export interface WorkerMessage {
  type: 'lookup' | 'batch-lookup' | 'cancel'
  payload?: {
    words?: string[]
    word?: string
    baseUrl?: string
    timeout?: number
    retryAttempts?: number
    retryDelay?: number
  }
}

export interface WorkerResponse {
  type: 'result' | 'progress' | 'error' | 'complete'
  payload?: {
    word?: string
    entry?: DictionaryEntry | null
    results?: Array<{ word: string; entry: DictionaryEntry | null; error?: string }>
    current?: number
    total?: number
    error?: string
  }
}

// Worker 主邏輯
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data

  try {
    switch (type) {
      case 'lookup':
        if (payload?.word) {
          await handleLookup(payload.word, payload)
        }
        break

      case 'batch-lookup':
        if (payload?.words) {
          await handleBatchLookup(payload.words, payload)
        }
        break

      case 'cancel':
        // 取消操作（可以設置標記來中斷正在進行的請求）
        self.postMessage({
          type: 'complete',
          payload: { error: 'Operation cancelled' }
        } as WorkerResponse)
        break

      default:
        self.postMessage({
          type: 'error',
          payload: { error: `Unknown message type: ${type}` }
        } as WorkerResponse)
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      payload: {
        error: error instanceof Error ? error.message : String(error)
      }
    } as WorkerResponse)
  }
}

/**
 * 處理單個單字查詢
 */
async function handleLookup(
  word: string,
  config: {
    baseUrl?: string
    timeout?: number
    retryAttempts?: number
    retryDelay?: number
  }
): Promise<void> {
  const baseUrl = config.baseUrl || 'https://api.dictionaryapi.dev/api/v2/entries/en'
  const timeout = config.timeout || 5000
  const retryAttempts = config.retryAttempts || 3
  const retryDelay = config.retryDelay || 1000

  let lastError: Error | null = null

  for (let attempt = 0; attempt < retryAttempts; attempt++) {
    try {
      const url = `${baseUrl}/${encodeURIComponent(word)}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 404) {
          // 單字不存在，返回 null
          self.postMessage({
            type: 'result',
            payload: { word, entry: null }
          } as WorkerResponse)
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: DictionaryEntry[] = await response.json()

      if (!data || data.length === 0) {
        self.postMessage({
          type: 'result',
          payload: { word, entry: null }
        } as WorkerResponse)
        return
      }

      // 使用第一個結果
      const entry = data[0]
      self.postMessage({
        type: 'result',
        payload: { word, entry }
      } as WorkerResponse)
      return
    } catch (error: any) {
      lastError = error

      // 如果是中止錯誤，不重試
      if (error.name === 'AbortError') {
        break
      }

      // 如果不是最後一次嘗試，等待後重試
      if (attempt < retryAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }
  }

  // 所有重試都失敗了
  self.postMessage({
    type: 'result',
    payload: {
      word,
      entry: null,
      error: lastError?.message || 'Lookup failed'
    }
  } as WorkerResponse)
}

/**
 * 處理批次單字查詢
 */
async function handleBatchLookup(
  words: string[],
  config: {
    baseUrl?: string
    timeout?: number
    retryAttempts?: number
    retryDelay?: number
  }
): Promise<void> {
  const results: Array<{ word: string; entry: DictionaryEntry | null; error?: string }> = []

  for (let i = 0; i < words.length; i++) {
    const word = words[i]

    // 發送進度更新
    self.postMessage({
      type: 'progress',
      payload: {
        current: i + 1,
        total: words.length,
        word
      }
    } as WorkerResponse)

    // 查詢單字
    const entry = await lookupWord(word, config)
    results.push({
      word,
      entry: entry.entry,
      error: entry.error
    })
  }

  // 發送完成訊息
  self.postMessage({
    type: 'complete',
    payload: { results }
  } as WorkerResponse)
}

/**
 * 查詢單字（內部函數）
 */
async function lookupWord(
  word: string,
  config: {
    baseUrl?: string
    timeout?: number
    retryAttempts?: number
    retryDelay?: number
  }
): Promise<{ entry: DictionaryEntry | null; error?: string }> {
  const baseUrl = config.baseUrl || 'https://api.dictionaryapi.dev/api/v2/entries/en'
  const timeout = config.timeout || 5000
  const retryAttempts = config.retryAttempts || 3
  const retryDelay = config.retryDelay || 1000

  let lastError: Error | null = null

  for (let attempt = 0; attempt < retryAttempts; attempt++) {
    try {
      const url = `${baseUrl}/${encodeURIComponent(word)}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 404) {
          return { entry: null }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: DictionaryEntry[] = await response.json()

      if (!data || data.length === 0) {
        return { entry: null }
      }

      return { entry: data[0] }
    } catch (error: any) {
      lastError = error

      if (error.name === 'AbortError') {
        break
      }

      if (attempt < retryAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }
  }

  return {
    entry: null,
    error: lastError?.message || 'Lookup failed'
  }
}

