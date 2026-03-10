/**
 * Unit tests for Performance Monitor
 * Tests Core Web Vitals tracking, performance budgets, and reporting
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PerformanceMonitor } from '../js/modules/performance.js'

describe('PerformanceMonitor', () => {
  let monitor

  beforeEach(() => {
    monitor = new PerformanceMonitor({
      reportInterval: 0, // Disable periodic reporting for tests
    })
  })

  afterEach(() => {
    if (monitor) {
      monitor.destroy()
    }
  })

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      expect(monitor.config.trackCoreWebVitals).toBe(true)
      expect(monitor.config.performanceBudgets).toBeDefined()
      expect(monitor.config.performanceBudgets.lcp).toBe(2500)
      expect(monitor.config.performanceBudgets.fid).toBe(100)
      expect(monitor.config.performanceBudgets.cls).toBe(0.1)
    })

    it('should initialize with custom config', () => {
      const customMonitor = new PerformanceMonitor({
        performanceBudgets: {
          lcp: 3000,
          fid: 150,
          cls: 0.15,
        },
      })

      expect(customMonitor.config.performanceBudgets.lcp).toBe(3000)
      expect(customMonitor.config.performanceBudgets.fid).toBe(150)
      expect(customMonitor.config.performanceBudgets.cls).toBe(0.15)

      customMonitor.destroy()
    })

    it('should initialize metrics to null', () => {
      expect(monitor.metrics.lcp).toBeNull()
      expect(monitor.metrics.fid).toBeNull()
      expect(monitor.metrics.cls).toBeNull()
      expect(monitor.metrics.ttfb).toBeNull()
      expect(monitor.metrics.fcp).toBeNull()
    })
  })

  describe('Performance Budgets', () => {
    it('should check budget and log warning when exceeded', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      monitor.checkBudget('lcp', 3000) // Exceeds default budget of 2500

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should not log warning when within budget', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      monitor.checkBudget('lcp', 2000) // Within default budget of 2500

      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should calculate severity correctly', () => {
      expect(monitor.calculateSeverity(2600, 2500)).toBe('low') // 1.04x
      expect(monitor.calculateSeverity(3000, 2500)).toBe('medium') // 1.2x
      expect(monitor.calculateSeverity(4000, 2500)).toBe('high') // 1.6x
    })

    it('should report budget violations', () => {
      const callback = vi.fn()
      monitor.onReport(callback)

      monitor.reportBudgetViolation('lcp', 3000, 2500)

      expect(callback).toHaveBeenCalledWith({
        type: 'budget-violation',
        data: expect.objectContaining({
          metric: 'lcp',
          value: 3000,
          budget: 2500,
          severity: 'medium',
        }),
      })
    })
  })

  describe('Metric Status', () => {
    it('should return "unknown" for null metrics', () => {
      expect(monitor.getMetricStatus('lcp')).toBe('unknown')
    })

    it('should return "good" when within budget', () => {
      monitor.metrics.lcp = 2000
      expect(monitor.getMetricStatus('lcp')).toBe('good')
    })

    it('should return "needs-improvement" when slightly over budget', () => {
      monitor.metrics.lcp = 3000 // 1.2x budget
      expect(monitor.getMetricStatus('lcp')).toBe('needs-improvement')
    })

    it('should return "poor" when significantly over budget', () => {
      monitor.metrics.lcp = 4000 // 1.6x budget
      expect(monitor.getMetricStatus('lcp')).toBe('poor')
    })
  })

  describe('Performance Status', () => {
    it('should return overall status as "good" when all metrics are good', () => {
      monitor.metrics.lcp = 2000
      monitor.metrics.fid = 80
      monitor.metrics.cls = 0.05
      monitor.metrics.ttfb = 600
      monitor.metrics.fcp = 1500

      const status = monitor.getPerformanceStatus()
      expect(status.overall).toBe('good')
      expect(status.lcp).toBe('good')
      expect(status.fid).toBe('good')
      expect(status.cls).toBe('good')
    })

    it('should return overall status as "needs-improvement" when any metric is not good', () => {
      monitor.metrics.lcp = 3000 // Over budget
      monitor.metrics.fid = 80
      monitor.metrics.cls = 0.05

      const status = monitor.getPerformanceStatus()
      expect(status.overall).toBe('needs-improvement')
    })
  })

  describe('Measure Performance', () => {
    it('should return performance metrics with timestamp', () => {
      monitor.metrics.lcp = 2000
      monitor.metrics.fid = 80

      const measurement = monitor.measurePerformance()

      expect(measurement).toHaveProperty('lcp', 2000)
      expect(measurement).toHaveProperty('fid', 80)
      expect(measurement).toHaveProperty('timestamp')
      expect(measurement).toHaveProperty('budgets')
      expect(measurement).toHaveProperty('status')
    })

    it('should include performance budgets in measurement', () => {
      const measurement = monitor.measurePerformance()

      expect(measurement.budgets).toEqual(monitor.config.performanceBudgets)
    })
  })

  describe('Web Vitals', () => {
    it('should return Core Web Vitals metrics', () => {
      monitor.metrics.lcp = 2000
      monitor.metrics.fid = 80
      monitor.metrics.cls = 0.05
      monitor.metrics.ttfb = 600
      monitor.metrics.fcp = 1500

      const vitals = monitor.getWebVitals()

      expect(vitals).toEqual({
        lcp: 2000,
        fid: 80,
        cls: 0.05,
        ttfb: 600,
        fcp: 1500,
      })
    })

    it('should check if all Web Vitals are good', () => {
      monitor.metrics.lcp = 2000
      monitor.metrics.fid = 80
      monitor.metrics.cls = 0.05
      monitor.metrics.ttfb = 600
      monitor.metrics.fcp = 1500

      expect(monitor.areWebVitalsGood()).toBe(true)
    })

    it('should return false if any Web Vital is not good', () => {
      monitor.metrics.lcp = 3000 // Over budget
      monitor.metrics.fid = 80
      monitor.metrics.cls = 0.05
      monitor.metrics.ttfb = 600
      monitor.metrics.fcp = 1500

      expect(monitor.areWebVitalsGood()).toBe(false)
    })
  })

  describe('Reporting', () => {
    it('should report metrics', () => {
      monitor.metrics.lcp = 2000

      const report = monitor.reportMetrics()

      expect(report).toHaveProperty('lcp', 2000)
      expect(report).toHaveProperty('timestamp')
    })

    it('should trigger callbacks on report', () => {
      const callback = vi.fn()
      monitor.onReport(callback)

      monitor.reportMetrics()

      expect(callback).toHaveBeenCalledWith({
        type: 'metrics-report',
        data: expect.any(Object),
      })
    })

    it('should allow adding multiple callbacks', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      monitor.onReport(callback1)
      monitor.onReport(callback2)

      monitor.reportMetrics()

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })

    it('should allow removing callbacks', () => {
      const callback = vi.fn()

      monitor.onReport(callback)
      monitor.offReport(callback)

      monitor.reportMetrics()

      expect(callback).not.toHaveBeenCalled()
    })

    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error')
      })
      const goodCallback = vi.fn()

      monitor.onReport(errorCallback)
      monitor.onReport(goodCallback)

      expect(() => monitor.reportMetrics()).not.toThrow()
      expect(goodCallback).toHaveBeenCalled()
    })
  })

  describe('Pause and Resume', () => {
    it('should pause monitoring', () => {
      monitor.pause()
      expect(monitor.isPaused).toBe(true)
    })

    it('should resume monitoring', () => {
      monitor.pause()
      monitor.resume()
      expect(monitor.isPaused).toBe(false)
    })

    it('should not check budgets when paused', () => {
      const callback = vi.fn()
      monitor.onReport(callback)
      monitor.pause()

      monitor.checkBudget('lcp', 3000) // Exceeds budget

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('Destroy', () => {
    it('should disconnect all observers', () => {
      const mockObserver = {
        disconnect: vi.fn(),
      }

      monitor.observers.push(mockObserver)
      monitor.destroy()

      expect(mockObserver.disconnect).toHaveBeenCalled()
      expect(monitor.observers).toHaveLength(0)
    })

    it('should clear callbacks', () => {
      const callback = vi.fn()
      monitor.onReport(callback)

      monitor.destroy()

      expect(monitor.reportCallbacks).toHaveLength(0)
    })

    it('should set isInitialized to false', () => {
      monitor.isInitialized = true
      monitor.destroy()

      expect(monitor.isInitialized).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing PerformanceObserver gracefully', () => {
      // This test verifies the code doesn't crash when PerformanceObserver is unavailable
      expect(() => monitor.trackLCP()).not.toThrow()
      expect(() => monitor.trackFID()).not.toThrow()
      expect(() => monitor.trackCLS()).not.toThrow()
      expect(() => monitor.trackFCP()).not.toThrow()
    })

    it('should handle null metrics in status calculation', () => {
      const status = monitor.getPerformanceStatus()

      expect(status.lcp).toBe('unknown')
      expect(status.fid).toBe('unknown')
      expect(status.cls).toBe('unknown')
    })

    it('should handle empty metrics in Web Vitals check', () => {
      expect(monitor.areWebVitalsGood()).toBe(false)
    })
  })
})

