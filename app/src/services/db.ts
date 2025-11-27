import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Word } from '@/types/word'
import type { WordSet } from '@/types/word-set'
import type { Tag } from '@/types/tag'
import type { Note } from '@/types/note'
import type { LearningSession } from '@/types/learning-session'
import type { Quiz } from '@/types/quiz'
import type { QuizQuestion } from '@/types/quiz-question'
import type { ImportJob } from '@/types/import-job'
import type { UserProgress } from '@/types/user-progress'

export interface LearnEnglishDB extends DBSchema {
  words: {
    key: string
    value: Word
    indexes: { 'by-status': string; 'by-review-due': string }
  }
  wordSets: {
    key: string
    value: WordSet
  }
  tags: {
    key: string
    value: Tag
  }
  notes: {
    key: string
    value: Note
    indexes: { 'by-word-id': string }
  }
  learningSessions: {
    key: string
    value: LearningSession
  }
  quizzes: {
    key: string
    value: Quiz
  }
  quizQuestions: {
    key: string
    value: QuizQuestion
    indexes: { 'by-quiz-id': string }
  }
  userProgress: {
    key: string
    value: UserProgress
  }
  importJobs: {
    key: string
    value: ImportJob
  }
}

// UserProgress type is now imported from @/types/user-progress

const DB_NAME = 'learn-english-db'
const DB_VERSION = 1

export async function initDB(): Promise<IDBPDatabase<LearnEnglishDB>> {
  return openDB<LearnEnglishDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Words store
      if (!db.objectStoreNames.contains('words')) {
        const wordStore = db.createObjectStore('words', { keyPath: 'id' })
        wordStore.createIndex('by-status', 'status')
        wordStore.createIndex('by-review-due', 'reviewDueAt')
      }

      // WordSets store
      if (!db.objectStoreNames.contains('wordSets')) {
        db.createObjectStore('wordSets', { keyPath: 'id' })
      }

      // Tags store
      if (!db.objectStoreNames.contains('tags')) {
        db.createObjectStore('tags', { keyPath: 'id' })
      }

      // Notes store
      if (!db.objectStoreNames.contains('notes')) {
        const noteStore = db.createObjectStore('notes', { keyPath: 'id' })
        noteStore.createIndex('by-word-id', 'wordId')
      }

      // LearningSessions store
      if (!db.objectStoreNames.contains('learningSessions')) {
        db.createObjectStore('learningSessions', { keyPath: 'id' })
      }

      // Quizzes store
      if (!db.objectStoreNames.contains('quizzes')) {
        db.createObjectStore('quizzes', { keyPath: 'id' })
      }

      // QuizQuestions store
      if (!db.objectStoreNames.contains('quizQuestions')) {
        const questionStore = db.createObjectStore('quizQuestions', { keyPath: 'id' })
        questionStore.createIndex('by-quiz-id', 'quizId')
      }

      // UserProgress store (singleton)
      if (!db.objectStoreNames.contains('userProgress')) {
        db.createObjectStore('userProgress', { keyPath: 'id' })
      }

      // ImportJobs store
      if (!db.objectStoreNames.contains('importJobs')) {
        db.createObjectStore('importJobs', { keyPath: 'id' })
      }
    }
  })
}

