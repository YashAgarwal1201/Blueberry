<template>
  <div
    class="w-full h-full p-2 sm:p-3 flex flex-col gap-y-6 md:gap-y-8 border border-slate-200 dark:border-slate-700 rounded-xl"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl text-slate-900 dark:text-slate-100">
          All Movies
        </h1>
        <p class="font-content text-slate-600 dark:text-slate-400">
          Browse and manage your movie collection
        </p>
      </div>

      <RouterLink
        :to="'/movies/add'"
        @click="showAddDialog = true"
        class="px-4 py-2 rounded-lg bg-indigo-700 dark:bg-indigo-600 text-white flex items-center gap-2"
      >
        <span>+ Add Movie</span>
      </RouterLink>
    </div>

    <!-- Filters & Search -->
    <div class="flex flex-col sm:flex-row gap-3">
      <!-- Search -->
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search movies..."
        class="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
      />

      <!-- Language Filter -->
      <select
        v-model="selectedLanguage"
        class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
      >
        <option value="">All Languages</option>
        <option v-for="lang in languagesStore.languages" :key="lang.id" :value="lang.code">
          {{ lang.name }}
        </option>
      </select>

      <!-- Year Filter -->
      <input
        v-model.number="selectedYear"
        type="number"
        placeholder="Year"
        class="w-32 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
      />

      <!-- Sort -->
      <select
        v-model="sortBy"
        class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
      >
        <option value="recent">Recent</option>
        <option value="title">Title (A-Z)</option>
        <option value="year">Year</option>
      </select>

      <!-- Apply Filters Button -->
      <button @click="applyFilters" class="px-4 py-2 rounded-lg bg-blue-600 text-white">
        Apply
      </button>
    </div>

    <!-- Movies Grid -->
    <div v-if="moviesStore.loading" class="text-slate-500">Loading movies...</div>
    <div v-else-if="moviesStore.movies.length === 0" class="text-slate-500">
      No movies found. Add your first movie!
    </div>
    <div
      v-else
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto"
    >
      <RouterLink
        v-for="movie in moviesStore.movies"
        :key="movie.id"
        :to="`/movies/${movie.id}`"
        class="rounded-xl bg-blue-50 dark:bg-slate-800 p-3 flex flex-col gap-2 hover:shadow-lg transition-shadow cursor-pointer"
      >
        <!-- Poster -->
        <div
          v-if="movie.poster_url"
          class="w-full aspect-[2/3] rounded-lg bg-slate-200 dark:bg-slate-700"
          :style="{
            backgroundImage: `url(${movie.poster_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }"
        ></div>
        <div
          v-else
          class="w-full aspect-[2/3] rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400"
        >
          No Poster
        </div>

        <!-- Title -->
        <div class="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
          {{ movie.title }}
        </div>

        <!-- Year & Runtime -->
        <div class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <span>{{ movie.release_year || 'N/A' }}</span>
          <span v-if="movie.runtime">• {{ movie.runtime }} min</span>
        </div>

        <!-- Languages -->
        <div class="flex flex-wrap gap-1">
          <span
            v-for="lang in movie.languages.slice(0, 2)"
            :key="lang.id"
            class="px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
          >
            {{ lang.code }}
          </span>
          <span
            v-if="movie.languages.length > 2"
            class="px-2 py-0.5 text-xs rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          >
            +{{ movie.languages.length - 2 }}
          </span>
        </div>

        <!-- Watchlist indicator -->
        <div
          v-if="watchlistStore.isInWatchlist(movie.id)"
          class="text-xs text-red-500 flex items-center gap-1"
        >
          <span>❤️</span>
          <span>In Watchlist</span>
        </div>
      </RouterLink>
    </div>

    <!-- Add Movie Dialog -->
    <div
      v-if="showAddDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showAddDialog = false"
    >
      <div
        class="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <h3 class="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Add New Movie</h3>

        <div class="flex flex-col gap-4">
          <!-- Title -->
          <div>
            <label class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
              >Title *</label
            >
            <input
              v-model="movieForm.title"
              type="text"
              placeholder="Movie title"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
              >Description</label
            >
            <textarea
              v-model="movieForm.description"
              rows="3"
              placeholder="Movie description"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            ></textarea>
          </div>

          <!-- Year & Runtime -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
                >Release Year</label
              >
              <input
                v-model.number="movieForm.release_year"
                type="number"
                placeholder="2024"
                class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
                >Runtime (mins)</label
              >
              <input
                v-model.number="movieForm.runtime"
                type="number"
                placeholder="120"
                class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <!-- Director -->
          <div>
            <label class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
              >Director</label
            >
            <input
              v-model="movieForm.director"
              type="text"
              placeholder="Director name"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <!-- Poster URL -->
          <div>
            <label class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
              >Poster URL</label
            >
            <input
              v-model="movieForm.poster_url"
              type="text"
              placeholder="https://example.com/poster.jpg"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <!-- Languages -->
          <div>
            <label class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
              >Languages</label
            >
            <div class="flex flex-wrap gap-2">
              <label
                v-for="lang in languagesStore.languages"
                :key="lang.id"
                class="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <input
                  type="checkbox"
                  :value="lang.id"
                  v-model="movieForm.language_ids"
                  class="rounded"
                />
                <span class="text-sm text-slate-900 dark:text-slate-100">{{ lang.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Dialog Actions -->
        <div class="flex gap-3 mt-6">
          <button
            @click="showAddDialog = false"
            class="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>
          <button @click="addMovie" class="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white">
            Add Movie
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useMoviesStore } from '@/stores/moviesStore'
import { useLanguagesStore } from '@/stores/languagesStore'
import { useMainStore } from '@/stores/mainStore'
import { useWatchlistStore } from '@/stores/watchListStore'
import type { CreateMovieRequest } from '@/types/movies'

const moviesStore = useMoviesStore()
const languagesStore = useLanguagesStore()
const watchlistStore = useWatchlistStore()
const mainStore = useMainStore()

// Filter state
const searchQuery = ref('')
const selectedLanguage = ref('')
const selectedYear = ref<number | undefined>(undefined)
const sortBy = ref<'recent' | 'title' | 'year'>('recent')

// Dialog state
const showAddDialog = ref(false)
const movieForm = ref<CreateMovieRequest>({
  title: '',
  description: '',
  release_year: undefined,
  director: '',
  poster_url: '',
  runtime: undefined,
  language_ids: [],
})

onMounted(async () => {
  if (mainStore.backend.url) {
    await Promise.all([
      moviesStore.fetchMovies({ sort: sortBy.value }),
      languagesStore.fetchLanguages(),
      watchlistStore.fetchWatchlist(),
    ])
  }
})

async function applyFilters() {
  const params: any = {
    sort: sortBy.value,
  }

  if (searchQuery.value) params.search = searchQuery.value
  if (selectedLanguage.value) params.language = selectedLanguage.value
  if (selectedYear.value) params.year = selectedYear.value

  await moviesStore.fetchMovies(params)
}

async function addMovie() {
  if (!movieForm.value.title?.trim()) {
    alert('Title is required')
    return
  }

  try {
    await moviesStore.addMovie(movieForm.value)
    showAddDialog.value = false
    // Reset form
    movieForm.value = {
      title: '',
      description: '',
      release_year: undefined,
      director: '',
      poster_url: '',
      runtime: undefined,
      language_ids: [],
    }
  } catch (err: any) {
    alert(err.message || 'Failed to add movie')
  }
}
</script>
