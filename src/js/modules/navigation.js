/**
 * Navigation Manager Module
 * Handles navigation functionality and mobile menu
 */

import { logger } from '../utils/logger.js'
import { scrollToElement, debounce } from '../utils/helpers.js'

export class NavigationManager {
  constructor(config = {}) {
    this.config = {
      mobileBreakpoint: 768,
      smoothScroll: true,
      ...config,
    }

    this.isMobile = false
    this.isMenuOpen = false
    this.activeSection = null

    // Bind methods
    this.handleResize = this.handleResize.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.toggleMobileMenu = this.toggleMobileMenu.bind(this)
    this.closeMobileMenu = this.closeMobileMenu.bind(this)
  }

  /**
   * Initialize navigation manager
   */
  async init() {
    try {
      logger.info('Initializing Navigation Manager...')

      // Set up mobile menu
      this.setupMobileMenu()

      // Set up navigation links
      this.setupNavigationLinks()

      // Set up scroll spy
      this.setupScrollSpy()

      // Check initial mobile state
      this.handleResize()

      logger.info('Navigation Manager initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Navigation Manager:', error)
      throw error
    }
  }

  /**
   * Set up mobile menu functionality
   */
  setupMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle')
    const mobileNav = document.querySelector('.mobile-nav')
    const mobileNavClose = document.querySelector('.mobile-nav-close')

    if (menuToggle) {
      menuToggle.addEventListener('click', this.toggleMobileMenu)
    }

    if (mobileNavClose) {
      mobileNavClose.addEventListener('click', this.closeMobileMenu)
    }

    if (mobileNav) {
      // Close menu when clicking overlay
      mobileNav.addEventListener('click', event => {
        if (event.target === mobileNav) {
          this.closeMobileMenu()
        }
      })
    }
  }

  /**
   * Set up navigation links
   */
  setupNavigationLinks() {
    const navLinks = document.querySelectorAll('.nav-link')

    navLinks.forEach(link => {
      // Remove event listener for hash links since we're using page navigation
      // Links will work naturally with their href attributes
      
      // Close mobile menu when clicking any link
      link.addEventListener('click', () => {
        this.closeMobileMenu()
      })
    })
  }

  /**
   * Set up scroll spy functionality
   */
  setupScrollSpy() {
    const sections = document.querySelectorAll('section[id]')

    if (sections.length === 0) {
      return
    }

    const debouncedScrollSpy = debounce(() => {
      this.updateActiveSection(sections)
    }, 100)

    window.addEventListener('scroll', debouncedScrollSpy, { passive: true })
  }

  /**
   * Update active section based on scroll position
   */
  updateActiveSection(sections) {
    const scrollPosition = window.pageYOffset + 100 // Offset for header

    let currentSection = null

    sections.forEach(section => {
      const sectionTop = section.offsetTop
      const sectionHeight = section.offsetHeight

      if (
        scrollPosition >= sectionTop &&
        scrollPosition < sectionTop + sectionHeight
      ) {
        currentSection = section.id
      }
    })

    if (currentSection !== this.activeSection) {
      this.activeSection = currentSection
      this.updateNavigationState(currentSection)
    }
  }

  /**
   * Update navigation link states
   */
  updateNavigationState(activeSection) {
    const navLinks = document.querySelectorAll('.nav-link')

    navLinks.forEach(link => {
      const href = link.getAttribute('href')

      if (href && href.startsWith('#')) {
        const targetId = href.substring(1)

        if (targetId === activeSection) {
          link.classList.add('active')
        } else {
          link.classList.remove('active')
        }
      }
    })
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    this.isMenuOpen = !this.isMenuOpen

    const mobileNav = document.querySelector('.mobile-nav')
    const menuToggle = document.querySelector('.mobile-menu-toggle')

    if (mobileNav) {
      if (this.isMenuOpen) {
        mobileNav.style.display = 'block'
        setTimeout(() => {
          mobileNav.classList.add('open')
        }, 10)

        // Prevent body scroll
        document.body.style.overflow = 'hidden'
      } else {
        mobileNav.classList.remove('open')
        setTimeout(() => {
          mobileNav.style.display = 'none'
        }, 300)

        // Restore body scroll
        document.body.style.overflow = ''
      }
    }

    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', this.isMenuOpen.toString())
    }
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    if (this.isMenuOpen) {
      this.toggleMobileMenu()
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const wasMobile = this.isMobile
    this.isMobile = window.innerWidth <= this.config.mobileBreakpoint

    // Close mobile menu if switching to desktop
    if (wasMobile && !this.isMobile && this.isMenuOpen) {
      this.closeMobileMenu()
    }
  }

  /**
   * Handle scroll events
   */
  handleScroll() {
    // Additional scroll handling can be added here
  }

  /**
   * Handle keyboard navigation
   */
  handleKeydown(event) {
    // Close mobile menu on Escape key
    if (event.key === 'Escape' && this.isMenuOpen) {
      this.closeMobileMenu()
    }
  }

  /**
   * Destroy navigation manager
   */
  destroy() {
    const menuToggle = document.querySelector('.mobile-menu-toggle')
    const mobileNavClose = document.querySelector('.mobile-nav-close')

    if (menuToggle) {
      menuToggle.removeEventListener('click', this.toggleMobileMenu)
    }

    if (mobileNavClose) {
      mobileNavClose.removeEventListener('click', this.closeMobileMenu)
    }

    // Restore body scroll
    document.body.style.overflow = ''

    logger.info('Navigation Manager destroyed')
  }
}
