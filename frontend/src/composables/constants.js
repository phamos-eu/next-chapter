/**
 * Shared constants for NextChapter
 */

// Stage constants
export const STAGES = ['∞', '9', '7', '5', '3', '1', 'Done']

export const STAGE_COLORS = {
  '∞': 'gray',
  '9': 'blue',
  '7': 'cyan',
  '5': 'orange',
  '3': 'purple',
  '1': 'green',
  Done: 'green',
}

export const STAGE_META = {
  '∞': { metaphor: 'Seed', job: 'Capture anything; no commitment' },
  '9': { metaphor: 'Sprout', job: 'First filter — keep what still interests you' },
  '7': { metaphor: 'Seedling', job: 'Clarify the point in a few sentences' },
  '5': { metaphor: 'Young plant', job: 'Structure emerging' },
  '3': {
    metaphor: 'Growing',
    job: 'Serious candidates',
    page_pile: true,
    future_page_nav: true,
  },
  '1': {
    metaphor: 'Mature focus',
    job: 'The one you write deeply',
    page_pile: true,
    future_page_nav: true,
  },
  Done: { metaphor: 'Harvest', job: 'Finished chapter' },
}

/** Stages where pile-of-pages focus mode may appear (not 9 / 7 / 5). */
export const PAGE_PILE_STAGES = Object.keys(STAGE_META).filter(
  (s) => STAGE_META[s]?.page_pile,
)

/** How many Done ideas to preview on Ideas / Growth Funnel before History */
export const DONE_PREVIEW_LIMIT = 10

/**
 * Stable keys for stats that can be highlighted on an idea overview.
 */
export const HIGHLIGHTABLE_STATS = [
  { key: 'total_sessions', label: 'Sessions (total)', group: 'Consistency' },
  { key: 'avg_sessions_per_week', label: 'Avg / week', group: 'Consistency' },
  { key: 'best_quiet', label: 'Best / quiet week', group: 'Consistency' },
  { key: 'total_words', label: 'Words written (total)', group: 'Output' },
  { key: 'planned_vs_actual', label: 'Last planned → actual', group: 'Output' },
  { key: 'recent_sessions', label: 'Recent sessions', group: 'Output' },
  { key: 'total_focus_mins', label: 'Total focus (mins)', group: 'Time' },
  { key: 'avg_session_mins', label: 'Avg session', group: 'Time' },
  { key: 'longest_session_mins', label: 'Longest session', group: 'Time' },
  { key: 'scheduled_sessions', label: 'Scheduled sessions', group: 'Planning' },
  { key: 'focus_note_keep_rate', label: 'Focus-note keep rate', group: 'Planning' },
  { key: 'aim_mix', label: 'Aim mix (more/sim/less)', group: 'Planning' },
]

export default {
  STAGES,
  STAGE_COLORS,
  STAGE_META,
  PAGE_PILE_STAGES,
  DONE_PREVIEW_LIMIT,
  HIGHLIGHTABLE_STATS,
}
