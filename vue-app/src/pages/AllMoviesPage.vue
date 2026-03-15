<template>
  <div class="w-full h-full flex flex-col border border-border rounded-xl overflow-hidden">
    <!-- ── Header (never scrolls) ── -->
    <div class="flex items-center justify-between p-2 sm:p-3 shrink-0">
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl text-text">All Movies</h1>
        <p class="font-content text-text-muted hidden sm:block">
          Browse and manage your movie collection
        </p>
      </div>
      <RouterLink
        to="/movies/add"
        class="px-3 py-2 rounded-lg bg-primary text-on-primary text-sm flex items-center gap-1.5 shrink-0"
      >
        <Plus :size="15" />
        <span>Add Movie</span>
      </RouterLink>
    </div>

    <!-- ── Sticky filter bar ── -->
    <div
      class="sticky top-0 z-10 bg-surface-0 border-b border-border px-2 sm:px-3 py-2 flex flex-col gap-2 shrink-0"
    >
      <!-- Row 1: Search (full width) -->
      <div class="relative">
        <Search
          :size="15"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search movies..."
          class="w-full pl-9 pr-8 py-2 rounded-lg border border-border bg-surface-1 text-text text-sm placeholder:text-text-muted"
        />
        <button
          v-if="searchQuery"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
          @click="searchQuery = ''"
        >
          <X :size="14" />
        </button>
      </div>

      <!-- Row 2: Language + Year + Sort in one tight row -->
      <div class="flex gap-2 items-center">
        <!-- Language -->
        <select
          v-model="selectedLanguage"
          class="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-border bg-surface-1 text-text text-xs"
          @change="applyFilters"
        >
          <option value="">All Languages</option>
          <option v-for="lang in languagesStore.languages" :key="lang.id" :value="lang.code">
            {{ lang.name }}
          </option>
        </select>

        <!-- Year -->
        <select
          v-model.number="selectedYear"
          class="w-24 shrink-0 px-2 py-1.5 rounded-lg border border-border bg-surface-1 text-text text-xs"
          @change="applyFilters"
        >
          <option :value="undefined">Year</option>
          <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
        </select>

        <!-- Sort -->
        <select
          v-model="sortBy"
          class="w-24 shrink-0 px-2 py-1.5 rounded-lg border border-border bg-surface-1 text-text text-xs"
          @change="applyFilters"
        >
          <option value="recent">Recent</option>
          <option value="title">A → Z</option>
          <option value="year">Year</option>
        </select>

        <!-- Clear — only visible when a filter is active -->
        <button
          v-if="hasActiveFilters"
          class="shrink-0 text-xs text-primary underline whitespace-nowrap"
          @click="clearFilters"
        >
          Clear
        </button>
      </div>

      <!-- Active filter chips -->
      <div v-if="hasActiveFilters" class="flex flex-wrap gap-1.5">
        <span
          v-if="selectedLanguage"
          class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-subtle text-primary text-xs"
        >
          {{ languageLabel }}
          <button @click="((selectedLanguage = ''), applyFilters())">
            <X :size="10" />
          </button>
        </span>
        <span
          v-if="selectedYear"
          class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-subtle text-primary text-xs"
        >
          {{ selectedYear }}
          <button @click="((selectedYear = undefined), applyFilters())">
            <X :size="10" />
          </button>
        </span>
        <span
          v-if="sortBy !== 'recent'"
          class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-2 text-text-muted text-xs"
        >
          Sort: {{ sortLabel }}
          <button @click="((sortBy = 'recent'), applyFilters())">
            <X :size="10" />
          </button>
        </span>
      </div>
    </div>

    <!-- ── Scrollable content area ── -->
    <div class="flex-1 overflow-y-auto p-2 sm:p-3">
      <!-- Count line -->
      <p v-if="!moviesStore.loading" class="text-xs text-text-muted mb-3">
        {{ displayedMovies.length }} movie{{ displayedMovies.length !== 1 ? 's' : '' }}
        <template v-if="hasActiveFilters"> — filtered</template>
      </p>

      <!-- Skeletons -->
      <div
        v-if="moviesStore.loading"
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
      >
        <div v-for="n in 10" :key="n" class="flex flex-col gap-2">
          <div class="w-full aspect-[2/3] rounded-xl bg-surface-3 animate-pulse" />
          <div class="h-3 rounded bg-surface-3 animate-pulse w-3/4" />
          <div class="h-3 rounded bg-surface-3 animate-pulse w-1/2" />
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="displayedMovies.length === 0"
        class="flex flex-col items-center justify-center gap-3 py-20 text-center"
      >
        <span class="text-4xl">🎬</span>
        <p class="text-text font-medium">
          {{ hasActiveFilters ? 'No movies match your filters.' : 'No movies yet.' }}
        </p>
        <p class="text-text-muted text-sm">
          {{
            hasActiveFilters
              ? 'Try adjusting or clearing the filters.'
              : 'Add your first movie to get started.'
          }}
        </p>
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="text-sm text-primary underline"
        >
          Clear filters
        </button>
      </div>

      <!-- Grid -->
      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <RouterLink
          v-for="movie in displayedMovies"
          :key="movie.id"
          :to="`/movies/${movie.id}`"
          class="flex flex-col gap-1.5 group cursor-pointer"
        >
          <!-- Poster -->
          <div
            v-if="movie.poster_url"
            class="w-full aspect-[2/3] rounded-xl bg-surface-3 group-hover:ring-2 group-hover:ring-primary transition-all"
            :style="{
              backgroundImage: `url(${movie.poster_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }"
          />
          <div
            v-else
            class="w-full aspect-[2/3] rounded-xl bg-surface-3 flex items-center justify-center text-text-muted text-xs group-hover:ring-2 group-hover:ring-primary transition-all"
          >
            No Poster
          </div>

          <!-- Title -->
          <p class="text-xs font-medium text-text line-clamp-2 px-0.5">{{ movie.title }}</p>

          <!-- Meta row -->
          <div class="flex items-center gap-1 px-0.5">
            <span class="text-xs text-text-muted">{{ movie.release_year || 'N/A' }}</span>
            <span v-if="movie.runtime" class="text-xs text-text-muted">• {{ movie.runtime }}m</span>
          </div>

          <!-- Language chips — max 2 -->
          <div class="flex flex-wrap gap-1 px-0.5">
            <span
              v-for="lang in movie.languages.slice(0, 2)"
              :key="lang.id"
              class="px-1.5 py-0.5 text-xs rounded-full bg-primary-subtle text-primary"
            >
              {{ lang.code }}
            </span>
            <span
              v-if="movie.languages.length > 2"
              class="px-1.5 py-0.5 text-xs rounded-full bg-surface-3 text-text-muted"
            >
              +{{ movie.languages.length - 2 }}
            </span>
          </div>

          <!-- Watchlist badge -->
          <div
            v-if="watchlistStore.isInWatchlist(movie.id)"
            class="flex items-center gap-1 px-0.5 text-xs text-red-400"
          >
            <Heart :size="11" class="fill-red-400" />
            <span>In Watchlist</span>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Heart, Plus, Search, X } from 'lucide-vue-next'
import { useMoviesStore } from '@/stores/moviesStore'
import { useLanguagesStore } from '@/stores/languagesStore'
import { useMainStore } from '@/stores/mainStore'
import { useWatchlistStore } from '@/stores/watchListStore'

const moviesStore = useMoviesStore()
const languagesStore = useLanguagesStore()
const watchlistStore = useWatchlistStore()
const mainStore = useMainStore()

// ── Filter state ──────────────────────────────────────────────────────────────
const searchQuery = ref('')
const selectedLanguage = ref('')
const selectedYear = ref<number | undefined>(undefined)
const sortBy = ref<'recent' | 'title' | 'year'>('recent')

// ── Derived ───────────────────────────────────────────────────────────────────
const hasActiveFilters = computed(
  () =>
    !!searchQuery.value.trim() ||
    !!selectedLanguage.value ||
    !!selectedYear.value ||
    sortBy.value !== 'recent',
)

const availableYears = computed(() => {
  const years = moviesStore.movies.map((m) => m.release_year).filter((y): y is number => !!y)
  return [...new Set(years)].sort((a, b) => b - a)
})

const languageLabel = computed(() => {
  const lang = languagesStore.languages.find((l) => l.code === selectedLanguage.value)
  return lang?.name ?? selectedLanguage.value
})

const sortLabel = computed(() => ({ recent: 'Recent', title: 'A→Z', year: 'Year' })[sortBy.value])

// ── Client-side display list ──────────────────────────────────────────────────
// Search is always client-side (instant). Language/year/sort hit the API.
const displayedMovies = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return moviesStore.movies
  return moviesStore.movies.filter(
    (m) =>
      m.title.toLowerCase().includes(q) ||
      m.director?.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q) ||
      m.genres.some((g) => g.name.toLowerCase().includes(q)) ||
      m.cast.some((c) => c.name.toLowerCase().includes(q)),
  )
})

// ── Search debounce — no API call, just filters displayedMovies computed ──────
// (API calls only happen for language / year / sort changes)
const searchTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer)
  // Intentionally no API call here — searchLocal is enough
})

// ── API filter application (language / year / sort) ──────────────────────────
async function applyFilters() {
  const params: Parameters<typeof moviesStore.fetchMovies>[0] = { sort: sortBy.value }
  if (selectedLanguage.value) params.language = selectedLanguage.value
  if (selectedYear.value) params.year = selectedYear.value
  await moviesStore.fetchMovies(params)
}

function clearFilters() {
  searchQuery.value = ''
  selectedLanguage.value = ''
  selectedYear.value = undefined
  sortBy.value = 'recent'
  moviesStore.fetchMovies({ sort: 'recent' })
}

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (!mainStore.backend.url) return
  await Promise.all([
    moviesStore.fetchMovies({ sort: 'recent' }),
    languagesStore.fetchLanguages(),
    watchlistStore.fetchWatchlist(),
  ])
})
</script>
