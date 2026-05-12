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
  const { data: qData } = await supabase.from('quizzes').select('*').eq('id', quizId).single()
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
  const { data } = await supabase
    .from('participants')
    .select('*')
    .eq('quiz_id', quizId)
    .order('score', { ascending: false })
    .limit(10)
    
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
  <div class="min-h-dvh flex flex-col max-w-md mx-auto p-5">
    <div class="flex-1 flex flex-col items-center justify-center text-center space-y-6" v-if="participant">

      <!-- Success Icon -->
      <div class="relative">
        <div class="w-20 h-20 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/25 rotate-3">
          <svg class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
      </div>

      <!-- Title -->
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">Kuis Selesai!</h1>
        <p class="text-slate-500 mt-1 text-sm">Kerja bagus, <span class="font-semibold text-slate-700">{{ participant.name }}</span></p>
      </div>

      <!-- Score Card -->
      <div class="w-full bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-2xl p-6 shadow-lg shadow-violet-500/20 text-white">
        <p class="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Skor Anda</p>
        <p class="text-5xl font-black tabular-nums">{{ participant.score }}</p>
      </div>

      <!-- Leaderboard -->
      <div v-if="quiz?.is_leaderboard_visible" class="w-full">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-bold text-slate-800">Papan Peringkat</h2>
          <span class="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> LIVE
          </span>
        </div>
        <div class="space-y-2">
          <div
            v-for="(p, index) in leaderboard"
            :key="p.id"
            class="flex items-center justify-between p-3.5 rounded-xl transition-all duration-200"
            :class="p.id === participant.id
              ? 'bg-violet-50 border-2 border-violet-300'
              : 'bg-white/80 border border-slate-200/60'"
          >
            <div class="flex items-center gap-3">
              <span
                v-if="index < 3"
                class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                :class="index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : 'bg-amber-700'"
              >{{ index + 1 }}</span>
              <span v-else class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-100">{{ index + 1 }}</span>
              <span class="font-semibold text-sm" :class="p.id === participant.id ? 'text-violet-700' : 'text-slate-700'">{{ p.name }}</span>
            </div>
            <span class="font-bold text-sm tabular-nums" :class="p.id === participant.id ? 'text-violet-700' : 'text-slate-600'">{{ p.score }}</span>
          </div>
        </div>
      </div>
      <div v-else class="text-slate-400 text-sm italic py-4">
        Papan peringkat disembunyikan oleh admin.
      </div>

      <!-- Back Button -->
      <NuxtLink to="/" class="block w-full pt-2">
        <UiButton class="w-full h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base transition-all active:scale-[0.98]">
          Kembali ke Beranda
        </UiButton>
      </NuxtLink>
    </div>
  </div>
</template>
