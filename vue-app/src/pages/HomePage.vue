<template>
  <div
    class="w-full h-full p-2 sm:p-3 flex flex-col gap-y-6 md:gap-y-8 border border-slate-200 dark:border-slate-700 rounded-xl"
  >
    <div>
      <h1 class="font-heading text-2xl sm:text-3xl text-slate-900 dark:text-slate-100">
        Welcome to Blueberry
      </h1>
      <p class="font-content text-slate-600 dark:text-slate-400">
        Choose you backend to view your movies collection.
      </p>
    </div>

    <div class="flex gap-3">
      <button
        v-for="(backend, key) in backendOptions"
        :key="key"
        :title="backend.title"
        :disabled="backend.status !== 'online'"
        @click="useBackend(backend)"
        class="disabled:opacity-70 disabled:cursor-not-allowed relative w-24 aspect-video rounded-xl flex items-center justify-center gap-x-2 cursor-pointer bg-indigo-700 dark:bg-indigo-600 text-white dark:text-white"
      >
        {{ backend.title }}

        <Check
          :size="16"
          class="absolute -top-1 -right-1 bg-green-500 rounded-full p-1"
          v-if="mainStore.backend.title === backend.title"
        />
      </button>
    </div>

    <div class="text-slate-600 dark:text-slate-400">
      Your current selected backend is,
      <span class="text-slate-900 dark:text-slate-100 underline">{{
        mainStore.backend.title && mainStore.backend.title.length
          ? mainStore.backend.title
          : 'No backend'
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
import { Check } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

const mainStore = useMainStore()

const backendOptions = ref(mainStore.backends.map((b) => ({ ...b, status: 'unknown' })))

onMounted(async () => {
  for (const b of backendOptions.value) {
    const alive = await mainStore.checkBackendHealth(b.url)
    b.status = alive ? 'online' : 'offline'
  }
})

async function useBackend(b: { status: string; url: string }) {
  if (b.status === 'online') {
    await mainStore.selectBackend(b.url)
    // navigate to dashboard
  }
}
</script>
