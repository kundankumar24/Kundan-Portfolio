/**
 * Experience Page Module
 * Handles the display of work experience and education timelines
 */

import { getExperiencesByType, formatDate, calculateDuration } from '../config/experienceData.js'

/**
 * Initialize the experience page
 */
export function initExperiencePage() {
  console.log('🚀 Initializing experience page...')
  
  const workContainer = document.getElementById('work-experience-timeline')
  const achievementsContainer = document.getElementById('achievements-grid')
  const certificationsContainer = document.getElementById('certifications-grid')
  
  if (workContainer) {
    console.log('✓ Work experience container found')
    renderWorkExperience(workContainer)
  } else {
    console.log('❌ Work experience container not found')
  }
  
  if (achievementsContainer) {
    console.log('✓ Achievements container found')
    renderAchievements(achievementsContainer)
  } else {
    console.log('❌ Achievements container not found')
  }
  
  if (certificationsContainer) {
    console.log('✓ Certifications container found')
    renderCertifications(certificationsContainer)
  } else {
    console.log('❌ Certifications container not found')
  }
}

/**
 * Render work experience timeline
 * @param {HTMLElement} container - Container element
 */
function renderWorkExperience(container) {
  const experiences = getExperiencesByType('work')
  
  if (!experiences || experiences.length === 0) {
    container.innerHTML = '<p class="empty-state">No work experience available.</p>'
    return
  }

  const timeline = document.createElement('div')
  timeline.className = 'timeline'
  
  experiences.forEach((exp, index) => {
    const item = createTimelineItem(exp, index)
    timeline.appendChild(item)
  })
  
  container.innerHTML = ''
  container.appendChild(timeline)
  console.log(`✓ Rendered ${experiences.length} work experiences`)
  
  // Initialize scroll animations after rendering
  setTimeout(() => {
    initScrollAnimations()
    console.log('✓ Work experience scroll animations initialized')
  }, 100)
}

/**
 * Create a timeline item
 * @param {Object} item - Experience item
 * @param {number} index - Item index
 * @returns {HTMLElement} Timeline item element
 */
function createTimelineItem(item, index) {
  const timelineItem = document.createElement('div')
  timelineItem.className = 'timeline-item animate-on-scroll'
  timelineItem.style.animationDelay = `${index * 0.1}s`
  
  const duration = calculateDuration(item.startDate, item.endDate)
  const startDateStr = formatDate(item.startDate)
  const endDateStr = item.current ? 'Present' : formatDate(item.endDate)
  
  timelineItem.innerHTML = `
    <div class="timeline-marker"></div>
    <div class="timeline-content card">
      <div class="timeline-header">
        <div class="timeline-title-group">
          <h3 class="timeline-title">${escapeHtml(item.position || item.degree)}</h3>
          <p class="timeline-company">${escapeHtml(item.company || item.institution)}</p>
        </div>
        <div class="timeline-date-group">
          <span class="timeline-date">${startDateStr} - ${endDateStr}</span>
          <span class="timeline-duration">${duration}</span>
          ${item.location ? `<span class="timeline-location">📍 ${escapeHtml(item.location)}</span>` : ''}
        </div>
      </div>
      
      ${item.grade ? `<p class="timeline-grade">${escapeHtml(item.grade)}</p>` : ''}
      
      <p class="timeline-description">${escapeHtml(item.description)}</p>
      
      ${item.achievements && item.achievements.length > 0 ? `
        <div class="timeline-achievements">
          <h4>Key Achievements:</h4>
          <ul>
            ${item.achievements.map(achievement => `
              <li>${escapeHtml(achievement)}</li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${item.technologies && item.technologies.length > 0 ? `
        <div class="timeline-technologies">
          ${item.technologies.map(tech => `
            <span class="tech-badge badge">${escapeHtml(tech)}</span>
          `).join('')}
        </div>
      ` : ''}
      
      ${item.current ? '<span class="current-badge badge primary">Current</span>' : ''}
    </div>
  `
  
  return timelineItem
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

// Export for use in main.js
export { initScrollAnimations }


/**
 * Render achievements grid
 * @param {HTMLElement} container - Container element
 */
function renderAchievements(container) {
  const achievements = [
    {
      icon: '🎯',
      title: 'Department Leadership',
      description: 'Coordinated CSE Department extracurricular activities, driving successful programs and student engagement.'
    },
    {
      icon: '💻',
      title: 'Problem Solving Excellence',
      description: 'Solved 100+ LeetCode and 100+ GeeksforGeeks problems, strengthening algorithmic and problem-solving skills.'
    },
    {
      icon: '🌐',
      title: 'Web Development Expertise',
      description: 'Completed the Web Development Internship, gaining expertise in supervised and unsupervised learning, regression, and neural networks.'
    },
    {
      icon: '🤖',
      title: 'Generative AI Certification',
      description: 'Earned a certification in Generative AI and cloud technologies.'
    },
    {
      icon: '☁️',
      title: 'IBM Cloud Platform',
      description: 'Successfully completed Internship, leveraging Skills Build & IBM Cloud Platform in Emerging Technologies (AI & Cloud).'
    },
    {
      icon: '🚀',
      title: 'EY Full Stack Program',
      description: 'Successfully completed the EY Global Delivery Services led internship in collaboration with AICTE on Full Stack Web Development under the Next Gen Employability Program.'
    }
  ]
  
  const grid = document.createElement('div')
  grid.className = 'achievements-grid-container'
  
  achievements.forEach((achievement, index) => {
    const card = document.createElement('div')
    card.className = 'achievement-card animate-on-scroll'
    card.style.animationDelay = `${index * 0.1}s`
    
    card.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <h3 class="achievement-title">${escapeHtml(achievement.title)}</h3>
      <p class="achievement-description">${escapeHtml(achievement.description)}</p>
    `
    
    grid.appendChild(card)
  })
  
  container.innerHTML = ''
  container.appendChild(grid)
  console.log(`✓ Rendered ${achievements.length} achievements`)
  
  // Initialize scroll animations after rendering
  setTimeout(() => {
    initScrollAnimations()
    console.log('✓ Achievements scroll animations initialized')
  }, 100)
}


/**
 * Render certifications grid
 * @param {HTMLElement} container - Container element
 */
function renderCertifications(container) {
  const certifications = [
    {
      title: 'Generative AI Mastermind',
      issuer: 'OUTSKILL',
      date: 'December 20-21, 2024',
      description: 'Successfully completed a 2-day (18 hours) intensive webinar on Generative AI Mastermind.',
      icon: '🤖',
      category: 'AI/ML'
    },
    {
      title: 'Solutions Architecture Job Simulation',
      issuer: 'AWS',
      date: 'September 8, 2025',
      description: 'Completed Solutions Architecture Job Simulation conducted by AWS.',
      icon: '☁️',
      category: 'Cloud'
    },
    {
      title: 'Software Engineering Job Simulation',
      issuer: 'JPMorgan Chase & Co.',
      date: 'September 8, 2025',
      description: 'Completed Software Engineering Job Simulation conducted by JPMorgan Chase & Co.',
      icon: '💼',
      category: 'Software Engineering'
    },
    {
      title: 'Labmentix Common Aptitude Test (LCAT)',
      issuer: 'Labmentix',
      date: 'August 28, 2025',
      description: 'Qualified Labmentix Common Aptitude Test (LCAT).',
      icon: '✅',
      category: 'Assessment'
    },
    {
      title: 'Cybersecurity Analyst Job Simulation',
      issuer: 'Tata',
      date: 'August 12, 2025',
      description: 'Completed Cybersecurity Analyst Job Simulation by Tata.',
      icon: '🔒',
      category: 'Cybersecurity'
    },
    {
      title: 'GenAI Powered Data Analytics Job Simulation',
      issuer: 'Tata',
      date: 'August 13, 2025',
      description: 'Completed GenAI Powered Data Analytics Job Simulation by Tata.',
      icon: '📊',
      category: 'Data Analytics'
    },
    {
      title: 'Artificial Intelligence Primer',
      issuer: 'Infosys Springboard',
      date: 'June 9, 2025',
      description: 'Received Artificial Intelligence Primer Certification by Infosys Springboard.',
      icon: '🧠',
      category: 'AI/ML'
    },
    {
      title: 'Principles of Generative AI',
      issuer: 'Infosys Springboard',
      date: 'June 9, 2025',
      description: 'Received Principles of Generative AI Certification by Infosys Springboard.',
      icon: '🎨',
      category: 'AI/ML'
    },
    {
      title: 'Cyber Job Simulation',
      issuer: 'Deloitte',
      date: 'June 9, 2025',
      description: 'Completed Cyber Job Simulation by Deloitte.',
      icon: '🛡️',
      category: 'Cybersecurity'
    }
  ]
  
  const grid = document.createElement('div')
  grid.className = 'certifications-grid-container'
  
  certifications.forEach((cert, index) => {
    const card = document.createElement('div')
    card.className = 'certification-card animate-on-scroll'
    card.style.animationDelay = `${index * 0.1}s`
    
    card.innerHTML = `
      <div class="certification-header">
        <div class="certification-icon">${cert.icon}</div>
        <span class="certification-category badge">${escapeHtml(cert.category)}</span>
      </div>
      <h3 class="certification-title">${escapeHtml(cert.title)}</h3>
      <p class="certification-issuer">${escapeHtml(cert.issuer)}</p>
      <p class="certification-date">📅 ${escapeHtml(cert.date)}</p>
      <p class="certification-description">${escapeHtml(cert.description)}</p>
    `
    
    grid.appendChild(card)
  })
  
  container.innerHTML = ''
  container.appendChild(grid)
  console.log(`✓ Rendered ${certifications.length} certifications`)
  
  // Initialize scroll animations after rendering
  setTimeout(() => {
    initScrollAnimations()
    console.log('✓ Certifications scroll animations initialized')
  }, 100)
}
