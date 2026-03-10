/**
 * Performance Standards Property-Based Tests
 * Feature: portfolio-enhancement, Property 5: Performance Standards Compliance
 * 
 * **Validates: Requirements 4.1, 4.2, 4.5**
 * 
 * Property 5: Performance Standards Compliance
 * For any page load, Core Web Vitals metrics (LCP, FID, CLS) should meet "Good" thresholds
 * and images should implement lazy loading
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { PerformanceMonitor } from '../js/modules/performance.js'
import { ImageOptimizer } from '../js/modules/imageOptimizer.js'

describe('Property 5: Performance Standards Compliance', () => {
  let performanceMonitor
  let imageOptimizer

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor({
      reportInterval: 0, // Disable periodic reporting for tests
    })

    imageOptimizer = new ImageOptimizer({
      rootMargin: '50px',
      threshold: 0.01,
    })
  })

  afterEach(() => {
    if (performanceMonitor) {
      performanceMonitor.destroy()
    }
    if (imageOptimizer) {
      imageOptimizer.destroy()
    }
  })

  /**
   * Property: Core Web Vitals metrics within "Good" thresholds are correctly identified
   * For any set of metrics within "Good" thresholds, the monitor should report them as "good"
   */
  it('should correctly identify metrics within "Good" thresholds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          lcp: fc.integer({ min: 100, max: 2500 }), // Good: <= 2500ms
          fid: fc.integer({ min: 1, max: 100 }), // Good: <= 100ms
          cls: fc.float({ min: 0, max: Math.fround(0.1), noNaN: true }), // Good: <= 0.1
          ttfb: fc.integer({ min: 50, max: 800 }), // Good: <= 800ms
          fcp: fc.integer({ min: 100, max: 1800 }), // Good: <= 1800ms
        }),
        async (metrics) => {
          // Set metrics
          performanceMonitor.metrics.lcp = metrics.lcp
          performanceMonitor.metrics.fid = metrics.fid
          performanceMonitor.metrics.cls = metrics.cls
          performanceMonitor.metrics.ttfb = metrics.ttfb
          performanceMonitor.metrics.fcp = metrics.fcp

          // Check status
          const status = performanceMonitor.getPerformanceStatus()

          // All metrics should be "good"
          expect(status.lcp).toBe('good')
          expect(status.fid).toBe('good')
          expect(status.cls).toBe('good')
          expect(status.ttfb).toBe('good')
          expect(status.fcp).toBe('good')
          expect(status.overall).toBe('good')

          // Web Vitals check should return true
          expect(performanceMonitor.areWebVitalsGood()).toBe(true)
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Core Web Vitals metrics exceeding "Good" thresholds are correctly identified
   * For any set of metrics exceeding thresholds, the monitor should report them as not "good"
   */
  it('should correctly identify metrics exceeding "Good" thresholds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          lcp: fc.integer({ min: 2501, max: 5000 }), // Exceeds good threshold
          fid: fc.integer({ min: 101, max: 300 }), // Exceeds good threshold
          cls: fc.float({ min: Math.fround(0.11), max: Math.fround(0.5), noNaN: true }), // Exceeds good threshold
          ttfb: fc.integer({ min: 801, max: 2000 }), // Exceeds good threshold
          fcp: fc.integer({ min: 1801, max: 4000 }), // Exceeds good threshold
        }),
        async (metrics) => {
          // Set at least one metric to exceed threshold
          performanceMonitor.metrics.lcp = metrics.lcp
          performanceMonitor.metrics.fid = 50 // Keep others good
          performanceMonitor.metrics.cls = 0.05
          performanceMonitor.metrics.ttfb = 500
          performanceMonitor.metrics.fcp = 1500

          // Check status
          const status = performanceMonitor.getPerformanceStatus()

          // LCP should not be "good"
          expect(status.lcp).not.toBe('good')
          expect(status.overall).toBe('needs-improvement')

          // Web Vitals check should return false
          expect(performanceMonitor.areWebVitalsGood()).toBe(false)
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Performance budgets are enforced correctly
   * For any metric value, budget checking should correctly identify violations
   */
  it('should enforce performance budgets correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          metric: fc.constantFrom('lcp', 'fid', 'cls', 'ttfb', 'fcp'),
          value: fc.integer({ min: 0, max: 10000 }),
        }),
        async ({ metric, value }) => {
          const budget = performanceMonitor.config.performanceBudgets[metric]
          let violationReported = false

          // Add callback to detect violations
          const callback = (report) => {
            if (report.type === 'budget-violation' && report.data.metric === metric) {
              violationReported = true
            }
          }
          performanceMonitor.onReport(callback)

          // Check budget
          performanceMonitor.checkBudget(metric, value)

          // Verify violation reporting matches expectation
          if (value > budget) {
            expect(violationReported).toBe(true)
          } else {
            expect(violationReported).toBe(false)
          }

          performanceMonitor.offReport(callback)
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Budget violation severity is calculated correctly
   * For any value exceeding budget, severity should match the ratio
   */
  it('should calculate budget violation severity correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          budget: fc.integer({ min: 100, max: 5000 }),
          multiplier: fc.float({ min: 1.0, max: 3.0, noNaN: true }),
        }),
        async ({ budget, multiplier }) => {
          const value = Math.floor(budget * multiplier)
          const severity = performanceMonitor.calculateSeverity(value, budget)

          // Verify severity matches ratio
          if (multiplier < 1.2) {
            expect(severity).toBe('low')
          } else if (multiplier < 1.5) {
            expect(severity).toBe('medium')
          } else {
            expect(severity).toBe('high')
          }
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Performance measurement includes all required metrics
   * For any state of the monitor, measurement should include all Core Web Vitals
   */
  it('should include all required metrics in performance measurement', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          lcp: fc.option(fc.integer({ min: 100, max: 5000 })),
          fid: fc.option(fc.integer({ min: 1, max: 300 })),
          cls: fc.option(fc.float({ min: 0, max: 0.5, noNaN: true })),
          ttfb: fc.option(fc.integer({ min: 50, max: 2000 })),
          fcp: fc.option(fc.integer({ min: 100, max: 4000 })),
        }),
        async (metrics) => {
          // Set metrics (some may be null)
          performanceMonitor.metrics.lcp = metrics.lcp
          performanceMonitor.metrics.fid = metrics.fid
          performanceMonitor.metrics.cls = metrics.cls
          performanceMonitor.metrics.ttfb = metrics.ttfb
          performanceMonitor.metrics.fcp = metrics.fcp

          const measurement = performanceMonitor.measurePerformance()

          // Verify all required properties exist
          expect(measurement).toHaveProperty('lcp')
          expect(measurement).toHaveProperty('fid')
          expect(measurement).toHaveProperty('cls')
          expect(measurement).toHaveProperty('ttfb')
          expect(measurement).toHaveProperty('fcp')
          expect(measurement).toHaveProperty('timestamp')
          expect(measurement).toHaveProperty('budgets')
          expect(measurement).toHaveProperty('status')

          // Verify budgets are included
          expect(measurement.budgets).toEqual(performanceMonitor.config.performanceBudgets)

          // Verify status object has all metrics
          expect(measurement.status).toHaveProperty('lcp')
          expect(measurement.status).toHaveProperty('fid')
          expect(measurement.status).toHaveProperty('cls')
          expect(measurement.status).toHaveProperty('ttfb')
          expect(measurement.status).toHaveProperty('fcp')
          expect(measurement.status).toHaveProperty('overall')
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Web Vitals are only "good" when ALL metrics meet thresholds
   * For any combination where at least one metric fails, overall status should not be "good"
   */
  it('should require ALL metrics to be good for overall "good" status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          goodMetrics: fc.integer({ min: 0, max: 4 }), // Number of good metrics (0-4, not all 5)
        }),
        async ({ goodMetrics }) => {
          // Set some metrics to good values
          const goodValues = {
            lcp: 2000,
            fid: 80,
            cls: 0.05,
            ttfb: 600,
            fcp: 1500,
          }

          const badValues = {
            lcp: 3000,
            fid: 150,
            cls: 0.2,
            ttfb: 1000,
            fcp: 2500,
          }

          const metrics = ['lcp', 'fid', 'cls', 'ttfb', 'fcp']
          
          // Set first N metrics to good, rest to bad
          metrics.forEach((metric, index) => {
            if (index < goodMetrics) {
              performanceMonitor.metrics[metric] = goodValues[metric]
            } else {
              performanceMonitor.metrics[metric] = badValues[metric]
            }
          })

          const status = performanceMonitor.getPerformanceStatus()

          // If not all 5 metrics are good, overall should not be "good"
          if (goodMetrics < 5) {
            expect(status.overall).toBe('needs-improvement')
            expect(performanceMonitor.areWebVitalsGood()).toBe(false)
          }
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Image optimizer initializes with lazy loading configuration
   * For any configuration, the optimizer should be properly initialized
   */
  it('should initialize image optimizer with lazy loading support', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          rootMargin: fc.constantFrom('0px', '50px', '100px', '200px'),
          threshold: fc.float({ min: 0, max: Math.fround(1.0), noNaN: true }),
        }),
        async ({ rootMargin, threshold }) => {
          const optimizer = new ImageOptimizer({ rootMargin, threshold })
          
          // Verify configuration
          expect(optimizer.config.rootMargin).toBe(rootMargin)
          expect(optimizer.config.threshold).toBe(threshold)
          expect(optimizer.isInitialized).toBe(false)

          optimizer.destroy()
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Performance monitoring can be paused and resumed
   * For any state, pausing should prevent budget checks and resuming should re-enable them
   */
  it('should correctly pause and resume monitoring', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          metric: fc.constantFrom('lcp', 'fid', 'cls', 'ttfb', 'fcp'),
          value: fc.integer({ min: 5000, max: 10000 }), // Intentionally high to exceed budgets
        }),
        async ({ metric, value }) => {
          let violationCount = 0

          const callback = (report) => {
            if (report.type === 'budget-violation') {
              violationCount++
            }
          }
          performanceMonitor.onReport(callback)

          // Check budget while active
          performanceMonitor.checkBudget(metric, value)
          const activeViolations = violationCount

          // Pause and check again
          performanceMonitor.pause()
          expect(performanceMonitor.isPaused).toBe(true)
          
          performanceMonitor.checkBudget(metric, value)
          const pausedViolations = violationCount

          // Resume and check again
          performanceMonitor.resume()
          expect(performanceMonitor.isPaused).toBe(false)
          
          performanceMonitor.checkBudget(metric, value)
          const resumedViolations = violationCount

          // Verify behavior
          expect(activeViolations).toBeGreaterThan(0) // Should report when active
          expect(pausedViolations).toBe(activeViolations) // Should not report when paused
          expect(resumedViolations).toBeGreaterThan(pausedViolations) // Should report when resumed

          performanceMonitor.offReport(callback)
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Performance reports trigger all registered callbacks
   * For any number of callbacks, all should be invoked on report
   */
  it('should trigger all registered callbacks on report', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (callbackCount) => {
          const callbacks = []
          const callCounts = []

          // Register multiple callbacks
          for (let i = 0; i < callbackCount; i++) {
            callCounts[i] = 0
            callbacks[i] = () => {
              callCounts[i]++
            }
            performanceMonitor.onReport(callbacks[i])
          }

          // Trigger report
          performanceMonitor.reportMetrics()

          // Verify all callbacks were called
          callCounts.forEach((count) => {
            expect(count).toBe(1)
          })

          // Clean up
          callbacks.forEach((callback) => {
            performanceMonitor.offReport(callback)
          })
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Metric status transitions correctly based on value
   * For any metric, status should transition from good -> needs-improvement -> poor
   * as value increases relative to budget
   */
  it('should transition metric status correctly as value increases', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('lcp', 'fid', 'cls', 'ttfb', 'fcp'),
        async (metric) => {
          const budget = performanceMonitor.config.performanceBudgets[metric]

          // Good range: <= budget
          const goodValue = budget * 0.9
          performanceMonitor.metrics[metric] = goodValue
          expect(performanceMonitor.getMetricStatus(metric)).toBe('good')

          // Needs improvement range: > budget and <= budget * 1.5
          const needsImprovementValue = budget * 1.3
          performanceMonitor.metrics[metric] = needsImprovementValue
          expect(performanceMonitor.getMetricStatus(metric)).toBe('needs-improvement')

          // Poor range: > budget * 1.5
          const poorValue = budget * 2.0
          performanceMonitor.metrics[metric] = poorValue
          expect(performanceMonitor.getMetricStatus(metric)).toBe('poor')

          // Unknown: null
          performanceMonitor.metrics[metric] = null
          expect(performanceMonitor.getMetricStatus(metric)).toBe('unknown')
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Image optimizer supports multiple image formats
   * For any format configuration, the optimizer should handle it correctly
   */
  it('should support multiple image format configurations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constantFrom('avif', 'webp', 'jpg'), { minLength: 1, maxLength: 3 }),
        async (formats) => {
          const optimizer = new ImageOptimizer({ formats })
          
          // Verify formats configuration
          expect(optimizer.config.formats).toEqual(formats)
          expect(Array.isArray(optimizer.config.formats)).toBe(true)
          expect(optimizer.config.formats.length).toBeGreaterThan(0)

          optimizer.destroy()
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Performance budgets are configurable
   * For any custom budget configuration, the monitor should use those values
   */
  it('should respect custom performance budgets', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          lcp: fc.integer({ min: 1000, max: 5000 }),
          fid: fc.integer({ min: 50, max: 300 }),
          cls: fc.float({ min: Math.fround(0.05), max: Math.fround(0.3), noNaN: true }),
          ttfb: fc.integer({ min: 200, max: 1500 }),
          fcp: fc.integer({ min: 500, max: 3000 }),
        }),
        async (customBudgets) => {
          const customMonitor = new PerformanceMonitor({
            reportInterval: 0,
            performanceBudgets: customBudgets,
          })

          // Verify custom budgets are set
          expect(customMonitor.config.performanceBudgets).toEqual(customBudgets)

          // Test with values at budget threshold
          customMonitor.metrics.lcp = customBudgets.lcp
          expect(customMonitor.getMetricStatus('lcp')).toBe('good')

          // Test with values exceeding budget
          customMonitor.metrics.lcp = customBudgets.lcp + 1
          expect(customMonitor.getMetricStatus('lcp')).not.toBe('good')

          customMonitor.destroy()
        }
      ),
      { numRuns: 20 }
    )
  })
})

