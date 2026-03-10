/**
 * Project Card Component
 * Displays project information with rich media support
 */

import { logger } from '../utils/logger.js'
import { ImageOptimizer } from '../modules/imageOptimizer.js'

export class ProjectCard {
  static imageOptimizer = null

  /**
   * Set image optimizer instance
   * @param {ImageOptimizer} optimizer - Image optimizer instance
   */
  static setImageOptimizer(optimizer) {
    this.imageOptimizer = optimizer
  }
  /**
   * Create a project card element
   * @param {Object} project - Project data
   * @param {Object} options - Card options
   * @returns {HTMLElement} Project card element
   */
  static create(project, options = {}) {
    const {
      showFullDescription = false,
      showMetrics = true,
      showCaseStudy = false,
      compact = false,
    } = options

    const card = document.createElement('article')
    card.className = `project-card ${compact ? 'project-card--compact' : ''}`
    card.setAttribute('data-project-id', project.id)
    card.setAttribute('data-category', project.category)

    // Featured badge
    if (project.featured) {
      card.classList.add('project-card--featured')
    }

    // Card content
    card.innerHTML = `
      ${this.renderImage(project)}
      <div class="project-card__content">
        ${this.renderHeader(project)}
        ${this.renderDescription(project, showFullDescription)}
        ${this.renderTechnologies(project)}
        ${showMetrics && project.metrics ? this.renderMetrics(project.metrics) : ''}
        ${showCaseStudy ? this.renderCaseStudyPreview(project.caseStudy) : ''}
        ${this.renderActions(project)}
      </div>
    `

    // Add event listeners
    this.attachEventListeners(card, project)

    return card
  }

  /**
   * Render project image
   * @param {Object} project - Project data
   * @returns {string} HTML string
   */
  static renderImage(project) {
    // Images removed - only show featured badge if applicable
    if (project.featured) {
      return `
        <div class="project-card__header-badge">
          <span class="project-card__badge">Featured</span>
        </div>
      `
    }
    
    return ''
  }

  /**
   * Prepare image data for optimizer
   * @param {Object} image - Image object
   * @returns {Object} Prepared image data
   */
  static prepareImageData(image) {
    return {
      url: image.url,
      alt: image.alt || '',
      placeholder: image.placeholder || this.generatePlaceholder(),
      webp: image.webp || null,
      avif: image.avif || null,
      srcset: image.srcset || null,
    }
  }

  /**
   * Generate a simple placeholder
   * @returns {string} Data URL placeholder
   */
  static generatePlaceholder() {
    // Simple 10x10 gray placeholder
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"%3E%3Crect width="10" height="10" fill="%23e0e0e0"/%3E%3C/svg%3E'
  }

  /**
   * Render project header
   * @param {Object} project - Project data
   * @returns {string} HTML string
   */
  static renderHeader(project) {
    return `
      <header class="project-card__header">
        <h3 class="project-card__title">${this.escapeHtml(project.title)}</h3>
        <span class="project-card__category">${this.escapeHtml(project.category)}</span>
      </header>
    `
  }

  /**
   * Render project description
   * @param {Object} project - Project data
   * @param {boolean} showFull - Show full description
   * @returns {string} HTML string
   */
  static renderDescription(project, showFull = false) {
    const description = showFull ? project.longDescription : project.description

    return `
      <p class="project-card__description">
        ${this.escapeHtml(description)}
      </p>
    `
  }

  /**
   * Render technologies
   * @param {Object} project - Project data
   * @returns {string} HTML string
   */
  static renderTechnologies(project) {
    const techList = project.technologies
      .map(tech => `
        <li class="project-card__tech-item" data-category="${tech.category}">
          ${tech.icon ? `<span class="tech-icon tech-icon--${tech.icon}"></span>` : ''}
          <span class="tech-name">${this.escapeHtml(tech.name)}</span>
        </li>
      `)
      .join('')

    return `
      <div class="project-card__technologies">
        <h4 class="project-card__section-title">Technologies</h4>
        <ul class="project-card__tech-list">
          ${techList}
        </ul>
      </div>
    `
  }

  /**
   * Render project metrics
   * @param {Object} metrics - Project metrics
   * @returns {string} HTML string
   */
  static renderMetrics(metrics) {
    const metricItems = []

    if (metrics.performanceImprovement) {
      metricItems.push({
        label: 'Performance',
        value: metrics.performanceImprovement,
        icon: 'performance',
      })
    }

    if (metrics.userGrowth) {
      metricItems.push({
        label: 'User Growth',
        value: metrics.userGrowth,
        icon: 'growth',
      })
    }

    if (metrics.revenue) {
      metricItems.push({
        label: 'Revenue Impact',
        value: metrics.revenue,
        icon: 'revenue',
      })
    }

    if (metrics.other) {
      metricItems.push({
        label: 'Achievement',
        value: metrics.other,
        icon: 'award',
      })
    }

    if (metricItems.length === 0) {
      return ''
    }

    const metricsHtml = metricItems
      .map(metric => `
        <div class="project-card__metric">
          <span class="metric-icon metric-icon--${metric.icon}"></span>
          <div class="metric-content">
            <span class="metric-label">${metric.label}</span>
            <span class="metric-value">${this.escapeHtml(metric.value)}</span>
          </div>
        </div>
      `)
      .join('')

    return `
      <div class="project-card__metrics">
        ${metricsHtml}
      </div>
    `
  }

  /**
   * Render case study preview
   * @param {Object} caseStudy - Case study data
   * @returns {string} HTML string
   */
  static renderCaseStudyPreview(caseStudy) {
    return `
      <div class="project-card__case-study">
        <h4 class="project-card__section-title">Case Study</h4>
        <div class="case-study-preview">
          <div class="case-study-preview__item">
            <strong>Problem:</strong>
            <p>${this.escapeHtml(this.truncate(caseStudy.problem, 100))}</p>
          </div>
          <div class="case-study-preview__item">
            <strong>Solution:</strong>
            <p>${this.escapeHtml(this.truncate(caseStudy.solution, 100))}</p>
          </div>
        </div>
      </div>
    `
  }

  /**
   * Render action buttons
   * @param {Object} project - Project data
   * @returns {string} HTML string
   */
  static renderActions(project) {
    const actions = []

    if (project.liveUrl) {
      actions.push(`
        <a 
          href="${project.liveUrl}" 
          class="btn btn--primary project-card__action"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View live demo of ${this.escapeHtml(project.title)}"
        >
          <span class="btn-icon">🔗</span>
          Live Demo
        </a>
      `)
    }

    if (project.githubUrl) {
      actions.push(`
        <a 
          href="${project.githubUrl}" 
          class="btn btn--secondary project-card__action"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View source code of ${this.escapeHtml(project.title)}"
        >
          <span class="btn-icon">💻</span>
          Source Code
        </a>
      `)
    }

    actions.push(`
      <button 
        class="btn btn--secondary project-card__action project-card__details-btn"
        data-project-id="${project.id}"
        aria-label="View details of ${this.escapeHtml(project.title)}"
      >
        <span class="btn-icon">📄</span>
        View Details
      </button>
    `)

    return `
      <div class="project-card__actions">
        ${actions.join('')}
      </div>
    `
  }

  /**
   * Attach event listeners to card
   * @param {HTMLElement} card - Card element
   * @param {Object} project - Project data
   */
  static attachEventListeners(card, project) {
    // Details button
    const detailsBtn = card.querySelector('.project-card__details-btn')
    if (detailsBtn) {
      detailsBtn.addEventListener('click', () => {
        this.handleDetailsClick(project)
      })
    }

    // Card click (for mobile)
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking on a link or button
      if (e.target.closest('a, button')) {
        return
      }

      card.classList.toggle('project-card--expanded')
    })

    // Hover effects
    card.addEventListener('mouseenter', () => {
      card.classList.add('project-card--hover')
    })

    card.addEventListener('mouseleave', () => {
      card.classList.remove('project-card--hover')
    })
  }

  /**
   * Handle details button click
   * @param {Object} project - Project data
   */
  static handleDetailsClick(project) {
    // Modal disabled - View Details button does nothing
    // You can add navigation to a details page here if needed
    logger.info(`Details requested for project: ${project.id}`)
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
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} length - Maximum length
   * @returns {string} Truncated text
   */
  static truncate(text, length) {
    if (text.length <= length) {
      return text
    }

    return text.substring(0, length).trim() + '...'
  }
}
