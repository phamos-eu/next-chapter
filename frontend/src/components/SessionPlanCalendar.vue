<template>
  <div class="space-y-2">
    <p class="text-xs text-ink-gray-5">
      Drag suggested sessions onto a day, remove with ×, or add with + on an empty day.
      Booked writing blocks are shown for context.
      <span class="text-ink-gray-4">Other calendar appointments will appear here later.</span>
    </p>

    <div class="grid max-h-[min(50vh,22rem)] grid-flow-col auto-cols-[7.5rem] gap-2 overflow-x-auto pb-1">
      <div
        v-for="day in dayColumns"
        :key="day.key"
        class="group/day flex min-h-[12rem] flex-col rounded-lg border border-[#ddd8d0] bg-[#f3f0eb]/80"
        :class="dragOverDay === day.key ? 'ring-2 ring-ink-gray-4/40' : ''"
        @dragover.prevent="onDragOver(day.key, $event)"
        @dragleave="onDragLeave(day.key)"
        @drop.prevent="onDrop(day.key)"
      >
        <div
          class="border-b border-[#ddd8d0] bg-[#faf8f5] px-2 py-1.5 text-[11px] font-semibold text-ink-gray-7"
        >
          {{ day.label }}
        </div>
        <div class="relative flex flex-1 flex-col gap-1.5 p-1.5">
          <!-- Already booked (read-only) -->
          <div
            v-for="item in day.booked"
            :key="item.key"
            class="rounded-md border border-[#d5d0c8] bg-[#ebe7e1] px-1.5 py-1 text-left text-[10px] leading-snug text-ink-gray-6"
            title="Already booked"
          >
            <div class="font-semibold tabular-nums">{{ item.timeLabel }}</div>
            <div class="truncate">{{ item.title }}</div>
            <div class="text-[9px] uppercase tracking-wide text-ink-gray-4">Booked</div>
          </div>

          <!-- Movable suggested tiles -->
          <div
            v-for="slot in day.drafts"
            :key="slot.index"
            class="group/tile relative cursor-grab rounded-md border border-ink-gray-8/20 bg-[#faf8f5] px-1.5 py-1 text-left text-[10px] leading-snug shadow-sm active:cursor-grabbing"
            draggable="true"
            @dragstart="onDragStart(slot.index, $event)"
            @dragend="onDragEnd"
          >
            <button
              type="button"
              class="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full border border-[#ddd8d0] bg-white text-[10px] leading-none text-ink-gray-6 shadow-sm group-hover/tile:flex hover:border-ink-gray-7 hover:text-ink-gray-9"
              title="Remove suggestion"
              aria-label="Remove suggestion"
              @click.stop="removeSlot(slot.index)"
            >
              ×
            </button>
            <div class="font-semibold text-ink-gray-8">Suggested</div>
            <div class="truncate text-ink-gray-7">{{ draftLabel }}</div>
            <label class="mt-1 flex items-center gap-1 text-ink-gray-6">
              <span class="sr-only">Time</span>
              <input
                type="time"
                class="w-full rounded border border-[#ddd8d0] bg-white px-1 py-0.5 text-[10px] tabular-nums outline-none"
                :value="slot.time"
                @click.stop
                @change="onTimeChange(slot.index, $event)"
              />
            </label>
          </div>

          <!-- Empty day: hover + to add a suggestion -->
          <button
            v-if="!day.drafts.length"
            type="button"
            class="mt-auto flex items-center justify-center rounded-md border border-dashed border-[#ddd8d0] py-2 text-sm text-ink-gray-4 opacity-0 transition group-hover/day:opacity-100 hover:border-ink-gray-6 hover:text-ink-gray-7"
            title="Add suggested session"
            aria-label="Add suggested session"
            @click="addSlot(day.key)"
          >
            +
          </button>
          <div
            v-if="!day.booked.length && !day.drafts.length"
            class="px-0.5 text-[10px] text-ink-gray-4 group-hover/day:hidden"
          >
            Drop here
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
	modelValue: { type: Array, default: () => [] },
	booked: { type: Array, default: () => [] },
	draftLabel: { type: String, default: 'This idea' },
	days: { type: Number, default: 10 },
})

const emit = defineEmits(['update:modelValue'])

const dragIndex = ref(null)
const dragOverDay = ref(null)

const dayColumns = computed(() => {
	const start = dayjs().startOf('day')
	const slots = props.modelValue || []
	return Array.from({ length: props.days }, (_, i) => {
		const day = start.add(i, 'day')
		const key = day.format('YYYY-MM-DD')
		const booked = (props.booked || [])
			.filter((b) => b.next_write_on && dayjs(b.next_write_on).format('YYYY-MM-DD') === key)
			.map((b) => ({
				key: `${b.name || b.title}-${b.next_write_on}`,
				title: b.title || 'Session',
				timeLabel: dayjs(b.next_write_on).format('HH:mm'),
			}))
		const drafts = slots
			.map((value, index) => ({ value, index }))
			.filter(({ value }) => value && dayjs(value).format('YYYY-MM-DD') === key)
			.map(({ value, index }) => ({
				index,
				time: dayjs(value).format('HH:mm'),
			}))
		return {
			key,
			label: day.format('ddd D'),
			booked,
			drafts,
		}
	})
})

function emitSlots(next) {
	emit(
		'update:modelValue',
		(next || []).filter((v) => v),
	)
}

function patchSlot(index, nextLocal) {
	const next = [...(props.modelValue || [])]
	next[index] = nextLocal
	emitSlots(next)
}

function removeSlot(index) {
	const next = [...(props.modelValue || [])]
	next.splice(index, 1)
	emitSlots(next)
}

function addSlot(dayKey) {
	const next = [...(props.modelValue || [])]
	next.push(`${dayKey}T09:00`)
	emitSlots(next)
}

function onDragStart(index, event) {
	dragIndex.value = index
	event.dataTransfer.effectAllowed = 'move'
	event.dataTransfer.setData('text/plain', String(index))
}

function onDragEnd() {
	dragIndex.value = null
	dragOverDay.value = null
}

function onDragOver(dayKey, event) {
	dragOverDay.value = dayKey
	event.dataTransfer.dropEffect = 'move'
}

function onDragLeave(dayKey) {
	if (dragOverDay.value === dayKey) dragOverDay.value = null
}

function onDrop(dayKey) {
	const index = dragIndex.value
	dragOverDay.value = null
	dragIndex.value = null
	if (index == null) return
	const current = props.modelValue?.[index]
	const time = current ? dayjs(current).format('HH:mm') : '09:00'
	patchSlot(index, `${dayKey}T${time}`)
}

function onTimeChange(index, event) {
	const time = event.target.value || '09:00'
	const current = props.modelValue?.[index]
	const day = current
		? dayjs(current).format('YYYY-MM-DD')
		: dayjs().add(1, 'day').format('YYYY-MM-DD')
	patchSlot(index, `${day}T${time}`)
}
</script>
