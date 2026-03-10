/**
 * Social Sharing Module
 * Handles social media sharing functionality with optimized previews
 */

export class SocialSharing {
  constructor(config = {}) {
    this.config = {
      platforms: ['linkedin', 'twitter', 'facebook', 'email', 'copy'],
      trackSharing: true,
      analyticsCategory: 'Social Sharing',
      ...config,
    }

    this.shareData = new Map()
    this.analytics = null
  }

  /**
   * Initialize the social sharing system
   */
  async init() {
    // Import analytics if tracking is enabled
    if (this.config.trackSharing) {
      try {
        const { AnalyticsService } = await import('./analytics.js')
        this.analytics = new AnalyticsService()
      } catch (error) {
        console.warn('Analytics not available for social sharing tracking:', error)
      }
    }

    return this
  }

  /**
   * Generate shareable URL with proper metadata
   */
  generateShareableURL(content, options = {}) {
    const {
      includeUTM = true,
      utmSource = 'social',
      utmMedium = 'share',
      utmCampaign = 'portfolio',
    } = options

    // Get base URL
    const baseUrl = content.url || window.location.href

    // Parse URL
    const url = new URL(baseUrl, window.location.origin)

    // Add UTM parameters if enabled
    if (includeUTM) {
      url.searchParams.set('utm_source', utmSource)
      url.searchParams.set('utm_medium', utmMedium)
      url.searchParams.set('utm_campaign', utmCampaign)

      // Add content-specific parameters
      if (content.id) {
        url.searchParams.set('utm_content', content.id)
      }
    }

    return url.toString()
  }

  /**
   * Generate optimized metadata for social sharing
   */
  generateShareMetadata(content, type = 'project') {
    const metadata = {
      title: content.title || document.title,
      description: content.description || '',
      url: this.generateShareableURL(content),
      image: null,
      type: type === 'article' ? 'article' : 'website',
    }

    // Add image if available
    if (content.image) {
      metadata.image = this.resolveImageUrl(content.image)
      metadata.imageAlt = content.imageAlt || content.title
    } else if (content.images && content.images.length > 0) {
      // Use featured image or first image
      const featuredImage = content.images.find((img) => img.featured) || content.images[0]
      metadata.image = this.resolveImageUrl(featuredImage.url)
      metadata.imageAlt = featuredImage.alt || content.title
    }

    // Add type-specific metadata
    if (type === 'project') {
      metadata.type = 'article'
      if (content.technologies) {
        metadata.tags = content.technologies.map((tech) => tech.name)
      }
      if (content.dateCompleted) {
        metadata.publishedTime = content.dateCompleted.toISOString()
      }
    }

    // Store metadata for later use
    this.shareData.set(content.id || content.title, metadata)

    return metadata
  }

  /**
   * Resolve image URL to absolute URL
   */
  resolveImageUrl(imageUrl) {
    if (!imageUrl) return null

    // If already absolute URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }

    // Convert relative URL to absolute
    return new URL(imageUrl, window.location.origin).toString()
  }

  /**
   * Share content on a specific platform
   */
  async share(platform, content, options = {}) {
    const metadata = this.generateShareMetadata(content, options.type)

    // Track sharing event
    if (this.analytics) {
      this.trackShare(platform, content, metadata)
    }

    // Platform-specific sharing
    switch (platform.toLowerCase()) {
      case 'linkedin':
        return this.shareOnLinkedIn(metadata)
      case 'twitter':
        return this.shareOnTwitter(metadata)
      case 'facebook':
        return this.shareOnFacebook(metadata)
      case 'email':
        return this.shareViaEmail(metadata)
      case 'copy':
        return this.copyToClipboard(metadata.url)
      case 'native':
        return this.shareNative(metadata)
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }
  }

  /**
   * Share on LinkedIn
   */
  shareOnLinkedIn(metadata) {
    const url = new URL('https://www.linkedin.com/sharing/share-offsite/')
    url.searchParams.set('url', metadata.url)

    this.openShareWindow(url.toString(), 'LinkedIn')
    return { success: true, platform: 'linkedin' }
  }

  /**
   * Share on Twitter
   */
  shareOnTwitter(metadata) {
    const url = new URL('https://twitter.com/intent/tweet')
    url.searchParams.set('url', metadata.url)
    url.searchParams.set('text', metadata.title)

    if (metadata.description) {
      const text = `${metadata.title}\n\n${metadata.description}`
      url.searchParams.set('text', text.substring(0, 280))
    }

    this.openShareWindow(url.toString(), 'Twitter')
    return { success: true, platform: 'twitter' }
  }

  /**
   * Share on Facebook
   */
  shareOnFacebook(metadata) {
    const url = new URL('https://www.facebook.com/sharer/sharer.php')
    url.searchParams.set('u', metadata.url)

    this.openShareWindow(url.toString(), 'Facebook')
    return { success: true, platform: 'facebook' }
  }

  /**
   * Share via Email
   */
  shareViaEmail(metadata) {
    const subject = encodeURIComponent(metadata.title)
    const body = encodeURIComponent(
      `${metadata.description}\n\nView more: ${metadata.url}`
    )

    window.location.href = `mailto:?subject=${subject}&body=${body}`
    return { success: true, platform: 'email' }
  }

  /**
   * Copy URL to clipboard
   */
  async copyToClipboard(url) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
        return { success: true, platform: 'copy', url }
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea')
        textarea.value = url
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        return { success: true, platform: 'copy', url }
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return { success: false, platform: 'copy', error: error.message }
    }
  }

  /**
   * Use native Web Share API if available
   */
  async shareNative(metadata) {
    if (!navigator.share) {
      throw new Error('Native sharing not supported')
    }

    try {
      const shareData = {
        title: metadata.title,
        text: metadata.description,
        url: metadata.url,
      }

      await navigator.share(shareData)
      return { success: true, platform: 'native' }
    } catch (error) {
      // User cancelled or error occurred
      if (error.name === 'AbortError') {
        return { success: false, platform: 'native', cancelled: true }
      }
      throw error
    }
  }

  /**
   * Open share window with optimal dimensions
   */
  openShareWindow(url, title) {
    const width = 600
    const height = 600
    const left = window.innerWidth / 2 - width / 2 + window.screenX
    const top = window.innerHeight / 2 - height / 2 + window.screenY

    const features = `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`

    window.open(url, `share-${title}`, features)
  }

  /**
   * Check if native sharing is available
   */
  isNativeSharingAvailable() {
    return navigator.share !== undefined
  }

  /**
   * Get available platforms for current device
   */
  getAvailablePlatforms() {
    const platforms = [...this.config.platforms]

    // Add native sharing if available
    if (this.isNativeSharingAvailable() && !platforms.includes('native')) {
      platforms.unshift('native')
    }

    return platforms
  }

  /**
   * Track sharing event in analytics
   */
  trackShare(platform, content, metadata) {
    if (!this.analytics) return

    this.analytics.trackEvent({
      eventName: 'share',
      category: this.config.analyticsCategory,
      action: `share_${platform}`,
      label: content.title || content.id,
      customParameters: {
        content_type: content.category || 'unknown',
        content_id: content.id,
        share_url: metadata.url,
      },
    })
  }

  /**
   * Update Open Graph and Twitter Card metadata dynamically
   */
  updateSocialMetadata(metadata) {
    // Update Open Graph tags
    this.setMetaTag('property', 'og:title', metadata.title)
    this.setMetaTag('property', 'og:description', metadata.description)
    this.setMetaTag('property', 'og:url', metadata.url)
    this.setMetaTag('property', 'og:type', metadata.type)

    if (metadata.image) {
      this.setMetaTag('property', 'og:image', metadata.image)
      if (metadata.imageAlt) {
        this.setMetaTag('property', 'og:image:alt', metadata.imageAlt)
      }
    }

    // Update Twitter Card tags
    this.setMetaTag('name', 'twitter:card', 'summary_large_image')
    this.setMetaTag('name', 'twitter:title', metadata.title)
    this.setMetaTag('name', 'twitter:description', metadata.description)

    if (metadata.image) {
      this.setMetaTag('name', 'twitter:image', metadata.image)
      if (metadata.imageAlt) {
        this.setMetaTag('name', 'twitter:image:alt', metadata.imageAlt)
      }
    }
  }

  /**
   * Set or update a meta tag
   */
  setMetaTag(attribute, attributeValue, content) {
    if (!content) return

    let element = document.querySelector(`meta[${attribute}="${attributeValue}"]`)

    if (!element) {
      element = document.createElement('meta')
      element.setAttribute(attribute, attributeValue)
      document.head.appendChild(element)
    }

    element.setAttribute('content', content)
  }

  /**
   * Get share count (placeholder for future API integration)
   */
  async getShareCount(url) {
    // This would integrate with social media APIs to get share counts
    // For now, return mock data or null
    return {
      linkedin: null,
      twitter: null,
      facebook: null,
      total: 0,
    }
  }

  /**
   * Get sharing statistics
   */
  getStats() {
    return {
      totalShares: this.shareData.size,
      platforms: this.getAvailablePlatforms(),
      nativeSupport: this.isNativeSharingAvailable(),
    }
  }

  /**
   * Destroy the social sharing system
   */
  destroy() {
    this.shareData.clear()
    this.analytics = null
  }
}

export default SocialSharing
