<template>
  <button
    class="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-1 border border-border text-left group w-full active:bg-surface-2 transition-colors"
    @click="$emit('click')"
  >
    <!-- Avatar / Poster -->
    <img
      v-if="type === 'person' && item.profile_url"
      :src="item.profile_url"
      :alt="item.name"
      class="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-border"
    />
    <div
      v-else-if="type === 'person'"
      class="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center shrink-0 ring-1 ring-border"
    >
      <User :size="18" class="text-text-muted" />
    </div>
    
    <img
      v-else-if="type !== 'person' && (item as any).poster_url"
      :src="(item as any).poster_url"
      :alt="(item as any).title"
      class="w-12 h-18 rounded-lg object-cover shrink-0"
    />
    <div
      v-else-if="type !== 'person'"
      class="w-12 h-18 rounded-lg bg-surface-3 flex items-center justify-center shrink-0"
    >
      <Film v-if="type === 'movie'" :size="18" class="text-text-muted" />
      <Tv v-else :size="18" class="text-text-muted" />
    </div>

    <!-- Details -->
    <div class="flex flex-col min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-text truncate">
          {{ type === 'person' ? item.name : (item as any).title }}
        </span>
        <!-- Type Badge for movies/shows -->
        <span v-if="type !== 'person'" class="px-1.5 py-0.5 bg-surface-2 text-text-muted text-[10px] uppercase font-bold rounded-md shrink-0">
          {{ type }}
        </span>
      </div>
      
      <!-- Subtitle for movie/show -->
      <div v-if="type !== 'person'" class="text-xs text-text-muted truncate mt-1">
        <span v-if="(item as any).release_year">{{ (item as any).release_year }}</span>
        <span v-if="(item as any).release_year && (item as any).director"> · </span>
        <span v-if="(item as any).director">{{ (item as any).director }}</span>
      </div>

      <!-- Genres for movie/show -->
      <div v-if="type !== 'person' && (item as any).genres && (item as any).genres.length > 0" class="flex gap-1 mt-1">
        <span
          v-for="genre in (item as any).genres.slice(0, 2)"
          :key="genre.id"
          class="px-2 py-0.5 bg-surface-2 text-text text-[10px] rounded-lg font-medium"
        >
          {{ genre.name }}
        </span>
      </div>

      <!-- Subtitle for person -->
      <div v-if="type === 'person'" class="text-xs text-text-muted truncate mt-1">
        <span>{{ personRoleText }}</span>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { User, Film, Tv } from 'lucide-vue-next'
import type { MovieWithDetails, TVShowCard, Person } from 'shared-types'

const props = defineProps<{
  type: 'movie' | 'show' | 'person'
  item: MovieWithDetails | TVShowCard | Person
}>()

defineEmits(['click'])

const personRoleText = computed(() => {
  if (props.type !== 'person') return ''
  const p = props.item as Person
  if (p.also_known_as) return `aka ${p.also_known_as}`
  if (p.birth_place) return p.birth_place
  return 'Person'
})
</script>
