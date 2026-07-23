<template>
  <AppShell>
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header
        class="flex flex-wrap items-center justify-between gap-3 border-b border-outline-gray-1 px-5 py-3"
      >
        <div>
          <h1 class="text-xl font-semibold text-ink-gray-9">Ideas</h1>
          <p class="text-sm text-ink-gray-5">
            Catch rough thoughts here. Open one when you want to write it out.
          </p>
        </div>
        <Button variant="solid" label="Add Idea" @click="onAdd" />
      </header>

      <div class="flex flex-wrap items-center gap-3 border-b border-outline-gray-1 px-5 py-3">
        <div class="w-72 max-w-full">
          <TextInput v-model="state.search" type="text" placeholder="Search ideas…" />
        </div>
        <TabButtons v-model="state.listMode" :buttons="listModes" />
        <TabButtons
          :model-value="ideasLayout"
          :buttons="layoutModes"
          @update:model-value="onLayoutChange"
        />
        <div class="flex flex-wrap gap-1">
          <button
            v-for="stage in ['All', ...state.stages]"
            :key="stage"
            class="rounded border px-2 py-0.5 text-xs"
            :class="
              state.stageFilter === stage
                ? 'border-ink-gray-9 bg-surface-gray-2 font-medium text-ink-gray-9'
                : 'border-outline-gray-2 text-ink-gray-5 hover:border-outline-gray-3'
            "
            @click="state.stageFilter = stage"
          >
            {{ stage }}
          </button>
        </div>
      </div>

      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          v-if="state.stageFilter === 'Done' && state.listMode === 'active'"
          class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#ddd8d0] bg-[#f3f1ed] px-5 py-2.5 text-sm text-ink-gray-7"
        >
          <p>
            Only {{ DONE_PREVIEW_LIMIT }} are shown here — the rest live in History.
          </p>
          <Button variant="subtle" label="Open History" @click="router.push('/history')" />
        </div>
        <div
          v-if="!filteredChapters.length"
          class="flex h-full flex-col items-center justify-center gap-2 px-6 text-center"
        >
          <div class="text-base font-medium text-ink-gray-8">
            {{ state.listMode === 'hidden' ? 'Nothing hidden right now' : 'No ideas yet' }}
          </div>
          <p class="max-w-sm text-sm text-ink-gray-5">
            {{
              state.listMode === 'hidden'
                ? 'Snoozed ideas and ones beyond your visible limit appear here.'
                : 'Add your first idea — a short name is enough to start.'
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
          class="min-h-0 flex-1 overflow-hidden p-4"
        >
          <div class="grid h-full min-h-0" :style="gridStyle">
            <button
              v-for="chapter in filteredChapters"
              :key="chapter.name"
              type="button"
              class="idea-card relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#ddd8d0] bg-[#faf8f5] text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-[#c4bdb0] hover:bg-white"
              :style="cardStyle"
              @click="openIdea(chapter)"
            >
              <IdeaMotifFade
                :seed="chapter.name"
                intensity="card"
                :enabled="motifFadeEnabled"
              />
              <div class="relative z-[1] flex min-h-0 flex-1 flex-col">
                <div class="flex items-start justify-between gap-2">
                  <span
                    class="min-w-0 flex-1 truncate font-medium text-ink-gray-9"
                    :style="{ fontSize: `${titleSize}px` }"
                  >
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
                  class="mt-1 min-h-0 flex-1 overflow-hidden text-ink-gray-5"
                  :style="{ fontSize: `${bodySize}px`, lineHeight: 1.35 }"
                >
                  {{ plainSummary(chapter.summary) || 'No notes yet' }}
                </p>
                <div
                  class="mt-auto shrink-0 pt-1 text-ink-gray-4"
                  :style="{ fontSize: `${metaSize}px` }"
                >
                  {{ formatAge(chapter.creation) }}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Badge, Button, TabButtons, TextInput, toast } from 'frappe-ui'
import AppShell from '@/components/AppShell.vue'
import IdeaMotifFade from '@/components/IdeaMotifFade.vue'
import { DONE_PREVIEW_LIMIT, STAGE_COLORS, useWorkspace } from '@/composables/useWorkspace'

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

const fit = computed(() => {
	const count = filteredChapters.value.length || 1
	const w = paneWidth.value || 800
	const h = paneHeight.value || 500
	const gap = 12
	const pad = 8
	const mode = ideasLayout.value === 'columns' ? 'columns' : 'list'

	let cols = mode === 'list' ? 1 : 2
	if (mode === 'columns') {
		const maxCols = Math.min(count, Math.max(2, Math.floor(w / 180)))
		while (cols < maxCols) {
			const rows = Math.ceil(count / cols)
			const rowH = (h - gap * (rows - 1)) / rows
			if (rowH >= 88) break
			cols += 1
		}
		// Keep growing if still too tall
		while (cols < count) {
			const rows = Math.ceil(count / cols)
			const rowH = (h - gap * (rows - 1)) / rows
			if (rowH >= 56) break
			cols += 1
		}
	}

	const rows = Math.ceil(count / cols)
	const cellH = Math.max(48, (h - gap * Math.max(0, rows - 1)) / rows)
	const cellW = (w - gap * Math.max(0, cols - 1)) / cols

	// Scale type from available cell height
	const scale = Math.min(1, Math.max(0.55, (cellH - pad * 2) / 110))
	const titleSize = Math.round(14 * scale * 10) / 10
	const bodySize = Math.round(12.5 * scale * 10) / 10
	const metaSize = Math.round(11 * scale * 10) / 10
	const cardPad = Math.max(8, Math.round(14 * scale))

	return {
		cols,
		gap,
		titleSize,
		bodySize,
		metaSize,
		cardPad,
		cellH,
		cellW,
	}
})

const gridStyle = computed(() => ({
	gridTemplateColumns: `repeat(${fit.value.cols}, minmax(0, 1fr))`,
	gridAutoRows: '1fr',
	gap: `${fit.value.gap}px`,
	height: '100%',
}))

const cardStyle = computed(() => ({
	padding: `${fit.value.cardPad}px`,
}))

const titleSize = computed(() => fit.value.titleSize)
const bodySize = computed(() => fit.value.bodySize)
const metaSize = computed(() => fit.value.metaSize)

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

watch(filteredChapters, () => nextTick(() => {
	attachObserver()
	measure()
}))

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
