<template>
  <div class="w-full h-full flex flex-col gap-y-6 md:gap-y-8 overflow-y-auto">
    <!-- Header Hero -->
    <div
      class="relative w-full h-40 sm:h-56 rounded-xl overflow-hidden bg-surface-2 shadow-inner flex items-center justify-center">
      <div class="absolute inset-0 bg-linear-to-br from-primary/80 to-purple-600/80 backdrop-blur-sm z-0"></div>

      <div class="relative z-10 flex flex-col items-center gap-2">
        <h1 class="font-heading text-4xl sm:text-5xl font-bold text-white drop-shadow-md capitalize">
          {{ genre?.name ?? slug }}
        </h1>
        <p class="font-content text-white/80 font-medium text-sm sm:text-base">
          {{ genre?.description ?? 'Explore movies in this genre' }}
        </p>
      </div>

      <div class="absolute top-4 left-4 z-20">
        <GoBackButton class="text-white! hover:bg-white/20! bg-black/20!" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-text-muted">Loading movies...</div>

    <!-- Empty -->
    <div v-else-if="movies.length === 0" class="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <span class="text-4xl">🎬</span>
      <p class="text-text font-medium">No content available for this genre at the moment.</p>
      <p class="text-text-muted text-sm">Check back later.</p>
    </div>

    <!-- Movies grid -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
import { useGenresStore } from '@/stores/genresStore'
import { computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const genresStore = useGenresStore()

const slug = computed(() => route.params.slug as string)
const genre = computed(() => genresStore.genreBySlug.get(slug.value))

const movies = computed(() => genresStore.moviesByGenre.get(slug.value) ?? [])
const isLoading = computed(() => genresStore.moviesLoadingMap.get(slug.value) ?? false)

async function loadData() {
  if (genresStore.genres.length === 0) {
    await genresStore.fetchGenres()
  }
  await genresStore.fetchMoviesByGenre(slug.value)
}

onMounted(loadData)

// In case the route changes while on the page
watch(() => route.params.slug, () => {
  if (route.name === 'genre-content') {
    loadData()
  }
})
</script>
