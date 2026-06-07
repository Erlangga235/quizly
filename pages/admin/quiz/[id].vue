<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({ middleware: 'admin-auth' })

const route = useRoute()
const router = useRouter()
const quizId = route.params.id as string
const adminToken = ref('')

function authHeaders() {
  return { Authorization: `Bearer ${adminToken.value}` }
}

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
  try {
    const data = await $fetch(`/api/admin/quizzes/${quizId}`, { headers: authHeaders() })
    quiz.value = data.quiz
    questions.value = data.questions || []
  } catch {
    router.push('/admin')
  }
}

async function fetchParticipants() {
  try {
    participants.value = await $fetch(`/api/admin/quizzes/${quizId}/participants`, { headers: authHeaders() })
  } catch {
    participants.value = []
  }
}

async function addQuestion() {
  if (!newQuestionText.value) return
  try {
    await $fetch(`/api/admin/quizzes/${quizId}/questions`, {
      method: 'POST',
      headers: authHeaders(),
      body: {
        text: newQuestionText.value,
        time_limit: newQuestionTime.value,
        options: options.value.filter(o => o.text).map(o => ({ text: o.text, is_correct: o.is_correct })),
      },
    })
    resetForm()
    await fetchQuiz()
  } catch {}
}

function openDeleteQuestion(id: string) {
  deleteQuestionId.value = id
  showDeleteQuestionDialog.value = true
}

async function confirmDeleteQuestion() {
  try {
    await $fetch(`/api/admin/questions/${deleteQuestionId.value}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
  } catch {}
  showDeleteQuestionDialog.value = false
  await fetchQuiz()
}

async function toggleLeaderboard() {
  if (!quiz.value) return
  const newVal = !quiz.value.is_leaderboard_visible
  try {
    await $fetch(`/api/admin/quizzes/${quizId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: { is_leaderboard_visible: newVal },
    })
    quiz.value.is_leaderboard_visible = newVal
  } catch {}
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
  adminToken.value = localStorage.getItem('adminToken') || ''
  fetchQuiz()
  fetchParticipants()
})
</script>

<template>
  <div class="max-w-5xl mx-auto py-10 px-4 sm:px-6">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div v-if="quiz" class="mb-8">
      <!-- Back link -->
      <NuxtLink
        to="/admin"
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-accent transition-colors duration-[var(--motion-base)] mb-4 group"
      >
        <svg class="w-3.5 h-3.5 transition-transform duration-[var(--motion-base)] group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
        Kembali ke Dashboard
      </NuxtLink>

      <!-- Title row -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <!-- Left: title + code -->
        <div>
          <h1
            class="font-display font-extrabold text-foreground leading-tight mb-2"
            style="font-size: var(--text-h1-size); line-height: var(--text-h1-lh);"
          >{{ quiz.title }}</h1>

          <!-- Code pill + copy action -->
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-2 bg-card border border-border rounded-[var(--radius-md)] px-3 py-1.5 shadow-[var(--shadow-sm)]">
              <svg class="w-3.5 h-3.5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              <code class="font-mono text-sm font-bold text-foreground tracking-[0.2em] select-all uppercase">{{ quiz.code }}</code>
            </div>
            <button
              @click="copyQuizCode"
              class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-md)] border transition-all duration-[var(--motion-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              :class="codeCopied
                ? 'bg-success/10 border-success/30 text-success'
                : 'bg-card border-border text-muted-foreground hover:border-accent hover:text-accent'"
              :aria-label="codeCopied ? 'Kode tersalin' : 'Salin kode kuis'"
            >
              <!-- Check icon when copied -->
              <svg v-if="codeCopied" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <!-- Copy icon when not copied -->
              <svg v-else class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              {{ codeCopied ? 'Tersalin!' : 'Salin Kode' }}
            </button>
          </div>
        </div>

        <!-- Right: leaderboard toggle -->
        <button
          @click="toggleLeaderboard"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold border transition-all duration-[var(--motion-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shrink-0"
          :class="quiz.is_leaderboard_visible
            ? 'bg-success/10 border-success/30 text-success hover:bg-success/20'
            : 'bg-muted border-border text-muted-foreground hover:border-border hover:bg-secondary'"
          :aria-label="quiz.is_leaderboard_visible ? 'Leaderboard aktif, klik untuk menonaktifkan' : 'Leaderboard nonaktif, klik untuk mengaktifkan'"
        >
          <!-- Status dot -->
          <span
            class="w-2 h-2 rounded-full shrink-0 transition-colors duration-[var(--motion-base)]"
            :class="quiz.is_leaderboard_visible ? 'bg-success' : 'bg-muted-foreground'"
          ></span>
          Leaderboard {{ quiz.is_leaderboard_visible ? 'Aktif' : 'Nonaktif' }}
        </button>
      </div>
    </div>

    <!-- ── Stats Summary Cards ─────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      <!-- Questions -->
      <div class="bg-card border border-border rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-sm)]">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-[var(--radius-md)] bg-accent/10 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div>
            <p class="text-muted-foreground uppercase tracking-wider font-semibold" style="font-size: var(--text-sm-size);">Soal</p>
            <p class="font-extrabold text-foreground font-mono tabular-nums text-xl">{{ questions.length }}</p>
          </div>
        </div>
      </div>

      <!-- Participants -->
      <div class="bg-card border border-border rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-sm)]">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-[var(--radius-md)] bg-accent/10 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <div>
            <p class="text-muted-foreground uppercase tracking-wider font-semibold" style="font-size: var(--text-sm-size);">Peserta</p>
            <p class="font-extrabold text-foreground font-mono tabular-nums text-xl">{{ totalParticipants }}</p>
          </div>
        </div>
      </div>

      <!-- Avg Score -->
      <div class="bg-card border border-border rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-sm)]">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-[var(--radius-md)] bg-warning/10 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
          </div>
          <div>
            <p class="text-muted-foreground uppercase tracking-wider font-semibold" style="font-size: var(--text-sm-size);">Rata-rata</p>
            <p class="font-extrabold text-foreground font-mono tabular-nums text-xl">{{ avgScore }}</p>
          </div>
        </div>
      </div>

      <!-- Highest Score -->
      <div class="bg-card border border-border rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-sm)]">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-[var(--radius-md)] bg-success/10 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div>
            <p class="text-muted-foreground uppercase tracking-wider font-semibold" style="font-size: var(--text-sm-size);">Tertinggi</p>
            <p class="font-extrabold text-foreground font-mono tabular-nums text-xl">{{ participants[0]?.score ?? '—' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Settings bar: option-count selector + tab switcher ─────────────── -->
    <div class="flex flex-wrap items-center gap-4 mb-6 bg-card border border-border rounded-[var(--radius-xl)] p-3 px-4 shadow-[var(--shadow-sm)]">
      <!-- Option-count selector (2–6) -->
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground font-semibold" style="font-size: var(--text-sm-size);">Jumlah Opsi:</span>
        <div class="flex gap-1" role="group" aria-label="Jumlah opsi jawaban">
          <button
            v-for="n in [2, 3, 4, 5, 6]"
            :key="n"
            type="button"
            @click="updateOptionCount(n)"
            class="w-8 h-8 rounded-[var(--radius-md)] text-xs font-bold transition-all duration-[var(--motion-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            :class="optionCount === n
              ? 'bg-accent text-accent-foreground shadow-[var(--shadow-sm)]'
              : 'bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'"
            :aria-pressed="optionCount === n"
            :aria-label="`${n} opsi`"
          >{{ n }}</button>
        </div>
      </div>

      <!-- Divider -->
      <div class="h-5 w-px bg-border hidden sm:block"></div>

      <!-- Tab switcher: Soal / Peserta -->
      <div class="flex gap-1 bg-muted rounded-[var(--radius-md)] p-0.5" role="tablist" aria-label="Tab konten kuis">
        <button
          role="tab"
          :aria-selected="activeTab === 'soal'"
          @click="activeTab = 'soal'"
          class="px-4 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all duration-[var(--motion-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :class="activeTab === 'soal'
            ? 'bg-card text-foreground shadow-[var(--shadow-sm)]'
            : 'text-muted-foreground hover:text-foreground'"
        >
          Soal ({{ questions.length }})
        </button>
        <button
          role="tab"
          :aria-selected="activeTab === 'peserta'"
          @click="activeTab = 'peserta'; fetchParticipants()"
          class="px-4 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all duration-[var(--motion-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :class="activeTab === 'peserta'
            ? 'bg-card text-foreground shadow-[var(--shadow-sm)]'
            : 'text-muted-foreground hover:text-foreground'"
        >
          Peserta ({{ totalParticipants }})
        </button>
      </div>
    </div>

    <!-- ── Tab: Soal ──────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'soal'" role="tabpanel" aria-label="Daftar soal" class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Question list (spans 2/3 on desktop) -->
      <div class="lg:col-span-2 space-y-3">
        <!-- Individual question card -->
        <div
          v-for="(qst, index) in questions"
          :key="qst.id"
          class="bg-card border border-border rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-sm)] transition-shadow duration-[var(--motion-base)] hover:shadow-[var(--shadow-md)]"
        >
          <!-- Question header -->
          <div class="flex justify-between items-start mb-3 gap-4">
            <h3 class="font-bold text-foreground leading-snug" style="font-size: var(--text-h3-size);">
              <span class="text-accent mr-1.5 font-mono">{{ index + 1 }}.</span>{{ qst.text }}
            </h3>
            <div class="flex items-center gap-2 shrink-0">
              <!-- Time badge -->
              <span class="inline-flex items-center gap-1 text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-[var(--radius-sm)]" style="font-size: var(--text-sm-size);">
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {{ qst.time_limit }}s
              </span>
              <!-- Delete button -->
              <button
                @click="openDeleteQuestion(qst.id)"
                class="p-1.5 rounded-[var(--radius-sm)] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-[var(--motion-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Hapus pertanyaan"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            </div>
          </div>

          <!-- Options grid — success styling on correct option (Req 6.6) -->
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="opt in qst.options"
              :key="opt.id"
              class="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] border text-sm"
              :class="opt.is_correct
                ? 'bg-success/10 border-success/30'
                : 'bg-muted border-border'"
            >
              <!-- Correct indicator dot + check -->
              <span
                class="w-2.5 h-2.5 rounded-full shrink-0"
                :class="opt.is_correct ? 'bg-success' : 'bg-muted-foreground/40'"
              ></span>
              <span
                :class="opt.is_correct
                  ? 'font-semibold text-success'
                  : 'text-muted-foreground'"
              >{{ opt.text }}</span>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="questions.length === 0" class="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-[var(--radius-xl)]">
          <div class="w-12 h-12 rounded-[var(--radius-lg)] bg-muted flex items-center justify-center mb-3">
            <svg class="w-6 h-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <p class="text-muted-foreground text-sm">Belum ada pertanyaan. Tambahkan di form sebelah kanan.</p>
        </div>
      </div>

      <!-- ── Add Question Form (sticky on desktop) ──────────────────────── -->
      <div>
        <div class="bg-card border border-border rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-md)] sticky top-6">
          <h2
            class="font-bold text-foreground mb-4"
            style="font-size: var(--text-h3-size); line-height: var(--text-h3-lh);"
          >Tambah Pertanyaan</h2>

          <form @submit.prevent="addQuestion" class="space-y-4">
            <!-- Question text -->
            <div class="space-y-1.5">
              <UiLabel for="new-question-text" class="text-muted-foreground font-semibold" style="font-size: var(--text-sm-size);">Teks Pertanyaan</UiLabel>
              <UiInput
                id="new-question-text"
                v-model="newQuestionText"
                placeholder="Tulis pertanyaan di sini..."
                required
              />
            </div>

            <!-- Time limit -->
            <div class="space-y-1.5">
              <UiLabel for="new-question-time" class="text-muted-foreground font-semibold" style="font-size: var(--text-sm-size);">Batas Waktu (detik)</UiLabel>
              <UiInput
                id="new-question-time"
                type="number"
                v-model="newQuestionTime"
                min="5"
                max="120"
                required
              />
            </div>

            <!-- Answer options -->
            <div class="space-y-2">
              <UiLabel class="text-muted-foreground font-semibold" style="font-size: var(--text-sm-size);">Opsi Jawaban</UiLabel>
              <div v-for="(opt, idx) in options" :key="idx" class="flex items-center gap-2">
                <!-- Correct marker button — success styling when selected (Req 6.6) -->
                <button
                  type="button"
                  @click="setCorrectOption(idx)"
                  class="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-[var(--motion-fast)] border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  :class="opt.is_correct
                    ? 'bg-success border-success text-success-foreground shadow-[0_0_0_3px_hsl(var(--success)/0.2)]'
                    : 'bg-muted border-border text-muted-foreground hover:border-accent hover:text-accent'"
                  :aria-label="`Tandai opsi ${['A','B','C','D','E','F'][idx]} sebagai benar`"
                  :aria-pressed="opt.is_correct"
                >
                  <!-- Check icon for correct option (non-color cue for accessibility) -->
                  <svg v-if="opt.is_correct" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span v-else>{{ ['A','B','C','D','E','F'][idx] }}</span>
                </button>
                <UiInput
                  v-model="opt.text"
                  :placeholder="`Opsi ${['A','B','C','D','E','F'][idx]}`"
                  class="flex-1"
                />
              </div>
              <p class="text-muted-foreground" style="font-size: var(--text-sm-size);">Klik huruf untuk menandai jawaban benar (hijau = benar).</p>
            </div>

            <!-- Submit -->
            <UiButton type="submit" class="w-full">
              + Tambah Pertanyaan
            </UiButton>
          </form>
        </div>
      </div>
    </div>

    <!-- ── Tab: Peserta ───────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'peserta'" role="tabpanel" aria-label="Daftar peserta">
      <div class="bg-card border border-border rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] overflow-hidden">
        <UiTable>
          <UiTableHeader>
            <UiTableRow>
              <UiTableHead class="w-16">#</UiTableHead>
              <UiTableHead>Nama</UiTableHead>
              <UiTableHead class="text-center">Skor</UiTableHead>
              <UiTableHead class="text-right">Selesai Pada</UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody>
            <UiTableRow v-for="(p, idx) in participants" :key="p.id">
              <!-- Rank cell with medal treatment for top 3 -->
              <UiTableCell>
                <span
                  v-if="idx === 0"
                  class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                  style="background-color: hsl(38 95% 55%); color: hsl(40 40% 8%);"
                  aria-label="Peringkat 1"
                >1</span>
                <span
                  v-else-if="idx === 1"
                  class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-muted-foreground/30 text-foreground"
                  aria-label="Peringkat 2"
                >2</span>
                <span
                  v-else-if="idx === 2"
                  class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                  style="background-color: hsl(25 60% 45%); color: hsl(0 0% 100%);"
                  aria-label="Peringkat 3"
                >3</span>
                <span v-else class="text-sm font-medium text-muted-foreground pl-1.5">{{ idx + 1 }}</span>
              </UiTableCell>
              <!-- Name -->
              <UiTableCell class="font-semibold text-foreground">{{ p.name }}</UiTableCell>
              <!-- Score — mono tabular-nums, accent color -->
              <UiTableCell class="text-center">
                <span class="font-bold text-accent font-mono tabular-nums">{{ p.score }}</span>
              </UiTableCell>
              <!-- Finished at -->
              <UiTableCell class="text-right text-muted-foreground" style="font-size: var(--text-sm-size);">
                {{ p.finished_at ? new Date(p.finished_at).toLocaleString('id-ID') : '—' }}
              </UiTableCell>
            </UiTableRow>
            <!-- Empty row -->
            <UiTableRow v-if="participants.length === 0">
              <UiTableCell colspan="4" class="text-center text-muted-foreground py-12">
                Belum ada peserta yang menyelesaikan kuis ini.
              </UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>
      </div>
    </div>

    <!-- ── Delete Question Confirmation ──────────────────────────────────── -->
    <UiAlertDialog v-model:open="showDeleteQuestionDialog">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Hapus Pertanyaan?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Pertanyaan ini beserta semua opsi jawabannya akan dihapus secara permanen.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel @click="showDeleteQuestionDialog = false">Batal</UiAlertDialogCancel>
          <UiAlertDialogAction @click="confirmDeleteQuestion" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">Ya, Hapus</UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>

  </div>
</template>
