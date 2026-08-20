import { ref, computed } from 'vue'
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

  return {
    recentShows,
    topRatedShows,
    loading,
    error,
    fetchRecentShows,
    fetchTopRatedShows,
    fetchShowById,
  }
})
