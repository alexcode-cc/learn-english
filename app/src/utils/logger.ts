type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000

  private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context
    }
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Console output based on level (allowed in logger utility)
    // eslint-disable-next-line no-console
    const consoleMethod = entry.level === 'error' ? console.error :
                          entry.level === 'warn' ? console.warn :
                          entry.level === 'info' ? console.info :
                          console.debug

    if (entry.context) {
      // eslint-disable-next-line no-console
      consoleMethod(`[${entry.level.toUpperCase()}] ${entry.message}`, entry.context)
    } else {
      // eslint-disable-next-line no-console
      consoleMethod(`[${entry.level.toUpperCase()}] ${entry.message}`)
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.addLog(this.formatMessage('debug', message, context))
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.addLog(this.formatMessage('info', message, context))
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.addLog(this.formatMessage('warn', message, context))
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.addLog(this.formatMessage('error', message, context))
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level)
    }
    return [...this.logs]
  }

  clear(): void {
    this.logs = []
  }
}

export const logger = new Logger()

