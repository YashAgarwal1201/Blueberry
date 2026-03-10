<template>
  <div class="h-full flex flex-col gap-y-6">
    <div class="flex flex-col gap-0">
      <h2 class="text-lg sm:text-xl font-heading">Choose backend</h2>
      <p class="font-content text-text-muted">
        Choose your backend to view your movies collection. Your current selected backend is,
        <span class="text-text underline">{{
          mainStore.backend.title && mainStore.backend.title.length
            ? mainStore.backend.title
            : 'No backend'
        }}</span
        >.
      </p>
    </div>

    <div class="flex gap-3 flex-wrap">
      <button
        v-for="(backend, key) in backendOptions"
        :key="key"
        :title="backend.title"
        :disabled="backend.status !== 'online'"
        @click="useBackend(backend)"
        class="disabled:opacity-70 disabled:cursor-not-allowed relative w-24 aspect-video rounded-xl flex items-center justify-center gap-x-2 cursor-pointer bg-primary text-on-primary"
      >
        {{ backend.title }}
        <Check
          :size="16"
          class="absolute -top-1 -right-1 bg-green-500 rounded-full p-1"
          v-if="mainStore.backend.title === backend.title"
        />
      </button>
    </div>

    <div class="mt-auto flex justify-end">
      <RouterLink
        to="/"
        class="px-4 py-2 rounded-full flex items-center justify-center gap-x-2 cursor-pointer bg-primary text-on-primary"
        :class="{ 'pointer-events-none opacity-70': mainStore.backend.title?.length === 0 }"
      >
        <Home :size="16" /><span>Go home</span>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  if (b.status === 'online') await mainStore.selectBackend(b.url)
}
</script>
