<template>
  <v-dialog
    v-model="dialog"
    max-width="800"
    scrollable
  >
    <v-card v-if="word">
      <v-card-title class="d-flex align-center">
        <span class="text-h5">{{ word.lemma }}</span>
        <v-spacer />
        <v-btn
          icon
          variant="text"
          @click="dialog = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-chip
              v-if="word.partOfSpeech"
              class="mb-2"
              size="small"
            >
              {{ word.partOfSpeech }}
            </v-chip>
            <div class="text-h6 mb-2">中文解釋</div>
            <p class="text-body-1 mb-4">{{ word.definitionZh }}</p>
            <div class="text-h6 mb-2">英文解釋</div>
            <p class="text-body-1 mb-4">{{ word.definitionEn }}</p>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-h6 mb-2">狀態</div>
            <v-chip
              :color="getStatusColor(word.status)"
              class="mb-4"
            >
              {{ getStatusText(word.status) }}
            </v-chip>
            <div v-if="word.tags.length > 0" class="mb-4">
              <div class="text-h6 mb-2">標籤</div>
              <div class="d-flex flex-wrap gap-2">
                <v-chip
                  v-for="tagId in word.tags"
                  :key="tagId"
                  size="small"
                  variant="flat"
                >
                  {{ getTagLabel(tagId) }}
                </v-chip>
              </div>
            </div>
            <div v-if="word.notes" class="mb-4">
              <div class="text-h6 mb-2">筆記</div>
              <p class="text-body-2">{{ word.notes }}</p>
            </div>
          </v-col>
        </v-row>
        <v-row v-if="word.examples.length > 0">
          <v-col cols="12">
            <div class="text-h6 mb-2">例句</div>
            <v-list>
              <v-list-item
                v-for="(example, index) in word.examples"
                :key="index"
              >
                {{ example }}
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="handleEdit"
        >
          編輯
        </v-btn>
        <v-btn
          color="error"
          variant="text"
          @click="handleDelete"
        >
          刪除
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="dialog = false"
        >
          關閉
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Word } from '@/types/word'
import { tagRepository } from '@/services/tag-repository'
import type { Tag } from '@/types/tag'

interface Props {
  modelValue: boolean
  word?: Word | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'edit': [word: Word]
  'delete': [word: Word]
}>()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const tags = ref<Tag[]>([])

watch(() => props.modelValue, async (newValue) => {
  if (newValue && props.word) {
    await loadTags()
  }
})

async function loadTags(): Promise<void> {
  try {
    tags.value = await tagRepository.getAll()
  } catch (error) {
    console.error('Failed to load tags:', error)
  }
}

function getStatusColor(status: Word['status']): string {
  const colors = {
    unlearned: 'grey',
    learning: 'orange',
    mastered: 'green'
  }
  return colors[status] || 'grey'
}

function getStatusText(status: Word['status']): string {
  const texts = {
    unlearned: '未學習',
    learning: '學習中',
    mastered: '已掌握'
  }
  return texts[status] || status
}

function getTagLabel(tagId: string): string {
  const tag = tags.value.find(t => t.id === tagId)
  return tag?.label || tagId
}

function handleEdit(): void {
  if (props.word) {
    emit('edit', props.word)
  }
}

function handleDelete(): void {
  if (props.word) {
    emit('delete', props.word)
  }
}
</script>

