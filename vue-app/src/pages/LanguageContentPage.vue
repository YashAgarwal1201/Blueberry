<template>
  <div class="w-full h-full flex flex-col gap-y-6 md:gap-y-8 overflow-y-auto">
    <!-- Header Hero -->
    <div
      class="relative w-full h-40 sm:h-56 rounded-xl overflow-hidden bg-surface-2 shadow-inner flex items-center justify-center">
      <div class="absolute inset-0 bg-linear-to-br from-indigo-500/80 to-cyan-500/80 backdrop-blur-sm z-0"></div>

      <div class="relative z-10 flex flex-col items-center gap-2">
        <h1 class="font-heading text-4xl sm:text-5xl font-bold text-white drop-shadow-md capitalize">
          {{ language?.native_script || language?.name || code }}
        </h1>
        <p v-if="language?.native_script" class="font-content text-white/80 font-medium text-sm sm:text-base">
          {{ language.name }} · {{ language.native_script }}
        </p>
        <p v-else class="font-content text-white/80 font-medium text-sm sm:text-base">
          Explore movies in this language
        </p>
      </div>

      <div class="absolute top-4 left-4 z-20">
        <GoBackButton to="/" class="text-white! hover:bg-white/20! bg-black/20!" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-text-muted">Loading movies...</div>

    <!-- Empty state -->
    <div v-else-if="movies.length === 0" class="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <span class="text-4xl">🎬</span>
      <p class="text-text font-medium">No content available for this language at the moment.</p>
      <p class="text-text-muted text-sm">Check back later.</p>
    </div>

    <!-- Movies grid -->
    <div v-else
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 3xl:grid-cols-7 gap-4">
      <RouterLink v-for="movie in movies" :key="movie.uuid" :to="`/movies/${movie.uuid}`">
        <MediaCard :title="movie.title" :poster-url="movie.poster_url" :year="movie.release_year"
          :type="movie.type || 'movie'" />
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import GoBackButton from '@/components/GoBackButton.vue'
import MediaCard from '@/components/MediaCard.vue'
import { useLanguagesStore } from '@/stores/languagesStore'
import { computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const languagesStore = useLanguagesStore()

const code = computed(() => route.params.code as string)
const language = computed(() => languagesStore.languageByCode.get(code.value))

const movies = computed(() => languagesStore.moviesByLanguage.get(code.value) ?? [])
const isLoading = computed(() => languagesStore.moviesLoadingMap.get(code.value) ?? false)

async function loadData() {
  if (languagesStore.languages.length === 0) {
    await languagesStore.fetchLanguages()
  }
  await languagesStore.fetchMoviesByLanguage(code.value)
}

onMounted(loadData)

// Watch for route changes (if navigating directly between languages)
watch(() => route.params.code, () => {
  if (route.name === 'language-content') {
    loadData()
  }
})
</script>
