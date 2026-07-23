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
          <g :fill="color" :stroke="color">
            <template v-for="(shape, i) in shapes" :key="i">
              <circle
                v-if="shape.kind === 'circle'"
                :cx="shape.cx"
                :cy="shape.cy"
                :r="shape.r"
                :opacity="shape.opacity"
                stroke="none"
              />
              <rect
                v-else-if="shape.kind === 'square'"
                :x="shape.x"
                :y="shape.y"
                :width="shape.size"
                :height="shape.size"
                :rx="shape.rx"
                :opacity="shape.opacity"
                stroke="none"
              />
              <polygon
                v-else-if="shape.kind === 'triangle'"
                :points="shape.points"
                :opacity="shape.opacity"
                stroke="none"
              />
              <polygon
                v-else-if="shape.kind === 'diamond'"
                :points="shape.points"
                :opacity="shape.opacity"
                stroke="none"
              />
              <line
                v-else-if="shape.kind === 'dash'"
                :x1="shape.x1"
                :y1="shape.y1"
                :x2="shape.x2"
                :y2="shape.y2"
                :stroke-width="shape.width"
                :opacity="shape.opacity"
                stroke-linecap="round"
                fill="none"
              />
              <path
                v-else-if="shape.kind === 'arc'"
                :d="shape.d"
                fill="none"
                :stroke-width="shape.width"
                :opacity="shape.opacity"
              />
              <path
                v-else-if="shape.kind === 'wave'"
                :d="shape.d"
                fill="none"
                :stroke-width="shape.width"
                :opacity="shape.opacity"
              />
              <polygon
                v-else-if="shape.kind === 'cross'"
                :points="shape.points"
                :opacity="shape.opacity"
                stroke="none"
              />
            </template>
          </g>
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

const KINDS = ['circle', 'square', 'triangle', 'diamond', 'dash', 'arc', 'wave', 'cross']

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

function makeShape(kind, rand, tile) {
	const opacity = (0.14 + rand() * 0.28) * 1.15
	const cx = rand() * tile
	const cy = rand() * tile
	if (kind === 'circle') {
		return { kind, cx, cy, r: 0.8 + rand() * 2.4, opacity }
	}
	if (kind === 'square') {
		const size = 1.2 + rand() * 3.2
		return {
			kind,
			x: cx - size / 2,
			y: cy - size / 2,
			size,
			rx: rand() > 0.5 ? 0.4 : 0,
			opacity,
		}
	}
	if (kind === 'triangle') {
		const s = 1.6 + rand() * 3.2
		return {
			kind,
			points: `${cx},${cy - s / 1.4} ${cx - s / 1.2},${cy + s / 1.6} ${cx + s / 1.2},${cy + s / 1.6}`,
			opacity,
		}
	}
	if (kind === 'diamond') {
		const s = 1.2 + rand() * 2.8
		return {
			kind,
			points: `${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`,
			opacity,
		}
	}
	if (kind === 'dash') {
		const len = 2 + rand() * 5
		const ang = rand() * Math.PI
		return {
			kind,
			x1: cx - Math.cos(ang) * len,
			y1: cy - Math.sin(ang) * len,
			x2: cx + Math.cos(ang) * len,
			y2: cy + Math.sin(ang) * len,
			width: 0.7 + rand() * 1.1,
			opacity,
		}
	}
	if (kind === 'arc') {
		const r = 2 + rand() * 5
		const a0 = rand() * Math.PI * 2
		const a1 = a0 + 0.8 + rand() * 1.8
		const x1 = cx + Math.cos(a0) * r
		const y1 = cy + Math.sin(a0) * r
		const x2 = cx + Math.cos(a1) * r
		const y2 = cy + Math.sin(a1) * r
		return {
			kind,
			d: `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`,
			width: 0.7 + rand() * 1.2,
			opacity,
		}
	}
	if (kind === 'wave') {
		const amp = 1 + rand() * 2.5
		const y = cy
		return {
			kind,
			d: `M 0 ${y} Q ${tile * 0.25} ${y - amp} ${tile * 0.5} ${y} T ${tile} ${y}`,
			width: 0.6 + rand() * 1,
			opacity,
		}
	}
	// cross
	const arm = 1.2 + rand() * 2.2
	const t = 0.45 + rand() * 0.5
	return {
		kind: 'cross',
		points: [
			`${cx - t},${cy - arm}`,
			`${cx + t},${cy - arm}`,
			`${cx + t},${cy - t}`,
			`${cx + arm},${cy - t}`,
			`${cx + arm},${cy + t}`,
			`${cx + t},${cy + t}`,
			`${cx + t},${cy + arm}`,
			`${cx - t},${cy + arm}`,
			`${cx - t},${cy + t}`,
			`${cx - arm},${cy + t}`,
			`${cx - arm},${cy - t}`,
			`${cx - t},${cy - t}`,
		].join(' '),
		opacity,
	}
}

const motif = computed(() => {
	const rand = mulberry32(hashSeed(props.seed))
	// Stronger / more saturated than before (~15%)
	const hue = Math.floor(rand() * 360)
	const sat = Math.min(78, Math.round((32 + Math.floor(rand() * 30)) * 1.15))
	const light = Math.max(48, Math.round((60 + Math.floor(rand() * 16)) * 0.96))
	const color = `hsl(${hue} ${sat}% ${light}%)`
	const tile = 16 + Math.floor(rand() * 18)
	const rotate = Math.floor(rand() * 70) - 35
	const primary = KINDS[Math.floor(rand() * KINDS.length)]
	let secondary = KINDS[Math.floor(rand() * KINDS.length)]
	if (secondary === primary) {
		secondary = KINDS[(KINDS.indexOf(primary) + 3) % KINDS.length]
	}
	const count = 4 + Math.floor(rand() * 5)
	const shapes = []
	for (let i = 0; i < count; i++) {
		const kind = i % 3 === 0 ? secondary : primary
		shapes.push(makeShape(kind, rand, tile))
	}
	// Occasional third accent shape for more diversity
	if (rand() > 0.45) {
		const tertiary = KINDS[Math.floor(rand() * KINDS.length)]
		shapes.push(makeShape(tertiary, rand, tile))
	}
	return { color, tile, rotate, shapes, hue, sat, light }
})

const patternId = computed(
	() => `motif-${hashSeed(props.seed).toString(36)}-${props.intensity}`,
)

const isSurface = computed(() => props.intensity === 'surface')

/** Was 40%; extend ~15pp further toward the middle → 55%. */
const shellStyle = computed(() => ({
	width: '55%',
}))

const washStyle = computed(() => {
	const { hue, sat, light } = motif.value
	const alpha = (isSurface.value ? 0.1 : 0.22) * 1.15
	const edge = (isSurface.value ? 0.04 : 0.1) * 1.15
	return {
		background: `linear-gradient(to left, hsl(${hue} ${sat}% ${light}% / ${alpha}) 0%, hsl(${hue} ${sat}% ${light}% / ${edge}) 58%, transparent 100%)`,
	}
})

const patternStyle = computed(() => ({
	opacity: (isSurface.value ? 0.28 : 0.55) * 1.15,
	maskImage: 'linear-gradient(to left, black 0%, rgba(0,0,0,0.55) 42%, transparent 100%)',
	WebkitMaskImage: 'linear-gradient(to left, black 0%, rgba(0,0,0,0.55) 42%, transparent 100%)',
}))

const color = computed(() => motif.value.color)
const tile = computed(() => motif.value.tile)
const rotate = computed(() => motif.value.rotate)
const shapes = computed(() => motif.value.shapes)
</script>
