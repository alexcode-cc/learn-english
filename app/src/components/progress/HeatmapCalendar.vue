<template>
  <v-card>
    <v-card-title>學習熱力圖</v-card-title>
    <v-card-text>
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate />
      </div>
      <div v-else-if="calendarDays.length === 0" class="text-center py-8 text-medium-emphasis">
        尚無學習記錄
      </div>
      <div v-else class="heatmap-container">
        <div class="heatmap-grid">
          <div
            v-for="day in calendarDays"
            :key="day.date"
            :class="['heatmap-day', getIntensityClass(day.minutes)]"
            :title="`${day.date}: ${day.minutes} 分鐘`"
          >
            <span class="heatmap-day-label">{{ day.day }}</span>
          </div>
        </div>
        <div class="heatmap-legend mt-4">
          <span class="text-caption text-medium-emphasis mr-4">較少</span>
          <div class="legend-colors">
            <div class="legend-color intensity-0" />
            <div class="legend-color intensity-1" />
            <div class="legend-color intensity-2" />
            <div class="legend-color intensity-3" />
            <div class="legend-color intensity-4" />
          </div>
          <span class="text-caption text-medium-emphasis ml-4">較多</span>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProgressStore } from '@/stores/useProgressStore'

const props = defineProps<{
  days?: number
}>()

const progressStore = useProgressStore()

const loading = computed(() => progressStore.loading)
const heatmapData = computed(() => progressStore.heatmapData)

interface CalendarDay {
  date: string
  day: number
  minutes: number
}

const calendarDays = computed(() => {
  const days: CalendarDay[] = []
  const today = new Date()
  const daysToShow = props.days ?? 365
  
  // Get max minutes for intensity calculation
  const maxMinutes = Math.max(...Object.values(heatmapData.value), 1)
  
  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const minutes = heatmapData.value[dateStr] ?? 0
    
    days.push({
      date: dateStr,
      day: date.getDate(),
      minutes
    })
  }
  
  return days
})

function getIntensityClass(minutes: number): string {
  if (minutes === 0) return 'intensity-0'
  
  const maxMinutes = Math.max(...Object.values(heatmapData.value), 1)
  const intensity = Math.min(Math.floor((minutes / maxMinutes) * 4), 4)
  
  return `intensity-${intensity}`
}
</script>

<style scoped>
.heatmap-container {
  overflow-x: auto;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(24px, 1fr));
  gap: 4px;
  max-width: 100%;
}

.heatmap-day {
  aspect-ratio: 1;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s;
}

.heatmap-day:hover {
  opacity: 0.8;
}

.heatmap-day-label {
  font-size: 10px;
  color: transparent;
}

.heatmap-day:hover .heatmap-day-label {
  color: #333;
}

.intensity-0 {
  background-color: #ebedf0;
}

.intensity-1 {
  background-color: #c6e48b;
}

.intensity-2 {
  background-color: #7bc96f;
}

.intensity-3 {
  background-color: #239a3b;
}

.intensity-4 {
  background-color: #196127;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: center;
}

.legend-colors {
  display: flex;
  gap: 4px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 3px;
}
</style>

