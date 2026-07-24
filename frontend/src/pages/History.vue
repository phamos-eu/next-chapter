<template>
  <AppShell>
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header
        class="flex flex-wrap items-center justify-between gap-3 border-b border-outline-gray-1 px-5 py-3"
      >
        <div>
          <h1 class="text-xl font-semibold text-ink-gray-9">History</h1>
          <p class="text-sm text-ink-gray-5">
            Finished ideas — revisit the path when you want context, not a to-do list.
          </p>
        </div>
        <div class="text-xs text-ink-gray-5">{{ historyChapters.length }} done</div>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto">
        <div
          v-if="!historyChapters.length"
          class="flex h-full flex-col items-center justify-center gap-2 px-6 text-center"
        >
          <div class="text-base font-medium text-ink-gray-8">No finished ideas yet</div>
          <p class="max-w-sm text-sm text-ink-gray-5">
            When you mark an idea Done, it leaves Active and lands here.
          </p>
        </div>

        <ul v-else class="divide-y divide-outline-gray-1">
          <li v-for="chapter in historyChapters" :key="chapter.name">
            <button
              class="flex w-full items-start gap-3 px-5 py-3.5 text-left hover:bg-surface-gray-1"
              @click="openIdea(chapter)"
            >
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="truncate text-sm font-medium text-ink-gray-9">
                    {{ chapter.title || 'Untitled' }}
                  </span>
                  <Badge theme="green" size="sm">Done</Badge>
                </div>
                <p
                  v-if="plainSummary(chapter.summary)"
                  class="mt-1 line-clamp-2 text-sm text-ink-gray-5"
                >
                  {{ plainSummary(chapter.summary) }}
                </p>
                <p v-else class="mt-1 text-sm text-ink-gray-4">No notes</p>
              </div>
              <div class="shrink-0 text-right text-xs text-ink-gray-4">
                <div v-if="chapter.modified">{{ formatDateTime(chapter.modified) }}</div>
                <FeatherIcon name="chevron-right" class="ml-auto mt-1 h-4 w-4" />
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
import { Badge, FeatherIcon } from 'frappe-ui'
import AppShell from '@/components/AppShell.vue'
import { useWorkspace } from '@/composables/useWorkspace'

const router = useRouter()
const { state, historyChapters, formatDateTime, plainSummary } = useWorkspace()

function openIdea(chapter) {
	state.active = chapter.name
	router.push(`/ideas/${chapter.name}`)
}
</script>
