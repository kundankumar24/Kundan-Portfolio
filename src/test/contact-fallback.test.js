/**
 * Unit Tests for Contact Form Alternative Methods and Fallbacks
 * Tests requirement 5.5: Alternative contact methods for form failures
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { ContactForm } from '../js/modules/contact.js'

describe('Contact Form - Alternative Methods and Fallbacks', () => {
  let dom
  let document
  let contactForm

  beforeEach(() => {
    // Set up DOM
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="container">
            <form id="contactForm">
              <input type="text" name="name" />
              <input type="email" name="email" />
              <input type="text" name="subject" />
              <textarea name="message"></textarea>
              <button type="submit">Send</button>
            </form>
          </div>
        </body>
      </html>
    `)
    document = dom.window.document
    global.document = document
    global.window = dom.window

    // Mock console methods
    global.console = {
      log: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    }
  })

  afterEach(() => {
    if (contactForm) {
      contactForm.destroy()
    }
    vi.clearAllMocks()
  })

  describe('Alternative Contact Methods Display', () => {
    it('should create alternative contact methods section', async () => {
      contactForm = new ContactForm({
        formSelector: '#contactForm',
        alternativeContacts: [
          {
            type: 'email',
            label: 'Email',
            value: 'test@example.com',
            icon: 'email',
            href: 'mailto:test@example.com',
          },
        ],
      })

      await contactForm.init()

      // Show alternative methods
      contactForm.showAlternativeContactMethods()

      // Check if section was created
      const alternativesSection = document.querySelector('.contact-alternatives')
      expect(alternativesSection).toBeTruthy()
      expect(alternativesSection.style.display).toBe('block')
    })

    it('should display configured alternative contact methods', async () => {
      const alternativeContacts = [
        {
          type: 'email',
          label: 'Email',
          value: 'test@example.com',
          icon: 'email',
          href: 'mailto:test@example.com',
        },
        {
          type: 'linkedin',
          label: 'LinkedIn',
          value: 'Connect on LinkedIn',
          icon: 'linkedin',
          href: 'https://linkedin.com/in/test',
        },
      ]

      contactForm = new ContactForm({
        formSelector: '#contactForm',
        alternativeContacts,
      })

      await contactForm.init()
      contactForm.showAlternativeContactMethods()

      const contactMethods = document.querySelectorAll('.contact-method')
      expect(contactMethods.length).toBe(2)
    })

    it('should use default contact methods if none configured', async () => {
      contactForm = new ContactForm({
        formSelector: '#contactForm',
      })

      await contactForm.init()
      contactForm.showAlternativeContactMethods()

      const contactMethods = document.querySelectorAll('.contact-method')
      expect(contactMethods.length).toBeGreaterThan(0)
    })

    it('should include proper accessibility attributes', async () => {
      contactForm = new ContactForm({
        formSelector: '#contactForm',
      })

      await contactForm.init()
      contactForm.showAlternativeContactMethods()

      const alternativesSection = document.querySelector('.contact-alternatives')
      expect(alternativesSection.getAttribute('role')).toBe('region')
      expect(alternativesSection.getAttribute('aria-label')).toBe('Alternative contact methods')
      expect(alternativesSection.getAttribute('aria-live')).toBe('polite')
    })

    it('should create contact method elements with proper structure', async () => {
      contactForm = new ContactForm({
        formSelector: '#contactForm',
        alternativeContacts: [
          {
            type: 'email',
            label: 'Email',
            value: 'test@example.com',
            icon: 'email',
            href: 'mailto:test@example.com',
          },
        ],
      })

      await contactForm.init()
      contactForm.showAlternativeContactMethods()

      const contactMethod = document.querySelector('.contact-method')
      expect(contactMethod.tagName).toBe('A')
      expect(contactMethod.getAttribute('href')).toBe('mailto:test@example.com')
      expect(contactMethod.getAttribute('target')).toBe('_blank')
      expect(contactMethod.getAttribute('rel')).toBe('noopener noreferrer')

      const icon = contactMethod.querySelector('.contact-method-icon')
      expect(icon).toBeTruthy()

      const text = contactMethod.querySelector('.contact-method-text')
      expect(text).toBeTruthy()
    })
  })

  describe('Error Handling with Fallbacks', () => {
    it('should show alternative methods when form submission fails', async () => {
      contactForm = new ContactForm({
        formSelector: '#contactForm',
        emailService: {
          provider: 'emailjs',
          serviceId: 'test',
          templateId: 'test',
          publicKey: 'test',
        },
      })

      await contactForm.init()

      // Mock email service to fail
      contactForm.emailServiceReady = true
      global.emailjs = {
        send: vi.fn().mockRejectedValue(new Error('Network error')),
      }

      // Fill form with valid data
      const form = document.querySelector('#contactForm')
      form.querySelector('[name="name"]').value = 'Test User'
      form.querySelector('[name="email"]').value = 'test@example.com'
      form.querySelector('[name="subject"]').value = 'Test Subject'
      form.querySelector('[name="message"]').value = 'Test message content'

      // Submit form
      await contactForm.handleSubmit()

      // Check if alternative methods are shown
      const alternativesSection = document.querySelector('.contact-alternatives')
      expect(alternativesSection).toBeTruthy()
      expect(alternativesSection.style.display).toBe('block')
    })

    it('should show user-friendly error message with guidance', async () => {
      contactForm = new ContactForm({
        formSelector: '#contactForm',
      })

      await contactForm.init()

      // Mock sendEmail to fail
      contactForm.sendEmail = vi.fn().mockResolvedValue({
        success: false,
        error: 'Service unavailable',
      })

      // Fill form
      const form = document.querySelector('#contactForm')
      form.querySelector('[name="name"]').value = 'Test User'
      form.querySelector('[name="email"]').value = 'test@example.com'
      form.querySelector('[name="subject"]').value = 'Test Subject'
      form.querySelector('[name="message"]').value = 'Test message content'

      // Submit form
      await contactForm.handleSubmit()

      // Check error message
      const errorElement = document.querySelector('.form-error')
      expect(errorElement).toBeTruthy()
      expect(errorElement.textContent).toContain('alternative contact method')
    })

    it('should not show alternative methods on successful submission', async () => {
      contactForm = new ContactForm({
        formSelector: '#contactForm',
      })

      await contactForm.init()

      // Mock successful email send
      contactForm.sendEmail = vi.fn().mockResolvedValue({
        success: true,
      })

      // Fill form
      const form = document.querySelector('#contactForm')
      form.querySelector('[name="name"]').value = 'Test User'
      form.querySelector('[name="email"]').value = 'test@example.com'
      form.querySelector('[name="subject"]').value = 'Test Subject'
      form.querySelector('[name="message"]').value = 'Test message content'

      // Submit form
      await contactForm.handleSubmit()

      // Alternative methods should not be shown
      const alternativesSection = document.querySelector('.contact-alternatives')
      expect(alternativesSection).toBeFalsy()
    })
  })

  describe('Analytics Tracking', () => {
    it('should track when alternative methods are shown', async () => {
      contactForm = new ContactForm({
        formSelector: '#contactForm',
      })

      await contactForm.init()

      // Mock trackContactEvent
      const trackSpy = vi.spyOn(contactForm, 'trackContactEvent')

      contactForm.showAlternativeContactMethods()

      expect(trackSpy).toHaveBeenCalledWith('alternative_methods_shown')
    })

    it('should track clicks on alternative contact methods', async () => {
      contactForm = new ContactForm({
        formSelector: '#contactForm',
        alternativeContacts: [
          {
            type: 'email',
            label: 'Email',
            value: 'test@example.com',
            icon: 'email',
            href: 'mailto:test@example.com',
          },
        ],
      })

      await contactForm.init()

      // Mock trackContactEvent
      const trackSpy = vi.spyOn(contactForm, 'trackContactEvent')

      contactForm.showAlternativeContactMethods()

      const contactMethod = document.querySelector('.contact-method')
      contactMethod.click()

      expect(trackSpy).toHaveBeenCalledWith('alternative_method_clicked', {
        method: 'email',
        label: 'Email',
      })
    })
  })

  describe('Icon Generation', () => {
    it('should create SVG icons for different contact types', async () => {
      contactForm = new ContactForm({
        formSelector: '#contactForm',
      })

      await contactForm.init()

      const iconTypes = ['email', 'linkedin', 'github', 'twitter']

      iconTypes.forEach((iconType) => {
        const icon = contactForm.createContactIcon(iconType)
        expect(icon.className).toBe('contact-method-icon')
        expect(icon.getAttribute('aria-hidden')).toBe('true')
        expect(icon.querySelector('svg')).toBeTruthy()
      })
    })

    it('should fallback to email icon for unknown types', async () => {
      contactForm = new ContactForm({
        formSelector: '#contactForm',
      })

      await contactForm.init()

      const icon = contactForm.createContactIcon('unknown')
      expect(icon.querySelector('svg')).toBeTruthy()
    })
  })

  describe('Reusability', () => {
    it('should reuse existing alternative methods section if already created', async () => {
      contactForm = new ContactForm({
        formSelector: '#contactForm',
      })

      await contactForm.init()

      // Show alternative methods twice
      contactForm.showAlternativeContactMethods()
      contactForm.showAlternativeContactMethods()

      // Should only have one section
      const sections = document.querySelectorAll('.contact-alternatives')
      expect(sections.length).toBe(1)
    })
  })
})

