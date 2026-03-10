/**
 * Motion Sensitivity Property-Based Tests
 * Feature: portfolio-enhancement, Property 9: Motion Sensitivity Respect
 * 
 * **Validates: Requirements 7.5**
 * 
 * Property 9: Motion Sensitivity Respect
 * For any user with prefers-reduced-motion settings, animations should be 
 * disabled or significantly reduced while maintaining functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import fc from 'fast-check'
import { AnimationEngine } from '../js/modules/animation.js'

describe('Property 9: Motion Sensitivity Respect', () => {
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
   * Property: Reduced motion preference is respected
   * For any reduced motion setting, the animation engine should respect it
   */
  it('should respect reduced motion preference for any configuration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(), // reduced motion enabled or not
        fc.array(
          fc.record({
            tag: fc.constantFrom('div', 'section', 'button'),
            className: fc.constantFrom('card', 'btn', 'hero-content'),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (reducedMotion, elementConfigs) => {
          // Mock matchMedia for reduced motion
          global.window.matchMedia = vi.fn().mockImplementation((query) => ({
            matches: reducedMotion && query === '(prefers-reduced-motion: reduce)',
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          }))

          // Create elements
          const body = document.body
          body.innerHTML = ''
          elementConfigs.forEach((config) => {
            const element = document.createElement(config.tag)
            element.className = config.className
            body.appendChild(element)
          })

          // Initialize animation engine
          animationEngine = new AnimationEngine()
          await animationEngine.init()

          // Verify reduced motion state
          expect(animationEngine.respectsReducedMotion).toBe(reducedMotion)

          // Verify document class
          if (reducedMotion) {
            expect(document.documentElement.classList.contains('reduce-motion')).toBe(true)
          } else {
            expect(document.documentElement.classList.contains('reduce-motion')).toBe(false)
          }

          // Clean up for next iteration
          animationEngine.destroy()
          animationEngine = null
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Hover effects are disabled with reduced motion
   * For any element with hover effects, they should be disabled when reduced motion is enabled
   */
  it('should disable hover effects when reduced motion is enabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            className: fc.constantFrom('card', 'btn', 'nav-link'),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (elementConfigs) => {
          // Enable reduced motion
          global.window.matchMedia = vi.fn().mockImplementation((query) => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          }))

          // Create elements
          const body = document.body
          body.innerHTML = ''
          elementConfigs.forEach((config) => {
            const element = document.createElement('div')
            element.className = config.className
            body.appendChild(element)
          })

          animationEngine = new AnimationEngine()
          await animationEngine.init()

          // Verify hover effects are not added
          const elements = document.querySelectorAll('.card, .btn, .nav-link')
          elements.forEach((element) => {
            const mouseEnterEvent = new dom.window.MouseEvent('mouseenter')
            element.dispatchEvent(mouseEnterEvent)

            // Hover classes should not be added when reduced motion is enabled
            expect(element.classList.contains('card-hover')).toBe(false)
            expect(element.classList.contains('btn-hover')).toBe(false)
            expect(element.classList.contains('nav-link-hover')).toBe(false)
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Ripple effects are disabled with reduced motion
   * For any click interaction, ripple effects should not be created when reduced motion is enabled
   */
  it('should disable ripple effects when reduced motion is enabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            tag: fc.constantFrom('button', 'div'),
            className: fc.constantFrom('btn', 'card'),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (elementConfigs) => {
          // Enable reduced motion
          global.window.matchMedia = vi.fn().mockImplementation((query) => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          }))

          // Create elements
          const body = document.body
          body.innerHTML = ''
          elementConfigs.forEach((config) => {
            const element = document.createElement(config.tag)
            element.className = config.className
            body.appendChild(element)
          })

          animationEngine = new AnimationEngine()
          await animationEngine.init()

          // Test click interactions
          const elements = document.querySelectorAll('.btn, .card')
          elements.forEach((element) => {
            const clickEvent = new dom.window.MouseEvent('click', {
              clientX: 50,
              clientY: 50,
            })
            element.dispatchEvent(clickEvent)

            // Ripple should not be created
            const ripple = element.querySelector('.ripple')
            expect(ripple).toBeFalsy()
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Parallax effects are disabled with reduced motion
   * For any parallax configuration, effects should not be applied when reduced motion is enabled
   */
  it('should disable parallax effects when reduced motion is enabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            speed: fc.float({ min: Math.fround(0.1), max: Math.fround(2.0), noNaN: true }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (parallaxConfigs) => {
          // Enable reduced motion
          global.window.matchMedia = vi.fn().mockImplementation((query) => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          }))

          // Create elements
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

          // Parallax elements should not be registered when reduced motion is enabled
          expect(animationEngine.parallaxElements.length).toBe(0)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Custom animations respect reduced motion
   * For any custom animation, it should not play when reduced motion is enabled (unless forced)
   */
  it('should not play custom animations when reduced motion is enabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.string({ minLength: 1, maxLength: 20 }),
          { minLength: 1, maxLength: 10 }
        ),
        async (animationNames) => {
          // Enable reduced motion
          global.window.matchMedia = vi.fn().mockImplementation((query) => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          }))

          const body = document.body
          body.innerHTML = '<div class="test-element"></div>'

          animationEngine = new AnimationEngine()
          await animationEngine.init()

          const element = document.querySelector('.test-element')
          const executionTracker = {}

          // Register animations
          animationNames.forEach((name) => {
            executionTracker[name] = false
            const callback = vi.fn(() => {
              executionTracker[name] = true
            })
            animationEngine.registerAnimation(name, callback)
          })

          // Try to play animations (should not execute)
          animationNames.forEach((name) => {
            animationEngine.playAnimation(name, element)
            expect(executionTracker[name]).toBe(false)
          })

          // But should execute when forced
          animationNames.forEach((name) => {
            animationEngine.playAnimation(name, element, { force: true })
            expect(executionTracker[name]).toBe(true)
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Smooth scrolling respects reduced motion
   * For any anchor link, smooth scrolling should be disabled when reduced motion is enabled
   */
  it('should use instant scrolling when reduced motion is enabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 10 }).map(s => 
              'id-' + s.replace(/[^a-zA-Z0-9]/g, '') || 'default'
            ), // Generate valid CSS IDs
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (sectionConfigs) => {
          // Enable reduced motion
          global.window.matchMedia = vi.fn().mockImplementation((query) => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          }))

          // Create sections and links
          const body = document.body
          body.innerHTML = ''
          
          sectionConfigs.forEach((config) => {
            const section = document.createElement('section')
            section.id = config.id
            section.style.height = '500px'
            body.appendChild(section)

            const link = document.createElement('a')
            link.href = `#${config.id}`
            link.textContent = `Link to ${config.id}`
            body.appendChild(link)
          })

          // Mock scrollIntoView
          const scrollIntoViewMock = vi.fn()
          document.querySelectorAll('section').forEach((section) => {
            section.scrollIntoView = scrollIntoViewMock
          })

          animationEngine = new AnimationEngine()
          await animationEngine.init()

          // Click links and verify scroll behavior
          const links = document.querySelectorAll('a[href^="#"]')
          links.forEach((link) => {
            const clickEvent = new dom.window.MouseEvent('click', {
              bubbles: true,
              cancelable: true,
            })
            
            // Prevent default is called in the handler
            clickEvent.preventDefault = vi.fn()
            
            link.dispatchEvent(clickEvent)
          })

          // Verify scrollIntoView was called with 'auto' behavior (not 'smooth')
          if (scrollIntoViewMock.mock.calls.length > 0) {
            scrollIntoViewMock.mock.calls.forEach((call) => {
              expect(call[0].behavior).toBe('auto')
            })
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Motion preference changes are detected
   * For any motion preference change, the engine should update its state
   */
  it('should detect and respond to motion preference changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 5 }),
        async (preferenceSequence) => {
          let currentPreference = false
          const listeners = []

          // Mock matchMedia with dynamic preference
          global.window.matchMedia = vi.fn().mockImplementation((query) => {
            const mediaQuery = {
              matches: currentPreference && query === '(prefers-reduced-motion: reduce)',
              media: query,
              addEventListener: vi.fn((event, handler) => {
                if (event === 'change') {
                  listeners.push(handler)
                }
              }),
              removeEventListener: vi.fn(),
            }
            return mediaQuery
          })

          const body = document.body
          body.innerHTML = '<div class="card">Test</div>'

          animationEngine = new AnimationEngine()
          await animationEngine.init()

          // Simulate preference changes
          for (const newPreference of preferenceSequence) {
            const oldPreference = currentPreference
            currentPreference = newPreference

            // Trigger change event
            if (listeners.length > 0 && oldPreference !== newPreference) {
              listeners.forEach((listener) => {
                listener({ matches: currentPreference })
              })

              // Verify state updated
              expect(animationEngine.respectsReducedMotion).toBe(currentPreference)

              // Verify document class
              if (currentPreference) {
                expect(document.documentElement.classList.contains('reduce-motion')).toBe(true)
              } else {
                expect(document.documentElement.classList.contains('reduce-motion')).toBe(false)
              }
            }
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Functionality is maintained with reduced motion
   * For any interaction, core functionality should work even with reduced motion enabled
   */
  it('should maintain functionality when reduced motion is enabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            className: fc.constantFrom('card', 'btn'),
            hasAnimation: fc.boolean(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (elementConfigs) => {
          // Enable reduced motion
          global.window.matchMedia = vi.fn().mockImplementation((query) => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          }))

          // Create elements
          const body = document.body
          body.innerHTML = ''
          elementConfigs.forEach((config) => {
            const element = document.createElement('div')
            element.className = config.className
            if (config.hasAnimation) {
              element.dataset.animate = 'fade-in-up'
            }
            body.appendChild(element)
          })

          animationEngine = new AnimationEngine()
          await animationEngine.init()

          // Verify engine is initialized and functional
          expect(animationEngine.isInitialized).toBe(true)

          // Verify elements are present and accessible
          const elements = document.querySelectorAll('.card, .btn')
          expect(elements.length).toBe(elementConfigs.length)

          // Verify animations can be triggered (even if they don't visually animate)
          elements.forEach((element) => {
            expect(() => animationEngine.triggerAnimation(element)).not.toThrow()
          })

          // Verify performance metrics are tracked
          const metrics = animationEngine.getPerformanceMetrics()
          expect(metrics.reducedMotionEnabled).toBe(true)
          expect(metrics).toHaveProperty('animationCount')
          expect(metrics).toHaveProperty('averageDuration')
        }
      ),
      { numRuns: 50 }
    )
  })
})

