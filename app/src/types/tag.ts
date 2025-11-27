export interface Tag {
  id: string
  label: string
  color: string
  wordCount: number
}

export function createTag(label: string, color: string = '#1976D2'): Tag {
  return {
    id: crypto.randomUUID(),
    label: label.trim(),
    color,
    wordCount: 0
  }
}

