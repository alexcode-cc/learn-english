<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12" md="8">
        <v-text-field
          v-model="searchQuery"
          label="搜尋單字"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          clearable
          @update:model-value="handleSearch"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          label="篩選狀態"
          variant="outlined"
          clearable
        />
      </v-col>
    </v-row>

    <!-- 載入狀態顯示 - 使用骨架屏 -->
    <v-row v-if="wordsStore.loading">
      <v-col
        v-for="i in 6"
        :key="i"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <WordCardSkeleton />
      </v-col>
    </v-row>

    <!-- 背景載入進度提示 -->
    <v-alert
      v-if="wordsStore.loadingMore && !wordsStore.loading"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      <template v-slot:prepend>
        <v-progress-circular
          indeterminate
          size="20"
          width="2"
          color="info"
        />
      </template>
      正在背景載入更多單字... ({{ wordsStore.words.length }} / {{ wordsStore.totalCount }})
    </v-alert>

    <v-alert
      v-if="wordsStore.error"
      type="error"
      dismissible
      class="mb-4"
      @click:close="wordsStore.error = null"
    >
      {{ wordsStore.error }}
    </v-alert>

    <!-- 統計資訊 -->
    <div v-if="!wordsStore.loading && wordsStore.words.length > 0" class="mb-4">
      <v-chip size="small" class="mr-2">
        顯示 {{ displayWords.length }} 個單字
      </v-chip>
      <v-chip v-if="!wordsStore.isFullyLoaded" size="small" color="info" variant="outlined">
        共 {{ wordsStore.totalCount }} 個
      </v-chip>
    </div>

    <!-- 單字卡片列表（分頁顯示） -->
    <WordCardList 
      v-if="!wordsStore.loading"
      :words="paginatedWords" 
    />

    <!-- 載入更多按鈕 -->
    <div 
      v-if="!wordsStore.loading && hasMoreToShow" 
      class="text-center py-4"
    >
      <v-btn
        variant="outlined"
        color="primary"
        @click="showMore"
        :loading="loadingMoreDisplay"
      >
        顯示更多 (已顯示 {{ currentDisplayCount }} / {{ displayWords.length }})
      </v-btn>
    </div>

    <!-- 已顯示全部 -->
    <div 
      v-if="!wordsStore.loading && displayWords.length > 0 && !hasMoreToShow" 
      class="text-center py-4 text-medium-emphasis"
    >
      已顯示全部 {{ displayWords.length }} 個單字
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { WordStatus } from '@/types/word'
import { useWordsStore } from '@/stores/useWordsStore'
import WordCardList from '@/components/cards/WordCardList.vue'
import WordCardSkeleton from '@/components/common/WordCardSkeleton.vue'

const wordsStore = useWordsStore()
const searchQuery = ref('')
const statusFilter = ref<WordStatus | null>(null)

// 分頁顯示控制
const DISPLAY_PAGE_SIZE = 20
const displayPage = ref(1)
const loadingMoreDisplay = ref(false)

const statusOptions = [
  { title: '未學習', value: 'unlearned' },
  { title: '學習中', value: 'learning' },
  { title: '已學會', value: 'mastered' }
]

// 篩選後的所有單字
const displayWords = computed(() => {
  let filtered = wordsStore.words

  // Apply status filter
  if (statusFilter.value) {
    filtered = filtered.filter((w) => w.status === statusFilter.value)
  }

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (w) =>
        w.lemma.toLowerCase().includes(query) ||
        w.definitionZh.includes(searchQuery.value) ||
        w.definitionEn.toLowerCase().includes(query)
    )
  }

  return filtered
})

// 當前頁面顯示的單字數量
const currentDisplayCount = computed(() => {
  return Math.min(displayPage.value * DISPLAY_PAGE_SIZE, displayWords.value.length)
})

// 分頁後顯示的單字
const paginatedWords = computed(() => {
  return displayWords.value.slice(0, currentDisplayCount.value)
})

// 是否還有更多可顯示
const hasMoreToShow = computed(() => {
  return currentDisplayCount.value < displayWords.value.length
})

// 顯示更多
function showMore(): void {
  loadingMoreDisplay.value = true
  // 使用 requestAnimationFrame 確保 UI 更新
  requestAnimationFrame(() => {
    displayPage.value++
    loadingMoreDisplay.value = false
  })
}

// 當篩選條件變化時重置分頁
watch([searchQuery, statusFilter], () => {
  displayPage.value = 1
})

// 當 store 中的單字變化時，確保分頁狀態正確
watch(() => wordsStore.words.length, () => {
  // 如果新載入的單字數量足夠當前頁面顯示，不需要重置
})

async function handleSearch(): Promise<void> {
  // 如果正在搜尋且資料未完全載入，需要載入全部資料
  if (searchQuery.value && !wordsStore.isFullyLoaded) {
    await wordsStore.loadAllWords()
  }
}

onMounted(async () => {
  // 只有在沒有資料時才載入
  if (wordsStore.words.length === 0) {
    await wordsStore.loadWords()
  }
})
</script>

