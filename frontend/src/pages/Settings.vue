<template>
  <AppShell>
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden bg-gray-50 dark:bg-gray-100">
      <header class="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Configure NextChapter to fit your workflow.
        </p>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto p-6">
        <div class="mx-auto max-w-2xl space-y-8">
          <!-- Appearance -->
          <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
            <div class="space-y-4">
              <FormControl
                v-model="uiScale"
                type="select"
                label="UI Scale"
                :options="uiScaleOptions"
                @update:model-value="onUiScaleChange"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Adjust the overall size of the interface (90% to 140%).
              </p>

              <label class="flex items-center gap-2">
                <input
                  v-model="motifFade"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  @change="onMotifFadeChange"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Enable idea motif fade</span>
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Subtle background patterns on idea cards based on their content.
              </p>

              <FormControl
                v-model="overviewTitleSize"
                type="select"
                label="Overview title size"
                :options="titleSizeOptions"
                @update:model-value="onOverviewTitleSizeChange"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Size of the title in the idea overview.
              </p>
            </div>
          </div>

          <!-- Ideas -->
          <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Ideas</h2>
            <div class="space-y-4">
              <FormControl
                v-model="ideasLayout"
                type="select"
                label="Default layout"
                :options="layoutOptions"
                @update:model-value="onIdeasLayoutChange"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400">
                How ideas are arranged in the Ideas view.
              </p>

              <FormControl
                v-model="ideasSort"
                type="select"
                label="Sort ideas by"
                :options="sortOptions"
                @update:model-value="onIdeasSortChange"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Default sorting for the Active ideas list.
              </p>

              <FormControl
                v-model="ideasVisibleLimit"
                type="number"
                label="Visible ideas limit"
                @update:model-value="onIdeasVisibleLimitChange"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Maximum number of ideas to show in Active view. Others are auto-hidden.
              </p>
            </div>
          </div>

          <!-- Writing -->
          <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Writing</h2>
            <div class="space-y-4">
              <FormControl
                v-model="focusFontSize"
                type="number"
                label="Focus font size"
                @update:model-value="onFocusFontSizeChange"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Font size in pixels for the writing area.
              </p>

              <FormControl
                v-model="editIdleSecs"
                type="number"
                label="Edit idle timeout"
                @update:model-value="onEditIdleSecsChange"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Seconds of inactivity before the Edit dialog auto-closes (0 to disable).
              </p>

              <label class="flex items-center gap-2">
                <input
                  v-model="pagePile"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  @change="onPagePileChange"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Enable page pile mode</span>
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Stack-based writing mode for advanced stages.
              </p>
            </div>
          </div>

          <!-- Notifications -->
          <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
            <div class="space-y-4">
              <label class="flex items-center gap-2">
                <input
                  v-model="notifySessionReminder"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  @change="onNotifySessionReminderChange"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Session reminders</span>
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Get notified before scheduled writing sessions.
              </p>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
            <h2 class="mb-4 text-lg font-semibold text-red-800 dark:text-red-400">Danger Zone</h2>
            <div class="space-y-4">
              <button
                type="button"
                class="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/40"
                @click="showResetDialog = true"
              >
                <FeatherIcon name="alert-triangle" class="h-4 w-4" />
                Reset all preferences
              </button>
              <p class="text-xs text-red-600 dark:text-red-400">
                This will reset all your personal settings to defaults.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Dialog v-model="showResetDialog" :options="{ title: 'Reset all preferences?' }">
      <template #body-content>
        <p class="text-sm text-gray-700 dark:text-gray-300">
          This will reset all your personal settings (appearance, layout, writing preferences) to their default values.
        </p>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          This action cannot be undone.
        </p>
      </template>
      <template #actions>
        <Button variant="subtle" label="Cancel" @click="showResetDialog = false" />
        <Button
          variant="solid"
          label="Reset all preferences"
          class="bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
          @click="resetAllPreferences"
        />
      </template>
    </Dialog>

    <Dialog v-model="showSavedDialog" :options="{ title: 'Settings saved' }">
      <template #body-content>
        <p class="text-sm text-gray-700 dark:text-gray-300">
          Your preferences have been saved successfully.
        </p>
      </template>
      <template #actions>
        <Button variant="solid" label="OK" @click="showSavedDialog = false" />
      </template>
    </Dialog>
  </AppShell>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Button, Dialog, FeatherIcon, FormControl, toast } from 'frappe-ui'
import AppShell from '@/components/AppShell.vue'
import { useWorkspace } from '@/composables/useWorkspace'

const { state, savePrefs } = useWorkspace()

// Dialogs
const showResetDialog = ref(false)
const showSavedDialog = ref(false)

// Appearance
const uiScale = ref(state.prefs?.ui_scale || 125)
const uiScaleOptions = [
  { label: '90%', value: 90 },
  { label: '100%', value: 100 },
  { label: '110%', value: 110 },
  { label: '125% (default)', value: 125 },
  { label: '140%', value: 140 },
]

const motifFade = ref(Number(state.prefs?.idea_motif_fade ?? 1) === 1)

const overviewTitleSize = ref(state.prefs?.overview_title_size || 'comfortable')
const titleSizeOptions = [
  { label: 'Comfortable', value: 'comfortable' },
  { label: 'Large', value: 'large' },
  { label: 'Larger', value: 'larger' },
]

// Ideas
const ideasLayout = ref(state.prefs?.ideas_layout || 'list')
const layoutOptions = [
  { label: 'List', value: 'list' },
  { label: 'Columns', value: 'columns' },
]

const ideasSort = ref(state.prefs?.ideas_sort || 'modified_desc')
const sortOptions = [
  { label: 'Recently edited', value: 'modified_desc' },
  { label: 'Oldest edited', value: 'modified_asc' },
  { label: 'Title A-Z', value: 'title_asc' },
  { label: 'Title Z-A', value: 'title_desc' },
  { label: 'Stage order', value: 'stage_asc' },
  { label: 'Sequence', value: 'sequence_asc' },
]

const ideasVisibleLimit = ref(state.prefs?.ideas_visible_limit || 20)

// Writing
const focusFontSize = ref(state.prefs?.focus_font_size || 18)
const editIdleSecs = ref(state.prefs?.edit_idle_secs || 45)
const pagePile = ref(Number(state.prefs?.page_pile ?? 0) === 1)

// Notifications
const notifySessionReminder = ref(Number(state.prefs?.notify_session_reminder ?? 1) === 1)

// Watch for external changes (e.g., from other tabs)
watch(
  () => state.prefs,
  (newPrefs) => {
    if (!newPrefs) return
    uiScale.value = newPrefs.ui_scale || 125
    motifFade.value = Number(newPrefs.idea_motif_fade ?? 1) === 1
    overviewTitleSize.value = newPrefs.overview_title_size || 'comfortable'
    ideasLayout.value = newPrefs.ideas_layout || 'list'
    ideasSort.value = newPrefs.ideas_sort || 'modified_desc'
    ideasVisibleLimit.value = newPrefs.ideas_visible_limit || 20
    focusFontSize.value = newPrefs.focus_font_size || 18
    editIdleSecs.value = newPrefs.edit_idle_secs || 45
    pagePile.value = Number(newPrefs.page_pile ?? 0) === 1
    notifySessionReminder.value = Number(newPrefs.notify_session_reminder ?? 1) === 1
  },
  { deep: true },
)

// Appearance handlers
async function onUiScaleChange(value) {
  try {
    await savePrefs({ ui_scale: Number(value) })
    showSavedDialog.value = true
  } catch (e) {
    toast.error('Failed to save UI scale')
  }
}

async function onMotifFadeChange() {
  try {
    await savePrefs({ idea_motif_fade: motifFade.value ? 1 : 0 })
    showSavedDialog.value = true
  } catch (e) {
    toast.error('Failed to save motif fade setting')
  }
}

async function onOverviewTitleSizeChange(value) {
  try {
    await savePrefs({ overview_title_size: value })
    showSavedDialog.value = true
  } catch (e) {
    toast.error('Failed to save title size')
  }
}

// Ideas handlers
async function onIdeasLayoutChange(value) {
  try {
    await savePrefs({ ideas_layout: value })
    showSavedDialog.value = true
  } catch (e) {
    toast.error('Failed to save layout')
  }
}

async function onIdeasSortChange(value) {
  try {
    await savePrefs({ ideas_sort: value })
    showSavedDialog.value = true
  } catch (e) {
    toast.error('Failed to save sort order')
  }
}

async function onIdeasVisibleLimitChange(value) {
  try {
    await savePrefs({ ideas_visible_limit: Number(value) || 20 })
    showSavedDialog.value = true
  } catch (e) {
    toast.error('Failed to save visible limit')
  }
}

// Writing handlers
async function onFocusFontSizeChange(value) {
  try {
    await savePrefs({ focus_font_size: Number(value) || 18 })
    showSavedDialog.value = true
  } catch (e) {
    toast.error('Failed to save font size')
  }
}

async function onEditIdleSecsChange(value) {
  try {
    await savePrefs({ edit_idle_secs: Number(value) || 45 })
    showSavedDialog.value = true
  } catch (e) {
    toast.error('Failed to save idle timeout')
  }
}

async function onPagePileChange() {
  try {
    await savePrefs({ page_pile: pagePile.value ? 1 : 0 })
    showSavedDialog.value = true
  } catch (e) {
    toast.error('Failed to save page pile setting')
  }
}

// Notifications handlers
async function onNotifySessionReminderChange() {
  try {
    await savePrefs({ notify_session_reminder: notifySessionReminder.value ? 1 : 0 })
    showSavedDialog.value = true
  } catch (e) {
    toast.error('Failed to save notification setting')
  }
}

// Danger zone
async function resetAllPreferences() {
  try {
    const defaults = {
      ui_scale: 125,
      idea_motif_fade: 1,
      overview_title_size: 'comfortable',
      ideas_layout: 'list',
      ideas_sort: 'modified_desc',
      ideas_visible_limit: 20,
      focus_font_size: 18,
      edit_idle_secs: 45,
      page_pile: 0,
      notify_session_reminder: 1,
    }
    await savePrefs(defaults)
    showResetDialog.value = false
    toast.success('All preferences reset to defaults')
    
    // Update local refs
    uiScale.value = defaults.ui_scale
    motifFade.value = true
    overviewTitleSize.value = defaults.overview_title_size
    ideasLayout.value = defaults.ideas_layout
    ideasSort.value = defaults.ideas_sort
    ideasVisibleLimit.value = defaults.ideas_visible_limit
    focusFontSize.value = defaults.focus_font_size
    editIdleSecs.value = defaults.edit_idle_secs
    pagePile.value = false
    notifySessionReminder.value = true
  } catch (e) {
    toast.error('Failed to reset preferences')
  }
}
</script>
