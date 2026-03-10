/**
 * Bug Condition Exploration Test for Navigation Animation Fix
 * Bugfix Spec: navigation-animation-fix
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3**
 * 
 * Property 1: Bug Condition - Navigation Without Flash Effect
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * For any click event on an internal navigation link in standalone PWA mode,
 * the navigation system should complete smoothly without applying opacity
 * transitions or creating visual flash effects.
 * 
 * Expected Behavior:
 * - No opacity change during navigation
 * - No visual flash effect
 * - Navigation completes smoothly
 * - No artificial delay
 * 
 * Current Buggy Behavior (what we expect to observe):
 * - page-transitioning class is applied
 * - Opacity changes to 0.8
 * - 200ms delay before navigation
 * - Visible flash effect
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { PWAInstallManager } from '../js/modules/pwaInstall.js'

describe('Property 1: Bug Condition - Navigation Without Flash Effect', () => {
  let pwaManager
  let clickHandlers = []

  beforeEach(() => {
    // Reset click handlers
    clickHandlers = []

    // Mock window APIs
    global.window = {
      ...global.window,
      matchMedia: vi.fn((query) => ({
        matches: query.includes('standalone'), // Simulate standalone mode
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
      navigator: {
        standalone: true, // iOS standalone mode
        serviceWorker: {
          register: vi.fn().mockResolvedValue({
            installing: null,
            waiting: null,
            active: { state: 'activated' },
          }),
          ready: Promise.resolve({
            installing: null,
            waiting: null,
            active: { state: 'activated' },
          }),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
        onLine: true,
      },
    }

    // Create mock element factory
    const createMockElement = () => {
      const classList = new Set()
      return {
        className: '',
        innerHTML: '',
        classList: {
          add: vi.fn((className) => classList.add(className)),
          remove: vi.fn((className) => classList.delete(className)),
          contains: vi.fn((className) => classList.has(className)),
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
      }
    }

    // Mock document with click event capture
    const bodyElement = createMockElement()
    global.document = {
      body: bodyElement,
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
      addEventListener: vi.fn((event, handler) => {
        if (event === 'click') {
          clickHandlers.push(handler)
        }
      }),
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

    // Mock setTimeout to track delays
    vi.useFakeTimers()
  })

  afterEach(() => {
    if (pwaManager) {
      pwaManager.destroy()
    }
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  /**
   * Property: Navigation links should not apply opacity transitions
   * 
   * This test simulates clicking internal navigation links in standalone mode
   * and verifies that NO opacity transition is applied.
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: TEST FAILS
   * - The page-transitioning class WILL be applied (bug exists)
   * - Opacity transition WILL occur (bug exists)
   * - 200ms delay WILL be present (bug exists)
   */
  it('should navigate without applying page-transitioning class or opacity changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'about.html',
          'projects.html',
          'skills.html',
          'contact.html',
          'experience.html',
          'education.html'
        ),
        async (targetPage) => {
          // Initialize PWA manager in standalone mode
          pwaManager = new PWAInstallManager({
            showInstallPrompt: false,
          })
          await pwaManager.init()

          // Create mock link element
          const linkElement = {
            tagName: 'A',
            href: `https://example.com/${targetPage}`,
            getAttribute: vi.fn((attr) => {
              if (attr === 'href') return targetPage
              return null
            }),
            closest: vi.fn((selector) => {
              if (selector === 'a') return linkElement
              return null
            }),
          }

          // Create mock click event
          const clickEvent = {
            target: linkElement,
            preventDefault: vi.fn(),
          }

          // Simulate click on internal navigation link
          for (const handler of clickHandlers) {
            handler(clickEvent)
          }

          // Property 1: page-transitioning class should NOT be applied
          // (This will FAIL on unfixed code - the bug applies this class)
          expect(document.body.classList.add).not.toHaveBeenCalledWith('page-transitioning')

          // Property 2: No opacity change should occur
          // (This will FAIL on unfixed code - opacity changes to 0.8)
          const transitioningClassAdded = document.body.classList.add.mock.calls.some(
            (call) => call[0] === 'page-transitioning'
          )
          expect(transitioningClassAdded).toBe(false)

          // Property 3: Navigation should complete immediately without delay
          // (This will FAIL on unfixed code - 200ms setTimeout is used)
          expect(clickEvent.preventDefault).toHaveBeenCalled()
          
          // Check if setTimeout was called with 200ms delay
          const setTimeoutMock = vi.mocked(setTimeout)
          const setTimeoutCalls = setTimeoutMock.mock?.calls || []
          const hasNavigationDelay = setTimeoutCalls.some(
            (call) => call[1] === 200
          )
          
          // Property: No artificial 200ms delay should exist
          // (This will FAIL on unfixed code - setTimeout with 200ms exists)
          expect(hasNavigationDelay).toBe(false)

          // Cleanup for next iteration
          pwaManager.destroy()
          pwaManager = null
          clickHandlers = []
          vi.clearAllMocks()
        }
      ),
      { numRuns: 10 }
    )
  })

  /**
   * Property: Multiple rapid navigation clicks should not accumulate flash effects
   * 
   * This test simulates rapid clicks on different navigation links and verifies
   * that no opacity transitions accumulate.
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: TEST FAILS
   * - Multiple page-transitioning classes WILL be applied (bug exists)
   * - Multiple opacity transitions WILL occur (bug exists)
   * - Poor user experience with repeated flashes (bug exists)
   */
  it('should handle rapid navigation clicks without flash effects', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.constantFrom(
            'about.html',
            'projects.html',
            'skills.html',
            'contact.html'
          ),
          { minLength: 2, maxLength: 5 }
        ),
        async (navigationSequence) => {
          // Initialize PWA manager in standalone mode
          pwaManager = new PWAInstallManager({
            showInstallPrompt: false,
          })
          await pwaManager.init()

          let totalTransitioningClassAdds = 0

          // Simulate rapid clicks on different navigation links
          for (const targetPage of navigationSequence) {
            const linkElement = {
              tagName: 'A',
              href: `https://example.com/${targetPage}`,
              getAttribute: vi.fn((attr) => {
                if (attr === 'href') return targetPage
                return null
              }),
              closest: vi.fn((selector) => {
                if (selector === 'a') return linkElement
                return null
              }),
            }

            const clickEvent = {
              target: linkElement,
              preventDefault: vi.fn(),
            }

            // Trigger click handlers
            for (const handler of clickHandlers) {
              handler(clickEvent)
            }

            // Count page-transitioning class additions
            const addCalls = document.body.classList.add.mock.calls.filter(
              (call) => call[0] === 'page-transitioning'
            )
            totalTransitioningClassAdds += addCalls.length
          }

          // Property: No page-transitioning class should be added for any click
          // (This will FAIL on unfixed code - class is added for each click)
          expect(totalTransitioningClassAdds).toBe(0)

          // Cleanup
          pwaManager.destroy()
          pwaManager = null
          clickHandlers = []
          vi.clearAllMocks()
        }
      ),
      { numRuns: 10 }
    )
  })

  /**
   * Property: Navigation in standalone mode should complete smoothly
   * 
   * This test verifies the complete navigation flow without visual glitches.
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: TEST FAILS
   * - Visual flash effect WILL occur (bug exists)
   * - Opacity transition WILL be visible (bug exists)
   * - Delayed navigation WILL happen (bug exists)
   */
  it('should complete navigation smoothly without visual glitches in standalone mode', async () => {
    // Initialize PWA manager in standalone mode
    pwaManager = new PWAInstallManager({
      showInstallPrompt: false,
    })
    await pwaManager.init()

    // Verify we're in standalone mode
    expect(pwaManager.isStandalone).toBe(true)

    // Create mock internal link
    const linkElement = {
      tagName: 'A',
      href: 'https://example.com/about.html',
      getAttribute: vi.fn((attr) => {
        if (attr === 'href') return 'about.html'
        return null
      }),
      closest: vi.fn((selector) => {
        if (selector === 'a') return linkElement
        return null
      }),
    }

    const clickEvent = {
      target: linkElement,
      preventDefault: vi.fn(),
    }

    // Simulate click
    for (const handler of clickHandlers) {
      handler(clickEvent)
    }

    // Property 1: Event should be prevented (link interception works)
    expect(clickEvent.preventDefault).toHaveBeenCalled()

    // Property 2: No page-transitioning class should be applied
    // (This will FAIL on unfixed code)
    expect(document.body.classList.add).not.toHaveBeenCalledWith('page-transitioning')

    // Property 3: No setTimeout delay should be used
    // (This will FAIL on unfixed code - 200ms delay exists)
    const setTimeoutMock = vi.mocked(setTimeout)
    const setTimeoutCalls = setTimeoutMock.mock?.calls || []
    const navigationDelays = setTimeoutCalls.filter((call) => call[1] === 200)
    expect(navigationDelays.length).toBe(0)

    // Property 4: Navigation should be immediate
    // In the fixed version, window.location.href should be set directly
    // In the buggy version, it's wrapped in setTimeout
    // (This will FAIL on unfixed code)
    const hasImmediateNavigation = setTimeoutCalls.length === 0 || 
                                   !setTimeoutCalls.some(call => call[1] === 200)
    expect(hasImmediateNavigation).toBe(true)
  })
})

/**
 * Property 2: Preservation - Non-Navigation Functionality
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * These tests verify that behaviors NOT related to the bug continue working correctly.
 * 
 * EXPECTED OUTCOME ON UNFIXED CODE: TESTS PASS
 * - External links should NOT be intercepted (baseline behavior)
 * - Anchor links should work for same-page scrolling (baseline behavior)
 * - Non-standalone navigation should NOT be intercepted (baseline behavior)
 * - Reduced motion preferences should be respected (baseline behavior)
 * - Other PWA features should work normally (baseline behavior)
 * 
 * These tests establish a baseline to ensure the fix doesn't break existing functionality.
 */
describe('Property 2: Preservation - Non-Navigation Functionality', () => {
  let pwaManager
  let clickHandlers = []

  beforeEach(() => {
    // Reset click handlers
    clickHandlers = []

    // Mock window APIs
    global.window = {
      ...global.window,
      matchMedia: vi.fn((query) => ({
        matches: query.includes('standalone'), // Simulate standalone mode by default
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
      navigator: {
        standalone: true, // iOS standalone mode
        serviceWorker: {
          register: vi.fn().mockResolvedValue({
            installing: null,
            waiting: null,
            active: { state: 'activated' },
          }),
          ready: Promise.resolve({
            installing: null,
            waiting: null,
            active: { state: 'activated' },
          }),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
        onLine: true,
      },
    }

    // Create mock element factory
    const createMockElement = () => {
      const classList = new Set()
      return {
        className: '',
        innerHTML: '',
        classList: {
          add: vi.fn((className) => classList.add(className)),
          remove: vi.fn((className) => classList.delete(className)),
          contains: vi.fn((className) => classList.has(className)),
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
      }
    }

    // Mock document with click event capture
    const bodyElement = createMockElement()
    global.document = {
      body: bodyElement,
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
      addEventListener: vi.fn((event, handler) => {
        if (event === 'click') {
          clickHandlers.push(handler)
        }
      }),
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

    // Mock setTimeout
    vi.useFakeTimers()
  })

  afterEach(() => {
    if (pwaManager) {
      pwaManager.destroy()
    }
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  /**
   * Requirement 3.1: External links should NOT be intercepted
   * 
   * Property: External links (starting with http/https) should be handled normally
   * without interception, even in standalone mode.
   * 
   * EXPECTED OUTCOME: TEST PASSES (baseline behavior preserved)
   */
  it('should NOT intercept external links (http/https)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'https://github.com',
          'http://example.com',
          'https://www.google.com',
          'http://stackoverflow.com'
        ),
        async (externalUrl) => {
          // Initialize PWA manager in standalone mode
          pwaManager = new PWAInstallManager({
            showInstallPrompt: false,
          })
          await pwaManager.init()

          // Verify we're in standalone mode
          expect(pwaManager.isStandalone).toBe(true)

          // Create mock external link element
          const linkElement = {
            tagName: 'A',
            href: externalUrl,
            getAttribute: vi.fn((attr) => {
              if (attr === 'href') return externalUrl
              return null
            }),
            closest: vi.fn((selector) => {
              if (selector === 'a') return linkElement
              return null
            }),
          }

          // Create mock click event
          const clickEvent = {
            target: linkElement,
            preventDefault: vi.fn(),
          }

          // Simulate click on external link
          for (const handler of clickHandlers) {
            handler(clickEvent)
          }

          // Property: External links should NOT be intercepted
          // preventDefault should NOT be called for external links
          expect(clickEvent.preventDefault).not.toHaveBeenCalled()

          // Property: No page-transitioning class should be applied for external links
          expect(document.body.classList.add).not.toHaveBeenCalledWith('page-transitioning')

          // Cleanup for next iteration
          pwaManager.destroy()
          pwaManager = null
          clickHandlers = []
          vi.clearAllMocks()
        }
      ),
      { numRuns: 10 }
    )
  })

  /**
   * Requirement 3.2: Anchor links should work for same-page scrolling
   * 
   * Property: Anchor links (starting with #) should be handled normally
   * for smooth scrolling within the same page.
   * 
   * EXPECTED OUTCOME: TEST PASSES (baseline behavior preserved)
   */
  it('should NOT intercept anchor links for same-page scrolling', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          '#about',
          '#skills',
          '#projects',
          '#contact',
          '#section-1',
          '#footer'
        ),
        async (anchorLink) => {
          // Initialize PWA manager in standalone mode
          pwaManager = new PWAInstallManager({
            showInstallPrompt: false,
          })
          await pwaManager.init()

          // Verify we're in standalone mode
          expect(pwaManager.isStandalone).toBe(true)

          // Create mock anchor link element
          const linkElement = {
            tagName: 'A',
            href: `https://example.com/${anchorLink}`,
            getAttribute: vi.fn((attr) => {
              if (attr === 'href') return anchorLink
              return null
            }),
            closest: vi.fn((selector) => {
              if (selector === 'a') return linkElement
              return null
            }),
          }

          // Create mock click event
          const clickEvent = {
            target: linkElement,
            preventDefault: vi.fn(),
          }

          // Simulate click on anchor link
          for (const handler of clickHandlers) {
            handler(clickEvent)
          }

          // Property: Anchor links should NOT be intercepted
          // preventDefault should NOT be called for anchor links
          expect(clickEvent.preventDefault).not.toHaveBeenCalled()

          // Property: No page-transitioning class should be applied for anchor links
          expect(document.body.classList.add).not.toHaveBeenCalledWith('page-transitioning')

          // Cleanup for next iteration
          pwaManager.destroy()
          pwaManager = null
          clickHandlers = []
          vi.clearAllMocks()
        }
      ),
      { numRuns: 10 }
    )
  })

  /**
   * Requirement 3.3: Non-standalone navigation should work normally
   * 
   * Property: Navigation in non-standalone browser mode should NOT be intercepted.
   * The smooth navigation feature should only work in standalone PWA mode.
   * 
   * EXPECTED OUTCOME: TEST PASSES (baseline behavior preserved)
   */
  it('should NOT intercept navigation in non-standalone browser mode', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'about.html',
          'projects.html',
          'skills.html',
          'contact.html'
        ),
        async (targetPage) => {
          // Mock non-standalone mode
          global.window.matchMedia = vi.fn((query) => ({
            matches: false, // NOT in standalone mode
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          }))
          global.window.navigator.standalone = false

          // Initialize PWA manager in NON-standalone mode
          pwaManager = new PWAInstallManager({
            showInstallPrompt: false,
          })
          await pwaManager.init()

          // Verify we're NOT in standalone mode
          expect(pwaManager.isStandalone).toBe(false)

          // Create mock internal link element
          const linkElement = {
            tagName: 'A',
            href: `https://example.com/${targetPage}`,
            getAttribute: vi.fn((attr) => {
              if (attr === 'href') return targetPage
              return null
            }),
            closest: vi.fn((selector) => {
              if (selector === 'a') return linkElement
              return null
            }),
          }

          // Create mock click event
          const clickEvent = {
            target: linkElement,
            preventDefault: vi.fn(),
          }

          // Simulate click on internal link in non-standalone mode
          for (const handler of clickHandlers) {
            handler(clickEvent)
          }

          // Property: Internal links should NOT be intercepted in non-standalone mode
          // preventDefault should NOT be called
          expect(clickEvent.preventDefault).not.toHaveBeenCalled()

          // Property: No page-transitioning class should be applied in non-standalone mode
          expect(document.body.classList.add).not.toHaveBeenCalledWith('page-transitioning')

          // Cleanup for next iteration
          pwaManager.destroy()
          pwaManager = null
          clickHandlers = []
          vi.clearAllMocks()
        }
      ),
      { numRuns: 10 }
    )
  })

  /**
   * Requirement 3.4: Reduced motion preferences should be respected
   * 
   * Property: When users have reduced motion preferences enabled,
   * the system should respect those preferences.
   * 
   * Note: The current implementation doesn't explicitly check for reduced motion
   * in setupSmoothNavigation, but the CSS handles it via media query.
   * This test verifies that the navigation logic doesn't interfere with
   * reduced motion preferences.
   * 
   * EXPECTED OUTCOME: TEST PASSES (baseline behavior preserved)
   */
  it('should respect reduced motion preferences', async () => {
    // Mock reduced motion preference
    global.window.matchMedia = vi.fn((query) => {
      if (query.includes('prefers-reduced-motion')) {
        return {
          matches: true, // Reduced motion enabled
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }
      }
      if (query.includes('standalone')) {
        return {
          matches: true, // In standalone mode
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

    // Initialize PWA manager
    pwaManager = new PWAInstallManager({
      showInstallPrompt: false,
    })
    await pwaManager.init()

    // Verify we're in standalone mode
    expect(pwaManager.isStandalone).toBe(true)

    // Create mock internal link
    const linkElement = {
      tagName: 'A',
      href: 'https://example.com/about.html',
      getAttribute: vi.fn((attr) => {
        if (attr === 'href') return 'about.html'
        return null
      }),
      closest: vi.fn((selector) => {
        if (selector === 'a') return linkElement
        return null
      }),
    }

    const clickEvent = {
      target: linkElement,
      preventDefault: vi.fn(),
    }

    // Simulate click
    for (const handler of clickHandlers) {
      handler(clickEvent)
    }

    // Property: The navigation logic should still work
    // (The CSS media query handles disabling transitions, not the JS)
    // This test verifies that the JS navigation logic doesn't break
    // when reduced motion is enabled
    expect(clickEvent.preventDefault).toHaveBeenCalled()

    // The page-transitioning class may still be added by the buggy code,
    // but the CSS media query should disable the transition
    // This is the expected baseline behavior
  })

  /**
   * Requirement 3.5: Other PWA features should work normally
   * 
   * Property: All other PWA functionality (install prompts, service worker management,
   * iOS fixes) should remain operational after navigation setup.
   * 
   * EXPECTED OUTCOME: TEST PASSES (baseline behavior preserved)
   */
  it('should preserve all other PWA functionality', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          showInstallPrompt: fc.boolean(),
          promptDelay: fc.integer({ min: 1000, max: 5000 }),
        }),
        async (config) => {
          // Initialize PWA manager with various configurations
          pwaManager = new PWAInstallManager(config)
          await pwaManager.init()

          // Property 1: Install prompt functionality should be available
          expect(typeof pwaManager.showInstallPrompt).toBe('function')
          expect(typeof pwaManager.canInstall).toBe('function')

          // Property 2: Status tracking should work
          const status = pwaManager.getStatus()
          expect(status).toBeDefined()
          expect(typeof status.isStandalone).toBe('boolean')
          expect(typeof status.canInstall).toBe('boolean')

          // Property 3: iOS fixes should be applied in standalone mode
          if (pwaManager.isStandalone) {
            // Verify overscroll behavior is set
            expect(document.body.style.overscrollBehavior).toBe('none')
          }

          // Property 4: Event listeners should be set up for PWA events
          // The PWA manager sets up event listeners for beforeinstallprompt and appinstalled
          const documentAddEventListenerCalls = global.document.addEventListener.mock?.calls || []
          
          // Check that visibility change listener is set up
          const hasVisibilityListener = documentAddEventListenerCalls.some(
            call => call[0] === 'visibilitychange'
          )
          expect(hasVisibilityListener).toBe(true)

          // Cleanup for next iteration
          pwaManager.destroy()
          pwaManager = null
          vi.clearAllMocks()
        }
      ),
      { numRuns: 10 }
    )
  })

  /**
   * Combined preservation property: Multiple non-buggy scenarios
   * 
   * This test generates various non-buggy scenarios and verifies that
   * the navigation system handles them correctly without interference.
   * 
   * EXPECTED OUTCOME: TEST PASSES (baseline behavior preserved)
   */
  it('should handle all non-buggy navigation scenarios correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // External links
          fc.record({
            type: fc.constant('external'),
            href: fc.constantFrom(
              'https://github.com',
              'http://example.com',
              'https://www.google.com'
            ),
          }),
          // Anchor links
          fc.record({
            type: fc.constant('anchor'),
            href: fc.constantFrom('#about', '#skills', '#contact'),
          }),
          // Non-standalone internal links
          fc.record({
            type: fc.constant('non-standalone'),
            href: fc.constantFrom('about.html', 'projects.html', 'skills.html'),
          })
        ),
        async (scenario) => {
          // Configure standalone mode based on scenario
          const isStandalone = scenario.type !== 'non-standalone'
          global.window.matchMedia = vi.fn((query) => ({
            matches: query.includes('standalone') && isStandalone,
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          }))
          global.window.navigator.standalone = isStandalone

          // Initialize PWA manager
          pwaManager = new PWAInstallManager({
            showInstallPrompt: false,
          })
          await pwaManager.init()

          // Create mock link element
          const linkElement = {
            tagName: 'A',
            href:
              scenario.type === 'external'
                ? scenario.href
                : `https://example.com/${scenario.href}`,
            getAttribute: vi.fn((attr) => {
              if (attr === 'href') return scenario.href
              return null
            }),
            closest: vi.fn((selector) => {
              if (selector === 'a') return linkElement
              return null
            }),
          }

          // Create mock click event
          const clickEvent = {
            target: linkElement,
            preventDefault: vi.fn(),
          }

          // Simulate click
          for (const handler of clickHandlers) {
            handler(clickEvent)
          }

          // Property: None of these scenarios should be intercepted
          // (They are all non-buggy cases that should work normally)
          expect(clickEvent.preventDefault).not.toHaveBeenCalled()

          // Property: No page-transitioning class for non-buggy scenarios
          expect(document.body.classList.add).not.toHaveBeenCalledWith('page-transitioning')

          // Cleanup for next iteration
          pwaManager.destroy()
          pwaManager = null
          clickHandlers = []
          vi.clearAllMocks()
        }
      ),
      { numRuns: 20 }
    )
  })
})
