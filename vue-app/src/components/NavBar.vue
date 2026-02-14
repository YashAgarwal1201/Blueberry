<template>
  <div class="w-full h-full p-1 flex flex-row md:flex-col gap-2">
    <div class="flex flex-row md:flex-col gap-2">
      <RouterLink
        to="/"
        class="cursor-pointer w-auto md:w-full h-full md:h-auto aspect-square rounded-2xl bg-indigo-700 dark:bg-indigo-600 text-white dark:text-white flex items-center justify-center"
        ><Home :size="16" />
      </RouterLink>

      <RouterLink
        to="/movies"
        class="cursor-pointer w-auto md:w-full h-full md:h-auto aspect-square rounded-2xl bg-indigo-700 dark:bg-indigo-600 text-white dark:text-white flex items-center justify-center"
        ><Film :size="16" />
      </RouterLink>

      <RouterLink
        to="/genres"
        class="cursor-pointer w-auto md:w-full h-full md:h-auto aspect-square rounded-2xl bg-indigo-700 dark:bg-indigo-600 text-white dark:text-white flex items-center justify-center"
        ><Blocks :size="16" />
      </RouterLink>

      <!-- <RouterLink
        to="/profile"
        class="cursor-pointer w-auto md:w-full h-full md:h-auto aspect-square rounded-2xl bg-indigo-700 dark:bg-indigo-600 text-white dark:text-white flex items-center justify-center"
        ><User :size="16" />
      </RouterLink> -->

      <RouterLink
        to="/settings"
        class="cursor-pointer w-auto md:w-full h-full md:h-auto aspect-square rounded-2xl bg-indigo-700 dark:bg-indigo-600 text-white dark:text-white flex items-center justify-center"
        ><Wrench :size="16" />
      </RouterLink>
    </div>

    <button
      class="ml-auto md:ml-0 mt-0 md:mt-auto cursor-pointer w-auto md:w-full h-full md:h-auto aspect-square rounded-2xl bg-indigo-700 dark:bg-indigo-600 text-white dark:text-white flex items-center justify-center"
      @click="mainStore.showSideMenu = true"
    >
      <Menu :size="16" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { useMainStore } from '@/stores/mainStore'
import { Blocks, Film, Home, Menu, Wrench } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

const mainStore = useMainStore()
</script>
