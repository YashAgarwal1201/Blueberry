<template>
  <div v-if="watchlistStore.continueWatchingItems?.length > 0" class="flex flex-col gap-y-4">
    <div class="flex items-center justify-between gap-3 px-2">
      <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Up Next</h2>
    </div>
    <div class="flex flex-nowrap items-center gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4 px-2">
      <div v-for="item in watchlistStore.continueWatchingItems" :key="item.show.id"
        class="shrink-0 w-64 sm:w-80 h-36 sm:h-44 rounded-2xl snap-start cursor-pointer flex flex-col justify-end shadow-md relative overflow-hidden bg-surface-2 border border-border group"
        @click="$emit('clickItem', item.show)">
        <AppImage :src="item.nextEpisode.still_url || item.show.backdrop_url || item.show.poster_url" type="tv" class="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>
        <div class="relative z-10 p-4 pointer-events-none flex flex-col h-full justify-end">
          <h3 class="font-heading font-bold text-white text-lg sm:text-xl line-clamp-1 drop-shadow-md">{{ item.show.title }}</h3>
          <p class="text-white/80 text-sm font-medium mt-1">S{{ item.nextEpisode.season_number }} E{{ item.nextEpisode.episode_number }} &bull; {{ item.nextEpisode.title }}</p>
        </div>
        
        <!-- Mark Watched Button overlay -->
        <button @click.stop="markWatched(item)" class="absolute top-2 right-2 w-8 h-8 sm:w-10 sm:h-10 bg-black/40 hover:bg-primary/90 text-white rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all z-20" title="Mark Watched">
           <Check :size="18" />
        </button>
        <!-- Progress Bar -->
        <div class="absolute bottom-0 left-0 h-1.5 bg-surface/50 w-full">
           <div class="h-full bg-primary transition-all duration-300" :style="{ width: item.progressPercentage + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useWatchlistStore } from '@/stores/watchListStore'
import { useAuthStore } from '@/stores/authStore'
import AppImage from '@/components/AppImage.vue'
import { Check } from 'lucide-vue-next'
import type { ContinueWatchingItem } from 'shared-types'
import toastHandler from '@/composables/toastHandler'

const watchlistStore = useWatchlistStore()
const authStore = useAuthStore()
const { showToast } = toastHandler()

defineEmits(['clickItem'])

const markWatched = async (item: ContinueWatchingItem) => {
  try {
    await watchlistStore.markEpisodeWatched(item.show.id, item.nextEpisode.id)
    showToast('success', 'Marked Watched', `S${item.nextEpisode.season_number} E${item.nextEpisode.episode_number} of ${item.show.title} marked as watched.`)
    // Refresh the continue watching feed
    watchlistStore.fetchContinueWatching()
  } catch (err) {
    console.error('Failed to mark episode as watched:', err)
    showToast('error', 'Failed', 'Could not mark episode as watched')
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    watchlistStore.fetchContinueWatching().catch(console.error)
  }
})
</script>
