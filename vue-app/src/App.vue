<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import NavBar from './components/NavBar.vue'
import { Toast } from 'primevue'
import SideMenu from './components/SideMenu.vue'
import ScrollToTop from './components/ScrollToTop.vue'
import { Film, Tv, AlertTriangle } from 'lucide-vue-next'
import { logger } from './services/logger'

const route = useRoute()
const appError = ref<Error | null>(null)

onErrorCaptured((err, _instance, info) => {
  logger.error('[Global Error Boundary]:', err, info)
  appError.value = err instanceof Error ? err : new Error(String(err))
  return false
})

function reloadApp() {
  appError.value = null
  window.location.reload()
}
</script>

<template>
  <div class="relative w-dvw h-dvh flex flex-col-reverse md:flex-row bg-surface-0 text-text font-content">
    <Toast />
    <div v-if="!route.meta.hideSidebar" class="w-full md:w-16 h-16 md:h-full shrink-0 z-40">
      <NavBar />
    </div>

    <!-- Floating Pills for Mobile -->
    <div v-if="route.name === 'Home'"
      class="md:hidden absolute bottom-20 w-full flex justify-center gap-4 pointer-events-none z-50">
      <RouterLink to="/movies"
        class="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-surface-2/80 text-text font-medium shadow-lg hover:bg-surface-3 transition-colors border border-border/50"
        active-class="!bg-primary !text-on-primary !border-primary">
        <Film :size="18" />
        <span>Movies</span>
      </RouterLink>
      <RouterLink to="/shows"
        class="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-surface-2/80 text-text font-medium shadow-lg hover:bg-surface-3 transition-colors border border-border/50"
        active-class="!bg-primary !text-on-primary !border-primary">
        <Tv :size="18" />
        <span>Shows</span>
      </RouterLink>
    </div>

    <!-- Global Error Boundary Fallback -->
    <div
      v-if="appError"
      class="h-full grow flex flex-col items-center justify-center p-6 text-center gap-4"
    >
      <div class="w-14 h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 shadow-lg">
        <AlertTriangle :size="28" />
      </div>
      <h2 class="text-xl font-heading font-bold text-text">Something went wrong</h2>
      <p class="text-text-muted text-sm max-w-md">
        {{ appError.message || 'An unexpected error occurred while rendering the page.' }}
      </p>
      <button
        @click="reloadApp"
        class="px-5 py-2.5 bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors shadow-md"
      >
        Reload Page
      </button>
    </div>

    <div
      v-else
      class="h-full grow overflow-y-auto flex justify-center items-center"
      :class="route.meta.hideSidebar ? '' : 'p-2 sm:p-3'"
    >
      <RouterView v-slot="{ Component }">
        <transition name="page-slide-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </div>

    <SideMenu v-if="!route.meta.hideSidebar" />
    <ScrollToTop />
  </div>
</template>
