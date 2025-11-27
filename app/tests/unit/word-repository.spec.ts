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
})

