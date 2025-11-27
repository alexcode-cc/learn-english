export interface Note {
  id: string
  wordId: string
  content: string
  createdAt: string
  updatedAt: string
}

export function createNote(wordId: string, content: string = ''): Note {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    wordId,
    content: content.trim(),
    createdAt: now,
    updatedAt: now
  }
}

