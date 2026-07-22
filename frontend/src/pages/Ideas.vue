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

      <div class="min-h-0 flex-1 overflow-y-auto">
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

        <ul v-else class="divide-y divide-outline-gray-1">
          <li v-for="chapter in filteredChapters" :key="chapter.name">
            <button
              class="flex w-full items-start gap-3 px-5 py-3.5 text-left hover:bg-surface-gray-1"
              @click="openIdea(chapter)"
            >
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="truncate text-sm font-medium text-ink-gray-9">
                    {{ chapter.title || 'Untitled' }}
                  </span>
                  <Badge :theme="STAGE_COLORS[chapter.writing_stage] || 'gray'" size="sm">
                    {{ chapter.writing_stage }}
                  </Badge>
                </div>
                <p
                  v-if="plainSummary(chapter.summary)"
                  class="mt-1 line-clamp-2 text-sm text-ink-gray-5"
                >
                  {{ plainSummary(chapter.summary) }}
                </p>
                <p v-else class="mt-1 text-sm text-ink-gray-4">No notes yet</p>
              </div>
              <div class="shrink-0 text-right text-xs text-ink-gray-4">
                <div v-if="chapter.next_write_on">
                  {{ formatDateTime(chapter.next_write_on) }}
                </div>
                <div v-else class="pt-0.5">
                  <FeatherIcon name="chevron-right" class="ml-auto h-4 w-4" />
                </div>
              </div>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </AppShell>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Badge, Button, FeatherIcon, TabButtons, TextInput, toast } from 'frappe-ui'
import AppShell from '@/components/AppShell.vue'
import { STAGE_COLORS, useWorkspace } from '@/composables/useWorkspace'

const router = useRouter()
const {
	state,
	filteredChapters,
	createIdea,
	formatDateTime,
	plainSummary,
} = useWorkspace()

const listModes = [
	{ label: 'Active', value: 'active' },
	{ label: 'Hidden', value: 'hidden' },
]

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
</script>
