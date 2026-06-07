<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const quizId = route.params.id as string

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

  let data: any[] = []
  try {
    data = await $fetch(`/api/play/${quizId}/questions`)
  } catch {
    data = []
  }

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
  let data: any = null
  let error: any = null
  try {
    data = await $fetch(`/api/play/${quizId}/finish`, {
      method: 'POST',
      body: { name: participantName.value, score: score.value },
    })
  } catch (e) {
    error = e
  }

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
  <div class="min-h-dvh flex flex-col max-w-md mx-auto relative overflow-x-hidden">

    <!-- ── Loading state ───────────────────────────────────────────────── -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div
        class="w-10 h-10 rounded-full border-[3px] border-muted animate-spin"
        style="border-top-color: hsl(var(--accent));"
        role="status"
        aria-label="Memuat soal..."
      ></div>
    </div>

    <!-- ── Active question ─────────────────────────────────────────────── -->
    <template v-else-if="currentQuestion">

      <!-- Top bar -->
      <div class="px-4 pt-4 pb-3 space-y-3">

        <!-- Row 1: label / score / timer -->
        <div class="flex items-center justify-between gap-2">

          <!-- Left: question counter + score -->
          <div class="flex items-center gap-2 min-w-0">
            <!-- "Soal X/Y" -->
            <span
              class="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-[--radius-pill] bg-muted text-muted-foreground"
            >
              Soal {{ currentIndex + 1 }}/{{ questions.length }}
            </span>
            <!-- Running score (mono, tabular) -->
            <span
              class="text-xs font-bold tabular-nums px-2.5 py-1 rounded-[--radius-pill] bg-accent/15 text-accent"
              style="font-family: var(--font-mono);"
            >
              {{ score }} pts
            </span>
          </div>

          <!-- Right: AnswerTimer ring (Req 7.3, 7.4) -->
          <AnswerTimer
            :time-left="timeLeft"
            :total="currentQuestion.time_limit"
          />
        </div>

        <!-- Row 2: progress bar (Req 7.1) -->
        <div
          class="w-full h-1.5 rounded-[--radius-pill] overflow-hidden bg-muted"
          role="progressbar"
          :aria-valuenow="currentIndex"
          :aria-valuemin="0"
          :aria-valuemax="questions.length"
          :aria-label="`Progres kuis: soal ${currentIndex + 1} dari ${questions.length}`"
        >
          <div
            class="h-full rounded-[--radius-pill] transition-all duration-[var(--motion-slow)] ease-[var(--ease-standard)]"
            :class="timeLeft <= 5 ? 'bg-warning' : 'bg-accent'"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
      </div>

      <!-- Question + options body -->
      <div class="flex-1 px-4 pb-6 flex flex-col gap-4 justify-center">

        <!-- Question card (Req 7.2) -->
        <UiCard class="border-border shadow-[var(--shadow-md)] rounded-[--radius-xl]">
          <div class="p-6 min-h-[148px] flex items-center justify-center text-center">
            <h2
              class="text-foreground font-extrabold leading-snug"
              style="font-size: var(--text-h2-size); line-height: var(--text-h2-lh);"
            >
              {{ currentQuestion.text }}
            </h2>
          </div>
        </UiCard>

        <!-- Options: single-column, large tappable targets (Req 7.2, 9.5) -->
        <div class="grid grid-cols-1 gap-2.5">
          <button
            v-for="(opt, idx) in currentQuestion.options"
            :key="opt.id"
            @click="selectOption(opt)"
            :disabled="isAnswering"
            class="group flex items-center gap-3 w-full min-h-14 px-4 py-3 rounded-[--radius-lg] border-2 text-left
                   transition-all duration-[var(--motion-fast)] ease-[var(--ease-spring)]
                   disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            :class="[
              /* unselected idle state — distinct color accent per option */
              selectedOptionId === null
                ? [
                    idx % 4 === 0 && 'border-accent/30 bg-card hover:border-accent/60 hover:bg-accent/10 active:scale-[0.985]',
                    idx % 4 === 1 && 'border-warning/30 bg-card hover:border-warning/60 hover:bg-warning/10 active:scale-[0.985]',
                    idx % 4 === 2 && 'border-destructive/30 bg-card hover:border-destructive/60 hover:bg-destructive/10 active:scale-[0.985]',
                    idx % 4 === 3 && 'border-secondary bg-card hover:border-muted-foreground/40 hover:bg-secondary/80 active:scale-[0.985]',
                  ]
                /* this is the selected option — show correctness */
                : selectedOptionId === opt.id
                  ? (answerResult === true
                      ? 'border-success bg-success/10 scale-[1.01]'
                      : answerResult === false
                        ? 'border-destructive bg-destructive/10 scale-[0.99]'
                        : 'border-accent bg-accent/10')
                  /* another option was selected — dim this one */
                  : 'border-border bg-card/50 opacity-50',
            ]"
          >
            <!-- Letter badge -->
            <span
              class="w-8 h-8 rounded-[--radius-md] flex items-center justify-center text-sm font-bold shrink-0 transition-colors duration-[var(--motion-fast)]"
              :class="selectedOptionId === opt.id
                ? (answerResult === true  ? 'bg-success text-success-foreground'
                  : answerResult === false ? 'bg-destructive text-destructive-foreground'
                  :                         'bg-accent text-accent-foreground')
                : [
                    idx % 4 === 0 && 'bg-accent/20 text-accent',
                    idx % 4 === 1 && 'bg-warning/20 text-warning-foreground',
                    idx % 4 === 2 && 'bg-destructive/20 text-destructive',
                    idx % 4 === 3 && 'bg-secondary text-secondary-foreground',
                  ]"
            >
              {{ ['A', 'B', 'C', 'D'][idx] }}
            </span>

            <!-- Option text -->
            <span class="font-semibold text-[15px] text-foreground leading-snug">{{ opt.text }}</span>
          </button>
        </div>

        <!-- Feedback banner (Req 7.6, 7.7, 10.5 — icon + text, not color alone) -->
        <Transition
          enter-active-class="transition-all duration-[var(--motion-base)] ease-[var(--ease-spring)]"
          enter-from-class="opacity-0 translate-y-2 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
        >
          <div v-if="answerResult !== null" class="flex justify-center">

            <!-- Correct (Req 7.6) -->
            <div
              v-if="answerResult"
              class="inline-flex items-center gap-2.5 bg-success/10 text-success border border-success/30 px-5 py-2.5 rounded-[--radius-pill] font-bold text-sm"
              role="status"
              aria-live="polite"
            >
              <!-- ✓ icon -->
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Benar! <span style="font-family: var(--font-mono);" class="tabular-nums">+{{ 1000 + (timeLeft * 10) }}</span></span>
            </div>

            <!-- Incorrect (Req 7.7) -->
            <div
              v-else
              class="inline-flex items-center gap-2.5 bg-destructive/10 text-destructive border border-destructive/30 px-5 py-2.5 rounded-[--radius-pill] font-bold text-sm"
              role="status"
              aria-live="polite"
            >
              <!-- ✗ icon -->
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              <span>Salah!</span>
            </div>

          </div>
        </Transition>

      </div>
    </template>

  </div>
</template>
