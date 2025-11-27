import { describe, it, expect, beforeEach } from 'vitest'
import { wordRepository } from '@/services/word-repository'
import { initDB } from '@/services/db'
import { createWord } from '@/types/word'

describe('WordRepository', () => {
  beforeEach(async () => {
    // Clear database before each test
    const db = await initDB()
    const tx = db.transaction('words', 'readwrite')
    const store = tx.objectStore('words')
    await store.clear()
    await tx.done
  })

  it('should create a word', async () => {
    const word = createWord('hello')
    word.definitionEn = 'a greeting'
    word.definitionZh = '你好'
    word.partOfSpeech = 'noun'

    const id = await wordRepository.create(word)
    expect(id).toBe(word.id)
  })

  it('should get a word by id', async () => {
    const word = createWord('test')
    word.definitionEn = 'a test'
    word.definitionZh = '測試'

    await wordRepository.create(word)
    const retrieved = await wordRepository.getById(word.id)

    expect(retrieved).toBeDefined()
    expect(retrieved?.lemma).toBe('test')
  })

  it('should get all words', async () => {
    const word1 = createWord('word1')
    const word2 = createWord('word2')
    word1.definitionEn = 'definition1'
    word2.definitionEn = 'definition2'

    await wordRepository.create(word1)
    await wordRepository.create(word2)

    const allWords = await wordRepository.getAll()
    expect(allWords.length).toBe(2)
  })

  it('should update a word', async () => {
    const word = createWord('original')
    word.definitionEn = 'original definition'
    await wordRepository.create(word)

    word.definitionEn = 'updated definition'
    await wordRepository.update(word)

    const updated = await wordRepository.getById(word.id)
    expect(updated?.definitionEn).toBe('updated definition')
  })

  it('should delete a word', async () => {
    const word = createWord('to-delete')
    await wordRepository.create(word)

    await wordRepository.delete(word.id)

    const deleted = await wordRepository.getById(word.id)
    expect(deleted).toBeUndefined()
  })

  it('should search words by lemma', async () => {
    const word1 = createWord('hello')
    const word2 = createWord('world')
    word1.definitionEn = 'greeting'
    word2.definitionEn = 'planet'

    await wordRepository.create(word1)
    await wordRepository.create(word2)

    const results = await wordRepository.searchByLemma('hello')
    expect(results.length).toBe(1)
    expect(results[0].lemma).toBe('hello')
  })

  describe('CRUD operations edge cases', () => {
    it('should throw error when updating non-existent word', async () => {
      const word = createWord('test')
      word.id = 'non-existent-id'

      // Update should throw error for non-existent word
      await expect(wordRepository.update(word)).rejects.toThrow('Word with id non-existent-id not found')
      const result = await wordRepository.getById('non-existent-id')
      expect(result).toBeUndefined()
    })

    it('should handle deleting non-existent word gracefully', async () => {
      // Delete should not throw for non-existent ID
      await expect(wordRepository.delete('non-existent-id')).resolves.not.toThrow()
    })

    it('should preserve all word properties on update', async () => {
      const word = createWord('test')
      word.definitionEn = 'original'
      word.definitionZh = '原始'
      word.tags = ['tag1', 'tag2']
      word.notes = 'original note'
      word.status = 'learning'
      await wordRepository.create(word)

      word.definitionEn = 'updated'
      word.definitionZh = '更新'
      await wordRepository.update(word)

      const updated = await wordRepository.getById(word.id)
      expect(updated?.definitionEn).toBe('updated')
      expect(updated?.definitionZh).toBe('更新')
      expect(updated?.tags).toEqual(['tag1', 'tag2'])
      expect(updated?.notes).toBe('original note')
      expect(updated?.status).toBe('learning')
    })

    it('should handle pagination correctly', async () => {
      // Create multiple words
      for (let i = 0; i < 10; i++) {
        const word = createWord(`word${i}`)
        await wordRepository.create(word)
      }

      const page1 = await wordRepository.getPaginated(0, 5)
      expect(page1.items.length).toBe(5)
      expect(page1.hasMore).toBe(true)
      expect(page1.total).toBe(10)

      const page2 = await wordRepository.getPaginated(5, 5)
      expect(page2.items.length).toBe(5)
      expect(page2.hasMore).toBe(false)
    })

    it('should return empty array when searching with no matches', async () => {
      const results = await wordRepository.searchByLemma('nonexistent')
      expect(results).toEqual([])
    })

    it('should get words by status', async () => {
      const word1 = createWord('word1')
      word1.status = 'mastered'
      const word2 = createWord('word2')
      word2.status = 'learning'
      const word3 = createWord('word3')
      word3.status = 'mastered'

      await wordRepository.create(word1)
      await wordRepository.create(word2)
      await wordRepository.create(word3)

      const mastered = await wordRepository.getByStatus('mastered')
      expect(mastered.length).toBe(2)
      expect(mastered.every(w => w.status === 'mastered')).toBe(true)
    })
  })
})

