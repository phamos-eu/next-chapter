<template>
  <AppShell>
    <div class="flex min-h-0 flex-1 overflow-hidden">
      <section class="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div class="border-b border-outline-gray-1 px-5 pt-3">
          <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
            <button
              class="inline-flex items-center gap-1 text-xs text-ink-gray-5 hover:text-ink-gray-8"
              @click="router.push('/mock/growth')"
            >
              <FeatherIcon name="arrow-left" class="h-3.5 w-3.5" />
              Growth funnel
            </button>
            <div class="flex flex-wrap items-center gap-1">
              <span class="mr-1 text-[11px] uppercase tracking-wide text-ink-gray-4">Stage</span>
              <button
                v-for="s in WRITE_STAGES"
                :key="s.id"
                type="button"
                class="rounded px-2 py-0.5 text-xs"
                :class="
                  stage.id === s.id
                    ? 'bg-ink-gray-9 text-surface-white'
                    : 'bg-surface-gray-2 text-ink-gray-6 hover:bg-surface-gray-3'
                "
                @click="switchStage(s.id)"
              >
                {{ s.label }}
              </button>
            </div>
          </div>

          <TextInput
            v-model="title"
            class="!border-0 !bg-transparent !px-0 text-xl font-semibold"
            placeholder="Give this idea a short name"
          />

          <p class="mt-1 mb-3 text-sm text-ink-gray-5">
            <span class="font-medium text-ink-gray-7">{{ stage.metaphor }}</span>
            — {{ stage.job }}
          </p>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-5">
          <!-- Plain text for ∞ and 9 -->
          <template v-if="caps.plainTextOnly">
            <p class="mb-3 text-sm text-ink-gray-5">
              {{
                stage.id === 'infinity'
                  ? 'Just a text field — capture the thought. Formatting arrives as this idea matures.'
                  : 'Still plain text, with a soft word hint so you stay light.'
              }}
            </p>
            <Textarea
              v-model="body"
              :rows="16"
              placeholder="Write freely…"
              @update:model-value="onBodyInput"
            />
            <p v-if="caps.wordHint" class="mt-2 text-xs text-ink-gray-4">
              {{ wordCount }} words
            </p>
          </template>

          <!-- Rich editor from 7+ -->
          <template v-else>
            <div
              class="mb-3 flex flex-wrap gap-2 rounded-lg border border-outline-gray-1 bg-surface-gray-1 px-3 py-2"
            >
              <span class="w-full text-[11px] uppercase tracking-wide text-ink-gray-4">
                Editor features unlocked
              </span>
              <span
                v-for="chip in featureChips"
                :key="chip"
                class="rounded bg-surface-white px-2 py-0.5 text-xs text-ink-gray-7 shadow-sm"
              >
                {{ chip }}
              </span>
            </div>

            <!-- Mock toolbar reflecting unlocked features -->
            <div
              class="flex flex-wrap gap-1 rounded-t-lg border border-outline-gray-2 bg-surface-gray-1 px-2 py-1.5"
            >
              <button
                v-if="caps.boldItalic"
                type="button"
                class="rounded px-2 py-1 text-xs font-bold text-ink-gray-7 hover:bg-surface-white"
                title="Bold"
              >
                B
              </button>
              <button
                v-if="caps.boldItalic"
                type="button"
                class="rounded px-2 py-1 text-xs italic text-ink-gray-7 hover:bg-surface-white"
                title="Italic"
              >
                I
              </button>
              <span v-if="caps.headingsLists" class="mx-1 w-px self-stretch bg-outline-gray-2" />
              <button
                v-if="caps.headingsLists"
                type="button"
                class="rounded px-2 py-1 text-xs text-ink-gray-7 hover:bg-surface-white"
              >
                H2
              </button>
              <button
                v-if="caps.headingsLists"
                type="button"
                class="rounded px-2 py-1 text-xs text-ink-gray-7 hover:bg-surface-white"
              >
                List
              </button>
              <span v-if="caps.tablesLinks" class="mx-1 w-px self-stretch bg-outline-gray-2" />
              <button
                v-if="caps.tablesLinks"
                type="button"
                class="rounded px-2 py-1 text-xs text-ink-gray-7 hover:bg-surface-white"
              >
                Link
              </button>
              <button
                v-if="caps.tablesLinks"
                type="button"
                class="rounded px-2 py-1 text-xs text-ink-gray-7 hover:bg-surface-white"
              >
                Table
              </button>
            </div>

            <Textarea
              v-model="body"
              :rows="14"
              class="!rounded-t-none"
              placeholder="Shape the chapter…"
              @update:model-value="onBodyInput"
            />
            <p v-if="caps.wordHint" class="mt-2 text-xs text-ink-gray-4">
              {{ wordCount }} words · mock editor (toolbar reflects stage unlocks)
            </p>
          </template>
        </div>
      </section>

      <aside class="flex w-72 shrink-0 flex-col border-l border-outline-gray-1 bg-surface-gray-1">
        <div class="border-b border-outline-gray-1 px-4 py-3">
          <div class="font-medium text-ink-gray-9">Details</div>
          <div class="text-xs text-ink-gray-5">Mock · stage {{ stage.label }}</div>
        </div>
        <div class="space-y-4 overflow-y-auto p-4">
          <div class="rounded-lg border border-outline-gray-1 bg-surface-white p-3">
            <div class="text-sm font-medium">Growth stage</div>
            <p class="mt-1 text-xs text-ink-gray-5">
              WIP {{ stage.wip == null ? 'unlimited' : stage.wip }} · {{ stage.metaphor }}
            </p>
          </div>

          <Button
            v-if="caps.startSession"
            class="w-full"
            variant="solid"
            label="Start writing session"
            @click="startSession"
          />
          <p v-else class="text-xs text-ink-gray-5">
            Writing sessions unlock at stage 5, when the idea is structured enough to sit with.
          </p>

          <div
            v-if="caps.complexityTools"
            class="space-y-3 rounded-lg border border-outline-gray-1 bg-surface-white p-3"
          >
            <div class="text-sm font-medium">Complexity tools</div>
            <div>
              <div class="text-xs font-medium text-ink-gray-6">Outline</div>
              <ul class="mt-1 list-disc space-y-0.5 pl-4 text-xs text-ink-gray-5">
                <li>Discovery</li>
                <li>Milestones</li>
                <li>Handoff</li>
              </ul>
            </div>
            <div>
              <div class="text-xs font-medium text-ink-gray-6">Related chapters</div>
              <p class="mt-1 text-xs text-ink-gray-5">Customer health score · CRM pipeline hygiene</p>
            </div>
            <div>
              <div class="text-xs font-medium text-ink-gray-6">Session history</div>
              <p class="mt-1 text-xs text-ink-gray-5">Last: 420 words · 55 min</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </AppShell>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, FeatherIcon, TextInput, Textarea } from 'frappe-ui'
import AppShell from '@/components/AppShell.vue'
import {
	MOCK_CHAPTERS,
	WRITE_STAGES,
	capabilitiesFor,
	stageByParam,
} from './mockStages'

const router = useRouter()
const route = useRoute()

const stage = computed(() => stageByParam(route.params.stage))
const caps = computed(() => capabilitiesFor(stage.value.id))

const title = ref('Implementation playbook')
const body = ref('')

const wordCount = computed(() => {
	const t = body.value.trim()
	if (!t) return 0
	return t.split(/\s+/).length
})

const featureChips = computed(() => {
	const c = caps.value
	const chips = []
	if (c.boldItalic) chips.push('Bold / italic')
	if (c.headingsLists) chips.push('Headings & lists')
	if (c.tablesLinks) chips.push('Tables & links')
	if (c.startSession) chips.push('Writing sessions')
	if (c.complexityTools) chips.push('Outline & history')
	return chips
})

watch(
	() => [route.params.stage, route.query.chapter],
	() => {
		const ch = MOCK_CHAPTERS.find((c) => c.name === route.query.chapter)
		if (ch) {
			title.value = ch.title
			body.value = ch.content
				? ch.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
				: ch.snippet || ''
		} else {
			title.value =
				stage.value.id === '1' ? 'Implementation playbook' : `Sample idea (${stage.value.label})`
			body.value =
				stage.value.id === 'infinity'
					? ''
					: 'A few sentences about what should happen, and why it matters for the story.'
		}
	},
	{ immediate: true },
)

function onBodyInput() {
	/* local mock only */
}

function switchStage(id) {
	router.replace({
		name: 'MockWrite',
		params: { stage: id },
		query: route.query.chapter ? { chapter: route.query.chapter } : {},
	})
}

function startSession() {
	router.push({
		name: 'MockSession',
		query: {
			title: title.value,
			stage: stage.value.id,
		},
	})
}
</script>
