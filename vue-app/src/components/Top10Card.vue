<template>
  <div
    class="group/top10 relative flex items-end shrink-0 cursor-pointer snap-start transition-all duration-300 hover:-translate-y-1 active:scale-95"
    @click="$emit('click')"
  >
    <!-- Solid Rank Number on the left (pure standard app typography, no stroke hacks) -->
    <div
      class="relative z-0 shrink-0 flex items-center justify-center select-none pointer-events-none w-14 sm:w-16 md:w-20 pb-9 -mr-3 sm:-mr-4"
    >
      <span
        class="text-6xl sm:text-7xl md:text-8xl font-black font-heading leading-none tracking-tighter text-text/70 group-hover/top10:text-primary transition-colors duration-300 drop-shadow-md"
      >
        {{ rank }}
      </span>
    </div>

    <!-- Media Card with free-flowing text without grayish box background -->
    <div class="relative z-10 w-36 sm:w-44 shrink-0 flex flex-col">
      <AppImage
        :src="item?.poster_url"
        :alt="item?.title"
        :type="item?.type"
        class="w-full aspect-2/3 rounded-xl overflow-hidden shadow-md group-hover/top10:shadow-xl group-hover/top10:ring-2 group-hover/top10:ring-primary/60 transition-all duration-300"
      >
        <!-- Hover overlay -->
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/top10:opacity-100 transition-opacity duration-300 pointer-events-none"
        ></div>

        <!-- Sleek Top 10 Corner Pill -->
        <div
          class="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-on-primary shadow-lg backdrop-blur-sm"
        >
          #{{ rank }}
        </div>
      </AppImage>

      <!-- Standard clean footer matching all MediaCards in Blueberry -->
      <div class="pt-2 px-0.5 flex flex-col gap-0.5">
        <div class="text-sm font-semibold text-text truncate group-hover/top10:text-primary transition-colors">
          {{ item?.title }}
        </div>
        <div class="text-xs text-text-muted">
          <span>{{ item?.release_year || 'N/A' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppImage from '@/components/AppImage.vue'
import type { MediaCard as MediaCardType } from 'shared-types'

withDefaults(
  defineProps<{
    item: MediaCardType
    rank?: number
  }>(),
  {
    rank: 1,
  }
)

defineEmits<{
  (e: 'click'): void
}>()
</script>
