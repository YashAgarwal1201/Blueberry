<template>
  <div class="w-full h-full flex flex-col overflow-y-auto hide-scrollbar pb-16">
    <!-- Hero Carousel -->
    <div v-if="tvStore.loadingTrending && !heroShows.length"
      class="-mx-2 -mt-2 sm:-mx-3 sm:-mt-3 w-[calc(100%+1rem)] sm:w-[calc(100%+1.5rem)] h-[62vh] sm:h-[72vh] md:h-[80vh] min-h-[440px] max-h-[820px] bg-surface-2 animate-pulse"></div>
    <HeroCarousel v-else-if="heroShows.length > 0"
      :items="heroShows.slice(0, 5)" :auto-play-interval="5000" @clickItem="openDrawer" @watchlist="handleWatchlistAction" />

    <!-- Shelves Container (Bleeding onto hero bottom) -->
    <div class="relative z-20 flex flex-col gap-y-8 md:gap-y-10"
      :class="(heroShows.length > 0 || (tvStore.loadingTrending && !heroShows.length)) ? '-mt-12 sm:-mt-20 md:-mt-24' : 'pt-4'">
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
    <div v-if="tvStore.loadingTrending || tvStore.trendingShows?.length || tvStore.hotShows?.length" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Trending Series</h2>
      </div>
      <div v-if="tvStore.loadingTrending" class="px-2 text-text-muted">Loading trending tv shows...</div>
      <MediaCarousel v-else :items="tvStore.trendingShows?.length ? tvStore.trendingShows : tvStore.hotShows || []">
        <template #default="{ item: show }">
          <MediaCard :title="show.title"
            :poster-url="show.poster_url" :year="show.release_year" :type="show.type" @click="openDrawer(show)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Top 10 Series Today -->
    <div v-if="tvStore.loadingTrending || top10Shows?.length"
      class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Top 10 Series Today</h2>
      </div>
      <div v-if="tvStore.loadingTrending" class="px-2 text-text-muted">Loading top 10 series...</div>
      <MediaCarousel v-else :items="top10Shows">
        <template #default="{ item: show, index }">
          <Top10Card :item="show" :rank="index + 1" @click="openDrawer(show)" />
        </template>
      </MediaCarousel>
    </div>

    <!-- Most Popular Series -->
    <div v-if="tvStore.loadingPopular || tvStore.popularShows?.length"
      class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Most Popular Series</h2>
      </div>
      <div v-if="tvStore.loadingPopular" class="px-2 text-text-muted">Loading popular series...</div>
      <MediaCarousel v-else :items="tvStore.popularShows || []">
        <template #default="{ item: show }">
          <MediaCard :title="show.title" :poster-url="show.poster_url" :year="show.release_year" :type="show.type"
            @click="openDrawer(show)" />
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
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Completed Sagas</h2>
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
    </div>

    <!-- Slide-up Details Drawer -->
    <MediaDrawer v-model:visible="isDrawerOpen" :media="selectedMedia" @watchlistAction="handleWatchlistAction" @removeWatchlistAction="handleRemoveWatchlistAction" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTvStore } from '@/stores/tvStore'
import { useWatchlistStore } from '@/stores/watchListStore'
import { useAuthStore } from '@/stores/authStore'
import { useWatchlistActions } from '@/composables/useWatchlistActions'
import HeroCarousel from '@/components/HeroCarousel.vue'
import MediaCarousel from '@/components/MediaCarousel.vue'
import MediaCard from '@/components/MediaCard.vue'
import Top10Card from '@/components/Top10Card.vue'
import MediaDrawer from '@/components/MediaDrawer.vue'
import type { MediaCard as MediaCardType } from 'shared-types'

const tvStore = useTvStore()
const watchlistStore = useWatchlistStore()
const authStore = useAuthStore()
const { handleWatchlistAction, handleRemoveWatchlistAction } = useWatchlistActions()

const heroShows = computed(() => (tvStore.trendingShows?.length ? tvStore.trendingShows : tvStore.topRatedShows || []))
const top10Shows = computed(() => (tvStore.trendingShows?.length ? tvStore.trendingShows : tvStore.hotShows || []).slice(0, 10))

// Drawer State
const isDrawerOpen = ref(false)
const selectedMedia = ref<MediaCardType | null>(null)

function openDrawer(media: MediaCardType) {
  selectedMedia.value = media
  isDrawerOpen.value = true
}

onMounted(() => {
  tvStore.fetchTrendingShows?.().catch(console.error)
  tvStore.fetchPopularShows?.().catch(console.error)
  if (!tvStore.hotShows?.length) tvStore.fetchHotShows?.().catch(console.error)
  if (!tvStore.topRatedShows?.length) tvStore.fetchTopRatedShows?.().catch(console.error)
  if (!tvStore.completedShows?.length) tvStore.fetchCompletedShows?.().catch(console.error)
  if (!tvStore.recentShows?.length) tvStore.fetchRecentShows?.().catch(console.error)
  
  if (authStore.isAuthenticated && !watchlistStore.items?.length) {
    watchlistStore.fetchWatchlist?.().catch(console.error)
  }
})
</script>
