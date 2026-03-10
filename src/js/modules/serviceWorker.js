/**
 * Service Worker Registration and Management Module
 * Handles PWA functionality, offline support, and background sync
 * Requirements: 8.2, 8.3
 */

import { logger } from '../utils/logger.js'

/**
 * ServiceWorkerManager Class
 * Manages service worker lifecycle and communication
 */
export class ServiceWorkerManager {
  constructor(config = {}) {
    this.config = {
      swPath: '/sw.js',
      scope: '/',
      updateCheckInterval: 60 * 60 * 1000, // 1 hour
      enableBackgroundSync: true,
      ...config,
    }

    this.registration = null
    this.isOnline = navigator.onLine
    this.updateCheckTimer = null
    this.syncQueue = []

    // Bind methods
    this.handleOnline = this.handleOnline.bind(this)
    this.handleOffline = this.handleOffline.bind(this)
    this.handleMessage = this.handleMessage.bind(this)
    this.handleControllerChange = this.handleControllerChange.bind(this)
  }

  /**
   * Initialize service worker
   */
  async init() {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      logger.warn('Service workers are not supported in this browser')
      return false
    }

    try {
      logger.info('Registering service worker...')

      // Register service worker
      this.registration = await navigator.serviceWorker.register(
        this.config.swPath,
        {
          scope: this.config.scope,
        }
      )

      logger.info('Service worker registered successfully')

      // Set up event listeners
      this.setupEventListeners()

      // Check for updates periodically
      this.startUpdateCheck()

      // Handle initial installation
      if (this.registration.installing) {
        logger.info('Service worker installing...')
        this.trackInstallation(this.registration.installing)
      }

      // Check for updates immediately
      await this.checkForUpdates()

      return true
    } catch (error) {
      logger.error('Service worker registration failed:', error)
      return false
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Online/offline events
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)

    // Service worker messages
    navigator.serviceWorker.addEventListener('message', this.handleMessage)

    // Controller change (new service worker activated)
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      this.handleControllerChange
    )

    // Update found
    if (this.registration) {
      this.registration.addEventListener('updatefound', () => {
        logger.info('Service worker update found')
        this.trackInstallation(this.registration.installing)
      })
    }
  }

  /**
   * Track service worker installation
   */
  trackInstallation(worker) {
    worker.addEventListener('statechange', () => {
      logger.info('Service worker state changed:', worker.state)

      switch (worker.state) {
      case 'installed':
        if (navigator.serviceWorker.controller) {
          // New service worker available
          this.notifyUpdateAvailable()
        } else {
          // First installation
          this.notifyInstalled()
        }
        break

      case 'activated':
        logger.info('Service worker activated')
        this.notifyActivated()
        break

      case 'redundant':
        logger.warn('Service worker became redundant')
        break
      }
    })
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates() {
    if (!this.registration) {
      return
    }

    try {
      await this.registration.update()
      logger.info('Checked for service worker updates')
    } catch (error) {
      logger.error('Update check failed:', error)
    }
  }

  /**
   * Start periodic update checks
   */
  startUpdateCheck() {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer)
    }

    this.updateCheckTimer = setInterval(() => {
      this.checkForUpdates()
    }, this.config.updateCheckInterval)
  }

  /**
   * Stop periodic update checks
   */
  stopUpdateCheck() {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer)
      this.updateCheckTimer = null
    }
  }

  /**
   * Handle online event
   */
  handleOnline() {
    logger.info('Connection restored - online')
    this.isOnline = true

    // Dispatch custom event
    document.dispatchEvent(
      new CustomEvent('connectionChange', {
        detail: { online: true },
      })
    )

    // Show notification
    this.showNotification('Connection restored', 'You are back online', 'success')
  }

  /**
   * Process sync queue (placeholder for future implementation)
   */
  processSyncQueue() {
    // This would process any queued items when connection is restored
    logger.info('Processing sync queue...')
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    logger.info('Connection lost - offline')
    this.isOnline = false

    // Dispatch custom event
    document.dispatchEvent(
      new CustomEvent('connectionChange', {
        detail: { online: false },
      })
    )

    // Show notification
    this.showNotification(
      'No connection',
      'You are offline. Some features may be limited.',
      'warning'
    )
  }

  /**
   * Handle messages from service worker
   */
  handleMessage(event) {
    const { type, data } = event.data

    logger.info('Message from service worker:', type, data)

    switch (type) {
    case 'sync-success':
      this.handleSyncSuccess(data)
      break

    case 'sync-error':
      this.handleSyncError(data)
      break

    case 'cache-updated':
      this.handleCacheUpdated(data)
      break

    default:
      logger.info('Unknown message type:', type)
    }
  }

  /**
   * Handle controller change (new SW activated)
   */
  handleControllerChange() {
    logger.info('Service worker controller changed')

    // Reload page to use new service worker
    if (this.config.autoReload) {
      window.location.reload()
    }
  }

  /**
   * Queue data for background sync
   */
  async queueForSync(data) {
    if (!this.config.enableBackgroundSync) {
      logger.warn('Background sync is disabled')
      return false
    }

    if (!this.registration || !this.registration.sync) {
      logger.warn('Background sync not supported')
      return false
    }

    try {
      // Send data to service worker
      const messageChannel = new MessageChannel()

      const response = await new Promise((resolve, reject) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            resolve(event.data)
          } else {
            reject(new Error(event.data.error))
          }
        }

        navigator.serviceWorker.controller.postMessage(
          {
            type: 'QUEUE_SYNC',
            data,
          },
          [messageChannel.port2]
        )

        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Sync queue timeout')), 5000)
      })

      logger.info('Data queued for background sync')
      return response.success
    } catch (error) {
      logger.error('Failed to queue for sync:', error)
      return false
    }
  }

  /**
   * Handle successful sync
   */
  handleSyncSuccess(data) {
    logger.info('Background sync successful:', data)

    // Dispatch custom event
    document.dispatchEvent(
      new CustomEvent('syncSuccess', {
        detail: data,
      })
    )

    // Show notification
    this.showNotification(
      'Sync complete',
      'Your data has been synchronized',
      'success'
    )
  }

  /**
   * Handle sync error
   */
  handleSyncError(data) {
    logger.error('Background sync failed:', data)

    // Dispatch custom event
    document.dispatchEvent(
      new CustomEvent('syncError', {
        detail: data,
      })
    )

    // Show notification
    this.showNotification(
      'Sync failed',
      'Failed to synchronize your data. Will retry later.',
      'error'
    )
  }

  /**
   * Handle cache updated
   */
  handleCacheUpdated(data) {
    logger.info('Cache updated:', data)

    // Dispatch custom event
    document.dispatchEvent(
      new CustomEvent('cacheUpdated', {
        detail: data,
      })
    )
  }

  /**
   * Clear all caches
   */
  async clearCache() {
    if (!navigator.serviceWorker.controller) {
      logger.warn('No service worker controller available')
      return false
    }

    try {
      const messageChannel = new MessageChannel()

      const response = await new Promise((resolve, reject) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            resolve(event.data)
          } else {
            reject(new Error(event.data.error))
          }
        }

        navigator.serviceWorker.controller.postMessage(
          {
            type: 'CLEAR_CACHE',
          },
          [messageChannel.port2]
        )

        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Clear cache timeout')), 5000)
      })

      logger.info('Cache cleared successfully')
      return response.success
    } catch (error) {
      logger.error('Failed to clear cache:', error)
      return false
    }
  }

  /**
   * Notify user of update available
   */
  notifyUpdateAvailable() {
    logger.info('New version available')

    // Dispatch custom event
    document.dispatchEvent(
      new CustomEvent('updateAvailable', {
        detail: {
          registration: this.registration,
        },
      })
    )

    // Show notification with action
    this.showNotification(
      'Update available',
      'A new version is available. Refresh to update.',
      'info',
      [
        {
          label: 'Refresh',
          action: () => window.location.reload(),
        },
      ]
    )
  }

  /**
   * Notify user of first installation
   */
  notifyInstalled() {
    logger.info('Service worker installed for the first time')

    // Dispatch custom event
    document.dispatchEvent(
      new CustomEvent('swInstalled', {
        detail: {
          registration: this.registration,
        },
      })
    )
  }

  /**
   * Notify user of activation
   */
  notifyActivated() {
    logger.info('Service worker activated')

    // Dispatch custom event
    document.dispatchEvent(
      new CustomEvent('swActivated', {
        detail: {
          registration: this.registration,
        },
      })
    )
  }

  /**
   * Show notification to user
   */
  showNotification(title, message, type = 'info', actions = []) {
    // Skip if document.body is not available (e.g., in tests)
    if (!document.body) {
      logger.info(`Notification: ${title} - ${message}`)
      return
    }

    // Create notification element
    const notification = document.createElement('div')
    notification.className = `sw-notification sw-notification--${type}`
    notification.innerHTML = `
      <div class="sw-notification__content">
        <h4 class="sw-notification__title">${title}</h4>
        <p class="sw-notification__message">${message}</p>
        ${
  actions.length > 0
    ? `
          <div class="sw-notification__actions">
            ${actions
    .map(
      (action, index) =>
        `<button class="sw-notification__action" data-action="${index}">${action.label}</button>`
    )
    .join('')}
          </div>
        `
    : ''
}
      </div>
      <button class="sw-notification__close" aria-label="Close notification">&times;</button>
    `

    // Add event listeners
    const closeButton = notification.querySelector('.sw-notification__close')
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        notification.remove()
      })
    }

    actions.forEach((action, index) => {
      const button = notification.querySelector(`[data-action="${index}"]`)
      if (button) {
        button.addEventListener('click', () => {
          action.action()
          notification.remove()
        })
      }
    })

    // Add to DOM
    document.body.appendChild(notification)

    // Auto-remove after 5 seconds (unless there are actions)
    if (actions.length === 0) {
      setTimeout(() => {
        notification.remove()
      }, 5000)
    }
  }

  /**
   * Get service worker status
   */
  getStatus() {
    return {
      supported: 'serviceWorker' in navigator,
      registered: !!this.registration,
      active: !!navigator.serviceWorker.controller,
      online: this.isOnline,
      syncSupported: !!(this.registration && this.registration.sync),
    }
  }

  /**
   * Unregister service worker
   */
  async unregister() {
    if (!this.registration) {
      return false
    }

    try {
      await this.registration.unregister()
      logger.info('Service worker unregistered')
      return true
    } catch (error) {
      logger.error('Failed to unregister service worker:', error)
      return false
    }
  }

  /**
   * Destroy and clean up
   */
  destroy() {
    this.stopUpdateCheck()

    // Remove event listeners
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    
    // Check if service worker is available before removing listeners
    if (navigator.serviceWorker) {
      navigator.serviceWorker.removeEventListener('message', this.handleMessage)
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        this.handleControllerChange
      )
    }

    logger.info('ServiceWorkerManager destroyed')
  }
}

export default ServiceWorkerManager
