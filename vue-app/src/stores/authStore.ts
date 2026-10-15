import { defineStore } from 'pinia'
import { ref, watchEffect, computed } from 'vue'
import { authClient } from '../lib/auth-client'
import type { User, UserRole } from 'shared-types'

export const useAuthStore = defineStore('auth', () => {
  const session = authClient.useSession()
  
  const isAuthenticated = ref(false)
  const user = ref<User | null>(null)
  const isAuthLoading = ref(true)

  watchEffect(() => {
    isAuthLoading.value = session.value.isPending
    if (session.value.data) {
      isAuthenticated.value = true
      user.value = session.value.data.user as unknown as User
    } else {
      isAuthenticated.value = false
      user.value = null
    }
  })

  const userRole = computed<UserRole>(() => (user.value?.role as UserRole) || 'user')
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isModerator = computed(() => user.value?.role === 'admin' || user.value?.role === 'moderator')
  const isBanned = computed(() => !!user.value?.banned)

  function hasRole(allowed: UserRole | UserRole[]): boolean {
    const roles = Array.isArray(allowed) ? allowed : [allowed]
    return roles.includes(userRole.value)
  }

  return {
    isAuthenticated,
    user,
    userRole,
    isAdmin,
    isModerator,
    isBanned,
    hasRole,
    isAuthLoading,
    session,
  }
})
