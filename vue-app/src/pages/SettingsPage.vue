<template>
  <div class="w-full h-full flex flex-col gap-y-4 border border-border rounded-xl overflow-hidden">
    <!-- Header -->
    <div class="flex-shrink-0 p-2 sm:p-3 pb-0">
      <h1 class="font-heading text-2xl sm:text-3xl text-text">Blueberry Settings</h1>
      <p class="font-content text-text-muted">Modify your app settings.</p>
    </div>

    <!-- Horizontal tab nav (scrollable) -->
    <div class="flex-shrink-0 px-2 sm:px-3">
      <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium text-text-muted border border-transparent transition-colors hover:bg-surface-2 hover:text-text whitespace-nowrap"
          active-class="bg-primary-subtle text-primary border-primary"
        >
          {{ item.label }}
        </RouterLink>
      </div>
    </div>

    <!-- Sub-page content -->
    <div class="flex-1 overflow-y-auto p-2 sm:p-3 pt-0">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

const navItems = [
  { to: '/settings/backend', label: 'Backend' },
  { to: '/settings/movies-added', label: 'Movies Added' },
  { to: '/settings/customise-homepage', label: 'Customise Home' },
]
</script>
