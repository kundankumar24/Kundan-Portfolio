/**
 * Contact Form Module
 * Handles contact form functionality with validation, sanitization, and spam protection
 */

import { logger } from '../utils/logger.js'

export class ContactForm {
  constructor(config = {}) {
    this.config = {
      formSelector: '#contactForm',
      validateOnInput: true,
      rateLimit: {
        maxAttempts: 3,
        windowMs: 60000, // 1 minute
      },
      emailService: {
        provider: 'emailjs', // or 'custom'
        serviceId: null,
        templateId: null,
        publicKey: null,
      },
      newsletter: {
        enabled: true,
        apiEndpoint: null,
      },
      alternativeContacts: null, // Array of alternative contact methods
      ...config,
    }

    this.form = null
    this.isInitialized = false
    this.submissionAttempts = []
    this.validators = this.initializeValidators()
    this.emailServiceReady = false
  }

  /**
   * Initialize validation rules
   */
  initializeValidators() {
    return {
      name: {
        required: true,
        minLength: 2,
        maxLength: 100,
        pattern: /^[a-zA-Z\s'-]+$/,
        message: 'Name must be 2-100 characters and contain only letters, spaces, hyphens, and apostrophes',
      },
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address',
      },
      subject: {
        required: true,
        minLength: 5,
        maxLength: 200,
        message: 'Subject must be 5-200 characters',
      },
      message: {
        required: true,
        minLength: 10,
        maxLength: 5000,
        message: 'Message must be 10-5000 characters',
      },
    }
  }
  /**
   * Show alternative contact methods
   */
  showAlternativeContactMethods() {
    // Check if alternative methods section already exists
    let alternativesSection = this.form.parentElement.querySelector('.contact-alternatives')

    if (!alternativesSection) {
      alternativesSection = this.createAlternativeContactSection()
      this.form.parentElement.appendChild(alternativesSection)
    }

    // Make it visible and announce to screen readers
    alternativesSection.style.display = 'block'
    alternativesSection.setAttribute('aria-live', 'polite')

    // Track analytics
    this.trackContactEvent('alternative_methods_shown')

    logger.info('Alternative contact methods displayed')
  }

  /**
   * Create alternative contact methods section
   */
  createAlternativeContactSection() {
    const section = document.createElement('div')
    section.className = 'contact-alternatives'
    section.setAttribute('role', 'region')
    section.setAttribute('aria-label', 'Alternative contact methods')

    const heading = document.createElement('h3')
    heading.textContent = 'Alternative Contact Methods'
    section.appendChild(heading)

    const description = document.createElement('p')
    description.className = 'alternatives-description'
    description.textContent = 'Having trouble with the form? You can reach out through these alternative methods:'
    section.appendChild(description)

    const methodsContainer = document.createElement('div')
    methodsContainer.className = 'contact-methods'

    // Get contact methods from config or use defaults
    const contactMethods = this.config.alternativeContacts || this.getDefaultContactMethods()

    contactMethods.forEach(method => {
      const methodElement = this.createContactMethodElement(method)
      methodsContainer.appendChild(methodElement)
    })

    section.appendChild(methodsContainer)

    return section
  }

  /**
   * Get default contact methods
   */
  getDefaultContactMethods() {
    return [
      {
        type: 'email',
        label: 'Email',
        value: 'your.email@example.com',
        icon: 'email',
        href: 'mailto:your.email@example.com',
      },
      {
        type: 'linkedin',
        label: 'LinkedIn',
        value: 'Connect on LinkedIn',
        icon: 'linkedin',
        href: 'https://www.linkedin.com/in/yourusername',
      },
      {
        type: 'github',
        label: 'GitHub',
        value: 'View on GitHub',
        icon: 'github',
        href: 'https://github.com/yourusername',
      },
      {
        type: 'twitter',
        label: 'Twitter',
        value: 'Message on Twitter',
        icon: 'twitter',
        href: 'https://twitter.com/yourusername',
      },
    ]
  }

  /**
   * Create contact method element
   */
  createContactMethodElement(method) {
    const link = document.createElement('a')
    link.className = 'contact-method'
    link.href = method.href
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.setAttribute('aria-label', `${method.label}: ${method.value}`)

    // Create icon
    const icon = this.createContactIcon(method.icon)
    link.appendChild(icon)

    // Create text content
    const textContainer = document.createElement('span')
    textContainer.className = 'contact-method-text'

    const label = document.createElement('strong')
    label.textContent = method.label
    textContainer.appendChild(label)

    const value = document.createElement('span')
    value.className = 'contact-method-value'
    value.textContent = method.value
    textContainer.appendChild(value)

    link.appendChild(textContainer)

    // Track clicks
    link.addEventListener('click', () => {
      this.trackContactEvent('alternative_method_clicked', {
        method: method.type,
        label: method.label,
      })
    })

    return link
  }

  /**
   * Create SVG icon for contact method
   */
  createContactIcon(iconType) {
    const iconContainer = document.createElement('span')
    iconContainer.className = 'contact-method-icon'
    iconContainer.setAttribute('aria-hidden', 'true')

    const icons = {
      email: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
      linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>',
      github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>',
      twitter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/></svg>',
    }

    iconContainer.innerHTML = icons[iconType] || icons.email

    return iconContainer
  }

  /**
   * Initialize contact form
   */
  async init() {
    try {
      logger.info('Initializing Contact Form...')

      this.form = document.querySelector(this.config.formSelector)

      if (this.form) {
        this.setupFormHandling()
        this.setupRealTimeValidation()
        await this.initializeEmailService()
      }

      this.isInitialized = true
      logger.info('Contact Form initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Contact Form:', error)
      throw error
    }
  }

  /**
   * Initialize email service (EmailJS)
   */
  async initializeEmailService() {
    const { provider, serviceId, templateId, publicKey } = this.config.emailService

    if (provider === 'emailjs' && publicKey) {
      try {
        // Check if EmailJS is loaded
        if (typeof emailjs !== 'undefined') {
          emailjs.init(publicKey)
          this.emailServiceReady = true
          logger.info('EmailJS initialized successfully')
        } else {
          logger.warn('EmailJS library not loaded')
        }
      } catch (error) {
        logger.error('Failed to initialize EmailJS:', error)
      }
    }
  }

  /**
   * Set up form handling
   */
  setupFormHandling() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault()
      await this.handleSubmit()
    })
  }

  /**
   * Set up real-time validation
   */
  setupRealTimeValidation() {
    if (!this.config.validateOnInput) return

    const fields = this.form.querySelectorAll('input, textarea')
    fields.forEach((field) => {
      field.addEventListener('blur', () => {
        this.validateField(field.name, field.value)
      })

      field.addEventListener('input', () => {
        // Clear error on input
        this.clearFieldError(field.name)
      })
    })
  }

  /**
   * Validate a single field
   */
  validateField(fieldName, value) {
    const validator = this.validators[fieldName]
    if (!validator) return { valid: true }

    const errors = []

    // Required check
    if (validator.required && !value.trim()) {
      errors.push(`${this.capitalizeFirst(fieldName)} is required`)
    }

    // Skip other validations if empty and not required
    if (!value.trim() && !validator.required) {
      return { valid: true }
    }

    // Min length check
    if (validator.minLength && value.length < validator.minLength) {
      errors.push(validator.message || `Minimum ${validator.minLength} characters required`)
    }

    // Max length check
    if (validator.maxLength && value.length > validator.maxLength) {
      errors.push(validator.message || `Maximum ${validator.maxLength} characters allowed`)
    }

    // Pattern check
    if (validator.pattern && !validator.pattern.test(value)) {
      errors.push(validator.message || `Invalid ${fieldName} format`)
    }

    const valid = errors.length === 0

    if (!valid) {
      this.showFieldError(fieldName, errors[0])
    } else {
      this.clearFieldError(fieldName)
    }

    return { valid, errors }
  }

  /**
   * Validate entire form
   */
  validateForm(formData) {
    const results = {}
    let isValid = true

    for (const [fieldName, value] of formData.entries()) {
      const result = this.validateField(fieldName, value)
      results[fieldName] = result
      if (!result.valid) {
        isValid = false
      }
    }

    return { valid: isValid, results }
  }

  /**
   * Sanitize input to prevent XSS
   */
  sanitizeInput(input) {
    const div = document.createElement('div')
    div.textContent = input
    return div.innerHTML
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  /**
   * Check rate limiting
   */
  checkRateLimit() {
    const now = Date.now()
    const { maxAttempts, windowMs } = this.config.rateLimit

    // Remove old attempts outside the window
    this.submissionAttempts = this.submissionAttempts.filter(
      (timestamp) => now - timestamp < windowMs
    )

    if (this.submissionAttempts.length >= maxAttempts) {
      return {
        allowed: false,
        message: `Too many submission attempts. Please wait ${Math.ceil(windowMs / 1000)} seconds before trying again.`,
      }
    }

    return { allowed: true }
  }

  /**
   * Detect spam patterns
   */
  detectSpam(formData) {
    const message = formData.get('message')
    const name = formData.get('name')
    const email = formData.get('email')

    // Check for honeypot field (if implemented in HTML)
    const honeypot = formData.get('website')
    if (honeypot) {
      return { isSpam: true, reason: 'Honeypot triggered' }
    }

    // Check for excessive links
    const linkPattern = /(https?:\/\/[^\s]+)/g
    const links = message.match(linkPattern) || []
    if (links.length > 3) {
      return { isSpam: true, reason: 'Too many links' }
    }

    // Check for suspicious patterns
    const spamPatterns = [
      /\b(viagra|cialis|casino|lottery|winner)\b/i,
      /\b(click here|buy now|limited time)\b/i,
      /(.)\1{10,}/, // Repeated characters
    ]

    for (const pattern of spamPatterns) {
      if (pattern.test(message) || pattern.test(name)) {
        return { isSpam: true, reason: 'Suspicious content detected' }
      }
    }

    return { isSpam: false }
  }

  /**
   * Handle form submission
   */
  async handleSubmit() {
    try {
      // Check rate limiting
      const rateLimitCheck = this.checkRateLimit()
      if (!rateLimitCheck.allowed) {
        this.showFormError(rateLimitCheck.message)
        return { success: false, error: rateLimitCheck.message }
      }

      // Get form data
      const formData = new FormData(this.form)

      // Validate form
      const validation = this.validateForm(formData)
      if (!validation.valid) {
        this.showFormError('Please correct the errors in the form')
        return { success: false, error: 'Validation failed', validation }
      }

      // Check for spam
      const spamCheck = this.detectSpam(formData)
      if (spamCheck.isSpam) {
        logger.warn('Spam detected:', spamCheck.reason)
        this.showFormError('Your submission could not be processed. Please try again.')
        return { success: false, error: 'Spam detected' }
      }

      // Sanitize inputs
      const sanitizedData = {
        name: this.sanitizeInput(formData.get('name')),
        email: this.sanitizeInput(formData.get('email')),
        subject: this.sanitizeInput(formData.get('subject')),
        message: this.sanitizeInput(formData.get('message')),
      }

      // Record submission attempt
      this.submissionAttempts.push(Date.now())

      // Show loading state
      this.setFormLoading(true)

      // Check if offline - queue for background sync
      if (!navigator.onLine) {
        const queued = await this.queueForBackgroundSync(sanitizedData)
        if (queued) {
          this.showFormSuccess(
            'You are offline. Your message has been queued and will be sent when you reconnect.'
          )
          this.form.reset()
          this.trackContactEvent('form_queued_offline', sanitizedData)
          return { success: true, queued: true, data: sanitizedData }
        } else {
          throw new Error('Failed to queue message for offline sync')
        }
      }

      // Send email via configured service
      const emailResult = await this.sendEmail(sanitizedData)

      if (!emailResult.success) {
        // Try to queue for background sync if send fails
        const queued = await this.queueForBackgroundSync(sanitizedData)
        if (queued) {
          this.showFormSuccess(
            'Your message has been queued and will be sent shortly.'
          )
          this.form.reset()
          this.trackContactEvent('form_queued_retry', sanitizedData)
          return { success: true, queued: true, data: sanitizedData }
        }
        throw new Error(emailResult.error || 'Failed to send email')
      }

      // Show success message
      this.showFormSuccess(
        'Thank you for your message! We will get back to you within 24-48 hours.'
      )
      this.form.reset()

      // Send analytics event
      this.trackContactEvent('form_submission_success', sanitizedData)

      return { success: true, data: sanitizedData }
    } catch (error) {
      logger.error('Form submission error:', error)
      this.showFormError(
        'An error occurred while sending your message. Please try again or use an alternative contact method below.'
      )
      
      // Show alternative contact methods on error
      this.showAlternativeContactMethods()
      
      this.trackContactEvent('form_submission_error', { error: error.message })
      return { success: false, error: error.message }
    } finally {
      this.setFormLoading(false)
    }
  }

  /**
   * Queue form submission for background sync
   */
  async queueForBackgroundSync(data) {
    try {
      // Get service worker manager from portfolio app
      const app = window.portfolioApp
      if (!app) {
        logger.warn('Portfolio app not available for background sync')
        return false
      }

      const swManager = app.getModule('serviceWorker')
      if (!swManager) {
        logger.warn('Service worker manager not available')
        return false
      }

      // Queue the submission
      const queued = await swManager.queueForSync({
        url: this.config.emailService.endpoint || '/api/contact',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      return queued
    } catch (error) {
      logger.error('Failed to queue for background sync:', error)
      return false
    }
  }

  /**
   * Send email via configured service
   */
  async sendEmail(data) {
    const { provider, serviceId, templateId } = this.config.emailService

    try {
      if (provider === 'emailjs' && this.emailServiceReady) {
        // Send via EmailJS
        const response = await emailjs.send(serviceId, templateId, {
          from_name: data.name,
          from_email: data.email,
          subject: data.subject,
          message: data.message,
          to_name: 'Portfolio Owner',
        })

        logger.info('Email sent successfully via EmailJS:', response)
        return { success: true, response }
      } else if (provider === 'custom') {
        // Send via custom API endpoint
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        logger.info('Email sent successfully via custom API:', result)
        return { success: true, response: result }
      } else {
        // Fallback: log to console (development mode)
        logger.warn('No email service configured. Message logged:', data)
        return { success: true, response: 'Development mode - no email sent' }
      }
    } catch (error) {
      logger.error('Email sending failed:', error)
      
      // Show alternative contact methods when email service fails
      this.showAlternativeContactMethods()
      
      return { success: false, error: error.message }
    }
  }

  /**
   * Subscribe to newsletter
   */
  async subscribeNewsletter(email) {
    try {
      // Validate email
      const validation = this.validateField('email', email)
      if (!validation.valid) {
        return { success: false, error: 'Invalid email address' }
      }

      // Sanitize email
      const sanitizedEmail = this.sanitizeInput(email)

      const { apiEndpoint } = this.config.newsletter

      if (apiEndpoint) {
        // Send to newsletter API
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: sanitizedEmail }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        logger.info('Newsletter subscription successful:', result)

        // Track analytics
        this.trackContactEvent('newsletter_subscription', { email: sanitizedEmail })

        return { success: true, response: result }
      } else {
        // Fallback: log to console
        logger.warn('No newsletter API configured. Subscription logged:', sanitizedEmail)
        this.trackContactEvent('newsletter_subscription', { email: sanitizedEmail })
        return { success: true, response: 'Development mode - no subscription sent' }
      }
    } catch (error) {
      logger.error('Newsletter subscription failed:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Track contact events for analytics
   */
  trackContactEvent(eventName, data = {}) {
    try {
      // Google Analytics 4
      if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
          event_category: 'contact',
          ...data,
        })
      }

      // Custom analytics
      if (window.analytics && typeof window.analytics.track === 'function') {
        window.analytics.track(eventName, data)
      }

      logger.info('Analytics event tracked:', eventName, data)
    } catch (error) {
      logger.error('Failed to track analytics event:', error)
    }
  }

  /**
   * Show field error
   */
  showFieldError(fieldName, message) {
    const field = this.form.querySelector(`[name="${fieldName}"]`)
    if (!field) return

    // Add error class to field
    field.classList.add('error')
    field.setAttribute('aria-invalid', 'true')

    // Create or update error message
    let errorElement = field.parentElement.querySelector('.error-message')
    if (!errorElement) {
      errorElement = document.createElement('span')
      errorElement.className = 'error-message'
      errorElement.setAttribute('role', 'alert')
      field.parentElement.appendChild(errorElement)
    }
    errorElement.textContent = message
  }

  /**
   * Clear field error
   */
  clearFieldError(fieldName) {
    const field = this.form.querySelector(`[name="${fieldName}"]`)
    if (!field) return

    field.classList.remove('error')
    field.removeAttribute('aria-invalid')

    const errorElement = field.parentElement.querySelector('.error-message')
    if (errorElement) {
      errorElement.remove()
    }
  }

  /**
   * Show form-level error
   */
  showFormError(message) {
    let errorElement = this.form.querySelector('.form-error')
    if (!errorElement) {
      errorElement = document.createElement('div')
      errorElement.className = 'form-error'
      errorElement.setAttribute('role', 'alert')
      this.form.insertBefore(errorElement, this.form.firstChild)
    }
    errorElement.textContent = message
    errorElement.style.display = 'block'
  }

  /**
   * Show form success message
   */
  showFormSuccess(message) {
    let successElement = this.form.querySelector('.form-success')
    if (!successElement) {
      successElement = document.createElement('div')
      successElement.className = 'form-success'
      successElement.setAttribute('role', 'status')
      this.form.insertBefore(successElement, this.form.firstChild)
    }
    successElement.textContent = message
    successElement.style.display = 'block'

    // Hide after 5 seconds
    setTimeout(() => {
      successElement.style.display = 'none'
    }, 5000)
  }

  /**
   * Set form loading state
   */
  setFormLoading(loading) {
    const submitButton = this.form.querySelector('button[type="submit"]')
    if (submitButton) {
      submitButton.disabled = loading
      submitButton.textContent = loading ? 'Sending...' : 'Send Message'
    }

    const inputs = this.form.querySelectorAll('input, textarea')
    inputs.forEach((input) => {
      input.disabled = loading
    })
  }

  /**
   * Capitalize first letter
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  /**
   * Destroy contact form
   */
  destroy() {
    this.isInitialized = false
    this.submissionAttempts = []
    logger.info('Contact Form destroyed')
  }
}
