export type LearningSessionType = 'study' | 'review'

export interface LearningSession {
  id: string
  type: LearningSessionType
  wordIds: string[]
  startedAt: string
  endedAt: string | null
  durationMs: number
  actions: SessionAction[]
}

export interface SessionAction {
  type: 'word-viewed' | 'word-reviewed' | 'quiz-started' | 'quiz-completed'
  wordId?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export function createLearningSession(
  type: LearningSessionType,
  wordIds: string[] = []
): LearningSession {
  return {
    id: crypto.randomUUID(),
    type,
    wordIds,
    startedAt: new Date().toISOString(),
    endedAt: null,
    durationMs: 0,
    actions: []
  }
}

