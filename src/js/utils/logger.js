/**
 * Logger Utility
 * Provides consistent logging throughout the application
 */

class Logger {
  constructor() {
    this.isDevelopment = this.checkDevelopmentMode()
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
    }
    this.currentLevel = this.isDevelopment
      ? this.logLevels.DEBUG
      : this.logLevels.WARN
  }

  /**
   * Check if we're in development mode
   */
  checkDevelopmentMode() {
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '' ||
      window.location.port !== ''
    )
  }

  /**
   * Format log message with timestamp and context
   */
  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level}] Portfolio:`

    if (args.length > 0) {
      return [prefix, message, ...args]
    }

    return [prefix, message]
  }

  /**
   * Log error message
   */
  error(message, ...args) {
    if (this.currentLevel >= this.logLevels.ERROR) {
      console.error(...this.formatMessage('ERROR', message, ...args))
    }
  }

  /**
   * Log warning message
   */
  warn(message, ...args) {
    if (this.currentLevel >= this.logLevels.WARN) {
      console.warn(...this.formatMessage('WARN', message, ...args))
    }
  }

  /**
   * Log info message
   */
  info(message, ...args) {
    if (this.currentLevel >= this.logLevels.INFO) {
      console.info(...this.formatMessage('INFO', message, ...args))
    }
  }

  /**
   * Log debug message
   */
  debug(message, ...args) {
    if (this.currentLevel >= this.logLevels.DEBUG) {
      console.log(...this.formatMessage('DEBUG', message, ...args))
    }
  }

  /**
   * Log performance timing
   */
  time(label) {
    if (this.isDevelopment) {
      console.time(`Portfolio: ${label}`)
    }
  }

  /**
   * End performance timing
   */
  timeEnd(label) {
    if (this.isDevelopment) {
      console.timeEnd(`Portfolio: ${label}`)
    }
  }

  /**
   * Group related log messages
   */
  group(label) {
    if (this.isDevelopment) {
      console.group(`Portfolio: ${label}`)
    }
  }

  /**
   * End log group
   */
  groupEnd() {
    if (this.isDevelopment) {
      console.groupEnd()
    }
  }

  /**
   * Set log level
   */
  setLevel(level) {
    if (typeof level === 'string') {
      level = this.logLevels[level.toUpperCase()]
    }

    if (level !== undefined) {
      this.currentLevel = level
    }
  }

  /**
   * Get current log level
   */
  getLevel() {
    return Object.keys(this.logLevels).find(
      key => this.logLevels[key] === this.currentLevel
    )
  }
}

// Create and export singleton instance
export const logger = new Logger()
