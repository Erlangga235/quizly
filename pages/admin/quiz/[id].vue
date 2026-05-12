<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const quizId = route.params.id as string
const supabase = useSupabaseClient()

const quiz = ref(null)
const questions = ref([])
const participants = ref([])
const activeTab = ref<'soal' | 'peserta'>('soal')
const newQuestionText = ref('')
const newQuestionTime = ref(30)
const optionCount = ref(4)
const options = ref([
  { text: '', is_correct: true },
  { text: '', is_correct: false },
  { text: '', is_correct: false },
  { text: '', is_correct: false }
])

function updateOptionCount(count: number) {
  optionCount.value = count
  const current = options.value
  if (count > current.length) {
    for (let i = current.length; i < count; i++) {
      current.push({ text: '', is_correct: false })
    }
  } else if (count < current.length) {
    options.value = current.slice(0, count)
    if (!options.value.some(o => o.is_correct)) {
      options.value[0].is_correct = true
    }
  }
}

function setCorrectOption(idx: number) {
  options.value.forEach(o => o.is_correct = false)
  options.value[idx].is_correct = true
}

function resetForm() {
  newQuestionText.value = ''
  newQuestionTime.value = 30
  const count = optionCount.value
  options.value = Array.from({ length: count }, (_, i) => ({ text: '', is_correct: i === 0 }))
}
const showDeleteQuestionDialog = ref(false)
const deleteQuestionId = ref('')
const codeCopied = ref(false)

async function fetchQuiz() {
  const { data: qData } = await supabase.from('quizzes').select('*').eq('id', quizId).single()
  quiz.value = qData

  const { data: qstData } = await supabase
    .from('questions')
    .select('*, options(*)')
    .eq('quiz_id', quizId)
    .order('created_at')
  questions.value = qstData || []
}

async function fetchParticipants() {
  const { data } = await supabase
    .from('participants')
    .select('*')
    .eq('quiz_id', quizId)
    .order('score', { ascending: false })
  participants.value = data || []
}

async function addQuestion() {
  if (!newQuestionText.value) return

  const { data: qst, error } = await supabase
    .from('questions')
    .insert({ quiz_id: quizId, text: newQuestionText.value, time_limit: newQuestionTime.value })
    .select()
    .single()

  if (!error && qst) {
    const optsToInsert = options.value.filter(o => o.text).map(o => ({
      question_id: qst.id,
      text: o.text,
      is_correct: o.is_correct
    }))

    if (optsToInsert.length > 0) {
      await supabase.from('options').insert(optsToInsert)
    }

    resetForm()
    await fetchQuiz()
  }
}

function openDeleteQuestion(id: string) {
  deleteQuestionId.value = id
  showDeleteQuestionDialog.value = true
}

async function confirmDeleteQuestion() {
  await supabase.from('questions').delete().eq('id', deleteQuestionId.value)
  showDeleteQuestionDialog.value = false
  await fetchQuiz()
}

async function toggleLeaderboard() {
  if (!quiz.value) return
  const newVal = !quiz.value.is_leaderboard_visible
  await supabase.from('quizzes').update({ is_leaderboard_visible: newVal }).eq('id', quizId)
  quiz.value.is_leaderboard_visible = newVal
}

async function copyQuizCode() {
  const code = quiz.value?.code || ''
  try {
    await navigator.clipboard.writeText(code)
    codeCopied.value = true
    setTimeout(() => codeCopied.value = false, 2000)
  } catch {
    const el = document.createElement('textarea')
    el.value = code
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    codeCopied.value = true
    setTimeout(() => codeCopied.value = false, 2000)
  }
}

const totalParticipants = computed(() => participants.value.length)
const avgScore = computed(() => {
  if (participants.value.length === 0) return 0
  const sum = participants.value.reduce((a, p) => a + (p.score || 0), 0)
  return Math.round(sum / participants.value.length)
})

onMounted(() => {
  fetchQuiz()
  fetchParticipants()
})
</script>

<template>
  <div class="max-w-5xl mx-auto py-10 px-4 sm:px-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8" v-if="quiz">
      <div>
        <NuxtLink to="/admin" class="text-xs text-slate-400 hover:text-violet-600 transition-colors mb-1 block">&larr; Kembali ke Dashboard</NuxtLink>
        <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">{{ quiz.title }}</h1>
        <div class="flex items-center gap-2 mt-2">
          <code class="text-sm text-slate-700 font-mono font-bold bg-slate-100 px-3 py-1 rounded-lg tracking-widest select-all">{{ quiz.code }}</code>
          <button @click="copyQuizCode" class="text-xs font-semibold transition-colors" :class="codeCopied ? 'text-emerald-600' : 'text-violet-600 hover:text-violet-700'">
            {{ codeCopied ? 'Tersalin!' : 'Salin Kode' }}
          </button>
        </div>
      </div>

      <button
        @click="toggleLeaderboard"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
        :class="quiz.is_leaderboard_visible
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
          : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'"
      >
        <span class="w-2 h-2 rounded-full" :class="quiz.is_leaderboard_visible ? 'bg-emerald-500' : 'bg-slate-400'"></span>
        Leaderboard {{ quiz.is_leaderboard_visible ? 'Aktif' : 'Nonaktif' }}
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      <div class="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
            <svg class="w-4.5 h-4.5 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div>
            <p class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Soal</p>
            <p class="text-xl font-extrabold text-slate-800">{{ questions.length }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-fuchsia-100 flex items-center justify-center shrink-0">
            <svg class="w-4.5 h-4.5 text-fuchsia-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div>
            <p class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Peserta</p>
            <p class="text-xl font-extrabold text-slate-800">{{ totalParticipants }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <svg class="w-4.5 h-4.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
          </div>
          <div>
            <p class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Rata-rata</p>
            <p class="text-xl font-extrabold text-slate-800">{{ avgScore }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <svg class="w-4.5 h-4.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div>
            <p class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Tertinggi</p>
            <p class="text-xl font-extrabold text-slate-800">{{ participants[0]?.score ?? '-' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Global Settings Bar -->
    <div class="flex flex-wrap items-center gap-4 mb-6 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-3 px-4 shadow-sm">
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-slate-500">Jumlah Opsi:</span>
        <div class="flex gap-1">
          <button
            v-for="n in [2, 3, 4, 5, 6]"
            :key="n"
            type="button"
            @click="updateOptionCount(n)"
            class="w-8 h-8 rounded-lg text-xs font-bold transition-all duration-150"
            :class="optionCount === n
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
          >{{ n }}</button>
        </div>
      </div>
      <div class="h-5 w-px bg-slate-200"></div>
      <!-- Tabs -->
      <div class="flex gap-1 bg-slate-100 rounded-lg p-0.5">
        <button
          @click="activeTab = 'soal'"
          class="px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-200"
          :class="activeTab === 'soal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          Soal ({{ questions.length }})
        </button>
        <button
          @click="activeTab = 'peserta'; fetchParticipants()"
          class="px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-200"
          :class="activeTab === 'peserta' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          Peserta ({{ totalParticipants }})
        </button>
      </div>
    </div>

    <!-- Tab: Soal -->
    <div v-if="activeTab === 'soal'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-3">
        <div
          v-for="(qst, index) in questions"
          :key="qst.id"
          class="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm"
        >
          <div class="flex justify-between items-start mb-3">
            <h3 class="font-bold text-slate-800 leading-snug">
              <span class="text-violet-500 mr-1.5">{{ index + 1 }}.</span>{{ qst.text }}
            </h3>
            <div class="flex items-center gap-2 shrink-0 ml-4">
              <span class="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{{ qst.time_limit }}s</span>
              <button
                @click="openDeleteQuestion(qst.id)"
                class="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="Hapus pertanyaan"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="opt in qst.options"
              :key="opt.id"
              class="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
              :class="opt.is_correct ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-100'"
            >
              <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="opt.is_correct ? 'bg-emerald-500' : 'bg-slate-300'"></span>
              <span :class="opt.is_correct ? 'font-semibold text-emerald-700' : 'text-slate-600'">{{ opt.text }}</span>
            </div>
          </div>
        </div>

        <div v-if="questions.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
          <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
            <svg class="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <p class="text-slate-500 text-sm">Belum ada pertanyaan. Tambahkan di form sebelah kanan.</p>
        </div>
      </div>

      <!-- Add Question Form -->
      <div>
        <div class="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm sticky top-6">
          <h2 class="text-base font-bold text-slate-800 mb-4">Tambah Pertanyaan</h2>
          <form @submit.prevent="addQuestion" class="space-y-4">
            <div class="space-y-1.5">
              <UiLabel class="text-xs font-semibold text-slate-600">Teks Pertanyaan</UiLabel>
              <UiInput v-model="newQuestionText" placeholder="Tulis pertanyaan di sini..." required class="h-10 rounded-lg text-sm" />
            </div>
            <div class="space-y-1.5">
              <UiLabel class="text-xs font-semibold text-slate-600">Batas Waktu (detik)</UiLabel>
              <UiInput type="number" v-model="newQuestionTime" min="5" max="120" required class="h-10 rounded-lg text-sm" />
            </div>

            <div class="space-y-2">
              <UiLabel class="text-xs font-semibold text-slate-600">Opsi Jawaban</UiLabel>
              <div v-for="(opt, idx) in options" :key="idx" class="flex items-center gap-2">
                <button
                  type="button"
                  @click="setCorrectOption(idx)"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-150 border-2"
                  :class="opt.is_correct
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-violet-300 hover:text-violet-500'"
                  :aria-label="`Tandai opsi ${['A','B','C','D','E','F'][idx]} sebagai benar`"
                >
                  <svg v-if="opt.is_correct" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span v-else>{{ ['A','B','C','D','E','F'][idx] }}</span>
                </button>
                <UiInput v-model="opt.text" :placeholder="`Opsi ${['A','B','C','D','E','F'][idx]}`" class="flex-1 h-10 rounded-lg text-sm" />
              </div>
              <p class="text-[11px] text-slate-400">Klik huruf untuk menandai jawaban benar (hijau = benar).</p>
            </div>

            <UiButton type="submit" class="w-full h-10 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white font-semibold text-sm shadow-md shadow-violet-500/20 transition-all active:scale-[0.98]">
              + Tambah Pertanyaan
            </UiButton>
          </form>
        </div>
      </div>
    </div>

    <!-- Tab: Peserta -->
    <div v-if="activeTab === 'peserta'">
      <div class="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <UiTable>
          <UiTableHeader>
            <UiTableRow class="bg-slate-50/50">
              <UiTableHead class="w-16 text-xs font-semibold text-slate-500">#</UiTableHead>
              <UiTableHead class="text-xs font-semibold text-slate-500">Nama</UiTableHead>
              <UiTableHead class="text-center text-xs font-semibold text-slate-500">Skor</UiTableHead>
              <UiTableHead class="text-right text-xs font-semibold text-slate-500">Selesai Pada</UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody>
            <UiTableRow v-for="(p, idx) in participants" :key="p.id" class="hover:bg-slate-50/50 transition-colors">
              <UiTableCell>
                <span
                  v-if="idx < 3"
                  class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white"
                  :class="idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-amber-700'"
                >{{ idx + 1 }}</span>
                <span v-else class="text-sm font-medium text-slate-400 ml-1.5">{{ idx + 1 }}</span>
              </UiTableCell>
              <UiTableCell class="font-semibold text-slate-800">{{ p.name }}</UiTableCell>
              <UiTableCell class="text-center">
                <span class="font-bold text-violet-600 tabular-nums">{{ p.score }}</span>
              </UiTableCell>
              <UiTableCell class="text-right text-xs text-slate-400">
                {{ p.finished_at ? new Date(p.finished_at).toLocaleString('id-ID') : '-' }}
              </UiTableCell>
            </UiTableRow>
            <UiTableRow v-if="participants.length === 0">
              <UiTableCell colspan="4" class="text-center text-slate-400 py-12">
                Belum ada peserta yang menyelesaikan kuis ini.
              </UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>
      </div>
    </div>

    <!-- Delete Question Confirmation -->
    <UiAlertDialog v-model:open="showDeleteQuestionDialog">
      <UiAlertDialogContent class="rounded-2xl">
        <UiAlertDialogHeader>
          <UiAlertDialogTitle class="text-xl font-bold">Hapus Pertanyaan?</UiAlertDialogTitle>
          <UiAlertDialogDescription class="text-slate-500">
            Pertanyaan ini beserta semua opsi jawabannya akan dihapus secara permanen.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel @click="showDeleteQuestionDialog = false" class="rounded-xl">Batal</UiAlertDialogCancel>
          <UiAlertDialogAction @click="confirmDeleteQuestion" class="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold">Ya, Hapus</UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
