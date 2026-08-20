<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authClient } from '@/lib/auth-client'
import { Loader2, Check, X } from 'lucide-vue-next'

const router = useRouter()
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

const passwordStrength = computed(() => {
  let score = 0;
  if (!password.value) return 0;
  if (password.value.length >= 8) score += 1;
  if (/[A-Z]/.test(password.value)) score += 1;
  if (/[a-z]/.test(password.value)) score += 1;
  if (/[0-9]/.test(password.value)) score += 1;
  if (/[^A-Za-z0-9]/.test(password.value)) score += 1;
  return score;
})

const strengthText = computed(() => {
  if (passwordStrength.value === 0) return ''
  if (passwordStrength.value <= 2) return 'Weak'
  if (passwordStrength.value <= 4) return 'Good'
  return 'Strong'
})

const strengthColorClass = computed(() => {
  if (passwordStrength.value <= 2) return 'bg-red-500'
  if (passwordStrength.value <= 4) return 'bg-yellow-500'
  return 'bg-green-500'
})

const isValidEmail = computed(() => {
  if (!email.value) return true
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.value)
})

const handleRegister = async () => {
  error.value = ''

  if (!isValidEmail.value) {
    error.value = 'Please enter a valid email address.'
    return
  }

  if (passwordStrength.value < 5) {
    error.value = 'Password is not strong enough. It must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.'
    return
  }

  isLoading.value = true

  try {
    const fullName = `${firstName.value.trim()} ${lastName.value.trim()}`

    const { error: signUpError } = await authClient.signUp.email({
      email: email.value,
      password: password.value,
      name: fullName,
    })

    if (signUpError) {
      error.value = signUpError.message || 'Registration failed'
    } else {
      router.push('/')
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
      <div class="absolute inset-0 bg-linear-to-tr from-primary/20 to-pink-600/20 z-0"></div>

      <div class="relative z-10 flex flex-col items-center text-center p-12">
        <div class="w-48 h-48 bg-primary rounded-full blur-3xl absolute opacity-30"></div>
        <h1 class="text-5xl font-heading font-extrabold text-white mb-6 drop-shadow-lg relative z-10">Join Blueberry
        </h1>
        <p class="text-xl text-gray-300 font-content max-w-md relative z-10">
          Start your journey today. Keep track of what you watch, discover new favorites, and share with friends.
        </p>
      </div>
    </div>

    <!-- Right Panel: Registration Form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
      <div class="w-full max-w-md flex flex-col gap-8 relative z-10 py-8">

        <div class="flex flex-col gap-2">
          <h2 class="text-3xl font-heading font-bold text-text">Create Account</h2>
          <p class="text-text-muted font-content">Sign up to get started</p>
        </div>

        <form @submit.prevent="handleRegister" class="flex flex-col gap-5">
          <!-- Error Message -->
          <div v-if="error"
            class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
            {{ error }}
          </div>

          <div class="flex flex-col sm:flex-row gap-5">
            <div class="flex flex-col gap-2 w-full">
              <label for="firstName" class="text-sm font-semibold text-text">First Name</label>
              <input id="firstName" type="text" v-model="firstName" required placeholder="John"
                class="px-4 py-3 rounded-xl bg-surface-1 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text placeholder:text-text-muted" />
            </div>

            <div class="flex flex-col gap-2 w-full">
              <label for="lastName" class="text-sm font-semibold text-text">Last Name</label>
              <input id="lastName" type="text" v-model="lastName" required placeholder="Doe"
                class="px-4 py-3 rounded-xl bg-surface-1 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text placeholder:text-text-muted" />
            </div>
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

          <div class="flex flex-col gap-2">
            <label for="password" class="text-sm font-semibold text-text">Password</label>
            <input id="password" type="password" v-model="password" required placeholder="••••••••"
              class="px-4 py-3 rounded-xl bg-surface-1 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text" />

            <!-- Password Strength Indicator -->
            <div v-if="password" class="mt-2 flex flex-col gap-1">
              <div class="flex justify-between items-center text-xs">
                <span class="text-text-muted font-medium">Password strength</span>
                <span :class="[
                  passwordStrength <= 2 ? 'text-red-500' :
                    passwordStrength <= 4 ? 'text-yellow-500' : 'text-green-500',
                  'font-bold'
                ]">{{ strengthText }}</span>
              </div>
              <div class="flex gap-1 h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                <div v-for="i in 5" :key="i" class="h-full w-1/5 transition-all duration-300"
                  :class="i <= passwordStrength ? strengthColorClass : 'bg-transparent'">
                </div>
              </div>
              <p class="text-[10px] text-text-muted mt-1 leading-tight">
                Must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.
              </p>
            </div>
          </div>

          <button type="submit" :disabled="isLoading"
            class="mt-4 w-full py-3.5 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/30 hover:scale-[1.02] hover:shadow-primary/50 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none">
            <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin" />
            <span v-else>Create Account</span>
          </button>
        </form>

        <div class="text-center font-content text-sm text-text-muted">
          Already have an account?
          <RouterLink to="/login" class="text-primary font-semibold hover:underline transition-colors">
            Sign In
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
