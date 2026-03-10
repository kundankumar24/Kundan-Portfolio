/**
 * Testimonial Card Component
 * Displays testimonials and recommendations with social proof elements
 */

import { logger } from '../utils/logger.js'

export class TestimonialCard {
  /**
   * Create a testimonial card element
   * @param {Object} testimonial - Testimonial data
   * @param {Object} options - Card options
   * @returns {HTMLElement} Testimonial card element
   */
  static create(testimonial, options = {}) {
    const {
      showSocialProof = true,
      showMetrics = true,
      compact = false,
    } = options

    const card = document.createElement('article')
    card.className = `testimonial-card ${compact ? 'testimonial-card--compact' : ''}`
    card.setAttribute('data-testimonial-id', testimonial.id)
    card.setAttribute('data-source', testimonial.source)

    // Card content
    card.innerHTML = `
      <div class="testimonial-card__content">
        ${this.renderHeader(testimonial)}
        ${this.renderQuote(testimonial)}
        ${this.renderAuthor(testimonial)}
        ${showMetrics && testimonial.metrics ? this.renderMetrics(testimonial.metrics) : ''}
        ${showSocialProof && testimonial.socialProof ? this.renderSocialProof(testimonial.socialProof) : ''}
        ${testimonial.verificationUrl ? this.renderVerification(testimonial) : ''}
      </div>
    `

    return card
  }

  /**
   * Render testimonial header
   * @param {Object} testimonial - Testimonial data
   * @returns {string} HTML string
   */
  static renderHeader(testimonial) {
    const sourceIcon = this.getSourceIcon(testimonial.source)
    
    return `
      <header class="testimonial-card__header">
        <div class="testimonial-card__source">
          <span class="source-icon">${sourceIcon}</span>
          <span class="source-text">${this.escapeHtml(testimonial.source)}</span>
        </div>
        ${testimonial.featured ? '<span class="testimonial-card__badge testimonial-card__badge--featured">Featured</span>' : ''}
      </header>
    `
  }

  /**
   * Render testimonial quote
   * @param {Object} testimonial - Testimonial data
   * @returns {string} HTML string
   */
  static renderQuote(testimonial) {
    return `
      <blockquote class="testimonial-card__quote">
        <span class="quote-mark quote-mark--open">"</span>
        <p class="quote-text">${this.escapeHtml(testimonial.quote)}</p>
        <span class="quote-mark quote-mark--close">"</span>
      </blockquote>
    `
  }

  /**
   * Render author information
   * @param {Object} testimonial - Testimonial data
   * @returns {string} HTML string
   */
  static renderAuthor(testimonial) {
    const { author } = testimonial
    
    return `
      <div class="testimonial-card__author">
        ${author.avatar ? `
          <img 
            src="${author.avatar}" 
            alt="${this.escapeHtml(author.name)}"
            class="author-avatar"
            loading="lazy"
          />
        ` : `
          <div class="author-avatar author-avatar--placeholder">
            ${this.getInitials(author.name)}
          </div>
        `}
        <div class="author-info">
          <div class="author-name">${this.escapeHtml(author.name)}</div>
          <div class="author-title">${this.escapeHtml(author.title)}</div>
          ${author.company ? `<div class="author-company">${this.escapeHtml(author.company)}</div>` : ''}
          ${author.linkedinUrl ? `
            <a 
              href="${author.linkedinUrl}" 
              class="author-linkedin"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View ${this.escapeHtml(author.name)}'s LinkedIn profile"
            >
              <span class="linkedin-icon">in</span>
              View Profile
            </a>
          ` : ''}
        </div>
      </div>
    `
  }

  /**
   * Render metrics
   * @param {Object} metrics - Metrics data
   * @returns {string} HTML string
   */
  static renderMetrics(metrics) {
    const metricItems = []

    if (metrics.projectValue) {
      metricItems.push(`
        <div class="metric-item">
          <span class="metric-icon">💰</span>
          <div class="metric-content">
            <div class="metric-value">${this.escapeHtml(metrics.projectValue)}</div>
            <div class="metric-label">Project Value</div>
          </div>
        </div>
      `)
    }

    if (metrics.duration) {
      metricItems.push(`
        <div class="metric-item">
          <span class="metric-icon">⏱️</span>
          <div class="metric-content">
            <div class="metric-value">${this.escapeHtml(metrics.duration)}</div>
            <div class="metric-label">Duration</div>
          </div>
        </div>
      `)
    }

    if (metrics.impact) {
      metricItems.push(`
        <div class="metric-item">
          <span class="metric-icon">📈</span>
          <div class="metric-content">
            <div class="metric-value">${this.escapeHtml(metrics.impact)}</div>
            <div class="metric-label">Impact</div>
          </div>
        </div>
      `)
    }

    if (metricItems.length === 0) {
      return ''
    }

    return `
      <div class="testimonial-card__metrics">
        ${metricItems.join('')}
      </div>
    `
  }

  /**
   * Render social proof elements
   * @param {Object} socialProof - Social proof data
   * @returns {string} HTML string
   */
  static renderSocialProof(socialProof) {
    const proofItems = []

    if (socialProof.endorsements) {
      proofItems.push(`
        <div class="social-proof-item">
          <span class="proof-icon">👍</span>
          <span class="proof-text">
            <strong>${socialProof.endorsements}</strong> endorsements
          </span>
        </div>
      `)
    }

    if (socialProof.recommendations) {
      proofItems.push(`
        <div class="social-proof-item">
          <span class="proof-icon">⭐</span>
          <span class="proof-text">
            <strong>${socialProof.recommendations}</strong> recommendations
          </span>
        </div>
      `)
    }

    if (socialProof.verified) {
      proofItems.push(`
        <div class="social-proof-item social-proof-item--verified">
          <span class="proof-icon">✓</span>
          <span class="proof-text">Verified</span>
        </div>
      `)
    }

    if (proofItems.length === 0) {
      return ''
    }

    return `
      <div class="testimonial-card__social-proof">
        ${proofItems.join('')}
      </div>
    `
  }

  /**
   * Render verification link
   * @param {Object} testimonial - Testimonial data
   * @returns {string} HTML string
   */
  static renderVerification(testimonial) {
    return `
      <div class="testimonial-card__verification">
        <a 
          href="${testimonial.verificationUrl}" 
          class="verification-link"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Verify testimonial from ${this.escapeHtml(testimonial.author.name)}"
        >
          <span class="verification-icon">🔗</span>
          View Original
        </a>
      </div>
    `
  }

  /**
   * Get source icon
   * @param {string} source - Source name
   * @returns {string} Icon emoji
   */
  static getSourceIcon(source) {
    const icons = {
      'LinkedIn': '💼',
      'Email': '✉️',
      'Direct': '💬',
      'Review': '⭐',
      'Recommendation': '🏆',
    }
    return icons[source] || '💬'
  }

  /**
   * Get initials from name
   * @param {string} name - Full name
   * @returns {string} Initials
   */
  static getInitials(name) {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  static escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * Create a testimonial showcase grid
   * @param {Array} testimonials - Array of testimonials
   * @param {Object} options - Grid options
   * @returns {HTMLElement} Grid element
   */
  static createGrid(testimonials, options = {}) {
    const {
      layout = 'grid', // 'grid', 'carousel', 'list'
      featuredFirst = true,
      ...cardOptions
    } = options

    const container = document.createElement('div')
    container.className = `testimonials-showcase testimonials-showcase--${layout}`

    let sortedTestimonials = [...testimonials]

    // Sort to show featured first
    if (featuredFirst) {
      sortedTestimonials.sort((a, b) => {
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        return 0
      })
    }

    if (layout === 'carousel') {
      container.innerHTML = `
        <div class="testimonials-carousel">
          <button class="carousel-btn carousel-btn--prev" aria-label="Previous testimonial">
            <span class="carousel-icon">‹</span>
          </button>
          <div class="testimonials-carousel__track"></div>
          <button class="carousel-btn carousel-btn--next" aria-label="Next testimonial">
            <span class="carousel-icon">›</span>
          </button>
        </div>
        <div class="testimonials-carousel__dots"></div>
      `

      const track = container.querySelector('.testimonials-carousel__track')
      const dots = container.querySelector('.testimonials-carousel__dots')

      sortedTestimonials.forEach((testimonial, index) => {
        track.appendChild(this.create(testimonial, cardOptions))
        
        const dot = document.createElement('button')
        dot.className = `carousel-dot ${index === 0 ? 'carousel-dot--active' : ''}`
        dot.setAttribute('aria-label', `Go to testimonial ${index + 1}`)
        dot.setAttribute('data-index', index)
        dots.appendChild(dot)
      })

      this.attachCarouselListeners(container, sortedTestimonials.length)
    } else {
      sortedTestimonials.forEach(testimonial => {
        container.appendChild(this.create(testimonial, cardOptions))
      })
    }

    return container
  }

  /**
   * Attach carousel event listeners
   * @param {HTMLElement} container - Carousel container
   * @param {number} totalSlides - Total number of slides
   */
  static attachCarouselListeners(container, totalSlides) {
    const track = container.querySelector('.testimonials-carousel__track')
    const prevBtn = container.querySelector('.carousel-btn--prev')
    const nextBtn = container.querySelector('.carousel-btn--next')
    const dots = container.querySelectorAll('.carousel-dot')

    let currentIndex = 0

    const updateCarousel = (index) => {
      currentIndex = index
      track.style.transform = `translateX(-${index * 100}%)`

      // Update dots
      dots.forEach((dot, i) => {
        dot.classList.toggle('carousel-dot--active', i === index)
      })

      // Update button states
      prevBtn.disabled = index === 0
      nextBtn.disabled = index === totalSlides - 1

      logger.info(`Carousel moved to slide ${index + 1}`)
    }

    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        updateCarousel(currentIndex - 1)
      }
    })

    nextBtn.addEventListener('click', () => {
      if (currentIndex < totalSlides - 1) {
        updateCarousel(currentIndex + 1)
      }
    })

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const index = parseInt(dot.dataset.index)
        updateCarousel(index)
      })
    })

    // Initialize
    updateCarousel(0)
  }
}
