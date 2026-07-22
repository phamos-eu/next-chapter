import { computed, reactive } from 'vue'
import { call, toast } from 'frappe-ui'
import dayjs from 'dayjs'

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
	'3': { metaphor: 'Growing', job: 'Serious candidates' },
	'1': { metaphor: 'Mature focus', job: 'The one you write deeply' },
	Done: { metaphor: 'Harvest', job: 'Finished chapter' },
}

export const STAGES = ['∞', '9', '7', '5', '3', '1', 'Done']

const state = reactive({
	loaded: false,
	loading: false,
	error: '',
	needsSetup: false,
	story: null,
	chapters: [],
	stages: [...STAGES],
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

function applyBootstrap(data) {
	state.needsSetup = Boolean(data.needs_setup)
	state.story = data.story || null
	state.chapters = data.chapters || []
	state.stages = data.stages?.length ? data.stages : [...STAGES]
	state.wipLimits = data.wip_limits || {}
	state.wordGates = data.word_gates || {}
	state.settings = data.settings || {}
	state.prefs = data.prefs || {}
	state.loaded = true
	state.error = ''

	if (state.active && !state.chapters.some((c) => c.name === state.active)) {
		state.active = null
	}
}

function replaceChapter(chapter) {
	const idx = state.chapters.findIndex((c) => c.name === chapter.name)
	if (idx >= 0) {
		state.chapters.splice(idx, 1, chapter)
	} else {
		state.chapters.push(chapter)
	}
}

function errorMessage(e, fallback = 'Something went wrong') {
	return e?.messages?.[0] || e?.message || fallback
}

export function useWorkspace() {
	const activeChapter = computed(
		() => state.chapters.find((c) => c.name === state.active) || null,
	)

	const filteredChapters = computed(() => {
		const q = state.search.trim().toLowerCase()
		return state.chapters.filter((c) => {
			const hidden = Boolean(c.is_hidden)
			if (state.listMode === 'hidden' ? !hidden : hidden) return false
			if (state.stageFilter !== 'All' && c.writing_stage !== state.stageFilter) {
				return false
			}
			if (!q) return true
			const hay = `${c.title || ''} ${c.summary || ''}`.toLowerCase()
			return hay.includes(q)
		})
	})

	const scheduledChapters = computed(() =>
		state.chapters
			.filter((c) => c.next_write_on && !c.is_hidden)
			.slice()
			.sort((a, b) => dayjs(a.next_write_on).valueOf() - dayjs(b.next_write_on).valueOf()),
	)

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

	async function createIdea(title = 'New idea') {
		const chapter = await call('next_chapter.api.chapter.create_chapter', {
			title,
		})
		state.chapters.unshift(chapter)
		state.active = chapter.name
		state.listMode = 'active'
		return chapter
	}

	async function saveChapter(fields) {
		const chapter = await call('next_chapter.api.chapter.save_chapter', fields)
		replaceChapter(chapter)
		return chapter
	}

	async function setStage(name, writing_stage) {
		try {
			const chapter = await call('next_chapter.api.chapter.set_stage', {
				name,
				writing_stage,
			})
			replaceChapter(chapter)
			return chapter
		} catch (e) {
			toast.error(errorMessage(e, 'Could not move chapter'))
			throw e
		}
	}

	async function hideChapter(name, args = {}) {
		const chapter = await call('next_chapter.api.chapter.hide_chapter', {
			name,
			until: args.until || null,
			preset: args.preset || null,
		})
		replaceChapter(chapter)
		if (state.active === name) {
			const next = state.chapters.find((c) => !c.is_hidden)
			state.active = next?.name || null
		}
		return chapter
	}

	async function unhideChapter(name) {
		const chapter = await call('next_chapter.api.chapter.unhide_chapter', { name })
		replaceChapter(chapter)
		return chapter
	}

	async function setSession(name, next_write_on) {
		if (!next_write_on) {
			const chapter = await call('next_chapter.api.chapter.clear_writing_session', {
				name,
			})
			replaceChapter(chapter)
			return chapter
		}
		const chapter = await call('next_chapter.api.chapter.set_writing_session', {
			name,
			next_write_on,
		})
		replaceChapter(chapter)
		return chapter
	}

	async function completeWritingSession(payload) {
		const result = await call('next_chapter.api.chapter.complete_writing_session', payload)
		if (result?.chapter) {
			replaceChapter(result.chapter)
		}
		if (result?.prefs) {
			state.prefs = result.prefs
		}
		return result
	}

	async function captureSideIdea({ parent, text, name = null }) {
		const chapter = await call('next_chapter.api.chapter.capture_side_idea', {
			parent,
			text,
			name,
		})
		replaceChapter(chapter)
		return chapter
	}

	async function fetchChapterStats(chapter) {
		return call('next_chapter.api.session.chapter_stats', { chapter })
	}

	async function savePrefs(updates) {
		const prefs = await call('next_chapter.api.session.save_prefs', updates)
		state.prefs = prefs || {}
		return prefs
	}

	function effectiveSetting(key, fallback = null) {
		const pref = state.prefs?.[key]
		if (pref !== undefined && pref !== null && pref !== '') return pref
		if (state.settings?.[key] !== undefined && state.settings?.[key] !== null) {
			return state.settings[key]
		}
		return fallback
	}

	function downloadIcs(name) {
		window.location.href = `/api/method/next_chapter.api.chapter.download_ics?name=${encodeURIComponent(name)}`
	}

	function formatDateTime(value) {
		if (!value) return ''
		return dayjs(value).format('D MMM YYYY, HH:mm')
	}

	function formatTime(value) {
		if (!value) return ''
		return dayjs(value).format('HH:mm')
	}

	function plainSummary(html) {
		return String(html || '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim()
	}

	function countWords(text) {
		const t = String(text || '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim()
		if (!t) return 0
		return t.split(/\s+/).length
	}

	return {
		state,
		activeChapter,
		filteredChapters,
		scheduledChapters,
		bootstrap,
		createIdea,
		saveChapter,
		setStage,
		hideChapter,
		unhideChapter,
		setSession,
		completeWritingSession,
		captureSideIdea,
		fetchChapterStats,
		savePrefs,
		effectiveSetting,
		downloadIcs,
		formatDateTime,
		formatTime,
		plainSummary,
		countWords,
		errorMessage,
	}
}
