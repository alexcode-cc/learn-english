import { initDB } from './db'
import type { Tag } from '@/types/tag'

export class TagRepository {
  private dbPromise = initDB()

  async getAll(): Promise<Tag[]> {
    const db = await this.dbPromise
    return db.getAll('tags')
  }

  async getById(id: string): Promise<Tag | undefined> {
    const db = await this.dbPromise
    return db.get('tags', id)
  }

  async create(tag: Tag): Promise<string> {
    const db = await this.dbPromise
    await db.add('tags', tag)
    return tag.id
  }

  async update(tag: Tag): Promise<void> {
    const db = await this.dbPromise
    await db.put('tags', tag)
  }

  async delete(id: string): Promise<void> {
    const db = await this.dbPromise
    await db.delete('tags', id)
  }

  async getByLabel(label: string): Promise<Tag | undefined> {
    const db = await this.dbPromise
    const allTags = await db.getAll('tags')
    return allTags.find(tag => tag.label.toLowerCase() === label.toLowerCase())
  }

  async incrementWordCount(tagId: string): Promise<void> {
    const tag = await this.getById(tagId)
    if (tag) {
      tag.wordCount++
      await this.update(tag)
    }
  }

  async decrementWordCount(tagId: string): Promise<void> {
    const tag = await this.getById(tagId)
    if (tag) {
      tag.wordCount = Math.max(0, tag.wordCount - 1)
      await this.update(tag)
    }
  }
}

export const tagRepository = new TagRepository()

