import { wordRepository } from './word-repository'
import { quizRepository } from './quiz-repository'
import type { Word } from '@/types/word'
import type { Quiz, QuizMode } from '@/types/quiz'
import type { QuizQuestion } from '@/types/quiz-question'
import { createQuiz } from '@/types/quiz'
import { createQuizQuestion } from '@/types/quiz-question'
import { logger } from '@/utils/logger'

export class QuizService {
  /**
   * Generate a quiz with questions from the provided word IDs
   */
  async generateQuiz(mode: QuizMode, wordIds: string[]): Promise<Quiz> {
    if (wordIds.length === 0) {
      throw new Error('Cannot generate quiz with no words')
    }

    const quiz = createQuiz(mode)
    const words = await Promise.all(
      wordIds.map(id => wordRepository.getById(id))
    )

    // Filter out undefined words
    const validWords = words.filter((w): w is Word => w !== undefined)

    if (validWords.length === 0) {
      throw new Error('No valid words found for quiz generation')
    }

    // Generate questions based on mode
    const questions: QuizQuestion[] = []

    for (const word of validWords) {
      let question: QuizQuestion

      switch (mode) {
        case 'multiple-choice':
          question = this.generateMultipleChoiceQuestion(quiz.id, word, validWords)
          break
        case 'fill-in':
          question = this.generateFillInQuestion(quiz.id, word)
          break
        case 'spell':
          question = this.generateSpellingQuestion(quiz.id, word)
          break
        default:
          throw new Error(`Unknown quiz mode: ${mode}`)
      }

      questions.push(question)
    }

    // Save questions to repository
    for (const question of questions) {
      await quizRepository.createQuestion(question)
    }

    // Update quiz with question IDs
    quiz.questionIds = questions.map(q => q.id)
    await quizRepository.create(quiz)

    logger.info(`Generated ${mode} quiz with ${questions.length} questions`, {
      quizId: quiz.id,
      questionCount: questions.length
    })

    return quiz
  }

  /**
   * Generate a multiple-choice question
   */
  private generateMultipleChoiceQuestion(
    quizId: string,
    word: Word,
    allWords: Word[]
  ): QuizQuestion {
    // Create wrong answers from other words
    const wrongAnswers = allWords
      .filter(w => w.id !== word.id)
      .map(w => w.definitionZh)
      .filter(def => def && def.trim().length > 0)
      .slice(0, 3) // Take up to 3 wrong answers

    // If we don't have enough wrong answers, add some generic ones
    while (wrongAnswers.length < 3) {
      wrongAnswers.push('其他選項')
    }

    // Shuffle and take 3
    const shuffled = wrongAnswers.sort(() => Math.random() - 0.5).slice(0, 3)
    const choices = [word.definitionZh, ...shuffled].sort(() => Math.random() - 0.5)

    return createQuizQuestion(
      quizId,
      word.id,
      `What is the Chinese meaning of "${word.lemma}"?`,
      choices,
      word.definitionZh
    )
  }

  /**
   * Generate a fill-in question
   */
  private generateFillInQuestion(quizId: string, word: Word): QuizQuestion {
    return createQuizQuestion(
      quizId,
      word.id,
      `Fill in the blank: "${word.definitionZh}" means _____ in English.`,
      [], // No choices for fill-in
      word.lemma
    )
  }

  /**
   * Generate a spelling question
   */
  private generateSpellingQuestion(quizId: string, word: Word): QuizQuestion {
    return createQuizQuestion(
      quizId,
      word.id,
      `Spell the word that means "${word.definitionZh}":`,
      [], // No choices for spelling
      word.lemma.toLowerCase()
    )
  }

  /**
   * Submit an answer to a question
   */
  async submitAnswer(questionId: string, answer: string): Promise<boolean> {
    const question = await quizRepository.getQuestionById(questionId)
    if (!question) {
      throw new Error(`Question with id ${questionId} not found`)
    }

    // Normalize answers for comparison
    const normalizedUserAnswer = answer.trim().toLowerCase()
    const normalizedCorrectAnswer = question.correctAnswer.trim().toLowerCase()

    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer

    // Update question
    question.userAnswer = answer
    question.isCorrect = isCorrect

    await quizRepository.updateQuestion(question)

    logger.debug(`Answer submitted for question ${questionId}`, {
      isCorrect,
      userAnswer: answer,
      correctAnswer: question.correctAnswer
    })

    return isCorrect
  }

  /**
   * Get all questions for a quiz
   */
  async getQuestions(quizId: string): Promise<QuizQuestion[]> {
    return quizRepository.getQuestionsByQuizId(quizId)
  }

  /**
   * Get a single question by ID
   */
  async getQuestionById(questionId: string): Promise<QuizQuestion | undefined> {
    return quizRepository.getQuestionById(questionId)
  }

  /**
   * Calculate score for a completed quiz
   */
  async calculateScore(quizId: string): Promise<number> {
    const questions = await this.getQuestions(quizId)
    
    if (questions.length === 0) {
      return 0
    }

    const correctCount = questions.filter(q => q.isCorrect).length
    const scorePercent = Math.round((correctCount / questions.length) * 100)

    // Update quiz score
    const quiz = await quizRepository.getById(quizId)
    if (quiz) {
      quiz.scorePercent = scorePercent
      await quizRepository.update(quiz)
    }

    return scorePercent
  }

  /**
   * Get quiz by ID
   */
  async getQuizById(quizId: string): Promise<Quiz | undefined> {
    return quizRepository.getById(quizId)
  }
}

export const quizService = new QuizService()

