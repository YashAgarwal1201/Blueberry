<template>
  <div
    class="w-full h-full p-2 sm:p-3 flex flex-col gap-y-6 md:gap-y-8 border border-slate-200 dark:border-slate-700 rounded-xl"
  >
    <div class="flex-shrink-0">
      <h1 class="font-heading text-2xl sm:text-3xl text-slate-900 dark:text-slate-100">
        Dashboard
      </h1>
      <p class="font-content text-slate-600 dark:text-slate-400">
        View your movies collection
        {{ mainStore.backend.title.length ? 'from ' + mainStore.backend.title + ' backend' : '' }}
      </p>
    </div>

    <UserAddedMovies />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useMoviesStore } from '@/stores/moviesStore'
import { useMainStore } from '@/stores/mainStore'
import { useRouter } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import toastHandler from '@/composables/toastHandeler'
import UserAddedMovies from '@/components/UserAddedMovies.vue'

const moviesStore = useMoviesStore()
const mainStore = useMainStore()
const router = useRouter()
const showToast = toastHandler().showToast

// Global filter
const globalFilter = ref<string | null>(null)
const filters = ref({
  global: { value: '', matchMode: FilterMatchMode.CONTAINS },
  title: { value: '', matchMode: FilterMatchMode.CONTAINS },
  description: { value: '', matchMode: FilterMatchMode.CONTAINS },
})

watch(globalFilter, (val) => {
  filters.value.global.value = val ?? ''
})

// Reactive movie list
const movies = computed(() => moviesStore.movies)

// Lifecycle
onMounted(() => {
  if (mainStore.backend.url?.trim() !== '') {
    if (movies.value.length < 1) moviesStore.fetchMovies()
  } else {
    showToast('warn', 'Warning', 'No backend selected. Navigating to home page.')
    router.push('/')
  }
})

onMounted(() => {
  const checkInterval = setInterval(async () => {
    const isAlive = await mainStore.checkBackendHealth(mainStore.backend.url)
    if (!isAlive) {
      showToast('error', 'Disconnected', 'Backend went offline. Redirecting home...')
      router.push('/')
    }
  }, 10000) // check every 10s

  onUnmounted(() => clearInterval(checkInterval))
})
</script>

<style scoped>
:deep(.p-dialog-header) {
  font-weight: 600;
}
</style>
