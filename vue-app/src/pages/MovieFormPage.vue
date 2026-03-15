<template>
  <div
    class="w-full h-full p-2 sm:p-3 flex flex-col gap-y-6 md:gap-y-8 border border-border rounded-xl overflow-y-auto"
  >
    <div class="flex items-start justify-between gap-3">
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl text-text">
          {{ isEditMode ? 'Edit Movie' : 'Add Movie' }}
        </h1>
        <p class="font-content text-text-muted">
          {{ isEditMode ? 'Update movie details.' : 'Create a new movie with full details.' }}
        </p>
      </div>

      <RouterLink
        :to="isEditMode && movieId ? `/movies/${movieId}` : '/movies'"
        class="px-4 py-2 rounded-lg border border-border text-text text-sm"
      >
        Cancel
      </RouterLink>
    </div>

    <div v-if="loading" class="text-text-muted">Loading movie...</div>

    <form v-else class="flex flex-col gap-6" @submit.prevent="submitForm">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="flex flex-col gap-4">
          <div>
            <label class="block text-sm font-medium text-text mb-1">Title *</label>
            <input
              v-model="form.title"
              type="text"
              placeholder="Movie title"
              class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-text mb-1">Tagline</label>
            <input
              v-model="form.tagline"
              type="text"
              placeholder="Short tagline"
              class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-text mb-1">Description</label>
            <textarea
              v-model="form.description"
              rows="5"
              placeholder="Movie description"
              class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-text mb-1">Release Year</label>
              <input
                v-model.number="form.release_year"
                type="number"
                placeholder="2024"
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-text mb-1">Runtime</label>
              <input
                v-model.number="form.runtime"
                type="number"
                placeholder="120"
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-text mb-1">Status</label>
              <select
                v-model="form.status"
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
              >
                <option value="released">Released</option>
                <option value="upcoming">Upcoming</option>
                <option value="in_production">In Production</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-text mb-1">Age Rating</label>
              <input
                v-model="form.age_rating"
                type="text"
                placeholder="PG-13"
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-text mb-1">Director</label>
              <input
                v-model="form.director"
                type="text"
                placeholder="Director name"
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-text mb-1">Original Language</label>
              <input
                v-model="form.original_language"
                type="text"
                placeholder="en"
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-text mb-1">Origin Country</label>
            <input
              v-model="form.origin_country"
              type="text"
              placeholder="US"
              class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
            />
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <div>
            <label class="block text-sm font-medium text-text mb-1">Poster URL</label>
            <input
              v-model="form.poster_url"
              type="text"
              placeholder="https://example.com/poster.jpg"
              class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-text mb-1">Backdrop URL</label>
            <input
              v-model="form.backdrop_url"
              type="text"
              placeholder="https://example.com/backdrop.jpg"
              class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-text mb-1">Trailer URL</label>
            <input
              v-model="form.trailer_url"
              type="text"
              placeholder="https://youtube.com/watch?v=..."
              class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-text mb-1">IMDb ID</label>
              <input
                v-model="form.imdb_id"
                type="text"
                placeholder="tt1234567"
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-text mb-1">TMDB ID</label>
              <input
                v-model.number="form.tmdb_id"
                type="number"
                placeholder="12345"
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
              />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-sm font-medium text-text mb-1">IMDb</label>
              <input
                v-model.number="form.rating_imdb"
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="8.5"
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-text mb-1">RT</label>
              <input
                v-model.number="form.rating_rt"
                type="number"
                min="0"
                max="100"
                placeholder="90"
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-text mb-1">Meta</label>
              <input
                v-model.number="form.rating_metacritic"
                type="number"
                min="0"
                max="100"
                placeholder="75"
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-text mb-1">Budget</label>
              <input
                v-model.number="form.budget"
                type="number"
                placeholder="100000000"
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-text mb-1">Box Office</label>
              <input
                v-model.number="form.box_office"
                type="number"
                placeholder="500000000"
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface-1 text-text"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-text mb-2">Languages</label>
          <div class="flex flex-wrap gap-2">
            <label
              v-for="lang in languagesStore.languages"
              :key="lang.id"
              class="flex items-center gap-2 px-3 py-2 rounded-lg border border-border cursor-pointer bg-surface-1"
            >
              <input type="checkbox" :value="lang.id" v-model="form.language_ids" class="rounded" />
              <span class="text-sm text-text">{{ lang.name }}</span>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-text mb-2">Genres</label>
          <div class="flex flex-wrap gap-2">
            <label
              v-for="genre in genresStore.genres"
              :key="genre.id"
              class="flex items-center gap-2 px-3 py-2 rounded-lg border border-border cursor-pointer bg-surface-1"
            >
              <input type="checkbox" :value="genre.id" v-model="form.genre_ids" class="rounded" />
              <span class="text-sm text-text">{{ genre.name }}</span>
            </label>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <div>
          <h2 class="font-heading text-lg text-text">Cast</h2>
          <p class="text-sm text-text-muted">Add actors, directors, writers and other crew.</p>
        </div>
        <!-- <CastEditor v-model="form.cast" /> -->
        <CastEditor :model-value="form.cast ?? []" @update:model-value="form.cast = $event" />
      </div>

      <div class="flex gap-3">
        <button
          type="button"
          @click="resetForm"
          class="px-4 py-2 rounded-lg border border-border text-text"
        >
          Reset
        </button>

        <button
          type="submit"
          :disabled="saving"
          class="px-4 py-2 rounded-lg bg-primary text-on-primary disabled:opacity-60"
        >
          {{ saving ? 'Saving...' : isEditMode ? 'Update Movie' : 'Add Movie' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useMoviesStore } from '@/stores/moviesStore'
import { useLanguagesStore } from '@/stores/languagesStore'
import { useGenresStore } from '@/stores/genresStore'
import type { CreateMovieRequest, MovieWithDetails } from '@/types/movies'
import toastHandler from '@/composables/toastHandeler'
import CastEditor from '@/components/CastEditor.vue'
import { getErrorMessage } from '@/services/errorUtils'

const route = useRoute()
const router = useRouter()
const moviesStore = useMoviesStore()
const languagesStore = useLanguagesStore()
const genresStore = useGenresStore()
const showToast = toastHandler().showToast

const loading = ref(false)
const saving = ref(false)

const movieId = computed(() => {
  const id = Number(route.params.id)
  return Number.isNaN(id) ? null : id
})

const isEditMode = computed(() => movieId.value != null)

const createInitialForm = (): CreateMovieRequest => ({
  title: '',
  tagline: '',
  description: '',
  status: 'released',
  release_year: undefined,
  runtime: undefined,
  origin_country: '',
  original_language: '',
  age_rating: '',
  director: '',
  imdb_id: '',
  tmdb_id: undefined,
  poster_url: '',
  backdrop_url: '',
  trailer_url: '',
  budget: undefined,
  box_office: undefined,
  rating_imdb: undefined,
  rating_rt: undefined,
  rating_metacritic: undefined,
  language_ids: [],
  genre_ids: [],
  cast: [],
  companies: [],
})

const form = ref<CreateMovieRequest>(createInitialForm())

function applyMovieToForm(movie: MovieWithDetails) {
  form.value = {
    title: movie.title,
    tagline: movie.tagline ?? '',
    description: movie.description ?? '',
    status: movie.status ?? 'released',
    release_year: movie.release_year,
    runtime: movie.runtime,
    origin_country: movie.origin_country ?? '',
    original_language: movie.original_language ?? '',
    age_rating: movie.age_rating ?? '',
    director: movie.director ?? '',
    imdb_id: movie.imdb_id ?? '',
    tmdb_id: movie.tmdb_id,
    poster_url: movie.poster_url ?? '',
    backdrop_url: movie.backdrop_url ?? '',
    trailer_url: movie.trailer_url ?? '',
    budget: movie.budget,
    box_office: movie.box_office,
    rating_imdb: movie.rating_imdb,
    rating_rt: movie.rating_rt,
    rating_metacritic: movie.rating_metacritic,
    language_ids: movie.languages.map((l) => l.id),
    genre_ids: movie.genres.map((g) => g.id),
    cast: movie.cast.map((c) => ({
      person_id: c.id,
      name: c.name,
      profile_url: c.profile_url,
      tmdb_id: c.tmdb_id,
      imdb_id: c.imdb_id,
      role: c.role,
      character: c.character,
      display_order: c.display_order,
    })),
    companies: movie.companies.map((c) => ({
      company_id: c.id,
      name: c.name,
      type: c.type,
      logo_url: c.logo_url,
      country: c.country,
      role: c.role,
    })),
  }
}

function resetForm() {
  form.value = createInitialForm()
}

async function loadData() {
  try {
    await Promise.all([languagesStore.fetchLanguages(), genresStore.fetchGenres()])

    if (isEditMode.value && movieId.value) {
      loading.value = true
      const movie = await moviesStore.fetchMovieById(movieId.value)
      applyMovieToForm(movie)
    }
  } catch (err: unknown) {
    // showToast('error', 'Error', err.message || 'Failed to load data')
    showToast('error', 'Error', getErrorMessage(err, 'Failed to load data'))
  } finally {
    loading.value = false
  }
}

async function submitForm() {
  if (!form.value.title?.trim()) {
    showToast('error', 'Validation', 'Title is required')
    return
  }

  saving.value = true
  try {
    if (isEditMode.value && movieId.value) {
      const updated = await moviesStore.updateMovie(movieId.value, form.value)
      showToast('success', 'Updated', 'Movie updated successfully')
      router.push(`/movies/${updated.id}`)
    } else {
      const created = await moviesStore.addMovie(form.value)
      showToast('success', 'Created', 'Movie created successfully')
      router.push(`/movies/${created.id}`)
    }
  } catch (err: unknown) {
    // showToast('error', 'Error', err.message || 'Failed to save movie')
    showToast('error', 'Error', getErrorMessage(err, 'Failed to save movie'))
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
</script>
