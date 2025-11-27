import { initDB } from './db'
import type { Note } from '@/types/note'

export class NoteRepository {
  private dbPromise = initDB()

  async getAll(): Promise<Note[]> {
    const db = await this.dbPromise
    return db.getAll('notes')
  }

  async getById(id: string): Promise<Note | undefined> {
    const db = await this.dbPromise
    return db.get('notes', id)
  }

  async getByWordId(wordId: string): Promise<Note[]> {
    const db = await this.dbPromise
    const index = db.transaction('notes').store.index('by-word-id')
    return index.getAll(wordId)
  }

  async create(note: Note): Promise<string> {
    const db = await this.dbPromise
    await db.add('notes', note)
    return note.id
  }

  async update(note: Note): Promise<void> {
    const db = await this.dbPromise
    const updated = {
      ...note,
      updatedAt: new Date().toISOString()
    }
    await db.put('notes', updated)
  }

  async delete(id: string): Promise<void> {
    const db = await this.dbPromise
    await db.delete('notes', id)
  }

  async deleteByWordId(wordId: string): Promise<void> {
    const db = await this.dbPromise
    const notes = await this.getByWordId(wordId)
    const tx = db.transaction('notes', 'readwrite')
    for (const note of notes) {
      await tx.store.delete(note.id)
    }
    await tx.done
  }
}

export const noteRepository = new NoteRepository()

