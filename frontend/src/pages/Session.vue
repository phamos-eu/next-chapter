<template>
  <!-- Ritual -->
  <div
    v-if="phase === 'ritual'"
    class="relative flex min-h-screen flex-col bg-[#f0ede8] px-6 pb-16 pt-10"
  >
    <div
      v-if="state.settings.in_development"
      class="absolute right-4 top-4 rounded bg-amber-100 px-2 py-1 text-xs text-amber-800"
    >
      In Development
      <button class="ml-2 underline" type="button" @click="skipRitualToFocus">Skip to write</button>
    </div>

    <div class="mx-auto w-full max-w-lg text-center">
      <p class="text-xs font-semibold uppercase tracking-wide text-ink-gray-5">Writing session</p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight text-ink-gray-9">
        {{ chapter?.title || 'Idea' }}
      </h1>
    </div>

    <div class="mx-auto mt-8 flex w-full max-w-lg flex-1 flex-col">
      <div class="rounded-2xl border border-[#e0dbd3] bg-[#f7f5f2] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <h2 class="text-lg font-medium text-ink-gray-8">{{ currentStep.title }}</h2>
        <p class="mt-1 mb-5 text-sm text-ink-gray-5">{{ currentStep.help }}</p>

        <div v-if="step === 0" class="space-y-3 text-left">
          <div
            v-if="priorFocusNote"
            class="rounded-xl border border-[#ddd8d0] bg-[#faf8f5] p-3 text-sm"
          >
            <div class="text-xs font-medium text-ink-gray-5">Last time you wanted to focus on</div>
            <p class="mt-1 text-ink-gray-8">{{ priorFocusNote }}</p>
            <div class="mt-2 flex gap-2">
              <Button size="sm" variant="subtle" label="Keep" @click="focusNoteAction = 'kept'" />
              <Button size="sm" variant="subtle" label="Edit" @click="focusNoteAction = 'edited'" />
            </div>
            <textarea
              v-if="focusNoteAction === 'edited'"
              v-model="priorFocusNoteDraft"
              class="mt-2 w-full rounded-lg border border-[#ddd8d0] bg-white p-2 text-sm"
              rows="2"
            />
          </div>
          <label
            v-for="item in runwayChecks"
            :key="item.id"
            class="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e0dbd3] bg-[#faf8f5] px-3 py-2.5"
          >
            <input v-model="item.done" type="checkbox" class="mt-0.5" />
            <span class="text-sm text-ink-gray-8">{{ item.label }}</span>
          </label>
        </div>

        <div v-else-if="step === 1" class="space-y-2 text-left">
          <label
            v-for="item in bodyChecks"
            :key="item.id"
            class="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e0dbd3] bg-[#faf8f5] px-3 py-2.5"
          >
            <input v-model="item.done" type="checkbox" class="mt-0.5" />
            <span class="text-sm text-ink-gray-8">{{ item.label }}</span>
          </label>
        </div>

        <div v-else-if="step === 2" class="space-y-3">
          <p class="text-sm text-ink-gray-6">Compared to last time, how much do you want to write?</p>
          <div class="grid gap-2">
            <button
              v-for="opt in aimOptions"
              :key="opt.id"
              type="button"
              class="rounded-xl border px-4 py-3 text-left text-sm"
              :class="
                aimChoice === opt.id
                  ? 'border-ink-gray-9 bg-ink-gray-9 text-surface-white'
                  : 'border-[#e0dbd3] bg-[#faf8f5] text-ink-gray-8'
              "
              @click="aimChoice = opt.id"
            >
              <span class="font-medium">{{ opt.label }}</span>
            </button>
          </div>
        </div>

        <div v-else class="space-y-6 text-center">
          <p
            v-if="breathPhase === 'prepare'"
            class="text-xs font-normal tracking-wide text-ink-gray-4"
          >
            Inhale will start in
          </p>
          <div
            class="mx-auto flex h-36 w-36 items-center justify-center rounded-full border border-[#e4dfd7] bg-[#f0ede8]/80"
            :style="breathCircleStyle"
          >
            <span class="text-3xl font-light tabular-nums text-ink-gray-5">{{
              phaseCountdown
            }}</span>
          </div>
          <p class="text-[11px] font-normal text-ink-gray-4/80">
            <span v-if="!requiredBreathsDone">
              Breath {{ breathsCompleted + 1 }} of {{ requiredBreaths }}
            </span>
            <span v-else>Whenever you’re ready</span>
          </p>
          <Button
            v-if="requiredBreathsDone"
            variant="subtle"
            label="Enter Session"
            @click="enterFocus"
          />
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
        <div v-else class="mt-6 flex justify-start">
          <Button variant="subtle" label="Back" @click="step -= 1" />
        </div>
      </div>
    </div>

    <div class="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
      <span
        v-for="(s, i) in steps"
        :key="s.title"
        class="h-2 w-2 rounded-full"
        :class="i === step ? 'bg-ink-gray-9' : i < step ? 'bg-ink-gray-5' : 'bg-[#cfc9c0]'"
      />
    </div>
  </div>

  <!-- Focus -->
  <div v-else-if="phase === 'focus'" class="fixed inset-0 z-50 flex flex-col bg-[#ece9e4]">
    <div class="h-1.5 w-full bg-[#ddd8d0]/70">
      <div
        class="h-full bg-ink-gray-9 transition-[width,opacity] duration-500"
        :style="progressBarStyle"
      />
    </div>
    <header class="flex items-center justify-between px-5 py-3">
      <h1 class="truncate text-lg font-semibold text-ink-gray-9">{{ chapter?.title }}</h1>
      <Button variant="solid" label="Complete" @click="openComplete" />
    </header>

    <div
      class="relative mx-auto flex min-h-0 w-full max-w-5xl flex-1 gap-3 px-4 pb-8 pt-2"
      @mousemove="onFocusPointer"
    >
      <!-- Writing surface + page stack -->
      <div class="relative min-h-0 min-w-0 flex-1 overflow-visible">
        <!-- Previous sheet peek (under stack) -->
        <button
          v-if="pagePileOn && pageIndex > 0"
          type="button"
          class="absolute inset-2 z-0 rounded-2xl border border-[#ddd8d0] bg-[#f0ebe4] shadow-sm transition hover:brightness-[0.98]"
          :style="{ transform: 'translate(-14px, 12px) rotate(-1.2deg)' }"
          aria-label="Previous page"
          @click="goPrevPage"
        >
          <span
            class="pointer-events-none block h-full overflow-hidden p-5 text-left text-xs leading-relaxed text-ink-gray-4 opacity-60"
            :style="{ fontSize: `${Math.max(12, focusFontSize - 4)}px` }"
          >
            {{ peekText(pages[pageIndex - 1]) }}
          </span>
        </button>

        <!-- Current page (top of stack) -->
        <div
          class="relative z-10 flex h-full min-h-0 flex-col rounded-2xl border border-[#ddd8d0] bg-[#f7f5f2] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-transform duration-300"
          :class="pagePileOn && pageIndex > 0 ? 'ml-3 mt-2' : ''"
        >
          <textarea
            ref="focusInput"
            v-model="activePageText"
            class="min-h-0 flex-1 resize-none border-0 bg-transparent leading-relaxed text-ink-gray-9 outline-none"
            :style="{ fontSize: `${focusFontSize}px` }"
            placeholder="Write. Nothing else is here."
            @input="onFocusInput"
          />
        </div>

        <!-- Next sheet peek: only when a real newer page already exists -->
        <button
          v-if="showNextPagePeek"
          type="button"
          class="absolute -right-1 top-6 z-20 h-[70%] w-9 overflow-hidden rounded-r-2xl border border-[#ddd8d0] bg-[#faf8f5] shadow-md transition hover:brightness-[1.02]"
          :style="{ transform: 'translateX(6px) rotate(1.5deg)' }"
          aria-label="Next page"
          @click="goNextPage"
        >
          <span
            class="pointer-events-none block h-full overflow-hidden p-2 text-[10px] leading-snug text-ink-gray-4 opacity-50"
          >
            {{ peekText(pages[pageIndex + 1]) }}
          </span>
        </button>
      </div>

      <!-- Capture band: notes list + hover to spawn draft at cursor -->
      <aside
        class="relative w-40 shrink-0"
        @mouseenter="onCaptureEnter"
        @mouseleave="onCaptureLeave"
      >
        <div
          v-if="showCaptureHint && !captureZoneActive"
          class="mb-2 rounded-lg bg-ink-gray-9/60 px-2 py-1.5 text-[11px] text-surface-white"
        >
          Hover here to capture a side idea.
        </div>
        <div class="flex max-h-full flex-col gap-2 overflow-y-auto pb-16">
          <div
            v-for="note in visibleNotes"
            :key="note.localId"
            class="rounded-xl border p-2 transition-opacity duration-[var(--fade-ms)]"
            :style="noteStyle(note)"
            @mouseenter="reviveNote(note)"
          >
            <textarea
              v-model="note.text"
              :rows="noteRows(note)"
              class="w-full resize-none border-0 bg-transparent text-xs leading-relaxed outline-none"
              @input="onNoteInput(note)"
              @focus="reviveNote(note)"
            />
          </div>
        </div>
      </aside>
    </div>

    <!-- Floating draft at cursor -->
    <div
      v-if="showDraftComposer"
      class="pointer-events-auto fixed z-[25] w-52 rounded-xl border border-dashed border-[#cfc9c0] bg-[#f3efe8]/95 p-2 shadow-sm"
      :style="draftComposerStyle"
      @mousemove.stop="onDraftPointer"
      @mouseenter="captureZoneActive = true"
      @mouseleave="onDraftComposerLeave"
    >
      <textarea
        ref="draftInput"
        v-model="draftNote"
        :rows="draftRows"
        class="w-full resize-none border-0 bg-transparent text-xs outline-none"
        placeholder="New idea…"
        @input="onDraftInput"
        @focus="draftPinned = true"
      />
    </div>

    <div class="pointer-events-none absolute bottom-4 right-4 z-20 flex max-w-xs flex-wrap justify-end gap-2">
      <button
        v-for="note in bubbledNotes"
        :key="note.localId"
        type="button"
        class="pointer-events-auto rounded-full border px-3 py-1.5 text-xs shadow-sm"
        :style="bubbleStyle(note)"
        @click="restoreBubble(note)"
      >
        {{ bubbleLabel(note) }}
      </button>
    </div>

    <!-- Capture dialog after 2–3 lines -->
    <div
      v-if="captureDialog"
      class="absolute inset-0 z-30 flex items-center justify-center bg-ink-gray-9/30 p-4"
    >
      <div
        class="w-full max-w-md rounded-2xl border p-4 shadow-lg"
        :style="{ background: captureDialog.tint, borderColor: '#ddd8d0' }"
      >
        <textarea
          v-model="captureDialog.text"
          rows="8"
          class="w-full resize-none border-0 bg-transparent text-sm outline-none"
          @input="onCaptureDialogInput"
        />
        <div class="mt-3 flex justify-end gap-2">
          <Button variant="subtle" label="Done" @click="closeCaptureDialog" />
        </div>
      </div>
    </div>

    <!-- Complete wizard (steps filtered by what happened in the session) -->
    <div
      v-if="completeOpen && currentCompleteStep"
      class="absolute inset-0 z-40 flex items-center justify-center bg-ink-gray-9/35 p-4"
    >
      <div
        class="w-full rounded-2xl border border-[#ddd8d0] bg-[#f7f5f2] p-5 shadow-lg"
        :class="currentCompleteStep.id === 'plan' ? 'max-w-3xl' : 'max-w-md'"
      >
        <h2 class="text-lg font-semibold text-ink-gray-9">{{ currentCompleteStep.title }}</h2>
        <p class="mt-1 text-sm text-ink-gray-5">{{ currentCompleteStep.help }}</p>

        <div v-if="currentCompleteStep.id === 'feel'" class="mt-4 grid gap-2">
          <button
            v-for="opt in [
              { id: 'productive', label: 'Productive' },
              { id: 'mixed', label: 'Mixed' },
              { id: 'not_really', label: 'Not really' },
            ]"
            :key="opt.id"
            type="button"
            class="rounded-xl border px-3 py-2 text-left text-sm"
            :class="
              feedback.felt_productive === opt.id
                ? 'border-ink-gray-9 bg-ink-gray-9 text-white'
                : 'border-[#ddd8d0] bg-[#faf8f5]'
            "
            @click="selectComplete('felt_productive', opt.id)"
          >
            {{ opt.label }}
          </button>
        </div>

        <div v-else-if="currentCompleteStep.id === 'aim'" class="mt-4 grid grid-cols-3 gap-2">
          <button
            v-for="opt in ['increase', 'keep', 'decrease']"
            :key="opt"
            type="button"
            class="rounded-xl border px-3 py-2 text-sm capitalize"
            :class="
              feedback.aim_adjust === opt
                ? 'border-ink-gray-9 bg-ink-gray-9 text-white'
                : 'border-[#ddd8d0] bg-[#faf8f5]'
            "
            @click="selectComplete('aim_adjust', opt)"
          >
            {{ opt }}
          </button>
        </div>

        <div v-else-if="currentCompleteStep.id === 'distraction'" class="mt-4 space-y-3">
          <div class="grid gap-2">
            <button
              v-for="opt in [
                { id: 'focused', label: 'Focused' },
                { id: 'a_bit', label: 'A bit pulled away' },
                { id: 'quite', label: 'Quite distracted' },
              ]"
              :key="opt.id"
              type="button"
              class="rounded-xl border px-3 py-2 text-left text-sm"
              :class="
                feedback.distraction_level === opt.id
                  ? 'border-ink-gray-9 bg-ink-gray-9 text-white'
                  : 'border-[#ddd8d0] bg-[#faf8f5]'
              "
              @click="onDistraction(opt.id)"
            >
              {{ opt.label }}
            </button>
          </div>
          <template v-if="capturedSideIdeas">
            <p class="text-xs text-ink-gray-5">Fade timing next time</p>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="opt in ['increase', 'keep', 'decrease']"
                :key="opt"
                type="button"
                class="rounded-xl border px-3 py-2 text-sm capitalize"
                :class="
                  feedback.fade_adjust === opt
                    ? 'border-ink-gray-9 bg-ink-gray-9 text-white'
                    : 'border-[#ddd8d0] bg-[#faf8f5]'
                "
                @click="selectComplete('fade_adjust', opt)"
              >
                {{ opt }}
              </button>
            </div>
          </template>
        </div>

        <div v-else-if="currentCompleteStep.id === 'next_topic'" class="mt-4 space-y-3 text-left">
          <FormControl
            v-model="feedback.next_focus_note"
            type="textarea"
            label="Next topic"
          />
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="rounded-xl border border-[#ddd8d0] bg-[#faf8f5] px-3 py-2 text-sm"
              @click="advanceComplete()"
            >
              Skip for now
            </button>
            <button
              type="button"
              class="rounded-xl border border-ink-gray-9 bg-ink-gray-9 px-3 py-2 text-sm text-white"
              @click="advanceComplete()"
            >
              Use this note
            </button>
          </div>
        </div>

        <div v-else-if="currentCompleteStep.id === 'plan'" class="mt-4 space-y-3 text-left">
          <SessionPlanCalendar
            :model-value="planSlotValues"
            :booked="planBookedSessions"
            :draft-label="chapter?.title || 'This idea'"
            @update:model-value="onPlanSlotsUpdate"
          />
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="rounded-xl border border-[#ddd8d0] bg-[#faf8f5] px-3 py-2 text-sm"
              @click="skipPlanAndAdvance"
            >
              Skip planning
            </button>
            <button
              type="button"
              class="rounded-xl border border-ink-gray-9 bg-ink-gray-9 px-3 py-2 text-sm text-white"
              @click="advanceComplete()"
            >
              Keep plan
            </button>
          </div>
        </div>

        <div v-else-if="currentCompleteStep.id === 'start_long'" class="mt-4 space-y-3">
          <div class="grid gap-2">
            <button
              v-for="opt in [
                { id: 'yes', label: 'Yes — a bit long' },
                { id: 'no', label: 'No — felt fine' },
                { id: 'skip', label: 'Skip' },
              ]"
              :key="opt.id"
              type="button"
              class="rounded-xl border px-3 py-2 text-left text-sm"
              :class="
                feedback.start_felt_long === opt.id
                  ? 'border-ink-gray-9 bg-ink-gray-9 text-white'
                  : 'border-[#ddd8d0] bg-[#faf8f5]'
              "
              @click="selectComplete('start_felt_long', opt.id)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="mt-5 flex justify-start">
          <Button
            v-if="completeStep > 0"
            variant="subtle"
            label="Back"
            @click="backComplete"
          />
          <Button v-else variant="ghost" label="Resume" @click="completeOpen = false" />
        </div>
      </div>
    </div>
  </div>

  <div v-else class="flex min-h-screen items-center justify-center text-sm text-ink-gray-5">
    Loading…
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, FormControl, toast } from 'frappe-ui'
import dayjs from 'dayjs'
import SessionPlanCalendar from '@/components/SessionPlanCalendar.vue'
import { PAGE_PILE_STAGES, useWorkspace } from '@/composables/useWorkspace'

const HINT_KEY = 'nextchapter_focus_capture_hints_seen'
const router = useRouter()
const route = useRoute()
const {
	state,
	bootstrap,
	completeWritingSession,
	captureSideIdea,
	countWords,
	effectiveSetting,
	errorMessage,
	scheduledChapters,
	savePrefs,
} = useWorkspace()

const phase = ref('loading')
const step = ref(0)
const aimChoice = ref('')
const runwayChecks = reactive([])
const bodyChecks = reactive([])
const breathsCompleted = ref(0)
const breathPhase = ref('prepare')
const phaseCountdown = ref(0)
const breathScale = ref(1)
const breathOpacity = ref(1)
const sessionStartedOn = ref('')
const pages = ref([''])
const pageIndex = ref(0)
const completeOpen = ref(false)
const completeStep = ref(0)
const feedback = reactive({
	felt_productive: '',
	aim_adjust: 'keep',
	distraction_level: '',
	fade_adjust: 'keep',
	start_felt_long: 'skip',
	next_focus_note: '',
})
const scheduleSlots = reactive(['', '', ''])
const priorFocusNote = ref('')
const priorFocusNoteDraft = ref('')
const focusNoteAction = ref('kept')
const captureZoneActive = ref(false)
const draftNote = ref('')
const draftPinned = ref(false)
const pointerX = ref(0)
const pointerY = ref(0)
const draftX = ref(0)
const draftY = ref(0)
const notes = reactive([])
const showCaptureHint = ref(false)
const captureDialog = ref(null)
const focusInput = ref(null)
const draftInput = ref(null)
let breathTimer = null
let countdownTimer = null
let draftTimer = null
let noteTimers = {}

const chapter = computed(
	() => state.chapters.find((c) => c.name === route.params.name) || null,
)
const lastSessionWords = computed(() => Number(chapter.value?.last_session_words || 0))
const requiredBreaths = computed(() =>
	Math.max(1, Number(effectiveSetting('breath_count', 3)) || 3),
)
const inhaleSeconds = computed(() => Math.max(1, Number(state.settings.inhale_seconds) || 4))
const holdInSeconds = computed(() => Math.max(0, Number(state.settings.hold_seconds) || 2))
const exhaleSeconds = computed(() => Math.max(1, Number(state.settings.exhale_seconds) || 6))
const holdOutSeconds = computed(() =>
	Math.max(0, Number(state.settings.hold_after_exhale_seconds) || 2),
)
const prepareSeconds = computed(() =>
	Math.max(1, Number(state.settings.breath_prepare_seconds) || 3),
)
const focusFontSize = computed(() => Number(effectiveSetting('focus_font_size', 18)))
const pagePileOn = computed(() => {
	const stage = chapter.value?.writing_stage
	return Boolean(state.prefs.page_pile) && PAGE_PILE_STAGES.includes(stage)
})
const pageWords = computed(() => Number(state.settings.page_words) || 280)
/** Forward peek only when a newer sheet already exists (e.g. after going back). */
const showNextPagePeek = computed(
	() => pagePileOn.value && pageIndex.value < pages.value.length - 1,
)
const requiredBreathsDone = computed(() => breathsCompleted.value >= requiredBreaths.value)
const fadeDuration = computed(() => Math.max(0.5, Number(effectiveSetting('fade_duration_secs', 2))))
const bubbleChars = computed(() => Math.max(4, Number(state.settings.bubble_label_chars) || 12))

const steps = [
	{ title: 'Clear the runway', help: 'Remove distraction triggers — and revisit last focus if any.' },
	{ title: 'Body reset', help: 'Small rituals that help your nervous system settle.' },
	{ title: 'Set the aim', help: 'More, similar, or less than last time — no numbers.' },
	{ title: 'Arrive', help: 'A quiet breath — then write.' },
]
const currentStep = computed(() => steps[step.value])
const aimOptions = [
	{ id: 'more', label: 'More than last time' },
	{ id: 'similar', label: 'Similar to last time' },
	{ id: 'less', label: 'Less than last time' },
]

const wordGoal = computed(() => {
	const last = lastSessionWords.value || 300
	const bias = state.prefs.aim_bias
	const choice = aimChoice.value || (bias === 'increase' ? 'more' : bias === 'decrease' ? 'less' : 'similar')
	if (choice === 'more') return Math.round(last * 1.15)
	if (choice === 'less') return Math.round(last * 0.85)
	return Math.round(last)
})

const sessionBody = computed(() => pages.value.join('\n\n'))
const activePageText = computed({
	get: () => pages.value[pageIndex.value] || '',
	set: (v) => {
		pages.value[pageIndex.value] = v
	},
})

const startingWords = ref(0)
const sessionWords = computed(() =>
	Math.max(0, countWords(sessionBody.value) - startingWords.value),
)
const progressRatio = computed(() => {
	const g = wordGoal.value || 0
	if (!g) return 0
	return Math.min(1, sessionWords.value / g)
})
const progressBarStyle = computed(() => {
	const r = progressRatio.value
	return { width: `${r * 100}%`, opacity: r === 0 ? 0 : Math.max(0.15, r) }
})

const breathCircleStyle = computed(() => {
	const dur =
		breathPhase.value === 'prepare'
			? prepareSeconds.value
			: breathPhase.value === 'inhale'
				? inhaleSeconds.value
				: breathPhase.value === 'hold_in'
					? holdInSeconds.value
					: breathPhase.value === 'exhale'
						? exhaleSeconds.value
						: holdOutSeconds.value
	const softOpacity =
		breathPhase.value === 'hold_in' || breathPhase.value === 'hold_out'
			? 0.55
			: breathPhase.value === 'prepare'
				? 0.75
				: breathOpacity.value
	return {
		transform: `scale(${breathScale.value})`,
		opacity: softOpacity,
		transition: `transform ${Math.max(dur, 0.25)}s ease-in-out, opacity ${Math.max(dur, 0.25)}s ease-in-out`,
	}
})

const visibleNotes = computed(() => notes.filter((n) => n.state !== 'bubble'))
const bubbledNotes = computed(() => notes.filter((n) => n.state === 'bubble'))
const draftRows = computed(() => Math.min(8, Math.max(3, draftNote.value.split('\n').length)))
const showDraftComposer = computed(
	() =>
		phase.value === 'focus' &&
		(captureZoneActive.value || draftPinned.value || !!draftNote.value.trim()),
)
const draftComposerStyle = computed(() => {
	const w = 208
	const h = 40 + draftRows.value * 16
	const x = clamp(draftX.value, 12, (typeof window !== 'undefined' ? window.innerWidth : 800) - w - 12)
	const y = clamp(draftY.value, 12, (typeof window !== 'undefined' ? window.innerHeight : 600) - h - 12)
	return { left: `${x}px`, top: `${y}px` }
})
const skippedRitual = ref(false)
const capturedSideIdeas = computed(() => notes.some((n) => (n.text || '').trim().length > 0))
const sessionElapsedMins = computed(() => {
	if (!sessionStartedOn.value) return 0
	return Math.max(0, dayjs().diff(dayjs(sessionStartedOn.value), 'minute', true))
})

/** Steps shown depend on words written and what happened in focus. */
const activeCompleteSteps = computed(() => {
	const words = sessionWords.value
	const steps = []
	if (words >= 1) {
		steps.push({
			id: 'feel',
			title: 'How did it feel?',
			help: 'One tap — no overthinking.',
		})
	}
	// Aim only after enough writing to judge the goal
	if (words >= 20) {
		steps.push({
			id: 'aim',
			title: 'Aim for next time',
			help: 'Increase, keep, or decrease how ambitious the word aim feels.',
		})
	}
	if (words >= 1 || capturedSideIdeas.value) {
		steps.push({
			id: 'distraction',
			title: capturedSideIdeas.value ? 'Distraction & fades' : 'Distraction',
			help: capturedSideIdeas.value
				? 'Tell us how pulled away you felt — then nudge fade timing.'
				: 'Tell us how pulled away you felt.',
		})
	}
	if (words >= 1) {
		steps.push({
			id: 'next_topic',
			title: 'Next topic',
			help: 'What should you focus on when you start next time?',
		})
		steps.push({
			id: 'plan',
			title: 'Plan sessions',
			help: 'Move suggested tiles onto days; booked sessions stay visible for context.',
		})
	}
	// Ritual length only if they actually went through Arrive
	if (!skippedRitual.value && words >= 1 && sessionElapsedMins.value >= 2) {
		steps.push({
			id: 'start_long',
			title: 'Was the start too long?',
			help: 'Optional — helps us soften the ritual if it felt heavy.',
		})
	}
	return steps
})
const currentCompleteStep = computed(
	() => activeCompleteSteps.value[completeStep.value] || null,
)

const planSlotValues = computed(() => [...scheduleSlots])
const planBookedSessions = computed(() =>
	(scheduledChapters.value || []).map((c) => ({
		name: c.name,
		title: c.title,
		next_write_on: c.next_write_on,
	})),
)

function onPlanSlotsUpdate(next) {
	;(next || []).forEach((value, i) => {
		scheduleSlots[i] = value || ''
	})
}

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

function stopBreath() {
	clearTimeout(breathTimer)
	clearInterval(countdownTimer)
	breathTimer = null
	countdownTimer = null
}

/** Base gap + per-session jitter (fixed for this session, ≠ last session). */
const sessionGapJitter = ref(0)
const phaseGapSeconds = computed(() =>
	Math.max(0.15, (Number(state.settings.breath_phase_gap_seconds) || 0.8) + sessionGapJitter.value),
)

function pickBreathGapJitter() {
	const last = Number(state.prefs.last_breath_gap_jitter)
	const lastOk = Number.isFinite(last)
	let jitter = 0
	for (let i = 0; i < 8; i += 1) {
		// ±0.35s around the site default — enough to feel organic
		jitter = Math.round((Math.random() * 0.7 - 0.35) * 100) / 100
		if (!lastOk || Math.abs(jitter - last) >= 0.08) break
	}
	sessionGapJitter.value = jitter
	savePrefs({ last_breath_gap_jitter: jitter }).catch(() => {})
}

function runCountdown(seconds, onDone) {
	phaseCountdown.value = seconds
	clearInterval(countdownTimer)
	countdownTimer = setInterval(() => {
		phaseCountdown.value -= 1
		if (phaseCountdown.value <= 0) {
			clearInterval(countdownTimer)
			onDone()
		}
	}, 1000)
}

/** Soft pause after inhale/exhale before hold countdown starts. */
function afterPhaseGap(next) {
	const gap = phaseGapSeconds.value
	if (!gap) {
		next()
		return
	}
	// Keep the circle still; hide the ticking number during the gap
	phaseCountdown.value = ''
	clearTimeout(breathTimer)
	breathTimer = setTimeout(next, gap * 1000)
}

function startBreathCycle() {
	stopBreath()
	pickBreathGapJitter()
	breathsCompleted.value = 0
	breathPhase.value = 'prepare'
	breathScale.value = 1
	breathOpacity.value = 1
	runCountdown(prepareSeconds.value, () => runPhase('inhale'))
}

function runPhase(name) {
	breathPhase.value = name
	if (name === 'inhale') {
		breathScale.value = 1.2
		breathOpacity.value = 1
		runCountdown(inhaleSeconds.value, () => afterPhaseGap(() => runPhase('hold_in')))
	} else if (name === 'hold_in') {
		breathScale.value = 1.2
		breathOpacity.value = 0.45
		const s = Math.max(holdInSeconds.value, 0)
		if (!s) return afterPhaseGap(() => runPhase('exhale'))
		runCountdown(s, () => afterPhaseGap(() => runPhase('exhale')))
	} else if (name === 'exhale') {
		breathScale.value = 1
		breathOpacity.value = 1
		runCountdown(exhaleSeconds.value, () => afterPhaseGap(() => runPhase('hold_out')))
	} else {
		breathScale.value = 1
		breathOpacity.value = 0.5
		const s = Math.max(holdOutSeconds.value, 0)
		const done = () => {
			breathsCompleted.value += 1
			afterPhaseGap(() => runPhase('inhale'))
		}
		if (!s) return done()
		runCountdown(s, done)
	}
}

watch(step, (s) => {
	stopBreath()
	if (s === 3) startBreathCycle()
})

function next() {
	if (step.value === 2 && !aimChoice.value) return
	if (step.value < steps.length - 1) step.value += 1
}

function skipRitualToFocus() {
	skippedRitual.value = true
	enterFocus()
}

function enterFocus() {
	stopBreath()
	const plain = String(chapter.value?.content || '')
		.replace(/<[^>]+>/g, '\n')
		.replace(/\n+/g, '\n')
		.trim()
	if (pagePileOn.value) {
		pages.value = splitPages(plain)
	} else {
		pages.value = [plain]
	}
	pageIndex.value = Math.max(0, pages.value.length - 1)
	startingWords.value = countWords(plain)
	sessionStartedOn.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
	phase.value = 'focus'
	completeOpen.value = false
	nextTick(() => focusInput.value?.focus())
}

function splitPages(text) {
	const words = text.split(/\s+/).filter(Boolean)
	if (!words.length) return ['']
	const size = pageWords.value
	const out = []
	for (let i = 0; i < words.length; i += size) {
		out.push(words.slice(i, i + size).join(' '))
	}
	return out.length ? out : ['']
}

function peekText(text) {
	const t = String(text || '').replace(/\s+/g, ' ').trim()
	if (!t) return ''
	return t.length > 160 ? `${t.slice(0, 157)}…` : t
}

function goPrevPage() {
	if (pageIndex.value > 0) pageIndex.value -= 1
	nextTick(() => focusInput.value?.focus())
}

function goNextPage() {
	if (pageIndex.value < pages.value.length - 1) pageIndex.value += 1
	nextTick(() => focusInput.value?.focus())
}

function onFocusInput() {
	if (!pagePileOn.value) return
	// Only open a new sheet after the current (latest) page is filled —
	// writers finish the page before another appears.
	const w = countWords(activePageText.value)
	if (w > pageWords.value * 1.15 && pageIndex.value === pages.value.length - 1) {
		pages.value.push('')
		pageIndex.value = pages.value.length - 1
	}
}

function placeDraftAtPointer(clientX, clientY) {
	pointerX.value = clientX
	pointerY.value = clientY
	if (!draftPinned.value && !draftNote.value) {
		draftX.value = clientX + 8
		draftY.value = clientY + 8
	}
}

function onFocusPointer(e) {
	if (draftPinned.value || draftNote.value) return
	// Right-side band (~last 200px) also updates position while moving toward capture
	const fromRight = (typeof window !== 'undefined' ? window.innerWidth : 0) - e.clientX
	if (fromRight < 220 || captureZoneActive.value) {
		placeDraftAtPointer(e.clientX, e.clientY)
	}
}

function onDraftPointer(e) {
	if (draftPinned.value || draftNote.value) return
	placeDraftAtPointer(e.clientX, e.clientY)
}

function onCaptureEnter(e) {
	captureZoneActive.value = true
	placeDraftAtPointer(e.clientX, e.clientY)
	nextTick(() => draftInput.value?.focus())
}

function onCaptureLeave() {
	// Delay so the pointer can enter the floating draft without dismissing it
	setTimeout(() => {
		if (draftNote.value.trim() || draftPinned.value) return
		if (document.activeElement === draftInput.value) return
		captureZoneActive.value = false
		notes.forEach((n) => {
			n.focused = false
			if (n.text.trim() && n.state === 'solid') scheduleNoteFade(n)
		})
	}, 160)
}

function onDraftComposerLeave() {
	if (draftNote.value.trim()) return
	if (document.activeElement === draftInput.value) return
	draftPinned.value = false
	captureZoneActive.value = false
}

function openComplete() {
	// Nothing written → skip the wizard entirely
	if (sessionWords.value <= 0 && !capturedSideIdeas.value) {
		finishSession({ quiet: true })
		return
	}
	feedback.felt_productive = ''
	feedback.aim_adjust = ''
	feedback.distraction_level = ''
	feedback.fade_adjust = ''
	feedback.start_felt_long = ''
	if (focusNoteAction.value === 'edited' && priorFocusNoteDraft.value) {
		feedback.next_focus_note = priorFocusNoteDraft.value
	} else if (priorFocusNote.value && !feedback.next_focus_note) {
		feedback.next_focus_note = priorFocusNote.value
	}
	const slot = (days) =>
		dayjs().add(days, 'day').hour(9).minute(0).second(0).format('YYYY-MM-DDTHH:mm')
	scheduleSlots[0] = slot(1)
	scheduleSlots[1] = slot(3)
	scheduleSlots[2] = slot(5)

	const steps = activeCompleteSteps.value
	if (!steps.length) {
		finishSession({ quiet: true })
		return
	}
	completeStep.value = 0
	completeOpen.value = true
}

function onDistraction(id) {
	feedback.distraction_level = id
	if (!capturedSideIdeas.value) {
		feedback.fade_adjust = 'keep'
		advanceComplete()
		return
	}
	if (id === 'quite') feedback.fade_adjust = 'increase'
	else if (id === 'focused') feedback.fade_adjust = 'decrease'
	else feedback.fade_adjust = 'keep'
	// Two choices on this step: wait until fade_adjust is also confirmed via its tiles
}

function selectComplete(field, value) {
	feedback[field] = value
	if (currentCompleteStep.value?.id === 'distraction' && capturedSideIdeas.value) {
		if (feedback.distraction_level && feedback.fade_adjust) advanceComplete()
		return
	}
	advanceComplete()
}

function skipPlanAndAdvance() {
	scheduleSlots[0] = ''
	scheduleSlots[1] = ''
	scheduleSlots[2] = ''
	advanceComplete()
}

function advanceComplete() {
	if (completeStep.value < activeCompleteSteps.value.length - 1) {
		completeStep.value += 1
		return
	}
	finishSession()
}

function backComplete() {
	if (completeStep.value <= 0) return
	const previous = activeCompleteSteps.value[completeStep.value - 1]
	completeStep.value -= 1
	// Redo the last entry on the step we return to
	clearCompleteEntry(previous?.id)
}

function clearCompleteEntry(stepId) {
	if (stepId === 'feel') feedback.felt_productive = ''
	if (stepId === 'aim') feedback.aim_adjust = ''
	if (stepId === 'distraction') {
		feedback.distraction_level = ''
		feedback.fade_adjust = ''
	}
	if (stepId === 'start_long') feedback.start_felt_long = ''
}

function stepIncluded(id) {
	return activeCompleteSteps.value.some((s) => s.id === id)
}

async function finishSession({ quiet = false } = {}) {
	completeOpen.value = false
	const includeFeel = stepIncluded('feel')
	const includeAim = stepIncluded('aim')
	const includeDistraction = stepIncluded('distraction')
	const includeTopic = stepIncluded('next_topic')
	const includePlan = stepIncluded('plan')
	const includeStartLong = stepIncluded('start_long')
	try {
		await completeWritingSession({
			name: chapter.value.name,
			words_written: sessionWords.value,
			word_goal: wordGoal.value,
			started_on: sessionStartedOn.value,
			aim_choice: aimChoice.value,
			felt_productive: includeFeel ? feedback.felt_productive : '',
			aim_adjust: includeAim ? feedback.aim_adjust : '',
			distraction_level: includeDistraction ? feedback.distraction_level : '',
			fade_adjust:
				includeDistraction && capturedSideIdeas.value ? feedback.fade_adjust : '',
			start_felt_long: includeStartLong ? feedback.start_felt_long : 'skip',
			// Preserve prior note when the Next-topic step was skipped
			next_focus_note: includeTopic
				? feedback.next_focus_note
				: state.prefs.last_next_focus_note || '',
			prior_focus_note_action: priorFocusNote.value ? focusNoteAction.value : '',
			was_scheduled: chapter.value.next_write_on ? 1 : 0,
			schedule_slots: JSON.stringify(
				includePlan
					? scheduleSlots.filter(Boolean).map((s) => dayjs(s).format('YYYY-MM-DD HH:mm:ss'))
					: [],
			),
			content: `<p>${String(sessionBody.value || '')
				.split(/\n+/)
				.map((p) =>
					p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
				)
				.join('</p><p>')}</p>`,
		})
	} catch (e) {
		toast.error(errorMessage(e, 'Could not save session'))
		return
	}
	router.replace(chapter.value ? `/ideas/${chapter.value.name}` : '/ideas')
}

function tintFor(id) {
	let h = 0
	for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * 17) % 360
	return `hsla(${h}, 28%, 94%, 1)`
}

function noteStyle(note) {
	const fading = note.state === 'fading' || note.state === 'ghost'
	return {
		borderColor: '#ddd8d0',
		background: note.tint,
		opacity: fading ? 0.22 : 1,
		'--fade-ms': `${fadeDuration.value * 1000}ms`,
	}
}
function bubbleStyle(note) {
	return { background: note.tint, borderColor: '#ddd8d0' }
}
function noteRows(note) {
	return Math.min(10, Math.max(3, (note.text || '').split('\n').length + 1))
}
function bubbleLabel(note) {
	const t = (note.text || '').replace(/\s+/g, ' ').trim()
	const n = bubbleChars.value
	return t.length <= n ? t || 'Idea' : `${t.slice(0, n - 3)}…`
}

function clamp(n, min, max) {
	return Math.min(max, Math.max(min, n))
}
function idleSecsForWords(words) {
	const min = Number(state.settings.fade_idle_min_secs) || 2
	const max = Number(state.settings.fade_idle_max_secs) || 8
	const base = Number(effectiveSetting('fade_idle_secs', 3)) || 3
	const scaled = base + (words / 40) * (max - min)
	return clamp(scaled, min, max)
}
function withFadeDrag(value, min, max, strength = 1) {
	const drag = clamp(Number(effectiveSetting('fade_drag', 0.25)) || 0, 0, 1)
	if (!drag) return clamp(value, min, max)
	return clamp(value + value * drag * strength * (Math.random() * 2 - 1), min, max)
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
	const min = Number(state.settings.fade_idle_min_secs) || 2
	const max = Number(state.settings.fade_idle_max_secs) || 8
	const idle = withFadeDrag(idleSecsForWords(countWords(note.text)), min, max, 1) * 1000
	const fade = withFadeDrag(fadeDuration.value, 0.4, fadeDuration.value * 1.5, 0.5) * 1000
	noteTimers[note.localId] = {
		idle: setTimeout(() => {
			note.state = 'fading'
			noteTimers[note.localId] = {
				fade: setTimeout(() => {
					note.state = 'ghost'
					setTimeout(() => {
						if (note.state === 'ghost' && !note.focused) note.state = 'bubble'
					}, 400)
				}, fade),
			}
		}, idle),
	}
}
function reviveNote(note) {
	note.focused = true
	note.state = 'solid'
	clearNoteTimer(note)
	if ((note.text || '').split('\n').length >= 3 || countWords(note.text) > 40) {
		captureDialog.value = note
	}
}
function onNoteInput(note) {
	note.state = 'solid'
	clearNoteTimer(note)
	clearTimeout(note.saveTimer)
	note.saveTimer = setTimeout(async () => {
		const text = note.text.trim()
		if (countWords(text) < 2) return
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
	if (note.text.split('\n').length >= 3) captureDialog.value = note
}
function onDraftInput() {
	draftPinned.value = true
	clearTimeout(draftTimer)
	draftTimer = setTimeout(async () => {
		const text = draftNote.value.trim()
		if (countWords(text) < 2) return
		const localId = `n-${Date.now()}`
		const note = reactive({
			localId,
			text,
			chapterName: null,
			state: 'solid',
			focused: false,
			tint: tintFor(localId),
			saveTimer: null,
		})
		notes.push(note)
		draftNote.value = ''
		draftPinned.value = false
		captureZoneActive.value = false
		try {
			const saved = await captureSideIdea({ parent: chapter.value.name, text })
			note.chapterName = saved.name
		} catch (e) {
			toast.error(errorMessage(e, 'Could not save side idea'))
		}
		scheduleNoteFade(note)
		let seen = Number(localStorage.getItem(HINT_KEY) || 0) + 1
		localStorage.setItem(HINT_KEY, String(seen))
		if (seen >= 5) showCaptureHint.value = false
	}, 1500)
}
function restoreBubble(note) {
	note.state = 'solid'
	note.focused = true
	captureZoneActive.value = true
}
function onCaptureDialogInput() {
	if (captureDialog.value) onNoteInput(captureDialog.value)
}
function closeCaptureDialog() {
	if (captureDialog.value) {
		captureDialog.value.focused = false
		scheduleNoteFade(captureDialog.value)
	}
	captureDialog.value = null
}

function leave() {
	router.push(chapter.value ? `/ideas/${chapter.value.name}` : '/growth')
}
function onKeydown(e) {
	if (phase.value === 'focus' && e.key === 'Escape') {
		e.preventDefault()
		openComplete()
	}
}

onMounted(async () => {
	window.addEventListener('keydown', onKeydown)
	await bootstrap()
	if (!chapter.value) {
		toast.error('Idea not found')
		router.replace('/ideas')
		return
	}
	loadChecklists()
	priorFocusNote.value = state.prefs.last_next_focus_note || ''
	priorFocusNoteDraft.value = priorFocusNote.value
	const bias = state.prefs.aim_bias
	aimChoice.value = bias === 'increase' ? 'more' : bias === 'decrease' ? 'less' : 'similar'
	showCaptureHint.value = Number(localStorage.getItem(HINT_KEY) || 0) < 5
	phase.value = 'ritual'
})

onBeforeUnmount(() => {
	window.removeEventListener('keydown', onKeydown)
	stopBreath()
	clearTimeout(draftTimer)
	Object.values(noteTimers).forEach((t) => {
		if (t?.idle) clearTimeout(t.idle)
		if (t?.fade) clearTimeout(t.fade)
	})
})
</script>
