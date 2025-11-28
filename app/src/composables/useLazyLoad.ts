import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

/**
 * 懶加載 composable
 * 使用 Intersection Observer API 實現圖片和組件的懶加載
 */
export function useLazyLoad<T extends HTMLElement = HTMLElement>(
  options?: IntersectionObserverInit
): {
  elementRef: Ref<T | null>
  isVisible: Ref<boolean>
  observe: () => void
  unobserve: () => void
} {
  const elementRef = ref<T | null>(null)
  const isVisible = ref(false)

  let observer: IntersectionObserver | null = null

  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px', // 提前 50px 開始載入
    threshold: 0.01
  }

  const observe = () => {
    if (!elementRef.value || isVisible.value) return

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible.value = true
          // 載入後停止觀察
          if (observer && elementRef.value) {
            observer.unobserve(elementRef.value)
          }
        }
      })
    }, { ...defaultOptions, ...options })

    observer.observe(elementRef.value)
  }

  const unobserve = () => {
    if (observer && elementRef.value) {
      observer.unobserve(elementRef.value)
      observer.disconnect()
      observer = null
    }
  }

  onMounted(() => {
    observe()
  })

  onUnmounted(() => {
    unobserve()
  })

  return {
    elementRef,
    isVisible,
    observe,
    unobserve
  }
}

/**
 * 圖片懶加載 composable
 */
export function useLazyImage(src: string) {
  const { elementRef, isVisible } = useLazyLoad<HTMLImageElement>()

  const imageSrc = ref<string | null>(null)

  watch(isVisible, (visible) => {
    if (visible && src) {
      // 預載入圖片
      const img = new Image()
      img.onload = () => {
        imageSrc.value = src
      }
      img.src = src
    }
  })

  return {
    elementRef,
    imageSrc
  }
}

