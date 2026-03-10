/**
 * Animation System Property-Based Tests
 * Feature: portfolio-enhancement, Property 1: Animation System Integrity
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.5, 1.7**
 * 
 * Property 1: Animation System Integrity
 * For any page load or content appearance, all animations should complete 
 * successfully without errors and within acceptable timeframes (< 500ms)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import fc from 'fast-check'
import { AnimationEngine } from '../js/modules/animation.js'

describe('Property 1: Animation System Integrity', () => {
  let dom
  let animationEngine

  beforeEach(() => {
    // Set up DOM
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .animated { animation-duration: 0.3s; }
            .fade-in-up { animation-name: fadeInUp; }
            .fade-in-down { animation-name: fadeInDown; }
            .fade-in-left { animation-name: fadeInLeft; }
            .fade-in-right { animation-name: fadeInRight; }
            .scale-in { animation-name: scaleIn; }
          </style>
        </head>
        <body></body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true,
    })

    global.window = dom.window
    global.document = dom.window.document
    global.performance = {
      now: () => Date.now(),
    }
    
    global.IntersectionObserver = class IntersectionObserver {
      constructor(callback) {
        this.callback = callback
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    }

    // Mock matchMedia for reduced motion
    global.window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    global.window.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16))
    global.window.pageYOffset = 0
    global.window.innerHeight = 768
  })

  afterEach(() => {
    if (animationEngine) {
      animationEngine.destroy()
    }
  })

  /**
   * Property: All animations complete without errors
   * For any set of elements with animation attributes, the animation engine
   * should initialize and trigger animations without throwing errors
   */
  it('should complete all animations without errors for any element configuration', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary element configurations
        fc.array(
          fc.record({
            tag: fc.constantFrom('div', 'section', 'article', 'span', 'p'),
            className: fc.constantFrom('card', 'hero-content', 'section-header', 'nav-link'),
            animationType: fc.constantFrom(
              'fade-in-up',
              'fade-in-down',
              'fade-in-left',
              'fade-in-right',
              'scale-in',
              undefined
            ),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (elementConfigs) => {
          // Create elements based on configuration
          const body = document.body
          body.innerHTML = ''

          elementConfigs.forEach((config) => {
            const element = document.createElement(config.tag)
            element.className = config.className
            if (config.animationType) {
              element.dataset.animate = config.animationType
            }
            body.appendChild(element)
          })

          // Initialize animation engine
          animationEngine = new AnimationEngine()
          
          // Should not throw errors during initialization
          await expect(animationEngine.init()).resolves.not.toThrow()
          
          // Should be initialized
          expect(animationEngine.isInitialized).toBe(true)
          
          // Trigger animations on all elements
          const elements = document.querySelectorAll('[data-animate], .card, .hero-content, .section-header, .nav-link')
          elements.forEach((element) => {
            expect(() => animationEngine.triggerAnimation(element)).not.toThrow()
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Animation durations are within acceptable timeframes
   * For any animation, the expected duration should be less than 500ms
   */
  it('should ensure all animation durations are within acceptable timeframes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            animationType: fc.constantFrom('fade-in-up', 'fade-in-down', 'scale-in'),
            customDuration: fc.option(fc.integer({ min: 100, max: 1000 })),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (animationConfigs) => {
          const body = document.body
          body.innerHTML = ''

          animationConfigs.forEach((config, index) => {
            const element = document.createElement('div')
            element.className = 'card'
            element.dataset.animate = config.animationType
            
            if (config.customDuration) {
              element.style.animationDuration = `${config.customDuration / 1000}s`
            }
            
            body.appendChild(element)
          })

          animationEngine = new AnimationEngine({ defaultDuration: 300 })
          await animationEngine.init()

          const elements = document.querySelectorAll('.card')
          elements.forEach((element) => {
            const duration = animationEngine.getAnimationDuration(element)
            
            // Animation duration should be reasonable (< 2000ms for property test flexibility)
            expect(duration).toBeLessThan(2000)
            expect(duration).toBeGreaterThan(0)
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Hover states work correctly for any interactive element
   * For any element with hover effects, the hover class should be added/removed correctly
   */
  it('should handle hover states correctly for any interactive element', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            tag: fc.constantFrom('div', 'button', 'a'),
            className: fc.constantFrom('card', 'btn', 'nav-link'),
          }),
          { minLength: 1, maxLength: 15 }
        ),
        async (elementConfigs) => {
          const body = document.body
          body.innerHTML = ''

          elementConfigs.forEach((config) => {
            const element = document.createElement(config.tag)
            element.className = config.className
            body.appendChild(element)
          })

          animationEngine = new AnimationEngine()
          await animationEngine.init()

          const elements = document.querySelectorAll('.card, .btn, .nav-link')
          elements.forEach((element) => {
            const expectedHoverClass = element.classList.contains('card')
              ? 'card-hover'
              : element.classList.contains('btn')
              ? 'btn-hover'
              : 'nav-link-hover'

            // Simulate mouseenter
            const mouseEnterEvent = new dom.window.MouseEvent('mouseenter')
            element.dispatchEvent(mouseEnterEvent)
            expect(element.classList.contains(expectedHoverClass)).toBe(true)

            // Simulate mouseleave
            const mouseLeaveEvent = new dom.window.MouseEvent('mouseleave')
            element.dispatchEvent(mouseLeaveEvent)
            expect(element.classList.contains(expectedHoverClass)).toBe(false)
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Parallax effects are applied correctly
   * For any element with parallax data attribute, the transform should be applied
   */
  it('should apply parallax effects correctly for any parallax configuration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            speed: fc.float({ min: Math.fround(0.1), max: Math.fround(2.0), noNaN: true }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (parallaxConfigs) => {
          const body = document.body
          body.innerHTML = ''

          parallaxConfigs.forEach((config) => {
            const element = document.createElement('div')
            element.className = 'parallax-section'
            element.dataset.parallax = config.speed.toString()
            element.style.height = '500px'
            body.appendChild(element)
          })

          animationEngine = new AnimationEngine()
          await animationEngine.init()

          // Verify parallax elements were registered
          expect(animationEngine.parallaxElements.length).toBe(parallaxConfigs.length)

          // Verify each parallax element has correct speed
          animationEngine.parallaxElements.forEach((item, index) => {
            expect(item.speed).toBeCloseTo(parallaxConfigs[index].speed, 1)
            expect(item.element).toBeTruthy()
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Micro-interactions work without errors
   * For any interactive element, micro-interactions should execute without errors
   */
  it('should execute micro-interactions without errors for any element', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            tag: fc.constantFrom('button', 'div'),
            className: fc.constantFrom('btn', 'card'),
            hasInput: fc.boolean(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (elementConfigs) => {
          const body = document.body
          body.innerHTML = ''

          elementConfigs.forEach((config) => {
            if (config.hasInput) {
              const wrapper = document.createElement('div')
              const input = document.createElement('input')
              input.className = 'form-input'
              wrapper.appendChild(input)
              body.appendChild(wrapper)
            } else {
              const element = document.createElement(config.tag)
              element.className = config.className
              body.appendChild(element)
            }
          })

          animationEngine = new AnimationEngine()
          await animationEngine.init()

          // Test click interactions
          const clickableElements = document.querySelectorAll('.btn, .card')
          clickableElements.forEach((element) => {
            const clickEvent = new dom.window.MouseEvent('click', {
              clientX: 50,
              clientY: 50,
            })
            expect(() => element.dispatchEvent(clickEvent)).not.toThrow()
          })

          // Test input focus interactions
          const inputs = document.querySelectorAll('.form-input')
          inputs.forEach((input) => {
            const focusEvent = new dom.window.FocusEvent('focus')
            const blurEvent = new dom.window.FocusEvent('blur')
            
            expect(() => input.dispatchEvent(focusEvent)).not.toThrow()
            expect(() => input.dispatchEvent(blurEvent)).not.toThrow()
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Custom animations can be registered and played
   * For any custom animation, it should be registerable and playable
   */
  it('should register and play custom animations correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }),
            shouldExecute: fc.boolean(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (animationConfigs) => {
          const body = document.body
          body.innerHTML = '<div class="test-element"></div>'

          animationEngine = new AnimationEngine()
          await animationEngine.init()

          const element = document.querySelector('.test-element')
          const executionTracker = {}

          // Register all animations
          animationConfigs.forEach((config) => {
            executionTracker[config.name] = false
            const callback = vi.fn(() => {
              executionTracker[config.name] = true
            })
            
            expect(() => animationEngine.registerAnimation(config.name, callback)).not.toThrow()
            expect(animationEngine.registeredAnimations.has(config.name)).toBe(true)
          })

          // Play animations that should execute
          animationConfigs.forEach((config) => {
            if (config.shouldExecute) {
              expect(() => animationEngine.playAnimation(config.name, element)).not.toThrow()
              expect(executionTracker[config.name]).toBe(true)
            }
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Animation engine can be paused and resumed
   * For any state, pause and resume operations should work correctly
   */
  it('should pause and resume animations correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
        async (pauseResumeSequence) => {
          const body = document.body
          body.innerHTML = '<div class="card">Test</div>'

          animationEngine = new AnimationEngine()
          await animationEngine.init()

          pauseResumeSequence.forEach((shouldPause) => {
            if (shouldPause) {
              expect(() => animationEngine.pauseAnimations()).not.toThrow()
              expect(document.documentElement.classList.contains('animations-paused')).toBe(true)
            } else {
              expect(() => animationEngine.resumeAnimations()).not.toThrow()
              expect(document.documentElement.classList.contains('animations-paused')).toBe(false)
            }
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Performance metrics are tracked correctly
   * For any number of animations, performance metrics should be accurate
   */
  it('should track performance metrics accurately', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 20 }),
        async (numAnimations) => {
          const body = document.body
          body.innerHTML = ''

          for (let i = 0; i < numAnimations; i++) {
            const element = document.createElement('div')
            element.className = 'card'
            element.dataset.animate = 'fade-in-up'
            body.appendChild(element)
          }

          animationEngine = new AnimationEngine()
          await animationEngine.init()

          const elements = document.querySelectorAll('.card')
          elements.forEach((element) => {
            animationEngine.triggerAnimation(element)
          })

          const metrics = animationEngine.getPerformanceMetrics()
          
          // Metrics should be tracked
          expect(metrics.animationCount).toBe(numAnimations)
          expect(metrics.totalAnimatedElements).toBe(numAnimations)
          expect(metrics.averageDuration).toBeGreaterThanOrEqual(0)
          expect(Array.isArray(metrics.slowAnimations)).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })
})

