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
          <div class="flex flex-wrap items-start justify-between gap-3">
            <TextInput
              v-model="draft.title"
              class="!border-0 !bg-transparent !px-0 text-2xl font-semibold"
              placeholder="Give this idea a short name"
              @update:model-value="scheduleSave"
            />
            <div class="flex gap-2">
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
                  <div class="text-sm font-medium text-ink-gray-9">{{ row.value }}</div>
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
          <label class="flex items-center gap-2 text-sm text-ink-gray-7">
            <input v-model="pagePile" type="checkbox" @change="onPagePile" />
            Page pile writing mode
          </label>
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

    <!-- Edit dialog -->
    <div
      v-if="editOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-ink-gray-9/35 p-4"
    >
      <div
        class="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[#d4cfc6] bg-[#faf8f5] p-4 shadow-lg"
        @mousemove="bumpEditIdle"
        @keydown="bumpEditIdle"
      >
        <div class="mb-2 flex items-center justify-between">
          <div class="font-medium text-ink-gray-9">Edit writing</div>
          <div v-if="editCountdown !== null" class="text-xs text-ink-gray-5">
            Closing in {{ editCountdown }}s…
          </div>
        </div>
        <textarea
          ref="editInput"
          v-model="editText"
          class="min-h-[16rem] flex-1 resize-none rounded-xl border border-[#ddd8d0] bg-[#f7f5f1] p-3 text-base leading-relaxed outline-none"
          :style="{ fontSize: `${focusFontSize}px` }"
          @input="bumpEditIdle"
        />
        <div class="mt-3 flex justify-end gap-2">
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
import { STAGE_META, useWorkspace } from '@/composables/useWorkspace'

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
	const aim = p.aim_mix || {}
	return [
		{
			title: 'Consistency',
			rows: [
				{ label: 'Sessions (total)', value: c.total_sessions ?? '—' },
				{ label: 'Avg / week', value: c.avg_sessions_per_week ?? '—' },
				{
					label: 'Best / quiet week',
					value: `${c.best_week ?? '—'} / ${c.quietest_week ?? '—'}`,
				},
			],
		},
		{
			title: 'Output',
			rows: [
				{ label: 'Words written (total)', value: o.total_words ?? '—' },
				{
					label: 'Last planned → actual',
					value: formatPairs(o.planned_vs_actual),
				},
				{ label: 'Recent sessions', value: (o.words_trend || []).length || '—' },
			],
			spark: o.words_trend || [],
		},
		{
			title: 'Time',
			rows: [
				{ label: 'Total focus (mins)', value: t.total_focus_mins ?? '—' },
				{ label: 'Avg session', value: t.avg_session_mins ?? '—' },
				{ label: 'Longest session', value: t.longest_session_mins ?? '—' },
			],
		},
		{
			title: 'Planning & aim',
			rows: [
				{ label: 'Scheduled sessions', value: p.scheduled_sessions ?? '—' },
				{
					label: 'Focus-note keep rate',
					value:
						p.focus_note_keep_rate == null
							? '—'
							: `${Math.round(p.focus_note_keep_rate * 100)}%`,
				},
				{
					label: 'Aim mix (more/sim/less)',
					value: `${aim.more || 0}/${aim.similar || 0}/${aim.less || 0}`,
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

function bumpEditIdle() {
	const idle = Number(effectiveSetting('edit_idle_secs', 45)) || 45
	editDeadline = Date.now() + idle * 1000
	editCountdown.value = null
	clearTimeout(editIdleTimer)
	clearInterval(editTickTimer)
	editTickTimer = setInterval(() => {
		const left = Math.ceil((editDeadline - Date.now()) / 1000)
		if (left <= 3 && left > 0) editCountdown.value = left
		if (left <= 0) {
			clearInterval(editTickTimer)
			closeEdit(true)
		}
	}, 200)
	editIdleTimer = setTimeout(() => closeEdit(true), idle * 1000)
}

async function closeEdit(save) {
	clearTimeout(editIdleTimer)
	clearInterval(editTickTimer)
	editCountdown.value = null
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
	editOpen.value = false
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
