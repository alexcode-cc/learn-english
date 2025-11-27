export interface UserProgress {
  id: string // Always 'progress' (singleton)
  totalWords: number
  masteredWords: number
  streakDays: number
  totalStudyMinutes: number
  lastActivityAt: string
  heatmap: Record<string, number> // date -> minutes
}

export function createUserProgress(): UserProgress {
  return {
    id: 'progress',
    totalWords: 0,
    masteredWords: 0,
    streakDays: 0,
    totalStudyMinutes: 0,
    lastActivityAt: new Date().toISOString(),
    heatmap: {}
  }
}

