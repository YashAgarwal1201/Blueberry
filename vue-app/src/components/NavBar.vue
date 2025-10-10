<template>
  <div class="w-full h-full p-1">
    <RouterLink
      to="/"
      class="w-auto md:w-full h-full md:h-auto aspect-square rounded-2xl bg-indigo-700 dark:bg-indigo-600 text-white dark:text-white flex items-center justify-center"
      ><Home :size="16" />
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { Home } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
</script>
