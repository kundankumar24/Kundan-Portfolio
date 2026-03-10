/**
 * Service Worker Integration Tests
 * Tests for PWA functionality and offline support
 * Requirements: 8.2, 8.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ServiceWorkerManager } from '../js/modules/serviceWorker.js'

describe('ServiceWorkerManager - Integration Tests', () => {
  let swManager

  beforeEach(() => {
    // Mock minimal navigator.serviceWorker
    global.navigator = {
      serviceWorker: {
        register: vi.fn().mockResolvedValue({
          installing: null,
          waiting: null,
          active: null,
          sync: {
            register: vi.fn().mockResolvedValue(undefined),
          },
          update: vi.fn().mockResolvedValue(undefined),
          unregister: vi.fn().mockResolvedValue(true),
          addEventListener: vi.fn(),
        }),
        controller: {
          postMessage: vi.fn(),
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      onLine: true,
    }

    // Mock document.body for notifications
    global.document = {
      body: {
        appendChild: vi.fn(),
      },
      createElement: vi.fn(() => ({
        className: '',
        innerHTML: '',
        querySelector: vi.fn(() => ({
          addEventListener: vi.fn(),
        })),
        remove: vi.fn(),
      })),
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }

    swManager = new ServiceWorkerManager({
      swPath: '/sw.js',
      scope: '/',
      enableBackgroundSync: true,
    })
  })

  afterEach(() => {
    if (swManager) {
      swManager.destroy()
    }
    vi.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('should create instance with correct config', () => {
      expect(swManager.config.swPath).toBe('/sw.js')
      expect(swManager.config.scope).toBe('/')
      expect(swManager.config.enableBackgroundSync).toBe(true)
    })

    it('should initialize and register service worker', async () => {
      const result = await swManager.init()

      expect(result).toBe(true)
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
      })
    })

    it('should handle missing service worker support', async () => {
      delete global.navigator.serviceWorker

      const result = await swManager.init()

      expect(result).toBe(false)
    })
  })

  describe('Online/Offline Status', () => {
    it('should track online status', () => {
      expect(swManager.isOnline).toBe(true)
    })

    it('should update status on offline', () => {
      swManager.handleOffline()
      expect(swManager.isOnline).toBe(false)
    })

    it('should update status on online', () => {
      swManager.isOnline = false
      swManager.handleOnline()
      expect(swManager.isOnline).toBe(true)
    })
  })

  describe('Status Reporting', () => {
    it('should report correct status', () => {
      const status = swManager.getStatus()

      expect(status).toHaveProperty('supported')
      expect(status).toHaveProperty('registered')
      expect(status).toHaveProperty('active')
      expect(status).toHaveProperty('online')
      expect(status).toHaveProperty('syncSupported')
    })
  })

  describe('Cleanup', () => {
    it('should clean up resources on destroy', async () => {
      await swManager.init()
      swManager.startUpdateCheck()

      expect(swManager.updateCheckTimer).toBeDefined()

      swManager.destroy()

      expect(swManager.updateCheckTimer).toBeNull()
    })
  })
})

