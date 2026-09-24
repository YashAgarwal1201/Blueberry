<template>
  <div class="w-full h-full flex flex-col gap-y-8 md:gap-y-10 overflow-y-auto hide-scrollbar pb-10">
    <!-- Hero Carousel -->
    <div v-if="moviesStore.loadingHot" class="w-full h-64 sm:h-96 bg-surface-2 animate-pulse rounded-xl"></div>
    <HeroCarousel v-else-if="moviesStore.hotMovies && moviesStore.hotMovies.length > 0"
      :items="moviesStore.hotMovies.slice(0, 5)" :auto-play-interval="4000" @clickItem="openDrawer" />

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
    <div v-if="moviesStore.loadingHot || moviesStore.hotMovies?.length" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Trending Movies</h2>
      </div>
      <div v-if="moviesStore.loadingHot" class="px-2 text-text-muted">Loading trending movies...</div>
      <MediaCarousel v-else :items="moviesStore.hotMovies || []">
        <template #default="{ item: movie }">
          <MediaCard :title="movie.title" :poster-url="movie.poster_url"
            :year="movie.release_year" :type="movie.type" @click="openDrawer(movie)" />
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

    <!-- Slide-up Details Drawer -->
    <MediaDrawer v-model:visible="isDrawerOpen" :media="selectedMedia" @watchlistAction="handleWatchlistAction" @removeWatchlistAction="handleRemoveWatchlistAction" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMoviesStore } from '@/stores/moviesStore'
import { useWatchlistStore } from '@/stores/watchListStore'
import { useAuthStore } from '@/stores/authStore'
import toastHandler from '@/composables/toastHandeler'
import HeroCarousel from '@/components/HeroCarousel.vue'
import MediaCarousel from '@/components/MediaCarousel.vue'
import MediaCard from '@/components/MediaCard.vue'
import MediaDrawer from '@/components/MediaDrawer.vue'
import type { MediaCard as MediaCardType } from 'shared-types'

const moviesStore = useMoviesStore()
const watchlistStore = useWatchlistStore()
const authStore = useAuthStore()
const showToast = toastHandler().showToast

const recentMovies = computed(() => moviesStore.movies?.slice(0, 10))

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
      await watchlistStore.addMovieToWatchlist(media.id, 'want_to_watch')
      showToast('success', 'Added', `${media.title} added to watchlist!`)
    } else {
      showToast('info', 'Coming Soon', 'Watchlist for TV shows is not supported yet.')
    }
  } catch (error) {
    console.error('Error in watchlist action:', error)
    showToast('error', 'Error', 'Could not add to watchlist (might already exist)')
  }
}

async function handleRemoveWatchlistAction(media: MediaCardType) {
  if (!authStore.isAuthenticated) {
    showToast('info', 'Login Required', 'Please login to use watchlist')
    return
  }
  try {
    if (media.type === 'movie') {
      const item = watchlistStore.getItemByMovieId(media.id)
      if (item) {
        await watchlistStore.removeFromWatchlist(item.id)
        showToast('success', 'Removed', `${media.title} removed from watchlist!`)
      }
    } else {
      showToast('info', 'Coming Soon', 'Watchlist for TV shows is not supported yet.')
    }
  } catch (error) {
    console.error('Error in remove watchlist action:', error)
    showToast('error', 'Error', 'Could not remove from watchlist')
  }
}

onMounted(() => {
  // Graceful unblocked loading to keep UI snappy
  if (!moviesStore.movies?.length) moviesStore.fetchMovies({ sort: 'recent' }).catch(console.error)
  if (!moviesStore.hotMovies?.length) moviesStore.fetchHotMovies().catch(console.error)
  if (!moviesStore.topRatedMovies?.length) moviesStore.fetchTopRatedMovies().catch(console.error)
  
  if (authStore.isAuthenticated && !watchlistStore.items?.length) {
    watchlistStore.fetchWatchlist().catch(console.error)
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
