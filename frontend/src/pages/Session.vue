<template>
  <!-- Ritual -->
  <div
    v-if="phase === 'ritual'"
    class="relative flex min-h-screen flex-col bg-[#ebe8e3] px-6 pb-16 pt-10"
  >
    <div class="mx-auto w-full max-w-lg text-center">
      <p class="text-xs font-semibold uppercase tracking-wide text-ink-gray-5">
        Writing session
      </p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight text-ink-gray-9">
        {{ chapter?.title || 'Idea' }}
      </h1>
    </div>

    <div class="mx-auto mt-8 flex w-full max-w-lg flex-1 flex-col">
      <div
        class="rounded-2xl border border-[#d9d4cc] bg-[#f7f5f1] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      >
        <h2 class="text-lg font-medium text-ink-gray-8">{{ currentStep.title }}</h2>
        <p class="mt-1 mb-5 text-sm text-ink-gray-5">{{ currentStep.help }}</p>

        <!-- 0 Clear runway -->
        <div v-if="step === 0" class="space-y-2">
          <label
            v-for="item in runwayChecks"
            :key="item.id"
            class="flex cursor-pointer items-start gap-3 rounded-xl border border-[#ddd8d0] bg-[#faf8f5] px-3 py-2.5 text-left"
          >
            <input v-model="item.done" type="checkbox" class="mt-0.5" />
            <span class="text-sm text-ink-gray-8">{{ item.label }}</span>
          </label>
          <p v-if="!runwayChecks.length" class="text-sm text-ink-gray-5">
            No runway prompts configured yet. Add them in NextChapter Settings.
          </p>
        </div>

        <!-- 1 Body -->
        <div v-else-if="step === 1" class="space-y-2">
          <label
            v-for="item in bodyChecks"
            :key="item.id"
            class="flex cursor-pointer items-start gap-3 rounded-xl border border-[#ddd8d0] bg-[#faf8f5] px-3 py-2.5 text-left"
          >
            <input v-model="item.done" type="checkbox" class="mt-0.5" />
            <span class="text-sm text-ink-gray-8">{{ item.label }}</span>
          </label>
          <p v-if="!bodyChecks.length" class="text-sm text-ink-gray-5">
            No body prompts configured yet. Add them in NextChapter Settings.
          </p>
        </div>

        <!-- 2 Mind / aim -->
        <div v-else-if="step === 2" class="space-y-3">
          <p class="text-sm text-ink-gray-6">
            Compared to last time, how much do you want to write?
          </p>
          <div class="grid gap-2">
            <button
              v-for="opt in aimOptions"
              :key="opt.id"
              type="button"
              class="rounded-xl border px-4 py-3 text-left text-sm transition"
              :class="
                aimChoice === opt.id
                  ? 'border-ink-gray-9 bg-ink-gray-9 text-surface-white'
                  : 'border-[#ddd8d0] bg-[#faf8f5] text-ink-gray-8 hover:border-[#c8c2b8]'
              "
              @click="aimChoice = opt.id"
            >
              <span class="font-medium">{{ opt.label }}</span>
              <span class="mt-0.5 block text-xs opacity-80">{{ opt.hint }}</span>
            </button>
          </div>
          <p v-if="aimChoice" class="text-sm text-ink-gray-6">{{ aimFeedback }}</p>
        </div>

        <!-- 3 Breathe -->
        <div v-else class="space-y-5 text-center">
          <p class="text-sm text-ink-gray-6">{{ breathPhaseLabel }}</p>
          <div
            class="mx-auto flex h-32 w-32 items-center justify-center rounded-full border border-[#cfc9c0] bg-[#efebe4]"
            :style="breathCircleStyle"
          >
            <span class="text-xs uppercase tracking-wide text-ink-gray-5">{{ breathPhase }}</span>
          </div>
          <p class="text-xs text-ink-gray-4">
            Breath {{ Math.min(breathsCompleted + 1, Math.max(breathsCompleted, requiredBreaths)) }}
            <span v-if="breathsCompleted < requiredBreaths">
              of {{ requiredBreaths }} required
            </span>
            <span v-else>· optional extras</span>
          </p>
          <div v-if="requiredBreathsDone" class="flex justify-center gap-2 pt-1">
            <Button variant="solid" label="Enter Session" @click="enterFocus" />
          </div>
        </div>

        <div v-if="step < 3" class="mt-6 flex items-center justify-between">
          <Button v-if="step > 0" variant="subtle" label="Back" @click="step -= 1" />
          <Button v-else variant="ghost" label="Cancel" @click="leave" />
          <Button
            variant="solid"
            label="Continue"
            :disabled="step === 2 && !aimChoice"
            @click="next"
          />
        </div>
        <div v-else-if="!requiredBreathsDone" class="mt-6 flex justify-start">
          <Button variant="subtle" label="Back" @click="step -= 1" />
        </div>
        <div v-else class="mt-4 flex justify-start">
          <Button variant="subtle" label="Back" @click="step -= 1" />
        </div>
      </div>
    </div>

    <!-- Bottom page dots -->
    <div class="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
      <button
        v-for="(s, i) in steps"
        :key="s.title"
        type="button"
        class="h-2 w-2 rounded-full transition"
        :class="i === step ? 'bg-ink-gray-9' : i < step ? 'bg-ink-gray-5' : 'bg-[#cfc9c0]'"
        :aria-label="`Step ${i + 1}`"
        @click="goStep(i)"
      />
    </div>
  </div>

  <!-- Focus -->
  <div
    v-else-if="phase === 'focus'"
    class="fixed inset-0 z-50 flex flex-col bg-[#e8e4de]"
  >
    <!-- Full-width progress: transparent → solid, L→R -->
    <div class="h-1.5 w-full overflow-hidden">
      <div
        class="h-full bg-ink-gray-9 transition-[width,opacity] duration-300"
        :style="progressBarStyle"
      />
    </div>

    <header class="flex items-center justify-between px-5 py-3">
      <h1 class="min-w-0 truncate text-lg font-semibold text-ink-gray-9">
        {{ chapter?.title }}
      </h1>
      <Button variant="solid" label="Complete" @click="completeOpen = true" />
    </header>

    <div class="relative mx-auto flex min-h-0 w-full max-w-5xl flex-1 gap-3 px-4 pb-8 pt-2">
      <div
        class="flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-[#d4cfc6] bg-[#faf8f4] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      >
        <textarea
          ref="focusInput"
          v-model="sessionBody"
          class="min-h-0 flex-1 resize-none border-0 bg-transparent leading-relaxed text-ink-gray-9 outline-none ring-0 placeholder:text-ink-gray-4 focus:outline-none focus:ring-0"
          :style="{ fontSize: `${focusFontSize}px` }"
          placeholder="Write. Nothing else is here."
        />
      </div>

      <!-- Capture rail -->
      <aside
        class="relative w-44 shrink-0"
        @mouseenter="railHover = true"
        @mouseleave="onRailLeave"
      >
        <div
          v-if="showCaptureHint"
          class="mb-2 rounded-lg bg-ink-gray-9/80 px-2 py-1.5 text-[11px] leading-snug text-surface-white"
        >
          Hover here to capture a side idea without leaving your writing.
        </div>

        <div class="flex max-h-full flex-col gap-2 overflow-y-auto pb-16">
          <div
            v-for="note in visibleNotes"
            :key="note.localId"
            class="rounded-xl border p-2 transition-opacity"
            :class="noteOpacityClass(note)"
            :style="{ borderColor: '#d4cfc6', background: '#f3efe8' }"
            @mouseenter="reviveNote(note)"
            @focusin="reviveNote(note)"
          >
            <textarea
              v-model="note.text"
              rows="3"
              class="w-full resize-none border-0 bg-transparent text-xs leading-relaxed text-ink-gray-8 outline-none placeholder:text-ink-gray-4"
              placeholder="2–3 sentences…"
              @input="onNoteInput(note)"
              @focus="reviveNote(note)"
            />
          </div>

          <div
            v-if="railHover || showCaptureHint"
            class="rounded-xl border border-dashed border-[#cfc9c0] bg-[#f3efe8]/70 p-2"
          >
            <textarea
              v-model="draftNote"
              rows="3"
              class="w-full resize-none border-0 bg-transparent text-xs leading-relaxed text-ink-gray-8 outline-none placeholder:text-ink-gray-4"
              placeholder="New idea…"
              @input="onDraftInput"
              @focus="onDraftFocus"
            />
          </div>
        </div>
      </aside>
    </div>

    <!-- Minimized bubbles -->
    <div class="pointer-events-none absolute bottom-4 right-4 z-20 flex max-w-xs flex-wrap justify-end gap-2">
      <button
        v-for="note in bubbledNotes"
        :key="note.localId"
        type="button"
        class="pointer-events-auto rounded-full border border-[#cfc9c0] bg-[#f3efe8] px-3 py-1.5 text-xs text-ink-gray-7 shadow-sm hover:bg-[#faf8f4]"
        @click="restoreBubble(note)"
      >
        {{ bubbleLabel(note) }}
      </button>
    </div>

    <!-- Complete dialog -->
    <div
      v-if="completeOpen"
      class="absolute inset-0 z-30 flex items-center justify-center bg-ink-gray-9/35 p-6"
    >
      <div
        class="w-full max-w-sm rounded-2xl border border-[#d4cfc6] bg-[#faf8f4] p-6 text-center shadow-lg"
      >
        <h2 class="text-lg font-semibold text-ink-gray-9">Complete session?</h2>
        <p class="mt-2 text-sm text-ink-gray-5">
          Resume writing, or complete and save this block.
        </p>
        <div class="mt-5 flex justify-center gap-2">
          <Button variant="subtle" label="Resume" @click="completeOpen = false" />
          <Button variant="solid" label="Complete" @click="finishSession" />
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
      <p class="mt-4 text-sm text-ink-gray-6">{{ summaryMessage }}</p>
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
import { Button, toast } from 'frappe-ui'
import { useWorkspace } from '@/composables/useWorkspace'

const HINT_KEY = 'nextchapter_focus_capture_hints_seen'
const HINT_LIMIT = 5

const router = useRouter()
const route = useRoute()
const {
	state,
	bootstrap,
	completeWritingSession,
	captureSideIdea,
	countWords,
	errorMessage,
} = useWorkspace()

const phase = ref('loading')
const step = ref(0)
const aimChoice = ref('')
const runwayChecks = reactive([])
const bodyChecks = reactive([])
const breathsCompleted = ref(0)
const breathPhase = ref('inhale') // inhale | hold | exhale
const breathScale = ref(1)
const breathOpacity = ref(1)
const sessionBody = ref('')
const focusInput = ref(null)
const startingWords = ref(0)
const completeOpen = ref(false)
const railHover = ref(false)
const draftNote = ref('')
const notes = reactive([])
const showCaptureHint = ref(false)
let breathTimer = null
let draftTimer = null
let noteTimers = {}

const chapter = computed(
	() => state.chapters.find((c) => c.name === route.params.name) || null,
)

const lastSessionWords = computed(() => Number(chapter.value?.last_session_words || 0))
const requiredBreaths = computed(() => Math.max(1, Number(state.settings.breath_count) || 3))
const inhaleSeconds = computed(() => Math.max(1, Number(state.settings.inhale_seconds) || 4))
const holdSeconds = computed(() => Math.max(0, Number(state.settings.hold_seconds) || 2))
const exhaleSeconds = computed(() => Math.max(1, Number(state.settings.exhale_seconds) || 6))
const focusFontSize = computed(() => Math.max(12, Number(state.settings.focus_font_size) || 18))
const fadeDuration = computed(() => Math.max(0.5, Number(state.settings.fade_duration_secs) || 2))
const bubbleChars = computed(() => Math.max(4, Number(state.settings.bubble_label_chars) || 12))
const requiredBreathsDone = computed(() => breathsCompleted.value >= requiredBreaths.value)

const steps = [
	{ title: 'Clear the runway', help: 'Remove the usual distraction triggers before you write.' },
	{ title: 'Body reset', help: 'Small rituals that tell your nervous system it is safe to focus.' },
	{ title: 'Set the aim', help: 'Choose how this block compares to last time — no numbers needed.' },
	{ title: 'Arrive', help: 'Breathe with the cadence from Settings, then enter when ready.' },
]
const currentStep = computed(() => steps[step.value])

const aimOptions = [
	{ id: 'more', label: 'More than last time', hint: 'Stretch a little — you are building capacity.' },
	{ id: 'similar', label: 'Similar to last time', hint: 'Steady is strong. Match your recent pace.' },
	{ id: 'less', label: 'Less than last time', hint: 'A lighter aim still counts as showing up.' },
]

const wordGoal = computed(() => {
	const last = lastSessionWords.value || 300
	if (aimChoice.value === 'more') return Math.round(last * 1.15)
	if (aimChoice.value === 'less') return Math.round(last * 0.85)
	return Math.round(last)
})

const aimFeedback = computed(() => {
	if (aimChoice.value === 'more') return 'A bit more than last time — ambitious in a healthy way.'
	if (aimChoice.value === 'less') return 'A lighter aim than last time — still progress.'
	if (aimChoice.value === 'similar') return 'Around the same as last time — consistent.'
	return ''
})

const sessionWords = computed(() => {
	const now = countWords(sessionBody.value)
	return Math.max(0, now - startingWords.value)
})

const progressRatio = computed(() => {
	const goal = wordGoal.value || 0
	if (!goal) return 0
	return Math.min(1, sessionWords.value / goal)
})

const progressBarStyle = computed(() => {
	const r = progressRatio.value
	return {
		width: `${r * 100}%`,
		opacity: r, // transparent → solid as it fills
	}
})

const breathPhaseLabel = computed(() => {
	if (breathPhase.value === 'inhale') return `Inhale (${inhaleSeconds.value}s)`
	if (breathPhase.value === 'hold') return `Hold (${holdSeconds.value}s)`
	return `Exhale (${exhaleSeconds.value}s)`
})

const breathCircleStyle = computed(() => {
	const duration =
		breathPhase.value === 'inhale'
			? inhaleSeconds.value
			: breathPhase.value === 'hold'
				? holdSeconds.value
				: exhaleSeconds.value
	return {
		transform: `scale(${breathScale.value})`,
		opacity: breathOpacity.value,
		transition: `transform ${duration}s linear, opacity ${duration}s linear`,
	}
})

const visibleNotes = computed(() => notes.filter((n) => n.state !== 'bubble'))
const bubbledNotes = computed(() => notes.filter((n) => n.state === 'bubble'))

const summaryMessage = computed(() => {
	const goal = wordGoal.value || 0
	const w = sessionWords.value
	if (!goal) return 'Session saved.'
	if (w >= goal) return 'You met the aim you set for this block.'
	if (w >= goal * 0.7) return 'Close to your aim — solid showing for this block.'
	return 'Showing up matters more than the number. Schedule the next block while it is fresh.'
})

function loadChecklists() {
	runwayChecks.splice(0)
	bodyChecks.splice(0)
	;(state.settings.runway_checklist || []).forEach((item, i) => {
		runwayChecks.push({ id: `r-${i}`, label: item.prompt, done: false })
	})
	;(state.settings.body_checklist || []).forEach((item, i) => {
		bodyChecks.push({ id: `b-${i}`, label: item.prompt, done: false })
	})
}

function stopBreathCycle() {
	if (breathTimer) {
		clearTimeout(breathTimer)
		breathTimer = null
	}
}

function runBreathPhase(phaseName) {
	breathPhase.value = phaseName
	if (phaseName === 'inhale') {
		breathScale.value = 1.2
		breathOpacity.value = 1
		breathTimer = setTimeout(() => runBreathPhase('hold'), inhaleSeconds.value * 1000)
	} else if (phaseName === 'hold') {
		breathScale.value = 1.2
		breathOpacity.value = 0.45
		const wait = Math.max(holdSeconds.value, 0.05) * 1000
		breathTimer = setTimeout(() => runBreathPhase('exhale'), wait)
	} else {
		breathScale.value = 1
		breathOpacity.value = 1
		breathTimer = setTimeout(() => {
			breathsCompleted.value += 1
			runBreathPhase('inhale')
		}, exhaleSeconds.value * 1000)
	}
}

function startBreathCycle() {
	stopBreathCycle()
	breathsCompleted.value = 0
	breathScale.value = 1
	breathOpacity.value = 1
	// kick transition from base
	nextTick(() => runBreathPhase('inhale'))
}

watch(step, (s) => {
	stopBreathCycle()
	if (s === 3) startBreathCycle()
})

function goStep(i) {
	if (i <= step.value) step.value = i
}

function next() {
	if (step.value === 2 && !aimChoice.value) return
	if (step.value < steps.length - 1) {
		step.value += 1
	}
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
	completeOpen.value = false
	nextTick(() => focusInput.value?.focus())
}

function idleSecsForWords(words) {
	const min = Number(state.settings.fade_idle_min_secs) || 2
	const max = Number(state.settings.fade_idle_max_secs) || 8
	const base = Number(state.settings.fade_idle_secs) || 3
	// fewer words → sooner; more words → longer (clamped)
	const scaled = base + (words / 40) * (max - min)
	return Math.min(max, Math.max(min, scaled))
}

function noteOpacityClass(note) {
	if (note.state === 'fading' || note.state === 'ghost') {
		return 'opacity-25 hover:opacity-100'
	}
	return 'opacity-100'
}

function bubbleLabel(note) {
	const t = (note.text || '').replace(/\s+/g, ' ').trim()
	const n = bubbleChars.value
	if (t.length <= n) return t || 'Idea'
	return `${t.slice(0, Math.max(1, n - 3))}…`
}

function clearNoteTimer(note) {
	const t = noteTimers[note.localId]
	if (t?.idle) clearTimeout(t.idle)
	if (t?.fade) clearTimeout(t.fade)
	delete noteTimers[note.localId]
}

function scheduleNoteFade(note) {
	clearNoteTimer(note)
	if (!note.text.trim() || note.focused) return
	const words = countWords(note.text)
	const idle = idleSecsForWords(words) * 1000
	const fade = fadeDuration.value * 1000
	noteTimers[note.localId] = {
		idle: setTimeout(() => {
			note.state = 'fading'
			noteTimers[note.localId] = {
				fade: setTimeout(() => {
					note.state = 'ghost'
					setTimeout(() => {
						if (note.state === 'ghost' && !note.focused) note.state = 'bubble'
					}, 800)
				}, fade),
			}
		}, idle),
	}
}

function reviveNote(note) {
	note.focused = true
	note.state = 'solid'
	clearNoteTimer(note)
}

function onNoteInput(note) {
	note.state = 'solid'
	clearNoteTimer(note)
	clearTimeout(note.saveTimer)
	note.saveTimer = setTimeout(async () => {
		const text = note.text.trim()
		if (!text || countWords(text) < 2) return
		try {
			const saved = await captureSideIdea({
				parent: chapter.value.name,
				text,
				name: note.chapterName || null,
			})
			note.chapterName = saved.name
		} catch (e) {
			toast.error(errorMessage(e, 'Could not save side idea'))
		}
		note.focused = false
		scheduleNoteFade(note)
	}, 1500)
}

function onDraftFocus() {
	bumpHint()
}

function onDraftInput() {
	clearTimeout(draftTimer)
	draftTimer = setTimeout(async () => {
		const text = draftNote.value.trim()
		if (!text || countWords(text) < 2) return
		const localId = `n-${Date.now()}`
		const note = reactive({
			localId,
			text,
			chapterName: null,
			state: 'solid',
			focused: false,
			saveTimer: null,
		})
		notes.push(note)
		draftNote.value = ''
		try {
			const saved = await captureSideIdea({
				parent: chapter.value.name,
				text,
			})
			note.chapterName = saved.name
		} catch (e) {
			toast.error(errorMessage(e, 'Could not save side idea'))
		}
		scheduleNoteFade(note)
	}, 1500)
}

function onRailLeave() {
	railHover.value = false
	notes.forEach((n) => {
		n.focused = false
		if (n.text.trim() && n.state === 'solid') scheduleNoteFade(n)
	})
}

function restoreBubble(note) {
	note.state = 'solid'
	note.focused = true
	railHover.value = true
}

function bumpHint() {
	if (!showCaptureHint.value) return
	let seen = Number(localStorage.getItem(HINT_KEY) || 0)
	seen += 1
	localStorage.setItem(HINT_KEY, String(seen))
	if (seen >= HINT_LIMIT) showCaptureHint.value = false
}

async function finishSession() {
	completeOpen.value = false
	try {
		await completeWritingSession({
			name: chapter.value.name,
			words_written: sessionWords.value,
			word_goal: wordGoal.value,
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
		completeOpen.value = true
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
		loadChecklists()
		const seen = Number(localStorage.getItem(HINT_KEY) || 0)
		showCaptureHint.value = seen < HINT_LIMIT
		phase.value = 'ritual'
	} catch {
		phase.value = 'ritual'
	}
})

onBeforeUnmount(() => {
	window.removeEventListener('keydown', onKeydown)
	stopBreathCycle()
	clearTimeout(draftTimer)
	Object.keys(noteTimers).forEach((id) => {
		const t = noteTimers[id]
		if (t?.idle) clearTimeout(t.idle)
		if (t?.fade) clearTimeout(t.fade)
	})
})
</script>
