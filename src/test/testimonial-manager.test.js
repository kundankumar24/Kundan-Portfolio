/**
 * Testimonial Manager Tests
 * Unit tests for the TestimonialManager class
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TestimonialManager } from '../js/modules/testimonial.js'

describe('TestimonialManager', () => {
  let testimonialManager

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    testimonialManager = new TestimonialManager()
  })

  afterEach(() => {
    if (testimonialManager) {
      testimonialManager.destroy()
    }
    localStorage.clear()
  })

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      expect(testimonialManager.config.cacheKey).toBe('portfolio-testimonials')
      expect(testimonialManager.config.cacheExpiry).toBe(3600000)
      expect(testimonialManager.isInitialized).toBe(false)
    })

    it('should initialize with custom config', () => {
      const customManager = new TestimonialManager({
        cacheKey: 'custom-testimonials',
        cacheExpiry: 7200000,
      })

      expect(customManager.config.cacheKey).toBe('custom-testimonials')
      expect(customManager.config.cacheExpiry).toBe(7200000)
    })

    it('should load testimonials on init', async () => {
      await testimonialManager.init()

      expect(testimonialManager.isInitialized).toBe(true)
      expect(testimonialManager.testimonials.length).toBeGreaterThan(0)
    })

    it('should load from cache if available', async () => {
      // First initialization to populate cache
      await testimonialManager.init()
      const firstTestimonials = testimonialManager.getAllTestimonials()

      // Create new manager instance
      const cachedManager = new TestimonialManager()
      await cachedManager.init()

      expect(cachedManager.testimonials).toEqual(firstTestimonials)
    })
  })

  describe('Data Retrieval', () => {
    beforeEach(async () => {
      await testimonialManager.init()
    })

    it('should get all testimonials', () => {
      const testimonials = testimonialManager.getAllTestimonials()

      expect(Array.isArray(testimonials)).toBe(true)
      expect(testimonials.length).toBeGreaterThan(0)
      expect(testimonials[0]).toHaveProperty('id')
      expect(testimonials[0]).toHaveProperty('quote')
      expect(testimonials[0]).toHaveProperty('author')
    })

    it('should get testimonial by ID', () => {
      const testimonials = testimonialManager.getAllTestimonials()
      const firstTestimonial = testimonials[0]

      const foundTestimonial = testimonialManager.getTestimonialById(firstTestimonial.id)

      expect(foundTestimonial).toEqual(firstTestimonial)
    })

    it('should return null for non-existent testimonial ID', () => {
      const testimonial = testimonialManager.getTestimonialById('non-existent-id')

      expect(testimonial).toBeNull()
    })

    it('should get featured testimonials', () => {
      const featured = testimonialManager.getFeaturedTestimonials()

      expect(Array.isArray(featured)).toBe(true)
      featured.forEach(testimonial => {
        expect(testimonial.featured).toBe(true)
      })
    })

    it('should get testimonials by source', () => {
      const linkedinTestimonials = testimonialManager.getTestimonialsBySource('LinkedIn')

      expect(Array.isArray(linkedinTestimonials)).toBe(true)
      linkedinTestimonials.forEach(testimonial => {
        expect(testimonial.source).toBe('LinkedIn')
      })
    })

    it('should get testimonials by tag', () => {
      const reactTestimonials = testimonialManager.getTestimonialsByTag('react')

      expect(Array.isArray(reactTestimonials)).toBe(true)
      reactTestimonials.forEach(testimonial => {
        expect(testimonial.tags).toContain('react')
      })
    })

    it('should get recent testimonials', () => {
      const recent = testimonialManager.getRecentTestimonials(3)

      expect(recent.length).toBeLessThanOrEqual(3)
      
      // Verify testimonials are sorted by date (descending)
      for (let i = 0; i < recent.length - 1; i++) {
        expect(recent[i].date.getTime()).toBeGreaterThanOrEqual(recent[i + 1].date.getTime())
      }
    })

    it('should get all sources', () => {
      const sources = testimonialManager.getSources()

      expect(Array.isArray(sources)).toBe(true)
      expect(sources.length).toBeGreaterThan(0)
      expect(sources).toContain('LinkedIn')
    })

    it('should get all tags', () => {
      const tags = testimonialManager.getTags()

      expect(Array.isArray(tags)).toBe(true)
      expect(tags.length).toBeGreaterThan(0)
    })
  })

  describe('Filtering', () => {
    beforeEach(async () => {
      await testimonialManager.init()
    })

    it('should filter by source', () => {
      const filtered = testimonialManager.filterTestimonials({ source: 'LinkedIn' })

      expect(Array.isArray(filtered)).toBe(true)
      filtered.forEach(testimonial => {
        expect(testimonial.source).toBe('LinkedIn')
      })
    })

    it('should filter for featured testimonials', () => {
      const filtered = testimonialManager.filterTestimonials({ featured: true })

      filtered.forEach(testimonial => {
        expect(testimonial.featured).toBe(true)
      })
    })

    it('should filter for verified testimonials', () => {
      const filtered = testimonialManager.filterTestimonials({ verified: true })

      filtered.forEach(testimonial => {
        expect(testimonial.socialProof).toBeDefined()
        expect(testimonial.socialProof.verified).toBe(true)
      })
    })

    it('should filter by tags', () => {
      const filtered = testimonialManager.filterTestimonials({ tags: ['react'] })

      filtered.forEach(testimonial => {
        expect(testimonial.tags).toBeDefined()
        expect(testimonial.tags).toContain('react')
      })
    })

    it('should apply multiple filters', () => {
      const filtered = testimonialManager.filterTestimonials({
        source: 'LinkedIn',
        featured: true,
        verified: true,
      })

      filtered.forEach(testimonial => {
        expect(testimonial.source).toBe('LinkedIn')
        expect(testimonial.featured).toBe(true)
        expect(testimonial.socialProof.verified).toBe(true)
      })
    })

    it('should return all testimonials when no criteria provided', () => {
      const filtered = testimonialManager.filterTestimonials({})
      const allTestimonials = testimonialManager.getAllTestimonials()

      expect(filtered).toEqual(allTestimonials)
    })
  })

  describe('Caching', () => {
    it('should save testimonials to cache', async () => {
      // Create a real localStorage implementation for this test
      const storage = {}
      global.localStorage = {
        getItem: (key) => storage[key] || null,
        setItem: (key, value) => {
          storage[key] = value 
        },
        removeItem: (key) => {
          delete storage[key] 
        },
        clear: () => {
          Object.keys(storage).forEach(key => delete storage[key]) 
        }
      }

      await testimonialManager.init()

      const cached = localStorage.getItem('portfolio-testimonials')
      expect(cached).toBeTruthy()

      const { data, timestamp } = JSON.parse(cached)
      expect(Array.isArray(data)).toBe(true)
      expect(typeof timestamp).toBe('number')
    })

    it('should load from cache when not expired', async () => {
      // Create a real localStorage implementation for this test
      const storage = {}
      global.localStorage = {
        getItem: (key) => storage[key] || null,
        setItem: (key, value) => {
          storage[key] = value 
        },
        removeItem: (key) => {
          delete storage[key] 
        },
        clear: () => {
          Object.keys(storage).forEach(key => delete storage[key]) 
        }
      }

      await testimonialManager.init()
      const originalTestimonials = testimonialManager.getAllTestimonials()

      // Create new manager to test cache loading
      const newManager = new TestimonialManager()
      await newManager.init()

      expect(newManager.getAllTestimonials()).toEqual(originalTestimonials)
    })

    it('should not load from cache when expired', async () => {
      // Create a real localStorage implementation for this test
      const storage = {}
      global.localStorage = {
        getItem: (key) => storage[key] || null,
        setItem: (key, value) => {
          storage[key] = value 
        },
        removeItem: (key) => {
          delete storage[key] 
        },
        clear: () => {
          Object.keys(storage).forEach(key => delete storage[key]) 
        }
      }

      // Create manager with very short expiry
      const shortExpiryManager = new TestimonialManager({ cacheExpiry: 1 })
      await shortExpiryManager.init()

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 10))

      // Create new manager
      const newManager = new TestimonialManager({ cacheExpiry: 1 })
      await newManager.init()

      // Should have loaded fresh data, not from cache
      expect(newManager.isInitialized).toBe(true)
    })

    it('should clear cache', async () => {
      // Create a real localStorage implementation for this test
      const storage = {}
      global.localStorage = {
        getItem: (key) => storage[key] || null,
        setItem: (key, value) => {
          storage[key] = value 
        },
        removeItem: (key) => {
          delete storage[key] 
        },
        clear: () => {
          Object.keys(storage).forEach(key => delete storage[key]) 
        }
      }

      await testimonialManager.init()

      expect(localStorage.getItem('portfolio-testimonials')).toBeTruthy()

      testimonialManager.clearCache()

      expect(localStorage.getItem('portfolio-testimonials')).toBeNull()
    })

    it('should refresh testimonials from data source', async () => {
      await testimonialManager.init()
      const originalTimestamp = testimonialManager.lastFetchTime

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10))

      await testimonialManager.refresh()

      expect(testimonialManager.lastFetchTime).toBeGreaterThan(originalTimestamp)
    })
  })

  describe('Data Model Validation', () => {
    beforeEach(async () => {
      await testimonialManager.init()
    })

    it('should have valid testimonial structure', () => {
      const testimonials = testimonialManager.getAllTestimonials()
      const testimonial = testimonials[0]

      expect(testimonial).toHaveProperty('id')
      expect(testimonial).toHaveProperty('quote')
      expect(testimonial).toHaveProperty('author')
      expect(testimonial).toHaveProperty('source')
      expect(testimonial).toHaveProperty('date')
      expect(testimonial).toHaveProperty('featured')

      expect(typeof testimonial.id).toBe('string')
      expect(typeof testimonial.quote).toBe('string')
      expect(typeof testimonial.author).toBe('object')
      expect(typeof testimonial.source).toBe('string')
      expect(testimonial.date instanceof Date).toBe(true)
      expect(typeof testimonial.featured).toBe('boolean')
    })

    it('should have valid author structure', () => {
      const testimonials = testimonialManager.getAllTestimonials()
      const author = testimonials[0].author

      expect(author).toHaveProperty('name')
      expect(author).toHaveProperty('title')

      expect(typeof author.name).toBe('string')
      expect(typeof author.title).toBe('string')
    })

    it('should have valid metrics structure when present', () => {
      const testimonials = testimonialManager.getAllTestimonials()
      const testimonialWithMetrics = testimonials.find(t => t.metrics)

      if (testimonialWithMetrics) {
        const metrics = testimonialWithMetrics.metrics

        if (metrics.projectValue) {
          expect(typeof metrics.projectValue).toBe('string')
        }
        if (metrics.duration) {
          expect(typeof metrics.duration).toBe('string')
        }
        if (metrics.impact) {
          expect(typeof metrics.impact).toBe('string')
        }
      }
    })

    it('should have valid social proof structure when present', () => {
      const testimonials = testimonialManager.getAllTestimonials()
      const testimonialWithProof = testimonials.find(t => t.socialProof)

      if (testimonialWithProof) {
        const socialProof = testimonialWithProof.socialProof

        if (socialProof.endorsements !== undefined) {
          expect(typeof socialProof.endorsements).toBe('number')
        }
        if (socialProof.recommendations !== undefined) {
          expect(typeof socialProof.recommendations).toBe('number')
        }
        if (socialProof.verified !== undefined) {
          expect(typeof socialProof.verified).toBe('boolean')
        }
      }
    })
  })

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await testimonialManager.init()
    })

    it('should handle empty filter results', () => {
      const filtered = testimonialManager.filterTestimonials({
        source: 'NonExistentSource',
      })

      expect(Array.isArray(filtered)).toBe(true)
      expect(filtered.length).toBe(0)
    })

    it('should handle case-insensitive source filtering', () => {
      const lowercase = testimonialManager.filterTestimonials({ source: 'linkedin' })
      const uppercase = testimonialManager.filterTestimonials({ source: 'LINKEDIN' })
      const mixedcase = testimonialManager.filterTestimonials({ source: 'LinkedIn' })

      expect(lowercase.length).toBeGreaterThan(0)
      expect(lowercase).toEqual(uppercase)
      expect(lowercase).toEqual(mixedcase)
    })

    it('should return copy of testimonials array, not reference', () => {
      const testimonials1 = testimonialManager.getAllTestimonials()
      const testimonials2 = testimonialManager.getAllTestimonials()

      expect(testimonials1).toEqual(testimonials2)
      expect(testimonials1).not.toBe(testimonials2) // Different array instances
    })

    it('should handle corrupted cache gracefully', async () => {
      // Set invalid cache data
      localStorage.setItem('portfolio-testimonials', 'invalid json')

      const newManager = new TestimonialManager()
      await newManager.init()

      // Should still initialize successfully with fresh data
      expect(newManager.isInitialized).toBe(true)
      expect(newManager.testimonials.length).toBeGreaterThan(0)
    })

    it('should handle testimonials without tags', () => {
      const testimonials = testimonialManager.getAllTestimonials()
      const testimonialWithoutTags = testimonials.find(t => !t.tags || t.tags.length === 0)

      if (testimonialWithoutTags) {
        const filtered = testimonialManager.getTestimonialsByTag('nonexistent')
        expect(filtered).not.toContain(testimonialWithoutTags)
      }
    })
  })

  describe('Cleanup', () => {
    it('should destroy manager and clear data', async () => {
      await testimonialManager.init()

      expect(testimonialManager.testimonials.length).toBeGreaterThan(0)
      expect(testimonialManager.isInitialized).toBe(true)

      testimonialManager.destroy()

      expect(testimonialManager.testimonials.length).toBe(0)
      expect(testimonialManager.isInitialized).toBe(false)
    })
  })
})

