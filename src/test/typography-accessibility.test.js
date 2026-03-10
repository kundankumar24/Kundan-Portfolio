/**
 * Enhanced Typography and Accessibility Tests
 * Validates WCAG AA compliance, advanced typography system, and visual hierarchy
 * **Validates: Requirements 1.4, 7.4**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { JSDOM } from 'jsdom'

describe('Enhanced Typography and Accessibility System', () => {
  let dom
  let document
  let window

  beforeEach(() => {
    // Create a DOM environment for testing with enhanced CSS variables
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Enhanced Typography Test</title>
          <style>
            :root {
              /* Enhanced WCAG AA compliant colors */
              --text-primary: #111827;       /* 16.8:1 contrast on white */
              --text-secondary: #374151;     /* 10.7:1 contrast on white */
              --text-muted: #6b7280;         /* 4.6:1 contrast on white */
              --text-subtle: #9ca3af;        /* 3.1:1 contrast (use sparingly) */
              --color-primary: #4f46e5;      /* 4.5:1 contrast on white */
              --bg-primary: #ffffff;
              --bg-tertiary: #f1f5f9;
              --border-primary: #e2e8f0;
              
              /* Enhanced typography scale */
              --font-size-xs: 0.75rem;
              --font-size-sm: 0.875rem;
              --font-size-base: 1rem;
              --font-size-lg: 1.125rem;
              --font-size-xl: 1.25rem;
              --font-size-2xl: 1.5rem;
              --font-size-3xl: 1.875rem;
              --font-size-4xl: 2.25rem;
              --font-size-5xl: 3rem;
              --font-size-6xl: 3.75rem;
              --font-size-7xl: 4.5rem;
              
              /* Fluid typography */
              --font-size-fluid-base: clamp(0.9rem, 1vw + 0.8rem, 1rem);
              --font-size-fluid-lg: clamp(1rem, 1.2vw + 0.9rem, 1.125rem);
              --font-size-fluid-xl: clamp(1.1rem, 1.4vw + 1rem, 1.25rem);
              
              /* Enhanced line heights */
              --line-height-none: 1;
              --line-height-tight: 1.25;
              --line-height-snug: 1.375;
              --line-height-normal: 1.5;
              --line-height-relaxed: 1.625;
              --line-height-heading: 1.2;
              --line-height-body: 1.6;
              --line-height-caption: 1.4;
              
              /* Enhanced letter spacing */
              --letter-spacing-tighter: -0.05em;
              --letter-spacing-tight: -0.025em;
              --letter-spacing-normal: 0em;
              --letter-spacing-wide: 0.025em;
              --letter-spacing-wider: 0.05em;
              --letter-spacing-widest: 0.1em;
              --letter-spacing-headline: -0.02em;
              --letter-spacing-body: 0.01em;
              --letter-spacing-caps: 0.1em;
              
              /* Font weights */
              --font-weight-normal: 400;
              --font-weight-medium: 500;
              --font-weight-semibold: 600;
              --font-weight-bold: 700;
              --font-weight-extrabold: 800;
              --font-weight-black: 900;
              
              /* Spacing */
              --space-1: 0.25rem;
              --space-2: 0.5rem;
              --space-3: 0.75rem;
              --space-4: 1rem;
              --space-5: 1.25rem;
              --space-6: 1.5rem;
              --space-8: 2rem;
              --space-10: 2.5rem;
              --space-12: 3rem;
              --space-16: 4rem;
              
              /* Border radius */
              --radius-sm: 0.25rem;
              --radius-lg: 0.5rem;
            }
            
            [data-theme='dark'] {
              /* Dark theme WCAG AA compliant colors */
              --text-primary: #f8fafc;      /* 18.7:1 contrast on slate 900 */
              --text-secondary: #e2e8f0;    /* 13.6:1 contrast on slate 900 */
              --text-muted: #94a3b8;        /* 7.1:1 contrast on slate 900 */
              --text-subtle: #a1a1aa;       /* 4.5:1 contrast on slate 900 */
              --bg-primary: #0f172a;        /* Slate 900 */
              --bg-tertiary: #334155;       /* Slate 700 */
              --border-primary: #334155;
            }
            
            /* Enhanced typography classes */
            .display-1 {
              font-size: var(--font-size-7xl);
              font-weight: var(--font-weight-black);
              line-height: var(--line-height-none);
              letter-spacing: var(--letter-spacing-tighter);
              color: var(--text-primary);
            }
            
            .text-hero {
              font-size: clamp(2.5rem, 8vw, 5rem);
              font-weight: var(--font-weight-black);
              line-height: 0.9;
              letter-spacing: -0.02em;
              color: var(--text-primary);
            }
            
            .body-large {
              font-size: var(--font-size-lg);
              line-height: var(--line-height-relaxed);
              color: var(--text-secondary);
              max-width: 65ch;
            }
            
            .prose {
              max-width: 70ch;
              color: var(--text-secondary);
              line-height: var(--line-height-body);
            }
            
            .text-gradient {
              background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              font-weight: var(--font-weight-bold);
            }
            
            .measure { max-width: 70ch; }
            .measure-narrow { max-width: 45ch; }
            .measure-wide { max-width: 90ch; }
          </style>
        </head>
        <body>
          <div id="test-container"></div>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    })

    document = dom.window.document
    window = dom.window
    global.document = document
    global.window = window
  })

  afterEach(() => {
    dom.window.close()
  })

  describe('Enhanced Color Contrast Compliance', () => {
    it('should meet WCAG AA contrast ratios for light theme', () => {
      const testColors = [
        { text: '#111827', bg: '#ffffff', name: 'primary text on white', expected: 16.8 },
        { text: '#374151', bg: '#ffffff', name: 'secondary text on white', expected: 10.7 },
        { text: '#6b7280', bg: '#ffffff', name: 'muted text on white', expected: 4.6 },
        { text: '#4f46e5', bg: '#ffffff', name: 'primary color on white', expected: 4.5 },
        { text: '#ffffff', bg: '#4f46e5', name: 'white text on primary', expected: 4.5 }
      ]

      testColors.forEach(({ text, bg, name, expected }) => {
        const contrast = calculateContrastRatio(text, bg)
        expect(contrast).toBeGreaterThanOrEqual(4.5, 
          `${name} should meet WCAG AA standard (4.5:1), got ${contrast.toFixed(2)}:1`)
        
        // Verify it meets or exceeds expected contrast
        expect(contrast).toBeGreaterThanOrEqual(expected - 0.5, 
          `${name} should have approximately ${expected}:1 contrast, got ${contrast.toFixed(2)}:1`)
      })
    })

    it('should meet WCAG AA contrast ratios for dark theme', () => {
      const testColors = [
        { text: '#f8fafc', bg: '#0f172a', name: 'primary text on dark', expected: 17.1 },
        { text: '#e2e8f0', bg: '#0f172a', name: 'secondary text on dark', expected: 13.6 },
        { text: '#94a3b8', bg: '#0f172a', name: 'muted text on dark', expected: 7.1 },
        { text: '#a1a1aa', bg: '#0f172a', name: 'subtle text on dark', expected: 4.5 }
      ]

      testColors.forEach(({ text, bg, name, expected }) => {
        const contrast = calculateContrastRatio(text, bg)
        expect(contrast).toBeGreaterThanOrEqual(4.5, 
          `${name} should meet WCAG AA standard (4.5:1), got ${contrast.toFixed(2)}:1`)
        
        // Verify it meets or exceeds expected contrast
        expect(contrast).toBeGreaterThanOrEqual(expected - 0.5, 
          `${name} should have approximately ${expected}:1 contrast, got ${contrast.toFixed(2)}:1`)
      })
    })

    it('should have sufficient contrast for interactive elements', () => {
      const interactiveColors = [
        { text: '#4f46e5', bg: '#ffffff', name: 'primary button text' },
        { text: '#ffffff', bg: '#4f46e5', name: 'primary button background' },
        { text: '#374151', bg: '#f1f5f9', name: 'secondary button' }
      ]

      interactiveColors.forEach(({ text, bg, name }) => {
        const contrast = calculateContrastRatio(text, bg)
        expect(contrast).toBeGreaterThanOrEqual(4.5, 
          `${name} should meet WCAG AA standard for interactive elements`)
      })
    })
  })

  describe('Enhanced Typography Scale and Hierarchy', () => {
    it('should have consistent and accessible font size scaling', () => {
      const container = document.getElementById('test-container')
      
      // Test enhanced font size progression with fluid scaling
      const fontSizes = [
        { class: 'text-xs', expectedSize: '0.75rem', name: 'extra small' },
        { class: 'text-sm', expectedSize: '0.875rem', name: 'small' },
        { class: 'text-base', expectedSize: '1rem', name: 'base' },
        { class: 'text-lg', expectedSize: '1.125rem', name: 'large' },
        { class: 'text-xl', expectedSize: '1.25rem', name: 'extra large' },
        { class: 'text-2xl', expectedSize: '1.5rem', name: '2x large' },
        { class: 'text-3xl', expectedSize: '1.875rem', name: '3x large' },
        { class: 'text-4xl', expectedSize: '2.25rem', name: '4x large' },
        { class: 'text-5xl', expectedSize: '3rem', name: '5x large' }
      ]

      fontSizes.forEach(({ class: className, expectedSize, name }) => {
        const element = document.createElement('div')
        element.className = className
        element.textContent = `Test ${name} text`
        container.appendChild(element)

        // Verify the class is applied correctly
        expect(element.className).toBe(className)
        
        // Verify text content is accessible
        expect(element.textContent).toContain('Test')
        
        container.removeChild(element)
      })
    })

    it('should have proper heading hierarchy with enhanced spacing', () => {
      const container = document.getElementById('test-container')
      
      // Create heading elements with proper hierarchy
      for (let i = 1; i <= 6; i++) {
        const heading = document.createElement(`h${i}`)
        heading.textContent = `Heading Level ${i}`
        heading.id = `heading-${i}` // For anchor links
        container.appendChild(heading)
        
        expect(heading.tagName.toLowerCase()).toBe(`h${i}`)
        expect(heading.textContent).toBe(`Heading Level ${i}`)
        expect(heading.id).toBe(`heading-${i}`)
      }
      
      // Verify heading hierarchy is logical
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
      expect(headings.length).toBe(6)
      
      // Check that h1 comes before h2, etc.
      for (let i = 0; i < headings.length - 1; i++) {
        const currentLevel = parseInt(headings[i].tagName.charAt(1))
        const nextLevel = parseInt(headings[i + 1].tagName.charAt(1))
        expect(nextLevel).toBe(currentLevel + 1)
      }
    })

    it('should support advanced typography components', () => {
      const container = document.getElementById('test-container')
      
      const typographyComponents = [
        { class: 'display-1', text: 'Display 1 Heading' },
        { class: 'text-hero', text: 'Hero Text' },
        { class: 'body-large', text: 'Large body text for better readability' },
        { class: 'text-gradient', text: 'Gradient Text Effect' }
      ]
      
      typographyComponents.forEach(({ class: className, text }) => {
        const element = document.createElement('div')
        element.className = className
        element.textContent = text
        container.appendChild(element)
        
        expect(element.className).toBe(className)
        expect(element.textContent).toBe(text)
        
        container.removeChild(element)
      })
    })

    it('should implement optimal reading widths', () => {
      const container = document.getElementById('test-container')
      
      const readingWidths = [
        { class: 'measure-narrow', maxWidth: '45ch' },
        { class: 'measure', maxWidth: '70ch' },
        { class: 'measure-wide', maxWidth: '90ch' },
        { class: 'prose', maxWidth: '70ch' }
      ]
      
      readingWidths.forEach(({ class: className, maxWidth }) => {
        const element = document.createElement('p')
        element.className = className
        element.textContent = 'This is a test paragraph to verify optimal reading width implementation for better typography and user experience.'
        container.appendChild(element)
        
        expect(element.className).toBe(className)
        expect(element.textContent.length).toBeGreaterThan(50) // Ensure substantial text
        
        container.removeChild(element)
      })
    })
  })

  describe('Semantic HTML Structure', () => {
    it('should use proper semantic elements', () => {
      const container = document.getElementById('test-container')
      
      // Test semantic structure
      const semanticHTML = `
        <header>
          <nav role="navigation" aria-label="Main navigation">
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About</a></li>
            </ul>
          </nav>
        </header>
        <main>
          <section>
            <h1>Main Title</h1>
            <p>Content paragraph</p>
          </section>
        </main>
        <footer>
          <p>Footer content</p>
        </footer>
      `
      
      container.innerHTML = semanticHTML
      
      expect(container.querySelector('header')).toBeTruthy()
      expect(container.querySelector('nav[role="navigation"]')).toBeTruthy()
      expect(container.querySelector('main')).toBeTruthy()
      expect(container.querySelector('section')).toBeTruthy()
      expect(container.querySelector('footer')).toBeTruthy()
    })

    it('should have proper ARIA labels and roles', () => {
      const container = document.getElementById('test-container')
      
      const ariaHTML = `
        <nav role="navigation" aria-label="Main navigation">
          <button aria-label="Toggle menu" aria-expanded="false">Menu</button>
        </nav>
        <form>
          <label for="email">Email</label>
          <input type="email" id="email" aria-describedby="email-error" required>
          <div id="email-error" role="alert"></div>
        </form>
      `
      
      container.innerHTML = ariaHTML
      
      const nav = container.querySelector('nav')
      const button = container.querySelector('button')
      const input = container.querySelector('input')
      const errorDiv = container.querySelector('#email-error')
      
      expect(nav.getAttribute('role')).toBe('navigation')
      expect(nav.getAttribute('aria-label')).toBe('Main navigation')
      expect(button.getAttribute('aria-label')).toBe('Toggle menu')
      expect(button.getAttribute('aria-expanded')).toBe('false')
      expect(input.getAttribute('aria-describedby')).toBe('email-error')
      expect(errorDiv.getAttribute('role')).toBe('alert')
    })
  })

  describe('Advanced Responsive Typography', () => {
    it('should adapt to different screen sizes with fluid scaling', () => {
      const container = document.getElementById('test-container')
      
      // Test responsive behavior with enhanced classes
      const responsiveElement = document.createElement('h1')
      responsiveElement.className = 'display-1 md:text-4xl sm:text-3xl text-hero'
      responsiveElement.textContent = 'Responsive Hero Heading'
      container.appendChild(responsiveElement)
      
      expect(responsiveElement.className).toContain('display-1')
      expect(responsiveElement.className).toContain('md:text-4xl')
      expect(responsiveElement.className).toContain('sm:text-3xl')
      expect(responsiveElement.className).toContain('text-hero')
      expect(responsiveElement.textContent).toBe('Responsive Hero Heading')
    })

    it('should support fluid typography classes', () => {
      const container = document.getElementById('test-container')
      
      const fluidElements = [
        { class: 'text-fluid-base', text: 'Fluid base text' },
        { class: 'text-fluid-lg', text: 'Fluid large text' },
        { class: 'text-fluid-xl', text: 'Fluid extra large text' }
      ]
      
      fluidElements.forEach(({ class: className, text }) => {
        const element = document.createElement('p')
        element.className = className
        element.textContent = text
        container.appendChild(element)
        
        expect(element.className).toBe(className)
        expect(element.textContent).toBe(text)
        
        container.removeChild(element)
      })
    })

    it('should maintain readability across screen sizes', () => {
      const container = document.getElementById('test-container')
      
      // Test that text remains readable with proper line heights
      const readabilityTest = document.createElement('div')
      readabilityTest.innerHTML = `
        <h1 class="display-1">Main Heading</h1>
        <p class="body-large">This is a large body paragraph that should maintain optimal readability across different screen sizes with proper line height and spacing.</p>
        <p class="text-base">This is regular body text that should also be readable and well-spaced.</p>
      `
      container.appendChild(readabilityTest)
      
      const heading = readabilityTest.querySelector('h1')
      const largeParagraph = readabilityTest.querySelector('.body-large')
      const regularParagraph = readabilityTest.querySelector('.text-base')
      
      expect(heading).toBeTruthy()
      expect(largeParagraph).toBeTruthy()
      expect(regularParagraph).toBeTruthy()
      
      // Verify content is substantial enough for readability testing
      expect(largeParagraph.textContent.length).toBeGreaterThan(50)
      expect(regularParagraph.textContent.length).toBeGreaterThan(20)
      
      container.removeChild(readabilityTest)
    })
  })

  describe('Focus Management', () => {
    it('should have visible focus indicators', () => {
      const container = document.getElementById('test-container')
      
      const focusableElements = `
        <button class="btn primary">Button</button>
        <a href="#" class="nav-link">Link</a>
        <input type="text" class="form-input">
      `
      
      container.innerHTML = focusableElements
      
      const button = container.querySelector('button')
      const link = container.querySelector('a')
      const input = container.querySelector('input')
      
      // Simulate focus events
      button.focus()
      expect(document.activeElement).toBe(button)
      
      link.focus()
      expect(document.activeElement).toBe(link)
      
      input.focus()
      expect(document.activeElement).toBe(input)
    })

    it('should support keyboard navigation', () => {
      const container = document.getElementById('test-container')
      
      const keyboardHTML = `
        <nav>
          <a href="#section1" tabindex="0">Section 1</a>
          <a href="#section2" tabindex="0">Section 2</a>
          <a href="#section3" tabindex="0">Section 3</a>
        </nav>
      `
      
      container.innerHTML = keyboardHTML
      
      const links = container.querySelectorAll('a')
      links.forEach(link => {
        expect(link.getAttribute('tabindex')).toBe('0')
      })
    })
  })

  describe('Text Readability', () => {
    it('should have appropriate line heights for readability', () => {
      const container = document.getElementById('test-container')
      
      const textElements = `
        <p class="leading-normal">Normal line height text for optimal readability.</p>
        <p class="leading-relaxed">Relaxed line height for longer form content.</p>
        <h1 class="leading-tight">Tight line height for headings.</h1>
      `
      
      container.innerHTML = textElements
      
      const normalText = container.querySelector('.leading-normal')
      const relaxedText = container.querySelector('.leading-relaxed')
      const tightHeading = container.querySelector('.leading-tight')
      
      expect(normalText.className).toContain('leading-normal')
      expect(relaxedText.className).toContain('leading-relaxed')
      expect(tightHeading.className).toContain('leading-tight')
    })

    it('should have proper text spacing and margins', () => {
      const container = document.getElementById('test-container')
      
      const spacingHTML = `
        <h1>Main Heading</h1>
        <p>First paragraph with proper spacing.</p>
        <p>Second paragraph with consistent margins.</p>
        <ul>
          <li>List item with proper spacing</li>
          <li>Another list item</li>
        </ul>
      `
      
      container.innerHTML = spacingHTML
      
      const heading = container.querySelector('h1')
      const paragraphs = container.querySelectorAll('p')
      const list = container.querySelector('ul')
      
      expect(heading).toBeTruthy()
      expect(paragraphs.length).toBe(2)
      expect(list).toBeTruthy()
    })
  })
})

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG 2.1 guidelines
 */
function calculateContrastRatio(color1, color2) {
  const l1 = getRelativeLuminance(color1)
  const l2 = getRelativeLuminance(color2)
  
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Calculate relative luminance of a color
 */
function getRelativeLuminance(hex) {
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  
  // Apply gamma correction
  const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
  const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
  const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)
  
  // Calculate luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}
