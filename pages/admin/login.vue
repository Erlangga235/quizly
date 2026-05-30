<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const username = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const mode = ref<'login' | 'register'>('login')

async function handleSubmit() {
  if (!username.value || !password.value) return
  isLoading.value = true
  errorMsg.value = ''

  const endpoint = mode.value === 'register' ? '/api/auth/register' : '/api/auth/login'

  try {
    const result = await $fetch(endpoint, {
      method: 'POST',
      body: { username: username.value, password: password.value }
    })

    localStorage.setItem('adminToken', result.token)
    localStorage.setItem('adminId', result.id)
    localStorage.setItem('adminUsername', result.username)
    router.push('/admin')
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'Terjadi kesalahan.'
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-dvh p-4">
    <div class="w-full max-w-sm space-y-8">
      <!-- Header -->
      <div class="text-center space-y-2">
        <NuxtLink to="/" class="text-xs text-slate-400 hover:text-violet-600 transition-colors">&larr; Beranda</NuxtLink>
        <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">
          {{ mode === 'login' ? 'Masuk Admin' : 'Buat Akun Admin' }}
        </h1>
        <p class="text-slate-500 text-sm">
          {{ mode === 'login' ? 'Masuk untuk mengelola kuis Anda.' : 'Daftar akun baru untuk membuat kuis.' }}
        </p>
      </div>

      <!-- Form Card -->
      <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-900/[0.04] border border-slate-200/60 p-6">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-1.5">
            <UiLabel for="username" class="text-sm font-semibold text-slate-700">Username</UiLabel>
            <UiInput
              id="username"
              v-model="username"
              placeholder="Masukkan username"
              required
              autocomplete="username"
              class="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white placeholder:text-slate-400 text-base transition-colors"
            />
          </div>
          <div class="space-y-1.5">
            <UiLabel for="password" class="text-sm font-semibold text-slate-700">Password</UiLabel>
            <UiInput
              id="password"
              v-model="password"
              type="password"
              placeholder="Masukkan password"
              required
              autocomplete="current-password"
              class="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white placeholder:text-slate-400 text-base transition-colors"
            />
          </div>

          <p v-if="errorMsg" class="text-sm font-semibold text-red-500">{{ errorMsg }}</p>

          <UiButton
            type="submit"
            :disabled="isLoading || !username || !password"
            class="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white font-bold text-base shadow-lg shadow-violet-500/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="opacity-75" />
              </svg>
            </span>
            <span v-else>{{ mode === 'login' ? 'Masuk' : 'Buat Akun' }}</span>
          </UiButton>
        </form>

        <div class="mt-4 text-center">
          <button
            @click="mode = mode === 'login' ? 'register' : 'login'; errorMsg = ''"
            class="text-sm text-slate-500 hover:text-violet-600 transition-colors"
          >
            {{ mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
