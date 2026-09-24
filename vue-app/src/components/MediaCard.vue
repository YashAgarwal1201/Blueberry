<template>
  <div
    class="hover-lift group/card shrink-0 h-full cursor-pointer rounded-xl bg-surface-2 flex flex-col snap-start overflow-hidden hover:ring-2 hover:ring-primary shadow-md active:scale-95"
    :class="fluid ? 'w-full' : 'w-36 sm:w-44'"
    @click="$emit('click')">
    <div v-if="posterUrl" class="w-full aspect-2/3 bg-surface-3 relative overflow-hidden">
      <img :src="posterUrl" :alt="title" class="w-full h-full object-cover select-none" loading="lazy" />
      
      <!-- Gradient Overlay for hover effect -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

      <!-- Optional Status Badge Slot for Watchlist etc -->
      <slot name="badge"></slot>
    </div>
    <div v-else class="w-full aspect-2/3 bg-surface-3 flex items-center justify-center text-text-muted relative">
      No Poster
      <slot name="badge"></slot>
    </div>
    <div class="p-3 flex flex-col gap-1">
      <div class="text-sm font-semibold text-text truncate">
        {{ title }}
      </div>
      <div class="text-xs text-text-muted flex justify-between items-center">
        <span>{{ year || 'N/A' }}</span>
        <span class="px-1.5 py-0.5 rounded-md bg-surface-3 text-[10px] uppercase font-bold text-text-muted">{{ type
        }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  posterUrl?: string
  year?: number | string
  type: string
  fluid?: boolean
}>()

defineEmits(['click'])
</script>
