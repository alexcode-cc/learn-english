import { ref, computed } from 'vue'
import type { Word } from '@/types/word'
import { wordRepository } from '@/services/word-repository'

export function useWordSearch() {
  const searchQuery = ref('')
  const searchResults = ref<Word[]>([])
  const isSearching = ref(false)

  const hasResults = computed(() => searchResults.value.length > 0)
  const resultCount = computed(() => searchResults.value.length)

  async function performSearch(query: string): Promise<void> {
    if (!query.trim()) {
      searchResults.value = []
      return
    }

    isSearching.value = true
    try {
      const results = await wordRepository.searchByLemma(query.trim())
      searchResults.value = results
    } catch (error) {
      console.error('Search failed:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }

  function clearSearch(): void {
    searchQuery.value = ''
    searchResults.value = []
  }

  return {
    searchQuery,
    searchResults,
    isSearching,
    hasResults,
    resultCount,
    performSearch,
    clearSearch
  }
}

