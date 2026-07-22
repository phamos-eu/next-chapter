<template>
  <!-- Ritual wizard (no AppShell — calm entry) -->
  <div
    v-if="phase === 'ritual'"
    class="flex min-h-screen items-center justify-center bg-surface-gray-1 p-6"
  >
    <div class="w-full max-w-lg rounded-xl border border-outline-gray-1 bg-surface-white p-6 shadow-sm">
      <div class="mb-1 flex items-center justify-between">
        <div class="text-xs font-semibold uppercase tracking-wide text-ink-gray-5">
          Writing session
        </div>
        <button
          type="button"
          class="text-xs text-ink-gray-5 hover:text-ink-gray-8"
          @click="skipRituals"
        >
          Skip rituals
        </button>
      </div>
      <h1 class="mb-1 text-xl font-semibold text-ink-gray-9">{{ currentStep.title }}</h1>
      <p class="mb-2 text-sm text-ink-gray-5">{{ currentStep.help }}</p>
      <p class="mb-4 text-xs text-ink-gray-4">
        Step {{ step + 1 }} of {{ steps.length }} · {{ ideaTitle }}
      </p>

      <!-- Step 0: word goal -->
      <div v-if="step === 0" class="space-y-3">
        <FormControl
          v-model="wordGoal"
          type="number"
          label="Words you plan to write"
        />
        <p class="text-sm text-ink-gray-5">
          Last session you wrote
          <span class="font-medium text-ink-gray-8">{{ lastSessionWords }}</span>
          words.
        </p>
        <div
          class="rounded-lg border px-3 py-2 text-sm"
          :class="goalFeedback.tone"
        >
          {{ goalFeedback.message }}
        </div>
      </div>

      <!-- Step 1: body reset -->
      <div v-else-if="step === 1" class="space-y-2">
        <label
          v-for="item in bodyChecks"
          :key="item.id"
          class="flex cursor-pointer items-start gap-3 rounded-lg border border-outline-gray-1 px-3 py-2.5 hover:bg-surface-gray-1"
        >
          <input v-model="item.done" type="checkbox" class="mt-0.5" />
          <span>
            <span class="block text-sm font-medium text-ink-gray-8">{{ item.label }}</span>
            <span class="text-xs text-ink-gray-5">{{ item.hint }}</span>
          </span>
        </label>
        <p class="pt-1 text-xs text-ink-gray-4">Optional — tick what helps you settle.</p>
      </div>

      <!-- Step 2: clear runway -->
      <div v-else-if="step === 2" class="space-y-3">
        <ul class="space-y-2 text-sm text-ink-gray-7">
          <li class="flex gap-2">
            <FeatherIcon name="bell-off" class="mt-0.5 h-4 w-4 shrink-0 text-ink-gray-5" />
            Silence notifications for the next hour.
          </li>
          <li class="flex gap-2">
            <FeatherIcon name="x-square" class="mt-0.5 h-4 w-4 shrink-0 text-ink-gray-5" />
            Close unrelated tabs — one idea only.
          </li>
          <li class="flex gap-2">
            <FeatherIcon name="clock" class="mt-0.5 h-4 w-4 shrink-0 text-ink-gray-5" />
            Planned block:
            <span class="font-medium">{{ sessionDurationMins }} minutes</span>
          </li>
        </ul>
        <p class="text-xs text-ink-gray-4">
          You do not need to prove anything here — just notice the runway is clear.
        </p>
      </div>

      <!-- Step 3: arrive -->
      <div v-else class="space-y-4 text-center">
        <p class="text-sm text-ink-gray-6">
          Take three slow breaths. When you feel ready, enter the session.
        </p>
        <div class="flex justify-center gap-3 py-2">
          <span
            v-for="n in 3"
            :key="n"
            class="flex h-10 w-10 items-center justify-center rounded-full border border-outline-gray-2 text-sm text-ink-gray-6"
            :class="breathCount >= n ? 'bg-ink-gray-9 text-surface-white border-ink-gray-9' : ''"
          >
            {{ n }}
          </span>
        </div>
        <Button
          v-if="breathCount < 3"
          variant="subtle"
          label="Mark a breath"
          @click="breathCount += 1"
        />
        <p v-else class="text-sm text-ink-gray-5">Ready when you are.</p>
        <div v-if="settleLeft > 0" class="text-xs text-ink-gray-4">
          Or wait {{ settleLeft }}s…
        </div>
      </div>

      <div class="mt-6 flex items-center justify-between">
        <Button v-if="step > 0" variant="subtle" label="Back" @click="step -= 1" />
        <Button v-else variant="ghost" label="Cancel" @click="leaveMock" />
        <Button
          variant="solid"
          :label="step === steps.length - 1 ? 'Enter session' : 'Continue'"
          @click="next"
        />
      </div>
    </div>
  </div>

  <!-- Distraction-free focus -->
  <div
    v-else-if="phase === 'focus'"
    class="fixed inset-0 z-50 flex flex-col bg-surface-white"
    @keydown.esc.prevent="pauseSession"
  >
    <header
      class="flex items-center justify-between border-b border-outline-gray-1 px-4 py-2"
    >
      <div class="min-w-0">
        <div class="truncate text-sm font-medium text-ink-gray-8">{{ ideaTitle }}</div>
        <div class="text-xs text-ink-gray-4">
          {{ sessionWords }} / {{ Number(wordGoal) || 0 }} words · {{ elapsedLabel }}
        </div>
      </div>
      <div class="flex gap-2">
        <Button variant="subtle" label="Pause" @click="pauseSession" />
        <Button variant="solid" label="Stop" @click="stopSession" />
      </div>
    </header>

    <div class="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-6 py-8">
      <textarea
        ref="focusInput"
        v-model="sessionBody"
        class="min-h-0 flex-1 resize-none border-0 bg-transparent text-base leading-relaxed text-ink-gray-9 outline-none placeholder:text-ink-gray-4"
        placeholder="Write. Nothing else is here."
        @input="onSessionInput"
      />
    </div>

    <!-- Pause overlay -->
    <div
      v-if="paused"
      class="absolute inset-0 flex items-center justify-center bg-ink-gray-9/40 p-6"
    >
      <div class="w-full max-w-sm rounded-xl bg-surface-white p-6 text-center shadow-lg">
        <h2 class="text-lg font-semibold text-ink-gray-9">Paused</h2>
        <p class="mt-2 text-sm text-ink-gray-5">
          Take a moment. Resume when you are ready, or end the session.
        </p>
        <div class="mt-5 flex justify-center gap-2">
          <Button variant="subtle" label="End session" @click="stopSession" />
          <Button variant="solid" label="Resume" @click="resumeSession" />
        </div>
      </div>
    </div>
  </div>

  <!-- Session summary -->
  <div
    v-else
    class="flex min-h-screen items-center justify-center bg-surface-gray-1 p-6"
  >
    <div class="w-full max-w-md rounded-xl border border-outline-gray-1 bg-surface-white p-6 shadow-sm">
      <div class="text-xs font-semibold uppercase tracking-wide text-ink-gray-5">
        Session complete
      </div>
      <h1 class="mt-1 text-xl font-semibold text-ink-gray-9">Nice work</h1>
      <p class="mt-2 text-sm text-ink-gray-5">{{ ideaTitle }}</p>

      <div class="mt-5 grid grid-cols-2 gap-3">
        <div class="rounded-lg border border-outline-gray-1 p-3">
          <div class="text-xs text-ink-gray-5">Words written</div>
          <div class="text-2xl font-semibold text-ink-gray-9">{{ sessionWords }}</div>
        </div>
        <div class="rounded-lg border border-outline-gray-1 p-3">
          <div class="text-xs text-ink-gray-5">Goal</div>
          <div class="text-2xl font-semibold text-ink-gray-9">{{ Number(wordGoal) || 0 }}</div>
        </div>
      </div>
      <p class="mt-3 text-sm text-ink-gray-6">{{ summaryMessage }}</p>
      <p class="mt-1 text-xs text-ink-gray-4">Time in session: {{ elapsedLabel }}</p>

      <div class="mt-6 flex justify-between gap-2">
        <Button variant="subtle" label="Back to funnel" @click="router.push('/mock/growth')" />
        <Button variant="solid" label="Open idea mock" @click="backToWrite" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, FeatherIcon, FormControl } from 'frappe-ui'
import {
	MOCK_LAST_SESSION_WORDS,
	MOCK_SESSION_DURATION_MINS,
} from './mockStages'

const router = useRouter()
const route = useRoute()

const phase = ref('ritual') // ritual | focus | summary
const step = ref(0)
const wordGoal = ref(String(Math.round(MOCK_LAST_SESSION_WORDS * 0.9)))
const lastSessionWords = MOCK_LAST_SESSION_WORDS
const sessionDurationMins = MOCK_SESSION_DURATION_MINS
const breathCount = ref(0)
const settleLeft = ref(0)
let settleTimer = null

const ideaTitle = computed(
	() => route.query.title || 'Implementation playbook',
)
const stageId = computed(() => route.query.stage || '1')

const bodyChecks = reactive([
	{ id: 'restroom', label: 'Relieve yourself', hint: 'One less interruption mid-flow.', done: false },
	{ id: 'water', label: 'Glass of water nearby', hint: 'Hydration without leaving the chair.', done: false },
	{ id: 'seat', label: 'Comfortable seat & posture', hint: 'Shoulders soft, feet grounded.', done: false },
	{ id: 'phone', label: 'Phone face-down', hint: 'Out of reach if you can.', done: false },
])

const steps = [
	{
		title: 'Set the aim',
		help: 'Pick a word goal you can finish in this block. We compare it to last time so it stays motivating — not crushing.',
	},
	{
		title: 'Body reset',
		help: 'Small rituals that tell your nervous system it is safe to focus.',
	},
	{
		title: 'Clear the runway',
		help: 'Remove the usual distraction triggers before the timer starts.',
	},
	{
		title: 'Arrive',
		help: 'A short settle so you enter writing already present.',
	},
]

const currentStep = computed(() => steps[step.value])

const goalFeedback = computed(() => {
	const goal = Number(wordGoal.value) || 0
	const last = lastSessionWords
	if (!goal) {
		return {
			tone: 'border-outline-gray-1 bg-surface-gray-1 text-ink-gray-6',
			message: 'Enter a number to get feedback.',
		}
	}
	if (goal > last * 1.5) {
		const suggest = Math.round(last * 1.15)
		return {
			tone: 'border-amber-200 bg-amber-50 text-ink-gray-8',
			message: `Ambitious compared to last time (${last}). Try ${suggest} for a clear win — you can always write more.`,
		}
	}
	if (goal < last * 0.5) {
		const suggest = Math.round(last * 0.75)
		return {
			tone: 'border-sky-200 bg-sky-50 text-ink-gray-8',
			message: `You usually write more. Stretching to about ${suggest} might feel more satisfying without overreaching.`,
		}
	}
	return {
		tone: 'border-emerald-200 bg-emerald-50 text-ink-gray-8',
		message: 'Looks realistic relative to your last session. Good aim.',
	}
})

const sessionBody = ref('')
const sessionWords = ref(0)
const paused = ref(false)
const focusInput = ref(null)
const elapsedSeconds = ref(0)
let tickTimer = null

const elapsedLabel = computed(() => {
	const m = Math.floor(elapsedSeconds.value / 60)
	const s = elapsedSeconds.value % 60
	return `${m}:${String(s).padStart(2, '0')}`
})

const summaryMessage = computed(() => {
	const goal = Number(wordGoal.value) || 0
	const w = sessionWords.value
	if (!goal) return 'Session saved (mock).'
	if (w >= goal) return 'You met your word goal. That compounds.'
	if (w >= goal * 0.7) return 'Close to the goal — solid showing for this block.'
	return 'Showing up matters more than the number. Schedule the next block while it is fresh.'
})

watch(step, (s) => {
	clearSettle()
	if (s === 3) startSettle()
})

function startSettle() {
	settleLeft.value = 15
	settleTimer = setInterval(() => {
		settleLeft.value -= 1
		if (settleLeft.value <= 0) clearSettle()
	}, 1000)
}

function clearSettle() {
	if (settleTimer) {
		clearInterval(settleTimer)
		settleTimer = null
	}
	settleLeft.value = 0
}

function next() {
	if (step.value < steps.length - 1) {
		step.value += 1
		return
	}
	enterFocus()
}

function skipRituals() {
	enterFocus()
}

function enterFocus() {
	clearSettle()
	phase.value = 'focus'
	paused.value = false
	elapsedSeconds.value = 0
	startTick()
	nextTick(() => focusInput.value?.focus())
}

function startTick() {
	stopTick()
	tickTimer = setInterval(() => {
		if (!paused.value) elapsedSeconds.value += 1
	}, 1000)
}

function stopTick() {
	if (tickTimer) {
		clearInterval(tickTimer)
		tickTimer = null
	}
}

function onSessionInput() {
	const t = sessionBody.value.trim()
	sessionWords.value = t ? t.split(/\s+/).length : 0
}

function pauseSession() {
	paused.value = true
}

function resumeSession() {
	paused.value = false
	nextTick(() => focusInput.value?.focus())
}

function stopSession() {
	paused.value = false
	stopTick()
	phase.value = 'summary'
}

function leaveMock() {
	router.push('/mock/growth')
}

function backToWrite() {
	router.push({
		name: 'MockWrite',
		params: { stage: stageId.value },
	})
}

function onKeydown(e) {
	if (phase.value === 'focus' && e.key === 'Escape') {
		e.preventDefault()
		pauseSession()
	}
}

onMounted(() => {
	window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
	window.removeEventListener('keydown', onKeydown)
	clearSettle()
	stopTick()
})
</script>
