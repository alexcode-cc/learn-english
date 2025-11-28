<template>
  <div>
    <v-progress-linear
      :model-value="progress"
      :max="100"
      class="mb-4"
    />
    <div class="text-h6 mb-4">
      第 {{ currentQuestionIndex + 1 }} 題 / 共 {{ questions.length }} 題
    </div>

    <v-card v-if="currentQuestion" class="mb-4">
      <v-card-title class="text-h5">
        {{ currentQuestion.prompt }}
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="userAnswer"
          label="請拼出單字"
          variant="outlined"
          :disabled="isSubmitted"
          autofocus
          @keyup.enter="submitAnswer"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          v-if="!isSubmitted"
          color="primary"
          :disabled="!userAnswer.trim()"
          @click="submitAnswer"
        >
          提交答案
        </v-btn>
        <v-btn
          v-else
          color="primary"
          @click="nextQuestion"
        >
          {{ isLastQuestion ? '查看結果' : '下一題' }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-alert
      v-if="isSubmitted && currentQuestion"
      :type="currentQuestion.isCorrect ? 'success' : 'error'"
      variant="tonal"
      class="mb-4"
    >
      <div v-if="currentQuestion.isCorrect">
        <v-icon start>mdi-check-circle</v-icon>
        拼字正確！
      </div>
      <div v-else>
        <v-icon start>mdi-close-circle</v-icon>
        拼字錯誤。正確答案是：{{ currentQuestion.correctAnswer }}
      </div>
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { quizService } from '@/services/quiz-service'
import type { QuizQuestion } from '@/types/quiz-question'
import { logger } from '@/utils/logger'

interface Props {
  quizId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  completed: [score: number]
}>()

const questions = ref<QuizQuestion[]>([])
const currentQuestionIndex = ref(0)
const userAnswer = ref('')
const isSubmitted = ref(false)

const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value]
})

const isLastQuestion = computed(() => {
  return currentQuestionIndex.value === questions.value.length - 1
})

const progress = computed(() => {
  if (questions.value.length === 0) return 0
  return ((currentQuestionIndex.value + 1) / questions.value.length) * 100
})

async function loadQuestions(): Promise<void> {
  try {
    questions.value = await quizService.getQuestions(props.quizId)
    if (questions.value.length > 0) {
      userAnswer.value = questions.value[0].userAnswer || ''
      isSubmitted.value = questions.value[0].userAnswer !== ''
    }
  } catch (error) {
    logger.error('Failed to load quiz questions', {
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

async function submitAnswer(): Promise<void> {
  if (!currentQuestion.value || !userAnswer.value.trim()) return

  try {
    await quizService.submitAnswer(currentQuestion.value.id, userAnswer.value.trim())
    isSubmitted.value = true

    // Update local question state
    currentQuestion.value.userAnswer = userAnswer.value.trim()
    currentQuestion.value.isCorrect = userAnswer.value.trim().toLowerCase() === currentQuestion.value.correctAnswer.toLowerCase()

    logger.debug('Submitted answer', {
      questionId: currentQuestion.value.id,
      isCorrect: currentQuestion.value.isCorrect
    })
  } catch (error) {
    logger.error('Failed to submit answer', {
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

async function nextQuestion(): Promise<void> {
  if (isLastQuestion.value) {
    // Calculate final score
    const score = await quizService.calculateScore(props.quizId)
    emit('completed', score)
  } else {
    currentQuestionIndex.value++
    userAnswer.value = currentQuestion.value?.userAnswer || ''
    isSubmitted.value = currentQuestion.value?.userAnswer !== ''
  }
}

onMounted(() => {
  loadQuestions()
})
</script>

