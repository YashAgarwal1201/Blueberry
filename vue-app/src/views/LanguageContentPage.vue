<template>
  <div class="w-full h-full flex flex-col gap-y-8 overflow-y-auto">

    <!-- A. Plain text header -->
    <div class="flex items-center gap-3 shrink-0">
      <GoBackButton class="bg-surface-2 hover:bg-surface-3" />
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl text-text capitalize">
          {{ language?.native_script || language?.name || code }}
        </h1>
        <p v-if="language?.native_script" class="text-text-muted font-content text-sm">
          {{ language.name }}
        </p>
      </div>
    </div>

    <!-- B. Skeleton -->
    <div v-if="isLoading" class="flex flex-col gap-10">
      <div v-for="n in 3" :key="n" class="flex flex-col gap-4">
        <div class="h-5 w-28 rounded-lg bg-surface-3 animate-pulse mx-2" />
        <div class="flex gap-3 px-2 overflow-hidden">
          <div v-for="m in 5" :key="m"
            class="shrink-0 w-36 sm:w-44 aspect-2/3 rounded-xl bg-surface-3 animate-pulse" />
        </div>
      </div>
    </div>

    <!-- C. Empty state -->
    <div v-else-if="sections.length === 0" class="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <span class="text-4xl">🎬</span>
      <p class="text-text font-medium">No movies in this language yet.</p>
      <p class="text-text-muted text-sm">Add movies and assign this language to see them here.</p>
    </div>

    <!-- D. Genre carousel sections -->
    <div v-else class="flex flex-col gap-10">
      <div v-for="section in sections" :key="section.genre.slug" class="flex flex-col gap-4">

        <!-- Section label row -->
        <div class="flex items-center gap-2 px-2">
          <h2 class="font-heading text-xl font-bold text-text">{{ section.genre.name }}</h2>
          <span class="ml-auto text-xs text-text-muted tabular-nums">
            {{ section.movies.length }} title{{ section.movies.length !== 1 ? 's' : '' }}
          </span>
        </div>

        <MediaCarousel :items="section.movies">
          <template #default="{ item }">
            <MediaCard
              :title="item.title"
              :poster-url="item.poster_url"
              :year="item.release_year"
              :type="item.type || 'movie'"
              @click="openDrawer(item)"
            />
          </template>
        </MediaCarousel>

      </div>
    </div>

    <!-- E. Bottom drawer -->
    <MediaDrawer v-model:visible="isDrawerOpen" :media="selectedMedia"
      @watchlistAction="handleWatchlistAction"
      @removeWatchlistAction="handleRemoveWatchlistAction" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import GoBackButton from '@/components/GoBackButton.vue'
import MediaCarousel from '@/components/MediaCarousel.vue'
import MediaCard from '@/components/MediaCard.vue'
import MediaDrawer from '@/components/MediaDrawer.vue'
import { useLanguagesStore } from '@/stores/languagesStore'
import { useWatchlistStore } from '@/stores/watchListStore'
import { useAuthStore } from '@/stores/authStore'
import toastHandler from '@/composables/toastHandeler'
import type { MediaCard as MediaCardType, MovieCard } from 'shared-types'

const route = useRoute()
const languagesStore = useLanguagesStore()
const watchlistStore = useWatchlistStore()
const authStore = useAuthStore()
const { showToast } = toastHandler()

const code = computed(() => route.params.code as string)
const language = computed(() => languagesStore.languageByCode.get(code.value))
const sections = computed(() => languagesStore.sectionsByLanguage.get(code.value) ?? [])
const isLoading = computed(() => languagesStore.sectionsLoadingMap.get(code.value) ?? false)

async function loadData() {
  if (!languagesStore.languages.length) await languagesStore.fetchLanguages()
  if (!languagesStore.sectionsByLanguage.has(code.value)) {
    await languagesStore.fetchLanguageSections(code.value)
  }
}

onMounted(loadData)

watch(() => route.params.code, () => {
  if (route.name === 'language-content') {
    loadData()
  }
})

// Drawer logic
const isDrawerOpen = ref(false)
const selectedMedia = ref<MediaCardType | null>(null)

function openDrawer(movie: MovieCard) {
  selectedMedia.value = {
    id: movie.id,
    uuid: movie.uuid,
    title: movie.title,
    release_year: movie.release_year,
    poster_url: movie.poster_url,
    backdrop_url: movie.backdrop_url,
    type: 'movie',
    genres: movie.genres,
    description: (movie as any).description,
    runtime: movie.runtime,
    age_rating: movie.age_rating,
    status: movie.status || 'released',
    in_watchlist: movie.in_watchlist || false
  }
  isDrawerOpen.value = true
}

async function handleWatchlistAction(media: MediaCardType) {
  if (!authStore.isAuthenticated) {
    showToast('info', 'Login Required', 'Please login to use watchlist')
    return
  }
  try {
    await watchlistStore.addMovieToWatchlist(media.id, 'want_to_watch')
    showToast('success', 'Added', `${media.title} added to watchlist!`)
  } catch (error) {
    console.error('Error in watchlist action:', error)
    showToast('error', 'Error', 'Could not add to watchlist')
  }
}

async function handleRemoveWatchlistAction(media: MediaCardType) {
  if (!authStore.isAuthenticated) {
    showToast('info', 'Login Required', 'Please login to use watchlist')
    return
  }
  try {
    const item = watchlistStore.getItemByMovieId(media.id)
    if (item) {
      await watchlistStore.removeFromWatchlist(item.id)
      showToast('success', 'Removed', `${media.title} removed from watchlist!`)
    }
  } catch (error) {
    console.error('Error in remove watchlist action:', error)
    showToast('error', 'Error', 'Could not remove from watchlist')
  }
}
</script>
