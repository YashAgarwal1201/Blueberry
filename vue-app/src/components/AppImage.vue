<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Film, Tv, User, Image as ImageIcon, Folder } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  src?: string | null
  alt?: string
  type?: 'movie' | 'tv' | 'person' | 'collection' | 'company'
  iconSize?: number
}>(), {
  src: null,
  alt: 'Image',
  type: 'movie',
  iconSize: 48
})

const errored = ref(false)

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
})
</script>

<template>
  <div class="relative overflow-hidden bg-surface-2 flex items-center justify-center">
    <img
      v-if="src && !errored"
      :src="src"
      :alt="alt"
      class="w-full h-full object-cover"
      @error="errored = true"
    />
    <div v-else class="w-full h-full flex flex-col items-center justify-center p-4 bg-surface-2">
      <component :is="fallbackIcon" :size="iconSize" class="text-surface-3 opacity-50" />
    </div>
    <slot></slot>
  </div>
</template>

<script lang="ts">
export default {
  inheritAttrs: false
}
</script>
