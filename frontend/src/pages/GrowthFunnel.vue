<template>
  <AppShell>
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header class="border-b border-outline-gray-1 px-5 py-3">
        <h1 class="text-xl font-semibold text-ink-gray-9">Growth Funnel</h1>
        <p class="text-sm text-ink-gray-5">
          Narrow ideas from unlimited capture to one focused chapter. Drag across stages \u2014
          WIP limits come from Settings.
        </p>
      </header>

      <div class="flex min-h-0 flex-1 gap-3 overflow-x-auto bg-surface-gray-1 p-3">
        <div
          v-for="stage in STAGES"
          :key="stage"
          class="flex w-56 shrink-0 flex-col rounded-lg border bg-surface-white"
          :class="isFull(stage) ? 'border-yellow-400' : 'border-outline-gray-1'"
          @dragover.prevent
          @drop="onDrop($event, stage)"
        >
          <div class="border-b border-outline-gray-1 px-3 py-2">
            <div class="flex items-center justify-between text-sm font-semibold">
              <span>{{ stage }}</span>
              <span class="text-xs font-normal text-ink-gray-5">
                {{ countLabel(stage) }}{{ isFull(stage) ? ' \u26a0' : '' }}
              </span>
            </div>
            <div v-if="STAGE_META[stage]" class="mt-0.5 text-[11px] text-ink-gray-5">
              {{ STAGE_META[stage].metaphor }} \u00b7 {{ STAGE_META[stage].job }}
            </div>
          </div>
          <div class="min-h-[8rem] flex-1 space-y-2 overflow-y-auto p-2">
            <div
              v-for="chapter in cardsFor(stage)"
              :key="chapter.name"
              class="cursor-grab rounded-md border border-outline-gray-1 bg-surface-white p-2 shadow-sm"
              draggable="true"
              @dragstart="onDragStart($event, chapter.name)"
              @click="openChapter(chapter)"
            >
              <div class="text-sm font-medium text-ink-gray-9">{{ chapter.title }}</div>
              <div v-if="chapter.next_write_on" class="mt-1 text-xs text-ink-gray-5">
                {{ formatDateTime(chapter.next_write_on) }}
              </div>
            </div>
            <button
              v-if="stage === 'Done' && doneStageTruncated()"
              type="button"
              class="w-full rounded-md border border-dashed border-outline-gray-2 px-2 py-2 text-left text-xs text-ink-gray-6 hover:border-outline-gray-3 hover:bg-surface-gray-1"
              @click="router.push('/history')"
            >
              Older Done ideas \u2192 History
            </button>
          </div>
        </div>
      </div>
    </div>

    <Dialog v-model="dialogOpen" :options="{ title: 'Writing session' }">
      <template #body-content>
        <p class="text-sm font-medium">{{ dialogChapter?.title }}</p>
        <p class="mt-2 text-sm text-ink-gray-5">
          When:
          {{
            dialogChapter?.next_write_on
              ? formatDateTime(dialogChapter.next_write_on)
              : 'Not scheduled'
          }}
        </p>
        <p class="text-sm text-ink-gray-5">Stage: {{ dialogChapter?.writing_stage }}</p>
      </template>
      <template #actions>
        <Button
          v-if="dialogChapter?.next_write_on"
          variant="subtle"
          label="Add to calendar (.ics)"
          @click="downloadIcs(dialogChapter.name)"
        />
        <Button variant="subtle" label="Open idea" @click="goWrite" />
        <Button
          v-if="dialogChapter?.writing_stage !== 'Done'"
          variant="solid"
          label="Start writing session"
          @click="goSession"
        />
      </template>
    </Dialog>

    <Dialog v-model="doneScheduleOpen" :options="{ title: 'Scheduled session still open' }">
      <template #body-content>
        <p class="text-sm text-ink-gray-7">
          This idea is Done, but a writing slot remains on
          <span class="font-medium text-ink-gray-9">{{ formatDateTime(doneScheduleWhen) }}</span>.
        </p>
        <FormControl
          v-model="doneReassignTo"
          class="mt-4"
          type="select"
          label="Move slot to\u2026"
          :options="reassignOptions"
        />
      </template>
      <template #actions>
        <Button variant="subtle" label="Remove schedule" @click="resolveDoneSchedule('clear')" />
        <Button
          variant="solid"
          label="Move slot"
          :disabled="!doneReassignTo"
          @click="resolveDoneSchedule('move')"
        />
      </template>
    </Dialog>
  </AppShell>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button, Dialog, FormControl, toast } from 'frappe-ui'
import dayjs from 'dayjs'
import AppShell from '@/components/AppShell.vue'
import { DONE_PREVIEW_LIMIT, STAGE_META, STAGES, useWorkspace } from '@/composables/useWorkspace'

const router = useRouter()
const {
	state,
	setStage,
	setSession,
	downloadIcs,
	formatDateTime,
	cardsForStage,
	doneStageTruncated,
} = useWorkspace()

const dragName = ref(null)
const dialogOpen = ref(false)
const dialogChapter = ref(null)
const doneScheduleOpen = ref(false)
const doneScheduleWhen = ref('')
const doneChapterName = ref('')
const doneReassignTo = ref('')

const reassignOptions = computed(() =>
	state.chapters
		.filter(
			(c) =>
				c.name !== doneChapterName.value &&
				c.writing_stage !== 'Done' &&
				!c.is_hidden,
		)
		.map((c) => ({ label: c.title || c.name, value: c.name })),
)

function cardsFor(stage) {
	return cardsForStage(stage)
}

function countLabel(stage) {
	const shown = cardsFor(stage).length
	const total = state.chapters.filter(
		(c) => !c.is_hidden && c.writing_stage === stage,
	).length
	const limit = Number(state.wipLimits[stage] || 0)
	if (stage === 'Done' && total > DONE_PREVIEW_LIMIT) {
		return `${shown}/${total}`
	}
	return limit > 0 ? `${total}/${limit}` : `${total}/Unlimited`
}

function isFull(stage) {
	const limit = Number(state.wipLimits[stage] || 0)
	const total = state.chapters.filter(
		(c) => !c.is_hidden && c.writing_stage === stage,
	).length
	return limit > 0 && total >= limit
}

function onDragStart(e, name) {
	dragName.value = name
	e.dataTransfer.setData('text/plain', name)
}

async function onDrop(e, stage) {
	e.preventDefault()
	const name = dragName.value || e.dataTransfer.getData('text/plain')
	if (!name) return
	const before = state.chapters.find((c) => c.name === name)
	const scheduled = before?.next_write_on
	await setStage(name, stage)
	if (stage === 'Done' && scheduled) {
		doneChapterName.value = name
		doneScheduleWhen.value = scheduled
		doneReassignTo.value = ''
		doneScheduleOpen.value = true
	}
}

async function resolveDoneSchedule(action) {
	const name = doneChapterName.value
	if (!name) return
	try {
		if (action === 'move' && doneReassignTo.value) {
			const when = dayjs(doneScheduleWhen.value).format('YYYY-MM-DD HH:mm:ss')
			await setSession(doneReassignTo.value, when)
			await setSession(name, null)
			toast.success('Slot moved to the other idea')
		} else {
			await setSession(name, null)
			toast.success('Schedule removed')
		}
	} finally {
		doneScheduleOpen.value = false
	}
}

function openChapter(chapter) {
	dialogChapter.value = chapter
	dialogOpen.value = true
}

function goWrite() {
	dialogOpen.value = false
	router.push(`/ideas/${dialogChapter.value.name}`)
}

function goSession() {
	dialogOpen.value = false
	router.push(`/session/${dialogChapter.value.name}`)
}
</script>
