<template>
  <AppShell>
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header
        class="flex flex-wrap items-center justify-between gap-3 border-b border-outline-gray-1 px-5 py-3"
      >
        <div>
          <div class="text-[11px] font-medium uppercase tracking-wide text-ink-gray-4">
            Mockup
          </div>
          <h1 class="text-xl font-semibold text-ink-gray-9">Idea growth funnel</h1>
          <p class="text-sm text-ink-gray-5">
            Narrow from unlimited capture to one focused chapter. Click a card to preview
            stage-gated writing.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button variant="subtle" label="Session ritual →" @click="router.push('/mock/session')" />
        </div>
      </header>

      <div class="flex min-h-0 flex-1 gap-3 overflow-x-auto bg-surface-gray-1 p-3">
        <div
          v-for="stage in FUNNEL_STAGES"
          :key="stage.id"
          class="flex w-52 shrink-0 flex-col rounded-lg border bg-surface-white"
          :class="isFull(stage) ? 'border-yellow-400' : 'border-outline-gray-1'"
        >
          <div class="border-b border-outline-gray-1 px-3 py-2">
            <div class="flex items-center justify-between text-sm font-semibold">
              <span>{{ stage.label }}</span>
              <span class="text-xs font-normal text-ink-gray-5">
                {{ countLabel(stage) }}{{ isFull(stage) ? ' ⚠' : '' }}
              </span>
            </div>
            <div class="mt-0.5 text-[11px] text-ink-gray-5">
              {{ stage.metaphor }} · {{ stage.job }}
            </div>
          </div>
          <div class="min-h-[8rem] flex-1 space-y-2 overflow-y-auto p-2">
            <button
              v-for="chapter in cardsFor(stage.id)"
              :key="chapter.name"
              type="button"
              class="w-full rounded-md border border-outline-gray-1 bg-surface-white p-2 text-left shadow-sm hover:border-outline-gray-2"
              @click="openChapter(chapter)"
            >
              <div class="text-sm font-medium text-ink-gray-9">{{ chapter.title }}</div>
              <div v-if="chapter.snippet" class="mt-1 line-clamp-2 text-xs text-ink-gray-5">
                {{ chapter.snippet }}
              </div>
            </button>
            <p
              v-if="!cardsFor(stage.id).length"
              class="px-1 py-4 text-center text-xs text-ink-gray-4"
            >
              Empty
            </p>
          </div>
          <div class="border-t border-outline-gray-1 p-2">
            <Button
              class="w-full"
              variant="ghost"
              :label="`Preview editor (${stage.label})`"
              :disabled="stage.id === 'done'"
              @click="previewStage(stage)"
            />
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from 'frappe-ui'
import AppShell from '@/components/AppShell.vue'
import { FUNNEL_STAGES, MOCK_CHAPTERS } from './mockStages'

const router = useRouter()
const chapters = reactive(MOCK_CHAPTERS.map((c) => ({ ...c })))

function cardsFor(stageId) {
	return chapters.filter((c) => c.stage === stageId)
}

function countLabel(stage) {
	const n = cardsFor(stage.id).length
	if (stage.wip == null) return String(n)
	return `${n}/${stage.wip}`
}

function isFull(stage) {
	if (stage.wip == null) return false
	return cardsFor(stage.id).length >= stage.wip
}

function openChapter(chapter) {
	if (chapter.stage === 'done') return
	router.push({
		name: 'MockWrite',
		params: { stage: chapter.stage === 'infinity' ? 'infinity' : chapter.stage },
		query: { chapter: chapter.name },
	})
}

function previewStage(stage) {
	if (stage.id === 'done') return
	router.push({
		name: 'MockWrite',
		params: { stage: stage.id },
	})
}
</script>
