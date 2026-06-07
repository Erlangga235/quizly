<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const quizId = route.params.id as string
const supabase = useSupabaseClient()

const quiz = ref(null)
const participant = ref(null)
const leaderboard = ref([])
const realtimeChannel = ref(null)

onMounted(async () => {
  const pId = localStorage.getItem('participantId')
  
  // Fetch Quiz & Participant
  let qData: any = null
  try {
    const res = await $fetch(`/api/play/${quizId}/result`)
    qData = res.quiz
    leaderboard.value = res.leaderboard
  } catch {}
  quiz.value = qData
  
  if (pId) {
    const { data: pData } = await supabase.from('participants').select('*').eq('id', pId).single()
    participant.value = pData
  }
  
  if (quiz.value?.is_leaderboard_visible) {
    await fetchLeaderboard()
    subscribeToLeaderboard()
  }
})

onUnmounted(() => {
  if (realtimeChannel.value) {
    supabase.removeChannel(realtimeChannel.value)
  }
})

async function fetchLeaderboard() {
  let data: any[] = []
  try {
    const res = await $fetch(`/api/play/${quizId}/result`)
    data = res.leaderboard
  } catch {
    data = []
  }

  leaderboard.value = data || []
}

function subscribeToLeaderboard() {
  realtimeChannel.value = supabase.channel('leaderboard-updates')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'participants', filter: `quiz_id=eq.${quizId}` },
      () => {
        fetchLeaderboard()
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'participants', filter: `quiz_id=eq.${quizId}` },
      () => {
        fetchLeaderboard()
      }
    )
    .subscribe()
}
</script>

<template>
  <!-- Single-column mobile layout; max-w-md centers on wider screens (Req 9.2) -->
  <div class="min-h-dvh flex flex-col max-w-md mx-auto p-5">
    <div class="flex-1 flex flex-col items-center justify-center text-center space-y-6" v-if="participant">

      <!-- Completion icon tile — brand gradient + shadow-brand (Req 8.1) -->
      <div class="relative">
        <div
          class="w-20 h-20 rounded-[var(--radius-xl)] flex items-center justify-center rotate-3"
          style="background: var(--gradient-brand); box-shadow: var(--shadow-brand);"
        >
          <svg
            class="w-10 h-10 text-foreground/90"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
      </div>

      <!-- "Kuis Selesai!" heading + player name (Req 8.1, 8.2) -->
      <div>
        <h1
          class="text-2xl font-extrabold text-foreground"
          style="font-family: var(--font-display);"
        >
          Kuis Selesai!
        </h1>
        <p class="text-muted-foreground mt-1 text-sm">
          Kerja bagus, <span class="font-semibold text-foreground">{{ participant.name }}</span>
        </p>
      </div>

      <!-- Score card — brand gradient, mono score (Req 8.1, 8.2) -->
      <div
        class="w-full rounded-[var(--radius-xl)] p-6"
        style="background: var(--gradient-brand); box-shadow: var(--shadow-brand);"
      >
        <p
          class="text-xs font-bold uppercase tracking-widest mb-1"
          style="color: hsl(var(--foreground) / 0.7); font-family: var(--font-sans);"
        >
          Skor Anda
        </p>
        <p
          class="text-5xl font-black tabular-nums text-foreground/90"
          style="font-family: var(--font-mono);"
        >
          {{ participant.score }}
        </p>
      </div>

      <!-- Leaderboard — visible branch (Req 8.3, 8.4, 8.5, 8.6, 8.7, 11.4) -->
      <div v-if="quiz?.is_leaderboard_visible" class="w-full text-left">

        <!-- Section header + LIVE badge -->
        <div class="flex items-center justify-between mb-3">
          <h2
            class="text-base font-bold text-foreground"
            style="font-family: var(--font-display);"
          >
            Papan Peringkat
          </h2>
          <!-- LIVE indicator — accent token colors (Req 8.7) -->
          <span
            class="text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border"
            style="
              color: hsl(var(--accent));
              background-color: hsl(var(--accent) / 0.15);
              border-color: hsl(var(--accent) / 0.3);
            "
          >
            <span
              class="w-1.5 h-1.5 rounded-full animate-pulse"
              style="background-color: hsl(var(--accent));"
            ></span>
            LIVE
          </span>
        </div>

        <!-- Leaderboard rows with TransitionGroup for reorder animation (Req 11.4) -->
        <TransitionGroup
          tag="div"
          class="space-y-2"
          move-class="transition-all duration-[400ms] ease-[cubic-bezier(0.2,0,0,1)]"
        >
          <LeaderboardRow
            v-for="(p, index) in leaderboard"
            :key="p.id"
            :rank="index + 1"
            :name="p.name"
            :score="p.score"
            :is-current-player="p.id === participant.id"
            :animate="true"
          />
        </TransitionGroup>
      </div>

      <!-- Hidden leaderboard message (Req 8.8) -->
      <div v-else class="text-muted-foreground text-sm italic py-4">
        Papan peringkat disembunyikan oleh admin.
      </div>

      <!-- Back to home — default UiButton uses brand gradient (Req 8.2) -->
      <NuxtLink to="/" class="block w-full pt-2">
        <UiButton class="w-full h-12 font-bold text-base">
          Kembali ke Beranda
        </UiButton>
      </NuxtLink>

    </div>
  </div>
</template>
