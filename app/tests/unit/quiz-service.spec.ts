import { describe, it, expect, beforeEach, vi } from 'vitest'
import { wordRepository } from '@/services/word-repository'
import { createWord } from '@/types/word'
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

// Import will be available after implementation
// import { quizService } from '@/services/quiz-service'

describe('QuizService', () => {
  beforeEach(async () => {
    // Clear database
    const db = await initDB()
    const tx = db.transaction(['words', 'quizzes', 'quizQuestions'], 'readwrite')
    await tx.objectStore('words').clear()
    await tx.objectStore('quizzes').clear()
    await tx.objectStore('quizQuestions').clear()
    await tx.done
    vi.clearAllMocks()
  })

  describe('generateQuiz', () => {
    it('should generate multiple-choice quiz', async () => {
      const word1 = createWord('hello')
      word1.definitionZh = '你好'
      word1.definitionEn = 'a greeting'
      await wordRepository.create(word1)

      const word2 = createWord('world')
      word2.definitionZh = '世界'
      word2.definitionEn = 'the earth'
      await wordRepository.create(word2)

      const word3 = createWord('test')
      word3.definitionZh = '測試'
      word3.definitionEn = 'a trial'
      await wordRepository.create(word3)

      // TODO: Implement quizService.generateQuiz
      // const quiz = await quizService.generateQuiz('multiple-choice', [word1.id, word2.id, word3.id])
      // expect(quiz.mode).toBe('multiple-choice')
      // expect(quiz.questionIds.length).toBeGreaterThan(0)
    })

    it('should generate fill-in quiz', async () => {
      const word = createWord('hello')
      word.definitionZh = '你好'
      word.definitionEn = 'a greeting'
      await wordRepository.create(word)

      // TODO: Implement quizService.generateQuiz for fill-in mode
      // const quiz = await quizService.generateQuiz('fill-in', [word.id])
      // expect(quiz.mode).toBe('fill-in')
      // expect(quiz.questionIds.length).toBe(1)
    })

    it('should generate spelling quiz', async () => {
      const word = createWord('world')
      word.definitionZh = '世界'
      word.definitionEn = 'the earth'
      await wordRepository.create(word)

      // TODO: Implement quizService.generateQuiz for spelling mode
      // const quiz = await quizService.generateQuiz('spell', [word.id])
      // expect(quiz.mode).toBe('spell')
      // expect(quiz.questionIds.length).toBe(1)
    })

    it('should throw error if no words provided', async () => {
      // TODO: Implement error handling
      // await expect(quizService.generateQuiz('multiple-choice', [])).rejects.toThrow()
    })

    it('should generate questions with correct answers', async () => {
      const word = createWord('hello')
      word.definitionZh = '你好'
      word.definitionEn = 'a greeting'
      await wordRepository.create(word)

      // TODO: Implement question generation with correct answers
      // const quiz = await quizService.generateQuiz('multiple-choice', [word.id])
      // const questions = await quizService.getQuestions(quiz.id)
      // expect(questions[0].correctAnswer).toBeDefined()
    })

    it('should generate multiple choice options with one correct answer', async () => {
      const words = [
        createWord('hello'),
        createWord('world'),
        createWord('test'),
        createWord('example')
      ]
      words.forEach(w => {
        w.definitionZh = '測試'
        w.definitionEn = 'test'
      })
      for (const word of words) {
        await wordRepository.create(word)
      }

      // TODO: Implement multiple choice generation
      // const quiz = await quizService.generateQuiz('multiple-choice', [words[0].id])
      // const questions = await quizService.getQuestions(quiz.id)
      // const question = questions[0]
      // expect(question.choices.length).toBeGreaterThan(1)
      // expect(question.choices).toContain(question.correctAnswer)
      // expect(new Set(question.choices).size).toBe(question.choices.length) // No duplicates
    })
  })

  describe('submitAnswer', () => {
    it('should mark answer as correct', async () => {
      // TODO: Implement answer submission
      // const word = createWord('hello')
      // word.definitionZh = '你好'
      // await wordRepository.create(word)
      // const quiz = await quizService.generateQuiz('multiple-choice', [word.id])
      // const questions = await quizService.getQuestions(quiz.id)
      // await quizService.submitAnswer(questions[0].id, questions[0].correctAnswer)
      // const updatedQuestion = await quizService.getQuestionById(questions[0].id)
      // expect(updatedQuestion?.isCorrect).toBe(true)
    })

    it('should mark answer as incorrect', async () => {
      // TODO: Implement incorrect answer handling
      // const word = createWord('hello')
      // word.definitionZh = '你好'
      // await wordRepository.create(word)
      // const quiz = await quizService.generateQuiz('multiple-choice', [word.id])
      // const questions = await quizService.getQuestions(quiz.id)
      // await quizService.submitAnswer(questions[0].id, 'wrong answer')
      // const updatedQuestion = await quizService.getQuestionById(questions[0].id)
      // expect(updatedQuestion?.isCorrect).toBe(false)
    })
  })

  describe('calculateScore', () => {
    it('should calculate score percentage correctly', async () => {
      // TODO: Implement score calculation
      // const word1 = createWord('hello')
      // const word2 = createWord('world')
      // await wordRepository.create(word1)
      // await wordRepository.create(word2)
      // const quiz = await quizService.generateQuiz('multiple-choice', [word1.id, word2.id])
      // const questions = await quizService.getQuestions(quiz.id)
      // await quizService.submitAnswer(questions[0].id, questions[0].correctAnswer)
      // await quizService.submitAnswer(questions[1].id, 'wrong')
      // const score = await quizService.calculateScore(quiz.id)
      // expect(score).toBe(50) // 1 out of 2 correct
    })

    it('should return 100% for all correct answers', async () => {
      // TODO: Implement perfect score calculation
      // const word = createWord('hello')
      // await wordRepository.create(word)
      // const quiz = await quizService.generateQuiz('multiple-choice', [word.id])
      // const questions = await quizService.getQuestions(quiz.id)
      // await quizService.submitAnswer(questions[0].id, questions[0].correctAnswer)
      // const score = await quizService.calculateScore(quiz.id)
      // expect(score).toBe(100)
    })
  })
})

