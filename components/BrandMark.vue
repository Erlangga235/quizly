<script setup lang="ts">
/**
 * BrandMark.vue
 * Presentational only — no emits, no reactive logic.
 * Renders the Quizly icon tile + gradient wordmark using design tokens.
 * Requirements: 2.5
 */
const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>(), {
  size: 'md',
})

const sizeConfig = {
  sm: { tile: '2rem', icon: '1rem', text: '1.125rem', gap: '0.5rem' },
  md: { tile: '2.75rem', icon: '1.375rem', text: '1.5rem', gap: '0.625rem' },
  lg: { tile: '3.5rem', icon: '1.75rem', text: '2rem', gap: '0.75rem' },
}

const config = computed(() => sizeConfig[props.size])
</script>

<template>
  <div
    class="inline-flex items-center"
    :style="{ gap: config.gap }"
    aria-label="Quizly"
  >
    <!-- Icon tile with brand gradient background -->
    <div
      class="flex items-center justify-center flex-shrink-0 rounded-md shadow-brand"
      :style="{
        width: config.tile,
        height: config.tile,
        background: 'var(--gradient-brand)',
        borderRadius: 'var(--radius-md)',
      }"
    >
      <!-- Lightning bolt / quiz icon -->
      <svg
        :width="config.icon"
        :height="config.icon"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M13 2L4.09 12.97H11.28L10.5 22L20.09 10.97H12.72L13 2Z"
          fill="hsl(var(--accent))"
          stroke="hsl(var(--accent))"
          stroke-width="0.5"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <!-- Wordmark using --font-display -->
    <span
      class="font-display font-extrabold leading-none tracking-tight text-foreground"
      :style="{
        fontFamily: 'var(--font-display)',
        fontSize: config.text,
        fontWeight: 800,
        lineHeight: 1,
        letterSpacing: '-0.02em',
      }"
    >
      Quiz<span :style="{ color: 'hsl(var(--accent))' }">ly</span>
    </span>
  </div>
</template>
