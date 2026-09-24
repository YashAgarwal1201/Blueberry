<template>
  <div class="w-full h-full">
    <div class="w-full h-full flex flex-col border border-border rounded-xl overflow-hidden">
      <!-- A. Header / Search bar (always visible, never scrolls away) -->
      <div class="shrink-0 p-2 sm:p-3 flex flex-col gap-2">
        <h1 v-if="!query" class="font-heading text-2xl sm:text-3xl text-text">Search</h1>
        
        <div class="relative">
          <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            ref="inputRef"
            v-model="query"
            type="search"
            placeholder="Search movies, shows, people..."
            class="w-full pl-9 pr-8 py-2.5 rounded-lg border border-border bg-surface-1 text-text text-sm
                   placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
            autofocus
          />
          <button v-if="query" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted"
            @click="query = ''">
            <X :size="14" />
          </button>
        </div>

        <transition name="search-fade">
          <div v-if="query" class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              class="shrink-0 px-3 py-1 rounded-full text-xs border transition-colors active:opacity-80"
              :class="searchStore.activeTab === tab.value
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-1 text-text-muted border-border'"
              @click="searchStore.activeTab = tab.value as SearchTab"
            >
              {{ tab.label }}
              <span v-if="tab.count > 0" class="ml-1 opacity-70">({{ tab.count }})</span>
            </button>
          </div>
        </transition>
      </div>

      <!-- B. Scrollable body -->
      <div class="flex-1 overflow-y-auto p-2 sm:p-3">
        
        <!-- B1. Empty state -->
        <SearchEmptyState v-if="!query" @search="(term) => query = term" />
        
        <!-- B2. Skeleton (searching) -->
        <div v-else-if="searchStore.searching" class="flex flex-col gap-3">
          <div v-for="n in 5" :key="n"
            class="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-1 border border-border">
            <div class="w-12 h-18 rounded-lg bg-surface-3 animate-pulse shrink-0" />
            <div class="flex flex-col gap-2 flex-1">
              <div class="h-3 rounded bg-surface-3 animate-pulse w-3/4" />
              <div class="h-3 rounded bg-surface-3 animate-pulse w-1/3" />
              <div class="h-3 rounded bg-surface-3 animate-pulse w-1/2" />
            </div>
          </div>
        </div>
        
        <!-- B3. Zero results -->
        <div v-else-if="searchStore.totalCount === 0" class="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Search :size="32" class="text-text-muted" />
          <p class="text-text font-medium">No results for "{{ query }}"</p>
          <p class="text-text-muted text-sm">Check your spelling or try a different term.</p>
        </div>
        
        <!-- B4. Results -->
        <div v-else class="flex flex-col gap-6">
          <transition name="search-fade" mode="out-in">
            <div :key="searchStore.activeTab" class="flex flex-col gap-6 w-full">
              <!-- Movies Section -->
              <div v-if="(searchStore.activeTab === 'all' || searchStore.activeTab === 'movies') && searchStore.movieResults.length > 0">
                <div v-if="searchStore.activeTab === 'all'" class="flex items-center gap-3 mb-2">
                  <span class="font-heading text-[10px] text-text-muted uppercase tracking-widest whitespace-nowrap">
                    Movies
                  </span>
                  <div class="flex-1 h-px bg-border" />
                </div>
                <div class="flex flex-col gap-2">
                  <SearchResultRow
                    v-for="movie in visibleMovies"
                    :key="movie.uuid"
                    type="movie"
                    :item="movie"
                    @click="openMovieDrawer(movie)"
                  />
                </div>
                <button
                  v-if="searchStore.activeTab === 'all' && searchStore.movieResults.length > 5"
                  class="mt-2 text-xs text-primary font-medium flex items-center justify-center w-full py-2 bg-surface-2 rounded-lg active:bg-surface-3"
                  @click="searchStore.activeTab = 'movies'"
                >
                  Show all {{ searchStore.movieResults.length }} movies →
                </button>
              </div>

              <!-- Shows Section -->
              <div v-if="(searchStore.activeTab === 'all' || searchStore.activeTab === 'shows') && searchStore.showResults.length > 0">
                <div v-if="searchStore.activeTab === 'all'" class="flex items-center gap-3 mb-2">
                  <span class="font-heading text-[10px] text-text-muted uppercase tracking-widest whitespace-nowrap">
                    Shows
                  </span>
                  <div class="flex-1 h-px bg-border" />
                </div>
                <div class="flex flex-col gap-2">
                  <SearchResultRow
                    v-for="show in visibleShows"
                    :key="show.uuid"
                    type="show"
                    :item="show"
                    @click="openShowDrawer(show)"
                  />
                </div>
                <button
                  v-if="searchStore.activeTab === 'all' && searchStore.showResults.length > 5"
                  class="mt-2 text-xs text-primary font-medium flex items-center justify-center w-full py-2 bg-surface-2 rounded-lg active:bg-surface-3"
                  @click="searchStore.activeTab = 'shows'"
                >
                  Show all {{ searchStore.showResults.length }} shows →
                </button>
              </div>

              <!-- People Section -->
              <div v-if="(searchStore.activeTab === 'all' || searchStore.activeTab === 'people') && searchStore.peopleResults.length > 0">
                <div v-if="searchStore.activeTab === 'all'" class="flex items-center gap-3 mb-2">
                  <span class="font-heading text-[10px] text-text-muted uppercase tracking-widest whitespace-nowrap">
                    People
                  </span>
                  <div class="flex-1 h-px bg-border" />
                </div>
                <div class="flex flex-col gap-2">
                  <SearchResultRow
                    v-for="person in visiblePeople"
                    :key="person.id"
                    type="person"
                    :item="person"
                    @click="openPersonProfile(person)"
                  />
                </div>
                <button
                  v-if="searchStore.activeTab === 'all' && searchStore.peopleResults.length > 5"
                  class="mt-2 text-xs text-primary font-medium flex items-center justify-center w-full py-2 bg-surface-2 rounded-lg active:bg-surface-3"
                  @click="searchStore.activeTab = 'people'"
                >
                  Show all {{ searchStore.peopleResults.length }} people →
                </button>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
    
    <!-- Drawers -->
    <MediaDrawer
      v-model:visible="isMediaDrawerOpen"
      :media="selectedMedia"
      @watchlistAction="handleWatchlistAction"
      @removeWatchlistAction="handleRemoveWatchlistAction"
    />
    <PersonProfileDrawer
      v-model:visible="showProfile"
      :person="selectedPerson"
      :filmography="filmography"
      :filmography-loading="filmographyLoading"
      :filmography-loaded="filmographyLoaded"
      :saving="savingPerson"
      :deleting="deletingPerson"
      @load-filmography="loadFilmography"
      @save="saveEditPerson"
      @delete="confirmDeletePerson"
      @edit="onEditPerson"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, X } from 'lucide-vue-next'
import { useConfirm } from 'primevue/useconfirm'

import { useSearchStore, type SearchTab } from '@/stores/searchStore'
import { useSearch } from '@/composables/useSearch'
import { useWatchlistStore } from '@/stores/watchListStore'
import { useAuthStore } from '@/stores/authStore'
import { usePeopleStore } from '@/stores/peopleStore'
import apiClient from '@/services/apiInterceptors'
import toastHandler from '@/composables/toastHandeler'
import { getErrorMessage, getErrorStatus } from '@/services/errorUtils'

import SearchEmptyState from '@/components/search/SearchEmptyState.vue'
import SearchResultRow from '@/components/search/SearchResultRow.vue'
import MediaDrawer from '@/components/MediaDrawer.vue'
import PersonProfileDrawer from '@/components/people/PersonProfileDrawer.vue'
import type { MediaCard as MediaCardType, MovieWithDetails, TVShowCard, Person, CreatePersonRequest } from 'shared-types'

const router = useRouter()
const route = useRoute()
const searchStore = useSearchStore()
const { query } = useSearch()

const watchlistStore = useWatchlistStore()
const authStore = useAuthStore()
const peopleStore = usePeopleStore()

const { showToast } = toastHandler()
const confirm = useConfirm()

// Focus
const inputRef = ref<HTMLInputElement | null>(null)
onMounted(() => {
  if (route.query.q) query.value = String(route.query.q)
  if (route.query.type) searchStore.activeTab = String(route.query.type) as SearchTab
  
  setTimeout(() => {
    inputRef.value?.focus()
  }, 100)
})

watch([query, () => searchStore.activeTab], () => {
  const q = query.value.trim()
  router.replace({
    name: 'Search',
    query: {
      ...(q ? { q } : {}),
      ...(searchStore.activeTab !== 'all' ? { type: searchStore.activeTab } : {}),
    },
  })
})

const tabs = computed(() => [
  { label: 'All', value: 'all', count: searchStore.totalCount },
  { label: 'Movies', value: 'movies', count: searchStore.movieResults.length },
  { label: 'Shows', value: 'shows', count: searchStore.showResults.length },
  { label: 'People', value: 'people', count: searchStore.peopleResults.length },
])

const visibleMovies = computed(() => searchStore.activeTab === 'all' ? searchStore.movieResults.slice(0, 5) : searchStore.movieResults)
const visibleShows = computed(() => searchStore.activeTab === 'all' ? searchStore.showResults.slice(0, 5) : searchStore.showResults)
const visiblePeople = computed(() => searchStore.activeTab === 'all' ? searchStore.peopleResults.slice(0, 5) : searchStore.peopleResults)

// ── Drawers Logic ──────────────────────────────────────────

const isMediaDrawerOpen = ref(false)
const selectedMedia = ref<MediaCardType | null>(null)

function openMovieDrawer(movie: MovieWithDetails) {
  // Convert MovieWithDetails to MediaCard shape
  selectedMedia.value = {
    id: movie.id,
    uuid: movie.uuid,
    title: movie.title,
    release_year: movie.release_year,
    poster_url: movie.poster_url,
    backdrop_url: movie.backdrop_url,
    type: 'movie',
    genres: movie.genres,
    description: movie.description,
    runtime: movie.runtime,
    age_rating: movie.age_rating,
  }
  isMediaDrawerOpen.value = true
}

function openShowDrawer(show: TVShowCard) {
  // Use as MediaCard shape
  selectedMedia.value = {
    id: show.id,
    uuid: show.uuid,
    title: show.title,
    release_year: show.release_year,
    poster_url: show.poster_url,
    backdrop_url: show.backdrop_url, // may be undefined but valid
    type: 'tv',
    genres: show.genres,
    description: (show as any).description,
    runtime: (show as any).runtime,
    age_rating: (show as any).age_rating,
  }
  isMediaDrawerOpen.value = true
}

async function handleWatchlistAction(media: MediaCardType) {
  if (!authStore.isAuthenticated) {
    showToast('info', 'Login Required', 'Please login to use watchlist')
    return
  }
  try {
    if (media.type === 'movie') {
      await watchlistStore.addMovieToWatchlist(media.id, 'want_to_watch')
      showToast('success', 'Added', `${media.title} added to watchlist!`)
    } else {
      showToast('info', 'Coming Soon', 'Watchlist for TV shows is not supported yet.')
    }
  } catch (error) {
    console.error('Error in watchlist action:', error)
    showToast('error', 'Error', 'Could not add to watchlist (might already exist)')
  }
}

async function handleRemoveWatchlistAction(media: MediaCardType) {
  if (!authStore.isAuthenticated) {
    showToast('info', 'Login Required', 'Please login to use watchlist')
    return
  }
  try {
    if (media.type === 'movie') {
      const item = watchlistStore.getItemByMovieId(media.id)
      if (item) {
        await watchlistStore.removeFromWatchlist(item.id)
        showToast('success', 'Removed', `${media.title} removed from watchlist!`)
      }
    } else {
      showToast('info', 'Coming Soon', 'Watchlist for TV shows is not supported yet.')
    }
  } catch (error) {
    console.error('Error in remove watchlist action:', error)
    showToast('error', 'Error', 'Could not remove from watchlist')
  }
}

// ── Person Profile Logic ────────────────────────────────────
const showProfile = ref(false)
const selectedPerson = ref<Person | null>(null)

type FilmographyEntry = {
  id: number
  uuid: string
  title: string
  release_year: number | null
  poster_url: string | null
  role: string
  character: string | null
}
const filmography = ref<FilmographyEntry[]>([])
const filmographyLoading = ref(false)
const filmographyLoaded = ref(false)

function openPersonProfile(person: Person) {
  selectedPerson.value = person
  filmography.value = []
  filmographyLoaded.value = false
  showProfile.value = true
}

async function loadFilmography() {
  if (!selectedPerson.value) return
  filmographyLoading.value = true
  try {
    const res = await apiClient.get(`people/${selectedPerson.value.id}`)
    filmography.value = res.data.person.filmography || []
    filmographyLoaded.value = true
  } catch (err: unknown) {
    showToast('error', 'Error', getErrorMessage(err, 'Failed to load filmography'))
  } finally {
    filmographyLoading.value = false
  }
}

const savingPerson = ref(false)
async function saveEditPerson(form: CreatePersonRequest) {
  if (!selectedPerson.value) return
  savingPerson.value = true
  try {
    const res = await apiClient.put(`people/${selectedPerson.value.id}`, form)
    const updated: Person = res.data.person
    const idx = searchStore.peopleResults.findIndex((p) => p.id === updated.id)
    if (idx !== -1) searchStore.peopleResults[idx] = updated
    selectedPerson.value = updated
    showToast('success', 'Saved', `${updated.name} updated successfully`)
  } catch (err: unknown) {
    showToast('error', 'Error', getErrorMessage(err, 'Failed to save changes'))
  } finally {
    savingPerson.value = false
  }
}

function onEditPerson() {
  if (!selectedPerson.value) return
  showProfile.value = false
  router.push(`/people/${selectedPerson.value.id}/edit`)
}

const deletingPerson = ref(false)
function confirmDeletePerson() {
  if (!selectedPerson.value) return
  confirm.require({
    message: `Delete "${selectedPerson.value.name}"? This cannot be undone.`,
    header: 'Delete Person',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: async () => {
      if (!selectedPerson.value) return
      deletingPerson.value = true
      try {
        await apiClient.delete(`people/${selectedPerson.value.id}`)
        searchStore.peopleResults = searchStore.peopleResults.filter((p) => p.id !== selectedPerson.value!.id)
        showToast('success', 'Deleted', `${selectedPerson.value.name} removed`)
        showProfile.value = false
      } catch (err: unknown) {
        if (getErrorStatus(err) === 409) {
          showToast('warn', 'Cannot Delete', getErrorMessage(err, 'This person is credited in movies.'))
        } else {
          showToast('error', 'Error', getErrorMessage(err, 'Failed to delete person'))
        }
      } finally {
        deletingPerson.value = false
      }
    },
  })
}
</script>
