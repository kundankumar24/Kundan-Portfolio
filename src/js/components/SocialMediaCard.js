/**
 * Social Media Card Component
 * Displays social media platform data with follower counts and engagement metrics
 */

import { logger } from '../utils/logger.js'

export class SocialMediaCard {
  /**
   * Create a social media card for a platform
   */
  static create(platformData, options = {}) {
    if (!platformData) {
      return null
    }

    const {
      showEngagementMetrics = true,
      showRecentActivity = true,
      compact = false,
    } = options

    const card = document.createElement('div')
    card.className = `social-media-card social-media-card--${platformData.platform}`
    card.setAttribute('data-platform', platformData.platform)

    // Platform-specific rendering
    switch (platformData.platform) {
    case 'github':
      card.innerHTML = this.renderGitHubCard(
        platformData,
        showEngagementMetrics,
        showRecentActivity,
        compact
      )
      break
    case 'linkedin':
      card.innerHTML = this.renderLinkedInCard(
        platformData,
        showEngagementMetrics,
        compact
      )
      break
    case 'twitter':
      card.innerHTML = this.renderTwitterCard(
        platformData,
        showEngagementMetrics,
        compact
      )
      break
    default:
      logger.warn(`Unknown platform: ${platformData.platform}`)
      return null
    }

    return card
  }

  /**
   * Render GitHub card
   */
  static renderGitHubCard(data, showMetrics, showActivity, compact) {
    const recentRepos = data.repositories.slice(0, 3)
    const recentActivity = data.recentActivity.slice(0, 3)

    return `
      <div class="social-card-header">
        <div class="social-card-avatar">
          <img src="${data.avatar}" alt="${data.name}" loading="lazy" />
        </div>
        <div class="social-card-info">
          <h3 class="social-card-name">${data.name || data.username}</h3>
          <p class="social-card-username">@${data.username}</p>
          ${data.bio ? `<p class="social-card-bio">${this.escapeHtml(data.bio)}</p>` : ''}
        </div>
        <a href="${data.profileUrl}" target="_blank" rel="noopener noreferrer" class="social-card-link" aria-label="View GitHub profile">
          <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      </div>

      <div class="social-card-stats">
        <div class="stat">
          <span class="stat-value">${this.formatNumber(data.followers)}</span>
          <span class="stat-label">Followers</span>
        </div>
        <div class="stat">
          <span class="stat-value">${this.formatNumber(data.following)}</span>
          <span class="stat-label">Following</span>
        </div>
        <div class="stat">
          <span class="stat-value">${this.formatNumber(data.publicRepos)}</span>
          <span class="stat-label">Repositories</span>
        </div>
      </div>

      ${
  showMetrics && data.engagementMetrics
    ? `
        <div class="social-card-engagement">
          <h4 class="engagement-title">Engagement Metrics</h4>
          <div class="engagement-stats">
            <div class="engagement-stat">
              <span class="engagement-icon">⭐</span>
              <span class="engagement-value">${this.formatNumber(data.engagementMetrics.totalStars)}</span>
              <span class="engagement-label">Total Stars</span>
            </div>
            <div class="engagement-stat">
              <span class="engagement-icon">🔱</span>
              <span class="engagement-value">${this.formatNumber(data.engagementMetrics.totalForks)}</span>
              <span class="engagement-label">Total Forks</span>
            </div>
          </div>
        </div>
      `
    : ''
}

      ${
  !compact && recentRepos.length > 0
    ? `
        <div class="social-card-repos">
          <h4 class="repos-title">Recent Repositories</h4>
          <div class="repos-list">
            ${recentRepos
    .map(
      (repo) => `
              <div class="repo-item">
                <a href="${repo.url}" target="_blank" rel="noopener noreferrer" class="repo-name">
                  ${this.escapeHtml(repo.name)}
                </a>
                ${repo.description ? `<p class="repo-description">${this.escapeHtml(repo.description)}</p>` : ''}
                <div class="repo-meta">
                  ${repo.language ? `<span class="repo-language">${this.escapeHtml(repo.language)}</span>` : ''}
                  <span class="repo-stars">⭐ ${repo.stars}</span>
                  <span class="repo-forks">🔱 ${repo.forks}</span>
                </div>
              </div>
            `
    )
    .join('')}
          </div>
        </div>
      `
    : ''
}

      ${
  showActivity && recentActivity.length > 0
    ? `
        <div class="social-card-activity">
          <h4 class="activity-title">Recent Activity</h4>
          <div class="activity-list">
            ${recentActivity
    .map(
      (activity) => `
              <div class="activity-item">
                <span class="activity-description">${this.escapeHtml(activity.description)}</span>
                <a href="${activity.url}" target="_blank" rel="noopener noreferrer" class="activity-repo">
                  ${this.escapeHtml(activity.repo)}
                </a>
                <span class="activity-time">${this.formatTimeAgo(activity.createdAt)}</span>
              </div>
            `
    )
    .join('')}
          </div>
        </div>
      `
    : ''
}
    `
  }

  /**
   * Render LinkedIn card
   */
  static renderLinkedInCard(data, showMetrics, compact) {
    return `
      <div class="social-card-header">
        <div class="social-card-info">
          <h3 class="social-card-name">${this.escapeHtml(data.name)}</h3>
          ${data.headline ? `<p class="social-card-headline">${this.escapeHtml(data.headline)}</p>` : ''}
        </div>
        <a href="${data.profileUrl}" target="_blank" rel="noopener noreferrer" class="social-card-link" aria-label="View LinkedIn profile">
          <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
        </a>
      </div>

      ${
  data.connections || data.followers
    ? `
        <div class="social-card-stats">
          ${
  data.connections
    ? `
            <div class="stat">
              <span class="stat-value">${this.formatNumber(data.connections)}</span>
              <span class="stat-label">Connections</span>
            </div>
          `
    : ''
}
          ${
  data.followers
    ? `
            <div class="stat">
              <span class="stat-value">${this.formatNumber(data.followers)}</span>
              <span class="stat-label">Followers</span>
            </div>
          `
    : ''
}
        </div>
      `
    : ''
}

      ${
  showMetrics && data.engagementMetrics
    ? `
        <div class="social-card-engagement">
          <h4 class="engagement-title">Engagement Metrics</h4>
          <div class="engagement-stats">
            ${
  data.engagementMetrics.profileViews
    ? `
              <div class="engagement-stat">
                <span class="engagement-icon">👁️</span>
                <span class="engagement-value">${this.formatNumber(data.engagementMetrics.profileViews)}</span>
                <span class="engagement-label">Profile Views</span>
              </div>
            `
    : ''
}
            ${
  data.engagementMetrics.postImpressions
    ? `
              <div class="engagement-stat">
                <span class="engagement-icon">📊</span>
                <span class="engagement-value">${this.formatNumber(data.engagementMetrics.postImpressions)}</span>
                <span class="engagement-label">Post Impressions</span>
              </div>
            `
    : ''
}
          </div>
        </div>
      `
    : ''
}
    `
  }

  /**
   * Render Twitter card
   */
  static renderTwitterCard(data, showMetrics, compact) {
    return `
      <div class="social-card-header">
        <div class="social-card-info">
          <h3 class="social-card-name">${this.escapeHtml(data.name)}</h3>
          <p class="social-card-username">@${this.escapeHtml(data.username)}</p>
          ${data.bio ? `<p class="social-card-bio">${this.escapeHtml(data.bio)}</p>` : ''}
        </div>
        <a href="${data.profileUrl}" target="_blank" rel="noopener noreferrer" class="social-card-link" aria-label="View Twitter profile">
          <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
        </a>
      </div>

      ${
  data.followers || data.following
    ? `
        <div class="social-card-stats">
          ${
  data.followers
    ? `
            <div class="stat">
              <span class="stat-value">${this.formatNumber(data.followers)}</span>
              <span class="stat-label">Followers</span>
            </div>
          `
    : ''
}
          ${
  data.following
    ? `
            <div class="stat">
              <span class="stat-value">${this.formatNumber(data.following)}</span>
              <span class="stat-label">Following</span>
            </div>
          `
    : ''
}
        </div>
      `
    : ''
}

      ${
  showMetrics && data.engagementMetrics
    ? `
        <div class="social-card-engagement">
          <h4 class="engagement-title">Engagement Metrics</h4>
          <div class="engagement-stats">
            ${
  data.engagementMetrics.averageLikes
    ? `
              <div class="engagement-stat">
                <span class="engagement-icon">❤️</span>
                <span class="engagement-value">${this.formatNumber(data.engagementMetrics.averageLikes)}</span>
                <span class="engagement-label">Avg. Likes</span>
              </div>
            `
    : ''
}
            ${
  data.engagementMetrics.averageRetweets
    ? `
              <div class="engagement-stat">
                <span class="engagement-icon">🔄</span>
                <span class="engagement-value">${this.formatNumber(data.engagementMetrics.averageRetweets)}</span>
                <span class="engagement-label">Avg. Retweets</span>
              </div>
            `
    : ''
}
          </div>
        </div>
      `
    : ''
}
    `
  }

  /**
   * Create a grid of social media cards
   */
  static createGrid(socialData, options = {}) {
    const { layout = 'grid', showEngagementMetrics = true } = options

    const grid = document.createElement('div')
    grid.className = `social-media-grid social-media-grid--${layout}`

    const platforms = ['github', 'linkedin', 'twitter']
    platforms.forEach((platform) => {
      const data = socialData[platform]
      if (data) {
        const card = this.create(data, {
          showEngagementMetrics,
          showRecentActivity: platform === 'github',
          compact: layout === 'compact',
        })
        if (card) {
          grid.appendChild(card)
        }
      }
    })

    return grid
  }

  /**
   * Format number with K/M suffix
   */
  static formatNumber(num) {
    if (num === null || num === undefined) {
      return '0'
    }

    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  /**
   * Format time ago
   */
  static formatTimeAgo(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)

    if (seconds < 60) {
      return 'just now'
    }
    if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ago`
    }
    if (seconds < 86400) {
      return `${Math.floor(seconds / 3600)}h ago`
    }
    if (seconds < 604800) {
      return `${Math.floor(seconds / 86400)}d ago`
    }
    if (seconds < 2592000) {
      return `${Math.floor(seconds / 604800)}w ago`
    }
    return date.toLocaleDateString()
  }

  /**
   * Escape HTML to prevent XSS
   */
  static escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}
