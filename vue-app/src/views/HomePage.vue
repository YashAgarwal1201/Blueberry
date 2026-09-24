<template>
  <div class="w-full h-full flex flex-col gap-y-8 md:gap-y-10 overflow-y-auto hide-scrollbar">
    <!-- Hero Carousel -->
    <div v-if="preferencesStore.showMovies && moviesStore.loading" class="w-full h-64 sm:h-96 bg-surface-2 animate-pulse rounded-xl"></div>
    <HeroCarousel v-else-if="preferencesStore.showMovies && moviesStore.movies && moviesStore.movies.length > 0"
      :items="moviesStore.movies.slice(0, 5)" :auto-play-interval="4000" @clickItem="openDrawer" />

    <!-- Continue Watching -->
    <div v-if="watchlistStore.watchingMedia.length > 0" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Continue Watching</h2>
      </div>
      <MediaCarousel :items="watchlistStore.watchingMedia as MediaCardType[]">
        <template #default="{ item: media }">
          <MediaCard :title="media.title"
            :poster-url="media.poster_url"
            :year="media.release_year"
            :type="media.type" @click="openDrawer(media)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Trending Movies -->
    <div v-if="preferencesStore.showMovies && (moviesStore.loadingHot || moviesStore.hotMovies?.length)" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Trending Movies</h2>
      </div>
      <div v-if="moviesStore.loadingHot" class="px-2 text-text-muted">Loading trending movies...</div>
      <MediaCarousel v-else :items="moviesStore.hotMovies || []">
        <template #default="{ item: movie }">
          <MediaCard :title="movie.title"
            :poster-url="movie.poster_url" :year="movie.release_year" :type="movie.type" @click="openDrawer(movie)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Recent Movies -->
    <div v-if="preferencesStore.showMovies && (moviesStore.loading || recentMovies?.length)" class="flex flex-col gap-y-4">
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
      <MediaCarousel v-else :items="recentMovies || []">
        <template #default="{ item: movie }">
          <MediaCard :title="movie.title" :poster-url="movie.poster_url"
            :year="movie.release_year" :type="movie.type" @click="openDrawer(movie)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Top Rated Movies -->
    <div v-if="preferencesStore.showMovies && (moviesStore.loadingTopRated || moviesStore.topRatedMovies?.length)" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Top Rated Movies</h2>
      </div>
      <div v-if="moviesStore.loadingTopRated" class="px-2 text-text-muted">Loading top rated movies...</div>
      <MediaCarousel v-else :items="moviesStore.topRatedMovies || []">
        <template #default="{ item: movie }">
          <MediaCard :title="movie.title"
            :poster-url="movie.poster_url" :year="movie.release_year" :type="movie.type" @click="openDrawer(movie)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Top Rated TV Shows -->
    <div v-if="preferencesStore.showShows && (tvStore.loading || tvStore.topRatedShows?.length)" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Top Rated TV Shows</h2>
      </div>

      <div v-if="tvStore.loading" class="px-2 text-text-muted">Loading tv shows...</div>
      <MediaCarousel v-else :items="tvStore.topRatedShows || []">
        <template #default="{ item: show }">
          <MediaCard :title="show.title"
            :poster-url="show.poster_url" :year="show.release_year" :type="show.type" @click="openDrawer(show)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Recent TV Shows -->
    <div v-if="preferencesStore.showShows && (tvStore.loading || tvStore.recentShows?.length)" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Recent TV Shows</h2>
      </div>

      <div v-if="tvStore.loading" class="px-2 text-text-muted">Loading tv shows...</div>
      <MediaCarousel v-else :items="tvStore.recentShows || []">
        <template #default="{ item: show }">
          <MediaCard :title="show.title"
            :poster-url="show.poster_url" :year="show.release_year" :type="show.type" @click="openDrawer(show)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Watchlist Preview -->
    <div v-if="authStore.isAuthenticated && (watchlistStore.loading || watchlistPreview?.length)"
      class="flex flex-col gap-y-4">
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
      <MediaCarousel v-else :items="watchlistPreview || []">
        <template #default="{ item }">
          <MediaCard :title="getMedia(item)?.title"
            :poster-url="getMedia(item)?.poster_url" :year="getMedia(item)?.release_year" :type="getMedia(item)?.type"
            @click="openDrawer(getMedia(item))">
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
        </template>
      </MediaCarousel>
    </div>

    <!-- Community Collections -->
    <div v-if="collectionsStore.loading || collectionsStore.communityCollections?.length" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Community Collections</h2>
      </div>

      <div v-if="collectionsStore.loading" class="px-2 text-text-muted">Loading collections...</div>
      <div v-else class="flex flex-nowrap items-center gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4 px-2">
        <RouterLink v-for="collection in collectionsStore.communityCollections.slice(0, 8)" :key="collection.id"
          :to="`/profile/collections/${collection.id}`"
          class="shrink-0 w-64 sm:w-80 h-36 sm:h-44 rounded-2xl snap-start cursor-pointer flex flex-col justify-end shadow-md relative overflow-hidden bg-surface-2 border border-border group">
          <AppImage :src="collection.poster_url" type="collection" class="absolute inset-0 w-full h-full opacity-80 group-hover:opacity-100 transition-all duration-700" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          <div class="relative z-10 p-4">
            <h3 class="font-heading font-bold text-white text-lg sm:text-xl line-clamp-1 drop-shadow-md">{{ collection.name }}</h3>
            <p class="text-white/80 text-sm font-medium mt-1">{{ collection.item_count }} items</p>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Genres -->
    <div v-if="genresStore.loading || genresStore.visibleGenres?.length" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Genres</h2>
        <RouterLink to="/genres" class="flex items-center gap-x-1 text-primary text-sm font-medium hover:underline">
          <span>See all</span>
          <ChevronRight :size="16" />
        </RouterLink>
      </div>
      <div v-if="genresStore.loading" class="px-2 text-text-muted">Loading genres...</div>
      <div v-else class="flex flex-nowrap items-center gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4">
        <RouterLink v-for="(genre, index) in genresStore.visibleGenres?.slice(0, 10)" :key="genre.id"
          :to="`/genres/${genre.slug}`"
          class="shrink-0 w-40 sm:w-48 h-24 sm:h-28 rounded-2xl snap-start cursor-pointer hover:scale-105 transition-transform flex items-center justify-center shadow-md relative overflow-hidden"
          :class="getGradientClass(index)">
          <span class="font-heading font-bold text-white text-lg drop-shadow-md relative z-10">{{ genre.name }}</span>
        </RouterLink>
      </div>
    </div>

    <!-- Languages -->
    <div v-if="languagesStore.loading || languagesStore.visibleLanguages?.length" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Languages</h2>
        <RouterLink to="/languages" class="flex items-center gap-x-1 text-primary text-sm font-medium hover:underline">
          <span>See all</span>
          <ChevronRight :size="16" />
        </RouterLink>
      </div>
      <div v-if="languagesStore.loading" class="px-2 text-text-muted">Loading languages...</div>
      <div v-else class="flex flex-nowrap items-center gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4">
        <RouterLink v-for="(lang, index) in languagesStore.visibleLanguages?.slice(0, 10)" :key="lang.id"
          :to="`/languages/${lang.code}`"
          class="shrink-0 w-32 sm:w-40 h-20 sm:h-24 rounded-2xl snap-start cursor-pointer hover:scale-105 transition-transform flex flex-col items-center justify-center shadow-md relative overflow-hidden"
          :class="getGradientClass(index + 5)">
          <span v-if="lang.native_script && lang.native_script !== lang.name" class="font-heading font-bold text-white text-xl sm:text-2xl drop-shadow-md relative z-10 mb-0.5">{{ lang.native_script }}</span>
          <span class="font-content font-medium text-white drop-shadow-md relative z-10" :class="lang.native_script && lang.native_script !== lang.name ? 'text-xs sm:text-sm text-white/90' : 'text-lg font-bold font-heading'">{{ lang.name }}</span>
        </RouterLink>
      </div>
    </div>

    <!-- Slide-up Details Drawer -->
    <MediaDrawer v-model:visible="isDrawerOpen" :media="selectedMedia" @watchlistAction="handleWatchlistAction"
      @removeWatchlistAction="handleRemoveWatchlistAction" />
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
import { usePreferencesStore } from '@/stores/preferencesStore'
import { useCollectionsStore } from '@/stores/collectionsStore'
import toastHandler from '@/composables/toastHandeler'
import HeroCarousel from '@/components/HeroCarousel.vue'
import AppImage from '@/components/AppImage.vue'
import MediaCarousel from '@/components/MediaCarousel.vue'
import MediaCard from '@/components/MediaCard.vue'
import MediaDrawer from '@/components/MediaDrawer.vue'
import type { MediaCard as MediaCardType, WatchlistPopulatedItem } from 'shared-types'

const moviesStore = useMoviesStore()
const tvStore = useTvStore()
const watchlistStore = useWatchlistStore()
const genresStore = useGenresStore()
const languagesStore = useLanguagesStore()
const authStore = useAuthStore()
const preferencesStore = usePreferencesStore()
const collectionsStore = useCollectionsStore()
const showToast = toastHandler().showToast

const recentMovies = computed(() => moviesStore.movies?.slice(0, 10))
const watchlistPreview = computed(() => watchlistStore.items?.slice(0, 10))

const getMedia = (item: WatchlistPopulatedItem): MediaCardType => {
  return 'movie' in item ? item.movie : item.show;
}

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
    } else if (media.type === 'tv') {
      await watchlistStore.addShowToWatchlist(media.id, 'want_to_watch')
      showToast('success', 'Added', `${media.title} added to watchlist!`)
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
    } else if (media.type === 'tv') {
      const item = watchlistStore.getItemByShowId(media.id)
      if (item) {
        await watchlistStore.removeFromWatchlist(item.id)
        showToast('success', 'Removed', `${media.title} removed from watchlist!`)
      }
    }
  } catch (error) {
    console.error('Error in remove watchlist action:', error)
    showToast('error', 'Error', 'Could not remove from watchlist')
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

onMounted(() => {
  // Graceful unblocked loading to keep UI snappy

  if (!moviesStore.movies?.length) moviesStore.fetchMovies({ sort: 'recent' }).catch(console.error)
  if (!moviesStore.hotMovies?.length) moviesStore.fetchHotMovies().catch(console.error)
  if (!moviesStore.topRatedMovies?.length) moviesStore.fetchTopRatedMovies().catch(console.error)

  if (!tvStore.topRatedShows?.length) tvStore.fetchTopRatedShows().catch(console.error)
  if (!tvStore.recentShows?.length) tvStore.fetchRecentShows().catch(console.error)

  if (!genresStore.genres?.length) genresStore.fetchGenres().catch(console.error)
  if (!languagesStore.languages?.length) languagesStore.fetchLanguages().catch(console.error)

  if (!collectionsStore.communityCollections?.length) collectionsStore.fetchCommunityCollections().catch(console.error)

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
