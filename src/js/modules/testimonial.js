/**
 * Testimonial Management Module
 * Handles testimonial data loading, caching, and management
 */

import { logger } from '../utils/logger.js'

/**
 * Testimonial data model
 * @typedef {Object} Testimonial
 * @property {string} id - Unique testimonial identifier
 * @property {string} quote - Testimonial text
 * @property {Author} author - Author information
 * @property {string} source - Source of testimonial (e.g., 'LinkedIn', 'Email', 'Direct')
 * @property {Date} date - Date testimonial was given
 * @property {boolean} featured - Whether testimonial is featured
 * @property {string} [verificationUrl] - URL to verify testimonial
 * @property {Metrics} [metrics] - Project metrics
 * @property {SocialProof} [socialProof] - Social proof elements
 * @property {string[]} [tags] - Related tags (e.g., project names, skills)
 */

/**
 * Author data model
 * @typedef {Object} Author
 * @property {string} name - Author name
 * @property {string} title - Author job title
 * @property {string} [company] - Author company
 * @property {string} [avatar] - Avatar image URL
 * @property {string} [linkedinUrl] - LinkedIn profile URL
 */

/**
 * Metrics data model
 * @typedef {Object} Metrics
 * @property {string} [projectValue] - Project value
 * @property {string} [duration] - Project duration
 * @property {string} [impact] - Project impact
 */

/**
 * Social proof data model
 * @typedef {Object} SocialProof
 * @property {number} [endorsements] - Number of endorsements
 * @property {number} [recommendations] - Number of recommendations
 * @property {boolean} [verified] - Whether testimonial is verified
 */

export class TestimonialManager {
  constructor(config = {}) {
    this.config = {
      cacheKey: 'portfolio-testimonials',
      cacheExpiry: 3600000, // 1 hour in milliseconds
      dataSource: '/data/testimonials.json',
      ...config,
    }

    this.testimonials = []
    this.cache = new Map()
    this.isInitialized = false
    this.lastFetchTime = null
  }

  /**
   * Initialize the testimonial manager
   */
  async init() {
    try {
      logger.info('Initializing Testimonial Manager...')

      // Try to load from cache first
      const cachedData = this.loadFromCache()
      
      if (cachedData) {
        this.testimonials = cachedData
        logger.info(`Loaded ${this.testimonials.length} testimonials from cache`)
      } else {
        // Load from data source
        await this.loadTestimonials()
      }

      this.isInitialized = true
      logger.info('Testimonial Manager initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Testimonial Manager:', error)
      throw error
    }
  }

  /**
   * Load testimonials from data source
   */
  async loadTestimonials() {
    try {
      // For now, use mock data until data source is available
      this.testimonials = this.getMockTestimonials()
      
      // Save to cache
      this.saveToCache(this.testimonials)
      this.lastFetchTime = Date.now()
      
      logger.info(`Loaded ${this.testimonials.length} testimonials`)
    } catch (error) {
      logger.error('Failed to load testimonials:', error)
      throw error
    }
  }

  /**
   * Get all testimonials
   * @returns {Testimonial[]} Array of testimonials
   */
  getAllTestimonials() {
    return [...this.testimonials]
  }

  /**
   * Get testimonial by ID
   * @param {string} id - Testimonial ID
   * @returns {Testimonial|null} Testimonial or null if not found
   */
  getTestimonialById(id) {
    return this.testimonials.find(testimonial => testimonial.id === id) || null
  }

  /**
   * Get featured testimonials
   * @returns {Testimonial[]} Featured testimonials
   */
  getFeaturedTestimonials() {
    return this.testimonials.filter(testimonial => testimonial.featured)
  }

  /**
   * Get testimonials by source
   * @param {string} source - Source name
   * @returns {Testimonial[]} Testimonials from source
   */
  getTestimonialsBySource(source) {
    return this.testimonials.filter(
      testimonial => testimonial.source.toLowerCase() === source.toLowerCase()
    )
  }

  /**
   * Get testimonials by tag
   * @param {string} tag - Tag name
   * @returns {Testimonial[]} Testimonials with tag
   */
  getTestimonialsByTag(tag) {
    return this.testimonials.filter(
      testimonial => testimonial.tags && testimonial.tags.includes(tag)
    )
  }

  /**
   * Get recent testimonials
   * @param {number} limit - Maximum number of testimonials to return
   * @returns {Testimonial[]} Recent testimonials
   */
  getRecentTestimonials(limit = 5) {
    return [...this.testimonials]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit)
  }

  /**
   * Filter testimonials by criteria
   * @param {Object} criteria - Filter criteria
   * @param {string} [criteria.source] - Testimonial source
   * @param {boolean} [criteria.featured] - Filter for featured testimonials
   * @param {boolean} [criteria.verified] - Filter for verified testimonials
   * @param {string[]} [criteria.tags] - Filter by tags
   * @returns {Testimonial[]} Filtered testimonials
   */
  filterTestimonials(criteria = {}) {
    let filtered = [...this.testimonials]

    // Filter by source
    if (criteria.source) {
      filtered = filtered.filter(
        testimonial => testimonial.source.toLowerCase() === criteria.source.toLowerCase()
      )
    }

    // Filter for featured
    if (criteria.featured === true) {
      filtered = filtered.filter(testimonial => testimonial.featured)
    }

    // Filter for verified
    if (criteria.verified === true) {
      filtered = filtered.filter(
        testimonial => testimonial.socialProof && testimonial.socialProof.verified
      )
    }

    // Filter by tags
    if (criteria.tags && criteria.tags.length > 0) {
      filtered = filtered.filter(testimonial =>
        testimonial.tags && criteria.tags.some(tag => testimonial.tags.includes(tag))
      )
    }

    return filtered
  }

  /**
   * Get all unique sources
   * @returns {string[]} Array of source names
   */
  getSources() {
    const sources = new Set(this.testimonials.map(testimonial => testimonial.source))
    return Array.from(sources).sort()
  }

  /**
   * Get all unique tags
   * @returns {string[]} Array of tags
   */
  getTags() {
    const tags = new Set()
    this.testimonials.forEach(testimonial => {
      if (testimonial.tags) {
        testimonial.tags.forEach(tag => tags.add(tag))
      }
    })
    return Array.from(tags).sort()
  }

  /**
   * Load testimonials from cache
   * @returns {Testimonial[]|null} Cached testimonials or null
   */
  loadFromCache() {
    try {
      const cached = localStorage.getItem(this.config.cacheKey)
      
      if (!cached) {
        return null
      }

      const { data, timestamp } = JSON.parse(cached)
      
      // Check if cache is expired
      if (Date.now() - timestamp > this.config.cacheExpiry) {
        logger.info('Cache expired')
        localStorage.removeItem(this.config.cacheKey)
        return null
      }

      // Parse dates
      const testimonials = data.map(testimonial => ({
        ...testimonial,
        date: new Date(testimonial.date),
      }))

      return testimonials
    } catch (error) {
      logger.warn('Failed to load from cache:', error)
      return null
    }
  }

  /**
   * Save testimonials to cache
   * @param {Testimonial[]} testimonials - Testimonials to cache
   */
  saveToCache(testimonials) {
    try {
      const cacheData = {
        data: testimonials,
        timestamp: Date.now(),
      }

      localStorage.setItem(this.config.cacheKey, JSON.stringify(cacheData))
      logger.info('Testimonials saved to cache')
    } catch (error) {
      logger.warn('Failed to save to cache:', error)
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    try {
      localStorage.removeItem(this.config.cacheKey)
      this.cache.clear()
      logger.info('Cache cleared')
    } catch (error) {
      logger.warn('Failed to clear cache:', error)
    }
  }

  /**
   * Refresh testimonials from data source
   */
  async refresh() {
    this.clearCache()
    await this.loadTestimonials()
  }

  /**
   * Get mock testimonials for development
   * @returns {Testimonial[]} Mock testimonials
   */
  getMockTestimonials() {
    return [
      {
        id: 'testimonial-1',
        quote: 'Working with this developer was an absolute pleasure. They delivered a high-quality e-commerce platform that exceeded our expectations. The attention to detail and technical expertise was outstanding.',
        author: {
          name: 'Sarah Johnson',
          title: 'CEO',
          company: 'TechStart Inc.',
          avatar: null,
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
      },
      {
        id: 'testimonial-2',
        quote: 'Exceptional problem-solving skills and a deep understanding of modern web technologies. The task management application they built has transformed how our team collaborates.',
        author: {
          name: 'Michael Chen',
          title: 'Product Manager',
          company: 'Innovate Solutions',
          avatar: null,
          linkedinUrl: 'https://linkedin.com/in/example2',
        },
        source: 'LinkedIn',
        date: new Date('2023-11-20'),
        featured: true,
        verificationUrl: 'https://linkedin.com/in/example2/recommendations',
        metrics: {
          projectValue: '$80K',
          duration: '4 months',
          impact: '50% efficiency gain',
        },
        socialProof: {
          endorsements: 38,
          recommendations: 8,
          verified: true,
        },
        tags: ['task-management-app', 'vuejs', 'mongodb'],
      },
      {
        id: 'testimonial-3',
        quote: 'A true professional who consistently delivers clean, maintainable code. Their expertise in React and TypeScript helped us build a scalable application that our users love.',
        author: {
          name: 'Emily Rodriguez',
          title: 'CTO',
          company: 'Digital Ventures',
          avatar: null,
          linkedinUrl: null,
        },
        source: 'Email',
        date: new Date('2023-09-10'),
        featured: false,
        verificationUrl: null,
        metrics: {
          projectValue: '$120K',
          duration: '5 months',
          impact: '200% user growth',
        },
        socialProof: {
          verified: false,
        },
        tags: ['react', 'typescript'],
      },
      {
        id: 'testimonial-4',
        quote: 'Outstanding communication and technical skills. They took the time to understand our business needs and delivered a solution that perfectly aligned with our goals.',
        author: {
          name: 'David Park',
          title: 'Founder',
          company: 'StartupHub',
          avatar: null,
          linkedinUrl: 'https://linkedin.com/in/example3',
        },
        source: 'LinkedIn',
        date: new Date('2023-07-05'),
        featured: false,
        verificationUrl: 'https://linkedin.com/in/example3/recommendations',
        socialProof: {
          endorsements: 22,
          recommendations: 5,
          verified: true,
        },
        tags: ['portfolio-website', 'javascript', 'css'],
      },
      {
        id: 'testimonial-5',
        quote: 'Highly skilled developer with a keen eye for design and user experience. The portfolio website they created is both beautiful and functional.',
        author: {
          name: 'Lisa Thompson',
          title: 'Design Director',
          company: 'Creative Agency',
          avatar: null,
          linkedinUrl: null,
        },
        source: 'Direct',
        date: new Date('2023-05-18'),
        featured: false,
        verificationUrl: null,
        socialProof: {
          verified: false,
        },
        tags: ['portfolio-website', 'css', 'javascript'],
      },
      {
        id: 'testimonial-6',
        quote: 'Their expertise in backend development and database optimization was crucial to our project success. Highly recommend for complex technical challenges.',
        author: {
          name: 'James Wilson',
          title: 'Engineering Lead',
          company: 'DataTech Corp',
          avatar: null,
          linkedinUrl: 'https://linkedin.com/in/example4',
        },
        source: 'LinkedIn',
        date: new Date('2023-03-22'),
        featured: true,
        verificationUrl: 'https://linkedin.com/in/example4/recommendations',
        metrics: {
          projectValue: '$200K',
          duration: '8 months',
          impact: '10x performance',
        },
        socialProof: {
          endorsements: 56,
          recommendations: 15,
          verified: true,
        },
        tags: ['nodejs', 'postgresql', 'docker'],
      },
    ]
  }

  /**
   * Destroy the testimonial manager
   */
  destroy() {
    this.testimonials = []
    this.cache.clear()
    this.isInitialized = false
    logger.info('Testimonial Manager destroyed')
  }
}
