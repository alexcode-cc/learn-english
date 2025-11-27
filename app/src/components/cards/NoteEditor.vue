<template>
  <v-textarea
    v-model="localContent"
    label="筆記"
    variant="outlined"
    rows="4"
    counter
    :maxlength="500"
    placeholder="輸入你的筆記..."
    @update:model-value="handleContentChange"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const localContent = ref(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  localContent.value = newValue || ''
})

function handleContentChange(value: string): void {
  localContent.value = value
  emit('update:modelValue', value)
}
</script>

