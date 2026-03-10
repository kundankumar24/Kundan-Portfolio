/**
 * Utility Helper Functions
 * Common utility functions used throughout the application
 */

/**
 * Debounce function - delays execution until after delay has passed since last call
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
  let timeoutId

  return function debounced(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

/**
 * Throttle function - limits execution to once per interval
 * @param {Function} func - Function to throttle
 * @param {number} interval - Interval in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, interval) {
  let lastCall = 0

  return function throttled(...args) {
    const now = Date.now()

    if (now - lastCall >= interval) {
      lastCall = now
      return func.apply(this, args)
    }
  }
}

/**
 * Check if an element is in the viewport
 * @param {Element} element - Element to check
 * @param {number} threshold - Threshold percentage (0-1)
 * @returns {boolean} True if element is in viewport
 */
export function isInViewport(element, threshold = 0) {
  if (!element) {
    return false
  }

  const rect = element.getBoundingClientRect()
  const windowHeight =
    window.innerHeight || document.documentElement.clientHeight
  const windowWidth = window.innerWidth || document.documentElement.clientWidth

  const verticalThreshold = windowHeight * threshold
  const horizontalThreshold = windowWidth * threshold

  return (
    rect.top >= -verticalThreshold &&
    rect.left >= -horizontalThreshold &&
    rect.bottom <= windowHeight + verticalThreshold &&
    rect.right <= windowWidth + horizontalThreshold
  )
}

/**
 * Smooth scroll to element
 * @param {Element|string} target - Element or selector to scroll to
 * @param {Object} options - Scroll options
 */
export function scrollToElement(target, options = {}) {
  const element =
    typeof target === 'string' ? document.querySelector(target) : target

  if (!element) {
    return
  }

  const defaultOptions = {
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest',
    offset: 0,
  }

  const config = { ...defaultOptions, ...options }

  // Calculate position with offset
  const elementPosition =
    element.getBoundingClientRect().top + window.pageYOffset
  const offsetPosition = elementPosition - config.offset

  window.scrollTo({
    top: offsetPosition,
    behavior: config.behavior,
  })
}

/**
 * Get scroll position
 * @returns {Object} Scroll position {x, y}
 */
export function getScrollPosition() {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop,
  }
}

/**
 * Get viewport dimensions
 * @returns {Object} Viewport dimensions {width, height}
 */
export function getViewportDimensions() {
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
  }
}

/**
 * Check if device supports touch
 * @returns {boolean} True if touch is supported
 */
export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * Check if user prefers reduced motion
 * @returns {boolean} True if reduced motion is preferred
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Generate unique ID
 * @param {string} prefix - Optional prefix
 * @returns {string} Unique ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Clamp a number between min and max values
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Linear interpolation between two values
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} progress - Progress (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(start, end, progress) {
  return start + (end - start) * progress
}

/**
 * Map a value from one range to another
 * @param {number} value - Value to map
 * @param {number} inMin - Input minimum
 * @param {number} inMax - Input maximum
 * @param {number} outMin - Output minimum
 * @param {number} outMax - Output maximum
 * @returns {number} Mapped value
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Convert string to kebab-case
 * @param {string} str - String to convert
 * @returns {string} Kebab-case string
 */
export function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * Wait for specified time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after delay
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Load image and return promise
 * @param {string} src - Image source URL
 * @returns {Promise<HTMLImageElement>} Promise that resolves with loaded image
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Promise that resolves with success status
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      return success
    }
  } catch (error) {
    console.error('Failed to copy text:', error)
    return false
  }
}

/**
 * Get CSS custom property value
 * @param {string} property - CSS custom property name
 * @param {Element} element - Element to get property from (defaults to document.documentElement)
 * @returns {string} Property value
 */
export function getCSSCustomProperty(
  property,
  element = document.documentElement
) {
  return getComputedStyle(element).getPropertyValue(property).trim()
}

/**
 * Set CSS custom property value
 * @param {string} property - CSS custom property name
 * @param {string} value - Property value
 * @param {Element} element - Element to set property on (defaults to document.documentElement)
 */
export function setCSSCustomProperty(
  property,
  value,
  element = document.documentElement
) {
  element.style.setProperty(property, value)
}
