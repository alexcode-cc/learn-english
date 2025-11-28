<template>
  <v-card>
    <v-card-title>測驗成績趨勢</v-card-title>
    <v-card-text>
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate />
      </div>
      <div v-else-if="trends.length === 0" class="text-center py-8 text-medium-emphasis">
        尚無測驗記錄
      </div>
      <div v-else class="chart-container">
        <svg :width="width" :height="height" class="chart-svg">
          <!-- Grid lines -->
          <g v-for="i in 5" :key="`grid-${i}`">
            <line
              :x1="padding"
              :y1="padding + (i - 1) * (chartHeight / 4)"
              :x2="width - padding"
              :y2="padding + (i - 1) * (chartHeight / 4)"
              stroke="#e0e0e0"
              stroke-width="1"
            />
          </g>

          <!-- Passing line (70%) -->
          <line
            :x1="padding"
            :y1="padding + (chartHeight * 0.3)"
            :x2="width - padding"
            :y2="padding + (chartHeight * 0.3)"
            stroke="#ff9800"
            stroke-width="1"
            stroke-dasharray="4,4"
          />
          <text
            :x="width - padding + 5"
            :y="padding + (chartHeight * 0.3) + 4"
            class="text-caption"
            fill="#ff9800"
          >
            及格線 (70%)
          </text>

          <!-- Chart area -->
          <polyline
            :points="linePoints"
            fill="none"
            stroke="rgb(76, 175, 80)"
            stroke-width="2"
          />

          <!-- Data points -->
          <circle
            v-for="(point, index) in dataPoints"
            :key="index"
            :cx="point.x"
            :cy="point.y"
            r="4"
            fill="rgb(76, 175, 80)"
          />

          <!-- Score labels -->
          <text
            v-for="(point, index) in dataPoints"
            :key="`score-${index}`"
            :x="point.x"
            :y="point.y - 8"
            text-anchor="middle"
            class="text-caption font-weight-bold"
            fill="rgb(76, 175, 80)"
          >
            {{ point.score }}%
          </text>

          <!-- Date labels -->
          <text
            v-for="(point, index) in dataPoints"
            :key="`date-${index}`"
            :x="point.x"
            :y="height - padding + 15"
            text-anchor="middle"
            class="text-caption"
            fill="#666"
          >
            {{ formatDate(point.date) }}
          </text>

          <!-- Y-axis labels -->
          <text
            v-for="i in 5"
            :key="`y-label-${i}`"
            :x="padding - 10"
            :y="padding + (i - 1) * (chartHeight / 4) + 4"
            text-anchor="end"
            class="text-caption"
            fill="#666"
          >
            {{ 100 - (i - 1) * 25 }}%
          </text>
        </svg>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProgressStore } from '@/stores/useProgressStore'

defineProps<{
  days?: number
}>()

const progressStore = useProgressStore()

const loading = computed(() => progressStore.loading)
const trends = computed(() => progressStore.quizScoreTrends)

const width = 800
const height = 300
const padding = 50
const chartHeight = height - padding * 2
const chartWidth = width - padding * 2

const dataPoints = computed(() => {
  if (trends.value.length === 0) return []
  
  const step = chartWidth / Math.max(trends.value.length - 1, 1)
  
  return trends.value.map((trend, index) => ({
    x: padding + index * step,
    y: padding + chartHeight - (trend.score / 100) * chartHeight,
    date: trend.date,
    score: trend.score
  }))
})

const linePoints = computed(() => {
  return dataPoints.value.map(p => `${p.x},${p.y}`).join(' ')
})

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day}`
}
</script>

<style scoped>
.chart-container {
  overflow-x: auto;
}

.chart-svg {
  display: block;
}
</style>

