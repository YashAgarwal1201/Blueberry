<template>
  <div
    class="w-full h-full p-2 sm:p-3 flex flex-col gap-y-6 md:gap-y-8 border border-border rounded-xl overflow-y-auto"
  >
    <div>
      <h1 class="font-heading text-2xl sm:text-3xl text-text">Welcome to Blueberry</h1>
      <p class="font-content text-text-muted">View your movies collection.</p>
    </div>

    <!-- Trending Movies -->
    <div class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3">
        <RouterLink :to="'/movies'"
          ><h2 class="text-lg sm:text-xl font-heading">Recent Movies</h2></RouterLink
        >
        <RouterLink
          :to="'/movies'"
          class="flex items-center gap-x-2 px-4 py-1.5 cursor-pointer rounded-2xl bg-primary text-on-primary"
        >
          <span class="hidden md:block">View All</span>
          <ChevronRight :size="16" />
        </RouterLink>
      </div>

      <div v-if="moviesStore.loading" class="text-text-muted">Loading movies...</div>
      <div v-else-if="recentMovies.length === 0" class="text-text-muted">No movies found</div>
      <div v-else class="flex flex-nowrap items-center gap-3 overflow-x-auto">
        <RouterLink
          v-for="movie in recentMovies"
          :key="movie.id"
          :to="`/movies/${movie.id}`"
          class="flex-shrink-0 w-40 h-60 p-3 cursor-pointer rounded-2xl bg-surface-2 flex flex-col gap-2"
        >
          <div
            v-if="movie.poster_url"
            class="w-full h-40 rounded-lg bg-surface-3"
            :style="{ backgroundImage: `url(${movie.poster_url})`, backgroundSize: 'cover' }"
          ></div>
          <div
            v-else
            class="w-full h-40 rounded-lg bg-surface-3 flex items-center justify-center text-text-muted"
          >
            No Poster
          </div>
          <div class="text-sm font-medium text-text truncate">
            {{ movie.title }}
          </div>
          <div class="text-xs text-text-muted">
            {{ movie.release_year || 'N/A' }}
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Watchlist Preview -->
    <div class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3">
        <RouterLink :to="'/watchlist'"
          ><h2 class="text-lg sm:text-xl font-heading">Your Watchlist</h2></RouterLink
        >
        <RouterLink
          :to="'/watchlist'"
          class="flex items-center gap-x-2 px-4 py-1.5 cursor-pointer rounded-2xl bg-primary text-on-primary"
        >
          <span class="hidden md:block">View All</span>
          <ChevronRight :size="16" />
        </RouterLink>
      </div>

      <div v-if="watchlistStore.loading" class="text-text-muted">Loading watchlist...</div>
      <div v-else-if="watchlistPreview.length === 0" class="text-text-muted">
        Your watchlist is empty
      </div>
      <div v-else class="flex flex-nowrap items-center gap-3 overflow-x-auto">
        <RouterLink
          v-for="item in watchlistPreview"
          :key="item.id"
          :to="`/movies/${item.movie_id}`"
          class="flex-shrink-0 w-40 h-60 p-3 cursor-pointer rounded-2xl bg-surface-2 flex flex-col gap-2 relative"
        >
          <!-- Status Badge -->
          <div
            class="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs bg-primary text-on-primary"
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
            class="w-full h-40 rounded-lg bg-surface-3"
            :style="{ backgroundImage: `url(${item.movie.poster_url})`, backgroundSize: 'cover' }"
          ></div>
          <div
            v-else
            class="w-full h-40 rounded-lg bg-surface-3 flex items-center justify-center text-text-muted"
          >
            No Poster
          </div>
          <div class="text-sm font-medium text-text truncate">
            {{ item.movie.title }}
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Genres -->
    <div class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg sm:text-xl font-heading">Genres</h2>
        <RouterLink
          to="/genres"
          class="flex items-center gap-x-2 px-4 py-1.5 cursor-pointer rounded-2xl bg-primary text-on-primary"
        >
          <span class="hidden md:block">View All</span>
          <ChevronRight :size="16" />
        </RouterLink>
      </div>
      <div v-if="genresStore.loading" class="text-text-muted">Loading genres...</div>
      <div v-else-if="genresStore.genres.length === 0" class="text-text-muted">
        No genres available
      </div>
      <div v-else class="flex flex-nowrap items-center gap-3 overflow-x-auto">
        <RouterLink
          v-for="genre in genresStore.genres.slice(0, 10)"
          :key="genre.id"
          :to="`/genres/${genre.slug}`"
          class="flex-shrink-0 aspect-video w-40 p-3 cursor-pointer rounded-2xl bg-surface-2 text-text flex flex-col items-center justify-center gap-1"
        >
          <span class="font-medium text-sm">{{ genre.name }}</span>
          <span class="text-xs text-text-muted">
            {{ genre.movie_count ?? 0 }} movie{{ (genre.movie_count ?? 0) !== 1 ? 's' : '' }}
          </span>
        </RouterLink>
      </div>
    </div>

    <!-- Languages -->
    <div class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3">
        <RouterLink :to="'/languages'"
          ><h2 class="text-lg sm:text-xl font-heading">Languages</h2></RouterLink
        >

        <RouterLink
          :to="'/languages'"
          class="flex items-center gap-x-2 px-4 py-1.5 cursor-pointer rounded-2xl bg-primary text-on-primary"
        >
          <span class="hidden md:block">View All</span>
          <ChevronRight :size="16" />
        </RouterLink>
      </div>

      <div v-if="languagesStore.loading" class="text-text-muted">Loading languages...</div>
      <div v-else-if="languagesStore.languages.length === 0" class="text-text-muted">
        No languages available
      </div>
      <div v-else class="flex flex-nowrap items-center gap-3 overflow-x-auto">
        <RouterLink
          v-for="lang in languagesStore.languages.slice(0, 10)"
          :key="lang.id"
          :to="`/languages/${lang.code}`"
          class="flex-shrink-0 aspect-video w-40 p-3 cursor-pointer rounded-2xl bg-surface-2 text-text flex items-center justify-center"
        >
          <span class="font-medium">{{ lang.name }}</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<!-- script unchanged -->
<script setup lang="ts">
import toastHandler from '@/composables/toastHandeler'
import { useGenresStore } from '@/stores/genresStore'
import { useLanguagesStore } from '@/stores/languagesStore'
import { useMainStore } from '@/stores/mainStore'
import { useMoviesStore } from '@/stores/moviesStore'
import { useWatchlistStore } from '@/stores/watchListStore'
import { ChevronRight } from 'lucide-vue-next'
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

const moviesStore = useMoviesStore()
const watchlistStore = useWatchlistStore()
const languagesStore = useLanguagesStore()
const genresStore = useGenresStore()
const mainStore = useMainStore()
const showToast = toastHandler().showToast

const recentMovies = computed(() => moviesStore.movies.slice(0, 10))
const watchlistPreview = computed(() => watchlistStore.items.slice(0, 10))

onMounted(async () => {
  if (mainStore.backend.url) {
    try {
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
