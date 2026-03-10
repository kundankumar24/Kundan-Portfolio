/**
 * Animation Engine Unit Tests
 * Tests for the animation engine functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { AnimationEngine } from '../js/modules/animation.js'

describe('AnimationEngine', () => {
  let dom
  let animationEngine

  beforeEach(() => {
    // Set up DOM
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head></head>
        <body>
          <div class="card" data-animate="fade-in-up">Card 1</div>
          <div class="card">Card 2</div>
          <button class="btn primary">Click Me</button>
          <a href="#" class="nav-link">Home</a>
          <input type="text" class="form-input" />
        </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true,
    })

    global.window = dom.window
    global.document = dom.window.document
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

    animationEngine = new AnimationEngine()
  })

  afterEach(() => {
    if (animationEngine) {
      animationEngine.destroy()
    }
  })

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await animationEngine.init()
      expect(animationEngine.isInitialized).toBe(true)
    })

    it('should respect reduced motion preferences', async () => {
      global.window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
      }))

      const engine = new AnimationEngine()
      await engine.init()
      expect(engine.respectsReducedMotion).toBe(true)
      expect(document.documentElement.classList.contains('reduce-motion')).toBe(true)
      engine.destroy()
    })

    it('should set up intersection observer', async () => {
      await animationEngine.init()
      expect(animationEngine.observers.has('scroll')).toBe(true)
    })
  })

  describe('Scroll Animations', () => {
    it('should observe elements with data-animate attribute', async () => {
      await animationEngine.init()
      const cards = document.querySelectorAll('.card')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('should add animate-on-scroll class to elements', async () => {
      await animationEngine.init()
      const card = document.querySelector('.card')
      expect(card.classList.contains('animate-on-scroll')).toBe(true)
    })

    it('should trigger animation on element', async () => {
      await animationEngine.init()
      const card = document.querySelector('.card')
      animationEngine.triggerAnimation(card)
      expect(card.classList.contains('animated')).toBe(true)
      expect(animationEngine.animatedElements.has(card)).toBe(true)
    })

    it('should not trigger animation twice on same element', async () => {
      await animationEngine.init()
      const card = document.querySelector('.card')
      animationEngine.triggerAnimation(card)
      const firstSize = animationEngine.animatedElements.size
      animationEngine.triggerAnimation(card)
      expect(animationEngine.animatedElements.size).toBe(firstSize)
    })

    it('should use custom animation type from data attribute', async () => {
      await animationEngine.init()
      const card = document.querySelector('[data-animate="fade-in-up"]')
      animationEngine.triggerAnimation(card)
      expect(card.classList.contains('fade-in-up')).toBe(true)
    })
  })

  describe('Hover States', () => {
    it('should add hover effect to cards', async () => {
      await animationEngine.init()
      const card = document.querySelector('.card')
      
      // Simulate mouseenter
      const mouseEnterEvent = new dom.window.MouseEvent('mouseenter')
      card.dispatchEvent(mouseEnterEvent)
      expect(card.classList.contains('card-hover')).toBe(true)
      
      // Simulate mouseleave
      const mouseLeaveEvent = new dom.window.MouseEvent('mouseleave')
      card.dispatchEvent(mouseLeaveEvent)
      expect(card.classList.contains('card-hover')).toBe(false)
    })

    it('should add hover effect to buttons', async () => {
      await animationEngine.init()
      const button = document.querySelector('.btn')
      
      const mouseEnterEvent = new dom.window.MouseEvent('mouseenter')
      button.dispatchEvent(mouseEnterEvent)
      expect(button.classList.contains('btn-hover')).toBe(true)
    })

    it('should not add hover effects when reduced motion is enabled', async () => {
      global.window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
      }))

      const engine = new AnimationEngine()
      await engine.init()
      
      const card = document.querySelector('.card')
      const mouseEnterEvent = new dom.window.MouseEvent('mouseenter')
      card.dispatchEvent(mouseEnterEvent)
      expect(card.classList.contains('card-hover')).toBe(false)
      
      engine.destroy()
    })
  })

  describe('Micro-interactions', () => {
    it('should create ripple effect on button click', async () => {
      await animationEngine.init()
      const button = document.querySelector('.btn')
      
      const clickEvent = new dom.window.MouseEvent('click', {
        clientX: 100,
        clientY: 100,
      })
      button.dispatchEvent(clickEvent)
      
      const ripple = button.querySelector('.ripple')
      expect(ripple).toBeTruthy()
    })

    it('should add focus class to form inputs', async () => {
      await animationEngine.init()
      const input = document.querySelector('.form-input')
      
      const focusEvent = new dom.window.FocusEvent('focus')
      input.dispatchEvent(focusEvent)
      expect(input.parentElement?.classList.contains('input-focused')).toBe(true)
      
      const blurEvent = new dom.window.FocusEvent('blur')
      input.dispatchEvent(blurEvent)
      expect(input.parentElement?.classList.contains('input-focused')).toBe(false)
    })

    it('should not create ripple when reduced motion is enabled', async () => {
      global.window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
      }))

      const engine = new AnimationEngine()
      await engine.init()
      
      const button = document.querySelector('.btn')
      const clickEvent = new dom.window.MouseEvent('click', {
        clientX: 100,
        clientY: 100,
      })
      button.dispatchEvent(clickEvent)
      
      const ripple = button.querySelector('.ripple')
      expect(ripple).toBeFalsy()
      
      engine.destroy()
    })
  })

  describe('Custom Animations', () => {
    it('should register custom animation', async () => {
      await animationEngine.init()
      const customAnimation = vi.fn()
      animationEngine.registerAnimation('custom', customAnimation)
      expect(animationEngine.registeredAnimations.has('custom')).toBe(true)
    })

    it('should play registered animation', async () => {
      await animationEngine.init()
      const customAnimation = vi.fn()
      animationEngine.registerAnimation('custom', customAnimation)
      
      const element = document.querySelector('.card')
      animationEngine.playAnimation('custom', element)
      expect(customAnimation).toHaveBeenCalledWith(element, {})
    })

    it('should not play animation when reduced motion is enabled', async () => {
      global.window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
      }))

      const engine = new AnimationEngine()
      await engine.init()
      
      const customAnimation = vi.fn()
      engine.registerAnimation('custom', customAnimation)
      
      const element = document.querySelector('.card')
      engine.playAnimation('custom', element)
      expect(customAnimation).not.toHaveBeenCalled()
      
      engine.destroy()
    })

    it('should force play animation even with reduced motion', async () => {
      global.window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
      }))

      const engine = new AnimationEngine()
      await engine.init()
      
      const customAnimation = vi.fn()
      engine.registerAnimation('custom', customAnimation)
      
      const element = document.querySelector('.card')
      engine.playAnimation('custom', element, { force: true })
      expect(customAnimation).toHaveBeenCalled()
      
      engine.destroy()
    })
  })

  describe('Animation Control', () => {
    it('should pause all animations', async () => {
      await animationEngine.init()
      animationEngine.pauseAnimations()
      expect(document.documentElement.classList.contains('animations-paused')).toBe(true)
    })

    it('should resume all animations', async () => {
      await animationEngine.init()
      animationEngine.pauseAnimations()
      animationEngine.resumeAnimations()
      expect(document.documentElement.classList.contains('animations-paused')).toBe(false)
    })
  })

  describe('Cleanup', () => {
    it('should disconnect observers on destroy', async () => {
      await animationEngine.init()
      const observer = animationEngine.observers.get('scroll')
      const disconnectSpy = vi.spyOn(observer, 'disconnect')
      
      animationEngine.destroy()
      expect(disconnectSpy).toHaveBeenCalled()
      expect(animationEngine.observers.size).toBe(0)
    })

    it('should clear tracked elements on destroy', async () => {
      await animationEngine.init()
      const card = document.querySelector('.card')
      animationEngine.triggerAnimation(card)
      
      animationEngine.destroy()
      expect(animationEngine.animatedElements.size).toBe(0)
      expect(animationEngine.registeredAnimations.size).toBe(0)
    })

    it('should remove classes on destroy', async () => {
      global.window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
      }))

      const engine = new AnimationEngine()
      await engine.init()
      engine.pauseAnimations()
      
      engine.destroy()
      expect(document.documentElement.classList.contains('reduce-motion')).toBe(false)
      expect(document.documentElement.classList.contains('animations-paused')).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing elements gracefully', async () => {
      const emptyDom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
      global.document = emptyDom.window.document
      
      const engine = new AnimationEngine()
      await expect(engine.init()).resolves.not.toThrow()
      engine.destroy()
    })

    it('should handle animation duration parsing', async () => {
      await animationEngine.init()
      const element = document.createElement('div')
      const duration = animationEngine.getAnimationDuration(element)
      expect(duration).toBe(300) // default duration
    })

    it('should handle resize events', async () => {
      await animationEngine.init()
      expect(() => animationEngine.handleResize()).not.toThrow()
    })

    it('should handle scroll events', async () => {
      await animationEngine.init()
      expect(() => animationEngine.handleScroll()).not.toThrow()
    })
  })
})

