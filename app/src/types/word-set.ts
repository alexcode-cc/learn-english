export interface WordSet {
  id: string
  name: string
  description: string
  createdAt: string
  wordIds: string[]
  colorToken: string
}

export function createWordSet(name: string, description = ''): WordSet {
  return {
    id: crypto.randomUUID(),
    name,
    description,
    createdAt: new Date().toISOString(),
    wordIds: [],
    colorToken: 'primary'
  }
}

