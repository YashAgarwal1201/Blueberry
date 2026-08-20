<script setup lang="ts">
import { ref, computed } from 'vue'
import { authClient } from '@/lib/auth-client'
import { Loader2, ArrowLeft } from 'lucide-vue-next'

const email = ref('')
const error = ref('')
const success = ref(false)
const isLoading = ref(false)

const isValidEmail = computed(() => {
  if (!email.value) return true
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.value)
})

const handleReset = async () => {
  error.value = ''

  if (!isValidEmail.value) {
    error.value = 'Please enter a valid email address.'
    return
  }

  isLoading.value = true

  try {
    const { error: resetError } = await (authClient as any).forgetPassword({
      email: email.value,
      redirectTo: 'http://localhost:5130/reset-password',
    })

    if (resetError) {
      error.value = resetError.message || 'Failed to send reset link.'
    } else {
      success.value = true
    }
  } catch (err: any) {
    error.value = err.message || 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="w-full min-h-dvh flex bg-surface-0">
    <div class="hidden lg:flex w-1/2 bg-surface-1 relative items-center justify-center overflow-hidden">
      <div class="absolute inset-0 bg-linear-to-br from-primary/20 to-purple-600/20 z-0"></div>

      <div class="relative z-10 flex flex-col items-center text-center p-12">
        <div class="w-48 h-48 bg-primary rounded-full blur-3xl absolute opacity-30"></div>
        <h1 class="text-5xl font-heading font-extrabold text-white mb-6 drop-shadow-lg relative z-10">Blueberry</h1>
        <p class="text-xl text-gray-300 font-content max-w-md relative z-10">
          Your personal gateway to discovering, tracking, and enjoying the world's best movies and TV shows.
        </p>
      </div>
    </div>

    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
      <div class="w-full max-w-md flex flex-col gap-8 relative z-10">

        <RouterLink to="/login" class="flex items-center gap-2 text-text-muted hover:text-text transition-colors w-fit">
          <ArrowLeft class="w-4 h-4" />
          <span class="text-sm font-medium">Back to login</span>
        </RouterLink>

        <div class="flex flex-col gap-2">
          <h2 class="text-3xl font-heading font-bold text-text">Forgot Password</h2>
          <p class="text-text-muted font-content">Enter your email address and we'll send you a link to reset your
            password.</p>
        </div>

        <div v-if="success"
          class="p-6 rounded-2xl bg-surface-1 border border-primary/20 flex flex-col items-center text-center gap-4">
          <div class="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                <path d="m16 19 2 2 4-4" />
              </svg>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-bold text-text mb-1">Check your email</h3>
            <p class="text-sm text-text-muted">If an account exists for {{ email }}, we've sent instructions to reset
              your password.</p>
          </div>
        </div>

        <form v-else @submit.prevent="handleReset" class="flex flex-col gap-5">
          <div v-if="error"
            class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
            {{ error }}
          </div>

          <div class="flex flex-col gap-2">
            <label for="email" class="text-sm font-semibold text-text">Email address</label>
            <input id="email" type="email" v-model="email" required placeholder="you@example.com"
              class="px-4 py-3 rounded-xl bg-surface-1 border outline-none transition-all text-text placeholder:text-text-muted"
              :class="[!isValidEmail && email ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20']" />
          </div>

          <button type="submit" :disabled="isLoading"
            class="mt-4 w-full py-3.5 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/30 hover:scale-[1.02] hover:shadow-primary/50 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none">
            <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin" />
            <span v-else>Send Reset Link</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
