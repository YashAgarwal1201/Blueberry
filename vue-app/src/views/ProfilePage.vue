<template>
  <div class="w-full h-full flex flex-col gap-y-8 pb-10">
    <!-- If not logged in -->
    <div v-if="!authStore.isAuthenticated"
      class="grow flex flex-col items-center justify-center p-8 text-center bg-surface-1 rounded-xl border border-border">
      <UserCircle :size="48" class="text-text-muted mb-4" />
      <h2 class="text-xl font-semibold mb-2">Not Logged In</h2>
      <p class="text-text-muted mb-6">Sign in to sync your watchlist and manage your profile across devices.</p>
      <RouterLink to="/login"
        class="px-6 py-2.5 bg-primary text-on-primary rounded-full font-medium transition-colors hover:bg-primary/90 active:scale-95">
        Sign In / Register
      </RouterLink>
    </div>

    <!-- If logged in -->
    <div v-else class="flex flex-col gap-8">
      <!-- Profile Hero -->
      <div class="relative w-full rounded-2xl overflow-hidden bg-surface-1 border border-border shadow-sm">
        <!-- Banner -->
        <div class="h-32 sm:h-40 w-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 relative">
          <!-- Sign Out Button -->
          <button @click="handleSignOut"
            class="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-all active:scale-95">
            <LogOut :size="16" />
            <span class="text-sm font-semibold hidden sm:inline">Sign Out</span>
          </button>
        </div>

        <!-- Content -->
        <div class="px-6 sm:px-8 pb-8 relative">
          <!-- Avatar -->
          <div class="w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-full bg-surface-1 p-1.5 shadow-xl mx-auto sm:mx-0 -mt-12 sm:-mt-16 relative z-10">
            <div class="w-full h-full rounded-full bg-primary flex items-center justify-center text-on-primary text-4xl sm:text-5xl font-bold uppercase">
              {{ userInitials }}
            </div>
          </div>
          
          <div class="mt-4 flex flex-col sm:flex-row justify-between gap-6 sm:gap-4">
            <!-- User Info -->
            <div class="flex flex-col items-center sm:items-start text-center sm:text-left flex-grow">
              <h1 class="text-2xl sm:text-3xl font-bold text-text font-heading">{{ authStore.user?.name || 'User' }}</h1>
              <p class="text-text-muted font-medium mt-1">{{ authStore.user?.email }}</p>
              <div class="mt-3 text-xs font-bold bg-surface-3 text-text px-3 py-1 rounded-md uppercase tracking-wider">
                {{ authStore.user?.role || 'User' }}
              </div>
            </div>

            <!-- Stats -->
            <div class="flex gap-4 sm:gap-6 justify-center sm:justify-end bg-surface-2/40 sm:bg-transparent rounded-xl p-4 sm:p-0">
              <div class="flex flex-col items-center text-center px-2 sm:px-0">
                <span class="text-xl sm:text-2xl font-bold text-text font-heading">{{ watchlistStore.wantToWatch.length }}</span>
                <span class="text-[10px] sm:text-xs text-text-muted uppercase font-semibold">Plan to Watch</span>
              </div>
              <div class="w-px bg-border hidden sm:block my-2"></div>
              <div class="flex flex-col items-center text-center px-2 sm:px-0">
                <span class="text-xl sm:text-2xl font-bold text-text font-heading">{{ watchlistStore.watching.length }}</span>
                <span class="text-[10px] sm:text-xs text-text-muted uppercase font-semibold">Watching</span>
              </div>
              <div class="w-px bg-border hidden sm:block my-2"></div>
              <div class="flex flex-col items-center text-center px-2 sm:px-0">
                <span class="text-xl sm:text-2xl font-bold text-text font-heading">{{ watchlistStore.watched.length }}</span>
                <span class="text-[10px] sm:text-xs text-text-muted uppercase font-semibold">Watched</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Watchlist Section -->
      <div class="flex flex-col gap-6">
        <div class="flex items-center gap-6 border-b border-border overflow-x-auto hide-scrollbar">
          <button @click="activeTab = 'want_to_watch'" 
            :class="activeTab === 'want_to_watch' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'" 
            class="pb-3 border-b-2 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap">
            <Bookmark :size="18" />
            Plan to Watch
          </button>
          <button @click="activeTab = 'watching'" 
            :class="activeTab === 'watching' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'" 
            class="pb-3 border-b-2 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap">
            <PlayCircle :size="18" />
            Watching
          </button>
          <button @click="activeTab = 'watched'" 
            :class="activeTab === 'watched' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'" 
            class="pb-3 border-b-2 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap">
            <CheckCircle :size="18" />
            Watched
          </button>
          
          <div class="w-px h-6 bg-border mx-2"></div>
          
          <button @click="activeTab = 'collections'" 
            :class="activeTab === 'collections' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'" 
            class="pb-3 border-b-2 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap">
            <Folder :size="18" />
            My Collections
          </button>
        </div>

        <div v-if="watchlistStore.loading" class="flex justify-center py-10">
          <div class="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>

        <div v-else-if="activeTab === 'collections'" class="w-full">
          <CollectionsList />
        </div>
        
        <div v-else-if="currentWatchlist.length === 0" class="flex flex-col items-center justify-center py-16 text-center bg-surface-1/50 rounded-2xl border border-dashed border-border">
          <Bookmark v-if="activeTab === 'want_to_watch'" :size="48" class="text-surface-3 mb-4" />
          <PlayCircle v-else-if="activeTab === 'watching'" :size="48" class="text-surface-3 mb-4" />
          <CheckCircle v-else :size="48" class="text-surface-3 mb-4" />
          <h3 class="text-lg font-semibold text-text mb-2">Nothing here yet</h3>
          <p class="text-text-muted max-w-sm">
            {{ activeTab === 'want_to_watch' ? 'Start exploring and add movies to your watchlist to keep track of what you want to see.' : activeTab === 'watching' ? 'You are not watching anything right now.' : 'Mark movies as watched to build your personal library of seen content.' }}
          </p>
          <RouterLink to="/movies" class="mt-6 px-6 py-2.5 bg-surface-2 hover:bg-surface-3 text-text rounded-full font-medium transition-all active:scale-95">
            Explore Movies
          </RouterLink>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          <MediaCard 
            v-for="item in currentWatchlist" 
            :key="item.id" 
            :title="getMedia(item).title"
            :posterUrl="getMedia(item).poster_url"
            :year="getMedia(item).release_year"
            :type="getMedia(item).type"
            fluid
            @click="router.push(`/${getMedia(item).type === 'movie' ? 'movies' : 'tv'}/${getMedia(item).uuid}`)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useWatchlistStore } from '@/stores/watchListStore'
import { authClient } from '@/lib/auth-client'
import { UserCircle, LogOut, Bookmark, CheckCircle, PlayCircle, Folder } from 'lucide-vue-next'
import MediaCard from '@/components/MediaCard.vue'
import CollectionsList from '@/components/CollectionsList.vue'
import type { MediaCard as MediaCardType, WatchlistPopulatedItem } from 'shared-types'

const authStore = useAuthStore()
const watchlistStore = useWatchlistStore()
const router = useRouter()

const activeTab = ref<'want_to_watch' | 'watching' | 'watched' | 'collections'>('want_to_watch')

const currentWatchlist = computed(() => {
  if (activeTab.value === 'want_to_watch') return watchlistStore.wantToWatch
  if (activeTab.value === 'watching') return watchlistStore.watching
  return watchlistStore.watched
})

const userInitials = computed(() => {
  const name = (authStore.user?.name as string) || (authStore.user?.email as string) || 'U'
  return name.charAt(0).toUpperCase()
})

const getMedia = (item: WatchlistPopulatedItem): MediaCardType => {
  return 'movie' in item ? item.movie : item.show;
}

const handleSignOut = async () => {
  await authClient.signOut()
  router.push('/')
}

onMounted(() => {
  if (authStore.isAuthenticated && watchlistStore.items.length === 0) {
    watchlistStore.fetchWatchlist()
  }
})
</script>
