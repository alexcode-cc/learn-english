<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12" md="8">
        <v-text-field
          v-model="searchQuery"
          label="搜尋單字"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          clearable
          @update:model-value="handleSearch"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          label="篩選狀態"
          variant="outlined"
          clearable
        />
      </v-col>
    </v-row>

    <v-progress-linear
      v-if="wordsStore.loading"
      indeterminate
      color="primary"
      class="mb-4"
    />

    <v-alert
      v-if="wordsStore.error"
      type="error"
      dismissible
      class="mb-4"
      @click:close="wordsStore.error = null"
    >
      {{ wordsStore.error }}
    </v-alert>

    <WordCardList :words="displayWords" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { WordStatus } from '@/types/word'
import { useWordsStore } from '@/stores/useWordsStore'
import WordCardList from '@/components/cards/WordCardList.vue'

const wordsStore = useWordsStore()
const searchQuery = ref('')
const statusFilter = ref<WordStatus | null>(null)

const statusOptions = [
  { title: '未學習', value: 'unlearned' },
  { title: '學習中', value: 'learning' },
  { title: '已學會', value: 'mastered' }
]

const displayWords = computed(() => {
  let filtered = wordsStore.words

  // Apply status filter
  if (statusFilter.value) {
    filtered = filtered.filter((w) => w.status === statusFilter.value)
  }

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (w) =>
        w.lemma.toLowerCase().includes(query) ||
        w.definitionZh.includes(searchQuery.value) ||
        w.definitionEn.toLowerCase().includes(query)
    )
  }

  return filtered
})

async function handleSearch(): Promise<void> {
  // Search is now handled by computed property, no need to call store method
  // Just ensure words are loaded if needed
  if (wordsStore.words.length === 0) {
    await wordsStore.loadWords()
  }
}

onMounted(async () => {
  await wordsStore.loadWords()
})
</script>

