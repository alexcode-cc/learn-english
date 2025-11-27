import { describe, it, expect, beforeEach, vi } from 'vitest'
import { tagRepository } from '@/services/tag-repository'
import { createTag } from '@/types/tag'
import { initDB } from '@/services/db'

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

describe('TagRepository', () => {
  beforeEach(async () => {
    // Clear database
    const db = await initDB()
    const tx = db.transaction(['tags'], 'readwrite')
    await tx.objectStore('tags').clear()
    await tx.done
    vi.clearAllMocks()
  })

  describe('CRUD operations', () => {
    it('should create a tag', async () => {
      const tag = createTag('important', '#FF0000')
      const id = await tagRepository.create(tag)
      expect(id).toBe(tag.id)
    })

    it('should get a tag by id', async () => {
      const tag = createTag('test')
      await tagRepository.create(tag)
      const retrieved = await tagRepository.getById(tag.id)
      expect(retrieved).toBeDefined()
      expect(retrieved?.label).toBe('test')
    })

    it('should get all tags', async () => {
      const tag1 = createTag('tag1')
      const tag2 = createTag('tag2')
      await tagRepository.create(tag1)
      await tagRepository.create(tag2)

      const allTags = await tagRepository.getAll()
      expect(allTags.length).toBe(2)
    })

    it('should update a tag', async () => {
      const tag = createTag('original')
      await tagRepository.create(tag)

      tag.label = 'updated'
      tag.color = '#00FF00'
      await tagRepository.update(tag)

      const updated = await tagRepository.getById(tag.id)
      expect(updated?.label).toBe('updated')
      expect(updated?.color).toBe('#00FF00')
    })

    it('should delete a tag', async () => {
      const tag = createTag('to-delete')
      await tagRepository.create(tag)

      await tagRepository.delete(tag.id)

      const deleted = await tagRepository.getById(tag.id)
      expect(deleted).toBeUndefined()
    })
  })

  describe('tag lookup', () => {
    it('should find tag by label (case insensitive)', async () => {
      const tag = createTag('Important')
      await tagRepository.create(tag)

      const found = await tagRepository.getByLabel('important')
      expect(found).toBeDefined()
      expect(found?.id).toBe(tag.id)

      const found2 = await tagRepository.getByLabel('IMPORTANT')
      expect(found2).toBeDefined()
      expect(found2?.id).toBe(tag.id)
    })

    it('should return undefined for non-existent label', async () => {
      const found = await tagRepository.getByLabel('nonexistent')
      expect(found).toBeUndefined()
    })
  })

  describe('word count management', () => {
    it('should increment word count', async () => {
      const tag = createTag('test')
      tag.wordCount = 5
      await tagRepository.create(tag)

      await tagRepository.incrementWordCount(tag.id)

      const updated = await tagRepository.getById(tag.id)
      expect(updated?.wordCount).toBe(6)
    })

    it('should decrement word count', async () => {
      const tag = createTag('test')
      tag.wordCount = 5
      await tagRepository.create(tag)

      await tagRepository.decrementWordCount(tag.id)

      const updated = await tagRepository.getById(tag.id)
      expect(updated?.wordCount).toBe(4)
    })

    it('should not allow negative word count', async () => {
      const tag = createTag('test')
      tag.wordCount = 0
      await tagRepository.create(tag)

      await tagRepository.decrementWordCount(tag.id)

      const updated = await tagRepository.getById(tag.id)
      expect(updated?.wordCount).toBe(0)
    })

    it('should handle increment for non-existent tag gracefully', async () => {
      await expect(tagRepository.incrementWordCount('non-existent')).resolves.not.toThrow()
    })
  })
})

