<template>
  <div class="w-full h-full overflow-y-auto bg-surface-0 hide-scrollbar relative">

    <!-- Background Image that blends into the page -->
    <div v-if="movie && !loading" class="absolute top-0 left-0 w-full h-[80vh] pointer-events-none z-0">
      <div class="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
        :style="{ backgroundImage: `url(${movie.backdrop_url || movie.poster_url})` }"></div>
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
      <h2 class="text-2xl font-bold text-text">Failed to load movie</h2>
      <p class="text-text-muted">{{ error }}</p>
      <button @click="loadMovie" class="px-6 py-2 bg-surface-2 rounded-lg hover:bg-surface-3 transition-colors mt-2">Try
        Again</button>
    </div>

    <!-- Main Content -->
    <div v-else-if="movie" class="relative z-10 flex flex-col min-h-full pt-[15vh] md:pt-[25vh] pb-20">

      <div class="px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col gap-10">

        <!-- Hero: Poster + Info -->
        <div class="flex flex-col md:flex-row gap-6 md:gap-10 items-end md:items-center">
          <!-- Poster -->
          <div v-if="movie.poster_url"
            class="w-32 md:w-56 aspect-2/3 rounded-2xl shadow-2xl shrink-0 overflow-hidden border-2 border-white/10 bg-surface-3">
            <img :src="movie.poster_url" class="w-full h-full object-cover" />
          </div>

          <!-- Info -->
          <div class="flex flex-col gap-3 w-full">
            <h1 class="text-4xl md:text-5xl lg:text-7xl font-heading font-bold text-white drop-shadow-xl leading-tight">
              {{ movie.title }}
            </h1>
            <p v-if="movie.tagline" class="text-lg md:text-xl text-white/80 italic drop-shadow-md font-medium">
              {{ movie.tagline }}
            </p>

            <!-- Meta Badges -->
            <div class="flex flex-wrap items-center gap-3 text-sm font-bold text-white/90 mt-2">
              <span v-if="movie.release_year"
                class="px-3 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/10">{{ movie.release_year
                }}</span>
              <span v-if="movie.age_rating"
                class="px-3 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/10">{{ movie.age_rating
                }}</span>
              <span v-if="movie.runtime"
                class="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/10">
                <Clock :size="16" /> {{ movie.runtime }} min
              </span>
              <span
                class="flex items-center gap-1.5 px-3 py-1 rounded-md bg-primary/20 text-primary border border-primary/20 uppercase tracking-wider">{{
                  prettyStatus(movie.status) }}</span>
            </div>

            <!-- Action Row -->
            <div class="flex flex-wrap items-center gap-4 mt-6">
              <button v-if="movie.trailer_url" @click="playVideo(movie.trailer_url)"
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
                  
                  <!-- Block Movie -->
                  <button @click="blockMovie"
                    class="w-12 sm:w-auto sm:px-6 py-3.5 flex items-center justify-center gap-2 bg-surface-2/60 backdrop-blur-md text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-full font-bold transition-all border border-white/10 hover:border-red-500/30" title="Block Movie">
                    <span class="hidden sm:inline">Block</span>
                    <X :size="20" />
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Inline Ratings Row -->
        <div class="flex flex-wrap gap-8 md:gap-12 items-center border-b border-white/10 pb-8" v-if="hasRatings">
          <div v-if="movie.rating_imdb != null" class="flex items-center gap-3">
            <Star :size="32" class="text-yellow-500 fill-yellow-500 drop-shadow-md" />
            <div class="flex flex-col">
              <span class="text-2xl font-heading font-bold text-white leading-none">{{ movie.rating_imdb }}<span
                  class="text-base text-text-muted font-medium">/10</span></span>
              <span class="text-xs text-text-muted mt-1 uppercase tracking-widest font-bold">IMDb</span>
            </div>
          </div>
          <div v-if="movie.rating_rt != null" class="flex items-center gap-3">
            <div class="flex flex-col">
              <span class="text-2xl font-heading font-bold"
                :class="movie.rating_rt >= 60 ? 'text-green-500' : 'text-red-500'">{{ movie.rating_rt }}%</span>
              <span class="text-xs text-text-muted mt-1 uppercase tracking-widest font-bold">Rotten Tomatoes</span>
            </div>
          </div>
          <div v-if="movie.rating_metacritic != null" class="flex items-center gap-3">
            <span class="text-xl font-heading font-bold p-2 rounded-lg"
              :class="movie.rating_metacritic >= 60 ? 'bg-green-500 text-black' : (movie.rating_metacritic >= 40 ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white')">{{
                movie.rating_metacritic }}</span>
            <span class="text-xs text-text-muted uppercase tracking-widest font-bold">Metacritic</span>
          </div>
        </div>

        <!-- Synopsis & Genres -->
        <div class="flex flex-col gap-5">
          <h2 class="text-2xl font-heading font-bold text-white">Synopsis</h2>
          <p class="text-lg text-text-muted leading-relaxed max-w-5xl">{{ movie.description || "No overview available."
            }}</p>
          <div class="flex flex-wrap gap-2 mt-2">
            <RouterLink v-for="genre in movie.genres" :key="genre.id" :to="`/genres/${genre.slug}`"
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
                  class="w-full h-full object-cover" />
                <div
                  class="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div
                    class="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white shadow-lg">
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

        <!-- Cast & Crew -->
        <div v-if="preferencesStore.showCastDetails && sortedCast.length" class="flex flex-col gap-5 mt-4">
          <h2 class="text-2xl font-heading font-bold text-white">Cast & Crew</h2>
          <div class="flex overflow-x-auto gap-4 md:gap-6 pb-6 pt-2 snap-x hide-scrollbar">
            <div v-for="member in sortedCast" :key="`${member.id}-${member.role}`"
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
            <div class="flex flex-col gap-1">
              <span class="text-xs font-bold text-text-muted uppercase tracking-widest">Director</span>
              <span class="text-base font-medium text-white">{{ movie.director || 'Unknown' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs font-bold text-text-muted uppercase tracking-widest">Language</span>
              <span class="text-base font-medium text-white uppercase">{{ movie.original_language || 'Unknown' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs font-bold text-text-muted uppercase tracking-widest">Budget</span>
              <span class="text-base font-medium text-white">{{ movie.budget ? formatMoney(movie.budget) : 'Unknown'
                }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs font-bold text-text-muted uppercase tracking-widest">Box Office</span>
              <span class="text-base font-medium text-white">{{ movie.box_office ? formatMoney(movie.box_office) :
                'Unknown'
                }}</span>
            </div>
            <div v-if="movie.companies.length" class="flex flex-col gap-1 col-span-2 md:col-span-4 mt-2">
              <span class="text-xs font-bold text-text-muted uppercase tracking-widest">Production</span>
              <span class="text-base font-medium text-white">{{movie.companies.map(c => c.name).join(', ')}}</span>
            </div>
          </div>
        </div>

        <!-- Admin Actions -->
        <div v-if="authStore.isAuthenticated"
          class="flex items-center justify-end gap-4 mt-8 pt-8 border-t border-white/10">
          <RouterLink :to="`/movies/${movie.uuid}/edit`"
            class="text-sm text-text-muted hover:text-white transition-colors flex items-center gap-1.5">
            <Edit :size="16" /> Edit Movie
          </RouterLink>
          <button @click="confirmDelete"
            class="text-sm text-red-500 hover:text-red-400 transition-colors flex items-center gap-1.5">
            <Trash2 :size="16" /> Delete
          </button>
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
import { useMoviesStore } from '@/stores/moviesStore'
import { useWatchlistStore } from '@/stores/watchListStore'
import type { MovieWithDetails, WatchlistItemWithMovie, WatchlistStatus } from "shared-types"
import toastHandler from '@/composables/toastHandeler'
import { getErrorMessage } from '@/services/errorUtils'
import { useAuthStore } from '@/stores/authStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { AlertCircle, Play, Plus, CheckCircle2, ChevronDown, Clock, User, Star, X, Edit, Trash2, ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const moviesStore = useMoviesStore()
const watchlistStore = useWatchlistStore()
const authStore = useAuthStore()
const preferencesStore = usePreferencesStore()
const showToast = toastHandler().showToast

const movie = ref<MovieWithDetails | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const showTrailer = ref(false)
const activeVideoUrl = ref<string>('')

const watchlistMenuOpen = ref(false)
const watchlistDropdownRef = ref<HTMLElement | null>(null)

// --- Dummy Trailers ---
const isDummyTrailers = ref(false)
const displayTrailers = computed(() => {
  if (!movie.value) return []
  const trailers = []
  if (movie.value.trailer_url) {
    trailers.push({
      id: 1,
      title: 'Official Trailer',
      type: 'Trailer',
      url: movie.value.trailer_url,
      thumbnail_url: movie.value.backdrop_url || movie.value.poster_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80'
    })
  }

  // Always inject some dummy clips to show the scroller
  trailers.push(
    { id: 2, title: 'Teaser Trailer', type: 'Clip', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80' },
    { id: 3, title: 'Behind the Scenes', type: 'Featurette', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail_url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80' }
  )
  return trailers
})
// ----------------------

const watchlistItem = computed<WatchlistItemWithMovie | undefined>(() => {
  if (!movie.value) return undefined
  const item = watchlistStore.getItemByMovieId(movie.value.id)
  return item && 'movie' in item ? (item as WatchlistItemWithMovie) : undefined
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

function prettyWatchlistStatus(status?: WatchlistStatus) {
  if (!status) return ''
  switch (status) {
    case 'want_to_watch': return 'Want to watch'
    case 'watching': return 'Watching'
    case 'watched': return 'Watched'
  }
}

function formatMoney(value: number) {
  if (value === 0) return 'Unknown'
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`
  }
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
    const uuid = route.params.uuid as string
    if (!uuid) throw new Error('Invalid movie ID')
    movie.value = await moviesStore.fetchMovieById(uuid)
    if (authStore.isAuthenticated && !watchlistStore.items.length) {
      await watchlistStore.fetchWatchlist()
    }
  } catch (err: unknown) {
    error.value = getErrorMessage(err, 'Failed to load movie')
  } finally {
    loading.value = false
  }
}

async function addToWatchlist() {
  if (!movie.value) return
  try {
    await watchlistStore.addMovieToWatchlist(movie.value.id, 'want_to_watch')
    showToast('success', 'Added', 'Movie added to watchlist')
  } catch (err: unknown) {
    showToast('error', 'Error', getErrorMessage(err, 'Failed to add movie'))
  }
}

async function removeFromWatchlist() {
  if (!watchlistItem.value) return
  try {
    await watchlistStore.removeFromWatchlist(watchlistItem.value.id)
    watchlistMenuOpen.value = false
    showToast('success', 'Removed', 'Movie removed from watchlist')
  } catch (err: unknown) {
    showToast('error', 'Error', getErrorMessage(err, 'Failed to remove movie'))
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

async function confirmDelete() {
  if (!movie.value) return
  const ok = window.confirm(`Delete "${movie.value.title}"?`)
  if (!ok) return
  try {
    await moviesStore.deleteMovie(movie.value.uuid)
    showToast('success', 'Deleted', 'Movie deleted successfully')
    router.push('/movies')
  } catch (err: unknown) {
    showToast('error', 'Error', getErrorMessage(err, 'Failed to delete movie'))
  }
}

async function blockMovie() {
  if (!movie.value) return
  try {
    const uuid = movie.value.uuid
    await preferencesStore.blockMovie(uuid)
    moviesStore.removeMovieLocally(uuid)
    showToast('success', 'Blocked', 'Movie will no longer be shown')
    router.push('/')
  } catch (err: unknown) {
    showToast('error', 'Error', getErrorMessage(err, 'Failed to block movie'))
  }
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (watchlistMenuOpen.value && watchlistDropdownRef.value && !watchlistDropdownRef.value.contains(event.target as Node)) {
    watchlistMenuOpen.value = false
  }
}

onMounted(() => {
  loadMovie()
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
