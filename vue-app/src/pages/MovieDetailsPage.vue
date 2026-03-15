<template>
  <div class="w-full h-full border border-border rounded-xl overflow-y-auto bg-surface-0">
    <div v-if="loading" class="p-4 text-text-muted">Loading movie...</div>

    <div v-else-if="error" class="p-4 text-red-500">
      {{ error }}
    </div>

    <div v-else-if="movie" class="flex flex-col">
      <div
        class="relative h-56 sm:h-72 md:h-80 bg-surface-2"
        :style="
          movie.backdrop_url
            ? {
                backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0.2)), url(${movie.backdrop_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {}
        "
      >
        <div class="absolute inset-x-0 bottom-0 p-4 sm:p-6 flex gap-4 items-end">
          <div
            v-if="movie.poster_url"
            class="w-24 sm:w-32 aspect-[2/3] rounded-xl bg-surface-3 border border-border shrink-0"
            :style="{
              backgroundImage: `url(${movie.poster_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }"
          ></div>
          <div
            v-else
            class="w-24 sm:w-32 aspect-[2/3] rounded-xl bg-surface-3 border border-border shrink-0 flex items-center justify-center text-text-muted text-xs"
          >
            No Poster
          </div>

          <div class="min-w-0">
            <h1 class="font-heading text-2xl sm:text-3xl text-white">
              {{ movie.title }}
            </h1>
            <p v-if="movie.tagline" class="text-sm sm:text-base text-white/80 italic mt-1">
              {{ movie.tagline }}
            </p>
            <div class="flex flex-wrap gap-2 mt-3 text-xs sm:text-sm text-white/85">
              <span v-if="movie.release_year">{{ movie.release_year }}</span>
              <span v-if="movie.runtime">• {{ movie.runtime }} min</span>
              <span v-if="movie.status">• {{ prettyStatus(movie.status) }}</span>
              <span v-if="movie.age_rating">• {{ movie.age_rating }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 sm:p-6 flex flex-col gap-6">
        <div class="flex flex-wrap gap-2">
          <button
            v-if="!isInWatchlist"
            @click="addToWatchlist"
            class="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm"
          >
            Add to Watchlist
          </button>

          <div v-else-if="watchlistItem" class="flex flex-wrap items-center gap-2">
            <span class="px-3 py-2 rounded-lg bg-primary-subtle text-primary text-sm">
              In Watchlist
            </span>

            <select
              :value="watchlistItem.status"
              @change="onStatusChange"
              class="px-3 py-2 rounded-lg border border-border bg-surface-1 text-text text-sm"
            >
              <option value="want_to_watch">Want to watch</option>
              <option value="watching">Watching</option>
              <option value="watched">Watched</option>
            </select>

            <button
              @click="removeFromWatchlist"
              class="px-4 py-2 rounded-lg border border-border text-text text-sm"
            >
              Remove
            </button>
          </div>

          <RouterLink
            :to="`/movies/${movie.id}/edit`"
            class="px-4 py-2 rounded-lg border border-border text-text text-sm"
          >
            Edit
          </RouterLink>

          <button
            @click="confirmDelete"
            class="px-4 py-2 rounded-lg border border-red-500 text-red-500 text-sm"
          >
            Delete
          </button>
        </div>

        <div v-if="movie.description" class="flex flex-col gap-2">
          <h2 class="font-heading text-lg text-text">Overview</h2>
          <p class="text-sm sm:text-base text-text-muted leading-relaxed">
            {{ movie.description }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex flex-col gap-4">
            <div v-if="movie.genres.length">
              <h3 class="font-heading text-base text-text mb-2">Genres</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="genre in movie.genres"
                  :key="genre.id"
                  class="px-3 py-1 rounded-full bg-primary-subtle text-primary text-xs"
                >
                  {{ genre.name }}
                </span>
              </div>
            </div>

            <div v-if="movie.languages.length">
              <h3 class="font-heading text-base text-text mb-2">Languages</h3>
              <div class="flex flex-wrap gap-2">
                <RouterLink
                  v-for="lang in movie.languages"
                  :to="'/languages/' + lang.code"
                  :key="lang.id"
                  class="px-3 py-1 rounded-full bg-surface-2 text-text text-xs"
                >
                  {{ lang.name }}<span v-if="lang.code"> ({{ lang.code }})</span>
                </RouterLink>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div v-if="movie.director" class="rounded-xl bg-surface-2 p-3">
                <div class="text-xs text-text-muted mb-1">Director</div>
                <div class="text-sm text-text">{{ movie.director }}</div>
              </div>

              <div v-if="movie.original_language" class="rounded-xl bg-surface-2 p-3">
                <div class="text-xs text-text-muted mb-1">Original Language</div>
                <div class="text-sm text-text">{{ movie.original_language }}</div>
              </div>

              <div v-if="movie.origin_country" class="rounded-xl bg-surface-2 p-3">
                <div class="text-xs text-text-muted mb-1">Origin Country</div>
                <div class="text-sm text-text">{{ movie.origin_country }}</div>
              </div>

              <div v-if="movie.imdb_id" class="rounded-xl bg-surface-2 p-3">
                <div class="text-xs text-text-muted mb-1">IMDb ID</div>
                <div class="text-sm text-text">{{ movie.imdb_id }}</div>
              </div>

              <div v-if="movie.tmdb_id" class="rounded-xl bg-surface-2 p-3">
                <div class="text-xs text-text-muted mb-1">TMDB ID</div>
                <div class="text-sm text-text">{{ movie.tmdb_id }}</div>
              </div>

              <div v-if="movie.trailer_url" class="rounded-xl bg-surface-2 p-3">
                <div class="text-xs text-text-muted mb-1">Trailer</div>
                <a
                  :href="movie.trailer_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sm text-primary underline break-all"
                >
                  Open trailer
                </a>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <div v-if="hasRatings">
              <h3 class="font-heading text-base text-text mb-2">Ratings</h3>
              <div class="grid grid-cols-3 gap-3">
                <div
                  v-if="movie.rating_imdb != null"
                  class="rounded-xl bg-surface-2 p-3 text-center"
                >
                  <div class="text-xs text-text-muted mb-1">IMDb</div>
                  <div class="text-lg font-heading text-text">{{ movie.rating_imdb }}</div>
                </div>
                <div v-if="movie.rating_rt != null" class="rounded-xl bg-surface-2 p-3 text-center">
                  <div class="text-xs text-text-muted mb-1">RT</div>
                  <div class="text-lg font-heading text-text">{{ movie.rating_rt }}%</div>
                </div>
                <div
                  v-if="movie.rating_metacritic != null"
                  class="rounded-xl bg-surface-2 p-3 text-center"
                >
                  <div class="text-xs text-text-muted mb-1">Metacritic</div>
                  <div class="text-lg font-heading text-text">{{ movie.rating_metacritic }}</div>
                </div>
              </div>
            </div>

            <div v-if="movie.budget != null || movie.box_office != null">
              <h3 class="font-heading text-base text-text mb-2">Financials</h3>
              <div class="grid grid-cols-2 gap-3">
                <div v-if="movie.budget != null" class="rounded-xl bg-surface-2 p-3">
                  <div class="text-xs text-text-muted mb-1">Budget</div>
                  <div class="text-sm text-text">{{ formatMoney(movie.budget) }}</div>
                </div>
                <div v-if="movie.box_office != null" class="rounded-xl bg-surface-2 p-3">
                  <div class="text-xs text-text-muted mb-1">Box Office</div>
                  <div class="text-sm text-text">{{ formatMoney(movie.box_office) }}</div>
                </div>
              </div>
            </div>

            <div v-if="movie.cast.length">
              <h3 class="font-heading text-base text-text mb-2">Cast & Crew</h3>
              <div class="flex flex-col gap-2">
                <div
                  v-for="member in sortedCast"
                  :key="`${member.id}-${member.role}-${member.display_order}`"
                  class="rounded-xl bg-surface-2 p-3"
                >
                  <div class="text-sm text-text">{{ member.name }}</div>
                  <div class="text-xs text-text-muted">
                    {{ member.role }}<span v-if="member.character"> • {{ member.character }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="movie.companies.length">
              <h3 class="font-heading text-base text-text mb-2">Companies</h3>
              <div class="flex flex-col gap-2">
                <div
                  v-for="company in movie.companies"
                  :key="`${company.id}-${company.role}`"
                  class="rounded-xl bg-surface-2 p-3"
                >
                  <div class="text-sm text-text">{{ company.name }}</div>
                  <div class="text-xs text-text-muted">
                    {{ company.role }}<span v-if="company.country"> • {{ company.country }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="watchlistItem?.notes" class="rounded-xl bg-surface-2 p-3">
          <div class="text-xs text-text-muted mb-1">Watchlist Notes</div>
          <div class="text-sm text-text">{{ watchlistItem.notes }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useMoviesStore } from '@/stores/moviesStore'
import { useWatchlistStore } from '@/stores/watchListStore'
import type { MovieWithDetails, WatchlistItemWithMovie, WatchlistStatus } from '@/types/movies'
import toastHandler from '@/composables/toastHandeler'
import { getErrorMessage } from '@/services/errorUtils'

const route = useRoute()
const router = useRouter()
const moviesStore = useMoviesStore()
const watchlistStore = useWatchlistStore()
const showToast = toastHandler().showToast

const movie = ref<MovieWithDetails | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const watchlistItem = computed<WatchlistItemWithMovie | undefined>(() => {
  if (!movie.value) return undefined
  return watchlistStore.getItemByMovieId(movie.value.id)
})

const isInWatchlist = computed(() => !!watchlistItem.value)

const hasRatings = computed(() => {
  if (!movie.value) return false
  return (
    movie.value.rating_imdb != null ||
    movie.value.rating_rt != null ||
    movie.value.rating_metacritic != null
  )
})

const sortedCast = computed(() => {
  if (!movie.value) return []
  return [...movie.value.cast].sort((a, b) => a.display_order - b.display_order)
})

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ')
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

async function loadMovie() {
  loading.value = true
  error.value = null
  try {
    const id = Number(route.params.id)
    if (!id) throw new Error('Invalid movie ID')
    movie.value = await moviesStore.fetchMovieById(id)
    await watchlistStore.fetchWatchlist()
  } catch (err: unknown) {
    const message = getErrorMessage(err, 'Failed to load movie')
    error.value = message
  } finally {
    loading.value = false
  }
}

async function addToWatchlist() {
  if (!movie.value) return
  try {
    await watchlistStore.addToWatchlist(movie.value.id, 'want_to_watch')
    showToast('success', 'Added', 'Movie added to watchlist')
  } catch (err: unknown) {
    // showToast('error', 'Error', err.message || 'Failed to add movie')
    showToast('error', 'Error', getErrorMessage(err, 'Failed to add movie'))
  }
}

async function removeFromWatchlist() {
  if (!watchlistItem.value) return
  try {
    await watchlistStore.removeFromWatchlist(watchlistItem.value.id)
    showToast('success', 'Removed', 'Movie removed from watchlist')
  } catch (err: unknown) {
    // showToast('error', 'Error', err.message || 'Failed to remove movie')
    showToast('error', 'Error', getErrorMessage(err, 'Failed to remove movie'))
  }
}

async function onStatusChange(event: Event) {
  if (!watchlistItem.value) return
  const target = event.target as HTMLSelectElement
  const status = target.value as WatchlistStatus
  try {
    await watchlistStore.updateStatus(watchlistItem.value.id, status)
    showToast('success', 'Updated', 'Watchlist status updated')
  } catch (err: unknown) {
    // showToast('error', 'Error', err.message || 'Failed to update status')
    showToast('error', 'Error', getErrorMessage(err, 'Failed to update status'))
  }
}

async function confirmDelete() {
  if (!movie.value) return
  const ok = window.confirm(`Delete "${movie.value.title}"?`)
  if (!ok) return
  try {
    await moviesStore.deleteMovie(movie.value.id)
    showToast('success', 'Deleted', 'Movie deleted successfully')
    router.push('/movies')
  } catch (err: unknown) {
    // showToast('error', 'Error', err.message || 'Failed to delete movie')
    showToast('error', 'Error', getErrorMessage(err, 'Failed to delete movie'))
  }
}

onMounted(loadMovie)
</script>
