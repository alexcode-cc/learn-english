import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import DashboardPage from '@/pages/DashboardPage.vue'
import { useWordsStore } from '@/stores/useWordsStore'
import { wordRepository } from '@/services/word-repository'
import { tagRepository } from '@/services/tag-repository'
import { createWord } from '@/types/word'
import { createTag } from '@/types/tag'
import { initDB } from '@/services/db'

const vuetify = createVuetify()

// Mock router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  currentRoute: { value: { path: '/dashboard' } }
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter
}))

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

describe('Word Management Integration', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    
    // Clear database
    const db = await initDB()
    const tx = db.transaction(['words', 'tags', 'notes'], 'readwrite')
    await tx.objectStore('words').clear()
    await tx.objectStore('tags').clear()
    await tx.objectStore('notes').clear()
    await tx.done
    vi.clearAllMocks()
  })

  it('should create a new word through the form', async () => {
    const wrapper = mount(DashboardPage, {
      global: {
        plugins: [vuetify, createPinia()]
      }
    })

    const wordsStore = useWordsStore()
    await wordsStore.loadWords()

    // Initially no words
    expect(wordsStore.words.length).toBe(0)

    // Create a word directly via repository to simulate form submission
    const newWord = createWord('test', 'manual')
    newWord.definitionZh = '測試'
    newWord.definitionEn = 'test'
    newWord.infoCompleteness = 'complete'
    await wordsStore.addWord(newWord)

    // Verify word was created
    const createdWord = await wordRepository.getById(newWord.id)
    expect(createdWord).toBeDefined()
    expect(createdWord?.lemma).toBe('test')
    expect(createdWord?.definitionZh).toBe('測試')
  })

  it('should edit an existing word', async () => {
    // Create initial word
    const word = createWord('hello', 'manual')
    word.definitionZh = '你好'
    word.definitionEn = 'greeting'
    await wordRepository.create(word)

    const wrapper = mount(DashboardPage, {
      global: {
        plugins: [vuetify, createPinia()]
      }
    })

    const wordsStore = useWordsStore()
    await wordsStore.loadWords()

    // Update the word
    word.definitionZh = '你好（更新）'
    word.definitionEn = 'greeting (updated)'
    await wordsStore.updateWord(word)

    // Verify word was updated
    const updatedWord = await wordRepository.getById(word.id)
    expect(updatedWord?.definitionZh).toBe('你好（更新）')
    expect(updatedWord?.definitionEn).toBe('greeting (updated)')
  })

  it('should delete a word', async () => {
    // Create word
    const word = createWord('delete-me', 'manual')
    word.definitionZh = '刪除我'
    word.definitionEn = 'delete me'
    await wordRepository.create(word)

    const wrapper = mount(DashboardPage, {
      global: {
        plugins: [vuetify, createPinia()]
      }
    })

    const wordsStore = useWordsStore()
    await wordsStore.loadWords()

    // Delete the word
    await wordsStore.deleteWord(word.id)

    // Verify word was deleted
    const deletedWord = await wordRepository.getById(word.id)
    expect(deletedWord).toBeUndefined()
  })

  it('should add tags to a word', async () => {
    // Create tag
    const tag = createTag('important', '#FF0000')
    await tagRepository.create(tag)

    // Create word
    const word = createWord('tagged-word', 'manual')
    word.definitionZh = '標籤單字'
    word.definitionEn = 'tagged word'
    await wordRepository.create(word)

    const wrapper = mount(DashboardPage, {
      global: {
        plugins: [vuetify, createPinia()]
      }
    })

    const wordsStore = useWordsStore()
    await wordsStore.loadWords()

    // Add tag to word
    word.tags.push(tag.id)
    await wordsStore.updateWord(word)

    // Verify tag was added
    const updatedWord = await wordRepository.getById(word.id)
    expect(updatedWord?.tags).toContain(tag.id)
  })

  it('should filter words by status', async () => {
    // Create words with different statuses
    const word1 = createWord('word1', 'manual')
    word1.status = 'mastered'
    word1.definitionZh = '單字1'
    await wordRepository.create(word1)

    const word2 = createWord('word2', 'manual')
    word2.status = 'learning'
    word2.definitionZh = '單字2'
    await wordRepository.create(word2)

    const word3 = createWord('word3', 'manual')
    word3.status = 'unlearned'
    word3.definitionZh = '單字3'
    await wordRepository.create(word3)

    const wrapper = mount(DashboardPage, {
      global: {
        plugins: [vuetify, createPinia()]
      }
    })

    const wordsStore = useWordsStore()
    await wordsStore.loadWords()

    // Verify all words are loaded
    expect(wordsStore.words.length).toBeGreaterThanOrEqual(3)

    // Filter by mastered status
    const masteredWords = wordsStore.masteredWords
    expect(masteredWords.length).toBeGreaterThanOrEqual(1)
    expect(masteredWords.every(w => w.status === 'mastered')).toBe(true)
  })

  it('should search words by query', async () => {
    // Create words
    const word1 = createWord('hello', 'manual')
    word1.definitionZh = '你好'
    await wordRepository.create(word1)

    const word2 = createWord('world', 'manual')
    word2.definitionZh = '世界'
    await wordRepository.create(word2)

    const wrapper = mount(DashboardPage, {
      global: {
        plugins: [vuetify, createPinia()]
      }
    })

    const wordsStore = useWordsStore()
    await wordsStore.loadWords()

    // Search for 'hello'
    const results = await wordsStore.searchWords('hello')
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results.some(w => w.lemma === 'hello')).toBe(true)
  })

  it('should update word notes', async () => {
    // Create word
    const word = createWord('noted-word', 'manual')
    word.definitionZh = '筆記單字'
    word.definitionEn = 'noted word'
    await wordRepository.create(word)

    const wrapper = mount(DashboardPage, {
      global: {
        plugins: [vuetify, createPinia()]
      }
    })

    const wordsStore = useWordsStore()
    await wordsStore.loadWords()

    // Update notes
    word.notes = '這是一個重要的單字'
    await wordsStore.updateWord(word)

    // Verify notes were updated
    const updatedWord = await wordRepository.getById(word.id)
    expect(updatedWord?.notes).toBe('這是一個重要的單字')
  })
})

