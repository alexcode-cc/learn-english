import { ref } from 'vue'

export function useCardFlip() {
  const isFlipped = ref(false)

  function flip(): void {
    isFlipped.value = !isFlipped.value
  }

  function flipToFront(): void {
    isFlipped.value = false
  }

  function flipToBack(): void {
    isFlipped.value = true
  }

  return {
    isFlipped,
    flip,
    flipToFront,
    flipToBack
  }
}

