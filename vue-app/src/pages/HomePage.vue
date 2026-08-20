<template>
  <div class="w-full h-full flex flex-col gap-y-8 md:gap-y-10 overflow-y-auto hide-scrollbar">
    <!-- Hero Carousel -->
    <div v-if="moviesStore.loading" class="w-full h-64 sm:h-96 bg-surface-2 animate-pulse rounded-xl"></div>
    <HeroCarousel v-else-if="moviesStore.movies && moviesStore.movies.length > 0"
      :items="moviesStore.movies.slice(0, 5)" :auto-play-interval="4000" @clickItem="openDrawer" />

    <!-- Trending Movies -->
    <div class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <RouterLink :to="'/movies'">
          <h2 class="text-xl sm:text-2xl font-heading font-bold text-text hover:text-primary transition-colors">Recent
            Movies</h2>
        </RouterLink>
        <RouterLink :to="'/movies'" class="flex items-center gap-x-1 text-primary text-sm font-medium hover:underline">
          <span>See all</span>
          <ChevronRight :size="16" />
        </RouterLink>
      </div>

      <div v-if="moviesStore.loading" class="px-2 text-text-muted">Loading movies...</div>
      <div v-else-if="recentMovies?.length === 0" class="px-2 text-text-muted">No movies found</div>

      <MediaCarousel v-else>
        <MediaCard v-for="movie in recentMovies" :key="movie.uuid" :title="movie.title" :poster-url="movie.poster_url"
          :year="movie.release_year" :type="movie.type" @click="openDrawer(movie)" />
      </MediaCarousel>
    </div>

    <!-- Top Rated TV Shows -->
    <div class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Top Rated TV Shows</h2>
      </div>

      <div v-if="tvStore.loading" class="px-2 text-text-muted">Loading tv shows...</div>
      <div v-else-if="tvStore.topRatedShows?.length === 0" class="px-2 text-text-muted">No tv shows found</div>

      <MediaCarousel v-else>
        <MediaCard v-for="show in tvStore.topRatedShows" :key="show.uuid" :title="show.title"
          :poster-url="show.poster_url" :year="show.release_year" :type="show.type" @click="openDrawer(show)" />
      </MediaCarousel>
    </div>

    <!-- Watchlist Preview -->
    <div v-if="authStore.isAuthenticated" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <RouterLink :to="'/watchlist'">
          <h2 class="text-xl sm:text-2xl font-heading font-bold text-text hover:text-primary transition-colors">Your
            Watchlist</h2>
        </RouterLink>
        <RouterLink :to="'/watchlist'"
          class="flex items-center gap-x-1 text-primary text-sm font-medium hover:underline">
          <span>See all</span>
          <ChevronRight :size="16" />
        </RouterLink>
      </div>

      <div v-if="watchlistStore.loading" class="px-2 text-text-muted">Loading watchlist...</div>
      <div v-else-if="watchlistPreview?.length === 0" class="px-2 text-text-muted">
        Your watchlist is empty
      </div>

      <MediaCarousel v-else>
        <MediaCard v-for="item in watchlistPreview" :key="item.id" :title="item.movie.title"
          :poster-url="item.movie.poster_url" :year="item.movie.release_year" :type="item.movie.type"
          @click="openDrawer(item.movie)">
          <template #badge>
            <div
              class="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-on-primary shadow-lg backdrop-blur-sm">
              {{
                item.status === 'want_to_watch'
                  ? 'Plan'
                  : item.status === 'watching'
                    ? 'Watching'
                    : 'Watched'
              }}
            </div>
          </template>
        </MediaCard>
      </MediaCarousel>
    </div>

    <!-- Genres -->
    <div class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Genres</h2>
        <RouterLink to="/genres" class="flex items-center gap-x-1 text-primary text-sm font-medium hover:underline">
          <span>See all</span>
          <ChevronRight :size="16" />
        </RouterLink>
      </div>
      <div v-if="genresStore.loading" class="px-2 text-text-muted">Loading genres...</div>
      <div v-else-if="genresStore.genres?.length === 0" class="px-2 text-text-muted">
        No genres available
      </div>
      <div v-else class="flex flex-nowrap items-center gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4">
        <RouterLink v-for="(genre, index) in genresStore.genres?.slice(0, 10)" :key="genre.id"
          :to="`/genres/${genre.slug}`"
          class="shrink-0 w-40 sm:w-48 h-24 sm:h-28 rounded-2xl snap-start cursor-pointer hover:scale-105 transition-transform flex items-center justify-center shadow-md relative overflow-hidden"
          :class="getGradientClass(index)">
          <span class="font-heading font-bold text-white text-lg drop-shadow-md relative z-10">{{ genre.name }}</span>
        </RouterLink>
      </div>
    </div>

    <!-- Languages -->
    <div class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Languages</h2>
        <RouterLink to="/languages" class="flex items-center gap-x-1 text-primary text-sm font-medium hover:underline">
          <span>See all</span>
          <ChevronRight :size="16" />
        </RouterLink>
      </div>
      <div v-if="languagesStore.loading" class="px-2 text-text-muted">Loading languages...</div>
      <div v-else-if="languagesStore.languages?.length === 0" class="px-2 text-text-muted">
        No languages available
      </div>
      <div v-else class="flex flex-nowrap items-center gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4">
        <RouterLink v-for="(lang, index) in languagesStore.languages?.slice(0, 10)" :key="lang.id"
          :to="`/languages/${lang.code}`"
          class="shrink-0 w-32 sm:w-40 h-20 sm:h-24 rounded-2xl snap-start cursor-pointer hover:scale-105 transition-transform flex items-center justify-center shadow-md relative overflow-hidden"
          :class="getGradientClass(index + 5)">
          <span class="font-heading font-bold text-white text-lg drop-shadow-md relative z-10">{{ lang.name }}</span>
        </RouterLink>
      </div>
    </div>

    <!-- Slide-up Details Drawer -->
    <MediaDrawer v-model:visible="isDrawerOpen" :media="selectedMedia" @watchlistAction="handleWatchlistAction" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
import { useMoviesStore } from '@/stores/moviesStore'
import { useTvStore } from '@/stores/tvStore'
import { useWatchlistStore } from '@/stores/watchListStore'
import { useGenresStore } from '@/stores/genresStore'
import { useLanguagesStore } from '@/stores/languagesStore'
import { useAuthStore } from '@/stores/authStore'
import toastHandler from '@/composables/toastHandeler'
import HeroCarousel from '@/components/HeroCarousel.vue'
import MediaCarousel from '@/components/MediaCarousel.vue'
import MediaCard from '@/components/MediaCard.vue'
import MediaDrawer from '@/components/MediaDrawer.vue'
import type { MediaCard as MediaCardType } from 'shared-types'

const moviesStore = useMoviesStore()
const tvStore = useTvStore()
const watchlistStore = useWatchlistStore()
const genresStore = useGenresStore()
const languagesStore = useLanguagesStore()
const authStore = useAuthStore()
const showToast = toastHandler().showToast

const recentMovies = computed(() => moviesStore.movies?.slice(0, 10))
const watchlistPreview = computed(() => watchlistStore.items?.slice(0, 10))

// Drawer State
const isDrawerOpen = ref(false)
const selectedMedia = ref<MediaCardType | null>(null)

function openDrawer(media: MediaCardType) {
  selectedMedia.value = media
  isDrawerOpen.value = true
}

async function handleWatchlistAction(media: MediaCardType) {
  if (!authStore.isAuthenticated) {
    showToast('info', 'Login Required', 'Please login to use watchlist')
    return
  }
  try {
    if (media.type === 'movie') {
      await watchlistStore.addToWatchlist(media.id, 'want_to_watch')
      showToast('success', 'Added', `${media.title} added to watchlist!`)
    } else {
      showToast('info', 'Coming Soon', 'Watchlist for TV shows is not supported yet.')
    }
  } catch (error) {
    console.error('Error in watchlist action:', error)
    showToast('error', 'Error', 'Could not add to watchlist (might already exist)')
  }
}

const gradients = [
  'bg-gradient-to-br from-purple-600 to-blue-600',
  'bg-gradient-to-br from-pink-500 to-orange-400',
  'bg-gradient-to-br from-green-400 to-emerald-600',
  'bg-gradient-to-br from-indigo-500 to-cyan-500',
  'bg-gradient-to-br from-red-500 to-pink-600',
  'bg-gradient-to-br from-yellow-400 to-orange-500',
  'bg-gradient-to-br from-teal-400 to-blue-500',
  'bg-gradient-to-br from-fuchsia-600 to-purple-600',
  'bg-gradient-to-br from-rose-400 to-red-500',
  'bg-gradient-to-br from-sky-400 to-indigo-500',
]

function getGradientClass(index: number) {
  return gradients[index % gradients.length]
}

onMounted(async () => {
  try {
    await Promise.all([
      moviesStore.movies?.length
        ? Promise.resolve()
        : moviesStore.fetchMovies({ sort: 'recent' }),
      tvStore.topRatedShows?.length
        ? Promise.resolve()
        : tvStore.fetchTopRatedShows(),
      genresStore.genres?.length
        ? Promise.resolve()
        : genresStore.fetchGenres(),
      languagesStore.languages?.length
        ? Promise.resolve()
        : languagesStore.fetchLanguages(),
      authStore.isAuthenticated && !watchlistStore.items?.length
        ? watchlistStore.fetchWatchlist()
        : Promise.resolve(),
    ])
  } catch (err) {
    console.error('Error loading home data:', err)
    showToast('error', 'Error', 'Failed to load data. Please check if backend is running.')
  }
})
</script>

<style scoped>
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
