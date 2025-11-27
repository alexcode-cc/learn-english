<template>
  <div>
    <v-combobox
      v-model="selectedTags"
      :items="availableTags"
      item-title="label"
      item-value="id"
      label="選擇標籤"
      multiple
      chips
      closable-chips
      variant="outlined"
      :loading="loading"
      @update:model-value="handleTagsChange"
    >
      <template v-slot:chip="{ props, item }">
        <v-chip
          v-bind="props"
          :color="item.raw.color"
          variant="flat"
        >
          {{ item.raw.label }}
        </v-chip>
      </template>
      <template v-slot:no-data>
        <v-list-item>
          <v-list-item-title>
            沒有找到標籤
          </v-list-item-title>
        </v-list-item>
      </template>
    </v-combobox>
    <v-btn
      v-if="showCreateButton"
      variant="text"
      size="small"
      prepend-icon="mdi-plus"
      @click="showCreateDialog = true"
    >
      建立新標籤
    </v-btn>
    <v-dialog v-model="showCreateDialog" max-width="400">
      <v-card>
        <v-card-title>建立新標籤</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newTagLabel"
            label="標籤名稱"
            variant="outlined"
            autofocus
          />
          <v-color-picker
            v-model="newTagColor"
            mode="hex"
            show-swatches
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showCreateDialog = false">
            取消
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :disabled="!newTagLabel.trim()"
            @click="createNewTag"
          >
            建立
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { tagRepository } from '@/services/tag-repository'
import { createTag } from '@/types/tag'
import type { Tag } from '@/types/tag'

interface Props {
  modelValue?: string[]
  showCreateButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  showCreateButton: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const availableTags = ref<Tag[]>([])
const selectedTags = ref<Tag[]>([])
const loading = ref(false)
const showCreateDialog = ref(false)
const newTagLabel = ref('')
const newTagColor = ref('#1976D2')

onMounted(async () => {
  await loadTags()
  if (props.modelValue.length > 0) {
    const tags = availableTags.value.filter(tag => props.modelValue.includes(tag.id))
    selectedTags.value = tags
  }
})

async function loadTags(): Promise<void> {
  loading.value = true
  try {
    availableTags.value = await tagRepository.getAll()
  } catch (error) {
    console.error('Failed to load tags:', error)
  } finally {
    loading.value = false
  }
}

function handleTagsChange(tags: Tag[]): void {
  selectedTags.value = tags
  const tagIds = tags.map(tag => tag.id)
  emit('update:modelValue', tagIds)
}

async function createNewTag(): Promise<void> {
  if (!newTagLabel.value.trim()) return

  try {
    const tag = createTag(newTagLabel.value.trim(), newTagColor.value)
    await tagRepository.create(tag)
    availableTags.value.push(tag)
    selectedTags.value.push(tag)
    emit('update:modelValue', selectedTags.value.map(t => t.id))
    showCreateDialog.value = false
    newTagLabel.value = ''
    newTagColor.value = '#1976D2'
  } catch (error) {
    console.error('Failed to create tag:', error)
  }
}
</script>

