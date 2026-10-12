<template>
  <button
    class="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-1 border border-border text-left group w-full active:bg-surface-2 transition-colors"
    @click="$emit('click')"
  >
    <!-- Avatar / Poster -->
    <AppImage
      v-if="personItem"
      :src="personItem.profile_url"
      :alt="personItem.name"
      type="person"
      class="w-10 h-10 rounded-full shrink-0 ring-1 ring-border"
    />
    
    <AppImage
      v-else-if="mediaItem"
      :src="mediaItem.poster_url"
      :alt="mediaItem.title"
      :type="type === 'movie' ? 'movie' : 'tv'"
      class="w-12 h-18 rounded-lg shrink-0"
    />

    <!-- Details -->
    <div class="flex flex-col min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-text truncate">
          {{ personItem ? personItem.name : mediaItem?.title }}
        </span>
        <!-- Type Badge for movies/shows -->
        <span v-if="type !== 'person'" class="px-1.5 py-0.5 bg-surface-2 text-text-muted text-[10px] uppercase font-bold rounded-md shrink-0">
          {{ type }}
        </span>
      </div>
      
      <!-- Subtitle for movie/show -->
      <div v-if="mediaItem?.release_year" class="text-xs text-text-muted truncate mt-1">
        <span>{{ mediaItem.release_year }}</span>
      </div>

      <!-- Genres for movie/show -->
      <div v-if="mediaItem?.genres && mediaItem.genres.length > 0" class="flex gap-1 mt-1">
        <span
          v-for="genre in mediaItem.genres.slice(0, 2)"
          :key="genre.id"
          class="px-2 py-0.5 bg-surface-2 text-text text-[10px] rounded-lg font-medium"
        >
          {{ genre.name }}
        </span>
      </div>

      <!-- Subtitle for person -->
      <div v-if="personItem" class="text-xs text-text-muted truncate mt-1">
        <span>{{ personRoleText }}</span>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppImage from '@/components/AppImage.vue'
import type { MovieWithDetails, TVShowCard, Person } from 'shared-types'

const props = defineProps<{
  type: 'movie' | 'show' | 'person'
  item: MovieWithDetails | TVShowCard | Person
}>()

defineEmits(['click'])

const personItem = computed(() => (props.type === 'person' ? (props.item as Person) : null))
const mediaItem = computed(() => (props.type !== 'person' ? (props.item as MovieWithDetails | TVShowCard) : null))

const personRoleText = computed(() => {
  if (!personItem.value) return ''
  if (personItem.value.also_known_as) return `aka ${personItem.value.also_known_as}`
  if (personItem.value.birth_place) return personItem.value.birth_place
  return 'Person'
})
</script>

