import { ref, computed, onMounted, onUnmounted } from 'vue'
import { reviewEngine } from '@/services/review-engine'
import { logger } from '@/utils/logger'

export interface ReviewReminder {
  count: number
  message: string
  show: boolean
}

/**
 * Composable for review reminder notifications
 * Checks for words due for review and shows notifications
 */
export function useReviewReminder() {
  const reminder = ref<ReviewReminder>({
    count: 0,
    message: '',
    show: false
  })

  let checkInterval: number | null = null

  /**
   * Check for words due for review
   */
  async function checkDueWords(): Promise<void> {
    try {
      const count = await reviewEngine.getDueReviewCount()
      reminder.value.count = count
      
      if (count > 0) {
        reminder.value.message = `您有 ${count} 個單字需要複習`
        reminder.value.show = true
      } else {
        reminder.value.show = false
      }

      logger.debug('Checked review reminder', { count })
    } catch (error) {
      logger.error('Failed to check review reminder', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * Dismiss the reminder
   */
  function dismissReminder(): void {
    reminder.value.show = false
  }

  /**
   * Start periodic checking (every 5 minutes)
   */
  function startPeriodicCheck(): void {
    if (checkInterval !== null) {
      return // Already started
    }

    // Check immediately
    checkDueWords()

    // Then check every 5 minutes
    checkInterval = window.setInterval(() => {
      checkDueWords()
    }, 5 * 60 * 1000) // 5 minutes

    logger.debug('Started periodic review reminder check')
  }

  /**
   * Stop periodic checking
   */
  function stopPeriodicCheck(): void {
    if (checkInterval !== null) {
      clearInterval(checkInterval)
      checkInterval = null
      logger.debug('Stopped periodic review reminder check')
    }
  }

  /**
   * Request browser notification permission and show notification
   */
  async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      logger.warn('Browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      logger.warn('Notification permission denied')
      return false
    }

    // Request permission
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  /**
   * Show browser notification for review reminder
   */
  async function showBrowserNotification(count: number): Promise<void> {
    const hasPermission = await requestNotificationPermission()
    if (!hasPermission) {
      return
    }

    new Notification('需要複習單字', {
      body: `您有 ${count} 個單字需要複習`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'review-reminder',
      requireInteraction: false
    })

    logger.info('Showed browser notification for review reminder', { count })
  }

  const hasDueWords = computed(() => reminder.value.count > 0)
  const reminderMessage = computed(() => reminder.value.message)

  // Auto-start on mount
  onMounted(() => {
    startPeriodicCheck()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    stopPeriodicCheck()
  })

  return {
    reminder: computed(() => reminder.value),
    hasDueWords,
    reminderMessage,
    checkDueWords,
    dismissReminder,
    startPeriodicCheck,
    stopPeriodicCheck,
    showBrowserNotification,
    requestNotificationPermission
  }
}

