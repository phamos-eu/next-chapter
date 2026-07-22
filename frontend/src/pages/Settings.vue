<template>
  <AppShell>
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header class="border-b border-outline-gray-1 px-5 py-3">
        <h1 class="text-xl font-semibold text-ink-gray-9">Settings</h1>
        <p class="text-sm text-ink-gray-5">
          Personal preferences for Ideas overview and writing. These are not shown as controls on
          the Ideas list itself.
        </p>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto p-5">
        <div class="mx-auto max-w-lg space-y-6">
          <section class="rounded-xl border border-outline-gray-1 bg-surface-white p-4">
            <h2 class="text-sm font-semibold text-ink-gray-9">Ideas overview</h2>
            <p class="mt-1 text-xs text-ink-gray-5">
              Recently edited ideas rise to the top by default. Ideas beyond the visible limit are
              moved to Hidden automatically.
            </p>
            <div class="mt-4 space-y-3">
              <FormControl
                v-model="form.ideas_sort"
                type="select"
                label="Sort order"
                :options="sortOptions"
                @update:model-value="scheduleSave"
              />
              <FormControl
                v-model="form.ideas_visible_limit"
                type="number"
                label="Visible ideas limit"
                @update:model-value="scheduleSave"
              />
            </div>
          </section>

          <section class="rounded-xl border border-outline-gray-1 bg-surface-white p-4">
            <h2 class="text-sm font-semibold text-ink-gray-9">Writing</h2>
            <div class="mt-4 space-y-3">
              <label class="flex items-center gap-2 text-sm text-ink-gray-7">
                <input v-model="form.page_pile" type="checkbox" @change="scheduleSave" />
                Page pile writing mode (stage 3+)
              </label>
              <FormControl
                v-model="form.edit_idle_secs"
                type="number"
                label="Edit dialog idle auto-close (seconds)"
                @update:model-value="scheduleSave"
              />
            </div>
          </section>

          <p class="text-xs text-ink-gray-4">{{ saveState }}</p>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { FormControl, toast } from 'frappe-ui'
import AppShell from '@/components/AppShell.vue'
import { useWorkspace } from '@/composables/useWorkspace'

const { state, bootstrap, savePrefs } = useWorkspace()

const form = reactive({
	ideas_sort: 'modified_desc',
	ideas_visible_limit: 20,
	page_pile: false,
	edit_idle_secs: 45,
})
const saveState = ref('Changes save automatically')
let saveTimer = null

const sortOptions = [
	{ label: 'Recently edited first', value: 'modified_desc' },
	{ label: 'Title A–Z', value: 'title_asc' },
	{ label: 'Growth stage', value: 'stage_asc' },
	{ label: 'Sequence', value: 'sequence_asc' },
]

function syncFromPrefs() {
	const p = state.prefs || {}
	form.ideas_sort = p.ideas_sort || 'modified_desc'
	form.ideas_visible_limit = Number(p.ideas_visible_limit || 20)
	form.page_pile = Boolean(p.page_pile)
	form.edit_idle_secs = Number(p.edit_idle_secs || 45)
}

function scheduleSave() {
	saveState.value = 'Saving…'
	clearTimeout(saveTimer)
	saveTimer = setTimeout(async () => {
		try {
			await savePrefs({
				ideas_sort: form.ideas_sort,
				ideas_visible_limit: Math.max(1, Number(form.ideas_visible_limit) || 20),
				page_pile: form.page_pile ? 1 : 0,
				edit_idle_secs: Math.max(5, Number(form.edit_idle_secs) || 45),
			})
			saveState.value = 'Saved'
		} catch (e) {
			saveState.value = 'Could not save'
			toast.error(e?.messages?.[0] || e?.message || 'Could not save settings')
		}
	}, 400)
}

watch(
	() => state.prefs,
	() => syncFromPrefs(),
	{ deep: true },
)

onMounted(async () => {
	await bootstrap()
	syncFromPrefs()
})
</script>
