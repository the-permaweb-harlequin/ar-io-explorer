// Browser-friendly logger with proper formatting and log levels

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LoggerOptions {
  name: string
  level?: LogLevel
  enabled?: boolean
  timestamp?: boolean
  colors?: boolean
}

export class Logger {
  private name: string
  private level: LogLevel
  private enabled: boolean
  private timestamp: boolean
  private colors: boolean

  // Browser-friendly colors
  private static readonly COLORS = {
    debug: '#6B7280', // gray-500
    info: '#3B82F6', // blue-500
    warn: '#F59E0B', // amber-500
    error: '#EF4444', // red-500
    name: '#8B5CF6', // violet-500
    timestamp: '#9CA3AF', // gray-400
  }

  constructor(options: LoggerOptions) {
    this.name = options.name
    this.level = options.level ?? LogLevel.INFO
    this.enabled = options.enabled ?? true
    this.timestamp = options.timestamp ?? true
    this.colors = options.colors ?? true
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args)
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args)
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args)
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args)
  }

  /**
   * Log a query with formatted SQL and timing
   */
  query(sql: string, duration?: number, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return

    const formattedSql = this.formatSQL(sql)
    const durationText = duration ? ` (${duration}ms)` : ''

    if (this.colors) {
      console.groupCollapsed(
        `%c[${this.name}]%c SQL Query${durationText}`,
        `color: ${Logger.COLORS.name}; font-weight: bold`,
        `color: ${Logger.COLORS.info}`,
      )
      console.log('%c' + formattedSql, 'color: #059669; font-family: monospace')
      if (args.length > 0) {
        console.log('Parameters:', ...args)
      }
      console.groupEnd()
    } else {
      console.log(
        `[${this.name}] SQL Query${durationText}:`,
        formattedSql,
        ...args,
      )
    }
  }

  /**
   * Log performance timing
   */
  time(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.time(`[${this.name}] ${label}`)
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.timeEnd(`[${this.name}] ${label}`)
    }
  }

  /**
   * Create a child logger with a sub-name
   */
  child(subName: string): Logger {
    return new Logger({
      name: `${this.name}:${subName}`,
      level: this.level,
      enabled: this.enabled,
      timestamp: this.timestamp,
      colors: this.colors,
    })
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.level = level
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.shouldLog(level)) return

    const levelName = LogLevel[level].toLowerCase()
    const timestamp = this.timestamp ? new Date().toISOString() : ''

    if (this.colors && typeof window !== 'undefined') {
      // Browser with colors
      const timestampStyle = `color: ${Logger.COLORS.timestamp}; font-size: 0.9em`
      const nameStyle = `color: ${Logger.COLORS.name}; font-weight: bold`
      const levelStyle = `color: ${Logger.COLORS[levelName as keyof typeof Logger.COLORS]}; font-weight: bold`

      const parts = []
      const styles = []

      if (this.timestamp) {
        parts.push('%c' + timestamp)
        styles.push(timestampStyle)
      }

      parts.push('%c[' + this.name + ']')
      styles.push(nameStyle)

      parts.push('%c' + levelName.toUpperCase() + ':')
      styles.push(levelStyle)

      parts.push('%c' + message)
      styles.push('color: inherit')

      const method = this.getConsoleMethod(level)
      method(parts.join(' '), ...styles, ...args)
    } else {
      // Fallback without colors
      const prefix = [
        this.timestamp ? timestamp : '',
        `[${this.name}]`,
        `${levelName.toUpperCase()}:`,
      ]
        .filter(Boolean)
        .join(' ')

      const method = this.getConsoleMethod(level)
      method(`${prefix} ${message}`, ...args)
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.enabled && level >= this.level
  }

  private getConsoleMethod(level: LogLevel): typeof console.log {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug || console.log
      case LogLevel.INFO:
        return console.info || console.log
      case LogLevel.WARN:
        return console.warn || console.log
      case LogLevel.ERROR:
        return console.error || console.log
      default:
        return console.log
    }
  }

  private formatSQL(sql: string): string {
    return sql
      .replace(/\s+/g, ' ')
      .replace(/SELECT/gi, '\nSELECT')
      .replace(/FROM/gi, '\nFROM')
      .replace(/WHERE/gi, '\nWHERE')
      .replace(/JOIN/gi, '\nJOIN')
      .replace(/ORDER BY/gi, '\nORDER BY')
      .replace(/LIMIT/gi, '\nLIMIT')
      .trim()
  }
}

// Default logger factory
export const createLogger = (
  name: string,
  options?: Partial<LoggerOptions>,
): Logger => {
  return new Logger({
    name,
    level:
      process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
    enabled: true,
    timestamp: true,
    colors: true,
    ...options,
  })
}
