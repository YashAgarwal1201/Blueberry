<template>
  <div class="flex flex-col gap-y-6 max-w-4xl pb-10">
    <div class="flex flex-col gap-1">
      <h2 class="text-xl sm:text-2xl font-heading font-bold text-text">Blocked Titles</h2>
      <p class="font-content text-text-muted">Manage the movies and TV shows you have blocked. Blocked titles will not
        appear in your recommendations or search results.</p>
    </div>

    <div v-if="!authStore.isAuthenticated"
      class="bg-surface-1 p-8 rounded-3xl border border-border text-center shadow-lg">
      <div
        class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5 border border-primary/20">
        <UserCircle :size="32" class="text-primary" />
      </div>
      <h3 class="text-xl font-heading font-bold mb-3">Login Required</h3>
      <p class="text-text-muted font-content mb-6 max-w-md mx-auto leading-relaxed">
        You must be logged in to manage blocked titles.
      </p>
      <RouterLink to="/login"
        class="px-8 py-3 bg-primary text-on-primary rounded-xl font-bold inline-flex items-center hover:opacity-90 transition-all shadow-lg shadow-primary/20">
        Log In Now
      </RouterLink>
    </div>

    <div v-else class="flex flex-col gap-y-8">

      <!-- Blocked Movies -->
      <section class="flex flex-col gap-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Film :size="20" class="text-primary" />
            <h3 class="text-lg font-heading font-bold text-text">Blocked Movies</h3>
          </div>
          <span class="text-sm font-medium text-text-muted bg-surface-2 px-3 py-1 rounded-full">
            {{ preferencesStore.blockedMovies.length }}
          </span>
        </div>

        <div v-if="loadingMovies" class="flex items-center gap-2 text-text-muted">
          <Loader2 class="animate-spin" :size="16" /> Loading movies...
        </div>
        <div v-else-if="blockedMoviesData.length === 0"
          class="bg-surface-1 border border-border rounded-2xl p-6 text-center shadow-sm">
          <p class="text-text-muted">You haven't blocked any movies.</p>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div v-for="movie in blockedMoviesData" :key="movie.uuid"
            class="flex gap-3 bg-surface-1 border border-border rounded-xl p-3 shadow-sm items-center">
            <div class="w-12 h-16 shrink-0 bg-surface-3 rounded-lg bg-cover bg-center"
              :style="{ backgroundImage: movie.poster_url ? `url(${movie.poster_url})` : '' }"></div>
            <div class="flex flex-col min-w-0 flex-1">
              <span class="font-bold text-text truncate">{{ movie.title }}</span>
              <span class="text-xs text-text-muted">{{ movie.release_year }}</span>
            </div>
            <button @click="unblockMovie(movie.uuid)"
              class="w-8 h-8 rounded-full bg-surface-2 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center shrink-0 transition-colors"
              title="Unblock">
              <Unlock :size="14" />
            </button>
          </div>
        </div>
      </section>

      <!-- Blocked Shows -->
      <section class="flex flex-col gap-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Tv :size="20" class="text-primary" />
            <h3 class="text-lg font-heading font-bold text-text">Blocked TV Shows</h3>
          </div>
          <span class="text-sm font-medium text-text-muted bg-surface-2 px-3 py-1 rounded-full">
            {{ preferencesStore.blockedShows.length }}
          </span>
        </div>

        <div v-if="loadingShows" class="flex items-center gap-2 text-text-muted">
          <Loader2 class="animate-spin" :size="16" /> Loading shows...
        </div>
        <div v-else-if="blockedShowsData.length === 0"
          class="bg-surface-1 border border-border rounded-2xl p-6 text-center shadow-sm">
          <p class="text-text-muted">You haven't blocked any TV shows.</p>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div v-for="show in blockedShowsData" :key="show.uuid"
            class="flex gap-3 bg-surface-1 border border-border rounded-xl p-3 shadow-sm items-center">
            <div class="w-12 h-16 shrink-0 bg-surface-3 rounded-lg bg-cover bg-center"
              :style="{ backgroundImage: show.poster_url ? `url(${show.poster_url})` : '' }"></div>
            <div class="flex flex-col min-w-0 flex-1">
              <span class="font-bold text-text truncate">{{ show.title }}</span>
              <span class="text-xs text-text-muted">{{ show.first_air_date?.split('-')[0] }}</span>
            </div>
            <button @click="unblockShow(show.uuid)"
              class="w-8 h-8 rounded-full bg-surface-2 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center shrink-0 transition-colors"
              title="Unblock">
              <Unlock :size="14" />
            </button>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { UserCircle, Film, Tv, Unlock, Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { useMoviesStore } from '@/stores/moviesStore'
import { useTvStore } from '@/stores/tvStore'
import toastHandler from '@/composables/toastHandeler'
import type { MovieWithDetails, TVShowWithDetails } from 'shared-types'

const authStore = useAuthStore()
const preferencesStore = usePreferencesStore()
const moviesStore = useMoviesStore()
const tvStore = useTvStore()
const { showToast } = toastHandler()

const blockedMoviesData = ref<MovieWithDetails[]>([])
const blockedShowsData = ref<TVShowWithDetails[]>([])
const loadingMovies = ref(false)
const loadingShows = ref(false)

const loadBlockedMovies = async () => {
  if (!authStore.isAuthenticated) return
  loadingMovies.value = true
  blockedMoviesData.value = []
  try {
    for (const uuid of preferencesStore.blockedMovies) {
      const movie = await moviesStore.fetchMovieById(uuid)
      if (movie) blockedMoviesData.value.push(movie)
    }
  } catch (error) {
    console.error('Failed to load blocked movies', error)
  } finally {
    loadingMovies.value = false
  }
}

const loadBlockedShows = async () => {
  if (!authStore.isAuthenticated) return
  loadingShows.value = true
  blockedShowsData.value = []
  try {
    for (const uuid of preferencesStore.blockedShows) {
      const show = await tvStore.fetchShowById(uuid)
      if (show) blockedShowsData.value.push(show)
    }
  } catch (error) {
    console.error('Failed to load blocked shows', error)
  } finally {
    loadingShows.value = false
  }
}

const unblockMovie = async (uuid: string) => {
  try {
    await preferencesStore.unblockMovie(uuid)
    blockedMoviesData.value = blockedMoviesData.value.filter(m => m.uuid !== uuid)
    showToast('success', 'Unblocked', 'Movie has been unblocked.')
  } catch (error) {
    console.error('Failed to unblock movie', error)
    showToast('error', 'Error', 'Failed to unblock movie.')
  }
}

const unblockShow = async (uuid: string) => {
  try {
    await preferencesStore.unblockShow(uuid)
    blockedShowsData.value = blockedShowsData.value.filter((s: { uuid: string }) => s.uuid !== uuid)
    showToast('success', 'Unblocked', 'TV show has been unblocked.')
  } catch (error) {
    console.error('Failed to unblock show', error)
    showToast('error', 'Error', 'Failed to unblock show.')
  }
}

onMounted(() => {
  if (!preferencesStore.isFetching) {
    loadBlockedMovies()
    loadBlockedShows()
  }
})

watch(() => preferencesStore.isFetching, (isFetching) => {
  if (!isFetching) {
    loadBlockedMovies()
    loadBlockedShows()
  }
})
</script>
