export interface QuizQuestion {
  id: string
  quizId: string
  wordId: string
  prompt: string
  choices: string[]
  correctAnswer: string
  userAnswer: string
  isCorrect: boolean
}

export function createQuizQuestion(
  quizId: string,
  wordId: string,
  prompt: string,
  choices: string[],
  correctAnswer: string
): QuizQuestion {
  return {
    id: crypto.randomUUID(),
    quizId,
    wordId,
    prompt,
    choices,
    correctAnswer,
    userAnswer: '',
    isCorrect: false
  }
}

