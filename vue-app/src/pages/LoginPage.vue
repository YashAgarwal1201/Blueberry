<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authClient } from '@/lib/auth-client'
import { Loader2, Check, X } from 'lucide-vue-next'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

// Magic Link State
const isMagicLinkMode = ref(false)
const magicLinkSent = ref(false)

const isValidEmail = computed(() => {
  if (!email.value) return true
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.value)
})

const handleLogin = async () => {
  error.value = ''

  if (!isValidEmail.value) {
    error.value = 'Please enter a valid email address.'
    return
  }

  isLoading.value = true

  try {
    if (isMagicLinkMode.value) {
      // Handle Magic Link
      const { error: magicLinkError } = await authClient.signIn.magicLink({
        email: email.value,
        callbackURL: 'http://localhost:5130/',
      })

      if (magicLinkError) {
        error.value = magicLinkError.message || 'Failed to send Magic Link.'
      } else {
        magicLinkSent.value = true
      }
    } else {
      // Handle standard Email/Password Login
      const { error: signInError } = await authClient.signIn.email({
        email: email.value,
        password: password.value,
      })

      if (signInError) {
        error.value = signInError.message || 'Login failed'
      } else {
        router.push('/')
      }
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
    <!-- Left Panel: Branding / Hero -->
    <div class="hidden lg:flex w-1/2 bg-surface-1 relative items-center justify-center overflow-hidden">
      <div class="absolute inset-0 bg-linear-to-br from-primary/20 to-purple-600/20 z-0"></div>

      <div class="relative z-10 flex flex-col items-center text-center p-12">
        <!-- Logo placeholder or icon -->
        <div class="w-48 h-48 bg-primary rounded-full blur-3xl absolute opacity-30"></div>
        <h1 class="text-5xl font-heading font-extrabold text-white mb-6 drop-shadow-lg relative z-10">Blueberry</h1>
        <p class="text-xl text-gray-300 font-content max-w-md relative z-10">
          Your personal gateway to discovering, tracking, and enjoying the world's best movies and TV shows.
        </p>
      </div>
    </div>

    <!-- Right Panel: Login Form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
      <div class="w-full max-w-md flex flex-col gap-8 relative z-10">

        <div class="flex flex-col gap-2">
          <h2 class="text-3xl font-heading font-bold text-text">Welcome Back</h2>
          <p class="text-text-muted font-content">Sign in to your account to continue</p>
        </div>

        <div v-if="magicLinkSent"
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
            <p class="text-sm text-text-muted">We've sent a magic link to {{ email }}. Click the link to instantly log
              in!</p>
          </div>
          <button @click="magicLinkSent = false" class="text-sm font-semibold text-primary hover:underline mt-2">
            Try a different method
          </button>
        </div>

        <form v-else @submit.prevent="handleLogin" class="flex flex-col gap-5">
          <!-- Error Message -->
          <div v-if="error"
            class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
            {{ error }}
          </div>

          <div class="flex flex-col gap-2 relative">
            <label for="email" class="text-sm font-semibold text-text">Email address</label>
            <div class="relative">
              <input id="email" type="email" v-model="email" required placeholder="you@example.com"
                class="w-full px-4 py-3 rounded-xl bg-surface-1 border outline-none transition-all text-text placeholder:text-text-muted"
                :class="[!isValidEmail && email ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20']" />
              <div v-if="email" class="absolute right-3 top-1/2 -translate-y-1/2">
                <Check v-if="isValidEmail" class="w-5 h-5 text-green-500" />
                <X v-else class="w-5 h-5 text-red-500" />
              </div>
            </div>
            <span v-if="!isValidEmail && email" class="text-xs text-red-500">Please enter a valid email address</span>
          </div>

          <!-- Password Field (hidden in Magic Link mode) -->
          <div v-if="!isMagicLinkMode" class="flex flex-col gap-2">
            <div class="flex justify-between items-center">
              <label for="password" class="text-sm font-semibold text-text">Password</label>
              <a href="#" @click.prevent title="Coming soon"
                class="text-xs font-semibold text-primary/50 cursor-not-allowed hover:no-underline">Forgot Password?</a>
            </div>
            <input id="password" type="password" v-model="password" :required="!isMagicLinkMode" placeholder="••••••••"
              class="px-4 py-3 rounded-xl bg-surface-1 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text" />
          </div>

          <button type="submit" :disabled="isLoading"
            class="mt-4 w-full py-3.5 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/30 hover:scale-[1.02] hover:shadow-primary/50 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none">
            <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin" />
            <span v-else>{{ isMagicLinkMode ? 'Send Magic Link' : 'Sign In' }}</span>
          </button>

          <div class="flex items-center gap-4 my-2">
            <div class="h-px bg-border flex-1"></div>
            <span class="text-xs text-text-muted uppercase font-semibold">Or</span>
            <div class="h-px bg-border flex-1"></div>
          </div>

          <!-- Toggle Mode Button (Disabled) -->
          <button type="button" title="Coming soon"
            class="w-full py-3.5 rounded-xl bg-surface-2 text-text/50 font-bold cursor-not-allowed flex items-center justify-center gap-2">
            Sign in with Magic Link
          </button>
        </form>

        <div class="text-center font-content text-sm text-text-muted">
          Don't have an account?
          <RouterLink to="/register" class="text-primary font-semibold hover:underline transition-colors">
            Create an account
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
