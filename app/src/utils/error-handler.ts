import { logger } from './logger'

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id ${id} not found` : `${resource} not found`,
      'NOT_FOUND',
      404
    )
    this.name = 'NotFoundError'
  }
}

export class NetworkError extends AppError {
  constructor(message: string, public originalError?: Error) {
    super(message, 'NETWORK_ERROR', 0)
    this.name = 'NetworkError'
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    logger.error('Application error', {
      code: error.code,
      message: error.message,
      context: error.context
    })
    return error
  }

  if (error instanceof Error) {
    logger.error('Unexpected error', {
      message: error.message,
      stack: error.stack
    })
    return new AppError(
      error.message || 'An unexpected error occurred',
      'UNEXPECTED_ERROR',
      500
    )
  }

  logger.error('Unknown error', { error })
  return new AppError('An unknown error occurred', 'UNKNOWN_ERROR', 500)
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

