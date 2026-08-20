<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authClient } from '@/lib/auth-client'
import { Loader2 } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

const token = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

onMounted(() => {
  const tokenQuery = route.query.token as string
  if (tokenQuery) {
    token.value = tokenQuery
  } else {
    error.value = 'Invalid or missing reset token.'
  }
})

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

const handleResetPassword = async () => {
  error.value = ''

  if (!token.value) {
    error.value = 'Invalid or missing reset token.'
    return
  }

  if (passwordStrength.value < 5) {
    error.value = 'Password is not strong enough.'
    return
  }

  isLoading.value = true

  try {
    const { error: resetError } = await authClient.resetPassword({
      newPassword: password.value,
      token: token.value,
    })

    if (resetError) {
      error.value = resetError.message || 'Failed to reset password.'
    } else {
      router.push('/login')
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
      <div class="absolute inset-0 bg-linear-to-tr from-primary/20 to-pink-600/20 z-0"></div>

      <div class="relative z-10 flex flex-col items-center text-center p-12">
        <div class="w-48 h-48 bg-primary rounded-full blur-3xl absolute opacity-30"></div>
        <h1 class="text-5xl font-heading font-extrabold text-white mb-6 drop-shadow-lg relative z-10">Secure Your
          Account</h1>
        <p class="text-xl text-gray-300 font-content max-w-md relative z-10">
          Set a new strong password to regain access to Blueberry.
        </p>
      </div>
    </div>

    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
      <div class="w-full max-w-md flex flex-col gap-8 relative z-10 py-8">

        <div class="flex flex-col gap-2">
          <h2 class="text-3xl font-heading font-bold text-text">Reset Password</h2>
          <p class="text-text-muted font-content">Enter your new password below.</p>
        </div>

        <form @submit.prevent="handleResetPassword" class="flex flex-col gap-5">
          <div v-if="error"
            class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
            {{ error }}
          </div>

          <div class="flex flex-col gap-2">
            <label for="password" class="text-sm font-semibold text-text">New Password</label>
            <input id="password" type="password" v-model="password" required placeholder="••••••••"
              class="px-4 py-3 rounded-xl bg-surface-1 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text" />

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
            <span v-else>Update Password</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
