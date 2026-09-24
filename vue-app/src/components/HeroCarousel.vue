<template>
  <div class="shrink-0 relative w-full aspect-4/5 sm:aspect-21/9 bg-surface-2 rounded-xl overflow-hidden group">
    <swiper
      :modules="modules"
      :autoplay="{ delay: autoPlayInterval || 4000, disableOnInteraction: false }"
      :pagination="{ clickable: true }"
      class="w-full h-full"
    >
      <swiper-slide v-for="item in items" :key="item.uuid" class="w-full h-full relative cursor-pointer"
        @click="$emit('clickItem', item)">
        <!-- Background Image -->
        <AppImage :src="item.backdrop_url || item.poster_url" :alt="item.title" :type="item.type"
          class="w-full h-full" />

        <!-- Gradient Overlay -->
        <div class="absolute inset-0 bg-linear-to-t from-surface-1 via-surface-1/4 to-transparent"></div>

        <!-- Top Right Tags -->
        <div class="absolute top-4 sm:top-6 right-4 sm:right-8 flex flex-col gap-2 items-end z-10 pointer-events-none">
          <span class="px-3 py-1 bg-primary/80 backdrop-blur-md text-white rounded-md text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg">
            {{ item.type }}
          </span>
          <span v-if="item.status === 'returning_series'"
            class="px-3 py-1 bg-purple-500/80 backdrop-blur-md text-white rounded-md text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg">
            New Episodes
          </span>
        </div>

        <!-- Content -->
        <div class="absolute bottom-0 left-0 w-full p-4 sm:p-8 md:p-12 pb-12 sm:pb-16 flex flex-col gap-2 sm:gap-4 justify-end">
          <h2 class="text-3xl sm:text-5xl font-heading font-bold text-white drop-shadow-lg">
            {{ item.title }}
          </h2>
          <div class="flex items-center gap-3 text-sm text-gray-200">
            <span class="font-medium text-base">{{ item.release_year }}</span>
          </div>

          <div class="mt-2 flex gap-3">
            <button
              class="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-primary text-on-primary font-bold shadow-lg transition-transform"
              @click.stop="$emit('clickItem', item)">
              More Info
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

defineProps<{
  items: MediaCard[]
  autoPlayInterval?: number
}>()

defineEmits(['clickItem'])

const modules = [Autoplay, Pagination]
</script>

<style scoped>
:deep(.swiper-pagination-bullet) {
  background: rgba(255, 255, 255, 0.5);
  opacity: 1;
  transition: all 0.3s;
}
:deep(.swiper-pagination-bullet-active) {
  background: var(--color-primary);
  width: 24px;
  border-radius: 4px;
}
</style>
