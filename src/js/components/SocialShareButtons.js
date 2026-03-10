/**
 * Social Share Buttons Component
 * Renders sharing buttons for different platforms
 */

export class SocialShareButtons {
  constructor(socialSharing, options = {}) {
    this.socialSharing = socialSharing
    this.options = {
      platforms: ['linkedin', 'twitter', 'facebook', 'email', 'copy'],
      showLabels: true,
      showCount: false,
      size: 'medium', // small, medium, large
      layout: 'horizontal', // horizontal, vertical
      ...options,
    }

    this.platformConfig = {
      linkedin: {
        name: 'LinkedIn',
        icon: this.getLinkedInIcon(),
        color: '#0077b5',
        label: 'Share on LinkedIn',
      },
      twitter: {
        name: 'Twitter',
        icon: this.getTwitterIcon(),
        color: '#1da1f2',
        label: 'Share on Twitter',
      },
      facebook: {
        name: 'Facebook',
        icon: this.getFacebookIcon(),
        color: '#1877f2',
        label: 'Share on Facebook',
      },
      email: {
        name: 'Email',
        icon: this.getEmailIcon(),
        color: '#666',
        label: 'Share via Email',
      },
      copy: {
        name: 'Copy Link',
        icon: this.getCopyIcon(),
        color: '#666',
        label: 'Copy Link',
      },
      native: {
        name: 'Share',
        icon: this.getShareIcon(),
        color: '#666',
        label: 'Share',
      },
    }
  }

  /**
   * Create share buttons for content
   */
  create(content, options = {}) {
    const mergedOptions = { ...this.options, ...options }
    const platforms = mergedOptions.platforms || this.socialSharing.getAvailablePlatforms()

    const container = document.createElement('div')
    container.className = `social-share-buttons social-share-buttons--${mergedOptions.layout} social-share-buttons--${mergedOptions.size}`
    container.setAttribute('role', 'group')
    container.setAttribute('aria-label', 'Share buttons')

    // Add title if provided
    if (mergedOptions.title) {
      const title = document.createElement('span')
      title.className = 'social-share-title'
      title.textContent = mergedOptions.title
      container.appendChild(title)
    }

    // Create button group
    const buttonGroup = document.createElement('div')
    buttonGroup.className = 'social-share-button-group'

    platforms.forEach((platform) => {
      const button = this.createButton(platform, content, mergedOptions)
      if (button) {
        buttonGroup.appendChild(button)
      }
    })

    container.appendChild(buttonGroup)

    return container
  }

  /**
   * Create a single share button
   */
  createButton(platform, content, options) {
    const config = this.platformConfig[platform]
    if (!config) {
      return null
    }

    const button = document.createElement('button')
    button.className = `social-share-button social-share-button--${platform}`
    button.setAttribute('type', 'button')
    button.setAttribute('aria-label', config.label)
    button.setAttribute('title', config.label)
    button.style.setProperty('--platform-color', config.color)

    // Add icon
    const iconWrapper = document.createElement('span')
    iconWrapper.className = 'social-share-icon'
    iconWrapper.innerHTML = config.icon
    button.appendChild(iconWrapper)

    // Add label if enabled
    if (options.showLabels) {
      const label = document.createElement('span')
      label.className = 'social-share-label'
      label.textContent = config.name
      button.appendChild(label)
    }

    // Add click handler
    button.addEventListener('click', async (e) => {
      e.preventDefault()
      await this.handleShare(platform, content, button)
    })

    return button
  }

  /**
   * Handle share button click
   */
  async handleShare(platform, content, button) {
    try {
      // Add loading state
      button.classList.add('social-share-button--loading')
      button.disabled = true

      // Perform share
      const result = await this.socialSharing.share(platform, content)

      // Handle success
      if (result.success) {
        this.showSuccess(button, platform)

        // Dispatch custom event
        const event = new CustomEvent('socialshare', {
          detail: { platform, content, result },
        })
        document.dispatchEvent(event)
      }
    } catch (error) {
      console.error(`Failed to share on ${platform}:`, error)
      this.showError(button, error.message)
    } finally {
      // Remove loading state
      button.classList.remove('social-share-button--loading')
      button.disabled = false
    }
  }

  /**
   * Show success feedback
   */
  showSuccess(button, platform) {
    button.classList.add('social-share-button--success')

    // Special handling for copy button
    if (platform === 'copy') {
      const originalLabel = button.querySelector('.social-share-label')
      if (originalLabel) {
        const originalText = originalLabel.textContent
        originalLabel.textContent = 'Copied!'

        setTimeout(() => {
          originalLabel.textContent = originalText
          button.classList.remove('social-share-button--success')
        }, 2000)
      }
    } else {
      setTimeout(() => {
        button.classList.remove('social-share-button--success')
      }, 2000)
    }
  }

  /**
   * Show error feedback
   */
  showError(button, message) {
    button.classList.add('social-share-button--error')

    // Show error message (could be enhanced with tooltip)
    console.error('Share error:', message)

    setTimeout(() => {
      button.classList.remove('social-share-button--error')
    }, 2000)
  }

  /**
   * Create inline share buttons (compact version)
   */
  createInline(content, options = {}) {
    return this.create(content, {
      ...options,
      layout: 'horizontal',
      size: 'small',
      showLabels: false,
    })
  }

  /**
   * Create floating share buttons
   */
  createFloating(content, options = {}) {
    const container = this.create(content, {
      ...options,
      layout: 'vertical',
      showLabels: false,
    })

    container.classList.add('social-share-buttons--floating')

    return container
  }

  // SVG Icons for each platform

  getLinkedInIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>`
  }

  getTwitterIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
    </svg>`
  }

  getFacebookIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>`
  }

  getEmailIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>`
  }

  getCopyIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
    </svg>`
  }

  getShareIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
    </svg>`
  }
}

export default SocialShareButtons
