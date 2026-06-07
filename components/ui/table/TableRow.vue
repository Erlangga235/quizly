<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from '~/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <tr :class="cn('border-b border-border transition-colors duration-[var(--motion-base)] hover:bg-accent/10 data-[state=selected]:bg-accent/20', props.class)">
    <slot />
  </tr>
</template>
