<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({ middleware: 'admin-auth' })

const router = useRouter()
const adminUsername = ref('')
const adminToken = ref('')

function authHeaders() {
  return { Authorization: `Bearer ${adminToken.value}` }
}

onMounted(() => {
  adminUsername.value = localStorage.getItem('adminUsername') || 'Admin'
  adminToken.value = localStorage.getItem('adminToken') || ''
  fetchQuizzes()
})

function logout() {
  localStorage.removeItem('adminToken')
  localStorage.removeItem('adminId')
  localStorage.removeItem('adminUsername')
  router.push('/admin/login')
}
const quizzes = ref([])
const newQuizTitle = ref('')
const newQuizCode = ref('')
const editQuizId = ref('')
const editQuizTitle = ref('')
const deleteQuizId = ref('')
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)

async function fetchQuizzes() {
  if (!adminToken.value) return
  try {
    quizzes.value = await $fetch('/api/admin/quizzes', { headers: authHeaders() })
  } catch {
    quizzes.value = []
  }
}

async function createQuiz() {
  if (!newQuizTitle.value) return
  try {
    const data = await $fetch('/api/admin/quizzes', {
      method: 'POST',
      headers: authHeaders(),
      body: { title: newQuizTitle.value, code: newQuizCode.value.trim() },
    })
    newQuizTitle.value = ''
    newQuizCode.value = ''
    showCreateDialog.value = false
    router.push(`/admin/quiz/${data.id}`)
  } catch {}
}

function openEdit(quiz: any) {
  editQuizId.value = quiz.id
  editQuizTitle.value = quiz.title
  showEditDialog.value = true
}

async function saveEdit() {
  if (!editQuizTitle.value) return
  try {
    await $fetch(`/api/admin/quizzes/${editQuizId.value}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: { title: editQuizTitle.value },
    })
    showEditDialog.value = false
    await fetchQuizzes()
  } catch {}
}

function openDelete(quizId: string) {
  deleteQuizId.value = quizId
  showDeleteDialog.value = true
}

async function confirmDelete() {
  try {
    await $fetch(`/api/admin/quizzes/${deleteQuizId.value}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    showDeleteDialog.value = false
    await fetchQuizzes()
  } catch {}
}
</script>

<template>
  <div class="min-h-screen bg-background">

    <!-- ── Header bar ──────────────────────────────────────────────────── -->
    <header class="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm shadow-sm">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        <!-- Brand + greeting -->
        <div class="flex items-center gap-3 min-w-0">
          <!-- Quizly wordmark tile -->
          <div class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center [background:var(--gradient-brand)] shadow-brand">
            <span class="text-accent text-sm font-black font-display tracking-tight leading-none">Q</span>
          </div>
          <div class="min-w-0 hidden sm:block">
            <p class="text-xs text-muted-foreground leading-none mb-0.5">Dashboard</p>
            <p class="text-sm font-semibold text-foreground truncate">
              Halo, <span class="text-accent">{{ adminUsername }}</span>
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 shrink-0">
          <!-- Keluar button -->
          <UiButton
            variant="ghost"
            size="sm"
            class="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            @click="logout"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Keluar</span>
          </UiButton>

          <!-- + Buat Kuis Baru — Create dialog trigger -->
          <UiDialog v-model:open="showCreateDialog">
            <UiDialogTrigger as-child>
              <UiButton class="gap-1.5">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span>Buat Kuis Baru</span>
              </UiButton>
            </UiDialogTrigger>

            <!-- Create quiz dialog content -->
            <UiDialogContent>
              <UiDialogHeader>
                <UiDialogTitle>Buat Kuis Baru</UiDialogTitle>
                <UiDialogDescription>Masukkan judul untuk kuis baru Anda.</UiDialogDescription>
              </UiDialogHeader>

              <div class="py-4 space-y-4">
                <div class="space-y-1.5">
                  <UiLabel for="new-quiz-title">Judul Kuis</UiLabel>
                  <UiInput
                    id="new-quiz-title"
                    v-model="newQuizTitle"
                    placeholder="Cth. Dasar-dasar JavaScript"
                    @keyup.enter="createQuiz"
                  />
                </div>
                <div class="space-y-1.5">
                  <UiLabel for="new-quiz-code">Kode Kuis (4 karakter)</UiLabel>
                  <UiInput
                    id="new-quiz-code"
                    v-model="newQuizCode"
                    placeholder="Kosongkan untuk auto-generate"
                    maxlength="4"
                    class="font-mono uppercase tracking-widest text-center"
                  />
                  <p class="text-xs text-muted-foreground">Opsional. Huruf &amp; angka saja. Jika kosong akan dibuat otomatis.</p>
                </div>
              </div>

              <UiDialogFooter>
                <UiButton variant="outline" @click="showCreateDialog = false">Batal</UiButton>
                <UiButton @click="createQuiz">Buat</UiButton>
              </UiDialogFooter>
            </UiDialogContent>
          </UiDialog>
        </div>
      </div>
    </header>

    <!-- ── Main content ────────────────────────────────────────────────── -->
    <main class="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      <!-- Page title row -->
      <div class="mb-8">
        <h1 class="text-2xl font-extrabold text-foreground tracking-tight">Kuis Saya</h1>
        <p class="text-sm text-muted-foreground mt-1">Kelola semua kuis Anda dari sini.</p>
      </div>

      <!-- ── Quiz cards grid ───────────────────────────────────────────── -->
      <div v-if="quizzes.length > 0" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <UiCard
          v-for="quiz in quizzes"
          :key="quiz.id"
          class="group flex flex-col p-5 gap-0 transition-all duration-[var(--motion-base)] ease-[var(--ease-standard)] hover:shadow-brand hover:border-accent/40"
        >
          <!-- Card header: title + action buttons -->
          <div class="flex items-start justify-between gap-2 mb-4">
            <h3
              class="font-bold text-foreground leading-snug line-clamp-2"
              style="font-size: var(--text-h3-size); line-height: var(--text-h3-lh);"
            >
              {{ quiz.title }}
            </h3>
            <div class="flex gap-1 shrink-0">
              <button
                @click="openEdit(quiz)"
                class="p-1.5 rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors duration-[var(--motion-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                aria-label="Edit kuis"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                @click="openDelete(quiz.id)"
                class="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-[var(--motion-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                aria-label="Hapus kuis"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Stats badges -->
          <div class="flex flex-wrap gap-2 mb-4">
            <span class="inline-flex items-center gap-1 text-xs font-semibold text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-[var(--radius-pill)]">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              {{ quiz.questions?.[0]?.count ?? 0 }} Soal
            </span>
            <span class="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-[var(--radius-pill)]">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              {{ quiz.participants?.[0]?.count ?? 0 }} Peserta
            </span>
          </div>

          <!-- Code + date + manage button -->
          <div class="mt-auto flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <code class="font-mono font-bold text-accent text-sm bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-[var(--radius-sm)] tracking-widest tabular-nums">
                {{ quiz.code }}
              </code>
              <span class="text-xs text-muted-foreground truncate">
                {{ new Date(quiz.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
              </span>
            </div>
            <NuxtLink :to="`/admin/quiz/${quiz.id}`" class="shrink-0">
              <UiButton size="sm" class="gap-1">
                <span>Kelola</span>
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
                </svg>
              </UiButton>
            </NuxtLink>
          </div>
        </UiCard>
      </div>

      <!-- ── Empty state ───────────────────────────────────────────────── -->
      <div v-else class="flex flex-col items-center justify-center py-24 text-center">
        <div class="w-16 h-16 rounded-[var(--radius-xl)] bg-muted border border-border flex items-center justify-center mb-5 shadow-md">
          <svg class="w-8 h-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-foreground mb-2">Belum ada kuis</h3>
        <p class="text-sm text-muted-foreground max-w-xs">Buat kuis pertama Anda dengan menekan tombol "Buat Kuis Baru" di atas.</p>
      </div>
    </main>

    <!-- ── Edit dialog ─────────────────────────────────────────────────── -->
    <UiDialog v-model:open="showEditDialog">
      <UiDialogContent>
        <UiDialogHeader>
          <UiDialogTitle>Edit Kuis</UiDialogTitle>
          <UiDialogDescription>Ubah judul kuis di bawah ini.</UiDialogDescription>
        </UiDialogHeader>

        <div class="py-4 space-y-1.5">
          <UiLabel for="edit-quiz-title">Judul Kuis</UiLabel>
          <UiInput
            id="edit-quiz-title"
            v-model="editQuizTitle"
            @keyup.enter="saveEdit"
          />
        </div>

        <UiDialogFooter>
          <UiButton variant="outline" @click="showEditDialog = false">Batal</UiButton>
          <UiButton @click="saveEdit">Simpan</UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>

    <!-- ── Delete confirmation alert dialog ───────────────────────────── -->
    <UiAlertDialog v-model:open="showDeleteDialog">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Hapus Kuis?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Tindakan ini tidak bisa dibatalkan. Semua pertanyaan dan data peserta juga akan dihapus permanen.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel @click="showDeleteDialog = false">Batal</UiAlertDialogCancel>
          <UiAlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/40"
            @click="confirmDelete"
          >
            Ya, Hapus
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>

  </div>
</template>
