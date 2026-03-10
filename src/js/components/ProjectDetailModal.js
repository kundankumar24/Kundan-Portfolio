/**
 * Project Detail Modal Component
 * Displays full project details with case study
 */

import { logger } from '../utils/logger.js'
import { Lightbox } from './Lightbox.js'

export class ProjectDetailModal {
  constructor(projectManager = null) {
    this.modal = null
    this.currentProject = null
    this.isOpen = false
    this.projectManager = projectManager
    this.lightbox = null

    // Bind methods
    this.open = this.open.bind(this)
    this.close = this.close.bind(this)
    this.handleKeydown = this.handleKeydown.bind(this)
    this.handleImageClick = this.handleImageClick.bind(this)
  }

  /**
   * Initialize the modal
   */
  init() {
    this.createModal()
    this.attachEventListeners()
    
    // Initialize lightbox
    this.lightbox = new Lightbox()
    this.lightbox.init()
    
    logger.info('Project Detail Modal initialized')
  }

  /**
   * Create modal element
   */
  createModal() {
    this.modal = document.createElement('div')
    this.modal.className = 'project-modal'
    this.modal.setAttribute('role', 'dialog')
    this.modal.setAttribute('aria-modal', 'true')
    this.modal.setAttribute('aria-labelledby', 'project-modal-title')
    this.modal.innerHTML = `
      <div class="project-modal__container">
        <button 
          class="project-modal__close" 
          aria-label="Close modal"
          type="button"
        >
          <span aria-hidden="true">&times;</span>
        </button>
        <div class="project-modal__content"></div>
      </div>
    `

    document.body.appendChild(this.modal)
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    const closeBtn = this.modal.querySelector('.project-modal__close')
    closeBtn.addEventListener('click', this.close)

    // Keyboard events
    document.addEventListener('keydown', this.handleKeydown)

    // Custom event listener
    document.addEventListener('projectDetailsRequested', (e) => {
      this.open(e.detail.project)
    })
  }

  /**
   * Open modal with project details
   * @param {Object} project - Project data
   */
  open(project) {
    this.currentProject = project
    this.renderContent(project)
    
    // Show modal
    this.modal.classList.add('project-modal--open')
    this.isOpen = true

    // Focus management
    this.trapFocus()

    logger.info(`Opened modal for project: ${project.id}`)
  }

  /**
   * Close modal
   */
  close() {
    this.modal.classList.remove('project-modal--open')
    this.isOpen = false
    this.currentProject = null

    logger.info('Closed project modal')
  }

  /**
   * Handle backdrop click
   * @param {Event} e - Click event
   */
  handleKeydown(e) {
    if (!this.isOpen) {
      return
    }

    if (e.key === 'Escape') {
      this.close()
    }
  }

  /**
   * Trap focus within modal
   */
  trapFocus() {
    const focusableElements = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) {
      return
    }

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus first element
    firstElement.focus()

    // Handle tab key
    this.modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') {
        return
      }

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    })
  }

  /**
   * Render modal content
   * @param {Object} project - Project data
   */
  renderContent(project) {
    const content = this.modal.querySelector('.project-modal__content')
    
    content.innerHTML = `
      ${this.renderHeader(project)}
      ${this.renderInteractivePreview(project)}
      ${this.renderImageGallery(project)}
      ${this.renderOverview(project)}
      ${this.renderCaseStudy(project)}
      ${this.renderTechnologies(project)}
      ${this.renderMetrics(project)}
      ${this.renderActions(project)}
    `

    // Attach gallery click handlers
    const galleryItems = content.querySelectorAll('.gallery__item')
    galleryItems.forEach(item => {
      item.addEventListener('click', this.handleImageClick)
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          this.handleImageClick(e)
        }
      })
      item.style.cursor = 'pointer'
    })

    // Attach related project click handlers
    const relatedCards = content.querySelectorAll('.related-project-card')
    relatedCards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault()
        const projectId = card.dataset.projectId
        const relatedProject = this.projectManager.getProjectById(projectId)
        if (relatedProject) {
          this.open(relatedProject)
        }
      })
    })
  }

  /**
   * Render modal header
   * @param {Object} project - Project data
   * @returns {string} HTML string
   */
  renderHeader(project) {
    return `
      <header class="project-modal__header">
        <h2 id="project-modal-title" class="project-modal__title">
          ${this.escapeHtml(project.title)}
        </h2>
        <div class="project-modal__meta">
          <span class="project-modal__category">${this.escapeHtml(project.category)}</span>
          <span class="project-modal__date">${this.formatDate(project.dateCompleted)}</span>
          ${project.featured ? '<span class="project-modal__badge">Featured</span>' : ''}
        </div>
      </header>
    `
  }

  /**
   * Render interactive project preview
   * @param {Object} project - Project data
   * @returns {string} HTML string
   */
  renderInteractivePreview(project) {
    // Check if project has a live demo URL or demo embed
    if (!project.liveUrl && !project.demoEmbed) {
      return ''
    }

    // If there's a demo embed (iframe), use that
    if (project.demoEmbed) {
      return `
        <section class="project-modal__section project-modal__preview">
          <h3 class="project-modal__section-title">Interactive Demo</h3>
          <div class="project-preview">
            <div class="project-preview__container">
              <iframe 
                src="${project.demoEmbed}" 
                class="project-preview__iframe"
                title="Interactive demo of ${this.escapeHtml(project.title)}"
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-forms"
                allowfullscreen
              ></iframe>
            </div>
            ${project.liveUrl ? `
              <div class="project-preview__actions">
                <a 
                  href="${project.liveUrl}" 
                  class="btn btn--primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in New Tab
                </a>
              </div>
            ` : ''}
          </div>
        </section>
      `
    }

    // Otherwise, show a preview card with link to live demo
    return `
      <section class="project-modal__section project-modal__preview">
        <h3 class="project-modal__section-title">Live Demo</h3>
        <div class="project-preview project-preview--link">
          <div class="project-preview__card">
            <div class="project-preview__icon">🚀</div>
            <div class="project-preview__content">
              <h4 class="project-preview__title">View Live Application</h4>
              <p class="project-preview__description">
                Experience the full functionality of this project in action
              </p>
            </div>
            <a 
              href="${project.liveUrl}" 
              class="btn btn--primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Launch Demo
            </a>
          </div>
        </div>
      </section>
    `
  }

  /**
   * Render image gallery
   * @param {Object} project - Project data
   * @returns {string} HTML string
   */
  renderImageGallery(project) {
    if (!project.images || project.images.length === 0) {
      return ''
    }

    const images = project.images
      .map((img, index) => `
        <div class="gallery__item" role="button" tabindex="0" aria-label="View image ${index + 1} in lightbox">
          <img 
            src="${img.url}" 
            alt="${img.alt}"
            loading="lazy"
            class="gallery__img"
            data-index="${index}"
          />
          <div class="gallery__overlay">
            <span class="gallery__zoom-icon" aria-hidden="true">🔍</span>
            <span class="gallery__zoom-text">Click to zoom</span>
          </div>
        </div>
      `)
      .join('')

    return `
      <section class="project-modal__section">
        <h3 class="project-modal__section-title">
          Project Gallery
          <span class="gallery__count">(${project.images.length} ${project.images.length === 1 ? 'image' : 'images'})</span>
        </h3>
        <div class="project-modal__gallery">
          ${images}
        </div>
      </section>
    `
  }

  /**
   * Handle image click to open lightbox
   * @param {Event} e - Click event
   */
  handleImageClick(e) {
    const galleryItem = e.target.closest('.gallery__item')
    if (!galleryItem) {
      return
    }

    const index = parseInt(galleryItem.querySelector('img').dataset.index, 10)
    
    if (this.currentProject && this.currentProject.images) {
      this.lightbox.open(this.currentProject.images, index)
    }
  }

  /**
   * Render project overview
   * @param {Object} project - Project data
   * @returns {string} HTML string
   */
  renderOverview(project) {
    return `
      <section class="project-modal__section">
        <h3 class="project-modal__section-title">Overview</h3>
        <p class="project-modal__description">
          ${this.escapeHtml(project.longDescription)}
        </p>
      </section>
    `
  }

  /**
   * Render case study
   * @param {Object} project - Project data
   * @returns {string} HTML string
   */
  renderCaseStudy(project) {
    const { caseStudy } = project

    const processSteps = caseStudy.process
      .map((step, index) => `
        <li class="case-study__process-item">
          <span class="process-number">${index + 1}</span>
          <span class="process-text">${this.escapeHtml(step)}</span>
        </li>
      `)
      .join('')

    return `
      <section class="project-modal__section project-modal__case-study">
        <h3 class="project-modal__section-title">Case Study</h3>
        
        <div class="case-study__item">
          <h4 class="case-study__subtitle">The Problem</h4>
          <p>${this.escapeHtml(caseStudy.problem)}</p>
        </div>

        <div class="case-study__item">
          <h4 class="case-study__subtitle">The Solution</h4>
          <p>${this.escapeHtml(caseStudy.solution)}</p>
        </div>

        <div class="case-study__item">
          <h4 class="case-study__subtitle">The Process</h4>
          <ol class="case-study__process">
            ${processSteps}
          </ol>
        </div>

        <div class="case-study__item">
          <h4 class="case-study__subtitle">The Results</h4>
          <p>${this.escapeHtml(caseStudy.results)}</p>
        </div>
      </section>
    `
  }

  /**
   * Render technologies
   * @param {Object} project - Project data
   * @returns {string} HTML string
   */
  renderTechnologies(project) {
    const techByCategory = {}

    project.technologies.forEach(tech => {
      if (!techByCategory[tech.category]) {
        techByCategory[tech.category] = []
      }
      techByCategory[tech.category].push(tech)
    })

    const techHtml = Object.entries(techByCategory)
      .map(([category, techs]) => `
        <div class="tech-group">
          <h5 class="tech-group__title">${this.escapeHtml(category)}</h5>
          <ul class="tech-group__list">
            ${techs.map(tech => `
              <li class="tech-group__item">
                ${tech.icon ? `<span class="tech-icon tech-icon--${tech.icon}"></span>` : ''}
                ${this.escapeHtml(tech.name)}
              </li>
            `).join('')}
          </ul>
        </div>
      `)
      .join('')

    return `
      <section class="project-modal__section">
        <h3 class="project-modal__section-title">Technologies Used</h3>
        <div class="project-modal__technologies">
          ${techHtml}
        </div>
      </section>
    `
  }

  /**
   * Render metrics
   * @param {Object} project - Project data
   * @returns {string} HTML string
   */
  renderMetrics(project) {
    if (!project.metrics) {
      return ''
    }

    const metrics = []

    if (project.metrics.performanceImprovement) {
      metrics.push({
        label: 'Performance Improvement',
        value: project.metrics.performanceImprovement,
      })
    }

    if (project.metrics.userGrowth) {
      metrics.push({
        label: 'User Growth',
        value: project.metrics.userGrowth,
      })
    }

    if (project.metrics.revenue) {
      metrics.push({
        label: 'Revenue Impact',
        value: project.metrics.revenue,
      })
    }

    if (project.metrics.other) {
      metrics.push({
        label: 'Other Achievements',
        value: project.metrics.other,
      })
    }

    if (metrics.length === 0) {
      return ''
    }

    const metricsHtml = metrics
      .map(metric => `
        <div class="metric-card">
          <div class="metric-card__label">${this.escapeHtml(metric.label)}</div>
          <div class="metric-card__value">${this.escapeHtml(metric.value)}</div>
        </div>
      `)
      .join('')

    return `
      <section class="project-modal__section">
        <h3 class="project-modal__section-title">Project Outcomes</h3>
        <div class="project-modal__metrics">
          ${metricsHtml}
        </div>
      </section>
    `
  }

  /**
   * Render testimonial
   * @param {Object} project - Project data
   * @returns {string} HTML string
   */
  renderTestimonial(project) {
    const testimonial = project.caseStudy.testimonial

    if (!testimonial) {
      return ''
    }

    return `
      <section class="project-modal__section project-modal__testimonial">
        <h3 class="project-modal__section-title">Client Testimonial</h3>
        <blockquote class="testimonial">
          <p class="testimonial__text">"${this.escapeHtml(testimonial.text)}"</p>
          <footer class="testimonial__footer">
            ${testimonial.avatar ? `
              <img 
                src="${testimonial.avatar}" 
                alt="${this.escapeHtml(testimonial.author)}"
                class="testimonial__avatar"
              />
            ` : ''}
            <div class="testimonial__author">
              <cite class="testimonial__name">${this.escapeHtml(testimonial.author)}</cite>
              <span class="testimonial__role">
                ${this.escapeHtml(testimonial.role)}
                ${testimonial.company ? ` at ${this.escapeHtml(testimonial.company)}` : ''}
              </span>
            </div>
          </footer>
        </blockquote>
      </section>
    `
  }

  /**
   * Render action buttons
   * @param {Object} project - Project data
   * @returns {string} HTML string
   */
  renderActions(project) {
    const actions = []

    if (project.liveUrl) {
      actions.push(`
        <a 
          href="${project.liveUrl}" 
          class="btn btn--primary btn--large"
          target="_blank"
          rel="noopener noreferrer"
        >
          View Live Demo
        </a>
      `)
    }

    if (project.githubUrl) {
      actions.push(`
        <a 
          href="${project.githubUrl}" 
          class="btn btn--secondary btn--large"
          target="_blank"
          rel="noopener noreferrer"
        >
          View Source Code
        </a>
      `)
    }

    return `
      <div class="project-modal__actions">
        ${actions.join('')}
      </div>
    `
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * Format date
   * @param {Date} date - Date to format
   * @returns {string} Formatted date
   */
  formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
    }).format(new Date(date))
  }

  /**
   * Render related projects
   * @param {Object} project - Current project
   * @returns {string} HTML string
   */
  renderRelatedProjects(project) {
    if (!this.projectManager) {
      return ''
    }

    // Find related projects based on shared technologies and category
    const relatedProjects = this.findRelatedProjects(project)

    if (relatedProjects.length === 0) {
      return ''
    }

    const projectCards = relatedProjects
      .slice(0, 3) // Show max 3 related projects
      .map(relatedProject => `
        <div class="related-project-card" data-project-id="${relatedProject.id}">
          ${relatedProject.images && relatedProject.images.length > 0 ? `
            <img 
              src="${relatedProject.images[0].thumbnail || relatedProject.images[0].url}" 
              alt="${relatedProject.images[0].alt}"
              class="related-project-card__image"
              loading="lazy"
            />
          ` : ''}
          <div class="related-project-card__content">
            <h4 class="related-project-card__title">${this.escapeHtml(relatedProject.title)}</h4>
            <p class="related-project-card__description">${this.escapeHtml(relatedProject.description)}</p>
            <div class="related-project-card__tags">
              ${relatedProject.technologies.slice(0, 3).map(tech => `
                <span class="tag">${this.escapeHtml(tech.name)}</span>
              `).join('')}
            </div>
          </div>
        </div>
      `)
      .join('')

    return `
      <section class="project-modal__section project-modal__related">
        <h3 class="project-modal__section-title">Related Projects</h3>
        <div class="related-projects-grid">
          ${projectCards}
        </div>
      </section>
    `
  }

  /**
   * Find related projects based on shared technologies and category
   * @param {Object} project - Current project
   * @returns {Array} Related projects
   */
  findRelatedProjects(project) {
    const allProjects = this.projectManager.getAllProjects()
    
    // Filter out current project
    const otherProjects = allProjects.filter(p => p.id !== project.id)

    // Calculate relevance score for each project
    const scoredProjects = otherProjects.map(otherProject => {
      let score = 0

      // Same category gets high score
      if (otherProject.category === project.category) {
        score += 10
      }

      // Shared technologies
      const sharedTechs = otherProject.technologies.filter(tech =>
        project.technologies.some(t => t.name === tech.name)
      )
      score += sharedTechs.length * 5

      // Featured projects get bonus
      if (otherProject.featured) {
        score += 2
      }

      return {
        project: otherProject,
        score,
      }
    })

    // Sort by score and return projects
    return scoredProjects
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.project)
  }

  /**
   * Destroy the modal
   */
  destroy() {
    if (this.modal) {
      this.modal.remove()
    }

    if (this.lightbox) {
      this.lightbox.destroy()
    }

    document.removeEventListener('keydown', this.handleKeydown)
    document.removeEventListener('projectDetailsRequested', this.open)

    logger.info('Project Detail Modal destroyed')
  }
}
