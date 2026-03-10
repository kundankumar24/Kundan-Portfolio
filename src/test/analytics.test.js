/**
 * Unit tests for Analytics Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AnalyticsService } from '../js/modules/analytics.js'

describe('AnalyticsService', () => {
  let analytics
  let mockPerformanceMonitor

  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = ''
    document.body.innerHTML = ''

    // Mock window.gtag
    window.gtag = vi.fn()
    window.dataLayer = []

    // Mock requestIdleCallback
    global.requestIdleCallback = vi.fn((cb) => setTimeout(cb, 0))

    // Create mock performance monitor
    mockPerformanceMonitor = {
      onReport: vi.fn(),
      offReport: vi.fn(),
    }

    // Create analytics instance
    analytics = new AnalyticsService({
      measurementId: 'G-TEST123',
      enableDebug: true,
      trackingDelay: 0,
    })
  })

  afterEach(() => {
    if (analytics) {
      analytics.destroy()
    }
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      expect(analytics.config.measurementId).toBe('G-TEST123')
      expect(analytics.config.enableDebug).toBe(true)
      expect(analytics.isInitialized).toBe(false)
    })

    it('should initialize without measurement ID', async () => {
      const analyticsNoId = new AnalyticsService()
      await analyticsNoId.init()
      expect(analyticsNoId.isInitialized).toBe(true)
      expect(analyticsNoId.isGALoaded).toBe(false)
    })

    it('should set up tracking systems on init', async () => {
      // Mock loadGoogleAnalytics to avoid actual script loading
      analytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
      analytics.isGALoaded = true

      await analytics.init(mockPerformanceMonitor)

      expect(analytics.isInitialized).toBe(true)
      expect(analytics.performanceMonitor).toBe(mockPerformanceMonitor)
    })
  })

  describe('Event Tracking', () => {
    beforeEach(async () => {
      analytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
      analytics.isGALoaded = true
      await analytics.init()
    })

    it('should track custom event with required fields', async () => {
      const event = {
        eventName: 'test_event',
        category: 'test_category',
        action: 'test_action',
        label: 'test_label',
        value: 100,
      }

      analytics.trackEvent(event)

      // Wait for async tracking
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'test_action',
        expect.objectContaining({
          event_category: 'test_category',
          event_label: 'test_label',
          value: 100,
        })
      )
    })

    it('should not track event with missing required fields', () => {
      const invalidEvent = {
        eventName: 'test_event',
        // missing category and action
      }

      analytics.trackEvent(invalidEvent)

      expect(window.gtag).not.toHaveBeenCalled()
    })

    it('should queue events when not initialized', () => {
      const uninitializedAnalytics = new AnalyticsService({
        measurementId: 'G-TEST123',
      })

      const event = {
        eventName: 'test_event',
        category: 'test',
        action: 'test',
      }

      uninitializedAnalytics.trackEvent(event)

      expect(uninitializedAnalytics.eventQueue).toHaveLength(1)
      expect(uninitializedAnalytics.eventQueue[0]).toEqual(event)
    })

    it('should add custom parameters to events', async () => {
      const event = {
        eventName: 'custom_event',
        category: 'test',
        action: 'test_action',
        customParameters: {
          custom_param1: 'value1',
          custom_param2: 123,
        },
      }

      analytics.trackEvent(event)

      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'test_action',
        expect.objectContaining({
          custom_param1: 'value1',
          custom_param2: 123,
        })
      )
    })
  })

  describe('Page View Tracking', () => {
    beforeEach(async () => {
      analytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
      analytics.isGALoaded = true
      await analytics.init()
    })

    it('should track page view with current path', async () => {
      // Reset page views counter
      analytics.engagementMetrics.pageViews = 0
      
      analytics.trackPageView()

      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'page_view',
        expect.objectContaining({
          page_path: window.location.pathname,
        })
      )
      expect(analytics.engagementMetrics.pageViews).toBe(1)
    })

    it('should track page view with custom path', async () => {
      analytics.trackPageView('/custom-path', 'Custom Title')

      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'page_view',
        expect.objectContaining({
          page_path: '/custom-path',
          page_title: 'Custom Title',
        })
      )
    })
  })

  describe('Interaction Tracking', () => {
    beforeEach(async () => {
      analytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
      analytics.isGALoaded = true
      await analytics.init()
    })

    it('should track user interaction', async () => {
      analytics.trackInteraction('button', 'click', 'submit_button')

      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'click',
        expect.objectContaining({
          event_category: 'engagement',
          event_label: 'submit_button',
          element_type: 'button',
          interaction_type: 'click',
        })
      )
      expect(analytics.engagementMetrics.interactions).toBe(1)
    })

    it('should track project view', async () => {
      analytics.trackProjectView('proj-123', 'My Project')

      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'view_project',
        expect.objectContaining({
          event_category: 'content',
          event_label: 'My Project',
          project_id: 'proj-123',
          project_title: 'My Project',
        })
      )
    })

    it('should track project filter', async () => {
      analytics.trackProjectFilter('technology', 'JavaScript')

      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'filter_projects',
        expect.objectContaining({
          event_category: 'engagement',
          filter_type: 'technology',
          filter_value: 'JavaScript',
        })
      )
    })

    it('should track search query', async () => {
      analytics.trackSearch('portfolio', 5)

      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'search',
        expect.objectContaining({
          event_category: 'engagement',
          event_label: 'portfolio',
          value: 5,
          search_term: 'portfolio',
          results_count: 5,
        })
      )
    })

    it('should track contact form submission', async () => {
      analytics.trackContactSubmission(true)

      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'form_submit_success',
        expect.objectContaining({
          event_category: 'conversion',
          value: 1,
        })
      )
    })

    it('should track theme change', async () => {
      analytics.trackThemeChange('dark')

      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'change_theme',
        expect.objectContaining({
          event_category: 'engagement',
          theme: 'dark',
        })
      )
    })
  })

  describe('Performance Tracking', () => {
    beforeEach(async () => {
      analytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
      analytics.isGALoaded = true
      await analytics.init(mockPerformanceMonitor)
    })

    it('should track performance metrics', async () => {
      const metrics = {
        lcp: 2000,
        fid: 50,
        cls: 0.05,
        ttfb: 500,
        fcp: 1500,
      }

      analytics.trackPerformanceMetrics(metrics)

      await new Promise((resolve) => setTimeout(resolve, 100))
      // Should track LCP
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'lcp',
        expect.objectContaining({
          event_category: 'performance',
          metric_name: 'LCP',
          metric_value: 2000,
          metric_rating: 'good',
        })
      )

      // Should track FID
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'fid',
        expect.objectContaining({
          metric_name: 'FID',
          metric_value: 50,
          metric_rating: 'good',
        })
      )

      // Should track CLS
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'cls',
        expect.objectContaining({
          metric_name: 'CLS',
          metric_value: 0.05,
          metric_rating: 'good',
        })
      )
    })

    it('should get correct metric rating', () => {
      expect(analytics.getMetricRating('lcp', 2000)).toBe('good')
      expect(analytics.getMetricRating('lcp', 3000)).toBe('needs-improvement')
      expect(analytics.getMetricRating('lcp', 5000)).toBe('poor')

      expect(analytics.getMetricRating('fid', 50)).toBe('good')
      expect(analytics.getMetricRating('fid', 200)).toBe('needs-improvement')
      expect(analytics.getMetricRating('fid', 400)).toBe('poor')

      expect(analytics.getMetricRating('cls', 0.05)).toBe('good')
      expect(analytics.getMetricRating('cls', 0.15)).toBe('needs-improvement')
      expect(analytics.getMetricRating('cls', 0.3)).toBe('poor')
    })

    it('should integrate with performance monitor', async () => {
      expect(mockPerformanceMonitor.onReport).toHaveBeenCalled()
    })
  })

  describe('User Journey Tracking', () => {
    beforeEach(async () => {
      analytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
      analytics.isGALoaded = true
      await analytics.init()
    })

    it('should add events to user journey', () => {
      const event = {
        eventName: 'test_event',
        category: 'test',
        action: 'test',
      }

      analytics.addToUserJourney(event)

      const journey = analytics.getUserJourney()
      expect(journey).toHaveLength(1)
      expect(journey[0]).toMatchObject(event)
      expect(journey[0]).toHaveProperty('timestamp')
      expect(journey[0]).toHaveProperty('timeFromStart')
    })

    it('should limit user journey to 50 events', () => {
      for (let i = 0; i < 60; i++) {
        analytics.addToUserJourney({
          eventName: `event_${i}`,
          category: 'test',
          action: 'test',
        })
      }

      const journey = analytics.getUserJourney()
      expect(journey).toHaveLength(50)
      expect(journey[0].eventName).toBe('event_10') // First 10 should be removed
    })

    it('should track outbound links', async () => {
      // Clear previous gtag calls
      window.gtag.mockClear()
      
      document.body.innerHTML = '<a href="https://external.com">External</a>'
      const link = document.querySelector('a')

      link.click()

      await new Promise((resolve) => setTimeout(resolve, 50))
      
      // Check that the outbound link was tracked (it should be in the calls)
      const calls = window.gtag.mock.calls
      const outboundCall = calls.find(
        (call) => call[0] === 'event' && call[1] === 'click_outbound'
      )
      
      expect(outboundCall).toBeDefined()
      expect(outboundCall[2]).toMatchObject({
        event_category: 'navigation',
        link_url: expect.stringContaining('external.com'),
      })
    })
  })

  describe('Engagement Tracking', () => {
    beforeEach(async () => {
      analytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
      analytics.isGALoaded = true
      await analytics.init()
    })

    it('should get engagement metrics', () => {
      const metrics = analytics.getEngagementMetrics()

      expect(metrics).toHaveProperty('pageViews')
      expect(metrics).toHaveProperty('interactions')
      expect(metrics).toHaveProperty('timeOnPage')
      expect(metrics).toHaveProperty('scrollDepth')
      expect(metrics).toHaveProperty('sessionDuration')
    })

    it('should track visibility changes', async () => {
      // Simulate page becoming hidden
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      })

      document.dispatchEvent(new Event('visibilitychange'))

      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'visibility_change',
        expect.objectContaining({
          event_category: 'engagement',
          event_label: 'hidden',
        })
      )
    })
  })

  describe('Error Tracking', () => {
    beforeEach(async () => {
      analytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
      analytics.isGALoaded = true
      await analytics.init()
    })

    it('should track errors', async () => {
      const error = new Error('Test error')
      analytics.trackError(error, 'test context')

      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'javascript_error',
        expect.objectContaining({
          event_category: 'error',
          error_message: 'Test error',
          error_context: 'test context',
        })
      )
    })
  })

  describe('Queue Management', () => {
    it('should flush queued events', async () => {
      const uninitializedAnalytics = new AnalyticsService({
        measurementId: 'G-TEST123',
      })

      // Queue some events
      uninitializedAnalytics.trackEvent({
        eventName: 'event1',
        category: 'test',
        action: 'test',
      })
      uninitializedAnalytics.trackEvent({
        eventName: 'event2',
        category: 'test',
        action: 'test',
      })

      expect(uninitializedAnalytics.eventQueue).toHaveLength(2)

      // Initialize and flush
      uninitializedAnalytics.loadGoogleAnalytics = vi
        .fn()
        .mockResolvedValue()
      uninitializedAnalytics.isGALoaded = true
      await uninitializedAnalytics.init()

      uninitializedAnalytics.flushQueue()

      expect(uninitializedAnalytics.eventQueue).toHaveLength(0)
    })
  })

  describe('Status and Cleanup', () => {
    beforeEach(async () => {
      analytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
      analytics.isGALoaded = true
      await analytics.init()
    })

    it('should get analytics status', () => {
      const status = analytics.getStatus()

      expect(status).toHaveProperty('isInitialized', true)
      expect(status).toHaveProperty('isGALoaded', true)
      expect(status).toHaveProperty('queuedEvents')
      expect(status).toHaveProperty('engagementMetrics')
      expect(status).toHaveProperty('userJourneyLength')
    })

    it('should destroy analytics service', () => {
      analytics.destroy()

      expect(analytics.isInitialized).toBe(false)
      expect(analytics.eventQueue).toHaveLength(0)
      expect(analytics.userJourney).toHaveLength(0)
    })
  })
})

