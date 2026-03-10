/**
 * Projects Page Module
 * Handles the display and interaction of projects on the projects page
 */

import { getAllProjects, getCategories } from '../config/projectData.js'

/**
 * Initialize the projects page
 */
export function initProjectsPage() {
  console.log('🚀 Initializing projects page...')
  const projectsContainer = document.getElementById('projects-showcase')
  
  if (!projectsContainer) {
    console.log('❌ Projects container not found')
    return
  }

  console.log('✓ Projects container found')

  try {
    renderProjects(projectsContainer)
    console.log('✓ Projects rendered successfully')
  } catch (error) {
    console.error('❌ Error initializing projects page:', error)
    projectsContainer.innerHTML = `
      <div class="error-message">
        <p>Failed to load projects. Please try again later.</p>
      </div>
    `
  }
}

/**
 * Render all projects
 * @param {HTMLElement} container - Container element
 */
function renderProjects(container) {
  console.log('📦 Getting all projects...')
  const projects = getAllProjects()
  
  console.log(`✓ Found ${projects.length} projects`)
  
  if (!projects || projects.length === 0) {
    console.log('❌ No projects available')
    container.innerHTML = `
      <div class="empty-state">
        <p>No projects available at the moment.</p>
      </div>
    `
    return
  }

  // Create projects grid
  const projectsGrid = document.createElement('div')
  projectsGrid.className = 'projects-grid'
  
  projects.forEach((project, index) => {
    console.log(`Creating card for project: ${project.title}`)
    const projectCard = createProjectCard(project, index)
    projectsGrid.appendChild(projectCard)
  })
  
  container.innerHTML = ''
  container.appendChild(projectsGrid)
  console.log('✓ Projects grid appended to container')
  
  // Add event listeners to View Details buttons
  attachProjectDetailListeners()
  
  // Initialize scroll animations after projects are rendered
  setTimeout(() => {
    initScrollAnimations()
    console.log('✓ Scroll animations initialized')
  }, 100)
}

/**
 * Attach event listeners to project detail buttons
 */
function attachProjectDetailListeners() {
  const detailButtons = document.querySelectorAll('.project-details-btn')
  
  detailButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const projectId = button.getAttribute('data-project-id')
      const project = getAllProjects().find(p => p.id === projectId)
      
      if (project) {
        // Dispatch custom event for modal
        document.dispatchEvent(
          new CustomEvent('projectDetailsRequested', {
            detail: { project },
          })
        )
        console.log(`View Details clicked for project: ${project.title}`)
      }
    })
  })
  
  console.log(`✓ Attached event listeners to ${detailButtons.length} View Details buttons`)
  
  // Add explicit click handlers to Live Demo and GitHub links
  const liveDemoLinks = document.querySelectorAll('.live-demo-link')
  const githubLinks = document.querySelectorAll('.github-link')
  
  liveDemoLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      console.log('🚀 Live Demo link clicked!', link.href)
      // Don't prevent default - let the link work normally
    })
  })
  
  githubLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      console.log('💻 GitHub link clicked!', link.href)
      // Don't prevent default - let the link work normally
    })
  })
  
  console.log(`✓ Attached click handlers to ${liveDemoLinks.length} Live Demo links and ${githubLinks.length} GitHub links`)
}

/**
 * Create a project card element with enhanced design
 * @param {Object} project - Project data
 * @param {number} index - Project index for animation delay
 * @returns {HTMLElement} Project card element
 */
function createProjectCard(project, index) {
  console.log(`📝 Creating card for: ${project.title}`)
  console.log(`   Live URL: ${project.liveUrl}`)
  console.log(`   GitHub URL: ${project.githubUrl}`)
  
  const card = document.createElement('article')
  card.className = 'project-card card animate-on-scroll'
  card.style.animationDelay = `${index * 0.15}s`
  
  // Get featured image or use placeholder
  const featuredImage = project.images?.find(img => img.featured) || project.images?.[0]
  
  // Generate gradient based on category
  const categoryGradients = {
    'AI/ML': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'Web Application': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'ai': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'web': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'default': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
  }
  
  const gradient = categoryGradients[project.category] || categoryGradients['default']
  
  // Project icons based on category
  const categoryIcons = {
    'AI/ML': '🤖',
    'Web Application': '🌐',
    'ai': '🤖',
    'web': '🌐',
    'default': '💼'
  }
  
  const icon = categoryIcons[project.category] || categoryIcons['default']
  
  card.innerHTML = `
    <div class="project-card-image" style="background: ${gradient};">
      ${featuredImage ? `
        <img 
          src="${featuredImage.url}" 
          alt="${featuredImage.alt || project.title}"
          loading="lazy"
          style="width: 100%; height: 100%; object-fit: cover;"
        />
      ` : `
        <div class="project-card-placeholder">
          <span class="project-icon">${icon}</span>
        </div>
      `}
      ${project.featured ? '<span class="project-badge">⭐ Featured</span>' : ''}
    </div>
    
    <div class="project-card-content">
      <div class="project-card-header">
        <h3 class="project-card-title">${escapeHtml(project.title)}</h3>
        ${project.category ? `<span class="project-category badge">${escapeHtml(project.category)}</span>` : ''}
      </div>
      
      <p class="project-card-description">${escapeHtml(project.description)}</p>
      
      ${project.technologies && project.technologies.length > 0 ? `
        <div class="project-technologies">
          ${project.technologies.slice(0, 4).map(tech => `
            <span class="tech-badge badge">${escapeHtml(tech.name)}</span>
          `).join('')}
          ${project.technologies.length > 4 ? `
            <span class="tech-badge badge" style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(219, 39, 119, 0.15) 100%); color: #ec4899; border-color: rgba(236, 72, 153, 0.3);">+${project.technologies.length - 4} more</span>
          ` : ''}
        </div>
      ` : ''}
      
      <div class="project-card-footer">
        <div class="project-links">
          ${project.liveUrl ? `
            <a href="${project.liveUrl}" 
               class="btn btn-sm primary live-demo-link" 
               target="_blank" 
               rel="noopener noreferrer"
               style="pointer-events: auto !important; z-index: 9999 !important; position: relative !important;"
               aria-label="View ${escapeHtml(project.title)} live demo">
              <span>Live Demo</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          ` : ''}
          ${project.githubUrl ? `
            <a href="${project.githubUrl}" 
               class="btn btn-sm outline github-link" 
               target="_blank" 
               rel="noopener noreferrer"
               style="pointer-events: auto !important; z-index: 9999 !important; position: relative !important;"
               aria-label="View ${escapeHtml(project.title)} on GitHub">
              <span>GitHub</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          ` : ''}
          <button class="btn btn-sm outline project-details-btn" 
                  data-project-id="${project.id}"
                  aria-label="View details of ${escapeHtml(project.title)}">
            <span>View Details</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `
  
  console.log(`✅ Card created for: ${project.title}`)
  
  return card
}

/**
 * Format date for display
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  const options = { year: 'numeric', month: 'short' }
  return new Intl.DateTimeFormat('en-US', options).format(date)
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Initialize scroll animations
 */
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated', 'fade-in-up')
        observer.unobserve(entry.target)
      }
    })
  }, observerOptions)

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el)
  })
}
