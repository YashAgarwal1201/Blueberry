<template>
  <div class="w-full h-full overflow-y-auto bg-surface-0 hide-scrollbar relative" @scroll="handleScroll">
    <!-- Sticky Header -->
    <nav :class="[
      'fixed top-0 w-full z-50 bg-surface-0/90 backdrop-blur-xl border-b border-white/5 transition-all duration-300 flex items-center justify-between px-6 py-3',
      showStickyHeader
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 -translate-y-full pointer-events-none'
    ]">
      <div class="flex items-center gap-4">
        <button @click="router.back()" class="p-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft :size="20" />
        </button>
        <AppImage v-if="movie?.poster_url" :src="movie.poster_url" type="movie"
          class="w-8 h-12 rounded shadow-sm object-cover border border-white/10" />
        <span class="font-heading font-bold text-lg text-white line-clamp-1">
          {{ movie?.title }}
        </span>
      </div>
      <div class="flex items-center gap-3">
        <button v-if="authStore.isAuthenticated && !isInWatchlist" @click="addToWatchlist"
          class="px-4 py-2 bg-primary text-white text-sm font-bold rounded-full hover:bg-primary/90 transition-colors flex items-center gap-1.5">
          <Plus :size="16" />
          <span>Watchlist</span>
        </button>
      </div>
    </nav>

    <!-- Background Image -->
    <div v-if="movie && !loading" class="absolute top-0 left-0 w-full h-[80vh] pointer-events-none z-0 overflow-hidden">
      <div class="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105" :style="{
        backgroundImage: `url(${movie.backdrop_url || movie.poster_url})`,
        transform: `translateY(${scrollY * 0.4}px)`
      }"></div>
      <div class="absolute inset-0 bg-black/40"></div>
      <div class="absolute inset-0 bg-linear-to-t from-surface-0 via-surface-0/90 to-transparent"></div>
    </div>

    <!-- Back Button -->
    <button @click="router.back()"
      class="absolute top-4 sm:top-6 left-4 sm:left-6 z-40 p-2 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 hover:bg-black/60 hover:scale-105 active:scale-95 transition-all shadow-lg"
      title="Go Back" :class="{ 'opacity-0 pointer-events-none': showStickyHeader }">
      <ArrowLeft :size="24" />
    </button>

    <!-- Skeleton Loader -->
    <div v-if="loading" class="relative z-10 flex flex-col animate-pulse min-h-full p-6 md:p-10 pt-[20vh]">
      <div class="flex flex-col md:flex-row gap-8 items-start">
        <div class="w-48 md:w-64 aspect-2/3 bg-surface-3 rounded-2xl shrink-0"></div>
        <div class="flex flex-col gap-4 w-full pb-4 pt-10">
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
      <button @click="loadMovie" class="px-6 py-2 bg-surface-2 rounded-lg hover:bg-surface-3 transition-colors mt-2">
        Try Again
      </button>
    </div>

    <!-- Main Content -->
    <div v-else-if="movie" class="relative z-10 flex flex-col min-h-full pt-[15vh] md:pt-[25vh] pb-20">
      <!-- HERO SECTION -->
      <div
        class="px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
        <!-- Poster -->
        <div
          class="w-48 sm:w-56 md:w-64 lg:w-72 aspect-2/3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] shrink-0 overflow-hidden border border-white/10 bg-surface-3 group relative">
          <AppImage :src="movie.poster_url" type="movie"
            class="w-full h-full group-hover:scale-105 transition-transform duration-700 object-cover" />
        </div>

        <!-- Info Column -->
        <div
          class="flex flex-col items-center md:items-start flex-1 gap-4 sm:gap-6 w-full pt-2 sm:pt-6 md:pt-0 lg:pt-8 text-center md:text-left">
          <!-- Title -->
          <h1
            class="text-3xl sm:text-4xl lg:text-6xl font-heading font-black tracking-tight text-white drop-shadow-xl leading-tight">
            {{ movie.title }}
          </h1>
          <p v-if="movie.tagline" class="text-lg md:text-xl text-white/80 italic drop-shadow-md font-medium -mt-2">
            {{ movie.tagline }}
          </p>

          <!-- Metadata Row -->
          <div
            class="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-white/90">
            <span v-if="movie.release_year"
              class="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-sm">
              {{ movie.release_year }}
            </span>
            <span v-if="movie.age_rating"
              class="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-sm">
              {{ movie.age_rating }}
            </span>
            <span v-if="movie.runtime"
              class="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-sm flex items-center gap-1.5">
              <Clock :size="14" class="sm:w-4 sm:h-4" />
              {{ movie.runtime }} min
            </span>
            <span
              class="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/20 uppercase tracking-wider text-[10px] sm:text-xs shadow-sm font-bold">
              {{ prettyStatus(movie.status) }}
            </span>
            <div v-if="movie.genres?.length" class="w-px h-4 bg-white/20 mx-1 hidden sm:block"></div>
            <!-- Genres -->
            <RouterLink v-for="genre in movie.genres" :key="genre.id" :to="`/genres/${genre.slug}`"
              class="hover:text-primary transition-colors hover:underline">
              {{ genre.name }}
            </RouterLink>
          </div>

          <!-- Action Row -->
          <div
            class="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 mt-4 w-full max-w-md md:max-w-none">
            <!-- Watchlist and Options Wrapper -->
            <div class="flex items-center gap-3 w-full sm:w-auto">
              <!-- Watchlist -->
              <div class="relative flex-1 sm:flex-none">
                <button v-if="!authStore.isAuthenticated" @click="router.push('/login')"
                  class="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-surface-2/60 backdrop-blur-md text-white rounded-full font-bold hover:bg-surface-3 transition-colors border border-white/10 whitespace-nowrap">
                  Sign in
                </button>
                <template v-else>
                  <button v-if="!isInWatchlist" @click="addToWatchlist"
                    class="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-surface-2/60 backdrop-blur-md text-white rounded-full font-bold hover:bg-surface-3 hover:border-white/30 active:scale-95 transition-all border border-white/10 whitespace-nowrap">
                    <Plus :size="20" />
                    Add to Watchlist
                  </button>
                  <div v-else class="relative w-full" ref="watchlistDropdownRef">
                    <button @click="watchlistMenuOpen = !watchlistMenuOpen"
                      class="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary/20 backdrop-blur-md text-primary rounded-full font-bold hover:bg-primary/30 active:scale-95 transition-all border border-primary/30 whitespace-nowrap">
                      <Bookmark v-if="watchlistItem?.status === 'want_to_watch'" :size="20" />
                      <PlayCircle v-else-if="watchlistItem?.status === 'watching'" :size="20" />
                      <CheckCircle2 v-else :size="20" />
                      {{ prettyWatchlistStatus(watchlistItem?.status) }}
                      <ChevronDown :size="16" :class="{ 'rotate-180': watchlistMenuOpen }"
                        class="transition-transform shrink-0" />
                    </button>

                    <!-- Dropdown -->
                    <div v-if="watchlistMenuOpen"
                      class="absolute top-full left-0 mt-2 w-full sm:w-48 bg-surface-2/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 text-left">
                      <button @click="updateStatus('want_to_watch')"
                        class="text-left px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-surface-3 transition-colors flex items-center gap-2"
                        :class="{
                          'text-primary bg-primary/10': watchlistItem?.status === 'want_to_watch'
                        }">
                        <Bookmark :size="16" />
                        Want to watch
                      </button>
                      <button @click="updateStatus('watching')"
                        class="text-left px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-surface-3 transition-colors flex items-center gap-2"
                        :class="{
                          'text-primary bg-primary/10': watchlistItem?.status === 'watching'
                        }">
                        <PlayCircle :size="16" />
                        Watching
                      </button>
                      <button @click="updateStatus('watched')"
                        class="text-left px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-surface-3 transition-colors flex items-center gap-2"
                        :class="{
                          'text-primary bg-primary/10': watchlistItem?.status === 'watched'
                        }">
                        <CheckCircle2 :size="16" />
                        Watched
                      </button>
                      <div class="h-px bg-white/10 my-1"></div>
                      <button @click="removeFromWatchlist"
                        class="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                        <Trash2 :size="16" />
                        Remove
                      </button>
                    </div>
                  </div>
                </template>
              </div>

              <!-- More Options -->
              <div class="relative shrink-0" ref="moreOptionsRef">
                <button @click="moreOptionsOpen = !moreOptionsOpen"
                  class="w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center rounded-full bg-surface-2/60 backdrop-blur-md border border-white/10 hover:bg-surface-3 transition-colors text-white/70 hover:text-white">
                  <MoreHorizontal :size="20" />
                </button>
                <div v-if="moreOptionsOpen"
                  class="absolute top-full right-0 mt-2 w-48 bg-surface-2/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1">
                  <RouterLink v-if="authStore.isAuthenticated" :to="`/movies/${movie.uuid}/edit`"
                    class="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-white hover:bg-surface-3 transition-colors flex items-center gap-2">
                    <Edit :size="16" />
                    Edit Movie
                  </RouterLink>
                  <button @click="blockMovie"
                    class="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                    <Ban :size="16" />
                    Block Movie
                  </button>
                  <button v-if="authStore.isAuthenticated" @click="confirmDelete"
                    class="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                    <Trash2 :size="16" />
                    Delete Movie
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Synopsis -->
          <div class="mt-2 text-center md:text-left">
            <p class="text-lg text-white/70 leading-relaxed font-sans max-w-4xl">
              {{ movie.description || 'No overview available.' }}
            </p>
          </div>
        </div>
      </div>

      <!-- TABS NAVIGATION -->
      <div
        class="mt-12 sticky top-17 z-30 bg-surface-0/90 backdrop-blur-md border-b border-white/10 px-6 md:px-12 transition-all"
        :class="showStickyHeader ? 'top-17' : 'top-0'">
        <div class="max-w-7xl mx-auto flex gap-8">
          <button @click="activeTab = 'overview'" :class="[
            'pb-4 text-base font-bold transition-colors relative',
            activeTab === 'overview' ? 'text-white' : 'text-white/50 hover:text-white/80'
          ]">
            Overview
            <div v-if="activeTab === 'overview'"
              class="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full">
            </div>
          </button>
          <button v-if="preferencesStore.showCastDetails && sortedCast.length" @click="activeTab = 'cast'" :class="[
            'pb-4 text-base font-bold transition-colors relative',
            activeTab === 'cast' ? 'text-white' : 'text-white/50 hover:text-white/80'
          ]">
            Cast & Crew
            <div v-if="activeTab === 'cast'" class="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full">
            </div>
          </button>
          <button v-if="similarMovies.length" @click="activeTab = 'related'" :class="[
            'pb-4 text-base font-bold transition-colors relative',
            activeTab === 'related' ? 'text-white' : 'text-white/50 hover:text-white/80'
          ]">
            More Like This
            <div v-if="activeTab === 'related'" class="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full">
            </div>
          </button>
        </div>
      </div>

      <!-- TABS CONTENT -->
      <div class="px-6 md:px-12 max-w-7xl mx-auto w-full mt-8">
        <!-- OVERVIEW TAB -->
        <div v-if="activeTab === 'overview'" class="flex flex-col gap-10">
          <!-- Inline Ratings Row -->
          <div class="flex flex-wrap gap-8 md:gap-12 items-center" v-if="hasRatings">
            <div v-if="movie.rating_imdb != null" class="flex items-center gap-3">
              <Star :size="32" class="text-yellow-500 fill-yellow-500 drop-shadow-md" />
              <div class="flex flex-col">
                <span class="text-2xl font-heading font-bold text-white leading-none">
                  {{ movie.rating_imdb }}
                  <span class="text-base text-text-muted font-medium">/10</span>
                </span>
                <span class="text-xs text-text-muted mt-1 uppercase tracking-widest font-bold">
                  IMDb
                </span>
              </div>
            </div>
            <div v-if="movie.rating_rt != null" class="flex items-center gap-3">
              <div class="flex flex-col">
                <span class="text-2xl font-heading font-bold"
                  :class="movie.rating_rt >= 60 ? 'text-green-500' : 'text-red-500'">
                  {{ movie.rating_rt }}%
                </span>
                <span class="text-xs text-text-muted mt-1 uppercase tracking-widest font-bold">
                  Rotten Tomatoes
                </span>
              </div>
            </div>
            <div v-if="movie.rating_metacritic != null" class="flex items-center gap-3">
              <span class="text-xl font-heading font-bold p-2 rounded-lg" :class="movie.rating_metacritic >= 60
                  ? 'bg-green-500 text-black'
                  : movie.rating_metacritic >= 40
                    ? 'bg-yellow-500 text-black'
                    : 'bg-red-500 text-white'
                ">
                {{ movie.rating_metacritic }}
              </span>
              <span class="text-xs text-text-muted uppercase tracking-widest font-bold">
                Metacritic
              </span>
            </div>
          </div>

          <!-- Trailers & Clips -->
          <div v-if="displayTrailers.length" class="flex flex-col gap-5">
            <h2 class="text-2xl font-heading font-bold text-white flex items-baseline gap-3">
              Trailers & Clips
            </h2>
            <div class="flex overflow-x-auto gap-4 md:gap-6 pb-6 pt-2 snap-x hide-scrollbar">
              <div v-for="video in displayTrailers" :key="video.id" @click="playVideo(video.url)"
                class="flex flex-col gap-3 w-64 md:w-80 shrink-0 snap-start group cursor-pointer">
                <div
                  class="w-full aspect-video rounded-2xl bg-surface-2 overflow-hidden border border-white/5 group-hover:border-white/20 shadow-md transition-all relative">
                  <!-- Thumbnail -->
                  <AppImage :src="video.thumbnail_url" type="movie"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div class="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors"></div>
                  <!-- Play Icon on hover -->
                  <div
                    class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div
                      class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg border border-white/20">
                      <Play :size="20" fill="currentColor" class="ml-1" />
                    </div>
                  </div>
                </div>
                <div class="flex flex-col w-full px-1">
                  <div class="text-sm md:text-base font-bold text-white leading-tight line-clamp-1">
                    {{ video.title }}
                  </div>
                  <div class="text-xs text-text-muted mt-1">{{ video.type }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Details Grid -->
          <div
            class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 p-5 md:p-8 rounded-3xl bg-surface-1 border border-white/5">
            <div class="flex flex-col gap-1">
              <span class="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-widest">
                Director
              </span>
              <span class="text-sm md:text-base font-medium text-white">
                {{ directorName || 'Unknown' }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-widest">
                Language
              </span>
              <span class="text-sm md:text-base font-medium text-white uppercase">
                {{ movie.original_language || 'Unknown' }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-widest">
                Budget
              </span>
              <span class="text-sm md:text-base font-medium text-white">
                {{ movie.budget ? formatMoney(movie.budget) : 'Unknown' }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-widest">
                Box Office
              </span>
              <span class="text-sm md:text-base font-medium text-white">
                {{ movie.box_office ? formatMoney(movie.box_office) : 'Unknown' }}
              </span>
            </div>
            <div v-if="movie.companies.length" class="flex flex-col gap-1 col-span-2 md:col-span-4 mt-2">
              <span class="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-widest">
                Production
              </span>
              <span class="text-sm md:text-base font-medium text-white">
                {{movie.companies.map((c) => c.name).join(', ')}}
              </span>
            </div>
          </div>
        </div>

        <!-- CAST TAB -->
        <div v-else-if="activeTab === 'cast'"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          <div v-for="member in sortedCast" :key="`${member.id}-${member.role}`"
            class="flex flex-col items-center gap-3 group">
            <div
              class="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary/50 shadow-md group-hover:shadow-xl transition-all flex items-center justify-center relative bg-surface-2">
              <AppImage v-if="member.profile_url" :src="member.profile_url" type="person"
                class="w-full h-full object-cover" />
              <div v-else
                class="w-full h-full bg-surface-3 flex items-center justify-center text-3xl font-bold text-white/30 font-heading tracking-widest">
                {{ getInitials(member.name) }}
              </div>
            </div>
            <div class="text-center w-full">
              <div class="text-base font-bold text-white line-clamp-2 leading-tight">
                {{ member.name }}
              </div>
              <div class="text-sm text-text-muted line-clamp-1 mt-1">
                {{ member.character || member.role }}
              </div>
            </div>
          </div>
        </div>

        <!-- RELATED TAB -->
        <div v-else-if="activeTab === 'related'"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          <MediaCard v-for="sm in similarMovies" :key="sm.id" :title="sm.title" :posterUrl="sm.poster_url"
            :year="sm.release_year" type="movie" fluid @click="router.push(`/movies/${sm.uuid}`)" />
        </div>
      </div>
    </div>

    <!-- Trailer Modal -->
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
        <div v-else class="w-full h-full flex items-center justify-center text-white">
          Invalid trailer URL.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, onBeforeUnmount, watch } from 'vue';
import AppImage from '@/components/AppImage.vue';
import MediaCard from '@/components/MediaCard.vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useMoviesStore } from '@/stores/moviesStore';
import { useWatchlistStore } from '@/stores/watchListStore';
import type {
  MovieWithDetails,
  MovieCard,
  WatchlistItemWithMovie,
  WatchlistStatus
} from 'shared-types';
import toastHandler from '@/composables/toastHandler';
import { getErrorMessage } from '@/services/errorUtils';
import { useAuthStore } from '@/stores/authStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import {
  AlertCircle,
  Play,
  Plus,
  Bookmark,
  PlayCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Star,
  X,
  Edit,
  Trash2,
  ArrowLeft,
  MoreHorizontal,
  Ban
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const moviesStore = useMoviesStore();
const watchlistStore = useWatchlistStore();
const authStore = useAuthStore();
const preferencesStore = usePreferencesStore();
const showToast = toastHandler().showToast;

const directorName = computed(() => {
  if (!movie.value) return '';
  const dir = movie.value.cast?.find((c) => c.role === 'director');
  return dir?.name || '';
});

const movie = ref<MovieWithDetails | null>(null);
const similarMovies = ref<MovieCard[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Parallax and Sticky Header
const scrollY = ref(0);
const showStickyHeader = computed(() => scrollY.value > 400);
function handleScroll(e: Event) {
  scrollY.value = (e.target as HTMLElement).scrollTop;
}

// UI State
const showTrailer = ref(false);
const activeVideoUrl = ref<string>('');
const watchlistMenuOpen = ref(false);
const moreOptionsOpen = ref(false);
const watchlistDropdownRef = ref<HTMLElement | null>(null);
const moreOptionsRef = ref<HTMLElement | null>(null);

const VALID_TABS = ['overview', 'cast', 'related'] as const;
type TabType = (typeof VALID_TABS)[number];

function getInitialTab(): TabType {
  const queryTab = route.query?.tab as string;
  if (queryTab && VALID_TABS.includes(queryTab as TabType)) {
    return queryTab as TabType;
  }
  return 'overview';
}

const activeTab = ref<TabType>(getInitialTab());

watch(activeTab, (newTab) => {
  const currentTab = (route.query?.tab as string) || 'overview';
  if (newTab !== currentTab) {
    const query = { ...route.query };
    if (newTab === 'overview') {
      delete query.tab;
    } else {
      query.tab = newTab;
    }
    if (router.replace) {
      Promise.resolve(router.replace({ query })).catch(() => { });
    }
  }
});

watch(
  () => route.query?.tab,
  (newQueryTab) => {
    const targetTab =
      newQueryTab && VALID_TABS.includes(newQueryTab as TabType)
        ? (newQueryTab as TabType)
        : 'overview';
    if (activeTab.value !== targetTab) {
      activeTab.value = targetTab;
    }
  }
);

// --- Trailers ---
const displayTrailers = computed(() => {
  if (!movie.value) return [];
  const trailers = [];
  if (movie.value.trailer_url) {
    trailers.push({
      id: 1,
      title: `${movie.value.title} Official Trailer`,
      type: 'Trailer',
      url: movie.value.trailer_url,
      thumbnail_url:
        movie.value.backdrop_url ||
        movie.value.poster_url ||
        ''
    });
  }
  return trailers;
});

const watchlistItem = computed<WatchlistItemWithMovie | undefined>(() => {
  if (!movie.value) return undefined;
  const item = watchlistStore.getItemByMovieId(movie.value.id);
  return item && 'movie' in item ? (item as WatchlistItemWithMovie) : undefined;
});

const isInWatchlist = computed(() => !!watchlistItem.value);

const hasRatings = computed(() => {
  if (!movie.value) return false;
  return (
    movie.value.rating_imdb != null ||
    movie.value.rating_rt != null ||
    movie.value.rating_metacritic != null
  );
});

const sortedCast = computed(() => {
  if (!movie.value) return [];
  return [...movie.value.cast].sort((a, b) => a.display_order - b.display_order);
});

function getInitials(name: string) {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function playVideo(url: string) {
  activeVideoUrl.value = url;
  showTrailer.value = true;
}

const embedUrl = computed(() => {
  if (!activeVideoUrl.value) return '';
  const url = activeVideoUrl.value;
  let videoId = '';
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0] ?? '';
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] ?? '';
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
});

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ');
}

function prettyWatchlistStatus(status?: WatchlistStatus) {
  if (!status) return '';
  switch (status) {
    case 'want_to_watch':
      return 'Want to watch';
    case 'watching':
      return 'Watching';
    case 'watched':
      return 'Watched';
  }
}

function formatMoney(value: number) {
  if (value === 0) return 'Unknown';
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

async function loadMovie() {
  loading.value = true;
  error.value = null;
  try {
    const uuid = route.params.uuid as string;
    if (!uuid) throw new Error('Invalid movie ID');
    movie.value = await moviesStore.fetchMovieById(uuid);

    // Fetch similar movies in parallel without blocking main load
    moviesStore
      .fetchSimilarMovies(uuid)
      .then((similar) => {
        similarMovies.value = similar || [];
      })
      .catch(console.error);

    if (authStore.isAuthenticated && !watchlistStore.items.length) {
      await watchlistStore.fetchWatchlist();
    }
  } catch (err: unknown) {
    error.value = getErrorMessage(err, 'Failed to load movie');
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.params.uuid,
  (newUuid, oldUuid) => {
    if (
      newUuid &&
      newUuid !== oldUuid &&
      (route.name === 'movie-detail' || route.name === 'movie-details')
    ) {
      const container = document.querySelector('.hide-scrollbar');
      if (container) container.scrollTop = 0;
      activeTab.value = getInitialTab();
      loadMovie();
    }
  }
);

async function addToWatchlist() {
  if (!movie.value) return;
  try {
    await watchlistStore.addMovieToWatchlist(movie.value.id, 'want_to_watch');
    showToast('success', 'Added', 'Movie added to watchlist');
  } catch (err: unknown) {
    showToast('error', 'Error', getErrorMessage(err, 'Failed to add movie'));
  }
}

async function removeFromWatchlist() {
  if (!watchlistItem.value) return;
  try {
    await watchlistStore.removeFromWatchlist(watchlistItem.value.id);
    watchlistMenuOpen.value = false;
    showToast('success', 'Removed', 'Movie removed from watchlist');
  } catch (err: unknown) {
    showToast('error', 'Error', getErrorMessage(err, 'Failed to remove movie'));
  }
}

async function updateStatus(status: WatchlistStatus) {
  if (!watchlistItem.value) return;
  try {
    await watchlistStore.updateStatus(watchlistItem.value.id, status);
    watchlistMenuOpen.value = false;
    showToast('success', 'Updated', 'Watchlist status updated');
  } catch (err: unknown) {
    showToast('error', 'Error', getErrorMessage(err, 'Failed to update status'));
  }
}

async function confirmDelete() {
  if (!movie.value) return;
  const ok = window.confirm(`Delete "${movie.value.title}"?`);
  if (!ok) return;
  try {
    await moviesStore.deleteMovie(movie.value.uuid);
    showToast('success', 'Deleted', 'Movie deleted successfully');
    router.push('/movies');
  } catch (err: unknown) {
    showToast('error', 'Error', getErrorMessage(err, 'Failed to delete movie'));
  }
}

async function blockMovie() {
  if (!movie.value) return;
  try {
    const uuid = movie.value.uuid;
    await preferencesStore.blockMovie(uuid);
    moviesStore.removeMovieLocally(uuid);
    showToast('success', 'Blocked', 'Movie will no longer be shown');
    router.push('/');
  } catch (err: unknown) {
    showToast('error', 'Error', getErrorMessage(err, 'Failed to block movie'));
  }
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (
    watchlistMenuOpen.value &&
    watchlistDropdownRef.value &&
    !watchlistDropdownRef.value.contains(event.target as Node)
  ) {
    watchlistMenuOpen.value = false;
  }
  if (
    moreOptionsOpen.value &&
    moreOptionsRef.value &&
    !moreOptionsRef.value.contains(event.target as Node)
  ) {
    moreOptionsOpen.value = false;
  }
}

onMounted(() => {
  loadMovie();
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
