import type { Word } from '@/types/word'

export interface WordFilterOptions {
  status?: Word['status']
  tags?: string[]
  searchQuery?: string
  needsReview?: boolean
}

export class WordFilterService {
  filterWords(words: Word[], options: WordFilterOptions): Word[] {
    let filtered = [...words]

    // Filter by status
    if (options.status) {
      filtered = filtered.filter(word => word.status === options.status)
    }

    // Filter by tags (word must have all specified tags)
    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(word =>
        options.tags!.every(tagId => word.tags.includes(tagId))
      )
    }

    // Filter by search query
    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase().trim()
      filtered = filtered.filter(word =>
        word.lemma.toLowerCase().includes(query) ||
        word.definitionZh.includes(query) ||
        word.definitionEn.toLowerCase().includes(query) ||
        word.examples.some(example => example.toLowerCase().includes(query))
      )
    }

    // Filter by needsReview
    if (options.needsReview !== undefined) {
      filtered = filtered.filter(word => word.needsReview === options.needsReview)
    }

    return filtered
  }

  getFilteredCount(words: Word[], options: WordFilterOptions): number {
    return this.filterWords(words, options).length
  }
}

export const wordFilterService = new WordFilterService()

