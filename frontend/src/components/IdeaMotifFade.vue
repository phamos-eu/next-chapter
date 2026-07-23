<template>
  <div
    v-if="enabled && seed"
    class="pointer-events-none absolute inset-y-0 right-0 overflow-hidden rounded-[inherit]"
    :style="shellStyle"
    aria-hidden="true"
  >
    <div class="absolute inset-0" :style="washStyle" />
    <svg class="absolute inset-0 h-full w-full" :style="patternStyle" preserveAspectRatio="none">
      <defs>
        <pattern
          :id="patternId"
          :width="tile"
          :height="tile"
          patternUnits="userSpaceOnUse"
          :patternTransform="`rotate(${rotate})`"
        >
          <circle
            v-for="(dot, i) in dots"
            :key="i"
            :cx="dot.cx"
            :cy="dot.cy"
            :r="dot.r"
            :fill="color"
            :opacity="dot.opacity"
          />
          <path
            v-if="showLines"
            :d="linePath"
            fill="none"
            :stroke="color"
            stroke-width="0.6"
            :opacity="lineOpacity"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" :fill="`url(#${patternId})`" />
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
	seed: { type: String, default: '' },
	/** card = list tiles; surface = overview / focus (lighter) */
	intensity: { type: String, default: 'card' },
	enabled: { type: Boolean, default: true },
})

function hashSeed(input) {
	let h = 2166136261
	const s = String(input || 'idea')
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i)
		h = Math.imul(h, 16777619)
	}
	return h >>> 0
}

function mulberry32(a) {
	return function next() {
		let t = (a += 0x6d2b79f5)
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

const motif = computed(() => {
	const rand = mulberry32(hashSeed(props.seed))
	const hue = Math.floor(rand() * 360)
	const sat = 28 + Math.floor(rand() * 28)
	const light = 62 + Math.floor(rand() * 16)
	const color = `hsl(${hue} ${sat}% ${light}%)`
	const tile = 18 + Math.floor(rand() * 14)
	const rotate = Math.floor(rand() * 60) - 30
	const showLines = rand() > 0.35
	const dots = Array.from({ length: 5 + Math.floor(rand() * 4) }, () => ({
		cx: rand() * tile,
		cy: rand() * tile,
		r: 0.6 + rand() * 1.8,
		opacity: 0.12 + rand() * 0.22,
	}))
	const linePath = `M 0 ${tile * 0.35} Q ${tile * 0.5} ${tile * (0.1 + rand() * 0.8)} ${tile} ${tile * 0.55}`
	return { color, tile, rotate, showLines, dots, linePath, hue }
})

const patternId = computed(
	() => `motif-${hashSeed(props.seed).toString(36)}-${props.intensity}`,
)

const isSurface = computed(() => props.intensity === 'surface')

const shellStyle = computed(() => ({
	width: '40%',
}))

const washStyle = computed(() => {
	const { hue, sat, light } = motif.value
	const alpha = isSurface.value ? 0.1 : 0.22
	const edge = isSurface.value ? 0.04 : 0.1
	return {
		background: `linear-gradient(to left, hsl(${hue} ${sat}% ${light}% / ${alpha}) 0%, hsl(${hue} ${sat}% ${light}% / ${edge}) 55%, transparent 100%)`,
	}
})

const patternStyle = computed(() => ({
	opacity: isSurface.value ? 0.28 : 0.55,
	maskImage: 'linear-gradient(to left, black 0%, transparent 100%)',
	WebkitMaskImage: 'linear-gradient(to left, black 0%, transparent 100%)',
}))

const color = computed(() => motif.value.color)
const tile = computed(() => motif.value.tile)
const rotate = computed(() => motif.value.rotate)
const showLines = computed(() => motif.value.showLines)
const dots = computed(() => motif.value.dots)
const linePath = computed(() => motif.value.linePath)
const lineOpacity = computed(() => (isSurface.value ? 0.18 : 0.28))
</script>
