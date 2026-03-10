/**
 * Theme Engine Module
 * Manages light/dark theme switching with system preference detection
 */

import { logger } from '../utils/logger.js'
import { calculateContrastRatio, validateThemeContrast } from '../utils/contrast.js'

export class ThemeEngine {
  constructor(config = {}) {
    this.config = {
      storageKey: 'portfolio-theme',
      defaultTheme: 'auto',
      ...config,
    }

    this.currentTheme = null
    this.systemTheme = null
    this.mediaQuery = null
    this.isInitialized = false

    // Bind methods
    this.handleSystemThemeChange = this.handleSystemThemeChange.bind(this)
    this.switchTheme = this.switchTheme.bind(this)
  }

  /**
   * Initialize the theme engine
   */
  async init() {
    const startTime = window.performance ? window.performance.now() : Date.now()
    
    try {
      logger.info('Initializing Theme Engine...')

      // Set up system theme detection
      this.setupSystemThemeDetection()

      // Load saved theme or use default
      const savedTheme = this.loadSavedTheme()

      // Apply initial theme
      await this.applyTheme(savedTheme)

      // Set up theme toggle button
      this.setupThemeToggle()

      this.isInitialized = true
      this.initializationTime = (window.performance ? window.performance.now() : Date.now()) - startTime
      
      logger.info(`Theme Engine initialized successfully in ${this.initializationTime.toFixed(2)}ms`)
    } catch (initError) {
      logger.error('Failed to initialize Theme Engine:', initError)
      throw initError
    }
  }

  /**
   * Set up system theme preference detection
   */
  setupSystemThemeDetection() {
    // Create media query for dark mode preference
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    // Get initial system theme
    this.systemTheme = this.mediaQuery.matches ? 'dark' : 'light'

    // Listen for system theme changes
    this.mediaQuery.addEventListener('change', this.handleSystemThemeChange)

    logger.info(`System theme detected: ${this.systemTheme}`)
  }

  /**
   * Handle system theme preference changes
   */
  handleSystemThemeChange(event) {
    this.systemTheme = event.matches ? 'dark' : 'light'
    logger.info(`System theme changed to: ${this.systemTheme}`)

    // If current theme is 'auto', update the applied theme
    if (this.currentTheme === 'auto') {
      this.applyTheme('auto')
    }
  }

  /**
   * Load saved theme from localStorage
   */
  loadSavedTheme() {
    try {
      const saved = localStorage.getItem(this.config.storageKey)
      return saved || this.config.defaultTheme
    } catch (error) {
      logger.warn('Failed to load saved theme:', error)
      return this.config.defaultTheme
    }
  }

  /**
   * Save theme to localStorage
   */
  saveTheme(theme) {
    try {
      localStorage.setItem(this.config.storageKey, theme)
      logger.info(`Theme saved: ${theme}`)
    } catch (error) {
      logger.warn('Failed to save theme:', error)
    }
  }

  /**
   * Apply a theme to the document
   */
  async applyTheme(theme) {
    const validThemes = ['light', 'dark', 'auto']

    if (!validThemes.includes(theme)) {
      logger.warn(`Invalid theme: ${theme}. Using default.`)
      theme = this.config.defaultTheme
    }

    this.currentTheme = theme

    // Determine the actual theme to apply
    let appliedTheme = theme
    if (theme === 'auto') {
      appliedTheme = this.systemTheme
    }

    // Validate contrast ratios for the theme
    const contrastValidation = validateThemeContrast(appliedTheme)
    if (!contrastValidation.passes) {
      logger.warn(`Theme ${appliedTheme} has contrast ratio issues:`)
      contrastValidation.results.forEach(result => {
        if (!result.passes) {
          logger.warn(`  ${result.name}: ${result.ratio.toFixed(2)}:1 (required: ${result.required}:1)`)
        }
      })
    } else {
      logger.info(`Theme ${appliedTheme} contrast validation passed`)
    }

    // Add transition class for smooth theme switching
    document.documentElement.classList.add('theme-transitioning')

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', appliedTheme)

    // Update theme color meta tag for mobile browsers
    this.updateThemeColorMeta(appliedTheme)

    // Save theme preference
    this.saveTheme(theme)

    // Update theme toggle button
    this.updateThemeToggle(theme)

    // Remove transition class after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning')
    }, 300)

    // Dispatch theme change event
    document.dispatchEvent(
      new CustomEvent('themeChanged', {
        detail: {
          theme: theme,
          appliedTheme: appliedTheme,
          systemTheme: this.systemTheme,
          contrastValidation: contrastValidation,
        },
      })
    )

    logger.info(`Theme applied: ${theme} (${appliedTheme})`)
  }

  /**
   * Update theme color meta tag for mobile browsers
   */
  updateThemeColorMeta(theme) {
    let themeColor = '#ffffff' // light theme default

    if (theme === 'dark') {
      themeColor = '#0f172a' // dark theme color
    }

    // Update existing meta tag or create new one
    let metaTag = document.querySelector('meta[name="theme-color"]')
    if (!metaTag) {
      metaTag = document.createElement('meta')
      metaTag.name = 'theme-color'
      document.head.appendChild(metaTag)
    }

    metaTag.content = themeColor
  }

  /**
   * Set up theme toggle button functionality
   */
  setupThemeToggle() {
    const toggleButton = document.querySelector('.theme-toggle')

    if (toggleButton) {
      toggleButton.addEventListener('click', this.handleThemeToggle.bind(this))

      // Add keyboard support
      toggleButton.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          this.handleThemeToggle()
        }
      })

      // Ensure button is focusable
      if (!toggleButton.hasAttribute('tabindex')) {
        toggleButton.setAttribute('tabindex', '0')
      }

      // Add ARIA attributes
      toggleButton.setAttribute('role', 'button')
      toggleButton.setAttribute('aria-label', 'Toggle theme')
    }
  }

  /**
   * Handle theme toggle button click
   */
  handleThemeToggle() {
    const themeOrder = ['light', 'dark', 'auto']
    const currentIndex = themeOrder.indexOf(this.currentTheme)
    const nextIndex = (currentIndex + 1) % themeOrder.length
    const nextTheme = themeOrder[nextIndex]

    this.switchTheme(nextTheme)
  }

  /**
   * Update theme toggle button appearance
   */
  updateThemeToggle(theme) {
    const toggleButton = document.querySelector('.theme-toggle')

    if (toggleButton) {
      // Update ARIA label
      const labels = {
        light: 'Switch to dark theme',
        dark: 'Switch to auto theme',
        auto: 'Switch to light theme',
      }

      toggleButton.setAttribute('aria-label', labels[theme] || 'Toggle theme')
      toggleButton.setAttribute('title', labels[theme] || 'Toggle theme')

      // Update button state
      toggleButton.setAttribute('data-theme', theme)

      // Update slider position
      const slider = toggleButton.querySelector('.toggle-slider')
      if (slider) {
        slider.setAttribute('data-theme', theme)
      }

      // Add visual feedback
      toggleButton.classList.add('theme-updated')
      setTimeout(() => {
        toggleButton.classList.remove('theme-updated')
      }, 200)
    }
  }

  /**
   * Switch to a specific theme
   */
  async switchTheme(theme) {
    if (!this.isInitialized) {
      logger.warn('Theme Engine not initialized')
      return
    }

    await this.applyTheme(theme)
  }

  /**
   * Get current theme information
   */
  getThemeInfo() {
    return {
      currentTheme: this.currentTheme,
      systemTheme: this.systemTheme,
      appliedTheme:
        this.currentTheme === 'auto' ? this.systemTheme : this.currentTheme,
    }
  }

  /**
   * Check if dark theme is currently applied
   */
  isDarkTheme() {
    const appliedTheme =
      this.currentTheme === 'auto' ? this.systemTheme : this.currentTheme
    return appliedTheme === 'dark'
  }

  /**
   * Check if light theme is currently applied
   */
  isLightTheme() {
    const appliedTheme =
      this.currentTheme === 'auto' ? this.systemTheme : this.currentTheme
    return appliedTheme === 'light'
  }

  /**
   * Get available themes
   */
  getAvailableThemes() {
    return ['light', 'dark', 'auto']
  }

  /**
   * Reset theme to default
   */
  async resetTheme() {
    await this.applyTheme(this.config.defaultTheme)
  }

  /**
   * Toggle between light and dark (skip auto)
   */
  async toggleLightDark() {
    const currentApplied = this.currentTheme === 'auto' ? this.systemTheme : this.currentTheme
    const nextTheme = currentApplied === 'light' ? 'dark' : 'light'
    await this.switchTheme(nextTheme)
  }

  /**
   * Check if theme engine supports system preferences
   */
  supportsSystemPreferences() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches !== undefined
  }

  /**
   * Get theme statistics for analytics
   */
  getThemeStats() {
    return {
      currentTheme: this.currentTheme,
      systemTheme: this.systemTheme,
      appliedTheme: this.currentTheme === 'auto' ? this.systemTheme : this.currentTheme,
      supportsSystemPreferences: this.supportsSystemPreferences(),
      storageAvailable: this.isStorageAvailable(),
      initializationTime: this.initializationTime || null
    }
  }

  /**
   * Get contrast ratio for a color pair
   * @param {string} color1 - First color (hex format)
   * @param {string} color2 - Second color (hex format)
   * @returns {number} Contrast ratio
   */
  getContrastRatio(color1, color2) {
    return calculateContrastRatio(color1, color2)
  }

  /**
   * Validate contrast ratios for current theme
   * @returns {{passes: boolean, results: Array}} Validation results
   */
  validateCurrentThemeContrast() {
    const appliedTheme = this.currentTheme === 'auto' ? this.systemTheme : this.currentTheme
    return validateThemeContrast(appliedTheme)
  }

  /**
   * Check if localStorage is available
   */
  isStorageAvailable() {
    try {
      const test = '__theme_storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (storageError) {
      logger.warn('localStorage not available:', storageError)
      return false
    }
  }

  /**
   * Destroy the theme engine and clean up
   */
  destroy() {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener(
        'change',
        this.handleSystemThemeChange
      )
    }

    const toggleButton = document.querySelector('.theme-toggle')
    if (toggleButton) {
      toggleButton.removeEventListener('click', this.handleThemeToggle)
    }

    // Remove theme transition class if it exists
    document.documentElement.classList.remove('theme-transitioning')

    this.isInitialized = false
    logger.info('Theme Engine destroyed')
  }

  /**
   * Run basic functionality tests (for development/debugging)
   */
  async runTests() {
    if (!this.isInitialized) {
      logger.error('Theme Engine not initialized')
      return false
    }

    logger.info('Running Theme Engine tests...')
    
    try {
      // Test theme switching
      const originalTheme = this.currentTheme
      
      await this.switchTheme('light')
      await new Promise(resolve => setTimeout(resolve, 100))
      
      await this.switchTheme('dark')
      await new Promise(resolve => setTimeout(resolve, 100))
      
      await this.switchTheme('auto')
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Restore original theme
      await this.switchTheme(originalTheme)
      
      logger.info('✅ Theme Engine tests passed')
      return true
    } catch (error) {
      logger.error('❌ Theme Engine tests failed:', error)
      return false
    }
  }
}

// Export singleton instance and helper function
export const themeEngine = new ThemeEngine()

/**
 * Initialize theme system (convenience function)
 */
export async function initTheme() {
  await themeEngine.init()
  return themeEngine
}
