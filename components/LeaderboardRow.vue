<script setup lang="ts">
/**
 * LeaderboardRow.vue
 * Presentational leaderboard row with:
 *   - Rank medal treatment for top 3 (gold / silver / bronze)
 *   - Current-player highlight via accent border + background
 *   - Reorder animation hook: CSS transition enabled when animate=true
 * No emits, no behavior. FLIP / reorder logic stays in the parent page.
 * Requirements: 8.4, 8.5, 11.4
 */
const props = withDefaults(defineProps<{
  rank: number
  name: string
  score: number
  isCurrentPlayer?: boolean
  animate?: boolean
}>(), {
  isCurrentPlayer: false,
  animate: false,
})

// Medal config for top 3 ranks
type MedalConfig = { emoji: string; label: string; color: string }
const MEDALS: Record<number, MedalConfig> = {
  1: { emoji: '🥇', label: 'Pertama', color: 'hsl(45 93% 55%)' },   // gold
  2: { emoji: '🥈', label: 'Kedua',   color: 'hsl(210 14% 72%)' },   // silver
  3: { emoji: '🥉', label: 'Ketiga',  color: 'hsl(24 70% 55%)' },    // bronze
}

const medal = computed<MedalConfig | null>(() => MEDALS[props.rank] ?? null)

const formattedScore = computed(() =>
  props.score.toLocaleString('id-ID')
)
</script>

<template>
  <div
    class="flex items-center gap-3 px-4 py-3 rounded-lg border"
    :style="{
      /* Reorder animation: smooth position change when parent uses layout transitions */
      transition: animate
        ? `all var(--motion-slow) var(--ease-emphasized)`
        : 'none',
      /* Current player: accent border + subtle accent tint */
      borderColor: isCurrentPlayer
        ? 'hsl(var(--accent) / 0.7)'
        : 'hsl(var(--border))',
      backgroundColor: isCurrentPlayer
        ? 'hsl(var(--accent) / 0.08)'
        : 'hsl(var(--card))',
    }"
    :aria-current="isCurrentPlayer ? 'true' : undefined"
  >
    <!-- Rank badge -->
    <div
      class="flex-shrink-0 flex items-center justify-center"
      style="width: 2rem; height: 2rem;"
    >
      <template v-if="medal">
        <!-- Top-3 medal emoji -->
        <span
          class="text-xl leading-none"
          :title="medal.label"
          :aria-label="`Peringkat ${rank}: ${medal.label}`"
        >
          {{ medal.emoji }}
        </span>
      </template>
      <template v-else>
        <!-- Numeric rank badge for rank 4+ -->
        <span
          class="text-sm font-bold tabular-nums"
          :style="{
            fontFamily: 'var(--font-mono)',
            color: 'hsl(var(--muted-foreground))',
          }"
          :aria-label="`Peringkat ${rank}`"
        >
          {{ rank }}
        </span>
      </template>
    </div>

    <!-- Player name -->
    <span
      class="flex-1 truncate font-medium text-sm"
      :style="{
        color: isCurrentPlayer ? 'hsl(var(--accent))' : 'hsl(var(--foreground))',
        fontWeight: isCurrentPlayer ? 700 : 500,
        transition: animate ? `color var(--motion-slow) var(--ease-emphasized)` : 'none',
      }"
    >
      {{ name }}
      <span
        v-if="isCurrentPlayer"
        class="ml-1 text-xs opacity-70"
        style="font-family: var(--font-sans);"
      >(Kamu)</span>
    </span>

    <!-- Score -->
    <span
      class="flex-shrink-0 tabular-nums font-bold text-sm"
      :style="{
        fontFamily: 'var(--font-mono)',
        color: isCurrentPlayer ? 'hsl(var(--accent))' : 'hsl(var(--foreground))',
        transition: animate ? `color var(--motion-slow) var(--ease-emphasized)` : 'none',
      }"
      :aria-label="`Skor: ${formattedScore}`"
    >
      {{ formattedScore }}
    </span>
  </div>
</template>
