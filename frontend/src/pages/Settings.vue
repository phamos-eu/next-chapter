<template>
  <AppShell>
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header class="border-b border-outline-gray-1 px-5 py-3">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 class="text-xl font-semibold text-ink-gray-9">Settings</h1>
            <p class="text-sm text-ink-gray-5">
              Adjust personal preferences and preview how the Ideas overview will look.
            </p>
          </div>
          <p class="text-xs text-ink-gray-4">{{ saveState }}</p>
        </div>
        <div class="mt-3">
          <TabButtons v-model="tab" :buttons="tabs" />
        </div>
      </header>

      <div class="flex min-h-0 flex-1 flex-col lg:flex-row">
        <!-- Controls -->
        <div
          class="min-h-0 w-full shrink-0 overflow-y-auto border-b border-outline-gray-1 p-5 lg:w-[22rem] lg:border-b-0 lg:border-r"
        >
          <div v-if="tab === 'appearance'" class="space-y-4">
            <p class="text-xs text-ink-gray-5">
              Scale text and UI for easier reading. Changes apply across NextChapter and update the
              preview on the right.
            </p>
            <FormControl
              v-model="form.ui_scale"
              type="select"
              label="UI scale"
              :options="scaleOptions"
              @update:model-value="onScaleChange"
            />
            <p class="text-sm text-ink-gray-7">
              Sample at this scale:
              <span class="font-medium text-ink-gray-9">The quick brown idea</span>
            </p>
            <p class="text-xs text-ink-gray-5">
              Default is 125% — sized for comfortable reading on typical desks.
            </p>
            <FormControl
              v-model="form.overview_title_size"
              type="select"
              label="Overview title size"
              :options="titleSizeOptions"
              @update:model-value="scheduleSave"
            />
            <p class="text-xs text-ink-gray-5">
              Comfortable matches the default idea overview title. Large and larger bump the name
              field only.
            </p>
          </div>

          <div v-else-if="tab === 'ideas'" class="space-y-4">
            <p class="text-xs text-ink-gray-5">
              Sort and how many ideas stay Active. Overflow ideas move to Hidden automatically.
              These controls stay here — not on the Ideas list.
            </p>
            <FormControl
              v-model="form.ideas_sort"
              type="select"
              label="Sort order"
              :options="sortOptions"
              @update:model-value="scheduleSave"
            />
            <FormControl
              v-model="form.ideas_visible_limit"
              type="number"
              label="Visible ideas limit"
              @update:model-value="scheduleSave"
            />
          </div>

          <div v-else class="space-y-4">
            <p class="text-xs text-ink-gray-5">Focus writing preferences for sessions and the overview Edit dialog.</p>
            <label class="flex items-center gap-2 text-sm text-ink-gray-7">
              <input v-model="form.page_pile" type="checkbox" @change="scheduleSave" />
              Page pile writing mode (stage 3+)
            </label>
            <FormControl
              v-model="form.edit_idle_secs"
              type="number"
              label="Edit dialog idle auto-close (seconds)"
              @update:model-value="scheduleSave"
            />
            <FormControl
              v-model="form.focus_font_preview"
              type="number"
              label="Focus font size preview (px)"
              @update:model-value="bumpPreview"
            />
            <p class="text-[11px] text-ink-gray-4">
              Focus font size is a site default; this slider only previews the writing slate below.
            </p>
          </div>

          <a
            class="mt-6 inline-flex text-xs text-ink-gray-5 underline hover:text-ink-gray-8"
            href="/app/nextchapter-settings"
          >
            Open site defaults on Desk
          </a>
        </div>

        <!-- Live preview -->
        <div class="flex min-h-0 min-w-0 flex-1 flex-col bg-[#f3f1ed]/60 p-4">
          <div class="mb-2 flex items-center justify-between gap-2">
            <div class="text-xs font-semibold uppercase tracking-wide text-ink-gray-5">
              Preview — {{ previewLabel }}
            </div>
            <div class="text-[11px] text-ink-gray-4">Uses your scale ({{ form.ui_scale }}%)</div>
          </div>

          <div
            class="min-h-0 flex-1 overflow-hidden rounded-xl border border-[#ddd8d0] bg-surface-white shadow-sm"
            :style="previewRootStyle"
          >
            <!-- Ideas overview preview -->
            <div v-if="tab === 'appearance' || tab === 'ideas'" class="flex h-full flex-col">
              <div class="border-b border-outline-gray-1 px-4 py-3">
                <div class="text-xl font-semibold text-ink-gray-9">Ideas</div>
                <p class="text-sm text-ink-gray-5">
                  Catch rough thoughts here. Open one when you want to write it out.
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2 border-b border-outline-gray-1 px-4 py-2">
                <div
                  class="rounded border border-outline-gray-2 px-2 py-1 text-sm text-ink-gray-4"
                >
                  Search ideas…
                </div>
                <span class="rounded bg-surface-gray-2 px-2 py-0.5 text-xs font-medium">Active</span>
                <span class="rounded border border-outline-gray-2 px-2 py-0.5 text-xs text-ink-gray-5">
                  Hidden
                </span>
              </div>
              <ul class="min-h-0 flex-1 divide-y divide-outline-gray-1 overflow-y-auto">
                <li v-for="chapter in previewIdeas" :key="chapter.name">
                  <div class="flex items-start gap-3 px-4 py-3.5">
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="truncate text-sm font-medium text-ink-gray-9">
                          {{ chapter.title || 'Untitled' }}
                        </span>
                        <Badge :theme="STAGE_COLORS[chapter.writing_stage] || 'gray'" size="sm">
                          {{ chapter.writing_stage }}
                        </Badge>
                      </div>
                      <p class="mt-1 line-clamp-2 text-sm text-ink-gray-5">
                        {{ previewBlurb(chapter) }}
                      </p>
                    </div>
                    <div class="shrink-0 text-xs text-ink-gray-4">
                      {{ chapter.next_write_on ? formatDateTime(chapter.next_write_on) : '' }}
                    </div>
                  </div>
                </li>
                <li v-if="!previewIdeas.length" class="px-4 py-8 text-center text-sm text-ink-gray-5">
                  No active ideas to preview yet.
                </li>
              </ul>
              <div class="border-t border-outline-gray-1 px-4 py-2 text-[11px] text-ink-gray-4">
                Showing up to {{ form.ideas_visible_limit }} active ideas · sort:
                {{ sortLabel }}
              </div>
            </div>

            <!-- Writing slate preview -->
            <div v-else class="flex h-full flex-col bg-[#f3f1ed]">
              <div class="border-b border-[#ddd8d0] bg-[#f3f1ed] px-4 py-3">
                <div class="text-2xl font-semibold tracking-tight text-ink-gray-9">
                  {{ previewIdeas[0]?.title || 'Sample idea' }}
                </div>
                <div class="mt-2 flex gap-2">
                  <span class="rounded border border-[#ddd8d0] px-2 py-1 text-xs">Edit</span>
                  <span
                    class="rounded bg-ink-gray-9 px-2 py-1 text-xs text-surface-white"
                  >
                    Start writing session
                  </span>
                </div>
              </div>
              <div class="min-h-0 flex-1 overflow-y-auto p-4">
                <div
                  class="min-h-[10rem] rounded-2xl border border-[#ddd8d0] bg-[#faf8f5] p-4 leading-relaxed text-ink-gray-8"
                  :style="{ fontSize: `${form.focus_font_preview}px` }"
                >
                  {{
                    previewBlurb(previewIdeas[0]) ||
                    'Your writing appears here — scale and focus size update this preview live.'
                  }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Badge, FormControl, TabButtons, toast } from 'frappe-ui'
import dayjs from 'dayjs'
import AppShell from '@/components/AppShell.vue'
import { STAGE_COLORS, useWorkspace } from '@/composables/useWorkspace'

const { state, bootstrap, savePrefs, plainSummary, applyUiScale } = useWorkspace()

const tab = ref('appearance')
const tabs = [
	{ label: 'Appearance', value: 'appearance' },
	{ label: 'Ideas', value: 'ideas' },
	{ label: 'Writing', value: 'writing' },
]

const form = reactive({
	ui_scale: 125,
	overview_title_size: 'comfortable',
	ideas_sort: 'modified_desc',
	ideas_visible_limit: 20,
	page_pile: false,
	edit_idle_secs: 45,
	focus_font_preview: 18,
})
const saveState = ref('Changes save automatically')
let saveTimer = null

const scaleOptions = [
	{ label: '90% — compact', value: 90 },
	{ label: '100% — browser default', value: 100 },
	{ label: '110% — comfortable', value: 110 },
	{ label: '120% — larger', value: 120 },
	{ label: '125% — default', value: 125 },
	{ label: '130% — extra large', value: 130 },
	{ label: '140% — maximum', value: 140 },
]

const titleSizeOptions = [
	{ label: 'Comfortable — default', value: 'comfortable' },
	{ label: 'Large', value: 'large' },
	{ label: 'Larger', value: 'larger' },
]

const sortOptions = [
	{ label: 'Recently edited first', value: 'modified_desc' },
	{ label: 'Title A–Z', value: 'title_asc' },
	{ label: 'Growth stage', value: 'stage_asc' },
	{ label: 'Sequence', value: 'sequence_asc' },
]

const previewLabel = computed(() =>
	tab.value === 'writing' ? 'Idea overview' : 'Ideas list',
)

const sortLabel = computed(() => {
	const hit = sortOptions.find((o) => o.value === form.ideas_sort)
	return hit?.label || form.ideas_sort
})

const previewRootStyle = computed(() => {
	const scale = Math.max(90, Math.min(140, Number(form.ui_scale) || 125)) / 100
	return { fontSize: `${16 * scale}px` }
})

const previewIdeas = computed(() => {
	const sort = form.ideas_sort || 'modified_desc'
	const limit = Math.max(1, Number(form.ideas_visible_limit) || 20)
	const stageRank = Object.fromEntries(state.stages.map((s, i) => [s, i]))
	const list = state.chapters.filter((c) => !c.is_hidden).slice()
	list.sort((a, b) => {
		if (sort === 'title_asc') return (a.title || '').localeCompare(b.title || '')
		if (sort === 'stage_asc') {
			return (stageRank[a.writing_stage] ?? 99) - (stageRank[b.writing_stage] ?? 99)
		}
		if (sort === 'sequence_asc') return (a.sequence || 0) - (b.sequence || 0)
		return dayjs(b.modified || 0).valueOf() - dayjs(a.modified || 0).valueOf()
	})
	return list.slice(0, Math.min(limit, 8))
})

function previewBlurb(chapter) {
	if (!chapter) return ''
	const fromSummary = plainSummary(chapter.summary)
	if (fromSummary) return fromSummary
	return String(chapter.content || '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 140)
}

function formatDateTime(value) {
	if (!value) return ''
	return dayjs(value).format('D MMM, HH:mm')
}

function syncFromPrefs() {
	const p = state.prefs || {}
	form.ui_scale = Number(p.ui_scale || 125)
	const titleSize = p.overview_title_size || 'comfortable'
	form.overview_title_size =
		titleSize === 'large' || titleSize === 'larger' ? titleSize : 'comfortable'
	form.ideas_sort = p.ideas_sort || 'modified_desc'
	form.ideas_visible_limit = Number(p.ideas_visible_limit || 20)
	form.page_pile = Boolean(p.page_pile)
	form.edit_idle_secs = Number(p.edit_idle_secs || 45)
	form.focus_font_preview = Number(state.settings.focus_font_size || 18)
}

function onScaleChange() {
	applyUiScale(form.ui_scale)
	scheduleSave()
}

function bumpPreview() {
	/* local preview only */
}

function scheduleSave() {
	saveState.value = 'Saving…'
	clearTimeout(saveTimer)
	saveTimer = setTimeout(async () => {
		try {
			await savePrefs({
				ui_scale: Math.max(90, Math.min(140, Number(form.ui_scale) || 125)),
				overview_title_size: form.overview_title_size || 'comfortable',
				ideas_sort: form.ideas_sort,
				ideas_visible_limit: Math.max(1, Number(form.ideas_visible_limit) || 20),
				page_pile: form.page_pile ? 1 : 0,
				edit_idle_secs: Math.max(5, Number(form.edit_idle_secs) || 45),
			})
			applyUiScale(form.ui_scale)
			saveState.value = 'Saved'
		} catch (e) {
			saveState.value = 'Could not save'
			toast.error(e?.messages?.[0] || e?.message || 'Could not save settings')
		}
	}, 400)
}

watch(
	() => state.prefs,
	() => syncFromPrefs(),
	{ deep: true },
)

onMounted(async () => {
	await bootstrap()
	syncFromPrefs()
	applyUiScale(form.ui_scale)
})
</script>
