/**
 * Tests for Task 9.1: AnimationEngine class enhancements
 * Tests the new functionality added for:
 * - Animation registration and playback
 * - Motion preference detection
 * - Performance capability checking
 * - Animation cleanup
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { AnimationEngine } from '../js/modules/animation.js'

describe('AnimationEngine - Task 9.1 Implementation', () => {
  let dom
  let document
  let window
  let animationEngine

  beforeEach(() => {
    // Create a fresh DOM for each test
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true,
    })
    document = dom.window.document
    window = dom.window

    // Set up global objects
    global.document = document
    global.window = window
    global.navigator = window.navigator
    global.IntersectionObserver = class IntersectionObserver {
      constructor() {}
      observe() {}
      disconnect() {}
    }
    global.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }))

    animationEngine = new AnimationEngine()
  })

  afterEach(() => {
    if (animationEngine && animationEngine.isInitialized) {
      animationEngine.destroy()
    }
    vi.clearAllMocks()
  })

  describe('Animation Registration and Playback', () => {
    it('should register custom animations', () => {
      const animationCallback = vi.fn()
      
      animationEngine.registerAnimation('testAnimation', animationCallback)
      
      expect(animationEngine.registeredAnimations.has('testAnimation')).toBe(true)
    })

    it('should not register animation with non-function callback', () => {
      animationEngine.registerAnimation('invalidAnimation', 'not a function')
      
      expect(animationEngine.registeredAnimations.has('invalidAnimation')).toBe(false)
    })

    it('should play registered animations', () => {
      const animationCallback = vi.fn(() => ({ cancel: vi.fn() }))
      const element = document.createElement('div')
      
      animationEngine.registerAnimation('testAnimation', animationCallback)
      animationEngine.playAnimation('testAnimation', element)
      
      expect(animationCallback).toHaveBeenCalledWith(element, {})
    })

    it('should track active animations', () => {
      const mockAnimation = { cancel: vi.fn(), onfinish: null }
      const animationCallback = vi.fn(() => mockAnimation)
      const element = document.createElement('div')
      
      animationEngine.registerAnimation('testAnimation', animationCallback)
      animationEngine.playAnimation('testAnimation', element)
      
      expect(animationEngine.activeAnimations).toContain(mockAnimation)
    })

    it('should return null for unregistered animations', () => {
      const element = document.createElement('div')
      
      const result = animationEngine.playAnimation('nonexistent', element)
      
      expect(result).toBeNull()
    })

    it('should skip animations when reduced motion is enabled', () => {
      animationEngine.respectsReducedMotion = true
      const animationCallback = vi.fn()
      const element = document.createElement('div')
      
      animationEngine.registerAnimation('testAnimation', animationCallback)
      const result = animationEngine.playAnimation('testAnimation', element)
      
      expect(animationCallback).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('should force play animations when force option is true', () => {
      animationEngine.respectsReducedMotion = true
      const animationCallback = vi.fn(() => ({ cancel: vi.fn() }))
      const element = document.createElement('div')
      
      animationEngine.registerAnimation('testAnimation', animationCallback)
      animationEngine.playAnimation('testAnimation', element, { force: true })
      
      expect(animationCallback).toHaveBeenCalled()
    })
  })

  describe('Motion Preference Detection', () => {
    it('should detect reduced motion preference', async () => {
      global.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))

      const engine = new AnimationEngine({ respectMotionPreferences: true })
      await engine.init()

      expect(engine.respectsReducedMotion).toBe(true)
      expect(document.documentElement.classList.contains('reduce-motion')).toBe(true)
    })

    it('should not enable reduced motion when preference is not set', async () => {
      global.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))

      const engine = new AnimationEngine({ respectMotionPreferences: true })
      await engine.init()

      expect(engine.respectsReducedMotion).toBe(false)
      expect(document.documentElement.classList.contains('reduce-motion')).toBe(false)
    })
  })

  describe('Performance Capability Checking', () => {
    it('should check performance capability on initialization', async () => {
      const checkSpy = vi.spyOn(animationEngine, 'checkPerformanceCapability')
      
      await animationEngine.init()
      
      expect(checkSpy).toHaveBeenCalled()
    })

    it('should detect low-end device with limited cores', () => {
      global.navigator.hardwareConcurrency = 2
      
      const isLowPerformance = animationEngine.checkPerformanceCapability()
      
      expect(isLowPerformance).toBe(true)
    })

    it('should detect low-end device with limited memory', () => {
      global.navigator.deviceMemory = 2
      
      const isLowPerformance = animationEngine.checkPerformanceCapability()
      
      expect(isLowPerformance).toBe(true)
    })

    it('should detect slow network connection', () => {
      global.navigator.connection = {
        effectiveType: '2g',
        saveData: false,
      }
      
      const isLowPerformance = animationEngine.checkPerformanceCapability()
      
      expect(isLowPerformance).toBe(true)
    })

    it('should detect data saver mode', () => {
      global.navigator.connection = {
        effectiveType: '4g',
        saveData: true,
      }
      
      const isLowPerformance = animationEngine.checkPerformanceCapability()
      
      expect(isLowPerformance).toBe(true)
    })

    it('should not flag high-performance devices', () => {
      global.navigator.hardwareConcurrency = 8
      global.navigator.deviceMemory = 8
      global.navigator.connection = {
        effectiveType: '4g',
        saveData: false,
      }
      
      const isLowPerformance = animationEngine.checkPerformanceCapability()
      
      expect(isLowPerformance).toBe(false)
    })

    it('should enable performance mode when device is low-performance', async () => {
      global.navigator.hardwareConcurrency = 2
      
      await animationEngine.init()
      
      expect(animationEngine.performanceMode).toBe(true)
      expect(document.documentElement.classList.contains('performance-mode')).toBe(true)
    })

    it('should skip parallax effects in performance mode', async () => {
      global.navigator.hardwareConcurrency = 2
      const parallaxElement = document.createElement('div')
      parallaxElement.setAttribute('data-parallax', '0.5')
      document.body.appendChild(parallaxElement)
      
      await animationEngine.init()
      
      expect(animationEngine.parallaxElements.length).toBe(0)
    })

    it('should simplify animations in performance mode', () => {
      animationEngine.performanceMode = true
      const animationCallback = vi.fn()
      const element = document.createElement('div')
      
      animationEngine.registerAnimation('testAnimation', animationCallback)
      const result = animationEngine.playAnimation('testAnimation', element, {
        finalState: { opacity: '1' },
      })
      
      expect(animationCallback).not.toHaveBeenCalled()
      expect(element.style.opacity).toBe('1')
      expect(result).toBeNull()
    })
  })

  describe('Animation Cleanup', () => {
    it('should clean up all active animations', () => {
      const mockAnimation1 = { cancel: vi.fn() }
      const mockAnimation2 = { cancel: vi.fn() }
      
      animationEngine.activeAnimations = [mockAnimation1, mockAnimation2]
      
      animationEngine.cleanupAnimations()
      
      expect(mockAnimation1.cancel).toHaveBeenCalled()
      expect(mockAnimation2.cancel).toHaveBeenCalled()
      expect(animationEngine.activeAnimations.length).toBe(0)
    })

    it('should remove animation classes from elements', () => {
      const element1 = document.createElement('div')
      const element2 = document.createElement('div')
      
      element1.classList.add('animated', 'fade-in-up')
      element2.classList.add('animate-on-scroll', 'slide-in-left')
      
      animationEngine.animatedElements.add(element1)
      animationEngine.animatedElements.add(element2)
      
      animationEngine.cleanupAnimations()
      
      expect(element1.classList.contains('animated')).toBe(false)
      expect(element1.classList.contains('fade-in-up')).toBe(false)
      expect(element2.classList.contains('animate-on-scroll')).toBe(false)
      expect(element2.classList.contains('slide-in-left')).toBe(false)
    })

    it('should clear parallax transforms', () => {
      const element = document.createElement('div')
      element.style.transform = 'translateY(50px)'
      
      animationEngine.parallaxElements = [{ element, speed: 0.5 }]
      
      animationEngine.cleanupAnimations()
      
      expect(element.style.transform).toBe('')
    })

    it('should remove ripple effects', () => {
      const ripple1 = document.createElement('span')
      const ripple2 = document.createElement('span')
      
      ripple1.classList.add('ripple')
      ripple2.classList.add('ripple')
      
      document.body.appendChild(ripple1)
      document.body.appendChild(ripple2)
      
      animationEngine.cleanupAnimations()
      
      expect(document.querySelectorAll('.ripple').length).toBe(0)
    })

    it('should clear animated elements set', () => {
      const element = document.createElement('div')
      animationEngine.animatedElements.add(element)
      
      animationEngine.cleanupAnimations()
      
      expect(animationEngine.animatedElements.size).toBe(0)
    })

    it('should be called during destroy', () => {
      const cleanupSpy = vi.spyOn(animationEngine, 'cleanupAnimations')
      
      animationEngine.destroy()
      
      expect(cleanupSpy).toHaveBeenCalled()
    })

    it('should remove all CSS classes on destroy', async () => {
      await animationEngine.init()
      document.documentElement.classList.add('reduce-motion', 'performance-mode', 'animations-paused')
      
      animationEngine.destroy()
      
      expect(document.documentElement.classList.contains('reduce-motion')).toBe(false)
      expect(document.documentElement.classList.contains('performance-mode')).toBe(false)
      expect(document.documentElement.classList.contains('animations-paused')).toBe(false)
    })
  })

  describe('Performance Metrics', () => {
    it('should include performance mode in metrics', () => {
      animationEngine.performanceMode = true
      
      const metrics = animationEngine.getPerformanceMetrics()
      
      expect(metrics.performanceModeEnabled).toBe(true)
    })

    it('should include active animations count in metrics', () => {
      animationEngine.activeAnimations = [{ cancel: vi.fn() }, { cancel: vi.fn() }]
      
      const metrics = animationEngine.getPerformanceMetrics()
      
      expect(metrics.activeAnimationsCount).toBe(2)
    })

    it('should include registered animations count in metrics', () => {
      animationEngine.registerAnimation('anim1', vi.fn())
      animationEngine.registerAnimation('anim2', vi.fn())
      
      const metrics = animationEngine.getPerformanceMetrics()
      
      expect(metrics.registeredAnimationsCount).toBe(2)
    })
  })
})
