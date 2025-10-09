<template>
  <div
    class="w-full h-full p-2 sm:p-3 flex flex-col gap-y-6 md:gap-y-8 border border-slate-200 dark:border-slate-700 rounded-xl"
  >
    <div>
      <h1 class="font-heading text-2xl sm:text-3xl text-slate-900 dark:text-slate-100">
        Welcome to blueberry
      </h1>
      <p class="font-content text-slate-600 dark:text-slate-400">Choose you backend.</p>
    </div>

    <div class="flex gap-3">
      <button
        v-for="(backend, key) in backendList"
        :key="key"
        :title="backend.title"
        @click="mainStore.backend = backend"
        class="w-24 aspect-video rounded-xl flex items-center justify-center gap-x-2 cursor-pointer bg-indigo-700 dark:bg-indigo-600 text-white dark:text-white"
      >
        {{ backend.title }}
      </button>
    </div>

    <div class="text-slate-600 dark:text-slate-400">
      Current selected backend is,
      <span class="text-slate-900 dark:text-slate-100 underline">{{
        mainStore.backend.title ?? 'N/A'
      }}</span
      >.
    </div>

    <div class="mt-auto flex justify-end">
      <RouterLink
        to="/dashboard"
        class="px-4 py-2 rounded-full flex items-center justify-center gap-x-2 cursor-pointer bg-indigo-700 dark:bg-indigo-600 text-white dark:text-white"
        :class="{ 'pointer-events-none opacity-70': mainStore.backend.title?.length === 0 }"
        >Go to dashboard</RouterLink
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMainStore } from '@/stores/mainStore'
import { RouterLink } from 'vue-router'

const backendList = [
  {
    title: 'Express',
    url: 'http://localhost:8100',
  },
  {
    title: 'Fast API',
    url: 'http://localhost:8000',
  },
]

const mainStore = useMainStore()
</script>
