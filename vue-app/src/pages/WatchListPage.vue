<template>
  <div
    class="w-full h-full p-2 sm:p-3 flex flex-col gap-y-6 md:gap-y-8 border border-slate-200 dark:border-slate-700 rounded-xl"
  >
    <div>
      <h1 class="font-heading text-2xl sm:text-3xl text-slate-900 dark:text-slate-100">
        Your Watchlist
      </h1>
      <p class="font-content text-slate-600 dark:text-slate-400">Manage your movie watchlist</p>
    </div>

    <div v-if="watchlistStore.loading" class="text-slate-500">Loading watchlist...</div>
    <div v-else class="flex flex-col gap-y-6 overflow-y-auto">
      <!-- Want to Watch -->
      <div>
        <h3 class="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">
          Want to Watch ({{ watchlistStore.wantToWatch.length }})
        </h3>
        <div v-if="watchlistStore.wantToWatch.length === 0" class="text-slate-500 text-sm">
          No movies in this category
        </div>
        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div
            v-for="item in watchlistStore.wantToWatch"
            :key="item.id"
            class="rounded-xl bg-blue-50 dark:bg-slate-800 p-3 flex flex-col gap-2"
          >
            <div
              v-if="item.movie.poster_url"
              class="w-full aspect-[2/3] rounded-lg bg-slate-200 dark:bg-slate-700"
              :style="{ backgroundImage: `url(${item.movie.poster_url})`, backgroundSize: 'cover' }"
            ></div>
            <div
              v-else
              class="w-full aspect-[2/3] rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400"
            >
              No Poster
            </div>

            <div class="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
              {{ item.movie.title }}
            </div>
            <div class="text-xs text-slate-500">{{ item.movie.release_year || 'N/A' }}</div>

            <div class="flex gap-2 mt-auto">
              <button
                @click="updateStatus(item.id, 'watching')"
                class="flex-1 px-2 py-1 text-xs rounded bg-indigo-600 text-white"
              >
                Start Watching
              </button>
              <button
                @click="removeItem(item.id)"
                class="px-2 py-1 text-xs rounded bg-red-500 text-white"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Currently Watching -->
      <div>
        <h3 class="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">
          Currently Watching ({{ watchlistStore.watching.length }})
        </h3>
        <div v-if="watchlistStore.watching.length === 0" class="text-slate-500 text-sm">
          No movies in this category
        </div>
        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div
            v-for="item in watchlistStore.watching"
            :key="item.id"
            class="rounded-xl bg-blue-50 dark:bg-slate-800 p-3 flex flex-col gap-2"
          >
            <div
              v-if="item.movie.poster_url"
              class="w-full aspect-[2/3] rounded-lg bg-slate-200 dark:bg-slate-700"
              :style="{ backgroundImage: `url(${item.movie.poster_url})`, backgroundSize: 'cover' }"
            ></div>
            <div
              v-else
              class="w-full aspect-[2/3] rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400"
            >
              No Poster
            </div>

            <div class="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
              {{ item.movie.title }}
            </div>
            <div class="text-xs text-slate-500">{{ item.movie.release_year || 'N/A' }}</div>

            <div class="flex gap-2 mt-auto">
              <button
                @click="updateStatus(item.id, 'watched')"
                class="flex-1 px-2 py-1 text-xs rounded bg-green-600 text-white"
              >
                Mark Watched
              </button>
              <button
                @click="removeItem(item.id)"
                class="px-2 py-1 text-xs rounded bg-red-500 text-white"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Watched -->
      <div>
        <h3 class="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">
          Watched ({{ watchlistStore.watched.length }})
        </h3>
        <div v-if="watchlistStore.watched.length === 0" class="text-slate-500 text-sm">
          No movies in this category
        </div>
        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div
            v-for="item in watchlistStore.watched"
            :key="item.id"
            class="rounded-xl bg-blue-50 dark:bg-slate-800 p-3 flex flex-col gap-2"
          >
            <div
              v-if="item.movie.poster_url"
              class="w-full aspect-[2/3] rounded-lg bg-slate-200 dark:bg-slate-700"
              :style="{ backgroundImage: `url(${item.movie.poster_url})`, backgroundSize: 'cover' }"
            ></div>
            <div
              v-else
              class="w-full aspect-[2/3] rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400"
            >
              No Poster
            </div>

            <div class="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
              {{ item.movie.title }}
            </div>
            <div class="text-xs text-slate-500">
              Watched: {{ new Date(item.watched_at || item.added_at).toLocaleDateString() }}
            </div>

            <button
              @click="removeItem(item.id)"
              class="px-2 py-1 text-xs rounded bg-red-500 text-white mt-auto"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
// import { useWatchlistStore } from '@/stores/watchlistStore'
import { useMainStore } from '@/stores/mainStore'
import type { WatchlistStatus } from '@/types/movies'
import { useWatchlistStore } from '@/stores/watchListStore'
// import type { WatchlistStatus } from '@/stores/watchlistStore'

const watchlistStore = useWatchlistStore()
const mainStore = useMainStore()

onMounted(async () => {
  if (mainStore.backend.url) {
    await watchlistStore.fetchWatchlist()
  }
})

async function updateStatus(itemId: number, status: WatchlistStatus) {
  try {
    await watchlistStore.updateStatus(itemId, status)
  } catch (err) {
    console.error('Error updating status:', err)
  }
}

async function removeItem(itemId: number) {
  try {
    await watchlistStore.removeFromWatchlist(itemId)
  } catch (err) {
    console.error('Error removing item:', err)
  }
}
</script>
