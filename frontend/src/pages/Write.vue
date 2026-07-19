<template>
  <AppShell>
    <div v-if="!chapter" class="flex flex-1 flex-col items-center justify-center gap-3">
      <p class="text-sm text-ink-gray-5">This idea could not be found.</p>
      <Button variant="subtle" label="Back to Ideas" @click="router.push('/ideas')" />
    </div>

    <div v-else class="flex min-h-0 flex-1 overflow-hidden">
      <section class="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div class="border-b border-outline-gray-1 px-5 pt-3">
          <button
            class="mb-2 inline-flex items-center gap-1 text-xs text-ink-gray-5 hover:text-ink-gray-8"
            @click="router.push('/ideas')"
          >
            <FeatherIcon name="arrow-left" class="h-3.5 w-3.5" />
            Ideas
          </button>
          <TextInput
            v-model="draft.title"
            class="!border-0 !bg-transparent !px-0 text-xl font-semibold"
            placeholder="Give this idea a short name"
            @update:model-value="scheduleSave"
          />
          <Tabs v-model="centerTab" :tabs="centerTabs" class="mt-1">
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
                  :key="chapter.name"
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
      </section>

      <aside class="flex w-72 shrink-0 flex-col border-l border-outline-gray-1 bg-surface-gray-1">
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
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
	Button,
	Dialog,
	FeatherIcon,
	FormControl,
	Tabs,
	TextEditor,
	TextInput,
	Textarea,
	toast,
} from 'frappe-ui'
import dayjs from 'dayjs'
import AppShell from '@/components/AppShell.vue'
import { useWorkspace } from '@/composables/useWorkspace'

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
} = useWorkspace()

const chapter = computed(
	() => state.chapters.find((c) => c.name === route.params.name) || null,
)

const centerTab = ref(0)
const centerTabs = [
	{ label: 'Brain Dump', name: 'brain' },
	{ label: 'Chapter', name: 'chapter' },
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
	chapter,
	(ch) => {
		if (!ch) return
		state.active = ch.name
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

function scheduleSave() {
	if (!chapter.value) return
	saveState.value = 'Saving…'
	clearTimeout(saveTimer)
	saveTimer = setTimeout(async () => {
		if (!chapter.value) return
		await saveChapter({
			name: chapter.value.name,
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
</script>
