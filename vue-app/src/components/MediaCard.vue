<template>
  <div
    class="group/card shrink-0 h-full cursor-pointer flex flex-col snap-start active:scale-95 transition-transform duration-200"
    :class="fluid ? 'w-full' : 'w-36 sm:w-44'"
    @click="$emit('click')"
  >
    <AppImage
      :src="posterUrl"
      :alt="title"
      :type="type"
      class="w-full aspect-2/3 rounded-xl overflow-hidden shadow-md group-hover/card:shadow-xl group-hover/card:ring-2 group-hover/card:ring-primary/60 transition-all duration-300"
    >
      <!-- Gradient Overlay for hover effect -->
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none"
      ></div>

      <!-- Optional Status Badge Slot for Watchlist etc -->
      <slot name="badge"></slot>
    </AppImage>

    <div class="pt-2 px-0.5 flex flex-col gap-0.5">
      <div class="text-sm font-semibold text-text truncate group-hover/card:text-primary transition-colors">
        {{ title }}
      </div>
      <div class="text-xs text-text-muted">
        <span>{{ year || 'N/A' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppImage from '@/components/AppImage.vue'
defineProps<{
  title: string
  posterUrl?: string
  year?: number | string
  type: 'movie' | 'tv' | 'person' | 'collection' | 'company'
  fluid?: boolean
}>()

defineEmits(['click'])
</script>
