import { defineStore } from 'pinia'
import { ref, watchEffect } from 'vue'
import { authClient } from '../lib/auth-client'

export const useAuthStore = defineStore('auth', () => {
  const session = authClient.useSession()
  
  const isAuthenticated = ref(false)
  const user = ref<Record<string, unknown> | null>(null)
  const isAuthLoading = ref(true)

  watchEffect(() => {
    isAuthLoading.value = session.value.isPending
    if (session.value.data) {
      isAuthenticated.value = true
      user.value = session.value.data.user
    } else {
      isAuthenticated.value = false
      user.value = null
    }
  })

  return {
    isAuthenticated,
    user,
    isAuthLoading,
    session
  }
})
