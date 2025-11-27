import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Word } from '@/types/word'
import type { WordSet } from '@/types/word-set'

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

export interface Tag {
  id: string
  label: string
  color: string
  wordCount: number
}

export interface Note {
  id: string
  wordId: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface LearningSession {
  id: string
  type: 'study' | 'review'
  wordIds: string[]
  startedAt: string
  endedAt: string | null
  durationMs: number
  actions: unknown[]
}

export interface Quiz {
  id: string
  mode: 'multiple-choice' | 'fill-in' | 'spell'
  createdAt: string
  questionIds: string[]
  scorePercent: number
}

export interface QuizQuestion {
  id: string
  quizId: string
  prompt: string
  choices: string[]
  correctAnswer: string
  userAnswer: string
  isCorrect: boolean
}

export interface UserProgress {
  id: string
  totalWords: number
  masteredWords: number
  streakDays: number
  totalStudyMinutes: number
  lastActivityAt: string
  heatmap: Record<string, number>
}

export interface ImportJob {
  id: string
  filename: string
  totalWords: number
  processedWords: number
  status: 'pending' | 'running' | 'failed' | 'completed'
  errors: Array<{ row: number; message: string }>
  startedAt: string
  endedAt: string | null
}

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

