<template>
  <v-card>
    <v-card-title>
      <v-icon class="mr-2">mdi-progress-clock</v-icon>
      匯入進度
    </v-card-title>
    <v-card-text>
      <v-progress-linear
        :model-value="progressPercentage"
        color="primary"
        height="30"
        class="mb-4"
        rounded
      >
        <template v-slot:default="{ value }">
          <strong class="text-white">{{ Math.ceil(value) }}%</strong>
        </template>
      </v-progress-linear>

      <div class="d-flex justify-space-between mb-2">
        <span class="text-body-2">
          <v-icon size="small" class="mr-1">mdi-check-circle</v-icon>
          已完成：{{ current }} / {{ total }}
        </span>
        <span class="text-body-2 text-medium-emphasis">
          {{ remainingCount }} 個待處理
        </span>
      </div>

      <v-alert
        v-if="currentWord"
        type="info"
        variant="tonal"
        class="mb-4"
      >
        <div class="d-flex align-center">
          <v-progress-circular
            indeterminate
            size="20"
            class="mr-2"
          />
          <span>正在處理：<strong>{{ currentWord }}</strong></span>
        </div>
      </v-alert>

      <v-divider class="my-4" />

      <div class="d-flex flex-column gap-2">
        <div class="d-flex justify-space-between">
          <span class="text-body-2">成功</span>
          <v-chip size="small" color="success" variant="flat">
            {{ successCount }}
          </v-chip>
        </div>
        <div class="d-flex justify-space-between">
          <span class="text-body-2">錯誤</span>
          <v-chip size="small" color="error" variant="flat">
            {{ errorCount }}
          </v-chip>
        </div>
        <div class="d-flex justify-space-between">
          <span class="text-body-2">重複</span>
          <v-chip size="small" color="warning" variant="flat">
            {{ duplicateCount }}
          </v-chip>
        </div>
      </div>

      <v-btn
        v-if="canCancel"
        color="error"
        variant="outlined"
        block
        class="mt-4"
        @click="handleCancel"
      >
        取消匯入
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useImportStore } from '@/stores/useImportStore'

const props = defineProps<{
  canCancel?: boolean
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
}>()

const importStore = useImportStore()

const progressPercentage = computed(() => importStore.progressPercentage)
const current = computed(() => importStore.importProgress.current)
const total = computed(() => importStore.importProgress.total)
const currentWord = computed(() => importStore.importProgress.currentWord)
const remainingCount = computed(() => total.value - current.value)

const successCount = computed(() => {
  return importStore.importResult?.successCount || 0
})

const errorCount = computed(() => {
  return importStore.importResult?.errorCount || 0
})

const duplicateCount = computed(() => {
  return importStore.importResult?.duplicateCount || 0
})

function handleCancel(): void {
  emit('cancel')
}
</script>

<style scoped>
.mr-1 {
  margin-right: 0.25rem;
}
.mr-2 {
  margin-right: 0.5rem;
}
.gap-2 {
  gap: 0.5rem;
}
</style>

