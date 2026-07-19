<template>
  <AppShell>
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header class="border-b border-outline-gray-1 px-5 pt-3">
        <h1 class="text-xl font-semibold text-ink-gray-9">Schedule</h1>
        <p class="mb-2 text-sm text-ink-gray-5">
          Upcoming writing sessions across your ideas.
        </p>
        <TabButtons v-model="horizon" :buttons="horizons" />
      </header>

      <div class="min-h-0 flex-1 overflow-auto p-4">
        <div
          v-if="!scheduledChapters.length"
          class="flex h-full items-center justify-center text-ink-gray-5"
        >
          No writing sessions scheduled yet. Set a time from an idea.
        </div>

        <div v-else-if="horizon === 'list'" class="space-y-2">
          <button
            v-for="chapter in scheduledChapters"
            :key="chapter.name"
            class="flex w-full items-center gap-3 rounded-lg border border-outline-gray-1 px-3 py-2 text-left hover:bg-surface-gray-1"
            @click="openChapter(chapter)"
          >
            <span class="w-44 shrink-0 text-sm text-ink-gray-5">
              {{ formatDateTime(chapter.next_write_on) }}
            </span>
            <span class="flex-1 text-sm font-medium">{{ chapter.title }}</span>
            <Badge :theme="STAGE_COLORS[chapter.writing_stage] || 'gray'" size="sm">
              {{ chapter.writing_stage }}
            </Badge>
          </button>
        </div>

        <div
          v-else-if="horizon === 'three' || horizon === 'ten'"
          class="grid gap-2"
          :class="horizon === 'three' ? 'grid-cols-3' : 'grid-flow-col auto-cols-[10rem] overflow-x-auto'"
        >
          <div
            v-for="day in dayColumns"
            :key="day.key"
            class="min-h-[14rem] rounded-lg border border-outline-gray-1 bg-surface-gray-1"
          >
            <div class="border-b border-outline-gray-1 bg-surface-white px-2 py-2 text-xs font-semibold">
              {{ day.label }}
            </div>
            <div class="space-y-2 p-2">
              <button
                v-for="chapter in day.items"
                :key="chapter.name"
                class="block w-full rounded-md border border-outline-gray-1 bg-surface-white p-2 text-left text-xs hover:bg-surface-gray-2"
                @click="openChapter(chapter)"
              >
                <div class="font-semibold">{{ formatTime(chapter.next_write_on) }}</div>
                <div>{{ chapter.title }}</div>
              </button>
              <div v-if="!day.items.length" class="px-1 text-xs text-ink-gray-4">—</div>
            </div>
          </div>
        </div>

        <div v-else-if="horizon === 'month'">
          <div class="mb-3 font-semibold">{{ monthTitle }}</div>
          <div class="grid grid-cols-7 gap-1">
            <div
              v-for="cell in monthCells"
              :key="cell.key"
              class="min-h-[5.5rem] rounded border border-outline-gray-1 p-1"
              :class="cell.inMonth ? 'bg-surface-white' : 'bg-surface-gray-1 opacity-50'"
            >
              <div class="text-[11px] font-semibold">{{ cell.day }}</div>
              <button
                v-for="chapter in cell.items.slice(0, 3)"
                :key="chapter.name"
                class="mt-0.5 block w-full truncate rounded bg-surface-gray-2 px-1 py-0.5 text-left text-[11px]"
                @click="openChapter(chapter)"
              >
                {{ chapter.title }}
              </button>
            </div>
          </div>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="week in weekBlocks"
            :key="week.key"
            class="rounded-lg border border-outline-gray-1 p-3"
          >
            <div class="mb-2 text-sm font-semibold">{{ week.label }}</div>
            <button
              v-for="chapter in week.items"
              :key="chapter.name"
              class="mb-1 flex w-full items-center gap-3 rounded-md border border-outline-gray-1 px-2 py-1.5 text-left text-sm hover:bg-surface-gray-1"
              @click="openChapter(chapter)"
            >
              <span class="w-40 text-ink-gray-5">{{ formatDateTime(chapter.next_write_on) }}</span>
              <span class="font-medium">{{ chapter.title }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <Dialog v-model="dialogOpen" :options="{ title: 'Writing session' }">
      <template #body-content>
        <p class="text-sm font-medium">{{ dialogChapter?.title }}</p>
        <p class="mt-2 text-sm text-ink-gray-5">
          When: {{ formatDateTime(dialogChapter?.next_write_on) }}
        </p>
        <p class="text-sm text-ink-gray-5">Status: {{ dialogChapter?.writing_stage }}</p>
      </template>
      <template #actions>
        <Button
          variant="subtle"
          label="Add to calendar (.ics)"
          @click="downloadIcs(dialogChapter.name)"
        />
        <Button variant="solid" label="Open idea" @click="goWrite" />
      </template>
    </Dialog>
  </AppShell>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Badge, Button, Dialog, TabButtons } from 'frappe-ui'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import AppShell from '@/components/AppShell.vue'
import { STAGE_COLORS, useWorkspace } from '@/composables/useWorkspace'

dayjs.extend(isoWeek)

const router = useRouter()
const { scheduledChapters, downloadIcs, formatDateTime, formatTime } = useWorkspace()

const horizon = ref('ten')
const horizons = [
	{ label: 'List', value: 'list' },
	{ label: 'Next 3 days', value: 'three' },
	{ label: 'Next 10 days', value: 'ten' },
	{ label: 'Month', value: 'month' },
	{ label: '90 days', value: 'ninety' },
]

const dialogOpen = ref(false)
const dialogChapter = ref(null)

const dayColumns = computed(() => {
	const days = horizon.value === 'three' ? 3 : 10
	const start = dayjs().startOf('day')
	return Array.from({ length: days }, (_, i) => {
		const day = start.add(i, 'day')
		const key = day.format('YYYY-MM-DD')
		return {
			key,
			label: day.format('ddd D MMM'),
			items: scheduledChapters.value.filter(
				(c) => dayjs(c.next_write_on).format('YYYY-MM-DD') === key,
			),
		}
	})
})

const monthTitle = computed(() => dayjs().format('MMMM YYYY'))

const monthCells = computed(() => {
	const start = dayjs().startOf('month')
	const cursor = start.startOf('week')
	const last = dayjs().endOf('month').endOf('week')
	const cells = []
	let d = cursor
	while (d.isBefore(last) || d.isSame(last, 'day')) {
		const key = d.format('YYYY-MM-DD')
		cells.push({
			key,
			day: d.date(),
			inMonth: d.month() === start.month(),
			items: scheduledChapters.value.filter(
				(c) => dayjs(c.next_write_on).format('YYYY-MM-DD') === key,
			),
		})
		d = d.add(1, 'day')
	}
	return cells
})

const weekBlocks = computed(() => {
	const end = dayjs().add(90, 'day')
	const upcoming = scheduledChapters.value.filter(
		(c) => dayjs(c.next_write_on).isBefore(end) || dayjs(c.next_write_on).isSame(end, 'day'),
	)
	const map = {}
	upcoming.forEach((c) => {
		const week = dayjs(c.next_write_on).startOf('isoWeek').format('YYYY-MM-DD')
		map[week] = map[week] || []
		map[week].push(c)
	})
	return Object.keys(map)
		.sort()
		.map((key) => ({
			key,
			label: `${dayjs(key).format('D MMM')} – ${dayjs(key).add(6, 'day').format('D MMM')}`,
			items: map[key],
		}))
})

function openChapter(chapter) {
	dialogChapter.value = chapter
	dialogOpen.value = true
}

function goWrite() {
	dialogOpen.value = false
	router.push(`/ideas/${dialogChapter.value.name}`)
}
</script>
