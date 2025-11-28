<template>
  <v-card>
    <v-card-title>學習趨勢</v-card-title>
    <v-card-text>
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate />
      </div>
      <div v-else-if="trends.length === 0" class="text-center py-8 text-medium-emphasis">
        尚無學習記錄
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

          <!-- Chart area -->
          <polyline
            :points="linePoints"
            fill="none"
            stroke="rgb(25, 118, 210)"
            stroke-width="2"
          />

          <!-- Data points -->
          <circle
            v-for="(point, index) in dataPoints"
            :key="index"
            :cx="point.x"
            :cy="point.y"
            r="4"
            fill="rgb(25, 118, 210)"
          />

          <!-- Labels -->
          <text
            v-for="(point, index) in dataPoints"
            :key="`label-${index}`"
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
            {{ maxMinutes - (i - 1) * (maxMinutes / 4) }}
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
const trends = computed(() => progressStore.learningTrends)

const width = 800
const height = 300
const padding = 50
const chartHeight = height - padding * 2
const chartWidth = width - padding * 2

const maxMinutes = computed(() => {
  if (trends.value.length === 0) return 60
  return Math.max(...trends.value.map(t => t.minutes), 60)
})

const dataPoints = computed(() => {
  if (trends.value.length === 0) return []
  
  const step = chartWidth / Math.max(trends.value.length - 1, 1)
  
  return trends.value.map((trend, index) => ({
    x: padding + index * step,
    y: padding + chartHeight - (trend.minutes / maxMinutes.value) * chartHeight,
    date: trend.date,
    minutes: trend.minutes
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

