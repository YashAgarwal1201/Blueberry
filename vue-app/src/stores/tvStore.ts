import { ref } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/services/apiInterceptors'
import type { TVShowCard, TVShowWithDetails } from "shared-types"
import { getErrorMessage } from '@/services/errorUtils'

export const useTvStore = defineStore('tvStore', () => {
  const recentShows = ref<TVShowCard[]>([])
  const topRatedShows = ref<TVShowCard[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchRecentShows = async () => {
    loading.value = true
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
      loading.value = false
    }
  }

  const fetchTopRatedShows = async () => {
    loading.value = true
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
      loading.value = false
    }
  }

  const fetchShowById = async (uuid: string) => {
    loading.value = true
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
      loading.value = false
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
    loading.value = true
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
      loading.value = false
    }
  }

  const removeShowLocally = (uuid: string) => {
    recentShows.value = recentShows.value.filter(s => s.uuid !== uuid)
    topRatedShows.value = topRatedShows.value.filter(s => s.uuid !== uuid)
  }

  return {
    recentShows,
    topRatedShows,
    loading,
    error,
    fetchRecentShows,
    fetchTopRatedShows,
    fetchShowById,
    fetchSimilarShows,
    fetchSeasonEpisodes,
    removeShowLocally,
  }
})
