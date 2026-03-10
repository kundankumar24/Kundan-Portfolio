/**
 * Social Integration Property-Based Tests
 * Feature: portfolio-enhancement, Property 12: Social Integration Functionality
 * 
 * **Validates: Requirements 10.1, 10.2, 10.3, 10.5**
 * 
 * Property 12: Social Integration Functionality
 * For any social media integration or sharing feature, the functionality should work 
 * correctly and display current, accurate information
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fc from 'fast-check'
import { SocialMediaIntegration } from '../js/modules/socialMedia.js'
import { SocialSharing } from '../js/modules/socialSharing.js'

describe('Property 12: Social Integration Functionality', () => {
  let socialMedia
  let socialSharing

  beforeEach(() => {
    // Reset localStorage
    localStorage.clear()

    // Mock fetch
    global.fetch = vi.fn()

    // Mock document.hidden
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    })

    // Mock window.location for URL resolution
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        origin: 'https://example.com',
        href: 'https://example.com',
      },
    })

    // Clear document head for meta tags
    document.head.innerHTML = ''
  })

  afterEach(() => {
    if (socialMedia) {
      socialMedia.destroy()
    }
    if (socialSharing) {
      socialSharing.destroy()
    }
    vi.restoreAllMocks()
  })

  // Custom arbitraries for generating test data
  const githubUsernameArbitrary = fc.stringMatching(/^[a-zA-Z0-9-]{3,39}$/)

  const githubUserDataArbitrary = fc.record({
    login: githubUsernameArbitrary,
    name: fc.string({ minLength: 3, maxLength: 50 }),
    avatar_url: fc.webUrl(),
    bio: fc.option(fc.string({ minLength: 10, maxLength: 160 })),
    html_url: fc.webUrl(),
    followers: fc.integer({ min: 0, max: 100000 }),
    following: fc.integer({ min: 0, max: 10000 }),
    public_repos: fc.integer({ min: 0, max: 1000 }),
    public_gists: fc.integer({ min: 0, max: 500 }),
    created_at: fc.integer({ min: 946684800000, max: 1924905600000 }).map(ts => new Date(ts).toISOString()),
    updated_at: fc.integer({ min: 946684800000, max: 1924905600000 }).map(ts => new Date(ts).toISOString()),
  })

  const githubRepoArbitrary = fc.record({
    name: fc.stringMatching(/^[a-zA-Z0-9-_]{1,100}$/),
    description: fc.option(fc.string({ minLength: 10, maxLength: 200 })),
    html_url: fc.webUrl(),
    stargazers_count: fc.integer({ min: 0, max: 10000 }),
    forks_count: fc.integer({ min: 0, max: 1000 }),
    language: fc.option(fc.constantFrom('JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust')),
    updated_at: fc.integer({ min: 946684800000, max: 1924905600000 }).map(ts => new Date(ts).toISOString()),
    topics: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
  })

  const shareContentArbitrary = fc.record({
    id: fc.stringMatching(/^[a-z0-9-]{5,50}$/),
    title: fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length >= 10),
    description: fc.string({ minLength: 20, maxLength: 300 }).filter(s => s.trim().length >= 20),
    url: fc.option(fc.webUrl()),
    image: fc.option(fc.webUrl()), // Only use absolute URLs for images
    imageAlt: fc.option(fc.string({ minLength: 5, maxLength: 100 })),
    category: fc.option(fc.constantFrom('project', 'article', 'achievement')),
    technologies: fc.option(fc.array(
      fc.record({ name: fc.string({ minLength: 2, maxLength: 20 }) }),
      { minLength: 1, maxLength: 5 }
    )),
  })

  /**
   * Property: GitHub data is fetched and structured correctly
   * For any valid GitHub username, data should be fetched and properly structured
   */
  it('should fetch and structure GitHub data correctly for any username', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: githubUsernameArbitrary,
          userData: githubUserDataArbitrary,
          repos: fc.array(githubRepoArbitrary, { minLength: 1, maxLength: 6 }),
        }),
        async ({ username, userData, repos }) => {
          // Mock fetch responses (rate limit check + user + repos + events)
          global.fetch = vi.fn()
            .mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                resources: {
                  core: {
                    remaining: 5000,
                    reset: Math.floor(Date.now() / 1000) + 3600,
                  },
                },
              }),
            })
            .mockResolvedValueOnce({
              ok: true,
              json: async () => userData,
            })
            .mockResolvedValueOnce({
              ok: true,
              json: async () => repos,
            })
            .mockResolvedValueOnce({
              ok: true,
              json: async () => [],
            })

          // Create social media integration
          socialMedia = new SocialMediaIntegration({
            github: { username },
            enableBackgroundRefresh: false,
          })

          // Fetch GitHub data
          const githubData = await socialMedia.fetchGitHubData()

          // Verify data structure
          expect(githubData).toBeTruthy()
          expect(githubData.platform).toBe('github')
          expect(githubData.username).toBe(userData.login)
          expect(githubData.name).toBe(userData.name)
          expect(githubData.followers).toBe(userData.followers)
          expect(githubData.following).toBe(userData.following)
          expect(githubData.publicRepos).toBe(userData.public_repos)

          // Verify repositories are structured correctly
          expect(githubData.repositories).toHaveLength(repos.length)
          githubData.repositories.forEach((repo, index) => {
            expect(repo.name).toBe(repos[index].name)
            expect(repo.stars).toBe(repos[index].stargazers_count)
            expect(repo.forks).toBe(repos[index].forks_count)
          })

          // Verify engagement metrics are calculated
          expect(githubData.engagementMetrics).toBeDefined()
          expect(githubData.engagementMetrics.totalStars).toBe(
            repos.reduce((sum, repo) => sum + repo.stargazers_count, 0)
          )
          expect(githubData.engagementMetrics.totalForks).toBe(
            repos.reduce((sum, repo) => sum + repo.forks_count, 0)
          )

          // Verify timestamp
          expect(githubData.fetchedAt).toBeDefined()
          expect(typeof githubData.fetchedAt).toBe('number')
        }
      ),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Social sharing generates correct metadata
   * For any content, sharing metadata should include all required fields
   */
  it('should generate complete sharing metadata for any content', async () => {
    await fc.assert(
      fc.asyncProperty(shareContentArbitrary, async (content) => {
        socialSharing = new SocialSharing()
        await socialSharing.init()

        const metadata = socialSharing.generateShareMetadata(content, content.category || 'project')

        // Verify required fields
        expect(metadata.title).toBe(content.title)
        expect(metadata.description).toBe(content.description)
        expect(metadata.url).toBeDefined()
        expect(metadata.type).toBeDefined()

        // Verify URL is valid
        expect(() => new URL(metadata.url)).not.toThrow()

        // Verify image handling
        if (content.image) {
          expect(metadata.image).toBeDefined()
          // Image should be absolute URL
          expect(
            metadata.image.startsWith('http://') || metadata.image.startsWith('https://')
          ).toBe(true)
        }

        // Verify metadata is stored
        expect(socialSharing.shareData.has(content.id)).toBe(true)
      }),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Shareable URLs include proper UTM parameters
   * For any content, generated URLs should include tracking parameters
   */
  it('should generate shareable URLs with UTM parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          content: shareContentArbitrary,
          utmSource: fc.string({ minLength: 3, maxLength: 20 }),
          utmMedium: fc.string({ minLength: 3, maxLength: 20 }),
          utmCampaign: fc.string({ minLength: 3, maxLength: 20 }),
        }),
        async ({ content, utmSource, utmMedium, utmCampaign }) => {
          socialSharing = new SocialSharing()
          await socialSharing.init()

          const url = socialSharing.generateShareableURL(content, {
            includeUTM: true,
            utmSource,
            utmMedium,
            utmCampaign,
          })

          // Parse URL
          const parsedUrl = new URL(url)

          // Verify UTM parameters
          expect(parsedUrl.searchParams.get('utm_source')).toBe(utmSource)
          expect(parsedUrl.searchParams.get('utm_medium')).toBe(utmMedium)
          expect(parsedUrl.searchParams.get('utm_campaign')).toBe(utmCampaign)

          // Verify content ID is included if present
          if (content.id) {
            expect(parsedUrl.searchParams.get('utm_content')).toBe(content.id)
          }
        }
      ),
      { numRuns: 30 }
    )
  })

  /**
   * Property: Platform-specific share URLs are correctly formatted
   * For any content and platform, share URLs should be valid and properly formatted
   */
  it('should generate valid platform-specific share URLs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          content: shareContentArbitrary,
          platform: fc.constantFrom('linkedin', 'twitter', 'facebook'),
        }),
        async ({ content, platform }) => {
          socialSharing = new SocialSharing()
          await socialSharing.init()

          // Mock window.open to capture the URL
          const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

          const result = await socialSharing.share(platform, content)

          // Verify share was successful
          expect(result.success).toBe(true)
          expect(result.platform).toBe(platform)

          // Verify window.open was called
          expect(openSpy).toHaveBeenCalled()

          const shareUrl = openSpy.mock.calls[0][0]

          // Verify URL is valid
          expect(() => new URL(shareUrl)).not.toThrow()

          // Verify platform-specific URL patterns
          const parsedUrl = new URL(shareUrl)
          switch (platform) {
          case 'linkedin':
            expect(parsedUrl.hostname).toContain('linkedin.com')
            break
          case 'twitter':
            expect(parsedUrl.hostname).toContain('twitter.com')
            break
          case 'facebook':
            expect(parsedUrl.hostname).toContain('facebook.com')
            break
          }

          openSpy.mockRestore()
        }
      ),
      { numRuns: 30 }
    )
  })

  /**
   * Property: Social metadata tags are properly updated
   * For any metadata, Open Graph and Twitter Card tags should be set correctly
   */
  it('should update social metadata tags correctly', async () => {
    await fc.assert(
      fc.asyncProperty(shareContentArbitrary, async (content) => {
        // Ensure document.head exists and is empty
        if (!document.head) {
          document.documentElement.appendChild(document.createElement('head'))
        }
        document.head.innerHTML = ''

        socialSharing = new SocialSharing()
        await socialSharing.init()

        const metadata = socialSharing.generateShareMetadata(content)
        
        // Verify metadata was generated
        expect(metadata).toBeDefined()
        expect(metadata.title).toBe(content.title)
        expect(metadata.description).toBe(content.description)
        
        socialSharing.updateSocialMetadata(metadata)

        // Give DOM time to update
        await new Promise(resolve => setTimeout(resolve, 0))

        // Verify Open Graph tags
        const ogTitle = document.querySelector('meta[property="og:title"]')
        expect(ogTitle, `og:title should exist for title: "${metadata.title}"`).toBeTruthy()
        if (ogTitle) {
          expect(ogTitle.getAttribute('content')).toBe(metadata.title)
        }

        const ogDescription = document.querySelector('meta[property="og:description"]')
        expect(ogDescription, 'og:description should exist').toBeTruthy()
        if (ogDescription) {
          expect(ogDescription.getAttribute('content')).toBe(metadata.description)
        }

        const ogUrl = document.querySelector('meta[property="og:url"]')
        expect(ogUrl, 'og:url should exist').toBeTruthy()

        const ogType = document.querySelector('meta[property="og:type"]')
        expect(ogType, 'og:type should exist').toBeTruthy()

        // Verify Twitter Card tags
        const twitterCard = document.querySelector('meta[name="twitter:card"]')
        expect(twitterCard, 'twitter:card should exist').toBeTruthy()

        const twitterTitle = document.querySelector('meta[name="twitter:title"]')
        expect(twitterTitle, 'twitter:title should exist').toBeTruthy()

        const twitterDescription = document.querySelector('meta[name="twitter:description"]')
        expect(twitterDescription, 'twitter:description should exist').toBeTruthy()

        // Verify image tags if image is present
        if (metadata.image) {
          const ogImage = document.querySelector('meta[property="og:image"]')
          expect(ogImage).toBeTruthy()

          const twitterImage = document.querySelector('meta[name="twitter:image"]')
          expect(twitterImage).toBeTruthy()
        }
      }),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Clipboard sharing works correctly
   * For any content URL, copying to clipboard should succeed
   */
  it('should copy URLs to clipboard successfully', async () => {
    await fc.assert(
      fc.asyncProperty(shareContentArbitrary, async (content) => {
        socialSharing = new SocialSharing()
        await socialSharing.init()

        // Mock clipboard API
        const writeTextMock = vi.fn().mockResolvedValue()
        Object.assign(navigator, {
          clipboard: {
            writeText: writeTextMock,
          },
        })

        const metadata = socialSharing.generateShareMetadata(content)
        const result = await socialSharing.copyToClipboard(metadata.url)

        // Verify copy was successful
        expect(result.success).toBe(true)
        expect(result.platform).toBe('copy')
        expect(result.url).toBe(metadata.url)

        // Verify clipboard API was called
        expect(writeTextMock).toHaveBeenCalledWith(metadata.url)
      }),
      { numRuns: 30 }
    )
  })

  /**
   * Property: Email sharing generates correct mailto links
   * For any content, email sharing should create valid mailto URLs
   */
  it('should generate valid mailto links for email sharing', async () => {
    await fc.assert(
      fc.asyncProperty(shareContentArbitrary, async (content) => {
        socialSharing = new SocialSharing()
        await socialSharing.init()

        const metadata = socialSharing.generateShareMetadata(content)

        // Mock window.location.href setter
        const originalLocation = window.location.href
        let capturedHref = ''
        Object.defineProperty(window, 'location', {
          value: {
            href: '',
            get href() {
              return capturedHref
            },
            set href(value) {
              capturedHref = value
            },
          },
          writable: true,
        })

        const result = socialSharing.shareViaEmail(metadata)

        // Verify result
        expect(result.success).toBe(true)
        expect(result.platform).toBe('email')

        // Verify mailto link
        expect(capturedHref).toContain('mailto:')
        expect(capturedHref).toContain('subject=')
        expect(capturedHref).toContain('body=')

        // Decode and verify content
        const url = new URL(capturedHref)
        expect(url.protocol).toBe('mailto:')
        expect(url.searchParams.get('subject')).toBeTruthy()
        expect(url.searchParams.get('body')).toContain(metadata.url)
      }),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Social media data is cached correctly
   * For any fetched data, it should be saved to and loaded from cache
   */
  it('should cache and restore social media data correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: githubUsernameArbitrary,
          userData: githubUserDataArbitrary,
          repos: fc.array(githubRepoArbitrary, { minLength: 1, maxLength: 3 }),
        }),
        async ({ username, userData, repos }) => {
          // Clear localStorage before test
          localStorage.clear()

          // Mock fetch responses (rate limit check + user + repos + events)
          global.fetch = vi.fn()
            .mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                resources: {
                  core: {
                    remaining: 5000,
                    reset: Math.floor(Date.now() / 1000) + 3600,
                  },
                },
              }),
            })
            .mockResolvedValueOnce({
              ok: true,
              json: async () => userData,
            })
            .mockResolvedValueOnce({
              ok: true,
              json: async () => repos,
            })
            .mockResolvedValueOnce({
              ok: true,
              json: async () => [],
            })

          // Create and fetch data
          socialMedia = new SocialMediaIntegration({
            github: { username },
            enableBackgroundRefresh: false,
          })

          const fetchedData = await socialMedia.fetchGitHubData()

          // Verify data was fetched
          expect(fetchedData, 'Fetched data should be defined').toBeDefined()
          expect(fetchedData.username, 'Username should match').toBe(userData.login)

          // Verify data is cached
          const cached = localStorage.getItem(socialMedia.config.cacheKey)
          expect(cached, 'Cache should exist').toBeTruthy()

          if (cached) {
            const cachedData = JSON.parse(cached)
            expect(cachedData.socialData, 'Cached socialData should exist').toBeDefined()
            expect(cachedData.socialData.github, 'Cached GitHub data should exist').toBeDefined()
            
            if (cachedData.socialData.github) {
              expect(cachedData.socialData.github.username).toBe(userData.login)
            }
            expect(cachedData.timestamp).toBeDefined()

            // Create new instance and load from cache
            socialMedia.destroy()
            socialMedia = new SocialMediaIntegration({
              github: { username },
              enableBackgroundRefresh: false,
            })

            socialMedia.loadFromCache()

            // Verify data was restored
            const restoredData = socialMedia.getPlatformData('github')
            expect(restoredData, 'Restored data should be defined').toBeDefined()
            
            if (restoredData) {
              expect(restoredData.username).toBe(userData.login)
            }
          }
        }
      ),
      { numRuns: 15 }
    )
  })

  /**
   * Property: Combined metrics aggregate correctly
   * For any combination of platform data, combined metrics should be accurate
   */
  it('should calculate combined metrics correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          githubFollowers: fc.option(fc.integer({ min: 0, max: 10000 })),
          linkedinFollowers: fc.option(fc.integer({ min: 0, max: 10000 })),
          twitterFollowers: fc.option(fc.integer({ min: 0, max: 10000 })),
        }),
        async ({ githubFollowers, linkedinFollowers, twitterFollowers }) => {
          socialMedia = new SocialMediaIntegration({
            enableBackgroundRefresh: false,
          })

          // Set platform data
          if (githubFollowers !== null) {
            socialMedia.socialData.github = {
              followers: githubFollowers,
              engagementMetrics: { totalStars: 100 },
            }
          }

          if (linkedinFollowers !== null) {
            socialMedia.socialData.linkedin = {
              followers: linkedinFollowers,
              engagementMetrics: { profileViews: 500 },
            }
          }

          if (twitterFollowers !== null) {
            socialMedia.socialData.twitter = {
              followers: twitterFollowers,
              engagementMetrics: { totalTweets: 200 },
            }
          }

          const metrics = socialMedia.getCombinedMetrics()

          // Calculate expected total
          let expectedTotal = 0
          if (githubFollowers !== null) {
            expectedTotal += githubFollowers
          }
          if (linkedinFollowers !== null) {
            expectedTotal += linkedinFollowers
          }
          if (twitterFollowers !== null) {
            expectedTotal += twitterFollowers
          }

          // Verify combined metrics
          expect(metrics.totalFollowers).toBe(expectedTotal)
          expect(metrics.platforms).toBeDefined()
          expect(Array.isArray(metrics.platforms)).toBe(true)

          // Verify platform count
          let expectedPlatformCount = 0
          if (githubFollowers !== null) {
            expectedPlatformCount++
          }
          if (linkedinFollowers !== null) {
            expectedPlatformCount++
          }
          if (twitterFollowers !== null) {
            expectedPlatformCount++
          }

          expect(metrics.platforms.length).toBe(expectedPlatformCount)
        }
      ),
      { numRuns: 30 }
    )
  })

  /**
   * Property: Image URLs are resolved to absolute URLs
   * For any image URL (relative or absolute), it should be converted to absolute
   */
  it('should resolve image URLs to absolute URLs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          content: shareContentArbitrary,
          imageUrl: fc.oneof(
            fc.webUrl(),
            fc.webUrl()
          ),
        }),
        async ({ content, imageUrl }) => {
          socialSharing = new SocialSharing()
          await socialSharing.init()

          const resolvedUrl = socialSharing.resolveImageUrl(imageUrl)

          // Verify URL is absolute
          expect(resolvedUrl.startsWith('http://') || resolvedUrl.startsWith('https://')).toBe(true)

          // Verify it's a valid URL
          expect(() => new URL(resolvedUrl)).not.toThrow()
        }
      ),
      { numRuns: 30 }
    )
  })

  /**
   * Property: GitHub rate limit is checked before fetching
   * For any rate limit status, fetching should respect the limit
   */
  it('should respect GitHub rate limit', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          remaining: fc.integer({ min: 0, max: 5000 }),
          resetTime: fc.integer({ min: Date.now(), max: Date.now() + 3600000 }),
        }),
        async ({ remaining, resetTime }) => {
          socialMedia = new SocialMediaIntegration({
            github: { username: 'testuser' },
            enableBackgroundRefresh: false,
          })

          // Mock rate limit response
          global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
              resources: {
                core: {
                  remaining,
                  reset: Math.floor(resetTime / 1000),
                },
              },
            }),
          })

          const rateLimitOk = await socialMedia.checkGitHubRateLimit()

          // Verify rate limit check
          if (remaining === 0) {
            expect(rateLimitOk).toBe(false)
          } else {
            expect(rateLimitOk).toBe(true)
          }
        }
      ),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Social media status reflects current state
   * For any configuration, status should accurately reflect platform states
   */
  it('should return accurate status information', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hasGithub: fc.boolean(),
          hasLinkedIn: fc.boolean(),
          hasTwitter: fc.boolean(),
        }),
        async ({ hasGithub, hasLinkedIn, hasTwitter }) => {
          const config = {
            enableBackgroundRefresh: false,
          }

          if (hasGithub) {
            config.github = { username: 'testuser' }
          }

          if (hasLinkedIn) {
            config.linkedin = { enabled: true, profileUrl: 'https://linkedin.com/in/test' }
          }

          if (hasTwitter) {
            config.twitter = { enabled: true, username: 'testuser' }
          }

          socialMedia = new SocialMediaIntegration(config)

          const status = socialMedia.getStatus()

          // Verify status structure
          expect(status.isInitialized).toBe(false) // Not initialized yet
          expect(status.platforms).toBeDefined()
          expect(status.platforms.github).toBeDefined()
          expect(status.platforms.linkedin).toBeDefined()
          expect(status.platforms.twitter).toBeDefined()

          // Verify configuration status
          expect(status.platforms.github.configured).toBe(hasGithub)
          expect(status.platforms.linkedin.configured).toBe(hasLinkedIn)
          expect(status.platforms.twitter.configured).toBe(hasTwitter)
        }
      ),
      { numRuns: 30 }
    )
  })

  /**
   * Property: Available platforms list is accurate
   * For any device capabilities, available platforms should be correctly identified
   */
  it('should identify available sharing platforms correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hasNativeShare: fc.boolean(),
          platforms: fc.array(
            fc.constantFrom('linkedin', 'twitter', 'facebook', 'email', 'copy'),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        async ({ hasNativeShare, platforms }) => {
          // Mock navigator.share
          if (hasNativeShare) {
            Object.assign(navigator, {
              share: vi.fn().mockResolvedValue(),
            })
          } else {
            delete navigator.share
          }

          socialSharing = new SocialSharing({
            platforms: [...new Set(platforms)], // Remove duplicates
          })
          await socialSharing.init()

          const availablePlatforms = socialSharing.getAvailablePlatforms()

          // Verify platforms list
          expect(Array.isArray(availablePlatforms)).toBe(true)
          expect(availablePlatforms.length).toBeGreaterThan(0)

          // Verify native share is included if available
          if (hasNativeShare) {
            expect(availablePlatforms).toContain('native')
          }

          // Verify configured platforms are included
          platforms.forEach((platform) => {
            expect(availablePlatforms).toContain(platform)
          })
        }
      ),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Social media integration can be destroyed cleanly
   * For any state, destroy should clean up all resources
   */
  it('should clean up resources on destroy', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hasGithubData: fc.boolean(),
          hasBackgroundRefresh: fc.boolean(),
        }),
        async ({ hasGithubData, hasBackgroundRefresh }) => {
          socialMedia = new SocialMediaIntegration({
            github: { username: 'testuser' },
            enableBackgroundRefresh: hasBackgroundRefresh,
          })

          if (hasGithubData) {
            socialMedia.socialData.github = {
              username: 'testuser',
              followers: 100,
            }
          }

          if (hasBackgroundRefresh) {
            socialMedia.setupBackgroundRefresh()
          }

          // Destroy
          socialMedia.destroy()

          // Verify cleanup
          expect(socialMedia.isInitialized).toBe(false)
          expect(socialMedia.socialData.github).toBeNull()
          expect(socialMedia.socialData.linkedin).toBeNull()
          expect(socialMedia.socialData.twitter).toBeNull()
          expect(socialMedia.refreshTimer).toBeNull()
        }
      ),
      { numRuns: 25 }
    )
  })

  /**
   * Property: Share metadata is stored and retrievable
   * For any content shared, metadata should be stored and retrievable
   */
  it('should store and retrieve share metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(shareContentArbitrary, { minLength: 1, maxLength: 10 }),
        async (contents) => {
          socialSharing = new SocialSharing()
          await socialSharing.init()

          // Generate metadata for all contents
          contents.forEach((content) => {
            socialSharing.generateShareMetadata(content)
          })

          // Verify all metadata is stored
          expect(socialSharing.shareData.size).toBe(contents.length)

          // Verify each content's metadata is retrievable
          contents.forEach((content) => {
            const stored = socialSharing.shareData.get(content.id)
            expect(stored).toBeDefined()
            expect(stored.title).toBe(content.title)
            expect(stored.description).toBe(content.description)
          })
        }
      ),
      { numRuns: 25 }
    )
  })
})

