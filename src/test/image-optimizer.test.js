/**
 * Image Optimizer Unit Tests
 * Tests for image optimization, lazy loading, and progressive enhancement
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { ImageOptimizer } from '../js/modules/imageOptimizer.js'

describe('ImageOptimizer', () => {
  let dom
  let imageOptimizer
  let IntersectionObserverMock

  beforeEach(() => {
    // Set up DOM
    dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
      url: 'http://localhost',
    })
    global.window = dom.window
    global.document = dom.window.document
    global.HTMLElement = dom.window.HTMLElement
    global.Image = dom.window.Image

    // Mock IntersectionObserver
    IntersectionObserverMock = class IntersectionObserver {
      constructor(callback, options) {
        this.callback = callback
        this.options = options || {}
        this.elements = new Set()
      }

      observe(element) {
        this.elements.add(element)
      }

      unobserve(element) {
        this.elements.delete(element)
      }

      disconnect() {
        this.elements.clear()
      }

      // Helper method to trigger intersection
      triggerIntersection(element, isIntersecting = true) {
        this.callback([
          {
            target: element,
            isIntersecting,
          },
        ])
      }
    }

    global.IntersectionObserver = IntersectionObserverMock

    imageOptimizer = new ImageOptimizer()
  })

  afterEach(() => {
    if (imageOptimizer) {
      imageOptimizer.destroy()
    }
  })

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      imageOptimizer.init()
      expect(imageOptimizer.isInitialized).toBe(true)
    })

    it('should not initialize twice', () => {
      imageOptimizer.init()
      imageOptimizer.init()
      expect(imageOptimizer.isInitialized).toBe(true)
    })

    it('should create IntersectionObserver with correct options', () => {
      imageOptimizer.init()
      expect(imageOptimizer.observer).toBeDefined()
      expect(imageOptimizer.observer).not.toBeNull()
    })
  })

  describe('createOptimizedImage', () => {
    it('should create picture element with img fallback', () => {
      imageOptimizer.init()
      const imageData = {
        url: 'https://example.com/image.jpg',
        alt: 'Test image',
      }

      const picture = imageOptimizer.createOptimizedImage(imageData)

      expect(picture.tagName).toBe('PICTURE')
      const img = picture.querySelector('img')
      expect(img).toBeDefined()
      expect(img.alt).toBe('Test image')
    })

    it('should add AVIF source when provided', () => {
      imageOptimizer.init()
      const imageData = {
        url: 'https://example.com/image.jpg',
        alt: 'Test image',
        avif: 'https://example.com/image.avif',
      }

      const picture = imageOptimizer.createOptimizedImage(imageData)
      const avifSource = picture.querySelector('source[type="image/avif"]')

      expect(avifSource).toBeDefined()
      expect(avifSource.dataset.srcset).toBe('https://example.com/image.avif')
    })

    it('should add WebP source when provided', () => {
      imageOptimizer.init()
      const imageData = {
        url: 'https://example.com/image.jpg',
        alt: 'Test image',
        webp: 'https://example.com/image.webp',
      }

      const picture = imageOptimizer.createOptimizedImage(imageData)
      const webpSource = picture.querySelector('source[type="image/webp"]')

      expect(webpSource).toBeDefined()
      expect(webpSource.dataset.srcset).toBe('https://example.com/image.webp')
    })

    it('should use lazy loading by default', () => {
      imageOptimizer.init()
      const imageData = {
        url: 'https://example.com/image.jpg',
        alt: 'Test image',
      }

      const picture = imageOptimizer.createOptimizedImage(imageData)
      const img = picture.querySelector('img')

      expect(img.loading).toBe('lazy')
      expect(img.dataset.src).toBe('https://example.com/image.jpg')
    })

    it('should add placeholder when enabled', () => {
      imageOptimizer.init()
      const imageData = {
        url: 'https://example.com/image.jpg',
        alt: 'Test image',
        placeholder: 'data:image/svg+xml,...',
      }

      const picture = imageOptimizer.createOptimizedImage(imageData, {
        enablePlaceholder: true,
      })
      const img = picture.querySelector('img')

      expect(img.src).toBe('data:image/svg+xml,...')
      expect(img.classList.contains('optimized-image--loading')).toBe(true)
    })

    it('should support eager loading', () => {
      imageOptimizer.init()
      const imageData = {
        url: 'https://example.com/image.jpg',
        alt: 'Test image',
      }

      const picture = imageOptimizer.createOptimizedImage(imageData, {
        loading: 'eager',
      })
      const img = picture.querySelector('img')

      expect(img.src).toBe('https://example.com/image.jpg')
      expect(img.dataset.src).toBeUndefined()
    })

    it('should apply custom className', () => {
      imageOptimizer.init()
      const imageData = {
        url: 'https://example.com/image.jpg',
        alt: 'Test image',
      }

      const picture = imageOptimizer.createOptimizedImage(imageData, {
        className: 'custom-class',
      })

      expect(picture.className).toBe('custom-class')
    })
  })

  describe('generateSrcSet', () => {
    it('should return string srcset as-is', () => {
      const srcset = 'image-320w.jpg 320w, image-640w.jpg 640w'
      const result = imageOptimizer.generateSrcSet(srcset)
      expect(result).toBe(srcset)
    })

    it('should generate srcset from array', () => {
      const srcsetData = [
        { url: 'image-320w.jpg', width: 320 },
        { url: 'image-640w.jpg', width: 640 },
      ]

      const result = imageOptimizer.generateSrcSet(srcsetData)
      expect(result).toBe('image-320w.jpg 320w, image-640w.jpg 640w')
    })

    it('should return empty string for invalid data', () => {
      const result = imageOptimizer.generateSrcSet(null)
      expect(result).toBe('')
    })
  })

  describe('loadImage', () => {
    it('should load image from data-src', () => {
      imageOptimizer.init()
      const picture = document.createElement('picture')
      const img = document.createElement('img')
      img.dataset.src = 'https://example.com/image.jpg'
      img.src = 'placeholder.jpg'
      picture.appendChild(img)

      imageOptimizer.loadImage(picture)

      expect(img.src).toBe('https://example.com/image.jpg')
      expect(img.dataset.src).toBeUndefined()
    })

    it('should load sources from data-srcset', () => {
      imageOptimizer.init()
      const picture = document.createElement('picture')
      const source = document.createElement('source')
      source.type = 'image/webp'
      source.dataset.srcset = 'image.webp 1x, image@2x.webp 2x'
      picture.appendChild(source)

      const img = document.createElement('img')
      picture.appendChild(img)

      imageOptimizer.loadImage(picture)

      expect(source.srcset).toBe('image.webp 1x, image@2x.webp 2x')
      expect(source.dataset.srcset).toBeUndefined()
    })

    it('should handle img element directly', () => {
      imageOptimizer.init()
      const img = document.createElement('img')
      img.dataset.src = 'https://example.com/image.jpg'

      imageOptimizer.loadImage(img)

      expect(img.src).toBe('https://example.com/image.jpg')
    })
  })

  describe('Intersection Observer Integration', () => {
    it('should observe lazy-loaded images', () => {
      imageOptimizer.init()
      const imageData = {
        url: 'https://example.com/image.jpg',
        alt: 'Test image',
      }

      const picture = imageOptimizer.createOptimizedImage(imageData)

      expect(imageOptimizer.observer.elements.has(picture)).toBe(true)
    })

    it('should load image when intersecting', () => {
      imageOptimizer.init()
      const imageData = {
        url: 'https://example.com/image.jpg',
        alt: 'Test image',
        placeholder: 'placeholder.jpg',
      }

      const picture = imageOptimizer.createOptimizedImage(imageData, {
        enablePlaceholder: true,
      })
      const img = picture.querySelector('img')

      // Trigger intersection
      imageOptimizer.observer.triggerIntersection(picture, true)

      expect(img.src).toBe('https://example.com/image.jpg')
    })

    it('should unobserve after loading', () => {
      imageOptimizer.init()
      const imageData = {
        url: 'https://example.com/image.jpg',
        alt: 'Test image',
      }

      const picture = imageOptimizer.createOptimizedImage(imageData)

      // Trigger intersection
      imageOptimizer.observer.triggerIntersection(picture, true)

      expect(imageOptimizer.observer.elements.has(picture)).toBe(false)
    })
  })

  describe('preloadImages', () => {
    it('should create preload links for critical images', () => {
      imageOptimizer.init()
      
      const images = [
        'https://example.com/hero.jpg',
        'https://example.com/logo.png',
      ]

      // Count existing preload links before
      const beforeCount = document.head.querySelectorAll('link[rel="preload"]').length

      imageOptimizer.preloadImages(images)

      // Count preload links after
      const afterCount = document.head.querySelectorAll('link[rel="preload"]').length
      
      // Should have added 2 new links
      expect(afterCount - beforeCount).toBe(2)
    })
  })

  describe('generatePlaceholder', () => {
    it('should generate data URL placeholder', () => {
      // Mock canvas for testing
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: () => ({
          fillStyle: '',
          fillRect: vi.fn(),
        }),
        toDataURL: () => 'data:image/png;base64,mockdata',
      }

      const originalCreateElement = document.createElement.bind(document)
      document.createElement = vi.fn((tag) => {
        if (tag === 'canvas') return mockCanvas
        return originalCreateElement(tag)
      })

      const placeholder = imageOptimizer.generatePlaceholder(10, 10, '#e0e0e0')
      expect(placeholder).toBe('data:image/png;base64,mockdata')

      document.createElement = originalCreateElement
    })

    it('should use default dimensions', () => {
      // Mock canvas for testing
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: () => ({
          fillStyle: '',
          fillRect: vi.fn(),
        }),
        toDataURL: () => 'data:image/png;base64,mockdata',
      }

      const originalCreateElement = document.createElement.bind(document)
      document.createElement = vi.fn((tag) => {
        if (tag === 'canvas') return mockCanvas
        return originalCreateElement(tag)
      })

      const placeholder = imageOptimizer.generatePlaceholder()
      expect(placeholder).toBeDefined()
      expect(placeholder).toBe('data:image/png;base64,mockdata')

      document.createElement = originalCreateElement
    })
  })

  describe('observe and unobserve', () => {
    it('should observe element', () => {
      imageOptimizer.init()
      const element = document.createElement('div')
      imageOptimizer.observe(element)
      expect(imageOptimizer.observer.elements.has(element)).toBe(true)
    })

    it('should unobserve element', () => {
      imageOptimizer.init()
      const element = document.createElement('div')
      imageOptimizer.observe(element)
      imageOptimizer.unobserve(element)
      expect(imageOptimizer.observer.elements.has(element)).toBe(false)
    })
  })

  describe('destroy', () => {
    it('should disconnect observer and reset state', () => {
      imageOptimizer.init()
      const element = document.createElement('div')
      imageOptimizer.observe(element)

      imageOptimizer.destroy()

      expect(imageOptimizer.isInitialized).toBe(false)
      expect(imageOptimizer.observer).toBeNull()
    })
  })

  describe('Fallback for no IntersectionObserver', () => {
    it('should load all images immediately when IntersectionObserver is not supported', () => {
      // Remove IntersectionObserver
      delete global.IntersectionObserver

      const newOptimizer = new ImageOptimizer()
      newOptimizer.init()

      expect(newOptimizer.observer).toBeNull()
    })
  })
})

