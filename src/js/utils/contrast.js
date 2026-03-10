/**
 * Contrast Ratio Utility
 * Provides functions for calculating and validating color contrast ratios
 * according to WCAG 2.1 guidelines
 */

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color string (e.g., '#ffffff' or 'ffffff')
 * @returns {{r: number, g: number, b: number}} RGB values (0-255)
 */
export function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace(/^#/, '')
  
  // Handle shorthand hex (e.g., #fff)
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }
  
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  return { r, g, b }
}

/**
 * Calculate relative luminance of a color
 * Formula from WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 * @param {{r: number, g: number, b: number}} rgb - RGB values (0-255)
 * @returns {number} Relative luminance (0-1)
 */
export function getRelativeLuminance(rgb) {
  // Convert RGB values to 0-1 range
  const rsRGB = rgb.r / 255
  const gsRGB = rgb.g / 255
  const bsRGB = rgb.b / 255
  
  // Apply gamma correction
  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)
  
  // Calculate relative luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Calculate contrast ratio between two colors
 * Formula from WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 * @param {string} color1 - First color (hex format)
 * @param {string} color2 - Second color (hex format)
 * @returns {number} Contrast ratio (1-21)
 */
export function calculateContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  
  const lum1 = getRelativeLuminance(rgb1)
  const lum2 = getRelativeLuminance(rgb2)
  
  // Ensure lighter color is in numerator
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  
  // Calculate contrast ratio
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if contrast ratio meets WCAG AA standard
 * @param {number} ratio - Contrast ratio
 * @param {string} level - WCAG level ('AA' or 'AAA')
 * @param {string} size - Text size ('normal' or 'large')
 * @returns {boolean} True if contrast meets standard
 */
export function meetsWCAGStandard(ratio, level = 'AA', size = 'normal') {
  const standards = {
    AA: {
      normal: 4.5,
      large: 3.0
    },
    AAA: {
      normal: 7.0,
      large: 4.5
    }
  }
  
  const requiredRatio = standards[level]?.[size] || 4.5
  return ratio >= requiredRatio
}

/**
 * Validate a color pair meets WCAG AA standard
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @param {string} size - Text size ('normal' or 'large')
 * @returns {{passes: boolean, ratio: number, required: number}} Validation result
 */
export function validateColorPair(foreground, background, size = 'normal') {
  const ratio = calculateContrastRatio(foreground, background)
  const required = size === 'large' ? 3.0 : 4.5
  const passes = ratio >= required
  
  return {
    passes,
    ratio: Math.round(ratio * 100) / 100, // Round to 2 decimal places
    required
  }
}

/**
 * Get theme color pairs that need contrast validation
 * @param {string} theme - Theme name ('light' or 'dark')
 * @returns {Array<{name: string, foreground: string, background: string}>} Color pairs
 */
export function getThemeColorPairs(theme) {
  const colorPairs = {
    light: [
      { name: 'text-on-background', foreground: '#1e293b', background: '#ffffff' },
      { name: 'text-on-card', foreground: '#1e293b', background: '#f8fafc' },
      { name: 'heading-on-background', foreground: '#0f172a', background: '#ffffff' },
      { name: 'link-on-background', foreground: '#1e40af', background: '#ffffff' }, // Darker blue for WCAG AA
      { name: 'button-text', foreground: '#ffffff', background: '#1e40af' }, // Darker blue for WCAG AA
      { name: 'secondary-text', foreground: '#64748b', background: '#ffffff' },
    ],
    dark: [
      { name: 'text-on-background', foreground: '#e2e8f0', background: '#0f172a' },
      { name: 'text-on-card', foreground: '#e2e8f0', background: '#1e293b' },
      { name: 'heading-on-background', foreground: '#f1f5f9', background: '#0f172a' },
      { name: 'link-on-background', foreground: '#93c5fd', background: '#0f172a' }, // Lighter blue for WCAG AA
      { name: 'button-text', foreground: '#ffffff', background: '#1e40af' }, // Darker blue for WCAG AA
      { name: 'secondary-text', foreground: '#94a3b8', background: '#0f172a' },
    ]
  }
  
  return colorPairs[theme] || []
}

/**
 * Validate all color pairs for a theme
 * @param {string} theme - Theme name ('light' or 'dark')
 * @returns {{passes: boolean, results: Array}} Validation results for all pairs
 */
export function validateThemeContrast(theme) {
  const colorPairs = getThemeColorPairs(theme)
  const results = []
  let allPass = true
  
  for (const pair of colorPairs) {
    const validation = validateColorPair(pair.foreground, pair.background)
    results.push({
      name: pair.name,
      foreground: pair.foreground,
      background: pair.background,
      ...validation
    })
    
    if (!validation.passes) {
      allPass = false
    }
  }
  
  return {
    passes: allPass,
    results
  }
}
