// stores/watchlistStore.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/services/apiInterceptors'
import type { WatchlistPopulatedItem, WatchlistStatus, AddToWatchlistRequest, WatchlistItemWithMovie, WatchlistItemWithShow } from "shared-types"
import { getErrorMessage } from '@/services/errorUtils'

export const useWatchlistStore = defineStore('watchlistStore', () => {

  const items = ref<WatchlistPopulatedItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const itemsByStatus = computed(() => {
    return items.value.reduce(
      (acc, item) => {
        if (!acc[item.status]) {
          acc[item.status] = []
        }
        acc[item.status].push(item)
        return acc
      },
      {} as Record<WatchlistStatus, WatchlistPopulatedItem[]>,
    )
  })

  const wantToWatch = computed(() => itemsByStatus.value.want_to_watch || [])
  const watching = computed(() => itemsByStatus.value.watching || [])
  const watched = computed(() => itemsByStatus.value.watched || [])

  // Derived getters for Continue Watching
  const watchingMovies = computed(() => watching.value.filter(item => 'movie' in item).map(item => (item as WatchlistItemWithMovie).movie))
  const watchingShows = computed(() => watching.value.filter(item => 'show' in item).map(item => (item as WatchlistItemWithShow).show))
  const watchingMedia = computed(() => {
    return watching.value.map(item => {
      if ('movie' in item) return item.movie;
      if ('show' in item) return item.show;
    }).filter(Boolean);
  })

  const movieIdsInWatchlist = computed(() => {
    return new Set(items.value.map((item) => item.movie_id).filter(Boolean))
  })

  const showIdsInWatchlist = computed(() => {
    return new Set(items.value.map((item) => item.show_id).filter(Boolean))
  })

  const isMovieInWatchlist = (movieId: number): boolean => {
    return movieIdsInWatchlist.value.has(movieId)
  }

  const isShowInWatchlist = (showId: number): boolean => {
    return showIdsInWatchlist.value.has(showId)
  }

  const getItemByMovieId = (movieId: number): WatchlistPopulatedItem | undefined => {
    return items.value.find((item) => item.movie_id === movieId)
  }

  const getItemByShowId = (showId: number): WatchlistPopulatedItem | undefined => {
    return items.value.find((item) => item.show_id === showId)
  }

  const fetchWatchlist = async (status?: WatchlistStatus) => {
    loading.value = true
    error.value = null
    try {
      const url = status ? `/watchlist?status=${status}` : '/watchlist'
      const response = await apiClient.get(url)
      const data = response.data
      items.value = data.data.items || []
      return data.data.items
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error fetching watchlist')
      console.error('Error fetching watchlist:', err)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const addMovieToWatchlist = async (movieId: number, status: WatchlistStatus = 'want_to_watch') => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.post('/watchlist', {
        movie_id: movieId,
        status,
      } as AddToWatchlistRequest)
      const data = response.data
      items.value.unshift(data.data)
      return data.data
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error adding to watchlist')
      console.error('Error adding to watchlist:', err)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const addShowToWatchlist = async (showId: number, status: WatchlistStatus = 'want_to_watch') => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.post('/watchlist', {
        show_id: showId,
        status,
      } as AddToWatchlistRequest)
      const data = response.data
      items.value.unshift(data.data)
      return data.data
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error adding to watchlist')
      console.error('Error adding to watchlist:', err)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateStatus = async (itemId: number, status: WatchlistStatus) => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.patch(`/watchlist/${itemId}`, { status })
      const data = response.data
      const updatedItem = data.data as WatchlistPopulatedItem
      const idx = items.value.findIndex((i) => i.id === itemId)
      if (idx !== -1) {
        items.value[idx] = updatedItem
      }
      return updatedItem
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error updating watchlist')
      console.error('Error updating watchlist:', err)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeFromWatchlist = async (itemId: number) => {
    loading.value = true
    error.value = null
    try {
      await apiClient.delete(`/watchlist/${itemId}`)
      items.value = items.value.filter((i) => i.id !== itemId)
      return true
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error removing from watchlist')
      console.error('Error removing from watchlist:', err)
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    loading,
    error,
    itemsByStatus,
    wantToWatch,
    watching,
    watched,
    watchingMovies,
    watchingShows,
    watchingMedia,
    isMovieInWatchlist,
    isShowInWatchlist,
    getItemByMovieId,
    getItemByShowId,
    fetchWatchlist,
    addMovieToWatchlist,
    addShowToWatchlist,
    updateStatus,
    removeFromWatchlist,
  }
})
