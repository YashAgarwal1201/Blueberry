<template>
  <div class="w-full h-full flex flex-col overflow-y-auto hide-scrollbar pb-16">
    <!-- Hero Carousel -->
    <div v-if="moviesStore.loadingTrending && !heroMovies.length"
      class="-mx-2 -mt-2 sm:-mx-3 sm:-mt-3 w-[calc(100%+1rem)] sm:w-[calc(100%+1.5rem)] h-[62vh] sm:h-[72vh] md:h-[80vh] min-h-[440px] max-h-[820px] bg-surface-2 animate-pulse"></div>
    <HeroCarousel v-else-if="heroMovies.length > 0"
      :items="heroMovies.slice(0, 5)" :auto-play-interval="5000" @clickItem="openDrawer" @watchlist="handleWatchlistAction" />

    <!-- Shelves Container (Bleeding onto hero bottom) -->
    <div class="relative z-20 flex flex-col gap-y-8 md:gap-y-10"
      :class="(heroMovies.length > 0 || (moviesStore.loadingTrending && !heroMovies.length)) ? '-mt-12 sm:-mt-20 md:-mt-24' : 'pt-4'">
      <!-- Continue Watching -->
    <div v-if="watchlistStore.watchingMovies.length > 0" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Continue Watching</h2>
      </div>
      <MediaCarousel :items="watchlistStore.watchingMovies">
        <template #default="{ item: movie }">
          <MediaCard :title="movie.title" :poster-url="movie.poster_url"
            :year="movie.release_year" :type="movie.type" @click="openDrawer(movie)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Trending Movies -->
    <div v-if="moviesStore.loadingTrending || moviesStore.loadingHot || moviesStore.trendingMovies?.length || moviesStore.hotMovies?.length" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Trending Movies</h2>
      </div>
      <div v-if="moviesStore.loadingTrending || moviesStore.loadingHot" class="px-2 text-text-muted">Loading trending movies...</div>
      <MediaCarousel v-else :items="moviesStore.trendingMovies?.length ? moviesStore.trendingMovies : moviesStore.hotMovies || []">
        <template #default="{ item: movie }">
          <MediaCard :title="movie.title" :poster-url="movie.poster_url"
            :year="movie.release_year" :type="movie.type" @click="openDrawer(movie)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Top 10 Movies Today -->
    <div v-if="moviesStore.loadingTrending || top10Movies?.length"
      class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Top 10 Today</h2>
      </div>
      <div v-if="moviesStore.loadingTrending" class="px-2 text-text-muted">Loading top 10 movies...</div>
      <MediaCarousel v-else :items="top10Movies">
        <template #default="{ item: movie, index }">
          <Top10Card :item="movie" :rank="index + 1" @click="openDrawer(movie)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Most Popular Movies -->
    <div v-if="moviesStore.loadingPopular || moviesStore.popularMovies?.length"
      class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Most Popular Movies</h2>
      </div>
      <div v-if="moviesStore.loadingPopular" class="px-2 text-text-muted">Loading popular movies...</div>
      <MediaCarousel v-else :items="moviesStore.popularMovies || []">
        <template #default="{ item: movie }">
          <MediaCard :title="movie.title" :poster-url="movie.poster_url" :year="movie.release_year" :type="movie.type"
            @click="openDrawer(movie)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Recent Movies -->
    <div v-if="moviesStore.loading || recentMovies?.length" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Recent Movies</h2>
      </div>

      <div v-if="moviesStore.loading" class="px-2 text-text-muted">Loading movies...</div>
      <MediaCarousel v-else :items="recentMovies || []">
        <template #default="{ item: movie }">
          <MediaCard :title="movie.title" :poster-url="movie.poster_url"
            :year="movie.release_year" :type="movie.type" @click="openDrawer(movie)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Top Rated Movies -->
    <div v-if="moviesStore.loadingTopRated || moviesStore.topRatedMovies?.length" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Top Rated Movies</h2>
      </div>
      <div v-if="moviesStore.loadingTopRated" class="px-2 text-text-muted">Loading top rated movies...</div>
      <MediaCarousel v-else :items="moviesStore.topRatedMovies || []">
        <template #default="{ item: movie }">
          <MediaCard :title="movie.title" :poster-url="movie.poster_url"
            :year="movie.release_year" :type="movie.type" @click="openDrawer(movie)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Action & Adventure -->
    <div v-if="actionMovies?.length" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <RouterLink to="/genres/action">
          <h2 class="text-xl sm:text-2xl font-heading font-bold text-text hover:text-primary transition-colors">Action & Adventure</h2>
        </RouterLink>
        <RouterLink to="/genres/action" class="flex items-center gap-x-1 text-primary text-sm font-medium hover:underline">
          <span>See all</span>
          <ChevronRight :size="16" />
        </RouterLink>
      </div>
      <MediaCarousel :items="actionMovies">
        <template #default="{ item: movie }">
          <MediaCard :title="movie.title" :poster-url="movie.poster_url"
            :year="movie.release_year" :type="movie.type" @click="openDrawer(movie)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Sci-Fi & Fantasy -->
    <div v-if="sciFiMovies?.length" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <RouterLink to="/genres/sci-fi">
          <h2 class="text-xl sm:text-2xl font-heading font-bold text-text hover:text-primary transition-colors">Sci-Fi & Fantasy</h2>
        </RouterLink>
        <RouterLink to="/genres/sci-fi" class="flex items-center gap-x-1 text-primary text-sm font-medium hover:underline">
          <span>See all</span>
          <ChevronRight :size="16" />
        </RouterLink>
      </div>
      <MediaCarousel :items="sciFiMovies">
        <template #default="{ item: movie }">
          <MediaCard :title="movie.title" :poster-url="movie.poster_url"
            :year="movie.release_year" :type="movie.type" @click="openDrawer(movie)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Comedy Hits -->
    <div v-if="comedyMovies?.length" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <RouterLink to="/genres/comedy">
          <h2 class="text-xl sm:text-2xl font-heading font-bold text-text hover:text-primary transition-colors">Comedy Hits</h2>
        </RouterLink>
        <RouterLink to="/genres/comedy" class="flex items-center gap-x-1 text-primary text-sm font-medium hover:underline">
          <span>See all</span>
          <ChevronRight :size="16" />
        </RouterLink>
      </div>
      <MediaCarousel :items="comedyMovies">
        <template #default="{ item: movie }">
          <MediaCard :title="movie.title" :poster-url="movie.poster_url"
            :year="movie.release_year" :type="movie.type" @click="openDrawer(movie)" />
        </template>
      </MediaCarousel>
    </div>
    </div>

    <!-- Slide-up Details Drawer -->
    <MediaDrawer v-model:visible="isDrawerOpen" :media="selectedMedia" @watchlistAction="handleWatchlistAction" @removeWatchlistAction="handleRemoveWatchlistAction" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
import { useMoviesStore } from '@/stores/moviesStore'
import { useGenresStore } from '@/stores/genresStore'
import { useWatchlistStore } from '@/stores/watchListStore'
import { useAuthStore } from '@/stores/authStore'
import { useWatchlistActions } from '@/composables/useWatchlistActions'
import HeroCarousel from '@/components/HeroCarousel.vue'
import MediaCarousel from '@/components/MediaCarousel.vue'
import MediaCard from '@/components/MediaCard.vue'
import Top10Card from '@/components/Top10Card.vue'
import MediaDrawer from '@/components/MediaDrawer.vue'
import type { MediaCard as MediaCardType } from 'shared-types'

const moviesStore = useMoviesStore()
const genresStore = useGenresStore()
const watchlistStore = useWatchlistStore()
const authStore = useAuthStore()
const { handleWatchlistAction, handleRemoveWatchlistAction } = useWatchlistActions()

const heroMovies = computed(() => (moviesStore.trendingMovies?.length ? moviesStore.trendingMovies : moviesStore.hotMovies || []))
const top10Movies = computed(() => heroMovies.value.slice(0, 10))
const recentMovies = computed(() => moviesStore.movies?.slice(0, 10))
const actionMovies = computed(() => genresStore.moviesByGenre.get('action') || [])
const sciFiMovies = computed(() => genresStore.moviesByGenre.get('sci-fi') || [])
const comedyMovies = computed(() => genresStore.moviesByGenre.get('comedy') || [])

// Drawer State
const isDrawerOpen = ref(false)
const selectedMedia = ref<MediaCardType | null>(null)

function openDrawer(media: MediaCardType) {
  selectedMedia.value = media
  isDrawerOpen.value = true
}

onMounted(() => {
  // Graceful unblocked loading to keep UI snappy
  moviesStore.fetchTrendingMovies?.().catch(console.error)
  moviesStore.fetchPopularMovies?.().catch(console.error)
  if (!moviesStore.movies?.length) moviesStore.fetchMovies({ sort: 'recent' }).catch(console.error)
  if (!moviesStore.hotMovies?.length) moviesStore.fetchHotMovies?.().catch(console.error)
  if (!moviesStore.topRatedMovies?.length) moviesStore.fetchTopRatedMovies?.().catch(console.error)
  
  if (!genresStore.moviesByGenre.has('action')) genresStore.fetchMoviesByGenre('action').catch(console.error)
  if (!genresStore.moviesByGenre.has('sci-fi')) genresStore.fetchMoviesByGenre('sci-fi').catch(console.error)
  if (!genresStore.moviesByGenre.has('comedy')) genresStore.fetchMoviesByGenre('comedy').catch(console.error)

  if (authStore.isAuthenticated && !watchlistStore.items?.length) {
    watchlistStore.fetchWatchlist?.().catch(console.error)
  }
})
</script>
