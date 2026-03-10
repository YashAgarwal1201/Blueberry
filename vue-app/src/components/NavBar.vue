<template>
  <nav class="w-full h-full p-1 grid grid-cols-5 md:flex md:flex-col justify-center gap-2">
    <RouterLink
      v-for="link in navLinks"
      :key="link.to"
      :to="link.to"
      class="cursor-pointer w-auto md:w-full h-full md:h-auto md:aspect-square rounded-xl flex items-center justify-center transition-colors duration-200 text-text-muted bg-surface-2 hover:bg-surface-3 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      active-class="!bg-primary !text-on-primary"
    >
      <component :is="link.icon" :size="20" />
    </RouterLink>

    <button
      class="cursor-pointer w-auto md:w-full h-full md:h-auto md:aspect-square rounded-xl bg-surface-2 text-text-muted hover:bg-surface-3 hover:text-text flex items-center justify-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      @click="mainStore.showSideMenu = true"
    >
      <Menu :size="20" />
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useMainStore } from '@/stores/mainStore'
import { Blocks, Film, Home, Menu, Wrench } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

const mainStore = useMainStore()

const navLinks = [
  { to: '/', icon: Home },
  { to: '/movies', icon: Film },
  { to: '/genres', icon: Blocks },
  { to: '/settings', icon: Wrench },
]
</script>
