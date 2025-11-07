<template>
  <div
    class="w-full h-full p-2 sm:p-3 flex flex-col gap-y-6 md:gap-y-8 border border-slate-200 dark:border-slate-700 rounded-xl overflow-y-auto"
  >
    <div>
      <h1 class="font-heading text-2xl sm:text-3xl text-slate-900 dark:text-slate-100">
        Welcome to Blueberry
      </h1>
      <p class="font-content text-slate-600 dark:text-slate-400">View your movies collection.</p>
    </div>

    <!-- Trending Movies -->
    <div class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg sm:text-xl font-heading">Recent Movies</h2>
        <RouterLink
          :to="'/movies'"
          class="px-4 py-1.5 cursor-pointer rounded-2xl bg-indigo-700 dark:bg-indigo-600 text-white"
        >
          <span>View All</span>
        </RouterLink>
      </div>

      <div v-if="moviesStore.loading" class="text-slate-500">Loading movies...</div>
      <div v-else-if="recentMovies.length === 0" class="text-slate-500">No movies found</div>
      <div v-else class="flex flex-nowrap items-center gap-3 overflow-x-auto">
        <RouterLink
          v-for="movie in recentMovies"
          :key="movie.id"
          :to="`/movies/${movie.id}`"
          class="flex-shrink-0 w-40 h-60 p-3 cursor-pointer rounded-2xl bg-blue-50 dark:bg-slate-800 flex flex-col gap-2"
        >
          <div
            v-if="movie.poster_url"
            class="w-full h-40 rounded-lg bg-slate-200 dark:bg-slate-700"
            :style="{ backgroundImage: `url(${movie.poster_url})`, backgroundSize: 'cover' }"
          ></div>
          <div
            v-else
            class="w-full h-40 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400"
          >
            No Poster
          </div>
          <div class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {{ movie.title }}
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400">
            {{ movie.release_year || 'N/A' }}
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Watchlist Preview -->
    <div class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg sm:text-xl font-heading">Your Watchlist</h2>
        <RouterLink
          :to="'/watchlist'"
          class="px-4 py-1.5 cursor-pointer rounded-2xl bg-indigo-700 dark:bg-indigo-600 text-white"
        >
          <span>View All</span>
        </RouterLink>
      </div>

      <div v-if="watchlistStore.loading" class="text-slate-500">Loading watchlist...</div>
      <div v-else-if="watchlistPreview.length === 0" class="text-slate-500">
        Your watchlist is empty
      </div>
      <div v-else class="flex flex-nowrap items-center gap-3 overflow-x-auto">
        <RouterLink
          v-for="item in watchlistPreview"
          :key="item.id"
          :to="`/movies/${item.movie_id}`"
          class="flex-shrink-0 w-40 h-60 p-3 cursor-pointer rounded-2xl bg-blue-50 dark:bg-slate-800 flex flex-col gap-2 relative"
        >
          <!-- Status Badge -->
          <div
            class="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs bg-indigo-600 text-white"
          >
            {{
              item.status === 'want_to_watch'
                ? 'Plan'
                : item.status === 'watching'
                  ? 'Watching'
                  : 'Watched'
            }}
          </div>

          <div
            v-if="item.movie.poster_url"
            class="w-full h-40 rounded-lg bg-slate-200 dark:bg-slate-700"
            :style="{ backgroundImage: `url(${item.movie.poster_url})`, backgroundSize: 'cover' }"
          ></div>
          <div
            v-else
            class="w-full h-40 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400"
          >
            No Poster
          </div>
          <div class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {{ item.movie.title }}
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Languages -->
    <div class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg sm:text-xl font-heading">Languages</h2>
        <RouterLink
          :to="'/languages'"
          class="px-4 py-1.5 cursor-pointer rounded-2xl bg-indigo-700 dark:bg-indigo-600 text-white"
        >
          <span>View All</span>
        </RouterLink>
      </div>

      <div v-if="languagesStore.loading" class="text-slate-500">Loading languages...</div>
      <div v-else-if="languagesStore.languages.length === 0" class="text-slate-500">
        No languages available
      </div>
      <div v-else class="flex flex-nowrap items-center gap-3 overflow-x-auto">
        <RouterLink
          v-for="lang in languagesStore.languages.slice(0, 10)"
          :key="lang.id"
          :to="`/languages`"
          class="flex-shrink-0 aspect-video w-40 p-3 cursor-pointer rounded-2xl bg-blue-50 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center"
        >
          <span class="font-medium">{{ lang.name }}</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import toastHandler from '@/composables/toastHandeler'
import { useLanguagesStore } from '@/stores/languagesStore'
import { useMainStore } from '@/stores/mainStore'
import { useMoviesStore } from '@/stores/moviesStore'
import { useWatchlistStore } from '@/stores/watchListStore'
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

const moviesStore = useMoviesStore()
const watchlistStore = useWatchlistStore()
const languagesStore = useLanguagesStore()
const mainStore = useMainStore()
const showToast = toastHandler().showToast

// Computed properties for slicing
const recentMovies = computed(() => moviesStore.movies.slice(0, 10))
const watchlistPreview = computed(() => watchlistStore.items.slice(0, 10))

onMounted(async () => {
  if (mainStore.backend.url) {
    try {
      // Parallel fetching for better performance
      await Promise.all([
        moviesStore.fetchMovies({ sort: 'recent' }),
        watchlistStore.fetchWatchlist(),
        languagesStore.fetchLanguages(),
      ])
    } catch (err) {
      console.error('Error loading home data:', err)
      showToast('error', 'Error', 'Failed to load data. Please check if backend is running.')
    }
  }
})
</script>
