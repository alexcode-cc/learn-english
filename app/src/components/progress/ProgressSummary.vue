<template>
  <v-row>
    <v-col cols="12" sm="6" md="3">
      <v-card>
        <v-card-text>
          <div class="text-caption text-medium-emphasis">總單字數</div>
          <div class="text-h4 mt-2">{{ progress?.totalWords ?? 0 }}</div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card>
        <v-card-text>
          <div class="text-caption text-medium-emphasis">已學會</div>
          <div class="text-h4 mt-2">{{ progress?.masteredWords ?? 0 }}</div>
          <div class="text-caption text-success mt-1">
            {{ masteryPercentage }}% 完成度
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card>
        <v-card-text>
          <div class="text-caption text-medium-emphasis">連續學習天數</div>
          <div class="text-h4 mt-2">
            <v-icon color="warning" size="small" class="mr-1">mdi-fire</v-icon>
            {{ progress?.streakDays ?? 0 }} 天
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card>
        <v-card-text>
          <div class="text-caption text-medium-emphasis">總學習時間</div>
          <div class="text-h4 mt-2">{{ totalStudyHours }} 小時</div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ progress?.totalStudyMinutes ?? 0 }} 分鐘
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProgressStore } from '@/stores/useProgressStore'

const progressStore = useProgressStore()

const progress = computed(() => progressStore.progress)
const masteryPercentage = computed(() => progressStore.masteryPercentage)
const totalStudyHours = computed(() => progressStore.totalStudyHours)
</script>

