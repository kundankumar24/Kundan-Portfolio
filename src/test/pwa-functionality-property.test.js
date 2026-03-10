/**
 * Property-Based Tests for PWA Functionality
 * Feature: portfolio-enhancement, Property 10: PWA Functionality
 * 
 * **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
 * 
 * Property 10: PWA Functionality
 * For any PWA feature (offline caching, installation, app-like behavior),
 * the functionality should work correctly on supported devices and browsers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { ServiceWorkerManager } from '../js/modules/serviceWorker.js'
import { PWAInstallManager } from '../js/modules/pwaInstall.js'

describe('Property 10: PWA Functionality', () => {
  let swManager
  let pwaManager

  beforeEach(() => {
    // Mock service worker API
    global.navigator = {
      serviceWorker: {
        register: vi.fn().mockResolvedValue({
          installing: null,
          waiting: null,
          active: { state: 'activated' },
          sync: {
            register: vi.fn().mockResolvedValue(undefined),
          },
          update: vi.fn().mockResolvedValue(undefined),
          unregister: vi.fn().mockResolvedValue(true),
          addEventListener: vi.fn(),
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(null),
            subscribe: vi.fn().mockResolvedValue({
              endpoint: 'https://example.com/push',
              keys: {},
            }),
          },
        }),
        ready: Promise.resolve({
          installing: null,
          waiting: null,
          active: { state: 'activated' },
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(null),
          },
        }),
        controller: {
          postMessage: vi.fn(),
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      onLine: true,
      standalone: false,
    }

    // Mock window APIs
    global.window = {
      ...global.window,
      matchMedia: vi.fn((query) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      location: {
        href: 'https://example.com/',
      },
      innerHeight: 768,
    }

    // Create mock element factory
    const createMockElement = () => ({
      className: '',
      innerHTML: '',
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(() => false),
      },
      style: {},
      setAttribute: vi.fn(),
      getAttribute: vi.fn(() => null),
      removeAttribute: vi.fn(),
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
      remove: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      appendChild: vi.fn(),
      focus: vi.fn(),
    })

    // Mock document
    global.document = {
      body: createMockElement(),
      head: createMockElement(),
      documentElement: {
        style: {
          setProperty: vi.fn(),
        },
        className: '',
        removeAttribute: vi.fn(),
      },
      createElement: vi.fn(() => createMockElement()),
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      hidden: false,
      referrer: '',
    }

    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }

    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0))
  })

  afterEach(() => {
    if (swManager) {
      swManager.destroy()
    }
    if (pwaManager) {
      pwaManager.destroy()
    }
    vi.clearAllMocks()
  })

  /**
   * Property: Service Worker Registration Consistency
   * For any valid service worker path and scope configuration,
   * the service worker should register successfully and maintain consistent state
   */
  it('should register service worker consistently with valid configurations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          swPath: fc.constantFrom('/sw.js', '/service-worker.js', '/pwa-sw.js'),
          scope: fc.constantFrom('/', '/app/', '/portfolio/'),
          updateCheckInterval: fc.integer({ min: 60000, max: 3600000 }),
        }),
        async (config) => {
          const manager = new ServiceWorkerManager(config)
          const result = await manager.init()

          // Property: Registration should succeed with valid config
          expect(result).toBe(true)
          expect(navigator.serviceWorker.register).toHaveBeenCalledWith(
            config.swPath,
            { scope: config.scope }
          )

          // Property: Manager should track registration state
          const status = manager.getStatus()
          expect(status.supported).toBe(true)
          expect(status.registered).toBe(true)

          manager.destroy()
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Online/Offline State Consistency
   * For any sequence of online/offline transitions,
   * the PWA should maintain correct state and handle transitions gracefully
   */
  it('should maintain consistent online/offline state through transitions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
        async (onlineStates) => {
          swManager = new ServiceWorkerManager({
            swPath: '/sw.js',
            scope: '/',
          })
          await swManager.init()

          // Apply each state transition
          for (const isOnline of onlineStates) {
            if (isOnline) {
              swManager.handleOnline()
            } else {
              swManager.handleOffline()
            }

            // Property: State should match last transition
            expect(swManager.isOnline).toBe(isOnline)

            // Property: Status should reflect current state
            const status = swManager.getStatus()
            expect(status.online).toBe(isOnline)
          }

          // Property: Final state should match last transition
          const finalState = onlineStates[onlineStates.length - 1]
          expect(swManager.isOnline).toBe(finalState)
        }
      ),
      { numRuns: 30 }
    )
  })

  /**
   * Property: Installation Status Detection
   * For any display mode or standalone configuration,
   * the PWA should correctly detect installation status
   */
  it('should correctly detect installation status across display modes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          displayMode: fc.constantFrom('standalone', 'fullscreen', 'minimal-ui', 'browser'),
          navigatorStandalone: fc.boolean(),
          referrer: fc.constantFrom('', 'android-app://com.example', 'https://example.com'),
        }),
        async (config) => {
          // Configure environment
          window.matchMedia = vi.fn((query) => {
            // The implementation only checks for 'display-mode: standalone'
            if (query === '(display-mode: standalone)') {
              return {
                matches: config.displayMode === 'standalone',
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
              }
            }
            return {
              matches: false,
              media: query,
              addEventListener: vi.fn(),
              removeEventListener: vi.fn(),
            }
          })
          
          // Set navigator.standalone (iOS)
          window.navigator.standalone = config.navigatorStandalone
          
          // Set document.referrer
          Object.defineProperty(document, 'referrer', {
            value: config.referrer,
            writable: true,
            configurable: true,
          })

          pwaManager = new PWAInstallManager({
            showInstallPrompt: false,
          })
          await pwaManager.init()

          // Property: Installation detection should be consistent
          // Only standalone display mode, navigator.standalone, or android-app referrer count as installed
          const isStandalone =
            config.displayMode === 'standalone' ||
            config.navigatorStandalone ||
            config.referrer.includes('android-app://')

          expect(pwaManager.isStandalone).toBe(isStandalone)
          expect(pwaManager.isInstalled).toBe(isStandalone)

          // Property: Status should reflect installation state
          const status = pwaManager.getStatus()
          expect(status.isInstalled).toBe(isStandalone)
          expect(status.isStandalone).toBe(isStandalone)
        }
      ),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Install Prompt Dismissal Persistence
   * For any dismissal action, the preference should persist correctly
   * and respect the configured dismissal duration
   */
  it('should persist install prompt dismissal preferences correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          dismissDuration: fc.integer({ min: 1000, max: 30 * 24 * 60 * 60 * 1000 }),
          timeElapsed: fc.integer({ min: 0, max: 31 * 24 * 60 * 60 * 1000 }),
        }),
        async (config) => {
          const dismissTime = Date.now() - config.timeElapsed

          // Mock localStorage with dismissal time
          localStorage.getItem = vi.fn(() => dismissTime.toString())

          pwaManager = new PWAInstallManager({
            showInstallPrompt: true,
            dismissDuration: config.dismissDuration,
            promptDelay: 0,
          })

          // Property: Prompt should respect dismissal duration
          const shouldShow = config.timeElapsed >= config.dismissDuration
          const actualShouldShow = pwaManager.shouldShowPrompt()

          expect(actualShouldShow).toBe(shouldShow)

          // Property: If dismissed recently, prompt should not show
          if (config.timeElapsed < config.dismissDuration) {
            expect(actualShouldShow).toBe(false)
          }
        }
      ),
      { numRuns: 30 }
    )
  })

  /**
   * Property: Service Worker Update Check
   * For any valid update check interval, the service worker should
   * handle update checks correctly without errors
   */
  it('should handle service worker update checks consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 60000, max: 3600000 }),
        async (updateInterval) => {
          swManager = new ServiceWorkerManager({
            swPath: '/sw.js',
            scope: '/',
            updateCheckInterval: updateInterval,
          })
          await swManager.init()

          // Property: Update check should start without errors
          expect(() => {
            swManager.startUpdateCheck()
          }).not.toThrow()

          // Property: Update timer should be set
          expect(swManager.updateCheckTimer).toBeDefined()

          // Property: Stopping update check should clear timer
          swManager.stopUpdateCheck()
          expect(swManager.updateCheckTimer).toBeNull()
        }
      ),
      { numRuns: 15 }
    )
  })

  /**
   * Property: PWA Configuration Validation
   * For any valid PWA configuration, the managers should initialize
   * without errors and maintain expected state
   */
  it('should initialize correctly with various valid configurations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          swConfig: fc.record({
            swPath: fc.constantFrom('/sw.js', '/service-worker.js'),
            scope: fc.constantFrom('/', '/app/'),
            updateCheckInterval: fc.integer({ min: 60000, max: 7200000 }),
            enableBackgroundSync: fc.boolean(),
          }),
          pwaConfig: fc.record({
            showInstallPrompt: fc.boolean(),
            promptDelay: fc.integer({ min: 0, max: 10000 }),
            dismissDuration: fc.integer({ min: 1000, max: 14 * 24 * 60 * 60 * 1000 }),
          }),
        }),
        async (config) => {
          // Initialize service worker manager
          const sw = new ServiceWorkerManager(config.swConfig)
          const swResult = await sw.init()

          // Property: Service worker should initialize successfully
          expect(swResult).toBe(true)
          expect(sw.config).toMatchObject(config.swConfig)

          // Initialize PWA install manager
          const pwa = new PWAInstallManager(config.pwaConfig)
          const pwaResult = await pwa.init()

          // Property: PWA manager should initialize successfully
          expect(pwaResult).toBe(true)
          expect(pwa.config).toMatchObject(config.pwaConfig)

          // Property: Both managers should report valid status
          const swStatus = sw.getStatus()
          const pwaStatus = pwa.getStatus()

          expect(swStatus).toHaveProperty('supported')
          expect(swStatus).toHaveProperty('registered')
          expect(pwaStatus).toHaveProperty('isInstalled')
          expect(pwaStatus).toHaveProperty('canInstall')

          // Cleanup
          sw.destroy()
          pwa.destroy()
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: App-like Navigation Behavior
   * For any standalone mode configuration, app-like navigation
   * should be properly configured
   */
  it('should configure app-like navigation correctly in standalone mode', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        async (isStandalone) => {
          // Configure standalone mode
          window.matchMedia = vi.fn((query) => ({
            matches: isStandalone && query.includes('standalone'),
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          }))

          pwaManager = new PWAInstallManager({
            showInstallPrompt: false,
          })
          await pwaManager.init()

          // Property: Overscroll behavior should be set in standalone mode
          if (isStandalone) {
            expect(document.body.style.overscrollBehavior).toBe('none')
          }

          // Property: Installation status should match standalone mode
          expect(pwaManager.isStandalone).toBe(isStandalone)
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Status Reporting Consistency
   * For any PWA state, status reporting should be consistent
   * and provide accurate information
   */
  it('should report consistent status across all PWA features', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          isOnline: fc.boolean(),
          isStandalone: fc.boolean(),
          hasController: fc.boolean(),
        }),
        async (state) => {
          // Configure environment
          navigator.onLine = state.isOnline
          window.matchMedia = vi.fn((query) => ({
            matches: state.isStandalone && query.includes('standalone'),
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          }))

          if (!state.hasController) {
            navigator.serviceWorker.controller = null
          }

          // Initialize managers
          swManager = new ServiceWorkerManager({ swPath: '/sw.js' })
          await swManager.init()

          pwaManager = new PWAInstallManager({ showInstallPrompt: false })
          await pwaManager.init()

          // Get status from both managers
          const swStatus = swManager.getStatus()
          const pwaStatus = pwaManager.getStatus()

          // Property: Status should reflect current state
          expect(swStatus.online).toBe(state.isOnline)
          expect(pwaStatus.isStandalone).toBe(state.isStandalone)

          // Property: Status objects should have all required fields
          expect(swStatus).toHaveProperty('supported')
          expect(swStatus).toHaveProperty('registered')
          expect(swStatus).toHaveProperty('active')
          expect(swStatus).toHaveProperty('online')

          expect(pwaStatus).toHaveProperty('isInstalled')
          expect(pwaStatus).toHaveProperty('isStandalone')
          expect(pwaStatus).toHaveProperty('canInstall')
          expect(pwaStatus).toHaveProperty('promptShown')
        }
      ),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Cleanup and Resource Management
   * For any initialized PWA manager, cleanup should properly
   * release all resources and event listeners
   */
  it('should properly cleanup resources on destroy', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          initSW: fc.boolean(),
          initPWA: fc.boolean(),
          startUpdateCheck: fc.boolean(),
        }),
        async (config) => {
          let sw = null
          let pwa = null

          // Initialize based on config
          if (config.initSW) {
            sw = new ServiceWorkerManager({ swPath: '/sw.js' })
            await sw.init()

            if (config.startUpdateCheck) {
              sw.startUpdateCheck()
            }
          }

          if (config.initPWA) {
            pwa = new PWAInstallManager({ showInstallPrompt: false })
            await pwa.init()
          }

          // Property: Destroy should not throw errors
          expect(() => {
            if (sw) {
              sw.destroy()
            }
            if (pwa) {
              pwa.destroy()
            }
          }).not.toThrow()

          // Property: After destroy, update timer should be cleared
          if (sw && config.startUpdateCheck) {
            expect(sw.updateCheckTimer).toBeNull()
          }
        }
      ),
      { numRuns: 20 }
    )
  })
})

