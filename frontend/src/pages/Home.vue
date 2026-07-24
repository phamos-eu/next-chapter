<template>
  <div class="flex h-screen items-center justify-center text-ink-gray-5">
    Loading NextChapter…
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
