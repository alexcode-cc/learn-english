<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <span class="text-h5">測驗結果</span>
      <v-spacer />
      <v-btn
        icon
        variant="text"
        @click="handleClose"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <v-card-text>
      <div class="text-center mb-6">
        <div class="text-h2 mb-2" :class="scoreColor">
          {{ score }}%
        </div>
        <div class="text-h6 mb-4">
          {{ performanceText }}
        </div>
        <v-progress-circular
          :model-value="score"
          :max="100"
          :size="120"
          :width="12"
          :color="scoreColor"
        >
          <span class="text-h4">{{ score }}</span>
        </v-progress-circular>
      </div>

      <v-divider class="my-4" />

      <v-row>
        <v-col cols="6">
          <v-card variant="outlined">
            <v-card-text class="text-center">
              <div class="text-h4 text-success">{{ correctCount }}</div>
              <div class="text-body-2">答對</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6">
          <v-card variant="outlined">
            <v-card-text class="text-center">
              <div class="text-h4 text-error">{{ incorrectCount }}</div>
              <div class="text-body-2">答錯</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-alert
        v-if="score < 70"
        type="warning"
        variant="tonal"
        class="mt-4"
      >
        建議再複習一下這些單字，然後重新測驗。
      </v-alert>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn
        color="primary"
        variant="outlined"
        @click="handleRetry"
      >
        <v-icon start>mdi-refresh</v-icon>
        再測一次
      </v-btn>
      <v-btn
        color="primary"
        @click="handleClose"
      >
        完成
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { quizService } from '@/services/quiz-service'
import { quizScoringService } from '@/services/quiz-scoring-service'
import type { QuizQuestion } from '@/types/quiz-question'

interface Props {
  quizId: string
  score: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  retry: []
  close: []
}>()

const questions = ref<QuizQuestion[]>([])

const correctCount = computed(() => {
  return questions.value.filter(q => q.isCorrect).length
})

const incorrectCount = computed(() => {
  return questions.value.filter(q => !q.isCorrect).length
})

const scoreColor = computed(() => {
  if (props.score >= 90) return 'text-success'
  if (props.score >= 70) return 'text-info'
  if (props.score >= 50) return 'text-warning'
  return 'text-error'
})

const performanceText = computed(() => {
  const level = quizScoringService.getPerformanceLevel(props.score)
  const texts = {
    excellent: '表現優異！',
    good: '表現良好',
    fair: '還可以更好',
    poor: '需要多練習'
  }
  return texts[level]
})

async function loadQuestions(): Promise<void> {
  try {
    questions.value = await quizService.getQuestions(props.quizId)
  } catch (error) {
    console.error('Failed to load quiz questions', error)
  }
}

function handleRetry(): void {
  emit('retry')
}

function handleClose(): void {
  emit('close')
}

onMounted(() => {
  loadQuestions()
})
</script>

