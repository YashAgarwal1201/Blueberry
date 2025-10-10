<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
import { Toast } from 'primevue'
</script>

<template>
  <div
    class="w-dvw h-dvh flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-content"
  >
    <Toast />
    <div class="w-full md:w-16 h-16 md:h-full flex-shrink-0">
      <NavBar />
    </div>

    <div class="h-full flex-grow overflow-y-auto flex justify-center items-center p-2 sm:p-3">
      <RouterView />
    </div>

    <!-- <SideMenu /> -->
  </div>
</template>

<style scoped lang="css" src="./styles.css"></style>
