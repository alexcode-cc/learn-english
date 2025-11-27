import { initDB } from './db'
import type { Quiz } from '@/types/quiz'
import type { QuizQuestion } from '@/types/quiz-question'

export class QuizRepository {
  private dbPromise = initDB()

  // Quiz operations
  async create(quiz: Quiz): Promise<string> {
    const db = await this.dbPromise
    await db.add('quizzes', quiz)
    return quiz.id
  }

  async getById(id: string): Promise<Quiz | undefined> {
    const db = await this.dbPromise
    return db.get('quizzes', id)
  }

  async update(quiz: Quiz): Promise<void> {
    const db = await this.dbPromise
    await db.put('quizzes', quiz)
  }

  async getAll(): Promise<Quiz[]> {
    const db = await this.dbPromise
    return db.getAll('quizzes')
  }

  async delete(id: string): Promise<void> {
    const db = await this.dbPromise
    await db.delete('quizzes', id)
  }

  // QuizQuestion operations
  async createQuestion(question: QuizQuestion): Promise<string> {
    const db = await this.dbPromise
    await db.add('quizQuestions', question)
    return question.id
  }

  async getQuestionById(id: string): Promise<QuizQuestion | undefined> {
    const db = await this.dbPromise
    return db.get('quizQuestions', id)
  }

  async updateQuestion(question: QuizQuestion): Promise<void> {
    const db = await this.dbPromise
    await db.put('quizQuestions', question)
  }

  async getQuestionsByQuizId(quizId: string): Promise<QuizQuestion[]> {
    const db = await this.dbPromise
    const index = db.transaction('quizQuestions').store.index('by-quiz-id')
    return index.getAll(quizId)
  }

  async deleteQuestion(id: string): Promise<void> {
    const db = await this.dbPromise
    await db.delete('quizQuestions', id)
  }

  async deleteQuestionsByQuizId(quizId: string): Promise<void> {
    const db = await this.dbPromise
    const questions = await this.getQuestionsByQuizId(quizId)
    const tx = db.transaction('quizQuestions', 'readwrite')
    for (const question of questions) {
      await tx.store.delete(question.id)
    }
    await tx.done
  }

  /**
   * Get latest quiz
   */
  async getLatest(): Promise<Quiz | undefined> {
    const db = await this.dbPromise
    const all = await db.getAll('quizzes')
    if (all.length === 0) {
      return undefined
    }
    // Sort by createdAt, return most recent
    return all.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]
  }
}

export const quizRepository = new QuizRepository()

