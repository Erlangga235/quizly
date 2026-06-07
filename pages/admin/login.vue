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
  <!-- Full-viewport centering — single column, scrollable on small heights -->
  <div class="flex flex-col items-center justify-center min-h-dvh p-4 gap-6">

    <!-- Auth card (max-w-sm keeps it narrow on all viewports → single-column mobile) -->
    <UiCard class="w-full max-w-sm shadow-lg">
      <div class="p-6 space-y-6">

        <!-- BrandMark + back link -->
        <div class="flex flex-col items-center gap-4">
          <NuxtLink
            to="/"
            class="self-start text-xs text-muted-foreground hover:text-accent transition-colors"
            style="transition-duration: var(--motion-base); transition-timing-function: var(--ease-standard);"
          >
            &larr; Beranda
          </NuxtLink>

          <BrandMark size="md" class="mx-auto" />
        </div>

        <!-- Mode-dependent heading & description -->
        <div class="text-center space-y-1">
          <h1
            class="text-foreground font-extrabold tracking-tight"
            style="font-size: var(--text-h1-size); line-height: var(--text-h1-lh); font-weight: var(--text-h1-weight);"
          >
            {{ mode === 'login' ? 'Masuk Admin' : 'Buat Akun Admin' }}
          </h1>
          <p class="text-muted-foreground text-sm">
            {{ mode === 'login' ? 'Masuk untuk mengelola kuis Anda.' : 'Daftar akun baru untuk membuat kuis.' }}
          </p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4" novalidate>

          <!-- Username field -->
          <div class="space-y-1.5">
            <UiLabel for="username">Username</UiLabel>
            <UiInput
              id="username"
              v-model="username"
              placeholder="Masukkan username"
              required
              autocomplete="username"
              class="h-12 text-base"
            />
          </div>

          <!-- Password field -->
          <div class="space-y-1.5">
            <UiLabel for="password">Password</UiLabel>
            <UiInput
              id="password"
              v-model="password"
              type="password"
              placeholder="Masukkan password"
              required
              autocomplete="current-password"
              class="h-12 text-base"
            />
          </div>

          <!-- Error message -->
          <p
            v-if="errorMsg"
            role="alert"
            class="text-sm font-semibold text-destructive"
          >
            {{ errorMsg }}
          </p>

          <!-- Submit button -->
          <UiButton
            type="submit"
            :disabled="isLoading || !username || !password"
            class="w-full h-12 text-base font-bold"
          >
            <span v-if="isLoading" class="flex items-center justify-center gap-2">
              <!-- Spinner -->
              <svg
                class="animate-spin w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="opacity-75" />
              </svg>
              <span class="sr-only">Memuat…</span>
            </span>
            <span v-else>{{ mode === 'login' ? 'Masuk' : 'Buat Akun' }}</span>
          </UiButton>
        </form>

        <!-- Mode toggle — clears error via inline handler (preserved from original) -->
        <div class="text-center">
          <button
            type="button"
            @click="mode = mode === 'login' ? 'register' : 'login'; errorMsg = ''"
            class="text-sm text-muted-foreground hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            style="transition-duration: var(--motion-base); transition-timing-function: var(--ease-standard);"
          >
            {{ mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk' }}
          </button>
        </div>

      </div>
    </UiCard>

  </div>
</template>
