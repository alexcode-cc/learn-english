<template>
  <div class="word-card-container" @click="handleCardClick">
    <div
      class="word-card"
      :class="{ flipped: isFlipped }"
    >
      <!-- Front side -->
      <div class="word-card-front">
        <v-card class="h-100" elevation="2">
          <v-card-title class="text-h5 pa-4">
            {{ storeWord.lemma }}
          </v-card-title>
          <v-card-subtitle v-if="storeWord.partOfSpeech" class="pa-2">
            {{ storeWord.partOfSpeech }}
          </v-card-subtitle>
          <v-card-text class="pa-4">
            <p class="text-body-1">{{ storeWord.definitionZh || '點擊查看詳細資訊' }}</p>
          </v-card-text>
          <v-card-actions class="pa-2">
            <v-chip
              :color="getStatusColor(storeWord.status)"
              size="small"
              variant="flat"
            >
              {{ getStatusText(storeWord.status) }}
            </v-chip>
            <v-chip
              v-if="storeWord.needsReview"
              color="warning"
              size="small"
              variant="flat"
              class="ml-2"
            >
              <v-icon start size="small">mdi-refresh</v-icon>
              需要複習
            </v-chip>
            <v-spacer />
            <v-icon>mdi-chevron-right</v-icon>
          </v-card-actions>
        </v-card>
      </div>

      <!-- Back side -->
      <div class="word-card-back">
        <v-card class="h-100" elevation="2">
          <v-card-title class="pa-4 d-flex align-center">
            <span class="text-h5">{{ storeWord.lemma }}</span>
            <v-spacer />
            <v-btn
              icon
              variant="text"
              size="small"
              @click.stop="playAudio"
              :disabled="!hasAudio"
            >
              <v-icon>mdi-volume-high</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text class="pa-4">
            <div v-if="storeWord.phonetics.length > 0" class="mb-2">
              <strong>發音：</strong>
              <span v-for="(phonetic, idx) in storeWord.phonetics" :key="idx">
                /{{ phonetic }}/
              </span>
            </div>
            <div class="mb-2">
              <strong>中文解釋：</strong>
              <p>{{ storeWord.definitionZh || '無' }}</p>
            </div>
            <div class="mb-2">
              <strong>英文解釋：</strong>
              <p>{{ storeWord.definitionEn || '無' }}</p>
            </div>
            <div v-if="storeWord.examples.length > 0" class="mb-2">
              <strong>例句：</strong>
              <ul>
                <li v-for="(example, idx) in storeWord.examples" :key="idx">
                  {{ example }}
                </li>
              </ul>
            </div>
            <div v-if="storeWord.synonyms.length > 0" class="mb-2">
              <strong>同義詞：</strong>
              <v-chip
                v-for="(synonym, idx) in storeWord.synonyms"
                :key="idx"
                size="small"
                class="ma-1"
              >
                {{ synonym }}
              </v-chip>
            </div>
          </v-card-text>
          <v-card-actions class="pa-2">
            <v-btn
              color="success"
              variant="flat"
              size="small"
              @click.stop="handleMastered"
            >
              <v-icon start>mdi-check</v-icon>
              已學會
            </v-btn>
            <v-btn
              color="warning"
              variant="flat"
              size="small"
              @click.stop="handleNeedsReview"
            >
              <v-icon start>mdi-refresh</v-icon>
              需要複習
            </v-btn>
            <v-spacer />
            <v-icon>mdi-chevron-left</v-icon>
          </v-card-actions>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { Word, WordStatus } from '@/types/word'
import { useCardFlip } from '@/composables/useCardFlip'
import { useWordsStore } from '@/stores/useWordsStore'

interface Props {
  word: Word
}

const props = defineProps<Props>()

const wordsStore = useWordsStore()
const { isFlipped, flip } = useCardFlip()

// Get the word from store to ensure reactivity
const storeWord = computed(() => {
  return wordsStore.words.find((w) => w.id === props.word.id) || props.word
})

// Watch for changes in store and update local reference
watch(
  () => wordsStore.words,
  () => {
    // Force reactivity update when words change
  },
  { deep: true }
)

const hasAudio = computed(() => storeWord.value.audioUrls.length > 0)

function getStatusColor(status: WordStatus): string {
  switch (status) {
    case 'mastered':
      return 'success'
    case 'learning':
      return 'info'
    default:
      return 'grey'
  }
}

function getStatusText(status: WordStatus): string {
  switch (status) {
    case 'mastered':
      return '已學會'
    case 'learning':
      return '學習中'
    default:
      return '未學習'
  }
}

function handleCardClick(): void {
  flip()
}

async function handleMastered(): Promise<void> {
  try {
    await wordsStore.markAsMastered(props.word.id)
    flip()
  } catch (error) {
    console.error('Failed to mark as mastered:', error)
  }
}

async function handleNeedsReview(): Promise<void> {
  try {
    await wordsStore.markAsNeedsReview(props.word.id)
    flip()
  } catch (error) {
    console.error('Failed to mark as needs review:', error)
  }
}

function playAudio(): void {
  if (storeWord.value.audioUrls.length > 0) {
    const audio = new Audio(storeWord.value.audioUrls[0])
    audio.play().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Failed to play audio:', err)
    })
  }
}
</script>

<style scoped>
.word-card-container {
  perspective: 1000px;
  width: 100%;
  height: 400px;
}

.word-card {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.3s;
}

.word-card.flipped {
  transform: rotateY(180deg);
}

.word-card-front,
.word-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.word-card-back {
  transform: rotateY(180deg);
}

.h-100 {
  height: 100%;
}
</style>

