<template>
  <v-form ref="formRef" v-model="valid">
    <!-- 必填欄位：單字 -->
    <v-text-field
      v-model="formData.lemma"
      label="單字 *"
      variant="outlined"
      :rules="[rules.required, rules.lemmaLength]"
      required
    />
    
    <!-- 可選欄位：音標（在單字下方、詞性上方） -->
    <v-text-field
      v-model="phoneticsText"
      label="音標"
      variant="outlined"
      hint="例如：/həˈloʊ/，多個音標請用逗號分隔"
      persistent-hint
      placeholder="/həˈloʊ/"
    />
    
    <!-- 可選欄位：發音音檔連結（在單字下方、詞性上方） -->
    <v-text-field
      v-model="audioUrlsText"
      label="發音音檔連結"
      variant="outlined"
      hint="輸入音檔的 URL，多個連結請用逗號分隔"
      persistent-hint
      placeholder="https://example.com/audio.mp3"
    />
    
    <!-- 必填欄位：詞性 -->
    <v-text-field
      v-model="formData.partOfSpeech"
      label="詞性 *"
      variant="outlined"
      :rules="[rules.required]"
      required
      hint="例如：noun, verb, adjective"
      persistent-hint
    />
    
    <!-- 必填欄位：中文解釋 -->
    <v-textarea
      v-model="formData.definitionZh"
      label="中文解釋 *"
      variant="outlined"
      rows="2"
      :rules="[rules.required]"
      required
    />
    
    <!-- 可選欄位：英文解釋 -->
    <v-textarea
      v-model="formData.definitionEn"
      label="英文解釋"
      variant="outlined"
      rows="2"
    />
    
    <!-- 可選欄位：例句 -->
    <v-textarea
      v-model="examplesText"
      label="例句（每行一句）"
      variant="outlined"
      rows="3"
      hint="每行輸入一個例句"
      persistent-hint
    />
    
    <!-- 可選欄位：標籤 -->
    <TagSelector
      v-model="formData.tags"
      :show-create-button="true"
    />
    
    <!-- 可選欄位：筆記 -->
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
  phonetics: [],
  audioUrls: [],
  partOfSpeech: '',
  definitionZh: '',
  definitionEn: '',
  examples: [],
  tags: [],
  notes: ''
})

const phoneticsText = computed({
  get: () => formData.value.phonetics?.join(', ') || '',
  set: (value: string) => {
    formData.value.phonetics = value
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0)
  }
})

const audioUrlsText = computed({
  get: () => formData.value.audioUrls?.join(', ') || '',
  set: (value: string) => {
    formData.value.audioUrls = value
      .split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0)
  }
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
      phonetics: [...(newValue.phonetics || [])],
      audioUrls: [...(newValue.audioUrls || [])],
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
    phonetics: [],
    audioUrls: [],
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

