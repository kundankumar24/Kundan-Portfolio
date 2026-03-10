/**
 * Unit Tests for I18n Engine
 * Tests language switching, translation, and multi-language support
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { I18nEngine } from '../js/modules/i18n.js'

describe('I18nEngine', () => {
  let i18n
  let mockLocalStorage

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {
      store: {},
      getItem(key) {
        return this.store[key] || null
      },
      setItem(key, value) {
        this.store[key] = value
      },
      removeItem(key) {
        delete this.store[key]
      },
      clear() {
        this.store = {}
      },
    }

    global.localStorage = mockLocalStorage

    // Create mock element factory
    const createMockElement = (tag = 'div') => ({
      tagName: tag.toUpperCase(),
      id: '',
      className: '',
      textContent: '',
      innerHTML: '',
      children: [],
      attributes: {},
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        toggle: vi.fn(),
        contains: vi.fn(() => false),
      },
      getAttribute: vi.fn((attr) => null),
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      appendChild: vi.fn(function (child) {
        this.children.push(child)
        return child
      }),
      removeChild: vi.fn(),
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(() => false),
    })

    // Mock document
    global.document = {
      documentElement: { 
        lang: 'en',
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
        removeAttribute: vi.fn(),
      },
      querySelectorAll: vi.fn(() => []),
      getElementById: vi.fn(() => null),
      querySelector: vi.fn(() => null),
      createElement: vi.fn((tag) => createMockElement(tag)),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
    }

    // Mock navigator
    global.navigator = {
      language: 'en-US',
    }

    // Create fresh instance
    i18n = new I18nEngine({
      storageKey: 'test-language',
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'es', 'fr', 'de'],
      fallbackLanguage: 'en',
      autoDetect: true,
    })
  })

  afterEach(() => {
    if (i18n) {
      i18n.destroy()
    }
    mockLocalStorage.clear()
  })

  describe('Initialization', () => {
    it('should initialize with default configuration', async () => {
      await i18n.init()

      expect(i18n.isInitialized).toBe(true)
      expect(i18n.currentLanguage).toBeTruthy()
      expect(i18n.translations.size).toBeGreaterThan(0)
    })

    it('should load translations for all supported languages', async () => {
      await i18n.loadTranslations()

      expect(i18n.translations.has('en')).toBe(true)
      expect(i18n.translations.has('es')).toBe(true)
      expect(i18n.translations.has('fr')).toBe(true)
      expect(i18n.translations.has('de')).toBe(true)
    })

    it('should set HTML lang attribute on initialization', async () => {
      await i18n.init()

      expect(document.documentElement.lang).toBeTruthy()
    })

    it('should use saved language preference if available', async () => {
      mockLocalStorage.setItem('test-language', 'es')

      const detected = i18n.detectLanguage()

      expect(detected).toBe('es')
    })

    it('should auto-detect browser language if no saved preference', () => {
      global.navigator.language = 'fr-FR'

      const detected = i18n.detectLanguage()

      expect(detected).toBe('fr')
    })

    it('should fall back to default language if browser language not supported', () => {
      global.navigator.language = 'ja-JP'

      const detected = i18n.detectLanguage()

      expect(detected).toBe('en')
    })
  })

  describe('Language Detection', () => {
    it('should detect browser language correctly', () => {
      global.navigator.language = 'es-ES'
      const detected = i18n.detectBrowserLanguage()

      expect(detected).toBe('es')
    })

    it('should extract language code from locale', () => {
      global.navigator.language = 'fr-CA'
      const detected = i18n.detectBrowserLanguage()

      expect(detected).toBe('fr')
    })

    it('should return null if no browser language available', () => {
      global.navigator.language = null
      const detected = i18n.detectBrowserLanguage()

      expect(detected).toBeNull()
    })

    it('should check if language is supported', () => {
      expect(i18n.isLanguageSupported('en')).toBe(true)
      expect(i18n.isLanguageSupported('es')).toBe(true)
      expect(i18n.isLanguageSupported('ja')).toBe(false)
      expect(i18n.isLanguageSupported('zh')).toBe(false)
    })
  })

  describe('Language Switching', () => {
    beforeEach(async () => {
      await i18n.loadTranslations()
      i18n.currentLanguage = 'en'
      i18n.isInitialized = true
    })

    it('should switch language successfully', async () => {
      await i18n.setLanguage('es')

      expect(i18n.currentLanguage).toBe('es')
    })

    it('should save language preference to storage', async () => {
      await i18n.setLanguage('fr')

      expect(mockLocalStorage.getItem('test-language')).toBe('fr')
    })

    it('should dispatch language change event', async () => {
      await i18n.setLanguage('de')

      expect(document.dispatchEvent).toHaveBeenCalled()
    })

    it('should notify observers on language change', async () => {
      const observer = vi.fn()
      i18n.subscribe(observer)

      await i18n.setLanguage('es')

      expect(observer).toHaveBeenCalledWith('es', 'en')
    })

    it('should fall back to fallback language if unsupported language requested', async () => {
      await i18n.setLanguage('ja')

      expect(i18n.currentLanguage).toBe('en')
    })

    it('should update UI elements with data-i18n attribute', async () => {
      const mockElement = {
        getAttribute: vi.fn((attr) => {
          if (attr === 'data-i18n') return 'nav.home'
          return null
        }),
        setAttribute: vi.fn(),
        textContent: '',
      }

      document.querySelectorAll = vi.fn(() => [mockElement])

      await i18n.setLanguage('es')

      expect(mockElement.textContent).toBe('Inicio')
    })
  })

  describe('Translation', () => {
    beforeEach(async () => {
      await i18n.loadTranslations()
      i18n.currentLanguage = 'en'
    })

    it('should translate simple keys', async () => {
      await i18n.loadTranslations()
      
      i18n.currentLanguage = 'en'
      expect(i18n.t('nav.home')).toBe('Home')

      i18n.currentLanguage = 'es'
      expect(i18n.t('nav.home')).toBe('Inicio')

      i18n.currentLanguage = 'fr'
      expect(i18n.t('nav.home')).toBe('Accueil')
    })

    it('should translate nested keys', () => {
      i18n.currentLanguage = 'en'
      expect(i18n.t('projects.title')).toBe('My Projects')
      expect(i18n.t('contact.title')).toBe('Get In Touch')
    })

    it('should return key if translation not found', () => {
      const result = i18n.t('nonexistent.key')
      expect(result).toBe('nonexistent.key')
    })

    it('should fall back to fallback language if translation missing', async () => {
      await i18n.loadTranslations()
      
      // Remove a translation from Spanish
      const esTranslations = i18n.translations.get('es')
      delete esTranslations.nav.home

      i18n.currentLanguage = 'es'
      const result = i18n.t('nav.home')

      // Should fall back to English
      expect(result).toBe('Home')
    })

    it('should interpolate parameters in translations', async () => {
      await i18n.loadTranslations()
      
      // Add a translation with parameters
      const enTranslations = i18n.translations.get('en')
      enTranslations.greeting = 'Hello {name}, you have {count} messages'

      const result = i18n.t('greeting', { name: 'John', count: 5 })
      expect(result).toBe('Hello John, you have 5 messages')
    })

    it('should handle missing parameters in interpolation', async () => {
      await i18n.loadTranslations()
      
      const enTranslations = i18n.translations.get('en')
      enTranslations.greeting = 'Hello {name}'

      const result = i18n.t('greeting', {})
      expect(result).toBe('Hello {name}')
    })
  })

  describe('Language Switcher UI', () => {
    beforeEach(async () => {
      await i18n.init()
    })

    it('should create language switcher element', () => {
      const switcher = i18n.createLanguageSwitcher()

      expect(switcher).toBeTruthy()
      expect(switcher.id).toBe('language-switcher')
      expect(switcher.className).toBe('language-switcher')
    })

    it('should include all supported languages in dropdown', () => {
      const switcher = i18n.createLanguageSwitcher()
      const options = switcher.querySelectorAll('[data-language]')

      expect(options.length).toBe(4)
    })

    it('should mark current language as active', () => {
      i18n.currentLanguage = 'es'
      const switcher = i18n.createLanguageSwitcher()
      const activeOption = switcher.querySelector('[data-language="es"]')

      expect(activeOption.classList.contains('active')).toBe(true)
    })

    it('should get correct language name', () => {
      expect(i18n.getLanguageName('en')).toBe('English')
      expect(i18n.getLanguageName('es')).toBe('Español')
      expect(i18n.getLanguageName('fr')).toBe('Français')
      expect(i18n.getLanguageName('de')).toBe('Deutsch')
    })
  })

  describe('Storage', () => {
    it('should check if localStorage is available', () => {
      expect(i18n.isStorageAvailable()).toBe(true)
    })

    it('should handle localStorage unavailability gracefully', () => {
      global.localStorage = null

      expect(i18n.isStorageAvailable()).toBe(false)
      expect(i18n.loadSavedLanguage()).toBeNull()
      expect(i18n.saveLanguage('es')).toBe(false)
    })

    it('should save and load language preference', () => {
      i18n.saveLanguage('fr')
      const loaded = i18n.loadSavedLanguage()

      expect(loaded).toBe('fr')
    })
  })

  describe('Observers', () => {
    beforeEach(async () => {
      await i18n.loadTranslations()
      i18n.currentLanguage = 'en'
      i18n.isInitialized = true
    })

    it('should subscribe to language changes', () => {
      const observer = vi.fn()
      const unsubscribe = i18n.subscribe(observer)

      expect(typeof unsubscribe).toBe('function')
      expect(i18n.observers.has(observer)).toBe(true)
    })

    it('should unsubscribe from language changes', () => {
      const observer = vi.fn()
      const unsubscribe = i18n.subscribe(observer)

      unsubscribe()

      expect(i18n.observers.has(observer)).toBe(false)
    })

    it('should notify all observers on language change', async () => {
      const observer1 = vi.fn()
      const observer2 = vi.fn()

      i18n.subscribe(observer1)
      i18n.subscribe(observer2)

      await i18n.setLanguage('es')

      expect(observer1).toHaveBeenCalledWith('es', 'en')
      expect(observer2).toHaveBeenCalledWith('es', 'en')
    })

    it('should handle observer errors gracefully', async () => {
      const errorObserver = vi.fn(() => {
        throw new Error('Observer error')
      })
      const normalObserver = vi.fn()

      i18n.subscribe(errorObserver)
      i18n.subscribe(normalObserver)

      await i18n.setLanguage('fr')

      // Normal observer should still be called despite error in first observer
      expect(normalObserver).toHaveBeenCalled()
    })
  })

  describe('Statistics', () => {
    beforeEach(async () => {
      await i18n.loadTranslations()
      i18n.currentLanguage = 'en'
      i18n.isInitialized = true
    })

    it('should return correct statistics', () => {
      const stats = i18n.getStats()

      expect(stats.currentLanguage).toBeTruthy()
      expect(stats.supportedLanguages).toEqual(['en', 'es', 'fr', 'de'])
      expect(stats.loadedLanguages.length).toBeGreaterThan(0)
      expect(stats.defaultLanguage).toBe('en')
      expect(stats.fallbackLanguage).toBe('en')
      expect(stats.isInitialized).toBe(true)
    })

    it('should track observer count', () => {
      const observer1 = vi.fn()
      const observer2 = vi.fn()

      i18n.subscribe(observer1)
      i18n.subscribe(observer2)

      const stats = i18n.getStats()
      expect(stats.observerCount).toBe(2)
    })
  })

  describe('Getters', () => {
    beforeEach(async () => {
      await i18n.loadTranslations()
      i18n.currentLanguage = 'es'
      i18n.isInitialized = true
    })

    it('should get current language', () => {
      expect(i18n.getCurrentLanguage()).toBe('es')
    })

    it('should get supported languages', () => {
      const languages = i18n.getSupportedLanguages()
      expect(languages).toEqual(['en', 'es', 'fr', 'de'])
    })

    it('should get all translations for current language', () => {
      i18n.currentLanguage = 'en'
      const translations = i18n.getAllTranslations()

      expect(translations).toBeTruthy()
      expect(translations.nav).toBeTruthy()
      expect(translations.nav.home).toBe('Home')
    })
  })

  describe('Cleanup', () => {
    beforeEach(async () => {
      await i18n.init()
    })

    it('should destroy and clean up resources', () => {
      const observer = vi.fn()
      i18n.subscribe(observer)

      i18n.destroy()

      expect(i18n.translations.size).toBe(0)
      expect(i18n.observers.size).toBe(0)
      expect(i18n.currentLanguage).toBeNull()
      expect(i18n.isInitialized).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty configuration', async () => {
      const i18nEmpty = new I18nEngine({})
      await i18nEmpty.loadTranslations()
      i18nEmpty.currentLanguage = 'en'

      expect(i18nEmpty.currentLanguage).toBeTruthy()
      expect(i18nEmpty.config.defaultLanguage).toBe('en')
    })

    it('should handle translation key with special characters', async () => {
      await i18n.loadTranslations()
      i18n.currentLanguage = 'en'
      
      const result = i18n.t('key.with.many.dots')

      expect(result).toBe('key.with.many.dots')
    })

    it('should handle empty translation key', async () => {
      await i18n.loadTranslations()
      i18n.currentLanguage = 'en'
      
      const result = i18n.t('')

      expect(result).toBe('')
    })

    it('should handle null/undefined parameters', async () => {
      await i18n.loadTranslations()
      i18n.currentLanguage = 'en'
      
      const result = i18n.t('nav.home', null)

      expect(result).toBe('Home')
    })
  })
})

