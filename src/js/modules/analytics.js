/**
 * Analytics Service Module
 * Integrates Google Analytics 4 with custom event tracking
 * Tracks visitor behavior and engagement without impacting performance
 * Requirements: 4.6, 9.1, 9.2
 */

import { logger } from '../utils/logger.js'

export class AnalyticsService {
  constructor(config = {}) {
    this.config = {
      measurementId: config.measurementId || null,
      enableDebug: config.enableDebug || false,
      enablePerformanceTracking: config.enablePerformanceTracking !== false,
      enableUserJourneyTracking: config.enableUserJourneyTracking !== false,
      enableEngagementTracking: config.enableEngagementTracking !== false,
      trackingDelay: config.trackingDelay || 0, // Delay to avoid performance impact
      batchEvents: config.batchEvents !== false,
      batchSize: config.batchSize || 10,
      batchTimeout: config.batchTimeout || 5000,
      ...config,
    }

    this.isInitialized = false
    this.isGALoaded = false
    this.eventQueue = []
    this.batchTimer = null
    this.performanceMonitor = null
    this.userJourney = []
    this.sessionStartTime = Date.now()
    this.engagementMetrics = {
      pageViews: 0,
      interactions: 0,
      timeOnPage: 0,
      scrollDepth: 0,
    }
  }

  /**
   * Initialize Analytics Service
   */
  async init(performanceMonitor = null) {
    try {
      logger.info('Initializing Analytics Service...')

      // Store reference to performance monitor
      this.performanceMonitor = performanceMonitor

      // Load Google Analytics 4 if measurement ID is provided
      if (this.config.measurementId) {
        await this.loadGoogleAnalytics()
      } else {
        logger.warn('No GA4 measurement ID provided, analytics disabled')
      }

      // Set up tracking systems
      if (this.config.enableUserJourneyTracking) {
        this.setupUserJourneyTracking()
      }

      if (this.config.enableEngagementTracking) {
        this.setupEngagementTracking()
      }

      if (this.config.enablePerformanceTracking && this.performanceMonitor) {
        this.setupPerformanceTracking()
      }

      this.isInitialized = true
      logger.info('Analytics Service initialized successfully')

      // Track initial page view
      this.trackPageView()
    } catch (error) {
      logger.error('Failed to initialize Analytics Service:', error)
      throw error
    }
  }

  /**
   * Load Google Analytics 4 script
   */
  async loadGoogleAnalytics() {
    return new Promise((resolve, reject) => {
      try {
        // Check if gtag is already loaded
        if (window.gtag) {
          this.isGALoaded = true
          logger.info('Google Analytics already loaded')
          resolve()
          return
        }

        // Create script element for GA4
        const script = document.createElement('script')
        script.async = true
        script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.measurementId}`

        script.onload = () => {
          // Initialize gtag
          window.dataLayer = window.dataLayer || []
          window.gtag = function () {
            window.dataLayer.push(arguments)
          }
          window.gtag('js', new Date())
          window.gtag('config', this.config.measurementId, {
            send_page_view: false, // We'll handle page views manually
            debug_mode: this.config.enableDebug,
          })

          this.isGALoaded = true
          logger.info('Google Analytics 4 loaded successfully')
          resolve()
        }

        script.onerror = () => {
          logger.error('Failed to load Google Analytics script')
          reject(new Error('Failed to load Google Analytics'))
        }

        // Append script to document
        document.head.appendChild(script)
      } catch (error) {
        logger.error('Error loading Google Analytics:', error)
        reject(error)
      }
    })
  }

  /**
   * Track custom event
   */
  trackEvent(event) {
    if (!this.isInitialized) {
      logger.warn('Analytics not initialized, queueing event')
      this.eventQueue.push(event)
      return
    }

    // Validate event
    if (!event.eventName || !event.category || !event.action) {
      logger.error('Invalid event: missing required fields', event)
      return
    }

    // Use requestIdleCallback to avoid performance impact
    const trackFn = () => {
      try {
        if (this.isGALoaded && window.gtag) {
          const eventData = {
            event_category: event.category,
            event_label: event.label || '',
            value: event.value || 0,
            ...event.customParameters,
          }

          window.gtag('event', event.action, eventData)

          if (this.config.enableDebug) {
            logger.info('Event tracked:', event.eventName, eventData)
          }
        }

        // Add to user journey
        if (this.config.enableUserJourneyTracking) {
          this.addToUserJourney(event)
        }
      } catch (error) {
        logger.error('Error tracking event:', error)
      }
    }

    // Use requestIdleCallback if available, otherwise setTimeout
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(trackFn, { timeout: 2000 })
    } else {
      setTimeout(trackFn, this.config.trackingDelay)
    }
  }

  /**
   * Track page view
   */
  trackPageView(pagePath = null, pageTitle = null) {
    const path = pagePath || window.location.pathname
    const title = pageTitle || document.title

    this.trackEvent({
      eventName: 'page_view',
      category: 'navigation',
      action: 'page_view',
      label: path,
      customParameters: {
        page_path: path,
        page_title: title,
      },
    })

    // Update engagement metrics
    this.engagementMetrics.pageViews++
  }

  /**
   * Track user interaction
   */
  trackInteraction(element, action, label = '') {
    this.trackEvent({
      eventName: 'user_interaction',
      category: 'engagement',
      action: action,
      label: label || element,
      customParameters: {
        element_type: element,
        interaction_type: action,
      },
    })

    // Update engagement metrics
    this.engagementMetrics.interactions++
  }

  /**
   * Track project view
   */
  trackProjectView(projectId, projectTitle) {
    this.trackEvent({
      eventName: 'project_view',
      category: 'content',
      action: 'view_project',
      label: projectTitle,
      customParameters: {
        project_id: projectId,
        project_title: projectTitle,
      },
    })
  }

  /**
   * Track project filter
   */
  trackProjectFilter(filterType, filterValue) {
    this.trackEvent({
      eventName: 'project_filter',
      category: 'engagement',
      action: 'filter_projects',
      label: `${filterType}: ${filterValue}`,
      customParameters: {
        filter_type: filterType,
        filter_value: filterValue,
      },
    })
  }

  /**
   * Track search query
   */
  trackSearch(query, resultsCount) {
    this.trackEvent({
      eventName: 'search',
      category: 'engagement',
      action: 'search',
      label: query,
      value: resultsCount,
      customParameters: {
        search_term: query,
        results_count: resultsCount,
      },
    })
  }

  /**
   * Track contact form submission
   */
  trackContactSubmission(success = true) {
    this.trackEvent({
      eventName: 'contact_form',
      category: 'conversion',
      action: success ? 'form_submit_success' : 'form_submit_error',
      label: 'contact_form',
      value: success ? 1 : 0,
    })
  }

  /**
   * Track theme change
   */
  trackThemeChange(theme) {
    this.trackEvent({
      eventName: 'theme_change',
      category: 'engagement',
      action: 'change_theme',
      label: theme,
      customParameters: {
        theme: theme,
      },
    })
  }

  /**
   * Track performance metrics
   */
  trackPerformanceMetrics(metrics) {
    if (!this.config.enablePerformanceTracking) {
      return
    }

    // Track Core Web Vitals
    if (metrics.lcp !== null) {
      this.trackEvent({
        eventName: 'web_vitals',
        category: 'performance',
        action: 'lcp',
        value: Math.round(metrics.lcp),
        customParameters: {
          metric_name: 'LCP',
          metric_value: metrics.lcp,
          metric_rating: this.getMetricRating('lcp', metrics.lcp),
        },
      })
    }

    if (metrics.fid !== null) {
      this.trackEvent({
        eventName: 'web_vitals',
        category: 'performance',
        action: 'fid',
        value: Math.round(metrics.fid),
        customParameters: {
          metric_name: 'FID',
          metric_value: metrics.fid,
          metric_rating: this.getMetricRating('fid', metrics.fid),
        },
      })
    }

    if (metrics.cls !== null) {
      this.trackEvent({
        eventName: 'web_vitals',
        category: 'performance',
        action: 'cls',
        value: Math.round(metrics.cls * 1000), // Convert to integer
        customParameters: {
          metric_name: 'CLS',
          metric_value: metrics.cls,
          metric_rating: this.getMetricRating('cls', metrics.cls),
        },
      })
    }
  }

  /**
   * Get metric rating (good, needs-improvement, poor)
   */
  getMetricRating(metric, value) {
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      ttfb: { good: 800, poor: 1800 },
      fcp: { good: 1800, poor: 3000 },
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
   * Set up performance tracking integration
   */
  setupPerformanceTracking() {
    if (!this.performanceMonitor) {
      return
    }

    // Listen to performance reports
    this.performanceMonitor.onReport((report) => {
      if (report.type === 'metrics-report') {
        this.trackPerformanceMetrics(report.data)
      }
    })

    logger.info('Performance tracking integration enabled')
  }

  /**
   * Set up user journey tracking
   */
  setupUserJourneyTracking() {
    // Track navigation events
    window.addEventListener('popstate', () => {
      this.trackPageView()
    })

    // Track outbound links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a')
      if (link && link.href && link.hostname !== window.location.hostname) {
        this.trackEvent({
          eventName: 'outbound_link',
          category: 'navigation',
          action: 'click_outbound',
          label: link.href,
          customParameters: {
            link_url: link.href,
            link_text: link.textContent,
          },
        })
      }
    })

    logger.info('User journey tracking enabled')
  }

  /**
   * Add event to user journey
   */
  addToUserJourney(event) {
    this.userJourney.push({
      ...event,
      timestamp: Date.now(),
      timeFromStart: Date.now() - this.sessionStartTime,
    })

    // Keep only last 50 events
    if (this.userJourney.length > 50) {
      this.userJourney.shift()
    }
  }

  /**
   * Get user journey
   */
  getUserJourney() {
    return [...this.userJourney]
  }

  /**
   * Set up engagement tracking
   */
  setupEngagementTracking() {
    // Track scroll depth
    let maxScrollDepth = 0
    const trackScroll = () => {
      const scrollPercentage =
        (window.scrollY + window.innerHeight) /
        document.documentElement.scrollHeight
      const scrollDepth = Math.round(scrollPercentage * 100)

      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth
        this.engagementMetrics.scrollDepth = scrollDepth

        // Track milestones
        if (scrollDepth >= 25 && scrollDepth < 50 && maxScrollDepth < 50) {
          this.trackEvent({
            eventName: 'scroll_depth',
            category: 'engagement',
            action: 'scroll',
            label: '25%',
            value: 25,
          })
        } else if (
          scrollDepth >= 50 &&
          scrollDepth < 75 &&
          maxScrollDepth < 75
        ) {
          this.trackEvent({
            eventName: 'scroll_depth',
            category: 'engagement',
            action: 'scroll',
            label: '50%',
            value: 50,
          })
        } else if (
          scrollDepth >= 75 &&
          scrollDepth < 100 &&
          maxScrollDepth < 100
        ) {
          this.trackEvent({
            eventName: 'scroll_depth',
            category: 'engagement',
            action: 'scroll',
            label: '75%',
            value: 75,
          })
        } else if (scrollDepth >= 100) {
          this.trackEvent({
            eventName: 'scroll_depth',
            category: 'engagement',
            action: 'scroll',
            label: '100%',
            value: 100,
          })
        }
      }
    }

    // Throttle scroll tracking
    let scrollTimeout
    window.addEventListener('scroll', () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
      scrollTimeout = setTimeout(trackScroll, 200)
    })

    // Track time on page
    setInterval(() => {
      this.engagementMetrics.timeOnPage = Date.now() - this.sessionStartTime
    }, 1000)

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent({
          eventName: 'page_hidden',
          category: 'engagement',
          action: 'visibility_change',
          label: 'hidden',
          customParameters: {
            time_on_page: this.engagementMetrics.timeOnPage,
          },
        })
      } else {
        this.trackEvent({
          eventName: 'page_visible',
          category: 'engagement',
          action: 'visibility_change',
          label: 'visible',
        })
      }
    })

    logger.info('Engagement tracking enabled')
  }

  /**
   * Get engagement metrics
   */
  getEngagementMetrics() {
    return {
      ...this.engagementMetrics,
      sessionDuration: Date.now() - this.sessionStartTime,
    }
  }

  /**
   * Track error
   */
  trackError(error, context = '') {
    this.trackEvent({
      eventName: 'error',
      category: 'error',
      action: 'javascript_error',
      label: error.message || 'Unknown error',
      customParameters: {
        error_message: error.message,
        error_stack: error.stack,
        error_context: context,
      },
    })
  }

  /**
   * Flush queued events
   */
  flushQueue() {
    if (this.eventQueue.length === 0) {
      return
    }

    logger.info(`Flushing ${this.eventQueue.length} queued events`)
    const queue = [...this.eventQueue]
    this.eventQueue = []

    queue.forEach((event) => this.trackEvent(event))
  }

  /**
   * Get analytics status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isGALoaded: this.isGALoaded,
      queuedEvents: this.eventQueue.length,
      engagementMetrics: this.getEngagementMetrics(),
      userJourneyLength: this.userJourney.length,
    }
  }

  /**
   * Destroy analytics service
   */
  destroy() {
    // Clear batch timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    // Clear event queue
    this.eventQueue = []
    this.userJourney = []

    this.isInitialized = false
    logger.info('Analytics Service destroyed')
  }
}

// Export singleton instance and helper functions
export const analyticsService = new AnalyticsService()

/**
 * Track an event (convenience function)
 */
export function trackEvent(eventName, params = {}) {
  return analyticsService.trackEvent(eventName, params)
}

/**
 * Track a page view (convenience function)
 */
export function trackPageView(path, title) {
  return analyticsService.trackPageView(path, title)
}
