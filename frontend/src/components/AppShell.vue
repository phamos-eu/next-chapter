<template>
  <div class="flex h-screen w-screen overflow-hidden bg-surface-white">
    <aside
      class="flex w-56 shrink-0 flex-col border-r border-outline-gray-1 bg-surface-gray-1"
    >
      <div class="border-b border-outline-gray-1 px-4 py-3">
        <div class="text-base font-semibold text-ink-gray-9">NextChapter</div>
        <div class="truncate text-sm text-ink-gray-5">
          {{ storyName || 'Your implementation story' }}
        </div>
      </div>
      <nav class="flex flex-col gap-0.5 p-2">
        <router-link
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2 rounded px-2.5 py-1.5 text-sm text-ink-gray-7 hover:bg-surface-gray-2"
          active-class="!bg-surface-white !text-ink-gray-9 font-medium shadow-sm"
        >
          <FeatherIcon :name="item.icon" class="h-4 w-4" />
          {{ item.label }}
        </router-link>
      </nav>
      <div class="mt-auto space-y-1 border-t border-outline-gray-1 p-3 text-xs text-ink-gray-5">
        <a class="block hover:text-ink-gray-8" href="/app/nextchapter-settings">
          Settings
        </a>
        <a class="block hover:text-ink-gray-8" href="/app">Desk</a>
      </div>
    </aside>
    <main class="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface-white">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { FeatherIcon } from 'frappe-ui'
import { useWorkspace } from '@/composables/useWorkspace'

const { state } = useWorkspace()
const storyName = computed(() => state.story?.company_name || '')

const nav = [
	{ to: '/write', label: 'Write', icon: 'edit-3' },
	{ to: '/board', label: 'Board', icon: 'columns' },
	{ to: '/schedule', label: 'Schedule', icon: 'calendar' },
]
</script>
