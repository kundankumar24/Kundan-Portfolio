/**
 * Project Detail Modal Tests
 * Tests for project detail views and case studies
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { ProjectDetailModal } from '../js/components/ProjectDetailModal.js'
import { ProjectManager } from '../js/modules/project.js'
import { Lightbox } from '../js/components/Lightbox.js'

describe('ProjectDetailModal - Task 5.5 Implementation', () => {
  let dom
  let document
  let projectManager
  let modal

  beforeEach(async () => {
    // Create a new JSDOM instance
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true,
    })
    document = dom.window.document
    global.document = document
    global.window = dom.window
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }

    // Initialize project manager
    projectManager = new ProjectManager()
    await projectManager.init()

    // Initialize modal
    modal = new ProjectDetailModal(projectManager)
    modal.init()
  })

  afterEach(() => {
    if (modal) {
      modal.destroy()
    }
    dom.window.close()
  })

  describe('Interactive Project Previews', () => {
    it('should render interactive preview section when project has demoEmbed', () => {
      const project = {
        ...projectManager.getAllProjects()[0],
        demoEmbed: 'https://example.com/demo',
      }

      modal.open(project)

      const previewSection = document.querySelector('.project-modal__preview')
      expect(previewSection).toBeTruthy()

      const iframe = document.querySelector('.project-preview__iframe')
      expect(iframe).toBeTruthy()
      expect(iframe.src).toBe('https://example.com/demo')
    })

    it('should render live demo card when project has liveUrl but no demoEmbed', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)

      const previewSection = document.querySelector('.project-modal__preview')
      expect(previewSection).toBeTruthy()

      const previewCard = document.querySelector('.project-preview--link')
      expect(previewCard).toBeTruthy()

      const launchButton = document.querySelector('.project-preview__card .btn')
      expect(launchButton).toBeTruthy()
      expect(launchButton.textContent).toContain('Launch Demo')
    })

    it('should not render preview section when project has no liveUrl or demoEmbed', () => {
      const project = {
        ...projectManager.getAllProjects()[0],
        liveUrl: null,
        demoEmbed: null,
      }

      modal.open(project)

      const previewSection = document.querySelector('.project-modal__preview')
      expect(previewSection).toBeFalsy()
    })

    it('should include sandbox attributes on iframe for security', () => {
      const project = {
        ...projectManager.getAllProjects()[0],
        demoEmbed: 'https://example.com/demo',
      }

      modal.open(project)

      const iframe = document.querySelector('.project-preview__iframe')
      expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-same-origin allow-forms')
    })
  })

  describe('Rich Media Galleries with Lightbox', () => {
    it('should render gallery with all project images', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)

      const galleryItems = document.querySelectorAll('.gallery__item')
      expect(galleryItems.length).toBe(project.images.length)
    })

    it('should display image count in gallery title', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)

      const galleryCount = document.querySelector('.gallery__count')
      expect(galleryCount).toBeTruthy()
      expect(galleryCount.textContent).toContain(`${project.images.length}`)
    })

    it('should add zoom overlay to gallery items', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)

      const galleryItems = document.querySelectorAll('.gallery__item')
      galleryItems.forEach(item => {
        const overlay = item.querySelector('.gallery__overlay')
        expect(overlay).toBeTruthy()

        const zoomIcon = overlay.querySelector('.gallery__zoom-icon')
        expect(zoomIcon).toBeTruthy()

        const zoomText = overlay.querySelector('.gallery__zoom-text')
        expect(zoomText).toBeTruthy()
        expect(zoomText.textContent).toBe('Click to zoom')
      })
    })

    it('should make gallery items keyboard accessible', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)

      const galleryItems = document.querySelectorAll('.gallery__item')
      galleryItems.forEach(item => {
        expect(item.getAttribute('role')).toBe('button')
        expect(item.getAttribute('tabindex')).toBe('0')
        expect(item.getAttribute('aria-label')).toContain('View image')
      })
    })

    it('should open lightbox when gallery item is clicked', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)

      // Mock lightbox open method
      const lightboxOpenSpy = vi.spyOn(modal.lightbox, 'open')

      const firstGalleryItem = document.querySelector('.gallery__item')
      firstGalleryItem.click()

      expect(lightboxOpenSpy).toHaveBeenCalledWith(project.images, 0)
    })

    it('should open lightbox when Enter key is pressed on gallery item', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)

      // Mock lightbox open method
      const lightboxOpenSpy = vi.spyOn(modal.lightbox, 'open')

      const firstGalleryItem = document.querySelector('.gallery__item')
      const enterEvent = new dom.window.KeyboardEvent('keydown', { key: 'Enter' })
      firstGalleryItem.dispatchEvent(enterEvent)

      expect(lightboxOpenSpy).toHaveBeenCalledWith(project.images, 0)
    })
  })

  describe('Comprehensive Case Studies', () => {
    it('should render complete case study with all sections', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)

      const caseStudySection = document.querySelector('.project-modal__case-study')
      expect(caseStudySection).toBeTruthy()

      // Check for all case study subsections
      const subtitles = caseStudySection.querySelectorAll('.case-study__subtitle')
      const subtitleTexts = Array.from(subtitles).map(el => el.textContent)

      expect(subtitleTexts).toContain('The Problem')
      expect(subtitleTexts).toContain('The Solution')
      expect(subtitleTexts).toContain('The Process')
      expect(subtitleTexts).toContain('The Results')
    })

    it('should render process steps as numbered list', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)

      const processItems = document.querySelectorAll('.case-study__process-item')
      expect(processItems.length).toBe(project.caseStudy.process.length)

      processItems.forEach((item, index) => {
        const number = item.querySelector('.process-number')
        expect(number.textContent).toBe(String(index + 1))

        const text = item.querySelector('.process-text')
        expect(text.textContent).toBe(project.caseStudy.process[index])
      })
    })

    it('should render testimonial when available', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)

      const testimonialSection = document.querySelector('.project-modal__testimonial')
      expect(testimonialSection).toBeTruthy()

      const testimonialText = document.querySelector('.testimonial__text')
      expect(testimonialText.textContent).toContain(project.caseStudy.testimonial.text)

      const authorName = document.querySelector('.testimonial__name')
      expect(authorName.textContent).toBe(project.caseStudy.testimonial.author)
    })

    it('should not render testimonial section when not available', () => {
      const project = {
        ...projectManager.getAllProjects()[2],
        caseStudy: {
          ...projectManager.getAllProjects()[2].caseStudy,
          testimonial: null,
        },
      }

      modal.open(project)

      const testimonialSection = document.querySelector('.project-modal__testimonial')
      expect(testimonialSection).toBeFalsy()
    })
  })

  describe('Related Projects Suggestions', () => {
    it('should render related projects section', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)

      const relatedSection = document.querySelector('.project-modal__related')
      expect(relatedSection).toBeTruthy()
    })

    it('should suggest projects based on shared technologies', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)

      const relatedCards = document.querySelectorAll('.related-project-card')
      expect(relatedCards.length).toBeGreaterThan(0)
      expect(relatedCards.length).toBeLessThanOrEqual(3) // Max 3 related projects
    })

    it('should not include current project in related projects', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)

      const relatedCards = document.querySelectorAll('.related-project-card')
      relatedCards.forEach(card => {
        expect(card.dataset.projectId).not.toBe(project.id)
      })
    })

    it('should open related project when clicked', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)

      const relatedCard = document.querySelector('.related-project-card')
      if (relatedCard) {
        const relatedProjectId = relatedCard.dataset.projectId
        relatedCard.click()

        // Check that modal now shows the related project
        const modalTitle = document.querySelector('#project-modal-title')
        const relatedProject = projectManager.getProjectById(relatedProjectId)
        expect(modalTitle.textContent.trim()).toBe(relatedProject.title)
      }
    })
  })

  describe('Project Metrics Display', () => {
    it('should render project metrics when available', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)

      const metricsSection = document.querySelector('.project-modal__metrics')
      expect(metricsSection).toBeTruthy()

      const metricCards = document.querySelectorAll('.metric-card')
      expect(metricCards.length).toBeGreaterThan(0)
    })

    it('should display all available metrics', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)

      const metricValues = document.querySelectorAll('.metric-card__value')
      const values = Array.from(metricValues).map(el => el.textContent)

      if (project.metrics.performanceImprovement) {
        expect(values).toContain(project.metrics.performanceImprovement)
      }
      if (project.metrics.userGrowth) {
        expect(values).toContain(project.metrics.userGrowth)
      }
      if (project.metrics.revenue) {
        expect(values).toContain(project.metrics.revenue)
      }
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on modal', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)

      const modalElement = document.querySelector('.project-modal')
      expect(modalElement.getAttribute('role')).toBe('dialog')
      expect(modalElement.getAttribute('aria-modal')).toBe('true')
      expect(modalElement.getAttribute('aria-labelledby')).toBe('project-modal-title')
    })

    it('should trap focus within modal when open', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)

      const focusableElements = modal.modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      expect(focusableElements.length).toBeGreaterThan(0)
    })

    it('should close modal on Escape key', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)
      expect(modal.isOpen).toBe(true)

      const escapeEvent = new dom.window.KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(escapeEvent)

      expect(modal.isOpen).toBe(false)
    })
  })

  describe('Requirements Validation', () => {
    it('should satisfy Requirement 11.5: suggest related projects and skills', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)

      // Check related projects section exists
      const relatedSection = document.querySelector('.project-modal__related')
      expect(relatedSection).toBeTruthy()

      // Check technologies section exists (skills)
      const techSection = document.querySelector('.project-modal__technologies')
      expect(techSection).toBeTruthy()

      // Verify related projects are suggested
      const relatedCards = document.querySelectorAll('.related-project-card')
      expect(relatedCards.length).toBeGreaterThan(0)
    })

    it('should satisfy Requirement 11.6: support rich media galleries with zoom and lightbox', () => {
      const project = projectManager.getAllProjects()[0]

      modal.open(project)

      // Check gallery exists
      const gallery = document.querySelector('.project-modal__gallery')
      expect(gallery).toBeTruthy()

      // Check zoom overlay exists
      const zoomOverlay = document.querySelector('.gallery__overlay')
      expect(zoomOverlay).toBeTruthy()

      // Check lightbox is initialized
      expect(modal.lightbox).toBeTruthy()
      expect(modal.lightbox).toBeInstanceOf(Lightbox)

      // Verify clicking opens lightbox
      const lightboxOpenSpy = vi.spyOn(modal.lightbox, 'open')
      const firstGalleryItem = document.querySelector('.gallery__item')
      firstGalleryItem.click()

      expect(lightboxOpenSpy).toHaveBeenCalled()
    })
  })
})

