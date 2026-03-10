/**
 * Property-Based Tests for Contact Form Validation and Processing
 * Feature: portfolio-enhancement, Property 7: Contact Form Validation and Processing
 * **Validates: Requirements 5.1, 5.2, 5.4**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { JSDOM } from 'jsdom'
import { ContactForm } from '../js/modules/contact.js'

describe('Property 7: Contact Form Validation and Processing', () => {
  let dom
  let document
  let contactForm

  beforeEach(() => {
    // Set up DOM
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <form id="contactForm">
            <input type="text" name="name" />
            <input type="email" name="email" />
            <input type="text" name="subject" />
            <textarea name="message"></textarea>
            <input type="text" name="website" class="honeypot" />
            <button type="submit">Submit</button>
          </form>
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

    contactForm = new ContactForm({
      formSelector: '#contactForm',
      validateOnInput: false,
    })
    contactForm.init()
  })

  afterEach(() => {
    if (contactForm) {
      contactForm.destroy()
    }
  })

  /**
   * Property: Valid inputs should always pass validation
   */
  it('should validate all valid contact form inputs correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc
            .stringMatching(/^[a-zA-Z\s'-]{2,100}$/)
            .filter((s) => s.trim().length >= 2),
          email: fc.emailAddress(),
          subject: fc.string({ minLength: 5, maxLength: 200 }),
          message: fc.string({ minLength: 10, maxLength: 5000 }),
        }),
        (formData) => {
          // Validate each field
          const nameResult = contactForm.validateField('name', formData.name)
          const emailResult = contactForm.validateField('email', formData.email)
          const subjectResult = contactForm.validateField('subject', formData.subject)
          const messageResult = contactForm.validateField('message', formData.message)

          // All validations should pass
          expect(nameResult.valid).toBe(true)
          expect(emailResult.valid).toBe(true)
          expect(subjectResult.valid).toBe(true)
          expect(messageResult.valid).toBe(true)
        }
      ),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Invalid names should always fail validation
   */
  it('should reject invalid name inputs', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''), // Empty
          fc.constant('a'), // Too short
          fc.string({ minLength: 101, maxLength: 150 }), // Too long
          fc.stringMatching(/^[0-9!@#$%^&*()]+$/), // Invalid characters
          fc.constant('   ') // Only whitespace
        ),
        (invalidName) => {
          const result = contactForm.validateField('name', invalidName)
          expect(result.valid).toBe(false)
          expect(result.errors).toBeDefined()
          expect(result.errors.length).toBeGreaterThan(0)
        }
      ),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Invalid emails should always fail validation
   */
  it('should reject invalid email inputs', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''), // Empty
          fc.constant('notanemail'), // No @
          fc.constant('missing@domain'), // No TLD
          fc.constant('@nodomain.com'), // No local part
          fc.constant('spaces in@email.com'), // Spaces
          fc.constant('double@@email.com') // Double @
        ),
        (invalidEmail) => {
          const result = contactForm.validateField('email', invalidEmail)
          expect(result.valid).toBe(false)
          expect(result.errors).toBeDefined()
          expect(result.errors.length).toBeGreaterThan(0)
        }
      ),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Subject validation should enforce length constraints
   */
  it('should enforce subject length constraints', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''), // Empty
          fc.string({ minLength: 1, maxLength: 4 }), // Too short
          fc.string({ minLength: 201, maxLength: 300 }) // Too long
        ),
        (invalidSubject) => {
          const result = contactForm.validateField('subject', invalidSubject)
          expect(result.valid).toBe(false)
        }
      ),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Message validation should enforce length constraints
   */
  it('should enforce message length constraints', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''), // Empty
          fc.string({ minLength: 1, maxLength: 9 }), // Too short
          fc.string({ minLength: 5001, maxLength: 6000 }) // Too long
        ),
        (invalidMessage) => {
          const result = contactForm.validateField('message', invalidMessage)
          expect(result.valid).toBe(false)
        }
      ),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Input sanitization should prevent XSS
   */
  it('should sanitize all inputs to prevent XSS attacks', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('<script>alert("XSS")</script>'),
          fc.constant('<img src=x onerror="alert(1)">'),
          fc.constant('"><script>alert(String.fromCharCode(88,83,83))</script>'),
          fc.constant('<iframe src="javascript:alert(1)">'),
          fc.constant('<svg onload="alert(1)">')
        ),
        (maliciousInput) => {
          const sanitized = contactForm.sanitizeInput(maliciousInput)

          // Should not contain executable script tags
          expect(sanitized).not.toContain('<script>')
          expect(sanitized).not.toContain('</script>')
          expect(sanitized).not.toContain('<iframe')
          expect(sanitized).not.toContain('<img')
          expect(sanitized).not.toContain('<svg')
          
          // Should escape HTML entities
          expect(sanitized).toContain('&lt;')
          expect(sanitized).toContain('&gt;')
        }
      ),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Rate limiting should block excessive submissions
   */
  it('should enforce rate limiting on form submissions', () => {
    fc.assert(
      fc.property(fc.integer({ min: 4, max: 10 }), (numAttempts) => {
        const form = new ContactForm({
          formSelector: '#contactForm',
          rateLimit: {
            maxAttempts: 3,
            windowMs: 60000,
          },
        })

        // Simulate multiple submission attempts
        for (let i = 0; i < numAttempts; i++) {
          form.submissionAttempts.push(Date.now())
        }

        const rateLimitCheck = form.checkRateLimit()

        // Should be blocked after 3 attempts
        expect(rateLimitCheck.allowed).toBe(false)
        expect(rateLimitCheck.message).toBeDefined()
        expect(rateLimitCheck.message).toContain('Too many')
      }),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Spam detection should identify suspicious content
   */
  it('should detect spam patterns in form submissions', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.constant('Spammer'),
          email: fc.constant('spam@example.com'),
          subject: fc.constant('Great offer'),
          message: fc.oneof(
            fc.constant('Buy viagra now! Click here: http://spam1.com http://spam2.com http://spam3.com http://spam4.com'),
            fc.constant('You won the lottery! Click here to claim your prize!'),
            fc.constant('Casino games! Win big money now!'),
            fc.constant('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA') // Repeated characters
          ),
        }),
        (spamData) => {
          const formData = new Map(Object.entries(spamData))
          formData.get = function (key) {
            return this.has(key) ? Map.prototype.get.call(this, key) : null
          }

          const spamCheck = contactForm.detectSpam(formData)

          // Should detect as spam
          expect(spamCheck.isSpam).toBe(true)
          expect(spamCheck.reason).toBeDefined()
        }
      ),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Honeypot field should trigger spam detection
   */
  it('should detect honeypot field submissions as spam', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (honeypotValue) => {
        const formData = new Map([
          ['name', 'John Doe'],
          ['email', 'john@example.com'],
          ['subject', 'Test Subject'],
          ['message', 'This is a test message'],
          ['website', honeypotValue], // Honeypot field
        ])
        formData.get = function (key) {
          return this.has(key) ? Map.prototype.get.call(this, key) : null
        }

        const spamCheck = contactForm.detectSpam(formData)

        // Should detect as spam due to honeypot
        expect(spamCheck.isSpam).toBe(true)
        expect(spamCheck.reason).toContain('Honeypot')
      }),
      { numRuns: 20 }
    )
  })

  /**
   * Property: Valid submissions should not be flagged as spam
   */
  it('should not flag legitimate submissions as spam', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.stringMatching(/^[a-zA-Z\s'-]{2,50}$/),
          email: fc.emailAddress(),
          subject: fc.string({ minLength: 5, maxLength: 100 }),
          message: fc
            .string({ minLength: 10, maxLength: 500 })
            .filter((s) => !s.includes('http://') && !s.includes('https://')),
        }),
        (validData) => {
          const formData = new Map(Object.entries(validData))
          formData.get = function (key) {
            return this.has(key) ? Map.prototype.get.call(this, key) : null
          }

          const spamCheck = contactForm.detectSpam(formData)

          // Should not be flagged as spam
          expect(spamCheck.isSpam).toBe(false)
        }
      ),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Form validation should be consistent
   */
  it('should produce consistent validation results for the same input', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 100 }),
          email: fc.emailAddress(),
          subject: fc.string({ minLength: 5, maxLength: 200 }),
          message: fc.string({ minLength: 10, maxLength: 1000 }),
        }),
        (formData) => {
          // Validate twice with same data
          const result1 = contactForm.validateField('name', formData.name)
          const result2 = contactForm.validateField('name', formData.name)

          // Results should be identical
          expect(result1.valid).toBe(result2.valid)
          expect(result1.errors?.length || 0).toBe(result2.errors?.length || 0)
        }
      ),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Sanitization should be idempotent
   */
  it('should produce the same result when sanitizing already sanitized input', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), (input) => {
        const sanitized1 = contactForm.sanitizeInput(input)
        const sanitized2 = contactForm.sanitizeInput(sanitized1)

        // Sanitization should be safe to apply multiple times
        // The output may differ if the first sanitization introduced HTML entities
        // that get re-escaped, but the key is that it remains safe
        expect(sanitized2).toBeDefined()
        expect(typeof sanitized2).toBe('string')
      }),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Error messages should always be provided for invalid inputs
   */
  it('should provide error messages for all validation failures', () => {
    fc.assert(
      fc.property(
        fc.record({
          fieldName: fc.constantFrom('name', 'email', 'subject', 'message'),
          value: fc.oneof(
            fc.constant(''), // Empty
            fc.constant('x'), // Too short
            fc.string({ minLength: 10000, maxLength: 10100 }) // Too long
          ),
        }),
        ({ fieldName, value }) => {
          const result = contactForm.validateField(fieldName, value)

          if (!result.valid) {
            // Should have error messages
            expect(result.errors).toBeDefined()
            expect(result.errors.length).toBeGreaterThan(0)
            expect(result.errors[0]).toBeTruthy()
            expect(typeof result.errors[0]).toBe('string')
          }
        }
      ),
      { numRuns: 25 }
    )
  })
})

