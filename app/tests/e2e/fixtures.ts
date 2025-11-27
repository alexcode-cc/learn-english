import { test as base } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * Helper function to seed test data in the browser context
 * This runs in the browser, so we need to use browser APIs directly
 */
async function seedTestData(page: Page): Promise<void> {
  await page.evaluate(async () => {
    // Use browser's IndexedDB API directly
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('learn-english-db', 1)
      
      request.onsuccess = async (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        try {
          // Clear existing words
          const clearTx = db.transaction(['words'], 'readwrite')
          await new Promise<void>((resolveClear) => {
            clearTx.oncomplete = () => resolveClear()
            clearTx.onerror = () => reject(clearTx.error)
            clearTx.objectStore('words').clear()
          })

          // Create test words
          const testWords = [
            {
              id: crypto.randomUUID(),
              lemma: 'hello',
              definitionZh: '你好',
              definitionEn: 'a greeting',
              partOfSpeech: 'interjection',
              status: 'learning',
              needsReview: false,
              lastStudiedAt: new Date().toISOString(),
              reviewDueAt: null,
              notes: '',
              source: 'manual',
              infoCompleteness: 'complete',
              tags: [],
              setIds: [],
              phonetics: [],
              audioUrls: [],
              examples: [],
              synonyms: [],
              antonyms: []
            },
            {
              id: crypto.randomUUID(),
              lemma: 'world',
              definitionZh: '世界',
              definitionEn: 'the earth',
              partOfSpeech: 'noun',
              status: 'unlearned',
              needsReview: false,
              lastStudiedAt: null,
              reviewDueAt: null,
              notes: '',
              source: 'manual',
              infoCompleteness: 'complete',
              tags: [],
              setIds: [],
              phonetics: [],
              audioUrls: [],
              examples: [],
              synonyms: [],
              antonyms: []
            },
            {
              id: crypto.randomUUID(),
              lemma: 'beautiful',
              definitionZh: '美麗的',
              definitionEn: 'having qualities of beauty',
              partOfSpeech: 'adjective',
              status: 'mastered',
              needsReview: false,
              lastStudiedAt: new Date().toISOString(),
              reviewDueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              notes: '',
              source: 'manual',
              infoCompleteness: 'complete',
              tags: [],
              setIds: [],
              phonetics: [],
              audioUrls: [],
              examples: [],
              synonyms: [],
              antonyms: []
            },
            {
              id: crypto.randomUUID(),
              lemma: 'learn',
              definitionZh: '學習',
              definitionEn: 'to gain knowledge',
              partOfSpeech: 'verb',
              status: 'learning',
              needsReview: true,
              lastStudiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              reviewDueAt: new Date(Date.now() - 1000).toISOString(), // Past due
              notes: '',
              source: 'manual',
              infoCompleteness: 'complete',
              tags: [],
              setIds: [],
              phonetics: [],
              audioUrls: [],
              examples: [],
              synonyms: [],
              antonyms: []
            },
            {
              id: crypto.randomUUID(),
              lemma: 'vocabulary',
              definitionZh: '詞彙',
              definitionEn: 'a body of words',
              partOfSpeech: 'noun',
              status: 'unlearned',
              needsReview: false,
              lastStudiedAt: null,
              reviewDueAt: null,
              notes: '',
              source: 'manual',
              infoCompleteness: 'complete',
              tags: [],
              setIds: [],
              phonetics: [],
              audioUrls: [],
              examples: [],
              synonyms: [],
              antonyms: []
            }
          ]

          // Add words to database
          const addTx = db.transaction(['words'], 'readwrite')
          const wordStore = addTx.objectStore('words')
          
          for (const word of testWords) {
            await new Promise<void>((resolveAdd) => {
              const addRequest = wordStore.add(word)
              addRequest.onsuccess = () => resolveAdd()
              addRequest.onerror = () => reject(addRequest.error)
            })
          }

          await new Promise<void>((resolveAdd) => {
            addTx.oncomplete = () => resolveAdd()
            addTx.onerror = () => reject(addTx.error)
          })

          db.close()
          resolve()
        } catch (error) {
          db.close()
          reject(error)
        }
      }
      
      request.onerror = () => reject(request.error)
      request.onupgradeneeded = (event) => {
        // Database upgrade logic if needed
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('words')) {
          const wordStore = db.createObjectStore('words', { keyPath: 'id' })
          wordStore.createIndex('by-status', 'status')
          wordStore.createIndex('by-review-due', 'reviewDueAt')
        }
        // Create other stores if needed
        if (!db.objectStoreNames.contains('wordSets')) {
          db.createObjectStore('wordSets', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('tags')) {
          db.createObjectStore('tags', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('notes')) {
          const noteStore = db.createObjectStore('notes', { keyPath: 'id' })
          noteStore.createIndex('by-word-id', 'wordId')
        }
        if (!db.objectStoreNames.contains('learningSessions')) {
          db.createObjectStore('learningSessions', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('quizzes')) {
          db.createObjectStore('quizzes', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('quizQuestions')) {
          const questionStore = db.createObjectStore('quizQuestions', { keyPath: 'id' })
          questionStore.createIndex('by-quiz-id', 'quizId')
        }
        if (!db.objectStoreNames.contains('userProgress')) {
          db.createObjectStore('userProgress', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('importJobs')) {
          db.createObjectStore('importJobs', { keyPath: 'id' })
        }
      }
    })
  })
}

/**
 * Extended test with test data fixture
 */
export const test = base.extend<{
  seedTestData: Page
}>({
  seedTestData: async ({ page }, use) => {
    // Navigate to the app first to ensure IndexedDB is initialized
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // Seed test data
    await seedTestData(page)
    
    // Use the page
    await use(page)
  }
})

export { expect } from '@playwright/test'

