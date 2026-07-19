<template>
  <AppShell>
    <div v-if="!state.loaded || loading" class="flex flex-1 items-center justify-center text-ink-gray-5">
      Loading…
    </div>
    <div v-else class="flex min-h-0 flex-1 overflow-hidden">
      <!-- Left: ideas -->
      <aside class="flex w-72 shrink-0 flex-col border-r border-outline-gray-1 bg-surface-gray-1">
        <div class="space-y-2 border-b border-outline-gray-1 p-3">
          <TextInput v-model="state.search" type="text" placeholder="Search ideas…" />
          <TabButtons v-model="state.listMode" :buttons="listModes" />
          <div class="flex flex-wrap gap-1">
            <button
              v-for="stage in ['All', ...state.stages]"
              :key="stage"
              class="rounded-full border px-2 py-0.5 text-xs"
              :class="
                state.stageFilter === stage
                  ? 'border-ink-gray-9 bg-surface-white font-medium text-ink-gray-9'
                  : 'border-outline-gray-2 text-ink-gray-5'
              "
              @click="state.stageFilter = stage"
            >
              {{ stage }}
            </button>
          </div>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto p-2">
          <div
            v-if="!filteredChapters.length"
            class="px-2 py-4 text-sm text-ink-gray-5"
          >
            {{ state.listMode === 'hidden' ? 'Nothing hidden right now.' : 'No ideas match.' }}
          </div>
          <div
            v-for="chapter in filteredChapters"
            :key="chapter.name"
            class="mb-1 flex items-center gap-1 rounded-md"
            :class="state.active === chapter.name ? 'bg-surface-white shadow-sm' : ''"
          >
            <button
              class="min-w-0 flex-1 rounded-md px-2 py-2 text-left hover:bg-surface-gray-2"
              @click="state.active = chapter.name"
            >
              <div class="truncate text-sm font-medium text-ink-gray-9">
                {{ chapter.title || 'Untitled' }}
              </div>
              <Badge class="mt-1" :theme="STAGE_COLORS[chapter.writing_stage] || 'gray'" size="sm">
                {{ chapter.writing_stage }}
              </Badge>
            </button>
            <Button
              variant="ghost"
              size="sm"
              :label="chapter.is_hidden ? 'Show' : '⋯'"
              @click="onMore(chapter)"
            />
          </div>
        </div>
        <div class="border-t border-outline-gray-1 p-3">
          <Button class="w-full" variant="solid" label="Add Idea" @click="onAdd" />
        </div>
      </aside>

      <!-- Center -->
      <section class="flex min-w-0 flex-1 flex-col overflow-hidden">
        <template v-if="activeChapter">
          <div class="border-b border-outline-gray-1 px-5 pt-4">
            <TextInput
              v-model="draft.title"
              class="!border-0 !bg-transparent !px-0 text-xl font-semibold"
              placeholder="Give this idea a short name"
              @update:model-value="scheduleSave"
            />
            <Tabs v-model="centerTab" :tabs="centerTabs" class="mt-2">
              <template #tab-panel="{ tab }">
                <div v-if="tab.name === 'brain'" class="p-5">
                  <p class="mb-3 text-sm text-ink-gray-5">
                    Rough notes are welcome. Write a few sentences about what you have in mind.
                  </p>
                  <Textarea
                    v-model="draft.summary"
                    :rows="14"
                    placeholder="e.g. We need a simple way to track customer tickets…"
                    @update:model-value="scheduleSave"
                  />
                </div>
                <div v-else class="p-5">
                  <p class="mb-3 text-sm text-ink-gray-5">
                    Shape your notes into a clear chapter — what should happen, and why.
                  </p>
                  <TextEditor
                    :key="activeChapter.name"
                    editor-class="prose-sm min-h-[16rem] max-w-none rounded-b-lg border border-outline-gray-2 border-t-0 p-3"
                    :content="draft.content"
                    placeholder="Write freely. Headings, lists, and links are welcome."
                    :fixed-menu="true"
                    @change="onContentChange"
                  />
                </div>
              </template>
            </Tabs>
          </div>
        </template>
        <div v-else class="flex flex-1 items-center justify-center text-ink-gray-5">
          Select an idea on the left, or add a new one to start writing.
        </div>
      </section>

      <!-- Right -->
      <aside
        v-if="activeChapter"
        class="flex w-72 shrink-0 flex-col border-l border-outline-gray-1 bg-surface-gray-1"
      >
        <div class="border-b border-outline-gray-1 px-4 py-3">
          <div class="font-medium text-ink-gray-9">Details</div>
          <div class="text-xs text-ink-gray-5">{{ saveState }}</div>
        </div>
        <div class="space-y-4 overflow-y-auto p-4">
          <FormControl
            v-model="draft.writing_stage"
            type="select"
            label="Progress"
            :options="stageOptions"
            @update:model-value="onStageChange"
          />
          <div class="rounded-lg border border-outline-gray-1 bg-surface-white p-3">
            <div class="mb-2 text-sm font-medium">Next writing session</div>
            <FormControl
              v-model="draft.next_write_on"
              type="datetime-local"
              label="Date & time"
              @update:model-value="onSessionChange"
            />
            <Button
              class="mt-3 w-full"
              variant="solid"
              label="Add to calendar (.ics)"
              :disabled="!draft.next_write_on"
              @click="downloadIcs(activeChapter.name)"
            />
            <p class="mt-2 text-xs text-ink-gray-5">
              Pick a time, then download a calendar file with a link back here.
            </p>
          </div>
          <div class="rounded-lg border border-outline-gray-1 bg-surface-white p-3 text-sm text-ink-gray-6">
            <div class="mb-2 font-medium text-ink-gray-8">How to use this</div>
            <ol class="list-decimal space-y-1 pl-4 text-xs">
              <li>Start in Brain Dump — get thoughts out quickly.</li>
              <li>Open Chapter when you are ready to write it up more clearly.</li>
              <li>Hide ideas you are not focusing on right now.</li>
            </ol>
          </div>
        </div>
      </aside>
    </div>

    <Dialog v-model="hideOpen" :options="{ title: 'Hide this idea' }">
      <template #body-content>
        <p class="mb-3 text-sm font-medium">{{ hideTarget?.title }}</p>
        <p class="mb-2 text-sm text-ink-gray-5">Show it again…</p>
        <FormControl v-model="hidePreset" type="select" label="When" :options="hideOptions" />
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
	Badge,
	Button,
	Dialog,
	FormControl,
	TabButtons,
	Tabs,
	TextEditor,
	TextInput,
	Textarea,
	toast,
} from 'frappe-ui'
import dayjs from 'dayjs'
import AppShell from '@/components/AppShell.vue'
import { STAGE_COLORS, useWorkspace } from '@/composables/useWorkspace'

const router = useRouter()
const route = useRoute()
const {
	state,
	loading,
	activeChapter,
	filteredChapters,
	bootstrap,
	createIdea,
	saveChapter,
	setStage,
	hideChapter,
	unhideChapter,
	setSession,
	downloadIcs,
} = useWorkspace()

const centerTab = ref(0)
const centerTabs = [
	{ label: 'Brain Dump', name: 'brain' },
	{ label: 'Chapter', name: 'chapter' },
]
const listModes = [
	{ label: 'Active', value: 'active' },
	{ label: 'Hidden', value: 'hidden' },
]
const saveState = ref('All changes save automatically')
let saveTimer = null

const draft = reactive({
	title: '',
	summary: '',
	content: '',
	writing_stage: 'Idea',
	next_write_on: '',
})

const stageOptions = computed(() =>
	state.stages.map((s) => ({ label: s, value: s })),
)

watch(
	activeChapter,
	(ch) => {
		if (!ch) return
		draft.title = ch.title || ''
		draft.summary = ch.summary || ''
		draft.content = ch.content || ''
		draft.writing_stage = ch.writing_stage || 'Idea'
		draft.next_write_on = ch.next_write_on
			? dayjs(ch.next_write_on).format('YYYY-MM-DDTHH:mm')
			: ''
		centerTab.value = 0
	},
	{ immediate: true },
)

onMounted(async () => {
	if (!state.loaded) await bootstrap()
	if (state.needsSetup) {
		router.replace('/setup')
		return
	}
	const chapter = route.query.chapter
	if (chapter && typeof chapter === 'string') {
		state.active = chapter
		router.replace({ path: '/write', query: {} })
	}
})

function scheduleSave() {
	saveState.value = 'Saving…'
	clearTimeout(saveTimer)
	saveTimer = setTimeout(async () => {
		if (!activeChapter.value) return
		await saveChapter({
			name: activeChapter.value.name,
			title: draft.title,
			summary: draft.summary,
			content: draft.content,
		})
		saveState.value = 'Saved'
	}, 600)
}

function onContentChange(html) {
	draft.content = html
	scheduleSave()
}

async function onStageChange(stage) {
	if (!activeChapter.value) return
	try {
		await setStage(activeChapter.value.name, stage)
		saveState.value = 'Saved'
	} catch (e) {
		draft.writing_stage = activeChapter.value.writing_stage
	}
}

async function onSessionChange(value) {
	if (!activeChapter.value) return
	const sql = value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : ''
	await setSession(activeChapter.value.name, sql || null)
}

async function onAdd() {
	await createIdea('New idea')
}

const hideOpen = ref(false)
const hideTarget = ref(null)
const hidePreset = ref('Later today')
const hideCustom = ref('')
const hideOptions = [
	'Later today',
	'Tomorrow',
	'Next week',
	'Next month',
	'Custom date',
].map((v) => ({ label: v, value: v }))

async function onMore(chapter) {
	if (chapter.is_hidden) {
		await unhideChapter(chapter.name)
		toast.success('Idea is visible again')
		return
	}
	hideTarget.value = chapter
	hidePreset.value = 'Later today'
	hideCustom.value = ''
	hideOpen.value = true
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
	await hideChapter(hideTarget.value.name, args)
	hideOpen.value = false
	toast.success('Idea hidden')
}
</script>
