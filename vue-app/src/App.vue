<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import NavBar from './components/NavBar.vue'
import { Toast } from 'primevue'
import SideMenu from './components/SideMenu.vue'

const route = useRoute()
</script>

<template>
  <div class="w-dvw h-dvh flex flex-col-reverse md:flex-row bg-surface-0 text-text font-content">
    <Toast />
    <div v-if="!route.meta.hideSidebar" class="w-full md:w-16 h-16 md:h-full shrink-0">
      <NavBar />
    </div>

    <div class="h-full grow overflow-y-auto flex justify-center items-center" :class="route.meta.hideSidebar ? '' : 'p-2 sm:p-3'">
      <RouterView v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </div>

    <SideMenu v-if="!route.meta.hideSidebar" />
  </div>
</template>

<style scoped lang="css" src="./styles.css"></style>
