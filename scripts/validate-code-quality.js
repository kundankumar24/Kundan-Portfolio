#!/usr/bin/env node

/**
 * Code Quality and Architecture Validation Script
 * Validates code structure, modularity, and quality standards
 * Requirements: 12.3, 12.5
 */

import { existsSync, readdirSync, statSync, readFileSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PROJECT_ROOT = join(__dirname, '..')
const SRC_DIR = join(PROJECT_ROOT, 'src')

class CodeQualityValidator {
  constructor() {
    this.errors = []
    this.warnings = []
    this.stats = {
      totalFiles: 0,
      totalLines: 0,
      moduleCount: 0,
      componentCount: 0,
      testCount: 0,
      avgFileSize: 0,
      avgLinesPerFile: 0,
    }
  }

  /**
   * Run all validation checks
   */
  validate() {
    console.log('🔍 Validating code quality and architecture...\n')

    this.checkProjectStructure()
    this.analyzeCodebase()
    this.checkModularity()
    this.checkDocumentation()
    this.checkTestCoverage()
    this.printReport()

    return this.errors.length === 0
  }

  /**
   * Check project structure
   */
  checkProjectStructure() {
    console.log('📁 Checking project structure...')

    const requiredDirs = [
      'src/js/modules',
      'src/js/components',
      'src/js/utils',
      'src/css',
      'src/test',
      'public',
    ]

    requiredDirs.forEach(dir => {
      const dirPath = join(PROJECT_ROOT, dir)
      if (!existsSync(dirPath)) {
        this.errors.push(`Required directory missing: ${dir}`)
      } else {
        console.log(`  ✓ ${dir}`)
      }
    })

    // Check for configuration files
    const configFiles = [
      'package.json',
      'vite.config.js',
      'vitest.config.js',
      'eslint.config.js',
      '.prettierrc',
    ]

    configFiles.forEach(file => {
      const filePath = join(PROJECT_ROOT, file)
      if (!existsSync(filePath)) {
        this.warnings.push(`Configuration file missing: ${file}`)
      }
    })
  }

  /**
   * Analyze codebase statistics
   */
  analyzeCodebase() {
    console.log('\n📊 Analyzing codebase...')

    const jsDir = join(SRC_DIR, 'js')
    if (!existsSync(jsDir)) {
      this.errors.push('src/js directory not found')
      return
    }

    this.walkDirectory(jsDir)

    this.stats.avgFileSize = this.stats.totalFiles > 0
      ? Math.round(this.stats.totalLines / this.stats.totalFiles)
      : 0

    console.log(`  Total files: ${this.stats.totalFiles}`)
    console.log(`  Total lines: ${this.stats.totalLines}`)
    console.log(`  Modules: ${this.stats.moduleCount}`)
    console.log(`  Components: ${this.stats.componentCount}`)
    console.log(`  Tests: ${this.stats.testCount}`)
    console.log(`  Avg lines per file: ${this.stats.avgFileSize}`)

    // Check for overly large files
    if (this.stats.avgFileSize > 500) {
      this.warnings.push(
        `Average file size (${this.stats.avgFileSize} lines) is quite large. Consider breaking down large files.`
      )
    }
  }

  /**
   * Walk directory recursively
   */
  walkDirectory(dir) {
    if (!existsSync(dir)) return

    const items = readdirSync(dir)

    items.forEach(item => {
      const itemPath = join(dir, item)
      const stat = statSync(itemPath)

      if (stat.isDirectory()) {
        // Track directory types
        if (item === 'modules') {
          this.stats.moduleCount = readdirSync(itemPath).filter(f =>
            f.endsWith('.js') && !f.includes('.test.')
          ).length
        } else if (item === 'components') {
          this.stats.componentCount = readdirSync(itemPath).filter(f =>
            f.endsWith('.js') && !f.includes('.test.')
          ).length
        }

        this.walkDirectory(itemPath)
      } else if (item.endsWith('.js')) {
        this.stats.totalFiles++

        if (item.includes('.test.')) {
          this.stats.testCount++
        }

        // Count lines
        const content = readFileSync(itemPath, 'utf-8')
        const lines = content.split('\n').length
        this.stats.totalLines += lines

        // Check for overly large files
        if (lines > 1000) {
          this.warnings.push(
            `File ${itemPath.replace(PROJECT_ROOT, '')} has ${lines} lines (consider splitting)`
          )
        }
      }
    })
  }

  /**
   * Check modularity
   */
  checkModularity() {
    console.log('\n🧩 Checking modularity...')

    const modulesDir = join(SRC_DIR, 'js', 'modules')
    if (!existsSync(modulesDir)) {
      this.errors.push('Modules directory not found')
      return
    }

    const modules = readdirSync(modulesDir).filter(f =>
      f.endsWith('.js') && !f.includes('.test.')
    )

    if (modules.length === 0) {
      this.errors.push('No modules found')
      return
    }

    console.log(`  Found ${modules.length} modules`)

    // Check each module for proper structure
    modules.forEach(module => {
      const modulePath = join(modulesDir, module)
      const content = readFileSync(modulePath, 'utf-8')

      // Check for exports
      if (!content.includes('export')) {
        this.warnings.push(`Module ${module} has no exports`)
      }

      // Check for class or function definitions
      const hasClass = content.includes('class ')
      const hasFunction = content.includes('function ') || content.includes('=>')

      if (!hasClass && !hasFunction) {
        this.warnings.push(`Module ${module} has no class or function definitions`)
      }

      // Check for documentation
      if (!content.includes('/**')) {
        this.warnings.push(`Module ${module} lacks JSDoc documentation`)
      }
    })
  }

  /**
   * Check documentation
   */
  checkDocumentation() {
    console.log('\n📝 Checking documentation...')

    const docFiles = [
      'README.md',
      'DEPLOYMENT.md',
    ]

    docFiles.forEach(file => {
      const filePath = join(PROJECT_ROOT, file)
      if (!existsSync(filePath)) {
        this.warnings.push(`Documentation file missing: ${file}`)
      } else {
        const content = readFileSync(filePath, 'utf-8')
        if (content.length < 100) {
          this.warnings.push(`Documentation file ${file} is too short`)
        } else {
          console.log(`  ✓ ${file}`)
        }
      }
    })

    // Check for inline documentation
    const jsDir = join(SRC_DIR, 'js')
    if (existsSync(jsDir)) {
      const jsFiles = this.getAllJsFiles(jsDir)
      const documentedFiles = jsFiles.filter(file => {
        const content = readFileSync(file, 'utf-8')
        return content.includes('/**') || content.includes('//')
      })

      const docPercentage = jsFiles.length > 0
        ? Math.round((documentedFiles.length / jsFiles.length) * 100)
        : 0

      console.log(`  Code documentation: ${docPercentage}% of files`)

      if (docPercentage < 50) {
        this.warnings.push(
          `Only ${docPercentage}% of files have documentation. Aim for at least 50%.`
        )
      }
    }
  }

  /**
   * Get all JS files recursively
   */
  getAllJsFiles(dir) {
    const files = []

    const walk = d => {
      if (!existsSync(d)) return

      const items = readdirSync(d)

      items.forEach(item => {
        const itemPath = join(d, item)
        const stat = statSync(itemPath)

        if (stat.isDirectory()) {
          walk(itemPath)
        } else if (item.endsWith('.js') && !item.includes('.test.')) {
          files.push(itemPath)
        }
      })
    }

    walk(dir)
    return files
  }

  /**
   * Check test coverage
   */
  checkTestCoverage() {
    console.log('\n🧪 Checking test coverage...')

    const testDir = join(SRC_DIR, 'test')
    if (!existsSync(testDir)) {
      this.errors.push('Test directory not found')
      return
    }

    const testFiles = readdirSync(testDir).filter(f => f.endsWith('.test.js'))

    console.log(`  Found ${testFiles.length} test files`)

    if (testFiles.length === 0) {
      this.errors.push('No test files found')
      return
    }

    // Check for property-based tests
    const propertyTests = testFiles.filter(f => f.includes('property'))
    console.log(`  Property-based tests: ${propertyTests.length}`)

    // Check for unit tests
    const unitTests = testFiles.filter(f => !f.includes('property'))
    console.log(`  Unit tests: ${unitTests.length}`)

    // Calculate test-to-code ratio
    const codeFiles = this.stats.moduleCount + this.stats.componentCount
    const testRatio = codeFiles > 0
      ? (testFiles.length / codeFiles).toFixed(2)
      : 0

    console.log(`  Test-to-code ratio: ${testRatio}`)

    if (testRatio < 0.5) {
      this.warnings.push(
        `Test-to-code ratio (${testRatio}) is low. Aim for at least 0.5.`
      )
    }
  }

  /**
   * Print validation report
   */
  printReport() {
    console.log('\n' + '='.repeat(50))
    console.log('📋 Code Quality Report')
    console.log('='.repeat(50))

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ Code quality validation passed with no issues!\n')
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
      console.log('❌ Code quality validation FAILED\n')
      process.exit(1)
    } else {
      console.log('✅ Code quality validation PASSED (with warnings)\n')
    }
  }
}

// Run validation
const validator = new CodeQualityValidator()
const success = validator.validate()

if (!success) {
  process.exit(1)
}
