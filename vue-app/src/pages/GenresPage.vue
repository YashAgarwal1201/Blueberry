<template>
  <div
    class="w-full h-full p-2 sm:p-3 flex flex-col gap-y-6 md:gap-y-8 border border-border rounded-xl overflow-y-auto"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl text-text">Genres</h1>
        <p class="font-content text-text-muted">Browse your collection by genre</p>
      </div>
      <button
        @click="showAddDialog = true"
        class="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm"
      >
        + Add Genre
      </button>
    </div>

    <!-- Skeleton while genres list loads -->
    <div v-if="genresStore.loading || !allLoaded" class="flex flex-col gap-10">
      <div v-for="n in 4" :key="n" class="flex flex-col gap-3">
        <div class="h-5 w-28 rounded-lg bg-surface-3 animate-pulse"></div>
        <div class="flex gap-3">
          <div
            v-for="m in 5"
            :key="m"
            class="flex-shrink-0 w-36 h-52 rounded-xl bg-surface-3 animate-pulse"
          ></div>
        </div>
      </div>
    </div>

    <!-- Genre rows -->
    <div v-else class="flex flex-col gap-10">
      <!-- Empty state when nothing has any movies -->
      <div
        v-if="populatedGenres.length === 0"
        class="flex flex-col items-center justify-center gap-3 py-16 text-center"
      >
        <span class="text-4xl">🎬</span>
        <p class="text-text font-medium">No movies added yet.</p>
        <p class="text-text-muted text-sm">Add movies and assign genres to see them here.</p>
      </div>

      <!-- Only rows with movies -->
      <div v-for="genre in populatedGenres" :key="genre.id" class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <h2 class="font-heading text-lg text-text">{{ genre.name }}</h2>
          <RouterLink :to="`/genres/${genre.slug}`" class="text-sm text-primary hover:underline">
            View All →
          </RouterLink>
        </div>
        <div class="flex flex-nowrap gap-3 overflow-x-auto pb-1">
          <RouterLink
            v-for="movie in (genresStore.moviesByGenre.get(genre.slug) ?? []).slice(0, 10)"
            :key="movie.id"
            :to="`/movies/${movie.id}`"
            class="flex-shrink-0 w-36 flex flex-col gap-1.5 cursor-pointer group"
          >
            <div
              v-if="movie.poster_url"
              class="w-full h-52 rounded-xl bg-surface-3 group-hover:ring-2 group-hover:ring-primary transition-all"
              :style="{
                backgroundImage: `url(${movie.poster_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }"
            ></div>
            <div
              v-else
              class="w-full h-52 rounded-xl bg-surface-3 flex items-center justify-center text-text-muted text-xs group-hover:ring-2 group-hover:ring-primary transition-all"
            >
              No Poster
            </div>
            <p class="text-xs font-medium text-text line-clamp-2 px-0.5">{{ movie.title }}</p>
            <p class="text-xs text-text-muted px-0.5">{{ movie.release_year || 'N/A' }}</p>
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Add Genre Dialog -->
    <div
      v-if="showAddDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showAddDialog = false"
    >
      <div class="bg-surface-1 p-6 rounded-xl w-full max-w-sm flex flex-col gap-4">
        <h3 class="text-lg font-heading text-text">Add Genre</h3>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text">Name *</label>
          <input
            v-model="newGenre.name"
            type="text"
            placeholder="e.g., Thriller"
            class="px-3 py-2 rounded-lg border border-border bg-surface-2 text-text text-sm"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text">Description</label>
          <textarea
            v-model="newGenre.description"
            rows="2"
            placeholder="Short description (optional)"
            class="px-3 py-2 rounded-lg border border-border bg-surface-2 text-text text-sm resize-none"
          ></textarea>
        </div>
        <div class="flex gap-3">
          <button
            @click="showAddDialog = false"
            class="flex-1 px-4 py-2 rounded-lg border border-border text-text-muted text-sm hover:text-text hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            @click="addGenre"
            class="flex-1 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useGenresStore } from '@/stores/genresStore'
import { useMainStore } from '@/stores/mainStore'
import { getErrorMessage } from '@/services/errorUtils'
import toastHandler from '@/composables/toastHandeler'

const genresStore = useGenresStore()
const mainStore = useMainStore()

const showToast = toastHandler().showToast

const showAddDialog = ref(false)
const newGenre = ref({ name: '', description: '' })

const allLoaded = computed(() =>
  genresStore.genres.every((g) => !genresStore.moviesLoadingMap.get(g.slug)),
)

const populatedGenres = computed(() =>
  genresStore.genres.filter((g) => (genresStore.moviesByGenre.get(g.slug) ?? []).length > 0),
)

onMounted(async () => {
  if (!mainStore.backend.url) return
  // Only fetch genres list if not already loaded
  if (!genresStore.genres.length) await genresStore.fetchGenres()
  // Only fetch movies for genres that haven't been fetched yet
  await Promise.all(
    genresStore.genres
      .filter((g) => !genresStore.moviesByGenre.has(g.slug))
      .map((g) => genresStore.fetchMoviesByGenre(g.slug)),
  )
})

async function addGenre() {
  if (!newGenre.value.name.trim()) {
    alert('Genre name is required')
    return
  }
  try {
    await genresStore.addGenre(newGenre.value.name, newGenre.value.description)
    showAddDialog.value = false
    newGenre.value = { name: '', description: '' }
    // Fetch movies for the newly added genre too
    const added = genresStore.genres[genresStore.genres.length - 1]
    if (added) await genresStore.fetchMoviesByGenre(added.slug)
  } catch (err: unknown) {
    showToast('error', 'Error', getErrorMessage(err, 'Failed to add genre'))
  }
}
</script>
