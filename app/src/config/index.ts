export interface AppConfig {
  dictionaryApi: {
    baseUrl: string
    timeout: number
    retryAttempts: number
    retryDelay: number
  }
  app: {
    name: string
    version: string
    maxWordsPerImport: number
    maxWordsInLibrary: number
  }
  review: {
    defaultIntervalDays: number
    maxReviewWordsPerSession: number
  }
}

const config: AppConfig = {
  dictionaryApi: {
    baseUrl: import.meta.env.VITE_DICTIONARY_BASE_URL || 'https://api.dictionaryapi.dev/api/v2/entries/en',
    timeout: 5000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  app: {
    name: 'Learn English',
    version: '1.0.0',
    maxWordsPerImport: 1000,
    maxWordsInLibrary: 10000
  },
  review: {
    defaultIntervalDays: 1,
    maxReviewWordsPerSession: 50
  }
}

export default config

