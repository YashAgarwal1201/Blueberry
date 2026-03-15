<template>
  <Drawer
    :visible="visible"
    position="bottom"
    :style="drawerStyle"
    :pt="{
      root: { class: 'rounded-t-3xl !bg-surface-1 !border-t !border-border' },
      header: { class: 'hidden' },
      content: { class: '!p-0 flex flex-col h-full overflow-hidden' },
      mask: { class: '!backdrop-blur-sm' },
    }"
    @update:visible="$emit('update:visible', $event)"
  >
    <template v-if="person">
      <!-- Drag handle -->
      <div class="flex justify-center pt-3 pb-1 shrink-0">
        <div class="w-10 h-1 rounded-full bg-border" />
      </div>

      <!-- Hero -->
      <div class="relative shrink-0 px-5 pt-3 pb-5 flex gap-4 items-end">
        <div
          v-if="person.profile_url"
          class="absolute inset-0 opacity-20 bg-cover bg-center blur-2xl scale-110 pointer-events-none"
          :style="{ backgroundImage: `url(${person.profile_url})` }"
        />
        <div class="relative shrink-0">
          <img
            v-if="person.profile_url"
            :src="person.profile_url"
            :alt="person.name"
            class="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover ring-2 ring-border shadow-xl"
          />
          <div
            v-else
            class="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-surface-3 flex items-center justify-center ring-2 ring-border"
          >
            <User :size="36" class="text-text-muted" />
          </div>
        </div>
        <div class="relative flex flex-col gap-1 min-w-0 pb-1">
          <h2 class="font-heading text-2xl md:text-3xl text-text leading-tight">
            {{ person.name }}
          </h2>
          <p v-if="person.also_known_as" class="text-sm text-text-muted italic">
            aka {{ person.also_known_as }}
          </p>
          <div class="flex flex-wrap gap-2 mt-1">
            <span v-if="person.birth_place" class="flex items-center gap-1 text-xs text-text-muted">
              <MapPin :size="11" /> {{ person.birth_place }}
            </span>
            <span v-if="person.birth_date" class="flex items-center gap-1 text-xs text-text-muted">
              <Calendar :size="11" /> {{ person.birth_date }}
            </span>
          </div>
        </div>

        <!-- Top-right actions -->
        <div class="absolute top-3 right-4 flex gap-2">
          <Button
            size="small"
            severity="secondary"
            outlined
            label="Edit"
            icon="pi pi-pencil"
            @click="$emit('edit')"
          />
          <Button
            size="small"
            severity="secondary"
            outlined
            icon="pi pi-times"
            @click="$emit('update:visible', false)"
          />
        </div>
      </div>

      <!-- Scrollable body -->
      <div class="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-6">
        <p v-if="person.bio" class="text-sm text-text leading-relaxed">{{ person.bio }}</p>

        <!-- ID badges -->
        <div v-if="person.imdb_id || person.tmdb_id" class="flex flex-wrap gap-2">
          <Tag v-if="person.imdb_id" :value="`IMDb: ${person.imdb_id}`" severity="secondary" />
          <Tag v-if="person.tmdb_id" :value="`TMDB: ${person.tmdb_id}`" severity="secondary" />
        </div>

        <!-- Filmography -->
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-text-muted uppercase tracking-wider">
              Filmography
            </span>
            <Button
              v-if="!filmographyLoaded"
              size="small"
              severity="secondary"
              text
              :label="filmographyLoading ? 'Loading...' : 'Load'"
              :loading="filmographyLoading"
              @click="$emit('load-filmography')"
            />
            <span v-else class="text-xs text-text-muted">
              {{ filmography.length }} credit{{ filmography.length !== 1 ? 's' : '' }}
            </span>
          </div>

          <div
            v-if="filmographyLoading"
            class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3"
          >
            <Skeleton v-for="n in 6" :key="n" height="10rem" class="rounded-xl" />
          </div>

          <p
            v-else-if="filmographyLoaded && filmography.length === 0"
            class="text-sm text-text-muted"
          >
            Not credited in any movies yet.
          </p>

          <div
            v-else-if="filmography.length"
            class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3"
          >
            <RouterLink
              v-for="film in filmography"
              :key="`${film.id}-${film.role}`"
              :to="`/movies/${film.id}`"
              class="flex flex-col gap-1.5 group cursor-pointer"
              @click="$emit('update:visible', false)"
            >
              <div
                v-if="film.poster_url"
                class="w-full aspect-[2/3] rounded-xl bg-surface-3 group-hover:ring-2 group-hover:ring-primary transition-all"
                :style="{
                  backgroundImage: `url(${film.poster_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }"
              />
              <div
                v-else
                class="w-full aspect-[2/3] rounded-xl bg-surface-3 flex items-center justify-center group-hover:ring-2 group-hover:ring-primary transition-all"
              >
                <Film :size="18" class="text-text-muted" />
              </div>
              <p class="text-xs font-medium text-text line-clamp-2 px-0.5">{{ film.title }}</p>
              <p class="text-xs text-text-muted px-0.5 capitalize">
                {{ film.release_year || 'N/A'
                }}<template v-if="film.character"> · {{ film.character }}</template>
              </p>
            </RouterLink>
          </div>
        </div>

        <!-- Delete -->
        <div class="pt-4 border-t border-border">
          <Button
            label="Delete Person"
            icon="pi pi-trash"
            severity="danger"
            outlined
            size="small"
            :loading="deleting"
            @click="$emit('delete')"
          />
        </div>
      </div>
    </template>
  </Drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Drawer, Button, Tag, Skeleton } from 'primevue'
import { Calendar, Film, MapPin, User } from 'lucide-vue-next'
import type { Person } from '@/types/movies'

type FilmographyEntry = {
  id: number
  title: string
  release_year: number | null
  poster_url: string | null
  role: string
  character: string | null
}

defineProps<{
  visible: boolean
  person: Person | null
  filmography: FilmographyEntry[]
  filmographyLoading: boolean
  filmographyLoaded: boolean
  deleting: boolean
}>()

defineEmits<{
  'update:visible': [value: boolean]
  edit: []
  delete: []
  'load-filmography': []
}>()

const drawerStyle = computed(() => ({
  height: '90vh',
  width: typeof window !== 'undefined' && window.innerWidth >= 768 ? '90vw' : '100%',
  marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768 ? '5vw' : '0',
}))
</script>
