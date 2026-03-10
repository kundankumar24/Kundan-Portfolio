/**
 * Animation Engine Module
 * Handles animations and micro-interactions
 */

import { logger } from '../utils/logger.js'
import { prefersReducedMotion } from '../utils/helpers.js'

export class AnimationEngine {
  constructor(config = {}) {
    this.config = {
      respectMotionPreferences: true,
      defaultDuration: 300,
      intersectionThreshold: 0.1,
      intersectionRootMargin: '0px 0px -100px 0px',
      ...config,
    }

    this.isInitialized = false
    this.respectsReducedMotion = false
    this.performanceMode = false
    this.observers = new Map()
    this.animatedElements = new Set()
    this.registeredAnimations = new Map()
    this.parallaxElements = []
    this.activeAnimations = []
    this.performanceMetrics = {
      animationCount: 0,
      averageDuration: 0,
      slowAnimations: [],
    }
  }

  /**
   * Initialize animation engine
   */
  async init() {
    try {
      logger.info('Initializing Animation Engine...')

      // Check motion preferences
      this.respectsReducedMotion =
        this.config.respectMotionPreferences && prefersReducedMotion()

      // Check device performance capability
      this.performanceMode = this.checkPerformanceCapability()

      // Apply reduced motion class if needed
      if (this.respectsReducedMotion) {
        document.documentElement.classList.add('reduce-motion')
      }

      // Apply performance mode class if needed
      if (this.performanceMode) {
        document.documentElement.classList.add('performance-mode')
        logger.info('Performance mode enabled - animations will be simplified')
      }

      // Set up intersection observer for scroll animations
      this.setupScrollAnimations()

      // Set up hover state interactions
      this.setupHoverStates()

      // Set up micro-interactions
      this.setupMicroInteractions()

      // Set up parallax effects (skip if performance mode)
      if (!this.performanceMode) {
        this.setupParallaxEffects()
      }

      // Set up smooth scrolling
      this.setupSmoothScrolling()

      // Listen for motion preference changes
      this.setupMotionPreferenceListener()

      this.isInitialized = true
      logger.info('Animation Engine initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Animation Engine:', error)
      throw error
    }
  }

  /**
   * Set up scroll-based animations using Intersection Observer
   */
  setupScrollAnimations() {
    // Create intersection observer for scroll animations
    const observerOptions = {
      threshold: this.config.intersectionThreshold,
      rootMargin: this.config.intersectionRootMargin,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.triggerAnimation(entry.target)
        }
      })
    }, observerOptions)

    // Observe elements with animation attributes
    const animatableElements = document.querySelectorAll(
      '[data-animate], .card, .hero-content, .section-header, .nav-link'
    )

    animatableElements.forEach((element) => {
      // Add initial state
      if (!this.respectsReducedMotion) {
        element.classList.add('animate-on-scroll')
      }
      observer.observe(element)
    })

    this.observers.set('scroll', observer)
    logger.info(`Observing ${animatableElements.length} elements for scroll animations`)
  }

  /**
   * Set up hover state interactions
   */
  setupHoverStates() {
    // Interactive cards
    const cards = document.querySelectorAll('.card')
    cards.forEach((card) => {
      this.addHoverEffect(card, 'card-hover')
    })

    // Buttons
    const buttons = document.querySelectorAll('.btn')
    buttons.forEach((button) => {
      this.addHoverEffect(button, 'btn-hover')
    })

    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link')
    navLinks.forEach((link) => {
      this.addHoverEffect(link, 'nav-link-hover')
    })

    logger.info('Hover states initialized')
  }

  /**
   * Set up micro-interactions
   */
  setupMicroInteractions() {
    // Button click ripple effect - only for actual button elements, not links
    const interactiveElements = document.querySelectorAll('button.btn, .card')
    interactiveElements.forEach((element) => {
      element.addEventListener('click', (e) => {
        if (!this.respectsReducedMotion) {
          this.createRippleEffect(e, element)
        }
      })
    })

    // Form input focus animations
    const formInputs = document.querySelectorAll('.form-input, .form-textarea')
    formInputs.forEach((input) => {
      input.addEventListener('focus', () => {
        input.parentElement?.classList.add('input-focused')
      })
      input.addEventListener('blur', () => {
        input.parentElement?.classList.remove('input-focused')
      })
    })

    // Theme toggle animation
    const themeToggle = document.querySelector('.theme-toggle')
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        if (!this.respectsReducedMotion) {
          themeToggle.classList.add('theme-updated')
          setTimeout(() => {
            themeToggle.classList.remove('theme-updated')
          }, 200)
        }
      })
    }

    logger.info('Micro-interactions initialized')
  }

  /**
   * Set up listener for motion preference changes
   */
  setupMotionPreferenceListener() {
    if (!this.config.respectMotionPreferences) {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleMotionPreferenceChange = (e) => {
      const wasReducedMotion = this.respectsReducedMotion
      this.respectsReducedMotion = e.matches

      if (wasReducedMotion !== this.respectsReducedMotion) {
        logger.info(`Motion preference changed: reduced motion ${this.respectsReducedMotion ? 'enabled' : 'disabled'}`)
        
        // Update document class
        if (this.respectsReducedMotion) {
          document.documentElement.classList.add('reduce-motion')
          // Pause parallax effects
          this.parallaxElements.forEach(({ element }) => {
            element.style.transform = ''
          })
        } else {
          document.documentElement.classList.remove('reduce-motion')
        }
      }
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionPreferenceChange)
      this.observers.set('motionPreference', {
        disconnect: () => mediaQuery.removeEventListener('change', handleMotionPreferenceChange)
      })
    } 
    // Older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleMotionPreferenceChange)
      this.observers.set('motionPreference', {
        disconnect: () => mediaQuery.removeListener(handleMotionPreferenceChange)
      })
    }

    logger.info('Motion preference listener initialized')
  }

  /**
   * Set up smooth scrolling for anchor links
   */
  setupSmoothScrolling() {
    // Enable smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href')
        
        // Skip if it's just "#"
        if (href === '#') {
          return
        }

        const target = document.querySelector(href)
        if (target) {
          e.preventDefault()
          
          const behavior = this.respectsReducedMotion ? 'auto' : 'smooth'
          target.scrollIntoView({
            behavior,
            block: 'start',
          })
        }
      })
    })

    logger.info('Smooth scrolling initialized')
  }

  /**
   * Set up parallax effects
   */
  setupParallaxEffects() {
    if (this.respectsReducedMotion || this.performanceMode) {
      logger.info('Skipping parallax effects due to reduced motion or performance mode')
      return
    }

    // Find elements with parallax data attribute
    const parallaxElements = document.querySelectorAll('[data-parallax]')
    
    parallaxElements.forEach((element) => {
      const speed = parseFloat(element.dataset.parallax) || 0.5
      this.parallaxElements.push({ element, speed })
    })

    // Set up scroll listener for parallax
    if (this.parallaxElements.length > 0) {
      const handleParallaxScroll = () => {
        const scrollY = window.pageYOffset

        this.parallaxElements.forEach(({ element, speed }) => {
          const rect = element.getBoundingClientRect()
          const elementTop = rect.top + scrollY
          const elementHeight = rect.height
          const viewportHeight = window.innerHeight

          // Only apply parallax when element is in or near viewport
          if (scrollY + viewportHeight > elementTop && scrollY < elementTop + elementHeight) {
            const offset = (scrollY - elementTop) * speed
            element.style.transform = `translateY(${offset}px)`
          }
        })
      }

      // Use requestAnimationFrame for smooth parallax
      let ticking = false
      const onScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            handleParallaxScroll()
            ticking = false
          })
          ticking = true
        }
      }

      window.addEventListener('scroll', onScroll, { passive: true })
      this.observers.set('parallax', { disconnect: () => window.removeEventListener('scroll', onScroll) })
      
      logger.info(`Parallax effects initialized for ${this.parallaxElements.length} elements`)
    }
  }

  /**
   * Add hover effect to element
   * @param {Element} element - Element to add hover effect to
   * @param {string} className - Class name for hover state
   */
  addHoverEffect(element, className) {
    if (this.respectsReducedMotion) {
      return
    }

    element.addEventListener('mouseenter', () => {
      element.classList.add(className)
    })

    element.addEventListener('mouseleave', () => {
      element.classList.remove(className)
    })
  }

  /**
   * Trigger animation on element
   * @param {Element} element - Element to animate
   */
  triggerAnimation(element) {
    if (this.animatedElements.has(element)) {
      return
    }

    // Get animation type from data attribute or default
    const animationType = element.dataset.animate || 'fade-in-up'

    // Monitor animation performance
    const startTime = performance.now()

    // Apply animation class
    element.classList.add('animated', animationType)
    this.animatedElements.add(element)

    // Get animation duration from CSS or use default
    const duration = this.getAnimationDuration(element)

    // Track animation performance
    this.performanceMetrics.animationCount++

    // Remove animation class after completion
    setTimeout(() => {
      element.classList.remove('animate-on-scroll')
      
      // Measure actual animation duration
      const actualDuration = performance.now() - startTime
      this.trackAnimationPerformance(element, animationType, actualDuration, duration)
    }, duration)
  }

  /**
   * Track animation performance metrics
   * @param {Element} element - Animated element
   * @param {string} animationType - Type of animation
   * @param {number} actualDuration - Actual duration in ms
   * @param {number} expectedDuration - Expected duration in ms
   */
  trackAnimationPerformance(element, animationType, actualDuration, expectedDuration) {
    // Update average duration
    const totalAnimations = this.performanceMetrics.animationCount
    const currentAverage = this.performanceMetrics.averageDuration
    this.performanceMetrics.averageDuration = 
      (currentAverage * (totalAnimations - 1) + actualDuration) / totalAnimations

    // Track slow animations (taking more than 500ms or 50% longer than expected)
    const threshold = Math.max(500, expectedDuration * 1.5)
    if (actualDuration > threshold) {
      this.performanceMetrics.slowAnimations.push({
        element: element.tagName,
        animationType,
        actualDuration,
        expectedDuration,
        timestamp: Date.now(),
      })

      // Keep only last 10 slow animations
      if (this.performanceMetrics.slowAnimations.length > 10) {
        this.performanceMetrics.slowAnimations.shift()
      }

      logger.warn(
        `Slow animation detected: ${animationType} on ${element.tagName} took ${actualDuration.toFixed(2)}ms (expected ${expectedDuration}ms)`
      )
    }
  }

  /**
   * Get animation performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      reducedMotionEnabled: this.respectsReducedMotion,
      performanceModeEnabled: this.performanceMode,
      totalAnimatedElements: this.animatedElements.size,
      activeAnimationsCount: this.activeAnimations.length,
      parallaxElementsCount: this.parallaxElements.length,
      registeredAnimationsCount: this.registeredAnimations.size,
    }
  }

  /**
   * Create ripple effect on click
   * @param {Event} event - Click event
   * @param {Element} element - Element to create ripple on
   */
  createRippleEffect(event, element) {
    const ripple = document.createElement('span')
    ripple.classList.add('ripple')

    const rect = element.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    ripple.style.width = ripple.style.height = `${size}px`
    ripple.style.left = `${x}px`
    ripple.style.top = `${y}px`

    element.style.position = 'relative'
    element.style.overflow = 'hidden'
    element.appendChild(ripple)

    setTimeout(() => {
      ripple.remove()
    }, 600)
  }

  /**
   * Get animation duration from element
   * @param {Element} element - Element to get duration from
   * @returns {number} Duration in milliseconds
   */
  getAnimationDuration(element) {
    const style = window.getComputedStyle(element)
    const duration = style.animationDuration || style.transitionDuration || '0s'
    return parseFloat(duration) * 1000 || this.config.defaultDuration
  }

  /**
   * Register a custom animation
   * @param {string} name - Animation name
   * @param {Function} callback - Animation callback
   */
  registerAnimation(name, callback) {
    if (typeof callback !== 'function') {
      logger.error(`Cannot register animation "${name}": callback must be a function`)
      return
    }
    this.registeredAnimations.set(name, callback)
    logger.info(`Registered animation: ${name}`)
  }

  /**
   * Play a registered animation
   * @param {string} name - Animation name
   * @param {Element} element - Element to animate
   * @param {Object} options - Animation options
   * @returns {Animation|null} Web Animations API Animation object or null
   */
  playAnimation(name, element, options = {}) {
    // Skip animations if reduced motion is enabled (unless forced)
    if (this.respectsReducedMotion && !options.force) {
      logger.debug(`Skipping animation "${name}" due to reduced motion preference`)
      return null
    }

    // Simplify animations in performance mode (unless forced)
    if (this.performanceMode && !options.force) {
      logger.debug(`Simplifying animation "${name}" due to performance mode`)
      // Apply instant state change instead of animation
      if (options.finalState) {
        Object.assign(element.style, options.finalState)
      }
      return null
    }

    const animation = this.registeredAnimations.get(name)
    if (animation) {
      try {
        const animationInstance = animation(element, options)
        
        // Track active animation if it's a Web Animations API animation
        if (animationInstance && typeof animationInstance.cancel === 'function') {
          this.activeAnimations.push(animationInstance)
          
          // Remove from active animations when finished
          animationInstance.onfinish = () => {
            const index = this.activeAnimations.indexOf(animationInstance)
            if (index > -1) {
              this.activeAnimations.splice(index, 1)
            }
          }
        }
        
        return animationInstance
      } catch (error) {
        logger.error(`Error playing animation "${name}":`, error)
        return null
      }
    } else {
      logger.warn(`Animation not found: ${name}`)
      return null
    }
  }

  /**
   * Pause all animations
   */
  pauseAnimations() {
    document.documentElement.classList.add('animations-paused')
  }

  /**
   * Resume all animations
   */
  resumeAnimations() {
    document.documentElement.classList.remove('animations-paused')
  }

  /**
   * Handle resize events
   */
  handleResize() {
    // Recalculate animation triggers if needed
    if (this.isInitialized) {
      logger.debug('Animation engine handling resize')
    }
  }

  /**
   * Handle scroll events
   */
  handleScroll() {
    // Scroll handling is done by Intersection Observer
    // This method is kept for compatibility
  }

  /**
   * Check device performance capability
   * @returns {boolean} True if device has limited performance
   */
  checkPerformanceCapability() {
    try {
      // Check for low-end device indicators
      const indicators = {
        // Check hardware concurrency (CPU cores)
        lowCores: navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2,
        
        // Check device memory (if available)
        lowMemory: navigator.deviceMemory && navigator.deviceMemory <= 2,
        
        // Check connection type (if available)
        slowConnection: false,
      }

      // Check network connection
      if (navigator.connection) {
        const connection = navigator.connection
        const slowTypes = ['slow-2g', '2g', '3g']
        indicators.slowConnection = 
          slowTypes.includes(connection.effectiveType) || 
          connection.saveData === true
      }

      // Check battery status for power saving mode
      if (navigator.getBattery) {
        navigator.getBattery().then((battery) => {
          if (battery.charging === false && battery.level < 0.2) {
            this.performanceMode = true
            document.documentElement.classList.add('performance-mode')
            logger.info('Low battery detected - enabling performance mode')
          }
        })
      }

      // Device is considered low-performance if any indicator is true
      const isLowPerformance = Object.values(indicators).some(value => value === true)

      if (isLowPerformance) {
        logger.info('Low-performance device detected:', indicators)
      }

      return isLowPerformance
    } catch (error) {
      logger.warn('Error checking performance capability:', error)
      return false
    }
  }

  /**
   * Clean up animation resources
   * Removes animation classes, clears timers, and resets element states
   */
  cleanupAnimations() {
    try {
      logger.info('Cleaning up animations...')

      // Clear all active animations
      this.activeAnimations.forEach((animation) => {
        if (animation.cancel) {
          animation.cancel()
        }
      })
      this.activeAnimations = []

      // Remove animation classes from all animated elements
      this.animatedElements.forEach((element) => {
        if (element && element.classList) {
          element.classList.remove(
            'animated',
            'animate-on-scroll',
            'fade-in-up',
            'fade-in',
            'slide-in-left',
            'slide-in-right',
            'zoom-in',
            'card-hover',
            'btn-hover',
            'nav-link-hover'
          )
        }
      })

      // Clear parallax transforms
      this.parallaxElements.forEach(({ element }) => {
        if (element && element.style) {
          element.style.transform = ''
        }
      })

      // Remove ripple effects
      document.querySelectorAll('.ripple').forEach((ripple) => {
        ripple.remove()
      })

      // Clear tracked elements
      this.animatedElements.clear()

      logger.info('Animation cleanup completed')
    } catch (error) {
      logger.error('Error during animation cleanup:', error)
    }
  }

  /**
   * Destroy animation engine
   */
  destroy() {
    // Clean up all animations first
    this.cleanupAnimations()

    // Disconnect all observers
    this.observers.forEach((observer) => {
      observer.disconnect()
    })
    this.observers.clear()

    // Clear registered animations
    this.registeredAnimations.clear()
    this.parallaxElements = []

    // Remove classes
    document.documentElement.classList.remove('reduce-motion', 'animations-paused', 'performance-mode')

    this.isInitialized = false
    logger.info('Animation Engine destroyed')
  }
}
