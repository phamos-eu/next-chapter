<template>
  <AppShell>
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden bg-gray-50 dark:bg-gray-100">
      <header class="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">History</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          All finished chapters. Search or filter to find what you need.
        </p>
      </header>

      <div class="flex min-h-0 flex-1 overflow-hidden">
        <!-- Left: filters -->
        <aside class="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-200">
          <div class="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div class="font-medium text-gray-900 dark:text-white">Filter</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Narrow down results</div>
          </div>
          <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            <div>
              <div class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Sort
              </div>
              <div class="flex flex-col gap-1">
                <button
                  v-for="opt in sortOptions"
                  :key="opt.value"
                  type="button"
                  class="rounded-lg border px-2.5 py-1.5 text-left text-xs transition dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  :class="
                    state.prefs?.history_sort === opt.value
                      ? 'border-gray-900 bg-gray-900 font-medium text-white dark:border-white dark:bg-white dark:text-gray-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  "
                  @click="onSortChange(opt.value)"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>
          </div>
        </aside>

        <!-- Center: list -->
        <section class="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div
            v-if="!historyChapters.length"
            class="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-6 text-center"
          >
            <div class="text-base font-medium text-gray-800 dark:text-gray-900">No finished chapters yet</div>
            <p class="max-w-sm text-sm text-gray-500 dark:text-gray-400">
              Complete a writing session to move an idea to Done.
            </p>
          </div>

          <div v-else class="min-h-0 flex-1 overflow-y-auto p-4">
            <div class="grid gap-3">
              <button
                v-for="chapter in historyChapters"
                :key="chapter.name"
                type="button"
                class="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:border-gray-600"
                @click="openChapter(chapter)"
              >
                <div class="flex items-start justify-between gap-2">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ chapter.title || 'Untitled' }}
                  </span>
                  <Badge :theme="STAGE_COLORS[chapter.writing_stage] || 'gray'" size="sm">
                    {{ chapter.writing_stage }}
                  </Badge>
                </div>
                <p class="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {{ plainSummary(chapter.summary) || 'No notes' }}
                </p>
                <div class="mt-3 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                  <span>{{ formatDateTime(chapter.modified) }}</span>
                  <span v-if="chapter.last_session_words"
                    >{{ chapter.last_session_words }} words last session</span
                  >
                </div>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>

    <Dialog v-model="dialogOpen" :options="{ title: 'Chapter' }">
      <template #body-content>
        <p class="text-sm font-medium text-gray-900 dark:text-white">{{ dialogChapter?.title }}</p>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Stage: {{ dialogChapter?.writing_stage }}
        </p>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Last edited: {{ formatDateTime(dialogChapter?.modified) }}
        </p>
        <div v-if="dialogChapter?.last_session_words" class="mt-2 text-sm">
          <span class="text-gray-500 dark:text-gray-400">Last session:</span>
          <span class="ml-1 font-medium text-gray-900 dark:text-white">
            {{ dialogChapter.last_session_words }} words
          </span>
        </div>
      </template>
      <template #actions>
        <Button
          v-if="dialogChapter?.next_write_on"
          variant="subtle"
          label="Add to calendar (.ics)"
          @click="downloadIcs(dialogChapter.name)"
        />
        <Button variant="subtle" label="Open chapter" @click="goWrite" />
      </template>
    </Dialog>
  </AppShell>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Badge, Button, Dialog } from 'frappe-ui'
import AppShell from '@/components/AppShell.vue'
import { STAGE_COLORS, useWorkspace } from '@/composables/useWorkspace'

const router = useRouter()
const {
  state,
  historyChapters,
  downloadIcs,
  formatDateTime,
  plainSummary,
  savePrefs,
} = useWorkspace()

const dialogOpen = ref(false)
const dialogChapter = ref(null)

const sortOptions = [
  { label: 'Newest first', value: 'modified_desc' },
  { label: 'Oldest first', value: 'modified_asc' },
  { label: 'Title A-Z', value: 'title_asc' },
  { label: 'Title Z-A', value: 'title_desc' },
]

async function onSortChange(value) {
  try {
    await savePrefs({ history_sort: value })
  } catch {
    /* ignore */
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
</script>
