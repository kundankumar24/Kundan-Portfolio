/**
 * Lightbox Component
 * Displays images in a full-screen overlay with zoom and navigation
 */

import { logger } from '../utils/logger.js'

export class Lightbox {
  constructor() {
    this.lightbox = null
    this.images = []
    this.currentIndex = 0
    this.isOpen = false

    // Bind methods
    this.open = this.open.bind(this)
    this.close = this.close.bind(this)
    this.next = this.next.bind(this)
    this.prev = this.prev.bind(this)
    this.handleKeydown = this.handleKeydown.bind(this)
    this.handleBackdropClick = this.handleBackdropClick.bind(this)
  }

  /**
   * Initialize the lightbox
   */
  init() {
    this.createLightbox()
    this.attachEventListeners()
    logger.info('Lightbox initialized')
  }

  /**
   * Create lightbox element
   */
  createLightbox() {
    this.lightbox = document.createElement('div')
    this.lightbox.className = 'lightbox'
    this.lightbox.setAttribute('role', 'dialog')
    this.lightbox.setAttribute('aria-modal', 'true')
    this.lightbox.setAttribute('aria-label', 'Image gallery')
    this.lightbox.innerHTML = `
      <div class="lightbox__backdrop"></div>
      <div class="lightbox__container">
        <button 
          class="lightbox__close" 
          aria-label="Close lightbox"
          type="button"
        >
          <span aria-hidden="true">&times;</span>
        </button>
        <button 
          class="lightbox__nav lightbox__nav--prev" 
          aria-label="Previous image"
          type="button"
        >
          <span aria-hidden="true">&lsaquo;</span>
        </button>
        <button 
          class="lightbox__nav lightbox__nav--next" 
          aria-label="Next image"
          type="button"
        >
          <span aria-hidden="true">&rsaquo;</span>
        </button>
        <div class="lightbox__content">
          <img 
            class="lightbox__image" 
            src="" 
            alt=""
          />
          <div class="lightbox__caption"></div>
        </div>
        <div class="lightbox__counter"></div>
      </div>
    `

    document.body.appendChild(this.lightbox)
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    const closeBtn = this.lightbox.querySelector('.lightbox__close')
    closeBtn.addEventListener('click', this.close)

    // Navigation buttons
    const prevBtn = this.lightbox.querySelector('.lightbox__nav--prev')
    const nextBtn = this.lightbox.querySelector('.lightbox__nav--next')
    prevBtn.addEventListener('click', this.prev)
    nextBtn.addEventListener('click', this.next)

    // Backdrop click
    const backdrop = this.lightbox.querySelector('.lightbox__backdrop')
    backdrop.addEventListener('click', this.handleBackdropClick)

    // Keyboard events
    document.addEventListener('keydown', this.handleKeydown)
  }

  /**
   * Open lightbox with images
   * @param {Array} images - Array of image objects {url, alt}
   * @param {number} startIndex - Starting image index
   */
  open(images, startIndex = 0) {
    if (!images || images.length === 0) {
      logger.warn('No images provided to lightbox')
      return
    }

    this.images = images
    this.currentIndex = startIndex
    this.isOpen = true

    this.showImage(this.currentIndex)
    this.updateNavigation()
    
    this.lightbox.classList.add('lightbox--open')
    document.body.classList.add('lightbox-open')

    logger.info(`Opened lightbox with ${images.length} images`)
  }

  /**
   * Close lightbox
   */
  close() {
    this.lightbox.classList.remove('lightbox--open')
    document.body.classList.remove('lightbox-open')
    this.isOpen = false
    this.images = []
    this.currentIndex = 0

    logger.info('Closed lightbox')
  }

  /**
   * Show next image
   */
  next() {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++
      this.showImage(this.currentIndex)
      this.updateNavigation()
    }
  }

  /**
   * Show previous image
   */
  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--
      this.showImage(this.currentIndex)
      this.updateNavigation()
    }
  }

  /**
   * Show image at index
   * @param {number} index - Image index
   */
  showImage(index) {
    const image = this.images[index]
    const imgElement = this.lightbox.querySelector('.lightbox__image')
    const captionElement = this.lightbox.querySelector('.lightbox__caption')
    const counterElement = this.lightbox.querySelector('.lightbox__counter')

    // Update image
    imgElement.src = image.url
    imgElement.alt = image.alt

    // Update caption
    captionElement.textContent = image.alt

    // Update counter
    counterElement.textContent = `${index + 1} / ${this.images.length}`
  }

  /**
   * Update navigation button states
   */
  updateNavigation() {
    const prevBtn = this.lightbox.querySelector('.lightbox__nav--prev')
    const nextBtn = this.lightbox.querySelector('.lightbox__nav--next')

    // Disable prev button on first image
    if (this.currentIndex === 0) {
      prevBtn.disabled = true
      prevBtn.setAttribute('aria-disabled', 'true')
    } else {
      prevBtn.disabled = false
      prevBtn.setAttribute('aria-disabled', 'false')
    }

    // Disable next button on last image
    if (this.currentIndex === this.images.length - 1) {
      nextBtn.disabled = true
      nextBtn.setAttribute('aria-disabled', 'true')
    } else {
      nextBtn.disabled = false
      nextBtn.setAttribute('aria-disabled', 'false')
    }
  }

  /**
   * Handle backdrop click
   * @param {Event} e - Click event
   */
  handleBackdropClick(e) {
    if (e.target.classList.contains('lightbox__backdrop')) {
      this.close()
    }
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeydown(e) {
    if (!this.isOpen) {
      return
    }

    switch (e.key) {
    case 'Escape':
      this.close()
      break
    case 'ArrowLeft':
      this.prev()
      break
    case 'ArrowRight':
      this.next()
      break
    }
  }

  /**
   * Destroy the lightbox
   */
  destroy() {
    if (this.lightbox) {
      this.lightbox.remove()
    }

    document.removeEventListener('keydown', this.handleKeydown)

    logger.info('Lightbox destroyed')
  }
}
