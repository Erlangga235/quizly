<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const quizId = route.params.id as string
const supabase = useSupabaseClient()

const questions = ref([])
const currentIndex = ref(0)
const score = ref(0)
const timeLeft = ref(0)
const timerInterval = ref<any>(null)
const participantName = ref('')
const isLoading = ref(true)
const selectedOptionId = ref<string | null>(null)
const answerResult = ref<null | boolean>(null)
const isAnswering = ref(false)

const optionColors = [
  'bg-white border-slate-200 hover:border-violet-400 hover:bg-violet-50/30',
  'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/30',
  'bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/30',
  'bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30',
]

const optionLetterColors = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
]

const currentQuestion = computed(() => questions.value[currentIndex.value] || null)
const progress = computed(() => questions.value.length > 0 ? ((currentIndex.value) / questions.value.length) * 100 : 0)

onMounted(async () => {
  participantName.value = localStorage.getItem('participantName') || 'Anonim'

  const { data } = await supabase
    .from('questions')
    .select('*, options(*)')
    .eq('quiz_id', quizId)
    .order('created_at')

  if (data && data.length > 0) {
    questions.value = data
    startQuestion()
  } else {
    alert("Kuis tidak ditemukan atau tidak memiliki pertanyaan.")
    router.push('/')
  }
  isLoading.value = false
})

onUnmounted(() => {
  if (timerInterval.value) clearInterval(timerInterval.value)
})

function startQuestion() {
  selectedOptionId.value = null
  answerResult.value = null
  isAnswering.value = false
  if (currentQuestion.value) {
    timeLeft.value = currentQuestion.value.time_limit
    timerInterval.value = setInterval(() => {
      timeLeft.value--
      if (timeLeft.value <= 0) {
        clearInterval(timerInterval.value)
        nextQuestion()
      }
    }, 1000)
  }
}

async function selectOption(option: any) {
  if (isAnswering.value) return
  isAnswering.value = true
  if (timerInterval.value) clearInterval(timerInterval.value)

  selectedOptionId.value = option.id

  // Server-side validation
  try {
    const result = await $fetch('/api/check-answer', {
      method: 'POST',
      body: {
        quiz_id: quizId,
        question_id: currentQuestion.value.id,
        option_id: option.id,
        time_left: timeLeft.value
      }
    })

    answerResult.value = result.is_correct
    if (result.is_correct) {
      score.value += result.score_earned
    }
  } catch {
    answerResult.value = false
  }

  setTimeout(() => {
    nextQuestion()
  }, 1200)
}

async function nextQuestion() {
  currentIndex.value++
  if (currentIndex.value < questions.value.length) {
    startQuestion()
  } else {
    await finishQuiz()
  }
}

async function finishQuiz() {
  const { data, error } = await supabase.from('participants').insert({
    quiz_id: quizId,
    name: participantName.value,
    score: score.value,
    finished_at: new Date().toISOString()
  }).select().single()

  if (!error && data) {
    localStorage.setItem('participantId', data.id)
    router.push(`/quiz/${quizId}/result`)
  }
}

const circumference = 2 * Math.PI * 20
const strokeDashoffset = computed(() => {
  if (!currentQuestion.value) return 0
  const max = currentQuestion.value.time_limit
  return circumference - (timeLeft.value / max) * circumference
})

function optionClass(opt: any, idx: number) {
  if (selectedOptionId.value === opt.id) {
    if (answerResult.value === true) return 'border-emerald-500 bg-emerald-50 scale-[1.01]'
    if (answerResult.value === false) return 'border-red-400 bg-red-50 scale-[0.99]'
    return 'border-violet-500 bg-violet-50'
  }
  if (selectedOptionId.value) return 'border-slate-100 bg-white/50 opacity-50'
  return optionColors[idx % optionColors.length]
}
</script>

<template>
  <div class="min-h-dvh flex flex-col max-w-md mx-auto relative">
    <!-- Loading -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin w-8 h-8 border-[3px] border-violet-600 border-t-transparent rounded-full"></div>
    </div>

    <template v-else-if="currentQuestion">
      <!-- Top Bar -->
      <div class="p-5 pb-3">
        <div class="flex justify-between items-center mb-3">
          <div class="flex items-center gap-3">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Soal {{ currentIndex + 1 }}/{{ questions.length }}</span>
            <span class="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full tabular-nums">{{ score }} pts</span>
          </div>

          <!-- Timer Circle -->
          <div class="relative w-12 h-12 flex items-center justify-center">
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#F1F5F9" stroke-width="3" />
              <circle
                cx="24" cy="24" r="20" fill="none"
                :stroke="timeLeft <= 5 ? '#EF4444' : '#7C3AED'" stroke-width="3"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="strokeDashoffset"
                class="transition-all duration-1000 ease-linear"
              />
            </svg>
            <span class="absolute text-sm font-extrabold tabular-nums" :class="timeLeft <= 5 ? 'text-red-500' : 'text-violet-700'">{{ timeLeft }}</span>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500 ease-out"
            :class="timeLeft <= 5 ? 'bg-red-400' : 'bg-gradient-to-r from-violet-500 to-fuchsia-500'"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
      </div>

      <!-- Question + Options -->
      <div class="flex-1 px-5 pb-6 flex flex-col justify-center space-y-5">
        <!-- Question Card -->
        <div class="bg-white rounded-2xl shadow-lg shadow-slate-900/[0.04] border border-slate-200/60 p-7 min-h-[160px] flex items-center justify-center text-center">
          <h2 class="text-xl sm:text-2xl font-extrabold text-slate-800 leading-snug">{{ currentQuestion.text }}</h2>
        </div>

        <!-- Options -->
        <div class="grid grid-cols-1 gap-2.5">
          <button
            v-for="(opt, idx) in currentQuestion.options"
            :key="opt.id"
            @click="selectOption(opt)"
            :disabled="isAnswering"
            class="flex items-center gap-3 w-full p-4 rounded-xl border-2 text-left transition-all duration-200 disabled:cursor-default"
            :class="optionClass(opt, idx)"
          >
            <span
              class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-colors duration-200"
              :class="selectedOptionId === opt.id
                ? (answerResult === true ? 'bg-emerald-500 text-white' : answerResult === false ? 'bg-red-500 text-white' : 'bg-violet-500 text-white')
                : optionLetterColors[idx % 4]"
            >{{ ['A','B','C','D'][idx] }}</span>
            <span class="font-semibold text-[15px]">{{ opt.text }}</span>
          </button>
        </div>

        <!-- Feedback -->
        <div v-if="answerResult !== null" class="text-center">
          <div v-if="answerResult" class="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full font-bold text-sm">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Benar! +{{ 1000 + (timeLeft * 10) }}
          </div>
          <div v-else class="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full font-bold text-sm">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Salah!
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
