<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authClient } from '../lib/auth-client'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'

const router = useRouter()

const isLogin = ref(true)
const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

const toggleMode = () => {
  isLogin.value = !isLogin.value
  error.value = ''
}

const handleSubmit = async () => {
  error.value = ''
  isLoading.value = true

  try {
    if (isLogin.value) {
      const { error: signInError } = await authClient.signIn.email({
        email: email.value,
        password: password.value,
      })
      if (signInError) {
        error.value = signInError.message || 'Login failed'
      } else {
        router.push('/')
      }
    } else {
      const { error: signUpError } = await authClient.signUp.email({
        email: email.value,
        password: password.value,
        name: name.value,
      })
      if (signUpError) {
        error.value = signUpError.message || 'Registration failed'
      } else {
        // Registration logs in automatically in better-auth
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
  <div class="flex min-h-[80vh] items-center justify-center p-4">
    <div
      class="w-full max-w-md rounded-xl border border-surface-200 bg-surface-0 p-8 shadow-xl dark:border-surface-700 dark:bg-surface-900">
      <h1 class="mb-6 text-center text-3xl font-bold tracking-tight text-primary">
        {{ isLogin ? 'Welcome Back' : 'Join Blueberry' }}
      </h1>

      <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

        <div v-if="!isLogin" class="flex flex-col gap-2">
          <label for="name" class="font-semibold text-surface-900 dark:text-surface-0">Name</label>
          <InputText id="name" v-model="name" required placeholder="John Doe" />
        </div>

        <div class="flex flex-col gap-2">
          <label for="email" class="font-semibold text-surface-900 dark:text-surface-0">Email</label>
          <InputText id="email" type="email" v-model="email" required placeholder="you@example.com" />
        </div>

        <div class="flex flex-col gap-2">
          <label for="password" class="font-semibold text-surface-900 dark:text-surface-0">Password</label>
          <InputText id="password" type="password" v-model="password" required />
        </div>

        <Button :loading="isLoading" type="submit" class="mt-4 w-full" size="large">
          {{ isLogin ? 'Sign In' : 'Sign Up' }}
        </Button>
      </form>

      <div class="mt-6 text-center text-sm text-surface-600 dark:text-surface-400">
        {{ isLogin ? "Don't have an account?" : 'Already have an account?' }}
        <button @click="toggleMode" class="ml-1 font-semibold text-primary hover:underline focus:outline-none">
          {{ isLogin ? 'Sign Up' : 'Sign In' }}
        </button>
      </div>
    </div>
  </div>
</template>
