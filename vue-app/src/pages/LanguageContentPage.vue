<template>
  <div
    class="w-full h-full p-2 sm:p-3 flex flex-col gap-y-6 md:gap-y-8 border border-border rounded-xl overflow-y-auto"
  >
    <!-- Header -->
    <div class="flex items-center gap-3">
      <GoBackButton to="" />
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl text-text">
          {{ language?.native_script || language?.name || code }}
        </h1>
        <p v-if="language?.native_script" class="font-content text-text-muted">
          {{ language.name }} · {{ language.native_script }}
        </p>
        <p v-else class="font-content text-text-muted">Movies available in this language</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-text-muted">Loading movies...</div>

    <!-- Empty state -->
    <div
      v-else-if="movies.length === 0"
      class="flex flex-col items-center justify-center gap-3 py-16 text-center"
    >
      <span class="text-4xl">🎬</span>
      <p class="text-text font-medium">No content available for this language at the moment.</p>
      <p class="text-text-muted text-sm">Check back later.</p>
    </div>

    <!-- Movies grid -->
    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 3xl:grid-cols-7 gap-4"
    >
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

        <div class="text-sm font-heading font-semibold text-text line-clamp-2">
          {{ movie.title }}
        </div>

        <div class="text-xs text-text-muted flex items-center gap-2">
          <span>{{ movie.release_year || 'N/A' }}</span>
          <span v-if="movie.runtime">· {{ movie.runtime }} min</span>
        </div>

        <div class="flex flex-wrap gap-1">
          <span
            v-for="lang in movie.languages.slice(0, 2)"
            :key="lang.id"
            class="px-2 py-0.5 text-xs rounded-full bg-primary-subtle text-primary"
          >
            {{ lang.code }}
          </span>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import GoBackButton from '@/components/GoBackButton.vue'
import { useLanguagesStore } from '@/stores/languagesStore'
import { computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const languagesStore = useLanguagesStore()

const code = computed(() => route.params.code as string)
const language = computed(() => languagesStore.languageByCode.get(code.value))

// Read from the Map — only this code's movies
const movies = computed(() => languagesStore.moviesByLanguage.get(code.value) ?? [])
const isLoading = computed(() => languagesStore.moviesLoadingMap.get(code.value) ?? false)

onMounted(async () => {
  if (languagesStore.languages.length === 0) await languagesStore.fetchLanguages()
  await languagesStore.fetchMoviesByLanguage(code.value)
})
</script>
