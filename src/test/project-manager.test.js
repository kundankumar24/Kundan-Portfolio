/**
 * Project Manager Tests
 * Unit tests for project data management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ProjectManager } from '../js/modules/project.js'

describe('ProjectManager', () => {
  let projectManager

  beforeEach(async () => {
    // Setup a real localStorage implementation for tests
    const storage = {}
    global.localStorage = {
      getItem: (key) => storage[key] || null,
      setItem: (key, value) => { storage[key] = value },
      removeItem: (key) => { delete storage[key] },
      clear: () => { Object.keys(storage).forEach(key => delete storage[key]) }
    }
    
    projectManager = new ProjectManager({
      cacheKey: 'test-projects',
      cacheExpiry: 3600000,
    })
    
    await projectManager.init()
  })

  afterEach(() => {
    if (projectManager) {
      projectManager.destroy()
    }
    if (global.localStorage) {
      global.localStorage.clear()
    }
  })

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(projectManager.isInitialized).toBe(true)
    })

    it('should load mock projects', () => {
      const projects = projectManager.getAllProjects()
      expect(projects.length).toBeGreaterThan(0)
    })

    it('should have valid project structure', () => {
      const projects = projectManager.getAllProjects()
      const project = projects[0]

      expect(project).toHaveProperty('id')
      expect(project).toHaveProperty('title')
      expect(project).toHaveProperty('description')
      expect(project).toHaveProperty('longDescription')
      expect(project).toHaveProperty('technologies')
      expect(project).toHaveProperty('images')
      expect(project).toHaveProperty('caseStudy')
      expect(project).toHaveProperty('featured')
      expect(project).toHaveProperty('category')
      expect(project).toHaveProperty('dateCompleted')
    })

    it('should have valid case study structure', () => {
      const projects = projectManager.getAllProjects()
      const caseStudy = projects[0].caseStudy

      expect(caseStudy).toHaveProperty('problem')
      expect(caseStudy).toHaveProperty('solution')
      expect(caseStudy).toHaveProperty('process')
      expect(caseStudy).toHaveProperty('results')
      expect(Array.isArray(caseStudy.process)).toBe(true)
    })
  })

  describe('Project Retrieval', () => {
    it('should get all projects', () => {
      const projects = projectManager.getAllProjects()
      expect(Array.isArray(projects)).toBe(true)
      expect(projects.length).toBeGreaterThan(0)
    })

    it('should get project by ID', () => {
      const projects = projectManager.getAllProjects()
      const firstProject = projects[0]
      const foundProject = projectManager.getProjectById(firstProject.id)

      expect(foundProject).toBeDefined()
      expect(foundProject.id).toBe(firstProject.id)
    })

    it('should return null for non-existent project ID', () => {
      const project = projectManager.getProjectById('non-existent-id')
      expect(project).toBeNull()
    })

    it('should get featured projects', () => {
      const featured = projectManager.getFeaturedProjects()
      expect(Array.isArray(featured)).toBe(true)
      featured.forEach(project => {
        expect(project.featured).toBe(true)
      })
    })
  })

  describe('Project Filtering', () => {
    it('should filter projects by category', () => {
      const allProjects = projectManager.getAllProjects()
      const category = allProjects[0].category

      const filtered = projectManager.filterProjects({ category })
      
      expect(filtered.length).toBeGreaterThan(0)
      filtered.forEach(project => {
        expect(project.category.toLowerCase()).toBe(category.toLowerCase())
      })
    })

    it('should filter projects by technology', () => {
      const allProjects = projectManager.getAllProjects()
      const techName = allProjects[0].technologies[0].name

      const filtered = projectManager.filterProjects({
        technologies: [techName],
      })

      expect(filtered.length).toBeGreaterThan(0)
      filtered.forEach(project => {
        const hasTech = project.technologies.some(
          tech => tech.name.toLowerCase() === techName.toLowerCase()
        )
        expect(hasTech).toBe(true)
      })
    })

    it('should filter projects by date range', () => {
      const dateFrom = new Date('2023-01-01')
      const dateTo = new Date('2024-12-31')

      const filtered = projectManager.filterProjects({ dateFrom, dateTo })

      filtered.forEach(project => {
        const projectDate = new Date(project.dateCompleted)
        expect(projectDate >= dateFrom).toBe(true)
        expect(projectDate <= dateTo).toBe(true)
      })
    })

    it('should return all projects when no criteria provided', () => {
      const allProjects = projectManager.getAllProjects()
      const filtered = projectManager.filterProjects({})

      expect(filtered.length).toBe(allProjects.length)
    })
  })

  describe('Project Search', () => {
    it('should search projects by title', () => {
      const allProjects = projectManager.getAllProjects()
      const searchTerm = allProjects[0].title.split(' ')[0]

      const results = projectManager.searchProjects(searchTerm)

      expect(results.length).toBeGreaterThan(0)
      const found = results.some(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      expect(found).toBe(true)
    })

    it('should search projects by description', () => {
      const allProjects = projectManager.getAllProjects()
      const searchTerm = allProjects[0].description.split(' ')[0]

      const results = projectManager.searchProjects(searchTerm)

      expect(results.length).toBeGreaterThan(0)
    })

    it('should search projects by technology', () => {
      const allProjects = projectManager.getAllProjects()
      const techName = allProjects[0].technologies[0].name

      const results = projectManager.searchProjects(techName)

      expect(results.length).toBeGreaterThan(0)
      const found = results.some(project =>
        project.technologies.some(tech =>
          tech.name.toLowerCase().includes(techName.toLowerCase())
        )
      )
      expect(found).toBe(true)
    })

    it('should return all projects for empty search', () => {
      const allProjects = projectManager.getAllProjects()
      const results = projectManager.searchProjects('')

      expect(results.length).toBe(allProjects.length)
    })

    it('should be case-insensitive', () => {
      const allProjects = projectManager.getAllProjects()
      const searchTerm = allProjects[0].title.toUpperCase()

      const results = projectManager.searchProjects(searchTerm)

      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe('Categories and Technologies', () => {
    it('should get all unique categories', () => {
      const categories = projectManager.getCategories()

      expect(Array.isArray(categories)).toBe(true)
      expect(categories.length).toBeGreaterThan(0)

      // Check uniqueness
      const uniqueCategories = new Set(categories)
      expect(uniqueCategories.size).toBe(categories.length)
    })

    it('should get projects by category', () => {
      const categories = projectManager.getCategories()
      const category = categories[0]

      const projects = projectManager.getProjectsByCategory(category)

      expect(projects.length).toBeGreaterThan(0)
      projects.forEach(project => {
        expect(project.category.toLowerCase()).toBe(category.toLowerCase())
      })
    })

    it('should get all unique technologies', () => {
      const technologies = projectManager.getTechnologies()

      expect(Array.isArray(technologies)).toBe(true)
      expect(technologies.length).toBeGreaterThan(0)

      // Check uniqueness
      const techNames = technologies.map(tech => tech.name)
      const uniqueTechNames = new Set(techNames)
      expect(uniqueTechNames.size).toBe(techNames.length)
    })

    it('should sort categories alphabetically', () => {
      const categories = projectManager.getCategories()
      const sorted = [...categories].sort()

      expect(categories).toEqual(sorted)
    })

    it('should sort technologies alphabetically', () => {
      const technologies = projectManager.getTechnologies()
      const techNames = technologies.map(tech => tech.name)
      const sorted = [...techNames].sort()

      expect(techNames).toEqual(sorted)
    })
  })

  describe('Caching', () => {
    it('should save projects to cache', () => {
      const cacheKey = projectManager.config.cacheKey
      const cached = localStorage.getItem(cacheKey)

      expect(cached).toBeDefined()
      expect(cached).not.toBeNull()
    })

    it('should load projects from cache', async () => {
      // First manager saves to cache
      const projects1 = projectManager.getAllProjects()

      // Create new manager that should load from cache
      const projectManager2 = new ProjectManager({
        cacheKey: 'test-projects',
        cacheExpiry: 3600000,
      })
      await projectManager2.init()

      const projects2 = projectManager2.getAllProjects()

      expect(projects2.length).toBe(projects1.length)
      expect(projects2[0].id).toBe(projects1[0].id)

      projectManager2.destroy()
    })

    it('should clear cache', () => {
      const cacheKey = projectManager.config.cacheKey
      
      projectManager.clearCache()
      
      const cached = localStorage.getItem(cacheKey)
      expect(cached).toBeNull()
    })

    it('should not load expired cache', async () => {
      // Save cache with expired timestamp
      const expiredCache = {
        data: projectManager.getAllProjects(),
        timestamp: Date.now() - 7200000, // 2 hours ago
      }
      localStorage.setItem('test-projects-expired', JSON.stringify(expiredCache))

      // Create manager with expired cache
      const projectManager2 = new ProjectManager({
        cacheKey: 'test-projects-expired',
        cacheExpiry: 3600000, // 1 hour
      })
      await projectManager2.init()

      // Should load fresh data, not expired cache
      expect(projectManager2.getAllProjects().length).toBeGreaterThan(0)

      projectManager2.destroy()
    })
  })

  describe('Data Validation', () => {
    it('should have valid image structure', () => {
      const projects = projectManager.getAllProjects()
      const project = projects.find(p => p.images.length > 0)

      expect(project).toBeDefined()
      const image = project.images[0]

      expect(image).toHaveProperty('url')
      expect(image).toHaveProperty('alt')
      expect(typeof image.url).toBe('string')
      expect(typeof image.alt).toBe('string')
    })

    it('should have valid technology structure', () => {
      const projects = projectManager.getAllProjects()
      const tech = projects[0].technologies[0]

      expect(tech).toHaveProperty('name')
      expect(tech).toHaveProperty('category')
      expect(typeof tech.name).toBe('string')
      expect(typeof tech.category).toBe('string')
    })

    it('should have valid date objects', () => {
      const projects = projectManager.getAllProjects()
      
      projects.forEach(project => {
        expect(project.dateCompleted).toBeInstanceOf(Date)
        expect(isNaN(project.dateCompleted.getTime())).toBe(false)
      })
    })

    it('should have non-empty required fields', () => {
      const projects = projectManager.getAllProjects()

      projects.forEach(project => {
        expect(project.id.length).toBeGreaterThan(0)
        expect(project.title.length).toBeGreaterThan(0)
        expect(project.description.length).toBeGreaterThan(0)
        expect(project.longDescription.length).toBeGreaterThan(0)
        expect(project.category.length).toBeGreaterThan(0)
        expect(project.technologies.length).toBeGreaterThan(0)
        expect(project.caseStudy.problem.length).toBeGreaterThan(0)
        expect(project.caseStudy.solution.length).toBeGreaterThan(0)
        expect(project.caseStudy.results.length).toBeGreaterThan(0)
      })
    })
  })
})

