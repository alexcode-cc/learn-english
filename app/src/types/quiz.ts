export type QuizMode = 'multiple-choice' | 'fill-in' | 'spell'

export interface Quiz {
  id: string
  mode: QuizMode
  createdAt: string
  questionIds: string[]
  scorePercent: number
}

export function createQuiz(mode: QuizMode): Quiz {
  return {
    id: crypto.randomUUID(),
    mode,
    createdAt: new Date().toISOString(),
    questionIds: [],
    scorePercent: 0
  }
}

