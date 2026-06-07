<script setup lang="ts">
/**
 * AnswerTimer.vue
 * Presentational SVG countdown ring.
 * Props: timeLeft (seconds remaining), total (total seconds, default 30).
 * No emits. Interval logic stays in the parent page.
 * Applies --warning urgency styling when timeLeft ≤ 5.
 * Requirements: 7.3, 7.4
 */
const props = withDefaults(defineProps<{
  timeLeft: number
  total?: number
}>(), {
  total: 30,
})

// SVG ring geometry
const SIZE = 56          // viewBox & rendered size in px
const STROKE = 4         // ring stroke width
const RADIUS = (SIZE - STROKE) / 2   // 26
const CIRCUMFERENCE = 2 * Math.PI * RADIUS  // ~163.4

const isUrgent = computed(() => props.timeLeft <= 5)

// Fraction remaining, clamped [0,1]
const fraction = computed(() => {
  const total = props.total > 0 ? props.total : 1
  return Math.min(1, Math.max(0, props.timeLeft / total))
})

// stroke-dashoffset: 0 = full ring, CIRCUMFERENCE = empty ring
const dashOffset = computed(() => CIRCUMFERENCE * (1 - fraction.value))

// Colors from tokens
const trackColor = 'hsl(var(--muted))'
const progressColor = computed(() =>
  isUrgent.value ? 'hsl(var(--warning))' : 'hsl(var(--accent))'
)
const textColor = computed(() =>
  isUrgent.value ? 'hsl(var(--warning))' : 'hsl(var(--foreground))'
)
</script>

<template>
  <div
    class="relative inline-flex items-center justify-center"
    :style="{ width: `${SIZE}px`, height: `${SIZE}px` }"
    role="timer"
    :aria-label="`${timeLeft} detik tersisa`"
    :aria-valuenow="timeLeft"
    :aria-valuemin="0"
    :aria-valuemax="total"
  >
    <svg
      :width="SIZE"
      :height="SIZE"
      :viewBox="`0 0 ${SIZE} ${SIZE}`"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style="transform: rotate(-90deg);"
      aria-hidden="true"
    >
      <!-- Track ring -->
      <circle
        :cx="SIZE / 2"
        :cy="SIZE / 2"
        :r="RADIUS"
        :stroke="trackColor"
        :stroke-width="STROKE"
        fill="none"
      />
      <!-- Progress arc -->
      <circle
        :cx="SIZE / 2"
        :cy="SIZE / 2"
        :r="RADIUS"
        :stroke="progressColor"
        :stroke-width="STROKE"
        fill="none"
        stroke-linecap="round"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="dashOffset"
        :style="{
          transition: `stroke-dashoffset var(--motion-base) var(--ease-standard), stroke var(--motion-base) var(--ease-standard)`,
        }"
      />
    </svg>

    <!-- Center time label -->
    <span
      class="absolute inset-0 flex items-center justify-center tabular-nums"
      :style="{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.875rem',
        fontWeight: 700,
        color: textColor,
        transition: `color var(--motion-base) var(--ease-standard)`,
      }"
    >
      {{ timeLeft }}
    </span>
  </div>
</template>
