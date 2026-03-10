/**
 * Social Media Integration Module
 * Connects with LinkedIn, GitHub, and Twitter APIs
 * Displays live social media feeds, follower counts, and engagement metrics
 * Requirements: 10.1, 10.3, 10.4
 */

import { logger } from '../utils/logger.js'

export class SocialMediaIntegration {
  constructor(config = {}) {
    this.config = {
      // API Configuration
      github: {
        username: config.github?.username || null,
        token: config.github?.token || null, // Optional for higher rate limits
        apiUrl: 'https://api.github.com',
      },
      linkedin: {
        profileUrl: config.linkedin?.profileUrl || null,
        // LinkedIn API requires OAuth, so we'll use profile scraping or manual data
        enabled: config.linkedin?.enabled || false,
      },
      twitter: {
        username: config.twitter?.username || null,
        // Twitter API v2 requires authentication, using manual data or embed
        enabled: config.twitter?.enabled || false,
      },
      // Caching configuration
      cacheKey: config.cacheKey || 'portfolio-social-media',
      cacheExpiry: config.cacheExpiry || 3600000, // 1 hour default
      // Rate limiting
      rateLimitDelay: config.rateLimitDelay || 1000,
      maxRetries: config.maxRetries || 3,
      // Performance
      enableBackgroundRefresh: config.enableBackgroundRefresh !== false,
      refreshInterval: config.refreshInterval || 300000, // 5 minutes
      ...config,
    }

    this.isInitialized = false
    this.socialData = {
      github: null,
      linkedin: null,
      twitter: null,
    }
    this.lastFetch = {
      github: null,
      linkedin: null,
      twitter: null,
    }
    this.refreshTimer = null
    this.fetchQueue = []
    this.isFetching = false
  }

  /**
   * Initialize Social Media Integration
   */
  async init() {
    try {
      logger.info('Initializing Social Media Integration...')

      // Load cached data first for instant display
      this.loadFromCache()

      // Fetch fresh data in background
      if (this.config.github.username) {
        this.fetchGitHubData().catch((error) => {
          logger.error('Failed to fetch GitHub data:', error)
        })
      }

      if (this.config.linkedin.enabled && this.config.linkedin.profileUrl) {
        this.fetchLinkedInData().catch((error) => {
          logger.error('Failed to fetch LinkedIn data:', error)
        })
      }

      if (this.config.twitter.enabled && this.config.twitter.username) {
        this.fetchTwitterData().catch((error) => {
          logger.error('Failed to fetch Twitter data:', error)
        })
      }

      // Set up background refresh
      if (this.config.enableBackgroundRefresh) {
        this.setupBackgroundRefresh()
      }

      this.isInitialized = true
      logger.info('Social Media Integration initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Social Media Integration:', error)
      throw error
    }
  }

  /**
   * Fetch GitHub data
   */
  async fetchGitHubData() {
    const username = this.config.github.username
    if (!username) {
      logger.warn('GitHub username not configured')
      return null
    }

    try {
      logger.info(`Fetching GitHub data for ${username}...`)

      // Check rate limit before fetching
      const rateLimitOk = await this.checkGitHubRateLimit()
      if (!rateLimitOk) {
        logger.warn('GitHub rate limit exceeded, using cached data')
        return this.socialData.github
      }

      // Fetch user profile
      const headers = {}
      if (this.config.github.token) {
        headers['Authorization'] = `token ${this.config.github.token}`
      }

      const userResponse = await fetch(
        `${this.config.github.apiUrl}/users/${username}`,
        { headers }
      )

      if (!userResponse.ok) {
        throw new Error(`GitHub API error: ${userResponse.status}`)
      }

      const userData = await userResponse.json()

      // Fetch recent repositories
      const reposResponse = await fetch(
        `${this.config.github.apiUrl}/users/${username}/repos?sort=updated&per_page=6`,
        { headers }
      )

      if (!reposResponse.ok) {
        throw new Error(`GitHub repos API error: ${reposResponse.status}`)
      }

      const reposData = await reposResponse.json()

      // Fetch recent activity (events)
      const eventsResponse = await fetch(
        `${this.config.github.apiUrl}/users/${username}/events/public?per_page=10`,
        { headers }
      )

      let eventsData = []
      if (eventsResponse.ok) {
        eventsData = await eventsResponse.json()
      }

      // Process and structure the data
      const githubData = {
        platform: 'github',
        username: userData.login,
        name: userData.name,
        avatar: userData.avatar_url,
        bio: userData.bio,
        profileUrl: userData.html_url,
        followers: userData.followers,
        following: userData.following,
        publicRepos: userData.public_repos,
        publicGists: userData.public_gists,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
        repositories: reposData.map((repo) => ({
          name: repo.name,
          description: repo.description,
          url: repo.html_url,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          updatedAt: repo.updated_at,
          topics: repo.topics || [],
        })),
        recentActivity: this.processGitHubEvents(eventsData),
        engagementMetrics: {
          totalStars: reposData.reduce(
            (sum, repo) => sum + repo.stargazers_count,
            0
          ),
          totalForks: reposData.reduce((sum, repo) => sum + repo.forks_count, 0),
          averageStarsPerRepo:
            reposData.reduce((sum, repo) => sum + repo.stargazers_count, 0) /
            reposData.length,
        },
        fetchedAt: Date.now(),
      }

      this.socialData.github = githubData
      this.lastFetch.github = Date.now()
      this.saveToCache()

      logger.info('GitHub data fetched successfully')
      this.dispatchUpdateEvent('github', githubData)

      return githubData
    } catch (error) {
      logger.error('Error fetching GitHub data:', error)
      return this.socialData.github // Return cached data on error
    }
  }

  /**
   * Process GitHub events into readable activity
   */
  processGitHubEvents(events) {
    return events.slice(0, 5).map((event) => {
      const activity = {
        type: event.type,
        repo: event.repo.name,
        createdAt: event.created_at,
        url: `https://github.com/${event.repo.name}`,
      }

      switch (event.type) {
        case 'PushEvent':
          activity.description = `Pushed ${event.payload.commits?.length || 0} commit(s)`
          break
        case 'CreateEvent':
          activity.description = `Created ${event.payload.ref_type}`
          break
        case 'WatchEvent':
          activity.description = 'Starred a repository'
          break
        case 'ForkEvent':
          activity.description = 'Forked a repository'
          break
        case 'IssuesEvent':
          activity.description = `${event.payload.action} an issue`
          break
        case 'PullRequestEvent':
          activity.description = `${event.payload.action} a pull request`
          break
        default:
          activity.description = event.type.replace('Event', '')
      }

      return activity
    })
  }

  /**
   * Check GitHub rate limit
   */
  async checkGitHubRateLimit() {
    try {
      const headers = {}
      if (this.config.github.token) {
        headers['Authorization'] = `token ${this.config.github.token}`
      }

      const response = await fetch(
        `${this.config.github.apiUrl}/rate_limit`,
        { headers }
      )

      if (!response.ok) {
        return true // Assume OK if we can't check
      }

      const data = await response.json()
      const remaining = data.resources.core.remaining
      const resetTime = data.resources.core.reset * 1000

      if (remaining === 0) {
        const waitTime = resetTime - Date.now()
        logger.warn(
          `GitHub rate limit exceeded. Resets in ${Math.ceil(waitTime / 1000 / 60)} minutes`
        )
        return false
      }

      return true
    } catch (error) {
      logger.error('Error checking GitHub rate limit:', error)
      return true // Assume OK on error
    }
  }

  /**
   * Fetch LinkedIn data
   * Note: LinkedIn API requires OAuth and is complex to implement client-side
   * This method provides a structure for manual data or server-side integration
   */
  async fetchLinkedInData() {
    if (!this.config.linkedin.enabled) {
      return null
    }

    try {
      logger.info('Fetching LinkedIn data...')

      // LinkedIn API requires OAuth and server-side implementation
      // For now, we'll use manually configured data or placeholder
      const linkedinData = {
        platform: 'linkedin',
        profileUrl: this.config.linkedin.profileUrl,
        // These would come from LinkedIn API or manual configuration
        name: this.config.linkedin.name || 'Professional Name',
        headline: this.config.linkedin.headline || 'Professional Headline',
        connections: this.config.linkedin.connections || null,
        followers: this.config.linkedin.followers || null,
        posts: this.config.linkedin.posts || [],
        engagementMetrics: {
          profileViews: this.config.linkedin.profileViews || null,
          postImpressions: this.config.linkedin.postImpressions || null,
          searchAppearances: this.config.linkedin.searchAppearances || null,
        },
        fetchedAt: Date.now(),
      }

      this.socialData.linkedin = linkedinData
      this.lastFetch.linkedin = Date.now()
      this.saveToCache()

      logger.info('LinkedIn data loaded')
      this.dispatchUpdateEvent('linkedin', linkedinData)

      return linkedinData
    } catch (error) {
      logger.error('Error fetching LinkedIn data:', error)
      return this.socialData.linkedin
    }
  }

  /**
   * Fetch Twitter data
   * Note: Twitter API v2 requires authentication
   * This method provides a structure for manual data or server-side integration
   */
  async fetchTwitterData() {
    if (!this.config.twitter.enabled) {
      return null
    }

    try {
      logger.info('Fetching Twitter data...')

      // Twitter API v2 requires authentication
      // For now, we'll use manually configured data or placeholder
      const twitterData = {
        platform: 'twitter',
        username: this.config.twitter.username,
        profileUrl: `https://twitter.com/${this.config.twitter.username}`,
        // These would come from Twitter API or manual configuration
        name: this.config.twitter.name || 'Twitter Name',
        bio: this.config.twitter.bio || '',
        followers: this.config.twitter.followers || null,
        following: this.config.twitter.following || null,
        tweets: this.config.twitter.tweets || [],
        engagementMetrics: {
          totalTweets: this.config.twitter.totalTweets || null,
          averageLikes: this.config.twitter.averageLikes || null,
          averageRetweets: this.config.twitter.averageRetweets || null,
        },
        fetchedAt: Date.now(),
      }

      this.socialData.twitter = twitterData
      this.lastFetch.twitter = Date.now()
      this.saveToCache()

      logger.info('Twitter data loaded')
      this.dispatchUpdateEvent('twitter', twitterData)

      return twitterData
    } catch (error) {
      logger.error('Error fetching Twitter data:', error)
      return this.socialData.twitter
    }
  }

  /**
   * Get all social media data
   */
  getAllData() {
    return {
      github: this.socialData.github,
      linkedin: this.socialData.linkedin,
      twitter: this.socialData.twitter,
    }
  }

  /**
   * Get data for specific platform
   */
  getPlatformData(platform) {
    return this.socialData[platform] || null
  }

  /**
   * Get combined engagement metrics
   */
  getCombinedMetrics() {
    const metrics = {
      totalFollowers: 0,
      platforms: [],
    }

    if (this.socialData.github) {
      metrics.totalFollowers += this.socialData.github.followers || 0
      metrics.platforms.push({
        name: 'GitHub',
        followers: this.socialData.github.followers,
        engagement: this.socialData.github.engagementMetrics,
      })
    }

    if (this.socialData.linkedin) {
      metrics.totalFollowers += this.socialData.linkedin.followers || 0
      metrics.platforms.push({
        name: 'LinkedIn',
        followers: this.socialData.linkedin.followers,
        engagement: this.socialData.linkedin.engagementMetrics,
      })
    }

    if (this.socialData.twitter) {
      metrics.totalFollowers += this.socialData.twitter.followers || 0
      metrics.platforms.push({
        name: 'Twitter',
        followers: this.socialData.twitter.followers,
        engagement: this.socialData.twitter.engagementMetrics,
      })
    }

    return metrics
  }

  /**
   * Refresh all social media data
   */
  async refreshAll() {
    logger.info('Refreshing all social media data...')

    const promises = []

    if (this.config.github.username) {
      promises.push(this.fetchGitHubData())
    }

    if (this.config.linkedin.enabled) {
      promises.push(this.fetchLinkedInData())
    }

    if (this.config.twitter.enabled) {
      promises.push(this.fetchTwitterData())
    }

    await Promise.allSettled(promises)
    logger.info('Social media data refresh complete')
  }

  /**
   * Set up background refresh
   */
  setupBackgroundRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }

    this.refreshTimer = setInterval(() => {
      // Only refresh if page is visible
      if (!document.hidden) {
        this.refreshAll()
      }
    }, this.config.refreshInterval)

    logger.info(
      `Background refresh enabled (interval: ${this.config.refreshInterval}ms)`
    )
  }

  /**
   * Load data from cache
   */
  loadFromCache() {
    try {
      const cached = localStorage.getItem(this.config.cacheKey)
      if (!cached) {
        return
      }

      const data = JSON.parse(cached)
      const now = Date.now()

      // Check if cache is still valid
      if (data.timestamp && now - data.timestamp < this.config.cacheExpiry) {
        this.socialData = data.socialData || this.socialData
        this.lastFetch = data.lastFetch || this.lastFetch
        logger.info('Loaded social media data from cache')
      } else {
        logger.info('Cache expired, will fetch fresh data')
      }
    } catch (error) {
      logger.error('Error loading from cache:', error)
    }
  }

  /**
   * Save data to cache
   */
  saveToCache() {
    try {
      const data = {
        socialData: this.socialData,
        lastFetch: this.lastFetch,
        timestamp: Date.now(),
      }

      localStorage.setItem(this.config.cacheKey, JSON.stringify(data))
      logger.info('Saved social media data to cache')
    } catch (error) {
      logger.error('Error saving to cache:', error)
    }
  }

  /**
   * Dispatch update event
   */
  dispatchUpdateEvent(platform, data) {
    document.dispatchEvent(
      new CustomEvent('socialMediaUpdate', {
        detail: {
          platform,
          data,
        },
      })
    )
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      platforms: {
        github: {
          configured: !!this.config.github.username,
          hasData: !!this.socialData.github,
          lastFetch: this.lastFetch.github,
        },
        linkedin: {
          configured: this.config.linkedin.enabled,
          hasData: !!this.socialData.linkedin,
          lastFetch: this.lastFetch.linkedin,
        },
        twitter: {
          configured: this.config.twitter.enabled,
          hasData: !!this.socialData.twitter,
          lastFetch: this.lastFetch.twitter,
        },
      },
    }
  }

  /**
   * Destroy social media integration
   */
  destroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }

    this.socialData = {
      github: null,
      linkedin: null,
      twitter: null,
    }

    this.isInitialized = false
    logger.info('Social Media Integration destroyed')
  }
}
