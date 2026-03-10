/**
 * Back to Top Button Module
 * Shows a button to scroll back to top when user scrolls down
 */

export class BackToTopButton {
  constructor(config = {}) {
    this.config = {
      showAfter: config.showAfter || 300, // Show after scrolling 300px
      scrollDuration: config.scrollDuration || 500, // Smooth scroll duration
      ...config
    }
    
    this.button = null
    this.isVisible = false
  }

  /**
   * Initialize the back to top button
   */
  init() {
    this.createButton()
    this.attachEventListeners()
    console.log('✓ Back to Top button initialized')
  }

  /**
   * Create the button element
   */
  createButton() {
    this.button = document.createElement('button')
    this.button.id = 'back-to-top'
    this.button.className = 'back-to-top'
    this.button.setAttribute('aria-label', 'Back to top')
    this.button.setAttribute('title', 'Back to top')
    this.button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    `
    
    document.body.appendChild(this.button)
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Show/hide button on scroll
    window.addEventListener('scroll', () => this.handleScroll(), { passive: true })
    
    // Scroll to top on click
    this.button.addEventListener('click', () => this.scrollToTop())
  }

  /**
   * Handle scroll event
   */
  handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    
    if (scrollTop > this.config.showAfter && !this.isVisible) {
      this.show()
    } else if (scrollTop <= this.config.showAfter && this.isVisible) {
      this.hide()
    }
  }

  /**
   * Show the button
   */
  show() {
    this.button.classList.add('visible')
    this.isVisible = true
  }

  /**
   * Hide the button
   */
  hide() {
    this.button.classList.remove('visible')
    this.isVisible = false
  }

  /**
   * Scroll to top smoothly
   */
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  /**
   * Destroy the button
   */
  destroy() {
    if (this.button) {
      this.button.remove()
      this.button = null
    }
    this.isVisible = false
  }
}

export default BackToTopButton
