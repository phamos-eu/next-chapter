<template>
  <AppShell>
    <div v-if="!state.loaded || loading" class="flex flex-1 items-center justify-center text-ink-gray-5">
      Loading…
    </div>
    <div v-else class="flex min-h-0 flex-1 gap-3 overflow-x-auto bg-surface-gray-1 p-3">
      <div
        v-for="stage in state.stages"
        :key="stage"
        class="flex w-56 shrink-0 flex-col rounded-lg border bg-surface-white"
        :class="isFull(stage) ? 'border-yellow-400' : 'border-outline-gray-1'"
        @dragover.prevent
        @drop="onDrop($event, stage)"
      >
        <div
          class="flex items-center justify-between border-b border-outline-gray-1 px-3 py-2 text-sm font-semibold"
        >
          <span>{{ stage }}</span>
          <span class="text-xs font-normal text-ink-gray-5">
            {{ countLabel(stage) }}{{ isFull(stage) ? ' ⚠' : '' }}
          </span>
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
        <p class="text-sm text-ink-gray-5">Status: {{ dialogChapter?.writing_stage }}</p>
      </template>
      <template #actions>
        <Button
          v-if="dialogChapter?.next_write_on"
          variant="subtle"
          label="Add to calendar (.ics)"
          @click="downloadIcs(dialogChapter.name)"
        />
        <Button variant="solid" label="Open chapter" @click="goWrite" />
      </template>
    </Dialog>
  </AppShell>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button, Dialog } from 'frappe-ui'
import AppShell from '@/components/AppShell.vue'
import { useWorkspace } from '@/composables/useWorkspace'

const router = useRouter()
const {
	state,
	loading,
	bootstrap,
	setStage,
	downloadIcs,
	formatDateTime,
} = useWorkspace()

const dragName = ref(null)
const dialogOpen = ref(false)
const dialogChapter = ref(null)

onMounted(async () => {
	if (!state.loaded) await bootstrap()
	if (state.needsSetup) router.replace('/setup')
})

function cardsFor(stage) {
	return state.chapters.filter((c) => !c.is_hidden && c.writing_stage === stage)
}

function countLabel(stage) {
	const count = cardsFor(stage).length
	const limit = Number(state.wipLimits[stage] || 0)
	return limit > 0 ? `${count}/${limit}` : `${count}/∞`
}

function isFull(stage) {
	const limit = Number(state.wipLimits[stage] || 0)
	return limit > 0 && cardsFor(stage).length >= limit
}

function onDragStart(e, name) {
	dragName.value = name
	e.dataTransfer.setData('text/plain', name)
}

async function onDrop(e, stage) {
	e.preventDefault()
	const name = dragName.value || e.dataTransfer.getData('text/plain')
	if (!name) return
	await setStage(name, stage)
}

function openChapter(chapter) {
	dialogChapter.value = chapter
	dialogOpen.value = true
}

function goWrite() {
	state.active = dialogChapter.value.name
	dialogOpen.value = false
	router.push('/write')
}
</script>
