/**
 * Property-based tests for data model validation
 * Feature: basic-to-advanced-portfolio, Task 2.2
 * 
 * Tests Properties 60-67:
 * - Property 60: Project ID Uniqueness
 * - Property 61: Project Title Validation
 * - Property 62: Project Description Validation
 * - Property 63: Project Technology Requirement
 * - Property 64: Project Image Requirement
 * - Property 65: Project URL Requirement
 * - Property 66: Experience Date Validation
 * - Property 67: Skill Proficiency Range
 * 
 * **Validates: Requirements 15.1-15.8**
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

// ============================================================================
// Validation Functions (simulating backend validation logic)
// ============================================================================

/**
 * Validates a project according to requirements
 */
function validateProject(project) {
  const errors = []

  // Title validation (3-100 characters)
  if (!project.title || project.title.length < 3 || project.title.length > 100) {
    errors.push('Title must be between 3 and 100 characters')
  }

  // Description validation (10-500 characters)
  if (!project.description || project.description.length < 10 || project.description.length > 500) {
    errors.push('Description must be between 10 and 500 characters')
  }

  // Technology requirement (at least one)
  if (!project.technologies || project.technologies.length === 0) {
    errors.push('At least one technology must be specified')
  }

  // Image requirement (at least one)
  if (!project.images || project.images.length === 0) {
    errors.push('At least one image must be provided')
  }

  // URL requirement (at least one of live_url or github_url)
  if (!project.live_url && !project.github_url) {
    errors.push('Either live_url or github_url must be present')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates an experience according to requirements
 */
function validateExperience(experience) {
  const errors = []

  // Date validation (start_date must be before end_date)
  if (experience.end_date) {
    const start = new Date(experience.start_date)
    const end = new Date(experience.end_date)
    if (start >= end) {
      errors.push('start_date must be before end_date')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates a skill according to requirements
 */
function validateSkill(skill) {
  const errors = []

  // Proficiency range (0-100)
  if (skill.proficiency < 0 || skill.proficiency > 100) {
    errors.push('Proficiency must be between 0 and 100')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Checks for unique project IDs
 */
function checkProjectIdUniqueness(projects) {
  const ids = projects.map(p => p.id)
  const uniqueIds = new Set(ids)
  return ids.length === uniqueIds.size
}

// ============================================================================
// Arbitraries (Test Data Generators)
// ============================================================================

const arbProjectId = () => fc.stringMatching(/^[a-z0-9-]{1,50}$/)

const arbProjectTitle = () => fc.string({ minLength: 3, maxLength: 100 })

const arbProjectDescription = () => fc.string({ minLength: 10, maxLength: 500 })

const arbUrl = () => fc.webUrl()

const arbTechnology = () => fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.constantFrom('language', 'framework', 'library', 'tool', 'platform'),
  icon: fc.string({ minLength: 1 }),
  color: fc.constantFrom('#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#000000', '#FFFFFF'),
  url: fc.option(fc.webUrl())
})

const arbImage = () => fc.record({
  url: fc.webUrl(),
  alt: fc.string({ minLength: 1 }),
  width: fc.integer({ min: 1, max: 4000 }),
  height: fc.integer({ min: 1, max: 4000 }),
  thumbnail: fc.webUrl(),
  srcset: fc.array(fc.record({
    url: fc.webUrl(),
    width: fc.integer({ min: 1, max: 4000 }),
    descriptor: fc.string({ minLength: 1 })
  })),
  loading: fc.constantFrom('lazy', 'eager'),
  format: fc.constantFrom('webp', 'jpg', 'png', 'svg')
})

const arbValidProject = () => fc.record({
  id: arbProjectId(),
  title: arbProjectTitle(),
  description: arbProjectDescription(),
  long_description: fc.string({ minLength: 10, maxLength: 1000 }),
  technologies: fc.array(arbTechnology(), { minLength: 1, maxLength: 10 }),
  images: fc.array(arbImage(), { minLength: 1, maxLength: 10 }),
  thumbnail_url: fc.webUrl(),
  live_url: fc.option(fc.webUrl()),
  github_url: fc.option(fc.webUrl()),
  featured: fc.boolean(),
  category: fc.constantFrom('web', 'mobile', 'desktop', 'library', 'tool', 'game', 'other'),
  date_completed: fc.date({ max: new Date() }),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 20 })),
  status: fc.constantFrom('completed', 'in-progress', 'archived')
}).map(project => {
  // Ensure at least one URL is present
  if (!project.live_url && !project.github_url) {
    project.live_url = 'https://example.com'
  }
  return project
})

const arbValidExperience = () => fc.record({
  id: fc.stringMatching(/^[a-z0-9-]{1,50}$/),
  company: fc.string({ minLength: 1, maxLength: 200 }),
  position: fc.string({ minLength: 1, maxLength: 200 }),
  start_date: fc.date({ max: new Date() }),
  end_date: fc.option(fc.date({ max: new Date() })),
  description: fc.string({ minLength: 20, maxLength: 1000 }),
  achievements: fc.array(fc.string({ minLength: 5, maxLength: 200 }), { minLength: 1 }),
  technologies: fc.array(arbTechnology()),
  experience_type: fc.constantFrom('work', 'education', 'volunteer', 'freelance'),
  location: fc.string({ minLength: 1, maxLength: 100 }),
  remote: fc.boolean()
}).map(exp => {
  // Ensure end_date is after start_date if present
  if (exp.end_date && exp.end_date <= exp.start_date) {
    exp.end_date = new Date(exp.start_date.getTime() + 86400000) // Add 1 day
  }
  return exp
})

const arbValidSkill = () => fc.record({
  id: fc.stringMatching(/^[a-z0-9-]{1,50}$/),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  category: fc.constantFrom('language', 'framework', 'library', 'tool', 'platform', 'database', 'cloud', 'devops', 'design', 'soft', 'other'),
  proficiency: fc.integer({ min: 0, max: 100 }),
  years_experience: fc.float({ min: 0, max: 50 }),
  certifications: fc.array(fc.record({
    name: fc.string({ minLength: 1 }),
    issuer: fc.string({ minLength: 1 }),
    date: fc.option(fc.string()),
    url: fc.option(fc.webUrl())
  })),
  related_projects: fc.array(fc.string()),
  icon: fc.string({ minLength: 1 }),
  description: fc.string({ minLength: 10, maxLength: 500 }),
  interactive: fc.boolean(),
  demo_url: fc.option(fc.webUrl())
})

// ============================================================================
// Property 60: Project ID Uniqueness
// **Validates: Requirement 15.1**
// ============================================================================

describe('Property 60: Project ID Uniqueness', () => {
  it('should detect duplicate project IDs in a collection', () => {
    fc.assert(
      fc.property(
        fc.array(arbValidProject(), { minLength: 2, maxLength: 20 }),
        (projects) => {
          // For any set of projects, we should be able to detect duplicates
          const hasUniqueIds = checkProjectIdUniqueness(projects)
          
          // This property verifies that our uniqueness check works correctly
          // In a real system, the loading mechanism should enforce uniqueness
          const ids = projects.map(p => p.id)
          const uniqueIds = new Set(ids)
          
          return hasUniqueIds === (ids.length === uniqueIds.size)
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should identify when all project IDs are unique', () => {
    fc.assert(
      fc.property(
        fc.array(arbValidProject(), { minLength: 1, maxLength: 10 }),
        (projects) => {
          // Make all IDs unique
          projects.forEach((p, i) => {
            p.id = `unique-project-${i}`
          })
          
          return checkProjectIdUniqueness(projects)
        }
      ),
      { numRuns: 20 }
    )
  })
})

// ============================================================================
// Property 61: Project Title Validation
// **Validates: Requirement 15.2**
// ============================================================================

describe('Property 61: Project Title Validation', () => {
  it('should accept valid titles (3-100 characters)', () => {
    fc.assert(
      fc.property(
        arbProjectTitle(),
        (title) => {
          const project = { title, description: 'Valid description here', technologies: [{}], images: [{}], live_url: 'https://example.com' }
          const result = validateProject(project)
          
          // Valid titles should pass validation
          return result.isValid || !result.errors.some(e => e.includes('Title'))
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should reject titles that are too short (< 3 characters)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 2 }),
        (title) => {
          const project = { title, description: 'Valid description here', technologies: [{}], images: [{}], live_url: 'https://example.com' }
          const result = validateProject(project)
          
          // Short titles should fail validation
          return !result.isValid && result.errors.some(e => e.includes('Title'))
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should reject titles that are too long (> 100 characters)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 101, maxLength: 200 }),
        (title) => {
          const project = { title, description: 'Valid description here', technologies: [{}], images: [{}], live_url: 'https://example.com' }
          const result = validateProject(project)
          
          // Long titles should fail validation
          return !result.isValid && result.errors.some(e => e.includes('Title'))
        }
      ),
      { numRuns: 20 }
    )
  })
})

// ============================================================================
// Property 62: Project Description Validation
// **Validates: Requirement 15.3**
// ============================================================================

describe('Property 62: Project Description Validation', () => {
  it('should accept valid descriptions (10-500 characters)', () => {
    fc.assert(
      fc.property(
        arbProjectDescription(),
        (description) => {
          const project = { title: 'Valid Title', description, technologies: [{}], images: [{}], live_url: 'https://example.com' }
          const result = validateProject(project)
          
          // Valid descriptions should pass validation
          return result.isValid || !result.errors.some(e => e.includes('Description'))
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should reject descriptions that are too short (< 10 characters)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 9 }),
        (description) => {
          const project = { title: 'Valid Title', description, technologies: [{}], images: [{}], live_url: 'https://example.com' }
          const result = validateProject(project)
          
          // Short descriptions should fail validation
          return !result.isValid && result.errors.some(e => e.includes('Description'))
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should reject descriptions that are too long (> 500 characters)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 501, maxLength: 1000 }),
        (description) => {
          const project = { title: 'Valid Title', description, technologies: [{}], images: [{}], live_url: 'https://example.com' }
          const result = validateProject(project)
          
          // Long descriptions should fail validation
          return !result.isValid && result.errors.some(e => e.includes('Description'))
        }
      ),
      { numRuns: 20 }
    )
  })
})

// ============================================================================
// Property 63: Project Technology Requirement
// **Validates: Requirement 15.4**
// ============================================================================

describe('Property 63: Project Technology Requirement', () => {
  it('should accept projects with at least one technology', () => {
    fc.assert(
      fc.property(
        arbValidProject(),
        (project) => {
          const result = validateProject(project)
          
          // Projects with technologies should pass validation
          return result.isValid || !result.errors.some(e => e.includes('technology'))
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should reject projects with no technologies', () => {
    fc.assert(
      fc.property(
        arbValidProject(),
        (project) => {
          project.technologies = []
          const result = validateProject(project)
          
          // Projects without technologies should fail validation
          return !result.isValid && result.errors.some(e => e.includes('technology'))
        }
      ),
      { numRuns: 20 }
    )
  })
})

// ============================================================================
// Property 64: Project Image Requirement
// **Validates: Requirement 15.5**
// ============================================================================

describe('Property 64: Project Image Requirement', () => {
  it('should accept projects with at least one image', () => {
    fc.assert(
      fc.property(
        arbValidProject(),
        (project) => {
          const result = validateProject(project)
          
          // Projects with images should pass validation
          return result.isValid || !result.errors.some(e => e.includes('image'))
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should reject projects with no images', () => {
    fc.assert(
      fc.property(
        arbValidProject(),
        (project) => {
          project.images = []
          const result = validateProject(project)
          
          // Projects without images should fail validation
          return !result.isValid && result.errors.some(e => e.includes('image'))
        }
      ),
      { numRuns: 20 }
    )
  })
})

// ============================================================================
// Property 65: Project URL Requirement
// **Validates: Requirement 15.6**
// ============================================================================

describe('Property 65: Project URL Requirement', () => {
  it('should accept projects with at least one URL (live or github)', () => {
    fc.assert(
      fc.property(
        arbValidProject(),
        (project) => {
          const result = validateProject(project)
          
          // Projects with at least one URL should pass validation
          return result.isValid || !result.errors.some(e => e.includes('live_url') || e.includes('github_url'))
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should reject projects with neither live_url nor github_url', () => {
    fc.assert(
      fc.property(
        arbValidProject(),
        (project) => {
          project.live_url = null
          project.github_url = null
          const result = validateProject(project)
          
          // Projects without any URL should fail validation
          return !result.isValid && result.errors.some(e => e.includes('live_url') || e.includes('github_url'))
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should accept projects with only live_url', () => {
    fc.assert(
      fc.property(
        arbValidProject(),
        fc.webUrl(),
        (project, url) => {
          project.live_url = url
          project.github_url = null
          const result = validateProject(project)
          
          // Projects with only live_url should pass validation
          return result.isValid || !result.errors.some(e => e.includes('live_url') || e.includes('github_url'))
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should accept projects with only github_url', () => {
    fc.assert(
      fc.property(
        arbValidProject(),
        fc.webUrl(),
        (project, url) => {
          project.live_url = null
          project.github_url = url
          const result = validateProject(project)
          
          // Projects with only github_url should pass validation
          return result.isValid || !result.errors.some(e => e.includes('live_url') || e.includes('github_url'))
        }
      ),
      { numRuns: 20 }
    )
  })
})

// ============================================================================
// Property 66: Experience Date Validation
// **Validates: Requirement 15.7**
// ============================================================================

describe('Property 66: Experience Date Validation', () => {
  it('should accept experiences with start_date before end_date', () => {
    fc.assert(
      fc.property(
        arbValidExperience(),
        (experience) => {
          const result = validateExperience(experience)
          
          // Valid date ordering should pass validation
          return result.isValid
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should reject experiences with end_date before start_date', () => {
    fc.assert(
      fc.property(
        arbValidExperience(),
        (experience) => {
          // Swap dates to make them invalid
          if (experience.end_date) {
            const temp = experience.start_date
            experience.start_date = experience.end_date
            experience.end_date = temp
            
            // Only test if dates are actually in wrong order
            if (experience.start_date >= experience.end_date) {
              const result = validateExperience(experience)
              return !result.isValid && result.errors.some(e => e.includes('start_date'))
            }
          }
          return true // Skip if no end_date
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should accept experiences with no end_date (current positions)', () => {
    fc.assert(
      fc.property(
        arbValidExperience(),
        (experience) => {
          experience.end_date = null
          const result = validateExperience(experience)
          
          // Current positions (no end date) should pass validation
          return result.isValid
        }
      ),
      { numRuns: 20 }
    )
  })
})

// ============================================================================
// Property 67: Skill Proficiency Range
// **Validates: Requirement 15.8**
// ============================================================================

describe('Property 67: Skill Proficiency Range', () => {
  it('should accept skills with proficiency between 0 and 100', () => {
    fc.assert(
      fc.property(
        arbValidSkill(),
        (skill) => {
          const result = validateSkill(skill)
          
          // Valid proficiency values should pass validation
          return result.isValid
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should accept skills with proficiency at boundary 0', () => {
    fc.assert(
      fc.property(
        arbValidSkill(),
        (skill) => {
          skill.proficiency = 0
          const result = validateSkill(skill)
          
          // Proficiency of 0 should pass validation
          return result.isValid
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should accept skills with proficiency at boundary 100', () => {
    fc.assert(
      fc.property(
        arbValidSkill(),
        (skill) => {
          skill.proficiency = 100
          const result = validateSkill(skill)
          
          // Proficiency of 100 should pass validation
          return result.isValid
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should reject skills with proficiency below 0', () => {
    fc.assert(
      fc.property(
        arbValidSkill(),
        fc.integer({ min: -100, max: -1 }),
        (skill, invalidProficiency) => {
          skill.proficiency = invalidProficiency
          const result = validateSkill(skill)
          
          // Negative proficiency should fail validation
          return !result.isValid && result.errors.some(e => e.includes('Proficiency'))
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should reject skills with proficiency above 100', () => {
    fc.assert(
      fc.property(
        arbValidSkill(),
        fc.integer({ min: 101, max: 200 }),
        (skill, invalidProficiency) => {
          skill.proficiency = invalidProficiency
          const result = validateSkill(skill)
          
          // Proficiency over 100 should fail validation
          return !result.isValid && result.errors.some(e => e.includes('Proficiency'))
        }
      ),
      { numRuns: 20 }
    )
  })
})

