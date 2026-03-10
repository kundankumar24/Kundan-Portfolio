/**
 * Image Optimizer Module
 * Handles image optimization, lazy loading, and progressive enhancement
 */

import { logger } from '../utils/logger.js'

export class ImageOptimizer {
  constructor(config = {}) {
    this.config = {
      rootMargin: '50px',
      threshold: 0.01,
      enableProgressiveLoading: true,
      formats: ['avif', 'webp', 'jpg'],
      ...config,
    }

    this.observer = null
    this.isInitialized = false
  }

  /**
   * Initialize image optimizer
   */
  init() {
    if (this.isInitialized) {
      logger.warn('ImageOptimizer already initialized')
      return
    }

    try {
      this.setupIntersectionObserver()
      this.isInitialized = true
      logger.info('ImageOptimizer initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize ImageOptimizer:', error)
      throw error
    }
  }

  /**
   * Set up Intersection Observer for lazy loading
   */
  setupIntersectionObserver() {
    const IntersectionObserverConstructor = 
      (typeof window !== 'undefined' && window.IntersectionObserver) ||
      (typeof global !== 'undefined' && global.IntersectionObserver)

    if (!IntersectionObserverConstructor) {
      logger.warn('IntersectionObserver not supported, loading all images immediately')
      this.loadAllImages()
      return
    }

    this.observer = new IntersectionObserverConstructor(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target)
            this.observer.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: this.config.rootMargin,
        threshold: this.config.threshold,
      }
    )
  }

  /**
   * Create optimized image element with multiple formats
   * @param {Object} imageData - Image data object
   * @param {Object} options - Image options
   * @returns {HTMLElement} Picture element with sources
   */
  createOptimizedImage(imageData, options = {}) {
    const {
      sizes = '100vw',
      loading = 'lazy',
      className = '',
      enablePlaceholder = this.config.enableProgressiveLoading,
    } = options

    const picture = document.createElement('picture')
    picture.className = className

    // Add sources for modern formats
    if (imageData.avif) {
      const avifSource = document.createElement('source')
      avifSource.type = 'image/avif'
      avifSource.dataset.srcset = this.generateSrcSet(imageData.avif)
      avifSource.sizes = sizes
      picture.appendChild(avifSource)
    }

    if (imageData.webp) {
      const webpSource = document.createElement('source')
      webpSource.type = 'image/webp'
      webpSource.dataset.srcset = this.generateSrcSet(imageData.webp)
      webpSource.sizes = sizes
      picture.appendChild(webpSource)
    }

    // Fallback img element
    const img = document.createElement('img')
    img.alt = imageData.alt || ''
    img.className = 'optimized-image'
    
    if (loading === 'lazy') {
      img.loading = 'lazy'
      img.dataset.src = imageData.url
      
      if (enablePlaceholder && imageData.placeholder) {
        img.src = imageData.placeholder
        img.classList.add('optimized-image--loading')
      }
    } else {
      img.src = imageData.url
    }

    if (imageData.srcset) {
      img.dataset.srcset = this.generateSrcSet(imageData.srcset)
      img.sizes = sizes
    }

    picture.appendChild(img)

    // Observe for lazy loading
    if (loading === 'lazy' && this.observer) {
      this.observer.observe(picture)
    }

    return picture
  }

  /**
   * Generate srcset string from image data
   * @param {Object|string} srcsetData - Srcset data
   * @returns {string} Srcset string
   */
  generateSrcSet(srcsetData) {
    if (typeof srcsetData === 'string') {
      return srcsetData
    }

    if (Array.isArray(srcsetData)) {
      return srcsetData.map((src) => `${src.url} ${src.width}w`).join(', ')
    }

    return ''
  }

  /**
   * Load image when it enters viewport
   * @param {HTMLElement} element - Picture or img element
   */
  loadImage(element) {
    const img = element.tagName === 'IMG' ? element : element.querySelector('img')
    const sources = element.querySelectorAll('source')

    if (!img) return

    // Load sources
    sources.forEach((source) => {
      if (source.dataset.srcset) {
        source.srcset = source.dataset.srcset
        delete source.dataset.srcset
      }
    })

    // Load img
    if (img.dataset.src) {
      const originalSrc = img.src
      img.src = img.dataset.src
      delete img.dataset.src

      // Handle progressive loading
      if (originalSrc && originalSrc !== img.dataset.src) {
        img.addEventListener('load', () => {
          img.classList.remove('optimized-image--loading')
          img.classList.add('optimized-image--loaded')
        }, { once: true })

        img.addEventListener('error', () => {
          logger.error(`Failed to load image: ${img.dataset.src}`)
          img.classList.remove('optimized-image--loading')
          img.classList.add('optimized-image--error')
        }, { once: true })
      }
    }

    if (img.dataset.srcset) {
      img.srcset = img.dataset.srcset
      img.sizes = img.sizes || '100vw'
      delete img.dataset.srcset
    }
  }

  /**
   * Load all images immediately (fallback for no IntersectionObserver)
   */
  loadAllImages() {
    const lazyImages = document.querySelectorAll('[data-src]')
    lazyImages.forEach((img) => {
      this.loadImage(img.closest('picture') || img)
    })
  }

  /**
   * Observe new images for lazy loading
   * @param {HTMLElement} element - Element to observe
   */
  observe(element) {
    if (this.observer) {
      this.observer.observe(element)
    }
  }

  /**
   * Unobserve element
   * @param {HTMLElement} element - Element to unobserve
   */
  unobserve(element) {
    if (this.observer) {
      this.observer.unobserve(element)
    }
  }

  /**
   * Preload critical images
   * @param {Array} images - Array of image URLs to preload
   */
  preloadImages(images) {
    images.forEach((imageUrl) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = imageUrl
      document.head.appendChild(link)
    })

    logger.info(`Preloaded ${images.length} critical images`)
  }

  /**
   * Generate placeholder data URL
   * @param {number} width - Placeholder width
   * @param {number} height - Placeholder height
   * @param {string} color - Placeholder color
   * @returns {string} Data URL
   */
  generatePlaceholder(width = 10, height = 10, color = '#e0e0e0') {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = color
    ctx.fillRect(0, 0, width, height)
    return canvas.toDataURL()
  }

  /**
   * Destroy image optimizer
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    this.isInitialized = false
    logger.info('ImageOptimizer destroyed')
  }
}
