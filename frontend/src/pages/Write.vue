<template>
  <AppShell>
    <div v-if="!chapter" class="flex flex-1 flex-col items-center justify-center gap-3 bg-[#f3f1ed]">
      <p class="text-sm text-ink-gray-5">This idea could not be found.</p>
      <Button variant="subtle" label="Back to Ideas" @click="router.push('/ideas')" />
    </div>

    <div v-else class="flex min-h-0 flex-1 overflow-hidden bg-[#f3f1ed]">
      <section class="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div class="px-5 pt-3">
          <button
            class="mb-2 inline-flex items-center gap-1 text-xs text-ink-gray-5 hover:text-ink-gray-8"
            @click="router.push('/ideas')"
          >
            <FeatherIcon name="arrow-left" class="h-3.5 w-3.5" />
            Ideas
          </button>
          <div class="flex flex-wrap items-start justify-between gap-4">
            <TextInput
              v-model="draft.title"
              class="overview-title min-w-0 flex-1 !border-0 !bg-transparent !px-0 !py-1"
              placeholder="Give this idea a short name"
              @update:model-value="scheduleSave"
            />
            <div class="flex shrink-0 gap-2 pt-2">
              <Button variant="subtle" label="Edit" @click="openEdit" />
              <Button
                v-if="draft.writing_stage !== 'Done'"
                variant="solid"
                label="Start writing session"
                @click="router.push(`/session/${chapter.name}`)"
              />
            </div>
          </div>
          <p v-if="state.settings.in_development" class="mt-1 text-xs text-amber-700">
            In Development — gates and ritual skips are unlocked.
          </p>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-5">
          <div
            class="min-h-[16rem] rounded-2xl border border-[#ddd8d0] bg-[#faf8f5] p-5 text-base leading-relaxed text-ink-gray-8 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            :style="{ fontSize: `${focusFontSize}px` }"
          >
            <div
              v-if="plainContent"
              class="whitespace-pre-wrap"
            >
              {{ plainContent }}
            </div>
            <p v-else class="text-ink-gray-4">
              No writing yet. Start a session to begin — or use Edit for a quick change.
            </p>
          </div>

          <div class="mt-4 text-xs text-ink-gray-5">
            {{ wordCount }} words
            <span v-if="nextGate">
              · {{ Math.min(wordCount, nextGate.min) }}/{{ nextGate.min }} to reach stage
              {{ nextGate.stage }}
            </span>
            <span v-if="maxWords"> · max {{ maxWords }}</span>
          </div>

          <!-- 12 stats: 4 themes × 3 -->
          <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
              v-for="col in statColumns"
              :key="col.title"
              class="rounded-xl border border-[#ddd8d0] bg-[#faf8f5]/80 p-3"
            >
              <div class="text-xs font-semibold uppercase tracking-wide text-ink-gray-5">
                {{ col.title }}
              </div>
              <div class="mt-2 space-y-2">
                <div v-for="row in col.rows" :key="row.label">
                  <div class="text-[11px] text-ink-gray-5">{{ row.label }}</div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-sm font-medium text-ink-gray-9">{{ row.value }}</span>
                    <span
                      v-if="row.trend"
                      class="inline-flex text-[11px] font-medium leading-none"
                      :class="trendClass(row.trend)"
                      :title="trendTitle(row.trend)"
                      aria-hidden="true"
                    >
                      {{ trendArrow(row.trend) }}
                    </span>
                  </div>
                </div>
              </div>
              <svg
                v-if="col.spark?.length"
                class="mt-3 h-8 w-full text-ink-gray-6"
                viewBox="0 0 100 24"
                preserveAspectRatio="none"
              >
                <polyline
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  :points="sparkPoints(col.spark)"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <aside class="flex w-72 shrink-0 flex-col border-l border-[#ddd8d0] bg-[#efece7]">
        <div class="border-b border-[#ddd8d0] px-4 py-3">
          <div class="font-medium text-ink-gray-9">Details</div>
          <div class="text-xs text-ink-gray-5">{{ saveState }}</div>
        </div>
        <div class="space-y-4 overflow-y-auto p-4">
          <FormControl
            v-model="draft.writing_stage"
            type="select"
            label="Growth stage"
            :options="stageOptions"
            @update:model-value="onStageChange"
          />
          <p v-if="STAGE_META[draft.writing_stage]" class="text-xs text-ink-gray-5">
            {{ STAGE_META[draft.writing_stage].metaphor }} —
            {{ STAGE_META[draft.writing_stage].job }}
          </p>
          <label
            v-if="pagePileAvailable"
            class="flex items-center gap-2 text-sm text-ink-gray-7"
          >
            <input v-model="pagePile" type="checkbox" @change="onPagePile" />
            Page pile writing mode
          </label>
          <p
            v-else-if="STAGE_META[draft.writing_stage]"
            class="text-xs text-ink-gray-4"
          >
            Page pile unlocks at stage 3.
          </p>
          <p
            v-if="STAGE_META[draft.writing_stage]?.future_page_nav"
            class="text-xs text-ink-gray-4"
          >
            Later: page count and navigation buttons once writing UX matures.
          </p>
          <div class="rounded-lg border border-[#ddd8d0] bg-[#faf8f5] p-3">
            <div class="mb-2 text-sm font-medium">Next writing session</div>
            <FormControl
              v-model="draft.next_write_on"
              type="datetime-local"
              label="Date & time"
              @update:model-value="onSessionChange"
            />
            <Button
              class="mt-3 w-full"
              variant="subtle"
              label="Add to calendar (.ics)"
              :disabled="!draft.next_write_on"
              @click="downloadIcs(chapter.name)"
            />
          </div>
          <Button
            v-if="chapter.is_hidden"
            class="w-full"
            variant="subtle"
            label="Show idea again"
            @click="onUnhide"
          />
          <Button
            v-else
            class="w-full"
            variant="subtle"
            label="Hide for later…"
            @click="hideOpen = true"
          />
        </div>
      </aside>
    </div>

    <!-- Edit dialog — large from the start; page behind does not scroll -->
    <div
      v-if="editOpen"
      class="fixed inset-0 z-50 flex items-stretch justify-center overflow-hidden bg-ink-gray-9/35 p-3 sm:p-5"
    >
      <div
        class="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#d4cfc6] bg-[#faf8f5] p-4 shadow-lg sm:p-5"
        @keydown="bumpEditIdle"
        @pointerdown="bumpEditIdle"
      >
        <div class="mb-3 flex shrink-0 items-center justify-between gap-3">
          <div class="font-medium text-ink-gray-9">Edit writing</div>
          <div
            class="rounded-full px-2.5 py-1 text-xs tabular-nums"
            :class="
              editCountdown !== null && editCountdown <= 3
                ? 'bg-amber-100/80 text-amber-800'
                : 'bg-[#efece7] text-ink-gray-6'
            "
            :aria-live="editCountdown !== null && editCountdown <= 3 ? 'polite' : 'off'"
          >
            <template v-if="editCountdown !== null && editCountdown <= 3">
              Closing in {{ editCountdown }}s…
            </template>
            <template v-else> Auto-close in {{ editSecondsLeft }}s </template>
          </div>
        </div>
        <textarea
          ref="editInput"
          v-model="editText"
          class="min-h-0 w-full flex-1 resize-none rounded-xl border border-[#ddd8d0] bg-[#f7f5f1] p-4 leading-relaxed outline-none"
          :style="{ fontSize: `${focusFontSize}px` }"
          @input="bumpEditIdle"
          @scroll="bumpEditIdle"
        />
        <div class="mt-3 flex shrink-0 justify-end gap-2">
          <Button variant="subtle" label="Cancel" @click="closeEdit(false)" />
          <Button variant="solid" label="Save" @click="closeEdit(true)" />
        </div>
      </div>
    </div>

    <Dialog v-model="hideOpen" :options="{ title: 'Hide this idea' }">
      <template #body-content>
        <p class="mb-3 text-sm font-medium">{{ chapter?.title }}</p>
        <FormControl v-model="hidePreset" type="select" label="Show it again…" :options="hideOptions" />
        <FormControl
          v-if="hidePreset === 'Custom date'"
          v-model="hideCustom"
          class="mt-3"
          type="datetime-local"
          label="Custom date & time"
        />
      </template>
      <template #actions>
        <Button variant="subtle" label="Cancel" @click="hideOpen = false" />
        <Button variant="solid" label="Hide" @click="confirmHide" />
      </template>
    </Dialog>
  </AppShell>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
	Button,
	Dialog,
	FeatherIcon,
	FormControl,
	TextInput,
	toast,
} from 'frappe-ui'
import dayjs from 'dayjs'
import AppShell from '@/components/AppShell.vue'
import { PAGE_PILE_STAGES, STAGE_META, useWorkspace } from '@/composables/useWorkspace'

const router = useRouter()
const route = useRoute()
const {
	state,
	saveChapter,
	setStage,
	hideChapter,
	unhideChapter,
	setSession,
	downloadIcs,
	fetchChapterStats,
	savePrefs,
	countWords,
	effectiveSetting,
} = useWorkspace()

const chapter = computed(
	() => state.chapters.find((c) => c.name === route.params.name) || null,
)

const draft = reactive({
	title: '',
	content: '',
	writing_stage: '∞',
	next_write_on: '',
})
const saveState = ref('All changes save automatically')
let saveTimer = null

const stats = ref(null)
const editOpen = ref(false)
const editText = ref('')
const editInput = ref(null)
/** Seconds left until auto-close; always shown while dialog is open. */
const editSecondsLeft = ref(0)
/** Set only in the final 3s for the stronger “Closing in…” state. */
const editCountdown = ref(null)
let editIdleTimer = null
let editTickTimer = null
let editDeadline = 0

const hideOpen = ref(false)
const hidePreset = ref('Later today')
const hideCustom = ref('')
const hideOptions = [
	'Later today',
	'Tomorrow',
	'Next week',
	'Next month',
	'Custom date',
].map((v) => ({ label: v, value: v }))

const pagePile = ref(false)
const pagePileAvailable = computed(() =>
	PAGE_PILE_STAGES.includes(draft.writing_stage),
)
const focusFontSize = computed(() => Number(effectiveSetting('focus_font_size', 18)))
const maxWords = computed(() => Number(state.settings.max_words || 0))

const plainContent = computed(() =>
	String(draft.content || '')
		.replace(/<[^>]+>/g, '\n')
		.replace(/\n+/g, '\n')
		.trim(),
)
const wordCount = computed(() => countWords(draft.content))

const stageOptions = computed(() =>
	state.stages.map((s) => ({ label: s, value: s })),
)

const nextGate = computed(() => {
	const order = state.stages
	const i = order.indexOf(draft.writing_stage)
	if (i < 0 || i >= order.length - 1) return null
	const stage = order[i + 1]
	if (stage === 'Done') return null
	const min = Number(state.wordGates[stage] || 0)
	if (!min) return null
	return { stage, min }
})

const statColumns = computed(() => {
	const c = stats.value?.consistency || {}
	const o = stats.value?.output || {}
	const t = stats.value?.time || {}
	const p = stats.value?.planning || {}
	const tr = stats.value?.trends || {}
	const aim = p.aim_mix || {}
	return [
		{
			title: 'Consistency',
			rows: [
				{
					label: 'Sessions (total)',
					value: c.total_sessions ?? '—',
					trend: tr.total_sessions,
				},
				{
					label: 'Avg / week',
					value: c.avg_sessions_per_week ?? '—',
					trend: tr.avg_sessions_per_week,
				},
				{
					label: 'Best / quiet week',
					value: `${c.best_week ?? '—'} / ${c.quietest_week ?? '—'}`,
					trend: tr.best_quiet,
				},
			],
		},
		{
			title: 'Output',
			rows: [
				{
					label: 'Words written (total)',
					value: o.total_words ?? '—',
					trend: tr.total_words,
				},
				{
					label: 'Last planned → actual',
					value: formatPairs(o.planned_vs_actual),
					trend: tr.planned_vs_actual,
				},
				{
					label: 'Recent sessions',
					value: (o.words_trend || []).length || '—',
					trend: tr.recent_sessions,
				},
			],
			spark: o.words_trend || [],
		},
		{
			title: 'Time',
			rows: [
				{
					label: 'Total focus (mins)',
					value: t.total_focus_mins ?? '—',
					trend: tr.total_focus_mins,
				},
				{
					label: 'Avg session',
					value: t.avg_session_mins ?? '—',
					trend: tr.avg_session_mins,
				},
				{
					label: 'Longest session',
					value: t.longest_session_mins ?? '—',
					trend: tr.longest_session_mins,
				},
			],
		},
		{
			title: 'Planning & aim',
			rows: [
				{
					label: 'Scheduled sessions',
					value: p.scheduled_sessions ?? '—',
					trend: tr.scheduled_sessions,
				},
				{
					label: 'Focus-note keep rate',
					value:
						p.focus_note_keep_rate == null
							? '—'
							: `${Math.round(p.focus_note_keep_rate * 100)}%`,
					trend: tr.focus_note_keep_rate,
				},
				{
					label: 'Aim mix (more/sim/less)',
					value: `${aim.more || 0}/${aim.similar || 0}/${aim.less || 0}`,
					trend: tr.aim_mix,
				},
			],
		},
	]
})

function formatPairs(pairs) {
	if (!pairs?.length) return '—'
	const [a, b] = pairs[0]
	return `${a} → ${b}`
}

function trendArrow(trend) {
	if (trend === 'up') return '↑'
	if (trend === 'down') return '↓'
	if (trend === 'flat') return '→'
	return ''
}

function trendClass(trend) {
	// Faint green / red / blue
	if (trend === 'up') return 'text-emerald-600/45'
	if (trend === 'down') return 'text-rose-600/45'
	if (trend === 'flat') return 'text-sky-600/45'
	return 'text-ink-gray-4'
}

function trendTitle(trend) {
	if (trend === 'up') return 'Improving'
	if (trend === 'down') return 'Declining'
	if (trend === 'flat') return 'Steady'
	return ''
}

function sparkPoints(values) {
	if (!values.length) return ''
	const max = Math.max(...values, 1)
	return values
		.map((v, i) => {
			const x = (i / Math.max(values.length - 1, 1)) * 100
			const y = 22 - (v / max) * 20
			return `${x},${y}`
		})
		.join(' ')
}

watch(
	chapter,
	async (ch) => {
		if (!ch) return
		state.active = ch.name
		draft.title = ch.title || ''
		draft.content = ch.content || ''
		draft.writing_stage = ch.writing_stage || '∞'
		draft.next_write_on = ch.next_write_on
			? dayjs(ch.next_write_on).format('YYYY-MM-DDTHH:mm')
			: ''
		pagePile.value = Boolean(state.prefs.page_pile)
		try {
			stats.value = await fetchChapterStats(ch.name)
		} catch {
			stats.value = null
		}
	},
	{ immediate: true },
)

function scheduleSave() {
	if (!chapter.value) return
	saveState.value = 'Saving…'
	clearTimeout(saveTimer)
	saveTimer = setTimeout(async () => {
		await saveChapter({ name: chapter.value.name, title: draft.title })
		saveState.value = 'Saved'
	}, 600)
}

async function onStageChange(stage) {
	if (!chapter.value) return
	try {
		await setStage(chapter.value.name, stage)
		saveState.value = 'Saved'
	} catch {
		draft.writing_stage = chapter.value.writing_stage
	}
}

async function onSessionChange(value) {
	if (!chapter.value) return
	const sql = value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : ''
	await setSession(chapter.value.name, sql || null)
}

async function onPagePile() {
	await savePrefs({ page_pile: pagePile.value ? 1 : 0 })
}

function openEdit() {
	editText.value = plainContent.value
	editOpen.value = true
	bumpEditIdle()
	nextTick(() => editInput.value?.focus())
}

function editIdleSecs() {
	const fromPref = Number(effectiveSetting('edit_idle_secs', 45))
	return Math.max(5, fromPref || 45)
}

function syncEditCountdownDisplay() {
	const left = Math.max(0, Math.ceil((editDeadline - Date.now()) / 1000))
	editSecondsLeft.value = left
	editCountdown.value = left <= 3 && left > 0 ? left : null
	if (left <= 0) {
		clearInterval(editTickTimer)
		editTickTimer = null
		closeEdit(true)
	}
}

function bumpEditIdle() {
	if (!editOpen.value) return
	const idle = editIdleSecs()
	editDeadline = Date.now() + idle * 1000
	clearTimeout(editIdleTimer)
	clearInterval(editTickTimer)
	syncEditCountdownDisplay()
	editTickTimer = setInterval(syncEditCountdownDisplay, 250)
	editIdleTimer = setTimeout(() => closeEdit(true), idle * 1000)
}

async function closeEdit(save) {
	if (!editOpen.value) return
	clearTimeout(editIdleTimer)
	clearInterval(editTickTimer)
	editIdleTimer = null
	editTickTimer = null
	editCountdown.value = null
	editSecondsLeft.value = 0
	editOpen.value = false
	if (save && chapter.value) {
		const html = `<p>${String(editText.value || '')
			.split(/\n+/)
			.map((p) =>
				p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
			)
			.join('</p><p>')}</p>`
		await saveChapter({ name: chapter.value.name, content: html })
		draft.content = html
		saveState.value = 'Saved'
	}
}

async function onUnhide() {
	await unhideChapter(chapter.value.name)
	toast.success('Idea is visible again')
}

async function confirmHide() {
	const map = {
		'Later today': 'later_today',
		Tomorrow: 'tomorrow',
		'Next week': 'next_week',
		'Next month': 'next_month',
	}
	const args =
		hidePreset.value === 'Custom date'
			? { until: dayjs(hideCustom.value).format('YYYY-MM-DD HH:mm:ss') }
			: { preset: map[hidePreset.value] }
	await hideChapter(chapter.value.name, args)
	hideOpen.value = false
	toast.success('Idea hidden')
	router.push('/ideas')
}

onBeforeUnmount(() => {
	clearTimeout(saveTimer)
	clearTimeout(editIdleTimer)
	clearInterval(editTickTimer)
})
</script>

<style scoped>
.overview-title :deep(input) {
	min-height: 3.25rem;
	font-size: 2.25rem;
	line-height: 1.2;
	font-weight: 600;
	letter-spacing: -0.02em;
}
@media (min-width: 640px) {
	.overview-title :deep(input) {
		min-height: 3.75rem;
		font-size: 2.75rem;
	}
}
</style>
