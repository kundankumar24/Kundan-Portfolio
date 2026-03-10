/**
 * Test Setup Configuration
 * Sets up the testing environment for property-based tests
 */

import { beforeEach, afterEach, vi } from 'vitest'

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()
  
  // Mock console methods to reduce noise in tests
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  
  // Mock performance API
  if (!global.performance) {
    global.performance = {
      now: vi.fn(() => Date.now())
    }
  }
  
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  })
  
  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  // Don't mock createElement - let JSDOM handle real DOM elements
  // Only mock specific selectors that need special handling
  if (document.querySelector) {
    const originalQuerySelector = document.querySelector.bind(document)
    const querySelectorSpy = vi.fn((selector) => {
      if (selector === '.theme-toggle') {
        const mockToggle = document.createElement('button')
        mockToggle.className = 'theme-toggle'
        return mockToggle
      }
      return originalQuerySelector(selector)
    })
    
    // Replace querySelector without using spyOn (which fails on JSDOM)
    document.querySelector = querySelectorSpy
  }
})

afterEach(() => {
  // Clean up after each test
  vi.restoreAllMocks()
  
  // Reset DOM
  if (document.body) {
    document.body.innerHTML = ''
  }
  
  // Reset document element attributes
  if (document.documentElement) {
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.className = ''
  }
})