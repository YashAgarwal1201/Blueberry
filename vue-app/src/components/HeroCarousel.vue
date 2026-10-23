<template>
  <div
    class="shrink-0 relative -mx-2 -mt-2 sm:-mx-3 sm:-mt-3 w-[calc(100%+1rem)] sm:w-[calc(100%+1.5rem)] h-[62vh] sm:h-[72vh] md:h-[80vh] min-h-[440px] max-h-[820px] overflow-hidden group select-none"
  >
    <swiper
      :modules="modules"
      :autoplay="{ delay: autoPlayInterval || 5000, disableOnInteraction: false }"
      :pagination="{ clickable: true }"
      class="w-full h-full"
    >
      <swiper-slide
        v-for="item in items"
        :key="item.uuid"
        class="w-full h-full relative cursor-pointer"
        @click="$emit('clickItem', item)"
      >
        <!-- Background Image -->
        <AppImage
          :src="item.backdrop_url || item.poster_url"
          :alt="item.title"
          :type="item.type"
          class="w-full h-full object-cover"
        />

        <!-- Gradient Overlays: Bleed into page background -->
        <!-- 1. Deep vertical gradient fading bottom into surface-0 -->
        <div
          class="absolute inset-0 bg-gradient-to-t from-surface-0 via-surface-0/75 via-30% to-transparent pointer-events-none"
        ></div>

        <!-- 2. Horizontal gradient from left for maximum text & button readability -->
        <div
          class="absolute inset-0 bg-gradient-to-r from-surface-0/95 via-surface-0/60 via-45% to-transparent pointer-events-none"
        ></div>

        <!-- 3. Subtle top vignette -->
        <div
          class="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent pointer-events-none"
        ></div>

        <!-- Slide Content (Bleeding into page, aligned above next carousel row) -->
        <div
          class="absolute bottom-20 sm:bottom-28 md:bottom-32 left-0 w-full px-4 sm:px-8 md:px-12 flex flex-col gap-2 sm:gap-3 z-10 pointer-events-none"
        >
          <!-- Title -->
          <h1
            class="text-3xl sm:text-5xl md:text-6xl font-heading font-black text-text drop-shadow-sm tracking-tight max-w-2xl sm:max-w-3xl leading-tight"
          >
            {{ item.title }}
          </h1>

          <!-- Meta Info: Year, Genre, Status -->
          <div class="flex items-center flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-text-muted font-medium">
            <span v-if="item.release_year" class="flex items-center gap-1.5">
              <Calendar :size="14" />
              <span>{{ item.release_year }}</span>
            </span>

            <span class="flex items-center gap-1.5">
              <Tag :size="14" />
              <span>{{ getPrimaryGenre(item) }}</span>
            </span>

            <span
              v-if="item.status === 'returning_series'"
              class="px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded text-[11px] font-bold uppercase tracking-wider shadow-xs"
            >
              New Episodes
            </span>
          </div>

          <!-- Description / Overview -->
          <p
            v-if="item.description"
            class="text-xs sm:text-sm md:text-base text-text-muted max-w-xl md:max-w-2xl line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow-xs"
          >
            {{ item.description }}
          </p>

          <!-- Interactive Action Buttons -->
          <div class="mt-2 sm:mt-4 flex items-center gap-3 pointer-events-auto">
            <!-- Play Button (High contrast inverted pill in both light and dark mode) -->
            <button
              type="button"
              class="px-5 sm:px-6 py-2.5 rounded-full bg-text text-surface-0 font-bold text-sm sm:text-base flex items-center gap-2 shadow-xl hover:opacity-90 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              @click.stop="$emit('clickItem', item)"
            >
              <Play :size="18" class="fill-current text-surface-0" />
              <span>Play</span>
            </button>

            <!-- Watchlist Toggle Button -->
            <button
              type="button"
              class="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-surface-2/80 hover:bg-surface-3 backdrop-blur-md border border-border text-text flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg"
              :title="item.in_watchlist ? 'In Watchlist' : 'Add to Watchlist'"
              @click.stop="$emit('watchlist', item)"
            >
              <Check v-if="item.in_watchlist" :size="20" class="text-primary" />
              <Plus v-else :size="20" />
            </button>

            <!-- More Info Button -->
            <button
              type="button"
              class="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-surface-2/80 hover:bg-surface-3 backdrop-blur-md border border-border text-text flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg"
              title="More Info"
              @click.stop="$emit('clickItem', item)"
            >
              <Info :size="20" />
            </button>
          </div>
        </div>
      </swiper-slide>
    </swiper>
  </div>
</template>

<script setup lang="ts">
import type { MediaCard } from 'shared-types'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import AppImage from '@/components/AppImage.vue'
import { Play, Plus, Check, Info, Calendar, Tag } from 'lucide-vue-next'

defineProps<{
  items: MediaCard[]
  autoPlayInterval?: number
}>()

defineEmits<{
  (e: 'clickItem', item: MediaCard): void
  (e: 'watchlist', item: MediaCard): void
}>()

const modules = [Autoplay, Pagination]

function getPrimaryGenre(item: MediaCard): string {
  if (item.genres && item.genres.length > 0 && item.genres[0]?.name) {
    return item.genres[0].name
  }
  return item.type === 'tv' ? 'TV Series' : 'Movie'
}
</script>

<style scoped>
:deep(.swiper-pagination) {
  bottom: 24px !important;
  right: 20px !important;
  left: auto !important;
  width: auto !important;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 20;
}
@media (min-width: 640px) {
  :deep(.swiper-pagination) {
    bottom: 32px !important;
    right: 36px !important;
  }
}
@media (min-width: 768px) {
  :deep(.swiper-pagination) {
    bottom: 36px !important;
    right: 48px !important;
  }
}
:deep(.swiper-pagination-bullet) {
  background: var(--text);
  opacity: 0.35;
  width: 8px;
  height: 8px;
  margin: 0 !important;
  border-radius: 9999px;
  transition: all 0.3s ease;
}
:deep(.swiper-pagination-bullet-active) {
  background: var(--primary);
  opacity: 1;
  width: 22px;
  border-radius: 4px;
}
</style>
