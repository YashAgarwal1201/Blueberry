<template>
  <div class="w-full h-full overflow-y-auto bg-surface-0 hide-scrollbar relative">

    <!-- Background Image that blends into the page -->
    <div v-if="show && !loading" class="absolute top-0 left-0 w-full h-[80vh] pointer-events-none z-0">
      <div class="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
        :style="{ backgroundImage: `url(${show.backdrop_url || show.poster_url})` }"></div>
      <div class="absolute inset-0 bg-black/40"></div> <!-- Base darkening -->
      <div class="absolute inset-0 bg-linear-to-t from-surface-0 via-surface-0/80 to-transparent"></div>
    </div>

    <!-- Back Button -->
    <button @click="router.back()"
      class="absolute top-4 sm:top-6 left-4 sm:left-6 z-50 p-2 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 hover:bg-black/60 hover:scale-105 active:scale-95 transition-all shadow-lg"
      title="Go Back">
      <ArrowLeft :size="24" />
    </button>

    <!-- Skeleton Loader -->
    <div v-if="loading" class="relative z-10 flex flex-col animate-pulse min-h-full p-6 md:p-10 pt-[20vh]">
      <div class="flex flex-col md:flex-row gap-8 items-end">
        <div class="w-40 md:w-56 aspect-2/3 bg-surface-3 rounded-2xl shrink-0"></div>
        <div class="flex flex-col gap-4 w-full pb-4">
          <div class="h-12 w-3/4 bg-surface-3 rounded-xl"></div>
          <div class="h-6 w-1/2 bg-surface-3 rounded-lg"></div>
          <div class="flex gap-4 mt-4">
            <div class="h-12 w-32 bg-surface-3 rounded-full"></div>
            <div class="h-12 w-48 bg-surface-3 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error"
      class="relative z-10 p-8 flex flex-col items-center justify-center min-h-full gap-4 text-center">
      <div class="p-4 rounded-full bg-red-500/10 text-red-500">
        <AlertCircle :size="48" />
      </div>
      <h2 class="text-2xl font-bold text-text">Failed to load show</h2>
      <p class="text-text-muted">{{ error }}</p>
      <button @click="loadShow" class="px-6 py-2 bg-surface-2 rounded-lg hover:bg-surface-3 transition-colors mt-2">Try
        Again</button>
    </div>

    <!-- Main Content -->
    <div v-else-if="show" class="relative z-10 flex flex-col min-h-full pt-[15vh] md:pt-[25vh] pb-20">

      <div class="px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col gap-10">

        <!-- Hero: Poster + Info -->
        <div class="flex flex-col md:flex-row gap-6 md:gap-10 items-end md:items-center">
          <!-- Poster -->
          <div v-if="show.poster_url"
            class="w-32 md:w-56 aspect-2/3 rounded-2xl shadow-2xl shrink-0 overflow-hidden border-2 border-white/10 bg-surface-3">
            <img :src="show.poster_url" class="w-full h-full object-cover" />
          </div>

          <!-- Info -->
          <div class="flex flex-col gap-3 w-full">
            <h1 class="text-4xl md:text-5xl lg:text-7xl font-heading font-bold text-white drop-shadow-xl leading-tight">
              {{ show.title }}
            </h1>

            <!-- Meta Badges -->
            <div class="flex flex-wrap items-center gap-3 text-sm font-bold text-white/90 mt-2">
              <span v-if="show.first_air_date"
                class="px-3 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/10">
                {{ new Date(show.first_air_date).getFullYear() }}
                <template v-if="show.status === 'ended' && show.last_air_date"> - {{ new
                  Date(show.last_air_date).getFullYear() }}</template>
                <template v-else-if="show.status !== 'ended'"> - Present</template>
              </span>
              <span v-if="show.network"
                class="px-3 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                <Tv :size="16" /> {{ show.network }}
              </span>
              <span
                class="flex items-center gap-1.5 px-3 py-1 rounded-md bg-primary/20 text-primary border border-primary/20 uppercase tracking-wider">{{
                  prettyStatus(show.status) }}</span>
            </div>

            <!-- Action Row -->
            <div class="flex flex-wrap items-center gap-4 mt-6">
              <button @click="playVideo('https://www.youtube.com/watch?v=dQw4w9WgXcQ')"
                class="flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 bg-white text-black rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-white/20">
                <Play :size="20" fill="currentColor" /> Play Trailer
              </button>

              <!-- Watchlist -->
              <div class="relative flex-1 sm:flex-none">
                <button v-if="!authStore.isAuthenticated" @click="router.push('/login')"
                  class="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-surface-2/60 backdrop-blur-md text-white rounded-full font-bold hover:bg-surface-3 transition-colors border border-white/10">
                  Sign in for Watchlist
                </button>
                <template v-else>
                  <button v-if="!isInWatchlist" @click="addToWatchlist"
                    class="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-surface-2/60 backdrop-blur-md text-white rounded-full font-bold hover:bg-surface-3 hover:border-white/30 active:scale-95 transition-all border border-white/10">
                    <Plus :size="20" /> Add to Watchlist
                  </button>
                  <div v-else class="relative" ref="watchlistDropdownRef">
                    <button @click="watchlistMenuOpen = !watchlistMenuOpen"
                      class="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary/20 backdrop-blur-md text-primary rounded-full font-bold hover:bg-primary/30 active:scale-95 transition-all border border-primary/30">
                      <CheckCircle2 :size="20" /> {{ prettyWatchlistStatus(watchlistItem?.status) }}
                      <ChevronDown :size="16" :class="{ 'rotate-180': watchlistMenuOpen }"
                        class="transition-transform" />
                    </button>

                    <!-- Dropdown -->
                    <div v-if="watchlistMenuOpen"
                      class="absolute top-full left-0 mt-2 w-48 bg-surface-2/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1">
                      <button @click="updateStatus('want_to_watch')"
                        class="text-left px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-surface-3 transition-colors"
                        :class="{ 'text-primary bg-primary/10': watchlistItem?.status === 'want_to_watch' }">Want to
                        watch</button>
                      <button @click="updateStatus('watching')"
                        class="text-left px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-surface-3 transition-colors"
                        :class="{ 'text-primary bg-primary/10': watchlistItem?.status === 'watching' }">Watching</button>
                      <button @click="updateStatus('watched')"
                        class="text-left px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-surface-3 transition-colors"
                        :class="{ 'text-primary bg-primary/10': watchlistItem?.status === 'watched' }">Watched</button>
                      <div class="h-px bg-white/10 my-1"></div>
                      <button @click="removeFromWatchlist"
                        class="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                        <Trash2 :size="16" /> Remove
                      </button>
                    </div>
                  </div>
                  
                  <!-- Block Show -->
                  <button @click="blockShow"
                    class="w-12 sm:w-auto sm:px-6 py-3.5 flex items-center justify-center gap-2 bg-surface-2/60 backdrop-blur-md text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-full font-bold transition-all border border-white/10 hover:border-red-500/30" title="Block Show">
                    <span class="hidden sm:inline">Block</span>
                    <X :size="20" />
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Synopsis & Genres -->
        <div class="flex flex-col gap-5 mt-4">
          <h2 class="text-2xl font-heading font-bold text-white">Synopsis</h2>
          <p class="text-lg text-text-muted leading-relaxed max-w-5xl">{{ show.description || "No overview available."
          }}</p>
          <div class="flex flex-wrap gap-2 mt-2" v-if="(show as any).genres?.length">
            <RouterLink v-for="genre in (show as any).genres" :key="genre.id" :to="`/genres/${genre.slug}`"
              class="px-5 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white text-sm font-medium">
              {{ genre.name }}
            </RouterLink>
          </div>
        </div>

        <!-- Trailers & Clips -->
        <div v-if="displayTrailers.length" class="flex flex-col gap-5 mt-4">
          <h2 class="text-2xl font-heading font-bold text-white flex items-baseline gap-3">
            Trailers & Clips
            <span v-if="isDummyTrailers"
              class="text-xs font-normal text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 tracking-wider uppercase">Dummy
              Data</span>
          </h2>
          <div class="flex overflow-x-auto gap-4 md:gap-6 pb-6 pt-2 snap-x hide-scrollbar">
            <div v-for="video in displayTrailers" :key="video.id" @click="playVideo(video.url)"
              class="flex flex-col gap-3 w-64 md:w-80 shrink-0 snap-start group cursor-pointer">
              <div
                class="w-full aspect-video rounded-2xl bg-surface-2 overflow-hidden border-2 border-transparent group-hover:border-primary/50 shadow-md group-hover:shadow-xl transition-all relative">
                <!-- Thumbnail -->
                <img :src="video.thumbnail_url"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div
                  class="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div
                    class="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                    <Play :size="20" fill="currentColor" class="ml-1" />
                  </div>
                </div>
              </div>
              <div class="flex flex-col w-full px-1">
                <div class="text-sm md:text-base font-bold text-white leading-tight line-clamp-1">{{ video.title }}
                </div>
                <div class="text-xs text-text-muted mt-1">{{ video.type }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Seasons Carousel -->
        <div v-if="displaySeasons.length" class="flex flex-col gap-5 mt-4">
          <h2 class="text-2xl font-heading font-bold text-white flex items-baseline gap-3">
            Seasons
            <span v-if="isDummySeasons"
              class="text-xs font-normal text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 tracking-wider uppercase">Dummy
              Data</span>
          </h2>
          <div class="flex overflow-x-auto gap-4 md:gap-6 pb-6 pt-2 snap-x hide-scrollbar">
            <div v-for="season in displaySeasons" :key="season.id"
              class="flex flex-col gap-3 w-32 md:w-40 shrink-0 snap-start group cursor-pointer">
              <div
                class="w-full aspect-2/3 rounded-2xl bg-surface-2 overflow-hidden border-2 border-transparent group-hover:border-primary/50 shadow-md group-hover:shadow-xl transition-all relative">
                <img v-if="season.poster_url" :src="season.poster_url" class="w-full h-full object-cover" />
                <div v-else
                  class="w-full h-full flex items-center justify-center text-text-muted flex-col gap-2 p-4 text-center">
                  <MonitorPlay :size="32" class="opacity-50" />
                  <span class="text-xs">{{ season.title }}</span>
                </div>
              </div>
              <div class="flex flex-col w-full px-1">
                <div class="text-sm md:text-base font-bold text-white leading-tight">{{ season.title }}</div>
                <div class="flex items-center justify-between mt-1 text-xs text-text-muted">
                  <span class="font-medium">{{ season.episode_count }} Episodes</span>
                  <span v-if="season.air_date">{{ new Date(season.air_date).getFullYear() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Horizontal Cast Scroller -->
        <div v-if="preferencesStore.showCastDetails && displayCast.length" class="flex flex-col gap-5 mt-4">
          <h2 class="text-2xl font-heading font-bold text-white flex items-baseline gap-3">
            Cast & Crew
            <span v-if="isDummyCast"
              class="text-xs font-normal text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 tracking-wider uppercase">Dummy
              Data</span>
          </h2>
          <div class="flex overflow-x-auto gap-4 md:gap-6 pb-6 pt-2 snap-x hide-scrollbar">
            <div v-for="member in displayCast" :key="`${member.id}-${member.role}`"
              class="flex flex-col items-center gap-3 w-28 md:w-32 shrink-0 snap-start group cursor-pointer">
              <div
                class="w-24 h-24 md:w-28 md:h-28 rounded-full bg-surface-2 overflow-hidden border-2 border-transparent group-hover:border-primary/50 shadow-md group-hover:shadow-xl transition-all flex items-center justify-center relative">
                <img v-if="member.profile_url" :src="member.profile_url" class="w-full h-full object-cover" />
                <User v-else class="text-text-muted/50" :size="48" />
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
              </div>
              <div class="text-center w-full">
                <div class="text-sm md:text-base font-bold text-white line-clamp-2 leading-tight">{{ member.name }}
                </div>
                <div class="text-xs md:text-sm text-text-muted line-clamp-1 mt-1">{{ member.character || member.role }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="flex flex-col gap-5 mt-4">
          <h2 class="text-2xl font-heading font-bold text-white">Details</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 md:p-8 rounded-3xl bg-surface-1 border border-white/5">
            <div v-if="show.first_air_date" class="flex flex-col gap-1">
              <span class="text-xs font-bold text-text-muted uppercase tracking-widest">First Aired</span>
              <span class="text-base font-medium text-white">{{ show.first_air_date }}</span>
            </div>
            <div v-if="show.network" class="flex flex-col gap-1">
              <span class="text-xs font-bold text-text-muted uppercase tracking-widest">Network</span>
              <span class="text-base font-medium text-white">{{ show.network }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs font-bold text-text-muted uppercase tracking-widest">Status</span>
              <span class="text-base font-medium text-white capitalize">{{ prettyStatus(show.status) }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Trailer Modal (Full Screen Overlay) -->
    <div v-if="showTrailer"
      class="fixed inset-0 z-100 flex flex-col items-center justify-center bg-black/95 p-4 sm:p-10 backdrop-blur-md">
      <div class="w-full max-w-6xl flex justify-end mb-4">
        <button @click="showTrailer = false"
          class="flex items-center gap-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-md">
          Close
          <X :size="20" />
        </button>
      </div>
      <div
        class="w-full max-w-6xl aspect-video bg-black relative rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10">
        <iframe v-if="embedUrl" class="w-full h-full" :src="embedUrl" frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>
        <div v-else class="w-full h-full flex items-center justify-center text-white">Invalid trailer URL.</div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, onBeforeUnmount } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useTvStore } from '@/stores/tvStore'
import { useWatchlistStore } from '@/stores/watchListStore'
import type { TVShowWithDetails, TVSeason, CastMember, WatchlistPopulatedItem, WatchlistStatus } from "shared-types"
import toastHandler from '@/composables/toastHandeler'
import { getErrorMessage } from '@/services/errorUtils'
import { useAuthStore } from '@/stores/authStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { AlertCircle, Tv, User, MonitorPlay, ArrowLeft, Play, X, Plus, CheckCircle2, ChevronDown, Trash2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const tvStore = useTvStore()
const watchlistStore = useWatchlistStore()
const authStore = useAuthStore()
const preferencesStore = usePreferencesStore()
const showToast = toastHandler().showToast

const show = ref<TVShowWithDetails | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const showTrailer = ref(false)
const activeVideoUrl = ref<string>('')
const watchlistMenuOpen = ref(false)
const watchlistDropdownRef = ref<HTMLElement | null>(null)

const watchlistItem = computed<WatchlistPopulatedItem | undefined>(() => {
  if (!show.value) return undefined
  return watchlistStore.getItemByShowId(show.value.id)
})

const isInWatchlist = computed(() => !!watchlistItem.value)

function prettyWatchlistStatus(status?: WatchlistStatus) {
  if (!status) return ''
  switch (status) {
    case 'want_to_watch': return 'Want to watch'
    case 'watching': return 'Watching'
    case 'watched': return 'Watched'
  }
}

async function addToWatchlist() {
  if (!show.value) return
  try {
    await watchlistStore.addShowToWatchlist(show.value.id, 'want_to_watch')
    showToast('success', 'Added', 'Show added to watchlist')
  } catch (err: unknown) {
    showToast('error', 'Error', getErrorMessage(err, 'Failed to add show'))
  }
}

async function removeFromWatchlist() {
  if (!watchlistItem.value) return
  try {
    await watchlistStore.removeFromWatchlist(watchlistItem.value.id)
    watchlistMenuOpen.value = false
    showToast('success', 'Removed', 'Show removed from watchlist')
  } catch (err: unknown) {
    showToast('error', 'Error', getErrorMessage(err, 'Failed to remove show'))
  }
}

async function updateStatus(status: WatchlistStatus) {
  if (!watchlistItem.value) return
  try {
    await watchlistStore.updateStatus(watchlistItem.value.id, status)
    watchlistMenuOpen.value = false
    showToast('success', 'Updated', 'Watchlist status updated')
  } catch (err: unknown) {
    showToast('error', 'Error', getErrorMessage(err, 'Failed to update status'))
  }
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (watchlistMenuOpen.value && watchlistDropdownRef.value && !watchlistDropdownRef.value.contains(event.target as Node)) {
    watchlistMenuOpen.value = false
  }
}

// --- Dummy Data Injectors ---
const isDummyTrailers = computed(() => true)
const displayTrailers = computed(() => {
  if (!show.value) return []
  const trailers = []

  // Inject some dummy clips to show the scroller
  trailers.push(
    { id: 1, title: 'Series Premiere Trailer', type: 'Trailer', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail_url: show.value.backdrop_url || show.value.poster_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80' },
    { id: 2, title: 'Season 2 Teaser', type: 'Clip', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80' },
    { id: 3, title: 'Behind the Scenes', type: 'Featurette', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail_url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80' }
  )
  return trailers
})

const isDummySeasons = computed(() => !show.value || !show.value.seasons || show.value.seasons.length === 0)
const displaySeasons = computed<TVSeason[]>(() => {
  if (!show.value) return []
  if (show.value.seasons && show.value.seasons.length > 0) {
    return [...show.value.seasons].sort((a, b) => a.season_number - b.season_number)
  }
  return [
    { id: 991, uuid: 's1', show_id: show.value.id, season_number: 1, title: 'Season 1', episode_count: 10, air_date: show.value.first_air_date, poster_url: show.value.poster_url },
    { id: 992, uuid: 's2', show_id: show.value.id, season_number: 2, title: 'Season 2', episode_count: 12, air_date: '2023-09-10', poster_url: show.value.poster_url },
    { id: 993, uuid: 's3', show_id: show.value.id, season_number: 3, title: 'Season 3', episode_count: 8, air_date: '2024-10-05', poster_url: show.value.poster_url },
  ]
})

const isDummyCast = computed(() => !show.value || !show.value.cast || show.value.cast.length === 0)
const displayCast = computed<CastMember[]>(() => {
  if (!show.value) return []
  if (show.value.cast && show.value.cast.length > 0) {
    return [...show.value.cast].sort((a, b) => a.display_order - b.display_order)
  }
  return [
    { id: 881, uuid: 'c1', name: 'Bryan Cranston', role: 'actor', character: 'Walter White', display_order: 1, created_at: '', profile_url: 'https://image.tmdb.org/t/p/w276_and_h350_face/a7cPqAOXhtBElJ3y62n5lWl8V6V.jpg' },
    { id: 882, uuid: 'c2', name: 'Aaron Paul', role: 'actor', character: 'Jesse Pinkman', display_order: 2, created_at: '', profile_url: 'https://image.tmdb.org/t/p/w276_and_h350_face/u8UdsB9yenM4uHEjmce4nkBn48X.jpg' },
    { id: 883, uuid: 'c3', name: 'Anna Gunn', role: 'actor', character: 'Skyler White', display_order: 3, created_at: '', profile_url: 'https://image.tmdb.org/t/p/w276_and_h350_face/ad3U93OEXqKj26XhWzX4kY0gG.jpg' },
    { id: 884, uuid: 'c4', name: 'Bob Odenkirk', role: 'actor', character: 'Saul Goodman', display_order: 4, created_at: '', profile_url: 'https://image.tmdb.org/t/p/w276_and_h350_face/2R1eC9iN2b450N98B60Xh92j.jpg' },
  ]
})
// ----------------------------

function playVideo(url: string) {
  activeVideoUrl.value = url
  showTrailer.value = true
}

const embedUrl = computed(() => {
  if (!activeVideoUrl.value) return ''
  const url = activeVideoUrl.value
  let videoId = ''
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0] ?? ''
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] ?? ''
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url
})

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ')
}

async function loadShow() {
  loading.value = true
  error.value = null
  try {
    const uuid = route.params.uuid as string
    if (!uuid) throw new Error('Invalid show ID')
    show.value = await tvStore.fetchShowById(uuid)
    if (authStore.isAuthenticated && !watchlistStore.items.length) {
      await watchlistStore.fetchWatchlist()
    }
  } catch (err: unknown) {
    error.value = getErrorMessage(err, 'Failed to load show')
  } finally {
    loading.value = false
  }
}

async function blockShow() {
  if (!show.value) return
  try {
    const uuid = show.value.uuid
    await preferencesStore.blockShow(uuid)
    tvStore.removeShowLocally(uuid)
    showToast('success', 'Blocked', 'Show will no longer be shown')
    router.push('/')
  } catch (err: unknown) {
    showToast('error', 'Error', getErrorMessage(err, 'Failed to block show'))
  }
}

onMounted(() => {
  loadShow()
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
