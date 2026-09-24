<template>
  <Drawer :visible="visible" position="bottom"
    class="w-full sm:w-3/4! h-auto! max-h-[90vh]! rounded-t-3xl bg-surface-1 text-text overflow-hidden" :pt="{
      header: { class: 'hidden' }, // Hide default header, we'll build our own inside
      content: { class: 'p-0 flex flex-col' }
    }" @update:visible="(val: boolean) => $emit('update:visible', val)">
    <div v-if="media" class="relative w-full flex flex-col pb-6 group">
      <!-- Backdrop Hero -->
      <div class="relative w-full aspect-video bg-surface-3 overflow-hidden">
        <img v-if="media.backdrop_url" :src="media.backdrop_url" :alt="media.title"
          class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-linear-to-t from-surface-1 via-transparent to-transparent"></div>

        <!-- Close button overlaid -->
        <button @click="$emit('update:visible', false)"
          class="sticky top-4 right-4 p-2 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 active:scale-90 transition-all">
          <X :size="24" />
        </button>
      </div>

      <!-- Content -->
      <div class="px-5 -mt-6 relative z-10 flex flex-col gap-4">
        <div>
          <h2 class="text-3xl font-heading font-bold text-text">{{ media.title }}</h2>
          <div class="flex items-center gap-3 text-sm text-text-muted mt-1 font-content">
            <span v-if="media.release_year">{{ media.release_year }}</span>
            <span v-if="media.age_rating" class="px-1.5 py-0.5 border border-border rounded text-xs">{{ media.age_rating
            }}</span>
            <span v-if="media.runtime">{{ media.runtime }} min</span>
            <span class="px-1.5 py-0.5 bg-primary/20 text-primary rounded-md text-xs uppercase font-bold">{{ media.type
            }}</span>
          </div>
        </div>

        <div v-if="media.genres && media.genres.length > 0" class="flex flex-wrap gap-2">
          <span v-for="genre in media.genres" :key="genre.id"
            class="px-2 py-1 bg-surface-2 text-text text-xs rounded-lg font-medium hover:bg-surface-3 transition-colors cursor-default">
            {{ genre.name }}
          </span>
        </div>

        <div class="text-sm text-text-muted leading-relaxed line-clamp-3" v-if="(media as any).description">
          {{ (media as any).description }}
        </div>

        <!-- Action Buttons -->
        <div class="grid grid-cols-2 gap-3 mt-4">
          <RouterLink :to="`/${media.type === 'movie' ? 'movies' : 'shows'}/${media.uuid}`"
            class="flex items-center justify-center gap-2 py-3 rounded-2xl bg-surface-3 text-text font-semibold hover:bg-surface-4 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            @click="$emit('update:visible', false)">
            <Info :size="18" />
            More Details
          </RouterLink>
          
          <div class="flex gap-2 w-full">
            <button v-if="!isInWatchlist" @click="handleWatchlist"
              class="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-on-primary font-semibold hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200">
              <Bookmark :size="18" class="animate-pulse" />
              Watchlist
            </button>
            <button v-else @click="handleRemoveWatchlist"
              class="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-surface-3 text-primary font-semibold hover:bg-surface-4 hover:-translate-y-0.5 active:scale-95 transition-all duration-200">
              <Check :size="18" />
              In Watchlist
            </button>

            <!-- Save to Collection -->
            <button @click="showCollectionModal = true"
              class="flex-shrink-0 w-12 flex items-center justify-center rounded-2xl bg-surface-3 text-text hover:bg-surface-4 hover:text-primary hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
              title="Save to Collection">
              <FolderPlus :size="18" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Drawer>
  
  <SaveToCollectionModal 
    v-if="media"
    :visible="showCollectionModal" 
    @update:visible="showCollectionModal = $event"
    :media="media"
  />
</template>

<script setup lang="ts">
import { X, Info, Bookmark, Check, FolderPlus } from 'lucide-vue-next'
import Drawer from 'primevue/drawer'
import type { MediaCard } from 'shared-types'
import { RouterLink } from 'vue-router'
import { useWatchlistStore } from '@/stores/watchListStore'
import { computed, ref } from 'vue'
import SaveToCollectionModal from './SaveToCollectionModal.vue'

const props = defineProps<{
  visible: boolean
  media: MediaCard | null
}>()

const emit = defineEmits(['update:visible', 'watchlistAction', 'removeWatchlistAction'])

const watchlistStore = useWatchlistStore()
const showCollectionModal = ref(false)

const isInWatchlist = computed(() => {
  if (!props.media) return false
  return props.media.type === 'movie' 
    ? watchlistStore.isMovieInWatchlist(props.media.id)
    : watchlistStore.isShowInWatchlist(props.media.id)
})

function handleWatchlist() {
  if (props.media) {
    emit('watchlistAction', props.media)
  }
}

function handleRemoveWatchlist() {
  if (props.media) {
    emit('removeWatchlistAction', props.media)
  }
}
</script>
