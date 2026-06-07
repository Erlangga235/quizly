<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from '~/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <h3
    :class="
      cn('text-[length:var(--text-h3-size)] leading-[var(--text-h3-lh)] font-bold tracking-tight', props.class)
    "
  >
    <slot />
  </h3>
</template>
