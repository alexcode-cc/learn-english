import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWordsStore } from '@/stores/useWordsStore'
import { createWord } from '@/types/word'
import { wordRepository } from '@/services/word-repository'

// Mock the repository
vi.mock('@/services/word-repository', () => ({
  wordRepository: {
    getAll: vi.fn(),
    getPaginated: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    searchByLemma: vi.fn(),
    count: vi.fn()
  }
}))

describe('useWordsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should load words', async () => {
    const store = useWordsStore()
    const mockWords = [
      createWord('hello'),
      createWord('world')
    ]

    // Mock getPaginated for the new pagination-based loading
    vi.mocked(wordRepository.getPaginated).mockResolvedValue({
      items: mockWords,
      total: 2,
      hasMore: false
    })

    await store.loadWords()

    expect(store.words.length).toBe(2)
    expect(store.loading).toBe(false)
    expect(store.totalCount).toBe(2)
    expect(store.hasMore).toBe(false)
  })

  it('should add a word', async () => {
    const store = useWordsStore()
    const newWord = createWord('test')
    newWord.definitionEn = 'a test'
    newWord.definitionZh = '測試'

    vi.mocked(wordRepository.create).mockResolvedValue(newWord.id)

    await store.addWord(newWord)

    expect(store.words.length).toBeGreaterThan(0)
    expect(store.words.find(w => w.id === newWord.id)).toBeDefined()
    expect(wordRepository.create).toHaveBeenCalledWith(newWord)
  })

  it('should update word status', async () => {
    const store = useWordsStore()
    const word = createWord('test')
    word.status = 'unlearned'
    store.words = [word]

    vi.mocked(wordRepository.update).mockResolvedValue(undefined)

    await store.updateWordStatus(word.id, 'mastered')

    expect(word.status).toBe('mastered')
    expect(word.lastStudiedAt).toBeTruthy()
  })

  it('should mark word as mastered', async () => {
    const store = useWordsStore()
    const word = createWord('test')
    word.status = 'unlearned'
    store.words = [word]

    vi.mocked(wordRepository.update).mockResolvedValue(undefined)

    await store.markAsMastered(word.id)

    expect(word.status).toBe('mastered')
  })

  it('should filter words by status', () => {
    const store = useWordsStore()
    const word1 = createWord('word1')
    word1.status = 'mastered'
    const word2 = createWord('word2')
    word2.status = 'unlearned'
    const word3 = createWord('word3')
    word3.status = 'learning'

    store.words = [word1, word2, word3]

    expect(store.masteredWords.length).toBe(1)
    expect(store.unlearnedWords.length).toBe(1)
    expect(store.learningWords.length).toBe(1)
  })
})

