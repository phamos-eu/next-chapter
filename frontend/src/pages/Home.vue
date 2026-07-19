<template>
  <div class="flex h-screen items-center justify-center text-ink-gray-5">
    Loading NextChapter…
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkspace } from '@/composables/useWorkspace'

const router = useRouter()
const { state, bootstrap } = useWorkspace()

onMounted(async () => {
	if (!state.loaded) await bootstrap()
	router.replace(state.needsSetup ? '/setup' : '/write')
})
</script>
