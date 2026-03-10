/**
 * PWA Installation Manager Module
 * Handles PWA installation prompts and app-like interactions
 * Requirements: 8.1, 8.4
 */

import { logger } from '../utils/logger.js'

/**
 * PWAInstallManager Class
 * Manages PWA installation prompts and app-like navigation
 */
export class PWAInstallManager {
  constructor(config = {}) {
    this.config = {
      showInstallPrompt: true,
      promptDelay: 3000, // Delay before showing prompt (ms)
      dismissDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
      storageKey: 'pwa-install-dismissed',
      ...config,
    }

    this.deferredPrompt = null
    this.isInstalled = false
    this.isStandalone = false
    this.installPromptShown = false

    // Bind methods
    this.handleBeforeInstallPrompt = this.handleBeforeInstallPrompt.bind(this)
    this.handleAppInstalled = this.handleAppInstalled.bind(this)
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this)
  }

  /**
   * Initialize PWA installation manager
   */
  async init() {
    try {
      logger.info('Initializing PWA Installation Manager...')

      // Check if already installed
      this.checkInstallationStatus()

      // Set up event listeners
      this.setupEventListeners()

      // Set up app-like navigation
      this.setupAppLikeNavigation()

      // Show install prompt if appropriate
      if (this.config.showInstallPrompt && !this.isInstalled) {
        this.scheduleInstallPrompt()
      }

      logger.info('PWA Installation Manager initialized')
      return true
    } catch (error) {
      logger.error('Failed to initialize PWA Installation Manager:', error)
      return false
    }
  }

  /**
   * Check if app is already installed
   */
  checkInstallationStatus() {
    // Check if running in standalone mode
    this.isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')

    this.isInstalled = this.isStandalone

    if (this.isInstalled) {
      logger.info('App is running in standalone mode (installed)')
    }
  }

  /**
   * Set up event listeners for PWA installation
   */
  setupEventListeners() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt)

    // Listen for appinstalled event
    window.addEventListener('appinstalled', this.handleAppInstalled)

    // Listen for visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
  }

  /**
   * Handle beforeinstallprompt event
   */
  handleBeforeInstallPrompt(event) {
    // Prevent the default mini-infobar
    event.preventDefault()

    // Store the event for later use
    this.deferredPrompt = event

    logger.info('PWA install prompt available')

    // Show custom install prompt if not dismissed recently
    if (this.shouldShowPrompt()) {
      this.showInstallPrompt()
    }
  }

  /**
   * Handle appinstalled event
   */
  handleAppInstalled(event) {
    logger.info('PWA installed successfully')

    this.isInstalled = true
    this.deferredPrompt = null

    // Hide install prompt if visible
    this.hideInstallPrompt()

    // Track installation
    this.trackInstallation()

    // Show success message
    this.showInstallSuccessMessage()
  }

  /**
   * Handle visibility change
   */
  handleVisibilityChange() {
    if (!document.hidden && this.isStandalone) {
      // App became visible in standalone mode
      this.checkInstallationStatus()
    }
  }

  /**
   * Check if install prompt should be shown
   */
  shouldShowPrompt() {
    // Check if prompt was dismissed recently
    const dismissedTime = localStorage.getItem(this.config.storageKey)
    if (dismissedTime) {
      const elapsed = Date.now() - parseInt(dismissedTime, 10)
      if (elapsed < this.config.dismissDuration) {
        logger.info('Install prompt dismissed recently, not showing')
        return false
      }
    }

    return !this.installPromptShown && !this.isInstalled
  }

  /**
   * Schedule install prompt to show after delay
   */
  scheduleInstallPrompt() {
    setTimeout(() => {
      if (this.deferredPrompt && this.shouldShowPrompt()) {
        this.showInstallPrompt()
      }
    }, this.config.promptDelay)
  }

  /**
   * Show custom install prompt
   */
  showInstallPrompt() {
    if (this.installPromptShown) return

    this.installPromptShown = true

    // Create install prompt UI
    const promptElement = this.createInstallPromptUI()
    document.body.appendChild(promptElement)

    // Animate in
    requestAnimationFrame(() => {
      promptElement.classList.add('pwa-prompt-visible')
    })

    logger.info('Install prompt shown')
  }

  /**
   * Create install prompt UI element
   */
  createInstallPromptUI() {
    const prompt = document.createElement('div')
    prompt.className = 'pwa-install-prompt'
    prompt.setAttribute('role', 'dialog')
    prompt.setAttribute('aria-labelledby', 'pwa-prompt-title')
    prompt.setAttribute('aria-describedby', 'pwa-prompt-description')

    prompt.innerHTML = `
      <div class="pwa-prompt-content">
        <button class="pwa-prompt-close" aria-label="Close install prompt">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="pwa-prompt-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </div>
        <h3 id="pwa-prompt-title">Install Portfolio App</h3>
        <p id="pwa-prompt-description">
          Install this portfolio as an app for quick access and offline viewing.
        </p>
        <div class="pwa-prompt-actions">
          <button class="pwa-prompt-install">Install</button>
          <button class="pwa-prompt-dismiss">Not Now</button>
        </div>
      </div>
    `

    // Add event listeners
    const closeBtn = prompt.querySelector('.pwa-prompt-close')
    const installBtn = prompt.querySelector('.pwa-prompt-install')
    const dismissBtn = prompt.querySelector('.pwa-prompt-dismiss')

    closeBtn.addEventListener('click', () => this.dismissInstallPrompt())
    installBtn.addEventListener('click', () => this.installApp())
    dismissBtn.addEventListener('click', () => this.dismissInstallPrompt())

    return prompt
  }

  /**
   * Install the PWA
   */
  async installApp() {
    if (!this.deferredPrompt) {
      logger.warn('No deferred prompt available')
      return
    }

    try {
      // Show the install prompt
      this.deferredPrompt.prompt()

      // Wait for user response
      const { outcome } = await this.deferredPrompt.userChoice

      logger.info('Install prompt outcome:', outcome)

      if (outcome === 'accepted') {
        logger.info('User accepted the install prompt')
      } else {
        logger.info('User dismissed the install prompt')
      }

      // Clear the deferred prompt
      this.deferredPrompt = null

      // Hide the custom prompt
      this.hideInstallPrompt()
    } catch (error) {
      logger.error('Error showing install prompt:', error)
    }
  }

  /**
   * Dismiss install prompt
   */
  dismissInstallPrompt() {
    // Store dismissal time
    localStorage.setItem(this.config.storageKey, Date.now().toString())

    // Hide prompt
    this.hideInstallPrompt()

    logger.info('Install prompt dismissed')
  }

  /**
   * Hide install prompt
   */
  hideInstallPrompt() {
    const prompt = document.querySelector('.pwa-install-prompt')
    if (prompt) {
      prompt.classList.remove('pwa-prompt-visible')
      setTimeout(() => {
        prompt.remove()
      }, 300)
    }
  }

  /**
   * Show install success message
   */
  showInstallSuccessMessage() {
    const message = document.createElement('div')
    message.className = 'pwa-install-success'
    message.setAttribute('role', 'status')
    message.setAttribute('aria-live', 'polite')

    message.innerHTML = `
      <div class="pwa-success-content">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>App installed successfully!</span>
      </div>
    `

    document.body.appendChild(message)

    // Animate in
    requestAnimationFrame(() => {
      message.classList.add('pwa-success-visible')
    })

    // Remove after delay
    setTimeout(() => {
      message.classList.remove('pwa-success-visible')
      setTimeout(() => {
        message.remove()
      }, 300)
    }, 3000)
  }

  /**
   * Track installation for analytics
   */
  trackInstallation() {
    // Track with analytics if available
    if (window.gtag) {
      window.gtag('event', 'pwa_install', {
        event_category: 'PWA',
        event_label: 'App Installed',
      })
    }

    // Custom event for other tracking
    window.dispatchEvent(
      new CustomEvent('pwa-installed', {
        detail: { timestamp: Date.now() },
      })
    )
  }

  /**
   * Set up app-like navigation
   */
  setupAppLikeNavigation() {
    // Prevent pull-to-refresh on mobile when installed
    if (this.isStandalone) {
      document.body.style.overscrollBehavior = 'none'
      logger.info('App-like navigation enabled')
    }

    // Handle link clicks for smooth navigation
    this.setupSmoothNavigation()

    // Add iOS-specific fixes
    this.setupIOSFixes()
  }

  /**
   * Set up smooth navigation for app-like experience
   */
  setupSmoothNavigation() {
      // Intercept internal link clicks for smooth transitions
      document.addEventListener('click', (event) => {
        const link = event.target.closest('a')
        if (!link) return

        const href = link.getAttribute('href')
        if (!href || href.startsWith('#') || href.startsWith('http')) return

        // Only handle internal links in standalone mode
        if (this.isStandalone) {
          event.preventDefault()

          // Navigate immediately without opacity transition
          window.location.href = href
        }
      })
    }


  /**
   * Set up iOS-specific fixes for PWA
   */
  setupIOSFixes() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

    if (isIOS && this.isStandalone) {
      // Fix viewport height on iOS
      const setViewportHeight = () => {
        const vh = window.innerHeight * 0.01
        document.documentElement.style.setProperty('--vh', `${vh}px`)
      }

      setViewportHeight()
      window.addEventListener('resize', setViewportHeight)

      // Prevent zoom on input focus
      const inputs = document.querySelectorAll('input, textarea, select')
      inputs.forEach((input) => {
        input.addEventListener('focus', () => {
          input.style.fontSize = '16px'
        })
      })

      logger.info('iOS PWA fixes applied')
    }
  }

  /**
   * Check if PWA can be installed
   */
  canInstall() {
    return this.deferredPrompt !== null && !this.isInstalled
  }

  /**
   * Get installation status
   */
  getStatus() {
    return {
      isInstalled: this.isInstalled,
      isStandalone: this.isStandalone,
      canInstall: this.canInstall(),
      promptShown: this.installPromptShown,
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    window.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt)
    window.removeEventListener('appinstalled', this.handleAppInstalled)
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)

    this.hideInstallPrompt()

    logger.info('PWA Installation Manager destroyed')
  }
}

export default PWAInstallManager
