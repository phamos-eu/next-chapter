<template>
  <div class="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="text-center">
      <div
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xl font-semibold text-white dark:bg-white dark:text-gray-900"
      >
        NC
      </div>
      <h1 class="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
        Loading NextChapter…
      </h1>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Please wait while we prepare your workspace.
      </p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkspace } from '@/composables/useWorkspace'

const router = useRouter()
const route = useRoute()
const { state, bootstrap } = useWorkspace()

onMounted(async () => {
  try {
    if (!state.loaded) await bootstrap()
  } catch {
    router.replace('/ideas')
    return
  }

  if (state.needsSetup) {
    router.replace('/setup')
    return
  }

  const chapter = route.query.chapter
  if (chapter && typeof chapter === 'string') {
    router.replace(`/ideas/${chapter}`)
    return
  }

  router.replace('/ideas')
})
</script>
