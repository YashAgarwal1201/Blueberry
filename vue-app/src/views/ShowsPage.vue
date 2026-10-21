<template>
  <div class="w-full h-full flex flex-col gap-y-8 md:gap-y-10 overflow-y-auto hide-scrollbar pb-10">
    <!-- Hero Carousel -->
    <div v-if="tvStore.loadingTopRated" class="w-full h-64 sm:h-96 bg-surface-2 animate-pulse rounded-xl"></div>
    <HeroCarousel v-else-if="tvStore.topRatedShows && tvStore.topRatedShows.length > 0"
      :items="tvStore.topRatedShows.slice(0, 5)" :auto-play-interval="4000" @clickItem="openDrawer" />

    <!-- Continue Watching -->
    <div v-if="watchlistStore.watchingShows.length > 0" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Continue Watching</h2>
      </div>
      <MediaCarousel :items="watchlistStore.watchingShows">
        <template #default="{ item: show }">
          <MediaCard :title="show.title" :poster-url="show.poster_url"
            :year="show.release_year" :type="show.type" @click="openDrawer(show)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Trending Series -->
    <div v-if="tvStore.loadingHot || tvStore.hotShows?.length" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Trending Series</h2>
      </div>
      <div v-if="tvStore.loadingHot" class="px-2 text-text-muted">Loading trending tv shows...</div>
      <MediaCarousel v-else :items="tvStore.hotShows || []">
        <template #default="{ item: show }">
          <MediaCard :title="show.title"
            :poster-url="show.poster_url" :year="show.release_year" :type="show.type" @click="openDrawer(show)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Top Rated TV Shows -->
    <div v-if="tvStore.loadingTopRated || tvStore.topRatedShows?.length" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Top Rated TV Shows</h2>
      </div>

      <div v-if="tvStore.loadingTopRated" class="px-2 text-text-muted">Loading tv shows...</div>
      <MediaCarousel v-else :items="tvStore.topRatedShows || []">
        <template #default="{ item: show }">
          <MediaCard :title="show.title"
            :poster-url="show.poster_url" :year="show.release_year" :type="show.type" @click="openDrawer(show)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Completed Sagas -->
    <div v-if="tvStore.loadingCompleted || tvStore.completedShows?.length" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text flex items-center gap-2.5">
          <span>Completed Sagas</span>
          <span class="text-[11px] px-2 py-0.5 rounded-full bg-surface-2 text-text-muted font-bold border border-white/10 uppercase tracking-wide">Full Series</span>
        </h2>
      </div>
      <div v-if="tvStore.loadingCompleted" class="px-2 text-text-muted">Loading completed tv shows...</div>
      <MediaCarousel v-else :items="tvStore.completedShows || []">
        <template #default="{ item: show }">
          <MediaCard :title="show.title"
            :poster-url="show.poster_url" :year="show.release_year" :type="show.type" @click="openDrawer(show)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Recent TV Shows -->
    <div v-if="tvStore.loadingRecent || tvStore.recentShows?.length" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Recent TV Shows</h2>
      </div>

      <div v-if="tvStore.loadingRecent" class="px-2 text-text-muted">Loading tv shows...</div>
      <MediaCarousel v-else :items="tvStore.recentShows || []">
        <template #default="{ item: show }">
          <MediaCard :title="show.title"
            :poster-url="show.poster_url" :year="show.release_year" :type="show.type" @click="openDrawer(show)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Slide-up Details Drawer -->
    <MediaDrawer v-model:visible="isDrawerOpen" :media="selectedMedia" @watchlistAction="handleWatchlistAction" @removeWatchlistAction="handleRemoveWatchlistAction" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTvStore } from '@/stores/tvStore'
import { useWatchlistStore } from '@/stores/watchListStore'
import { useAuthStore } from '@/stores/authStore'
import { useWatchlistActions } from '@/composables/useWatchlistActions'
import HeroCarousel from '@/components/HeroCarousel.vue'
import MediaCarousel from '@/components/MediaCarousel.vue'
import MediaCard from '@/components/MediaCard.vue'
import MediaDrawer from '@/components/MediaDrawer.vue'
import type { MediaCard as MediaCardType } from 'shared-types'

const tvStore = useTvStore()
const watchlistStore = useWatchlistStore()
const authStore = useAuthStore()
const { handleWatchlistAction, handleRemoveWatchlistAction } = useWatchlistActions()

// Drawer State
const isDrawerOpen = ref(false)
const selectedMedia = ref<MediaCardType | null>(null)

function openDrawer(media: MediaCardType) {
  selectedMedia.value = media
  isDrawerOpen.value = true
}

onMounted(() => {
  if (!tvStore.hotShows?.length) tvStore.fetchHotShows().catch(console.error)
  if (!tvStore.topRatedShows?.length) tvStore.fetchTopRatedShows().catch(console.error)
  if (!tvStore.completedShows?.length) tvStore.fetchCompletedShows().catch(console.error)
  if (!tvStore.recentShows?.length) tvStore.fetchRecentShows().catch(console.error)
  
  if (authStore.isAuthenticated && !watchlistStore.items?.length) {
    watchlistStore.fetchWatchlist().catch(console.error)
  }
})
</script>
