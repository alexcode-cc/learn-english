<template>
  <v-form ref="formRef" v-model="valid">
    <v-text-field
      v-model="formData.lemma"
      label="單字 *"
      variant="outlined"
      :rules="[rules.required, rules.lemmaLength]"
      required
    />
    <v-text-field
      v-model="formData.partOfSpeech"
      label="詞性"
      variant="outlined"
    />
    <v-textarea
      v-model="formData.definitionZh"
      label="中文解釋 *"
      variant="outlined"
      rows="2"
      :rules="[rules.required]"
      required
    />
    <v-textarea
      v-model="formData.definitionEn"
      label="英文解釋 *"
      variant="outlined"
      rows="2"
      :rules="[rules.required]"
      required
    />
    <v-textarea
      v-model="examplesText"
      label="例句（每行一句）"
      variant="outlined"
      rows="3"
      hint="每行輸入一個例句"
      persistent-hint
    />
    <TagSelector
      v-model="formData.tags"
      :show-create-button="true"
    />
    <NoteEditor v-model="formData.notes" />
  </v-form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Word } from '@/types/word'
import TagSelector from './TagSelector.vue'
import NoteEditor from './NoteEditor.vue'

interface Props {
  modelValue?: Word | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: Partial<Word>]
}>()

const formRef = ref()
const valid = ref(false)

const formData = ref<Partial<Word>>({
  lemma: '',
  partOfSpeech: '',
  definitionZh: '',
  definitionEn: '',
  examples: [],
  tags: [],
  notes: ''
})

const examplesText = computed({
  get: () => formData.value.examples?.join('\n') || '',
  set: (value: string) => {
    formData.value.examples = value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
  }
})

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    formData.value = {
      lemma: newValue.lemma || '',
      partOfSpeech: newValue.partOfSpeech || '',
      definitionZh: newValue.definitionZh || '',
      definitionEn: newValue.definitionEn || '',
      examples: [...(newValue.examples || [])],
      tags: [...(newValue.tags || [])],
      notes: newValue.notes || ''
    }
  } else {
    resetForm()
  }
}, { immediate: true })

watch(formData, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })

const rules = {
  required: (value: string) => !!value || '此欄位為必填',
  lemmaLength: (value: string) => {
    if (!value) return true
    if (value.length < 2) return '單字長度至少 2 個字元'
    if (value.length > 64) return '單字長度不能超過 64 個字元'
    return true
  }
}

function resetForm(): void {
  formData.value = {
    lemma: '',
    partOfSpeech: '',
    definitionZh: '',
    definitionEn: '',
    examples: [],
    tags: [],
    notes: ''
  }
  formRef.value?.resetValidation()
}

function validate(): boolean {
  return formRef.value?.validate() ?? false
}

defineExpose({
  validate,
  resetForm
})
</script>

