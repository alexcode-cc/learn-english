import { inject } from 'vue'
import { logger } from '@/utils/logger'
import { handleError as handleAppError, AppError } from '@/utils/error-handler'

interface ErrorBoundary {
  reportError: (error: Error, context?: string) => void
}

/**
 * 使用錯誤處理的 composable
 * 如果在 ErrorBoundary 內使用，會自動報告錯誤到邊界組件
 */
export function useErrorHandler() {
  const errorBoundary = inject<ErrorBoundary | undefined>('errorBoundary', undefined)

  /**
   * 處理錯誤並報告
   */
  function handleError(error: unknown, context?: string): AppError {
    const appError = handleAppError(error)

    // 如果在 ErrorBoundary 內，報告錯誤
    if (errorBoundary && error instanceof Error) {
      errorBoundary.reportError(error, context)
    }

    logger.error('Error handled', {
      error: appError.message,
      code: appError.code,
      context
    })

    return appError
  }

  /**
   * 異步操作錯誤處理包裝器
   */
  async function withErrorHandling<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T | null> {
    try {
      return await fn()
    } catch (error) {
      handleError(error, context)
      return null
    }
  }

  return {
    handleError,
    withErrorHandling
  }
}

