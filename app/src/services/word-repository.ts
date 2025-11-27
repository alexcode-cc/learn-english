import { initDB } from './db'
import type { Word } from '@/types/word'

export class WordRepository {
  private dbPromise = initDB()

  async getAll(): Promise<Word[]> {
    const db = await this.dbPromise
    return db.getAll('words')
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

