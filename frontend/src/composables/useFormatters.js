/**
 * Formatters and utility functions for displaying data
 */

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

// Import constants for re-export
import {
  STAGES,
  STAGE_COLORS,
  STAGE_META,
  PAGE_PILE_STAGES,
  DONE_PREVIEW_LIMIT,
  HIGHLIGHTABLE_STATS,
} from './constants'

// Re-export constants for convenience
export {
  STAGES,
  STAGE_COLORS,
  STAGE_META,
  PAGE_PILE_STAGES,
  DONE_PREVIEW_LIMIT,
  HIGHLIGHTABLE_STATS,
}

/**
 * Format a datetime string for display
 * @param {string} value - ISO datetime string
 * @returns {string} - Formatted datetime
 */
export function formatDateTime(value) {
  if (!value) return ''
  return dayjs(value).format('D MMM YYYY, HH:mm')
}

/**
 * Format a time string for display
 * @param {string} value - ISO datetime string
 * @returns {string} - Formatted time
 */
export function formatTime(value) {
  if (!value) return ''
  return dayjs(value).format('HH:mm')
}

/**
 * Format age from creation date
 * @param {string} value - ISO datetime string
 * @returns {string} - Human-readable age (e.g., "Aged 2 days")
 */
export function formatAge(value) {
  if (!value) return ''
  const created = dayjs(value)
  if (!created.isValid()) return ''
  
  const days = Math.max(0, dayjs().startOf('day').diff(created.startOf('day'), 'day'))
  
  if (days <= 0) return 'Aged today'
  if (days === 1) return 'Aged 1 day'
  if (days < 28) return `Aged ${days} days`
  
  const weeks = Math.floor(days / 7)
  if (weeks < 8) return weeks === 1 ? 'Aged 1 week' : `Aged ${weeks} weeks`
  
  const months = Math.max(1, Math.floor(days / 30))
  return months === 1 ? 'Aged 1 month' : `Aged ${months} months`
}

/**
 * Strip HTML tags from a string
 * @param {string} html - HTML string
 * @returns {string} - Plain text
 */
export function plainSummary(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Count words in a string (HTML or plain text)
 * @param {string} text - Text to count words in
 * @returns {number} - Word count
 */
export function countWords(text) {
  const t = String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t) return 0
  return t.split(/\s+/).length
}

/**
 * Format a number with locale-aware formatting
 * @param {number} value - Number to format
 * @returns {string} - Formatted number
 */
export function formatNumber(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat().format(value)
}

/**
 * Format a percentage value
 * @param {number} value - Value between 0 and 1
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted percentage
 */
export function formatPercentage(value, decimals = 0) {
  if (value == null) return '—'
  const percentage = value * 100
  return percentage.toFixed(decimals) + '%'
}

/**
 * Format a duration in minutes to a human-readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} - Formatted duration
 */
export function formatDuration(minutes) {
  if (minutes == null || minutes <= 0) return '—'
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return `${mins}m`
}

/**
 * Get trend arrow character for a trend value
 * @param {string} trend - Trend value ('up', 'down', 'flat')
 * @returns {string} - Arrow character
 */
export function trendArrow(trend) {
  if (trend === 'up') return '↑'
  if (trend === 'down') return '↓'
  if (trend === 'flat') return '→'
  return ''
}

/**
 * Get CSS class for trend styling
 * @param {string} trend - Trend value
 * @returns {string} - CSS class string
 */
export function trendClass(trend) {
  if (trend === 'up') return 'text-emerald-600/45 dark:text-emerald-400/45'
  if (trend === 'down') return 'text-rose-600/45 dark:text-rose-400/45'
  if (trend === 'flat') return 'text-sky-600/45 dark:text-sky-400/45'
  return 'text-gray-400 dark:text-gray-500'
}

/**
 * Get trend title for tooltip
 * @param {string} trend - Trend value
 * @returns {string} - Human-readable trend description
 */
export function trendTitle(trend) {
  if (trend === 'up') return 'Improving'
  if (trend === 'down') return 'Declining'
  if (trend === 'flat') return 'Steady'
  return ''
}

export default {
  // Constants
  STAGES,
  STAGE_COLORS,
  STAGE_META,
  PAGE_PILE_STAGES,
  DONE_PREVIEW_LIMIT,
  HIGHLIGHTABLE_STATS,
  
  // Functions
  formatDateTime,
  formatTime,
  formatAge,
  plainSummary,
  countWords,
  formatNumber,
  formatPercentage,
  formatDuration,
  trendArrow,
  trendClass,
  trendTitle,
}
