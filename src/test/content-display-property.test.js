/**
 * Content Display Property-Based Tests
 * Feature: portfolio-enhancement, Property 13: Content Display Completeness
 * 
 * **Validates: Requirements 2.3, 2.4, 2.5, 2.6, 11.1, 11.2, 11.3, 11.4**
 * 
 * Property 13: Content Display Completeness
 * For any project, skill, or content item, all required information should be 
 * displayed correctly including case studies, metadata, and media
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fc from 'fast-check'
import { JSDOM } from 'jsdom'
import { ProjectManager } from '../js/modules/project.js'
import { ProjectCard } from '../js/components/ProjectCard.js'
import { ProjectDetailModal } from '../js/components/ProjectDetailModal.js'

describe('Property 13: Content Display Completeness', () => {
  let dom
  let projectManager
  let container

  beforeEach(async () => {
    // Setup DOM
    dom = new JSDOM('<!DOCTYPE html><html><body><div id="container"></div></body></html>', {
      url: 'http://localhost:3000',
    })
    global.window = dom.window
    global.document = dom.window.document
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }

    container = document.getElementById('container')

    projectManager = new ProjectManager({
      cacheKey: 'test-projects-content-display',
      cacheExpiry: 3600000,
    })
    
    await projectManager.init()
  })

  afterEach(() => {
    if (projectManager) {
      projectManager.destroy()
    }
  })

  /**
   * Property: Project cards display all required fields
   * For any project, the card should display title, description, technologies, 
   * images, and category
   */
  it('should display all required fields in project cards', async () => {
    const allProjects = projectManager.getAllProjects()

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allProjects),
        async (project) => {
          const card = ProjectCard.create(project)

          // Title should be present
          const title = card.querySelector('.project-card__title')
          expect(title).toBeTruthy()
          expect(title.textContent.trim()).toBe(project.title)

          // Description should be present
          const description = card.querySelector('.project-card__description')
          expect(description).toBeTruthy()
          expect(description.textContent.trim()).toBe(project.description)

          // Category should be present
          const category = card.querySelector('.project-card__category')
          expect(category).toBeTruthy()
          expect(category.textContent).toBe(project.category)

          // Technologies should be present
          const techList = card.querySelector('.project-card__tech-list')
          expect(techList).toBeTruthy()
          
          const techItems = card.querySelectorAll('.project-card__tech-item')
          expect(techItems.length).toBe(project.technologies.length)

          // Verify each technology is displayed
          project.technologies.forEach((tech, index) => {
            const techName = techItems[index].querySelector('.tech-name')
            expect(techName.textContent.trim()).toBe(tech.name)
          })

          // Image should be present (or placeholder)
          const image = card.querySelector('.project-card__image')
          expect(image).toBeTruthy()
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Case studies include all required sections
   * For any project with a case study, all sections (problem, solution, 
   * process, results) should be present and non-empty
   */
  it('should display complete case study sections', async () => {
    const allProjects = projectManager.getAllProjects()

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allProjects),
        async (project) => {
          const { caseStudy } = project

          // All case study fields should be non-empty strings
          expect(typeof caseStudy.problem).toBe('string')
          expect(caseStudy.problem.length).toBeGreaterThan(0)

          expect(typeof caseStudy.solution).toBe('string')
          expect(caseStudy.solution.length).toBeGreaterThan(0)

          expect(Array.isArray(caseStudy.process)).toBe(true)
          expect(caseStudy.process.length).toBeGreaterThan(0)
          caseStudy.process.forEach(step => {
            expect(typeof step).toBe('string')
            expect(step.length).toBeGreaterThan(0)
          })

          expect(typeof caseStudy.results).toBe('string')
          expect(caseStudy.results.length).toBeGreaterThan(0)

          // Verify case study preview renders correctly
          const card = ProjectCard.create(project, { showCaseStudy: true })
          const caseStudySection = card.querySelector('.project-card__case-study')
          expect(caseStudySection).toBeTruthy()

          const problemText = caseStudySection.textContent
          expect(problemText).toContain('Problem')
          expect(problemText).toContain('Solution')
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Project metrics are displayed when available
   * For any project with metrics, all metric fields should be displayed correctly
   */
  it('should display project metrics when available', async () => {
    const allProjects = projectManager.getAllProjects()
    const projectsWithMetrics = allProjects.filter(p => p.metrics)

    if (projectsWithMetrics.length === 0) {
      // Skip if no projects have metrics
      return
    }

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...projectsWithMetrics),
        async (project) => {
          const card = ProjectCard.create(project, { showMetrics: true })

          const metricsSection = card.querySelector('.project-card__metrics')
          expect(metricsSection).toBeTruthy()

          // Count expected metrics
          let expectedMetricCount = 0
          if (project.metrics.performanceImprovement) {
            expectedMetricCount++
          }
          if (project.metrics.userGrowth) {
            expectedMetricCount++
          }
          if (project.metrics.revenue) {
            expectedMetricCount++
          }
          if (project.metrics.other) {
            expectedMetricCount++
          }

          const metricElements = card.querySelectorAll('.project-card__metric')
          expect(metricElements.length).toBe(expectedMetricCount)

          // Verify metric values are displayed
          metricElements.forEach(metricEl => {
            const value = metricEl.querySelector('.metric-value')
            expect(value).toBeTruthy()
            expect(value.textContent.length).toBeGreaterThan(0)
          })
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Testimonials are properly rendered when present
   * For any project with a testimonial, all testimonial fields should be 
   * displayed correctly including author, role, company, and text
   */
  it('should display testimonials with all required fields', async () => {
    const allProjects = projectManager.getAllProjects()
    const projectsWithTestimonials = allProjects.filter(
      p => p.caseStudy.testimonial
    )

    if (projectsWithTestimonials.length === 0) {
      // Skip if no projects have testimonials
      return
    }

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...projectsWithTestimonials),
        async (project) => {
          const modal = new ProjectDetailModal(projectManager)
          modal.init()

          modal.open(project)

          const testimonialSection = modal.modal.querySelector('.project-modal__testimonial')
          expect(testimonialSection).toBeTruthy()

          const { testimonial } = project.caseStudy

          // Testimonial text should be present
          const testimonialText = testimonialSection.querySelector('.testimonial__text')
          expect(testimonialText).toBeTruthy()
          expect(testimonialText.textContent).toContain(testimonial.text)

          // Author name should be present
          const authorName = testimonialSection.querySelector('.testimonial__name')
          expect(authorName).toBeTruthy()
          expect(authorName.textContent).toBe(testimonial.author)

          // Role should be present
          const role = testimonialSection.querySelector('.testimonial__role')
          expect(role).toBeTruthy()
          expect(role.textContent).toContain(testimonial.role)

          if (testimonial.company) {
            expect(role.textContent).toContain(testimonial.company)
          }

          // Avatar should be present if provided
          if (testimonial.avatar) {
            const avatar = testimonialSection.querySelector('.testimonial__avatar')
            expect(avatar).toBeTruthy()
            expect(avatar.src).toBe(testimonial.avatar)
          }

          modal.destroy()
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Rich media galleries display all images correctly
   * For any project with images, all images should be displayed in the gallery
   * with proper attributes and accessibility features
   */
  it('should display complete image galleries with proper attributes', async () => {
    const allProjects = projectManager.getAllProjects()

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allProjects),
        async (project) => {
          const modal = new ProjectDetailModal(projectManager)
          modal.init()

          modal.open(project)

          const gallery = modal.modal.querySelector('.project-modal__gallery')
          
          if (project.images && project.images.length > 0) {
            expect(gallery).toBeTruthy()

            const galleryItems = gallery.querySelectorAll('.gallery__item')
            expect(galleryItems.length).toBe(project.images.length)

            // Verify each image has required attributes
            galleryItems.forEach((item, index) => {
              const img = item.querySelector('.gallery__img')
              expect(img).toBeTruthy()
              expect(img.src).toBe(project.images[index].url)
              expect(img.alt).toBe(project.images[index].alt)
              expect(img.getAttribute('loading')).toBe('lazy')
              expect(img.dataset.index).toBe(String(index))

              // Verify accessibility attributes
              expect(item.getAttribute('role')).toBe('button')
              expect(item.getAttribute('tabindex')).toBe('0')
              expect(item.getAttribute('aria-label')).toContain('View image')
            })

            // Verify gallery count is displayed
            const galleryCount = modal.modal.querySelector('.gallery__count')
            expect(galleryCount).toBeTruthy()
            expect(galleryCount.textContent).toContain(String(project.images.length))
          }

          modal.destroy()
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Technologies are grouped by category correctly
   * For any project, technologies should be grouped by their category
   * in the detail modal
   */
  it('should group technologies by category in detail view', async () => {
    const allProjects = projectManager.getAllProjects()

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allProjects),
        async (project) => {
          const modal = new ProjectDetailModal(projectManager)
          modal.init()

          modal.open(project)

          const techSection = modal.modal.querySelector('.project-modal__technologies')
          expect(techSection).toBeTruthy()

          // Count unique categories
          const categories = new Set(project.technologies.map(t => t.category))
          const techGroups = techSection.querySelectorAll('.tech-group')
          expect(techGroups.length).toBe(categories.size)

          // Verify each category group
          techGroups.forEach(group => {
            const categoryTitle = group.querySelector('.tech-group__title')
            expect(categoryTitle).toBeTruthy()
            
            const category = categoryTitle.textContent
            expect(categories.has(category)).toBe(true)

            // Verify technologies in this group
            const techItems = group.querySelectorAll('.tech-group__item')
            const expectedTechs = project.technologies.filter(t => t.category === category)
            expect(techItems.length).toBe(expectedTechs.length)
          })

          modal.destroy()
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: All text content is properly escaped to prevent XSS
   * For any project data, all displayed text should be HTML-escaped
   */
  it('should escape HTML in all displayed content', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 5, maxLength: 50 }),
          description: fc.string({ minLength: 10, maxLength: 100 }),
        }),
        async ({ title, description }) => {
          // Create a project with potentially malicious content
          const maliciousProject = {
            id: 'test-xss',
            title: `<script>alert('xss')</script>${title}`,
            description: `<img src=x onerror=alert('xss')>${description}`,
            longDescription: 'Test description',
            technologies: [
              { name: '<b>React</b>', category: 'Frontend', icon: 'react' }
            ],
            images: [],
            caseStudy: {
              problem: 'Test problem',
              solution: 'Test solution',
              process: ['Step 1'],
              results: 'Test results',
            },
            featured: false,
            category: 'Web Application',
            dateCompleted: new Date(),
          }

          const card = ProjectCard.create(maliciousProject)

          // Verify title is escaped in the element's innerHTML
          const titleEl = card.querySelector('.project-card__title')
          expect(titleEl.innerHTML).toContain('&lt;script&gt;')
          expect(titleEl.innerHTML).not.toMatch(/<script[^>]*>/i)

          // Verify description is escaped
          const descEl = card.querySelector('.project-card__description')
          expect(descEl.innerHTML).toContain('&lt;img')
          expect(descEl.innerHTML).not.toMatch(/<img[^>]*onerror/i)

          // Verify technology name is escaped
          const techName = card.querySelector('.tech-name')
          expect(techName.innerHTML).toContain('&lt;b&gt;')
          expect(techName.innerHTML).not.toMatch(/<b>/i)
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Featured projects display featured badge
   * For any featured project, the featured badge should be visible
   */
  it('should display featured badge for featured projects', async () => {
    const allProjects = projectManager.getAllProjects()
    const featuredProjects = allProjects.filter(p => p.featured)

    if (featuredProjects.length === 0) {
      // Skip if no featured projects
      return
    }

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...featuredProjects),
        async (project) => {
          const card = ProjectCard.create(project)

          // Card should have featured class
          expect(card.classList.contains('project-card--featured')).toBe(true)

          // Featured badge should be present
          const badge = card.querySelector('.project-card__badge')
          expect(badge).toBeTruthy()
          expect(badge.textContent).toBe('Featured')
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Action buttons are present for projects with URLs
   * For any project with liveUrl or githubUrl, corresponding action buttons
   * should be displayed
   */
  it('should display action buttons for projects with URLs', async () => {
    const allProjects = projectManager.getAllProjects()

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allProjects),
        async (project) => {
          const card = ProjectCard.create(project)

          const actionsSection = card.querySelector('.project-card__actions')
          expect(actionsSection).toBeTruthy()

          // Check for live demo button
          if (project.liveUrl) {
            const liveButton = Array.from(actionsSection.querySelectorAll('a'))
              .find(a => a.textContent.includes('Live Demo'))
            expect(liveButton).toBeTruthy()
            // JSDOM may add trailing slash, so normalize URLs for comparison
            expect(liveButton.href.replace(/\/$/, '')).toBe(project.liveUrl.replace(/\/$/, ''))
            expect(liveButton.target).toBe('_blank')
            expect(liveButton.rel).toBe('noopener noreferrer')
          }

          // Check for source code button
          if (project.githubUrl) {
            const githubButton = Array.from(actionsSection.querySelectorAll('a'))
              .find(a => a.textContent.includes('Source Code'))
            expect(githubButton).toBeTruthy()
            expect(githubButton.href.replace(/\/$/, '')).toBe(project.githubUrl.replace(/\/$/, ''))
            expect(githubButton.target).toBe('_blank')
            expect(githubButton.rel).toBe('noopener noreferrer')
          }

          // Details button should always be present
          const detailsButton = actionsSection.querySelector('.project-card__details-btn')
          expect(detailsButton).toBeTruthy()
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Case study process steps are displayed in order
   * For any project, case study process steps should be displayed in the
   * correct order with proper numbering
   */
  it('should display case study process steps in correct order', async () => {
    const allProjects = projectManager.getAllProjects()

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allProjects),
        async (project) => {
          const modal = new ProjectDetailModal(projectManager)
          modal.init()

          modal.open(project)

          const processList = modal.modal.querySelector('.case-study__process')
          expect(processList).toBeTruthy()

          const processItems = processList.querySelectorAll('.case-study__process-item')
          expect(processItems.length).toBe(project.caseStudy.process.length)

          // Verify each step is in correct order
          processItems.forEach((item, index) => {
            const stepNumber = item.querySelector('.process-number')
            expect(stepNumber).toBeTruthy()
            expect(stepNumber.textContent).toBe(String(index + 1))

            const stepText = item.querySelector('.process-text')
            expect(stepText).toBeTruthy()
            expect(stepText.textContent).toBe(project.caseStudy.process[index])
          })

          modal.destroy()
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Date formatting is consistent and readable
   * For any project, the completion date should be formatted consistently
   */
  it('should format dates consistently', async () => {
    const allProjects = projectManager.getAllProjects()

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allProjects),
        async (project) => {
          const modal = new ProjectDetailModal(projectManager)
          modal.init()

          modal.open(project)

          const dateElement = modal.modal.querySelector('.project-modal__date')
          expect(dateElement).toBeTruthy()

          const dateText = dateElement.textContent
          
          // Date should be formatted as "Month Year"
          const expectedFormat = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
          }).format(new Date(project.dateCompleted))

          expect(dateText).toBe(expectedFormat)

          modal.destroy()
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Content display maintains data integrity
   * For any project, displayed content should match the source data exactly
   * (after HTML escaping)
   */
  it('should maintain data integrity in displayed content', async () => {
    const allProjects = projectManager.getAllProjects()

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allProjects),
        async (project) => {
          const card = ProjectCard.create(project)

          // Verify title matches
          const titleEl = card.querySelector('.project-card__title')
          expect(titleEl.textContent.trim()).toBe(project.title)

          // Verify description matches
          const descEl = card.querySelector('.project-card__description')
          expect(descEl.textContent.trim()).toBe(project.description)

          // Verify category matches
          const categoryEl = card.querySelector('.project-card__category')
          expect(categoryEl.textContent).toBe(project.category)

          // Verify technology count matches
          const techItems = card.querySelectorAll('.project-card__tech-item')
          expect(techItems.length).toBe(project.technologies.length)

          // Verify data attributes
          expect(card.dataset.projectId).toBe(project.id)
          expect(card.dataset.category).toBe(project.category)
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Images have proper lazy loading attributes
   * For any project with images, all images should have lazy loading enabled
   */
  it('should enable lazy loading for all images', async () => {
    const allProjects = projectManager.getAllProjects()

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allProjects),
        async (project) => {
          // Check card images
          const card = ProjectCard.create(project)
          const cardImg = card.querySelector('.project-card__img')
          if (cardImg) {
            expect(cardImg.getAttribute('loading')).toBe('lazy')
          }

          // Check modal gallery images
          const modal = new ProjectDetailModal(projectManager)
          modal.init()
          modal.open(project)

          const galleryImages = modal.modal.querySelectorAll('.gallery__img')
          galleryImages.forEach(img => {
            expect(img.getAttribute('loading')).toBe('lazy')
          })

          modal.destroy()
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: All interactive elements have proper ARIA labels
   * For any project card or modal, all interactive elements should have
   * appropriate accessibility attributes
   */
  it('should provide proper ARIA labels for interactive elements', async () => {
    const allProjects = projectManager.getAllProjects()

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allProjects),
        async (project) => {
          const card = ProjectCard.create(project)

          // Check action buttons
          const buttons = card.querySelectorAll('button, a')
          buttons.forEach(button => {
            const ariaLabel = button.getAttribute('aria-label')
            if (button.classList.contains('project-card__action')) {
              expect(ariaLabel).toBeTruthy()
              expect(ariaLabel.length).toBeGreaterThan(0)
            }
          })

          // Check modal
          const modal = new ProjectDetailModal(projectManager)
          modal.init()
          modal.open(project)

          // Modal should have proper role and aria attributes
          expect(modal.modal.getAttribute('role')).toBe('dialog')
          expect(modal.modal.getAttribute('aria-modal')).toBe('true')
          expect(modal.modal.getAttribute('aria-labelledby')).toBe('project-modal-title')

          // Close button should have aria-label
          const closeBtn = modal.modal.querySelector('.project-modal__close')
          expect(closeBtn.getAttribute('aria-label')).toBe('Close modal')

          modal.destroy()
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Empty or missing optional fields don't break display
   * For any project with missing optional fields (metrics, testimonial, etc.),
   * the display should handle gracefully without errors
   */
  it('should handle missing optional fields gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 5, maxLength: 20 }),
          title: fc.string({ minLength: 5, maxLength: 50 }),
          description: fc.string({ minLength: 10, maxLength: 100 }),
        }),
        async ({ id, title, description }) => {
          // Create minimal project with only required fields
          const minimalProject = {
            id,
            title,
            description,
            longDescription: description,
            technologies: [
              { name: 'JavaScript', category: 'Frontend', icon: 'js' }
            ],
            images: [],
            caseStudy: {
              problem: 'Test problem',
              solution: 'Test solution',
              process: ['Step 1'],
              results: 'Test results',
            },
            featured: false,
            category: 'Web Application',
            dateCompleted: new Date(),
            // No metrics, no testimonial, no URLs
          }

          // Should not throw errors
          expect(() => {
            const card = ProjectCard.create(minimalProject)
            expect(card).toBeTruthy()
          }).not.toThrow()

          expect(() => {
            const modal = new ProjectDetailModal(projectManager)
            modal.init()
            modal.open(minimalProject)
            modal.destroy()
          }).not.toThrow()
        }
      ),
      { numRuns: 20 }
    )
  })
})

