<template>
  <AppLayout>
    <template #header>
      <v-toolbar color="primary" dark>
        <v-toolbar-title>複習與測驗</v-toolbar-title>
        <v-spacer />
        <v-chip
          v-if="dueReviewCount > 0"
          color="warning"
          class="mr-2"
        >
          {{ dueReviewCount }} 個單字待複習
        </v-chip>
      </v-toolbar>
    </template>

    <v-container fluid>
      <!-- Review Section -->
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card>
            <v-card-title>需要複習的單字</v-card-title>
            <v-card-text>
              <v-progress-linear
                v-if="loading"
                indeterminate
                class="mb-4"
              />
              <v-alert
                v-else-if="dueWords.length === 0"
                type="success"
                variant="tonal"
              >
                太棒了！目前沒有需要複習的單字。
              </v-alert>
              <v-list v-else>
                <v-list-item
                  v-for="word in dueWords"
                  :key="word.id"
                  :title="word.lemma"
                  :subtitle="word.definitionZh"
                >
                  <template #append>
                    <v-btn
                      color="primary"
                      size="small"
                      @click="markAsReviewed(word.id, true)"
                    >
                      <v-icon start>mdi-check</v-icon>
                      已複習
                    </v-btn>
                    <v-btn
                      color="warning"
                      size="small"
                      class="ml-2"
                      @click="markAsReviewed(word.id, false)"
                    >
                      <v-icon start>mdi-refresh</v-icon>
                      稍後再複習
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Quiz Section -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>開始測驗</v-card-title>
            <v-card-text>
              <v-select
                v-model="selectedQuizMode"
                :items="quizModes"
                item-title="label"
                item-value="value"
                label="測驗模式"
                variant="outlined"
                class="mb-4"
              />
              <v-select
                v-model="selectedWordCount"
                :items="wordCountOptions"
                item-title="label"
                item-value="value"
                label="單字數量"
                variant="outlined"
                class="mb-4"
              />
              <v-btn
                color="primary"
                size="large"
                block
                :disabled="!canStartQuiz"
                @click="startQuiz"
              >
                <v-icon start>mdi-play</v-icon>
                開始測驗
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Active Quiz -->
      <v-row v-if="currentQuiz">
        <v-col cols="12">
          <v-card>
            <v-card-title>進行中的測驗</v-card-title>
            <v-card-text>
              <QuizMultipleChoice
                v-if="currentQuiz.mode === 'multiple-choice'"
                :quiz-id="currentQuiz.id"
                @completed="handleQuizCompleted"
              />
              <QuizFillIn
                v-else-if="currentQuiz.mode === 'fill-in'"
                :quiz-id="currentQuiz.id"
                @completed="handleQuizCompleted"
              />
              <QuizSpelling
                v-else-if="currentQuiz.mode === 'spell'"
                :quiz-id="currentQuiz.id"
                @completed="handleQuizCompleted"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Quiz Result -->
      <v-dialog
        v-model="showResultDialog"
        max-width="600"
        persistent
      >
        <QuizResult
          v-if="quizResult"
          :quiz-id="quizResult.quizId"
          :score="quizResult.score"
          @retry="handleRetryQuiz"
          @close="handleCloseResult"
        />
      </v-dialog>
    </v-container>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import QuizMultipleChoice from '@/components/review/QuizMultipleChoice.vue'
import QuizFillIn from '@/components/review/QuizFillIn.vue'
import QuizSpelling from '@/components/review/QuizSpelling.vue'
import QuizResult from '@/components/review/QuizResult.vue'
import { reviewEngine } from '@/services/review-engine'
import { quizService } from '@/services/quiz-service'
import { learningSessionService } from '@/services/learning-session-service'
import { wordRepository } from '@/services/word-repository'
import type { Word } from '@/types/word'
import type { Quiz, QuizMode } from '@/types/quiz'
import { logger } from '@/utils/logger'

const loading = ref(false)
const dueWords = ref<Word[]>([])
const dueReviewCount = ref(0)
const currentQuiz = ref<Quiz | null>(null)
const showResultDialog = ref(false)
const quizResult = ref<{ quizId: string; score: number } | null>(null)

const selectedQuizMode = ref<QuizMode>('multiple-choice')
const selectedWordCount = ref(10)

const quizModes = [
  { label: '選擇題', value: 'multiple-choice' },
  { label: '填空題', value: 'fill-in' },
  { label: '拼字測驗', value: 'spell' }
]

const wordCountOptions = [
  { label: '5 個單字', value: 5 },
  { label: '10 個單字', value: 10 },
  { label: '20 個單字', value: 20 },
  { label: '全部單字', value: -1 }
]

const canStartQuiz = computed(() => {
  return true // Can always start if we have words
})

async function loadDueWords(): Promise<void> {
  loading.value = true
  try {
    dueWords.value = await reviewEngine.getWordsDueForReview()
    dueReviewCount.value = await reviewEngine.getDueReviewCount()
  } catch (error) {
    logger.error('Failed to load due words', error)
  } finally {
    loading.value = false
  }
}

async function markAsReviewed(wordId: string, success: boolean): Promise<void> {
  try {
    await reviewEngine.markAsReviewed(wordId, success)
    await loadDueWords() // Refresh list
    logger.info(`Marked word ${wordId} as reviewed`, { success })
  } catch (error) {
    logger.error('Failed to mark word as reviewed', error)
  }
}

async function startQuiz(): Promise<void> {
  try {
    // Get words for quiz
    const allWords = await wordRepository.getAll()
    const wordsToUse = selectedWordCount.value === -1
      ? allWords
      : allWords.slice(0, selectedWordCount.value)

    if (wordsToUse.length === 0) {
      logger.warn('No words available for quiz')
      return
    }

    // Create learning session
    const session = await learningSessionService.createSession('review', wordsToUse.map(w => w.id))
    await learningSessionService.addAction(session.id, {
      type: 'quiz-started',
      metadata: { mode: selectedQuizMode.value, wordCount: wordsToUse.length }
    })

    // Generate quiz
    const quiz = await quizService.generateQuiz(
      selectedQuizMode.value,
      wordsToUse.map(w => w.id)
    )

    currentQuiz.value = quiz
    logger.info('Started quiz', { quizId: quiz.id, mode: selectedQuizMode.value })
  } catch (error) {
    logger.error('Failed to start quiz', error)
  }
}

async function handleQuizCompleted(score: number): Promise<void> {
  if (!currentQuiz.value) return

  quizResult.value = {
    quizId: currentQuiz.value.id,
    score
  }
  showResultDialog.value = true

  // End learning session
  const sessions = await learningSessionService.getActiveSessions()
  const activeSession = sessions.find(s => s.type === 'review')
  if (activeSession) {
    await learningSessionService.addAction(activeSession.id, {
      type: 'quiz-completed',
      metadata: { quizId: currentQuiz.value.id, score }
    })
    await learningSessionService.endSession(activeSession.id)
  }

  // Refresh due words
  await loadDueWords()
}

function handleRetryQuiz(): Promise<void> {
  showResultDialog.value = false
  quizResult.value = null
  currentQuiz.value = null
  return startQuiz()
}

function handleCloseResult(): void {
  showResultDialog.value = false
  quizResult.value = null
  currentQuiz.value = null
}

onMounted(() => {
  loadDueWords()
})
</script>
