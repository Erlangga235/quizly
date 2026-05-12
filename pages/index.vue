<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const supabase = useSupabaseClient()
const code = ref('')
const name = ref('')
const isJoining = ref(false)
const errorMsg = ref('')

async function joinQuiz() {
  if (!code.value || !name.value) return
  isJoining.value = true
  errorMsg.value = ''

  const { data, error } = await supabase
    .from('quizzes')
    .select('id')
    .eq('code', code.value.toUpperCase().trim())
    .single()

  if (error || !data) {
    errorMsg.value = 'Kode kuis tidak ditemukan.'
    isJoining.value = false
    return
  }

  localStorage.setItem('participantName', name.value)
  router.push(`/quiz/${data.id}`)
}
</script>

<template>
  <div class="flex items-center justify-center min-h-dvh p-4">
    <div class="w-full max-w-sm space-y-8">
      <!-- Hero -->
      <div class="text-center space-y-3">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-lg shadow-violet-500/25 mb-2">
          <svg class="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <h1 class="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">
          Quizly
        </h1>
        <p class="text-slate-500 text-base leading-relaxed">
          Gabung kuis langsung dan uji pengetahuanmu!
        </p>
      </div>

      <!-- Join Card -->
      <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-900/[0.04] border border-slate-200/60 p-6 space-y-5">
        <form @submit.prevent="joinQuiz" class="space-y-4">
          <div class="space-y-1.5">
            <UiLabel for="name" class="text-sm font-semibold text-slate-700">Nama Kamu</UiLabel>
            <UiInput
              id="name"
              v-model="name"
              placeholder="Masukkan nama kamu"
              required
              autocomplete="name"
              class="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white placeholder:text-slate-400 text-base transition-colors"
            />
          </div>
          <div class="space-y-1.5">
            <UiLabel for="code" class="text-sm font-semibold text-slate-700">Kode Kuis</UiLabel>
            <UiInput
              id="code"
              v-model="code"
              placeholder="ABCD"
              required
              maxlength="4"
              class="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white placeholder:text-slate-400 text-xl font-mono font-bold uppercase tracking-[0.3em] text-center transition-colors"
            />
            <p v-if="errorMsg" class="text-xs font-semibold text-red-500 mt-1">{{ errorMsg }}</p>
          </div>
          <UiButton
            type="submit"
            :disabled="isJoining || !name || !code"
            class="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white font-bold text-base shadow-lg shadow-violet-500/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isJoining" class="flex items-center justify-center gap-2">
              <svg class="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="opacity-75" />
              </svg>
              Menghubungkan...
            </span>
            <span v-else>Mulai Kuis</span>
          </UiButton>
        </form>
      </div>

      <!-- Admin Link -->
      <div class="text-center">
        <NuxtLink to="/admin" class="text-sm text-slate-400 hover:text-violet-600 transition-colors">
          Masuk sebagai Admin →
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
