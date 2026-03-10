/**
 * Project Management Module
 * Handles project data loading, caching, and management
 */

import { logger } from '../utils/logger.js'

/**
 * Project data model
 * @typedef {Object} Project
 * @property {string} id - Unique project identifier
 * @property {string} title - Project title
 * @property {string} description - Short description
 * @property {string} longDescription - Detailed description
 * @property {Technology[]} technologies - Technologies used
 * @property {Image[]} images - Project images
 * @property {string} [liveUrl] - Live demo URL
 * @property {string} [githubUrl] - GitHub repository URL
 * @property {CaseStudy} caseStudy - Detailed case study
 * @property {boolean} featured - Whether project is featured
 * @property {string} category - Project category
 * @property {Date} dateCompleted - Completion date
 * @property {ProjectMetrics} [metrics] - Project metrics
 */

/**
 * Case study data model
 * @typedef {Object} CaseStudy
 * @property {string} problem - Problem statement
 * @property {string} solution - Solution description
 * @property {string[]} process - Process steps
 * @property {string} results - Results and outcomes
 * @property {Testimonial} [testimonial] - Client testimonial
 */

/**
 * Technology data model
 * @typedef {Object} Technology
 * @property {string} name - Technology name
 * @property {string} category - Technology category
 * @property {string} [icon] - Icon identifier
 */

/**
 * Image data model
 * @typedef {Object} Image
 * @property {string} url - Image URL
 * @property {string} alt - Alt text
 * @property {string} [thumbnail] - Thumbnail URL
 * @property {boolean} [featured] - Whether image is featured
 */

/**
 * Project metrics data model
 * @typedef {Object} ProjectMetrics
 * @property {string} [performanceImprovement] - Performance improvement percentage
 * @property {string} [userGrowth] - User growth metrics
 * @property {string} [revenue] - Revenue impact
 * @property {string} [other] - Other metrics
 */

/**
 * Testimonial data model
 * @typedef {Object} Testimonial
 * @property {string} text - Testimonial text
 * @property {string} author - Author name
 * @property {string} role - Author role
 * @property {string} [company] - Company name
 * @property {string} [avatar] - Avatar URL
 */

export class ProjectManager {
  constructor(config = {}) {
    this.config = {
      cacheKey: 'portfolio-projects',
      cacheExpiry: 3600000, // 1 hour in milliseconds
      dataSource: '/data/projects.json',
      ...config,
    }

    this.projects = []
    this.cache = new Map()
    this.isInitialized = false
    this.lastFetchTime = null
  }

  /**
   * Initialize the project manager
   */
  async init() {
    try {
      logger.info('Initializing Project Manager...')

      // Try to load from cache first
      const cachedData = this.loadFromCache()
      
      if (cachedData) {
        this.projects = cachedData
        logger.info(`Loaded ${this.projects.length} projects from cache`)
      } else {
        // Load from data source
        await this.loadProjects()
      }

      this.isInitialized = true
      logger.info('Project Manager initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Project Manager:', error)
      throw error
    }
  }

  /**
   * Load projects from data source
   */
  async loadProjects() {
    try {
      // Load from actual JSON file with cache-busting parameter
      const cacheBuster = Date.now()
      const response = await fetch(`/data/kundan-projects.json?v=${cacheBuster}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load projects: ${response.statusText}`)
      }
      
      this.projects = await response.json()
      
      // Save to cache
      this.saveToCache(this.projects)
      this.lastFetchTime = Date.now()
      
      logger.info(`Loaded ${this.projects.length} projects from kundan-projects.json`)
    } catch (error) {
      logger.error('Failed to load projects from JSON, using mock data:', error)
      // Fallback to mock data if JSON loading fails
      this.projects = this.getMockProjects()
      this.saveToCache(this.projects)
      this.lastFetchTime = Date.now()
    }
  }

  /**
   * Get all projects
   * @returns {Project[]} Array of projects
   */
  getAllProjects() {
    return [...this.projects]
  }

  /**
   * Get project by ID
   * @param {string} id - Project ID
   * @returns {Project|null} Project or null if not found
   */
  getProjectById(id) {
    return this.projects.find(project => project.id === id) || null
  }

  /**
   * Get featured projects
   * @returns {Project[]} Array of featured projects
   */
  getFeaturedProjects() {
    return this.projects.filter(project => project.featured)
  }

  /**
   * Filter projects by criteria
   * @param {Object} criteria - Filter criteria
   * @param {string} [criteria.category] - Project category
   * @param {string[]} [criteria.technologies] - Technologies to filter by
   * @param {Date} [criteria.dateFrom] - Start date
   * @param {Date} [criteria.dateTo] - End date
   * @returns {Project[]} Filtered projects
   */
  filterProjects(criteria = {}) {
    let filtered = [...this.projects]

    // Filter by category
    if (criteria.category) {
      filtered = filtered.filter(
        project => project.category.toLowerCase() === criteria.category.toLowerCase()
      )
    }

    // Filter by technologies
    if (criteria.technologies && criteria.technologies.length > 0) {
      filtered = filtered.filter(project =>
        criteria.technologies.some(tech =>
          project.technologies.some(
            projectTech => projectTech.name.toLowerCase() === tech.toLowerCase()
          )
        )
      )
    }

    // Filter by date range
    if (criteria.dateFrom) {
      filtered = filtered.filter(
        project => new Date(project.dateCompleted) >= criteria.dateFrom
      )
    }

    if (criteria.dateTo) {
      filtered = filtered.filter(
        project => new Date(project.dateCompleted) <= criteria.dateTo
      )
    }

    return filtered
  }

  /**
   * Search projects by query
   * @param {string} query - Search query
   * @returns {Project[]} Matching projects
   */
  searchProjects(query) {
    if (!query || query.trim() === '') {
      return this.getAllProjects()
    }

    const searchTerm = query.toLowerCase().trim()

    return this.projects.filter(project => {
      // Search in title
      if (project.title.toLowerCase().includes(searchTerm)) {
        return true
      }

      // Search in description
      if (project.description.toLowerCase().includes(searchTerm)) {
        return true
      }

      // Search in long description
      if (project.longDescription.toLowerCase().includes(searchTerm)) {
        return true
      }

      // Search in technologies
      if (project.technologies.some(tech => 
        tech.name.toLowerCase().includes(searchTerm)
      )) {
        return true
      }

      // Search in case study
      if (
        project.caseStudy.problem.toLowerCase().includes(searchTerm) ||
        project.caseStudy.solution.toLowerCase().includes(searchTerm) ||
        project.caseStudy.results.toLowerCase().includes(searchTerm)
      ) {
        return true
      }

      return false
    })
  }

  /**
   * Get projects by category
   * @param {string} category - Category name
   * @returns {Project[]} Projects in category
   */
  getProjectsByCategory(category) {
    return this.projects.filter(
      project => project.category.toLowerCase() === category.toLowerCase()
    )
  }

  /**
   * Get all unique categories
   * @returns {string[]} Array of category names
   */
  getCategories() {
    const categories = new Set(this.projects.map(project => project.category))
    return Array.from(categories).sort()
  }

  /**
   * Get all unique technologies
   * @returns {Technology[]} Array of technologies
   */
  getTechnologies() {
    const techMap = new Map()

    this.projects.forEach(project => {
      project.technologies.forEach(tech => {
        if (!techMap.has(tech.name)) {
          techMap.set(tech.name, tech)
        }
      })
    })

    return Array.from(techMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    )
  }

  /**
   * Load projects from cache
   * @returns {Project[]|null} Cached projects or null
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
      const projects = data.map(project => ({
        ...project,
        dateCompleted: new Date(project.dateCompleted),
      }))

      return projects
    } catch (error) {
      logger.warn('Failed to load from cache:', error)
      return null
    }
  }

  /**
   * Save projects to cache
   * @param {Project[]} projects - Projects to cache
   */
  saveToCache(projects) {
    try {
      const cacheData = {
        data: projects,
        timestamp: Date.now(),
      }

      localStorage.setItem(this.config.cacheKey, JSON.stringify(cacheData))
      logger.info('Projects saved to cache')
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
   * Refresh projects from data source
   */
  async refresh() {
    this.clearCache()
    await this.loadProjects()
  }

  /**
   * Get mock projects for development
   * @returns {Project[]} Mock projects
   */
  getMockProjects() {
    return [
      {
        id: 'ecommerce-platform',
        title: 'E-Commerce Platform',
        description: 'Modern e-commerce platform with real-time inventory management',
        longDescription: 'A comprehensive e-commerce solution built with modern web technologies, featuring real-time inventory tracking, advanced search capabilities, and seamless payment integration.',
        technologies: [
          { name: 'React', category: 'Frontend', icon: 'react' },
          { name: 'Node.js', category: 'Backend', icon: 'nodejs' },
          { name: 'PostgreSQL', category: 'Database', icon: 'postgresql' },
          { name: 'Redis', category: 'Cache', icon: 'redis' },
        ],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800',
            alt: 'E-Commerce Platform Dashboard',
            thumbnail: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=400',
            featured: true,
          },
          {
            url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
            alt: 'Product Catalog View',
            thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
            featured: false,
          },
          {
            url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
            alt: 'Analytics Dashboard',
            thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
            featured: false,
          },
        ],
        liveUrl: 'https://demo-ecommerce.example.com',
        githubUrl: 'https://github.com/example/ecommerce-platform',
        demoEmbed: null, // Could be set to an iframe URL for embedded demo
        caseStudy: {
          problem: 'The client needed a scalable e-commerce platform to handle high traffic during peak seasons while maintaining fast page load times and real-time inventory updates.',
          solution: 'Implemented a microservices architecture with Redis caching, optimized database queries, and real-time WebSocket connections for inventory updates.',
          process: [
            'Conducted thorough requirements analysis and user research',
            'Designed scalable microservices architecture',
            'Implemented real-time inventory management system',
            'Optimized database queries and added caching layer',
            'Conducted extensive load testing and performance optimization',
          ],
          results: 'Achieved 99.9% uptime during peak seasons, reduced page load times by 60%, and increased conversion rates by 35%.',
          testimonial: {
            text: 'The platform exceeded our expectations. The performance improvements have directly impacted our bottom line.',
            author: 'Sarah Johnson',
            role: 'CTO',
            company: 'RetailCo',
            avatar: 'https://i.pravatar.cc/150?img=5',
          },
        },
        featured: true,
        category: 'Web Application',
        dateCompleted: new Date('2024-01-15'),
        metrics: {
          performanceImprovement: '60%',
          userGrowth: '150%',
          revenue: '+$2M annually',
        },
      },
      {
        id: 'task-management-app',
        title: 'Task Management Application',
        description: 'Collaborative task management tool with real-time updates',
        longDescription: 'A feature-rich task management application designed for teams, offering real-time collaboration, advanced filtering, and intuitive drag-and-drop interfaces.',
        technologies: [
          { name: 'Vue.js', category: 'Frontend', icon: 'vue' },
          { name: 'Express', category: 'Backend', icon: 'express' },
          { name: 'MongoDB', category: 'Database', icon: 'mongodb' },
          { name: 'Socket.io', category: 'Real-time', icon: 'socketio' },
        ],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
            alt: 'Task Board View',
            thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
            featured: true,
          },
          {
            url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800',
            alt: 'Team Collaboration Interface',
            thumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400',
            featured: false,
          },
        ],
        liveUrl: 'https://demo-tasks.example.com',
        githubUrl: 'https://github.com/example/task-management',
        demoEmbed: null,
        caseStudy: {
          problem: 'Teams struggled with coordination and visibility across multiple projects, leading to missed deadlines and duplicated work.',
          solution: 'Built an intuitive task management system with real-time updates, customizable workflows, and comprehensive reporting features.',
          process: [
            'Interviewed stakeholders to understand pain points',
            'Designed user-friendly interface with drag-and-drop functionality',
            'Implemented real-time collaboration features',
            'Added advanced filtering and search capabilities',
            'Integrated with popular third-party tools',
          ],
          results: 'Teams reported 40% improvement in project completion rates and 50% reduction in coordination overhead.',
          testimonial: {
            text: 'This tool transformed how our team works. The real-time updates keep everyone in sync.',
            author: 'Michael Chen',
            role: 'Project Manager',
            company: 'TechStart Inc',
            avatar: 'https://i.pravatar.cc/150?img=12',
          },
        },
        featured: true,
        category: 'Web Application',
        dateCompleted: new Date('2023-11-20'),
        metrics: {
          performanceImprovement: '40%',
          userGrowth: '200%',
        },
      },
      {
        id: 'portfolio-website',
        title: 'Creative Portfolio Website',
        description: 'Award-winning portfolio site with stunning animations',
        longDescription: 'A visually stunning portfolio website featuring advanced animations, smooth transitions, and an immersive user experience that showcases creative work.',
        technologies: [
          { name: 'JavaScript', category: 'Frontend', icon: 'javascript' },
          { name: 'GSAP', category: 'Animation', icon: 'gsap' },
          { name: 'Three.js', category: '3D Graphics', icon: 'threejs' },
          { name: 'Vite', category: 'Build Tool', icon: 'vite' },
        ],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800',
            alt: 'Portfolio Homepage',
            thumbnail: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400',
            featured: true,
          },
          {
            url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
            alt: 'Interactive 3D Elements',
            thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400',
            featured: false,
          },
        ],
        liveUrl: 'https://creative-portfolio.example.com',
        githubUrl: 'https://github.com/example/creative-portfolio',
        demoEmbed: null,
        caseStudy: {
          problem: 'The client needed a portfolio that would stand out in a competitive creative industry and effectively showcase their unique style.',
          solution: 'Created an immersive experience with custom 3D graphics, smooth animations, and innovative navigation that reflects the client\'s creative vision.',
          process: [
            'Collaborated closely with client on visual direction',
            'Designed custom 3D elements and animations',
            'Optimized performance for smooth 60fps animations',
            'Implemented accessibility features',
            'Conducted user testing and refinement',
          ],
          results: 'Won Awwwards Site of the Day, increased client inquiries by 300%, and achieved 95+ Lighthouse performance score.',
        },
        featured: false,
        category: 'Portfolio',
        dateCompleted: new Date('2023-09-10'),
        metrics: {
          performanceImprovement: '95+ Lighthouse Score',
          other: 'Awwwards Site of the Day',
        },
      },
    ]
  }

  /**
   * Destroy the project manager
   */
  destroy() {
    this.projects = []
    this.cache.clear()
    this.isInitialized = false
    logger.info('Project Manager destroyed')
  }
}
