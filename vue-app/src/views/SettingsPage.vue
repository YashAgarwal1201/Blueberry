<template>
  <div class="w-full h-full flex flex-col gap-y-4 overflow-hidden">
    <!-- Header -->
    <div class="shrink-0 flex flex-col gap-y-2">
      <div class="flex items-center gap-3">
        <GoBackButton class="w-10 h-10 shrink-0" />
        <div>
          <h1 class="font-heading text-2xl sm:text-3xl text-text">Blueberry Settings</h1>
          <p class="font-content text-text-muted">Modify your app settings.</p>
        </div>
      </div>
    </div>

    <!-- Horizontal tab nav (scrollable) -->
    <div class="shrink-0">
      <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to"
          class="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium text-text-muted border border-transparent transition-colors hover:bg-surface-2 hover:text-text whitespace-nowrap"
          active-class="bg-primary-subtle text-primary border-primary">
          {{ item.label }}
        </RouterLink>
      </div>
    </div>

    <!-- Sub-page content -->
    <div class="flex-1 overflow-y-auto">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import GoBackButton from '@/components/GoBackButton.vue'

const authStore = useAuthStore()

const navItems = computed(() => {
  const items = [
    { to: '/settings/customise-homepage', label: 'App Preferences' },
    { to: '/settings/blocked-titles', label: 'Blocked Titles' },
  ]
  if (authStore.isAdmin) {
    items.unshift({ to: '/settings/movies-added', label: 'Movies Added' })
  }
  return items
})
</script>
