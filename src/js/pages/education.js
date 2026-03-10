/**
 * Education Page Module
 * Handles the display of education timeline
 */

import { getExperiencesByType, formatDate, calculateDuration } from '../config/experienceData.js'

/**
 * Initialize the education page
 */
export function initEducationPage() {
  console.log('🚀 Initializing education page...')
  
  const educationContainer = document.getElementById('education-timeline')
  
  if (educationContainer) {
    console.log('✓ Education container found')
    renderEducation(educationContainer)
  } else {
    console.log('❌ Education container not found')
  }
}

/**
 * Render education timeline
 * @param {HTMLElement} container - Container element
 */
function renderEducation(container) {
  const education = getExperiencesByType('education')
  
  if (!education || education.length === 0) {
    container.innerHTML = '<p class="empty-state">No education information available.</p>'
    return
  }

  const timeline = document.createElement('div')
  timeline.className = 'timeline'
  
  education.forEach((edu, index) => {
    const item = createTimelineItem(edu, index)
    timeline.appendChild(item)
  })
  
  container.innerHTML = ''
  container.appendChild(timeline)
  console.log(`✓ Rendered ${education.length} education entries`)
  
  // Initialize scroll animations after rendering
  setTimeout(() => {
    initScrollAnimations()
    console.log('✓ Education scroll animations initialized')
  }, 100)
}

/**
 * Create a timeline item
 * @param {Object} item - Education item
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
          <h3 class="timeline-title">${escapeHtml(item.degree)}</h3>
          <p class="timeline-company">${escapeHtml(item.institution)}</p>
          ${item.field ? `<p class="timeline-field">${escapeHtml(item.field)}</p>` : ''}
        </div>
        <div class="timeline-date-group">
          <span class="timeline-date">${startDateStr} - ${endDateStr}</span>
          <span class="timeline-duration">${duration}</span>
          ${item.location ? `<span class="timeline-location">📍 ${escapeHtml(item.location)}</span>` : ''}
        </div>
      </div>
      
      ${item.grade ? `<p class="timeline-grade"><strong>${escapeHtml(item.grade)}</strong></p>` : ''}
      
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
