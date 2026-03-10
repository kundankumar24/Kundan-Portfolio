/**
 * Cross-Browser Compatibility and Polyfills
 * Ensures consistent behavior across different browsers
 * Requirements: 12.2
 */

/**
 * Initialize all polyfills and compatibility features
 */
export function initializePolyfills() {
  polyfillIntersectionObserver()
  polyfillCustomEvent()
  polyfillClosest()
  polyfillMatches()
  polyfillRemove()
  polyfillObjectFit()
  polyfillSmoothScroll()
  polyfillFetch()
}

/**
 * Polyfill for IntersectionObserver (for older browsers)
 */
function polyfillIntersectionObserver() {
  if (typeof window.IntersectionObserver === 'undefined') {
    // Simple fallback that treats all elements as visible
    window.IntersectionObserver = class IntersectionObserver {
      constructor(callback) {
        this.callback = callback
        this.elements = []
      }

      observe(element) {
        this.elements.push(element)
        // Immediately call callback with element as intersecting
        setTimeout(() => {
          this.callback([
            {
              target: element,
              isIntersecting: true,
              intersectionRatio: 1,
            },
          ])
        }, 0)
      }

      unobserve(element) {
        this.elements = this.elements.filter(el => el !== element)
      }

      disconnect() {
        this.elements = []
      }
    }
  }
}

/**
 * Polyfill for CustomEvent constructor
 */
function polyfillCustomEvent() {
  if (typeof window.CustomEvent === 'function') return

  function CustomEvent(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: null }
    const evt = document.createEvent('CustomEvent')
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail)
    return evt
  }

  window.CustomEvent = CustomEvent
}

/**
 * Polyfill for Element.closest()
 */
function polyfillClosest() {
  if (!Element.prototype.closest) {
    Element.prototype.closest = function (selector) {
      let element = this

      while (element && element.nodeType === 1) {
        if (element.matches(selector)) {
          return element
        }
        element = element.parentElement || element.parentNode
      }

      return null
    }
  }
}

/**
 * Polyfill for Element.matches()
 */
function polyfillMatches() {
  if (!Element.prototype.matches) {
    Element.prototype.matches =
      Element.prototype.msMatchesSelector ||
      Element.prototype.webkitMatchesSelector
  }
}

/**
 * Polyfill for Element.remove()
 */
function polyfillRemove() {
  if (!Element.prototype.remove) {
    Element.prototype.remove = function () {
      if (this.parentNode) {
        this.parentNode.removeChild(this)
      }
    }
  }
}

/**
 * Polyfill for CSS object-fit property
 */
function polyfillObjectFit() {
  // Check if object-fit is supported
  if ('objectFit' in document.documentElement.style) return

  // Add fallback for images with object-fit
  const images = document.querySelectorAll('img[data-object-fit]')

  images.forEach(img => {
    const objectFit = img.getAttribute('data-object-fit') || 'cover'

    if (objectFit === 'cover' || objectFit === 'contain') {
      const parent = img.parentElement
      parent.style.position = 'relative'
      parent.style.overflow = 'hidden'

      img.style.position = 'absolute'
      img.style.top = '50%'
      img.style.left = '50%'
      img.style.transform = 'translate(-50%, -50%)'

      if (objectFit === 'cover') {
        img.style.minWidth = '100%'
        img.style.minHeight = '100%'
      } else {
        img.style.maxWidth = '100%'
        img.style.maxHeight = '100%'
      }
    }
  })
}

/**
 * Polyfill for smooth scrolling
 */
function polyfillSmoothScroll() {
  // Check if smooth scroll is supported
  if ('scrollBehavior' in document.documentElement.style) return

  // Override scroll methods to add smooth behavior
  const originalScrollTo = window.scrollTo
  const originalScrollBy = window.scrollBy

  window.scrollTo = function (options) {
    if (typeof options === 'object' && options.behavior === 'smooth') {
      smoothScrollTo(options.left || 0, options.top || 0)
    } else {
      originalScrollTo.apply(window, arguments)
    }
  }

  window.scrollBy = function (options) {
    if (typeof options === 'object' && options.behavior === 'smooth') {
      const currentX = window.pageXOffset
      const currentY = window.pageYOffset
      smoothScrollTo(
        currentX + (options.left || 0),
        currentY + (options.top || 0)
      )
    } else {
      originalScrollBy.apply(window, arguments)
    }
  }

  function smoothScrollTo(targetX, targetY) {
    const startX = window.pageXOffset
    const startY = window.pageYOffset
    const distanceX = targetX - startX
    const distanceY = targetY - startY
    const duration = 500
    let startTime = null

    function animation(currentTime) {
      if (startTime === null) startTime = currentTime
      const timeElapsed = currentTime - startTime
      const progress = Math.min(timeElapsed / duration, 1)

      // Easing function (ease-in-out)
      const ease =
        progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress

      window.scroll(startX + distanceX * ease, startY + distanceY * ease)

      if (timeElapsed < duration) {
        requestAnimationFrame(animation)
      }
    }

    requestAnimationFrame(animation)
  }
}

/**
 * Polyfill for fetch API (basic implementation)
 */
function polyfillFetch() {
  if (typeof window.fetch !== 'undefined') return

  window.fetch = function (url, options = {}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const method = options.method || 'GET'

      xhr.open(method, url, true)

      // Set headers
      if (options.headers) {
        Object.keys(options.headers).forEach(key => {
          xhr.setRequestHeader(key, options.headers[key])
        })
      }

      xhr.onload = function () {
        const response = {
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders()),
          text: () => Promise.resolve(xhr.responseText),
          json: () => Promise.resolve(JSON.parse(xhr.responseText)),
        }
        resolve(response)
      }

      xhr.onerror = function () {
        reject(new TypeError('Network request failed'))
      }

      xhr.ontimeout = function () {
        reject(new TypeError('Network request timed out'))
      }

      xhr.send(options.body || null)
    })
  }

  function parseHeaders(headerString) {
    const headers = {}
    if (!headerString) return headers

    headerString.split('\r\n').forEach(line => {
      const parts = line.split(': ')
      const key = parts[0]
      const value = parts[1]
      if (key) {
        headers[key] = value
      }
    })

    return headers
  }
}

/**
 * Feature detection utilities
 */
export const features = {
  /**
   * Check if IntersectionObserver is supported
   */
  hasIntersectionObserver() {
    return 'IntersectionObserver' in window
  },

  /**
   * Check if CSS Grid is supported
   */
  hasCSSGrid() {
    return CSS.supports('display', 'grid')
  },

  /**
   * Check if CSS Custom Properties are supported
   */
  hasCSSCustomProperties() {
    return (
      window.CSS && window.CSS.supports && window.CSS.supports('--test', '0')
    )
  },

  /**
   * Check if Service Worker is supported
   */
  hasServiceWorker() {
    return 'serviceWorker' in navigator
  },

  /**
   * Check if Web Storage is supported
   */
  hasLocalStorage() {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  },

  /**
   * Check if WebP is supported
   */
  async hasWebP() {
    if (!window.createImageBitmap) return false

    const webpData =
      'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA='

    try {
      const blob = await fetch(webpData).then(r => r.blob())
      return await createImageBitmap(blob).then(
        () => true,
        () => false
      )
    } catch {
      return false
    }
  },

  /**
   * Check if AVIF is supported
   */
  async hasAVIF() {
    if (!window.createImageBitmap) return false

    const avifData =
      'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A='

    try {
      const blob = await fetch(avifData).then(r => r.blob())
      return await createImageBitmap(blob).then(
        () => true,
        () => false
      )
    } catch {
      return false
    }
  },

  /**
   * Check if touch is supported
   */
  hasTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  },

  /**
   * Check if Pointer Events are supported
   */
  hasPointerEvents() {
    return 'PointerEvent' in window
  },

  /**
   * Get browser information
   */
  getBrowserInfo() {
    const ua = navigator.userAgent
    let browser = 'Unknown'
    let version = 'Unknown'

    if (ua.indexOf('Firefox') > -1) {
      browser = 'Firefox'
      version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown'
    } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
      browser = 'Chrome'
      version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown'
    } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
      browser = 'Safari'
      version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown'
    } else if (ua.indexOf('Edg') > -1) {
      browser = 'Edge'
      version = ua.match(/Edg\/(\d+)/)?.[1] || 'Unknown'
    } else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) {
      browser = 'Internet Explorer'
      version = ua.match(/(?:MSIE |rv:)(\d+)/)?.[1] || 'Unknown'
    }

    return { browser, version }
  },
}

/**
 * Add browser-specific classes to HTML element
 */
export function addBrowserClasses() {
  const { browser, version } = features.getBrowserInfo()
  const html = document.documentElement

  html.classList.add(`browser-${browser.toLowerCase().replace(/\s+/g, '-')}`)
  html.classList.add(`browser-version-${version}`)

  // Add feature detection classes
  if (!features.hasCSSGrid()) {
    html.classList.add('no-css-grid')
  }

  if (!features.hasCSSCustomProperties()) {
    html.classList.add('no-css-custom-properties')
  }

  if (features.hasTouch()) {
    html.classList.add('touch')
  } else {
    html.classList.add('no-touch')
  }

  if (features.hasPointerEvents()) {
    html.classList.add('pointer-events')
  }
}

/**
 * Log browser compatibility information
 */
export function logCompatibilityInfo() {
  const { browser, version } = features.getBrowserInfo()

  console.group('Browser Compatibility Information')
  console.log(`Browser: ${browser} ${version}`)
  console.log(`IntersectionObserver: ${features.hasIntersectionObserver()}`)
  console.log(`CSS Grid: ${features.hasCSSGrid()}`)
  console.log(`CSS Custom Properties: ${features.hasCSSCustomProperties()}`)
  console.log(`Service Worker: ${features.hasServiceWorker()}`)
  console.log(`Local Storage: ${features.hasLocalStorage()}`)
  console.log(`Touch Support: ${features.hasTouch()}`)
  console.log(`Pointer Events: ${features.hasPointerEvents()}`)
  console.groupEnd()
}
