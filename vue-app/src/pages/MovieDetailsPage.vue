<template>
  <div
    class="w-full h-full p-2 sm:p-3 flex flex-col gap-y-6 md:gap-y-8 border border-slate-200 dark:border-slate-700 rounded-xl overflow-y-auto"
  >
    <!-- Loading State -->
    <div v-if="loading" class="text-slate-500">Loading movie details...</div>

    <!-- Error State -->
    <div v-else-if="error" class="text-red-500">{{ error }}</div>

    <!-- Movie Details -->
    <div v-else-if="movie" class="flex flex-col gap-6">
      <!-- Header with Back Button -->
      <div class="flex items-center gap-3">
        <Button
          @click="$router.back()"
          class="p-2 rounded-lg !bg-slate-200 dark:!bg-slate-700 !text-slate-700 dark:!text-slate-300"
        >
          ← Back
        </Button>
        <h1 class="font-heading text-2xl sm:text-3xl text-slate-900 dark:text-slate-100">
          {{ movie.title }}
        </h1>
      </div>

      <!-- Movie Content -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Poster -->
        <div class="md:col-span-1">
          <div
            v-if="movie.poster_url"
            class="w-full aspect-[2/3] rounded-xl bg-slate-200 dark:bg-slate-700"
            :style="{
              backgroundImage: `url(${movie.poster_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }"
          ></div>
          <div
            v-else
            class="w-full aspect-[2/3] rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400"
          >
            No Poster Available
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col gap-2 mt-4">
            <!-- Watchlist Button -->
            <button
              v-if="!isInWatchlist"
              @click="addToWatchlist"
              class="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white flex items-center justify-center gap-2"
            >
              <span>❤️</span>
              <span>Add to Watchlist</span>
            </button>
            <button
              v-else
              @click="removeFromWatchlist"
              class="w-full px-4 py-2 rounded-lg bg-red-500 text-white flex items-center justify-center gap-2"
            >
              <span>💔</span>
              <span>Remove from Watchlist</span>
            </button>

            <!-- Edit Button -->

            <RouterLink
              :to="`/movies/${movie.id}/edit`"
              class="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-center"
              >Edit Movie</RouterLink
            >

            <!-- Delete Button -->
            <button
              @click="confirmDelete"
              class="w-full px-4 py-2 rounded-lg bg-red-600 text-white"
            >
              Delete Movie
            </button>
          </div>
        </div>

        <!-- Details -->
        <div class="md:col-span-2 flex flex-col gap-4">
          <!-- Basic Info -->
          <div class="p-4 rounded-xl bg-blue-50 dark:bg-slate-800">
            <h3 class="text-lg font-heading mb-3 text-slate-900 dark:text-slate-100">
              Information
            </h3>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-slate-500 dark:text-slate-400">Release Year:</span>
                <span class="ml-2 text-slate-900 dark:text-slate-100">
                  {{ movie.release_year || 'N/A' }}
                </span>
              </div>
              <div>
                <span class="text-slate-500 dark:text-slate-400">Runtime:</span>
                <span class="ml-2 text-slate-900 dark:text-slate-100">
                  {{ movie.runtime ? movie.runtime + ' minutes' : 'N/A' }}
                </span>
              </div>
              <div>
                <span class="text-slate-500 dark:text-slate-400">Director:</span>
                <span class="ml-2 text-slate-900 dark:text-slate-100">
                  {{ movie.director || 'N/A' }}
                </span>
              </div>
              <div>
                <span class="text-slate-500 dark:text-slate-400">Added:</span>
                <span class="ml-2 text-slate-900 dark:text-slate-100">
                  {{ new Date(movie.created_at).toLocaleDateString() }}
                </span>
              </div>
            </div>
          </div>

          <!-- Languages -->
          <div class="p-4 rounded-xl bg-blue-50 dark:bg-slate-800">
            <h3 class="text-lg font-heading mb-3 text-slate-900 dark:text-slate-100">Languages</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="lang in movie.languages"
                :key="lang.id"
                class="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-sm"
              >
                {{ lang.name }} ({{ lang.code }})
              </span>
              <span v-if="movie.languages.length === 0" class="text-slate-500 text-sm">
                No languages specified
              </span>
            </div>
          </div>

          <!-- Description -->
          <div class="p-4 rounded-xl bg-blue-50 dark:bg-slate-800">
            <h3 class="text-lg font-heading mb-3 text-slate-900 dark:text-slate-100">
              Description
            </h3>
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
              {{ movie.description || 'No description available.' }}
            </p>
          </div>

          <!-- Watchlist Status -->
          <div v-if="watchlistItem" class="p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
            <h3 class="text-lg font-heading mb-2 text-slate-900 dark:text-slate-100">
              Watchlist Status
            </h3>
            <div class="flex items-center gap-3">
              <select
                v-model="watchlistItem.status"
                @change="updateWatchlistStatus"
                class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="want_to_watch">Want to Watch</option>
                <option value="watching">Currently Watching</option>
                <option value="watched">Watched</option>
              </select>
              <span class="text-sm text-slate-500">
                Added: {{ new Date(watchlistItem.added_at).toLocaleDateString() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useMoviesStore } from '@/stores/moviesStore'
import { useLanguagesStore } from '@/stores/languagesStore'
// import { useMainStore } from '@/stores/mainStore'
import { useWatchlistStore } from '@/stores/watchListStore'
import type { Movie, UpdateMovieRequest } from '@/types/movies'
import { Button } from 'primevue'

const route = useRoute()
const router = useRouter()
const moviesStore = useMoviesStore()
const languagesStore = useLanguagesStore()
const watchlistStore = useWatchlistStore()
// const mainStore = useMainStore()

const movie = ref<Movie | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
// const showEditDialog = ref(false)

const editForm = ref<UpdateMovieRequest>({
  title: '',
  description: '',
  release_year: undefined,
  director: '',
  poster_url: '',
  runtime: undefined,
  language_ids: [],
})

// Check if movie is in watchlist
const isInWatchlist = computed(() => {
  return movie.value ? watchlistStore.isInWatchlist(movie.value.id) : false
})

const watchlistItem = computed(() => {
  return movie.value ? watchlistStore.getItemByMovieId(movie.value.id) : null
})

onMounted(async () => {
  const movieId = parseInt(route.params.id as string)

  if (isNaN(movieId)) {
    error.value = 'Invalid movie ID'
    loading.value = false
    return
  }

  try {
    await Promise.all([languagesStore.fetchLanguages(), watchlistStore.fetchWatchlist()])

    movie.value = await moviesStore.fetchMovieById(movieId)

    // Populate edit form
    if (movie.value) {
      editForm.value = {
        title: movie.value.title,
        description: movie.value.description,
        release_year: movie.value.release_year,
        director: movie.value.director,
        poster_url: movie.value.poster_url,
        runtime: movie.value.runtime,
        language_ids: movie.value.languages.map((l) => l.id),
      }
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load movie'
  } finally {
    loading.value = false
  }
})

async function addToWatchlist() {
  if (!movie.value) return

  try {
    await watchlistStore.addToWatchlist(movie.value.id, 'want_to_watch')
  } catch (err: any) {
    alert(err.message || 'Failed to add to watchlist')
  }
}

async function removeFromWatchlist() {
  if (!watchlistItem.value) return

  try {
    await watchlistStore.removeFromWatchlist(watchlistItem.value.id)
  } catch (err: any) {
    alert(err.message || 'Failed to remove from watchlist')
  }
}

async function updateWatchlistStatus() {
  if (!watchlistItem.value) return

  try {
    await watchlistStore.updateStatus(watchlistItem.value.id, watchlistItem.value.status)
  } catch (err: any) {
    alert(err.message || 'Failed to update status')
  }
}

// async function updateMovie() {
//   if (!movie.value || !editForm.value.title?.trim()) {
//     alert('Title is required')
//     return
//   }

//   try {
//     const updated = await moviesStore.updateMovie(movie.value.id, editForm.value)
//     movie.value = updated
//     showEditDialog.value = false
//   } catch (err: any) {
//     alert(err.message || 'Failed to update movie')
//   }
// }

async function confirmDelete() {
  if (!movie.value) return

  if (confirm(`Are you sure you want to delete "${movie.value.title}"?`)) {
    try {
      await moviesStore.deleteMovie(movie.value.id)
      router.push('/movies')
    } catch (err: any) {
      alert(err.message || 'Failed to delete movie')
    }
  }
}
</script>
