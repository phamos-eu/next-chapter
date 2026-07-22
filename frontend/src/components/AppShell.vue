<template>
  <div class="flex h-screen w-screen overflow-hidden bg-surface-white">
    <aside
      class="flex w-[15.5rem] shrink-0 flex-col border-r border-outline-gray-1 bg-surface-gray-1"
    >
      <div class="flex items-center gap-2.5 border-b border-outline-gray-1 px-3 py-3">
        <div
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-ink-gray-9 text-xs font-semibold text-surface-white"
        >
          NC
        </div>
        <div class="min-w-0">
          <div class="truncate text-base font-semibold text-ink-gray-9">NextChapter</div>
          <div class="truncate text-xs text-ink-gray-5">
            {{ storyName || 'Implementation story' }}
          </div>
        </div>
      </div>

      <nav class="flex flex-1 flex-col gap-4 overflow-y-auto p-2">
        <div>
          <div class="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-ink-gray-4">
            Work
          </div>
          <div class="flex flex-col gap-0.5">
            <router-link
              v-for="item in primaryNav"
              :key="item.to"
              :to="item.to"
              class="group flex items-center gap-2 rounded px-2 py-1.5 text-sm text-ink-gray-7 hover:bg-surface-gray-2"
              active-class="!bg-surface-white !text-ink-gray-9 font-medium shadow-sm"
            >
              <FeatherIcon :name="item.icon" class="h-4 w-4 shrink-0 text-ink-gray-5 group-[.router-link-active]:text-ink-gray-9" />
              <span class="truncate">{{ item.label }}</span>
              <span
                v-if="item.count != null"
                class="ml-auto rounded bg-surface-gray-2 px-1.5 py-0.5 text-[11px] text-ink-gray-6 group-[.router-link-active]:bg-surface-gray-1"
              >
                {{ item.count }}
              </span>
            </router-link>
          </div>
        </div>

        <div>
          <div class="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-ink-gray-4">
            Focus
          </div>
          <div class="flex flex-col gap-0.5">
            <router-link
              v-for="item in secondaryNav"
              :key="item.to"
              :to="item.to"
              class="group flex items-center gap-2 rounded px-2 py-1.5 text-sm text-ink-gray-7 hover:bg-surface-gray-2"
              active-class="!bg-surface-white !text-ink-gray-9 font-medium shadow-sm"
            >
              <FeatherIcon :name="item.icon" class="h-4 w-4 shrink-0 text-ink-gray-5 group-[.router-link-active]:text-ink-gray-9" />
              <span class="truncate">{{ item.label }}</span>
            </router-link>
          </div>
        </div>
      </nav>

      <div class="space-y-0.5 border-t border-outline-gray-1 p-2">
        <a
          class="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-ink-gray-6 hover:bg-surface-gray-2 hover:text-ink-gray-8"
          href="/app/nextchapter-settings"
        >
          <FeatherIcon name="settings" class="h-4 w-4" />
          Settings
        </a>
        <a
          class="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-ink-gray-6 hover:bg-surface-gray-2 hover:text-ink-gray-8"
          href="/app"
        >
          <FeatherIcon name="grid" class="h-4 w-4" />
          Desk
        </a>
      </div>
    </aside>

    <main class="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface-white">
      <div
        v-if="state.loading && !state.loaded"
        class="flex flex-1 items-center justify-center text-sm text-ink-gray-5"
      >
        Loading NextChapter…
      </div>
      <div
        v-else-if="state.error && !state.loaded"
        class="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center"
      >
        <div class="text-base font-medium text-ink-gray-9">Could not open NextChapter</div>
        <p class="max-w-md text-sm text-ink-gray-5">{{ state.error }}</p>
        <Button variant="solid" label="Try again" @click="retry" />
      </div>
      <slot v-else />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button, FeatherIcon } from 'frappe-ui'
import { useWorkspace } from '@/composables/useWorkspace'

const router = useRouter()
const { state, bootstrap } = useWorkspace()

const storyName = computed(() => state.story?.company_name || '')

const ideaCount = computed(
	() => state.chapters.filter((c) => !c.is_hidden).length,
)

const primaryNav = computed(() => [
	{ to: '/ideas', label: 'Ideas', icon: 'book-open', count: ideaCount.value },
])

const secondaryNav = [
	{ to: '/growth', label: 'Growth Funnel', icon: 'trending-up' },
	{ to: '/schedule', label: 'Schedule', icon: 'calendar' },
]

async function ensureBoot() {
	try {
		await bootstrap()
		if (state.needsSetup) {
			router.replace('/setup')
		}
	} catch {
		// error surfaced via state.error
	}
}

async function retry() {
	await ensureBoot()
}

onMounted(ensureBoot)
</script>
