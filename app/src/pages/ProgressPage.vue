<template>
  <AppLayout>
    <template #header>
      <v-toolbar color="primary" dark>
        <v-toolbar-title>學習進度</v-toolbar-title>
        <v-spacer />
        <v-btn
          icon
          :loading="loading"
          @click="refresh"
        >
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-toolbar>
    </template>

    <v-container fluid>
      <v-row v-if="error" class="mb-4">
        <v-col cols="12">
          <v-alert type="error" variant="tonal">
            {{ error }}
          </v-alert>
        </v-col>
      </v-row>

      <!-- Progress Summary -->
      <v-row class="mb-4">
        <v-col cols="12">
          <ProgressSummary />
        </v-col>
      </v-row>

      <!-- Charts -->
      <v-row>
        <v-col cols="12" md="6">
          <LearningTrendChart :days="30" />
        </v-col>
        <v-col cols="12" md="6">
          <QuizScoreChart :days="30" />
        </v-col>
      </v-row>

      <!-- Heatmap -->
      <v-row class="mt-4">
        <v-col cols="12">
          <HeatmapCalendar :days="365" />
        </v-col>
      </v-row>
    </v-container>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import ProgressSummary from '@/components/progress/ProgressSummary.vue'
import LearningTrendChart from '@/components/progress/LearningTrendChart.vue'
import QuizScoreChart from '@/components/progress/QuizScoreChart.vue'
import HeatmapCalendar from '@/components/progress/HeatmapCalendar.vue'
import { useProgressStore } from '@/stores/useProgressStore'

const progressStore = useProgressStore()

const loading = computed(() => progressStore.loading)
const error = computed(() => progressStore.error)

async function refresh() {
  await progressStore.refreshAll()
}

onMounted(async () => {
  await progressStore.refreshAll()
})
</script>
