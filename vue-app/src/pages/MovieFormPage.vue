<template>
  <div
    class="w-full h-full p-2 sm:p-3 flex flex-col gap-y-6 md:gap-y-8 border border-slate-200 dark:border-slate-700 rounded-xl"
  >
    <!-- Loading State -->
    <div v-if="loadingMovie" class="text-slate-500">Loading...</div>

    <!-- Form -->
    <div v-else class="flex flex-col gap-y-6">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <button
          @click="$router.back()"
          class="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
        >
          ← Back
        </button>
        <h1 class="font-heading text-2xl sm:text-3xl text-slate-900 dark:text-slate-100">
          {{ isEditMode ? 'Edit Movie' : 'Add New Movie' }}
        </h1>
      </div>

      <!-- Form Fields -->
      <div class="max-w-2xl flex flex-col gap-y-4">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Title <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.title"
            type="text"
            placeholder="Enter movie title"
            class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Description
          </label>
          <textarea
            v-model="formData.description"
            rows="4"
            placeholder="Enter movie description"
            class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          ></textarea>
        </div>

        <!-- Year & Runtime -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              Release Year
            </label>
            <input
              v-model.number="formData.release_year"
              type="number"
              placeholder="2024"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              Runtime (minutes)
            </label>
            <input
              v-model.number="formData.runtime"
              type="number"
              placeholder="120"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <!-- Director -->
        <div>
          <label class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Director
          </label>
          <input
            v-model="formData.director"
            type="text"
            placeholder="Enter director name"
            class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
        </div>

        <!-- Poster URL -->
        <div>
          <label class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Poster URL
          </label>
          <input
            v-model="formData.poster_url"
            type="text"
            placeholder="https://example.com/poster.jpg"
            class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
        </div>

        <!-- Languages -->
        <div>
          <label class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Languages
          </label>
          <div class="flex flex-wrap gap-2">
            <label
              v-for="lang in languagesStore.languages"
              :key="lang.id"
              class="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <input
                type="checkbox"
                :value="lang.id"
                v-model="formData.language_ids"
                class="rounded"
              />
              <span class="text-sm text-slate-900 dark:text-slate-100">{{ lang.name }}</span>
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 mt-4">
          <button
            @click="$router.back()"
            class="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            @click="handleSubmit"
            :disabled="loading"
            class="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50"
          >
            {{ loading ? 'Saving...' : isEditMode ? 'Update Movie' : 'Add Movie' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMoviesStore } from '@/stores/moviesStore'
import { useLanguagesStore } from '@/stores/languagesStore'
import type { CreateMovieRequest, UpdateMovieRequest } from '@/types/movies'

const route = useRoute()
const router = useRouter()
const moviesStore = useMoviesStore()
const languagesStore = useLanguagesStore()

const loadingMovie = ref(true)
const loading = ref(false)

// Check if we're in edit mode based on route
const isEditMode = computed(() => !!route.params.id)
const movieId = computed(() => parseInt(route.params.id as string))

const formData = ref<CreateMovieRequest | UpdateMovieRequest>({
  title: '',
  description: '',
  release_year: undefined,
  director: '',
  poster_url: '',
  runtime: undefined,
  language_ids: [],
})

onMounted(async () => {
  try {
    // Load languages
    if (languagesStore.languages.length === 0) {
      await languagesStore.fetchLanguages()
    }

    // If edit mode, load the movie
    if (isEditMode.value) {
      if (isNaN(movieId.value)) {
        alert('Invalid movie ID')
        router.push('/movies')
        return
      }

      const movie = await moviesStore.fetchMovieById(movieId.value)

      // Populate form with existing data
      formData.value = {
        title: movie.title,
        description: movie.description || '',
        release_year: movie.release_year,
        director: movie.director || '',
        poster_url: movie.poster_url || '',
        runtime: movie.runtime,
        language_ids: movie.languages.map((l) => l.id),
      }
    }
  } catch (err: any) {
    alert(err.message || 'Failed to load data')
    router.push('/movies')
  } finally {
    loadingMovie.value = false
  }
})

async function handleSubmit() {
  // Validation
  if (!formData.value.title?.trim()) {
    alert('Title is required')
    return
  }

  loading.value = true

  try {
    if (isEditMode.value) {
      // Update existing movie
      await moviesStore.updateMovie(movieId.value, formData.value as UpdateMovieRequest)
      router.replace(`/movies/${movieId.value}`)
    } else {
      // Create new movie
      const newMovie = await moviesStore.addMovie(formData.value as CreateMovieRequest)
      router.replace(`/movies/${newMovie.id}`)
    }
  } catch (err: any) {
    alert(err.message || `Failed to ${isEditMode.value ? 'update' : 'add'} movie`)
  } finally {
    loading.value = false
  }
}
</script>
