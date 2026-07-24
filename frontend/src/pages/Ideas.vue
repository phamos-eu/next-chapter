<template>
  <AppShell>
    <div class="flex min-h-0 flex-1 overflow-hidden">
      <!-- Center: header + cards -->
      <section class="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header
          class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-outline-gray-1 px-5 py-3"
        >
          <div>
            <h1 class="text-xl font-semibold text-ink-gray-9">Ideas</h1>
            <p class="text-sm text-ink-gray-5">
              Catch rough thoughts here. Open one when you want to write it out.
            </p>
          </div>
          <Button variant="solid" label="Add Idea" @click="onAdd" />
        </header>

        <div
          v-if="state.stageFilter === 'Done' && state.listMode === 'active'"
          class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#ddd8d0] bg-[#f3f1ed] px-5 py-2.5 text-sm text-ink-gray-7"
        >
          <p>
            Only {{ DONE_PREVIEW_LIMIT }} are shown here \u2014 the rest live in History.
          </p>
          <Button variant="subtle" label="Open History" @click="router.push('/history')" />
        </div>

        <div
          v-if="!filteredChapters.length"
          class="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-6 text-center"
        >
          <div class="text-base font-medium text-ink-gray-8">
            {{ state.listMode === 'hidden' ? 'Nothing hidden right now' : 'No ideas yet' }}
          </div>
          <p class="max-w-sm text-sm text-ink-gray-5">
            {{
              state.listMode === 'hidden'
                ? 'Snoozed ideas and ones beyond your visible limit appear here.'
                : 'Add your first idea \u2014 a short name is enough to start.'
            }}
          </p>
          <Button
            v-if="state.listMode !== 'hidden'"
            class="mt-2"
            variant="solid"
            label="Add Idea"
            @click="onAdd"
          />
        </div>

        <div
          v-else
          ref="gridEl"
          class="min-h-0 flex-1 p-4"
          :class="fitActive ? 'overflow-hidden' : 'overflow-y-auto'"
        >
          <div class="grid" :style="gridStyle">
            <button
              v-for="chapter in filteredChapters"
              :key="chapter.name"
              type="button"
              class="idea-card relative flex flex-col overflow-hidden rounded-2xl border border-[#ddd8d0] bg-[#faf8f5] p-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-[#c4bdb0] hover:bg-white"
              :class="fitActive ? 'min-h-0' : 'min-h-[7.5rem]'"
              @click="openIdea(chapter)"
            >
              <IdeaMotifFade
                :seed="chapter.name"
                intensity="card"
                :enabled="motifFadeEnabled"
              />
              <div class="relative z-[1] flex min-h-0 flex-1 flex-col">
                <div class="flex items-start justify-between gap-2">
                  <span class="min-w-0 flex-1 truncate text-sm font-medium text-ink-gray-9">
                    {{ chapter.title || 'Untitled' }}
                  </span>
                  <Badge
                    class="shrink-0"
                    :theme="STAGE_COLORS[chapter.writing_stage] || 'gray'"
                    size="sm"
                  >
                    {{ chapter.writing_stage }}
                  </Badge>
                </div>
                <p
                  class="mt-1 text-sm text-ink-gray-5"
                  :class="fitActive ? 'min-h-0 flex-1 overflow-hidden' : 'line-clamp-2'"
                >
                  {{ plainSummary(chapter.summary) || 'No notes yet' }}
                </p>
                <div class="mt-auto flex shrink-0 justify-end pt-2 text-xs text-ink-gray-4">
                  {{ formatAge(chapter.creation) }}
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      <!-- Right: filters / layout -->
      <aside
        class="flex w-56 shrink-0 flex-col border-l border-[#ddd8d0] bg-[#efece7]"
      >
        <div class="border-b border-[#ddd8d0] px-4 py-3">
          <div class="font-medium text-ink-gray-9">Browse</div>
          <div class="text-xs text-ink-gray-5">Filter and arrange ideas</div>
        </div>
        <div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
          <div>
            <div class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-gray-5">
              Status
            </div>
            <TabButtons v-model="state.listMode" :buttons="listModes" class="w-full" />
          </div>
          <div>
            <div class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-gray-5">
              Layout
            </div>
            <TabButtons
              :model-value="ideasLayout"
              :buttons="layoutModes"
              class="w-full"
              @update:model-value="onLayoutChange"
            />
            <p class="mt-2 text-[11px] leading-snug text-ink-gray-5">
              {{
                fitActive
                  ? 'Active fits every idea on screen.'
                  : 'Hidden keeps comfortable card size and scrolls.'
              }}
            </p>
          </div>
          <div>
            <div class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-gray-5">
              Stage
            </div>
            <div class="flex flex-col gap-1">
              <button
                v-for="stage in ['All', ...STAGES]"
                :key="stage"
                type="button"
                class="rounded-lg border px-2.5 py-1.5 text-left text-xs transition"
                :class="
                  state.stageFilter === stage
                    ? 'border-ink-gray-9 bg-ink-gray-9 font-medium text-white'
                    : 'border-[#ddd8d0] bg-[#faf8f5] text-ink-gray-7 hover:border-[#c4bdb0] hover:bg-white'
                "
                @click="state.stageFilter = stage"
              >
                {{ stage }}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </AppShell>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Badge, Button, TabButtons, toast } from 'frappe-ui'
import AppShell from '@/components/AppShell.vue'
import IdeaMotifFade from '@/components/IdeaMotifFade.vue'
import { DONE_PREVIEW_LIMIT, STAGE_COLORS, STAGES, useWorkspace } from '@/composables/useWorkspace'

const router = useRouter()
const {
	state,
	filteredChapters,
	createIdea,
	formatAge,
	plainSummary,
	savePrefs,
} = useWorkspace()

const listModes = [
	{ label: 'Active', value: 'active' },
	{ label: 'Hidden', value: 'hidden' },
]

const layoutModes = [
	{ label: 'List', value: 'list' },
	{ label: 'Columns', value: 'columns' },
]

const ideasLayout = ref('list')
const gridEl = ref(null)
const paneWidth = ref(0)
const paneHeight = ref(0)
let resizeObserver = null

const motifFadeEnabled = computed(() => Number(state.prefs?.idea_motif_fade ?? 1) === 1)
/** Fit-to-viewport only while browsing Active ideas. */
const fitActive = computed(() => state.listMode === 'active')

const fit = computed(() => {
	const count = filteredChapters.value.length || 1
	const w = paneWidth.value || 800
	const h = paneHeight.value || 500
	const gap = 12
	const mode = ideasLayout.value === 'columns' ? 'columns' : 'list'

	let cols = mode === 'list' ? 1 : 2
	if (!fitActive.value) {
		// Comfortable fixed sizing with scroll
		if (mode === 'columns') {
			cols = Math.min(count, Math.max(2, Math.floor(w / 240)))
		}
		return { cols, gap, stretch: false }
	}

	if (mode === 'columns') {
		const maxCols = Math.min(count, Math.max(2, Math.floor(w / 180)))
		while (cols < maxCols) {
			const rows = Math.ceil(count / cols)
			const rowH = (h - gap * (rows - 1)) / rows
			if (rowH >= 96) break
			cols += 1
		}
		while (cols < count) {
			const rows = Math.ceil(count / cols)
			const rowH = (h - gap * (rows - 1)) / rows
			if (rowH >= 72) break
			cols += 1
		}
	}

	return { cols, gap, stretch: true }
})

const gridStyle = computed(() => {
	const base = {
		gridTemplateColumns: `repeat(${fit.value.cols}, minmax(0, 1fr))`,
		gap: `${fit.value.gap}px`,
	}
	if (fit.value.stretch) {
		return {
			...base,
			gridAutoRows: '1fr',
			height: '100%',
		}
	}
	return {
		...base,
		gridAutoRows: 'minmax(7.5rem, auto)',
	}
})

function syncLayoutFromPrefs() {
	const layout = state.prefs?.ideas_layout
	ideasLayout.value = layout === 'columns' ? 'columns' : 'list'
}

async function onLayoutChange(value) {
	ideasLayout.value = value === 'columns' ? 'columns' : 'list'
	try {
		await savePrefs({ ideas_layout: ideasLayout.value })
	} catch {
		/* keep local choice */
	}
}

function measure() {
	const el = gridEl.value
	if (!el) return
	paneWidth.value = el.clientWidth
	paneHeight.value = el.clientHeight
}

function openIdea(chapter) {
	state.active = chapter.name
	router.push(`/ideas/${chapter.name}`)
}

async function onAdd() {
	try {
		const chapter = await createIdea('New idea')
		toast.success('Idea added')
		router.push(`/ideas/${chapter.name}`)
	} catch (e) {
		toast.error(e.messages?.[0] || e.message || 'Could not add idea')
	}
}

watch(
	() => state.prefs?.ideas_layout,
	() => syncLayoutFromPrefs(),
)

watch([filteredChapters, () => state.listMode], () =>
	nextTick(() => {
		attachObserver()
		measure()
	}),
)

function attachObserver() {
	resizeObserver?.disconnect()
	resizeObserver = null
	if (!gridEl.value || typeof ResizeObserver === 'undefined') return
	resizeObserver = new ResizeObserver(() => measure())
	resizeObserver.observe(gridEl.value)
}

onMounted(() => {
	syncLayoutFromPrefs()
	nextTick(() => {
		attachObserver()
		measure()
	})
})

onBeforeUnmount(() => {
	resizeObserver?.disconnect()
	resizeObserver = null
})
</script>
