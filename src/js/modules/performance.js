/**
 * Performance Monitor Module
 * Tracks and reports Core Web Vitals metrics
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9
 * 
 * Core Web Vitals tracked:
 * - LCP (Largest Contentful Paint): Measures loading performance (target < 2500ms)
 * - FID (First Input Delay): Measures interactivity (target < 100ms)
 * - CLS (Cumulative Layout Shift): Measures visual stability (target < 0.1)
 * - TTFB (Time to First Byte): Measures server response time (target < 800ms)
 * - FCP (First Contentful Paint): Measures perceived load speed (target < 1800ms)
 */

import { logger } from '../utils/logger.js'

export class PerformanceMonitor {
  constructor(config = {}) {
    this.config = {
      trackCoreWebVitals: true,
      reportInterval: 30000,
      performanceBudgets: {
        lcp: 2500, // Largest Contentful Paint (ms) - "Good" threshold
        fid: 100, // First Input Delay (ms) - "Good" threshold
        cls: 0.1, // Cumulative Layout Shift - "Good" threshold
        ttfb: 800, // Time to First Byte (ms) - "Good" threshold
        fcp: 1800, // First Contentful Paint (ms) - "Good" threshold
      },
      enableCompression: true,
      enableAssetOptimization: true,
      ...config,
    }

    this.metrics = {
      lcp: null,
      fid: null,
      cls: null,
      ttfb: null,
      fcp: null,
      loadTime: null,
    }

    this.observers = []
    this.isInitialized = false
    this.isPaused = false
    this.reportCallbacks = []
  }

  /**
   * Initialize performance monitor
   */
  async init() {
    try {
      logger.info('Initializing Performance Monitor...')

      // Set up performance tracking
      this.setupPerformanceTracking()

      // Track Core Web Vitals
      if (this.config.trackCoreWebVitals) {
        this.trackCoreWebVitals()
      }

      // Set up periodic reporting
      if (this.config.reportInterval > 0) {
        this.setupPeriodicReporting()
      }

      this.isInitialized = true
      logger.info('Performance Monitor initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Performance Monitor:', error)
      throw error
    }
  }

  /**
   * Set up performance tracking
   */
  setupPerformanceTracking() {
    // Track page load time
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        const perfData = window.performance.timing
        this.metrics.loadTime =
          perfData.loadEventEnd - perfData.navigationStart
        logger.info(`Page load time: ${this.metrics.loadTime}ms`)
      })
    }
  }

  /**
   * Track Core Web Vitals metrics
   */
  trackCoreWebVitals() {
    // Track Largest Contentful Paint (LCP)
    this.trackLCP()

    // Track First Input Delay (FID)
    this.trackFID()

    // Track Cumulative Layout Shift (CLS)
    this.trackCLS()

    // Track Time to First Byte (TTFB)
    this.trackTTFB()

    // Track First Contentful Paint (FCP)
    this.trackFCP()
  }

  /**
   * Track Largest Contentful Paint (LCP)
   */
  trackLCP() {
    if (typeof PerformanceObserver === 'undefined') {
      return
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime
        this.checkBudget('lcp', this.metrics.lcp)
      })

      observer.observe({ type: 'largest-contentful-paint', buffered: true })
      this.observers.push(observer)
    } catch (error) {
      logger.warn('LCP tracking not supported:', error)
    }
  }

  /**
   * Track First Input Delay (FID)
   */
  trackFID() {
    if (typeof PerformanceObserver === 'undefined') {
      return
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          this.metrics.fid = entry.processingStart - entry.startTime
          this.checkBudget('fid', this.metrics.fid)
        })
      })

      observer.observe({ type: 'first-input', buffered: true })
      this.observers.push(observer)
    } catch (error) {
      logger.warn('FID tracking not supported:', error)
    }
  }

  /**
   * Track Cumulative Layout Shift (CLS)
   */
  trackCLS() {
    if (typeof PerformanceObserver === 'undefined') {
      return
    }

    try {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            this.metrics.cls = clsValue
            this.checkBudget('cls', this.metrics.cls)
          }
        })
      })

      observer.observe({ type: 'layout-shift', buffered: true })
      this.observers.push(observer)
    } catch (error) {
      logger.warn('CLS tracking not supported:', error)
    }
  }

  /**
   * Track Time to First Byte (TTFB)
   */
  trackTTFB() {
    if (typeof window === 'undefined' || !window.performance) {
      return
    }

    try {
      const perfData = window.performance.timing
      if (perfData.responseStart && perfData.requestStart) {
        this.metrics.ttfb = perfData.responseStart - perfData.requestStart
        this.checkBudget('ttfb', this.metrics.ttfb)
      }
    } catch (error) {
      logger.warn('TTFB tracking failed:', error)
    }
  }

  /**
   * Track First Contentful Paint (FCP)
   */
  trackFCP() {
    if (typeof PerformanceObserver === 'undefined') {
      return
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime
            this.checkBudget('fcp', this.metrics.fcp)
          }
        })
      })

      observer.observe({ type: 'paint', buffered: true })
      this.observers.push(observer)
    } catch (error) {
      logger.warn('FCP tracking not supported:', error)
    }
  }

  /**
   * Check if metric exceeds performance budget
   */
  checkBudget(metric, value) {
    if (this.isPaused) {
      return
    }

    const budget = this.config.performanceBudgets[metric]
    if (budget && value > budget) {
      logger.warn(
        `Performance budget exceeded for ${metric}: ${value} > ${budget}`
      )
      this.reportBudgetViolation(metric, value, budget)
    } else {
      logger.info(`${metric.toUpperCase()}: ${value} (within budget)`)
    }
  }

  /**
   * Report performance budget violation
   */
  reportBudgetViolation(metric, value, budget) {
    const violation = {
      metric,
      value,
      budget,
      timestamp: Date.now(),
      severity: this.calculateSeverity(value, budget),
    }

    // Trigger callbacks
    this.reportCallbacks.forEach((callback) => {
      try {
        callback({ type: 'budget-violation', data: violation })
      } catch (error) {
        logger.error('Error in report callback:', error)
      }
    })
  }

  /**
   * Calculate severity of budget violation
   */
  calculateSeverity(value, budget) {
    const ratio = value / budget
    if (ratio < 1.2) {
      return 'low'
    }
    if (ratio < 1.5) {
      return 'medium'
    }
    return 'high'
  }

  /**
   * Measure current performance metrics
   */
  measurePerformance() {
    return {
      ...this.metrics,
      timestamp: Date.now(),
      budgets: this.config.performanceBudgets,
      status: this.getPerformanceStatus(),
    }
  }

  /**
   * Get overall performance status
   */
  getPerformanceStatus() {
    const status = {
      lcp: this.getMetricStatus('lcp'),
      fid: this.getMetricStatus('fid'),
      cls: this.getMetricStatus('cls'),
      ttfb: this.getMetricStatus('ttfb'),
      fcp: this.getMetricStatus('fcp'),
    }

    // Overall status is "good" only if all metrics are good
    const allGood = Object.values(status).every((s) => s === 'good')
    status.overall = allGood ? 'good' : 'needs-improvement'

    return status
  }

  /**
   * Get status for individual metric
   */
  getMetricStatus(metric) {
    const value = this.metrics[metric]
    const budget = this.config.performanceBudgets[metric]

    if (value === null) {
      return 'unknown'
    }
    if (value <= budget) {
      return 'good'
    }
    if (value <= budget * 1.5) {
      return 'needs-improvement'
    }
    return 'poor'
  }

  /**
   * Calculate performance rating for a metric
   * Returns 'good', 'needs-improvement', or 'poor' based on Web Vitals thresholds
   * Requirements: 6.5, 6.6, 6.7, 6.8
   */
  calculatePerformanceRating(metric, value) {
    if (value === null || value === undefined) {
      return 'unknown'
    }

    const thresholds = {
      lcp: { good: 2500, poor: 4000 }, // LCP < 2500ms is good
      fid: { good: 100, poor: 300 }, // FID < 100ms is good
      cls: { good: 0.1, poor: 0.25 }, // CLS < 0.1 is good
      ttfb: { good: 800, poor: 1800 }, // TTFB < 800ms is good
      fcp: { good: 1800, poor: 3000 }, // FCP < 1800ms is good
    }

    const threshold = thresholds[metric]
    if (!threshold) {
      return 'unknown'
    }

    if (value <= threshold.good) {
      return 'good'
    }
    if (value <= threshold.poor) {
      return 'needs-improvement'
    }
    return 'poor'
  }

  /**
   * Get performance ratings for all Core Web Vitals
   * Requirements: 6.8
   */
  getPerformanceRatings() {
    return {
      lcp: this.calculatePerformanceRating('lcp', this.metrics.lcp),
      fid: this.calculatePerformanceRating('fid', this.metrics.fid),
      cls: this.calculatePerformanceRating('cls', this.metrics.cls),
      ttfb: this.calculatePerformanceRating('ttfb', this.metrics.ttfb),
      fcp: this.calculatePerformanceRating('fcp', this.metrics.fcp),
    }
  }

  /**
   * Optimize images (placeholder for integration with ImageOptimizer)
   */
  optimizeImages() {
    logger.info('Image optimization triggered')
    // This would integrate with the ImageOptimizer module
    // For now, just log the action
  }

  /**
   * Lazy load content (placeholder for integration with lazy loading system)
   */
  lazyLoadContent() {
    logger.info('Lazy loading triggered')
    // This would integrate with the lazy loading system
    // For now, just log the action
  }

  /**
   * Report metrics to console or external service
   * Requirements: 6.4, 6.8
   */
  reportMetrics() {
    const report = this.measurePerformance()
    
    // Add performance ratings to the report
    report.ratings = this.getPerformanceRatings()
    
    logger.info('Performance Report:', report)

    // Trigger callbacks
    this.reportCallbacks.forEach((callback) => {
      try {
        callback({ type: 'metrics-report', data: report })
      } catch (error) {
        logger.error('Error in report callback:', error)
      }
    })

    return report
  }

  /**
   * Set up periodic reporting
   */
  setupPeriodicReporting() {
    this.reportingInterval = setInterval(() => {
      if (!this.isPaused) {
        this.reportMetrics()
      }
    }, this.config.reportInterval)
  }

  /**
   * Add callback for performance reports
   */
  onReport(callback) {
    if (typeof callback === 'function') {
      this.reportCallbacks.push(callback)
    }
  }

  /**
   * Remove callback for performance reports
   */
  offReport(callback) {
    const index = this.reportCallbacks.indexOf(callback)
    if (index > -1) {
      this.reportCallbacks.splice(index, 1)
    }
  }

  /**
   * Get Core Web Vitals metrics
   */
  getWebVitals() {
    return {
      lcp: this.metrics.lcp,
      fid: this.metrics.fid,
      cls: this.metrics.cls,
      ttfb: this.metrics.ttfb,
      fcp: this.metrics.fcp,
    }
  }

  /**
   * Get Largest Contentful Paint (LCP)
   * Requirement: 6.1
   */
  getLCP() {
    return this.metrics.lcp
  }

  /**
   * Get First Input Delay (FID)
   * Requirement: 6.2
   */
  getFID() {
    return this.metrics.fid
  }

  /**
   * Get Cumulative Layout Shift (CLS)
   * Requirement: 6.3
   */
  getCLS() {
    return this.metrics.cls
  }

  /**
   * Check if all Core Web Vitals are in "Good" range
   */
  areWebVitalsGood() {
    const status = this.getPerformanceStatus()
    return (
      status.lcp === 'good' &&
      status.fid === 'good' &&
      status.cls === 'good' &&
      status.ttfb === 'good' &&
      status.fcp === 'good'
    )
  }

  /**
   * Pause performance monitoring
   */
  pause() {
    this.isPaused = true
    logger.info('Performance monitoring paused')
  }

  /**
   * Resume performance monitoring
   */
  resume() {
    this.isPaused = false
    logger.info('Performance monitoring resumed')
  }

  /**
   * Report error to performance monitor
   */
  reportError(error) {
    logger.error('Performance Monitor - Error reported:', error)
  }

  /**
   * Destroy performance monitor
   */
  destroy() {
    // Disconnect all observers
    this.observers.forEach((observer) => {
      try {
        observer.disconnect()
      } catch (error) {
        logger.warn('Error disconnecting observer:', error)
      }
    })
    this.observers = []

    // Clear reporting interval
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval)
      this.reportingInterval = null
    }

    // Clear callbacks
    this.reportCallbacks = []

    this.isInitialized = false
    logger.info('Performance Monitor destroyed')
  }
}
