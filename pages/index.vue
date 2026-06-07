<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const code = ref('')
const name = ref('')
const isJoining = ref(false)
const errorMsg = ref('')

async function joinQuiz() {
  if (!code.value || !name.value) return
  isJoining.value = true
  errorMsg.value = ''

  let data: any = null
  let error: any = null
  try {
    data = await $fetch('/api/play/join', {
      method: 'POST',
      body: { code: code.value.toUpperCase().trim() },
    })
  } catch (e) {
    error = e
  }

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
  <!-- Full-viewport centering with single-column layout (Req 9.2) -->
  <div class="flex items-center justify-center min-h-dvh p-4">
    <div class="w-full max-w-sm space-y-8">

      <!-- ── Hero ── (Req 3.1, 2.3, 2.5) -->
      <div class="text-center space-y-4">
        <!-- BrandMark: icon tile + gradient wordmark using design tokens -->
        <div class="flex justify-center mb-2">
          <BrandMark size="lg" />
        </div>
        <p class="text-muted-foreground text-base leading-relaxed">
          Gabung kuis langsung dan uji pengetahuanmu!
        </p>
      </div>

      <!-- ── Join Card ── (Req 3.1, 3.2) -->
      <UiCard>
        <UiCardContent class="pt-6">
          <form @submit.prevent="joinQuiz" class="space-y-5">

            <!-- Name field (Req 3.2, 10.6) -->
            <div class="space-y-2">
              <UiLabel for="name">Nama Kamu</UiLabel>
              <UiInput
                id="name"
                v-model="name"
                placeholder="Masukkan nama kamu"
                required
                autocomplete="name"
                class="h-12 text-base"
              />
            </div>

            <!-- Quiz code field (Req 3.2, 10.6) -->
            <div class="space-y-2">
              <UiLabel for="code">Kode Kuis</UiLabel>
              <UiInput
                id="code"
                v-model="code"
                placeholder="ABCD"
                required
                maxlength="4"
                class="h-12 text-xl text-center font-mono uppercase tracking-widest"
                style="font-family: var(--font-mono);"
              />
              <!-- Error message — token-styled destructive (Req 3.5) -->
              <p
                v-if="errorMsg"
                role="alert"
                class="text-sm font-semibold text-destructive mt-1"
              >
                {{ errorMsg }}
              </p>
            </div>

            <!-- Submit button ≥ h-12 = 48px (Req 9.2) -->
            <!-- Loading state shows "Menghubungkan..." and disables (Req 3.4) -->
            <UiButton
              type="submit"
              :disabled="isJoining || !name || !code"
              class="w-full h-12 text-base font-bold"
            >
              <span v-if="isJoining" class="flex items-center justify-center gap-2">
                <svg
                  class="animate-spin w-5 h-5 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="12" cy="12" r="10"
                    stroke="currentColor" stroke-width="3"
                    class="opacity-25"
                  />
                  <path
                    d="M4 12a8 8 0 018-8"
                    stroke="currentColor" stroke-width="3"
                    stroke-linecap="round"
                    class="opacity-75"
                  />
                </svg>
                Menghubungkan...
              </span>
              <span v-else>Mulai Kuis</span>
            </UiButton>

          </form>
        </UiCardContent>
      </UiCard>

      <!-- ── Admin link ── (Req 3.6) -->
      <div class="text-center">
        <NuxtLink
          to="/admin"
          class="text-sm text-muted-foreground hover:text-accent transition-colors duration-[var(--motion-base)]"
        >
          Masuk sebagai Admin →
        </NuxtLink>
      </div>

    </div>
  </div>
</template>
