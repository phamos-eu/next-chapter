/**
 * Main workspace composable
 * Central state management for NextChapter
 */

import { computed, reactive } from 'vue'
import { call } from 'frappe-ui'
import dayjs from 'dayjs'

// Import constants
import {
  STAGES,
  STAGE_COLORS,
  STAGE_META,
  PAGE_PILE_STAGES,
  DONE_PREVIEW_LIMIT,
  HIGHLIGHTABLE_STATS,
} from './constants'

// Import sub-composables
import { useChapter } from './useChapter'
import { useSession } from './useSession'

// Re-export everything for backward compatibility
export {
  STAGES,
  STAGE_COLORS,
  STAGE_META,
  PAGE_PILE_STAGES,
  DONE_PREVIEW_LIMIT,
  HIGHLIGHTABLE_STATS,
} from './constants'

export {
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
} from './useFormatters'

export { useChapter, useSession }

// Main state
const state = reactive({
  loaded: false,
  loading: false,
  error: '',
  needsSetup: false,
  story: null,
  chapters: [],
  stages: [],
  wipLimits: {},
  wordGates: {},
  settings: {},
  prefs: {},
  search: '',
  listMode: 'active',
  stageFilter: 'All',
  active: null,
})

let bootstrapPromise = null

/**
 * Apply bootstrap data to state
 */
function applyBootstrap(data) {
  state.needsSetup = Boolean(data.needs_setup)
  state.story = data.story || null
  state.chapters = (data.chapters || []).map(_serialize)
  state.stages = data.stages?.length ? data.stages : [...STAGES]
  state.wipLimits = data.wip_limits || {}
  state.wordGates = data.word_gates || {}
  state.settings = data.settings || {}
  state.prefs = data.prefs || {}
  state.loaded = true
  state.error = ''
  
  // Apply UI scale
  applyUiScale(state.prefs.ui_scale ?? 125)

  // Clear active if chapter no longer exists
  if (state.active && !state.chapters.some((c) => c.name === state.active)) {
    state.active = null
  }
}

/**
 * Serialize a chapter document/row
 */
function _serialize(docOrRow) {
  const data = {
    name: docOrRow.name,
    title: docOrRow.title || '',
    sequence: docOrRow.sequence || 0,
    writing_stage: docOrRow.writing_stage || '∞',
    summary: docOrRow.summary || '',
    content: docOrRow.content || '',
    hidden_until: docOrRow.hidden_until,
    auto_hidden: Number(docOrRow.auto_hidden || 0),
    next_write_on: docOrRow.next_write_on,
    write_duration_mins: docOrRow.write_duration_mins,
    last_session_words: Number(docOrRow.last_session_words || 0),
    spawned_from: docOrRow.spawned_from,
    highlighted_stats: _parseHighlightedStats(docOrRow.highlighted_stats),
    next_focus_note: docOrRow.next_focus_note || '',
    creation: docOrRow.creation,
    modified: docOrRow.modified,
  }
  
  const hidden_until = data.hidden_until
  const snoozed = Boolean(hidden_until && dayjs(hidden_until) > dayjs())
  data.is_hidden = snoozed || Boolean(data.auto_hidden)
  
  return data
}

/**
 * Parse highlighted stats from raw value
 */
function _parseHighlightedStats(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.slice(0, 3)
  
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.slice(0, 3)
  } catch {
    // Invalid JSON, return empty array
  }
  
  return []
}

/**
 * Replace or add a chapter in the store
 */
function _replaceChapter(chapter) {
  const idx = state.chapters.findIndex((c) => c.name === chapter.name)
  if (idx >= 0) {
    state.chapters.splice(idx, 1, _serialize(chapter))
  } else {
    state.chapters.push(_serialize(chapter))
  }
}

/**
 * Apply UI scale setting
 */
function applyUiScale(scale) {
  const pct = Math.max(90, Math.min(140, Number(scale) || 125))
  if (typeof document !== 'undefined') {
    document.documentElement.style.fontSize = `${(16 * pct) / 100}px`
    document.documentElement.style.setProperty('--nc-ui-scale', String(pct / 100))
  }
}

/**
 * Get error message from error object
 */
function errorMessage(e, fallback = 'Something went wrong') {
  return e?.messages?.[0] || e?.message || fallback
}

/**
 * Bootstrap the workspace
 */
async function bootstrap(force = false) {
  if (state.loaded && !force) return state
  if (bootstrapPromise && !force) return bootstrapPromise

  state.loading = true
  state.error = ''
  
  bootstrapPromise = (async () => {
    try {
      const data = await call('next_chapter.api.setup.get_bootstrap')
      applyBootstrap(data || {})
      return data
    } catch (e) {
      state.error = errorMessage(e, 'Could not load NextChapter')
      state.loaded = false
      throw e
    } finally {
      state.loading = false
      bootstrapPromise = null
    }
  })()

  return bootstrapPromise
}

/**
 * Complete setup wizard
 */
async function completeSetup(
  company_name,
  company_purpose = null,
  employees_now = null,
  employees_1y = null,
  employees_3y = null,
  employees_7y = null,
  company_stage = null,
  erp_motivation = null,
  priority_1 = null,
  priority_2 = null,
  priority_3 = null,
) {
  try {
    const data = await call('next_chapter.api.setup.complete_setup', {
      company_name,
      company_purpose,
      employees_now,
      employees_1y,
      employees_3y,
      employees_7y,
      company_stage,
      erp_motivation,
      priority_1,
      priority_2,
      priority_3,
    })
    applyBootstrap(data)
    return data
  } catch (e) {
    throw e
  }
}

/**
 * Main composable export
 */
export function useWorkspace() {
  // Get chapter-related functions
  const chapterComposable = useChapter()
  
  // Get session-related functions
  const sessionComposable = useSession()

  return {
    // State
    state,
    
    // Bootstrap
    bootstrap,
    completeSetup,
    
    // From useChapter
    ...chapterComposable,
    
    // From useSession
    ...sessionComposable,
    
    // Utilities
    applyUiScale,
    errorMessage,
  }
}

export default useWorkspace
