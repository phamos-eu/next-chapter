/**
 * Session-related logic and API calls
 */

import { computed } from 'vue'
import { call } from 'frappe-ui'
import { useWorkspace } from './useWorkspace'

/**
 * Composable for session operations
 */
export function useSession() {
  const { state } = useWorkspace()

  /**
   * Apply feedback to user preferences
   * @param {Object} feedback - Feedback data
   */
  const applyFeedbackToPrefs = async (feedback) => {
    try {
      await call('next_chapter.api.session.apply_feedback_to_prefs', feedback)
    } catch (e) {
      console.error('Failed to apply feedback:', e)
    }
  }

  /**
   * Save user preferences
   * @param {Object} updates - Preferences to update
   * @returns {Promise<Object>} - Updated preferences
   */
  const savePrefs = async (updates) => {
    try {
      const result = await call('next_chapter.api.session.save_prefs', updates)
      
      if (result?.prefs) {
        state.prefs = result.prefs
        if (Array.isArray(result.chapters)) {
          state.chapters = result.chapters
        }
        return result.prefs
      }
      
      state.prefs = result || {}
      return result
    } catch (e) {
      console.error('Failed to save preferences:', e)
      throw e
    }
  }

  /**
   * Get effective setting value (preference or system default)
   * @param {string} key - Setting key
   * @param {*} fallback - Fallback value
   * @returns {*} - Setting value
   */
  const effectiveSetting = (key, fallback = null) => {
    const pref = state.prefs?.[key]
    if (pref !== undefined && pref !== null && pref !== '') return pref
    
    if (state.settings?.[key] !== undefined && state.settings?.[key] !== null) {
      return state.settings[key]
    }
    
    return fallback
  }

  /**
   * Apply UI scale setting
   * @param {number} scale - Scale percentage (90-140)
   */
  const applyUiScale = (scale) => {
    const pct = Math.max(90, Math.min(140, Number(scale) || 125))
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = `${(16 * pct) / 100}px`
      document.documentElement.style.setProperty('--nc-ui-scale', String(pct / 100))
    }
  }

  return {
    applyFeedbackToPrefs,
    savePrefs,
    effectiveSetting,
    applyUiScale,
  }
}

export default useSession
