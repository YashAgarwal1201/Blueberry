<template>
  <div
    class="w-full h-full p-2 sm:p-3 flex flex-col gap-y-6 md:gap-y-8 border border-border rounded-xl overflow-y-auto"
  >
    <!-- Header -->
    <div class="flex items-center gap-3">
      <GoBackButton to="/genres" />
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl text-text">
          {{ genre?.name ?? slug }}
        </h1>
        <p class="font-content text-text-muted">
          {{ genre?.description ?? 'Movies in this genre' }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-text-muted">Loading movies...</div>

    <!-- Empty -->
    <div
      v-else-if="movies.length === 0"
      class="flex flex-col items-center justify-center gap-3 py-16 text-center"
    >
      <span class="text-4xl">🎬</span>
      <p class="text-text font-medium">No content available for this genre at the moment.</p>
      <p class="text-text-muted text-sm">Check back later.</p>
    </div>

    <!-- Movies grid -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <RouterLink
        v-for="movie in movies"
        :key="movie.id"
        :to="`/movies/${movie.id}`"
        class="rounded-xl bg-surface-2 p-3 flex flex-col gap-2 hover:shadow-lg transition-shadow cursor-pointer"
      >
        <div
          v-if="movie.poster_url"
          class="w-full aspect-[2/3] rounded-lg bg-surface-3"
          :style="{
            backgroundImage: `url(${movie.poster_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }"
        ></div>
        <div
          v-else
          class="w-full aspect-[2/3] rounded-lg bg-surface-3 flex items-center justify-center text-text-muted text-sm"
        >
          No Poster
        </div>

        <div class="text-sm font-semibold text-text line-clamp-2">{{ movie.title }}</div>

        <div class="text-xs text-text-muted flex items-center gap-2">
          <span>{{ movie.release_year || 'N/A' }}</span>
          <span v-if="movie.runtime">· {{ movie.runtime }} min</span>
        </div>

        <!-- Genre chips -->
        <div class="flex flex-wrap gap-1">
          <span
            v-for="g in movie.genres.slice(0, 2)"
            :key="g.id"
            class="px-2 py-0.5 text-xs rounded-full bg-primary-subtle text-primary"
          >
            {{ g.name }}
          </span>
          <span
            v-if="movie.genres.length > 2"
            class="px-2 py-0.5 text-xs rounded-full bg-surface-3 text-text-muted"
          >
            +{{ movie.genres.length - 2 }}
          </span>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import GoBackButton from '@/components/GoBackButton.vue'
import { useGenresStore } from '@/stores/genresStore'
import { computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const genresStore = useGenresStore()

const slug = computed(() => route.params.slug as string)
const genre = computed(() => genresStore.genreBySlug.get(slug.value))

// Read from the Map — only this slug's movies
const movies = computed(() => genresStore.moviesByGenre.get(slug.value) ?? [])
const isLoading = computed(() => genresStore.moviesLoadingMap.get(slug.value) ?? false)

onMounted(async () => {
  if (genresStore.genres.length === 0) await genresStore.fetchGenres()
  await genresStore.fetchMoviesByGenre(slug.value)
})
</script>
