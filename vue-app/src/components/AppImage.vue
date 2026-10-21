<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Film, Tv, User, Image as ImageIcon, Folder } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  src?: string | null
  alt?: string
  type?: 'movie' | 'tv' | 'person' | 'collection' | 'company'
  iconSize?: number
  loading?: 'lazy' | 'eager'
}>(), {
  src: null,
  alt: 'Image',
  type: 'movie',
  iconSize: 48,
  loading: 'lazy'
})

const errored = ref(false)
const loaded = ref(false)
const imgRef = ref<HTMLImageElement | null>(null)

const fallbackIcon = computed(() => {
  switch (props.type) {
    case 'movie': return Film
    case 'tv': return Tv
    case 'person': return User
    case 'collection': return Folder
    case 'company': return ImageIcon
    default: return ImageIcon
  }
})

watch(() => props.src, () => {
  errored.value = false
  loaded.value = false
})

onMounted(() => {
  if (imgRef.value?.complete && imgRef.value?.naturalWidth > 0) {
    loaded.value = true
  }
})
</script>

<template>
  <div class="relative overflow-hidden bg-surface-2 flex items-center justify-center">
    <!-- Shimmer placeholder while image loads -->
    <div
      v-if="src && !loaded && !errored"
      class="absolute inset-0 bg-surface-2 animate-pulse pointer-events-none"
    />
    <img
      v-if="src && !errored"
      ref="imgRef"
      :src="src"
      :alt="alt"
      :loading="loading"
      decoding="async"
      class="w-full h-full object-cover transition-opacity duration-300"
      :class="loaded ? 'opacity-100' : 'opacity-0'"
      @load="loaded = true"
      @error="errored = true"
    />
    <div v-else class="w-full h-full flex flex-col items-center justify-center p-4 bg-surface-2">
      <component :is="fallbackIcon" :size="iconSize" class="text-surface-3 opacity-50" />
    </div>
    <slot></slot>
  </div>
</template>
