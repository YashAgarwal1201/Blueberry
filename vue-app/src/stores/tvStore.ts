import { ref } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/services/apiInterceptors'
import type { TVShowCard, TVShowWithDetails } from "shared-types"
import { getErrorMessage } from '@/services/errorUtils'

export const useTvStore = defineStore('tvStore', () => {
  const recentShows = ref<TVShowCard[]>([])
  const topRatedShows = ref<TVShowCard[]>([])
  const hotShows = ref<TVShowCard[]>([])
  const trendingShows = ref<TVShowCard[]>([])
  const popularShows = ref<TVShowCard[]>([])
  const completedShows = ref<TVShowCard[]>([])
  const loading = ref(false)
  const loadingRecent = ref(false)
  const loadingTopRated = ref(false)
  const loadingHot = ref(false)
  const loadingTrending = ref(false)
  const loadingPopular = ref(false)
  const loadingCompleted = ref(false)
  const loadingShowById = ref(false)
  const loadingEpisodes = ref(false)
  const error = ref<string | null>(null)

  const syncLoading = () => {
    loading.value =
      loadingRecent.value ||
      loadingTopRated.value ||
      loadingHot.value ||
      loadingTrending.value ||
      loadingPopular.value ||
      loadingCompleted.value ||
      loadingShowById.value ||
      loadingEpisodes.value
  }

  const fetchRecentShows = async () => {
    loadingRecent.value = true
    syncLoading()
    error.value = null
    try {
      const response = await apiClient.get('tv/recent')
      recentShows.value = response.data.data as TVShowCard[]
      return recentShows.value
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error fetching recent tv shows')
      console.error('Error fetching recent tv shows:', err)
      error.value = message
      throw err
    } finally {
      loadingRecent.value = false
      syncLoading()
    }
  }

  const fetchTopRatedShows = async () => {
    loadingTopRated.value = true
    syncLoading()
    error.value = null
    try {
      const response = await apiClient.get('tv/top-rated')
      topRatedShows.value = response.data.data as TVShowCard[]
      return topRatedShows.value
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error fetching top rated tv shows')
      console.error('Error fetching top rated tv shows:', err)
      error.value = message
      throw err
    } finally {
      loadingTopRated.value = false
      syncLoading()
    }
  }

  const fetchHotShows = async () => {
    loadingHot.value = true
    syncLoading()
    try {
      const response = await apiClient.get('tv/hot')
      hotShows.value = response.data.data as TVShowCard[]
      return hotShows.value
    } catch (err: unknown) {
      console.error('Error fetching hot tv shows:', err)
      throw err
    } finally {
      loadingHot.value = false
      syncLoading()
    }
  }

  const fetchTrendingShows = async (limit = 20) => {
    loadingTrending.value = true
    syncLoading()
    error.value = null
    try {
      const response = await apiClient.get(`tv/trending?limit=${limit}`)
      trendingShows.value = response.data.data as TVShowCard[]
      return trendingShows.value
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error fetching trending tv shows')
      console.error('Error fetching trending tv shows:', err)
      error.value = message
      throw err
    } finally {
      loadingTrending.value = false
      syncLoading()
    }
  }

  const fetchPopularShows = async (limit = 20) => {
    loadingPopular.value = true
    syncLoading()
    error.value = null
    try {
      const response = await apiClient.get(`tv/popular?limit=${limit}`)
      popularShows.value = response.data.data as TVShowCard[]
      return popularShows.value
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error fetching popular tv shows')
      console.error('Error fetching popular tv shows:', err)
      error.value = message
      throw err
    } finally {
      loadingPopular.value = false
      syncLoading()
    }
  }

  const fetchCompletedShows = async () => {
    loadingCompleted.value = true
    syncLoading()
    try {
      const response = await apiClient.get('tv/completed')
      completedShows.value = response.data.data as TVShowCard[]
      return completedShows.value
    } catch (err: unknown) {
      console.error('Error fetching completed tv shows:', err)
      throw err
    } finally {
      loadingCompleted.value = false
      syncLoading()
    }
  }

  const fetchShowById = async (uuid: string) => {
    loadingShowById.value = true
    syncLoading()
    error.value = null
    try {
      const response = await apiClient.get(`tv/${uuid}`)
      return response.data.data as TVShowWithDetails
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error fetching tv show')
      console.error('Error fetching tv show:', err)
      error.value = message
      throw err
    } finally {
      loadingShowById.value = false
      syncLoading()
    }
  }

  const fetchSimilarShows = async (uuid: string) => {
    try {
      const response = await apiClient.get(`tv/${uuid}/similar`)
      return response.data.data as TVShowCard[]
    } catch (err: unknown) {
      console.error('Error fetching similar shows:', err)
      throw err
    }
  }

  const fetchSeasonEpisodes = async (uuid: string, seasonId: number) => {
    loadingEpisodes.value = true
    syncLoading()
    error.value = null
    try {
      const response = await apiClient.get(`tv/${uuid}/seasons/${seasonId}/episodes`)
      return response.data.data // Returns an array of episodes
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error fetching season episodes')
      console.error('Error fetching season episodes:', err)
      error.value = message
      throw err
    } finally {
      loadingEpisodes.value = false
      syncLoading()
    }
  }

  const removeShowLocally = (uuid: string) => {
    recentShows.value = recentShows.value.filter(s => s.uuid !== uuid)
    topRatedShows.value = topRatedShows.value.filter(s => s.uuid !== uuid)
    hotShows.value = hotShows.value.filter(s => s.uuid !== uuid)
    trendingShows.value = trendingShows.value.filter(s => s.uuid !== uuid)
    popularShows.value = popularShows.value.filter(s => s.uuid !== uuid)
  }

  return {
    recentShows,
    topRatedShows,
    hotShows,
    trendingShows,
    popularShows,
    completedShows,
    loading,
    loadingRecent,
    loadingTopRated,
    loadingHot,
    loadingTrending,
    loadingPopular,
    loadingCompleted,
    loadingShowById,
    loadingEpisodes,
    error,
    fetchRecentShows,
    fetchTopRatedShows,
    fetchHotShows,
    fetchTrendingShows,
    fetchPopularShows,
    fetchCompletedShows,
    fetchShowById,
    fetchSimilarShows,
    fetchSeasonEpisodes,
    removeShowLocally,
  }
})
