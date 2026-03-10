<template>
  <div
    class="w-full h-full p-2 sm:p-3 flex flex-col gap-y-6 md:gap-y-8 border border-border rounded-xl"
  >
    <div>
      <h1 class="font-heading text-2xl sm:text-3xl text-text">Your Watchlist</h1>
      <p class="font-content text-text-muted">Manage your movie watchlist</p>
    </div>

    <div v-if="watchlistStore.loading" class="text-text-muted">Loading watchlist...</div>
    <div v-else class="flex flex-col gap-y-6 overflow-y-auto">
      <!-- Want to Watch -->
      <Panel class="bg-transparent rounded-2xl! dark:border-transparent!" toggleable>
        <template #header>
          <div class="w-full">
            <span class="text-lg font-semibold text-primary mr-1">
              {{ watchlistStore.wantToWatch.length }} movies
            </span>
            <span class="text-lg font-heading font-semibold">in the queue</span>
          </div>
        </template>

        <div v-if="watchlistStore.wantToWatch.length === 0" class="text-text-muted text-sm">
          No movies in this category
        </div>

        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div
            v-for="item in watchlistStore.wantToWatch"
            :key="item.id"
            class="rounded-xl bg-surface-2 p-3 flex flex-col gap-2"
          >
            <div
              v-if="item.movie.poster_url"
              class="w-full aspect-[2/3] rounded-lg bg-surface-3"
              :style="{ backgroundImage: `url(${item.movie.poster_url})`, backgroundSize: 'cover' }"
            />
            <div
              v-else
              class="w-full aspect-[2/3] rounded-lg bg-surface-3 flex items-center justify-center text-text-muted"
            >
              No Poster
            </div>

            <div class="text-sm font-medium text-text line-clamp-2">
              {{ item.movie.title }}
            </div>
            <div class="text-xs text-text-muted">
              {{ item.movie.release_year || 'N/A' }}
            </div>

            <div class="flex flex-wrap gap-2 mt-auto">
              <button
                @click="updateStatus(item.id, 'watching')"
                class="grow px-2 py-1 text-xs rounded bg-primary text-on-primary"
              >
                Start Watching
              </button>
              <button
                @click="removeItem(item.id)"
                class="grow px-2 py-1 text-xs rounded bg-red-500 text-white"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </Panel>

      <!-- Currently Watching -->
      <Panel class="bg-transparent rounded-2xl! dark:border-transparent!" toggleable>
        <template #header>
          <div class="w-full">
            <span class="text-lg font-semibold mr-1">Hooked on</span
            ><span class="text-lg font-semibold text-primary mr-1">
              {{ watchlistStore.watching.length }}</span
            ><span class="text-lg font-semibold">right now</span>
          </div>
        </template>

        <div v-if="watchlistStore.watching.length === 0" class="text-text-muted text-sm">
          No movies in this category
        </div>

        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div
            v-for="item in watchlistStore.watching"
            :key="item.id"
            class="rounded-xl bg-surface-2 p-3 flex flex-col gap-2"
          >
            <div
              v-if="item.movie.poster_url"
              class="w-full aspect-[2/3] rounded-lg bg-surface-3"
              :style="{ backgroundImage: `url(${item.movie.poster_url})`, backgroundSize: 'cover' }"
            />
            <div
              v-else
              class="w-full aspect-[2/3] rounded-lg bg-surface-3 flex items-center justify-center text-text-muted"
            >
              No Poster
            </div>

            <div class="text-sm font-medium text-text line-clamp-2">
              {{ item.movie.title }}
            </div>
            <div class="text-xs text-text-muted">
              {{ item.movie.release_year || 'N/A' }}
            </div>

            <div class="flex flex-wrap gap-2 mt-auto">
              <button
                @click="updateStatus(item.id, 'watched')"
                class="grow px-2 py-1 text-xs rounded bg-green-600 text-white"
              >
                Mark Watched
              </button>
              <button
                @click="removeItem(item.id)"
                class="grow px-2 py-1 text-xs rounded bg-red-500 text-white"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </Panel>

      <!-- Watched -->
      <Panel class="bg-transparent rounded-2xl! dark:border-transparent!" toggleable>
        <template #header>
          <div class="w-full">
            <span class="text-lg font-heading font-semibold mr-1">Crushed</span>
            <span class="text-lg text-primary font-semibold mr-1">
              {{ watchlistStore.watched.length }} movies </span
            ><span class="text-lg font-heading font-semibold">so far</span>
          </div>
        </template>

        <div v-if="watchlistStore.watched.length === 0" class="text-text-muted text-sm">
          No movies in this category
        </div>

        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div
            v-for="item in watchlistStore.watched"
            :key="item.id"
            class="rounded-xl bg-surface-2 p-3 flex flex-col gap-2"
          >
            <div
              v-if="item.movie.poster_url"
              class="w-full aspect-[2/3] rounded-lg bg-surface-3"
              :style="{ backgroundImage: `url(${item.movie.poster_url})`, backgroundSize: 'cover' }"
            />
            <div
              v-else
              class="w-full aspect-[2/3] rounded-lg bg-surface-3 flex items-center justify-center text-text-muted"
            >
              No Poster
            </div>

            <div class="text-sm font-medium text-text line-clamp-2">
              {{ item.movie.title }}
            </div>

            <div class="text-xs text-text-muted">
              Watched:
              {{ new Date(item.watched_at || item.added_at).toLocaleDateString() }}
            </div>

            <button
              @click="removeItem(item.id)"
              class="px-2 py-1 text-xs rounded bg-red-500 text-white mt-auto"
            >
              Remove
            </button>
          </div>
        </div>
      </Panel>
    </div>
  </div>
</template>

<!-- script unchanged -->
<script lang="ts" setup>
import { onMounted } from 'vue'
import { useMainStore } from '@/stores/mainStore'
import type { WatchlistStatus } from '@/types/movies'
import { useWatchlistStore } from '@/stores/watchListStore'
import { Panel } from 'primevue'

const watchlistStore = useWatchlistStore()
const mainStore = useMainStore()

onMounted(async () => {
  if (mainStore.backend.url) await watchlistStore.fetchWatchlist()
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
