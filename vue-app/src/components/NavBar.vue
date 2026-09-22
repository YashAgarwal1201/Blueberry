<template>
  <nav class="w-full h-full p-1 grid grid-cols-5 md:flex md:flex-col justify-center gap-2">
    <RouterLink
      v-for="link in navLinks"
      :key="link.to"
      :to="link.to"
      :class="[
        'cursor-pointer pointer-events-auto w-auto md:w-full h-full md:h-auto md:aspect-square rounded-xl items-center justify-center transition-colors duration-200 text-text-muted bg-surface-2 hover:bg-surface-3 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        link.mobileHidden ? 'hidden md:flex' : 'flex'
      ]"
      active-class="!bg-primary !text-on-primary !pointer-events-none !cursor-default"
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
import { usePreferencesStore } from '@/stores/preferencesStore'
import { Blocks, Home, Menu, UserSquare, UserCircle, Film, Tv } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { computed } from 'vue'

const mainStore = useMainStore()
const preferencesStore = usePreferencesStore()

const navLinks = computed(() => {
  const links = [
    { to: '/', icon: Home, mobileHidden: false },
  ]
  if (preferencesStore.showMovies) {
    links.push({ to: '/movies', icon: Film, mobileHidden: true })
  }
  if (preferencesStore.showShows) {
    links.push({ to: '/shows', icon: Tv, mobileHidden: true })
  }
  links.push({ to: '/genres', icon: Blocks, mobileHidden: false })
  if (preferencesStore.showPeople) {
    links.push({ to: '/people', icon: UserSquare, mobileHidden: false })
  }
  links.push({ to: '/profile', icon: UserCircle, mobileHidden: false })
  
  return links
})
</script>
