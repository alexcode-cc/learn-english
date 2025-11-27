<template>
  <div v-if="filteredWords.length === 0" class="text-center pa-8">
    <EmptyState />
  </div>
  <v-row v-else>
    <v-col
      v-for="word in filteredWords"
      :key="word.id"
      cols="12"
      sm="6"
      md="4"
      lg="3"
    >
      <WordCard :word="word" />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Word } from '@/types/word'
import WordCard from './WordCard.vue'
import EmptyState from './EmptyState.vue'

interface Props {
  words: Word[]
  filter?: (word: Word) => boolean
}

const props = defineProps<Props>()

const filteredWords = computed(() => {
  if (props.filter) {
    return props.words.filter(props.filter)
  }
  return props.words
})
</script>

