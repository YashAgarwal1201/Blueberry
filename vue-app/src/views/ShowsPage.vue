<template>
  <div class="w-full h-full flex flex-col gap-y-8 md:gap-y-10 overflow-y-auto hide-scrollbar pb-10">
    <!-- Hero Carousel -->
    <div v-if="tvStore.loading" class="w-full h-64 sm:h-96 bg-surface-2 animate-pulse rounded-xl"></div>
    <HeroCarousel v-else-if="tvStore.topRatedShows && tvStore.topRatedShows.length > 0"
      :items="tvStore.topRatedShows.slice(0, 5)" :auto-play-interval="4000" @clickItem="openDrawer" />

    <!-- Continue Watching -->
    <div v-if="watchlistStore.watchingShows.length > 0" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Continue Watching</h2>
      </div>
      <MediaCarousel>
        <MediaCard v-for="show in watchlistStore.watchingShows" :key="show.uuid" :title="show.title" :poster-url="show.poster_url"
          :year="show.release_year" :type="show.type" @click="openDrawer(show)" />
      </MediaCarousel>
    </div>

    <!-- Top Rated TV Shows -->
    <div v-if="tvStore.loading || tvStore.topRatedShows?.length" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Top Rated TV Shows</h2>
      </div>

      <div v-if="tvStore.loading" class="px-2 text-text-muted">Loading tv shows...</div>
      <MediaCarousel v-else>
        <MediaCard v-for="show in tvStore.topRatedShows" :key="show.uuid" :title="show.title"
          :poster-url="show.poster_url" :year="show.release_year" :type="show.type" @click="openDrawer(show)" />
      </MediaCarousel>
    </div>

    <!-- Recent TV Shows -->
    <div v-if="tvStore.loading || tvStore.recentShows?.length" class="flex flex-col gap-y-4">
      <div class="flex items-center justify-between gap-3 px-2">
        <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Recent TV Shows</h2>
      </div>

      <div v-if="tvStore.loading" class="px-2 text-text-muted">Loading tv shows...</div>
      <MediaCarousel v-else>
        <MediaCard v-for="show in tvStore.recentShows" :key="show.uuid" :title="show.title"
          :poster-url="show.poster_url" :year="show.release_year" :type="show.type" @click="openDrawer(show)" />
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
import toastHandler from '@/composables/toastHandeler'
import HeroCarousel from '@/components/HeroCarousel.vue'
import MediaCarousel from '@/components/MediaCarousel.vue'
import MediaCard from '@/components/MediaCard.vue'
import MediaDrawer from '@/components/MediaDrawer.vue'
import type { MediaCard as MediaCardType } from 'shared-types'

const tvStore = useTvStore()
const watchlistStore = useWatchlistStore()
const authStore = useAuthStore()
const showToast = toastHandler().showToast

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
    if (media.type === 'tv') {
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
    if (media.type === 'tv') {
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

onMounted(() => {
  // Graceful unblocked loading to keep UI snappy
  if (!tvStore.topRatedShows?.length) tvStore.fetchTopRatedShows().catch(console.error)
  if (!tvStore.recentShows?.length) tvStore.fetchRecentShows().catch(console.error)
  
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
