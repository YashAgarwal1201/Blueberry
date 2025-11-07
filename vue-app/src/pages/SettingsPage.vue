<template>
  <div
    class="w-full h-full p-2 sm:p-3 flex flex-col gap-y-6 md:gap-y-8 border border-slate-200 dark:border-slate-700 rounded-xl"
  >
    <div>
      <h1 class="font-heading text-2xl sm:text-3xl text-slate-900 dark:text-slate-100">
        Blueberry Settings
      </h1>
      <p class="font-content text-slate-600 dark:text-slate-400">Modify you app settings.</p>
    </div>

    <div class="flex flex-col gap-y-4">
      <div class="flex flex-col gap-0">
        <h2 class="text-lg sm:text-xl font-heading">Choose backend</h2>
        <p class="font-content text-slate-600 dark:text-slate-400">
          Choose you backend to view your movies collection. Your current selected backend is,
          <span class="text-slate-900 dark:text-slate-100 underline">{{
            mainStore.backend.title && mainStore.backend.title.length
              ? mainStore.backend.title
              : 'No backend'
          }}</span
          >.
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
    </div>

    <div class="flex flex-col gap-y-4">
      <div class="flex flex-col gap-0">
        <h2 class="text-lg sm:text-xl font-heading">Movies added</h2>
        <p class="font-content text-slate-600 dark:text-slate-400">
          Following are the movies added by you.
        </p>
      </div>
      <div class="flex gap-3">
        <UserAddedMovies />
      </div>
    </div>

    <div class="mt-auto flex justify-end">
      <RouterLink
        to="/"
        class="px-4 py-2 rounded-full flex items-center justify-center gap-x-2 cursor-pointer bg-indigo-700 dark:bg-indigo-600 text-white dark:text-white"
        :class="{ 'pointer-events-none opacity-70': mainStore.backend.title?.length === 0 }"
        ><Home :size="16" /><span>Go home</span>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import UserAddedMovies from '@/components/UserAddedMovies.vue'
import { useMainStore } from '@/stores/mainStore'
import { Check, Home } from 'lucide-vue-next'
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
