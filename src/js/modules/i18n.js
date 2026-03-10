/**
 * Internationalization (i18n) Module
 * Manages language switching and multi-language content support
 * Requirements: 3.3
 */

import { logger } from '../utils/logger.js'

/**
 * I18nEngine - Manages internationalization and localization
 */
export class I18nEngine {
  constructor(config = {}) {
    this.config = {
      storageKey: config.storageKey || 'portfolio-language',
      defaultLanguage: config.defaultLanguage || 'en',
      supportedLanguages: config.supportedLanguages || ['en', 'es', 'fr', 'de'],
      fallbackLanguage: config.fallbackLanguage || 'en',
      autoDetect: config.autoDetect !== false,
      ...config,
    }

    this.currentLanguage = null
    this.translations = new Map()
    this.isInitialized = false
    this.observers = new Set()
  }

  /**
   * Initialize the i18n engine
   */
  async init() {
    try {
      logger.info('Initializing I18n Engine...')

      // Load translations for all supported languages
      await this.loadTranslations()

      // Detect or load saved language
      const language = this.detectLanguage()
      await this.setLanguage(language)

      // Setup language switcher UI
      this.setupLanguageSwitcher()

      this.isInitialized = true
      logger.info(`I18n Engine initialized with language: ${this.currentLanguage}`)

      return true
    } catch (error) {
      logger.error('Failed to initialize I18n Engine:', error)
      throw error
    }
  }

  /**
   * Load translation files for all supported languages
   */
  async loadTranslations() {
    const loadPromises = this.config.supportedLanguages.map(async (lang) => {
      try {
        // In a real implementation, this would load from JSON files
        // For now, we'll use inline translations
        const translations = await this.loadLanguageFile(lang)
        this.translations.set(lang, translations)
        logger.info(`Loaded translations for language: ${lang}`)
      } catch (error) {
        logger.error(`Failed to load translations for ${lang}:`, error)
        // Continue with other languages
      }
    })

    await Promise.all(loadPromises)
  }

  /**
   * Load translation file for a specific language
   * In production, this would fetch from /locales/{lang}.json
   */
  async loadLanguageFile(lang) {
    // Default translations structure
    const translations = {
      en: {
        nav: {
          home: 'Home',
          about: 'About',
          projects: 'Projects',
          skills: 'Skills',
          contact: 'Contact',
          blog: 'Blog',
          experience: 'Experience',
          education: 'Education',
          download: 'Download CV',
        },
        hero: {
          title: 'Welcome to My Portfolio',
          subtitle: 'Full Stack Developer & Designer',
          cta: 'View My Work',
        },
        projects: {
          title: 'My Projects',
          filter: 'Filter by',
          search: 'Search projects...',
          viewDetails: 'View Details',
          liveDemo: 'Live Demo',
          sourceCode: 'Source Code',
          technologies: 'Technologies',
          category: 'Category',
        },
        skills: {
          title: 'My Skills',
          proficiency: 'Proficiency',
          experience: 'Experience',
          years: 'years',
        },
        contact: {
          title: 'Get In Touch',
          name: 'Name',
          email: 'Email',
          message: 'Message',
          send: 'Send Message',
          sending: 'Sending...',
          success: 'Message sent successfully!',
          error: 'Failed to send message. Please try again.',
        },
        footer: {
          rights: 'All rights reserved',
          social: 'Follow me on social media',
        },
        theme: {
          light: 'Light Mode',
          dark: 'Dark Mode',
          auto: 'Auto',
        },
        language: {
          select: 'Select Language',
          current: 'Current Language',
        },
      },
      es: {
        nav: {
          home: 'Inicio',
          about: 'Acerca de',
          projects: 'Proyectos',
          skills: 'Habilidades',
          contact: 'Contacto',
          blog: 'Blog',
          experience: 'Experiencia',
          education: 'Educación',
          download: 'Descargar CV',
        },
        hero: {
          title: 'Bienvenido a Mi Portafolio',
          subtitle: 'Desarrollador Full Stack y Diseñador',
          cta: 'Ver Mi Trabajo',
        },
        projects: {
          title: 'Mis Proyectos',
          filter: 'Filtrar por',
          search: 'Buscar proyectos...',
          viewDetails: 'Ver Detalles',
          liveDemo: 'Demo en Vivo',
          sourceCode: 'Código Fuente',
          technologies: 'Tecnologías',
          category: 'Categoría',
        },
        skills: {
          title: 'Mis Habilidades',
          proficiency: 'Competencia',
          experience: 'Experiencia',
          years: 'años',
        },
        contact: {
          title: 'Contáctame',
          name: 'Nombre',
          email: 'Correo Electrónico',
          message: 'Mensaje',
          send: 'Enviar Mensaje',
          sending: 'Enviando...',
          success: '¡Mensaje enviado con éxito!',
          error: 'Error al enviar el mensaje. Por favor, inténtalo de nuevo.',
        },
        footer: {
          rights: 'Todos los derechos reservados',
          social: 'Sígueme en las redes sociales',
        },
        theme: {
          light: 'Modo Claro',
          dark: 'Modo Oscuro',
          auto: 'Automático',
        },
        language: {
          select: 'Seleccionar Idioma',
          current: 'Idioma Actual',
        },
      },
      fr: {
        nav: {
          home: 'Accueil',
          about: 'À Propos',
          projects: 'Projets',
          skills: 'Compétences',
          contact: 'Contact',
          blog: 'Blog',
          experience: 'Expérience',
          education: 'Éducation',
          download: 'Télécharger CV',
        },
        hero: {
          title: 'Bienvenue sur Mon Portfolio',
          subtitle: 'Développeur Full Stack et Designer',
          cta: 'Voir Mon Travail',
        },
        projects: {
          title: 'Mes Projets',
          filter: 'Filtrer par',
          search: 'Rechercher des projets...',
          viewDetails: 'Voir les Détails',
          liveDemo: 'Démo en Direct',
          sourceCode: 'Code Source',
          technologies: 'Technologies',
          category: 'Catégorie',
        },
        skills: {
          title: 'Mes Compétences',
          proficiency: 'Maîtrise',
          experience: 'Expérience',
          years: 'ans',
        },
        contact: {
          title: 'Contactez-Moi',
          name: 'Nom',
          email: 'Email',
          message: 'Message',
          send: 'Envoyer le Message',
          sending: 'Envoi en cours...',
          success: 'Message envoyé avec succès!',
          error: "Échec de l'envoi du message. Veuillez réessayer.",
        },
        footer: {
          rights: 'Tous droits réservés',
          social: 'Suivez-moi sur les réseaux sociaux',
        },
        theme: {
          light: 'Mode Clair',
          dark: 'Mode Sombre',
          auto: 'Automatique',
        },
        language: {
          select: 'Sélectionner la Langue',
          current: 'Langue Actuelle',
        },
      },
      de: {
        nav: {
          home: 'Startseite',
          about: 'Über Mich',
          projects: 'Projekte',
          skills: 'Fähigkeiten',
          contact: 'Kontakt',
          blog: 'Blog',
          experience: 'Erfahrung',
          education: 'Bildung',
          download: 'Lebenslauf Herunterladen',
        },
        hero: {
          title: 'Willkommen in Meinem Portfolio',
          subtitle: 'Full Stack Entwickler & Designer',
          cta: 'Meine Arbeit Ansehen',
        },
        projects: {
          title: 'Meine Projekte',
          filter: 'Filtern nach',
          search: 'Projekte suchen...',
          viewDetails: 'Details Ansehen',
          liveDemo: 'Live-Demo',
          sourceCode: 'Quellcode',
          technologies: 'Technologien',
          category: 'Kategorie',
        },
        skills: {
          title: 'Meine Fähigkeiten',
          proficiency: 'Kompetenz',
          experience: 'Erfahrung',
          years: 'Jahre',
        },
        contact: {
          title: 'Kontaktieren Sie Mich',
          name: 'Name',
          email: 'E-Mail',
          message: 'Nachricht',
          send: 'Nachricht Senden',
          sending: 'Wird gesendet...',
          success: 'Nachricht erfolgreich gesendet!',
          error: 'Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut.',
        },
        footer: {
          rights: 'Alle Rechte vorbehalten',
          social: 'Folgen Sie mir in den sozialen Medien',
        },
        theme: {
          light: 'Heller Modus',
          dark: 'Dunkler Modus',
          auto: 'Automatisch',
        },
        language: {
          select: 'Sprache Auswählen',
          current: 'Aktuelle Sprache',
        },
      },
    }

    return translations[lang] || translations[this.config.fallbackLanguage]
  }

  /**
   * Detect the user's preferred language
   */
  detectLanguage() {
    // 1. Check saved preference
    const savedLanguage = this.loadSavedLanguage()
    if (savedLanguage && this.isLanguageSupported(savedLanguage)) {
      return savedLanguage
    }

    // 2. Auto-detect from browser if enabled
    if (this.config.autoDetect) {
      const browserLanguage = this.detectBrowserLanguage()
      if (browserLanguage && this.isLanguageSupported(browserLanguage)) {
        return browserLanguage
      }
    }

    // 3. Fall back to default language
    return this.config.defaultLanguage
  }

  /**
   * Detect browser language
   */
  detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage
    if (!browserLang) {
      return null
    }

    // Extract language code (e.g., 'en-US' -> 'en')
    const langCode = browserLang.split('-')[0].toLowerCase()
    return langCode
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(lang) {
    return this.config.supportedLanguages.includes(lang)
  }

  /**
   * Load saved language from storage
   */
  loadSavedLanguage() {
    if (!this.isStorageAvailable()) {
      return null
    }

    try {
      return localStorage.getItem(this.config.storageKey)
    } catch (error) {
      logger.error('Failed to load saved language:', error)
      return null
    }
  }

  /**
   * Save language preference to storage
   */
  saveLanguage(lang) {
    if (!this.isStorageAvailable()) {
      return false
    }

    try {
      localStorage.setItem(this.config.storageKey, lang)
      return true
    } catch (error) {
      logger.error('Failed to save language:', error)
      return false
    }
  }

  /**
   * Set the current language and update the UI
   */
  async setLanguage(lang) {
    if (!this.isLanguageSupported(lang)) {
      logger.warn(`Language '${lang}' is not supported, using fallback`)
      lang = this.config.fallbackLanguage
    }

    const previousLanguage = this.currentLanguage
    this.currentLanguage = lang

    // Save preference
    this.saveLanguage(lang)

    // Update HTML lang attribute
    document.documentElement.lang = lang

    // Update UI with new translations
    this.updateUI()

    // Notify observers
    this.notifyLanguageChange(lang, previousLanguage)

    // Dispatch custom event
    document.dispatchEvent(
      new CustomEvent('languageChange', {
        detail: {
          language: lang,
          previousLanguage,
        },
      })
    )

    logger.info(`Language changed to: ${lang}`)
  }

  /**
   * Update UI elements with current language translations
   */
  updateUI() {
    // Find all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]')

    elements.forEach((element) => {
      const key = element.getAttribute('data-i18n')
      const translation = this.t(key)

      if (translation) {
        // Check if we should update a specific attribute
        const attr = element.getAttribute('data-i18n-attr')
        if (attr) {
          element.setAttribute(attr, translation)
        } else {
          // Update text content
          element.textContent = translation
        }
      }
    })

    // Update language switcher
    this.updateLanguageSwitcher()
  }

  /**
   * Get translation for a key
   * Supports nested keys with dot notation (e.g., 'nav.home')
   */
  t(key, params = {}) {
    const translations = this.translations.get(this.currentLanguage)
    if (!translations) {
      logger.warn(`No translations found for language: ${this.currentLanguage}`)
      return key
    }

    // Navigate nested object using dot notation
    const keys = key.split('.')
    let value = translations

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Key not found, try fallback language
        return this.getFallbackTranslation(key, params)
      }
    }

    // Replace parameters in translation
    if (typeof value === 'string' && params && Object.keys(params).length > 0) {
      return this.interpolate(value, params)
    }

    return value || key
  }

  /**
   * Get translation from fallback language
   */
  getFallbackTranslation(key, params = {}) {
    const fallbackTranslations = this.translations.get(this.config.fallbackLanguage)
    if (!fallbackTranslations) {
      return key
    }

    const keys = key.split('.')
    let value = fallbackTranslations

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key
      }
    }

    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return this.interpolate(value, params)
    }

    return value || key
  }

  /**
   * Interpolate parameters into translation string
   * Example: "Hello {name}" with {name: "John"} -> "Hello John"
   */
  interpolate(str, params) {
    return str.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match
    })
  }

  /**
   * Setup language switcher UI
   */
  setupLanguageSwitcher() {
    // Find or create language switcher
    let switcher = document.getElementById('language-switcher')

    if (!switcher) {
      // Create language switcher if it doesn't exist
      switcher = this.createLanguageSwitcher()
      
      // Try to add it to the header/nav
      const header = document.querySelector('header') || document.querySelector('nav')
      if (header) {
        header.appendChild(switcher)
      }
    }

    // Add event listeners to language options
    const languageButtons = switcher.querySelectorAll('[data-language]')
    languageButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault()
        const lang = button.getAttribute('data-language')
        this.setLanguage(lang)
        
        // Close dropdown after selection
        const dropdown = switcher.querySelector('.language-dropdown')
        const toggleButton = switcher.querySelector('.language-switcher-button')
        if (dropdown && toggleButton) {
          dropdown.classList.remove('open')
          toggleButton.setAttribute('aria-expanded', 'false')
        }
      })
    })
    
    // Add toggle functionality for dropdown
    const toggleButton = switcher.querySelector('.language-switcher-button')
    const dropdown = switcher.querySelector('.language-dropdown')
    
    if (toggleButton && dropdown) {
      toggleButton.addEventListener('click', (e) => {
        e.stopPropagation()
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true'
        toggleButton.setAttribute('aria-expanded', !isExpanded)
        dropdown.classList.toggle('open')
      })
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!switcher.contains(e.target)) {
          toggleButton.setAttribute('aria-expanded', 'false')
          dropdown.classList.remove('open')
        }
      })
    }
  }

  /**
   * Create language switcher UI element
   */
  createLanguageSwitcher() {
    const switcher = document.createElement('div')
    switcher.id = 'language-switcher'
    switcher.className = 'language-switcher'
    switcher.setAttribute('role', 'navigation')
    switcher.setAttribute('aria-label', 'Language selection')

    const button = document.createElement('button')
    button.className = 'language-switcher-button'
    button.setAttribute('aria-haspopup', 'true')
    button.setAttribute('aria-expanded', 'false')
    button.innerHTML = `
      <span class="language-icon">🌐</span>
      <span class="language-label">${this.getLanguageName(this.currentLanguage)}</span>
      <span class="language-arrow">▼</span>
    `

    const dropdown = document.createElement('div')
    dropdown.className = 'language-dropdown'
    dropdown.setAttribute('role', 'menu')

    this.config.supportedLanguages.forEach((lang) => {
      const option = document.createElement('button')
      option.className = 'language-option'
      option.setAttribute('data-language', lang)
      option.setAttribute('role', 'menuitem')
      option.textContent = this.getLanguageName(lang)

      if (lang === this.currentLanguage) {
        option.classList.add('active')
        option.setAttribute('aria-current', 'true')
      }

      dropdown.appendChild(option)
    })

    // Toggle dropdown on button click
    button.addEventListener('click', () => {
      const isExpanded = button.getAttribute('aria-expanded') === 'true'
      button.setAttribute('aria-expanded', !isExpanded)
      dropdown.classList.toggle('open')
    })

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!switcher.contains(e.target)) {
        button.setAttribute('aria-expanded', 'false')
        dropdown.classList.remove('open')
      }
    })

    switcher.appendChild(button)
    switcher.appendChild(dropdown)

    return switcher
  }

  /**
   * Update language switcher to reflect current language
   */
  updateLanguageSwitcher() {
    const switcher = document.getElementById('language-switcher')
    if (!switcher) {
      return
    }

    // Update button label
    const label = switcher.querySelector('.language-label')
    if (label) {
      label.textContent = this.getLanguageName(this.currentLanguage)
    }

    // Update active state in dropdown
    const options = switcher.querySelectorAll('[data-language]')
    options.forEach((option) => {
      const lang = option.getAttribute('data-language')
      if (lang === this.currentLanguage) {
        option.classList.add('active')
        option.setAttribute('aria-current', 'true')
      } else {
        option.classList.remove('active')
        option.removeAttribute('aria-current')
      }
    })
  }

  /**
   * Get human-readable language name
   */
  getLanguageName(lang) {
    const names = {
      en: 'English',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
    }
    return names[lang] || lang.toUpperCase()
  }

  /**
   * Subscribe to language change events
   */
  subscribe(callback) {
    this.observers.add(callback)
    return () => this.observers.delete(callback)
  }

  /**
   * Notify observers of language change
   */
  notifyLanguageChange(newLanguage, oldLanguage) {
    this.observers.forEach((callback) => {
      try {
        callback(newLanguage, oldLanguage)
      } catch (error) {
        logger.error('Error in language change observer:', error)
      }
    })
  }

  /**
   * Get current language
   */
  getCurrentLanguage() {
    return this.currentLanguage
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return [...this.config.supportedLanguages]
  }

  /**
   * Get all translations for current language
   */
  getAllTranslations() {
    return this.translations.get(this.currentLanguage) || {}
  }

  /**
   * Check if localStorage is available
   */
  isStorageAvailable() {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get i18n engine statistics
   */
  getStats() {
    return {
      currentLanguage: this.currentLanguage,
      supportedLanguages: this.config.supportedLanguages,
      loadedLanguages: Array.from(this.translations.keys()),
      defaultLanguage: this.config.defaultLanguage,
      fallbackLanguage: this.config.fallbackLanguage,
      autoDetect: this.config.autoDetect,
      isInitialized: this.isInitialized,
      observerCount: this.observers.size,
    }
  }

  /**
   * Destroy the i18n engine and clean up
   */
  destroy() {
    this.translations.clear()
    this.observers.clear()
    this.currentLanguage = null
    this.isInitialized = false

    // Remove language switcher
    const switcher = document.getElementById('language-switcher')
    if (switcher) {
      switcher.remove()
    }

    logger.info('I18n Engine destroyed')
  }
}

export default I18nEngine
