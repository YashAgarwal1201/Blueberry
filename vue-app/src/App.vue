<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
import { Toast } from 'primevue'
import SideMenu from './components/SideMenu.vue'
</script>

<template>
  <div class="w-dvw h-dvh flex flex-col-reverse md:flex-row bg-surface-0 text-text font-content">
    <Toast />
    <div class="w-full md:w-16 h-16 md:h-full flex-shrink-0">
      <NavBar />
    </div>

    <div class="h-full flex-grow overflow-y-auto flex justify-center items-center p-2 sm:p-3">
      <RouterView />
    </div>

    <SideMenu />
  </div>
</template>

<style scoped lang="css" src="./styles.css"></style>
