export type ImportJobStatus = 'pending' | 'running' | 'failed' | 'completed'

export interface ImportJob {
  id: string
  filename: string
  totalWords: number
  processedWords: number
  status: ImportJobStatus
  errors: Array<{ row: number; message: string }>
  startedAt: string
  endedAt: string | null
}

export function createImportJob(filename: string, totalWords: number): ImportJob {
  return {
    id: crypto.randomUUID(),
    filename,
    totalWords,
    processedWords: 0,
    status: 'pending',
    errors: [],
    startedAt: new Date().toISOString(),
    endedAt: null
  }
}

