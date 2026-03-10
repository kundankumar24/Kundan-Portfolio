#!/usr/bin/env node

/**
 * Build Validation Script
 * Validates the production build for completeness and quality
 * Requirements: 12.1, 12.3
 */

import { existsSync, statSync, readdirSync, readFileSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DIST_DIR = join(__dirname, '..', 'dist')
const MAX_JS_SIZE = 500 * 1024 // 500KB
const MAX_CSS_SIZE = 200 * 1024 // 200KB
const MAX_TOTAL_SIZE = 5 * 1024 * 1024 // 5MB

class BuildValidator {
  constructor() {
    this.errors = []
    this.warnings = []
    this.stats = {
      totalSize: 0,
      jsSize: 0,
      cssSize: 0,
      imageSize: 0,
      fileCount: 0,
    }
  }

  /**
   * Run all validation checks
   */
  validate() {
    console.log('🔍 Validating build output...\n')

    this.checkDistExists()
    this.checkRequiredFiles()
    this.analyzeAssets()
    this.checkFileIntegrity()
    this.printReport()

    return this.errors.length === 0
  }

  /**
   * Check if dist directory exists
   */
  checkDistExists() {
    if (!existsSync(DIST_DIR)) {
      this.errors.push('dist directory does not exist')
      return false
    }
    return true
  }

  /**
   * Check for required files
   */
  checkRequiredFiles() {
    const requiredFiles = [
      'index.html',
      'sw.js',
      'offline.html',
      'manifest.json',
    ]

    requiredFiles.forEach(file => {
      const filePath = join(DIST_DIR, file)
      if (!existsSync(filePath)) {
        this.errors.push(`Required file missing: ${file}`)
      } else {
        console.log(`✓ Found required file: ${file}`)
      }
    })
  }

  /**
   * Analyze asset sizes and structure
   */
  analyzeAssets() {
    if (!existsSync(DIST_DIR)) return

    this.walkDirectory(DIST_DIR)

    console.log('\n📊 Asset Analysis:')
    console.log(`  Total files: ${this.stats.fileCount}`)
    console.log(`  Total size: ${this.formatSize(this.stats.totalSize)}`)
    console.log(`  JavaScript: ${this.formatSize(this.stats.jsSize)}`)
    console.log(`  CSS: ${this.formatSize(this.stats.cssSize)}`)
    console.log(`  Images: ${this.formatSize(this.stats.imageSize)}`)

    // Check size limits
    if (this.stats.totalSize > MAX_TOTAL_SIZE) {
      this.warnings.push(
        `Total build size (${this.formatSize(this.stats.totalSize)}) exceeds recommended limit (${this.formatSize(MAX_TOTAL_SIZE)})`
      )
    }

    // Check individual JS files
    this.checkJavaScriptSizes()

    // Check individual CSS files
    this.checkCSSizes()
  }

  /**
   * Walk directory recursively
   */
  walkDirectory(dir) {
    const files = readdirSync(dir)

    files.forEach(file => {
      const filePath = join(dir, file)
      const stat = statSync(filePath)

      if (stat.isDirectory()) {
        this.walkDirectory(filePath)
      } else {
        this.stats.fileCount++
        this.stats.totalSize += stat.size

        const ext = extname(file).toLowerCase()

        if (ext === '.js') {
          this.stats.jsSize += stat.size
        } else if (ext === '.css') {
          this.stats.cssSize += stat.size
        } else if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.avif'].includes(ext)) {
          this.stats.imageSize += stat.size
        }
      }
    })
  }

  /**
   * Check JavaScript file sizes
   */
  checkJavaScriptSizes() {
    const assetsDir = join(DIST_DIR, 'assets', 'js')
    if (!existsSync(assetsDir)) return

    const jsFiles = readdirSync(assetsDir).filter(f => f.endsWith('.js'))

    jsFiles.forEach(file => {
      const filePath = join(assetsDir, file)
      const size = statSync(filePath).size

      if (size > MAX_JS_SIZE) {
        this.warnings.push(
          `JavaScript file ${file} (${this.formatSize(size)}) exceeds recommended size (${this.formatSize(MAX_JS_SIZE)})`
        )
      }
    })
  }

  /**
   * Check CSS file sizes
   */
  checkCSSizes() {
    const assetsDir = join(DIST_DIR, 'assets')
    if (!existsSync(assetsDir)) return

    const cssFiles = readdirSync(assetsDir).filter(f => f.endsWith('.css'))

    cssFiles.forEach(file => {
      const filePath = join(assetsDir, file)
      const size = statSync(filePath).size

      if (size > MAX_CSS_SIZE) {
        this.warnings.push(
          `CSS file ${file} (${this.formatSize(size)}) exceeds recommended size (${this.formatSize(MAX_CSS_SIZE)})`
        )
      }
    })
  }

  /**
   * Check file integrity
   */
  checkFileIntegrity() {
    console.log('\n🔐 Checking file integrity...')

    // Check index.html
    const indexPath = join(DIST_DIR, 'index.html')
    if (existsSync(indexPath)) {
      const content = readFileSync(indexPath, 'utf-8')

      // Check for essential elements
      if (!content.includes('<html')) {
        this.errors.push('index.html missing <html> tag')
      }
      if (!content.includes('<head>')) {
        this.errors.push('index.html missing <head> tag')
      }
      if (!content.includes('<body>')) {
        this.errors.push('index.html missing <body> tag')
      }

      // Check for meta tags
      if (!content.includes('viewport')) {
        this.warnings.push('index.html missing viewport meta tag')
      }
      if (!content.includes('description')) {
        this.warnings.push('index.html missing description meta tag')
      }

      // Check for manifest link
      if (!content.includes('manifest.json')) {
        this.warnings.push('index.html missing manifest.json link')
      }

      console.log('✓ index.html structure validated')
    }

    // Check service worker
    const swPath = join(DIST_DIR, 'sw.js')
    if (existsSync(swPath)) {
      const content = readFileSync(swPath, 'utf-8')

      if (!content.includes('install')) {
        this.warnings.push('Service worker missing install event')
      }
      if (!content.includes('fetch')) {
        this.warnings.push('Service worker missing fetch event')
      }

      console.log('✓ Service worker structure validated')
    }

    // Check manifest
    const manifestPath = join(DIST_DIR, 'manifest.json')
    if (existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))

        if (!manifest.name) {
          this.warnings.push('manifest.json missing name')
        }
        if (!manifest.short_name) {
          this.warnings.push('manifest.json missing short_name')
        }
        if (!manifest.start_url) {
          this.warnings.push('manifest.json missing start_url')
        }
        if (!manifest.icons || manifest.icons.length === 0) {
          this.warnings.push('manifest.json missing icons')
        }

        console.log('✓ manifest.json structure validated')
      } catch (error) {
        this.errors.push(`manifest.json is invalid JSON: ${error.message}`)
      }
    }
  }

  /**
   * Format bytes to human-readable size
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  /**
   * Print validation report
   */
  printReport() {
    console.log('\n' + '='.repeat(50))
    console.log('📋 Validation Report')
    console.log('='.repeat(50))

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ Build validation passed with no issues!\n')
      return
    }

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:')
      this.errors.forEach(error => console.log(`  - ${error}`))
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      this.warnings.forEach(warning => console.log(`  - ${warning}`))
    }

    console.log('\n' + '='.repeat(50) + '\n')

    if (this.errors.length > 0) {
      console.log('❌ Build validation FAILED\n')
      process.exit(1)
    } else {
      console.log('✅ Build validation PASSED (with warnings)\n')
    }
  }
}

// Run validation
const validator = new BuildValidator()
const success = validator.validate()

if (!success) {
  process.exit(1)
}
