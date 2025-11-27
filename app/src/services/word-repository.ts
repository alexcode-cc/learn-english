import { initDB } from './db'
import type { Word } from '@/types/word'

export interface PaginatedResult<T> {
  items: T[]
  total: number
  hasMore: boolean
}

export class WordRepository {
  private dbPromise = initDB()

  async getAll(): Promise<Word[]> {
    const db = await this.dbPromise
    return db.getAll('words')
  }

  /**
   * 分頁取得單字（使用游標實現高效分頁）
   */
  async getPaginated(offset: number, limit: number): Promise<PaginatedResult<Word>> {
    const db = await this.dbPromise
    const tx = db.transaction('words', 'readonly')
    const store = tx.objectStore('words')
    
    const total = await store.count()
    const items: Word[] = []
    
    let cursor = await store.openCursor()
    let skipped = 0
    
    while (cursor) {
      if (skipped < offset) {
        skipped++
        cursor = await cursor.continue()
        continue
      }
      
      if (items.length >= limit) {
        break
      }
      
      items.push(cursor.value)
      cursor = await cursor.continue()
    }
    
    await tx.done
    
    return {
      items,
      total,
      hasMore: offset + items.length < total
    }
  }

  async getById(id: string): Promise<Word | undefined> {
    const db = await this.dbPromise
    return db.get('words', id)
  }

  async create(word: Word): Promise<string> {
    const db = await this.dbPromise
    await db.add('words', word)
    return word.id
  }

  async update(word: Word): Promise<void> {
    const db = await this.dbPromise
    await db.put('words', word)
  }

  async delete(id: string): Promise<void> {
    const db = await this.dbPromise
    await db.delete('words', id)
  }

  async getByStatus(status: Word['status']): Promise<Word[]> {
    const db = await this.dbPromise
    const index = db.transaction('words').store.index('by-status')
    return index.getAll(status)
  }

  async getByReviewDue(beforeDate: string): Promise<Word[]> {
    const db = await this.dbPromise
    const index = db.transaction('words').store.index('by-review-due')
    const range = IDBKeyRange.upperBound(beforeDate)
    return index.getAll(range)
  }

  async searchByLemma(query: string): Promise<Word[]> {
    const db = await this.dbPromise
    const allWords = await db.getAll('words')
    const lowerQuery = query.toLowerCase()
    return allWords.filter(
      (word) =>
        word.lemma.toLowerCase().includes(lowerQuery) ||
        word.definitionZh.includes(query) ||
        word.definitionEn.toLowerCase().includes(lowerQuery)
    )
  }

  async count(): Promise<number> {
    const db = await this.dbPromise
    return db.count('words')
  }
}

export const wordRepository = new WordRepository()

