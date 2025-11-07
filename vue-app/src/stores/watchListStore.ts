// stores/watchlistStore.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
// import { useMainStore } from './mainStore'
import apiClient from '@/services/apiInterceptors'
import type { WatchlistItemWithMovie, WatchlistStatus, AddToWatchlistRequest } from '@/types/movies'

export const useWatchlistStore = defineStore('watchlistStore', () => {
  // const mainStore = useMainStore()

  const items = ref<WatchlistItemWithMovie[]>([])
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
      {} as Record<WatchlistStatus, WatchlistItemWithMovie[]>,
    )
  })

  const wantToWatch = computed(() => itemsByStatus.value.want_to_watch || [])
  const watching = computed(() => itemsByStatus.value.watching || [])
  const watched = computed(() => itemsByStatus.value.watched || [])

  const movieIdsInWatchlist = computed(() => {
    return new Set(items.value.map((item) => item.movie_id))
  })

  const isInWatchlist = (movieId: number): boolean => {
    return movieIdsInWatchlist.value.has(movieId)
  }

  const getItemByMovieId = (movieId: number): WatchlistItemWithMovie | undefined => {
    return items.value.find((item) => item.movie_id === movieId)
  }

  const fetchWatchlist = async (status?: WatchlistStatus) => {
    loading.value = true
    error.value = null
    try {
      const url = status ? `/watchlist?status=${status}` : '/watchlist'
      const response = await apiClient.get(url)
      const data = response.data
      items.value = data.items || []
      return data.items
    } catch (err: any) {
      console.error('Error fetching watchlist:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const addToWatchlist = async (movieId: number, status: WatchlistStatus = 'want_to_watch') => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.post('/watchlist', {
        movie_id: movieId,
        status,
      } as AddToWatchlistRequest)
      const data = response.data
      items.value.unshift(data.item)
      return data.item
    } catch (err: any) {
      console.error('Error adding to watchlist:', err)
      error.value = err.message
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
      const updatedItem = data.item as WatchlistItemWithMovie
      const idx = items.value.findIndex((i) => i.id === itemId)
      if (idx !== -1) {
        items.value[idx] = updatedItem
      }
      return updatedItem
    } catch (err: any) {
      console.error('Error updating watchlist:', err)
      error.value = err.message
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
    } catch (err: any) {
      console.error('Error removing from watchlist:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const checkMovieStatus = async (movieId: number) => {
    try {
      const response = await apiClient.get(`/watchlist/movie/${movieId}`)
      const data = response.data
      return {
        inWatchlist: data.inWatchlist,
        item: data.item as WatchlistItemWithMovie | null,
      }
    } catch (err: any) {
      console.error('Error checking watchlist status:', err)
      return { inWatchlist: false, item: null }
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
    isInWatchlist,
    getItemByMovieId,
    fetchWatchlist,
    addToWatchlist,
    updateStatus,
    removeFromWatchlist,
    checkMovieStatus,
  }
})
