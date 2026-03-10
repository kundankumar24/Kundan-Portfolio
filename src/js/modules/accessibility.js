/**
 * Accessibility Module
 * Implements WCAG 2.1 AA compliance features including:
 * - ARIA labels and descriptions
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Focus management
 */

class AccessibilityEngine {
  constructor() {
    this.focusableElements = [];
    this.currentFocusIndex = -1;
    this.announcer = null;
    this.init();
  }

  /**
   * Initialize accessibility features
   */
  init() {
    this.createScreenReaderAnnouncer();
    this.setupKeyboardNavigation();
    this.enhanceInteractiveElements();
    this.setupFocusManagement();
    this.addSkipLinks();
  }

  /**
   * Create a live region for screen reader announcements
   */
  createScreenReaderAnnouncer() {
    // Check if announcer already exists
    if (document.getElementById('sr-announcer')) {
      this.announcer = document.getElementById('sr-announcer');
      return;
    }

    this.announcer = document.createElement('div');
    this.announcer.id = 'sr-announcer';
    this.announcer.setAttribute('role', 'status');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only';
    document.body.appendChild(this.announcer);
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  announce(message, priority = 'polite') {
    if (!this.announcer) return;

    // Clear previous message
    this.announcer.textContent = '';
    this.announcer.setAttribute('aria-live', priority);

    // Set new message after a brief delay to ensure it's announced
    setTimeout(() => {
      this.announcer.textContent = message;
    }, 100);
  }

  /**
   * Setup keyboard navigation for the entire site
   */
  setupKeyboardNavigation() {
    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
      // Tab key navigation
      if (e.key === 'Tab') {
        this.handleTabNavigation(e);
      }

      // Escape key to close modals/overlays
      if (e.key === 'Escape') {
        this.handleEscapeKey(e);
      }

      // Arrow keys for custom navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.handleArrowNavigation(e);
      }

      // Enter and Space for button activation
      if (e.key === 'Enter' || e.key === ' ') {
        this.handleActivation(e);
      }
    });

    // Show focus indicators on keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    // Hide focus indicators on mouse click
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  /**
   * Handle Tab key navigation
   * @param {KeyboardEvent} e
   */
  handleTabNavigation(e) {
    const focusableElements = this.getFocusableElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Trap focus in modals if present
    const activeModal = document.querySelector('.modal.active, [role="dialog"][aria-hidden="false"]');
    if (activeModal) {
      const modalFocusable = Array.from(
        activeModal.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );

      if (modalFocusable.length === 0) return;

      const firstModalElement = modalFocusable[0];
      const lastModalElement = modalFocusable[modalFocusable.length - 1];

      if (e.shiftKey && document.activeElement === firstModalElement) {
        e.preventDefault();
        lastModalElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastModalElement) {
        e.preventDefault();
        firstModalElement.focus();
      }
    }
  }

  /**
   * Handle Escape key press
   * @param {KeyboardEvent} e
   */
  handleEscapeKey(e) {
    // Close mobile menu
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileNav && mobileNav.classList.contains('active')) {
      const closeButton = mobileNav.querySelector('.mobile-nav-close');
      if (closeButton) closeButton.click();
      return;
    }

    // Close modals
    const activeModal = document.querySelector('.modal.active, [role="dialog"][aria-hidden="false"]');
    if (activeModal) {
      const closeButton = activeModal.querySelector('[data-close], .modal-close, .close-button');
      if (closeButton) closeButton.click();
      return;
    }

    // Close lightbox
    const activeLightbox = document.querySelector('.lightbox.active');
    if (activeLightbox) {
      const closeButton = activeLightbox.querySelector('.lightbox-close');
      if (closeButton) closeButton.click();
    }
  }

  /**
   * Handle arrow key navigation
   * @param {KeyboardEvent} e
   */
  handleArrowNavigation(e) {
    const target = e.target;

    // Handle navigation in lists with role="listbox" or similar
    if (target.closest('[role="listbox"], [role="menu"], [role="tablist"]')) {
      e.preventDefault();
      const container = target.closest('[role="listbox"], [role="menu"], [role="tablist"]');
      const items = Array.from(container.querySelectorAll('[role="option"], [role="menuitem"], [role="tab"]'));
      const currentIndex = items.indexOf(target);

      let nextIndex;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % items.length;
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + items.length) % items.length;
      }

      if (nextIndex !== undefined && items[nextIndex]) {
        items[nextIndex].focus();
      }
    }
  }

  /**
   * Handle Enter/Space key activation
   * @param {KeyboardEvent} e
   */
  handleActivation(e) {
    const target = e.target;

    // Allow buttons and links to handle their own activation
    if (target.tagName === 'BUTTON' || target.tagName === 'A') {
      return;
    }

    // Handle custom interactive elements with role="button"
    if (target.getAttribute('role') === 'button' && e.key === ' ') {
      e.preventDefault();
      target.click();
    }
  }

  /**
   * Get all focusable elements on the page
   * @returns {Array<HTMLElement>}
   */
  getFocusableElements() {
    return Array.from(
      document.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => {
      // Filter out hidden elements
      return el.offsetParent !== null && !el.hasAttribute('hidden');
    });
  }

  /**
   * Enhance interactive elements with proper ARIA attributes
   */
  enhanceInteractiveElements() {
    // Enhance buttons without proper labels
    document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach((button) => {
      if (!button.textContent.trim() && !button.querySelector('.sr-only')) {
        console.warn('Button without accessible label:', button);
      }
    });

    // Enhance links without proper labels
    document.querySelectorAll('a:not([aria-label]):not([aria-labelledby])').forEach((link) => {
      if (!link.textContent.trim() && !link.querySelector('.sr-only')) {
        console.warn('Link without accessible label:', link);
      }
    });

    // Enhance images without alt text
    document.querySelectorAll('img:not([alt])').forEach((img) => {
      console.warn('Image without alt text:', img);
      img.setAttribute('alt', '');
    });

    // Add role="navigation" to nav elements without it
    document.querySelectorAll('nav:not([role])').forEach((nav) => {
      nav.setAttribute('role', 'navigation');
    });

    // Enhance form inputs with proper associations
    document.querySelectorAll('input, textarea, select').forEach((input) => {
      if (!input.hasAttribute('aria-label') && !input.hasAttribute('aria-labelledby') && !input.id) {
        const label = input.closest('label') || document.querySelector(`label[for="${input.id}"]`);
        if (!label) {
          console.warn('Form input without associated label:', input);
        }
      }
    });
  }

  /**
   * Setup focus management
   */
  setupFocusManagement() {
    // Add visible focus indicators for keyboard navigation
    const style = document.createElement('style');
    style.textContent = `
      /* Enhanced focus indicators for keyboard navigation */
      body.keyboard-navigation *:focus {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
        border-radius: var(--radius-sm);
      }

      body.keyboard-navigation a:focus,
      body.keyboard-navigation button:focus {
        outline: 3px solid var(--color-primary);
        outline-offset: 3px;
      }

      /* Skip to main content link */
      .skip-link:focus {
        position: fixed;
        top: 10px;
        left: 10px;
        z-index: 9999;
        padding: var(--space-3) var(--space-4);
        background: var(--bg-card);
        color: var(--text-primary);
        border: 2px solid var(--color-primary);
        border-radius: var(--radius-md);
        text-decoration: none;
        font-weight: var(--font-weight-semibold);
        box-shadow: var(--shadow-xl);
      }
    `;
    document.head.appendChild(style);

    // Manage focus on route changes (for SPA behavior)
    this.setupRouteChangeFocus();
  }

  /**
   * Setup focus management for route changes
   */
  setupRouteChangeFocus() {
    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', () => {
      this.focusMainContent();
    });

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      const target = document.querySelector(window.location.hash);
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();
        this.announce(`Navigated to ${target.textContent || 'section'}`);
      }
    });
  }

  /**
   * Focus the main content area
   */
  focusMainContent() {
    const main = document.querySelector('main, [role="main"]');
    if (main) {
      main.setAttribute('tabindex', '-1');
      main.focus();
      main.removeAttribute('tabindex');
    }
  }

  /**
   * Add skip links for keyboard navigation
   */
  addSkipLinks() {
    // Check if skip link already exists
    if (document.querySelector('.skip-link')) {
      return;
    }

    const skipLink = document.createElement('a');
    skipLink.href = '#main';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.focusMainContent();
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  /**
   * Add ARIA label to an element
   * @param {HTMLElement} element
   * @param {string} label
   */
  addAriaLabel(element, label) {
    if (!element) return;
    element.setAttribute('aria-label', label);
  }

  /**
   * Add ARIA description to an element
   * @param {HTMLElement} element
   * @param {string} description
   */
  addAriaDescription(element, description) {
    if (!element) return;
    
    // Create a hidden description element
    const descId = `desc-${Math.random().toString(36).substr(2, 9)}`;
    const descElement = document.createElement('span');
    descElement.id = descId;
    descElement.className = 'sr-only';
    descElement.textContent = description;
    
    element.appendChild(descElement);
    element.setAttribute('aria-describedby', descId);
  }

  /**
   * Set ARIA expanded state
   * @param {HTMLElement} element
   * @param {boolean} expanded
   */
  setAriaExpanded(element, expanded) {
    if (!element) return;
    element.setAttribute('aria-expanded', expanded.toString());
  }

  /**
   * Set ARIA hidden state
   * @param {HTMLElement} element
   * @param {boolean} hidden
   */
  setAriaHidden(element, hidden) {
    if (!element) return;
    element.setAttribute('aria-hidden', hidden.toString());
  }

  /**
   * Make an element focusable
   * @param {HTMLElement} element
   */
  makeFocusable(element) {
    if (!element) return;
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }
  }

  /**
   * Remove element from tab order
   * @param {HTMLElement} element
   */
  makeUnfocusable(element) {
    if (!element) return;
    element.setAttribute('tabindex', '-1');
  }

  /**
   * Trap focus within a container (useful for modals)
   * @param {HTMLElement} container
   */
  trapFocus(container) {
    if (!container) return;

    const focusableElements = Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement.focus();

    // Store the handler so we can remove it later
    const handler = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    container.addEventListener('keydown', handler);
    container._focusTrapHandler = handler;
  }

  /**
   * Release focus trap from a container
   * @param {HTMLElement} container
   */
  releaseFocusTrap(container) {
    if (!container || !container._focusTrapHandler) return;
    container.removeEventListener('keydown', container._focusTrapHandler);
    delete container._focusTrapHandler;
  }
}

// Create and export singleton instance
const accessibilityEngine = new AccessibilityEngine();

export default accessibilityEngine;
