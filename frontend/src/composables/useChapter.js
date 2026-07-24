/**
 * Chapter-related logic and API calls
 */

import { computed } from 'vue'
import { call, toast } from 'frappe-ui'
import dayjs from 'dayjs'
import { useWorkspace } from './useWorkspace'
import { countWords, plainSummary } from './useFormatters'
import {
  STAGES,
  STAGE_COLORS,
  STAGE_META,
  PAGE_PILE_STAGES,
  DONE_PREVIEW_LIMIT,
} from './constants'

// Re-export constants for convenience
export {
  STAGES,
  STAGE_COLORS,
  STAGE_META,
  PAGE_PILE_STAGES,
  DONE_PREVIEW_LIMIT,
}

/**
 * Composable for chapter operations
 */
export function useChapter() {
  const { state, bootstrap } = useWorkspace()

  /**
   * Get chapter by name from the store
   * @param {string} name - Chapter name
   * @returns {Object|null} - Chapter object or null
   */
  const chapterByName = (name) => {
    if (!name) return null
    return state.chapters.find((c) => c.name === name) || null
  }

  /**
   * Get active chapter (currently selected)
   */
  const activeChapter = computed(() => {
    if (!state.active) return null
    return state.chapters.find((c) => c.name === state.active) || null
  })

  /**
   * Get filtered chapters based on current filters
   */
  const filteredChapters = computed(() => {
    const q = state.search.trim().toLowerCase()
    const sort = state.prefs.ideas_sort || 'modified_desc'
    const stageRank = Object.fromEntries(state.stages.map((s, i) => [s, i]))
    
    const list = state.chapters.filter((c) => {
      const hidden = Boolean(c.is_hidden)
      
      // Filter by list mode
      if (state.listMode === 'hidden' ? !hidden : hidden) return false
      
      // Done ideas are harvested — keep them out of Active unless filtering by Done
      if (
        state.listMode === 'active' &&
        c.writing_stage === 'Done' &&
        state.stageFilter !== 'Done'
      ) {
        return false
      }
      
      // Filter by stage
      if (state.stageFilter !== 'All' && c.writing_stage !== state.stageFilter) {
        return false
      }
      
      // Filter by search query
      if (!q) return true
      const hay = `${c.title || ''} ${c.summary || ''}`.toLowerCase()
      return hay.includes(q)
    })

    // Sort
    list.sort((a, b) => {
      if (sort === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '')
      }
      if (sort === 'stage_asc') {
        return (stageRank[a.writing_stage] ?? 99) - (stageRank[b.writing_stage] ?? 99)
      }
      if (sort === 'sequence_asc') {
        return (a.sequence || 0) - (b.sequence || 0)
      }
      // modified_desc — recently edited first
      return dayjs(b.modified || 0).valueOf() - dayjs(a.modified || 0).valueOf()
    })

    // Done stage chip: preview only; full archive lives under History
    if (state.listMode === 'active' && state.stageFilter === 'Done') {
      return list.slice(0, DONE_PREVIEW_LIMIT)
    }
    
    return list
  })

  /**
   * Get history chapters (Done stage)
   */
  const historyChapters = computed(() =>
    state.chapters
      .filter((c) => c.writing_stage === 'Done')
      .slice()
      .sort(
        (a, b) =>
          dayjs(b.modified || 0).valueOf() - dayjs(a.modified || 0).valueOf(),
      ),
  )

  /**
   * Check if Done stage is truncated in preview
   */
  const donePreviewTruncated = computed(() => {
    if (state.listMode !== 'active' || state.stageFilter !== 'Done') return false
    const total = state.chapters.filter(
      (c) => !c.is_hidden && c.writing_stage === 'Done',
    ).length
    return total > DONE_PREVIEW_LIMIT
  })

  /**
   * Get scheduled chapters
   */
  const scheduledChapters = computed(() =>
    state.chapters
      .filter((c) => c.next_write_on && !c.is_hidden && c.writing_stage !== 'Done')
      .slice()
      .sort((a, b) => dayjs(a.next_write_on).valueOf() - dayjs(b.next_write_on).valueOf()),
  )

  /**
   * Get cards for a specific stage
   */
  const cardsForStage = (stage, { previewDone = true } = {}) => {
    const list = state.chapters
      .filter((c) => !c.is_hidden && c.writing_stage === stage)
      .slice()
      .sort(
        (a, b) =>
          dayjs(b.modified || 0).valueOf() - dayjs(a.modified || 0).valueOf(),
      )
    if (previewDone && stage === 'Done') {
      return list.slice(0, DONE_PREVIEW_LIMIT)
    }
    return list
  }

  /**
   * Check if Done stage is truncated
   */
  const doneStageTruncated = () => {
    const total = state.chapters.filter(
      (c) => !c.is_hidden && c.writing_stage === 'Done',
    ).length
    return total > DONE_PREVIEW_LIMIT
  }

  /**
   * Create a new idea chapter
   * @param {string} title - Chapter title
   * @returns {Promise<Object>} - Created chapter
   */
  const createIdea = async (title = 'New idea') => {
    try {
      const chapter = await call('next_chapter.api.chapter.create_chapter', {
        title,
      })
      state.chapters.unshift(_serialize(chapter))
      state.active = chapter.name
      state.listMode = 'active'
      await refreshVisibility()
      return _serialize(chapter)
    } catch (e) {
      toast.error(e.messages?.[0] || e.message || 'Could not create idea')
      throw e
    }
  }

  /**
   * Save chapter fields
   * @param {Object} fields - Fields to save
   * @returns {Promise<Object>} - Saved chapter
   */
  const saveChapter = async (fields) => {
    const payload = { ...fields }
    if (payload.highlighted_stats != null) {
      payload.update_highlighted_stats = 1
      payload.highlighted_stats = JSON.stringify(payload.highlighted_stats)
    }
    
    try {
      const chapter = await call('next_chapter.api.chapter.save_chapter', payload)
      _replaceChapter(chapter)
      await refreshVisibility()
      return _serialize(chapter)
    } catch (e) {
      toast.error(e.messages?.[0] || e.message || 'Could not save chapter')
      throw e
    }
  }

  /**
   * Set chapter stage
   * @param {string} name - Chapter name
   * @param {string} writing_stage - New stage
   * @returns {Promise<Object>} - Updated chapter
   */
  const setStage = async (name, writing_stage) => {
    try {
      const chapter = await call('next_chapter.api.chapter.set_stage', {
        name,
        writing_stage,
      })
      _replaceChapter(chapter)
      return _serialize(chapter)
    } catch (e) {
      toast.error(e.messages?.[0] || e.message || 'Could not move chapter')
      throw e
    }
  }

  /**
   * Hide a chapter
   * @param {string} name - Chapter name
   * @param {Object} args - Hide arguments (until or preset)
   * @returns {Promise<Object>} - Updated chapter
   */
  const hideChapter = async (name, args = {}) => {
    try {
      const chapter = await call('next_chapter.api.chapter.hide_chapter', {
        name,
        until: args.until || null,
        preset: args.preset || null,
      })
      _replaceChapter(chapter)
      
      if (state.active === name) {
        const next = state.chapters.find((c) => !c.is_hidden)
        state.active = next?.name || null
      }
      
      return _serialize(chapter)
    } catch (e) {
      toast.error(e.messages?.[0] || e.message || 'Could not hide chapter')
      throw e
    }
  }

  /**
   * Unhide a chapter
   * @param {string} name - Chapter name
   * @returns {Promise<Object>} - Updated chapter
   */
  const unhideChapter = async (name) => {
    try {
      const chapter = await call('next_chapter.api.chapter.unhide_chapter', { name })
      _replaceChapter(chapter)
      await refreshVisibility()
      return _serialize(chapter)
    } catch (e) {
      toast.error(e.messages?.[0] || e.message || 'Could not unhide chapter')
      throw e
    }
  }

  /**
   * Set writing session for a chapter
   * @param {string} name - Chapter name
   * @param {string|null} next_write_on - Datetime string or null to clear
   * @returns {Promise<Object>} - Updated chapter
   */
  const setSession = async (name, next_write_on) => {
    if (!next_write_on) {
      try {
        const chapter = await call('next_chapter.api.chapter.clear_writing_session', {
          name,
        })
        _replaceChapter(chapter)
        return _serialize(chapter)
      } catch (e) {
        toast.error(e.messages?.[0] || e.message || 'Could not clear session')
        throw e
      }
    }
    
    try {
      const chapter = await call('next_chapter.api.chapter.set_writing_session', {
        name,
        next_write_on,
      })
      _replaceChapter(chapter)
      return _serialize(chapter)
    } catch (e) {
      toast.error(e.messages?.[0] || e.message || 'Could not set session')
      throw e
    }
  }

  /**
   * Complete a writing session
   * @param {Object} payload - Session completion data
   * @returns {Promise<Object>} - Result with updated chapter and prefs
   */
  const completeWritingSession = async (payload) => {
    try {
      const result = await call('next_chapter.api.chapter.complete_writing_session', payload)
      
      if (result?.chapter) {
        _replaceChapter(result.chapter)
      }
      if (result?.prefs) {
        state.prefs = result.prefs
      }
      
      await refreshVisibility()
      return result
    } catch (e) {
      toast.error(e.messages?.[0] || e.message || 'Could not complete session')
      throw e
    }
  }

  /**
   * Capture a side idea during a session
   * @param {Object} params - Side idea parameters
   * @returns {Promise<Object>} - Created chapter
   */
  const captureSideIdea = async ({ parent, text, name = null }) => {
    try {
      const chapter = await call('next_chapter.api.chapter.capture_side_idea', {
        parent,
        text,
        name,
      })
      _replaceChapter(chapter)
      return _serialize(chapter)
    } catch (e) {
      toast.error(e.messages?.[0] || e.message || 'Could not capture side idea')
      throw e
    }
  }

  /**
   * Fetch chapter statistics
   * @param {string} chapterName - Chapter name
   * @returns {Promise<Object>} - Chapter statistics
   */
  const fetchChapterStats = async (chapterName) => {
    try {
      return await call('next_chapter.api.session.chapter_stats', { chapter: chapterName })
    } catch (e) {
      console.error('Failed to fetch chapter stats:', e)
      return null
    }
  }

  /**
   * Fetch chapter timeline
   * @param {string} chapterName - Chapter name
   * @returns {Promise<Object>} - Chapter timeline
   */
  const fetchChapterTimeline = async (chapterName) => {
    try {
      return await call('next_chapter.api.session.chapter_timeline', { chapter: chapterName })
    } catch (e) {
      console.error('Failed to fetch chapter timeline:', e)
      return null
    }
  }

  /**
   * Refresh visibility of ideas (auto-hide logic)
   */
  const refreshVisibility = async () => {
    try {
      const chapters = await call('next_chapter.api.chapter.reconcile_visible_ideas')
      if (Array.isArray(chapters)) state.chapters = chapters.map(_serialize)
    } catch {
      // Non-fatal, ignore
    }
  }

  /**
   * Download ICS file for a chapter
   * @param {string} name - Chapter name
   */
  const downloadIcs = (name) => {
    window.location.href = `/api/method/next_chapter.api.chapter.download_ics?name=${encodeURIComponent(name)}`
  }

  /**
   * Serialize a chapter document/row to a consistent format
   * @param {Object} docOrRow - Chapter document or database row
   * @returns {Object} - Serialized chapter
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
   * @param {string|Array} raw - Raw highlighted stats value
   * @returns {Array} - Array of stat keys
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
   * @param {Object} chapter - Chapter to replace/add
   */
  function _replaceChapter(chapter) {
    const idx = state.chapters.findIndex((c) => c.name === chapter.name)
    if (idx >= 0) {
      state.chapters.splice(idx, 1, _serialize(chapter))
    } else {
      state.chapters.push(_serialize(chapter))
    }
  }

  return {
    // Constants
    STAGES,
    STAGE_COLORS,
    STAGE_META,
    PAGE_PILE_STAGES,
    DONE_PREVIEW_LIMIT,
    
    // Computed
    chapterByName,
    activeChapter,
    filteredChapters,
    historyChapters,
    donePreviewTruncated,
    scheduledChapters,
    
    // Methods
    cardsForStage,
    doneStageTruncated,
    createIdea,
    saveChapter,
    setStage,
    hideChapter,
    unhideChapter,
    setSession,
    completeWritingSession,
    captureSideIdea,
    fetchChapterStats,
    fetchChapterTimeline,
    refreshVisibility,
    downloadIcs,
    
    // Utilities
    countWords,
    plainSummary,
  }
}

export default useChapter
