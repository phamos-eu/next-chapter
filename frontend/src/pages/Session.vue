<template>
  <!-- Ritual -->
  <div
    v-if="phase === 'ritual'"
    class="flex min-h-screen items-center justify-center bg-[#ebe8e3] p-6"
  >
    <div
      class="w-full max-w-lg rounded-2xl border border-[#d9d4cc] bg-[#f7f5f1] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      <div class="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-gray-5">
        Writing session
      </div>
      <h1 class="mb-1 text-xl font-semibold text-ink-gray-9">{{ currentStep.title }}</h1>
      <p class="mb-2 text-sm text-ink-gray-5">{{ currentStep.help }}</p>
      <p class="mb-4 text-xs text-ink-gray-4">
        Step {{ step + 1 }} of {{ steps.length }}
        <span v-if="chapter"> · {{ chapter.title }}</span>
      </p>

      <!-- 0 Clear runway -->
      <div v-if="step === 0" class="space-y-2">
        <label
          v-for="item in runwayChecks"
          :key="item.id"
          class="flex cursor-pointer items-start gap-3 rounded-xl border border-[#ddd8d0] bg-[#faf8f5] px-3 py-2.5"
        >
          <input v-model="item.done" type="checkbox" class="mt-0.5" />
          <span class="text-sm text-ink-gray-8">{{ item.label }}</span>
        </label>
        <p v-if="!runwayChecks.length" class="text-sm text-ink-gray-5">
          No runway prompts configured yet. Add them in NextChapter Settings.
        </p>
        <p class="pt-1 text-xs text-ink-gray-4">Guidance only — Continue whenever you are ready.</p>
      </div>

      <!-- 1 Body -->
      <div v-else-if="step === 1" class="space-y-2">
        <label
          v-for="item in bodyChecks"
          :key="item.id"
          class="flex cursor-pointer items-start gap-3 rounded-xl border border-[#ddd8d0] bg-[#faf8f5] px-3 py-2.5"
        >
          <input v-model="item.done" type="checkbox" class="mt-0.5" />
          <span class="text-sm text-ink-gray-8">{{ item.label }}</span>
        </label>
        <p v-if="!bodyChecks.length" class="text-sm text-ink-gray-5">
          No body prompts configured yet. Add them in NextChapter Settings.
        </p>
        <p class="pt-1 text-xs text-ink-gray-4">Guidance only — Continue whenever you are ready.</p>
      </div>

      <!-- 2 Mind -->
      <div v-else-if="step === 2" class="space-y-3">
        <FormControl v-model="wordGoal" type="number" label="Words you plan to write" />
        <p class="text-sm text-ink-gray-5">
          Last session you wrote
          <span class="font-medium text-ink-gray-8">{{ lastSessionWords }}</span>
          words.
        </p>
        <div class="rounded-xl border px-3 py-2 text-sm" :class="goalFeedback.tone">
          {{ goalFeedback.message }}
        </div>
      </div>

      <!-- 3 Breathe -->
      <div v-else class="space-y-4 text-center">
        <p class="text-sm text-ink-gray-6">
          {{ breathPhaseLabel }}
        </p>
        <div
          class="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-[#cfc9c0] bg-[#efebe4] transition-transform duration-1000 ease-in-out"
          :style="{ transform: `scale(${breathScale})` }"
        >
          <span class="text-xs uppercase tracking-wide text-ink-gray-5">{{ breathPhase }}</span>
        </div>
        <div class="flex justify-center gap-3 py-1">
          <button
            v-for="n in breathCount"
            :key="n"
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full border text-sm transition"
            :class="
              breathMarked >= n
                ? 'border-ink-gray-9 bg-ink-gray-9 text-surface-white scale-105'
                : n === breathMarked + 1
                  ? 'border-ink-gray-7 bg-[#e8e3db] text-ink-gray-8'
                  : 'border-[#d0cbc3] text-ink-gray-5'
            "
            @click="markBreath(n)"
          >
            {{ n }}
          </button>
        </div>
        <Button
          v-if="breathMarked < breathCount"
          variant="subtle"
          :label="`Mark breath ${breathMarked + 1}`"
          @click="markBreath(breathMarked + 1)"
        />
        <p v-else class="text-sm text-ink-gray-5">Ready when you are.</p>
      </div>

      <div class="mt-6 flex items-center justify-between">
        <Button v-if="step > 0" variant="subtle" label="Back" @click="step -= 1" />
        <Button v-else variant="ghost" label="Cancel" @click="leave" />
        <Button
          variant="solid"
          :label="step === steps.length - 1 ? 'Enter session' : 'Continue'"
          :disabled="step === steps.length - 1 && breathMarked < breathCount"
          @click="next"
        />
      </div>
    </div>
  </div>

  <!-- Focus -->
  <div
    v-else-if="phase === 'focus'"
    class="fixed inset-0 z-50 flex flex-col bg-[#e8e4de]"
  >
    <header class="flex items-center justify-between px-5 py-3">
      <div class="min-w-0 flex-1 pr-4">
        <div class="truncate text-sm font-medium text-ink-gray-8">{{ chapter?.title }}</div>
        <div class="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[#d5d0c8]">
          <div
            class="h-full rounded-full transition-[width,background-color] duration-300"
            :style="progressBarStyle"
          />
        </div>
      </div>
      <div class="flex gap-2">
        <Button variant="subtle" label="Pause" @click="paused = true" />
        <Button variant="solid" label="Stop" @click="stopSession" />
      </div>
    </header>

    <div class="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-4 pb-8 pt-2">
      <div
        class="flex min-h-0 flex-1 flex-col rounded-2xl border border-[#d4cfc6] bg-[#faf8f4] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      >
        <textarea
          ref="focusInput"
          v-model="sessionBody"
          class="min-h-0 flex-1 resize-none border-0 bg-transparent text-base leading-relaxed text-ink-gray-9 outline-none ring-0 placeholder:text-ink-gray-4 focus:outline-none focus:ring-0"
          placeholder="Write. Nothing else is here."
        />
      </div>
    </div>

    <div
      v-if="paused"
      class="absolute inset-0 flex items-center justify-center bg-ink-gray-9/35 p-6"
    >
      <div
        class="w-full max-w-sm rounded-2xl border border-[#d4cfc6] bg-[#faf8f4] p-6 text-center shadow-lg"
      >
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

  <!-- Summary -->
  <div
    v-else-if="phase === 'summary'"
    class="flex min-h-screen items-center justify-center bg-[#ebe8e3] p-6"
  >
    <div
      class="w-full max-w-md rounded-2xl border border-[#d9d4cc] bg-[#f7f5f1] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      <div class="text-xs font-semibold uppercase tracking-wide text-ink-gray-5">
        Session complete
      </div>
      <h1 class="mt-1 text-xl font-semibold text-ink-gray-9">Nice work</h1>
      <p class="mt-2 text-sm text-ink-gray-5">{{ chapter?.title }}</p>
      <div class="mt-5 grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-[#ddd8d0] bg-[#faf8f5] p-3">
          <div class="text-xs text-ink-gray-5">Words written</div>
          <div class="text-2xl font-semibold text-ink-gray-9">{{ sessionWords }}</div>
        </div>
        <div class="rounded-xl border border-[#ddd8d0] bg-[#faf8f5] p-3">
          <div class="text-xs text-ink-gray-5">Goal</div>
          <div class="text-2xl font-semibold text-ink-gray-9">{{ Number(wordGoal) || 0 }}</div>
        </div>
      </div>
      <p class="mt-3 text-sm text-ink-gray-6">{{ summaryMessage }}</p>
      <div class="mt-6 flex justify-between gap-2">
        <Button variant="subtle" label="Growth Funnel" @click="router.push('/growth')" />
        <Button variant="solid" label="Back to idea" @click="backToWrite" />
      </div>
    </div>
  </div>

  <div v-else class="flex min-h-screen items-center justify-center text-sm text-ink-gray-5">
    Loading session…
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, FormControl, toast } from 'frappe-ui'
import { useWorkspace } from '@/composables/useWorkspace'

const router = useRouter()
const route = useRoute()
const { state, bootstrap, completeWritingSession, countWords, errorMessage } = useWorkspace()

const phase = ref('loading')
const step = ref(0)
const wordGoal = ref('300')
const runwayChecks = reactive([])
const bodyChecks = reactive([])
const breathMarked = ref(0)
const breathPhase = ref('inhale')
const breathScale = ref(1)
const paused = ref(false)
const sessionBody = ref('')
const focusInput = ref(null)
const startingWords = ref(0)
let breathTimer = null

const chapter = computed(
	() => state.chapters.find((c) => c.name === route.params.name) || null,
)

const lastSessionWords = computed(() => Number(chapter.value?.last_session_words || 0))

const breathCount = computed(() => Math.max(1, Number(state.settings.breath_count) || 3))
const inhaleSeconds = computed(() => Math.max(1, Number(state.settings.inhale_seconds) || 4))
const exhaleSeconds = computed(() => Math.max(1, Number(state.settings.exhale_seconds) || 6))

const steps = [
	{
		title: 'Clear the runway',
		help: 'Remove the usual distraction triggers before you write.',
	},
	{
		title: 'Body reset',
		help: 'Small rituals that tell your nervous system it is safe to focus.',
	},
	{
		title: 'Set the aim',
		help: 'Pick a word goal for this block. We compare it to last time so it stays motivating.',
	},
	{
		title: 'Arrive',
		help: 'Breathe with the cadence from Settings, then enter the session.',
	},
]

const currentStep = computed(() => steps[step.value])

const goalFeedback = computed(() => {
	const goal = Number(wordGoal.value) || 0
	const last = lastSessionWords.value
	if (!goal) {
		return {
			tone: 'border-[#ddd8d0] bg-[#faf8f5] text-ink-gray-6',
			message: 'Enter a number to get feedback.',
		}
	}
	if (!last) {
		return {
			tone: 'border-emerald-200 bg-emerald-50 text-ink-gray-8',
			message: 'First tracked session — any honest goal works.',
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

const sessionWords = computed(() => {
	const now = countWords(sessionBody.value)
	return Math.max(0, now - startingWords.value)
})

const progressRatio = computed(() => {
	const goal = Number(wordGoal.value) || 0
	if (!goal) return 0
	return Math.min(1, sessionWords.value / goal)
})

const progressBarStyle = computed(() => {
	const r = progressRatio.value
	// light gray → black
	const shade = Math.round(180 - r * 180)
	return {
		width: `${r * 100}%`,
		backgroundColor: `rgb(${shade}, ${shade}, ${shade})`,
	}
})

const breathPhaseLabel = computed(() => {
	if (breathMarked.value >= breathCount.value) {
		return 'Breaths complete. Enter when ready.'
	}
	return breathPhase.value === 'inhale'
		? `Inhale gently (${inhaleSeconds.value}s)`
		: `Exhale slowly (${exhaleSeconds.value}s)`
})

const summaryMessage = computed(() => {
	const goal = Number(wordGoal.value) || 0
	const w = sessionWords.value
	if (!goal) return 'Session saved.'
	if (w >= goal) return 'You met your word goal. That compounds.'
	if (w >= goal * 0.7) return 'Close to the goal — solid showing for this block.'
	return 'Showing up matters more than the number. Schedule the next block while it is fresh.'
})

function loadChecklists() {
	runwayChecks.splice(0)
	bodyChecks.splice(0)
	const runway = state.settings.runway_checklist || []
	const body = state.settings.body_checklist || []
	runway.forEach((item, i) => {
		runwayChecks.push({ id: `r-${i}`, label: item.prompt, done: false })
	})
	body.forEach((item, i) => {
		bodyChecks.push({ id: `b-${i}`, label: item.prompt, done: false })
	})
}

function startBreathCycle() {
	stopBreathCycle()
	breathPhase.value = 'inhale'
	breathScale.value = 1.18
	const tick = () => {
		if (breathPhase.value === 'inhale') {
			breathPhase.value = 'exhale'
			breathScale.value = 1
			breathTimer = setTimeout(tick, exhaleSeconds.value * 1000)
		} else {
			breathPhase.value = 'inhale'
			breathScale.value = 1.18
			breathTimer = setTimeout(tick, inhaleSeconds.value * 1000)
		}
	}
	breathTimer = setTimeout(tick, inhaleSeconds.value * 1000)
}

function stopBreathCycle() {
	if (breathTimer) {
		clearTimeout(breathTimer)
		breathTimer = null
	}
}

function markBreath(n) {
	const target = Number(n)
	if (target !== breathMarked.value + 1) return
	breathMarked.value = target
}

watch(step, (s) => {
	stopBreathCycle()
	if (s === 3) {
		breathMarked.value = 0
		startBreathCycle()
	}
})

function next() {
	if (step.value < steps.length - 1) {
		step.value += 1
		return
	}
	enterFocus()
}

function enterFocus() {
	stopBreathCycle()
	const base = chapter.value?.content || chapter.value?.summary || ''
	const plain = String(base)
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
	sessionBody.value = plain
	startingWords.value = countWords(plain)
	phase.value = 'focus'
	paused.value = false
	nextTick(() => focusInput.value?.focus())
}

function resumeSession() {
	paused.value = false
	nextTick(() => focusInput.value?.focus())
}

async function stopSession() {
	paused.value = false
	try {
		await completeWritingSession({
			name: chapter.value.name,
			words_written: sessionWords.value,
			word_goal: Number(wordGoal.value) || 0,
			content: `<p>${String(sessionBody.value || '')
				.split(/\n+/)
				.map((p) =>
					p
						.replace(/&/g, '&amp;')
						.replace(/</g, '&lt;')
						.replace(/>/g, '&gt;'),
				)
				.join('</p><p>')}</p>`,
		})
	} catch (e) {
		toast.error(errorMessage(e, 'Could not save session'))
	}
	phase.value = 'summary'
}

function leave() {
	router.push(chapter.value ? `/ideas/${chapter.value.name}` : '/growth')
}

function backToWrite() {
	router.push(`/ideas/${chapter.value.name}`)
}

function onKeydown(e) {
	if (phase.value === 'focus' && e.key === 'Escape') {
		e.preventDefault()
		paused.value = true
	}
}

onMounted(async () => {
	window.addEventListener('keydown', onKeydown)
	try {
		await bootstrap()
		if (!chapter.value) {
			toast.error('Idea not found')
			router.replace('/ideas')
			return
		}
		const last = lastSessionWords.value
		wordGoal.value = String(last ? Math.round(last * 0.9) : 300)
		loadChecklists()
		phase.value = 'ritual'
	} catch {
		phase.value = 'ritual'
	}
})

onBeforeUnmount(() => {
	window.removeEventListener('keydown', onKeydown)
	stopBreathCycle()
})
</script>
