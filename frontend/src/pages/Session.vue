<template>
  <AppShell>
    <div class="flex min-h-0 flex-1 overflow-hidden bg-gray-100 dark:bg-gray-200">
      <div v-if="!chapter" class="flex flex-1 flex-col items-center justify-center gap-3">
        <p class="text-sm text-gray-500 dark:text-gray-400">This idea could not be found.</p>
        <Button variant="subtle" label="Back to Ideas" @click="router.push('/ideas')" />
      </div>

      <div v-else class="flex min-h-0 flex-1 flex-col">
        <!-- Header -->
        <div class="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ chapter.title || 'Untitled' }}
              </h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Stage: {{ chapter.writing_stage }}
              </p>
            </div>
            <Button variant="subtle" label="End Session" @click="showEndDialog = true" />
          </div>
        </div>

        <!-- Main content -->
        <div class="flex min-h-0 flex-1 overflow-hidden p-5">
          <!-- Left: Writing area -->
          <section class="flex min-w-0 flex-1 flex-col">
            <div
              class="relative min-h-0 flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 text-base leading-relaxed text-gray-800 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              :style="{ fontSize: `${focusFontSize}px` }"
            >
              <IdeaMotifFade
                :seed="chapter.name"
                intensity="surface"
                :enabled="motifFadeEnabled"
              />
              <div class="relative z-[1]">
                <div v-if="plainContent" class="whitespace-pre-wrap">{{ plainContent }}</div>
                <p v-else class="text-gray-400 dark:text-gray-500">
                  Start writing… Your text will be saved automatically.
                </p>
              </div>
            </div>
            <div class="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>{{ wordCount }} words</span>
              <span v-if="sessionDuration">| {{ sessionDuration }}</span>
              <span v-if="sessionStartTime">| Started: {{ sessionStartTime }}</span>
            </div>
          </section>

          <!-- Right: Session controls -->
          <aside class="flex w-72 shrink-0 flex-col gap-4 border-l border-gray-200 pl-5 dark:border-gray-700">
            <!-- Timer -->
            <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div class="text-center">
                <div class="text-3xl font-mono text-gray-900 dark:text-white">
                  {{ formattedTime }}
                </div>
                <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ isRunning ? 'Running' : 'Paused' }}
                </div>
              </div>
              <div class="mt-4 flex justify-center gap-2">
                <Button
                  v-if="isRunning"
                  variant="subtle"
                  label="Pause"
                  @click="toggleTimer"
                />
                <Button
                  v-else
                  variant="solid"
                  label="Resume"
                  @click="toggleTimer"
                />
                <Button variant="subtle" label="Reset" @click="resetTimer" />
              </div>
            </div>

            <!-- Session goal -->
            <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div class="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                Session Goal
              </div>
              <FormControl
                v-model="wordGoal"
                type="number"
                label="Word goal"
                placeholder="e.g., 500"
              />
              <div v-if="wordGoal > 0" class="mt-3">
                <div class="flex justify-between text-xs">
                  <span class="text-gray-500 dark:text-gray-400">Progress</span>
                  <span class="font-medium text-gray-900 dark:text-white">
                    {{ wordCount }} / {{ wordGoal }}
                  </span>
                </div>
                <div class="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    class="h-2 rounded-full bg-gray-900 dark:bg-white"
                    :style="{ width: `${Math.min((wordCount / wordGoal) * 100, 100)}%` }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Focus note -->
            <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div class="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                Focus Note
              </div>
              <textarea
                v-model="focusNote"
                rows="3"
                class="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                placeholder="What do you want to focus on in this session?"
              />
            </div>

            <!-- Quick actions -->
            <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div class="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                Quick Actions
              </div>
              <div class="space-y-2">
                <Button
                  class="w-full"
                  variant="subtle"
                  label="Save & Continue"
                  @click="saveSession"
                />
                <Button
                  class="w-full"
                  variant="subtle"
                  label="Mark as Done"
                  @click="showDoneDialog = true"
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>

    <!-- End Session Dialog -->
    <Dialog v-model="showEndDialog" :options="{ title: 'End Writing Session' }">
      <template #body-content>
        <div class="space-y-4">
          <div>
            <div class="text-sm font-medium text-gray-900 dark:text-white">
              Session Summary
            </div>
            <div class="mt-2 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div class="text-gray-500 dark:text-gray-400">Duration</div>
                <div class="font-medium text-gray-900 dark:text-white">{{ sessionDuration }}</div>
              </div>
              <div>
                <div class="text-gray-500 dark:text-gray-400">Words written</div>
                <div class="font-medium text-gray-900 dark:text-white">{{ wordCount }}</div>
              </div>
            </div>
          </div>

          <FormControl
            v-model="sessionFeedback"
            type="select"
            label="How productive did you feel?"
            :options="productivityOptions"
          />

          <FormControl
            v-model="aimAdjust"
            type="select"
            label="Adjust word aim for next time"
            :options="aimAdjustOptions"
          />

          <FormControl
            v-model="distractionLevel"
            type="select"
            label="Distraction level"
            :options="distractionOptions"
          />

          <label class="flex items-start gap-2">
            <input
              v-model="feltProductive"
              type="checkbox"
              class="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">I felt productive</span>
          </label>

          <FormControl
            v-model="nextFocusNote"
            type="text"
            label="Next focus note"
            placeholder="What should you focus on next time?"
          />
        </div>
      </template>
      <template #actions>
        <Button variant="subtle" label="Cancel" @click="showEndDialog = false" />
        <Button
          variant="solid"
          label="End Session"
          @click="endSession"
        />
      </template>
    </Dialog>

    <!-- Done Dialog -->
    <Dialog v-model="showDoneDialog" :options="{ title: 'Mark as Done?' }">
      <template #body-content>
        <p class="text-sm text-gray-700 dark:text-gray-300">
          Are you sure you want to mark "{{ chapter?.title }}" as Done?
        </p>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          This will move it to the History section.
        </p>
      </template>
      <template #actions>
        <Button variant="subtle" label="Cancel" @click="showDoneDialog = false" />
        <Button
          variant="solid"
          label="Mark as Done"
          class="bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
          @click="markAsDone"
        />
      </template>
    </Dialog>

    <!-- Save Confirmation -->
    <Dialog v-model="showSaveDialog" :options="{ title: 'Session Saved' }">
      <template #body-content>
        <p class="text-sm text-gray-700 dark:text-gray-300">
          Your progress has been saved. Continue writing when you're ready.
        </p>
      </template>
      <template #actions>
        <Button variant="solid" label="Continue" @click="showSaveDialog = false" />
      </template>
    </Dialog>
  </AppShell>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, Dialog, FeatherIcon, FormControl, toast } from 'frappe-ui'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import AppShell from '@/components/AppShell.vue'
import IdeaMotifFade from '@/components/IdeaMotifFade.vue'
import { useWorkspace } from '@/composables/useWorkspace'

dayjs.extend(duration)

const router = useRouter()
const route = useRoute()
const {
  state,
  chapterByName,
  saveChapter,
  completeWritingSession,
  countWords,
  effectiveSetting,
  formatDateTime,
} = useWorkspace()

const chapter = computed(() => chapterByName(route.params.name))

// Session state
const content = ref('')
const wordGoal = ref(0)
const focusNote = ref('')
const nextFocusNote = ref('')

// Timer
const startTime = ref(null)
const elapsedTime = ref(0)
const timerInterval = ref(null)
const isRunning = ref(true)

// Dialogs
const showEndDialog = ref(false)
const showDoneDialog = ref(false)
const showSaveDialog = ref(false)

// Feedback
const sessionFeedback = ref('productive')
const feltProductive = ref(true)
const aimAdjust = ref('similar')
const distractionLevel = ref('low')

const productivityOptions = [
  { label: 'Very productive', value: 'very_productive' },
  { label: 'Productive', value: 'productive' },
  { label: 'Neutral', value: 'neutral' },
  { label: 'Unproductive', value: 'unproductive' },
  { label: 'Very unproductive', value: 'very_unproductive' },
]

const aimAdjustOptions = [
  { label: 'More words', value: 'more' },
  { label: 'Similar amount', value: 'similar' },
  { label: 'Fewer words', value: 'less' },
]

const distractionOptions = [
  { label: 'No distractions', value: 'none' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Very distracted', value: 'very_high' },
]

// Computed
const focusFontSize = computed(() => Number(effectiveSetting('focus_font_size', 18)))
const motifFadeEnabled = computed(() => Number(state.prefs?.idea_motif_fade ?? 1) === 1)

const plainContent = computed(() =>
  String(content.value || '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/\n+/g, '\n')
    .trim(),
)

const wordCount = computed(() => countWords(content.value))

const sessionStartTime = computed(() => {
  if (!startTime.value) return ''
  return dayjs(startTime.value).format('HH:mm')
})

const sessionDuration = computed(() => {
  if (!startTime.value) return ''
  const duration = dayjs.duration(elapsedTime.value * 1000)
  const hours = Math.floor(duration.asHours())
  const minutes = duration.minutes()
  const seconds = duration.seconds()
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
})

const formattedTime = computed(() => {
  const duration = dayjs.duration(elapsedTime.value * 1000)
  const hours = String(duration.hours()).padStart(2, '0')
  const minutes = String(duration.minutes()).padStart(2, '0')
  const seconds = String(duration.seconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
})

// Initialize
watch(
  chapter,
  (ch) => {
    if (!ch) return
    content.value = ch.content || ''
    focusNote.value = ch.next_focus_note || ''
    startTimer()
  },
  { immediate: true },
)

// Timer functions
function startTimer() {
  if (startTime.value) return
  startTime.value = dayjs()
  timerInterval.value = setInterval(() => {
    elapsedTime.value = dayjs().diff(startTime.value, 'second')
  }, 1000)
}

function toggleTimer() {
  if (isRunning.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
    isRunning.value = false
  } else {
    startTimer()
    isRunning.value = true
  }
}

function resetTimer() {
  clearInterval(timerInterval.value)
  startTime.value = dayjs()
  elapsedTime.value = 0
  startTimer()
}

// Session actions
async function saveSession() {
  if (!chapter.value) return
  
  try {
    const html = `<p>${String(content.value || '')
      .split(/\n+/)
      .map((p) =>
        p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
      )
      .join('</p><p>')}</p>`
    
    await saveChapter({
      name: chapter.value.name,
      content: html,
      next_focus_note: nextFocusNote.value || focusNote.value,
    })
    
    showSaveDialog.value = true
    toast.success('Session saved')
  } catch (e) {
    toast.error('Failed to save session')
  }
}

async function markAsDone() {
  if (!chapter.value) return
  
  try {
    showDoneDialog.value = false
    await saveChapter({
      name: chapter.value.name,
      writing_stage: 'Done',
    })
    toast.success('Chapter marked as Done')
    router.push('/ideas')
  } catch (e) {
    toast.error('Failed to mark as Done')
  }
}

async function endSession() {
  if (!chapter.value) return
  
  try {
    showEndDialog.value = false
    
    const html = `<p>${String(content.value || '')
      .split(/\n+/)
      .map((p) =>
        p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
      )
      .join('</p><p>')}</p>`
    
    const payload = {
      name: chapter.value.name,
      content: html,
      words_written: wordCount.value,
      word_goal: wordGoal.value,
      started_on: startTime.value?.toISOString(),
      felt_productive: feltProductive.value ? '1' : '0',
      aim_adjust: aimAdjust.value,
      distraction_level: distractionLevel.value,
      next_focus_note: nextFocusNote.value || focusNote.value,
      was_scheduled: chapter.value.next_write_on ? 1 : 0,
    }
    
    await completeWritingSession(payload)
    
    // Clear session state
    clearInterval(timerInterval.value)
    timerInterval.value = null
    
    toast.success('Session completed')
    router.push('/ideas')
  } catch (e) {
    toast.error('Failed to complete session')
  }
}

onBeforeUnmount(() => {
  clearInterval(timerInterval.value)
})
</script>
