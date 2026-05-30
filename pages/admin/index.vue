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
  <div class="max-w-5xl mx-auto py-10 px-4 sm:px-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
      <div>
        <NuxtLink to="/" class="text-xs text-slate-400 hover:text-violet-600 transition-colors mb-1 block">&larr; Beranda</NuxtLink>
        <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard Admin</h1>
        <p class="text-slate-500 text-sm mt-1">Halo, <span class="font-bold text-slate-700">{{ adminUsername }}</span>! Kelola kuis Anda di sini.</p>
      </div>

      <div class="flex items-center gap-3">
        <button @click="logout" class="text-sm font-semibold text-slate-500 hover:text-red-500 transition-colors px-2">Keluar</button>
        <UiDialog v-model:open="showCreateDialog">
          <UiDialogTrigger as-child>
            <UiButton class="h-11 px-5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white font-semibold shadow-lg shadow-violet-500/20 transition-all duration-200 active:scale-[0.98]">
              + Buat Kuis Baru
            </UiButton>
          </UiDialogTrigger>
        <UiDialogContent class="rounded-2xl">
          <UiDialogHeader>
            <UiDialogTitle class="text-xl font-bold">Buat Kuis Baru</UiDialogTitle>
            <UiDialogDescription class="text-slate-500">Masukkan judul untuk kuis baru Anda.</UiDialogDescription>
          </UiDialogHeader>
          <div class="py-4 space-y-4">
            <div>
              <UiLabel class="text-sm font-semibold text-slate-700">Judul Kuis</UiLabel>
              <UiInput
                v-model="newQuizTitle"
                placeholder="Cth. Dasar-dasar JavaScript"
                @keyup.enter="createQuiz"
                class="mt-1.5 h-11 rounded-xl"
              />
            </div>
            <div>
              <UiLabel class="text-sm font-semibold text-slate-700">Kode Kuis (4 karakter)</UiLabel>
              <UiInput
                v-model="newQuizCode"
                placeholder="Kosongkan untuk auto-generate"
                maxlength="4"
                class="mt-1.5 h-11 rounded-xl font-mono uppercase tracking-widest text-center text-lg"
              />
              <p class="text-[11px] text-slate-400 mt-1">Opsional. Huruf & angka saja. Jika kosong akan dibuat otomatis.</p>
            </div>
          </div>
          <UiDialogFooter>
            <UiButton variant="outline" @click="showCreateDialog = false" class="rounded-xl">Batal</UiButton>
            <UiButton @click="createQuiz" class="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-semibold">Buat</UiButton>
          </UiDialogFooter>
        </UiDialogContent>
      </UiDialog>
      </div>
    </div>

    <!-- Quiz Cards Grid -->
    <div v-if="quizzes.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="quiz in quizzes"
        :key="quiz.id"
        class="group bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md hover:border-violet-200 transition-all duration-200"
      >
        <div class="flex items-start justify-between mb-4">
          <h3 class="font-bold text-slate-800 text-lg leading-snug line-clamp-2">{{ quiz.title }}</h3>
          <div class="flex gap-1 shrink-0 ml-2">
            <button @click="openEdit(quiz)" class="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors" aria-label="Edit kuis">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button @click="openDelete(quiz.id)" class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" aria-label="Hapus kuis">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </div>

        <div class="flex gap-3 mb-4">
          <span class="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {{ quiz.questions?.[0]?.count ?? 0 }} Soal
          </span>
          <span class="inline-flex items-center gap-1 text-xs font-semibold text-fuchsia-600 bg-fuchsia-50 px-2.5 py-1 rounded-full">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            {{ quiz.participants?.[0]?.count ?? 0 }} Peserta
          </span>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <code class="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md tracking-wider">{{ quiz.code }}</code>
            <span class="text-[11px] text-slate-400">{{ new Date(quiz.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
          </div>
          <NuxtLink :to="`/admin/quiz/${quiz.id}`">
            <UiButton size="sm" class="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all active:scale-[0.97]">
              Kelola →
            </UiButton>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      </div>
      <h3 class="text-lg font-bold text-slate-700 mb-1">Belum ada kuis</h3>
      <p class="text-slate-400 text-sm max-w-xs">Buat kuis pertama Anda dengan menekan tombol di atas.</p>
    </div>

    <!-- Edit Dialog -->
    <UiDialog v-model:open="showEditDialog">
      <UiDialogContent class="rounded-2xl">
        <UiDialogHeader>
          <UiDialogTitle class="text-xl font-bold">Edit Kuis</UiDialogTitle>
          <UiDialogDescription class="text-slate-500">Ubah judul kuis di bawah ini.</UiDialogDescription>
        </UiDialogHeader>
        <div class="py-4">
          <UiLabel class="text-sm font-semibold text-slate-700">Judul Kuis</UiLabel>
          <UiInput v-model="editQuizTitle" @keyup.enter="saveEdit" class="mt-1.5 h-11 rounded-xl" />
        </div>
        <UiDialogFooter>
          <UiButton variant="outline" @click="showEditDialog = false" class="rounded-xl">Batal</UiButton>
          <UiButton @click="saveEdit" class="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-semibold">Simpan</UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>

    <!-- Delete Confirmation -->
    <UiAlertDialog v-model:open="showDeleteDialog">
      <UiAlertDialogContent class="rounded-2xl">
        <UiAlertDialogHeader>
          <UiAlertDialogTitle class="text-xl font-bold">Hapus Kuis?</UiAlertDialogTitle>
          <UiAlertDialogDescription class="text-slate-500">
            Tindakan ini tidak bisa dibatalkan. Semua pertanyaan dan data peserta juga akan dihapus permanen.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel @click="showDeleteDialog = false" class="rounded-xl">Batal</UiAlertDialogCancel>
          <UiAlertDialogAction @click="confirmDelete" class="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold">Ya, Hapus</UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
