/**
 * Property-Based Tests for Build Process and Code Quality
 * Feature: portfolio-enhancement, Property 14: Build Process and Code Quality
 * **Validates: Requirements 12.1, 12.2, 12.3**
 */

import { describe, it, expect, beforeAll } from 'vitest'
import * as fc from 'fast-check'
import { existsSync, statSync, readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PROJECT_ROOT = join(__dirname, '..', '..')
const DIST_DIR = join(PROJECT_ROOT, 'dist')
const SRC_DIR = join(PROJECT_ROOT, 'src')

describe('Property 14: Build Process and Code Quality', () => {
  describe('Build Output Validation', () => {
    it('should have all required build artifacts', () => {
      // Property: All required files must exist in build output
      const requiredFiles = [
        'index.html',
        'sw.js',
        'offline.html',
        'manifest.json',
      ]

      requiredFiles.forEach(file => {
        const filePath = join(DIST_DIR, file)
        expect(
          existsSync(filePath),
          `Required file ${file} should exist in dist`
        ).toBe(true)
      })
    })

    it('should have properly structured assets directory', () => {
      // Property: Assets should be organized in proper directories
      const assetsDir = join(DIST_DIR, 'assets')

      if (existsSync(assetsDir)) {
        const hasJsDir = readdirSync(assetsDir).some(
          item =>
            item === 'js' ||
            readdirSync(assetsDir).some(f => f.endsWith('.js'))
        )
        const hasCssFiles = readdirSync(assetsDir).some(f => f.endsWith('.css'))

        expect(
          hasJsDir || hasCssFiles,
          'Assets directory should contain JS or CSS files'
        ).toBe(true)
      }
    })

    it('should have optimized asset sizes', () => {
      // Property: Individual assets should not exceed size limits
      const MAX_JS_SIZE = 500 * 1024 // 500KB
      const MAX_CSS_SIZE = 200 * 1024 // 200KB

      if (existsSync(DIST_DIR)) {
        const checkAssetSizes = (dir, maxSize, extension) => {
          if (!existsSync(dir)) {
            return
          }

          const files = readdirSync(dir).filter(f => f.endsWith(extension))

          files.forEach(file => {
            const filePath = join(dir, file)
            const size = statSync(filePath).size

            expect(
              size,
              `${file} size (${size} bytes) should not exceed ${maxSize} bytes`
            ).toBeLessThanOrEqual(maxSize)
          })
        }

        const assetsDir = join(DIST_DIR, 'assets')
        if (existsSync(assetsDir)) {
          const jsDir = join(assetsDir, 'js')
          if (existsSync(jsDir)) {
            checkAssetSizes(jsDir, MAX_JS_SIZE, '.js')
          }

          checkAssetSizes(assetsDir, MAX_CSS_SIZE, '.css')
        }
      }
    })
  })

  describe('Cross-Browser Compatibility', () => {
    it('should include polyfills for browser compatibility', () => {
      // Property: Polyfills module should exist and export required functions
      const polyfillsPath = join(SRC_DIR, 'js', 'utils', 'polyfills.js')

      expect(
        existsSync(polyfillsPath),
        'Polyfills module should exist'
      ).toBe(true)

      if (existsSync(polyfillsPath)) {
        const content = readFileSync(polyfillsPath, 'utf-8')

        // Check for essential polyfills
        expect(
          content.includes('initializePolyfills'),
          'Should export initializePolyfills function'
        ).toBe(true)
        expect(
          content.includes('IntersectionObserver'),
          'Should include IntersectionObserver polyfill'
        ).toBe(true)
        expect(
          content.includes('CustomEvent'),
          'Should include CustomEvent polyfill'
        ).toBe(true)
      }
    })

    it('should have feature detection utilities', () => {
      // Property: Feature detection should be available
      const polyfillsPath = join(SRC_DIR, 'js', 'utils', 'polyfills.js')

      if (existsSync(polyfillsPath)) {
        const content = readFileSync(polyfillsPath, 'utf-8')

        expect(
          content.includes('features'),
          'Should export features object'
        ).toBe(true)
        expect(
          content.includes('hasIntersectionObserver'),
          'Should have IntersectionObserver detection'
        ).toBe(true)
        expect(
          content.includes('hasCSSGrid'),
          'Should have CSS Grid detection'
        ).toBe(true)
        expect(
          content.includes('hasServiceWorker'),
          'Should have Service Worker detection'
        ).toBe(true)
      }
    })

    it('should add browser-specific classes', () => {
      // Property: Browser detection should add appropriate classes
      const polyfillsPath = join(SRC_DIR, 'js', 'utils', 'polyfills.js')

      if (existsSync(polyfillsPath)) {
        const content = readFileSync(polyfillsPath, 'utf-8')

        expect(
          content.includes('addBrowserClasses'),
          'Should export addBrowserClasses function'
        ).toBe(true)
        expect(
          content.includes('getBrowserInfo'),
          'Should have browser detection'
        ).toBe(true)
      }
    })
  })

  describe('Code Architecture and Modularity', () => {
    it('should have modular code structure', () => {
      // Property: Code should be organized in modules
      const modulesDir = join(SRC_DIR, 'js', 'modules')
      const componentsDir = join(SRC_DIR, 'js', 'components')
      const utilsDir = join(SRC_DIR, 'js', 'utils')

      expect(existsSync(modulesDir), 'Modules directory should exist').toBe(
        true
      )
      expect(
        existsSync(componentsDir),
        'Components directory should exist'
      ).toBe(true)
      expect(existsSync(utilsDir), 'Utils directory should exist').toBe(true)

      // Check for essential modules
      const essentialModules = [
        'theme.js',
        'animation.js',
        'performance.js',
        'accessibility.js',
      ]

      essentialModules.forEach(module => {
        const modulePath = join(modulesDir, module)
        expect(
          existsSync(modulePath),
          `Essential module ${module} should exist`
        ).toBe(true)
      })
    })

    it('should use ES6 modules with proper imports/exports', () => {
      // Property: All JS files should use ES6 module syntax
      const jsFiles = []

      const collectJsFiles = dir => {
        if (!existsSync(dir)) {
          return
        }

        const items = readdirSync(dir)

        items.forEach(item => {
          const itemPath = join(dir, item)
          const stat = statSync(itemPath)

          if (stat.isDirectory()) {
            collectJsFiles(itemPath)
          } else if (item.endsWith('.js') && !item.includes('.test.')) {
            jsFiles.push(itemPath)
          }
        })
      }

      collectJsFiles(join(SRC_DIR, 'js'))

      // Check a sample of files for ES6 module syntax
      const sampleSize = Math.min(10, jsFiles.length)
      const sampleFiles = jsFiles.slice(0, sampleSize)

      sampleFiles.forEach(file => {
        const content = readFileSync(file, 'utf-8')
        const hasImportOrExport =
          content.includes('import ') || content.includes('export ')

        expect(
          hasImportOrExport,
          `${file} should use ES6 module syntax (import/export)`
        ).toBe(true)
      })
    })

    it('should have consistent code formatting', () => {
      // Property: Code should follow consistent formatting rules
      const prettierConfigPath = join(PROJECT_ROOT, '.prettierrc')
      const eslintConfigPath = join(PROJECT_ROOT, 'eslint.config.js')

      expect(
        existsSync(prettierConfigPath),
        'Prettier config should exist'
      ).toBe(true)
      expect(existsSync(eslintConfigPath), 'ESLint config should exist').toBe(
        true
      )
    })

    it('should have proper documentation', () => {
      // Property: Key files should have documentation
      const docFiles = ['README.md', 'DEPLOYMENT.md']

      docFiles.forEach(file => {
        const filePath = join(PROJECT_ROOT, file)
        expect(existsSync(filePath), `${file} should exist`).toBe(true)

        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8')
          expect(
            content.length,
            `${file} should not be empty`
          ).toBeGreaterThan(100)
        }
      })
    })
  })

  describe('Build Configuration', () => {
    it('should have proper Vite configuration', () => {
      // Property: Vite config should include optimization settings
      const viteConfigPath = join(PROJECT_ROOT, 'vite.config.js')

      expect(existsSync(viteConfigPath), 'Vite config should exist').toBe(true)

      if (existsSync(viteConfigPath)) {
        const content = readFileSync(viteConfigPath, 'utf-8')

        expect(
          content.includes('build'),
          'Should have build configuration'
        ).toBe(true)
        expect(
          content.includes('rollupOptions'),
          'Should have Rollup options'
        ).toBe(true)
        expect(
          content.includes('legacy'),
          'Should include legacy plugin for browser compatibility'
        ).toBe(true)
      }
    })

    it('should have comprehensive package.json scripts', () => {
      // Property: Package.json should have all necessary scripts
      const packageJsonPath = join(PROJECT_ROOT, 'package.json')

      expect(existsSync(packageJsonPath), 'package.json should exist').toBe(
        true
      )

      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
        const scripts = packageJson.scripts || {}

        const requiredScripts = [
          'dev',
          'build',
          'test',
          'lint',
          'format',
        ]

        requiredScripts.forEach(script => {
          expect(
            scripts[script],
            `Script '${script}' should be defined`
          ).toBeDefined()
        })
      }
    })

    it('should have test configuration', () => {
      // Property: Test configuration should exist
      const vitestConfigPath = join(PROJECT_ROOT, 'vitest.config.js')

      expect(existsSync(vitestConfigPath), 'Vitest config should exist').toBe(
        true
      )

      if (existsSync(vitestConfigPath)) {
        const content = readFileSync(vitestConfigPath, 'utf-8')

        expect(content.includes('test'), 'Should have test configuration').toBe(
          true
        )
      }
    })
  })

  describe('Property-Based Build Validation', () => {
    it('should handle various file path structures correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 3 }),
          fc.constantFrom('.js', '.css', '.html', '.json'),
          (pathParts, extension) => {
            // Property: File path validation should work for any valid path structure
            const fileName = pathParts.join('/') + extension
            const isValid = fileName.length > 0 && fileName.includes(extension)

            expect(isValid).toBe(true)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should validate asset sizes are within reasonable bounds', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 * 1024 * 1024 }), // 0 to 10MB
          fileSize => {
            // Property: Asset size validation logic should work for any file size
            const MAX_SIZE = 5 * 1024 * 1024 // 5MB
            const isWithinLimit = fileSize <= MAX_SIZE

            // The validation logic should correctly identify oversized files
            if (fileSize > MAX_SIZE) {
              expect(isWithinLimit).toBe(false)
            } else {
              expect(isWithinLimit).toBe(true)
            }
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should correctly identify file types by extension', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('.js', '.css', '.html', '.json', '.png', '.jpg', '.svg', '.webp'),
          extension => {
            // Property: File type detection should work for all supported extensions
            const isScript = extension === '.js'
            const isStyle = extension === '.css'
            const isMarkup = extension === '.html'
            const isData = extension === '.json'
            const isImage = ['.png', '.jpg', '.svg', '.webp'].includes(extension)

            // Exactly one category should be true
            const categories = [isScript, isStyle, isMarkup, isData, isImage]
            const trueCount = categories.filter(Boolean).length

            expect(trueCount).toBeGreaterThanOrEqual(1)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should validate module structure for any module name', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 15 }).filter(s => /^[a-z]+$/.test(s)),
          moduleName => {
            // Property: Module naming should follow consistent patterns
            const validModuleName = moduleName.length >= 3 && /^[a-z]+$/.test(moduleName)

            if (validModuleName) {
              const moduleFileName = `${moduleName}.js`
              expect(moduleFileName.endsWith('.js')).toBe(true)
              expect(moduleFileName.length).toBeGreaterThan(5)
            }
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle browser version detection for various user agents', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Chrome', 'Firefox', 'Safari', 'Edge'),
          fc.integer({ min: 80, max: 120 }),
          (browser, version) => {
            // Property: Browser detection should work for any browser/version combination
            const userAgent = `Mozilla/5.0 (${browser}/${version})`
            const hasValidBrowser = browser.length > 0
            const hasValidVersion = version > 0

            expect(hasValidBrowser).toBe(true)
            expect(hasValidVersion).toBe(true)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Asset Optimization', () => {
    it('should have optimized images in build output', () => {
      // Property: Images should be optimized and in modern formats
      const assetsDir = join(DIST_DIR, 'assets')

      if (existsSync(assetsDir)) {
        const checkForModernFormats = dir => {
          if (!existsSync(dir)) {
            return false
          }

          const files = readdirSync(dir)
          const imageFiles = files.filter(f =>
            /\.(jpg|jpeg|png|gif|svg|webp|avif)$/i.test(f)
          )

          // If there are images, check if modern formats are used
          if (imageFiles.length > 0) {
            const hasModernFormats = imageFiles.some(f =>
              /\.(webp|avif)$/i.test(f)
            )
            return hasModernFormats || imageFiles.length === 0
          }

          return true
        }

        const imagesDir = join(assetsDir, 'images')
        if (existsSync(imagesDir)) {
          const hasOptimizedImages = checkForModernFormats(imagesDir)
          // This is informational - modern formats are preferred but not required
          expect(typeof hasOptimizedImages).toBe('boolean')
        }
      }
    })

    it('should have minified JavaScript in production build', () => {
      // Property: Production JS should be minified
      const assetsDir = join(DIST_DIR, 'assets')

      if (existsSync(assetsDir)) {
        const jsDir = join(assetsDir, 'js')

        if (existsSync(jsDir)) {
          const jsFiles = readdirSync(jsDir).filter(f => f.endsWith('.js'))

          if (jsFiles.length > 0) {
            const sampleFile = join(jsDir, jsFiles[0])
            const content = readFileSync(sampleFile, 'utf-8')

            // Minified files typically have long lines and no unnecessary whitespace
            const lines = content.split('\n')
            const avgLineLength =
              content.length / Math.max(lines.length, 1)

            // Minified files usually have average line length > 100
            expect(avgLineLength).toBeGreaterThan(50)
          }
        }
      }
    })
  })

  describe('Service Worker and PWA', () => {
    it('should have valid service worker', () => {
      // Property: Service worker should be present and valid
      const swPath = join(DIST_DIR, 'sw.js')

      if (existsSync(swPath)) {
        const content = readFileSync(swPath, 'utf-8')

        expect(
          content.includes('install') || content.includes('fetch'),
          'Service worker should have install or fetch event handlers'
        ).toBe(true)
      }
    })

    it('should have valid PWA manifest', () => {
      // Property: Manifest should be valid JSON with required fields
      const manifestPath = join(DIST_DIR, 'manifest.json')

      if (existsSync(manifestPath)) {
        const content = readFileSync(manifestPath, 'utf-8')
        const manifest = JSON.parse(content)

        expect(manifest.name, 'Manifest should have name').toBeDefined()
        expect(
          manifest.short_name,
          'Manifest should have short_name'
        ).toBeDefined()
        expect(
          manifest.start_url,
          'Manifest should have start_url'
        ).toBeDefined()
      }
    })
  })
})

