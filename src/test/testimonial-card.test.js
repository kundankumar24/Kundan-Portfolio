/**
 * Testimonial Card Component Tests
 * Unit tests for the TestimonialCard component
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { JSDOM } from 'jsdom'
import { TestimonialCard } from '../js/components/TestimonialCard.js'

describe('TestimonialCard', () => {
  let dom
  let document

  beforeEach(() => {
    // Set up JSDOM
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
    })
    document = dom.window.document
    global.document = document
    global.window = dom.window
    global.HTMLElement = dom.window.HTMLElement
  })

  afterEach(() => {
    dom.window.close()
  })

  const mockTestimonial = {
    id: 'testimonial-1',
    quote: 'Working with this developer was an absolute pleasure.',
    author: {
      name: 'Sarah Johnson',
      title: 'CEO',
      company: 'TechStart Inc.',
      avatar: 'https://example.com/avatar.jpg',
      linkedinUrl: 'https://linkedin.com/in/example',
    },
    source: 'LinkedIn',
    date: new Date('2024-01-15'),
    featured: true,
    verificationUrl: 'https://linkedin.com/in/example/recommendations',
    metrics: {
      projectValue: '$150K',
      duration: '6 months',
      impact: '300% ROI',
    },
    socialProof: {
      endorsements: 45,
      recommendations: 12,
      verified: true,
    },
    tags: ['ecommerce-platform', 'react', 'nodejs'],
  }

  describe('Card Creation', () => {
    it('should create a testimonial card element', () => {
      const card = TestimonialCard.create(mockTestimonial)

      expect(card).toBeInstanceOf(HTMLElement)
      expect(card.tagName).toBe('ARTICLE')
      expect(card.classList.contains('testimonial-card')).toBe(true)
    })

    it('should set correct data attributes', () => {
      const card = TestimonialCard.create(mockTestimonial)

      expect(card.getAttribute('data-testimonial-id')).toBe('testimonial-1')
      expect(card.getAttribute('data-source')).toBe('LinkedIn')
    })

    it('should apply compact class when specified', () => {
      const card = TestimonialCard.create(mockTestimonial, { compact: true })

      expect(card.classList.contains('testimonial-card--compact')).toBe(true)
    })
  })

  describe('Header Rendering', () => {
    it('should render source information', () => {
      const card = TestimonialCard.create(mockTestimonial)

      const sourceText = card.querySelector('.source-text')
      expect(sourceText.textContent).toBe('LinkedIn')
    })

    it('should show featured badge for featured testimonials', () => {
      const card = TestimonialCard.create(mockTestimonial)

      const badge = card.querySelector('.testimonial-card__badge--featured')
      expect(badge).toBeTruthy()
      expect(badge.textContent).toContain('Featured')
    })

    it('should not show featured badge for non-featured testimonials', () => {
      const nonFeatured = { ...mockTestimonial, featured: false }
      const card = TestimonialCard.create(nonFeatured)

      const badge = card.querySelector('.testimonial-card__badge--featured')
      expect(badge).toBeNull()
    })
  })

  describe('Quote Rendering', () => {
    it('should render testimonial quote', () => {
      const card = TestimonialCard.create(mockTestimonial)

      const quote = card.querySelector('.quote-text')
      expect(quote.textContent).toBe(mockTestimonial.quote)
    })

    it('should include quote marks', () => {
      const card = TestimonialCard.create(mockTestimonial)

      const openQuote = card.querySelector('.quote-mark--open')
      const closeQuote = card.querySelector('.quote-mark--close')

      expect(openQuote).toBeTruthy()
      expect(closeQuote).toBeTruthy()
    })

    it('should escape HTML in quote', () => {
      const maliciousTestimonial = {
        ...mockTestimonial,
        quote: '<script>alert("xss")</script>',
      }
      const card = TestimonialCard.create(maliciousTestimonial)

      const quote = card.querySelector('.quote-text')
      expect(quote.innerHTML).not.toContain('<script>')
      expect(quote.innerHTML).toContain('&lt;script&gt;')
    })
  })

  describe('Author Rendering', () => {
    it('should render author information', () => {
      const card = TestimonialCard.create(mockTestimonial)

      const name = card.querySelector('.author-name')
      const title = card.querySelector('.author-title')
      const company = card.querySelector('.author-company')

      expect(name.textContent).toBe('Sarah Johnson')
      expect(title.textContent).toBe('CEO')
      expect(company.textContent).toBe('TechStart Inc.')
    })

    it('should render author avatar when provided', () => {
      const card = TestimonialCard.create(mockTestimonial)

      const avatar = card.querySelector('.author-avatar')
      expect(avatar.tagName).toBe('IMG')
      expect(avatar.getAttribute('src')).toBe('https://example.com/avatar.jpg')
    })

    it('should render placeholder avatar when not provided', () => {
      const noAvatar = {
        ...mockTestimonial,
        author: { ...mockTestimonial.author, avatar: null },
      }
      const card = TestimonialCard.create(noAvatar)

      const avatar = card.querySelector('.author-avatar--placeholder')
      expect(avatar).toBeTruthy()
      expect(avatar.textContent.trim()).toBe('SJ') // Initials
    })

    it('should render LinkedIn link when provided', () => {
      const card = TestimonialCard.create(mockTestimonial)

      const linkedinLink = card.querySelector('.author-linkedin')
      expect(linkedinLink).toBeTruthy()
      expect(linkedinLink.getAttribute('href')).toBe('https://linkedin.com/in/example')
    })

    it('should not render LinkedIn link when not provided', () => {
      const noLinkedin = {
        ...mockTestimonial,
        author: { ...mockTestimonial.author, linkedinUrl: null },
      }
      const card = TestimonialCard.create(noLinkedin)

      const linkedinLink = card.querySelector('.author-linkedin')
      expect(linkedinLink).toBeNull()
    })

    it('should not render company when not provided', () => {
      const noCompany = {
        ...mockTestimonial,
        author: { ...mockTestimonial.author, company: null },
      }
      const card = TestimonialCard.create(noCompany)

      const company = card.querySelector('.author-company')
      expect(company).toBeNull()
    })
  })

  describe('Metrics Rendering', () => {
    it('should render metrics when showMetrics is true', () => {
      const card = TestimonialCard.create(mockTestimonial, { showMetrics: true })

      const metrics = card.querySelector('.testimonial-card__metrics')
      expect(metrics).toBeTruthy()

      const metricItems = card.querySelectorAll('.metric-item')
      expect(metricItems.length).toBe(3)
    })

    it('should not render metrics when showMetrics is false', () => {
      const card = TestimonialCard.create(mockTestimonial, { showMetrics: false })

      const metrics = card.querySelector('.testimonial-card__metrics')
      expect(metrics).toBeNull()
    })

    it('should not render metrics section when metrics are empty', () => {
      const noMetrics = { ...mockTestimonial, metrics: null }
      const card = TestimonialCard.create(noMetrics, { showMetrics: true })

      const metrics = card.querySelector('.testimonial-card__metrics')
      expect(metrics).toBeNull()
    })

    it('should render individual metric values', () => {
      const card = TestimonialCard.create(mockTestimonial)

      const metricValues = card.querySelectorAll('.metric-value')
      const values = Array.from(metricValues).map(el => el.textContent)

      expect(values).toContain('$150K')
      expect(values).toContain('6 months')
      expect(values).toContain('300% ROI')
    })
  })

  describe('Social Proof Rendering', () => {
    it('should render social proof when showSocialProof is true', () => {
      const card = TestimonialCard.create(mockTestimonial, { showSocialProof: true })

      const socialProof = card.querySelector('.testimonial-card__social-proof')
      expect(socialProof).toBeTruthy()
    })

    it('should not render social proof when showSocialProof is false', () => {
      const card = TestimonialCard.create(mockTestimonial, { showSocialProof: false })

      const socialProof = card.querySelector('.testimonial-card__social-proof')
      expect(socialProof).toBeNull()
    })

    it('should render endorsements count', () => {
      const card = TestimonialCard.create(mockTestimonial)

      const proofText = Array.from(card.querySelectorAll('.proof-text'))
        .map(el => el.textContent)
        .join(' ')

      expect(proofText).toContain('45')
      expect(proofText).toContain('endorsements')
    })

    it('should render recommendations count', () => {
      const card = TestimonialCard.create(mockTestimonial)

      const proofText = Array.from(card.querySelectorAll('.proof-text'))
        .map(el => el.textContent)
        .join(' ')

      expect(proofText).toContain('12')
      expect(proofText).toContain('recommendations')
    })

    it('should show verified badge when verified', () => {
      const card = TestimonialCard.create(mockTestimonial)

      const verifiedItem = card.querySelector('.social-proof-item--verified')
      expect(verifiedItem).toBeTruthy()
      expect(verifiedItem.textContent).toContain('Verified')
    })

    it('should not render social proof section when empty', () => {
      const noSocialProof = { ...mockTestimonial, socialProof: null }
      const card = TestimonialCard.create(noSocialProof, { showSocialProof: true })

      const socialProof = card.querySelector('.testimonial-card__social-proof')
      expect(socialProof).toBeNull()
    })
  })

  describe('Verification Rendering', () => {
    it('should render verification link when provided', () => {
      const card = TestimonialCard.create(mockTestimonial)

      const verificationLink = card.querySelector('.verification-link')
      expect(verificationLink).toBeTruthy()
      expect(verificationLink.getAttribute('href')).toBe(
        'https://linkedin.com/in/example/recommendations'
      )
    })

    it('should not render verification link when not provided', () => {
      const noVerification = { ...mockTestimonial, verificationUrl: null }
      const card = TestimonialCard.create(noVerification)

      const verificationLink = card.querySelector('.verification-link')
      expect(verificationLink).toBeNull()
    })

    it('should have proper link attributes', () => {
      const card = TestimonialCard.create(mockTestimonial)

      const verificationLink = card.querySelector('.verification-link')
      expect(verificationLink.getAttribute('target')).toBe('_blank')
      expect(verificationLink.getAttribute('rel')).toBe('noopener noreferrer')
    })
  })

  describe('Grid Creation', () => {
    const mockTestimonials = [
      { ...mockTestimonial, id: 't1', featured: true },
      { ...mockTestimonial, id: 't2', featured: false },
      { ...mockTestimonial, id: 't3', featured: true },
      { ...mockTestimonial, id: 't4', featured: false },
    ]

    it('should create a grid with all testimonials', () => {
      const grid = TestimonialCard.createGrid(mockTestimonials, { layout: 'grid' })

      expect(grid.classList.contains('testimonials-showcase')).toBe(true)
      expect(grid.classList.contains('testimonials-showcase--grid')).toBe(true)

      const cards = grid.querySelectorAll('.testimonial-card')
      expect(cards.length).toBe(4)
    })

    it('should create a list layout', () => {
      const grid = TestimonialCard.createGrid(mockTestimonials, { layout: 'list' })

      expect(grid.classList.contains('testimonials-showcase--list')).toBe(true)
    })

    it('should sort featured testimonials first', () => {
      const grid = TestimonialCard.createGrid(mockTestimonials, {
        layout: 'grid',
        featuredFirst: true,
      })

      const cards = grid.querySelectorAll('.testimonial-card')
      const firstCard = cards[0]
      const secondCard = cards[1]

      expect(firstCard.getAttribute('data-testimonial-id')).toBe('t1')
      expect(secondCard.getAttribute('data-testimonial-id')).toBe('t3')
    })

    it('should create carousel layout', () => {
      const grid = TestimonialCard.createGrid(mockTestimonials, { layout: 'carousel' })

      expect(grid.classList.contains('testimonials-showcase--carousel')).toBe(true)

      const carousel = grid.querySelector('.testimonials-carousel')
      const track = grid.querySelector('.testimonials-carousel__track')
      const prevBtn = grid.querySelector('.carousel-btn--prev')
      const nextBtn = grid.querySelector('.carousel-btn--next')
      const dots = grid.querySelectorAll('.carousel-dot')

      expect(carousel).toBeTruthy()
      expect(track).toBeTruthy()
      expect(prevBtn).toBeTruthy()
      expect(nextBtn).toBeTruthy()
      expect(dots.length).toBe(4)
    })
  })

  describe('Utility Functions', () => {
    it('should get correct source icon', () => {
      expect(TestimonialCard.getSourceIcon('LinkedIn')).toBe('💼')
      expect(TestimonialCard.getSourceIcon('Email')).toBe('✉️')
      expect(TestimonialCard.getSourceIcon('Direct')).toBe('💬')
      expect(TestimonialCard.getSourceIcon('Unknown')).toBe('💬')
    })

    it('should get initials from name', () => {
      expect(TestimonialCard.getInitials('Sarah Johnson')).toBe('SJ')
      expect(TestimonialCard.getInitials('John Doe Smith')).toBe('JD')
      expect(TestimonialCard.getInitials('Alice')).toBe('A')
    })

    it('should escape HTML properly', () => {
      const escaped = TestimonialCard.escapeHtml('<script>alert("xss")</script>')
      expect(escaped).not.toContain('<script>')
      expect(escaped).toContain('&lt;script&gt;')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels on links', () => {
      const card = TestimonialCard.create(mockTestimonial)

      const linkedinLink = card.querySelector('.author-linkedin')
      const verificationLink = card.querySelector('.verification-link')

      expect(linkedinLink.hasAttribute('aria-label')).toBe(true)
      expect(verificationLink.hasAttribute('aria-label')).toBe(true)
    })

    it('should have semantic HTML structure', () => {
      const card = TestimonialCard.create(mockTestimonial)

      expect(card.tagName).toBe('ARTICLE')
      expect(card.querySelector('header')).toBeTruthy()
      expect(card.querySelector('blockquote')).toBeTruthy()
    })

    it('should have proper alt text on avatar images', () => {
      const card = TestimonialCard.create(mockTestimonial)

      const avatar = card.querySelector('.author-avatar')
      expect(avatar.hasAttribute('alt')).toBe(true)
      expect(avatar.getAttribute('alt')).toBe('Sarah Johnson')
    })
  })
})

