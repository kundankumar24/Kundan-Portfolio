/**
 * Analytics Tracking Property-Based Tests
 * Feature: portfolio-enhancement, Property 11: Analytics Tracking Accuracy
 * 
 * **Validates: Requirements 9.1, 9.2, 4.6**
 * 
 * Property 11: Analytics Tracking Accuracy
 * For any user interaction or performance event, analytics should be tracked correctly
 * without negatively impacting site performance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fc from 'fast-check'
import { AnalyticsService } from '../js/modules/analytics.js'

describe('Property 11: Analytics Tracking Accuracy', () => {
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
      enableDebug: false,
      trackingDelay: 0,
    })
  })

  afterEach(() => {
    if (analytics) {
      analytics.destroy()
    }
    vi.clearAllMocks()
  })

  /**
   * Property: All valid events are tracked with correct structure
   * For any valid event with required fields, it should be tracked with proper data structure
   */
  it('should track all valid events with correct structure', async () => {
    // Initialize analytics once before the property test
    analytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
    analytics.isGALoaded = true
    analytics.config.enableUserJourneyTracking = false
    analytics.config.enableEngagementTracking = false
    await analytics.init()

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          eventName: fc.string({ minLength: 1, maxLength: 50 }),
          category: fc.constantFrom('engagement', 'navigation', 'content', 'conversion', 'performance', 'error'),
          action: fc.string({ minLength: 1, maxLength: 50 }),
          label: fc.option(fc.string({ minLength: 0, maxLength: 100 })),
          value: fc.option(fc.integer({ min: 0, max: 10000 })),
        }),
        async (event) => {
          // Clear previous calls
          window.gtag.mockClear()

          // Track event
          analytics.trackEvent(event)

          // Wait for async tracking
          await new Promise((resolve) => setTimeout(resolve, 50))

          // Verify event was tracked
          expect(window.gtag).toHaveBeenCalledWith(
            'event',
            event.action,
            expect.objectContaining({
              event_category: event.category,
              event_label: event.label || '',
              value: event.value || 0,
            })
          )
        }
      ),
      { numRuns: 20 }
    )
  }, 10000)

  /**
   * Property: Invalid events are rejected and not tracked
   * For any event missing required fields, it should not be tracked
   */
  it('should reject invalid events missing required fields', async () => {
    // Create fresh analytics instance without auto page view
    const testAnalytics = new AnalyticsService({
      measurementId: 'G-TEST123',
      enableDebug: false,
      trackingDelay: 0,
      enableUserJourneyTracking: false,
      enableEngagementTracking: false,
    })
    testAnalytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
    testAnalytics.isGALoaded = true
    
    // Mock trackPageView to prevent initial page view
    const originalTrackPageView = testAnalytics.trackPageView
    testAnalytics.trackPageView = vi.fn()
    
    await testAnalytics.init()
    
    // Restore trackPageView
    testAnalytics.trackPageView = originalTrackPageView
    
    // Clear any calls from init
    window.gtag.mockClear()

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          eventName: fc.option(fc.string({ minLength: 1 })),
          category: fc.option(fc.string({ minLength: 1 })),
          action: fc.option(fc.string({ minLength: 1 })),
        }).filter(event => !event.eventName || !event.category || !event.action),
        async (invalidEvent) => {
          // Clear previous calls
          window.gtag.mockClear()

          // Try to track invalid event
          testAnalytics.trackEvent(invalidEvent)

          // Wait for async tracking
          await new Promise((resolve) => setTimeout(resolve, 50))

          // Verify event was NOT tracked
          expect(window.gtag).not.toHaveBeenCalled()
        }
      ),
      { numRuns: 30 }
    )
    
    testAnalytics.destroy()
  }, 10000)

  /**
   * Property: Performance metrics are tracked with correct ratings
   * For any performance metric value, the rating should match the defined thresholds
   */
  it('should track performance metrics with correct ratings', async () => {
    // Initialize analytics once
    analytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
    analytics.isGALoaded = true
    analytics.config.enableUserJourneyTracking = false
    analytics.config.enableEngagementTracking = false
    await analytics.init()

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          lcp: fc.option(fc.integer({ min: 100, max: 10000 })),
          fid: fc.option(fc.integer({ min: 1, max: 1000 })),
          cls: fc.option(fc.float({ min: 0, max: Math.fround(1.0), noNaN: true })),
        }).filter(metrics => metrics.lcp !== null || metrics.fid !== null || metrics.cls !== null),
        async (metrics) => {
          // Clear previous calls
          window.gtag.mockClear()

          // Track performance metrics
          analytics.trackPerformanceMetrics(metrics)

          // Wait for async tracking
          await new Promise((resolve) => setTimeout(resolve, 100))

          // Verify each metric was tracked with correct rating
          if (metrics.lcp !== null) {
            const expectedRating = analytics.getMetricRating('lcp', metrics.lcp)
            expect(window.gtag).toHaveBeenCalledWith(
              'event',
              'lcp',
              expect.objectContaining({
                metric_name: 'LCP',
                metric_value: metrics.lcp,
                metric_rating: expectedRating,
              })
            )
          }

          if (metrics.fid !== null) {
            const expectedRating = analytics.getMetricRating('fid', metrics.fid)
            expect(window.gtag).toHaveBeenCalledWith(
              'event',
              'fid',
              expect.objectContaining({
                metric_name: 'FID',
                metric_value: metrics.fid,
                metric_rating: expectedRating,
              })
            )
          }

          if (metrics.cls !== null) {
            const expectedRating = analytics.getMetricRating('cls', metrics.cls)
            expect(window.gtag).toHaveBeenCalledWith(
              'event',
              'cls',
              expect.objectContaining({
                metric_name: 'CLS',
                metric_value: metrics.cls,
                metric_rating: expectedRating,
              })
            )
          }
        }
      ),
      { numRuns: 25 }
    )
  }, 10000)

  /**
   * Property: Metric ratings are consistent with thresholds
   * For any metric and value, the rating should correctly reflect the threshold ranges
   */
  it('should assign correct metric ratings based on thresholds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          metric: fc.constantFrom('lcp', 'fid', 'cls', 'ttfb', 'fcp'),
          multiplier: fc.float({ min: Math.fround(0.1), max: Math.fround(3.0), noNaN: true }),
        }),
        async ({ metric, multiplier }) => {
          const thresholds = {
            lcp: { good: 2500, poor: 4000 },
            fid: { good: 100, poor: 300 },
            cls: { good: 0.1, poor: 0.25 },
            ttfb: { good: 800, poor: 1800 },
            fcp: { good: 1800, poor: 3000 },
          }

          const threshold = thresholds[metric]
          const value = threshold.good * multiplier

          const rating = analytics.getMetricRating(metric, value)

          // Verify rating matches threshold ranges
          if (value <= threshold.good) {
            expect(rating).toBe('good')
          } else if (value <= threshold.poor) {
            expect(rating).toBe('needs-improvement')
          } else {
            expect(rating).toBe('poor')
          }
        }
      ),
      { numRuns: 30 }
    )
  })

  /**
   * Property: User journey tracking maintains chronological order
   * For any sequence of events, the user journey should preserve event order
   */
  it('should maintain chronological order in user journey', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            eventName: fc.string({ minLength: 1, maxLength: 30 }),
            category: fc.constantFrom('engagement', 'navigation', 'content'),
            action: fc.string({ minLength: 1, maxLength: 30 }),
          }),
          { minLength: 2, maxLength: 20 }
        ),
        async (events) => {
          // Create fresh analytics instance for each test
          const testAnalytics = new AnalyticsService({
            measurementId: 'G-TEST123',
            enableDebug: false,
            trackingDelay: 0,
            enableUserJourneyTracking: false,
            enableEngagementTracking: false,
          })
          testAnalytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
          testAnalytics.isGALoaded = true
          await testAnalytics.init()

          // Track events sequentially
          for (const event of events) {
            testAnalytics.addToUserJourney(event)
            // Small delay to ensure timestamp differences
            await new Promise((resolve) => setTimeout(resolve, 1))
          }

          const journey = testAnalytics.getUserJourney()

          // Verify journey length
          expect(journey.length).toBe(Math.min(events.length, 50)) // Max 50 events

          // Verify chronological order
          for (let i = 1; i < journey.length; i++) {
            expect(journey[i].timestamp).toBeGreaterThanOrEqual(journey[i - 1].timestamp)
            expect(journey[i].timeFromStart).toBeGreaterThanOrEqual(journey[i - 1].timeFromStart)
          }

          // Verify event names match (in order)
          const journeyNames = journey.map(e => e.eventName)
          const expectedNames = events.slice(-50).map(e => e.eventName) // Last 50 events
          expect(journeyNames).toEqual(expectedNames)

          testAnalytics.destroy()
        }
      ),
      { numRuns: 25 }
    )
  })

  /**
   * Property: User journey limits to 50 events
   * For any number of events exceeding 50, only the most recent 50 should be kept
   */
  it('should limit user journey to 50 most recent events', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 51, max: 100 }),
        async (eventCount) => {
          // Initialize analytics
          analytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
          analytics.isGALoaded = true
          await analytics.init()

          // Add more than 50 events
          for (let i = 0; i < eventCount; i++) {
            analytics.addToUserJourney({
              eventName: `event_${i}`,
              category: 'test',
              action: 'test',
            })
          }

          const journey = analytics.getUserJourney()

          // Verify journey is limited to 50 events
          expect(journey.length).toBe(50)

          // Verify it contains the most recent events
          expect(journey[0].eventName).toBe(`event_${eventCount - 50}`)
          expect(journey[49].eventName).toBe(`event_${eventCount - 1}`)
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Engagement metrics are updated correctly
   * For any sequence of interactions, engagement metrics should accurately reflect activity
   */
  it('should update engagement metrics correctly for interactions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pageViews: fc.integer({ min: 0, max: 20 }),
          interactions: fc.integer({ min: 0, max: 50 }),
        }),
        async ({ pageViews, interactions }) => {
          // Create fresh analytics instance for each test
          const testAnalytics = new AnalyticsService({
            measurementId: 'G-TEST123',
            enableDebug: false,
            trackingDelay: 0,
            enableUserJourneyTracking: false,
            enableEngagementTracking: false,
          })
          testAnalytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
          testAnalytics.isGALoaded = true
          await testAnalytics.init()

          // Reset metrics after init (which tracks initial page view)
          testAnalytics.engagementMetrics.pageViews = 0
          testAnalytics.engagementMetrics.interactions = 0

          // Track page views
          for (let i = 0; i < pageViews; i++) {
            testAnalytics.trackPageView(`/page-${i}`)
          }

          // Track interactions
          for (let i = 0; i < interactions; i++) {
            testAnalytics.trackInteraction('button', 'click', `button-${i}`)
          }

          // Wait for async tracking
          await new Promise((resolve) => setTimeout(resolve, 100))

          const metrics = testAnalytics.getEngagementMetrics()

          // Verify metrics match expected counts
          expect(metrics.pageViews).toBe(pageViews)
          expect(metrics.interactions).toBe(interactions)
          expect(metrics).toHaveProperty('timeOnPage')
          expect(metrics).toHaveProperty('scrollDepth')
          expect(metrics).toHaveProperty('sessionDuration')

          testAnalytics.destroy()
        }
      ),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Analytics tracking uses requestIdleCallback for performance
   * For any event, tracking should be deferred to avoid blocking main thread
   */
  it('should use requestIdleCallback to avoid performance impact', async () => {
    // Initialize analytics once
    analytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
    analytics.isGALoaded = true
    analytics.config.enableUserJourneyTracking = false
    analytics.config.enableEngagementTracking = false
    await analytics.init()

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          eventName: fc.string({ minLength: 1, maxLength: 30 }),
          category: fc.constantFrom('engagement', 'navigation', 'content'),
          action: fc.string({ minLength: 1, maxLength: 30 }),
        }),
        async (event) => {
          // Clear mock
          global.requestIdleCallback.mockClear()

          // Track event
          analytics.trackEvent(event)

          // Verify requestIdleCallback was used
          expect(global.requestIdleCallback).toHaveBeenCalled()

          // Wait for async tracking
          await new Promise((resolve) => setTimeout(resolve, 50))
        }
      ),
      { numRuns: 20 }
    )
  }, 10000)

  /**
   * Property: Event queue preserves events when not initialized
   * For any events tracked before initialization, they should be queued
   */
  it('should queue events when not initialized', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            eventName: fc.string({ minLength: 1, maxLength: 30 }),
            category: fc.constantFrom('engagement', 'navigation', 'content'),
            action: fc.string({ minLength: 1, maxLength: 30 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (events) => {
          // Create uninitialized analytics
          const uninitializedAnalytics = new AnalyticsService({
            measurementId: 'G-TEST123',
          })

          // Track events before initialization
          events.forEach((event) => {
            uninitializedAnalytics.trackEvent(event)
          })

          // Verify events are queued
          expect(uninitializedAnalytics.eventQueue.length).toBe(events.length)

          // Verify queued events match tracked events
          events.forEach((event, index) => {
            expect(uninitializedAnalytics.eventQueue[index]).toEqual(event)
          })

          uninitializedAnalytics.destroy()
        }
      ),
      { numRuns: 30 }
    )
  })

  /**
   * Property: Custom parameters are preserved in tracked events
   * For any event with custom parameters, they should be included in the tracking call
   */
  it('should preserve custom parameters in tracked events', async () => {
    // Initialize analytics once
    analytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
    analytics.isGALoaded = true
    analytics.config.enableUserJourneyTracking = false
    analytics.config.enableEngagementTracking = false
    await analytics.init()

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          eventName: fc.string({ minLength: 1, maxLength: 30 }),
          category: fc.constantFrom('engagement', 'navigation', 'content'),
          action: fc.string({ minLength: 1, maxLength: 30 }),
          customParameters: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.oneof(
              fc.string({ minLength: 0, maxLength: 50 }),
              fc.integer({ min: 0, max: 1000 }),
              fc.boolean()
            ),
            { minKeys: 1, maxKeys: 5 }
          ),
        }),
        async (event) => {
          // Clear previous calls
          window.gtag.mockClear()

          // Track event with custom parameters
          analytics.trackEvent(event)

          // Wait for async tracking
          await new Promise((resolve) => setTimeout(resolve, 50))

          // Verify custom parameters are included
          expect(window.gtag).toHaveBeenCalledWith(
            'event',
            event.action,
            expect.objectContaining(event.customParameters)
          )
        }
      ),
      { numRuns: 20 }
    )
  }, 10000)

  /**
   * Property: Analytics status reflects current state accurately
   * For any state of the analytics service, getStatus should return accurate information
   */
  it('should return accurate status information', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          isInitialized: fc.boolean(),
          queuedEventCount: fc.integer({ min: 0, max: 20 }),
        }),
        async ({ isInitialized, queuedEventCount }) => {
          // Create analytics instance
          const testAnalytics = new AnalyticsService({
            measurementId: 'G-TEST123',
          })

          if (isInitialized) {
            testAnalytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
            testAnalytics.isGALoaded = true
            await testAnalytics.init()
          }

          // Add queued events
          for (let i = 0; i < queuedEventCount; i++) {
            testAnalytics.eventQueue.push({
              eventName: `event_${i}`,
              category: 'test',
              action: 'test',
            })
          }

          const status = testAnalytics.getStatus()

          // Verify status accuracy
          expect(status.isInitialized).toBe(isInitialized)
          expect(status.queuedEvents).toBe(queuedEventCount)
          expect(status).toHaveProperty('isGALoaded')
          expect(status).toHaveProperty('engagementMetrics')
          expect(status).toHaveProperty('userJourneyLength')

          testAnalytics.destroy()
        }
      ),
      { numRuns: 30 }
    )
  })

  /**
   * Property: Error tracking captures error details
   * For any error, tracking should include message, stack, and context
   */
  it('should track errors with complete details', async () => {
    // Initialize analytics once
    analytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
    analytics.isGALoaded = true
    analytics.config.enableUserJourneyTracking = false
    analytics.config.enableEngagementTracking = false
    await analytics.init()

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          errorMessage: fc.string({ minLength: 1, maxLength: 100 }),
          context: fc.string({ minLength: 0, maxLength: 50 }),
        }),
        async ({ errorMessage, context }) => {
          // Clear previous calls
          window.gtag.mockClear()

          // Create and track error
          const error = new Error(errorMessage)
          analytics.trackError(error, context)

          // Wait for async tracking
          await new Promise((resolve) => setTimeout(resolve, 50))

          // Verify error was tracked with details
          expect(window.gtag).toHaveBeenCalledWith(
            'event',
            'javascript_error',
            expect.objectContaining({
              event_category: 'error',
              error_message: errorMessage,
              error_context: context,
            })
          )
        }
      ),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Project tracking includes all required metadata
   * For any project view, tracking should include project ID and title
   */
  it('should track project views with complete metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          projectId: fc.string({ minLength: 1, maxLength: 50 }),
          projectTitle: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        async ({ projectId, projectTitle }) => {
          // Initialize analytics
          analytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
          analytics.isGALoaded = true
          await analytics.init()

          // Clear previous calls
          window.gtag.mockClear()

          // Track project view
          analytics.trackProjectView(projectId, projectTitle)

          // Wait for async tracking
          await new Promise((resolve) => setTimeout(resolve, 50))

          // Verify project tracking includes metadata
          expect(window.gtag).toHaveBeenCalledWith(
            'event',
            'view_project',
            expect.objectContaining({
              event_category: 'content',
              event_label: projectTitle,
              project_id: projectId,
              project_title: projectTitle,
            })
          )
        }
      ),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Search tracking includes query and results count
   * For any search, tracking should include the search term and number of results
   */
  it('should track search queries with results count', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          query: fc.string({ minLength: 1, maxLength: 100 }),
          resultsCount: fc.integer({ min: 0, max: 100 }),
        }),
        async ({ query, resultsCount }) => {
          // Initialize analytics
          analytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
          analytics.isGALoaded = true
          await analytics.init()

          // Clear previous calls
          window.gtag.mockClear()

          // Track search
          analytics.trackSearch(query, resultsCount)

          // Wait for async tracking
          await new Promise((resolve) => setTimeout(resolve, 50))

          // Verify search tracking includes query and results
          expect(window.gtag).toHaveBeenCalledWith(
            'event',
            'search',
            expect.objectContaining({
              event_category: 'engagement',
              event_label: query,
              value: resultsCount,
              search_term: query,
              results_count: resultsCount,
            })
          )
        }
      ),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Analytics service can be destroyed and cleaned up
   * For any state, destroy should clean up all resources
   */
  it('should clean up all resources on destroy', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hasQueuedEvents: fc.boolean(),
          hasUserJourney: fc.boolean(),
        }),
        async ({ hasQueuedEvents, hasUserJourney }) => {
          // Create and initialize analytics
          const testAnalytics = new AnalyticsService({
            measurementId: 'G-TEST123',
          })
          testAnalytics.loadGoogleAnalytics = vi.fn().mockResolvedValue()
          testAnalytics.isGALoaded = true
          await testAnalytics.init()

          // Add some state
          if (hasQueuedEvents) {
            testAnalytics.eventQueue.push({ eventName: 'test', category: 'test', action: 'test' })
          }
          if (hasUserJourney) {
            testAnalytics.addToUserJourney({ eventName: 'test', category: 'test', action: 'test' })
          }

          // Destroy
          testAnalytics.destroy()

          // Verify cleanup
          expect(testAnalytics.isInitialized).toBe(false)
          expect(testAnalytics.eventQueue).toHaveLength(0)
          expect(testAnalytics.userJourney).toHaveLength(0)
          expect(testAnalytics.batchTimer).toBeNull()
        }
      ),
      { numRuns: 30 }
    )
  })
})

