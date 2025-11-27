export type WordStatus = 'unlearned' | 'learning' | 'mastered'
export type WordSource = 'csv' | 'manual'
export type InfoCompleteness = 'complete' | 'missing-definition' | 'missing-audio'

export interface Word {
  id: string
  lemma: string
  phonetics: string[]
  audioUrls: string[]
  partOfSpeech: string
  definitionEn: string
  definitionZh: string
  examples: string[]
  synonyms: string[]
  antonyms: string[]
  status: WordStatus
  needsReview: boolean
  lastStudiedAt: string | null
  reviewDueAt: string | null
  notes: string
  source: WordSource
  infoCompleteness: InfoCompleteness
  tags: string[]
  setIds: string[]
}

export function createWord(lemma: string, source: WordSource = 'manual'): Word {
  return {
    id: crypto.randomUUID(),
    lemma: lemma.trim(),
    phonetics: [],
    audioUrls: [],
    partOfSpeech: '',
    definitionEn: '',
    definitionZh: '',
    examples: [],
    synonyms: [],
    antonyms: [],
    status: 'unlearned',
    needsReview: false,
    lastStudiedAt: null,
    reviewDueAt: null,
    notes: '',
    source,
    infoCompleteness: 'missing-definition',
    tags: [],
    setIds: []
  }
}

