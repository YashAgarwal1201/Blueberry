<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import NavBar from './components/NavBar.vue'
import { Toast } from 'primevue'
import SideMenu from './components/SideMenu.vue'
import { Film, Tv } from 'lucide-vue-next'

const route = useRoute()
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

    <div class="h-full grow overflow-y-auto flex justify-center items-center"
      :class="route.meta.hideSidebar ? '' : 'p-2 sm:p-3'">
      <RouterView v-slot="{ Component }">
        <transition name="page-slide-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </div>

    <SideMenu v-if="!route.meta.hideSidebar" />
  </div>
</template>

<style scoped lang="css" src="./styles/index.css"></style>
