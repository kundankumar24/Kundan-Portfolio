/**
 * Portfolio Enhancement - Main Entry Point
 * Modern ES6+ modular architecture with theme system
 */

// Import core modules
import { ThemeEngine } from './modules/theme.js'
import { NavigationManager } from './modules/navigation.js'
import { AnimationEngine } from './modules/animation.js'
import { ContactForm } from './modules/contact.js'
import { PerformanceMonitor } from './modules/performance.js'
import { ProjectManager } from './modules/project.js'
import { TestimonialManager } from './modules/testimonial.js'
import { ImageOptimizer } from './modules/imageOptimizer.js'
import { SocialMediaIntegration } from './modules/socialMedia.js'
import { SocialSharing } from './modules/socialSharing.js'
import { ServiceWorkerManager } from './modules/serviceWorker.js'
import { PWAInstallManager } from './modules/pwaInstall.js'
import { I18nEngine } from './modules/i18n.js'
import { BackToTopButton } from './modules/backToTop.js'
import accessibilityEngine from './modules/accessibility.js'

// Import components
import { ProjectDetailModal } from './components/ProjectDetailModal.js'
import { TestimonialCard } from './components/TestimonialCard.js'
import { ProjectCard } from './components/ProjectCard.js'
import { SocialMediaCard } from './components/SocialMediaCard.js'
import { SocialShareButtons } from './components/SocialShareButtons.js'

// Import pages
import { initProjectsPage } from './pages/projects.js'
import { initExperiencePage } from './pages/experience.js'
import { initSkillsPage } from './pages/skills.js'
import { initEducationPage } from './pages/education.js'

// Import utilities
import { throttle } from './utils/helpers.js'
import { logger } from './utils/logger.js'
import {
  initializePolyfills,
  addBrowserClasses,
  logCompatibilityInfo,
} from './utils/polyfills.js'

/**
 * Portfolio Application Class
 * Manages the entire portfolio application lifecycle
 */
class PortfolioApp {
  constructor() {
    this.modules = new Map()
    this.isInitialized = false

    // Bind methods
    this.init = this.init.bind(this)
    this.handleResize = this.handleResize.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
  }

  /**
   * Initialize the portfolio application
   */
  async init() {
    try {
      logger.info('Initializing Portfolio Application...')

      // Initialize polyfills and browser compatibility features
      initializePolyfills()
      addBrowserClasses()
      logCompatibilityInfo()

      // Initialize core modules
      await this.initializeModules()

      // Set up event listeners
      this.setupEventListeners()

      // Mark as initialized
      this.isInitialized = true

      logger.info('Portfolio Application initialized successfully')

      // Dispatch custom event for other scripts
      document.dispatchEvent(
        new CustomEvent('portfolioReady', {
          detail: { app: this },
        })
      )
    } catch (error) {
      logger.error('Failed to initialize Portfolio Application:', error)
      this.handleInitializationError(error)
    }
  }

  /**
   * Initialize all application modules
   */
  async initializeModules() {
    const moduleConfigs = [
      {
        name: 'theme',
        module: ThemeEngine,
        config: {
          storageKey: 'portfolio-theme',
          defaultTheme: 'auto',
        },
      },
      {
        name: 'navigation',
        module: NavigationManager,
        config: {
          mobileBreakpoint: 768,
          smoothScroll: true,
        },
      },
      {
        name: 'animation',
        module: AnimationEngine,
        config: {
          respectMotionPreferences: true,
          defaultDuration: 300,
        },
      },
      {
        name: 'contact',
        module: ContactForm,
        config: {
          formSelector: '#contactForm',
          validateOnInput: true,
          emailService: {
            provider: 'emailjs',
            serviceId: 'service_1n9dk3y',
            templateId: 'template_19zsxzw',
            publicKey: 'lP9MA-bpOkAiT7j4w',
          },
          alternativeContacts: [
            {
              type: 'email',
              label: 'Email',
              value: 'kumarkundan5223@gmail.com',
              icon: 'email',
              href: 'mailto:kumarkundan5223@gmail.com',
            },
            {
              type: 'linkedin',
              label: 'LinkedIn',
              value: 'Connect on LinkedIn',
              icon: 'linkedin',
              href: 'https://www.linkedin.com/in/kundan-kumar-gupta-193a51266',
            },
            {
              type: 'github',
              label: 'GitHub',
              value: 'View on GitHub',
              icon: 'github',
              href: 'https://github.com/kundankumar24',
            },
          ],
        },
      },
      {
        name: 'performance',
        module: PerformanceMonitor,
        config: {
          trackCoreWebVitals: true,
          reportInterval: 30000,
        },
      },
      {
        name: 'imageOptimizer',
        module: ImageOptimizer,
        config: {
          rootMargin: '50px',
          threshold: 0.01,
          enableProgressiveLoading: true,
          formats: ['avif', 'webp', 'jpg'],
        },
      },
      {
        name: 'projects',
        module: ProjectManager,
        config: {
          cacheKey: 'portfolio-projects',
          cacheExpiry: 3600000,
        },
      },
      {
        name: 'testimonials',
        module: TestimonialManager,
        config: {
          cacheKey: 'portfolio-testimonials',
          cacheExpiry: 3600000,
        },
      },
      {
        name: 'socialMedia',
        module: SocialMediaIntegration,
        config: {
          github: {
            username: process.env.GITHUB_USERNAME || null,
            token: process.env.GITHUB_TOKEN || null,
          },
          linkedin: {
            enabled: false, // Enable when configured
            profileUrl: process.env.LINKEDIN_PROFILE_URL || null,
          },
          twitter: {
            enabled: false, // Enable when configured
            username: process.env.TWITTER_USERNAME || null,
          },
          cacheKey: 'portfolio-social-media',
          cacheExpiry: 3600000, // 1 hour
          refreshInterval: 300000, // 5 minutes
        },
      },
      {
        name: 'socialSharing',
        module: SocialSharing,
        config: {
          platforms: ['linkedin', 'twitter', 'facebook', 'email', 'copy'],
          trackSharing: true,
          analyticsCategory: 'Social Sharing',
        },
      },
      {
        name: 'serviceWorker',
        module: ServiceWorkerManager,
        config: {
          swPath: '/sw.js',
          scope: '/',
          updateCheckInterval: 60 * 60 * 1000, // 1 hour
          enableBackgroundSync: true,
        },
      },
      {
        name: 'pwaInstall',
        module: PWAInstallManager,
        config: {
          showInstallPrompt: true,
          promptDelay: 3000,
          dismissDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
        },
      },
      {
        name: 'i18n',
        module: I18nEngine,
        config: {
          storageKey: 'portfolio-language',
          defaultLanguage: 'en',
          supportedLanguages: ['en', 'es', 'fr', 'de'],
          fallbackLanguage: 'en',
          autoDetect: true,
        },
        // Only initialize on home page
        condition: () => window.location.pathname === '/' || window.location.pathname === '/index.html'
      },
      {
        name: 'backToTop',
        module: BackToTopButton,
        config: {
          showAfter: 300,
          scrollDuration: 500,
        },
      },
    ]

    // Initialize modules sequentially
    for (const { name, module: ModuleClass, config, condition } of moduleConfigs) {
      try {
        // Skip module if condition is provided and returns false
        if (condition && !condition()) {
          logger.info(`⊘ Skipping module '${name}' (condition not met)`)
          continue
        }
        
        logger.info(`Initializing module '${name}'...`)
        const moduleInstance = new ModuleClass(config)
        await moduleInstance.init()
        this.modules.set(name, moduleInstance)
        logger.info(`✓ Module '${name}' initialized successfully`)
      } catch (error) {
        logger.error(`✗ Failed to initialize module '${name}':`, error)
        logger.error('Error details:', error.message, error.stack)
        // Continue with other modules even if one fails
      }
    }

    // Set image optimizer for ProjectCard component
    const imageOptimizer = this.modules.get('imageOptimizer')
    if (imageOptimizer) {
      ProjectCard.setImageOptimizer(imageOptimizer)
    }

    // Initialize project detail modal after project manager
    try {
      const projectManager = this.modules.get('projects')
      if (projectManager) {
        const projectModal = new ProjectDetailModal(projectManager)
        projectModal.init()
        this.modules.set('projectModal', projectModal)
        logger.info('✓ Project detail modal initialized')
      } else {
        logger.info('Project manager not available - skipping project modal')
      }
    } catch (error) {
      logger.error('✗ Failed to initialize project modal:', error)
      logger.error('Error details:', error.message, error.stack)
    }

    // Initialize testimonials showcase
    this.initializeTestimonialsShowcase()

    // Initialize social media showcase
    this.initializeSocialMediaShowcase()
    
    // Initialize page-specific features
    this.initializePageFeatures()
  }

  /**
   * Initialize testimonials showcase in the DOM
   */
  initializeTestimonialsShowcase() {
    try {
      const testimonialManager = this.modules.get('testimonials')
      if (!testimonialManager) {
        logger.info('Testimonial manager not available - skipping showcase')
        return
      }

      // Find testimonials container in the DOM
      const testimonialsContainer = document.getElementById('testimonials-showcase')
      if (!testimonialsContainer) {
        logger.info('Testimonials container not found in DOM - skipping showcase')
        return
      }

      // Get featured testimonials
      const testimonials = testimonialManager.getFeaturedTestimonials()
      
      if (testimonials.length === 0) {
        logger.info('No featured testimonials available - skipping showcase')
        return
      }

      // Create testimonials grid
      const testimonialsGrid = TestimonialCard.createGrid(testimonials, {
        layout: 'grid',
        featuredFirst: true,
        showMetrics: true,
        showSocialProof: true,
      })

      // Clear container and append grid
      testimonialsContainer.innerHTML = ''
      testimonialsContainer.appendChild(testimonialsGrid)

      logger.info(`✓ Displayed ${testimonials.length} testimonials`)
    } catch (error) {
      logger.error('✗ Failed to initialize testimonials showcase:', error)
      logger.error('Error details:', error.message, error.stack)
    }
  }

  /**
   * Initialize social media showcase in the DOM
   */
  initializeSocialMediaShowcase() {
    try {
      const socialMedia = this.modules.get('socialMedia')
      if (!socialMedia) {
        logger.info('Social media integration not available - skipping showcase')
        return
      }

      // Find social media container in the DOM
      const socialMediaContainer = document.getElementById('social-media-showcase')
      if (!socialMediaContainer) {
        logger.info('Social media container not found in DOM - skipping showcase')
        return
      }

      // Get all social media data
      const allData = socialMedia.getAllData()
      
      // Check if we have any data
      const hasData = Object.values(allData).some(data => data !== null)
      if (!hasData) {
        logger.info('No social media data available - skipping showcase')
        return
      }

      // Create social media grid
      const socialMediaGrid = SocialMediaCard.createGrid(allData, {
        layout: 'grid',
        showEngagementMetrics: true,
      })

      // Clear container and append grid
      socialMediaContainer.innerHTML = ''
      socialMediaContainer.appendChild(socialMediaGrid)

      logger.info('✓ Social media showcase initialized')

      // Listen for updates
      document.addEventListener('socialMediaUpdate', () => {
        const updatedData = socialMedia.getAllData()
        const updatedGrid = SocialMediaCard.createGrid(updatedData, {
          layout: 'grid',
          showEngagementMetrics: true,
        })
        socialMediaContainer.innerHTML = ''
        socialMediaContainer.appendChild(updatedGrid)
        logger.info('✓ Social media showcase updated')
      })
    } catch (error) {
      logger.error('✗ Failed to initialize social media showcase:', error)
      logger.error('Error details:', error.message, error.stack)
    }
  }

  /**
   * Initialize page-specific features based on current page
   */
  initializePageFeatures() {
    try {
      // Check if we're on the projects page
      const isProjectsPage = window.location.pathname.includes('projects.html') || 
                            document.getElementById('projects-showcase')
      
      // Check if we're on the experience page
      const isExperiencePage = window.location.pathname.includes('experience.html') ||
                              document.getElementById('work-experience-timeline')
      
      // Check if we're on the skills page
      const isSkillsPage = window.location.pathname.includes('skills.html') ||
                          document.getElementById('skills-showcase')
      
      // Check if we're on the education page
      const isEducationPage = window.location.pathname.includes('education.html') ||
                             document.getElementById('education-timeline')
      
      console.log('🔍 Checking for page-specific features...')
      console.log('Current pathname:', window.location.pathname)
      console.log('Is projects page:', isProjectsPage)
      console.log('Is experience page:', isExperiencePage)
      console.log('Is skills page:', isSkillsPage)
      console.log('Is education page:', isEducationPage)
      
      if (isProjectsPage) {
        logger.info('Initializing projects page...')
        console.log('🎯 Calling initProjectsPage()')
        initProjectsPage()
        logger.info('✓ Projects page initialized')
      }
      
      if (isExperiencePage) {
        logger.info('Initializing experience page...')
        console.log('🎯 Calling initExperiencePage()')
        initExperiencePage()
        logger.info('✓ Experience page initialized')
      }
      
      if (isSkillsPage) {
        logger.info('Initializing skills page...')
        console.log('🎯 Calling initSkillsPage()')
        initSkillsPage()
        logger.info('✓ Skills page initialized')
      }
      
      if (isEducationPage) {
        logger.info('Initializing education page...')
        console.log('🎯 Calling initEducationPage()')
        initEducationPage()
        logger.info('✓ Education page initialized')
      }
      
      if (!isProjectsPage && !isExperiencePage && !isSkillsPage && !isEducationPage) {
        console.log('ℹ️ No page-specific features to initialize')
      }
    } catch (error) {
      logger.error('✗ Failed to initialize page features:', error)
      logger.error('Error details:', error.message, error.stack)
      console.error('❌ Page features error:', error)
    }
  }

  /**
   * Set up global event listeners
   */
  setupEventListeners() {
    // Throttled resize handler
    const throttledResize = throttle(this.handleResize, 250)
    window.addEventListener('resize', throttledResize)

    // Throttled scroll handler
    const throttledScroll = throttle(this.handleScroll, 16) // ~60fps
    window.addEventListener('scroll', throttledScroll, { passive: true })

    // Visibility change handler
    document.addEventListener(
      'visibilitychange',
      this.handleVisibilityChange.bind(this)
    )

    // Keyboard navigation
    document.addEventListener('keydown', this.handleKeydown.bind(this))

    // Error handling
    window.addEventListener('error', this.handleGlobalError.bind(this))
    window.addEventListener(
      'unhandledrejection',
      this.handleUnhandledRejection.bind(this)
    )
  }

  /**
   * Handle window resize events
   */
  handleResize() {
    if (!this.isInitialized) {
      return
    }

    const navigation = this.modules.get('navigation')
    const animation = this.modules.get('animation')

    // Update navigation for mobile/desktop
    if (navigation) {
      navigation.handleResize()
    }

    // Recalculate animations if needed
    if (animation) {
      animation.handleResize()
    }

    // Dispatch custom resize event
    document.dispatchEvent(
      new CustomEvent('portfolioResize', {
        detail: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      })
    )
  }

  /**
   * Handle scroll events
   */
  handleScroll() {
    if (!this.isInitialized) {
      return
    }

    const animation = this.modules.get('animation')
    const navigation = this.modules.get('navigation')

    // Update scroll-based animations
    if (animation) {
      animation.handleScroll()
    }

    // Update navigation state
    if (navigation) {
      navigation.handleScroll()
    }
  }

  /**
   * Handle visibility change (tab switching)
   */
  handleVisibilityChange() {
    const performance = this.modules.get('performance')

    if (document.hidden) {
      // Page is hidden - pause non-essential operations
      logger.info('Page hidden - pausing operations')
      if (performance) {
        performance.pause()
      }
    } else {
      // Page is visible - resume operations
      logger.info('Page visible - resuming operations')
      if (performance) {
        performance.resume()
      }
    }
  }

  /**
   * Handle keyboard navigation
   */
  handleKeydown(event) {
    const navigation = this.modules.get('navigation')

    if (navigation) {
      navigation.handleKeydown(event)
    }
  }

  /**
   * Handle global JavaScript errors
   */
  handleGlobalError(event) {
    logger.error('Global error:', event.error)

    // Report to performance monitor if available
    const performance = this.modules.get('performance')
    if (performance) {
      performance.reportError(event.error)
    }
  }

  /**
   * Handle unhandled promise rejections
   */
  handleUnhandledRejection(event) {
    logger.error('Unhandled promise rejection:', event.reason)

    // Report to performance monitor if available
    const performance = this.modules.get('performance')
    if (performance) {
      performance.reportError(event.reason)
    }
  }

  /**
   * Handle initialization errors
   */
  handleInitializationError(_error) {
    // Show user-friendly error message
    const errorMessage = document.createElement('div')
    errorMessage.className = 'error-banner'
    errorMessage.innerHTML = `
      <div class="error-content">
        <h3>Oops! Something went wrong</h3>
        <p>The portfolio is experiencing technical difficulties. Please refresh the page.</p>
        <button onclick="window.location.reload()" class="btn primary">Refresh Page</button>
      </div>
    `

    document.body.insertBefore(errorMessage, document.body.firstChild)
  }

  /**
   * Get a specific module instance
   */
  getModule(name) {
    return this.modules.get(name)
  }

  /**
   * Destroy the application and clean up resources
   */
  destroy() {
    // Destroy all modules
    for (const [, module] of this.modules) {
      if (module.destroy) {
        module.destroy()
      }
    }

    this.modules.clear()
    this.isInitialized = false

    logger.info('Portfolio Application destroyed')
  }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.portfolioApp = new PortfolioApp()
    window.portfolioApp.init()
  })
} else {
  // DOM is already ready
  window.portfolioApp = new PortfolioApp()
  window.portfolioApp.init()
}

// Add global test functions for development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.testThemeEngine = async () => {
    const app = window.portfolioApp
    if (app && app.modules.has('theme')) {
      const themeEngine = app.modules.get('theme')
      return await themeEngine.runTests()
    } else {
      console.error('Theme engine not available')
      return false
    }
  }
  
  window.getThemeInfo = () => {
    const app = window.portfolioApp
    if (app && app.modules.has('theme')) {
      const themeEngine = app.modules.get('theme')
      return themeEngine.getThemeStats()
    } else {
      console.error('Theme engine not available')
      return null
    }
  }
}

// Export for module usage
export { PortfolioApp }
