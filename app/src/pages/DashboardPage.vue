<template>
  <AppLayout>
    <template #header>
      <v-toolbar color="primary" dark>
        <v-toolbar-title>單字管理</v-toolbar-title>
        <v-spacer />
        <v-btn
          icon
          @click="showAddDialog = true"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-toolbar>
    </template>

    <v-container fluid>
      <!-- Search and Filters -->
      <v-row class="mb-4">
        <v-col cols="12" md="6">
          <v-text-field
            v-model="searchQuery"
            label="搜尋單字"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            clearable
            @update:model-value="handleSearch"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="filterStatus"
            :items="statusOptions"
            label="狀態"
            variant="outlined"
            clearable
            @update:model-value="applyFilters"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="filterTags"
            :items="availableTags"
            item-title="label"
            item-value="id"
            label="標籤"
            variant="outlined"
            multiple
            chips
            clearable
            @update:model-value="applyFilters"
          />
        </v-col>
      </v-row>

      <!-- Word List -->
      <v-row v-if="loading">
        <v-col cols="12">
          <v-progress-linear indeterminate />
        </v-col>
      </v-row>

      <v-row v-else-if="filteredWords.length === 0">
        <v-col cols="12">
          <v-alert type="info" variant="tonal">
            沒有找到單字
          </v-alert>
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col
          v-for="word in filteredWords"
          :key="word.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            class="word-card"
            @click="openWordDetail(word)"
          >
            <v-card-title class="d-flex align-center">
              <span class="text-h6">{{ word.lemma }}</span>
              <v-spacer />
              <v-menu>
                <template #activator="{ props: menuProps }">
                  <v-btn
                    icon
                    variant="text"
                    size="small"
                    v-bind="menuProps"
                    @click.stop
                  >
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item @click="editWord(word)">
                    <v-list-item-title>編輯</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="confirmDelete(word)">
                    <v-list-item-title class="text-error">刪除</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-card-title>
            <v-card-subtitle v-if="word.partOfSpeech">
              {{ word.partOfSpeech }}
            </v-card-subtitle>
            <v-card-text>
              <p class="text-body-2">{{ word.definitionZh }}</p>
              <div class="d-flex flex-wrap gap-1 mt-2">
                <v-chip
                  :color="getStatusColor(word.status)"
                  size="small"
                  variant="flat"
                >
                  {{ getStatusText(word.status) }}
                </v-chip>
                <v-chip
                  v-for="tagId in word.tags.slice(0, 2)"
                  :key="tagId"
                  size="small"
                  variant="outlined"
                >
                  {{ getTagLabel(tagId) }}
                </v-chip>
                <v-chip
                  v-if="word.tags.length > 2"
                  size="small"
                  variant="outlined"
                >
                  +{{ word.tags.length - 2 }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Add/Edit Word Dialog -->
      <v-dialog
        v-model="showAddDialog"
        max-width="600"
        scrollable
      >
        <v-card>
          <v-card-title>
            {{ editingWord ? '編輯單字' : '新增單字' }}
          </v-card-title>
          <v-divider />
          <v-card-text>
            <WordForm
              ref="wordFormRef"
              :model-value="editingWord"
              @update:model-value="handleFormUpdate"
            />
          </v-card-text>
          <v-divider />
          <v-card-actions>
            <v-spacer />
            <v-btn
              variant="text"
              @click="cancelEdit"
            >
              取消
            </v-btn>
            <v-btn
              color="primary"
              variant="flat"
              @click="saveWord"
            >
              儲存
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Word Detail Dialog -->
      <WordDetailDialog
        v-model="showDetailDialog"
        :word="selectedWord"
        @edit="editWord"
        @delete="confirmDelete"
      />

      <!-- Delete Confirmation Dialog -->
      <v-dialog
        v-model="showDeleteDialog"
        max-width="400"
      >
        <v-card>
          <v-card-title>確認刪除</v-card-title>
          <v-card-text>
            確定要刪除單字「{{ wordToDelete?.lemma }}」嗎？此操作無法復原。
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              variant="text"
              @click="showDeleteDialog = false"
            >
              取消
            </v-btn>
            <v-btn
              color="error"
              variant="flat"
              :loading="deleting"
              @click="deleteWord"
            >
              刪除
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import WordForm from '@/components/cards/WordForm.vue'
import WordDetailDialog from '@/components/cards/WordDetailDialog.vue'
import { useWordsStore } from '@/stores/useWordsStore'
import { wordFilterService } from '@/services/word-filter-service'
import { wordDeletionService } from '@/services/word-deletion-service'
import { tagRepository } from '@/services/tag-repository'
import { createWord } from '@/types/word'
import type { Word, WordStatus } from '@/types/word'
import type { Tag } from '@/types/tag'
import { logger } from '@/utils/logger'

const wordsStore = useWordsStore()

const loading = ref(false)
const searchQuery = ref('')
const filterStatus = ref<WordStatus | null>(null)
const filterTags = ref<string[]>([])
const availableTags = ref<Tag[]>([])

const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const showDeleteDialog = ref(false)
const editingWord = ref<Word | null>(null)
const selectedWord = ref<Word | null>(null)
const wordToDelete = ref<Word | null>(null)
const deleting = ref(false)
const wordFormRef = ref<InstanceType<typeof WordForm> | null>(null)
const formData = ref<Partial<Word>>({})

const statusOptions = [
  { title: '未學習', value: 'unlearned' },
  { title: '學習中', value: 'learning' },
  { title: '已掌握', value: 'mastered' }
]

const filteredWords = computed(() => {
  const words = wordsStore.words
  return wordFilterService.filterWords(words, {
    status: filterStatus.value || undefined,
    tags: filterTags.value.length > 0 ? filterTags.value : undefined,
    searchQuery: searchQuery.value || undefined
  })
})

onMounted(async () => {
  await loadData()
})

async function loadData(): Promise<void> {
  loading.value = true
  try {
    await wordsStore.loadWords()
    await loadTags()
  } catch (error) {
    logger.error('Failed to load data', { error })
  } finally {
    loading.value = false
  }
}

async function loadTags(): Promise<void> {
  try {
    availableTags.value = await tagRepository.getAll()
  } catch (error) {
    logger.error('Failed to load tags', { error })
  }
}

function handleSearch(): void {
  applyFilters()
}

function applyFilters(): void {
  // Filters are applied via computed property
}

function getStatusColor(status: WordStatus): string {
  const colors = {
    unlearned: 'grey',
    learning: 'orange',
    mastered: 'green'
  }
  return colors[status] || 'grey'
}

function getStatusText(status: WordStatus): string {
  const texts = {
    unlearned: '未學習',
    learning: '學習中',
    mastered: '已掌握'
  }
  return texts[status] || status
}

function getTagLabel(tagId: string): string {
  const tag = availableTags.value.find(t => t.id === tagId)
  return tag?.label || tagId
}

function openWordDetail(word: Word): void {
  selectedWord.value = word
  showDetailDialog.value = true
}

function editWord(word: Word): void {
  editingWord.value = word
  showAddDialog.value = true
  showDetailDialog.value = false
}

function cancelEdit(): void {
  editingWord.value = null
  showAddDialog.value = false
  formData.value = {}
  wordFormRef.value?.resetForm()
}

function handleFormUpdate(data: Partial<Word>): void {
  formData.value = data
}

async function saveWord(): Promise<void> {
  if (!wordFormRef.value?.validate()) {
    return
  }

  try {
    const data = formData.value
    // 必要欄位：單字、詞性、中文解釋
    if (!data.lemma || !data.partOfSpeech || !data.definitionZh) {
      return
    }

    if (editingWord.value) {
      // Update existing word
      const updatedWord: Word = {
        ...editingWord.value,
        ...data,
        id: editingWord.value.id,
        phonetics: Array.isArray(data.phonetics) ? [...data.phonetics] : [],
        audioUrls: Array.isArray(data.audioUrls) ? [...data.audioUrls] : [],
        partOfSpeech: data.partOfSpeech,
        definitionZh: data.definitionZh,
        definitionEn: data.definitionEn || '',
        examples: Array.isArray(data.examples) ? [...data.examples] : [],
        tags: Array.isArray(data.tags) ? data.tags.map((tag: unknown) => typeof tag === 'string' ? tag : String(tag)) : [],
        notes: data.notes || ''
      } as Word
      await wordsStore.updateWord(updatedWord)
    } else {
      // Create new word
      const newWord = createWord(data.lemma, 'manual')
      Object.assign(newWord, {
        phonetics: Array.isArray(data.phonetics) ? [...data.phonetics] : [],
        audioUrls: Array.isArray(data.audioUrls) ? [...data.audioUrls] : [],
        partOfSpeech: data.partOfSpeech,
        definitionZh: data.definitionZh,
        definitionEn: data.definitionEn || '',
        examples: Array.isArray(data.examples) ? [...data.examples] : [],
        tags: Array.isArray(data.tags) ? data.tags.map((tag: unknown) => typeof tag === 'string' ? tag : String(tag)) : [],
        notes: data.notes || '',
        infoCompleteness: 'complete'
      })
      await wordsStore.addWord(newWord)
    }

    cancelEdit()
    await loadData()
  } catch (error) {
    logger.error('Failed to save word', { error })
  }
}

function confirmDelete(word: Word): void {
  wordToDelete.value = word
  showDeleteDialog.value = true
  showDetailDialog.value = false
}

async function deleteWord(): Promise<void> {
  if (!wordToDelete.value) return

  deleting.value = true
  try {
    await wordDeletionService.deleteWord(wordToDelete.value.id)
    await wordsStore.deleteWord(wordToDelete.value.id)
    showDeleteDialog.value = false
    wordToDelete.value = null
    await loadData()
  } catch (error) {
    logger.error('Failed to delete word', { error })
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.word-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.word-card:hover {
  transform: translateY(-4px);
}
</style>
