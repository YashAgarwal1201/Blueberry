<template>
  <div class="w-full h-full flex flex-col gap-y-6 md:gap-y-8">
    <div class="shrink-0">
      <h1 class="font-heading text-2xl sm:text-3xl text-text">Profile</h1>
      <p class="font-content text-text-muted">Manage your account and preferences.</p>
    </div>

    <!-- If not logged in -->
    <div v-if="!authStore.isAuthenticated"
      class="grow flex flex-col items-center justify-center p-8 text-center bg-surface-1 rounded-xl border border-surface-200 dark:border-surface-700">
      <UserCircle :size="48" class="text-text-muted mb-4" />
      <h2 class="text-xl font-semibold mb-2">Not Logged In</h2>
      <p class="text-text-muted mb-6">Sign in to sync your watchlist and manage your profile across devices.</p>
      <RouterLink to="/login"
        class="px-6 py-2.5 bg-primary text-on-primary rounded-full font-medium transition-colors hover:bg-primary-hover">
        Sign In / Register
      </RouterLink>
    </div>

    <!-- If logged in -->
    <div v-else class="grow flex flex-col gap-6">
      <div
        class="flex items-center gap-4 p-6 bg-surface-1 rounded-xl border border-surface-200 dark:border-surface-700">
        <div
          class="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-on-primary text-3xl font-bold uppercase">
          {{ userInitials }}
        </div>
        <div class="flex flex-col">
          <h2 class="text-2xl font-semibold text-text">{{ authStore.user?.name || 'User' }}</h2>
          <p class="text-text-muted">{{ authStore.user?.email }}</p>
          <div class="mt-2 text-xs font-medium bg-surface-3 px-2 py-1 rounded-md w-fit uppercase">
            {{ authStore.user?.role || 'User' }}
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <h3 class="font-heading text-xl">Account Actions</h3>
        <button @click="handleSignOut"
          class="w-fit flex items-center gap-2 px-6 py-2.5 bg-surface-2 text-text border border-border rounded-full hover:bg-surface-3 transition-colors">
          <LogOut :size="18" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { authClient } from '@/lib/auth-client'
import { UserCircle, LogOut } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

const userInitials = computed(() => {
  const name = authStore.user?.name || authStore.user?.email || 'U'
  return name.charAt(0).toUpperCase()
})

const handleSignOut = async () => {
  await authClient.signOut()
  router.push('/')
}
</script>
