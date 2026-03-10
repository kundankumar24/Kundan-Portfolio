/**
 * Skills Page Module
 * Handles the display and interaction of skills on the skills page
 */

import { getAllSkills, getCategories, getProficiencyLevel, getProficiencyColorClass } from '../config/skillsData.js'

/**
 * Initialize the skills page
 */
export function initSkillsPage() {
  console.log('🚀 Initializing skills page...')
  const skillsContainer = document.getElementById('skills-showcase')
  
  if (!skillsContainer) {
    console.log('❌ Skills container not found')
    return
  }

  console.log('✓ Skills container found')

  try {
    renderSkills(skillsContainer)
    console.log('✓ Skills rendered successfully')
  } catch (error) {
    console.error('❌ Error initializing skills page:', error)
    skillsContainer.innerHTML = `
      <div class="error-message">
        <p>Failed to load skills. Please try again later.</p>
      </div>
    `
  }
}

/**
 * Render all skills grouped by category
 * @param {HTMLElement} container - Container element
 */
function renderSkills(container) {
  console.log('📦 Getting all skills...')
  const skillsData = getAllSkills()
  const categories = getCategories()
  
  console.log(`✓ Found ${categories.length} categories`)
  
  if (!categories || categories.length === 0) {
    console.log('❌ No skills available')
    container.innerHTML = `
      <div class="empty-state">
        <p>No skills available at the moment.</p>
      </div>
    `
    return
  }

  // Create skills grid
  const skillsGrid = document.createElement('div')
  skillsGrid.className = 'skills-grid'
  
  categories.forEach((category, categoryIndex) => {
    const skills = skillsData[category]
    if (!skills || skills.length === 0) {
      return
    }
    
    console.log(`Creating section for category: ${category} (${skills.length} skills)`)
    
    const categorySection = createCategorySection(category, skills, categoryIndex)
    skillsGrid.appendChild(categorySection)
  })
  
  container.innerHTML = ''
  container.appendChild(skillsGrid)
  console.log('✓ Skills grid appended to container')
  
  // Initialize animations after skills are rendered
  setTimeout(() => {
    initScrollAnimations()
    animateProficiencyBars()
    console.log('✓ Animations initialized')
  }, 100)
}

/**
 * Create a category section with skills
 * @param {string} category - Category name
 * @param {Array} skills - Skills in the category
 * @param {number} categoryIndex - Category index for animation
 * @returns {HTMLElement} Category section element
 */
function createCategorySection(category, skills, categoryIndex) {
  const section = document.createElement('div')
  section.className = 'skills-category animate-on-scroll'
  section.style.animationDelay = `${categoryIndex * 0.1}s`
  
  const title = document.createElement('h2')
  title.className = 'skills-category__title'
  title.textContent = category
  
  const grid = document.createElement('div')
  grid.className = 'skills-category__grid'
  
  skills.forEach((skill, index) => {
    const skillCard = createSkillCard(skill, index)
    grid.appendChild(skillCard)
  })
  
  section.appendChild(title)
  section.appendChild(grid)
  
  return section
}

/**
 * Create a skill card element
 * @param {Object} skill - Skill data
 * @param {number} index - Skill index for animation delay
 * @returns {HTMLElement} Skill card element
 */
function createSkillCard(skill, index) {
  const card = document.createElement('article')
  card.className = 'skill-card animate-on-scroll'
  card.style.animationDelay = `${index * 0.1}s`
  
  const proficiencyLevel = getProficiencyLevel(skill.proficiency)
  const proficiencyColorClass = getProficiencyColorClass(skill.proficiency)
  
  card.innerHTML = `
    <div class="skill-card__header">
      <div class="skill-card__title-group">
        <h3 class="skill-card__title">
          <span style="font-size: 1.5rem; margin-right: 0.5rem;">${skill.icon}</span>
          ${escapeHtml(skill.name)}
        </h3>
        ${skill.description ? `
          <p style="font-size: 0.875rem; color: #64748b; margin: 0.5rem 0 0 0; line-height: 1.5;">
            ${escapeHtml(skill.description)}
          </p>
        ` : ''}
      </div>
    </div>
    
    <div class="skill-card__proficiency">
      <div class="proficiency-header">
        <span class="proficiency-label">Proficiency</span>
        <span class="proficiency-value">${skill.proficiency}%</span>
      </div>
      <div class="proficiency-bar">
        <div class="proficiency-bar__fill ${proficiencyColorClass}" 
             data-proficiency="${skill.proficiency}"
             style="width: 0%;">
          <div class="proficiency-bar__glow"></div>
        </div>
      </div>
      <div class="proficiency-level">
        <span class="proficiency-level__text">${proficiencyLevel}</span>
      </div>
    </div>
  `
  
  return card
}

/**
 * Animate proficiency bars
 */
function animateProficiencyBars() {
  const bars = document.querySelectorAll('.proficiency-bar__fill')
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target
        const proficiency = bar.getAttribute('data-proficiency')
        
        // Animate the width
        setTimeout(() => {
          bar.style.width = `${proficiency}%`
        }, 100)
        
        observer.unobserve(bar)
      }
    })
  }, {
    threshold: 0.5
  })
  
  bars.forEach(bar => observer.observe(bar))
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
