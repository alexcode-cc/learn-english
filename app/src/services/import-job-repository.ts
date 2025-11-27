import { initDB } from './db'
import type { ImportJob } from '@/types/import-job'

export class ImportJobRepository {
  private dbPromise = initDB()

  async create(job: ImportJob): Promise<string> {
    const db = await this.dbPromise
    await db.add('importJobs', job)
    return job.id
  }

  async getById(id: string): Promise<ImportJob | undefined> {
    const db = await this.dbPromise
    return db.get('importJobs', id)
  }

  async update(job: ImportJob): Promise<void> {
    const db = await this.dbPromise
    await db.put('importJobs', job)
  }

  async getAll(): Promise<ImportJob[]> {
    const db = await this.dbPromise
    return db.getAll('importJobs')
  }

  async getLatest(): Promise<ImportJob | undefined> {
    const db = await this.dbPromise
    const all = await db.getAll('importJobs')
    if (all.length === 0) {
      return undefined
    }
    // 依 startedAt 排序，返回最新的
    return all.sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    )[0]
  }

  async delete(id: string): Promise<void> {
    const db = await this.dbPromise
    await db.delete('importJobs', id)
  }
}

export const importJobRepository = new ImportJobRepository()

